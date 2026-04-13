/*********************************************************************************************************
 *  Authentication Routes: Handles login, registration, password recovery, and email/phone verification
 *  Author: Constant Pagoui.
 *  Date: 03-17-2026
 *  Copyright: MosalaPro TM
 *
 **********************************************************************************************************/

const {
    NotificationModel,
    UserModel,
    TokenModel,
    UserService,
    passport,
    geoip,
    categories,
    countries
} = require('./sharedDependencies');

module.exports = function(app) {

    // User registration (POST)
    app.post("/register-user", async (req, res) => {
        app.locals.bg = "bg-light-user";
        UserService.register(req, res);
    });

    // User registration page (GET)
    app.get("/register-user", function(req, res){
        if(req.isAuthenticated())
            res.redirect("/");
        else
            res.render("emailVerification", {
                usr: null,
                link: null,
                firstCor: 'none',
                currtab: 'home',
                cats: categories,
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                userId: req.body.id,
                form_action: "/verify-u-email",
                redirect_link: "/"
            });
    });

    // Password recovery page
    app.get("/pass-recovery", function(req, res){
        if(req.isAuthenticated())
            res.redirect("/");
        else
            res.render("passRecovery", {
                usr: null,
                link: null,
                firstCor: 'none',
                currtab: 'home',
                lang: res.locals.locale,
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                userId: req.body.id,
                form_action: "/verify-u-email"
            });
    });

    // Send password recovery email (POST)
    app.post("/recover-pass", async (req, res) =>{
        UserService.sendVerificationCode(req, res);
    });

    // Password recovery verification page
    app.get("/recover-pass/:userId", async (req, res) =>{
        if(req.isAuthenticated())
            res.redirect("/");
        else{
            const unverifiedUser = await UserModel.findById(req.params.userId).exec();
            let displayContact = '';

            // Check if recovery was done via email or phone
            if(unverifiedUser.email && unverifiedUser.email.includes('@')) {
                // Email recovery - mask email
                let email = unverifiedUser.email.charAt(0);
                const atIndex = unverifiedUser.email.indexOf('@');
                for(let i = 0; i < atIndex; i++){
                    email = email + "*";
                }
                email = email + unverifiedUser.email.substr(atIndex, unverifiedUser.email.length-1);
                displayContact = email;
            } else if(unverifiedUser.phone) {
                // Phone recovery - mask phone
                const phone = unverifiedUser.phone;
                const phoneLength = phone.length;
                if(phoneLength > 4) {
                    // Show first 2 and last 2 digits, mask the rest
                    displayContact = phone.substring(0, 2) + '*'.repeat(phoneLength - 4) + phone.substring(phoneLength - 2);
                } else {
                    displayContact = phone;
                }
            }

            req.params.redirect_link = "/change-pass";
            res.render("emailVerification", {
                usr: null,
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                currtab: 'dash',
                link: null,
                firstCor: 'none',
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                userId: req.params.userId,
                email: displayContact,
                redirect_link: "/change-pass"
            });
        }
    });

    // User login
    app.post("/login-u", passport.authenticate('local', { failureRedirect: '#', failureFlash: true }),
        async function(req, res) {
            app.locals.bg = req.user.accountType == 'user' ? "bg-light-user" : "bg-light-pro";
            UserService.login(req, res);
    });

    // Change password page
    app.get("/change-pass/:userId", async function(req, res){
        if(req.isAuthenticated()){
            res.redirect("/");
        } else {
            const unverifiedUser = await UserModel.findById(req.params.userId).exec();
            res.render("passChange", {
                usr: null,
                link: null,
                firstCor: 'none',
                currtab: 'home',
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                userId: req.params.userId,
                userEmail: unverifiedUser.email
            });
        }
    });

    // Change password (POST)
    app.post('/change-password', async function(req, res){
        UserService.changePassword(req, res);
    });

    // User authentication
    app.post("/authenticate", async function(req, res){
        UserService.authenticate(req, res);
    });

    // Verified and registered user
    app.post("/verified-and-registered-user", async function(req, res){
        UserService.verifiedAndRegisteredUser(req, res);
    });

    // User dashboard after email verification
    app.get("/userdash", async function(req, res){
        if(req.isAuthenticated())
            res.redirect("/");
        else
            res.redirect("/");
    });

    // Email verification callback
    app.get("/verified/:userId", async function(req, res){
        const verifiedUser = await UserModel.findById(req.params.userId).exec();
        if(verifiedUser.isVerified === true){
            res.redirect("/");
        } else {
            await UserModel.findByIdAndUpdate(req.params.userId, {isVerified: true}).exec();
            res.redirect("/");
        }
    });

    // Logout
    app.get("/logout", async function(req, res, next){
        req.logout(function(err) {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    });

    // Email verification (POST)
    app.post("/verify-email", function(req, res){
        UserService.verifyEmail(req, res);
    });

    // Verification code (POST)
    app.post("/verify-code", function(req, res){
        UserService.verifyCode(req, res);
    });

    // Phone verification page
    app.get("/verify-phone", function(req, res) {
        if(!req.isAuthenticated()) {
            return res.redirect("/");
        }

        res.render("phoneVerification", {
            usr: req.user,
            link: null,
            firstCor: 'none',
            currtab: 'home',
            cats: categories,
            map_api_key: process.env.GOOGLE_MAPS_API_KEY,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            lang: res.locals.locale
        });
    });

    // Verify phone OTP (POST)
    app.post("/verify-phone-otp", async function(req, res) {
        UserService.verifyPhoneOTP(req, res);
    });

    // Resend phone OTP (POST)
    app.post("/resend-phone-otp", async function(req, res) {
        UserService.resendPhoneOTP(req, res);
    });

    // Register provider (POST)
    app.post("/register-pro", function(req, res){
        UserService.registerPro(req, res);
    });

    // Register provider page (GET)
    app.get("/register-pro", function(req, res){
        res.render("emailVerification", {
            usr: null,
            link: null,
            lang: res.locals.locale,
            currtab: 'home',
            firstCor: 'none',
            notifications: null,
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            email: req.body.email,
            userId: req.body.id,
            form_action: "verify-email",
            redirect_link: "/"
        });
    });

    // Verify provider email (POST)
    app.post('/verify-p-email', function(req, res) {
        UserService.verifyProviderEmail(req, res);
    });

    // Resend verification code
    app.get("/resendCode/:id", function(req, res){
        if(isAuthenticated() || !req.params.id){
            return res.redirect("/");
        }
        UserService.resendCode(req, res);
    });

    app.post("/resendCode", async (req, res)=>{
        UserService.resendCode(req, res);
    });

    // Resend code for password change
    app.get("/resendCode/change-pass/:id", function(req, res){
        if(isAuthenticated() || !req.params.id){
            return res.redirect("/");
        }
        UserService.resendCodeForPassChange(req, res);
    });

    // Join as user
    app.get('/join-as-user', async function(req, res){
        if(req.isAuthenticated()){
            await UserModel.findByIdAndUpdate(req.user._id, {accountType: 'user', strictlyPro: false}).exec();
            res.redirect('/profile');
        } else {
            res.redirect('/');
        }
    });

    // Join as pro page
    app.get("/join-as-pro", async function(req, res){
        const notifs = req.isAuthenticated()
            ? await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec()
            : null;

        res.render("proSignup", {
            usr: req.user || null,
            notifications: notifs,
            lang: res.locals.locale,
            link: null,
            firstCor: 'none',
            currtab: 'pros',
            cats: categories,
            recaptchaKey: process.env.RECAPTCHA_KEY_ID,
            countries: countries
        });
    });

    // Join MosalaPro page (signup)
    app.get('/join-mosalapro', async(req, res)=>{
        if (!req.isAuthenticated()) {
            const geo = geoip.lookup(req.ip);
            const subName = "Free";
            res.render("signup", {
                usr: null,
                notifications: null,
                lang: res.locals.locale,
                link: '/join-mosalapro',
                firstCor: 'none',
                currtab: 'home',
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                subscriptionName: subName,
                user_loc_data: geo,
                countries: countries
            });
        } else {
            res.redirect("/");
        }
    });

    // Login page
    app.get('/login', async(req, res)=>{
        if (!req.isAuthenticated()) {
            const geo = geoip.lookup(req.ip);
            const subName = "Free";
            res.render("connection", {
                usr: null,
                notifications: null,
                lang: res.locals.locale,
                link: '/login',
                firstCor: 'none',
                currtab: 'home',
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                subscriptionName: subName,
                user_loc_data: geo,
                countries: countries
            });
        } else {
            res.redirect("/");
        }
    });
};
