/*********************************************************************************************************
 *  User Routes: Handles user profile, settings, and account management
 *  Author: Constant Pagoui.
 *  Date: 03-17-2026
 *  Copyright: MosalaPro TM
 *
 **********************************************************************************************************/

const {
    NotificationModel,
    UserModel,
    CountryModel,
    UserService,
    passport,
    multer_,
    geoip,
    bucket,
    path,
    crypto,
    logger,
    categories,
    countries
} = require('./sharedDependencies');

module.exports = function(app) {

    // Get user profile page
    app.get("/profile", async function(req, res){
        if(req.isAuthenticated()){
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
            res.render("userProfile", {
                usr: req.user,
                firstCor: 'none',
                lang: res.locals.locale,
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                currtab: 'dash',
                notifications: notifs,
                link: null,
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                user_loc_data: user_loc_data,
                countries: countries,
                accountTypeDisplay: accountTypeDisplay
            });
        } else {
            res.redirect("/");
        }
    });

    // Update user profile (POST)
    app.post("/profile", multer_.single("photo"), async function(req, res){
        if (req.isAuthenticated()) {
            try{
                if(req.file){
                    // Validate file size (in bytes)
                    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
                    if (req.file.size > maxSizeInBytes) {
                        console.log('File size exceeds the limit of 5MB.');
                        return;
                    }

                    const filename = crypto.randomBytes(16).toString('hex')+ path.extname(req.file.originalname);
                    const blob = bucket.file(req.file.originalname);
                    const blobStream = blob.createWriteStream();

                    await blobStream.on("finish", async ()=>{
                        await bucket.file(req.file.originalname).move("uploads/"+filename).then(() => {
                            // File renamed successfully
                        }).catch(err => {
                            logger.error('Error renaming file:', err);
                        });
                        return;
                    });

                    blobStream.on("error", (err) => {
                        logger.error("ROUTES:: An error occurred while uploading file: "+err);
                        res.status(500).send(err);
                    });

                    blobStream.end(req.file.buffer);

                    const publicUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/uploads/${filename}`;
                    req.body.photo = publicUrl;
                }

                await UserModel.findByIdAndUpdate(req.user._id, req.body).exec();
                res.redirect("/profile");
            } catch(err){
                logger.error("An error occurred while updating user profile: "+err);
                res.status(500).send("An error occurred");
            }
        } else {
            res.redirect("/");
        }
    });

    // Get user edit page
    app.get("/user-edit", async function(req, res){
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const geo = geoip.lookup(req.ip);
            const subName = "Free";
            res.render("userEdit", {
                usr: req.user,
                notifications: notifs,
                lang: res.locals.locale,
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                link: req.link,
                firstCor: 'none',
                currtab: 'dash',
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

    // Update user edit (POST)
    app.post("/user-edit", multer_.single("photo"), async function(req, res){
        if(req.isAuthenticated())
            UserService.update(req, res);
        else
            res.redirect("/");
    });

    // Get user info
    app.get("/user", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("user", {
                usr: req.user,
                link: null,
                lang: res.locals.locale,
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                firstCor: 'none',
                currtab: 'dash',
                notifications: notifs,
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID
            });
        } else {
            res.redirect("/");
        }
    });

    // Switch account
    app.get("/switch-account", async function(req, res){
        if(req.isAuthenticated()){
            await UserModel.findByIdAndUpdate(req.user._id, {strictlyPro: false, lastUpdate: new Date()}).exec();
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const geo = geoip.lookup(req.ip);
            res.render("userProfile", {
                usr: req.user,
                notifications: notifs,
                firstCor: 'none',
                link: null,
                lang: res.locals.locale,
                currtab: 'dash',
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID,
                user_loc_data: geo,
                countries: countries
            });
        } else {
            res.redirect("/");
        }
    });

    // Update password
    app.post('/update-password', function(req, res){
        UserService.updatePassword(req, res);
    });

    // Delete user account
    app.post('/delete-user-account', function(req, res){
        UserService.deleteUserAccount(req, res);
    });

    // Remove user account
    app.post('/remove-user-account', function(req, res){
        UserService.removeUserAccount(req, res);
    });

    // Enable two-factor authentication
    app.post('/enable-two-fact-auth', async function(req, res){
        UserService.setTwoFactorsAuth(req, res);
    });

    // Set notification preferences
    app.post('/set-req-update-notifs', async function(req, res){
        UserService.setReqUpdateNotifs(req, res);
    });

    app.post('/set-msg-update-notifs', async function(req, res){
        UserService.setMsgUpdateNotifs(req, res);
    });

    app.post('/set-sms-opp-notifs', async(req, res)=>{
        UserService.setOppSMSNotifsNotifs(req, res);
    });

    app.post('/set-sms-update-notifs', async (req, res)=>{
        UserService.setSMSUpdateNotifs(req, res);
    });

    app.post('/set-bkg-update-notifs', async function(req, res){
        UserService.setBkgUpdateNotifs(req, res);
    });

    // Update skills
    app.post('/update-skills', async function(req, res){
        if(req.isAuthenticated())
            UserService.updateSkills(req, res);
        else
            res.redirect("/");
    });

    // Add favorite provider
    app.post("/addfavpro", async function(req, res) {
        if(req.isAuthenticated())
            UserService.addFavProvider(req, res);
        else
            res.redirect("/");
    });
};
