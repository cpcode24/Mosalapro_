const mongoose = require("mongoose");

/**
 * Payout Model
 *
 * Tracks payouts from Mosalapro to providers when customers accept deliverables.
 * Supports both Stripe Connect and PayPal payouts.
 */
const payoutSchema = new mongoose.Schema({
    // Reference to the original payment transaction
    paymentTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentTransaction',
        required: true,
        index: true
    },

    // Reference IDs
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PostRequest',
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Payout Amount (provider amount after platform fee)
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: "USD",
        uppercase: true
    },

    // Payout Provider
    payoutProvider: {
        type: String,
        enum: ['stripe', 'paypal'],
        required: true
    },

    // Provider's payout account details (reference only, not actual credentials)
    stripeConnectAccountId: {
        type: String,
        sparse: true,
        index: true
    },
    paypalPayoutEmail: {
        type: String,
        sparse: true
    },

    // Payout IDs from payment providers
    stripePayoutId: {
        type: String,
        sparse: true,
        index: true
    },
    stripeTransferId: {
        type: String,
        sparse: true
    },
    paypalPayoutBatchId: {
        type: String,
        sparse: true,
        index: true
    },
    paypalPayoutItemId: {
        type: String,
        sparse: true
    },

    // Payout Status
    status: {
        type: String,
        enum: [
            'pending',      // Payout initiated but not sent
            'in_transit',   // Payout sent, waiting for bank/PayPal processing
            'paid',         // Successfully paid to provider
            'failed',       // Payout failed
            'cancelled',    // Payout cancelled
            'reversed'      // Payout reversed due to dispute or error
        ],
        default: 'pending',
        required: true,
        index: true
    },

    // Payout Timeline
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    sentAt: {
        type: Date
    },
    paidAt: {
        type: Date
    },
    failedAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },

    // Expected arrival date (for bank transfers)
    estimatedArrivalDate: {
        type: Date
    },

    // Failure details
    failureCode: {
        type: String
    },
    failureMessage: {
        type: String
    },

    // Reversal details
    reversalReason: {
        type: String
    },
    reversedAt: {
        type: Date
    },

    // Payout method details (for display)
    payoutMethod: {
        type: String,
        enum: ['bank_account', 'debit_card', 'paypal'],
        required: true
    },

    // Bank account last 4 (for Stripe)
    bankAccountLast4: {
        type: String,
        minlength: 4,
        maxlength: 4
    },
    bankName: {
        type: String
    },

    // Description
    description: {
        type: String,
        required: true
    },

    // Webhooks and event tracking
    webhookEvents: [{
        eventType: String,
        eventId: String,
        receivedAt: Date,
        processed: Boolean,
        data: mongoose.Schema.Types.Mixed
    }],

    // Internal notes
    internalNotes: {
        type: String
    },

    // Retry tracking (for failed payouts)
    retryCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastRetryAt: {
        type: Date
    },
    maxRetries: {
        type: Number,
        default: 3
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ providerId: 1, status: 1 });
payoutSchema.index({ paymentTransactionId: 1 });

// Update the updatedAt timestamp on save
payoutSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for formatted amount
payoutSchema.virtual('formattedAmount').get(function() {
    return `${this.currency} ${(this.amount / 100).toFixed(2)}`;
});

// Method to check if payout can be retried
payoutSchema.methods.canRetry = function() {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
};

// Method to mark as sent
payoutSchema.methods.markAsSent = function() {
    this.status = 'in_transit';
    this.sentAt = new Date();
    return this.save();
};

// Method to mark as paid
payoutSchema.methods.markAsPaid = function() {
    this.status = 'paid';
    this.paidAt = new Date();
    return this.save();
};

// Method to mark as failed
payoutSchema.methods.markAsFailed = function(failureCode, failureMessage) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureCode = failureCode;
    this.failureMessage = failureMessage;
    this.retryCount += 1;
    this.lastRetryAt = new Date();
    return this.save();
};

// Method to add webhook event
payoutSchema.methods.addWebhookEvent = function(eventType, eventId, data) {
    this.webhookEvents.push({
        eventType,
        eventId,
        receivedAt: new Date(),
        processed: false,
        data
    });
    return this.save();
};

module.exports = mongoose.model("Payout", payoutSchema);
