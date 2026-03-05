const { required } = require("joi");
const mongoose = require("mongoose");

const currencyDailyRatesSchema = new mongoose.Schema({
  
 
  createdAt: {
    type: Date,
    required: true,
  },
  rateDate:{
    type: String,
    required: true,
    default:"00/00/2000"
  },
  lastUpdate: {
    type: Date,
    required: true,
  },
  rates: {
        type: Object,
  }
  
});

currencyDailyRatesSchema.plugin(require("passport-local-mongoose"));
currencyDailyRatesSchema.plugin(require("mongoose-findorcreate"));

const CurrencyDailyRatesModel = mongoose.model("CurrencyDailyRates", currencyDailyRatesSchema);

module.exports = CurrencyDailyRatesModel;
