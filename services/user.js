/*********************************************************************************************************
*	User.js : Handles user operations and requests.
* Author: Constant Pagoui.
*	Date: 03-18-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const UserModel = require("../models/user");
const ArchivedUserModel = require("../models/archivedUser");
const TokenModel = require("../models/token");
const CategoryModel = require("../models/category");
const NotificationModel = require("../models/notification");
const EmailSender = require("../services/emailsender");
const _ = require("lodash");
const mongoose = require("mongoose");
const sanitizer = require('sanitize')();
mongoose.set('strictQuery', false);
const passport = require("passport");
const CountryModel = require("../models/country");
const RatingModel = require("../models/rating");
const PostRequestModel = require("../models/postRequest");
const BookingModel = require("../models/booking");
const JobApplication = require("./jobApplication");
const JobApplicationModel = require("../models/jobApplication");
const userEmailSender = new EmailSender();
const log4js = require("log4js");
const PostRequestService = require("./postrequest");
const QuotationRequestModel = require("../models/quotationRequest");
const logger = log4js.getLogger();
const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);
const SearchTranslation = require('./searchTranslation');

passport.use(UserModel.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  UserModel.findById(id, function(err, user) {
    done(err, user);
  });
});

// exports.sanitizeUser = function(user) {
//   return {
//     id: user._id,
//     username: user.username,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     accountType: user.accountType,
//     category: user.category,
//     photo: user.photo,
//     role: user.role
//   };
// };

const UserService = {
  login: async (req, res) => {

   
    if(req.user.verified && !req.user.twoFactAuth){
      
      if(req.isAuthenticated()){
        console.log("USER:: User has been successfully logged in");
        return res.status(200).send({message:"OK", status:200});
        
      }else{
        console.log("USER:: incorrect pass");
        return res.status(403).send({message:"Incorrect username or password.", id:user._id, status:403});
      }
    }
    logger.warn("USER AUTH:: User has not been verified.");
    const user = req.user;
    req.logout(function(err){
      if(err){return next(err);}
    });
    if(user.twoFactAuth){
      console.log("USER:: User has two fatcors auths enabled.");
      return res.status(405).send({message:"Verify code for 2 facts auth", id:user._id, status:405});
    } else return res.status(402).send({message:"Your account has not been verified.", id:user._id, status: 402} );
      //});
  
  },
  register: async (req, res) => {
    let newUser = null;
    let password = "";
    let isPro = false;
    let isPhoneRegistration = req.body.registrationType === 'phone';
    
    if(req.body.userType == "provider"){
      
      const category = await CategoryModel.findOne({name:req.body.pCategory}).exec();
      const countryCode = await CountryModel.findOne({name: req.body.country_p}).exec();
      
      // For phone registration, use phone as username and generate temporary email
      let userEmail = req.body.pEmail;
      let username = req.body.pEmail;
       
      if(isPhoneRegistration && !userEmail) {
        // Generate temporary email for phone registration
        userEmail = ' ';
        username = req.body.pPhone;
      }
      
      newUser = await new UserModel({
        categoryId : category._id,
        category: category.name,
        firstName: _.trim(_.capitalize(req.body.pFirstName)),
        lastName: _.trim(_.capitalize(req.body.pLastName)),
        email: _.trim(_.toLower(userEmail)),
        phone: _.trim(req.body.pPhone), 
        address: _.trim(req.body.pAddress),
        username: _.trim(_.toLower(username)),
        registeredAsPro: true,
        strictlyPro: true,
        accountType: req.body.userType,
        countryCode: countryCode.phone_code,
        currency: countryCode.currency,
        verified: false,
        phoneVerified: isPhoneRegistration ? false : true, // Phone needs OTP verification
        country: req.body.country_p,
        subscriptionPlan: "",
        city: req.body.city_p,
        registrationType: req.body.registrationType || 'email',
        createdAt: new Date(),
        lastUpdate: new Date()
      });
      password = req.body.pPassword;
    }
    else{
      const countryCode = await CountryModel.findOne({name: req.body.country}).exec();
      
      // For phone registration, use phone as username and generate temporary email
      let userEmail = req.body.email;
      let username = req.body.email;
      
      if(isPhoneRegistration && !userEmail) {
        // Generate temporary email for phone registration  
        userEmail = ' ';
        username = req.body.phone;
      }
      
      newUser = new UserModel({
        firstName: _.capitalize(req.body.firstName),
        lastName: _.capitalize(req.body.lastName),
        email: _.trim(_.toLower(userEmail)),
        phone: req.body.phone,
        address: req.body.address,
        username: _.trim(_.toLower(username)),
        accountType: req.body.userType,
        countryCode: countryCode.phone_code,
        verified: false,
        phoneVerified: isPhoneRegistration ? false : true, // Phone needs OTP verification
        country: req.body.country,
        currency: countryCode.currency,
        subscriptionPlan: "",
        city: req.body.city,
        registrationType: req.body.registrationType || 'email',
        createdAt: new Date(),
        lastUpdate: new Date()
      });
      password = req.body.password;
    }
    // const stripeCustomer = await stripe.customers.create({
    //   name: `${newUser.firstName} ${newUser.lastName}`,
    //   email: newUser.email,
    // });

    // const subPrices = await stripe.prices.search({
    //   query: 'lookup_key:"free_price"'
    // });

    // await stripe.subscriptions.create({
    //   customer: stripeCustomer?.id,
    //   items: [{
    //     price: subPrices.data[0]?.id
    //   }]
    // });

    try{
      // Check for existing user based on registration type
      let existingUser = null;
      
      if(isPhoneRegistration) {
        // For phone registration, check if phone number already exists
        const phoneToCheck = req.body.userType === 'provider' ? req.body.pPhone : req.body.phone;
        existingUser = await UserModel.findOne({phone: phoneToCheck}).exec();
        
        if(existingUser) {
          const msg = "User with given phone number already exists!"; 
          res.status(300).send(msg);
          return;
        }
      } else {
        // For email registration, check if email already exists
        existingUser = await UserModel.findOne({email: newUser.email}).exec();
        
        if(existingUser) {
          const msg = "User with given email already exists!"; 
          res.status(300).send(msg);
          return;
        }
      }
      
      logger.info(`USER:: ${isPhoneRegistration ? 'Phone' : 'Email'} is solid, none found.`);
      
      await UserModel.register(newUser, password, async function(err, u){
        if (err) {
          logger.error("USER:: User Registration error: "+err);
          res.status(409).send({error: err});
          return;
        } else {
          let tok = TokenModel.findOne({ userId: newUser._id }).exec();
          TokenModel.findByIdAndRemove(tok._id).exec();
          logger.info("User has been successfully registered.");
          
          if(isPhoneRegistration) {
            // For phone registration, send OTP
            const TwilioPhoneAuthService = require("../services/twilioPhoneAuth");
            const twilioService = new TwilioPhoneAuthService();
            
            const phoneToVerify = req.body.userType === 'provider' ? req.body.pPhone : req.body.phone;
            const selectedCountry = req.body.userType === 'provider' ? req.body.country_p : req.body.country;
            const countryInfo = await CountryModel.findOne({name: selectedCountry}).exec();
            const userCountryCode = countryInfo ? countryInfo.phone_code : '+1';
            
            const otpResult = await twilioService.sendOTP(res, phoneToVerify, newUser.email, userCountryCode);
            
            if(otpResult.success) {
              res.status(200).send({userId: newUser._id, status:200, registrationType: 'phone'});
              return;
            } else {
              logger.warn("USER:: Could not send OTP!");
              res.status(408).send({error: "USER:: Could not send OTP!"});
              return;
            }
          } else {
            // For email registration, send email verification
            if(userEmailSender.sendCode(6, newUser)){
              res.status(200).send({userId: newUser._id, status:200, registrationType: 'email'});
              return;
            } else {
              logger.warn("USER:: Could not send code!");
              res.status(408).send({error: "USER:: Could not send code!"});
              return;
            }
          }
        }
      });
      return;
    }catch(error){
        res.status(400).send("USER:: An error occurred : "+error);
        return;
    }
    return;
  
  },
  sendVerificationCode: async(req, res)=>{
    try{
      const user = await UserModel.findOne({email:req.body.email}).exec();
      
      if(user){
        if(userEmailSender.sendRecoveryCode(6, user)){
            //res.render("emailVerification", {usr: null, link:null, cats: categories, userId: newUser._id});
            res.status(200).send({userId: user._id, status:200});
            return;
        }else{
          logger.warn("USER:: User found but could not send code!");
          console.log("USER:: User found but could not send code!");
          res.status(408).send("USER:: Could not send code!");
          return;
        }
      }
      else{
        logger.warn("USER:: Could not find user!");
        console.log("USER:: Could not find user!");
        res.status(408).send({status:408, msg:"USER:: Could not find user!"});
        return;
      }
    }catch(error){
      logger.error("USER:: (sendVerificationCode) An error occured : "+error);
      console.log("USER:: (sendVerificationCode) An error occured : "+error);
      res.status(400).send("USER:: (sendVerificationCode) An error occured : "+error);
      return;
    }
  },
  resendCode: async(req, res)=>{
    try{
      const id = req.params.id != ""? req.params.id: req.body.id;
      let user = await UserModel.findById(id).exec();
      if(user){
        console.log("USER:: User found, resending email.. "+user._id);
          let tokens = await TokenModel.find({ userId: user._id }).exec();
          if(tokens.length > 0){
            tokens.forEach(async (tok)=>{
              await TokenModel.findByIdAndRemove(tok._id).exec();
            });
          }

          let email_ = user.email.charAt(0);
          const atIndex = user.email.indexOf('@');
          for(let i = 0; i < atIndex; i++){
              email_ = email_ + "*";
          }
          email_ = email_ + user.email.substr(atIndex, user.email.length-1);
          if(req.body.redirect_link == "/"){
            if(await userEmailSender.sendCode(6, user)){
              res.render("emailVerification", {usr: null, link:null, currtab:'home', cats: categories, email:email_, userId: user._id, recaptchaKey: process.env.RECAPTCHA_KEY_ID, lang: res.locals.locale, redirect_link:req.body.redirect_link });
              //res.status(200).send({userId: user._id, status:200});
              return;
            }else{
                logger.warn("USER:: Could not resend code!");
                console.log("USER:: Could not resend code!");
                res.status(408).send({status:408, msg:"USER:: Could not resend code!"});
                return;
            }
          } 
          else{
            if(await userEmailSender.sendRecoveryCode(6, user)){
              //res.render("emailVerification", {usr: null, link:null, cats: categories, email:email_, userId: user._id, redirect_link:req.body.redirect_link });
              res.status(200).send({userId: user._id, status:200});
              return;
            }else{
                logger.warn("USER:: Could not resend code!");
                console.log("USER:: Could not resend code!");
                res.status(408).send({status:408, msg:"USER:: Could not resend code!"});
                return;
            }
          }
      }
      else{
          console.log("USER:: User not found, could not resend email.");
          // res.render("emailVerification", {usr: null, link:null, cats: categories, email: null, userId: req.params.id, recaptchaKey: process.env.RECAPTCHA_KEY_ID, redirect_link:req.body.redirect_link});
          res.status(402).send({status:402, msg:"USER:: Could not find user!"});
          return;
      }
      
    }catch(error){
      logger.error("USER:: An error occured: "+ error);
        //res.status(400).send("USER:: An error occured : "+error);
        res.redirect("/");
        return;
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.body.id }).exec();
      if (!user) return res.status(400).send("USER:: User : Invalid link. User id: "+req.body.id);
  
      const token = await TokenModel.findOne({ userId: user._id}).exec();

      if (!token) return res.status(400).send("USER:: Token : Invalid link");
      
      const codeEntered = ""+req.body.first + req.body.second + req.body.third + req.body.fourth + req.body.fifth + req.body.sixth;
      if(codeEntered == token.token){
        console.log("USER:: Code verification successful! logging in the user..");
        logger.info("USER:: Code verification successful! logging in the user..");
          req.login(user, function(err){
              if (err) {
                console.log("USER:: An error occured (Email Verification): "+err);
                logger.error("USER:: An error occured (Email Verification): "+err);
                  return res.status(400).send({msg:"An error occured (Email Verification)", status: 400});
                  // TODO: activate error message on modal
              } else {
                      logger.info("USER:: Email verification: User has been successfully logged in");
                      console.log("USER:: Email verification: User has been successfully logged in");
                      UserModel.updateOne({ _id: user._id}, {$set: {verified: true}} ).exec();
                      TokenModel.findByIdAndRemove(token._id).exec();
                      //res.redirect("/");
                      return res.status(200).send({msg:" Code verification successful!", status:200});
              }
          });
          return;
      }
      else{
          // req.logout(function(err){
          //   if(err){console.log(err);}
          // });
          console.log("USER:: Email verification: Code entered does not match the one sent!");
          //res.redirect(req.get('referer'));
          return res.status(400).send("USER:: Email verification: Code entered does not match the one sent!");
          //res.render("emailVerification", {usr: null, cats: categories, userId: user._id});
      }
      
    } catch (error) {
        logger.error("USER:: An error occured (Email verification): "+ error);
        console.log("USER:: An error occured (Email verification): "+ error);
        return res.status(400).send("An error occured : "+error);
    }
  },
  updateSkills: async(req, res)=>{
    const user = await UserModel.findById(req.user._id).exec();
    if(user){
      user.skills = req.body.skills;
      user.lastUpdate = new Date();
      user.save().then(succ=>{
        return res.status(200).send({msg: "Skills updated successfully.", status: 200});
      }).catch(err=>{
        console.log("Error occured while updating skills: ", err);
        return res.status(400).send({msg: "Error occured while updating skills: "+err, status:400});
      })
    }
  },
  submitHelpRequestMessage: async(req, res)=>{
    try{
      const userFullName = req.body.fname + " "+req.body.lname;
      const userEmail = req.body.email;
      const userMessage = req.body.user_message;

      // const user = await UserModel.findOne({email:userEmail}).exec();
      
      // if(user){
        if(userEmailSender.sendHelpRequestToTeam(userFullName, userEmail, userMessage)){
            if(userEmailSender.sendHelpRequestAck(userFullName, userEmail)){
              logger.info("USER:: request acknowledge email has been successfully sent.");
            }else{
              logger.error("USER:: Error occured while sending request acknowledgement email.");
            }
            logger.info("USER:: request email has been successfully sent to the team.");
            return res.status(200).send({message: "OK", status:200});
            
        }else{
          logger.warn("USER:: User found but could not send email to the team!");
          return res.status(408).send("USER:: Could not send email to the team.");
        }
      // }
      // else{
      //   logger.warn("USER:: Could not find user! Email not sent to the team.");
      //   res.status(408).send({status:408, msg:"USER:: Could not find user!"});
      //   return;
      // }
    }catch(error){
      logger.error("USER:: (sendHelpRequestMessage) An error occured : "+error);
      res.status(400).send("USER:: (ssendHelpRequestMessage) An error occured : "+error);
      return;
    }
  },

  verifyCode: async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.body.id }).exec();
      if (!user) return res.status(400).send("USER:: User : Invalid link. User id: "+req.body.id);
  
      const token = await TokenModel.findOne({ userId: user._id}).exec();

      if (!token) return res.status(400).send("USER:: Token : Invalid link");
      
      const codeEntered = ""+req.body.first + req.body.second + req.body.third + req.body.fourth + req.body.fifth + req.body.sixth;
      if(codeEntered == token.token){
          console.log("USER:: Code verification successful! logging in the user..");
          logger.info("USER:: Code verification successful! logging in the user..");
          TokenModel.findByIdAndRemove(token._id).exec();
          return res.status(200).send({msg:" Code verification successful!", status:200});
      }
      else{
          console.log("USER:: Email verification: Code entered does not match the one sent!");
          return res.status(400).send("USER:: Email verification: Code entered does not match the one sent!");
          //res.render("emailVerification", {usr: null, cats: categories, userId: user._id});
      }
      
    } catch (error) {
      console.log("USER:: An error occured (Email verification): "+ error);
      logger.error("USER:: An error occured (Email verification): "+ error);
      return res.status(400).send("An error occured : "+error);
    }
  }, 

  find: async(query, userId, currentLanguage = 'en') => {
    const page = parseInt(query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filters = {};
    
    // Base filters
    filters.registeredAsPro = true;
    filters.verified = true;
    
    if(userId)
      filters._id = {$ne: userId};

    // Search filters
    if(query?.country_search && query?.country_search !== "Country" && _.trim(query?.country_search) !== "")
      filters.country = query.country_search;

    if(query?.city_search && query?.city_search !== "Select City" && _.trim(query?.city_search) !== "")
      filters.city = query.city_search;

    if(query?.selected_category && query?.selected_category !== "Category" && query?.selected_category !== "" ){
      filters.category = {$in: [query.selected_category, new RegExp(_.capitalize(query.selected_category.substr(0,5)), "i")]};
    }

    if(query?.search && _.trim(query?.search) !== "") {
      const searchTerm = _.trim(query.search);

      // Get search terms including French-to-English translation if needed
      const searchTerms = SearchTranslation.getSearchTerms(searchTerm, currentLanguage);

      // Create search conditions for role field using bilingual search
      const roleConditions = [];
      searchTerms.forEach(term => {
        roleConditions.push(
          { role: { $regex: new RegExp(term, "i") } },
          { role: { $regex: new RegExp(_.capitalize(term), "i") } },
          { role: { $regex: new RegExp(term.substr(0,4), "i") } }
        );
      });

      // Standard search conditions for other fields
      const standardConditions = [
        { firstName: {$in: [searchTerm, _.capitalize(searchTerm), _.lowerCase(searchTerm), new RegExp(_.capitalize(searchTerm.substr(0,4)), "i")] }},
        { lastName: {$in: [searchTerm, _.capitalize(searchTerm), _.lowerCase(searchTerm), new RegExp(_.capitalize(searchTerm.substr(0,4)), "i")] }},
        { category: {$in: [searchTerm, _.capitalize(searchTerm), new RegExp(_.capitalize(searchTerm.substr(0,4)), "i")] }}
      ];

      filters.$or = [...roleConditions, ...standardConditions];
    }

    // Execute query with pagination
    var res = await UserModel.find(filters).select('firstName lastName country city photo category role city country rating ratingCount _id')
      .sort({createdAt:-1})
      .skip(skip)
      .limit(limit)
      .exec();

    // If no results found with strict filters, try broader search
    if(res.length == 0 && (query?.search || query?.selected_category)) {
      const broadFilters = {
        registeredAsPro: true,
        verified: true
      };
      
      if(userId)
        broadFilters._id = {$ne: userId};
        
      if(query?.country_search && query?.country_search !== "Country")
        broadFilters.country = query.country_search;
      
      if(query?.city_search && query?.city_search !== "Select City")
        broadFilters.city = query.city_search;
        
      if(query?.search && _.trim(query?.search) !== "") {
        const searchTerm = _.trim(query.search);
        const searchTerms = SearchTranslation.getSearchTerms(searchTerm, currentLanguage);

        // Create broader search conditions for role field using bilingual search
        const roleBroadConditions = [];
        searchTerms.forEach(term => {
          roleBroadConditions.push({ role: new RegExp(term, "i") });
        });

        // Standard broader search conditions
        const standardBroadConditions = [
          { firstName: new RegExp(searchTerm, "i") },
          { lastName: new RegExp(searchTerm, "i") },
          { category: new RegExp(searchTerm, "i") }
        ];

        broadFilters.$or = [...roleBroadConditions, ...standardBroadConditions];
      }
      
      res = await UserModel.find(broadFilters).select('firstName lastName country city photo category role city country rating ratingCount _id')
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .exec();
    }
    return res;
  },
  getProviders : async()=>{
    const providers = await UserModel.find({accountType:"provider"}).limit(8).exec();
    return providers;
  },
  update: async (data) => {
    data.lastUpdate = new Date();
    data.skills = data.skills.toString().split(",").filter(skill => skill !== '');
    const res = await UserModel.findByIdAndUpdate(data._id, data);
    if(!res)
      return false;
    return true;
  },
  createSubscription: async (_id, type) => {
    let period = 0;
    if(type === "bronze")
      period = 90;
    else if(type === "gold")
      period = 180;
    else if(type === "platinum")
      period = 365;
    
    const expire = new Date();
    expire.setDate(expire.getDate() + period);
    const subscription = {
      expire: expire.valueOf(),
      plan: type,
      lastUpdate: new Date()
    }
    const res = await UserModel.findByIdAndUpdate(_id, { subscription });
  },

  updateUser: async (userData) => {
    userData.lastUpdate = new Date();
    const result = await UserModel.findByIdAndUpdate(userData._id, userData);
    if(result)
      logger.info("USER:: User updated");
    else
      logger.info("USER:: Update failed");
  }, 
  updatePassword : async(req, res)=>{
      req.user.authenticate(req.body.accountPassword, function(err,model,passwordError){
        if(passwordError){
          logger.error("USER:: Error occured while authenticating user: "+err);
          res.status(400).send({status:400, message: 'The given password is incorrect!!'});
          return;
         } else if(model) {

          req.user.setPassword(req.body.newPassword, function(){
            req.user.lastUpdate = new Date();
            req.user.save();
            return res.status(200).send({status: 200, message:'Password has been updated successfully!'});
            });
          } else {
            logger.warn('USER:: Incorrect password');
            return res.status(304).send({status: 304, message: "Inccorect password"});
        }
    return;
    });
  },

  deleteUserAccount: async(req, res)=>{
    req.user.authenticate(req.body.accountPassword, async function(err,model,passwordError){
      if(passwordError){
        console.log("USER:: Account Deletion - Error occured while authenticating user: "+err);
        return res.status(410).send({status:410, message:'The given password is incorrect!!'});
       } else if(model) {
          console.log("USER:: Checking if user has active requests...");
          const requests = await PostRequestModel.find({username: req.user.username}).exec();
          console.log("USER:: requests: ", requests.length);
          requests.forEach(r=>{
            if(r.status === 'in-progress' || r.status === 'booked'){
                console.log("User has "+r.status+" request: "+r.requestTitle);
                return res.status(411).send({status: 411, message:'User has active requests'});
              }
            });
            const bookings = await BookingModel.find({username: req.user.username}).exec();
            console.log("USER:: bookings: ", bookings.length);
            bookings.forEach(b=>{
              if(b.status === 'active' || b.status === 'in-progress' || b.status === 'booked'){
                console.log("User has "+b.status+" booking: "+b.bookingTitle);
                return res.status(411).send({status: 411, message:'User has active requests'});
              }
            });
            const qRequests = await QuotationRequestModel.find({username: req.user.username}).exec();
            console.log("USER:: quotations: ", qRequests.length);
            qRequests.forEach(qr=>{
              if(qr.status === 'active' || qr.status === 'in-progress' || qr.status === 'booked'){
                console.log("User has "+qr.status+" booking: "+qr.requestTitle);
                return res.status(411).send({status: 411, message:'User has active quotations requests'});
              }
            });
          requests.forEach(async r=>{
              const reqst = await PostRequestModel.findByIdAndUpdate(r._id, {status: 'archived'}).exec();
          });
          bookings.forEach(async b=>{
              const bkgs = await BookingModel.findByIdAndUpdate(b._id, {status: 'archived'}).exec();
          });
          qRequests.forEach(async qr=>{
              const qrs = await QuotationRequestModel.findByIdAndUpdate(qr._id, {status:'archived'});
          });
          if(!req.user.registeredAsPro){
          
            const archivedUser = new ArchivedUserModel({
              active: false,
              verified: false,
              firstName: req.user.firstName,
              lastName: req.user.lastName,
              payments: req.user.payments,
              description: req.user.description,
              email: req.user.email,
              username: req.user.username,
              country: req.user.country,
              city: req.user.city,
              countryCode: req.user.countryCode,
              facebook_id: req.user.facebook_id,
              google_id: req.user.google_id,
              role: req.user.role,
              rate: req.user.rate,
              skills: req.user.skills,
              favoriteProviders: req.user.favoriteProviders,
              accountType: req.user.accountType,
              registeredAsPro: req.user.registeredAsPro,
              rating: req.user.rating,
              category: req.user.category,
              photo: req.user.photo,
              subscriptionPlan: req.user.subscriptionPlan,
              createdAt: new Date(),
              lastUpdate: new Date()
            });
            console.log("USER:: Archived user: "+archivedUser);
            await archivedUser.save().then(succes=>{
              console.log("USER:: successfully archived user: "+archivedUser);
              return res.status(210).send({status: 210, message:'successfully archived user!'});
            }).catch(error=>{
              console.log("USER:: Error occured while saving archived user: "+error);
              return res.status(511).send({status: 512, message:'Error occured while saving archived user'});
            });
          }else{
            
            const user__ = await UserModel.findByIdAndUpdate(req.user._id, {strictlyPro: true, accountType: 'provider'}).exec().then(succ=>{
              console.log("USER:: User has been successfully set user as strictly provider!");
              return res.status(211).send({status: 211, message:'successfully set user as strictly provider'});
            }).catch(error=>{
              console.log("Error occured while setting user as strictly pro: "+error);
              return res.status(512).send({status: 512, message:'Error occured while setting user as strictlyPro'}); 
            });
            
          }
        return res.status(512).send({status: 513, message:'Error occured while  deleting user account'});
      }
  });
},
deleteProAccount: async(req, res)=>{
  req.user.authenticate(req.body.accountPassword, async function(err,model,passwordError){
    if(passwordError){
      console.log("USER:: Pro Account Deletion - Error occured while authenticating user: "+err);
      return res.status(410).send({status:410, message:'The given password is incorrect!!'});
     } else if(model) {
        console.log("USER:: Checking if pro has active requests...");
        const requests = await PostRequestModel.find({providerId: req.user._id}).exec();
        console.log("USER:: requests: ", requests.length);
        requests.forEach(r=>{
          if(r.status === 'in-progress' || r.status === 'booked'){
              console.log("Pro has "+r.status+" request: "+r.requestTitle);
              return res.status(411).send({status: 411, message:'Provider has active requests'});
            }
          });
          const bookings = await BookingModel.find({providerId: req.user._id}).exec();
          console.log("USER:: bookings: ", bookings.length);
          bookings.forEach(b=>{
            if(b.status === 'active' || b.status === 'in-progress' || b.status === 'booked'){
              console.log("Pro has "+b.status+" booking: "+b.bookingTitle);
              return res.status(411).send({status: 411, message:'Pro has active requests'});
            }
          });
          const qRequests = await QuotationRequestModel.find({providerId: req.user._id}).exec();
          console.log("USER:: quotations: ", qRequests.length);
          qRequests.forEach(qr=>{
            if(qr.status === 'active' || qr.status === 'in-progress' || qr.status === 'booked'){
              console.log("Pro has "+qr.status+" booking: "+qr.requestTitle);
              return res.status(411).send({status: 411, message:'Pro has active quotations requests'});
            }
          });
        requests.forEach(async r=>{
            const reqst = await PostRequestModel.findByIdAndUpdate(r._id, {status: 'archived'}).exec();
        });
        bookings.forEach(async b=>{
            const bkgs = await BookingModel.findByIdAndUpdate(b._id, {status: 'archived'}).exec();
        });
        qRequests.forEach(async qr=>{
            const qrs = await QuotationRequestModel.findByIdAndUpdate(qr._id, {status:'archived'});
        });
        if(req.user.strictlyPro){
        
          const archivedUser = new ArchivedUserModel({
            active: false,
            verified: false,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            payments: req.user.payments,
            description: req.user.description,
            email: req.user.email,
            username: req.user.username,
            country: req.user.country,
            city: req.user.city,
            countryCode: req.user.countryCode,
            facebook_id: req.user.facebook_id,
            google_id: req.user.google_id,
            role: req.user.role,
            rate: req.user.rate,
            skills: req.user.skills,
            favoriteProviders: req.user.favoriteProviders,
            accountType: req.user.accountType,
            registeredAsPro: req.user.registeredAsPro,
            rating: req.user.rating,
            category: req.user.category,
            photo: req.user.photo,
            subscriptionPlan: req.user.subscriptionPlan,
            createdAt: new Date(),
            lastUpdate: new Date()
          });
          console.log("USER:: Archived user: "+archivedUser);
          await archivedUser.save().then(succes=>{
            console.log("USER:: successfully archived user.");
            return res.status(210).send({status: 210, message:'successfully archived user!'});
          }).catch(error=>{
            console.log("USER:: Error occured while saving archived user: "+error);
            return res.status(511).send({status: 512, message:'Error occured while saving archived user'});
          });
        }else{
          
          const user__ = await UserModel.findByIdAndUpdate(req.user._id, {strictlyPro: false, registeredAsPro: false, accountType: 'user'}).exec().then(succ=>{
            console.log("USER:: Pro has been successfully set as strictly user!");
            return res.status(211).send({status: 211, message:'successfully set user as user only'});
          }).catch(error=>{
            console.log("Error occured while setting user as strictly user: "+error);
            return res.status(512).send({status: 512, message:'Error occured while setting user as user only.'}); 
          });
          
        }
      return res.status(512).send({status: 513, message:'Error occured while  deleting user account'});
    }
});
},
 
  removeUser : async(req, res) =>{
      req.logout(function(err){
        if(err){return next(err);}
      });
      await UserModel.findByIdAndDelete(req.body.id).exec().then(succ=>{
        console.log("USER:: User account with id:"+req.body.id+" successfully removed!");
        return res.status(200).send('User acct seleted successfully!');
      }).catch(err=>{
        console.log("USER:: Error occured while deleting user account with id:"+req.body.id+": "+err);
        return res.status(501).send('Error occured while deleting user account!');
      });
  },

  changePassword : async(req, res) =>{
    try{
      const user = await UserModel.findById(req.body.userId).exec();
      if(user){
          user.setPassword(req.body.newPassword,function(){
          user.lastUpdate = new Date();
          user.save();
          res.status(200).send({message:"Ok", status:200});
          return;
          });
        } else {
          logger.warn('USER:: (changePassword) User not found. Password update failed.');
          res.status(304).send({message:"Password update failed", status:304}); 
          return;
      }
    }catch(error){
      logger.error('USER:: (changePassword) Error occured while trying to update password.');
      res.status(304).send({message:"Error occured while trying to update password", status:304});
      return;
    }
    

  },

  findUser: async(req, res)=>{
    let user = await UserModel.findById(req.params.id).exec();
    if(user)
      return user;
    else{
      user = await UserModel.findOne({facebook_id: req.params.id}).exec();
      if(user)
        return user;
      else user = await UserModel.findOne({google_id: req.params.id}).exec();
        return user;
    }
  },

  hireProvider: async(req, res)=>{
    const job = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {providerId: req.body.providerId}).exec();

    const newBooking = await new BookingModel({
      username: req.user.username,
      bookingTitle: job.requestTitle,
      bookingDescription: job.requestDescription,
      providerId:  req.body.providerId,
      category: job.requestCategory,
      jobId: job._id,
      budget: job.budget,
      budgetType: job.budgetType,
      deadline: job.deadline,
      files: job.files,
      createdAt: new Date(),
      lastUpdate: new Date(),
      status: "active"
    }).save();

    const notification = new NotificationModel({
        causedByUserId: req.user._id,
        causedByItem: req.body.jobId,
        bookingId: newBooking._id,
        receiverId: req.body.providerId,
        icon:"fa-check-square-o",
        accountType: "pro",
        title: "Congratulations! You have been hired.",
        content: req.user.firstName+" "+req.user.lastName+" has accepted your job application for the job '"+job.requestTitle+"'. Open to check job's details",
        translations: {fr: {
          title: "Félicitations ! Vous avez été selectioné(e).",
        content: req.user.firstName+" "+req.user.lastName+" a accepté votre candidature pour le service '"+job.requestTitle+"'."
        }},
        createdAt: new Date(),
        lastUpdate: new Date()
      }).save().then(async scss=>{

          const j = await PostRequestModel.findByIdAndUpdate( req.body.jobId, {status:"in-progress", lastUpdate: new Date()}).exec();
          if(j) logger.info("Job request status updated!"); else logger.info("Job request status update failed");

          const jobApplication = await JobApplicationModel.findOneAndUpdate({jobId: req.body.jobId}, {status:"hired", lastUpdate: new Date()}).exec();
          if(jobApplication)
            logger.info("Job application status updated!");
          else  
          logger.info("Job application status update failed");

          res.status(200).send({message: "Provider has been hired and notification has been sent successfully", status: 200});
          logger.info("USER:: Provider has been hired and notification has been sent successfully.");
          return;
      }).catch(err=>{
          res.status(401).send({message: "New notification failed. Error", status: 401});
          logger.error("USER:: New notification failed. Error: "+err);
          return;
      }); 
    
    
  },

  rejectApplication: async(req, res)=>{

    const jobApplication = await JobApplicationModel.findOneAndUpdate({jobId: req.body.jobId}, {status:"rejected", lastUpdate: new Date()}).exec();
    //const request = await PostRequestModel.findByIdAndUpdate();
    if(jobApplication){
      const notification = new NotificationModel({
        causedByUserId: req.user._id,
        causedByItem: jobApplication._id,
        receiverId: req.body.providerId,
        icon: "fa-window-close-o",
        title: "Your job application has been rejected.",
        accountType: "pro",
        content: " Unfortunately, "+req.user.firstName+" has decided to hire another provider for the job: '"+jobApplication.requestTitle+"'.",
        translations: {fr: {
          title: "Votre candidature a été rejetée.",
          content: "Malheureusement, "+req.user.firstName+" a decidé de choisir un autre prestataire pour le service: '"+jobApplication.requestTitle+"'.",
        }},
        createdAt: new Date(),
        lastUpdate: new Date()
      }).save().then(async scss=>{
          res.status(200).send({message: "Provider application has been rejected and notification has been sent successfully", status: 200});
          logger.info("USER:: Provider application has been rejected and notification has been sent successfully.");
          return;
      }).catch(err=>{
          res.status(401).send({message: "New notification failed. Error", status: 401});
          logger.error("USER:: New notification failed. Error: "+err);
          return;
      }); 
      logger.info("Job application status updated!");
    }
    else {
      res.status(401).send({message: "Job application status update failed.", status: 401});
      logger.info("Job application status update failed");
      return;
    }

    return;
  },
  getUserRequests: async(req, res)=>{
    const pRequests = await PostRequestModel.find({username:req.user.username}).sort({lastUpdate:-1}).exec();
    let requests = [];
    if(pRequests){
      for(let i = 0; i < pRequests.length; i++){
        const booking = await BookingModel.findOne({jobId: pRequests[i]._id}).exec();
        if(booking){
          if( booking.providerId && _.trim(booking.providerId) != ""){
            const prov = await UserModel.findById(booking.providerId);
            pRequests[i].pro = prov?.firstName+" "+prov?.lastName;
          }
        }
        else
          pRequests[i].pro = " ";

        requests.push(pRequests[i]);
      }

    }
    return requests;
  },

  addFavPro: async(req, res)=>{
    const currentFavPros = await req.user.favoriteProviders;
    const pro = await UserModel.findById(req.body.proId).exec();
    if(pro){

      currentFavPros.push(req.body.proId);
      req.user.favoriteProviders = currentFavPros.reverse();
      req.user.lastUpdate = new Date();
      req.user.save().then(success=>{
        logger.info("USER:: provider has been added as favorite.");
        res.status(200).send({message: "Ok", status:200});
        return;
      }).catch(err=>{
        logger.error("USER:: An error occured while adding pro as favorite: "+err);
        res.status(401).send({message:"Internal Server Error", status:401});
        return;
      })
    }

  },
  rateProvider: async(req, res)=>{
    const rating = await RatingModel.findOne({jobId: req.body.jobId}).exec();
    if(rating){
      console.log('Rating found: ', rating._id);
      rating.rating = req.body.rating;
      rating.userComment = req.body.userComment;
      rating.ratingTitle = req.body.ratingTitle;
      rating.isPublic = req.body.isPublic !== undefined ? req.body.isPublic : true;
      rating.visibleToFriendsOnly = req.body.visibleToFriendsOnly !== undefined ? req.body.visibleToFriendsOnly : false;
      rating.lastUpdate = new Date();
      await rating.save().then(async (succ)=>{
        const job = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {lastUpdate: new Date(), status:'accepted & rated'}).exec();
        const pro = await UserModel.findById(req.body.proId).exec();
        const booking = await BookingModel.findOne({jobId: job._id}).exec();
        const booking_id = booking != null ? booking._id : " ";
        pro.rating = (pro.rating + req.body.rating ) / 2;
        pro.ratingCount = pro.ratingCount + 1;
        await pro.save();
        const notification = new NotificationModel({
          causedByUserId: req.user._id,
          causedByItem: job._id,
          bookingId: booking_id,
          receiverId: req.body.proId,
          icon:"fa-star-half-o",
          title: "A user has provided a feedback for your service.",
          accountType: "pro",
          content: req.user.firstName+" "+req.user.lastName+" has provided a feedback for your service '"+job.requestTitle+"'. Open to check job's details",
          translations: {fr:{
            title: "Un client vous a laissé un review pour votre prestation.",
            content: req.user.firstName+" "+req.user.lastName+" vous a laissé un review pour le service '"+job.requestTitle+"'."
          }},
          createdAt: new Date(),
          lastUpdate: new Date()
        }).save().then(async scss=>{}).catch(err=>{});
        const emailTitle = "A user has provided a feedback for your service.";
        const emailContent = req.user.firstName+" "+req.user.lastName+" has provided a feedback for your service '"+job.requestTitle+"'. Open to check job's details";
        if(userEmailSender.sendNotification(emailTitle, emailContent, pro.email, pro.firstName))
            console.log("USER:: Notification's email sent to user for rating.");
        res.status(200).send({message: "Ok", status:200});
        console.log("Rating has been saved successfully.");
        return;
      }).catch(err=>{
        console.log("Error occured while saving rating: "+err);
      });
    }else{

      const newRating = await new RatingModel({
        rating: req.body.rating,
        userComment: req.body.userComment,
        jobId: req.body.jobId,
        bookingId: req.body.bookingId,
        userId: req.user._id,
        proId: req.body.proId,
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true,
        visibleToFriendsOnly: req.body.visibleToFriendsOnly !== undefined ? req.body.visibleToFriendsOnly : false,
        createdAt: new Date(),
        lastUpdate: new Date()
      }).save().then(async (succ)=>{
        const job = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {lastUpdate: new Date(), status:'accepted & rated'}).exec();
        const pro = await UserModel.findById(req.body.proId).exec();
        const booking = await BookingModel.findOne({jobId: job._id}).exec();
        const booking_id = booking != null ? booking._id : " ";
        pro.rating = (pro.rating + req.body.rating ) / 2;
        pro.ratingCount = pro.ratingCount + 1;
        await pro.save();
        const notification = new NotificationModel({
          causedByUserId: req.user._id,
          causedByItem: job._id,
          receiverId: req.body.proId,
          bookingId: booking_id,
          icon:"fa-star-half-o",
          title: "A user has provided a feedback for your service.",
          accountType: "pro",
          content: req.user.firstName+" "+req.user.lastName+" has provided a feedback for your service '"+job.requestTitle+"'. Open to check job's details",
          translations: {fr:{
            title: "Un client vous a laissé un review pour votre prestation.",
            content: req.user.firstName+" "+req.user.lastName+" vous a laissé un review pour le service '"+job.requestTitle+"'."
          }},
          createdAt: new Date(),
          lastUpdate: new Date()
        }).save().then(async scss=>{}).catch(err=>{});
        const emailTitle = "A user has provided a feedback for your service.";
        const emailContent = req.user.firstName+" "+req.user.lastName+" has provided a feedback for your service '"+job.requestTitle+"'. Open to check job's details";
        if(userEmailSender.sendNotification(emailTitle, emailContent, pro.email, pro.firstName))
            console.log("USER:: Notification's email sent to user for rating.");
        res.status(200).send({message: "Ok", status:200});
        console.log("Rating has been saved successfully.");
        return;
      }).catch(err=>{
        console.log("Error occured while saving rating: "+err);
      });
    }

  },
  switchAccountType: async(userId) => {
    const user = await UserModel.findById(userId).exec();
    const newAccountType = user.accountType === "provider" ? "user" : "provider"
    await UserModel.findByIdAndUpdate(userId, { accountType: newAccountType,  registeredAsPro: true }).exec();
  },
  setTwoFactorsAuth: async(req, res)=>{
    try{
      if(req.user.twoFactAuth){
        await UserModel.findByIdAndUpdate(req.user._id, {twoFactAuth: false}).exec();
      }else
        await UserModel.findByIdAndUpdate(req.user._id, {twoFactAuth: true}).exec();
      res.status(200).send({message: "Ok", status:200});
      return;
    }catch(err){
      console.log("USER:: Error occurred while setting two factors auth: "+err);
      res.status(300).send({message: err, status:300});
      return;
    }
  },
  setReqUpdateNotifs: async(req, res)=>{
    try{
      if(req.user.reqUpdateNotifs){
        await UserModel.findByIdAndUpdate(req.user._id, {reqUpdateNotifs:false}).exec();
      }else{
        await UserModel.findByIdAndUpdate(req.user._id, {reqUpdateNotifs:true}).exec();
      }
      res.status(200).send({message: "Ok", status: 200});
      return;
    }catch(err){
      console.log("USER:: Error occured while setting reqUpdateNotifs: "+err);
      res.status(300).send({message: err, status: 300});
    }
  },
  setBkgUpdateNotifs: async(req, res)=>{
    try{
      if(req.user.bkgUpdateNotifs){
        await UserModel.findByIdAndUpdate(req.user._id, {bkgUpdateNotifs:false}).exec();
      }else{
        await UserModel.findByIdAndUpdate(req.user._id, {bkgUpdateNotifs:true}).exec();
      }
      res.status(200).send({message: "Ok", status: 200});
      return;
    }catch(err){
      console.log("USER:: Error occured while setting bkgUpdateNotifs: "+err);
      res.status(300).send({message: err, status: 300});
    }
  },
  setMsgUpdateNotifs: async(req, res)=>{
    try{
      if(req.user.msgUpdateNotifs){
        await UserModel.findByIdAndUpdate(req.user._id, {msgUpdateNotifs:false}).exec();
      }else{
        await UserModel.findByIdAndUpdate(req.user._id, {msgUpdateNotifs:true}).exec();
      }
      res.status(200).send({message: "Ok", status: 200});
      return;
    }catch(err){
      console.log("USER:: Error occured while setting msgUpdateNotifs: "+err);
      res.status(300).send({message: err, status: 300});
    }
  },
  setSMSUpdateNotifs: async(req, res)=>{
    //SMSUpdateNotifs
    try{
      if(req.user.SMSUpdateNotifs){
        await UserModel.findByIdAndUpdate(req.user._id, {SMSUpdateNotifs:false}).exec();
      }else{
        await UserModel.findByIdAndUpdate(req.user._id, {SMSUpdateNotifs:true}).exec();
      }
      res.status(200).send({message: "Ok", status: 200});
      return;
    }catch(err){
      console.log("USER:: Error occured while setting SMSUpdateNotifs: "+err);
      res.status(300).send({message: err, status: 300});
    }

  },
  setOppSMSNotifsNotifs: async(req, res)=>{
    // oppSMSNotifs
    try{
      if(req.user.oppSMSNotifs){
        await UserModel.findByIdAndUpdate(req.user._id, {oppSMSNotifs:false}).exec();
      }else{
        await UserModel.findByIdAndUpdate(req.user._id, {oppSMSNotifs:true}).exec();
      }
      res.status(200).send({message: "Ok", status: 200});
      return;
    }catch(err){
      console.log("USER:: Error occured while setting oppSMSNotifs: "+err);
      res.status(300).send({message: err, status: 300});
    }

  },
  updatePaymentMethod: async (req) => {
    try {
      const token = req.body.token;

      if (!token) {
        throw new Error('Payment token is required');
      }

      const user = await UserModel.findOne({_id: req.user._id}).exec();
      if (!user) {
        throw new Error('User not found');
      }

      // Search for existing Stripe customer
      const stripeCustomers = await stripe.customers.search({
        query: `email:"${user.email}"`
      });

      let stripeCustomer;
      if (stripeCustomers.data.length > 0) {
        stripeCustomer = stripeCustomers.data[0];
      } else {
        // Create new Stripe customer if doesn't exist
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user._id.toString()
          }
        });
      }

      // Create payment method from token
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: token
        }
      });

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: stripeCustomer.id
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id
        }
      });

      // Update user record with Stripe customer info
      await UserModel.findByIdAndUpdate(user._id, {
        stripeCustomerId: stripeCustomer.id,
        lastUpdate: new Date()
      });

      console.log(`USER:: Payment method updated for user ${user.email}`);
      return true;

    } catch (error) {
      console.error('USER:: Error updating payment method:', error);
      throw error;
    }
  }
}
module.exports = UserService;
