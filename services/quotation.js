/*********************************************************************************************************
*	quotqtion.js : Handles quotations operations.
*   Author: Constant Pagoui.
*	Date: 06-06-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const BookingModel = require("../models/booking");
const PostRequestModel = require("../models/postRequest");
const QuotationModel = require("../models/quotation");
const Notification = require("../services/notification");
const NotificationObj = new Notification();
const JobApplication = require("../services/jobApplication");
const MessageQuotationModel = require("../models/messageQuotation");
const QuotationRequestModel = require("../models/quotationRequest");
const MessageModel = require("../models/message");
const UserModel = require("../models/user");
const NotificationModel = require("../models/notification");
const JobApplicationModel = require("../models/jobApplication");
const CategoryModel = require("../models/category");
const jobApplicationHander = new JobApplication();
const CountryModel = require("../models/country");
const validator = require('validator');
const { response } = require("express");

const TwilioPhoneAuthService = require("../services/twilioPhoneAuth");
const smsSenderObj = new TwilioPhoneAuthService();


class Quotation {

    async send(req, res){
        const job = await PostRequestModel.findById(req.body.jobId).exec();
        const booking = await BookingModel.findById(req.body.jobId).exec();
        if(job){
            const newQuotation = await new QuotationModel({
                username: job.username,
                budget: req.body.budget,
                currency: req.body.budgetCurrency,
                budgetType: req.body.quotationType,
                quotationDescription:req.body.quotationDesc,
                providerId: req.user._id,
                category: job.requestCategory, 
                jobId: job._id,
                initialBudget: job.budget,
                deadline: job.deadline,
                status: "sent",
                timeOfCompletion: req.body.timeOfCompletion,
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async success => {
                if(!booking)
                    await jobApplicationHander.applyWithQuotation(req, res);
                else{
                    const receiver = await UserModel.findOne({username: job.username}).exec();
                    const notification = new NotificationModel({
                        causedByUserId: req.user._id,
                        causedByItem: job._id,
                        bookingId: booking._id,
                        receiverId: receiver._id,
                        icon:"fa-check-square-o",
                        title: "You have a new quotation.",
                        content: req.user.firstName+" has requested $"+req.body.budget+ " - "+req.body.quotationType +" for the task '"+job.requestTitle+"'. Open to view details.",
                        translations: {fr: {
                            title: "Vous avez un nouveau devis.",
                            content: req.user.firstName+" vous a envoyé un devis pour le service '"+job.requestTitle+"'."
                        }},
                        createdAt: new Date(),
                        lastUpdate: new Date()
                    }).save().then(async scss=>{}).catch(err=>{
                              console.log("QUOTATION:: New notification failed. Error: "+err);
                    }); 
                }
                console.log("QUOTATION:: Quotation saved successfully!");
                console.log("QUOTATION:: Provider has sent quotation and notification sent successfully.");
                res.status(200).send({message: "Ok", status: 200});
                return;
                      
                //   }).catch(err=>{
                //       res.status(401).send({message: "New notification failed. Error", status: 401});
                //       console.log("QUOTATION:: New notification failed. Error: "+err);
                //       return;
                //   }); 
                
            }).catch(err=>{
                console.log("QUOTATION:: Error occured while saving quotation: "+err);
                res.status(401).send({message: "Error occured", status: 401});
                return;
            });
        }else if(booking){
            const newQuotation =  await new QuotationModel({
                username: booking.username,
                budget: req.body.budget,
                budgetType: req.body.quotationType,
                quotationDescription:req.body.quotationDesc,
                providerId: req.user._id,
                category: booking.category, 
                jobId: booking.jobId,
                initialBudget: booking.budget,
                deadline: booking.deadline,
                status: "sent",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async success => {
                await NotificationObj.notifyBookingQuotation(req, res);
                console.log("QUOTATION:: Quotation saved successfully!");
                res.status(200).send({message: "Ok", status: 200});
                return;
            }).catch(err=>{
                console.log("QUOTATION:: Error occured while saving quotation: "+err);
                res.status(401).send({message: "Error occured", status: 401});
                return;
            });

        }
        
        else{
            console.log("QUOTATION:: Error: Job not found!");
            res.status(401).send({message: "Error occured", status: 401});
            return;
        }
        
    }

    async sendQuotationRequest(req, res){

        console.log("QUOTATION:: quotation file: ", req.file?.filename);
        const newQuotationRequest = new QuotationRequestModel({
            username: req.user.username,
            requestTitle: req.body.requestTitle,
            requestDescription:req.body.requestDescription,
            category: req.body.requestCategory, 
            providerId: req.body.providerId,
            file: req.file?.filename ? req.file?.filename: "no file", 
            deadline: req.body.deadline,
            status: 'new',
            createdAt:new Date(),
            lastUpdate: new Date()
        }); 
        await newQuotationRequest.save().then(async success => {
            console.log("QUOTATION:: Quotation request saved!");
            
        }).catch(err=>{
            console.log("QUOTATION:: Error occured while saving quotation request: "+err);
            res.status(401).send({responseMessage: "Error occured", responseCode: 401});
            
            return;
        });
        
        if(newQuotationRequest){
            const notification = await new NotificationModel({
                causedByUserId: req.user._id,
                causedByItem: newQuotationRequest._id,
                receiverId: req.body.providerId,
                icon:"fa-money",
                title: "A client has requested a quote.",
                accountType: "pro",
                content: req.user.firstName+" has requested a quote for service '"+req.body.requestTitle+"'.",
                translations: {fr: {
                    title: "Un client vous a envoyé une demande de devis",
                    content: req.user.firstName+" vous a envoyé une demande de devis pour le service '"+req.body.requestTitle+"'."
                }},
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async scss=>{
                console.log("QUOTATION:: Quote request successfully sent by user!");
                res.status(200).send({responseMessage: "Ok", responseCode: 200});
                return;
            }).catch(err=>{
                res.status(401).send({responseMessage: "New notification failed. Error", responseCode: 401});
                console.log("QUOTATION:: New notification failed. Error: "+err);
                return;
            });
        }
    }

    async sendQuote(req, res){
        const quotationRequest = await QuotationRequestModel.findById(req.body._id).exec();
        if(quotationRequest){
            const cat = await CategoryModel.findOne({name: quotationRequest.category}).exec();
            const job = new PostRequestModel({
                username: quotationRequest.username,
                requestTitle: quotationRequest.requestTitle,
                requestDescription: quotationRequest.requestDescription,
                requestCategory: cat.name,
                providerId: req.user._id,
                currency: req.body.quoteBudgetCurrency,
                requestCategoryIcon: cat.icon,
                budget: req.body.quoteBudget,
                budgetType: req.body.quoteType,
                deadline: quotationRequest.deadline,
                quotationId: quotationRequest._id,
                files: quotationRequest.file ? [quotationRequest.file] : [],
                status: "pending",
                createdAt: new Date(),
                lastUpdate: new Date(),
            });
            
            await job.save();
            quotationRequest.requestId = job._id;
            quotationRequest.status = 'completed';
            quotationRequest.lastUpdate = new Date();
            await quotationRequest.save();

            const newBooking = await new BookingModel({
                username: job.username,
                bookingTitle: job.requestTitle,
                bookingDescription: job.requestDescription,
                providerId: job.providerId,
                category: job.requestCategory,
                jobId: job._id,
                budget: job.budget,
                budgetType: req.body.quoteType,
                currency: req.body.quoteBudgetCurrency,
                deadline: job.deadline,
                files: quotationRequest.file ? [quotationRequest.file] : [],
                createdAt: new Date(),
                lastUpdate: new Date(),
                status: "pending"
              });

            await newBooking.save();
            const tempDesc = req.body.quoteDetails ? req.body.quoteDetails : "I charge "+job.budget+" "+job.budgetType+" for this service";
            const newQuotation =  await new QuotationModel({
                username: newBooking.username,
                budget: job.budget,
                budgetType: job.quotationType,
                providerId: req.user._id,
                category: job.requestCategory, 
                jobId: job._id,
                initialBudget: job.budget,
                budgetType: req.body.quoteType,
                currency: req.body.quoteBudgetCurrency,
                quotationDescription: tempDesc,
                deadline: job.deadline,
                status: "sent",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async success => {
                const cust = await UserModel.findOne({username: quotationRequest.username}).exec();
                if(cust){
                    const notification = await new NotificationModel({
                        causedByUserId: req.user._id,
                        causedByItem: job._id,
                        bookingId: newBooking._id,
                        receiverId: cust._id,
                        icon:"fa-money",
                        title: "You have a quote for your request.",
                        content: req.user.firstName+" has provided a quote for your request '"+quotationRequest.requestTitle+"'.",
                        translations: {fr: {
                            title: "Vous avez un devis pour votre demande",
                            content: req.user.firstName+" vous a envoyé un devis pour votre  service '"+quotationRequest.requestTitle+"'."
                        }},
                        createdAt: new Date(),
                        lastUpdate: new Date()
                    }).save().then(async scss=>{
                        console.log("QUOTATION:: Quote successfully sent by provider!");
                        if(cust.SMSUpdateNotifs && (cust.phone.length > 0 || cust.verifiedContact.length > 0) ){
                            let messageBody = "MosalaPro: "+ req.user.firstName+" "+req.user.lastName+" has sent you a  quotation for your booking.";
                            if(res.locals.locale === 'fr'){
                                messageBody = "MosalaPro: "+ req.user.firstName+" "+req.user.lastName+" vous a envoyé un devis pour votre demande.";
                            }
                            const phoneNumber = cust.phone.length > 0 ? cust.phone : cust.verifiedContact;
                            const countryCode = await CountryModel.findOne({name: cust.country}).select('phone_code').exec();
                            console.log("Country code: "+countryCode.phone_code);
                            const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCode.phone_code, messageBody);
                            if(messageSent.success) console.log("Booking quotation notification SMS sent successfully!");
                            else{console.log("Error occured while sending SMS: "+messageSent.message);}
                        }
                        else{
                            console.log("User does not want ot receive SMS or phone number not valid: "+cust.SMSUpdateNotifs+" - "+cust.phone.length);
                        }
                        res.status(200).send({message: "Ok", status: 200});
                        return;
                    }).catch(err=>{
                        res.status(401).send({message: "New notification failed. Error", status: 401});
                        console.log("QUOTATION:: New notification failed. Error: "+err);
                        return;
                    });
                }else console.log("QUOTATION:: User for quotation request not found.");
            }).catch(err=>{
                console.log("QUOTATION:: Error occured while creating job request for quote: "+err);
            });
            
        }else {
            console.log("QUOTATION:: Error - No quotation found with the given id: "+req.body._id);
            return;
        }
    }
    async rejectQuotationRequest(req, res){
        const qr = await QuotationRequestModel.findByIdAndUpdate(req.body.id, {status:'rejected', lastUpdate: new Date()}).exec();
        console.log("Quotation request status: ", qr.status);
        const request = await PostRequestModel.findById(qr.requestId).exec();
        const booking = await BookingModel.findOne({jobId: request?._id}).exec();
        const booking_id = booking != null ? booking._id : " ";
        if(qr){
            console.log("QUOTATION:: QR successfully rejected by provider");
            const notification = await new NotificationModel({
                causedByUserId: req.user._id,
                causedByItem: qr._id,
                bookingId: booking_id,
                receiverId: req.body.userId,
                accountType: "user",
                icon:"fa-times-circle",
                title: "Your quotation request was rejected.",
                content: req.user.firstName+" has rejected your quotation request '"+qr.requestTitle+"'.",
                translations: {fr: {
                    title: "Votre demande de devis a été rejetée.",
                    content: req.user.firstName+" a rejeté votre demande de devis pour le service "+qr.requestTitle
                }},
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async scss=>{
                console.log("QUOTATION:: Quotation rejection notif successfully sent by provider!");
                res.status(200).send({message: "Ok", status: 200});
                return;
            }).catch(err=>{
                console.log("QUOTATION:: New notification failed. Error: "+err);
            });
        }
        else{
            console.log("QUOTATION:: Quotation request rejection failed. No quotation request found!: ");
            res.status(401).send({message: "Quotation request rejection failed. Error.", status: 401});
            return;
        }
    }

    async createQuotationInMessages(req, res) {
        const messageQuotation = await new MessageQuotationModel({
            requestTitle: req.body.title,
            requestDescription: req.body.description,
            requestCategory: req.body.requestCategory,
            budget: req.body.budget,
            budgetType: req.body.budgetType,
            providerId: req.user._id,
            userId: req.body.proId,
            timeOfCompletion: req.body.timeOfCompletion,
            deadline: req.body.requestDeadline,
            status: "new",
            createdAt: new Date(),
            lastUpdate: new Date(),
        }).save();

        const newMessage = await new MessageModel({
            senderId: req.user._id,
            recipientId:  req.body.proId,
            isQuotation: true,
            quotationId: messageQuotation._id,
            createdAt: new Date()
        }).save();

        try {
           
        } catch(ex) {
            console.log("MESSAGE:: Error occured while sending message: "+err);
            res.status(401).send({error:"Error occured while sending message"} );
            return;
        }
        
        // TODO:
        this.sendMessageQuotationToUserThroughSocket(req.body.proId, req.user, messageQuotation);

        //res.status(200).send({message:"Message sent successfully!", status:200} );
    }

    async sendMessageQuotationToUserThroughSocket(userId, sender, messageQuotation) {
        var user = onlineUserSocketsList.find(u => u.id === userId);

        if (user) {
            io.to(user.socketId).emit('messageQuotationToClient', { sender, messageQuotation });
        }
    }

    async rejectMessageQuotation(req, res) {
        console.log("QUOTATION:: Rejecting message quotation.. ");
        const quotation = await MessageQuotationModel.findByIdAndUpdate(req.body.quotationId, {status: "rejected", lastUpdate: new Date()}).exec();
        return;
    }

    async acceptMessageQuotation(req, res) {
        console.log("QUOTATION:: Accepting message quotation..");
        const quotation = await MessageQuotationModel.findByIdAndUpdate(req.body.quotationId, {status: "accepted", lastUpdate: new Date()}).exec();

        const user = await UserModel.findById(quotation.userId).exec();

        // Create new PostRequest
        const newRequest = await new PostRequestModel({
            username: user.email,
            requestTitle: quotation.requestTitle,
            requestDescription: quotation.requestDescription,
            requestCategory: quotation.requestCategory,
            budget: quotation.budget,
            budgetType: quotation.budgetType,
            providerId: quotation.providerId,
            deadline: quotation.deadline,
            status: "in-progress",
            createdAt: new Date(),
            lastUpdate: new Date(),
          }).save();

        // Create new JobApplication with "hired" status
        const newJobApplication = await new JobApplicationModel({
            userId: quotation.userId,
            providerId:  quotation.providerId,
            jobId: newRequest._id,
            status: "hired",
            createdAt: new Date(),
            lastUpdate: new Date()
        }).save();

        const newQuotation = await new QuotationModel({
            username: user.email,
            budget: quotation.budget,
            budgetType: quotation.budgetType,
            quotationDescription: quotation.requestDescription,
            providerId: quotation.providerId,
            category: quotation.requestCategory, 
            jobId: newRequest._id,
            initialBudget: 0,
            deadline: quotation.deadline,
            status: "sent",
            timeOfCompletion: quotation.timeOfCompletion,
            createdAt: new Date(),
            lastUpdate: new Date()
        }).save();

        const newBooking = await new BookingModel({
            username: user.email,
            bookingTitle: quotation.requestTitle,
            bookingDescription: quotation.requestDescription,
            providerId: quotation.providerId,
            category: newRequest.requestCategory,
            jobId: newRequest._id,
            budget: quotation.budget,
            deadline: quotation.deadline,
            createdAt: new Date(),
            lastUpdate: new Date(),
            status: "in-progress"
          }).save();
          return;
    }

    async printInvoice(jobId, req, res){
    }
}

module.exports = Quotation;