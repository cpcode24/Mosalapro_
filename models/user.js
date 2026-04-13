const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  facebook_id:{
    type: String,
    unique: true
  },
  google_id: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    min: 3,
    max: 45,
  },
  lastName: {
    type: String,
    min: 2,
    max: 45,
  },
  email: {
    type: String
  },
  username: String,
  phone: {
    type: String,
    min: 7,
    max: 15,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  verifiedContact: String,
  address: {
    type: String,
    required: false,
  },
  country: String,
  city: String,
  createdAt: {
    type: Date,
    required: true,
  },
  lastUpdate: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  payments: {
    type: Array
  },
  description: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "",
  },
  facebookProfileLink: String,
  linkedinProfileLink: String,
  countryCode: String,
  rate: {
    type: Number,
    default:"",
  },
  skills: {
    type: Array
  },
  favoriteProviders: {
    type: Array
  },
  accountType: {
    type: String,
    default: "user"
  },
  registeredAsPro:{
    type: Boolean,
    default: false
  },
  strictlyPro: {
    type: Boolean,
    default: false
  },
  twoFactAuth:{
    type: Boolean,
    default: false
  },
  rating:{
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  bkgUpdateNotifs: {
    type: Boolean,
    default: true
  },
  currency: {
      type: String,
      default:'USD',
      required: true
  },
  reqUpdateNotifs: {
    type: Boolean,
    default: true
  },
  msgUpdateNotifs: {
    type: Boolean,
    default: true
  },
  oppSMSNotifs: {
    type: Boolean,
    default: true
  },
  SMSUpdateNotifs: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    default: "",
  },
  photo: {
    type: String,
    default: "default.png",
  },
  subscriptionPlan: {
    type: String,
    default: ""
  },
  stripeCustomerId: {
    type: String,
    default: ""
  },
  subscriptionId: {
    type: String,
    default: ""
  },
  subscriptionStatus: {
    type: String,
    default: ""
  },
  facebookAccessToken: {
    type: String
  },
  facebookTokenExpires: {
    type: Date
  },
  allowFriendReviews: {
    type: Boolean,
    default: true
  },
  friendsSynced: {
    type: Boolean,
    default: false
  },
  lastFriendsSync: {
    type: Date
  },
  // Payout account information for providers
  stripeConnectAccountId: {
    type: String,
    default: ""
  },
  stripeConnectAccountVerified: {
    type: Boolean,
    default: false
  },
  paypalPayoutEmail: {
    type: String,
    default: ""
  },
  paypalPayoutVerified: {
    type: Boolean,
    default: false
  },
  preferredPayoutProvider: {
    type: String,
    enum: ['stripe', 'paypal', ''],
    default: ''
  }
});

userSchema.plugin(require("passport-local-mongoose"));
userSchema.plugin(require("mongoose-findorcreate"));

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
