/*********************************************************************************************************
*	message.js : Handles message exchange between user and provider.
*   Author: Constant Pagoui.
*	Date: 04-11-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const MessageModel = require("../models/message");
const NotificationModel = require("../models/notification");
const _ = require("lodash");
const mongoose = require("mongoose");
const UserModel = require("../models/user");
const OnlineUserModel = require("../models/onlineUser");
const EmailSender = require("./emailsender");
const emailSenderObj = new EmailSender();

mongoose.set('strictQuery', false);

const onlineUsersList = [];
let onlineUserSocketsList = [];

class Message {
    async sendMessage(req, res){
        const receiver = await UserModel.findById(req.body.proId).exec();
        // console.log("Receiver found: "+receiver._id);
        const createdAt = new Date();
        const newMessage = await new MessageModel({
            senderId: req.user._id,
            recipientId:  req.body.proId,
            title: req.body.messageTitle,
            content: req.body.content,
            attachments: req.files?.map(item => item.filename),
            createdAt: new Date()
        }).save(async function (err) {
            if (err) {
                console.log("MESSAGE:: Error occured while sending message: "+err);
                res.status(401).send({error:"Error occured while sending message"} );
                return;
            }else{
                console.log("Send message through socket");
                // Send message to recipient via Socket.io (real-time delivery)
                this.sendMessageToUserThroughSocket(req.body.proId, req.user, req.body.content, createdAt, req.files?.map(item => item.filename));

                // Create notification in database (for notification center)
                const notification = new NotificationModel({
                    causedByUserId: req.user._id,
                    receiverId: req.body.proId,
                    accountType: receiver.accountType || "user",
                    icon: "fa-envelope",
                    title: "You have a new message.",
                    content: "A message from "+req.user.firstName+ " "+req.user.lastName+": "+
                                            req.body.messageTitle+ " "+  req.body.content,
                    translations: {fr: {
                        title: "Vous avez un nouveau message.",
                        content: req.user.firstName+ " "+req.user.lastName+" vous a envoyé un message: "+req.body.messageTitle+ " "+  req.body.content }
                    },

                    createdAt: new Date(),
                    lastUpdate: new Date()
                }).save(async function (err) {
                    if (err) {
                        console.log("MESSAGE:: Error occured while creating notification.");
                    } else {
                        console.log("MESSAGE:: Notification saved to database.");
                    }
                });

                // Note: We only send 'newMessage' event (via sendMessageToUserThroughSocket above)
                // No need to send 'pushNotification' event as well - it causes duplicates

                // Check if user is online, send email only if offline
                const isUserOn = await OnlineUserModel.findOne({id: receiver._id.toString()});
                if(receiver.msgUpdateNotifs && !isUserOn ){
                    const emailTitle = "You have a new message.";
                    const emailContent = "You have a new message from "+req.user.firstName+ ".\n\nLogin to https://mosalapro.com/messages to view it.\n\n";
                    if(emailSenderObj.sendNotification(emailTitle, emailContent, receiver.email, receiver.firstName))
                        console.log("MESSAGE:: Notification's email sent to user.");
                    else console.log("Failed to send notif's email.");
                }

                console.log("MESSAGE:: Message has been sent successfully.");
                res.status(200).send({message:"Message sent successfully!", status:200} );
                return;
            }
        }.bind(this));
        return;
    }

    async getMessages(req, res){

        const messages = await MessageModel.find().or([{senderId: req.user._id}, { recipientId: req.user._id }])
                    .sort({ createdAt: 'desc'})
                    .then(success => {
                        console.log("MESSAGE:: Message successfully retrieved!");
                    }).catch(err=>{
                        console.log("MESSAGE:: Error occured while retrieving messages: "+err);
                    });
        let firstCorrespondantId = ""; 
        let firstConvo = [];
        if(messages){
            firstCorrespondantId = messages[0].senderId == req.user._id ? messages[0].recipientId : messages[0].senderId;

            firstConvo = MessageModel.find().and({ $or: [{senderId: req.user._id}, { recipientId: req.user._id }] } ,
                    {$or: [{senderId: firstCorrespondantId}, { recipientId: firstCorrespondantId }] })
                    .sort({ createdAt: 'desc'})
                    .then(success => {
                        console.log("MESSAGE:: First convo successfully retrieved!");
                    }).catch(err=>{
                        console.log("MESSAGE:: Error occured while retrieving first convo: "+err);
                    });
        }
        return firstConvo;

    }

    async getLastMessageWithUser(req, userId) {
        const lastMessage = await MessageModel.findOne().sort({createdAt: -1}).or([ {$and: [{senderId: req.user._id}, { recipientId: userId }] } ,
            {$and: [{senderId: userId}, { recipientId: req.user._id }] }]).exec();

        return lastMessage._doc;
    }

    async getMessageWithUser(req, userId){

        const otherUser = await UserModel.findById(userId).exec();
        if(otherUser){
            //console.log("Getting messages with user: "+otherUser.username);
            otherUser.username = " ";
            otherUser.address = " ";
            otherUser.role = " ";
            otherUser.email = " ";
            otherUser.phone = " ";
        
            const messages_ = await MessageModel.find().or([ {$and: [{senderId: req.user._id}, { recipientId: userId }] } ,
                        {$and: [{senderId: userId}, { recipientId: req.user._id }] }]).exec();
                        // .then(success => {
                        //     console.log("MESSAGE:: Convo successfully retrieved!");
                        // }).catch(err=>{
                        //     console.log("MESSAGE:: Error occured while retrieving convo: "+err);
                        // });
            return messages_;
        }else
            return [];

    }

    async getCorrespondants(req, res){

        let correspondants = [];
        let unikIds = [];

        const messages = await MessageModel.find().or([{senderId: req.user._id}, { recipientId: req.user._id }]).sort({createdAt:-1});

        if(messages){
            const correspondantIds = new Set();

            messages.forEach(m => {
                if (m.senderId.toString() === req.user._id.toString()) {
                    correspondantIds.add(m.recipientId.toString());
                } else {
                    correspondantIds.add(m.senderId.toString());
                }
            });

            for(let corrId of correspondantIds){
                const correspondant = await UserModel.findById(corrId).exec();
                
                if(correspondant){
                    correspondant.accountType = " ";
                    correspondant.address = " ";
                    correspondant.role = " ";
                    correspondant.email = " ";
                    correspondant.phone = " ";
                    correspondant.isOnline = await this.checkIfUserOnline(corrId);
                    if(!unikIds.includes(corrId)){
                        // console.log("Corresp is online: ", correspondant.isOnline);
                        correspondants.push(correspondant);
                        unikIds.push(corrId);
                    }
                }
            }
        }

        return correspondants;

    }

    async setUserOnline(userId) {
       // const statusIndex = onlineUsersList.findIndex((u) => u.id === userId);
       const isOnline = await OnlineUserModel.findOne({id: userId}).exec();

        if (!isOnline) {
            await new OnlineUserModel({
                id: userId.toString(),
                lastSeen: Date.now()
            }).save().then(succ=>{
                console.log("User has been set online");
            }).catch(err=>{
                console.log("Error occured while setting user online: ", err);
            });
            
        } 
        else 
        {
            //console.log("User is already online");
            await OnlineUserModel.findOneAndUpdate({id: userId}, {lastSeen: Date.now()}).exec();
        }
    }

    async checkIfUserOnline(userId) {
        //const statusIndex = onlineUsersList.findIndex((u) => u.id === userId);
        const isOnline = await OnlineUserModel.findOne({id: userId}).exec();

        if (isOnline ) {
            if( (Date.now() - isOnline.lastSeen) > 3 * 60 * 1000){
                // console.log("User is not online - last seen more than 3 min");
                await OnlineUserModel.findOneAndDelete({id: userId}).exec();
                return false;
            }else{
                return true;
            }
        }
        // console.log("User is not online - not found!");

        return false;
    }

    async getOnlineUsers() {
        const onlineUsers = await OnlineUserModel.find().exec();
        return onlineUsers;
       //return onlineUsersList;
    }

    saveUserSocket(userId, socketId) {
        const user = onlineUserSocketsList.find(u => u.id === userId);

		if (!user) {
			const newUser = {
				id: userId,
				socketId: socketId
			};
			
			onlineUserSocketsList.push(newUser);
            //console.log("User added to list: "+ userId+" - socket Id: "+socketId);
		}
        else{
            const userIndex = onlineUserSocketsList.findIndex(u => u.id === userId);
            const newUser = {
				id: userId,
				socketId: socketId
			};
		    onlineUserSocketsList.splice(userIndex, 1, newUser);
        }
        // console.log("------");
        // onlineUserSocketsList.forEach(usr=>{
        //     console.log("user: "+usr.id+" - socketId: "+usr.socketId);
        // });
        // console.log("------");
    }
 
    removeUserSocket(socketId) {
        const userIndex = onlineUserSocketsList.findIndex(u => u.socketId === socketId);
		onlineUserSocketsList.splice(userIndex, 1);
    }

    async sendMessageToUserThroughSocket(userId, sender, message, createdAt, attachments) {
        const user = onlineUserSocketsList.find(u => u.id === userId);
        console.log("MESSAGE:: Looking for user socket:", userId);
        console.log("MESSAGE:: Online users count:", onlineUserSocketsList.length);

        if (user && global.io) {
            console.log("MESSAGE:: User found with socket ID:", user.socketId);
            // Send message directly to the user's socket
            global.io.to(user.socketId).emit('newMessage', {
                sender: {
                    _id: sender._id,
                    firstName: sender.firstName,
                    lastName: sender.lastName,
                    photo: sender.photo
                },
                content: message,
                createdAt: createdAt,
                attachments: attachments || []
            });
            console.log("MESSAGE:: Message sent through socket to user:", userId);
        } else {
            console.log("MESSAGE:: User not found in online list or io not available");
        }
    }

    getUserSocket(userId) {
        return onlineUserSocketsList.find(u => u.id === userId);
    }
}

module.exports = Message;