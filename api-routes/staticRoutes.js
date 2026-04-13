/*********************************************************************************************************
 *  Static Routes: Handles static pages like terms, privacy policy, about, contact, etc.
 *  Author: Constant Pagoui.
 *  Date: 03-17-2026
 *  Copyright: MosalaPro TM
 *
 **********************************************************************************************************/

const {
    NotificationModel,
    userEmailSender,
    categories
} = require('./sharedDependencies');

module.exports = function(app) {

    // Terms of use
    app.get("/term-of-use", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("termsOfUse", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });

    // Do not sell my personal information
    app.get("/do-not-sell", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("doNotSell", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });

    // Privacy policy
    app.get("/privacy-policy", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("privacyPolicy", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });

    // Cookies policy
    app.get("/cookies-policy", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("cookiesPolicy", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });

    // About us
    app.get("/about-us", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("aboutUs", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });

    // Contact us page
    app.get("/contact-us", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("contactUs", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });

    // Contact us form submission
    app.post("/contact-us", async function(req, res){
        userEmailSender.sendContactUsEmail(req.body);
        res.status(200).json({message: "Message sent successfully"});
    });

    // Report issue page
    app.get("/report-issue", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("reportIssue", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            link: null
        });
    });
};
