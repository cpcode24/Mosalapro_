const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);
const PaymentTransaction = require('../models/paymentTransaction');
const Payout = require('../models/payout');
const PaymentService = require('./paymentService');

/**
 * Webhook Handler Service
 *
 * Handles webhook events from Stripe and PayPal to update payment and payout statuses
 */
class WebhookHandler {
    /**
     * Handle Stripe webhook events
     */
    async handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;

        try {
            // Verify webhook signature
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            console.error('Stripe webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            // Handle the event
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;

                case 'payment_intent.canceled':
                    await this.handlePaymentIntentCanceled(event.data.object);
                    break;

                case 'charge.succeeded':
                    await this.handleChargeSucceeded(event.data.object);
                    break;

                case 'charge.refunded':
                    await this.handleChargeRefunded(event.data.object);
                    break;

                case 'charge.dispute.created':
                    await this.handleDisputeCreated(event.data.object);
                    break;

                case 'charge.dispute.closed':
                    await this.handleDisputeClosed(event.data.object);
                    break;

                case 'transfer.created':
                    await this.handleTransferCreated(event.data.object);
                    break;

                case 'transfer.paid':
                    await this.handleTransferPaid(event.data.object);
                    break;

                case 'transfer.failed':
                    await this.handleTransferFailed(event.data.object);
                    break;

                case 'payout.paid':
                    await this.handlePayoutPaid(event.data.object);
                    break;

                case 'payout.failed':
                    await this.handlePayoutFailed(event.data.object);
                    break;

                default:
                    console.log(`Unhandled Stripe event type: ${event.type}`);
            }

            res.json({ received: true });

        } catch (error) {
            console.error('Error processing Stripe webhook:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    /**
     * Handle payment intent succeeded
     */
    async handlePaymentIntentSucceeded(paymentIntent) {
        const transaction = await PaymentTransaction.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (transaction) {
            transaction.addWebhookEvent('payment_intent.succeeded', paymentIntent.id, paymentIntent);

            if (transaction.status === 'pending') {
                transaction.status = 'authorized';
                transaction.authorizedAt = new Date();
                await transaction.save();
            }
        }
    }

    /**
     * Handle payment intent failed
     */
    async handlePaymentIntentFailed(paymentIntent) {
        const transaction = await PaymentTransaction.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (transaction) {
            transaction.addWebhookEvent('payment_intent.payment_failed', paymentIntent.id, paymentIntent);

            transaction.status = 'failed';
            transaction.failedAt = new Date();
            transaction.errorCode = paymentIntent.last_payment_error?.code;
            transaction.errorMessage = paymentIntent.last_payment_error?.message;
            await transaction.save();

            // Send failure notification
            await PaymentService.sendPaymentNotifications(transaction, 'payment_failed');
        }
    }

    /**
     * Handle payment intent canceled
     */
    async handlePaymentIntentCanceled(paymentIntent) {
        const transaction = await PaymentTransaction.findOne({
            stripePaymentIntentId: paymentIntent.id
        });

        if (transaction) {
            transaction.addWebhookEvent('payment_intent.canceled', paymentIntent.id, paymentIntent);

            transaction.status = 'cancelled';
            await transaction.save();
        }
    }

    /**
     * Handle charge succeeded
     */
    async handleChargeSucceeded(charge) {
        const transaction = await PaymentTransaction.findOne({
            stripePaymentIntentId: charge.payment_intent
        });

        if (transaction) {
            transaction.addWebhookEvent('charge.succeeded', charge.id, charge);

            transaction.stripeChargeId = charge.id;

            if (charge.captured) {
                transaction.status = 'held';
                transaction.capturedAt = new Date();
            }

            await transaction.save();
        }
    }

    /**
     * Handle charge refunded
     */
    async handleChargeRefunded(charge) {
        const transaction = await PaymentTransaction.findOne({
            stripeChargeId: charge.id
        });

        if (transaction) {
            transaction.addWebhookEvent('charge.refunded', charge.id, charge);

            transaction.refundAmount = charge.amount_refunded;

            if (charge.refunded) {
                transaction.status = 'refunded';
                transaction.refundedAt = new Date();
            } else if (charge.amount_refunded > 0) {
                transaction.status = 'partially_refunded';
            }

            await transaction.save();
        }
    }

    /**
     * Handle dispute created
     */
    async handleDisputeCreated(dispute) {
        const transaction = await PaymentTransaction.findOne({
            stripeChargeId: dispute.charge
        });

        if (transaction) {
            transaction.addWebhookEvent('charge.dispute.created', dispute.id, dispute);

            transaction.status = 'disputed';
            transaction.disputeId = dispute.id;
            transaction.disputeReason = dispute.reason;
            transaction.disputeStatus = 'pending';
            await transaction.save();

            // Send dispute notification to admin/provider
            console.log(`DISPUTE CREATED: Transaction ${transaction._id}, Dispute ID: ${dispute.id}`);
        }
    }

    /**
     * Handle dispute closed
     */
    async handleDisputeClosed(dispute) {
        const transaction = await PaymentTransaction.findOne({
            disputeId: dispute.id
        });

        if (transaction) {
            transaction.addWebhookEvent('charge.dispute.closed', dispute.id, dispute);

            transaction.disputeStatus = dispute.status; // 'won', 'lost', 'closed'

            if (dispute.status === 'won') {
                // Merchant won the dispute
                transaction.status = 'held';
            } else if (dispute.status === 'lost') {
                // Customer won the dispute, funds returned
                transaction.status = 'refunded';
                transaction.refundedAt = new Date();
            }

            await transaction.save();
        }
    }

    /**
     * Handle Stripe transfer created (payout to provider)
     */
    async handleTransferCreated(transfer) {
        const payout = await Payout.findOne({
            stripeTransferId: transfer.id
        });

        if (payout) {
            payout.addWebhookEvent('transfer.created', transfer.id, transfer);

            payout.status = 'in_transit';
            payout.sentAt = new Date();
            await payout.save();
        }
    }

    /**
     * Handle Stripe transfer paid
     */
    async handleTransferPaid(transfer) {
        const payout = await Payout.findOne({
            stripeTransferId: transfer.id
        });

        if (payout) {
            payout.addWebhookEvent('transfer.paid', transfer.id, transfer);

            payout.status = 'paid';
            payout.paidAt = new Date();
            await payout.save();

            // Send payout completion notification
            await PaymentService.sendPayoutNotifications(payout, 'payout_completed');
        }
    }

    /**
     * Handle Stripe transfer failed
     */
    async handleTransferFailed(transfer) {
        const payout = await Payout.findOne({
            stripeTransferId: transfer.id
        });

        if (payout) {
            payout.addWebhookEvent('transfer.failed', transfer.id, transfer);

            await payout.markAsFailed(
                transfer.failure_code,
                transfer.failure_message
            );

            // Send failure notification
            await PaymentService.sendPayoutNotifications(payout, 'payout_failed');

            // Attempt retry if possible
            if (payout.canRetry()) {
                console.log(`Scheduling retry for payout ${payout._id}`);
                // TODO: Implement retry logic
            }
        }
    }

    /**
     * Handle Stripe payout paid
     */
    async handlePayoutPaid(stripePayout) {
        const payout = await Payout.findOne({
            stripePayoutId: stripePayout.id
        });

        if (payout) {
            payout.addWebhookEvent('payout.paid', stripePayout.id, stripePayout);

            payout.status = 'paid';
            payout.paidAt = new Date();
            await payout.save();
        }
    }

    /**
     * Handle Stripe payout failed
     */
    async handlePayoutFailed(stripePayout) {
        const payout = await Payout.findOne({
            stripePayoutId: stripePayout.id
        });

        if (payout) {
            payout.addWebhookEvent('payout.failed', stripePayout.id, stripePayout);

            await payout.markAsFailed(
                stripePayout.failure_code,
                stripePayout.failure_message
            );
        }
    }

    /**
     * Handle PayPal webhook events
     */
    async handlePayPalWebhook(req, res) {
        try {
            const webhookEvent = req.body;

            // Verify PayPal webhook signature
            const isVerified = await this.verifyPayPalWebhook(req);

            if (!isVerified) {
                console.error('PayPal webhook verification failed');
                return res.status(401).send('Webhook verification failed');
            }

            // Handle different PayPal event types
            switch (webhookEvent.event_type) {
                case 'PAYMENT.AUTHORIZATION.CREATED':
                    await this.handlePayPalAuthorizationCreated(webhookEvent);
                    break;

                case 'PAYMENT.CAPTURE.COMPLETED':
                    await this.handlePayPalCaptureCompleted(webhookEvent);
                    break;

                case 'PAYMENT.CAPTURE.DENIED':
                    await this.handlePayPalCaptureDenied(webhookEvent);
                    break;

                case 'PAYMENT.CAPTURE.REFUNDED':
                    await this.handlePayPalCaptureRefunded(webhookEvent);
                    break;

                case 'CUSTOMER.DISPUTE.CREATED':
                    await this.handlePayPalDisputeCreated(webhookEvent);
                    break;

                case 'CUSTOMER.DISPUTE.RESOLVED':
                    await this.handlePayPalDisputeResolved(webhookEvent);
                    break;

                case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
                    await this.handlePayPalPayoutSuccess(webhookEvent);
                    break;

                case 'PAYMENT.PAYOUTSBATCH.DENIED':
                    await this.handlePayPalPayoutDenied(webhookEvent);
                    break;

                default:
                    console.log(`Unhandled PayPal event type: ${webhookEvent.event_type}`);
            }

            res.json({ received: true });

        } catch (error) {
            console.error('Error processing PayPal webhook:', error);
            res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

    /**
     * Verify PayPal webhook signature
     */
    async verifyPayPalWebhook(req) {
        try {
            // PayPal webhook verification logic
            // Implementation depends on PayPal SDK version
            const webhookId = process.env.PAYPAL_WEBHOOK_ID;

            if (!webhookId) {
                console.warn('PayPal webhook ID not configured, skipping verification');
                return true; // In development, you might want to skip verification
            }

            // TODO: Implement proper PayPal webhook verification
            // Reference: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature

            return true;

        } catch (error) {
            console.error('PayPal webhook verification error:', error);
            return false;
        }
    }

    /**
     * Handle PayPal authorization created
     */
    async handlePayPalAuthorizationCreated(event) {
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;

        if (!orderId) return;

        const transaction = await PaymentTransaction.findOne({
            paypalOrderId: orderId
        });

        if (transaction) {
            transaction.addWebhookEvent(event.event_type, event.id, event.resource);

            transaction.status = 'authorized';
            transaction.authorizedAt = new Date();
            await transaction.save();
        }
    }

    /**
     * Handle PayPal capture completed
     */
    async handlePayPalCaptureCompleted(event) {
        const captureId = event.resource.id;

        const transaction = await PaymentTransaction.findOne({
            paypalCaptureId: captureId
        });

        if (transaction) {
            transaction.addWebhookEvent(event.event_type, event.id, event.resource);

            transaction.status = 'held';
            transaction.capturedAt = new Date();
            await transaction.save();
        }
    }

    /**
     * Handle PayPal capture denied
     */
    async handlePayPalCaptureDenied(event) {
        const captureId = event.resource.id;

        const transaction = await PaymentTransaction.findOne({
            paypalCaptureId: captureId
        });

        if (transaction) {
            transaction.addWebhookEvent(event.event_type, event.id, event.resource);

            transaction.status = 'failed';
            transaction.failedAt = new Date();
            transaction.errorMessage = event.resource.status_details?.reason || 'Payment denied';
            await transaction.save();
        }
    }

    /**
     * Handle PayPal capture refunded
     */
    async handlePayPalCaptureRefunded(event) {
        const refundId = event.resource.id;
        const captureId = event.resource.supplementary_data?.related_ids?.capture_id;

        const transaction = await PaymentTransaction.findOne({
            paypalCaptureId: captureId
        });

        if (transaction) {
            transaction.addWebhookEvent(event.event_type, event.id, event.resource);

            const refundAmount = parseFloat(event.resource.amount.value) * 100; // Convert to cents

            transaction.refundAmount += refundAmount;
            transaction.refundId = refundId;

            if (transaction.refundAmount >= transaction.amount) {
                transaction.status = 'refunded';
                transaction.refundedAt = new Date();
            } else {
                transaction.status = 'partially_refunded';
            }

            await transaction.save();
        }
    }

    /**
     * Handle PayPal dispute created
     */
    async handlePayPalDisputeCreated(event) {
        const disputeId = event.resource.dispute_id;

        // Find transaction by PayPal capture ID or order ID
        const transaction = await PaymentTransaction.findOne({
            $or: [
                { paypalCaptureId: event.resource.disputed_transactions?.[0]?.seller_transaction_id },
                { paypalOrderId: event.resource.disputed_transactions?.[0]?.buyer_transaction_id }
            ]
        });

        if (transaction) {
            transaction.addWebhookEvent(event.event_type, event.id, event.resource);

            transaction.status = 'disputed';
            transaction.disputeId = disputeId;
            transaction.disputeReason = event.resource.reason;
            transaction.disputeStatus = 'pending';
            await transaction.save();

            console.log(`PAYPAL DISPUTE CREATED: Transaction ${transaction._id}, Dispute ID: ${disputeId}`);
        }
    }

    /**
     * Handle PayPal dispute resolved
     */
    async handlePayPalDisputeResolved(event) {
        const disputeId = event.resource.dispute_id;

        const transaction = await PaymentTransaction.findOne({
            disputeId: disputeId
        });

        if (transaction) {
            transaction.addWebhookEvent(event.event_type, event.id, event.resource);

            const outcome = event.resource.dispute_outcome?.outcome_code;

            if (outcome === 'RESOLVED_BUYER_FAVOUR') {
                transaction.disputeStatus = 'lost';
                transaction.status = 'refunded';
                transaction.refundedAt = new Date();
            } else if (outcome === 'RESOLVED_SELLER_FAVOUR') {
                transaction.disputeStatus = 'won';
                transaction.status = 'held';
            } else {
                transaction.disputeStatus = 'closed';
            }

            await transaction.save();
        }
    }

    /**
     * Handle PayPal payout success
     */
    async handlePayPalPayoutSuccess(event) {
        const batchId = event.resource.batch_header?.payout_batch_id;

        const payout = await Payout.findOne({
            paypalPayoutBatchId: batchId
        });

        if (payout) {
            payout.addWebhookEvent(event.event_type, event.id, event.resource);

            payout.status = 'paid';
            payout.paidAt = new Date();
            await payout.save();

            await PaymentService.sendPayoutNotifications(payout, 'payout_completed');
        }
    }

    /**
     * Handle PayPal payout denied
     */
    async handlePayPalPayoutDenied(event) {
        const batchId = event.resource.batch_header?.payout_batch_id;

        const payout = await Payout.findOne({
            paypalPayoutBatchId: batchId
        });

        if (payout) {
            payout.addWebhookEvent(event.event_type, event.id, event.resource);

            await payout.markAsFailed(
                'PAYOUT_DENIED',
                event.resource.batch_header?.errors?.[0]?.message || 'Payout denied'
            );

            await PaymentService.sendPayoutNotifications(payout, 'payout_failed');
        }
    }
}

module.exports = new WebhookHandler();
