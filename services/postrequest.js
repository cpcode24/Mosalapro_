/*********************************************************************************************************
*	postrequest.js : Handles service request submitted by the end user etc.
* Author: Constant Pagoui.
*	Date: 03-19-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/
const UserModel = require("../models/user");
const CategoryModel = require("../models/category");
const PostRequestModel = require("../models/postRequest");
const passport = require("passport");
const _ = require("lodash");
const JobApplication = require("./jobApplication");
const JobApplicationModel = require("../models/jobApplication");
const BookingModel = require("../models/booking");
const NotificationModel = require("../models/notification");
const JobDeliveryModel = require("../models/jobDelivery");
const QuotationModel = require("../models/quotation");
const log4js = require("log4js");
const { query } = require("express");
const QuotationRequestModel = require("../models/quotationRequest");
const logger = log4js.getLogger();
const axios = require("axios");
const CountryModel = require("../models/country");
const TwilioPhoneAuthService = require("../services/twilioPhoneAuth");
const smsSenderObj = new TwilioPhoneAuthService();
const PaymentService = require("./paymentService");

const PostRequestService =  {
  
    postServiceRequest: async(req, res)=>{
        //TODO:Uncomment following if to enabled authentication layer
        // const multer = require("multer");
        // const fs = require("fs");
        if (req.isAuthenticated()) {
           try {
        //     const storage = multer.diskStorage({
        //       destination: function (req, file, cb) {
        //         const dir = "./postAttachments";
        //         if (!fs.existsSync(dir)) {
        //           fs.mkdirSync(dir);
        //         }
      
        //         cb(null, dir); // Save files in the 'uploads' directory
        //       },
        //       filename: function (req, file, cb) {
        //         const uniquePrefix =
        //           Date.now() + "-" + Math.round(Math.random() * 1e9);
        //         cb(null, uniquePrefix + "-" + file.originalname); // Set a unique filename for the uploaded file
        //       },
        //     });
      
        //     const upload = multer({
        //       storage: storage,
        //       limits: {
        //         fileSize: 1024 * 1024 * 100, // Limit the file size to 100MB
        //       },
        //       fileFilter: function (req, file, cb) {
        //         cb(null, true); // Allow any type of file
        //       },
        //     }).array("files", 10); // Allow up to 10 files to be uploaded in one request
      
        //     upload(req, res, async function (err) {
        //       if (err instanceof multer.MulterError) {
        //         // A Multer error occurred when uploading
        //         logger.error("PR:: Error occured: "+err);
        //         res.status(400).send({
        //           responseCode: 400,
        //           responseMessage: "Error uploading files",
        //         });
        //       } else if (err) {
        //         // An unknown error occurred when uploading
        //         logger.error("PR:: Error occured: "+err);
        //         res.status(400).send({
        //           responseCode: 400,
        //           responseMessage: "Error uploading files",
        //         });
        //       }
      
        //       // Everything went fine
        //       logger.info("PR:: Everything went fine");
              const cat = await CategoryModel.findOne({name: req.body.requestCategory}).exec();
              //Storing in db
              const newRequest = new PostRequestModel({
                username: req.body.username,
                requestTitle: _.trim(_.capitalize(req.body.requestTitle)),
                requestDescription: req.body.requestDescription,
                requestCategory: _.trim(cat.name),
                requestCategoryIcon: cat.icon,
                budget: req.body.requestBudget,
                budgetType: req.body.budgetType,
                currency: req.body.budgetCurrency,
                deadline: req.body.requestDeadline,
                status: "active",
                createdAt: new Date(),
                lastUpdate: new Date(),
                //files: req.files.map((file) => file.filename),
                files: req.file? [req.file?.filename]: [],
              }).save().then(success =>{
                  console.log("PR:: Posted successfully!");
                  res.redirect("/");
              }).catch(err => {
                console.log("Error occured while saving into the db: "+err);
              });
             
          } catch (e) {
            res.status(400).send({
              responseCode: 400,
              responseMessage: "Error posting service request: "+e,
            });
          }
        } 
      },

      updateServiceRequest: async(req, res)=>{
        try{
          var ret;
          if(req.file)
            ret = await PostRequestModel.findByIdAndUpdate(req.body._id, {_id: req.body._id, files:
            [req.file.filename], lastUpdate:new Date(), ...req.body});
          else 
            ret = await PostRequestModel.findByIdAndUpdate(req.body._id, {_id: req.body._id, lastUpdate:new Date(), ...req.body});
          if(!ret){
            res.status(401).send("An error occured (Service Request)");
            logger.error("REQUEST SERVICE:: Error occured.");
          }
          else {
            res.status(200).send({message: "Ok", status:200});
            logger.info("REQUEST SERVICE:: Request changes have been saved.");
          }
        
          return;
        }
        catch(error){
          logger.error("REQUEST SERVICE:: Error occured: "+error);
          return;
        }
      },

      getActiveRequests: async(req, res)=>{
        let result = [];
        const activeServiceRequets = await PostRequestModel.find({status: "active",  username:{$ne:req.user.username}}).sort({lastUpdate:-1}).exec();
        const jobsApplied = await JobApplicationModel.find({providerId: req.user._id}).sort({lastUpdate:-1}).exec();

        activeServiceRequets.forEach(asr => {
            applied = false;
            jobsApplied.forEach(ja=>{
              if(ja.jobId == asr._id){
                applied = true;
              }
            });

            if(!applied)
              result.push(asr);
        });
       
        return result;

      },

      getBookedPros: async (req, res)=>{
        const pRequests = await PostRequestModel.find({username:req.user.username}).exec();
        let pros = [];
        for(let i = 0; i < pRequests.length; i++){
          if(pRequests[i].status == 'in-progress' || pRequests[i].status=='completed'){
            const booking = await BookingModel.findOne({jobId: pRequests[i]._id}).exec();
            if(booking){
              const pro = await UserModel.findById(booking.providerId).exec();
              pros.push(pro.firstName +" "+pro.lastName);
            }else
              pros.push(" ");
            
          }
          else
            pros.push(" ");
        }

        return pros.reverse();
      },

      resubmitRequest: async (req, res)=>{
        const pRequest = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {status: "active", lastUpdate: new Date(), requestDescription: req.body.requestDesc, requestTitle: req.body.requestTitle,
              requestCat: req.body.requestCat, deadline: req.body.deadline, budget: req.body.budget, budgetType: req.body.budgetType, currency: req.body.currency }).then(success=>{
          logger.info("POST REQUEST:: request has been resubmitted successfully.");
          res.status(200).send({message: "Ok", status: 200});
          return;
        }).catch(err=>{
          logger.error("POST REQUEST:: An error occured while resubmitting request: "+err);
          res.status(401).send({message: "Error", status: 401});
          return;
        });
        return;
      },

      cancelRequest: async (req, res)=>{
        const pRequest = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {status: "cancelled", lastUpdate: new Date()}).then(success=>{
          logger.info("POST REQUEST:: request has been cancelled successfully.");
          res.status(200).send({message: "Ok", status: 200});
          return;
        }).catch(err=>{
          logger.error("POST REQUEST:: An error occured while cancelling request: "+err);
          res.status(401).send({message: "Error", status: 401});
          return;
        });
        return;
      },

      checkBookingsDeadline: async ()=>{
        const providers = await UserModel.find({accountType:"provider"}).exec();
        logger.info("POST REQUEST:: Providers: "+providers.length);
        if(providers){
          let bookingsWithCloseDeadlines = [];
          for(let j = 0; j < providers.length; j++){
            try{
              const bookings = await BookingModel.find({providerId: providers[j]._id}).exec();
              logger.info("POST REQUEST:: Bookings: "+bookings.length);
              if(bookings){
                const today = new Date();
                bookings.forEach(booking=>{
                  const deadline = new Date(booking.deadline);
                  const diffTime = deadline - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  logger.info("POST REQUEST:: today: "+today+" - deadline: "+deadline+"; diff: "+diffDays);
                  if(diffTime > 0 && diffDays <= 2 && (booking.status == "active" || booking.status == "in-progress") ){
                    bookingsWithCloseDeadlines.push(booking);
                  }
                });
              }
            }catch(error){
              logger.error("POST REQUEST:: Error occured while retrieving bookings: "+error);
            }
          }
          return bookingsWithCloseDeadlines;
        }
        else{
          logger.info("POST REQUEST:: No providers were returned.");
        }
      },
      find: async(req)=>{
        let res = {};
        const category = _.trim(req.query.category) == "Technology" ? "Technology & Engineering" : req.query.category;
        if(req.query.category !== "all")
          res = await PostRequestModel.find({requestCategory: category, status:'active', username:{$ne:req.user.username}}).sort({lastUpdate:-1}).exec();
        else res = await PostRequestModel.find({status:'active', username:{$ne:req.user.username}}).sort({lastUpdate:-1}).exec();
        const jobsApplied = await JobApplicationModel.find({providerId: req.user._id}).sort({lastUpdate:-1}).exec();
        let result = [];
        res.forEach(asr => {
            applied = false;
            jobsApplied.forEach(ja=>{
              if(ja.jobId == asr._id){
                applied = true;
              }
            });

            if(!applied)
              result.push(asr);
        });
        return result;
      },
      requestRevision: async (req, res) => { 
        const request = await PostRequestModel.findByIdAndUpdate(req.body.requestId, {status:"in-progress", lastUpdate: new Date()}).exec();
         
        const booking = await BookingModel.findOne({ jobId: req.body.requestId }).exec();
        booking.status = "in-progress";
        booking.lastUpdate = new Date();
        await booking.save();
        
        const delivery = await JobDeliveryModel.findOne({ jobId: req.body.requestId }).exec();
        delivery.revisionReason = req.body.revisionReason;
        await delivery.save();
        console.log("PR:: Request Id for nitf: "+request._id);
        const notification = await new NotificationModel({
          causedByUserId: req.user._id,
          causedByItem: request._id,
          bookingId: booking._id,
          receiverId: request.providerId,
          icon:"fa-share-square-o",
          title: "You have a revision request.",
          content: req.user.firstName+" has requested a revision for the job '"+request.requestTitle+"'.",
          translations: {fr: {
            title: "Vous avez une demande de révision",
            content: req.user.firstName+" a demandé de passer en revue le service '"+request.requestTitle+"'"}
          },
          createdAt: new Date(),
          lastUpdate: new Date()
        }).save().then(async scss=>{
            logger.info("PR:: Quotation notification has been sent successfully.");
            const pro = await UserModel.findById(request.providerId).exec();
            if(pro){
              if(pro.SMSUpdateNotifs && (pro.phone.length > 0 || pro.verifiedContact.length > 0)){
                let messageBody = "Mosalapro: "+req.user.firstName+" has requested a revision for the job '"+request.requestTitle+"'.";
                if(res.locals.locale === 'fr'){
                  messageBody = "Mosalapro: "+req.user.firstName+" a demandé de passer en revue le service '"+request.requestTitle+"'.";
                }
                const phoneNumber = pro.phone.length > 0 ? pro.phone : pro.verifiedContact;
                const countryCod = await CountryModel.findOne({name: pro.country}).select('phone_code').exec();
                const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCod.phone_code, messageBody);
                if(messageSent.success) console.log("Quotation revision notification SMS sent successfully!");
                else{console.log("Error occured while sending SMS: "+messageSent.message);}
              }
            }else{ console.log('No pro found to send SMS notif.'); }
            return;
        }).catch(err=>{
            res.status(401).send({message: "New notification failed. Error", status: 401});
            logger.error("USER:: New notification failed. Error: "+err);
            return;
        }); 
      },
      acceptDelivery: async (req, res) =>{
        const request = await PostRequestModel.findByIdAndUpdate(req.body.requestId, {status:"accepted", lastUpdate: new Date()}).exec();
        const booking = await BookingModel.findOne({jobId: req.body.requestId}).exec();

        // Trigger payout to provider when customer accepts delivery
        try {
          if (booking && booking.paymentTransactionId && booking.paymentStatus === 'held') {
            console.log("PR:: Triggering payout to provider for booking:", booking._id);

            const payout = await PaymentService.releasePaymentToProvider(booking.paymentTransactionId);

            // Update booking with payout details
            booking.payoutId = payout._id;
            booking.payoutStatus = payout.status;
            console.log("PR:: Payout initiated successfully:", payout._id);
          } else {
            console.log("PR:: No payment to release or payment not held");
          }
        } catch (payoutError) {
          console.error("PR:: Error releasing payment to provider:", payoutError);
          // Continue with the rest of the process even if payout fails
          // The payout can be manually processed later if needed
        }

        // Update booking status
        booking.status = 'accepted';
        booking.lastUpdate = new Date();
        await booking.save();

        console.log("PR:: Request Id for nitf: "+request._id);
        const notification = await new NotificationModel({
          causedByUserId: req.user._id,
          causedByItem: request._id,
          bookingId: booking._id,
          receiverId: request.providerId,
          icon:"fa-check-square-o",
          accountType: "pro",
          title: "Your delivery has been accepted!",
          content: req.user.firstName+" has accepted your delivery for the service request '"+request.requestTitle+"'.",
          translations: {fr: {
            title: "Votre prestation a été acceptée. ",
            content: req.user.firstName+" a accepté votre prestation pour le service '"+request.requestTitle+"'."}
          },
          
          createdAt: new Date(),
          lastUpdate: new Date()
        }).save().then(async scss=>{
            logger.info("PR:: Delivery acceptance notification has been sent successfully.");
            const pro = await UserModel.findById(request.providerId).exec();
            if(pro){
              if(pro.SMSUpdateNotifs && (pro.phone.length > 0 || pro.verifiedContact.length > 0)){
                let messageBody = "Mosalapro: "+req.user.firstName+" has accepted your delivery for the service request '"+request.requestTitle+"'.";
                if(res.locals.locale === 'fr'){
                  messageBody = "Mosalapro: "+req.user.firstName+" a accepté votre prestation pour le service '"+request.requestTitle+"'.";
                }
                const phoneNumber = pro.phone.length > 0 ? pro.phone : pro.verifiedContact;
                const countryCod = await CountryModel.findOne({name: pro.country}).select('phone_code').exec();
                const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCod.phone_code, messageBody);
                if(messageSent.success) console.log("Delivery acceptance notification SMS sent successfully!");
                else{console.log("Error occured while sending SMS: "+messageSent.message);}
              }
            }else{ console.log('No pro found to send SMS notif.'); }
            return;
        }).catch(err=>{
            res.status(401).send({message: "New notification failed. Error", status: 401});
            logger.error("USER:: New notification failed. Error: "+err);
            return;
        }); 
      },
      requestNewDeadline: async (req, res) => {
        const booking = await BookingModel.findByIdAndUpdate(req.body.bookingId, {
          newDeadlineRequest: {
            newDeadline: req.body.newDeadline,
            reason: req.body.reason,
          }
        }).exec();
        const request = await PostRequestModel.findByIdAndUpdate(booking.jobId, {
            newDeadlineRequest: {
              newDeadline: req.body.newDeadline,
              reason: req.body.reason,
            }
          }
        ).exec();
        
        const usr = await UserModel.findOne({username: booking.username}).exec();
        const notification = await new NotificationModel({
          causedByUserId: req.user._id,
          causedByItem: request._id,
          bookingId: booking._id,
          receiverId: usr._id,
          icon:"fa-clock-o",
          title: "Deadline extension request",
          content: req.user.firstName+" has requested to extend the delivery deadline of the service '"+request.requestTitle+"' to "+req.body.newDeadline,
          translations: {fr: {
            title: "Demande d'extension de délai d'échéance.",
            content: req.user.firstName+ " demande une extension de délai d'échéance pour le service '"+request.requestTitle+"' a la date: "+req.body.newDeadline }
          },
          createdAt: new Date(),
          lastUpdate: new Date()
        }).save().then(async scss=>{
            logger.info("PR:: Request extension notification has been sent successfully.");
            return;
        }).catch(err=>{
            res.status(401).send({message: "New notification failed. Error", status: 401});
            logger.error("USER:: New notification failed. Error: "+err);
            return;
        }); 
      },
      acceptNewDeadline: async (req, res) => {
        try{
          const request = await PostRequestModel.findById(req.body.requestId).exec();
          const booking = await BookingModel.findOne({ jobId: request._id.toString() }).exec();

          request.deadline = booking.newDeadlineRequest.newDeadline;
          booking.deadline = booking.newDeadlineRequest.newDeadline;
          
          request.newDeadlineRequest = null;
          booking.newDeadlineRequest = null;

          await booking.save();
          await request.save();
          const notification = new NotificationModel({
            causedByUserId: req.user._id,
            causedByItem: req.body.requestId,
            bookingId: booking._id,
            receiverId: request.providerId,
            icon:"fa-check-square-o",
            accountType: "pro",
            title: "Your deadline extension request has been accepted.",
            content: req.user.firstName+" has accepted your deadline extension request for the job '"+request.requestTitle+"'.",
            translations: {fr: {
              title: "Votre demande d'extension de délai a été acceptée.",
              content: req.user.firstName+" a accepté votre demande d'extension de délai d'échéance pour le service '"+request.requestTitle+"' ."}
            },
            createdAt: new Date(),
            lastUpdate: new Date()
          }).save().then(async scss=>{
              logger.info("PR:: Quotation notification has been sent successfully.");
              const pro = await UserModel.findById(request.providerId).exec();
              if(pro){
                if(pro.SMSUpdateNotifs && (pro.phone.length > 0 || pro.verifiedContact.length > 0)){
                  let messageBody = "Mosalapro: "+req.user.firstName+" has accepted your deadline extension request for the job '"+request.requestTitle+"'.";
                  if(res.locals.locale === 'fr'){
                    messageBody = "Mosalapro: "+req.user.firstName+" a accepté votre demande d'extension de délai d'échéance pour le service '"+request.requestTitle+"' .";
                  }
                  const phoneNumber = pro.phone.length > 0 ? pro.phone : pro.verifiedContact;
                  const countryCod = await CountryModel.findOne({name: pro.country}).select('phone_code').exec();
                  const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCod.phone_code, messageBody);
                  if(messageSent.success) console.log("Deadline acceptance notification SMS sent successfully!");
                  else{console.log("Error occured while sending SMS: "+messageSent.message);}
                }
              }else{ console.log('No pro found to send SMS notif.'); }
              return;
          }).catch(err=>{
              res.status(401).send({message: "New notification failed. Error", status: 401});
              logger.error("USER:: New notification failed. Error: "+err);
              return;
          }); 
        }catch(error){ console.log("PR:: Error occured - accepting dealine ext request: "+error);}
      },
      rejectNewDeadline: async (req, res)=>{
        try{
          const request = await PostRequestModel.findById(req.body.requestId).exec();
          const booking = await BookingModel.findOne({ jobId: request._id.toString() }).exec();
          
          request.newDeadlineRequest = null;
          booking.newDeadlineRequest = null;

          await booking.save();
          await request.save();
          const notification = new NotificationModel({
            causedByUserId: req.user._id,
            causedByItem: req.body.requestId,
            receiverId: request.providerId,
            bookingId: booking._id,
            icon:"fa-times-circle",
            accountType: "pro",
            title: "Your deadline extension request was rejected.",
            content: req.user.firstName+" has rejected your deadline extension request for the job '"+request.requestTitle+"'.",
            translations: {fr: {
              title: "Votre demande d'extension de délai a été rejetée.",
              content: req.user.firstName+" a rejeté votre demande d'extension de délai pour le service '"+request.requestTitle+"'"}
            },
            createdAt: new Date(),
            lastUpdate: new Date()
          }).save().then(async scss=>{
              logger.info("PR:: Quotation notification has been sent successfully.");
              return;
          }).catch(err=>{
              res.status(401).send({message: "New notification failed. Error", status: 401});
              logger.error("USER:: New notification failed. Error: "+err);
              return;
          }); 
        }catch(error){ console.log("PR:: Error occured - accepting dealine ext request: "+error);}
      },
      acceptQuotation: async (req, res) => {
        console.log("PR:: Accepting quote - updating request & booking...");
        try{
          const quotation = await QuotationModel.findByIdAndUpdate(req.body.quotationId, {status:'accepted', lastUpdate: new Date()}).exec();
          
          const request = await PostRequestModel.findById(req.body.requestId).exec();
          let newAmount = quotation.budget;
          // if(quotation.currency != request.currency){
          //   const usdBasedRates = await axios.get('https://api.currencyfreaks.com/v2.0/rates/latest?apikey='+process.env.CURRFREAKSAPI);
                
          //   const reqBudgetInUSD = quotation.currency != "USD" ? quotation.budget / usdBasedRates.data.rates[quotation.currency] : 
          //                                                                       quotation.budget;
          //   newAmount = reqBudgetInUSD * usdBasedRates.data.rates[request.currency];
          // }
          request.budget = newAmount;
          request.providerId = quotation.providerId;
          request.lastUpdate= new Date();
          request.status= 'in-progress';
          await request.save();
          const booking = await BookingModel.findOne({ jobId: request._id.toString() }).exec();
          if(!booking){
            const newBooking = await new BookingModel({
              username: req.user.username,
              bookingTitle: request.requestTitle,
              bookingDescription: request.requestDescription,
              providerId: request.providerId,
              category: request.requestCategory,
              jobId: request._id,
              budget: newAmount,
              budgetType: quotation.budgetType,
              currency: request.currency,
              deadline: request.deadline,
              files: request.file ? [request.file] : [],
              createdAt: new Date(),
              lastUpdate: new Date(),
              status: "in-progress"
            }).save().then(succ=>{
              console.log("PR:: Booking created successfully for job application.");
            }).catch(err=>{
              console.log("PR:: Error occured while creating booking for job appli: ", err);
            });
          }
          else{
            booking.budget = newAmount;
            booking.providerId = quotation.providerId;
            booking.status = 'in-progress';
            await booking.save();
          }
          
          const notification = await new NotificationModel({
            causedByUserId: req.user._id,
            causedByItem: req.body.requestId,
            bookingId: booking._id,
            receiverId: quotation.providerId,
            icon:"fa-check-square-o",
            title: "Your quote has been accepted.",
            accountType: "pro",
            content: req.user.firstName+" has accepted your quote proposal for the job '"+request.requestTitle+"'. Open to check job's details",
            translations: {fr: {
              title: "Votre devis a été accepté.",
              content: req.user.firstName+" a accepté votre devis pour le service '"+request.requestTitle}
            },
            createdAt: new Date(),
            lastUpdate: new Date()
          }).save().then(async scss=>{
              logger.info("PR:: Quotation notification has been sent successfully.");
              const pro = await UserModel.findById(quotation.providerId).exec();
              if(pro){
                if(pro.SMSUpdateNotifs && (pro.phone.length > 0 || pro.verifiedContact.length > 0)){
                  let messageBody = "Mosalapro: "+req.user.firstName+" has accepted your quote proposal for the job '"+request.requestTitle+"'.";
                  if(res.locals.locale === 'fr'){
                    messageBody = "Mosalapro: "+req.user.firstName+" a accepté votre devis pour le service '"+request.requestTitle+"'.";
                  }
                  const phoneNumber = pro.phone.length > 0 ? pro.phone : pro.verifiedContact;
                  const countryCod = await CountryModel.findOne({name: pro.country}).select('phone_code').exec();
                  const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCod.phone_code, messageBody);
                  if(messageSent.success) console.log("Quotation acceptance notification SMS sent successfully!");
                  else{console.log("Error occured while sending SMS: "+messageSent.message);}
                }
              }else{ console.log('No pro found to send SMS notif.'); }
              return;
          }).catch(err=>{
              res.status(401).send({message: "New notification failed. Error", status: 401});
              logger.error("USER:: New notification failed. Error: "+err);
              return;
          }); 
        }catch(error){ console.log("PR:: Error occured while updating request and booking for quotation: "+error);}
      },

      rejectQuotation: async (req, res) => {
        console.log("PR:: Rejecting quote - updating request & booking...");
        try{
          const quotation = await QuotationModel.findByIdAndUpdate(req.body.quotationId, {status:'rejected', lastUpdate: new Date()}).exec();
          const request = await PostRequestModel.findById(quotation.jobId).exec();
          const quotationRequest = await QuotationRequestModel.findOneAndUpdate({requestId: request._id},{status:'rejected'}).exec();
          var title_ = "Your quote was rejected.";
          var cause_ = req.body.requestId;
          if(quotationRequest)
            cause_ = quotationRequest._id;
          else{
            title_ = "Your application's quote was rejected.";
            const jobAppli = await JobApplicationModel.findOneAndDelete({providerId: request.providerId, jobId: request._id}).exec();
            console.log("Deleted job application: ", jobAppli._id);
            
          }
          console.log("PR:: updated quotation status: "+quotation.status);
          const notification = await new NotificationModel({
            causedByUserId: req.user._id,
            causedByItem: cause_,
            receiverId: quotation.providerId,
            icon:"fa-times-circle",
            accountType: "pro",
            title: title_,
            content: req.user.firstName+" rejected your quote proposal for the job '"+request.requestTitle+"'. You can resend another quote with lower budget.",
            translations: {fr: {
              title: "Votre devis a été rejeté.",
              content: req.user.firstName+" a rejeté votre devis pour le service '"+request.requestTitle+"'. Vous pouvez re-envoyer un autre devis."}
            },
            
            createdAt: new Date(),
            lastUpdate: new Date()
          }).save().then(async scss=>{
              logger.info("PR:: Quotation notification has been sent successfully.");
              return;
          }).catch(err=>{
              res.status(401).send({message: "New notification failed. Error", status: 401});
              logger.error("USER:: New notification failed. Error: "+err);
              return;
          }); 
        }catch(error){ console.log("PR:: Error occured while updating request and booking for quotation: "+error);}
      },
      
      getApplicants: async (req, res) => {
        let inPros = [];
        let applications = await JobApplicationModel.find({ jobId: req.params?.srId}).exec();
        const applicantIds = applications.map(item => item.providerId);
        let applicants = await UserModel.find({ _id: { $in: applicantIds }}).exec();
        let quotation = await QuotationModel.find({ jobId: req.params?.srId}).exec();

        applicantsFromQuot =  await Promise.all(applicants.map(async (a) => {
            a.quotation = quotation.find(q => q.providerId === a._id.toString());
            return a;
          }));
        
        inPros.push(...applicantsFromQuot);

        return inPros;
      }

}

module.exports = PostRequestService;
