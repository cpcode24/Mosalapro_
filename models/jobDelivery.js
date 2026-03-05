const mongoose = require("mongoose");

// Service Request
const jobDeliverySchema = new mongoose.Schema({
    jobId:{type: String, required: true},
    comment: String,
    revisionReason: String,
    file: String,
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    }
});
jobDeliverySchema.plugin(require("mongoose-findorcreate"));

const JobDeliveryModel = new mongoose.model("JobDelivery", jobDeliverySchema);

module.exports = JobDeliveryModel;