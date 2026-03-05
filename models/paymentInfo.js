const mongoose = require("mongoose");

// Payment information
const invoiceSchema = new mongoose.Schema({
    userId: { type: String, require:true },
    cardNumber: {type: Number, require: true},
    expirationDate: {type: String, required: true},
    cvc:{
        type: Number,
        required: true
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
invoiceSchema.plugin(require("mongoose-findorcreate"));

const InvoiceModel = new mongoose.model("Invoice", invoiceSchema);

module.exports = InvoiceModel;