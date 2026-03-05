const mongoose = require("mongoose");

// Service Request
const messageQuotationSchema = new mongoose.Schema({
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
    providerId: String,
    userId: String,
    budget: Number,
    budgetType: String,
    deadline: String,
    status: String,
    timeOfCompletion: String,
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },
});
messageQuotationSchema.plugin(require("mongoose-findorcreate"));

const MessageQuotationModel = mongoose.model("MessageQuotation", messageQuotationSchema);

module.exports = MessageQuotationModel;