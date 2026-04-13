const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);
const paypalSdk = require('@paypal/checkout-server-sdk');
const PaymentTransaction = require('../models/paymentTransaction');
const Payout = require('../models/payout');
const PaymentMethod = require('../models/paymentMethod');
const User = require('../models/user');
const Booking = require('../models/booking');
const NotificationService = require('./notification');
const EmailSender = require('./emailsender');

// PayPal Client Configuration
const paypalClient = new paypalSdk.core.PayPalHttpClient(
    process.env.NODE_ENV === 'production'
        ? new paypalSdk.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
        )
        : new paypalSdk.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
        )
);

/**
 * Payment Service
 *
 * Handles all payment operations including:
 * - Escrow payments (customer to Mosalapro)
 * - Payment holds and captures
 * - Refunds
 * - Payouts (Mosalapro to providers)
 * - Payment method management
 */
class PaymentService {
    constructor() {
        this.platformFeePercentage = 10; // 10% platform fee
    }

    /**
     * Create or retrieve Stripe customer
     */
    async getOrCreateStripeCustomer(user) {
        try {
            // Check if user already has Stripe customer ID
            if (user.stripeCustomerId) {
                try {
                    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
                    return customer;
                } catch (error) {
                    // Customer doesn't exist, create new one
                    console.log('Stripe customer not found, creating new one');
                }
            }

            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`.trim(),
                phone: user.phone,
                metadata: {
                    userId: user._id.toString(),
                    username: user.username
                }
            });

            // Update user with Stripe customer ID
            user.stripeCustomerId = customer.id;
            await user.save();

            return customer;
        } catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw new Error('Failed to create payment customer');
        }
    }

    /**
     * Create PayPal vault setup token for payment method tokenization
     */
    async createPayPalSetupToken(user) {
        try {
            const accessToken = await this.getPayPalAccessToken();

            const response = await fetch(
                `https://api-m${process.env.NODE_ENV === 'production' ? '' : '.sandbox'}.paypal.com/v3/vault/setup-tokens`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        payment_source: {
                            paypal: {
                                description: `Payment method for ${user.firstName} ${user.lastName}`,
                                usage_type: 'MERCHANT',
                                customer_type: 'CONSUMER',
                                permit_multiple_payment_tokens: false
                            }
                        }
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create PayPal setup token');
            }

            return result;
        } catch (error) {
            console.error('Error creating PayPal setup token:', error);
            throw error;
        }
    }

    /**
     * Save PayPal vault token after user approval
     */
    async savePayPalVaultToken(userId, vaultSetupToken, options = {}) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Get vault setup token details from PayPal
            const accessToken = await this.getPayPalAccessToken();

            const response = await fetch(
                `https://api-m${process.env.NODE_ENV === 'production' ? '' : '.sandbox'}.paypal.com/v3/vault/setup-tokens/${vaultSetupToken}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            const setupTokenDetails = await response.json();

            if (!response.ok) {
                throw new Error(setupTokenDetails.message || 'Failed to retrieve PayPal setup token details');
            }

            // Create payment token from setup token
            const createTokenResponse = await fetch(
                `https://api-m${process.env.NODE_ENV === 'production' ? '' : '.sandbox'}.paypal.com/v3/vault/payment-tokens`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        payment_source: {
                            token: {
                                id: vaultSetupToken,
                                type: 'SETUP_TOKEN'
                            }
                        }
                    })
                }
            );

            const paymentTokenResult = await createTokenResponse.json();

            if (!createTokenResponse.ok) {
                throw new Error(paymentTokenResult.message || 'Failed to create PayPal payment token');
            }

            // Extract customer info from payment token
            const paypalEmail = paymentTokenResult.customer?.email_address || setupTokenDetails.customer?.email_address;
            const paypalPayerId = paymentTokenResult.customer?.id || setupTokenDetails.customer?.id;

            // Create payment method record
            const paymentMethod = new PaymentMethod({
                userId,
                provider: 'paypal',
                type: 'paypal',
                paymentMethodId: paymentTokenResult.id,
                paypalPayerId: paypalPayerId,
                paypalEmail: paypalEmail,
                isDefault: true,
                isVerified: true,
                verifiedAt: new Date(),
                createdIpAddress: options.ipAddress,
                createdUserAgent: options.userAgent
            });

            await paymentMethod.save();

            return paymentMethod;

        } catch (error) {
            console.error('Error saving PayPal vault token:', error);
            throw error;
        }
    }

    /**
     * Save payment method (Stripe or PayPal)
     */
    async savePaymentMethod(userId, paymentMethodData) {
        try {
            const user = await User.findById(userId).exec();
            if (!user) {
                console.error('PAYMENT SERVICE:: User not found');
                throw new Error('User not found');
            }

            let paymentMethod;

            if (paymentMethodData.provider === 'stripe') {
                // Get or create Stripe customer
                const customer = await this.getOrCreateStripeCustomer(user);

                // First, retrieve payment method to verify it exists
                let stripePaymentMethod;
                try {

                    stripePaymentMethod = await stripe.paymentMethods.retrieve(
                        paymentMethodData.paymentMethodId
                    );
                } catch (error) {
                    console.error('Error retrieving Stripe payment method:', error);
                    console.error('Payment method ID:', paymentMethodData.paymentMethodId);
                    console.error('Error code:', error.code);
                    console.error('Error type:', error.type);

                    if (error.code === 'resource_missing') {
                        throw new Error('Payment method not found. This is likely because your Stripe publishable key and secret key are from different Stripe accounts. Please check your .env file and ensure STRIPE_PUBLISHABLE_KEY and STRIPE_SEC_KEY are from the same Stripe account.');
                    }
                    throw new Error(`Failed to retrieve payment method: ${error.message}`);
                }

                // // Check if payment method is already attached to this customer
                // if (stripePaymentMethod.customer && stripePaymentMethod.customer !== customer.id) {
                //     throw new Error('This payment method is already attached to another customer');
                // }

                // Attach payment method to customer if not already attached
                //if (!stripePaymentMethod.customer) {
                    try {
                        await stripe.paymentMethods.attach(paymentMethodData.paymentMethodId, {
                            customer: customer.id
                        });

                        // Retrieve again to get updated info with customer attached
                        stripePaymentMethod = await stripe.paymentMethods.retrieve(
                            paymentMethodData.paymentMethodId
                        );
                    } catch (error) {
                        console.error('Error attaching payment method to customer:', error);
                        throw new Error(`Failed to attach payment method: ${error.message}`);
                    }
                //}

                // Create payment method record
                paymentMethod = new PaymentMethod({
                    userId,
                    provider: 'stripe',
                    type: stripePaymentMethod.type,
                    paymentMethodId: stripePaymentMethod.id,
                    stripeCustomerId: customer.id,
                    cardLast4: stripePaymentMethod.card?.last4,
                    cardBrand: stripePaymentMethod.card?.brand,
                    cardExpiryMonth: stripePaymentMethod.card?.exp_month,
                    cardExpiryYear: stripePaymentMethod.card?.exp_year,
                    cardCountry: stripePaymentMethod.card?.country,
                    cardFingerprint: stripePaymentMethod.card?.fingerprint,
                    billingAddress: stripePaymentMethod.billing_details?.address,
                    billingEmail: stripePaymentMethod.billing_details?.email,
                    billingPhone: stripePaymentMethod.billing_details?.phone,
                    isDefault: paymentMethodData.setAsDefault || false,
                    createdIpAddress: paymentMethodData.ipAddress,
                    createdUserAgent: paymentMethodData.userAgent
                });

                if (paymentMethod.provider === 'stripe') {
                    await stripe.customers.update(customer.id, {
                        invoice_settings: {
                            default_payment_method: paymentMethod.paymentMethodId
                        }
                    });
                }

            } else if (paymentMethodData.provider === 'paypal') {
                // Create PayPal payment method record
                paymentMethod = new PaymentMethod({
                    userId,
                    provider: 'paypal',
                    type: 'paypal',
                    paymentMethodId: paymentMethodData.paymentMethodId,
                    paypalPayerId: paymentMethodData.paypalPayerId,
                    paypalEmail: paymentMethodData.paypalEmail,
                    isDefault: paymentMethodData.setAsDefault || false,
                    createdIpAddress: paymentMethodData.ipAddress,
                    createdUserAgent: paymentMethodData.userAgent
                });
            }

            await paymentMethod.save();

            return paymentMethod;

        } catch (error) {
            console.error('PAYMENT SERVICE:: Error saving payment method:', error);
            throw error;
        }
    }

    /**
     * Create escrow payment (hold funds when provider confirms booking)
     */
    async createEscrowPayment(bookingId, paymentMethodId, options = {}) {
        try {
            const booking = await Booking.findById(bookingId)
                .populate('username')
                .populate('providerId');

            if (!booking) {
                throw new Error('Booking not found');
            }

            const customer = booking.username;
            const provider = booking.providerId;

            // Get payment method
            const paymentMethod = await PaymentMethod.findOne({
                userId: customer._id,
                _id: paymentMethodId,
                isActive: true
            });

            if (!paymentMethod) {
                throw new Error('Payment method not found');
            }

            // Calculate amounts (amounts in cents)
            const amount = Math.round(booking.budget * 100);
            const platformFeeAmount = Math.round(amount * this.platformFeePercentage / 100);
            const providerAmount = amount - platformFeeAmount;

            // Create payment transaction record
            const transaction = new PaymentTransaction({
                bookingId: booking._id,
                jobId: booking.jobId,
                customerId: customer._id,
                providerId: provider._id,
                amount,
                currency: booking.currency || 'USD',
                platformFeePercentage: this.platformFeePercentage,
                platformFeeAmount,
                providerAmount,
                paymentProvider: paymentMethod.provider,
                paymentMethodId: paymentMethod.paymentMethodId,
                paymentMethodType: paymentMethod.type,
                cardLast4: paymentMethod.cardLast4,
                cardBrand: paymentMethod.cardBrand,
                description: `Payment for booking: ${booking.bookingTitle}`,
                ipAddress: options.ipAddress,
                userAgent: options.userAgent
            });

            let result;

            if (paymentMethod.provider === 'stripe') {
                result = await this.createStripeEscrowPayment(transaction, paymentMethod, customer);
            } else if (paymentMethod.provider === 'paypal') {
                result = await this.createPayPalEscrowPayment(transaction, paymentMethod, customer);
            }

            await transaction.save();

            // Update payment method usage
            await paymentMethod.recordUsage();

            // Send notifications
            await this.sendPaymentNotifications(transaction, 'payment_held');

            return transaction;

        } catch (error) {
            console.error('Error creating escrow payment:', error);
            throw error;
        }
    }

    /**
     * Create Stripe escrow payment
     */
    async createStripeEscrowPayment(transaction, paymentMethod, customer) {
        try {
            // Create payment intent with manual capture
            const paymentIntent = await stripe.paymentIntents.create({
                amount: transaction.amount,
                currency: transaction.currency.toLowerCase(),
                customer: paymentMethod.stripeCustomerId,
                payment_method: paymentMethod.paymentMethodId,
                confirmation_method: 'automatic',
                confirm: true,
                capture_method: 'manual', // Hold funds, don't capture yet
                description: transaction.description,
                metadata: {
                    bookingId: transaction.bookingId.toString(),
                    jobId: transaction.jobId.toString(),
                    customerId: transaction.customerId.toString(),
                    providerId: transaction.providerId.toString()
                },
                return_url: `${process.env.BASE_URL || 'https://mosalapro.com'}/booking/${transaction.bookingId}`
            });

            // Update transaction with Stripe details
            transaction.stripePaymentIntentId = paymentIntent.id;
            transaction.status = 'authorized';
            transaction.authorizedAt = new Date();

            return paymentIntent;

        } catch (error) {
            transaction.status = 'failed';
            transaction.failedAt = new Date();
            transaction.errorCode = error.code;
            transaction.errorMessage = error.message;

            // Record failure on payment method
            await paymentMethod.recordFailure(error.message);

            throw error;
        }
    }

    /**
     * Create PayPal escrow payment
     */
    async createPayPalEscrowPayment(transaction, paymentMethod, customer) {
        try {
            const request = new paypalSdk.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody({
                intent: 'AUTHORIZE', // Authorize only, don't capture
                purchase_units: [{
                    reference_id: transaction.bookingId.toString(),
                    description: transaction.description,
                    amount: {
                        currency_code: transaction.currency,
                        value: (transaction.amount / 100).toFixed(2)
                    },
                    payee: {
                        email_address: process.env.PAYPAL_BUSINESS_EMAIL
                    }
                }],
                application_context: {
                    return_url: `${process.env.BASE_URL || 'https://mosalapro.com'}/booking/${transaction.bookingId}`,
                    cancel_url: `${process.env.BASE_URL || 'https://mosalapro.com'}/booking/${transaction.bookingId}/payment-cancelled`
                }
            });

            const order = await paypalClient.execute(request);

            // Update transaction with PayPal details
            transaction.paypalOrderId = order.result.id;
            transaction.status = 'authorized';
            transaction.authorizedAt = new Date();

            return order.result;

        } catch (error) {
            transaction.status = 'failed';
            transaction.failedAt = new Date();
            transaction.errorMessage = error.message;

            throw error;
        }
    }

    /**
     * Capture payment (when work begins)
     */
    async capturePayment(transactionId) {
        try {
            const transaction = await PaymentTransaction.findById(transactionId);

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (transaction.status !== 'authorized') {
                throw new Error('Payment cannot be captured in current status');
            }

            if (transaction.paymentProvider === 'stripe') {
                await this.captureStripePayment(transaction);
            } else if (transaction.paymentProvider === 'paypal') {
                await this.capturePayPalPayment(transaction);
            }

            transaction.status = 'held';
            transaction.capturedAt = new Date();
            await transaction.save();

            // Send notifications
            await this.sendPaymentNotifications(transaction, 'payment_captured');

            return transaction;

        } catch (error) {
            console.error('Error capturing payment:', error);
            throw error;
        }
    }

    /**
     * Capture Stripe payment
     */
    async captureStripePayment(transaction) {
        try {
            const paymentIntent = await stripe.paymentIntents.capture(
                transaction.stripePaymentIntentId
            );

            transaction.stripeChargeId = paymentIntent.charges.data[0]?.id;

            return paymentIntent;

        } catch (error) {
            transaction.status = 'failed';
            transaction.errorCode = error.code;
            transaction.errorMessage = error.message;
            await transaction.save();

            throw error;
        }
    }

    /**
     * Capture PayPal payment
     */
    async capturePayPalPayment(transaction) {
        try {
            const request = new paypalSdk.orders.OrdersCaptureRequest(transaction.paypalOrderId);
            request.requestBody({});

            const capture = await paypalClient.execute(request);

            transaction.paypalCaptureId = capture.result.purchase_units[0].payments.captures[0].id;

            return capture.result;

        } catch (error) {
            transaction.status = 'failed';
            transaction.errorMessage = error.message;
            await transaction.save();

            throw error;
        }
    }

    /**
     * Release payment to provider (create payout when delivery is accepted)
     */
    async releasePaymentToProvider(transactionId) {
        try {
            const transaction = await PaymentTransaction.findById(transactionId)
                .populate('providerId');

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (!transaction.canRelease()) {
                throw new Error('Payment cannot be released in current status');
            }

            const provider = transaction.providerId;

            // Check if provider has payout account configured
            const hasPayoutAccount = await this.checkProviderPayoutAccount(provider);

            if (!hasPayoutAccount) {
                throw new Error('Provider has not configured payout account');
            }

            // Create payout record
            const payout = new Payout({
                paymentTransactionId: transaction._id,
                bookingId: transaction.bookingId,
                jobId: transaction.jobId,
                providerId: provider._id,
                customerId: transaction.customerId,
                amount: transaction.providerAmount,
                currency: transaction.currency,
                payoutProvider: transaction.paymentProvider,
                description: `Payout for ${transaction.description}`
            });

            // Execute payout based on provider
            if (transaction.paymentProvider === 'stripe') {
                await this.executeStripePayout(payout, provider);
            } else if (transaction.paymentProvider === 'paypal') {
                await this.executePayPalPayout(payout, provider);
            }

            await payout.save();

            // Update transaction status
            transaction.status = 'released';
            transaction.releasedAt = new Date();
            await transaction.save();

            // Send notifications
            await this.sendPaymentNotifications(transaction, 'payment_released');
            await this.sendPayoutNotifications(payout, 'payout_initiated');

            return payout;

        } catch (error) {
            console.error('Error releasing payment to provider:', error);
            throw error;
        }
    }

    /**
     * Check if provider has payout account configured
     */
    async checkProviderPayoutAccount(provider) {
        if (provider.stripeConnectAccountId) {
            try {
                const account = await stripe.accounts.retrieve(provider.stripeConnectAccountId);
                return account.charges_enabled && account.payouts_enabled;
            } catch (error) {
                return false;
            }
        }

        if (provider.paypalPayoutEmail) {
            return true;
        }

        return false;
    }

    /**
     * Execute Stripe payout using Stripe Connect
     */
    async executeStripePayout(payout, provider) {
        try {
            if (!provider.stripeConnectAccountId) {
                throw new Error('Provider does not have Stripe Connect account');
            }

            // Create transfer to connected account
            const transfer = await stripe.transfers.create({
                amount: payout.amount,
                currency: payout.currency.toLowerCase(),
                destination: provider.stripeConnectAccountId,
                description: payout.description,
                metadata: {
                    payoutId: payout._id.toString(),
                    bookingId: payout.bookingId.toString(),
                    providerId: provider._id.toString()
                }
            });

            payout.stripeTransferId = transfer.id;
            payout.payoutMethod = 'bank_account';
            payout.status = 'in_transit';
            payout.sentAt = new Date();

            // Get estimated arrival date (usually 2-3 business days)
            const estimatedDays = 3;
            payout.estimatedArrivalDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

            return transfer;

        } catch (error) {
            payout.status = 'failed';
            payout.failureCode = error.code;
            payout.failureMessage = error.message;
            payout.failedAt = new Date();

            throw error;
        }
    }

    /**
     * Execute PayPal payout
     */
    async executePayPalPayout(payout, provider) {
        try {
            if (!provider.paypalPayoutEmail) {
                throw new Error('Provider does not have PayPal payout email configured');
            }

            const requestBody = {
                sender_batch_header: {
                    sender_batch_id: `payout_${payout._id}_${Date.now()}`,
                    email_subject: 'You have a payment from Mosalapro',
                    email_message: payout.description
                },
                items: [{
                    recipient_type: 'EMAIL',
                    amount: {
                        value: (payout.amount / 100).toFixed(2),
                        currency: payout.currency
                    },
                    receiver: provider.paypalPayoutEmail,
                    note: payout.description,
                    sender_item_id: payout._id.toString()
                }]
            };

            // Note: PayPal Payouts API endpoint
            // This requires PayPal Payouts permission
            const response = await fetch('https://api-m.paypal.com/v1/payments/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getPayPalAccessToken()}`
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'PayPal payout failed');
            }

            payout.paypalPayoutBatchId = result.batch_header.payout_batch_id;
            payout.paypalPayoutItemId = result.items[0].payout_item_id;
            payout.payoutMethod = 'paypal';
            payout.paypalPayoutEmail = provider.paypalPayoutEmail;
            payout.status = 'in_transit';
            payout.sentAt = new Date();

            // PayPal payouts usually arrive within 30 minutes to 24 hours
            payout.estimatedArrivalDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

            return result;

        } catch (error) {
            payout.status = 'failed';
            payout.failureMessage = error.message;
            payout.failedAt = new Date();

            throw error;
        }
    }

    /**
     * Get PayPal access token
     */
    async getPayPalAccessToken() {
        const auth = Buffer.from(
            `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString('base64');

        const response = await fetch(
            `https://api-m${process.env.NODE_ENV === 'production' ? '' : '.sandbox'}.paypal.com/v1/oauth2/token`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            }
        );

        const result = await response.json();
        return result.access_token;
    }

    /**
     * Refund payment (if booking is cancelled or disputed)
     */
    async refundPayment(transactionId, refundAmount, refundReason) {
        try {
            const transaction = await PaymentTransaction.findById(transactionId);

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (!transaction.canRefund()) {
                throw new Error('Payment cannot be refunded in current status');
            }

            // Validate refund amount
            const maxRefundAmount = transaction.amount - transaction.refundAmount;
            const actualRefundAmount = refundAmount || maxRefundAmount;

            if (actualRefundAmount > maxRefundAmount) {
                throw new Error('Refund amount exceeds available balance');
            }

            if (transaction.paymentProvider === 'stripe') {
                await this.refundStripePayment(transaction, actualRefundAmount);
            } else if (transaction.paymentProvider === 'paypal') {
                await this.refundPayPalPayment(transaction, actualRefundAmount);
            }

            // Update transaction
            transaction.refundAmount += actualRefundAmount;
            transaction.refundReason = refundReason;
            transaction.refundedAt = new Date();

            if (transaction.refundAmount >= transaction.amount) {
                transaction.status = 'refunded';
            } else {
                transaction.status = 'partially_refunded';
            }

            await transaction.save();

            // Send notifications
            await this.sendPaymentNotifications(transaction, 'payment_refunded');

            return transaction;

        } catch (error) {
            console.error('Error refunding payment:', error);
            throw error;
        }
    }

    /**
     * Refund Stripe payment
     */
    async refundStripePayment(transaction, refundAmount) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: transaction.stripePaymentIntentId,
                amount: refundAmount,
                reason: 'requested_by_customer',
                metadata: {
                    transactionId: transaction._id.toString(),
                    bookingId: transaction.bookingId.toString()
                }
            });

            transaction.refundId = refund.id;

            return refund;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Refund PayPal payment
     */
    async refundPayPalPayment(transaction, refundAmount) {
        try {
            const request = new paypalSdk.payments.CapturesRefundRequest(transaction.paypalCaptureId);
            request.requestBody({
                amount: {
                    currency_code: transaction.currency,
                    value: (refundAmount / 100).toFixed(2)
                }
            });

            const refund = await paypalClient.execute(request);

            transaction.refundId = refund.result.id;

            return refund.result;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Send payment notifications
     */
    async sendPaymentNotifications(transaction, eventType) {
        try {
            const customer = await User.findById(transaction.customerId);
            const provider = await User.findById(transaction.providerId);

            const notificationData = {
                payment_held: {
                    title: 'Payment Held in Escrow',
                    customerMessage: `Your payment of ${transaction.currency} ${(transaction.amount / 100).toFixed(2)} is securely held until the service is completed.`,
                    providerMessage: `Customer payment of ${transaction.currency} ${(transaction.amount / 100).toFixed(2)} is held in escrow. Complete the work to receive payment.`
                },
                payment_captured: {
                    title: 'Payment Captured',
                    customerMessage: 'Your payment has been processed and is being held securely.',
                    providerMessage: 'Payment has been secured for this booking.'
                },
                payment_released: {
                    title: 'Payment Released',
                    customerMessage: 'Payment has been released to the provider.',
                    providerMessage: `You have received ${transaction.currency} ${(transaction.providerAmount / 100).toFixed(2)} for this booking.`
                },
                payment_refunded: {
                    title: 'Payment Refunded',
                    customerMessage: `A refund of ${transaction.currency} ${(transaction.refundAmount / 100).toFixed(2)} has been issued to your payment method.`,
                    providerMessage: 'This booking has been refunded to the customer.'
                }
            };

            const data = notificationData[eventType];

            if (!data) return;

            // Send notifications to customer
            if (customer) {
                await NotificationService.createNotification({
                    receiverId: customer._id,
                    title: data.title,
                    content: data.customerMessage,
                    icon: 'fa-credit-card',
                    causedByItem: transaction._id,
                    bookingId: transaction.bookingId
                });

                // Send email if opted in
                if (customer.bkgUpdateNotifs) {
                    await EmailSender.sendPaymentNotification(
                        customer.email,
                        data.title,
                        data.customerMessage
                    );
                }
            }

            // Send notifications to provider
            if (provider) {
                await NotificationService.createNotification({
                    receiverId: provider._id,
                    accountType: 'pro',
                    title: data.title,
                    content: data.providerMessage,
                    icon: 'fa-credit-card',
                    causedByItem: transaction._id,
                    bookingId: transaction.bookingId
                });

                if (provider.bkgUpdateNotifs) {
                    await EmailSender.sendPaymentNotification(
                        provider.email,
                        data.title,
                        data.providerMessage
                    );
                }
            }

        } catch (error) {
            console.error('Error sending payment notifications:', error);
        }
    }

    /**
     * Send payout notifications
     */
    async sendPayoutNotifications(payout, eventType) {
        try {
            const provider = await User.findById(payout.providerId);

            if (!provider) return;

            const notificationData = {
                payout_initiated: {
                    title: 'Payout Initiated',
                    message: `Your payout of ${payout.currency} ${(payout.amount / 100).toFixed(2)} has been initiated and will arrive in ${payout.payoutMethod === 'paypal' ? '24 hours' : '2-3 business days'}.`
                },
                payout_completed: {
                    title: 'Payout Completed',
                    message: `Your payout of ${payout.currency} ${(payout.amount / 100).toFixed(2)} has been successfully sent to your account.`
                },
                payout_failed: {
                    title: 'Payout Failed',
                    message: `Your payout failed: ${payout.failureMessage}. Please update your payout account details.`
                }
            };

            const data = notificationData[eventType];

            if (!data) return;

            await NotificationService.createNotification({
                receiverId: provider._id,
                accountType: 'pro',
                title: data.title,
                content: data.message,
                icon: 'fa-money-bill',
                causedByItem: payout._id,
                bookingId: payout.bookingId
            });

            if (provider.bkgUpdateNotifs) {
                await EmailSender.sendPayoutNotification(
                    provider.email,
                    data.title,
                    data.message
                );
            }

        } catch (error) {
            console.error('Error sending payout notifications:', error);
        }
    }
}

module.exports = new PaymentService();
