const mongoose = require("mongoose");

// Service Request
const bookingSchema = new mongoose.Schema({
    username: { type: String, require:true },
    bookingTitle:{
        type: String,
        required: true
    },
    bookingDescription:{
        type: String,
        required: true
    },
    category: String, 
    providerId : String,
    jobId: String,
    budget: Number,
    budgetType: {
        type: String,
        default: "Per project"
    },
    currency: {
        type: String,
        default:'USD',
        required: true
    },
    deadline: String,
    status:{
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },

    files: [{
        type: String
    }],
    providerComments: String,
    providerFiles:[{
        type: String
    }],
    newDeadlineRequest: Object,
    // Payment tracking fields
    paymentRequired: {
        type: Boolean,
        default: true
    },
    paymentTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentTransaction'
    },
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'authorized', 'held', 'released', 'refunded', 'failed'],
        default: 'pending'
    },
    paymentProvider: {
        type: String,
        enum: ['stripe', 'paypal', ''],
        default: ''
    },
    payoutId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payout'
    },
    payoutStatus: {
        type: String,
        enum: ['not_initiated', 'pending', 'in_transit', 'paid', 'failed'],
        default: 'not_initiated'
    }
});
bookingSchema.plugin(require("mongoose-findorcreate"));

const BookingModel = new mongoose.model("Booking", bookingSchema);

module.exports = BookingModel;