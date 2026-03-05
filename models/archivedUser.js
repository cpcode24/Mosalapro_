const mongoose = require("mongoose");

const archivedUserSchema = new mongoose.Schema({
  facebook_id:{
    type: String
  },
  google_id: {
    type: String
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
    type: String,
  },
  username: String,
  phone: {
    type: String,
    min: 7,
    max: 15,
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
  rating:{
    type: Number,
    default: 5
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
  }
});

archivedUserSchema.plugin(require("passport-local-mongoose"));
archivedUserSchema.plugin(require("mongoose-findorcreate"));

const ArchivedUserModel = mongoose.model("ArchivedUser", archivedUserSchema);

module.exports = ArchivedUserModel;
