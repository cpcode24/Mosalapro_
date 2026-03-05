/*********************************************************************************************************
*	App.js : gateway of the application, handles requirements, tools and resources that need to be used.
*   Author: Constant Pagoui.
*	Date: 03-01-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

//------------------REQUIREMENTS & TOOLS ------------------------------//

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const hpp = require('hpp');
const { createProxyMiddleware } = require('http-proxy-middleware');
const ejs = require("ejs");
const log4js = require("log4js");
const logger = log4js.getLogger();
const mongoose = require("mongoose");
const path = require("path");
const UserModel = require(__dirname+"/models/user");
const compression = require("compression");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const MongoStore = require('connect-mongo');
const Notification = require(__dirname+"/services/notification");
const TimeHelper = require(__dirname+"/services/timeHelper");
const CurrencyDailyRatesModel = require(__dirname+"/models/currencyDailyRates");
const notifObj = new Notification();
const nodeCron = require('node-cron');
const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const axios = require('axios');
const _ = require("lodash");

// const emailValidator = required("email-validator");

global.rates = {};

//------------------DATABASE CONNECTION ------------------------------//
dbConnected = false;
const connectDB = async(DBURI) => { 
	await mongoose.connect(DBURI, {
		useNewUrlParser:true,
		useUnifiedTopology: true,
		family:4
	}).then(async success=>{
		dbConnected = true;
		logger.info("APP:: Successfully connected to the database.");
		const today = new Date().toLocaleDateString();
		global.rates = await CurrencyDailyRatesModel.findOne({rateDate: today}).exec();
		if(!global.rates){
			console.log("Currency rates not found. Performing API call... : ", today);
			let rates_;
			while(rates_?.data == null){
				await new Promise(r => setTimeout(r, 1000));
				rates_ = await axios.get(process.env.CURRFREAKSAPI);
			}
			console.log("rates from axios:: ", rates_);
			await new Promise(r => setTimeout(r, 500));
			const tmprates = await new CurrencyDailyRatesModel({
				createdAt: new Date(),
				rateDate: today,
				lastUpdate: new Date(),
				rates: rates_.data.rates
			}).save().then(succ=>{
				console.log("Currency rates stored successfully.");
			}).catch(error=>{
				console.log("Error occured while saving rates: ", error);
			});
			global.rates = tmprates;
		}
		return true;
	}).catch(err=>{logger.fatal("APP:: Error occured while connecting to the database.\n"+err);
		return false;
	});
};

//------------------GENERAL CONFIGURATION ------------------------------//


const GoogleStrategy = require("passport-google-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook");

const app = express();

app.use("/photo", createProxyMiddleware({
	target: process.env.GCP_UPLOADS_STORAGE,
	changeOrigin: true,
  }));

app.use("/files", createProxyMiddleware({
	target: process.env.GCP_FILES_STORAGE,
	changeOrigin: true,
  }));

mongoose.set('strictQuery', false);

app.set('trust proxy', true);

// i18n configuration
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, '/locales/{{lng}}.json')
    },
    fallbackLng: 'fr',
    lng: 'fr', // French as default
    preload: ['fr', 'en'],
    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: ['cookie']
    }
  });
  
app.use(middleware.handle(i18next));

// Middleware to set locale in app.locals for each request
app.use((req, res, next) => {
    res.locals.locale = req.language || 'en';
    next();
});

app.use(express.static("public"));
app.use(express.json());
app.use(compression());
//app.use(hpp());

// Security middleware for HTTPS enforcement
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        // Force HTTPS for payment routes
        if (req.path.includes('/charge') || req.path.includes('/payment')) {
            if (!req.secure && req.get('X-Forwarded-Proto') !== 'https') {
                return res.redirect(`https://${req.get('Host')}${req.url}`);
            }
        }
        next();
    });
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
	extended: true
}));


  
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 3600 * 24 * 365
	},
	store: MongoStore.create({
		mongoUrl: process.env.DBURI,
		autoRemove: 'interval',
		autoRemoveInterval: 10, // In minutes. Default
		crypto: {
			secret: process.env.SESSION_SECRET,
		  },
		
	  })
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(UserModel.authenticate()));

passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

passport.use(new GoogleStrategy ({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	userProfileURL: process.env.GOOGLE_PROFILE_URL
},
	function(accessToken, refreshToken, profile, cb){
		//console.log(profile);

		UserModel.findOne({email: profile.emails[0].value}, function(err, existingUser){
			if(existingUser){
				return cb(err, existingUser);
			}else{
				var newUser = new UserModel({
					google_id : profile.id,
					photo : profile.photos[0].value,
					email : profile.emails[0].value,
					username: profile.emails[0].value,
					verified: true,
					category: "Operators",
					registeredAsPro: true,
					display_name : _.capitalize(profile.displayName),
					firstName: _.capitalize(profile._json.given_name),
					lastName: _.capitalize(profile._json.family_name),
					createdAt: new Date(),
					lastUpdate: new Date()
				}).save(function(err,newUser){
					if(err) {
						logger.error("GOOGLE AUTH:: Error occured: "+ err);
					};
					return cb(err, newUser);
				});
			}
		});

	})

);

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: process.env.FB_CALLBACK_URL,
	profileFields: ['id', 'emails', 'name']
  },
  function(accessToken, refreshToken, profile, cb) {
		logger.info("FB AUTH:: User profile: "+profile);
		UserModel.findOne({email: profile.emails[0].value}, function(err, existingUser){
			if(existingUser){
				console.log("FB AUTH:: Existing user.."+existingUser);
				// Update access token for existing user
				existingUser.facebookAccessToken = accessToken;
				existingUser.facebookTokenExpires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
				existingUser.lastUpdate = new Date();
				existingUser.save(function(err, updatedUser){
					if(err) {
						logger.error("FB AUTH:: Error updating user: "+ err);
					}
					return cb(err, updatedUser);
				});
			}else{
				console.log("FB AUTH:: User does not exist.");
				var newUser = new UserModel({
					facebook_id : profile.id,
					//photo : profile.photos[0].value,
					email : profile.emails[0].value,
					verified: true,
					display_name : _.capitalize(profile.displayName),
					category: "Operators",
					registeredAsPro: true,
					username: profile.emails[0].value,
					firstName: _.capitalize(profile.name.givenName),
					lastName: _.capitalize(profile.name.familyName),
					facebookProfileLink:  "https://www.facebook.com/profile.php?"+profile.id,
					facebookAccessToken: accessToken,
					facebookTokenExpires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
					createdAt: new Date(),
					lastUpdate: new Date()
				}).save(function(err,newUser){
					
					if(err) {
						logger.error("FB AUTH:: Error occured: "+ err);
					};
					return cb(err, newUser);
				});
			}
		});
   
  }
));


app.get("/auth/google",
	passport.authenticate("google", {scope: [ 'email', 'profile' ]}));

app.get("/auth/google/mosalapro", 
	passport.authenticate("google", {
		successRedirect: '/profile',
		failureRedirect: "/"}));
		
	
app.get("/auth/facebook",
  passport.authenticate("facebook", {scope: ['email', 'public_profile', 'user_friends']}));

app.get('/auth/facebook/mosalapro',
  passport.authenticate('facebook', {
	successRedirect: '/profile', 
	failureRedirect: '/' }));

// Language switching route
app.get('/lang/:lng', (req, res) => {
  const { lng } = req.params;
  if (['fr', 'en'].includes(lng)) {
    res.cookie('i18next', lng, { maxAge: 365 * 24 * 60 * 60 * 1000 }); // 1 year
  }
  res.redirect(req.get('Referer') || '/');
});


// check job deadline and send reminder to service providers
const jobDeadlineReminder = nodeCron.schedule("59 59 0 * * *", async(req, res) =>{
	await notifObj.sendBookingsDeadlineReminders(req, res);
});
jobDeadlineReminder.start();

// Clean up expired OTPs every 10 minutes
const TwilioPhoneAuthService = require("./services/twilioPhoneAuth");
const twilioAuthCleanup = new TwilioPhoneAuthService();
const otpCleanupTask = nodeCron.schedule("*/10 * * * *", () => {
	twilioAuthCleanup.cleanupExpiredOTPs();
});
otpCleanupTask.start();

const http = require('http');
const https = require('https');
const fs = require('fs');
const Message = require("./services/message");
const messageHandler = new Message();

// HTTPS configuration for secure payments
let server;
if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY && process.env.SSL_CERT) {
    // Production HTTPS server
    const options = {
        key: fs.readFileSync(process.env.SSL_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT)
    };
    server = https.createServer(options, app);
} else {
    // Development HTTP server
    server = http.createServer(app);
}
io = require('socket.io')().listen(server);

io.on('connection', function(socket){
	//console.log('A user connected');

	socket.on('createUser', function(data) {
		messageHandler.saveUserSocket(data.userId, socket.id);
	});

	socket.on("pushNotification", function(data){
		socket.broadcast.emit("pushNotification"+data.userId, data);
	})

	socket.on('disconnect', function() {
		//messageHandler.removeUserSocket(socket.id);
		console.log("User disconnected!");
	});
});

app.locals = {
    bg: "bg-light",
	notifications: null,
	getTimeAgo: TimeHelper.getTimeAgo,
	getShortTimeAgo: TimeHelper.getShortTimeAgo
};

// Main application routes
require('./api-routes/routes')(app);

// Payment routes (REST API)
const paymentRoutes = require('./api-routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);


//------------------STARTING UP SERVER------------------------------//

const start = async () => {
    try {
        await connectDB(process.env.DBURI).then(async function (success) {
			server.listen(process.env.PORT || 8080, function() {
			 // console.log("APP:: Server successfully started online and locally on port 8080");
			});
		}).catch(function (error) { // console.log("APP:: Error"+error);
			});
		
	}catch(error) {console.log("APP:: Error occured while connecting to the db: "+error);}
};

const servr = app.listen();
servr.setTimeout(500000); 

start();


