/*********************************************************************************************************
*	jobApplication.js : Handles job application operations performed by providers.
*   Author: Constant Pagoui.
*	Date: 04-13-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const JobApplicationModel = require("../models/jobApplication");
const PostRequestModel = require("../models/postRequest");
const UserModel = require("../models/user");
const NotificationModel = require("../models/notification");
const EmailSender = require("./emailsender");
const emailSenderObj = new EmailSender();
const axios = require("axios");


class JobApplication {
    async apply(req, res){
        const user = await UserModel.findOne({username: req.body.username}).exec();
        const newJobApplication = await new JobApplicationModel({
            userId: user._id,
            providerId:  req.user._id,
            jobId: req.body.jobId,
            status: "applied",
            timeOfCompletion: req.body.timeOfCompletion ? parseInt(req.body.timeOfCompletion) : 0,
            createdAt: new Date(),
            lastUpdate: new Date()
        }).save( async function (err) {
            if (err) {
                console.log("JOBAPPLICATION:: Error occured while saving application: "+err);
                res.status(401).send({error:"Error occured while sending message", status: 300} );
                return;
            }else{
                
                //PostRequestModel.updateOne({_id: req.body.jobId}, {$set: {providerId: req.user._id}} ).exec();
                const notification = new NotificationModel({
                    causedByUserId: req.user._id,
                    causedByItem: req.body.jobId,
                    receiverId: user._id,
                    icon:"fa-tasks",
                    title: "A service provider has applied for your service request.",
                    content: req.user.firstName+" " +req.user.lastName+" has applied for your service request. Check service provider's profile and hire.",
                    translations: {fr: 
                    {   
                        title: "Un prestataire a postulé pour votre demande de service.",
                        content: req.user.firstName+" " +req.user.lastName+" a postulé pour votre demande de service: . Passer en revue le profile du prestataire et decidez!"
                    }},
                    createdAt: new Date(),
                    lastUpdate: new Date()
                }).save(async function (err) {
                    if (err) {console.log("JOBAPPLICATION:: Error occured while creating notification.");}
                    else {
                        if(user.reqUpdateNotifs){
                            const emailTitle = "A service provider has applied for your service request.";
                            const emailContent = req.user.firstName+"  has applied for your service request. Check the service provider's profile and hire.";
                            if(emailSenderObj.sendNotification(emailTitle, emailContent, user.email, user.firstName))
                                console.log("JOBAPPLICATION:: Notification's email sent to user.");
                        }
                } });

                res.status(200).send({message:"JOBAPPLICATION:: Application sent successfully!", status:200} );
                return;
            }
        });
        return;
    }

    async applyWithQuotation(req, res){ 
        const job = await PostRequestModel.findById(req.body.jobId).exec();
        const endUser = await UserModel.findOne({username:job.username}).exec();
        if(endUser && job){
            const newJobApplication = await new JobApplicationModel({
                userId: endUser._id,
                providerId:  req.user._id,
                jobId: req.body.jobId,
                status: "applied",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save( async function (err) {
                if (err) {
                    console.log("JOBAPPLICATION:: Error occured while saving application: "+err);
                    return;
                }else{
                    console.log("JOBAPPLICATION:: Application with quotation has been sent successfully.");
                    // PostRequestModel.updateOne({_id: req.body.jobId}, {$set: {providerId: req.user._id}} ).exec();
                    let budgetAmount = req.body.budget;
                    // if(job.currency != req.body.budgetCurrency){
                    //     const usdBasedRates = await axios.get('https://api.currencyfreaks.com/v2.0/rates/latest?apikey='+process.env.CURRFREAKSAPI);
                
                    //     const reqBudgetInUSD = req.body.budgetCurrency != "USD" ? req.body.budget / usdBasedRates.data.rates[req.body.budgetCurrency] : 
                    //                                                                     req.body.budget;
                    //     budgetAmount = parseFloat(reqBudgetInUSD * usdBasedRates.data.rates[job.currency]).toFixed(2);
                    // }
                    const notification = new NotificationModel({
                        causedByUserId: req.user._id,
                        causedByItem: req.body.jobId,
                        icon:"fa-tasks",
                        receiverId: endUser._id,
                        title: "You have a new quote for your service request.",
                        content: req.user.firstName+" has requested "+budgetAmount+" "+job.currency+" - "+req.body.quotationType +" for the task '"+job.requestTitle+"'. Open to view details.",
                        translations: {fr: {
                            title: "Vous avez un nouveau devis pour votre demande de service.",
                            content: req.user.firstName+" demande "+budgetAmount+" "+job.currency+" - "+(req.body.quotationType == "Per project" ? "Par projet" : "Par heure") +" pour le service '"+job.requestTitle+"'."}
                        },
                        
                        createdAt: new Date(),
                        lastUpdate: new Date()
                    }).save(async function (err) {
                        if (err) {console.log("JOBAPPLICATION:: Error occured while creating notification.");}
                        else {
                            if(endUser.reqUpdateNotifs){
                                const emailTitle = "A service provider submitted a quotation for your service request.";
                                const emailContent =  req.user.firstName+" has submitted a quotation for your service request with a quotation. Check the service provider's profile and hire.\n";
                                if(emailSenderObj.sendNotification(emailTitle, emailContent, endUser.email, endUser.firstName))
                                    console.log("JOBAPPLICATION:: Notification's email sent to user.");
                            }
                        } });
                    return;
                }
            });
        }else{
            console.log("JOBAPPLICATION:: User and job not found.");
            return;
        }
        
        return;
    }

    async cancelApplication(req, res){
        const jobApplication = await JobApplicationModel.findOneAndUpdate({jobId: req.body.jobId}, {status: "cancelled"}).then(success=>{
            res.status(200).send({status: 200, message: "Application cancelled successfully."});
            return;
        }).catch(err=>{
            console.log("JOB APPLICATION:: Error occured while cancelling application");
            res.status(401).send({status: 401, message: "Error occured"});
            return;
        });
       
    }

    async getAppliedJobs(req, res){
        let appliedJobs = [];
        const ja = await JobApplicationModel.find({providerId: req.user._id}).sort({lastUpdate:-1}).exec();
            for(let i = 0; i < ja.length; i++){
                const sr = await PostRequestModel.findById(ja[i].jobId).exec();
                if(sr){
                    sr.createdAt = ja[i].createdAt;
                    sr.appStatus = ja[i].status;
                    appliedJobs.push(sr);
                }
            }
        
        return appliedJobs;
    }
    async getRecentAppliedJobs(req, res)
    {
        let appliedJobs = [];
        const ja = await JobApplicationModel.find({providerId: req.user._id, status:'applied'}).sort({lastUpdate:-1}).limit(6).exec();
            for(let i = 0; i < ja.length; i++){
                const sr = await PostRequestModel.findOne({_id: ja[i].jobId}).exec();
                if(sr){
                    sr.createdAt = ja[i].createdAt;
                    sr.appStatus = ja[i].status;
                    appliedJobs.push(sr);
                }
            }
        let uniqJAs = [];
        let ids = {};
        appliedJobs.forEach(obj => {
            if (!ids[obj._id]) {
                ids[obj._id] = true;
                uniqJAs.push(obj);
            }
        });
        
        return uniqJAs;
    }
    async getApplicants(jobId_){
        const applications = await JobApplicationModel.find({jobId: jobId_}).exec();

        let inPros = [];
        //for(let i = 0; i < applications.length; i++){
            const pro = await UserModel.findById(applications[0].providerId).exec();
            inPros.push(pro);
            const pro1 = await UserModel.findById(applications[1].providerId).exec();
            inPros.push(pro1);
        //}
        console.log(inPros);
        return inPros;
    }

}

module.exports = JobApplication;