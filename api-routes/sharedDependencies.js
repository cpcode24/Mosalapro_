/*********************************************************************************************************
 *  Shared Dependencies: Common imports and configurations for all route modules
 *  Author: Constant Pagoui.
 *  Date: 03-17-2026
 *  Copyright: MosalaPro TM
 *
 **********************************************************************************************************/

const NotificationModel = require(__dirname + "/../models/notification");
const Notification = require("../services/notification");
const Message = require("../services/message");
const JobApplication = require("../services/jobApplication");
const UserService = require("../services/user");
const TimeHelper = require("../services/timeHelper");
const PostRequestModel = require("../models/postRequest");
const BookingModel = require("../models/booking");
const OnlineUserModel = require("../models/onlineUser");
const passport = require('passport');
const PostRequestService = require("../services/postrequest");
const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const _ = require("lodash");
const EmailSender = require("../services/emailsender");
const log4js = require("log4js");
const logger = log4js.getLogger();
const TokenModel = require("../models/token");
const { Storage } = require("@google-cloud/storage");
const fs = require('fs');
const JobApplicationModel = require("../models/jobApplication");
const BookingService = require("../services/booking");
const QuotationService = require("../services/quotation");
const SearchTranslation = require("../services/searchTranslation");
const UserModel = require("../models/user");
const QuotationModel = require("../models/quotation");
const QuotationRequestModel = require("../models/quotationRequest");
const MessageQuotationModel = require("../models/messageQuotation");
const JobDeliveryModel = require("../models/jobDelivery");
const RatingModel = require("../models/rating");
const CountryModel = require("../models/country");
const sharp = require('sharp');
const request = require('request');
const { default: axios } = require("axios");
const geoip = require('geoip-lite');
const TwilioPhoneAuthService = require("../services/twilioPhoneAuth");
const ChatSupport = require("../services/chatSupport");

// Initialize services
const messageHander = new Message();
const jobApplicationHander = new JobApplication();
const userEmailSender = new EmailSender();
const notificationObj = new Notification();
const QuotationServiceObj = new QuotationService();
const NotificationObj = new Notification();
const twilioService = new TwilioPhoneAuthService();
const chatSupport = new ChatSupport();

// Google Cloud Storage setup
const gcp_storage = new Storage({
    projectId: process.env.PROJECT_ID,
    keyFilename: process.env.GCP_STORAGE_KEY,
});

const bucket = gcp_storage.bucket(process.env.BUCKET_NAME);

// Upload helper function
const uploadToFirebaseStorage = async (filepath, storagepath) => {
    try {
        const gcs = gcp_storage.bucket(process.env.BUCKET_NAME);
        const result = await gcs.upload(filepath, {
            destination: storagepath,
            predefinedAcl: 'publicReadWrite'
        });
        return result[0].metadata.mediaLink;
    } catch (error) {
        logger.error("ROUTING:: Error occured while uploading file: " + error.message);
    }
};

// Multer configurations
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
        fileSize: 1024 * 1024 * 100,
    },
    fileFilter: function (req, file, cb) {
        cb(null, true);
    },
});

// Load categories
let categories = [];
const categoriesToFrMap = new Map();

fs.readFile('./public/data/categories.json', 'utf8', (err, data) => {
    if (err) {
        logger.error('APP:: Error reading file from disk: ' + err);
    } else {
        const cates = JSON.parse(data);
        cates.forEach(kat => {
            categories.push(kat);
            categoriesToFrMap.set(kat.name, kat.translations.fr.name);
        });
        categories.sort((a, b) => {
            const nameA = a.translations.fr.name.toUpperCase();
            const nameB = b.translations.fr.name.toUpperCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
    }
});

// Load countries
let cities = [];
let countries = [];

fs.readFile('./public/data/countries/countries.json', 'utf8', (err, data) => {
    if (err) {
        console.log('APP:: Error reading file from disk: ' + err);
    } else {
        const kountries = JSON.parse(data);
        kountries.forEach(ctry => {
            countries.push(ctry);
        });
    }
});

// USD-based exchange rates
let usdBasedRates = {};

// Export all dependencies
module.exports = {
    // Models
    NotificationModel,
    PostRequestModel,
    BookingModel,
    OnlineUserModel,
    TokenModel,
    JobApplicationModel,
    UserModel,
    QuotationModel,
    QuotationRequestModel,
    MessageQuotationModel,
    JobDeliveryModel,
    RatingModel,
    CountryModel,

    // Services
    Notification,
    Message,
    JobApplication,
    UserService,
    TimeHelper,
    PostRequestService,
    BookingService,
    QuotationService,
    SearchTranslation,
    EmailSender,
    TwilioPhoneAuthService,
    ChatSupport,

    // Service instances
    messageHander,
    jobApplicationHander,
    userEmailSender,
    notificationObj,
    QuotationServiceObj,
    NotificationObj,
    twilioService,
    chatSupport,

    // External libraries
    passport,
    stripe,
    multer,
    path,
    crypto,
    _,
    log4js,
    logger,
    fs,
    sharp,
    request,
    axios,
    geoip,

    // Storage
    Storage,
    gcp_storage,
    bucket,
    uploadToFirebaseStorage,

    // Multer configurations
    storage,
    upload,
    multer_,
    multerArray_,

    // Data
    categories,
    categoriesToFrMap,
    cities,
    countries,
    usdBasedRates,

    // Helper function to get common render data
    getCommonRenderData: (req, notifications = null) => {
        return {
            usr: req.user || null,
            lang: req.res?.locals?.locale || 'en',
            map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            notifications: notifications,
            cats: categories,
            link: null,
            firstCor: 'none',
            currtab: req.user ? 'dash' : 'home'
        };
    }
};
