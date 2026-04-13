/*********************************************************************************************************
 *  Notification Routes: Handles notifications display and management
 *  Author: Constant Pagoui.
 *  Date: 03-17-2026
 *  Copyright: MosalaPro TM
 *
 **********************************************************************************************************/

const {
    NotificationModel,
    NotificationObj,
    categories
} = require('./sharedDependencies');

module.exports = function(app) {

    // Get all notifications
    app.get("/notifications", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            res.render("allNotifications", {
                usr: req.user,
                firstCor: 'none',
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                currtab: 'dash',
                lang: res.locals.locale,
                link: null,
                notifications: notifs,
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID
            });
        } else {
            res.redirect("/");
        }
    });

    // Load more notifications (POST)
    app.post("/notifications", async function(req, res){
        if(req.isAuthenticated()){
            const limit = parseInt(req.body.lim) || 20;
            const skip = parseInt(req.body.skip) || 0;

            const notifs = await NotificationModel
                .find({receiverId: req.user._id, status:{$ne:"archived"}})
                .sort({lastUpdate: -1})
                .limit(limit)
                .skip(skip)
                .exec();

            const totalCount = await NotificationModel
                .countDocuments({receiverId: req.user._id, status:{$ne:"archived"}})
                .exec();

            res.json({
                notifications: notifs,
                hasMore: skip + limit < totalCount,
                total: totalCount
            });
        } else {
            res.status(401).json({error: "Unauthorized"});
        }
    });

    // Get single notification
    app.get("/notification", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).sort({lastUpdate: -1}).exec();
            const notif = await NotificationModel.findById(req.query.id).exec();

            res.render("notification", {
                usr: req.user,
                firstCor: 'none',
                map_api_key: process.env.GOOGLE_MAPS_API_KEY,
                currtab: 'dash',
                lang: res.locals.locale,
                link: null,
                notifications: notifs,
                notification: notif,
                cats: categories,
                recaptchaKey: process.env.RECAPTCHA_KEY_ID
            });
        } else {
            res.redirect("/");
        }
    });

    // Mark notification as read
    app.post("/read-notif", async function(req, res){
        if(req.isAuthenticated()){
            await NotificationModel.findByIdAndUpdate(req.body.id, {status: "read"}).exec();
            res.status(200).json({message: "Notification marked as read"});
        } else {
            res.status(401).json({error: "Unauthorized"});
        }
    });

    // Delete notification
    app.post("/delete-notif", async function(req, res){
        if(req.isAuthenticated()){
            await NotificationModel.findByIdAndUpdate(req.body.id, {status: "archived"}).exec();
            res.status(200).json({message: "Notification deleted"});
        } else {
            res.status(401).json({error: "Unauthorized"});
        }
    });

    // Get unread notification count (API endpoint)
    app.get("/api/notifications/count", async function(req, res){
        if(req.isAuthenticated()){
            const count = await NotificationModel.countDocuments({
                receiverId: req.user._id,
                status: "unread"
            }).exec();

            res.status(200).json({count: count});
        } else {
            res.status(401).json({error: "Unauthorized", count: 0});
        }
    });
};
