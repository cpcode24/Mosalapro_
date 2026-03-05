const mongoose = require("mongoose");

const facebookFriendSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    friendUserId: {
        type: String,
        required: true
    },
    friendFacebookId: {
        type: String,
        required: true
    },
    friendName: {
        type: String,
        required: true
    },
    friendEmail: {
        type: String
    },
    friendPhoto: {
        type: String
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    lastUpdate: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
});

facebookFriendSchema.index({ userId: 1, friendUserId: 1 }, { unique: true });
facebookFriendSchema.plugin(require("mongoose-findorcreate"));

const FacebookFriendModel = mongoose.model("FacebookFriend", facebookFriendSchema);

module.exports = FacebookFriendModel;