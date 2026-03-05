const { required } = require("joi");
const mongoose = require("mongoose");

// Rating data model
const ratingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true
    },
    ratingTitle: {
        type: String,
        default: " "
    },
    userComment:{
        type: String
    },
    jobId: {
        type: String,
        required: true
    },
    bookingId: {
        type: String,
    },
    userId:{
        type: String,
        required: true
    },
    proId: {
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
    isPublic: {
        type: Boolean,
        default: true
    },
    visibleToFriendsOnly: {
        type: Boolean,
        default: false
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    reportedCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'hidden', 'reported'],
        default: 'active'
    }
});
ratingSchema.plugin(require("mongoose-findorcreate"));

const RatingModel = new mongoose.model("Rating", ratingSchema);

module.exports = RatingModel;