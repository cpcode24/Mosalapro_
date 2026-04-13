/**
 * Payment Routes
 *
 * Handles all payment-related API endpoints including:
 * - Payment method management
 * - Escrow payments
 * - Refunds
 * - Payouts
 * - Webhooks
 */

const express = require('express');
const router = express.Router();
const PaymentService = require('../services/paymentService');
const WebhookHandler = require('../services/webhookHandler');
const PaymentMethod = require('../models/paymentMethod');
const PaymentTransaction = require('../models/paymentTransaction');
const Payout = require('../models/payout');
const User = require('../models/user');
const Booking = require('../models/booking');
const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);

// Middleware to ensure user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

/**
 * Save new payment method (Stripe or PayPal)
 * POST /api/payment/payment-method
 */
router.post('/payment-method', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const { provider, paymentMethodId, setAsDefault } = req.body;

        if (!provider || !paymentMethodId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const paymentMethodData = {
            provider, // 'stripe' or 'paypal'
            paymentMethodId,
            setAsDefault: setAsDefault || false,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        };

        // For PayPal, include additional fields
        if (provider === 'paypal') {
            paymentMethodData.paypalPayerId = req.body.paypalPayerId;
            paymentMethodData.paypalEmail = req.body.paypalEmail;
        }

        const paymentMethod = await PaymentService.savePaymentMethod(userId, paymentMethodData);

        res.json({
            success: true,
            paymentMethod: {
                id: paymentMethod._id,
                displayName: paymentMethod.displayName,
                type: paymentMethod.type,
                isDefault: paymentMethod.isDefault,
                cardLast4: paymentMethod.cardLast4,
                cardBrand: paymentMethod.cardBrand
            }
        });

    } catch (error) {
        console.error('Error saving payment method:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user's payment methods
 * GET /api/payment/payment-methods
 */
router.get('/payment-methods', isAuthenticated, async (req, res) => {
    console.log(`Fetching payment methods for user ${req.user._id}`);
    try {
        const userId = req.user._id;
        const paymentMethods = await PaymentMethod.getActiveForUser(userId);

        const methods = paymentMethods.map(pm => ({
            id: pm._id,
            displayName: pm.displayName,
            type: pm.type,
            provider: pm.provider,
            isDefault: pm.isDefault,
            isExpired: pm.isExpired,
            cardLast4: pm.cardLast4,
            cardBrand: pm.cardBrand,
            lastUsedAt: pm.lastUsedAt,
            createdAt: pm.createdAt
        }));
        console.log(`Payment methods for user ${userId}:`, methods);
        res.json({ success: true, paymentMethods: methods });

    } catch (error) {
        console.log('Error fetching payment methods:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Set default payment method
 * PUT /api/payment/payment-method/:id/default
 */
router.put('/payment-method/:id/default', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const paymentMethodId = req.params.id;

        const paymentMethod = await PaymentMethod.findOne({
            _id: paymentMethodId,
            userId,
            isActive: true
        });

        if (!paymentMethod) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        await paymentMethod.setAsDefault();

        res.json({ success: true, message: 'Default payment method updated' });

    } catch (error) {
        console.error('Error setting default payment method:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Delete payment method
 * DELETE /api/payment/payment-method/:id
 */
router.delete('/payment-method/:id', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const paymentMethodId = req.params.id;

        const paymentMethod = await PaymentMethod.findOne({
            _id: paymentMethodId,
            userId
        });

        if (!paymentMethod) {
            return res.status(404).json({ error: 'Payment method not found' });
        }

        // Detach from Stripe if applicable
        if (paymentMethod.provider === 'stripe') {
            try {
                await stripe.paymentMethods.detach(paymentMethod.paymentMethodId);
            } catch (error) {
                console.error('Error detaching Stripe payment method:', error);
            }
        }

        await paymentMethod.softDelete();

        res.json({ success: true, message: 'Payment method deleted' });

    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create Stripe setup intent for adding new card
 * POST /api/payment/setup-intent
 */
router.post('/setup-intent', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;

        // Get or create Stripe customer
        const customer = await PaymentService.getOrCreateStripeCustomer(user);

        // Create setup intent
        const setupIntent = await stripe.setupIntents.create({
            customer: customer.id,
            payment_method_types: ['card']
        });

        res.json({
            success: true,
            clientSecret: setupIntent.client_secret,
            customerId: customer.id
        });

    } catch (error) {
        console.error('Error creating setup intent:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create escrow payment (when provider confirms booking)
 * POST /api/payment/escrow
 */
router.post('/escrow', isAuthenticated, async (req, res) => {
    try {
        const { bookingId, paymentMethodId } = req.body;

        if (!bookingId || !paymentMethodId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const transaction = await PaymentService.createEscrowPayment(
            bookingId,
            paymentMethodId,
            {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        );

        res.json({
            success: true,
            transaction: {
                id: transaction._id,
                amount: transaction.formattedAmount,
                status: transaction.status,
                description: transaction.description
            }
        });

    } catch (error) {
        console.error('Error creating escrow payment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Capture payment (when work begins)
 * POST /api/payment/capture/:transactionId
 */
router.post('/capture/:transactionId', isAuthenticated, async (req, res) => {
    try {
        const transactionId = req.params.transactionId;

        const transaction = await PaymentService.capturePayment(transactionId);

        res.json({
            success: true,
            transaction: {
                id: transaction._id,
                status: transaction.status,
                capturedAt: transaction.capturedAt
            }
        });

    } catch (error) {
        console.error('Error capturing payment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get payment transaction details
 * GET /api/payment/transaction/:id
 */
router.get('/transaction/:id', isAuthenticated, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const userId = req.user._id;

        const transaction = await PaymentTransaction.findOne({
            _id: transactionId,
            $or: [
                { customerId: userId },
                { providerId: userId }
            ]
        }).populate('customerId providerId', 'firstName lastName email');

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({
            success: true,
            transaction: {
                id: transaction._id,
                amount: transaction.formattedAmount,
                providerAmount: transaction.formattedProviderAmount,
                platformFeePercentage: transaction.platformFeePercentage,
                status: transaction.status,
                paymentProvider: transaction.paymentProvider,
                description: transaction.description,
                createdAt: transaction.createdAt,
                customer: {
                    name: `${transaction.customerId.firstName} ${transaction.customerId.lastName}`,
                    email: transaction.customerId.email
                },
                provider: {
                    name: `${transaction.providerId.firstName} ${transaction.providerId.lastName}`,
                    email: transaction.providerId.email
                }
            }
        });

    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get user's payment transactions
 * GET /api/payment/transactions
 */
router.get('/transactions', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, status } = req.query;

        const query = {
            $or: [
                { customerId: userId },
                { providerId: userId }
            ]
        };

        if (status) {
            query.status = status;
        }

        const transactions = await PaymentTransaction.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('customerId providerId', 'firstName lastName');

        const count = await PaymentTransaction.countDocuments(query);

        res.json({
            success: true,
            transactions: transactions.map(t => ({
                id: t._id,
                amount: t.formattedAmount,
                status: t.status,
                description: t.description,
                createdAt: t.createdAt,
                isCustomer: t.customerId._id.toString() === userId.toString()
            })),
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// REFUNDS
// ============================================================

/**
 * Refund payment
 * POST /api/payment/refund/:transactionId
 */
router.post('/refund/:transactionId', isAuthenticated, async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        const { amount, reason } = req.body;

        // Only allow customer or admin to request refund
        const transaction = await PaymentTransaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Basic authorization check (in production, add more robust checks)
        if (transaction.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to refund this payment' });
        }

        const refundedTransaction = await PaymentService.refundPayment(
            transactionId,
            amount,
            reason
        );

        res.json({
            success: true,
            transaction: {
                id: refundedTransaction._id,
                status: refundedTransaction.status,
                refundAmount: refundedTransaction.refundAmount,
                refundedAt: refundedTransaction.refundedAt
            }
        });

    } catch (error) {
        console.error('Error refunding payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// PAYOUTS
// ============================================================

/**
 * Release payment to provider (when delivery is accepted)
 * POST /api/payment/release/:transactionId
 */
router.post('/release/:transactionId', isAuthenticated, async (req, res) => {
    try {
        const transactionId = req.params.transactionId;

        // Verify that the requester is the customer
        const transaction = await PaymentTransaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.customerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to release this payment' });
        }

        const payout = await PaymentService.releasePaymentToProvider(transactionId);

        res.json({
            success: true,
            payout: {
                id: payout._id,
                amount: payout.formattedAmount,
                status: payout.status,
                estimatedArrivalDate: payout.estimatedArrivalDate
            }
        });

    } catch (error) {
        console.error('Error releasing payment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get payout details
 * GET /api/payment/payout/:id
 */
router.get('/payout/:id', isAuthenticated, async (req, res) => {
    try {
        const payoutId = req.params.id;
        const userId = req.user._id;

        const payout = await Payout.findOne({
            _id: payoutId,
            providerId: userId
        }).populate('providerId', 'firstName lastName email');

        if (!payout) {
            return res.status(404).json({ error: 'Payout not found' });
        }

        res.json({
            success: true,
            payout: {
                id: payout._id,
                amount: payout.formattedAmount,
                status: payout.status,
                payoutProvider: payout.payoutProvider,
                payoutMethod: payout.payoutMethod,
                estimatedArrivalDate: payout.estimatedArrivalDate,
                paidAt: payout.paidAt,
                createdAt: payout.createdAt
            }
        });

    } catch (error) {
        console.error('Error fetching payout:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get provider's payouts
 * GET /api/payment/payouts
 */
router.get('/payouts', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, status } = req.query;

        const query = { providerId: userId };

        if (status) {
            query.status = status;
        }

        const payouts = await Payout.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Payout.countDocuments(query);

        res.json({
            success: true,
            payouts: payouts.map(p => ({
                id: p._id,
                amount: p.formattedAmount,
                status: p.status,
                payoutMethod: p.payoutMethod,
                estimatedArrivalDate: p.estimatedArrivalDate,
                paidAt: p.paidAt,
                createdAt: p.createdAt
            })),
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Error fetching payouts:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Setup Stripe Connect account for provider
 * POST /api/payment/setup-payout-stripe
 */
router.post('/setup-payout-stripe', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;

        // Create Stripe Connect account
        const account = await stripe.accounts.create({
            type: 'express',
            country: user.country || 'US',
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true }
            },
            business_type: 'individual',
            individual: {
                first_name: user.firstName,
                last_name: user.lastName,
                email: user.email
            }
        });

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.BASE_URL || 'https://mosalapro.com'}/provider/payout-setup`,
            return_url: `${process.env.BASE_URL || 'https://mosalapro.com'}/provider/payout-complete`,
            type: 'account_onboarding'
        });

        // Save Stripe Connect account ID to user
        user.stripeConnectAccountId = account.id;
        await user.save();

        res.json({
            success: true,
            url: accountLink.url
        });

    } catch (error) {
        console.error('Error setting up Stripe Connect:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Setup PayPal payout for provider
 * POST /api/payment/setup-payout-paypal
 */
router.post('/setup-payout-paypal', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        const { paypalEmail } = req.body;

        if (!paypalEmail) {
            return res.status(400).json({ error: 'PayPal email is required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(paypalEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Save PayPal email to user
        user.paypalPayoutEmail = paypalEmail;
        await user.save();

        res.json({
            success: true,
            message: 'PayPal payout email saved successfully'
        });

    } catch (error) {
        console.error('Error setting up PayPal payout:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// WEBHOOKS
// ============================================================

/**
 * Stripe webhook endpoint
 * POST /api/payment/webhook/stripe
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    await WebhookHandler.handleStripeWebhook(req, res);
});

/**
 * PayPal webhook endpoint
 * POST /api/payment/webhook/paypal
 */
router.post('/webhook/paypal', express.json(), async (req, res) => {
    await WebhookHandler.handlePayPalWebhook(req, res);
});

module.exports = router;
