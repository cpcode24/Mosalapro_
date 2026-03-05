const { required } = require("joi");
const mongoose = require("mongoose");

// Rating data model
const onlineUserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    lastSeen:{
        type: Date,
        required: true
    }
});
onlineUserSchema.plugin(require("mongoose-findorcreate"));

const OnlineUserModel = new mongoose.model("OnlineUser", onlineUserSchema);

module.exports = OnlineUserModel;