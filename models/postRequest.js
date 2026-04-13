const { required } = require("joi");
const mongoose = require("mongoose");

// Service Request
const postRequestSchema = new mongoose.Schema({
    username: { type: String, require:true },
    requestTitle:{
        type: String,
        required: true
    },
    requestDescription:{
        type: String,
        required: true
    },
    requestCategory:{
        type: String,
        required: true
    },
    requestCategoryIcon:{
        type: String
    },
    providerId : String,
    quotationId: String,
    paymentMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        index: true
    },
    budget: Number,
    budgetType: {
        type: String,
        default: "Per project",
        required: true
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
    newDeadlineRequest: Object
});
postRequestSchema.plugin(require("mongoose-findorcreate"));

const PostRequestModel = new mongoose.model("PostRequest", postRequestSchema);

module.exports = PostRequestModel;