const mongoose = require("mongoose");

/**
 * Payment Method Model
 *
 * Securely stores references to payment methods (NOT actual card data).
 * Uses tokenization from Stripe and PayPal - never stores raw card numbers or CVV.
 * This is PCI-DSS compliant as we only store tokens and last 4 digits.
 */
const paymentMethodSchema = new mongoose.Schema({
    // User reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Payment Provider
    provider: {
        type: String,
        enum: ['stripe', 'paypal'],
        required: true
    },

    // Payment Method Type
    type: {
        type: String,
        enum: ['card', 'paypal', 'bank_account'],
        required: true
    },

    // Tokenized Payment Method ID (from Stripe or PayPal)
    // This is safe to store - it's a reference token, not actual card data
    paymentMethodId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Stripe-specific fields
    stripeCustomerId: {
        type: String,
        sparse: true,
        index: true
    },

    // PayPal-specific fields
    paypalPayerId: {
        type: String,
        sparse: true
    },
    paypalEmail: {
        type: String,
        sparse: true
    },

    // Display Information (for UI, never store full card numbers)
    // For cards
    cardLast4: {
        type: String,
        minlength: 4,
        maxlength: 4
    },
    cardBrand: {
        type: String, // visa, mastercard, amex, discover, etc.
        lowercase: true
    },
    cardExpiryMonth: {
        type: Number,
        min: 1,
        max: 12
    },
    cardExpiryYear: {
        type: Number,
        min: 2024
    },
    cardCountry: {
        type: String,
        uppercase: true,
        maxlength: 2 // ISO country code
    },
    cardFingerprint: {
        type: String // Unique identifier for the card (from Stripe)
    },

    // For bank accounts
    bankAccountLast4: {
        type: String,
        minlength: 4,
        maxlength: 4
    },
    bankName: {
        type: String
    },
    accountHolderName: {
        type: String
    },
    accountHolderType: {
        type: String,
        enum: ['individual', 'company']
    },

    // Payment Method Status
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // Verification status
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    },

    // For 3D Secure / Strong Customer Authentication
    requiresAuthentication: {
        type: Boolean,
        default: false
    },

    // Billing details
    billingAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    billingEmail: {
        type: String
    },
    billingPhone: {
        type: String
    },

    // Nickname for the payment method (user-defined)
    nickname: {
        type: String,
        maxlength: 50
    },

    // Usage tracking
    lastUsedAt: {
        type: Date
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Metadata for risk management
    createdIpAddress: {
        type: String
    },
    createdUserAgent: {
        type: String
    },

    // Error tracking (if payment method fails)
    lastFailureDate: {
        type: Date
    },
    lastFailureReason: {
        type: String
    },
    failureCount: {
        type: Number,
        default: 0,
        min: 0
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
    },
    deletedAt: {
        type: Date // Soft delete
    }
});

// Composite index to ensure only one default payment method per user
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, isActive: 1 });

// Update the updatedAt timestamp on save
paymentMethodSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
    if (this.isDefault && this.isModified('isDefault')) {
        // Unset other default payment methods for this user
        await mongoose.model('PaymentMethod').updateMany(
            {
                userId: this.userId,
                _id: { $ne: this._id },
                isDefault: true
            },
            {
                $set: { isDefault: false }
            }
        );
    }
    next();
});

// Virtual for display name
paymentMethodSchema.virtual('displayName').get(function() {
    if (this.nickname) {
        return this.nickname;
    }

    if (this.type === 'card') {
        return `${this.cardBrand ? this.cardBrand.toUpperCase() : 'Card'} ending in ${this.cardLast4}`;
    }

    if (this.type === 'paypal') {
        return `PayPal (${this.paypalEmail})`;
    }

    if (this.type === 'bank_account') {
        return `${this.bankName || 'Bank'} account ending in ${this.bankAccountLast4}`;
    }

    return 'Payment Method';
});

// Virtual to check if card is expired
paymentMethodSchema.virtual('isExpired').get(function() {
    if (this.type !== 'card' || !this.cardExpiryMonth || !this.cardExpiryYear) {
        return false;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    if (this.cardExpiryYear < currentYear) {
        return true;
    }

    if (this.cardExpiryYear === currentYear && this.cardExpiryMonth < currentMonth) {
        return true;
    }

    return false;
});

// Method to soft delete
paymentMethodSchema.methods.softDelete = function() {
    this.deletedAt = new Date();
    this.isActive = false;
    this.isDefault = false;
    return this.save();
};

// Method to mark as default
paymentMethodSchema.methods.setAsDefault = async function() {
    this.isDefault = true;
    return this.save();
};

// Method to track usage
paymentMethodSchema.methods.recordUsage = function() {
    this.lastUsedAt = new Date();
    this.usageCount += 1;
    return this.save();
};

// Method to record failure
paymentMethodSchema.methods.recordFailure = function(reason) {
    this.lastFailureDate = new Date();
    this.lastFailureReason = reason;
    this.failureCount += 1;
    return this.save();
};

// Static method to get user's default payment method
paymentMethodSchema.statics.getDefaultForUser = function(userId) {
    return this.findOne({
        userId,
        isDefault: true,
        isActive: true,
        deletedAt: null
    });
};

// Static method to get all active payment methods for user
paymentMethodSchema.statics.getActiveForUser = function(userId) {
    return this.find({
        userId,
        isActive: true,
        deletedAt: null
    }).sort({ isDefault: -1, createdAt: -1 });
};

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
