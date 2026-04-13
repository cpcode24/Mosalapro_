
/*********************************************************************************************************
*	Routes.js : Handles web app routing and url requests.
*   Author: Constant Pagoui.
*	Date: 03-22-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const NotificationModel = require(__dirname+"/../models/notification");
const Notification = require("../services/notification");
const Message = require("../services/message");
const messageHander = new Message();
const JobApplication = require("../services/jobApplication");
const jobApplicationHander = new JobApplication();
const UserService = require("../services/user");
const TimeHelper = require("../services/timeHelper");
const PostRequestModel = require("../models/postRequest");
const PaymentMethodModel = require("../models/paymentMethod");
const BookingModel = require("../models/booking");
const OnlineUserModel = require("../models/onlineUser");
const passport = require('passport');
const PostRequestService = require("../services/postrequest");
const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const _ = require("lodash");
const link = null;
const EmailSender = require("../services/emailsender");
const userEmailSender = new EmailSender();
const log4js = require("log4js");
const logger = log4js.getLogger();
const notificationObj = new Notification();
const TokenModel = require("../models/token");
const { Storage } = require("@google-cloud/storage");
const gcp_storage = new Storage({
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.GCP_STORAGE_KEY,
});

const bucket = gcp_storage.bucket(process.env.BUCKET_NAME);

const uploadToFirebaseStorage = async (filepath, storagepath) => {
    try {
        const gcs = gcp_storage.bucket(process.env.BUCKET_NAME); // Removed "gs://" from the bucket name
        const result = await gcs.upload(filepath, {
            destination: storagepath,
            predefinedAcl: 'publicReadWrite' // Set the file to be publicly readable
            // metadata: {
            //     contentType: "application/plain", // Adjust the content type as needed
            // }
        });
        return result[0].metadata.mediaLink;
    } catch (error) {
        logger.error("ROUTING:: Error occured while uploading file: "+error.message);
        //throw new Error(error.message);
    }
}


const storage = multer.diskStorage({
    
  destination: "uploads/",
  filename: function (req, file, callback) {
    crypto.randomBytes(16, async function (err, buf) {
      if (err) return callback(err);
      const randomString = buf.toString("hex");
      const extension = path.extname(file.originalname);
      const filename = randomString + extension;
      callback(null, filename);
    });
  }
  
});

const upload = multer({ storage: storage });

const multer_ = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    
});
const multerArray_ = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1024 * 1024 * 100, // Limit the file size to 100MB
    },
    fileFilter: function (req, file, cb) {
      cb(null, true); // Allow any type of file
    },
  });


categories = [];
const fs = require('fs');
const JobApplicationModel = require("../models/jobApplication");
const BookingService = require("../services/booking");
const QuotationService = require("../services/quotation");
const SearchTranslation = require("../services/searchTranslation");
const QuotationServiceObj = new QuotationService();
const NotificationObj = new Notification();
const UserModel = require("../models/user");
const QuotationModel = require("../models/quotation");
const QuotationRequestModel = require("../models/quotationRequest");
const MessageQuotationModel = require("../models/messageQuotation");
const JobDeliveryModel = require("../models/jobDelivery");
const RatingModel = require("../models/rating");
const CountryModel = require("../models/country");
const sharp = require('sharp');
const { time } = require("console");
const request = require('request');
const { default: axios } = require("axios");
const geoip = require('geoip-lite');
const TwilioPhoneAuthService = require("../services/twilioPhoneAuth");
const twilioService = new TwilioPhoneAuthService();
const ChatSupport = require("../services/chatSupport");
const chatSupport = new ChatSupport();

const categoriesToFrMap = new Map();
fs.readFile('./public/data/categories.json', 'utf8', (err, data) => {
  if (err) {
    logger.error('APP:: Error reading file from disk: '+err)
  } else {
    // parse JSON string to JSON object
    const cates = JSON.parse(data)

    // print all databases
    cates.forEach(kat => {
      //console.log(`${kat.name}: ${kat.icon}`);
      categories.push(kat);
      categoriesToFrMap.set(kat.name, kat.translations.fr.name);
      
      //console.log("CAT NAME: ",kat.name);
    });
    // Sort the categories in alphabetical order

    categories.sort((a, b) => {
        const nameA = a.translations.fr.name.toUpperCase(); // ignore upper and lowercase
        const nameB = b.translations.fr.name.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
      
        // names must be equal
        return 0;});
  }
});



let cities = [];
countries = [];
fs.readFile('./public/data/countries/countries.json', 'utf8', (err, data) => {
    if (err) {
      console.log('APP:: Error reading file from disk: '+err)
    } else {
      // parse JSON string to JSON object
      const kountries = JSON.parse(data);
      
      // print all databases
      kountries.forEach(ctry => {
       
        countries.push(ctry);
      });

    }
  });




module.exports = function(app){
    require("dotenv").config();
    const root = require('path').resolve('./');
    
app.get("/", async function(req, res){

        if(req.isAuthenticated()){
            const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
            if(userCountry){
                req.user.currency = userCountry.currency;
                req.user.currency_symbol = userCountry.currency_symbol;
            }
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            
            
            if(req.user.accountType=="provider"){
                app.locals.bg =  "bg-light-pro";
                const pRequests = await PostRequestModel.find({providerId:req.user._id}).sort({lastUpdate:-1}).exec();
                let bookings = await BookingModel.find({providerId:req.user._id}).sort({lastUpdate:-1}).exec();
                const countryInfo = await CountryModel.findOne({currency: req.user.currency}).exec();
                bookings.forEach(async b=>{
                    const usr = await UserModel.findOne({username: b.username}).exec();
                    if(usr)
                        b.usr = usr.firstName.concat(' ', usr.lastName);
                    else
                        b = " ";
                });
                let ja = await jobApplicationHander.getRecentAppliedJobs(req, res);
                await ja.forEach( j=>{
                    if(req.user.currency != j.currency){
                        const reqBudgetInUSD = j.currency != "USD" ? j.budget / global.rates?.rates[j.currency] : 
                                                                                                j.budget;
                        const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                        j.convCurr = "("+budgetInReqCurr+" "+countryInfo.currency_symbol+")";
                        
                    }
                    if(res.locals.locale === 'fr')
                        j.requestCategory = categoriesToFrMap.get(j.requestCategory);
                });
                res.render("providerDashboard", {usr: req.user, firstCor: 'none', currtab: 'dash', lang: res.locals.locale,
                     notifications: notifs, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
                     ja:ja, countries: countries, bookings: bookings, postRequests: pRequests});
            }
            else  {
                app.locals.bg = "bg-light-user";
                let pRequests = await UserService.getUserRequests(req, res);
                const favPros = req.user.favoriteProviders;
                const requestProviders = await UserService.getProviders();
                let favProviders = [];
                if(favPros.length > 0){
                    for(let i = 0; i < favPros.length; i++){
                        const pro = await UserModel.findById(favPros[i]).exec();
                        favProviders.push(pro);
                    }
                }
                await pRequests.forEach( r=>{
                    if(req.user.currency != r.currency){
                        const reqBudgetInUSD = r.currency != "USD" ? r.budget / global.rates?.rates[r.currency] : 
                                                                                                r.budget;
                        const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                        r.budget = budgetInReqCurr;
                    }
                });
                res.render("userDashboard", {usr: req.user, notifications: notifs, 
                     favProviders: favProviders,
                     firstCor: 'none', currtab: 'dash',
                     providers: requestProviders,
                     lang: res.locals.locale,
                     link: null, postRequests: pRequests, 
                     cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
                    countries: countries});
            }
        }
        else{
            const geo = geoip.lookup(req.ip);
            const userCountry = await CountryModel.findOne({iso2: geo?.country}).exec();
            let currency_ = "";
            let currency_sym = "";
            if(userCountry){
                currency_ = userCountry.currency;
                currency_sym = userCountry.currency_symbol;
            }
            const _50InReqCurr = global.rates != null ? parseFloat(50 * global.rates?.rates[currency_]).toFixed(2)  : 50.00;
            const _100InReqCurr = global.rates != null ? parseFloat(100 * global.rates?.rates[currency_]).toFixed(2): 100.00;
            const _250InReqCurr = global.rates != null ? parseFloat(250 * global.rates?.rates[currency_]).toFixed(2): 250.00;
            
            res.render("home", {usr: null, cats: categories, currtab: 'home', map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                firstCor: 'none', link: '/', recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries, lang: res.locals.locale,
                fifty: _50InReqCurr, hundred: _100InReqCurr, twofifty: _250InReqCurr, currency: currency_sym });
            }
    });

    // app.get("/payment", async function(req, res) {
    //     res.render("payment");
    // });
    app.get("/charge", async function(req, res) {
        res.send("charge");
    })

    app.post("/charge", async function(req, res) {
        if(req.isAuthenticated()) {
            // Input validation
            if (!req.body.plan || !req.body.cardNumber || !req.body.expiryMonth || 
                !req.body.expiryYear || !req.body.cvc) {
                return res.status(400).json({ error: 'Missing required payment information' });
            }

            // Validate reCAPTCHA
            if (!req.body['g-recaptcha-response']) {
                return res.status(400).json({ error: 'Please complete the reCAPTCHA verification' });
            }

            // Verify reCAPTCHA with Google
            const recaptchaResponse = req.body['g-recaptcha-response'];
            const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaResponse}`;
            
            try {
                const axios = require('axios');
                const recaptchaResult = await axios.post(recaptchaVerifyUrl);
                if (!recaptchaResult.data.success) {
                    return res.status(400).json({ error: 'reCAPTCHA verification failed' });
                }
            } catch (recaptchaError) {
                logger.error("reCAPTCHA verification error: " + recaptchaError.message);
                return res.status(400).json({ error: 'reCAPTCHA verification failed' });
            }

            try {
                let amount = 0;
                let priceLookupKey = "free_price";
                
                // Validate plan and set pricing
                switch(req.body.plan) {
                    case "bronze":
                        amount = 5000; // $50.00
                        priceLookupKey = "bronze_price";
                        break;
                    case "gold":
                        amount = 10000; // $100.00
                        priceLookupKey = "gold_price";
                        break;
                    case "platinum":
                        amount = 25000; // $250.00
                        priceLookupKey = "platinum_price";
                        break;
                    default:
                        return res.status(400).json({ error: 'Invalid subscription plan' });
                }
                
                const user = await UserModel.findOne({_id: req.user._id}).exec();
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Find or create Stripe customer
                let stripeCustomer;
                const existingCustomers = await stripe.customers.search({
                    query: `email:"${user.email}"`
                });

                if (existingCustomers.data.length > 0) {
                    stripeCustomer = existingCustomers.data[0];
                } else {
                    // Create new customer
                    stripeCustomer = await stripe.customers.create({
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        metadata: {
                            userId: user._id.toString()
                        }
                    });
                }

                // Create Payment Method using modern Stripe API
                const paymentMethod = await stripe.paymentMethods.create({
                    type: 'card',
                    card: {
                        number: req.body.cardNumber.replace(/\s/g, ''), // Remove spaces
                        exp_month: parseInt(req.body.expiryMonth),
                        exp_year: parseInt(req.body.expiryYear),
                        cvc: req.body.cvc
                    }
                });

                // Attach payment method to customer
                await stripe.paymentMethods.attach(paymentMethod.id, {
                    customer: stripeCustomer.id
                });

                // Create or update subscription
                const subscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomer.id,
                    status: 'active'
                });

                const subPrices = await stripe.prices.search({
                    query: `lookup_key:"${priceLookupKey}"`
                });

                if (subPrices.data.length === 0) {
                    return res.status(400).json({ error: 'Subscription plan not found' });
                }

                const subPriceId = subPrices.data[0].id;

                let subscription;
                if (subscriptions.data.length > 0) {
                    // Update existing subscription
                    const existingSub = subscriptions.data[0];
                    subscription = await stripe.subscriptions.update(existingSub.id, {
                        default_payment_method: paymentMethod.id,
                        proration_behavior: 'create_prorations',
                        items: [{
                            id: existingSub.items.data[0].id,
                            price: subPriceId,
                        }],
                    });
                } else {
                    // Create new subscription
                    subscription = await stripe.subscriptions.create({
                        customer: stripeCustomer.id,
                        items: [{ price: subPriceId }],
                        default_payment_method: paymentMethod.id,
                        expand: ['latest_invoice.payment_intent'],
                    });
                }

                // Update user subscription in database
                await UserModel.findByIdAndUpdate(req.user._id, {
                    subscriptionPlan: req.body.plan,
                    stripeCustomerId: stripeCustomer.id,
                    subscriptionId: subscription.id,
                    subscriptionStatus: subscription.status
                });

                logger.info(`Payment successful for user ${user.email}, plan: ${req.body.plan}`);
                res.json({ 
                    success: true, 
                    message: 'Payment processed successfully',
                    redirectUrl: '/p-profile'
                });

            } catch(err) {
                logger.error("Payment processing error: " + err.message);
                
                // Handle specific Stripe errors
                if (err.type === 'StripeCardError') {
                    return res.status(400).json({ error: 'Your card was declined: ' + err.message });
                } else if (err.type === 'StripeInvalidRequestError') {
                    return res.status(400).json({ error: 'Invalid payment information: ' + err.message });
                } else {
                    return res.status(500).json({ error: 'Payment processing failed. Please try again.' });
                }
            }
        } else {
            res.status(401).json({ error: 'Authentication required' });
        }
    })

    app.get("/notifications", async function(req, res){

        if (req.isAuthenticated()) {
            app.locals.bg =  req.user.accountType == 'user' ? "bg-light-user" : "bg-light-pro";
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                if(req.user.accountType == 'provider'){
                    const bookings = await BookingModel.find({providerId: req.user._id}).exec();
                    for(let i = 0; i < notifs.length; i++){
                        bookings.forEach(b=>{
                            if(b.jobId === notifs[i].causedByItem){
                                notifs[i].bookingId = b._id;
                            }
                        });
                    }
                    
                }
                let loadNotifs_ = await NotificationModel.find({receiverId: req.user._id}).sort({lastUpdate: -1}).limit(4).exec();
                res.render("notifications", {
                usr: req.user,
                firstCor: 'none', currtab: 'dash',
                lang: res.locals.locale,
                cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                notifications: notifs,
                countries: countries,
                loadNotifs: loadNotifs_,
                link: null
                });
            }
            catch(error){
                console.log("ROUTES:: Error occured while loading notifications: "+error);
                res.redirect("/");
            }
          } else {
            res.redirect("/");
          }
    });
    app.post("/notifications", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const loadNotifs_ = await NotificationModel.find({receiverId: req.user._id,  status: req.body.status}).sort({lastUpdate: -1}).limit(req.body.lim).exec();
                ages_ = [];
                if(req.user.accountType == 'provider'){
                    const bookings = await BookingModel.find({providerId: req.user._id}).exec();
                    for(let i = 0; i < notifs.length; i++){
                        bookings.forEach(b=>{
                            if(b.jobId === notifs[i].causedByItem){
                                notifs[i].bookingId = b._id;
                            }
                        });
                    }

                    for(let i = 0; i < loadNotifs_.length; i++){
                        ages_.push(TimeHelper.getShortTimeAgo(loadNotifs_[i].createdAt));
                        let bkId = "";
                        bookings.forEach(b=>{
                            if(b.jobId === loadNotifs_[i].causedByItem){
                                bkId= b._id;
                            }
                        });
                        loadNotifs_[i].bookingId = bkId;
                    }

                }
                else{
                    loadNotifs_.forEach(not =>{
                        ages_.push(TimeHelper.getShortTimeAgo(not.createdAt));
                    });
                }
                // console.log("Notifications loaded: "+notifs.length);
                res.status(200).send({message:"Ok", status:200, notifications:notifs, loadNotifs: loadNotifs_, ages: ages_, accType: req.user.accountType});
                return;
            }catch(error){
                // console.log("Error occured while loading notifications: "+error);
            }
        }else{
            res.redirect("/");
        }

    });

    app.get("/notification", async function(req, res){
        if(req.isAuthenticated()){
            try{
                if(req.user.accountType == "user") {
                    const postReqCompleted = await PostRequestModel.find({providerId: req.query?.p}).exec();
                    const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                    const notifi = await NotificationModel.findOne({_id: req.query?.n});
                    const provider = await UserModel.findOne({_id: req.query?.p}).exec();
                    const job_ = await PostRequestModel.findOne({_id: notifi.causedByItem}).exec();
                    const checkBooking_ = await BookingModel.findOne({jobId: notifi.causedByItem}).exec();
                    if(provider) provider.photo = provider.photo.includes("https://")  ? provider.photo : ("/photo/"+provider.photo);
                    //console.log("checkbooking: "+checkBooking_);
                    res.render("notificationDetails", {pro: provider, notifi: notifi,
                        postRequestsCompleted: postReqCompleted.length,
                        job: job_,
                        firstCor: 'none', currtab: 'dash',
                        lang: res.locals.locale,
                        usr: req.user, notifications: notifs,
                        link: null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                        checkBooking: checkBooking_,
                        map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                        countries: countries} );
                }
                else{

                }

            }catch(error){
                logger.error("Error occured while fetching notification: "+error);
            }
        }
        else{
            res.redirect("/");
        }
    });

    app.post("/read-notif", async function(req, res){

        if(req.isAuthenticated()){
            try{
                if(notificationObj.readNotification(req, res))
                    logger.info("Notification read with success!");
                else    
                    logger.error("Error occured while reading notification.");
            }catch(error){
                logger.error("Error occured while loading notifications: "+error);
            }
        }else{
            res.redirect("/");
        }

    });

    app.get("/applicant", async function(req, res){
        if(req.isAuthenticated() && req.query?.p ){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const postReqCompleted = await BookingModel.find({providerId: req.query?.p, status: {$in: ['completed', 'accepted', 'accepted & rated']}}).exec();
                const provider = await UserModel.findById(req.query?.p).exec();
                const ja = await JobApplicationModel.findOne({providerId: req.query?.p, jobId: req.query?.j}).exec();
                const job_ = await PostRequestModel.findById(req.query?.j).exec();
                const checkBooking_ = await BookingModel.findOne({jobId: req.query?.j}).exec();
                const quotation = await QuotationModel.findOne({jobId: req.query?.j, providerId: req.query?.p, status:"sent"});
                const ratings = await RatingModel.find({proId: provider._id }).exec();
                var ratingSum = 0; var ratingCount = 0;
                ratings.forEach(r=>{
                    ratingSum += r.rating;
                    ratingCount += 1;
                });
                if(ratingSum > 0)
                    provider.rating = ratingSum / ratingCount;
                provider.ratingCount = ratingCount;
                if(provider) provider.photo =  provider.photo.includes("https://")  ? provider.photo : ("/photo/"+provider.photo);
                res.render("applicantProfile", {
                    pro: provider, 
                    job: job_, currtab: 'dash',
                    lang: res.locals.locale,
                    usr: req.user, notifications: notifs,
                    postRequestsCompleted: postReqCompleted.length,
                    checkBooking: checkBooking_,
                    firstCor: 'none',
                    jobAppli: ja,
                    link: null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
                    countries: countries,
                    quotation: quotation,
                } );

            }catch(error){logger.error("Error occured while loading notifications: "+error); }
        }else{
            res.redirect("/");
        }
    }); 

    app.get("/applications", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider"){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const allApplications = await jobApplicationHander.getAppliedJobs(req, res);
                let ja = [];
                const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
                if(userCountry){
                    req.user.currency = userCountry.currency;
                    req.user.currency_symbol = userCountry.currency_symbol;
                }
                allApplications.forEach(app=>{
                    if(app.appStatus == "applied" && app.status === 'active'){
                        if(req.user.currency != app.currency){
                            const reqBudgetInUSD = app.currency != "USD" ? app.budget / global.rates?.rates[app.currency] : 
                                                                                                        app.budget;
                            const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                            app.convCurr = "("+budgetInReqCurr+" "+req.user.currency_symbol+")";
                        }
                        ja.push(app);
                    }
                });
                let uniqJAs = [];
                let ids = {};
                ja.forEach(obj => {
                    if (!ids[obj._id]) {
                        ids[obj._id] = true;
                        uniqJAs.push(obj);
                    }
                });

                res.render("manageJobApplications", {usr: req.user, firstCor: 'none',currtab: 'dash', lang: res.locals.locale, notifications: notifs, allApp: allApplications, ja: uniqJAs, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
                }catch(error){
                    console.log("ROUTES:: /application - Error occured: "+error);
                    res.redirect("/");
                }
        }else{
            res.redirect("/")
        }
    });

    app.get("/get-applications", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const allApplications = await jobApplicationHander.getAppliedJobs(req, res);

                let convCurrs = [];
                let ids = [];
                let uniqJAs = [];

                const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
                if(userCountry){
                    req.user.currency = userCountry.currency;
                    req.user.currency_symbol = userCountry.currency_symbol;
                }
                const limit = parseInt(req.query.lim) || 6;
                const skip = parseInt(req.query.skip) || 0;
                const type = req.query.type || 'active';
                const status__ = type == 'active'? "applied":type;

                allApplications.forEach(app=>{
                    let convCurr = " ";
                    if(req.user.currency != app.currency){
                        const reqBudgetInUSD = app.currency != "USD" ? app.budget / global.rates?.rates[app.currency] : 
                                                                                                        app.budget;
                        const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                        convCurr = "("+budgetInReqCurr+" "+req.user.currency_symbol+")";
                    }

                    if(status__ == "all"){
                        if (!ids[app._id]) {
                            ids[app._id] = true;
                            uniqJAs.push(app);
                            convCurrs.push(convCurr);
                        }
                    }
                    else if(status__ != 'cancelled' && app.appStatus === status__){
                            if (!ids[app._id]) {
                                ids[app._id] = true;
                                uniqJAs.push(app);
                                convCurrs.push(convCurr);
                            }
                        }
                    else if(app.appStatus == 'applied' && app.status == status__){
                        if (!ids[app._id]) {
                            ids[app._id] = true;
                            uniqJAs.push(app);
                            convCurrs.push(convCurr);
                        }
                    }
                    
                });

                // Apply pagination
                const totalCount = uniqJAs.length;
                const paginatedApplications = uniqJAs.slice(skip, skip + limit);
                const paginatedConvCurrs = convCurrs.slice(skip, skip + limit);
                
                // Calculate pagination metadata
                const hasMore = skip + limit < totalCount;
                const nextSkip = hasMore ? skip + limit : null;
                
                res.json({
                    uniqJAs: paginatedApplications,
                    convCurrs: paginatedConvCurrs,
                    pagination: {
                        total: totalCount,
                        limit: limit,
                        skip: skip,
                        hasMore: hasMore,
                        nextSkip: nextSkip,
                        currentPage: Math.floor(skip / limit) + 1,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                });
            }catch(error) {
                logger.error("Error occured: "+error);
                res.redirect("/")
            };
        }else
            res.redirect("/");

    });

    app.post("/quotation", async function(req, res) {
        if(req.isAuthenticated()){
            try{
                await QuotationServiceObj.send(req, res);
            }
            catch(err){
                logger.error("ROUTE:: /quotation - Error occured: "+err);
            }
        }
    });

    app.post("/quotation-request", multer_.single("file"), async function(req, res) {
        if(req.isAuthenticated()){
            console.log("ROUTE:: /quotation-request file: ", req.file?.filename);
            try{
                if(req.file){
                    console.log("ROUTE:: /quotation-request - file found!");
                    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
                    if (req.file.size > maxSizeInBytes) {
                        console.log('File size exceeds the limit of 10MB.');
                        return;
                    }
                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                    const blob = bucket.file(req.file.originalname);
                    const blobStream = await blob.createWriteStream();
                    blobStream.on("finish", async()=>{
                        // renaming the img and moving it to uploads
                        await bucket.file(req.file.originalname).move("postAttachments/"+filename).then(() => {
                            // console.log(`File name was renamed to ${filename}.`);
                        }).catch(err => {
                            logger.error('ROUTING:: Completing booking - Error renaming file:', err);
                        });
                        // console.log("Successfully uploaded img to bucket.");
                        return; 
                    });
    
                    await blobStream.end(req.file.buffer);
                    req.file.filename = filename;
                }else console.log("No file attached.");
                QuotationServiceObj.sendQuotationRequest(req, res);
                console.log("ROUTER:: /quotation-request - request successfully sent!");
            }
            catch(err){
                // console.log("ROUTE:: /quotation-request - Error occured: "+err);
            }
        }
    });

    app.post("/delete-notif", async function(req, res){
        if(req.isAuthenticated()){
            try{
                if(notificationObj.deleteNotification(req, res))
                    logger.info("Notification deleted with success!");
                else    
                    logger.error("Error occured while deleting notification.");
            }catch(error){
                logger.error("Error occured while loading notifications: "+error);
            }
        }
    });
    app.post("/hire-pro", async function(req, res) {
        if(req.isAuthenticated()){
            try{
                UserService.hireProvider(req, res);
            }
            catch(error){
                // console.log("Error occured hire-pro: "+error);
            }
        }else
            res.redirect("/");
    });
    app.post("/reject-pro", async function(req, res){
        if(req.isAuthenticated()){
            try{
                UserService.rejectApplication(req, res);
            }
            catch(error){
                logger.error("Error occured reject-pro: "+error);
            }
        }
    });

    app.get("/user", async function(req, res){
        
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const postReqCompleted = await BookingModel.find({providerId: req.user._id, status: {$in: ['completed', 'accepted', 'accepted & rated']}}).exec();
            
            const ratings = await RatingModel.find({proId: req.user._id }).exec();
            const subName = "Free";
            var ratingSum = 0; var ratingCount = 0;
            ratings.forEach(r=>{
                ratingSum += r.rating;
                ratingCount += 1;
            });
            if(ratingSum > 0)
                req.user.rating = ratingSum / ratingCount;
            req.user.ratingCount = ratingCount;
            let timeZone = "time";
            for(let ctry of countries){
                if(ctry.name == req.user.country){
                    timeZone = ctry.timezones[0].tzName + " ("+ctry.timezones[0].gmtOffsetName+")";
                    break;
                }
            }
            res.render("user", {
              usr: req.user,
              jobsCompleted: postReqCompleted.length,
              firstCor: 'none',currtab: 'dash',
              lang: res.locals.locale,
              subName: subName,
              cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,
              notifications: notifs,
              countries: countries,
              tz: timeZone,
              map_api_key: process.env.GOOGLE_MAPS_API_KEY,
              link: null
            });
          } else {
            res.redirect("/");
        }
    });

    app.get("/user-edit", async function(req, res){
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const geo = geoip.lookup(req.ip);
            const subName = "Free";
            res.render("userEdit", {
              usr: req.user,currtab: 'dash',
              firstCor: 'none',
              lang: res.locals.locale,
              cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,
              countries: countries,
              subName: subName,
              user_loc_data: geo,
              notifications: notifs,
              map_api_key: process.env.GOOGLE_MAPS_API_KEY,
              link:null
            });
          } else {
            res.redirect("/");
          }
    });

    app.get('/join-mosalapro', async(req, res)=>{
        if (!req.isAuthenticated()) {
            
            const geo = geoip.lookup(req.ip);
            const subName = "Free";
            res.render("signup", {
              usr: req.user,
              lang: res.locals.locale,
              currtab: 'signup',
              page: 'signup',
              firstCor: 'none',
              cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,
              countries: countries,
              subName: subName,
              user_loc_data: geo,
              notifications: null,
              map_api_key: process.env.GOOGLE_MAPS_API_KEY,
              link:null
            });
          } else {
            res.redirect("/");
          }

    });

    app.get('/login', async(req, res)=>{
        if (!req.isAuthenticated()) {
            
            const geo = geoip.lookup(req.ip);
            const subName = "Free";
            res.render("connection", {
              usr: req.user,
              currtab: 'login',
              page: 'login',
              firstCor: 'none',
              lang: res.locals.locale,
              cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,
              countries: countries,
              subName: subName,
              user_loc_data: geo,
              notifications: null,
              map_api_key: process.env.GOOGLE_MAPS_API_KEY,
              link:null
            });
          } else {
            res.redirect("/");
          }

    });
    // app.post("/user-edit", upload.single("photo"), async function (req, res) {
    app.post("/user-edit", multer_.single("photo"), async function(req, res){
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            try{
                if(req.file){
                    // console.log("File found!");
                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                    const blob = bucket.file(req.file.originalname);
                    const blobStream = blob.createWriteStream();
                    blobStream.on("finish", async ()=>{
                        // renaming the img and moving it to uploads
                        await bucket.file(req.file.originalname).move("uploads/"+filename).then(() => {
                            // console.log(`File name was renamed to ${filename}.`);
                        }).catch(err => {
                            // console.error('Error renaming file:', err);
                        });
                        // console.log("Successfully uploaded img to bucket.");
                        return; 
                    });
                    
                    blobStream.end(req.file.buffer);
                    req.body.photo = filename;
                }
            }catch(error){ logger.info("Error occured, file not found/valid: "+error.message);}
          if (UserService.update({ _id: req.user._id, registeredAsPro: true, ...req.body })) {
            res.redirect("/user");
          } else {
            res.redirect("/user-edit", { notifications: notifs, link: null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID,map_api_key: process.env.GOOGLE_MAPS_API_KEY });
          }
        } else {
          res.redirect("/");
        }
    });

    app.get("/switch-account", async function(req, res){
        if (req.isAuthenticated()) {
            app.locals.bg =  req.user.accountType == 'user' ? "bg-light-pro" : "bg-light-user";
            if(!req.user.strictlyPro && req.user.registeredAsPro)
                await UserService.switchAccountType(req.user._id);
            res.redirect('/');
        } else {
            console.log("ROUTING:: can't switch, user is not authenticated!");
            res.status(401).send();
            res.redirect('/');
        }
    });

    app.get("/user/:id/online-status", async function (res, res) {
        if (req.isAuthenticated()) {
            res.status(200).send({result: await Message.checkIfUserOnline(req.user._id)});
        } else {
            res.status(401).send();
        }
    });

    app.post("/user/online-status", async function (req, res) {
        if (req.isAuthenticated()) {
            await messageHander.setUserOnline(req.user._id);
            res.status(200).send();
            return;
        } else {
            res.status(401).send();
            return;
        }
    });

    app.get("/user/has-payment", async function (req, res) {
        if (req.isAuthenticated()) {

            const user = await UserModel.findOne({_id: req.user._id}).exec();
            const stripeCustomer = await stripe.customers.search({
                query: `email:"${user.email}"`
            });
        
            if ( stripeCustomer && stripeCustomer.data && stripeCustomer.data.length > 0 && stripeCustomer.data[0].invoice_settings.default_payment_method){
                res.status(200).send({status: true});
            } else {
                res.status(200).send({status: false});
            }
        } else {
            res.status(401).send();
        }
    });

    app.post("/user/payment", async function (req, res) {
        if (req.isAuthenticated()) {
            try {
                const result = await UserService.updatePaymentMethod(req);

                // Check if this is new payment service format (returns object with status)
                if (result && typeof result === 'object' && result.status) {
                    return res.status(result.status).json(result);
                }

                // Check if this is a save payment method request (AJAX)
                if (req.body.save_payment_method || req.body.provider) {
                    res.status(200).json({ success: true, status: 200, message: 'Payment method saved successfully' });
                } else {
                    res.redirect('/p-profile');
                }
            } catch (error) {
                console.error('Error saving payment method:', error);

                if (req.body.save_payment_method || req.body.provider) {
                    res.status(400).json({ success: false, status: 400, message: error.message });
                } else {
                    res.status(500).send('Error saving payment method');
                }
            }
        } else {
            if (req.body.save_payment_method || req.body.provider) {
                res.status(401).json({ success: false, status: 401, message: 'Not authenticated' });
            } else {
                res.status(401).send();
            }
        }
    });

    /**
     * Get user's payment methods
     * GET /payment-methods
     */
    app.get('/payment-methods', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        try {
            const userId = req.user._id;
            const paymentMethods = await PaymentMethodModel.getActiveForUser(userId);
    
            const methods = paymentMethods.map(pm => ({
                id: pm._id,
                displayName: pm.displayName,
                type: pm.type,
                provider: pm.provider,
                isDefault: pm.isDefault,
                isExpired: pm.cardExpiryYear < new Date().getFullYear() || (pm.cardExpiryYear === new Date().getFullYear() && pm.cardExpiryMonth < new Date().getMonth() + 1),
                cardExpiryMonth: pm.cardExpiryMonth,
                cardExpiryYear: pm.cardExpiryYear,
                cardLast4: pm.cardLast4,
                cardBrand: pm.cardBrand,
                lastUsedAt: pm.lastUsedAt,
                createdAt: pm.createdAt
            }));
            res.json({ success: true, paymentMethods: methods });

        } catch (error) {
            console.log('Error fetching payment methods:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * Set default payment method
     * POST /set-default-payment-method/:id
     */
    app.post('/set-default-payment-method/:id', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        try {
            const userId = req.user._id;
            const paymentMethodId = req.params.id;

            const paymentMethod = await PaymentMethodModel.findOne({
                _id: paymentMethodId,
                userId,
                isActive: true
            });

            if (!paymentMethod) {
                return res.status(404).json({ success: false, message: 'Payment method not found' });
            }

            await paymentMethod.setAsDefault();

            res.json({ success: true, message: 'Default payment method updated' });

        } catch (error) {
            console.error('Error setting default payment method:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * Delete payment method
     * DELETE /delete-payment-method/:id
     */
    app.delete('/delete-payment-method/:id', async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }
        try {
            const userId = req.user._id;
            const paymentMethodId = req.params.id;

            const paymentMethod = await PaymentMethodModel.findOne({
                _id: paymentMethodId,
                userId
            });

            if (!paymentMethod) {
                return res.status(404).json({ success: false, message: 'Payment method not found' });
            }

            // Soft delete
            await paymentMethod.softDelete();

            res.json({ success: true, message: 'Payment method deleted successfully' });

        } catch (error) {
            console.error('Error deleting payment method:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });


    // PayPal vault setup token creation
    app.post("/paypal/create-setup-token", async function (req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        try {
            const paymentService = require('../services/paymentService');
            const setupToken = await paymentService.createPayPalSetupToken(req.user);

            res.status(200).json({ id: setupToken.id, status: setupToken.status });
        } catch (error) {
            console.error('Error creating PayPal setup token:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Save PayPal payment token after user approval
    app.post("/paypal/save-payment-token", async function (req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ success: false, status: 401, message: 'Not authenticated' });
        }

        try {
            const { vaultSetupToken } = req.body;

            if (!vaultSetupToken) {
                return res.status(400).json({ success: false, status: 400, message: 'Vault setup token is required' });
            }

            const paymentService = require('../services/paymentService');
            const paymentMethod = await paymentService.savePayPalVaultToken(req.user._id, vaultSetupToken, {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                status: 200,
                message: 'PayPal account linked successfully',
                paymentMethod: paymentMethod
            });
        } catch (error) {
            console.error('Error saving PayPal payment token:', error);
            res.status(500).json({ success: false, status: 500, message: error.message });
        }
    });

    app.get("/user/online-status", async function (req, res) {
        const data = await messageHander.getOnlineUsers();

        res.status(200).send(data);
    });

    app.post("/update-sr", async function(req, res){
        if(req.isAuthenticated()){
            try{
                if(req.file){
                    // console.log("File found: "+req.file.originalname);
                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                    const blob = bucket.file(req.file.originalname);
                    const blobStream = blob.createWriteStream();
                    blobStream.on("finish", async ()=>{
                        // console.log("Successfully uploaded file to bucket.");
                        // renaming the img and moving it to uploads
                        await bucket.file(req.file.originalname).move("postAttachments/"+filename).then(() => {
                            // console.log(`File name was renamed to ${filename}.`);
                            //return;
                        }).catch(err => {
                            // console.error('Error renaming file:', err);
                        });
                        return; 
                    });

                    blobStream.end(req.file.buffer);
                    req.file.filename = filename;
                }else{
                    // console.log("ROUTER:: No file found.");
                }

                PostRequestService.updateServiceRequest(req, res);
            }catch(error){}
            
        }
        else    
            res.redirect("/");
    })
    
    app.post("/register-user", async (req, res) => {
        app.locals.bg =  "bg-light-user" ;
        UserService.register(req, res);
    });

    app.get("/register-user", function(req, res){
        if(req.isAuthenticated())
            res.render("/");
        else
            res.render("emailVerification", {usr: null, link:null, firstCor: 'none', currtab: 'home', lang: res.locals.locale, cats: categories, map_api_key: process.env.GOOGLE_MAPS_API_KEY,
        recaptchaKey: process.env.RECAPTCHA_KEY_ID, userId: req.body.id,  form_action: "/verify-u-email", redirect_link:"/" });
    });

    app.get("/pass-recovery", function(req, res){
        if(req.isAuthenticated())
            res.redirect("/");
        else
            res.render("passRecovery", {usr: null, link:null, firstCor: 'none', currtab: 'home', 
            lang: res.locals.locale, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, userId: req.body.id, form_action: "/verify-u-email" });
    });
    app.post("/recover-pass", async (req, res) =>{
        if(req.isAuthenticated())
            return;
        UserService.sendVerificationCode(req, res);
    });
    app.get("/recover-pass/:userId/:method", async (req, res) =>{
        if(req.isAuthenticated() || !req.params.userId)
            res.render("/");
        else{
            const unverifiedUser = await UserModel.findById(req.params.userId).exec();
            let email = "";
            if(unverifiedUser){
                if(req.params.method && req.params.method === "phone" ){
                    let phone = unverifiedUser.phone.substr(0,3);
                    for(let i = 3; i < unverifiedUser.phone.length-2; i++){
                        phone = phone + "*";
                    }
                    email = phone;
                }else{
                    email = unverifiedUser.email.substr(0,2);
                    const atIndex = unverifiedUser.email.indexOf('@');
                    for(let i = 2; i < atIndex; i++){
                        email = email + "*";
                    }
                    email = email + unverifiedUser.email.substr(atIndex, unverifiedUser.email.length-1);
                }
            }
            
            req.params.redirect_link = "/change-pass";
            res.render("emailVerification", {usr: null, map_api_key: process.env.GOOGLE_MAPS_API_KEY, lang: res.locals.locale,
                currtab: 'dash', link:null, currtab: 'home', firstCor: 'none', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, userId: req.params.userId, email: email, redirect_link:"/change-pass", link:"/change-pass" });
        }
    });

    app.get("/service-requests", async function(req, res){
        
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const jobRequests = await PostRequestService.getActiveRequests(req, res);
            const jobByProCat = jobRequests.filter(jr=> jr.requestCategory == req.user.category);
            const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
            if(userCountry){
                req.user.currency = userCountry.currency;
                req.user.currency_name = userCountry.currency_name;
                req.user.currency_symbol = userCountry.currency_symbol;
            }
            let convCurrs = [];
            await jobByProCat.forEach( r=>{
                let convCurr = " ";
                if(req.user.currency != r.currency){
                    const reqBudgetInUSD = r.currency != "USD" ? r.budget / global.rates?.rates[r.currency] : r.budget;
                    const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                    convCurr = "("+budgetInReqCurr+" "+req.user.currency_symbol+")";
                }
                convCurrs.push(convCurr);
                if(res.locals.locale === 'fr'){
                    r.requestCategory = categoriesToFrMap.get(r.requestCategory) || r.requestCategory;
                    r.budgetType = (r.budgetType === 'Per project' ? 'Par projet' :  'Par heure') || r.budgetType;

                }
             });
            
            res.render("jobRequests", {notifications: notifs, map_api_key: process.env.GOOGLE_MAPS_API_KEY, lang: res.locals.locale,
                usr: req.user, currtab: 'requests',firstCor: 'none', convCurrs: convCurrs, jobs: jobByProCat, link:null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
        }
        else{
            res.redirect("/");
        }
    });
    app.get("/get-service-requests", async function (req, res) {
        const limit = parseInt(req.query.lim) || 12;
        const skip = parseInt(req.query.skip) || 0;
        const category = req.query.category;
        
        let result = await PostRequestService.find(req);
        
        const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
        if(userCountry){
            req.user.currency = userCountry.currency;
            req.user.currency_name = userCountry.currency_name;
            req.user.currency_symbol = userCountry.currency_symbol;
        }

        // Apply pagination
        const totalCount = result.length;
        const paginatedResult = result.slice(skip, skip + limit);
        let convCurrs = [];

        await paginatedResult.forEach( r=>{
            let convCurr = " ";
            if(req.user.currency != r.currency){
                const reqBudgetInUSD = r.currency != "USD" ? r.budget / global.rates?.rates[r.currency] : r.budget;
                const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                convCurr = "("+budgetInReqCurr+" "+req.user.currency_symbol+")";
            }
            convCurrs.push(convCurr);
            if(res.locals.locale === 'fr'){
                r.requestCategory = categoriesToFrMap.get(r.requestCategory) || r.requestCategory;
                r.budgetType = (r.budgetType === 'Per project' ? 'Par projet' :  'Par heure') || r.budgetType;
            }
        });

        // Calculate pagination metadata
        const hasMore = skip + limit < totalCount;
        const nextSkip = hasMore ? skip + limit : null;

        res.json({
            result: paginatedResult,
            lang: res.locals.locale,
            convCurrs: convCurrs,
            pagination: {
                total: totalCount,
                limit: limit,
                skip: skip,
                hasMore: hasMore,
                nextSkip: nextSkip,
                currentPage: Math.floor(skip / limit) + 1,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    });

    app.post("/login-u", passport.authenticate('local', { failureRedirect: '#', failureFlash: true }),
        async function(req, res) {
            app.locals.bg =  req.user.accountType == 'user' ? "bg-light-user" : "bg-light-pro";
            UserService.login(req, res);
    });

    app.post('/enable-two-fact-auth', async function(req, res){
        UserService.setTwoFactorsAuth(req, res);
    });

    app.post('/set-req-update-notifs', async function(req, res){
        UserService.setReqUpdateNotifs(req, res);
    });

    app.post('/set-msg-update-notifs', async function(req, res){
        UserService.setMsgUpdateNotifs(req, res);
    });

    app.post('/set-sms-opp-notifs', async(req, res)=>{
        UserService.setOppSMSNotifsNotifs(req, res);
    })

    app.post('/set-sms-update-notifs', async (req, res)=>{
        UserService.setSMSUpdateNotifs(req, res);
    })

    app.post('/set-bkg-update-notifs', async function(req, res){
        UserService.setBkgUpdateNotifs(req, res);
    });

    app.post('/update-skills', async function(req, res){
        if(req.isAuthenticated())
            UserService.updateSkills(req, res);
        else
            res.redirect("/");
    });

    app.get("/professionals", async function(req, res){
        const geo = geoip.lookup(req.ip);
        const userCountry = await CountryModel.findOne({iso2: geo?.country}).exec();
        let currency_ = "";
        let currency_sym = "";
        if(userCountry){
            currency_ = userCountry.currency;
            currency_sym = userCountry.currency_symbol;
        }
            //console.log("HOME:: ", currency);
        const _50InReqCurr = global.rates != null ? parseFloat(50 * global.rates?.rates[currency_]).toFixed(2) : 50.00;
        const _100InReqCurr = global.rates != null ? parseFloat(100 * global.rates?.rates[currency_]).toFixed(2) : 100.00;
        const _250InReqCurr = global.rates != null ? parseFloat(250 * global.rates?.rates[currency_]).toFixed(2) : 250.00;

        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("forProfessionals", {usr: req.user, notifications: notifs, firstCor: 'none', link: req.link, currtab: 'pros',
                                            cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries,
                                            lang: res.locals.locale,
                                            currency: currency_sym, fifty: _50InReqCurr, hundred: _100InReqCurr, twofifty: _250InReqCurr});
        }
        else
            res.render("forProfessionals", {usr: null, link:'/professionals', currtab: 'pros', firstCor: 'none', cats: categories, 
                                            lang: res.locals.locale,
                                            recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries, map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                                            currency: currency_sym, fifty: _50InReqCurr, hundred: _100InReqCurr, twofifty: _250InReqCurr });
    });

    app.get("/find-services", async function(req, res){
        var result = [];
        var totalResults = 0;
        var usr_ = null;
        var notifs = null;
        var link_ = null;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // Use UserService.find method for consistent filtering and pagination
        const searchQuery = {
            selected_category: req.query.selected_category || "",
            country_search: req.query.country_search || "",
            city_search: req.query.city_search || "", 
            search: req.query.search || "",
            page: page
        };

        if(req.isAuthenticated()){
            usr_ = req.user;
            link_ = req.link;
            notifs = await NotificationModel.find({receiverId: req.user._id}).sort({lastUpdate:-1}).exec();
            
            // Get total count for pagination calculation
            const allResults = await UserService.find({
                ...searchQuery,
                page: 1
            }, req.user._id);
            totalResults = await UserModel.countDocuments({
                username: {$ne: req.user.username}, 
                registeredAsPro: true,
                verified: true
            });
            
            // Get paginated results
            result = await UserService.find(searchQuery, req.user._id);
        }
        else{
            // Get total count for pagination calculation
            totalResults = await UserModel.countDocuments({
                registeredAsPro: true,
                verified: true
            });
            
            // Get paginated results
            result = await UserService.find(searchQuery, null);
        }
        
        const pages = Math.ceil(totalResults / limit);
        const currentPage = page;
        
        res.render("findprofessionals", {
            usr: usr_, 
            notifications: notifs, 
            link: link_ ? link_ : '/find-services', 
            currtab: 'find-pro', 
            firstCor: 'none', 
            cats: categories, 
            lang: res.locals.locale,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
            countries: countries, 
            professionals: result,
            pages: pages, 
            currentPage: currentPage,
            total: totalResults, 
            base_domain: process.env.BASE_URL, 
            map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            searchParams: searchQuery,
            locale: res.locals.locale || 'en'
        });
        
    });

    // Providers Map Routes
    app.get("/providers-map", async function(req, res){
        var usr_ = null;
        var notifs = null;
        var link_ = null;

        if(req.isAuthenticated()){
            usr_ = req.user;
            link_ = req.link;
            notifs = await NotificationModel.find({receiverId: req.user._id}).sort({lastUpdate:-1}).exec();
        }
        
        res.render("providersMap", {
            usr: usr_, 
            notifications: notifs, 
            link: link_ ? link_ : '/providers-map', 
            currtab: 'providers-map', 
            firstCor: 'none', 
            cats: categories, 
            lang: res.locals.locale,
            map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
            countries: countries,
            locale: res.locals.locale || 'en'
        });
    });

    // API route to get providers location data
    app.get("/api/providers-locations", async function(req, res){
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100; // Limit initial load
            const skip = (page - 1) * limit;

            // Optimized query with better filtering
            const providers = await UserModel.find({
                registeredAsPro: true,
                verified: true, // Only verified providers
                $and: [
                    { $or: [
                        { address: { $exists: true, $ne: "", $ne: null } },
                        { city: { $exists: true, $ne: "", $ne: null } }
                    ]},
                    { country: { $exists: true, $ne: "", $ne: null } }
                ]
            })
            .select('firstName lastName photo category city country rating ratingCount _id') // Removed address for privacy
            .sort({ createdAt: -1 }) // Show newest providers first
            .skip(skip)
            .limit(limit)
            .lean() // Faster queries
            .exec();

            // Get total count for pagination
            const totalCount = await UserModel.countDocuments({
                registeredAsPro: true,
                verified: true,
                $and: [
                    { $or: [
                        { address: { $exists: true, $ne: "", $ne: null } },
                        { city: { $exists: true, $ne: "", $ne: null } }
                    ]},
                    { country: { $exists: true, $ne: "", $ne: null } }
                ]
            });

            res.json({
                success: true,
                providers: providers,
                pagination: {
                    page: page,
                    limit: limit,
                    total: totalCount,
                    hasMore: skip + limit < totalCount
                }
            });
        } catch (error) {
            console.error('Error fetching providers locations:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching providers data'
            });
        }
    });

    app.get("/api/user-country", async function(req, res){
        try {
            if (!req.user) {
                return res.json({
                    success: false,
                    error: 'User not authenticated'
                });
            }

            res.json({
                success: true,
                country: req.user.country,
                city: req.user.city
            });
        } catch (error) {
            console.error('Error fetching user country:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching user country'
            });
        }
    });

    // API endpoints for autocomplete search functionality
    
    // Search countries
    app.get("/api/search/countries", async function(req, res){
        try {
            const query = req.query.search || '';
            if (query.length < 1) {
                return res.json([]);
            }

            const locale = res.locals.locale || 'en';
            const searchTerm = query.toLowerCase();
            
            const filteredCountries = countries.filter(country => {
                // Search in both English name and localized name
                const englishName = country.name.toLowerCase();
                let localizedName = englishName;
                
                if (locale !== 'en' && country.translations && country.translations[locale]) {
                    localizedName = country.translations[locale].toLowerCase();
                }
                
                return englishName.includes(searchTerm) || localizedName.includes(searchTerm);
            }).slice(0, 10);

            res.json(filteredCountries.map(country => ({
                value: country.name, // Always use English name as value
                text: (locale !== 'en' && country.translations && country.translations[locale]) 
                    ? country.translations[locale] 
                    : country.name // Display localized name or fallback to English
            })));
        } catch (error) {
            console.error('Error searching countries:', error);
            res.status(500).json({ error: 'Error searching countries' });
        }
    });

    // Search cities
    app.get("/api/search/cities", async function(req, res){
        try {
            const query = req.query.search || '';
            const country = req.query.dependsOn || '';
            
            if (query.length < 1 || !country) {
                return res.json([]);
            }

            // The country parameter should now be the English name (from data-value)
            // but let's add some fallback logic in case there are edge cases
            let countryFileName = country;
            
            // Load cities for the specified country
            let cityFilePath = `./public/data/cities/${countryFileName}.json`;
            
            // If the direct file doesn't exist, try to find it by searching the countries array
            if (!fs.existsSync(cityFilePath)) {
                // Try to find the country in the countries array by both English and translated names
                const foundCountry = countries.find(c => {
                    if (c.name === country) return true;
                    // Check translations if available
                    if (c.translations) {
                        return Object.values(c.translations).includes(country);
                    }
                    return false;
                });
                
                if (foundCountry) {
                    countryFileName = foundCountry.name;
                    cityFilePath = `./public/data/cities/${countryFileName}.json`;
                }
            }
            
            if (!fs.existsSync(cityFilePath)) {
                console.log(`Cities file not found for country: ${country} (tried: ${cityFilePath})`);
                return res.json([]);
            }

            const cityData = JSON.parse(fs.readFileSync(cityFilePath, 'utf8'));
            const searchTerm = query.toLowerCase();
            
            const filteredCities = cityData.filter(city => 
                city.name.toLowerCase().includes(searchTerm)
            ).slice(0, 10);

            res.json(filteredCities.map(city => ({
                value: city.name,
                text: city.name
            })));
        } catch (error) {
            console.error('Error searching cities:', error);
            res.status(500).json({ error: 'Error searching cities' });
        }
    });

    // Search categories
    app.get("/api/search/categories", async function(req, res){
        try {
            const query = req.query.search || '';
            if (query.length < 1) {
                return res.json([]);
            }

            const locale = res.locals.locale || 'en';
            const searchTerm = query.toLowerCase();
            
            const filteredCategories = categories.filter(category => {
                // Search in both English name and localized name
                const englishName = category.name.toLowerCase();
                let localizedName = englishName;
                
                if (locale !== 'en' && category.translations && category.translations[locale] && category.translations[locale].name) {
                    localizedName = category.translations[locale].name.toLowerCase();
                }
                
                return englishName.includes(searchTerm) || localizedName.includes(searchTerm);
            }).slice(0, 10);

            res.json(filteredCategories.map(category => ({
                value: category.name, // Always use English name as value
                text: (locale !== 'en' && category.translations && category.translations[locale] && category.translations[locale].name) 
                    ? category.translations[locale].name 
                    : category.name // Display localized name or fallback to English
            })));
        } catch (error) {
            console.error('Error searching categories:', error);
            res.status(500).json({ error: 'Error searching categories' });
        }
    });

    app.get("/term-of-use", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("termsAndConditions", {usr: req.user, notifications: notifs, firstCor: 'none', map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                currtab: 'dash', link: req.link, cats: categories, lang: res.locals.locale, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries});
        }
        else
            res.render("termsAndConditions", {usr: null, notifications: null, firstCor: 'none', currtab: 'home', map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            link:'/term-of-use', cats: categories, lang: res.locals.locale, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries });
    });

    app.get("/do-not-sell", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("doNotSell", {usr: req.user, notifications: notifs, firstCor: 'none', currtab: 'dash', link: req.link, cats: categories, 
                recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries, lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY});
        }
        else
            res.render("doNotSell", {usr: null, notifications: null, link:'/do-not-sell', currtab: 'home', cats: categories, map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            firstCor: 'none', recaptchaKey: process.env.RECAPTCHA_KEY_ID, lang: res.locals.locale, countries: countries });
    });

    app.get("/privacy-policy", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("privacyPolicy", {usr: req.user, notifications: notifs, link: req.link, map_api_key: process.env.GOOGLE_MAPS_API_KEY, 
                firstCor: 'none', currtab: 'dash', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, lang: res.locals.locale, countries: countries});
        }
        else
            res.render("privacyPolicy", {usr: null, notifications: null, map_api_key: process.env.GOOGLE_MAPS_API_KEY, link:'/privacy-policy', cats: categories,currtab: 'home',  
            firstCor: 'none', recaptchaKey: process.env.RECAPTCHA_KEY_ID,lang: res.locals.locale, countries: countries });
    })

    app.get("/cookies-policy", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("cookiesPolicy", {usr: req.user, notifications: notifs, map_api_key: process.env.GOOGLE_MAPS_API_KEY, link: req.link, firstCor: 'none', currtab: 'dash', 
                lang: res.locals.locale, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries});
        }
        else
            res.render("cookiesPolicy", {usr: null, notifications: null, link:'/cookies-policy', map_api_key: process.env.GOOGLE_MAPS_API_KEY, 
            lang: res.locals.locale, cats: categories, currtab: 'home', firstCor: 'none', recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries });
    })

    app.get("/about-us", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("about_us", {usr: req.user, notifications: notifs, link:null, firstCor: 'none', 
                lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'about-us', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
        }
        else
            res.render("about_us", {usr: null, notifications: null, link: '/about-us', cats: categories, firstCor: 'none', 
            lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'about-us', recaptchaKey: process.env.RECAPTCHA_KEY_ID });
    });

    app.get("/contact-us", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("contact", {usr: req.user, notifications: notifs, link: null, firstCor: 'none', 
                lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'contact-us', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
        }
        else
            res.render("contact", {usr: null,  notifications:null, link: '/contact-us',  cats: categories, firstCor: 'none', 
            lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'contact-us', recaptchaKey: process.env.RECAPTCHA_KEY_ID });
    });

    app.post("/contact-us", async function(req, res){
        UserService.submitHelpRequestMessage(req, res);

    });

    app.get("/report-issue", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("contact", {usr: req.user, notifications: notifs, link: null, firstCor: 'none', 
                lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'contact-us', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
        }
        else
            res.render("contact", {usr: null,  notifications:null, link: null, lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, firstCor: 'none', currtab: 'contact-us', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID });
    });

    app.get("/myrequests", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                
                // Handle type parameter (default to 'active' if not specified)
                const requestType = req.query.type || 'active';
                let pRequests = [];
                let allRequests = [];
                
                if(requestType === "all"){
                    // Get all requests for this user
                    allRequests = await PostRequestModel.find({username:req.user.username}).sort({lastUpdate:-1}).exec();
                    pRequests = allRequests; // Pass all requests to show proper count for load more
                } else {
                    // Get requests by specific status
                    const typeRegex = new RegExp("^" + requestType);
                    allRequests = await PostRequestModel.find({username:req.user.username, status: typeRegex}).sort({lastUpdate:-1}).exec();
                    pRequests = allRequests;
                }
                
                if(pRequests){
                    console.log(`Requests found for type '${requestType}': ${pRequests.length}`);
                }else{
                    console.log("No requests found with username: "+req.user.username);
                }
                
                res.render("manageUserRequests", {
                    usr: req.user, 
                    notifications: notifs, 
                    map_api_key: process.env.GOOGLE_MAPS_API_KEY, 
                    firstCor: 'none', 
                    currtab: 'myrequests', 
                    postRequests: pRequests, 
                    allRequests: allRequests, 
                    link: null,
                    lang: res.locals.locale,
                    base_url: process.env.BASE_URL,  
                    cats: categories, 
                    recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                    bg: app.locals.bg
                });
            }catch(error) {
                console.error("Error in /myrequests:", error);
                res.redirect("/");
            };
        }
        else
            res.redirect("/");
    });

    app.get("/myrequests/:type", async function(req, res){
        let types = ["active", "completed", "in-progress", "all"];
        if(req.isAuthenticated() && types.includes(req.params.type)){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const type  = new RegExp("^"+ req.params.type);
                const allRequests = req.params.type != "all"? await PostRequestModel.find({username:req.user.username, status: type}).sort({lastUpdate:-1}).exec(): 
                                                                await PostRequestModel.find({username:req.user.username}).sort({lastUpdate:-1}).exec();
                const pRequests =  req.params.type != "all"? await PostRequestModel.find({username:req.user.username, status: type}).sort({lastUpdate:-1}).limit(12).exec():
                                                                await PostRequestModel.find({username:req.user.username}).sort({lastUpdate:-1}).limit(12).exec();
                if(pRequests){
                    // console.log("Requests found: "+pRequests.length);
                }else{
                    // console.log("No requests found with username: "+req.user.username);
                }
                res.render("userRequests", {usr: req.user, notifications: notifs,firstCor: 'none', currtab: 'myrequests', postRequests: pRequests, allRequests: allRequests, link: null, lang: res.locals.locale,
                                            base_url:process.env.BASE_URL, map_api_key: process.env.GOOGLE_MAPS_API_KEY, projects_type:req.params.type, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            }catch(error) {res.redirect("/")};
        }
        else
            res.redirect("/");
        });

    app.get("/getbookings", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const limit = parseInt(req.query?.lim) || 6;
                const skip = parseInt(req.query?.skip) || 0;
                
                let pRequests = [];
                let convCurrs = [];
                let totalCount = 0;
                
                if(req.query?.type == "all") {
                    pRequests = await BookingModel.find({providerId:req.user._id})
                        .sort({lastUpdate:-1})
                        .skip(skip)
                        .limit(limit)
                        .exec();
                    totalCount = await BookingModel.countDocuments({providerId:req.user._id});
                } else {
                    const type = new RegExp("^"+ req.query?.type);
                    pRequests = await BookingModel.find({providerId:req.user._id, status: type})
                        .sort({lastUpdate:-1})
                        .skip(skip)
                        .limit(limit)
                        .exec();
                    totalCount = await BookingModel.countDocuments({providerId:req.user._id, status: type});
                }

                // Process currency conversions
                await pRequests.forEach( b=>{
                        if(req.user.currency != b.currency){
                            const reqBudgetInUSD = b.currency != "USD" ? b.budget / global.rates?.rates[b.currency] : 
                                                                                                    b.budget;
                            const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                            convCurr = " ("+budgetInReqCurr+" "+req.user.currency_symbol+") ";
                        }
                        else 
                        convCurr= " ";
                        if(res.locals.locale === 'fr'){
                            b.category = categoriesToFrMap.get(b.category) || b.category;
                        }
                        convCurrs.push(convCurr);
                });

                // Calculate if there are more items
                const hasMore = (skip + limit) < totalCount;
                const nextSkip = hasMore ? skip + limit : null;

                // Send response with metadata
                res.json({
                    bookings: pRequests, 
                    convCurrs: convCurrs,
                    pagination: {
                        total: totalCount,
                        skip: skip,
                        limit: limit,
                        hasMore: hasMore,
                        nextSkip: nextSkip,
                        currentPage: Math.floor(skip / limit) + 1,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                });
            }catch(error) {
                console.error("Error in /getbookings:", error);
                res.status(500).json({ error: 'Failed to fetch bookings' });
            };
        }
        else
            res.status(401).json({ error: 'Unauthorized' });
    });

    app.get("/getrequests", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const limit = parseInt(req.query?.lim) || 6;
                const skip = parseInt(req.query?.skip) || 0;
                
                let pRequests = [];
                let totalCount = 0;
                
                if(req.query?.type == "all"){
                    pRequests = await PostRequestModel.find({username:req.user.username})
                        .sort({lastUpdate:-1})
                        .skip(skip)
                        .limit(limit)
                        .exec();
                    totalCount = await PostRequestModel.countDocuments({username:req.user.username});
                }
                else{
                    const type  = new RegExp("^"+ req.query?.type);
                    pRequests = await PostRequestModel.find({username:req.user.username, status: type})
                        .sort({lastUpdate:-1})
                        .skip(skip)
                        .limit(limit)
                        .exec();
                    totalCount = await PostRequestModel.countDocuments({username:req.user.username, status: type});
                }
                if(res.locals.locale === 'fr'){
                    pRequests.forEach(r=>{
                        r.requestCategory = categoriesToFrMap.get(r.requestCategory);
                    });
                }
                // Calculate if there are more items
                const hasMore = (skip + limit) < totalCount;
                const nextSkip = hasMore ? skip + limit : null;

                // Send response with metadata
                res.json({
                    requests: pRequests,
                    pagination: {
                        total: totalCount,
                        skip: skip,
                        limit: limit,
                        hasMore: hasMore,
                        nextSkip: nextSkip,
                        currentPage: Math.floor(skip / limit) + 1,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                });
                
            }catch(error) {
                console.log("ROUTES:: /getrequests Error occured: "+error);
                res.status(500).json({ error: 'Failed to fetch requests' });
            };
        }
        else
            res.status(401).json({ error: 'Unauthorized' });
    });

    
    app.post("/request/new-deadline", async function(req, res) {
        if(req.isAuthenticated()){
            try {
                PostRequestService.requestNewDeadline(req, res);

                res.status(200).send({ status: 200 });
            }
            catch(error) {
                logger.error("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
    });

    app.post("/request/accept-new-deadline", async function(req, res) {
        if(req.isAuthenticated()){
            try {
                PostRequestService.acceptNewDeadline(req, res);

                res.status(200).send({ status: 200 });
            }
            catch(error) {
                logger.error("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
    });
    app.post("/request/reject-new-deadline", async function(req, res) {
        if(req.isAuthenticated()){
            try {
                PostRequestService.rejectNewDeadline(req, res);
                res.status(200).send({ status: 200 });
            }
            catch(error) {
                logger.error("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
    });
    app.post("/request/accept-quotation", async function(req, res) {
        if(req.isAuthenticated()){
            try {
                // console.log("ROUTING:: Accepting quotation request...");
                PostRequestService.acceptQuotation(req, res);

                res.status(200).send({ status: 200 });
            }
            catch(error) {
                // console.log("ROUTER:: Accepting quote - error occured: "+error);
                logger.error("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
    });

    app.post("/request/reject-quotation", async function(req, res) {
        if(req.isAuthenticated()){
            try {
                // console.log("ROUTING:: Rejecting quotation request...");
                PostRequestService.rejectQuotation(req, res);
                res.status(200).send({ status: 200 });
            }
            catch(error) {
                // console.log("ROUTER:: Rejecting quote - error occured: "+error);
                res.redirect("/myrequests");
            }
        }
    });

    app.post("/request-delivery-revision", async function(req, res) {
        if(req.isAuthenticated()){
            try {
                PostRequestService.requestRevision(req, res);
                res.status(200).send({ status: 200 });
            }
            catch(error) {
                logger.error("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
    });
    app.post("/accept-delivery", async function(req, res){
        if(req.isAuthenticated()){
            try {
                PostRequestService.acceptDelivery(req, res);
                res.status(200).send({ status: 200 });
            }
            catch(error) {
                // console.log("ROUTES:: /accept-delivery Error occured: "+error);
                res.status(500).send({status: 500});
            }
        }
    });

    app.get("/manage-request", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status: {$ne:'archived'}}).sort({createdAt:-1}).exec();
                const req_ = await PostRequestModel.findById(req.query?.rq).exec();
                let inPros = [];
                if(res.locals.locale === 'fr'){
                    req_.requestCategory = categoriesToFrMap.get(req_.requestCategory);
                }
                const rating = await RatingModel.findOne({ jobId: req_._id }).exec();
                if (req_.status === "active") {
                    let applications = await JobApplicationModel.find({ jobId: req_._id, status: 'applied'}).exec();
                    const applicantIds = applications.map(item => item.providerId);
                    let applicants = await UserModel.find({ _id: { $in: applicantIds }}).exec();
                    let quotation = await QuotationModel.find({ jobId: req_._id, status:'sent' }).limit(4).exec();
                    applicants =  await Promise.all(applicants.map(async (a) => {
                        a.quotation = quotation.find(q => q.providerId === a._id.toString());
                        if(a.quotation){
                                if(req_.currency != a.quotation.currency){
                                    const quotationBudgetInUSD = a.quotation.currency != "USD" ? a.quotation.budget / global.rates?.rates[a.quotation.currency] : 
                                                                        a.quotation.budget;
                                    const budgetInReqCurr = parseFloat(quotationBudgetInUSD * global.rates?.rates[req_.currency]).toFixed(2);
                                    a.quotation.budget = budgetInReqCurr;
                                }
                        }
                        return a;
                    }));

                    inPros.push(...applicants);
                    
                    inPros.forEach(pro=>{
                        if(pro && pro.photo)
                            pro.photo = pro.photo.includes("https://")  ? pro.photo : ("/photo/"+pro.photo);
                        else pro.photo = "/photo/"+"default.png";
                    });
                    
                    const timelines = [];
                    const delivery = await JobDeliveryModel.find({ jobId: req_._id });
                    timelines.push(...delivery);
                    res.render("manageRequest", {timelines: timelines, 
                        rating: rating, usr: req.user, lang: res.locals.locale,
                        currtab: 'myrequests', firstCor: 'none', notifications: notifs, interestedPros: inPros, request: req_, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
                }else if(req_.status != 'cancelled'){
                    pro = await UserModel.findById(req_.providerId).exec();
                    if(pro){
                        // console.log("Pro found: ", pro._id);
                        if(pro.photo)
                            pro.photo = pro.photo.includes("https://")  ? pro.photo : ("/photo/"+pro.photo);
                        else pro.photo = "/photo/"+"default.png";
                        let quotation = await QuotationModel.findOne({jobId: req_._id, providerId: req_.providerId, status:"sent"});
                        if(quotation){
                            if(req_.currency != quotation.currency){
                                const quotationBudgetInUSD = quotation.currency != "USD" ? quotation.budget / global.rates?.rates[quotation.currency] : 
                                                                                quotation.budget;
                                const budgetInReqCurr = parseFloat(quotationBudgetInUSD * global.rates?.rates[req_.currency]).toFixed(2);
                                quotation.budget = budgetInReqCurr;
                            }
                            pro.quotation = quotation;
                        }
                        inPros.push(pro);
                    }else{
                        // console.log("ROUTER:: Could not find provider with the given id");
                    }
                    const timelines = [];
                    const delivery = await JobDeliveryModel.find({ jobId: req_._id });
                    timelines.push(...delivery);
                    res.render("manageRequest", {timelines: timelines,rating: rating, 
                        lang: res.locals.locale,
                        usr: req.user, map_api_key: process.env.GOOGLE_MAPS_API_KEY, 
                        firstCor: 'none', currtab: 'myrequests', notifications: notifs, interestedPros: inPros, request: req_, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
                }else{
                    const timelines = [];
                    const delivery = await JobDeliveryModel.find({ jobId: req_._id });
                    timelines.push(...delivery);
                    
                    res.render("manageRequest", {timelines: timelines, firstCor: 'none', currtab: 'myrequests', lang: res.locals.locale,
                        map_api_key: process.env.GOOGLE_MAPS_API_KEY, rating: rating, usr: req.user, notifications: notifs, interestedPros: inPros, request: req_, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
                }

                
            }catch(error){
                // console.log("Error occured: "+error);
                logger.error("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
        else
            res.redirect("/");
    });

    app.post("/resubmit-request", async function(req, res){
        if(req.isAuthenticated()){
            try{
                PostRequestService.resubmitRequest(req, res);
            }catch(error){  
                logger.error("An error occured (/resubmit-request): "+error);
            }
        }else
            res.redirect("/");
    });

    app.post("/cancel-request", async function(req, res){
        if(req.isAuthenticated()){
            try{
                PostRequestService.cancelRequest(req, res);
            }catch(error){  
                logger.error("An error occured (/cancel-request): "+error);
            }
        }else
            res.redirect("/");
    });

    app.get("/mybookings", async function(req, res){
        if(req.isAuthenticated() &&  req.user.accountType == "provider"){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            let bookings = await BookingModel.find({providerId:req.user._id, status: "active"}).sort({lastUpdate:-1}).exec();
            const userInfo = await CountryModel.findOne({name: req.user.country}).exec();
            if(userInfo){
                req.user.currency = userInfo.currency;
                req.user.currency_name = userInfo.currency_name;
                req.user.currency_symbol = userInfo.currency_symbol;
            }
            bookings.forEach(b=>{
                if(req.user.currency != b.currency){

                    const reqBudgetInUSD = b.currency != "USD" ? b.budget / global.rates?.rates[b.currency] : b.budget;
                    const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                    b.convCurr = "("+budgetInReqCurr+" "+userInfo.currency_symbol+")";
                }
                if(res.locals.locale === 'fr'){
                    b.category = categoriesToFrMap.get(b.category) || b.category;
                }
            })
            res.render("manageServiceRequests", {usr: req.user, map_api_key: process.env.GOOGLE_MAPS_API_KEY, firstCor: 'none', 
                lang: res.locals.locale, currtab: 'mybookings', notifications: notifs, postRequests:bookings, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            
        }
        else
            res.redirect("/");
        });

    app.get('/quotations', async function(req, res){
        if(req.isAuthenticated() &&  req.user.accountType == "provider"){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const quotationsRequests = await QuotationRequestModel.find({providerId:req.user._id, status: "new"}).sort({lastUpdate:-1}).exec();
            if(quotationsRequests){
                quotationsRequests.forEach(qr=>{
                    if(res.locals.locale === 'fr'){
                        qr.category = categoriesToFrMap.get(qr.category) || qr.category;
                        qr.budgetType = (qr.budgetType === 'Per project' ? 'Par projet' :  'Par heure') || qr.budgetType;
                    }
                });
                // console.log("APP:: /quotations quotations found: "+quotationsRequests.length);
            }else{
                // console.log("APP:: /quotations No quotations found!");
            }
            res.render("quotationRequests", {usr: req.user, notifications: notifs, firstCor: 'none', lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY,  currtab: 'quotations', quotations: quotationsRequests, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            
        }
        else{
            res.redirect("/");
        }
    });
    app.get("/getquotations", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const limit = parseInt(req.query.lim) || 6;
                const skip = parseInt(req.query.skip) || 0;
                const type = req.query.type || 'new';
                
                let query = {providerId: req.user._id};
                if(type !== "all") {
                    const typeRegex = new RegExp("^" + type);
                    query.status = typeRegex;
                }

                // Get total count for pagination
                const totalCount = await QuotationRequestModel.countDocuments(query);
                
                // Get quotations with pagination
                const qRequests = await QuotationRequestModel.find(query)
                    .sort({lastUpdate: -1})
                    .skip(skip)
                    .limit(limit)
                    .exec();
                qRequests.forEach(qr=>{
                    if(res.locals.locale === 'fr'){
                        qr.category = categoriesToFrMap.get(qr.category) || qr.category;
                        qr.budgetType = (qr.budgetType === 'Per project' ? 'Par projet' :  'Par heure') || qr.budgetType;
                    }
                });
                // Calculate pagination metadata
                const hasMore = skip + limit < totalCount;
                const nextSkip = hasMore ? skip + limit : null;

                res.json({
                    quotations: qRequests,
                    pagination: {
                        total: totalCount,
                        limit: limit,
                        skip: skip,
                        hasMore: hasMore,
                        nextSkip: nextSkip,
                        currentPage: Math.floor(skip / limit) + 1,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                });
            }catch(error) {
                console.error('Error in /getquotations:', error);
                res.status(500).json({error: 'Failed to fetch quotations'});
            };
        }
        else
            res.redirect("/");
    });

    app.post('/send-quotation', async function(req, res){
        try{
            QuotationServiceObj.sendQuote(req, res);
        }
        catch(error){
            // console.log("APP:: /send-quotation Error occured: ", error);
        }
    });
    app.post('/reject-quotation-request', async function(req, res){
        try{
            QuotationServiceObj.rejectQuotationRequest(req, res);
        }
        catch(error){
            // console.log("APP:: /reject-quotation-request Error occured: ", error);
        }
    })

    app.get('/quotation', async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == 'provider' && req.query){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            let quotationRequest = await QuotationRequestModel.findById(req.query.q).exec();
            
            if(quotationRequest){
                const reqst = await PostRequestModel.findById(quotationRequest.requestId).exec();
                const cust = await UserModel.findOne({username: quotationRequest.username}).exec();
                cust.photo = cust.photo.includes("https:")? cust.photo : "/photo/"+cust.photo;
                if(reqst){
                    quotationRequest.budget = reqst.budget;
                    quotationRequest.budgetType = reqst.budgetType;
                    quotationRequest.currency = reqst.currency;
                }
                res.render("manageQuotationRequest", {usr: req.user, notifications: notifs, lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, firstCor: 'none', currtab: 'quotations', link: null, qr: quotationRequest, customer: cust, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            }
            else{
                // console.log("APP:: /quotation No quotation found for id: "+req.query.q);
                res.redirect("/");
            }
        }else{
            // console.log("APP:: /quotation Must be an authenticated provider to access this page ");
            res.redirect("/");
        }
    });

    app.post('/update-password', function(req, res){
        if(req.isAuthenticated())
            UserService.updatePassword(req, res);
        else
            res.redirect("/");
    });

    app.post('/delete-user-account', function(req, res){
        if(req.isAuthenticated()){
            // console.log("ROUTER:: Calling deleteUserAcc function..");
            UserService.deleteUserAccount(req, res);
        }
        else
            res.redirect("/");
    });

    app.post('/delete-pro-account', function(req, res){
        if(req.isAuthenticated()){
            // console.log("ROUTER:: Calling deleteProAcc function..");
            UserService.deleteProAccount(req, res);
        }
        else
            res.redirect("/");
    });

    app.post('/remove-user-account', function(req, res){
        UserService.removeUser(req, res);
    })
    
    app.post('/change-password', async function(req, res){
        UserService.changePassword(req, res);
    });

    app.get("/change-pass/:userId", async function(req, res){
        try{
            if(req.params.userId != null)
                res.render("changePass.ejs", {usr: null, notifications: null, 
            lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'home', postRequests:null,firstCor: 'none',  link: null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, userId: req.params.userId});
            else
                res.redirect("/");
            
        }catch(error){
            logger.error("ROUTING: Error occured: "+error);
        }
        
    });

    app.post("/authenticate", async function(req, res){
        const unverifiedUser = await UserModel.findById(req.body.iddl).exec();
        let email = unverifiedUser.email.substr(0, 2);
        const atIndex = unverifiedUser.email.indexOf('@');
        for(let i = 2; i < atIndex; i++){
            email = email + "*";
        }
        email = email + unverifiedUser.email.substr(atIndex, unverifiedUser.email.length-1);
        res.render("emailVerification", {usr: null, email: email, map_api_key: process.env.GOOGLE_MAPS_API_KEY, lang: res.locals.locale, notifications: null, firstCor: 'none',currtab: 'home', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, userId: req.body.iddl, link: null, redirect_link:"/"});
    });

    app.post("/verified-and-registered-user", async function(req, res){
        const unverifiedUser = await UserModel.findById(req.body.iddl).exec();
        let email = unverifiedUser.email.substr(0, 1);
        const atIndex = unverifiedUser.email.indexOf('@');
        for(let i = 2; i < atIndex; i++){
            email = email + "*";
        }
        email = email + unverifiedUser.email.substr(atIndex, unverifiedUser.email.length-1);
        res.render("emailVerification", {usr: null, email: email, map_api_key: process.env.GOOGLE_MAPS_API_KEY, lang: res.locals.locale, notifications: null, firstCor: 'none',currtab: 'home', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, userId: req.body.iddl, link: null, redirect_link:"/"});
    });

    app.get("/userdash", async function(req, res){
        
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const pRequests = await PostRequestModel.find({username:req.user.username}).exec();
            res.render("userDashboard", {usr: req.user, notifications: notifs,firstCor: 'none', lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, cats: categories, currtab: 'dash', recaptchaKey: process.env.RECAPTCHA_KEY_ID, postRequests: pRequests, link: null});
        }
        else
        res.redirect("/");
    });
    app.get("/verified/:userId", async function(req, res){
        const user = await UserModel.findOne({ _id: req.params?.userId }).exec();
        if (!user) {
            console.log("ROUTES:: Account verification - User not found!");
            
        }else{
            const token = await TokenModel.findOne({ userId: user._id}).exec();
            if (!token) {
                console.log("ROUTES:: Account verification - User token not found!")
            }
            else{
                req.login(user, function(err){
                    if (err) {
                        console.log("ROUTES:: Account verification - Failed to login user: "+err);
                    }
                    else{
                        console.log("ROUTES:: Account verification -  User has been successfully logged in");
                        UserModel.updateOne({ _id: user._id}, {$set: {verified: true}} ).exec();
                        TokenModel.findByIdAndRemove(token._id).exec();
                    }
                });
            }
        }
        res.redirect("/");
    });

    app.get("/logout", async function(req, res, next ){
        await OnlineUserModel.findOneAndDelete({id: req.user._id.toString()}).exec();
        req.logout(function(err){
            if(err){return next(err);}
            
            res.redirect("/");
        });
    });

    app.post("/verify-email", function(req, res){
        UserService.verifyEmail(req, res);
    });
    
    app.post("/verify-code", function(req, res){
        UserService.verifyCode(req, res);
    });
    
    // Phone verification routes
    app.get("/verify-phone", function(req, res) {
        if(req.isAuthenticated()) {
            res.redirect("/");
        } else {
            const phone = req.query.phone;
            const userId = req.query.userId;
            
            if (!phone || !userId) {
                res.redirect("/");
                return;
            }
            
            res.render("phoneVerification", {
                phone: phone,
                userId: userId,
                lang: res.locals.locale,
                title: "Verify Phone Number"
            });
        }
    });
    
    app.post("/verify-phone-otp", async function(req, res) {
        try {
            const { phone, otp, userId } = req.body;
            
            if (!phone || !otp || !userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number, OTP, and user ID are required' 
                });
            }
            
            const result = await twilioService.verifyOTP(phone, otp);
            
            if (result.success && result.user) {
                // User phone verified successfully
                // res.status(200).json({ 
                //     success: true, 
                //     message: 'Phone verified successfully',
                //     userId: result.user._id
                // });
                req.login(result.user, function(err) {
                    if (err) {
                        console.error('Login error:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Authentication failed' 
                        });
                    }
                    res.json({ 
                        success: true, 
                        message: 'Successfully authenticated',
                        isNewUser: result.user,
                        user: {
                            id: result.user._id,
                            firstName: result.user.firstName,
                            lastName: result.user.lastName,
                            phone: result.user.phone
                        }
                    });
                });
            
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: result.message || 'Verification failed' 
                });
            }
        } catch (error) {
            console.error('Phone verification error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    });
    
    app.post("/resend-phone-otp", async function(req, res) {
        try {
            const { phone, userId } = req.body;
            
            if (!phone || !userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number and user ID are required' 
                });
            }
            
            // Find user by ID to get email for OTP storage
            const user = await UserModel.findById(userId).exec();
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
            
            
            // Get user's country code from their profile
            const userCountryCode = user.countryCode || '+1';
            
            const result = await twilioService.sendOTP(res, phone, user.email, userCountryCode);
            
            if (result.success) {
                res.status(200).json({ 
                    success: true, 
                    message: 'OTP sent successfully' 
                });
            } else {
                res.status(400).json({ 
                    success: false, 
                    message: result.message || 'Failed to send OTP' 
                });
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    });
    
    app.post("/register-pro", function(req, res){
        app.locals.bg =  "bg-light-pro" ;
        UserService.register(req, res);
    });
    app.get("/register-pro", function(req, res){

        res.render("emailVerification", {usr: null, link:null,  lang: res.locals.locale, currtab: 'home', firstCor: 'none', notifications:null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, email:email, userId: req.body.id, form_action: "verify-email", redirect_link:"/"});
    });
  
    app.get("/profile", async function(req, res){
        if(req.isAuthenticated()){
            if(req.user.accountType == 'provider'){
                res.redirect("/p-profile");
                return;
            }
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const geo = geoip.lookup(req.ip);

            // Enhance geo data with additional information for session details
            let user_loc_data = null;
            if (geo) {
                // Get country name from the countries list
                const countryData = countries.find(c => c.iso2 === geo.country);

                user_loc_data = {
                    ip: req.ip,
                    country_code: geo.country,
                    country_name: countryData ? countryData.name : geo.country,
                    region: geo.region,
                    city: geo.city,
                    timezone: geo.timezone,
                    latitude: geo.ll ? geo.ll[0] : null,
                    longitude: geo.ll ? geo.ll[1] : null,
                    postal: geo.postal || null,
                    org: null // ISP info not available in geoip-lite
                };
            }

            let accountTypeDisplay = req.user.accountType;
            if(res.locals.locale === 'fr') accountTypeDisplay = 'utilisateur';
            res.render("userProfile", {usr: req.user, firstCor: 'none', lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'dash', notifications: notifs, link:null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, user_loc_data: user_loc_data,
                countries: countries, accountTypeDisplay: accountTypeDisplay});
        }else   res.redirect("/");
    });

    app.post("/profile", multer_.single("photo"), async function(req, res){
        if (req.isAuthenticated()) {
            try{
                
                if(req.file){
                    
                    // Validate file size (in bytes)
                    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
                    if (req.file.size > maxSizeInBytes) {
                        console.log('File size exceeds the limit of 2MB.');
                        return;
                    }
                    // console.log("File found!");
                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);

                    // await sharp(req.file.buffer)
                    //     .resize({
                    //         fit: 'inside',
                    //         width: 60,
                    //         height: 60
                    //     })
                    //     .jpeg()
                    //     .toFile(filename).then(() => {
                    //         console.log("Img resized successfully..");
                    //       })
                    //     .catch((err) => {console.log("ROUTE:: An error occured while resizing img: ", err);});

                    // console.log("Resized file: ", filename);

                    const blob = bucket.file(req.file.originalname);
                    
                    const blobStream = blob.createWriteStream();
                    await blobStream.on("finish", async ()=>{
                        
                        await bucket.file(req.file.originalname).move("uploads/"+filename).then(() => {
                            //console.log(`File name was renamed to ${filename}.`);
                        }).catch(err => {
                            //console.error('Error renaming file:', err);
                        });
                        return; 
                    });
                    blobStream.end(req.file.buffer);
                    req.body.photo = filename;
                    

                }
            }catch(error){
                // console.log("Failed to upload file to bucket. Error: "+error.message);
            }
            if(req.user.country != req.body.country){
                const cc = await CountryModel.findOne({name: req.body.country}).select('phone_code').exec();
                req.body.countryCode = cc.phone_code;
            }
            if(UserService.updateUser({_id: req.user._id, ...req.body}))
                res.redirect("/profile");
            else
            logger.warn("Update failed!");
            
        }else res.redirect("/");
        
    });

    app.post("/apply-for-sr", async function(req, res){
        jobApplicationHander.apply(req, res);
    });

    app.get('/feedback/:jobId', async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "user" && req.params.jobId){
            const job = await PostRequestModel.findById(req.params.jobId).exec();
            // console.log("ROUNTING:: Job found for rating: "+job._id);
            if(job && (job.status == 'accepted' || job.status == 'accepted & rated')){
                const pro = await UserModel.findById(job.providerId).exec();
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                res.render('ratingProvider', {usr: req.user,  firstCor: 'none', proName: pro.firstName, 
                    link:null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
                    countries: countries, currtab: 'dash',
                    notifications: notifs,
                    jobId: job._id,
                    lang: res.locals.locale,
                    map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                    jobTitle: job.requestTitle,
                    proId: pro._id});
            }else { 
                console.log("ROUTING:: No job found for rating: ", req.params.jobId); 
            };
            
        }else{ 
            console.log("ROUNTING:: rating - no job id, not a user type or not auth"); 
        }
    });
    app.post('/submit-rating', async function(req, res){
        if(req.user && req.isAuthenticated() && req.user.accountType == "user"){
            UserService.rateProvider(req, res);
        }else{
            // console.log('Unauthorized access');
        }
    });

    app.get('/reviews', async (req, res)=>{
        if(req.isAuthenticated() && req.query.p){
            const pro = await UserModel.findById(req.query.p).exec();
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            
            if(pro && pro.ratingCount > 0){
                const ratings = await RatingModel.find({proId: pro._id}).sort({lastUpdate:-1}).limit(15).exec();
                for(let i = 0; i < ratings.length; i++){
                    let userPict = "";
                    const usr_ = await UserModel.findById(ratings[i].userId).exec();
                    userPict = usr_ != null ? usr_.photo : userPict;
                    userPict = userPict.includes("https://")  ? userPict : ("/photo/"+userPict);
                    const job = await PostRequestModel.findById(ratings[i].jobId).exec();
                    if(ratings[i].ratingTitle.trim() != "")
                        ratings[i].jobTitle = ratings[i].ratingTitle;
                    else 
                        ratings[i].jobTitle = job != null ? job.requestTitle : " ";
                    ratings[i].userPict = userPict;
                    ratings[i].usrname = usr_.firstName.concat(' ', usr_.lastName);
                };
                res.render("providerReviews", {firstCor: 'none',
                    pro: pro, currtab: 'dash',
                    ratings: ratings,
                    lang: res.locals.locale,
                    map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                    usr: req.user, notifications: notifs, 
                    link:null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries} );

            }
        }else
            res.redirect("/");
    });

    app.get("/booking", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider" && req.query?.b != null ){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const booking = await BookingModel.findOne({_id: req.query?.b}).exec();
                //const job_ = await PostRequestModel.findOne({_id: booking.jobId}).exec();
                const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
                if(userCountry){
                    req.user.currency = userCountry.currency;
                    req.user.currency_name = userCountry.currency_name;
                    req.user.currency_symbol = userCountry.currency_symbol;
                }
                if(booking){
                    const cust = await UserModel.findOne({username: booking.username}).exec();
                    const delivery = await JobDeliveryModel.findOne({ jobId: booking.jobId }).exec();
                    const rating = await RatingModel.findOne({ jobId: booking.jobId }).exec();
                    
                    if(cust) cust.photo =  cust.photo.includes("https://")  ? cust.photo : ("/photo/"+cust.photo);
                    let convertedCurr = "";
                    if(req.user.currency != booking.currency){
                        
                        const reqBudgetInUSD = booking.currency != "USD" ? booking.budget / global.rates?.rates[booking.currency] : 
                                                                                        booking.budget;
                        const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                        convertedCurr = " ("+budgetInReqCurr+" "+req.user.currency+") ";
                    
                    }
                    res.render("manageBooking", 
                    {
                    delivery: delivery,
                    firstCor: 'none', currtab: 'mybookings',
                    convertedCurr: convertedCurr,
                    lang: res.locals.locale,
                    usr: req.user, notifications: notifs, 
                    link:null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
                    countries: countries,
                    booking: booking,
                    job: booking,
                    map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                    rating: rating,
                    customer: cust
                    });
                }else{
                    console.log("No booking found!");
                    res.redirect("/");
                }
            }catch(error){
                // console.log("ROUTES:: Error occured /booking : "+error);
                res.redirect("/");
            }
        }else
            res.redirect("/");
    });

    app.post("/confirm-booking", async function(req, res){
        if(req.isAuthenticated()){
            try{
                BookingService.confirmBooking(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }
        else
            res.redirect("/");
    });
    
    app.post("/cancel-booking", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider"){
            try{
                if(req.user.accountType == "provider")
                    BookingService.cancelBookingByPro(req, res);
                else
                    BookingService.cancelBookingByUser(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }else res.redirec("/");
    });

    app.post("/complete-booking", multer_.single("file"), async function(req, res){
    if (req.isAuthenticated() && req.user.accountType == "provider") {
        try{
            if(req.file){

                const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                const blob = bucket.file(req.file.originalname);
                const blobStream = blob.createWriteStream();
                blobStream.on("finish", async()=>{
                    // renaming the img and moving it to uploads
                    await bucket.file(req.file.originalname).move("postAttachments/"+filename).then(() => {
                        // console.log(`File name was renamed to ${filename}.`);
                    }).catch(err => {
                        logger.error('ROUTING:: Completing booking - Error renaming file:', err);
                    });
                    // console.log("Successfully uploaded img to bucket.");
                    return; 
                });

                blobStream.end(req.file.buffer);
                req.file.filename = filename;
            }
            BookingService.completeBooking(req, res);
        }catch(error){ logger.error("ROUTING:: Completing booking - error occured: "+error.message);}
        
        } else res.redirect("/");
    });

    app.get("/print-invoice/:jobId", async function(req, res){
        if(req.isAuthenticated()){
        try{
            if(req.params.jobId){
                QuotationServiceObj.printInvoice(req.params.jobId, req, res);
            }

        }catch(err){

        }
        }else{res.redirect("/");}
    });

    app.get("/p-profile", async function(req, res){
        if(req.isAuthenticated()){
            console.log("ROUTES:: Account type: "+req.user.accountType);
            if(req.user.accountType !== 'provider'){
                res.redirect("/profile");
                return;
            }
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();

            let hasDefaultPayment = false;

            let subName = "Free";

            const geo = geoip.lookup(req.ip);
            let accountTypeDisplay = req.user.accountType;
            if(res.locals.locale === 'fr'){
                accountTypeDisplay = req.user.accountType === 'provider' ? 'prestataire' : 'utilisateur';
                req.user.category = categoriesToFrMap.get(req.user.category);
                subName = "Essai";
            }
            res.render("userEdit", {usr: req.user, firstCor: 'none', currtab: 'dash', notifications: notifs, link:null, lang: res.locals.locale, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries, hasDefaultPayment: hasDefaultPayment, user_loc_data: geo, subName: subName, accountTypeDisplay: accountTypeDisplay});
        }else{res.redirect("/");}
    });

    app.get("/join-as-pro", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType != 'provider'){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("joinAsProProfile", {usr: req.user, notifications: notifs, link:null, 
                lang: res.locals.locale, firstCor: 'none', currtab: 'dash', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, countries: countries});
        }else{res.redirect("/");}
    });

    app.get('/join-as-user', async function(req, res){
        if(req.isAuthenticated() && req.user.accountType != 'user'){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            await UserModel.findByIdAndUpdate(req.user._id, {strictlyPro: false, lastUpdate: new Date()}).exec();
            const geo = geoip.lookup(req.ip);
            res.render("userProfile", {usr: req.user, notifications: notifs, firstCor: 'none', link:null, 
                lang: res.locals.locale, currtab: 'dash', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, user_loc_data: geo,
                countries: countries});
        }else{
            res.redirect("/");
        }
    })

    app.get('/pro-profile/:id/', async function (req, res) {
        let provider = await UserService.findUser(req, res);
        const jobComp = await BookingModel.find({providerId: provider._id , status: {$in:['completed', 'accepted', 'accepted & rated']}}).exec();
        var jobComps = 0;
        if(jobComp) jobComps = jobComp.length;
        if(provider) provider.photo =  provider.photo.includes("https://")  ? provider.photo : ("/photo/"+provider.photo);
        const ratings = await RatingModel.find({proId: provider._id }).exec();
        var ratingSum = 0; var ratingCount = 0;
        ratings.forEach(r=>{
            ratingSum += r.rating;
            ratingCount += 1;
        });
        if(ratingSum > 0)
            provider.rating = ratingSum / ratingCount;
        provider.ratingCount = ratingCount;
        let timeZone = "time";
                for(let ctry of countries){
                    // console.log(ctry);
                    if(ctry.name == provider.country){
                        timeZone = ctry.timezones[0].tzName + " ("+ctry.timezones[0].gmtOffsetName+")";
                        break;
                    }
                };

        if( req.isAuthenticated() && provider){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const favPros = req.user.favoriteProviders;
                let isFav = false;
                if(favPros != null && favPros.length > 0){
                    favPros.forEach(proId=>{
                        if(proId == provider._id)
                            isFav = true;
                    });
                }
                

                res.render("proProfile", {usr: req.user, 
                    notifications: notifs, currtab: 'dash',
                    lang: res.locals.locale,
                    map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                    firstCor: 'none', isFavorite: isFav, pro: provider, cats: categories, 
                    jobCompleted: jobComps, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
                    link:req.link, tz: timeZone});
            }catch(error){res.redirect("/");}
            
        }else
            res.render("proProfile", {usr: null, lang: res.locals.locale, currtab: 'home', jobCompleted: jobComps, notifications: null, pro: provider, firstCor: 'none', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, isFavorite: null, link:req.link, tz: timeZone});
   });

   app.post("/addfavpro", async function(req, res) {
        let provider = await UserModel.findById(req.body.proId).exec();
        if(provider) provider.photo =  provider.photo.includes("https://")  ? provider.photo : ("/photo/"+provider.photo);
        if( req.isAuthenticated()){
            try{
                await UserService.addFavPro(req, res);
            }
            catch(error){
                logger.error("An error occured(addfavpro): "+error);
            }
        }else   
            res.render("proProfile", {usr: null, notifications: null, pro: provider, currtab: 'dash', 
                lang: res.locals.locale, cats: categories, firstCor: 'none', recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:req.link});

   });

   app.get('/service-request-booking/:id/', async function (req, res) {
    let provider = await UserService.findUser(req, res);
    
    if( req.isAuthenticated() && provider){
        const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
        if(userCountry){
            req.user.currency = userCountry.currency;
            req.user.currency_name = userCountry.currency_name;
            req.user.currency_symbol = userCountry.currency_symbol;
        }
        const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
        res.render("bookPro", {usr: req.user, 
            notifications: notifs, pro: provider,
            firstCor: 'none', currtab: 'dash', 
            lang: res.locals.locale,
            map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, 
            bg: app.locals.bg, link:req.link});
        
    }else
        res.redirect("/");
});
    
    app.post('/verify-p-email', function(req, res) {
        //model.verifyProviderEmail(req, res);
        UserService.verifyEmail(req, res);
    });
    
    app.get("/messages/:userId/last", async function (req,res) {
        if( req.isAuthenticated()) {
            lastMessage = await messageHander.getLastMessageWithUser(req, req.params.userId);

            return res.status(200).send({ ...lastMessage });
        } else
            res.redirect("/");
    });

    app.get("/messages", async function(req, res){
        if( req.isAuthenticated()){
            try{
                const newMessagesNotifs = await NotificationModel.find({receiverId: req.user._id, status:'unread', title:'You have a new message.'}).exec();
                for(let i = 0; i < newMessagesNotifs.length; i++){
                    newMessagesNotifs[i].status = 'read';
                    newMessagesNotifs[i].lastUpdate = new Date();
                    await newMessagesNotifs[i].save();
                }
                let correspondants = [];
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const correspdts = await messageHander.getCorrespondants(req, res);
                let messages = [];
                let firstCorresp = null;
                if(correspdts.length > 0){
                    messages = await messageHander.getMessageWithUser(req, correspdts[0]._id);
                    if(req.query.id && req.query.id !== req.user._id.toString())
                        firstCorresp = await UserModel.findById(req.query.id).exec();
                    else
                        firstCorresp = await UserModel.findById(correspdts[0]._id).exec();
                        firstCorresp.isOnline = await messageHander.checkIfUserOnline(firstCorresp._id.toString());
                        console.log("ROUTER:: first cor is online: ", firstCorresp.isOnline);
                    correspdts.forEach(c => { if(c._id.toString() !== firstCorresp._id.toString() && c._id.toString() !== req.user._id.toString())
                            correspondants.push(c);
                    }); 
                    
                    messages = await Promise.all(messages.map(async (m) => {
                        if (m.isQuotation) {
                            const quotation = await MessageQuotationModel.findById(m.quotationId).exec();
                            m.quotation = quotation;
                            
                        }
                        
                        return m;
                    }));
                }
                res.render("messages", {usr: req.user, 
                    data: messages, correspondants: correspondants, 
                    lang: res.locals.locale,
                    currtab: 'messages', map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                    notifications: notifs, firstCor: firstCorresp != null ? firstCorresp:"none", cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:null});
            }
            catch(err){
                logger.error("Error (routes): "+err);
            }
        }else
            res.redirect("/");
    });

    app.post("/messages/quotation/accept-quotation", async function(req, res){
        if( req.isAuthenticated()){
            try{
                // console.log("ROUTING:: Accepting message quotation request...");
                QuotationServiceObj.acceptMessageQuotation(req, res);
                
                res.status(200).send({message: "Ok", status: 200});
                return;
            }
            catch(err){
                // console.log("ROUTING:: Accepting quotation request - Error occured: "+err);
                return;
            }
        }else
            res.redirect("/");
    });

    app.post("/messages/quotation/reject-quotation", async function(req, res){
        if( req.isAuthenticated()){
            try{
                // console.log("ROUTING:: Rejecting message quotation request...");
                QuotationServiceObj.rejectMessageQuotation(req, res);
                res.status(200).send({message: "Ok", status: 200});
                return;
            }
            catch(err){
                // console.log("ROUTING:: Rejecting quotation request - Error occured: "+err);
            }
        }else res.redirect("/");
    });

    app.post("/messages/quotation", async function(req, res){
        if( req.isAuthenticated()){
            try{
                QuotationServiceObj.createQuotationInMessages(req, res);
                
                res.status(200).send({ status: 200 });
            }
            catch(err){
                logger.error("Error (routes): "+err);
            }
        }else
            res.redirect("/");
    });

    app.post("/messages", async function(req, res){
        if( req.isAuthenticated()){
            try{
                let messages = [];
                const quotes = [];
                let firstCorresp = null;
                const correspondants = await messageHander.getCorrespondants(req, res);
                if(correspondants.length > 0){
                    messages = await messageHander.getMessageWithUser(req, req.body.userId);
                    firstCorresp = await UserModel.findById(req.body.userId).exec();

                    messages = await Promise.all(messages.map(async (m) => {
                        if (m.isQuotation) {
                            const quotation = await MessageQuotationModel.findById(m.quotationId).exec();
                            quotes.push(quotation);
                            m.quotation = quotation;
                        }else m.quotation = null;
                        return m;
                    }));

                }
                
                res.status(200).send({usr: req.user, data: messages, quotations: quotes, chatUser: firstCorresp , status: 200});
            }
            catch(err){
                res.status(401).send({status:401, message:"Error"});
                logger.error("Error (routes): "+err);
            }
        }else
            res.redirect("/");
    });

    //app.post("/send-message", upload.array("files"), async function(req, res){
    app.post("/send-message", multerArray_.array("files"), async function(req, res){
        if (req.isAuthenticated()) {
            try{
                if(req.file){
                    // console.log("File found!");
                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                    const blob = bucket.file(req.file.originalname);
                    const blobStream = blob.createWriteStream();
                    blobStream.on("finish", ()=>{
                        // console.log("Successfully uploaded files to bucket.");
                        return; 
                    });
    
                    // renaming the img and moving it to uploads
                    await bucket.file(req.file.originalname).move("postAttachments/"+filename).then(() => {
                        // console.log(`File name was renamed to ${filename}.`);
                    }).catch(err => {
                        logger.error('ROUTING:: Sending message - Error renaming file:', err);
                    });
                    blobStream.end(req.file.buffer);
                }
                logger.info("About to send message..");
                messageHander.sendMessage(req, res); 
            }catch(error){ logger.error("ROUTING:: Sending message - error occured: "+error.message);}
        }else res.redirect("/");

    });

    app.get("/resendCode/:id", function(req, res){
        //model.resendCode(req, res);
        req.body.redirect_link = "/";
        UserService.resendCode(req, res);
    });

    app.post("/resendCode", async (req, res)=>{
        //req.body.redirect_link = "/pass-change";
        UserService.resendCode(req, res);
    });

    app.get("/resendCode/change-pass/:id", function(req, res){
        //model.resendCode(req, res);
        req.body.redirect_link = "/change-pass";
        UserService.resendCode(req, res);
    });

    app.get("/service-request", async function (req, res) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
            const paymentMethods = await PaymentMethodModel.find({userId: req.user._id}).sort({createdAt: -1 }).limit(3).exec();
            console.log("ROUTES:: Payment methods found: "+paymentMethods.length);
            if(userCountry){
                req.user.currency = userCountry.currency;
                req.user.currency_name = userCountry.currency_name;
                req.user.currency_symbol = userCountry.currency_symbol;
            }
            res.render("serviceRequest",
                {
                    usr: req.user, 
                    lang: res.locals.locale,
                    map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                    firstCor: 'none', currtab: 'myrequests', 
                    notifications: notifs, link:null, 
                    paymentMethods: paymentMethods, 
                    cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
        }else{
            logger.warn("User not connecting, redirecting to home page..");
            res.redirect("/");
        }
    });

    app.post("/postServiceRequest", multer_.single("file"), async function(req,res){
        if(req.isAuthenticated()){
            try{
                if(req.file){
                    // console.log("File found: "+req.file.originalname);
                    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
                    if (req.file.size > maxSizeInBytes) {
                        console.log('File size exceeds the limit of 10MB.');
                        return;
                    }

                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                    const blob = bucket.file(req.file.originalname);
                    const blobStream = blob.createWriteStream();
                    blobStream.on("finish", async ()=>{
                        // console.log("Successfully uploaded file to bucket.");
                        // renaming the img and moving it to uploads
                        await bucket.file(req.file.originalname).move("postAttachments/"+filename).then(() => {
                            // console.log(`File name was renamed to ${filename}.`);
                        }).catch(err => {
                            // console.error('Error renaming file:', err);
                        });
                        return; 
                    });

                    
                    blobStream.end(req.file.buffer);
                    req.file.filename = filename;
                    
                }else{
                    // console.log("ROUTER:: No attached file found.");
                }
                PostRequestService.postServiceRequest(req,res);
            }
            catch(error){
                // console.log("ROUTER:: Error occured while submitting service request: "+error);
            }
        }
        
    });

    app.post("/submitBooking", multer_.single("file"), async function(req,res){
        try{
            if(req.file){
                // console.log("File found: "+req.file.originalname);
                const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
                if (req.file.size > maxSizeInBytes) {
                    console.log('File size exceeds the limit of 10MB.');
                    return;
                }
                const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                const blob = bucket.file(req.file.originalname);
                const blobStream = blob.createWriteStream();
                blobStream.on("finish", async ()=>{
                    // console.log("Successfully uploaded file to bucket.");
                    // renaming the img and moving it to uploads
                    await bucket.file(req.file.originalname).move("postAttachments/"+filename).then(() => {
                        // console.log(`File name was renamed to ${filename}.`);
                        //return;
                    }).catch(err => {
                        // console.error('Error renaming file:', err);
                    });
                    return; 
                });

                blobStream.end(req.file.buffer);
                req.file.filename = filename;
                
                // console.log("ROUTER:: Successfully booked provider.");
            }else{
                // console.log("ROUTER:: No attached file found.");
            }
            BookingService.postBooking(req,res);
        }catch(error){
            // console.log("ROUTER:: Error occured while submitting booking: "+error);
        }
    });

    app.get("/find-professionals", async function (req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 10;
            
            // Get the results
            const result = await UserService.find(req.query, req.user?._id, res.locals.locale);
            
            // Get total count for pagination
            const filters = {
                registeredAsPro: true,
                verified: true
            };
            
            if(req.user?._id) {
                filters._id = {$ne: req.user._id};
            }
            
            // Apply search filters for count
            if(req.query?.country_search && req.query?.country_search !== "Country" && req.query.country_search.trim() !== "")
                filters.country = req.query.country_search;
                
            if(req.query?.city_search && req.query?.city_search !== "Select City" && req.query.city_search.trim() !== "")
                filters.city = req.query.city_search;
                
            if(req.query?.selected_category && req.query?.selected_category !== "Category" && req.query?.selected_category !== "")
                filters.category = {$regex: new RegExp(req.query.selected_category, "i")};
                
            if(req.query?.search && req.query.search.trim() !== "") {
                const searchTerm = req.query.search.trim();
                const currentLanguage = res.locals.locale || 'en';
                const searchTerms = SearchTranslation.getSearchTerms(searchTerm, currentLanguage);

                // Create search conditions for role field using bilingual search
                const roleConditions = [];
                searchTerms.forEach(term => {
                    roleConditions.push({ role: {$regex: new RegExp(term, "i")} });
                });

                // Standard search conditions for other fields
                const standardConditions = [
                    { firstName: {$regex: new RegExp(searchTerm, "i")} },
                    { lastName: {$regex: new RegExp(searchTerm, "i")} },
                    { category: {$regex: new RegExp(searchTerm, "i")} }
                ];

                filters.$or = [...roleConditions, ...standardConditions];
            }
            
            const totalResults = await UserModel.countDocuments(filters);
            const totalPages = Math.ceil(totalResults / limit);
            result.forEach(r => {
                if(res.locals.locale === 'fr'){
                    r.category = categoriesToFrMap.get(r.category) || r.category;
                }
            });
            // Return paginated response
            res.json({
                results: result,
                lang: res.locals.locale,
                pagination: {
                    currentPage: page,
                    pages: totalPages,
                    total: totalResults,
                    limit: limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            logger.error("Error in find-professionals API:", error);
            res.status(500).json({ error: "Internal server error" });
        }
      });

    app.get('/applicants/:srId', async function (req, res){
        try{
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: 'desc'}).exec();
            logger.info("Routing to applicants/ ");
            inPros = await PostRequestService.getApplicants(req, res);
            if(inPros){
                logger.debug("Rendering applicants page...");
                res.render("applicants", 
                    {
                        usr: req.user,
                        firstCor: 'none', 
                        lang: res.locals.locale,
                        map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                        currtab: 'dash', notifications: notifs, interestedPros: inPros, requestId: req.params?.srId, link: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            }

        }
        catch(err){
            logger.error("ROUTING:: Error occured: "+error);
        }

    });
    app.get("/find-services-md", async function(req, res){
        
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("findProMd", {link:null, lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, firstCor: 'none', currtab: 'find-pro', usr: req.user, notifications: notifs, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
        }
        else
            res.render("findProMd", {link:null, lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, firstCor: 'none', currtab: 'find-pro', notifications: null, usr: null,  cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID });
    });

    app.get("/sr-details/:jobId", async function(req, res){
        if(req.isAuthenticated()){
            const jobApplication = await JobApplicationModel.findOne({jobId: req.params.jobId, providerId: req.user._id}).exec();
            if(jobApplication) {
                res.redirect("/job-application/"+req.params.jobId);
                return;
            }
        
            try{
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const sr = await PostRequestModel.findOne({_id: req.params.jobId}).exec();
            const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
            if(userCountry){
                req.user.currency = userCountry.currency;
                req.user.currency_name = userCountry.currency_name;
                req.user.currency_symbol = userCountry.currency_symbol;
            }
            let convertedCurr = "";
            if(req.user.currency != sr.currency){
                const reqBudgetInUSD = sr.currency != "USD" ? sr.budget / global.rates?.rates[sr.currency] : 
                                                                                sr.budget;
                const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                convertedCurr = " ("+budgetInReqCurr+" "+req.user.currency+") ";
            
            }
            const owner_ = await UserModel.findOne({username: sr.username});
            if(owner_) owner_.photo =  owner_.photo.includes("https://")  ? owner_.photo : ("/photo/"+owner_.photo);
            res.render("jobRequestDetails", {job: sr, lang: res.locals.locale, convertedCurr: convertedCurr, currtab: 'mybookings', firstCor: 'none', notifications: notifs, owner: owner_, link:null, usr: req.user, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            }catch(error){
                res.redirect("/");
            }
        }
        else
            res.redirect("/");
    });
    app.get("/job-application/:jobId", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const ja = await JobApplicationModel.findOne({jobId: req.params.jobId}).exec();
                let sr = await PostRequestModel.findOne({_id: req.params.jobId}).exec();
                const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
                if(userCountry){
                    req.user.currency = userCountry.currency;
                    req.user.currency_name = userCountry.currency_name;
                    req.user.currency_symbol = userCountry.currency_symbol;
                }
                let convertedCurr = "";
                if(req.user.currency != sr.currency){
                    const reqBudgetInUSD = sr.currency != "USD" ? sr.budget / global.rates?.rates[sr.currency] : 
                                                                                    sr.budget;
                    const budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[req.user.currency]).toFixed(2);
                    convertedCurr = " ("+budgetInReqCurr+" "+req.user.currency+") ";
                
                }
                sr.convCurr = convertedCurr;
                const postedBy = await UserModel.findOne({username: sr.username}).exec();
                if(postedBy) postedBy.photo =  postedBy.photo.includes("https://")? postedBy.photo : ("/photo/"+postedBy.photo);
                else res.redirect("/")
                sr.createdAt = ja.createdAt;
                sr.appStatus = ja.status;
                res.render("jobApplicationDetails", {job: sr, lang: res.locals.locale, firstCor: 'none', currtab: 'dash', notifications: notifs, cats:categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:null, postedBy:postedBy, usr: req.user});
            }catch(error){
                res.redirect("/");
            }
           
        }
        else
            res.redirect("/");
    });

    app.post("/cancel-application", async function(req, res) {
        if(req.isAuthenticated()){
            try{
                jobApplicationHander.cancelApplication(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }
        else{
            res.redirect("/");
        }

    });

    app.get("/invoice", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
                const job = await PostRequestModel.findOne({_id: req.query?.sr}).exec();
                const pro = await UserModel.findOne({_id: req.query?.p}).exec();
                const quotation = await QuotationModel.findOne({jobId: req.query?.sr, providerId: req.query?.p, status:{$in:['sent', 'accepted']}});
                const jobClient_ = await UserModel.findOne({username: job.username}).exec();
                const userCountry = await CountryModel.findOne({name: req.user.country}).exec();
                if(userCountry){
                    req.user.currency = userCountry.currency;
                    req.user.currency_name = userCountry.currency_name;
                    req.user.currency_symbol = userCountry.currency_symbol;
                }
                let convertedCurr = "";
                if (req.user.accountType === 'user' && quotation) {
                    let budgetInReqCurr = quotation.budget;
                    if(job.currency != quotation.currency){
                        
                        const reqBudgetInUSD = quotation.currency != "USD" ? quotation.budget / global.rates?.rates[quotation.currency] : 
                                                                                        quotation.budget;
                        budgetInReqCurr = parseFloat(reqBudgetInUSD * global.rates?.rates[job.currency]).toFixed(2);
                        convertedCurr = " ("+budgetInReqCurr+" "+job.currency+") ";
                    
                    }
                    if (quotation.budgetType === "Per hour") {
                        job.budget = parseInt(budgetInReqCurr) * parseInt(quotation.timeOfCompletion);
                    } else {
                        job.budget = budgetInReqCurr;
                    }
                }
                else if(req.user.accountType === 'provider' && req.user.currency != job.currency){
                    const budget = job.currency != "USD" ? job.budget / global.rates?.rates[job.currency] : job.budget;
                    job.budget = parseFloat(budget * global.rates?.rates[req.user.currency]).toFixed(2);
                    job.currency = req.user.currency;
                }

            
                res.render("invoice", 
                    {
                        job: job, 
                        convertedCurr: convertedCurr, 
                        firstCor: 'none', currtab: 'dash', 
                        lang: res.locals.locale,
                        pro:pro, jobClient: jobClient_, 
                        map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                        notifications: notifs, link:null, usr: req.user, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID});
            }catch(error){
                // console.log("ROUTES:: /invoice Error occured: "+error);
                res.redirect("/");
            }
        }
        else
            res.redirect("/");
    });

    app.get('/files/:filename', function(req, res){
        const file = `files/${req.params.filename}`;
        res.download(file);
      });

    app.get('/uploads/:filename', function(req, res){
        const file = `uploads/${req.params.filename}`;
        res.download(file);
    });


    app.get('/:anything/', async function (req, res) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("page_not_found", {usr: req.user, firstCor: 'none', map_api_key: process.env.GOOGLE_MAPS_API_KEY, lang: res.locals.locale,
                currtab: 'dash', notifications: notifs, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:req.link});
        }else
         res.render("page_not_found", {usr: null, firstCor: 'none', map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'home', notifications: null, cats: categories, 
            recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:null , lang: res.locals.locale});
   });

    
    // Send OTP via SMS
    app.post('/api/phone/send-otp', async function(req, res) {
        try {
            const { phoneNumber } = req.body;
            
            if (!phoneNumber) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number is required' 
                });
            }
            
            // Validate phone number format (basic validation)
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number format. Please include country code.'
                });
            }
            
            // Check if user exists before sending OTP (with flexible matching)
            const userCheck = await twilioService.getUserByPhone(phoneNumber, req);
            
            if (!userCheck.success) {
                return res.status(500).json({
                    success: false,
                    message: res.locals.locale === 'fr' ? 'Impossible de vérifier le numéro de téléphone' : 'Unable to verify phone number'
                });
            }
            
            if (!userCheck.userExists) {
                return res.status(404).json({
                    success: false,
                    message: res.locals.locale === 'fr' ? 'Ce numéro de téléphone n\'est pas enregistré. Veuillez d\'abord vous inscrire ou contacter le support.' : 'This phone number is not registered. Please sign up first or contact support.'
                });
            }
            
            const result = await twilioService.sendOTP(res, phoneNumber, userCheck.user.email, userCheck.user.countryCode);
            res.json(result);
        } catch (error) {
            console.error('Send OTP error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    });
    
    // Verify OTP and authenticate user
    app.post('/api/phone/verify-otp', async function(req, res) {
        try {
            const { phoneNumber, otp, userInfo } = req.body;
            
            if (!phoneNumber || !otp) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number and OTP are required' 
                });
            }
            
            const result = await twilioService.verifyOTP(phoneNumber, otp, userInfo);
            
            if (result.success && result.user) {
                req.login(result.user, function(err) {
                    if (err) {
                        console.error('Login error:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Authentication failed' 
                        });
                    }
                    res.json({ 
                        success: true, 
                        message: 'Successfully authenticated',
                        isNewUser: result.isNewUser,
                        user: {
                            id: result.user._id,
                            firstName: result.user.firstName,
                            lastName: result.user.lastName,
                            phone: result.user.phone
                        }
                    });
                });
            } else {
                res.json(result);
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    });
    
    // Check if user exists by phone number
    app.post('/api/phone/check-user', async function(req, res) {
        try {
            const { phoneNumber } = req.body;
            
            if (!phoneNumber) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Phone number is required' 
                });
            }
            
            const result = await twilioService.getUserByPhone(phoneNumber, req);
            res.json(result);
        } catch (error) {
            console.error('Check user error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    });

    // Friend Reviews API Endpoints
    const FacebookFriendsService = require("../services/facebookFriends");
    const FriendReviewsService = require("../services/friendReviews");
    const PortfolioService = require("../services/portfolio");
    const facebookFriendsService = new FacebookFriendsService();
    const friendReviewsService = new FriendReviewsService();
    const portfolioService = new PortfolioService();

    // Sync Facebook friends
    app.post('/api/sync-facebook-friends', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            if (!req.user.facebookAccessToken) {
                return res.status(400).json({ error: 'Facebook not connected' });
            }

            const friends = await facebookFriendsService.fetchFacebookFriends(
                req.user._id.toString(), 
                req.user.facebookAccessToken
            );

            await UserModel.findByIdAndUpdate(req.user._id, {
                friendsSynced: true,
                lastFriendsSync: new Date()
            });

            res.json({ 
                success: true, 
                friendCount: friends.length,
                message: `Synced ${friends.length} Facebook friends`
            });
        } catch (error) {
            logger.error("API:: Error syncing Facebook friends: " + error.message);
            res.status(500).json({ error: 'Failed to sync Facebook friends' });
        }
    });

    // Get friend reviews for a provider
    app.get('/api/provider/:providerId/friend-reviews', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { providerId } = req.params;
            const accessToken = req.user.facebookAccessToken;
            const reviewsData = await friendReviewsService.getReviewsWithFriendContext(
                req.user._id.toString(), 
                providerId,
                accessToken
            );

            res.json(reviewsData);
        } catch (error) {
            logger.error("API:: Error getting friend reviews: " + error.message);
            res.status(500).json({ error: 'Failed to get friend reviews' });
        }
    });

    // Get provider reviews summary with friend context
    app.get('/api/provider/:providerId/reviews-summary', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { providerId } = req.params;
            const accessToken = req.user.facebookAccessToken;
            const summary = await friendReviewsService.getProviderReviewsSummary(
                req.user._id.toString(), 
                providerId,
                accessToken
            );

            res.json(summary);
        } catch (error) {
            logger.error("API:: Error getting provider reviews summary: " + error.message);
            res.status(500).json({ error: 'Failed to get reviews summary' });
        }
    });

    // Mark review as helpful
    app.post('/api/review/:reviewId/helpful', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { reviewId } = req.params;
            const result = await friendReviewsService.markReviewHelpful(
                req.user._id.toString(), 
                reviewId
            );

            res.json(result);
        } catch (error) {
            logger.error("API:: Error marking review as helpful: " + error.message);
            res.status(500).json({ error: 'Failed to mark review as helpful' });
        }
    });

    // Report a review
    app.post('/api/review/:reviewId/report', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { reviewId } = req.params;
            const { reason } = req.body;
            const result = await friendReviewsService.reportReview(
                req.user._id.toString(), 
                reviewId, 
                reason
            );

            res.json(result);
        } catch (error) {
            logger.error("API:: Error reporting review: " + error.message);
            res.status(500).json({ error: 'Failed to report review' });
        }
    });

    // Get user's Facebook friends
    app.get('/api/facebook-friends', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const friends = await facebookFriendsService.getFacebookFriends(
                req.user._id.toString()
            );

            res.json({ friends, count: friends.length });
        } catch (error) {
            logger.error("API:: Error getting Facebook friends: " + error.message);
            res.status(500).json({ error: 'Failed to get Facebook friends' });
        }
    });

    // Update user's friend review preferences
    app.put('/api/user/friend-review-settings', async function(req, res) {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
            const { allowFriendReviews } = req.body;
            
            await UserModel.findByIdAndUpdate(req.user._id, {
                allowFriendReviews: allowFriendReviews,
                lastUpdate: new Date()
            });

            res.json({ success: true, message: 'Settings updated successfully' });
        } catch (error) {
            logger.error("API:: Error updating friend review settings: " + error.message);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

    // Portfolio API Endpoints
    
    // Get provider portfolio
    app.get('/api/provider/:providerId/portfolio', async function(req, res) {
        try {
            const { providerId } = req.params;
            const { category } = req.query;
            
            let portfolioData;
            if (category && category !== 'all') {
                portfolioData = await portfolioService.getPortfolioByCategory(providerId, category);
            } else {
                portfolioData = await portfolioService.getProviderPortfolio(providerId);
            }
            
            res.json(portfolioData);
        } catch (error) {
            logger.error("API:: Error getting provider portfolio: " + error.message);
            res.status(500).json({ error: 'Failed to get portfolio' });
        }
    });

    // Get specific portfolio item
    app.get('/api/provider/:providerId/portfolio/:itemId', async function(req, res) {
        try {
            const { providerId, itemId } = req.params;
            const portfolioItem = await portfolioService.getPortfolioItem(providerId, itemId);
            
            res.json(portfolioItem);
        } catch (error) {
            logger.error("API:: Error getting portfolio item: " + error.message);
            if (error.message === 'Portfolio item not found') {
                res.status(404).json({ error: 'Portfolio item not found' });
            } else {
                res.status(500).json({ error: 'Failed to get portfolio item' });
            }
        }
    });

    // Get portfolio statistics
    app.get('/api/provider/:providerId/portfolio-stats', async function(req, res) {
        try {
            const { providerId } = req.params;
            const portfolioData = await portfolioService.getProviderPortfolio(providerId);

            res.json({
                stats: portfolioData.stats,
                provider: portfolioData.provider
            });
        } catch (error) {
            logger.error("API:: Error getting portfolio stats: " + error.message);
            res.status(500).json({ error: 'Failed to get portfolio statistics' });
        }
    });

    // ==================== CHAT SUPPORT ROUTES ====================

    // Check if chat support is configured
    app.get('/api/chat/status', function(req, res) {
        const language = req.query.lang || res.locals.locale || 'en';
        const statusMessages = {
            en: {
                available: 'Chat support is available',
                unavailable: 'Chat support is not configured'
            },
            fr: {
                available: 'Le support par chat est disponible',
                unavailable: 'Le support par chat n\'est pas configuré'
            }
        };

        const messages = statusMessages[language] || statusMessages.en;

        res.json({
            available: chatSupport.isConfigured(),
            message: chatSupport.isConfigured() ? messages.available : messages.unavailable,
            language: language
        });
    });

    // Test RAG system connection (detailed diagnostics)
    app.get('/api/chat/test-rag', async function(req, res) {
        try {
            const diagnostics = {
                timestamp: new Date().toISOString(),
                environment: {
                    OLLAMA_URL: process.env.OLLAMA_URL,
                    LLAMA_MODEL: process.env.LLAMA_MODEL,
                    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL
                },
                tests: {}
            };

            // Test 1: Check if RAG service is configured
            diagnostics.tests.isConfigured = await chatSupport.isConfigured();

            // Test 2: Get RAG status
            try {
                const ragStatus = await chatSupport.getStatus();
                diagnostics.tests.ragStatus = ragStatus;
            } catch (error) {
                diagnostics.tests.ragStatus = { error: error.message };
            }

            // Test 3: Try to connect to Ollama
            try {
                const ollamaResponse = await fetch(`${process.env.OLLAMA_URL}/api/tags`);
                if (ollamaResponse.ok) {
                    const data = await ollamaResponse.json();
                    diagnostics.tests.ollamaConnection = {
                        success: true,
                        models: data.models ? data.models.map(m => m.name) : []
                    };
                } else {
                    diagnostics.tests.ollamaConnection = {
                        success: false,
                        status: ollamaResponse.status,
                        statusText: ollamaResponse.statusText
                    };
                }
            } catch (error) {
                diagnostics.tests.ollamaConnection = {
                    success: false,
                    error: error.message
                };
            }

            // Test 4: Check if vector database exists
            const fs = require('fs');
            const path = require('path');
            const vectorDbPath = path.join(__dirname, '../data/vector_db.json');
            diagnostics.tests.vectorDatabase = {
                exists: fs.existsSync(vectorDbPath),
                path: vectorDbPath
            };
            if (fs.existsSync(vectorDbPath)) {
                const stats = fs.statSync(vectorDbPath);
                diagnostics.tests.vectorDatabase.size = `${(stats.size / 1024).toFixed(2)} KB`;
            }

            // Test 5: Get provider info
            diagnostics.tests.provider = chatSupport.getProvider();

            // Overall status
            diagnostics.overall = {
                ready: diagnostics.tests.isConfigured &&
                       diagnostics.tests.ollamaConnection?.success &&
                       diagnostics.tests.vectorDatabase?.exists,
                message: diagnostics.tests.isConfigured ?
                    'RAG system is initialized' :
                    'RAG service not initialized - check Ollama connection and vector database'
            };

            res.json(diagnostics);
        } catch (error) {
            logger.error("CHAT API:: Error testing RAG system: " + error.message);
            res.status(500).json({
                success: false,
                error: error.message,
                stack: error.stack
            });
        }
    });

    // Get suggested questions (bilingual)
    app.get('/api/chat/suggestions', function(req, res) {
        const language = req.query.lang || res.locals.locale || 'en';
        res.json({
            questions: chatSupport.getSuggestedQuestions(language),
            language: language
        });
    });

    // Send a chat message (bilingual)
    app.post('/api/chat/message', async function(req, res) {
        try {
            if (!chatSupport.isConfigured()) {
                const language = req.body.language || res.locals.locale || 'en';
                const errorMessages = {
                    en: 'Chat support is not currently available',
                    fr: 'Le support par chat n\'est pas disponible actuellement'
                };

                return res.status(503).json({
                    success: false,
                    error: errorMessages[language] || errorMessages.en
                });
            }

            const { message, conversationHistory, language } = req.body;

            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                const lang = language || res.locals.locale || 'en';
                const errorMessages = {
                    en: 'Message is required',
                    fr: 'Le message est requis'
                };

                return res.status(400).json({
                    success: false,
                    error: errorMessages[lang] || errorMessages.en
                });
            }

            // Validate conversation history if provided
            const history = Array.isArray(conversationHistory) ? conversationHistory : [];

            // Limit conversation history to last 10 messages to prevent token overflow
            const limitedHistory = history.slice(-10);

            // Use provided language or detect from message
            const userLanguage = language || res.locals.locale || null;

            const response = await chatSupport.sendMessage(message.trim(), limitedHistory, userLanguage);

            res.json(response);
        } catch (error) {
            logger.error("CHAT API:: Error processing chat message: " + error.message);
            const lang = req.body.language || res.locals.locale || 'en';
            const errorMessages = {
                en: 'An error occurred while processing your message',
                fr: 'Une erreur s\'est produite lors du traitement de votre message'
            };

            res.status(500).json({
                success: false,
                error: errorMessages[lang] || errorMessages.en
            });
        }
    });

    // ==================== END CHAT SUPPORT ROUTES ====================

    app.get('*', async function (req, res) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("page_not_found", {usr: req.user, lang: res.locals.locale, map_api_key: process.env.GOOGLE_MAPS_API_KEY, firstCor: 'none',currtab: 'dash',  notifications: notifs, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:req.link});
        }else
         res.render("page_not_found", {usr: null, lang: res.locals.locale, firstCor: 'none', map_api_key: process.env.GOOGLE_MAPS_API_KEY, currtab: 'home', notifications: null, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:null });
    });
    
    app.use(async function(req, res, next) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("page_not_found", {usr: req.user, lang: res.locals.locale, firstCor: 'none', currtab: 'dash', notifications: notifs, cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:req.link});
        }else
         res.render("page_not_found", {usr: null, notifications: null, lang: res.locals.locale, currtab: 'home', firstCor: 'none', cats: categories, recaptchaKey: process.env.RECAPTCHA_KEY_ID, link:null });
    });
}




