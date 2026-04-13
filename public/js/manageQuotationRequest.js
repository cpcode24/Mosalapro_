const sendQuote = async(id, userId, lang)=> {
  
    const quoteBudget_ = document.getElementById("qrBudget").value;
    const quoteType_ = document.getElementById("qrBudgetType").value;
    const quoteBudgetCurrency = document.getElementById("qrBudgetCurrency").value;
    const quoteDetails = document.getElementById("quotationDetails").value;

    const message = document.getElementById("errConfMessage");
    message.innerHTML = "";
  
    if(isNaN(quoteBudget_) || quoteBudget_ < 1){
        if(lang == "en") message.innerHTML = "Enter valid budget.";
        else if(lang == "fr") message.innerHTML = "Entrez un budget valide.";
        return;
        
    }
    
    requestData = {
        _id: id,
        quoteBudget: quoteBudget_,
        quoteBudgetCurrency: quoteBudgetCurrency,
        quoteType: quoteType_,
        quoteDetails: quoteDetails
    }

    _postData('/send-quotation', requestData )
      .then(async json => {
        if(json.status == 200){

            message.classList.add('success_message');
            if(lang == "en") message.innerHTML = "Quotation sent successfully! The client has been notified.";
            else if(lang == "fr") message.innerHTML = "Devis envoyé avec succès ! Le client a été informé.";
            await new Promise(r => setTimeout(r, 2000));
            hideConfModal('#confSendingQuoteModalCta');
            
            // var lnk = location.href.split("/");
            // var baseLnk = lnk[0]+"//"+lnk[2];
            // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            if(lang == "en"){
                var notifTitle = "New quote from provider.";
                var notifContent = "Service provider has provided a quote \nto your quotation request.";
            }
            else if(lang == "fr"){
                var notifTitle = "Nouveau devis du fournisseur.";
                var notifContent = "Le fournisseur de services a fourni un devis \npour votre demande de devis.";
            }
            socket.emit("pushNotification", {
                    "title": notifTitle,
                    "content": notifContent,
                    "userId": userId,
                    "notifType": "user"
                });
            
            $('#whole-qr-contnr').load(location.href+" #whole-qr-contnr");
        }
        else if(json.status == 402){
            message.classList.remove('success_message');
            message.classList.add('error_message');
            if(lang == "en")  message.innerHTML = "An error occured while sending quotation. Please try again. ";
            else if(lang == "fr") message.innerHTML = "Une erreur s'est produite lors de l'envoi du devis. Veuillez réessayer.";
            await new Promise(r => setTimeout(r, 2000));
            hideConfModal('#confSendingQuoteModalCta');
        }
        else{
            message.classList.remove('success_message');
            message.classList.add('error_message');
            if(lang == "en")  message.innerHTML = "An error occured while ending quotation. Please try again. ";
            else if(lang == "fr") message.innerHTML = "Une erreur s'est produite lors de la fin du devis. Veuillez réessayer.";
            await new Promise(r => setTimeout(r, 1800));
            hideConfModal('#confSendingQuoteModalCta');
        }
        
      }).catch( async err => {
        // console.log(err) // Handle errors
        if(lang == "en")  message.innerHTML = "An error occured while sending quotation. Please try again. ";
        else if(lang == "fr") message.innerHTML = "Une erreur s'est produite lors de l'envoi du devis. Veuillez réessayer.";
        await new Promise(r => setTimeout(r, 2000));
        hideConfModal('#confSendingQuoteModalCta');
      });
  }

async function _postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(data)
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    }else{ return response;}
}
 

async function declineQuotationRequest(id, userId, lang){

    const message = document.getElementById("confRejMessage");
    message.innerHTML = "";

    requestData = {
      id: id,
      userId: userId
    }

  _postData('/reject-quotation-request', requestData )
    .then(async json => {
      if(json.status == 200){
          message.classList.remove('error_message');
          message.classList.add('success_message');
          if(lang == "en") message.innerHTML = "Your request has been cancelled successfully. Redirecting...";
          else if(lang == "fr") message.innerHTML = "Votre demande a été annulée avec succès. Redirection...";
          hideConfModal('#confDeclineQuotationRequestModalCta');
          const sendQuoteBtn = document.getElementById("send-quote-btn");
          const declineReqBtn = document.getElementById("decline-req-btn");
          declineReqBtn.style.display = "none";
          sendQuoteBtn.innerHTML = "Declined";
          sendQuoteBtn.classList.remove("btn-primary-job");
          sendQuoteBtn.classList.add("btn-secondary");
          sendQuoteBtn.disabled = true;
          sendQuoteBtn.style.cursor = "none";
          
          //await new Promise(r => setTimeout(r, 1200));
          // var lnk = location.href.split("/");
          // var baseLnk = lnk[0]+"//"+lnk[2];
          // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            if(lang == "en"){
                var notifTitle = "Provider has rejected your quotation request.";
                var notifContent = "Service provider has rejected your service request. \n Submit it as service request with minimum budget\nfor other service providers to apply.";
            }
            else if(lang == "fr"){
                var notifTitle = "Le fournisseur a rejeté votre demande de devis.";
                var notifContent = "Le fournisseur de services a rejeté votre demande de service. \n Soumettez-le en tant que demande de service avec un budget minimum\npour que d'autres fournisseurs de services puissent postuler.";
            }
            socket.emit("pushNotification", {
                    "title": notifTitle,
                    "content": notifContent,
                    "userId": userId,
                    "notifType": "user"
                });
          //window.location = "/quotations";
          //$('#whole-qr-contnr').load(location.href+" #whole-qr-contnr");
      }
      else if(json.status == 402){
          message.classList.remove('success_message');
          message.classList.add('error_message');
          if(lang == "en") message.innerHTML = "An error occured while cancelling your changes. Please try again. Redirecting...";
          else if(lang == "fr") message.innerHTML = "Une erreur s'est produite lors de l'annulation de vos modifications. Veuillez réessayer. Redirection...";
          await new Promise(r => setTimeout(r, 1500));
          $('#whole-qr-contnr').load(location.href+" #whole-qr-contnr");
      }
      else{
        message.classList.remove('success_message');
        message.classList.add('error_message');
        if(lang == "en") message.innerHTML = "An error occured while cancelling your changes. Please try again.";
        else if(lang == "fr") message.innerHTML = "Une erreur s'est produite lors de l'annulation de vos modifications. Veuillez réessayer.";
      }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      if(lang == "en") message.innerHTML = "An error occured while cancelling your changes. Please try again.";
      else if(lang == "fr") message.innerHTML = "Une erreur s'est produite lors de l'annulation de vos modifications. Veuillez réessayer.";
    });

}


function downloadFile(filename){
    //const filename = document.getElementById("").value;
    location.replace('files/'+filename);
}


function showConfModal(id, lang){

    const quoteBudget_ = document.getElementById("qrBudget");
  
    if(isNaN(quoteBudget_.value) || quoteBudget_.value == ''){
        quoteBudget_.className += " invalid";
        return;
    }else quoteBudget_.className = "form-control";
    const mess = document.getElementById('confMessage');
    const budgetType = document.getElementById('qrBudgetType').value == "Per hour" ? (lang == "en" ? "per hour" : "par heure") : (lang == "en" ? "for the whole project" : "pour l'ensemble du projet");

    if(lang == "en")     mess.innerHTML = `Are you sure you want to send the quote with the amount of <b> $${document.getElementById("qrBudget").value} </b> - ${budgetType} ? Once you confirm this, you can no longer edit the quotation request.`;
    else if(lang == "fr") mess.innerHTML = `Êtes-vous sûr de vouloir envoyer le devis avec le montant de <b> $${document.getElementById("qrBudget").value} </b> - ${budgetType} ? Une fois que vous aurez confirmé cela, vous ne pourrez plus modifier la demande de devis.`;
    $(id).modal('show');
}
function showRejModal(id){
  $(id).modal('show');
}

function hideConfModal(id){
  $(id).modal('hide');
}

