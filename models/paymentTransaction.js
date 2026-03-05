const mongoose = require("mongoose");

/**
 * Payment Transaction Model
 *
 * Tracks all payment transactions for escrow payments from customers to Mosalapro.
 * When a provider confirms a booking, the customer's payment is held in escrow.
 * When the customer accepts delivery, funds are released to the provider via payout.
 */
const paymentTransactionSchema = new mongoose.Schema({
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
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Payment Details
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

    // Platform fee (Mosalapro commission)
    platformFeePercentage: {
        type: Number,
        default: 10, // 10% platform fee
        min: 0,
        max: 100
    },
    platformFeeAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Provider receives amount minus platform fee
    providerAmount: {
        type: Number,
        required: true,
        min: 0
    },

    // Payment Provider (Stripe or PayPal)
    paymentProvider: {
        type: String,
        enum: ['stripe', 'paypal'],
        required: true
    },

    // Payment Method Details (for customer payment)
    paymentMethodId: {
        type: String, // Stripe payment method ID or PayPal payment method token
        required: true
    },
    paymentMethodType: {
        type: String,
        enum: ['card', 'paypal', 'bank_account'],
        required: true
    },

    // Last 4 digits of card (for display purposes only)
    cardLast4: {
        type: String,
        minlength: 4,
        maxlength: 4
    },
    cardBrand: {
        type: String // visa, mastercard, amex, etc.
    },

    // Payment Intent/Order IDs from payment providers
    stripePaymentIntentId: {
        type: String,
        sparse: true,
        index: true
    },
    stripeChargeId: {
        type: String,
        sparse: true
    },
    paypalOrderId: {
        type: String,
        sparse: true,
        index: true
    },
    paypalCaptureId: {
        type: String,
        sparse: true
    },

    // Transaction Status
    status: {
        type: String,
        enum: [
            'pending',           // Payment initiated but not confirmed
            'authorized',        // Payment authorized (card hold) but not captured
            'held',              // Payment captured and held in escrow
            'released',          // Payment released to provider
            'refunded',          // Payment refunded to customer
            'partially_refunded', // Partial refund issued
            'failed',            // Payment failed
            'cancelled',         // Payment cancelled before capture
            'disputed'           // Customer disputed the charge
        ],
        default: 'pending',
        required: true,
        index: true
    },

    // Payment Timeline
    authorizedAt: { type: Date },
    capturedAt: { type: Date },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    failedAt: { type: Date },

    // Refund Details
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    refundReason: {
        type: String
    },
    refundId: {
        type: String // Stripe refund ID or PayPal refund ID
    },

    // Dispute/Chargeback
    disputeId: {
        type: String
    },
    disputeReason: {
        type: String
    },
    disputeStatus: {
        type: String,
        enum: ['none', 'pending', 'won', 'lost', 'closed'],
        default: 'none'
    },

    // Error tracking
    errorCode: {
        type: String
    },
    errorMessage: {
        type: String
    },

    // Metadata for auditing
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },

    // Payment description
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

    // Notes for internal use
    internalNotes: {
        type: String
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
paymentTransactionSchema.index({ status: 1, createdAt: -1 });
paymentTransactionSchema.index({ customerId: 1, status: 1 });
paymentTransactionSchema.index({ providerId: 1, status: 1 });

// Update the updatedAt timestamp on save
paymentTransactionSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Calculate platform fee and provider amount before saving
paymentTransactionSchema.pre('save', function(next) {
    if (this.isModified('amount') || this.isModified('platformFeePercentage')) {
        this.platformFeeAmount = Math.round(this.amount * this.platformFeePercentage) / 100;
        this.providerAmount = this.amount - this.platformFeeAmount;
    }
    next();
});

// Virtual for formatted amount
paymentTransactionSchema.virtual('formattedAmount').get(function() {
    return `${this.currency} ${(this.amount / 100).toFixed(2)}`;
});

// Virtual for formatted provider amount
paymentTransactionSchema.virtual('formattedProviderAmount').get(function() {
    return `${this.currency} ${(this.providerAmount / 100).toFixed(2)}`;
});

// Method to check if payment can be refunded
paymentTransactionSchema.methods.canRefund = function() {
    return ['held', 'released'].includes(this.status) &&
           this.refundAmount < this.amount;
};

// Method to check if payment can be released to provider
paymentTransactionSchema.methods.canRelease = function() {
    return this.status === 'held';
};

// Method to add webhook event
paymentTransactionSchema.methods.addWebhookEvent = function(eventType, eventId, data) {
    this.webhookEvents.push({
        eventType,
        eventId,
        receivedAt: new Date(),
        processed: false,
        data
    });
    return this.save();
};

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
