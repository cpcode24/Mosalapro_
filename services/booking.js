/*********************************************************************************************************
*	booking.js : Handles booking submitted by the end user directly to provider.
* Author: Constant Pagoui.
*	Date: 05-14-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/
require("dotenv").config();
const UserModel = require("../models/user");
const CategoryModel = require("../models/category");
const BookingModel = require("../models/booking");
const passport = require("passport");
const JobApplication = require("./jobApplication");
const JobApplicationModel = require("../models/jobApplication");
const PostRequestModel = require("../models/postRequest");
const NotificationModel = require("../models/notification");
const JobDeliveryModel = require("../models/jobDelivery");
const EmailSender = require("./emailsender");
const { response } = require("express");
const emailSenderObj = new EmailSender();
const PaymentService = require("./paymentService");
const PaymentMethod = require("../models/paymentMethod");


const BookingService =  {
  
    postBooking: async(req, res)=>{
        
            //   }
            if(req.isAuthenticated()){
              try{
              const pro = await UserModel.findById(req.body.providerId).exec();
              if(pro){
                // console.log("BOOKING:: Provider found.");
              }else{console.log("BOOKING:: Error occured while retrieving provider. "); return;}
              const newRequest = await new PostRequestModel({
                username: req.body.username,
                requestTitle:  req.body.bookingTitle,
                requestDescription: req.body.bookingDescription,
                requestCategory: pro.category,
                budget: req.body.bookingBudget,
                budgetType: req.body.bookingBudgetType,
                currency: req.body.budgetCurrency,
                deadline: req.body.bookingDeadline,
                status: "booked",
                providerId: pro._id,
                requestCategory: pro.category,
                // files: req.files.map((file) => file.filename),
                files: req.file? [req.file.filename] : [],
                createdAt: new Date(),
                lastUpdate: new Date(),
              }).save();
              if(!newRequest){
                res.send({
                  responseCode: 402,
                  responseMessage: "Error occured while creating request"
                });
                return;
              }

              const newBooking = await new BookingModel({
                username: req.body.username,
                bookingTitle: req.body.bookingTitle,
                bookingDescription: req.body.bookingDescription,
                budget: req.body.bookingBudget,
                budgetType: req.body.bookingBudgetType,
                currency: req.body.budgetCurrency,
                deadline: req.body.bookingDeadline,
                providerId: pro._id,
                category: newRequest.requestCategory,
                jobId: newRequest._id,
                status: "active",
                createdAt: new Date(),
                lastUpdate: new Date(),
                //files: req.files.map((file) => file.filename),
                files: req.file? [req.file?.filename]: [],
              }).save();
              if(newBooking){
                  const notification = await new NotificationModel({
                  causedByUserId: req.user._id,
                  causedByItem: newRequest._id,
                  bookingId: newBooking._id,
                  receiverId: req.body.providerId,
                  accountType: "pro",
                  icon: "fa-address-card",
                  title: "You have been booked for a service.",
                  content: req.user.firstName+" has booked you for the following service: "+req.body.bookingTitle+". Confirm the booking to start working on it.",
                  translations: { fr:{ 
                    title: "Vous avez été selectionné pour un service",
                    content: req.user.firstName+" vous a selectionné pour le service suivant: "+req.body.bookingTitle+". Confirmez la demande de service pour commencer a travailler dessus."}
                  },
                  createdAt: new Date(),
                  lastUpdate: new Date()
                    }).save().then(async success=>{
                      if(pro.bkgUpdateNotifs){
                        const emailTitle = "You have been booked for a service.";
                        const emailContent = req.user.firstName+" "+req.user.lastName+" has booked you for the following service: "+req.body.bookingTitle+". Confirm the booking to start working on it.\n";
                        if(await emailSenderObj.sendNotification(emailTitle, emailContent, pro.email, pro.firstName))
                          console.log("BOOKING:: Notification's email sent to user.");
                        else
                          console.log("BOOKING:: Failed to send notification to user.");
                        }
                      res.send({
                        responseCode: 200,
                        responseMessage: "Ok"
                      });
                        return;
                  }).catch(err=>{
                    console.log("BOOKING:: cancel booking notification - Error occured: "+err);
                  });
                  console.log("Posted successfully!");
      
              }else{console.log("Error occured while saving into the db: "+err);};
             
          
          } catch (e) {
            console.log(e);
            res.send({
              responseCode: 400,
              responseMessage: "Error posting service booking: "+e,
            });
            return;
          }
        } 
      },

      confirmBooking: async (req, res)=>{
          const booking = await BookingModel.findById(req.body.bookingId).exec();

          if(booking){

            booking.paymentRequired = false; // default to false for now, can be set to true for specific categories or based on provider preferences in the future

          // Trigger payment hold (escrow) when provider confirms booking
          try {
            if (booking.paymentRequired && booking.paymentStatus === 'pending') {
              const customer = await UserModel.findOne({username: booking.username}).exec();

              // Get customer's default payment method or use provided one
              let paymentMethodId = req.body.paymentMethodId;

              if (!paymentMethodId) {
                const defaultPaymentMethod = await PaymentMethod.getDefaultForUser(customer._id);
                if (defaultPaymentMethod) {
                  paymentMethodId = defaultPaymentMethod._id;
                } else {
                  console.log("BOOKING:: No payment method found for customer. Payment required.");
                  res.status(402).send({
                    status: 402,
                    message: "Payment method required",
                    requiresPayment: true
                  });
                  return;
                }
              }

              // Create escrow payment
              const transaction = await PaymentService.createEscrowPayment(
                booking._id,
                paymentMethodId,
                {
                  ipAddress: req.ip,
                  userAgent: req.get('user-agent')
                }
              );

              // Update booking with payment details
              booking.paymentTransactionId = transaction._id;
              booking.paymentStatus = transaction.status;
              booking.paymentProvider = transaction.paymentProvider;
              await booking.save();

              // Capture the payment immediately (move from authorized to held)
              await PaymentService.capturePayment(transaction._id);

              console.log("BOOKING:: Payment held in escrow successfully");
            }
          } catch (paymentError) {
            console.error("BOOKING:: Payment error:", paymentError);
            res.status(402).send({
              status: 402,
              message: "Payment failed: " + paymentError.message,
              paymentError: true
            });
            return;
          }

          // Update booking and job status
          booking.status = "in-progress";
          booking.lastUpdate = new Date();
          await booking.save();

          const job = await PostRequestModel.findByIdAndUpdate(booking.jobId, {status: "in-progress", lastUpdate: new Date()}).exec();
          // console.log("BOOKING:: booking has been successfully confirmed");
          const customer = await UserModel.findOne({username: booking.username}).exec();
          const notification = await new NotificationModel({
            causedByUserId: req.user._id,
            causedByItem: booking.jobId,
            icon: "fa-address-card",
            receiverId: customer._id,
            title: "Your booking has been confirmed.",
            content: req.user.firstName+" "+req.user.lastName+" has confirmed your service booking. Your service request is in progress.",
            translations: { fr:{ 
              title: "Votre demande de service a ete confirmé.",
              content: req.user.firstName+" "+req.user.lastName+" a confirmé votre demande. Le service est en cours."}
            },
            createdAt: new Date(),
            lastUpdate: new Date()
              }).save().then(success=>{
                if(customer.reqUpdateNotifs){
                  const emailTitle = "Your booking has been confirmed.";
                  const emailContent = req.user.firstName+" has confirmed your service booking. Your service request is in progress.\n";
                  if(emailSenderObj.sendNotification(emailTitle, emailContent, customer.email, customer.firstName))
                    console.log("BOOKING:: Notification's email sent to user.");
                }
            }).catch(err=>{
              console.log("BOOKING:: cancel booking notification - Error occured: "+err);
            });
          res.status(200).send({status: 200, message: "Ok"});
          return;
        }else{
          console.log("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        }

        return;
      },

      cancelBookingByPro: async (req, res)=>{
        const booking = await BookingModel.findByIdAndUpdate(req.body.bookingId, {status:"cancelled", providerId: " ", lastUpdate: new Date()}).exec();
        if(booking){
          const job = await PostRequestModel.findByIdAndUpdate(booking.jobId, {status: "active", providerId: " ", lastUpdate: new Date()}).exec();
          console.log("BOOKING:: booking has been successfully cancelled");
          const customer = await UserModel.findOne({username: booking.username}).exec();
          const notification = await new NotificationModel({
              causedByUserId: req.user._id,
              causedByItem: job._id,
              receiverId: customer._id,
              icon: "fa-address-card",
              title: "Your booking request has been cancelled.",
              content: req.user.firstName+" "+req.user.lastName+" has cancelled your service booking: "+job.requestTitle+". Your request has been listed for other providers to apply.",
              translations:{fr:{
                title: "Votre demande a été rejetée.",
                content: req.user.firstName+" a rejeté votre demande de service: "+job.requestTitle+". Votre demande a été relistée pour que d'autres prestataires postulent."}
              },
              createdAt: new Date(),
              lastUpdate: new Date()
                }).save().then(success=>{
                  if(customer.reqUpdateNotifs){
                    const emailTitle = "Your booking request has been cancelled.";
                    const emailContent = req.user.firstName+" has cancelled your service booking. Your request has been listed for other providers to apply.\n";
                    if(emailSenderObj.sendNotification(emailTitle, emailContent, customer.email, customer.firstName))
                      console.log("BOOKING:: Notification's email sent to user.");
                  }
              }).catch(err=>{
                console.log("BOOKING:: cancel booking notification - Error occured: "+err);
              });

          res.status(200).send({status: 200, message: "Ok"});
          return;
        }else {
          console.log("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        };

        return;
      },

      cancelBookingByUser: async (req, res)=>{
        const booking = await BookingModel.findByIdAndUpdate(req.body.bookingId, {status:"cancelled", lastUpdate: new Date()}).exec();
        if(booking){
          const job = await PostRequestModel.findByIdAndUpdate(booking.jobId, {status: "active", lastUpdate: new Date()}).exec();
          const prov = await UserModel.findById(booking.providerId).exec();
          console.log("BOOKING:: booking has been successfully cancelled");
          const notification = await new NotificationModel({
              causedByUserId: req.user._id,
              causedByItem: job._id,
              receiverId: booking.providerId,
              accountType: "pro",
              icon: "fa-tasks",
              title: "Your booking has been cancelled.",
              content: req.user.firstName+" "+req.user.lastName+" has cancelled your service booking. The service request has been made available for other providers to apply.",
              translations:{fr:{
                title: "Votre demande a été rejetée.",
                content: req.user.firstName+" a rejeté votre demande de service: "+job.requestTitle+"."}
              },
              createdAt: new Date(),
              lastUpdate: new Date()
                }).save().then(success=>{
                  if(prov && prov.bkgUpdateNotifs){
                    const emailTitle = "Your booking has been cancelled.";
                    const emailContent = req.user.firstName+" "+req.user.lastName+" has cancelled your service booking. The service request has been made available for other providers to apply.\n";
                    if(emailSenderObj.sendNotification(emailTitle, emailContent, prov.email, prov.firstName))
                      console.log("BOOKING:: Notification's email sent to user.");
                  }
              }).catch(err=>{
                console.log("BOOKING:: cancel booking notification - Error occured: "+err);
              });

          res.status(200).send({status: 200, message: "Ok"});
          return;
        }else {
          console.log("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        };

        return;
      },

      completeBooking: async (req, res)=>{
        //console.log("BOOKING:: Booking mf ID: "+req.body.bookingId);
        const booking = await BookingModel.findById(req.body.bookingId).exec();
        //console.log("BOOKING:: "+booking);
        if(booking){
            const job = await PostRequestModel.findById(booking.jobId).exec();
            // If provider submitted completion files to customer
            try{
              // const multer = require("multer");
              // const fs = require("fs");
              // let file_ = "";
              // if(req.file){
              //     const storage = multer.diskStorage({
              //       destination: function (req, file, cb) {
              //         const dir = "./postAttachments";
              //         if (!fs.existsSync(dir)) {
              //           fs.mkdirSync(dir);
              //         }
              //         cb(null, dir); 
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
              //         fileSize: 1024 * 1024 * 500, // Limit the file size to 500MB
              //       },
              //       fileFilter: function (req, file, cb) {
              //         cb(null, true); // Allow any type of file
              //       },
              //     }).array("files", 10); 
              //     await upload(req, res, async function (err) {
              //       if (err instanceof multer.MulterError) {
              //         console.log(err);
              //         res.status(400).send({ responseCode: 400, responseMessage: "Error uploading files",
              //         });
              //       } else if (err) {
              //         console.log(err);
              //         res.status(400).send({  responseCode: 400, responseMessage: "Error uploading files",
              //         });
              //       }
              //     });
              //     console.log("MF Files: "+req.file.originalName); // Contains information about the uploaded files
              //     file_ = req.body.file.name;
              // }
              if(job){
                job.status = "completed";
                job.lastUpdate = new Date();
                await job.save();
              
                booking.status = "completed";
                booking.lastUpdate = new Date();
                //booking.providerFiles = file_;
                await booking.save();

                // remove old delivery
                await JobDeliveryModel.deleteOne({ jobId: job._id}).exec();
                const file = req.file?.filename;
                await new JobDeliveryModel({
                  jobId: job._id,
                  comment: req.body.providerComments,
                  file: file,
                  createdAt: new Date(),
                  lastUpdate: new Date(),
                }).save();
              

                const user = await UserModel.findOne({username: booking.username}).exec();
                //console.log("BOOKING:: User email: "+user.email);
                const notification = await new NotificationModel({
                  causedByUserId: req.user._id,
                  causedByItem: job._id,
                  receiverId: user._id,
                  title: "Your task has been completed.",
                  icon: "fa-check-square-o",
                  content: req.user.firstName+" "+req.user.lastName+" has completed your service booking \'"+booking.bookingTitle
                          +"\'. Review the submission and evaluate the service provider accordingly.",
                  translations: {fr: { 
                            title: "Votre service est achevé.",
                            content: req.user.firstName+" a acheve votre service:  \'"+booking.bookingTitle
                            +"\'. Passer en revue le service fourniet laisser un review pour le prestataire."}
                  },
                  createdAt: new Date(),
                  providerComments: req.body.providerComments,
                  lastUpdate: new Date()
                    }).save().then(success=>{
                      if(user.reqUpdateNotifs){
                        const emailTitle = "Your task has been completed.";
                        const emailContent = req.user.firstName+" has completed your service booking \'"+booking.bookingTitle
                        +"\'. Review the submission and evaluate the service provider accordingly.";
                        if(emailSenderObj.sendNotification(emailTitle, emailContent, user.email, user.firstName))
                          console.log("BOOKING:: Notification's email sent to user.");
                      }
                      console.log("BOOKING:: booking completion notification- Notification sent to user.");
                  }).catch(err=>{
                    console.log("BOOKING:: booking completion notification - Error occured: "+err);
                  });
                  console.log("BOOKING:: booking has been successfully completed");
                  res.status(200).send({status: 200, message: "Ok"});
                  return;
                }else {
                  console.log("BOOKING:: No job found. Booking completion failed.");
                  //logger.log("BOOKING:: No job found. Booking completion failed.");
                  }
              }catch(err){ 
                console.log("BOOKING:: Error occured while uploading submitted file: "+err);
                res.status(401).send({status: 401, message: "Error"});
                return;
          }
        }else {
          console.log("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        };
        return;

      }

}

module.exports = BookingService;
