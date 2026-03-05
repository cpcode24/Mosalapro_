const { required } = require("joi");
const mongoose = require("mongoose");

// Service Request
const quotationRequestSchema = new mongoose.Schema({
    username: { type: String, require:true },
    requestTitle:{
        type: String,
        required: true
    },
    requestDescription:{
        type: String,
        required: true
    },
    category: String,
    requestId: String,
    providerId : {
        type: String,
        required: true
    },
    deadline: String,
    file:{
        type: String
    },
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
    }
});
quotationRequestSchema.plugin(require("mongoose-findorcreate"));

const QuotationRequestModel = new mongoose.model("QuotationRequest", quotationRequestSchema);

module.exports = QuotationRequestModel;