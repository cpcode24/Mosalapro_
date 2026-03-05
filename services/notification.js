/*********************************************************************************************************
*	notification.js : Handles notifications events.
*   Author: Constant Pagoui.
*	Date: 04-14-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const BookingModel = require("../models/booking");
const NotificationModel = require("../models/notification");
const PostRequestModel = require("../models/postRequest");
const PostRequestService = require("../services/postrequest");
const UserModel = require("../models/user");
const CountryModel = require("../models/country");
const EmailSender = require("./emailsender");
const emailSenderObj = new EmailSender();

const TwilioPhoneAuthService = require("../services/twilioPhoneAuth");
const smsSenderObj = new TwilioPhoneAuthService();


class Notification {

    // Helper function to create notification with multi-language support
    createNotificationTranslations(englishTitle, englishContent) {
        return {
            fr: {
                title: this.translateToFrench(englishTitle),
                content: this.translateToFrench(englishContent)
            },
            es: {
                title: this.translateToSpanish(englishTitle),
                content: this.translateToSpanish(englishContent)
            },
            ar: {
                title: this.translateToArabic(englishTitle),
                content: this.translateToArabic(englishContent)
            },
            de: {
                title: this.translateToGerman(englishTitle),
                content: this.translateToGerman(englishContent)
            },
            it: {
                title: this.translateToItalian(englishTitle),
                content: this.translateToItalian(englishContent)
            },
            pt: {
                title: this.translateToPortuguese(englishTitle),
                content: this.translateToPortuguese(englishContent)
            }
        };
    }

    // Translation helper functions (basic implementation - could be improved with a translation service)
    translateToFrench(text) {
        const translations = {
            "A service provider has provided a quotation for your booking.": "Un prestataire vous a envoyé un devis.",
            "has sent you a  quotation for your booking. Check service provider's required budget.": "vous a envoyé un devis pour votre demande de service. Voir le montant demandé.",
            "The deadline for your booking is coming up.": "Le délai d'échéance de votre reservation approche.",
            "You have a new message.": "Vous avez un nouveau message."
        };
        return translations[text] || text;
    }

    translateToSpanish(text) {
        const translations = {
            "A service provider has provided a quotation for your booking.": "Un proveedor de servicios ha proporcionado una cotización para su reserva.",
            "has sent you a  quotation for your booking. Check service provider's required budget.": "le ha enviado una cotización para su reserva. Verifique el presupuesto requerido del proveedor.",
            "The deadline for your booking is coming up.": "Se acerca la fecha límite de su reserva.",
            "You have a new message.": "Tienes un nuevo mensaje."
        };
        return translations[text] || text;
    }

    translateToArabic(text) {
        const translations = {
            "A service provider has provided a quotation for your booking.": "قدم مقدم الخدمة عرض أسعار لحجزك.",
            "has sent you a  quotation for your booking. Check service provider's required budget.": "أرسل لك عرض أسعار لحجزك. تحقق من الميزانية المطلوبة لمقدم الخدمة.",
            "The deadline for your booking is coming up.": "يقترب الموعد النهائي لحجزك.",
            "You have a new message.": "لديك رسالة جديدة."
        };
        return translations[text] || text;
    }

    translateToGerman(text) {
        const translations = {
            "A service provider has provided a quotation for your booking.": "Ein Dienstleister hat ein Angebot für Ihre Buchung bereitgestellt.",
            "has sent you a  quotation for your booking. Check service provider's required budget.": "hat Ihnen ein Angebot für Ihre Buchung gesendet. Überprüfen Sie das erforderliche Budget des Dienstleisters.",
            "The deadline for your booking is coming up.": "Die Frist für Ihre Buchung naht.",
            "You have a new message.": "Sie haben eine neue Nachricht."
        };
        return translations[text] || text;
    }

    translateToItalian(text) {
        const translations = {
            "A service provider has provided a quotation for your booking.": "Un fornitore di servizi ha fornito un preventivo per la tua prenotazione.",
            "has sent you a  quotation for your booking. Check service provider's required budget.": "ti ha inviato un preventivo per la tua prenotazione. Controlla il budget richiesto dal fornitore di servizi.",
            "The deadline for your booking is coming up.": "Si avvicina la scadenza per la tua prenotazione.",
            "You have a new message.": "Hai un nuovo messaggio."
        };
        return translations[text] || text;
    }

    translateToPortuguese(text) {
        const translations = {
            "A service provider has provided a quotation for your booking.": "Um provedor de serviços forneceu uma cotação para sua reserva.",
            "has sent you a  quotation for your booking. Check service provider's required budget.": "enviou uma cotação para sua reserva. Verifique o orçamento necessário do provedor de serviços.",
            "The deadline for your booking is coming up.": "O prazo para sua reserva está se aproximando.",
            "You have a new message.": "Você tem uma nova mensagem."
        };
        return translations[text] || text;
    }

    async notifyBookingQuotation(req, res){

        const job = await BookingModel.findById(req.body.jobId).exec();
        
        if(job){
            const endUser = await UserModel.findOne({username: job.username}).exec();
            const title = "A service provider has provided a quotation for your booking.";
            const content = req.user.firstName+" "+req.user.lastName+" has sent you a  quotation for your booking. Check service provider's required budget.";

            const notification = await new NotificationModel({
                causedByUserId: req.user._id,
                causedByItem: job.jobId,
                receiverId: endUser._id,
                icon:"fa-money",
                title: title,
                content: content,
                translations: this.createNotificationTranslations(title, content),
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(success=> {
                if(endUser.reqUpdateNotifs){
                    const emailTitle = "A service provider has provided a quotation for your booking.";
                    const emailContent = req.user.firstName+" "+req.user.lastName+" has sent you a  quotation for your booking.\n";
                    if(emailSenderObj.sendNotification(emailTitle, emailContent, endUser.email, endUser.firstName))
                    console.log("NOTIFICATION:: Notification's email sent to user.");
                }
                }).catch(err=> {console.log("NOTIFICATION:: Error occured while creating notification.")});

                if(endUser.SMSUpdateNotifs && (endUser.phone.length > 0 || endUser.verifiedContact.length > 0) ){
                    let messageBody = "MosalaPro: A service provider has provided a quotation for your booking.  "+
                                        req.user.firstName+" "+req.user.lastName+" has sent you a  quotation for your booking.";
                    if(res.locals.locale === 'fr'){
                        messageBody = "MosalaPro: Un prestataire vous a envoyé un devis. Le délai de la reservation."+
                                        req.user.firstName+" "+req.user.lastName+" vous a envoyé un devis pour votre demande.";
                    }
                    const phoneNumber = endUser.phone.length > 0 ? endUser.phone : endUser.verifiedContact;
                    const countryCod = await CountryModel.findOne({name: endUser.country}).select('phone_code').exec();
                    const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCod.phone_code, messageBody);
                    if(messageSent.success) console.log("Booking quotation notification SMS sent successfully!");
                    else{console.log("Error occured while sending SMS: "+messageSent.message);}
                }
                else{
                    console.log("User does not want ot receive SMS or phone number not valid: "+endUser.SMSUpdateNotifs+" - "+endUser.phone.length);
                }
            return;
        }
        
    }
    async readNotification(req, res){

        const notif = await NotificationModel.findByIdAndUpdate(req.body._id, {status: "read", lastUpdate: new Date()}).exec();
        if(notif){
            res.status(200).send({message:"Notification read with success.", status: 200});
            return true;
        }
        else {
            res.status(401).send({message:"Notification reading failed.", status: 401});
            return false;
        }
    }
    async deleteNotification(req, res){
        const notif = await NotificationModel.findByIdAndUpdate(req.body._id, {status: "archived", lastUpdate: new Date()}).exec();
        if(notif){
            res.status(200).send({message:"NOTIFICATION:: Notification removed with success.", status: 200});
            return true;
        }
        else {
            res.status(401).send({message:"NOTIFICATION:: Notification removing failed.", status: 401});
            return false;
        }
    }
    async getNotificationList(){

    }

    async sendBookingsDeadlineReminders(req, res){
        const bookingsWithCloseDeadlines = await  PostRequestService.checkBookingsDeadline();
        
        if(bookingsWithCloseDeadlines){
            for(let i = 0; i < bookingsWithCloseDeadlines.length; i++){
                const endUser = await UserModel.findOne({username: bookingsWithCloseDeadlines[i].username}).exec();
                const pro = await UserModel.findById(bookingsWithCloseDeadlines[i].providerId).exec();
                const booking = await BookingModel.findOne({jobId: bookingsWithCloseDeadlines[i]._id}).exec();
                if(booking && pro && endUser){
                    let notifContent = "";
                    if(bookingsWithCloseDeadlines[i].status == "active"){
                        notifContent= "The deadline for the booking request <b>"+bookingsWithCloseDeadlines[i].bookingTitle+"</b> is on <b>"+
                                        bookingsWithCloseDeadlines[i].deadline+"</b>. Please confirm "+endUser.firstName+
                                        "\'s booking to complete it on time."+
                                        "<br><br>"+
                                        "Le délai d'échéance de la reservation <b>"+bookingsWithCloseDeadlines[i].bookingTitle+"</b> is on <b>"+
                                        bookingsWithCloseDeadlines[i].deadline+"</b>. Veuillez confirmer la reservation faite par "+endUser.firstName+
                                        " pour pouvoir completer le service à temps.";
                    }else{

                        notifContent= "The deadline for the booking request <b>"+bookingsWithCloseDeadlines[i].bookingTitle+"</b> is on <b>"+
                                    bookingsWithCloseDeadlines[i].deadline+"</b>. Please complete the job and submit it on time."+
                                    "Le délai d'échéance de la reservation <b>"+bookingsWithCloseDeadlines[i].bookingTitle+"</b> is on <b>"+
                                        bookingsWithCloseDeadlines[i].deadline+"</b>. Veuillez completer la reservation faite par "+endUser.firstName+
                                        " à temps.";
                    }
                    const notification = await new NotificationModel({
                        causedByUserId: endUser._id,
                        causedByItem: bookingsWithCloseDeadlines[i]._id,
                        bookingId: booking._id,
                        receiverId: pro._id,
                        accountType: "pro",
                        title: "The deadline for your booking is coming up.",
                        translations: {fr: {
                        title: "Le délai d'échéance de votre reservation approche.",
                        content: frNotiContent}
                        },
                        content: notifContent,
                        icon: "fa-clock-o",
                        createdAt: new Date(),
                        lastUpdate: new Date()
                    }).save().then(success=> {
                        if(pro.bkgUpdateNotifs){
                            const emailTitle = "The deadline for your booking is coming up / Le délai d'échéance de votre reservation approche.";
                            if(emailSenderObj.sendNotification(emailTitle, notifContent, pro.email, pro.firstName))
                            console.log("NOTIFICATION:: Notification's email sent to user.");
                            }
                        }).catch(err=> {console.log("NOTIFICATION:: Error occured while creating notification.")});

                        if(pro.SMSUpdateNotifs && (pro.phone.length > 0 || pro.verifiedContact.length > 0)){
                            let messageBody = "MosalaPro: The deadline for "+bookingsWithCloseDeadlines[i].bookingTitle+" is on: "+
                                        bookingsWithCloseDeadlines[i].deadline+". Please complete the job and submit it on time.";
                            if(res.locals.locale === 'fr'){
                                messageBody = "MosalaPro: Le délai de la reservation"+bookingsWithCloseDeadlines[i].bookingTitle+" est: "
                                +bookingsWithCloseDeadlines[i].deadline+"Veuillez confirmer la reservation pour pouvoir completer le service à temps.";
                            }
                            const phoneNumber = pro.phone.length > 0 ? pro.phone : pro.verifiedContact;
                            const countryCode = await CountryModel.findOne({name: pro.country}).select('phone_code').exec();
                            const messageSent = await smsSenderObj.sendSMS(phoneNumber, countryCode.phone_code, messageBody);
                            if(messageSent.success) console.log("Deadline reminder SMS successfully sent!");
                            else{console.log("Error occured while sending SMS: "+messageSent.message);}
                        }
                }
                
            }
        }
        else{
            console.log("NOTIFICATION:: No booking with close deadlines were returned.")
        }
    }

    

}

module.exports = Notification;