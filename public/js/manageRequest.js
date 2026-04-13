const onRequestSubmit = async(id, budget)=> {
  
    const requestTitle_ = document.getElementById("requestTitle").value;
    const requestDesc_ = document.getElementById("requestDesc").value;
    const requestCat_ = document.getElementById("requestCat").value;
    const requestBudget_ = document.getElementById("requestBudget").value;
    const requestBudgetCurrency = document.getElementById("requestBudgetCurrency").value;
    const requestBudgetType_ = document.getElementById("budgetType").value;
    const requestDeadline_ = document.getElementById("datepicker").value;
    const file = document.querySelector("#file-input").files.item(0);
    const requestLang = document.getElementById("reqlang").getAttribute("value");

    const message = document.getElementById("reqMessage");

    message.innerHTML = "";
    
    if(requestTitle_ == "" || requestTitle_.length < 3){
      message.classList.add('error_message');
      message.innerHTML = "Enter a valid title."; 
      return;
    }
    if(requestDesc_.length < 20){
        message.classList.add('error_message');
        if(requestLang === "fr"){
          message.innerHTML = "Entrez au moins 20 caractères pour la description.";
        } else{
          message.innerHTML = "Enter at least 20 characters for the description.";
        }
        return;
    }
    if(requestBudget_.length > 0 && (isNaN( (requestBudget_) || requestBudget_ < 10 )) && (requestBudget_ != budget) ){
        message.classList.add('error_message');
        if(requestLang === "fr"){
          message.innerHTML = "Entrez un budget valide.";
        } else{
          message.innerHTML = "Enter valid budget.";
        }
        return;
        
    }
    
    requestData = {
        _id: id,
        requestTitle: requestTitle_,
        requestDescription: requestDesc_,
        requestCategory: requestCat_,
        budget: (requestBudget_ == "" || isNaN(requestBudget_)) ? budget : requestBudget_,
        budgetType: requestBudgetType_,
        currency: requestBudgetCurrency,
        deadline: requestDeadline_,
        file: file,
    }

    _postData('/update-sr', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            if(requestLang === "fr"){
              message.innerHTML = "Les modifications ont été enregistrées avec succès.";
            } else{
              message.innerHTML = "Changes have been saved successfully.";
            } 
            showSuccessPopup();
            // await new Promise(r => setTimeout(r, 1500));
            // window.location = "/myrequests";
        }
        else if(json.status == 402){
            if (requestLang === "fr"){
              message.innerHTML = "Une erreur s'est produite lors de l'enregistrement de vos modifications. Veuillez réessayer. Redirection...";
            } else{     
              message.innerHTML = "An error occured while saving your changes. Please try again. Redirecting...";
            }
            await new Promise(r => setTimeout(r, 1500));
            window.location = "/myrequests";
        }
        else{
            if(requestLang === "fr"){
              message.innerHTML = "Une erreur s'est produite lors de l'enregistrement de vos modifications. Veuillez réessayer. ";
            } else{ 
              message.innerHTML = "An error occured while saving your changes. Please try again. ";
            }
        }
        
      }).catch(err => {
        // console.log(err) // Handle errors
        if(requestLang === "fr"){
          message.innerHTML = "Une erreur s'est produite lors de l'enregistrement de vos modifications. Veuillez réessayer.";
        } else{
          message.innerHTML = "An error occured while saving your changes. Please try again.";
        }
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

function reset(id){
  $( "#request" ).load( `/manage-request?rq=${id} #request` );
}

async function resubmit(requestId){
    const requestLang = getRequestLang();
    const message = document.getElementById("reqMessage");
    const budget = document.getElementById("requestBudget").value;
    const budgetType = document.getElementById("budgetType").value;
    const budgetCurrency = document.getElementById("budgetCurrency").value;
    const requestDesc = document.getElementById("requestDesc").value;
    const requestTitle = document.getElementById("requestTitle").value;
    const requestCat = document.getElementById("requestCat").value;
    const deadline = document.getElementById("datepicker").value
    message.innerHTML = "";
    requestData = {
      jobId: requestId,
      budget: budget,
      budgetType: budgetType,
      currency: budgetCurrency,
      requestDesc: requestDesc,
      requestTitle: requestTitle,
      requestCat: requestCat,
      deadline: deadline
    }

  _postData('/resubmit-request', requestData )
    .then(async json => {
      if(json.status == 200){
          message.classList.remove('error_message');
          message.classList.add('success_message');
          if(requestLang === "fr"){
            message.innerHTML = "Votre demande a été renvoyée avec succès. Redirection...";
          } else{
            message.innerHTML = "Your request has been resubmitted successfully. Redirecting...";
          }
          await new Promise(r => setTimeout(r, 700));
          window.location = "/myrequests";
      }
      else if(json.status == 402){
          if(requestLang === "fr"){
            message.innerHTML = "Une erreur s'est produite lors du renvoi de vos modifications. Veuillez réessayer. Redirection...";
          } else{
            message.innerHTML = "An error occured while resubmitting your changes. Please try again. Redirecting...";
          }
          await new Promise(r => setTimeout(r, 1500));
          window.location = "/myrequests";
      }
      else{
        if(requestLang === "fr"){
          message.innerHTML = "Une erreur s'est produite lors du renvoi de vos modifications. Veuillez réessayer.";
        } else{
          message.innerHTML = "An error occured while resubmitting your changes. Please try again.";
        }
      }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      if(requestLang === "fr"){
        message.innerHTML = "Une erreur s'est produite lors du renvoi de vos modifications. Veuillez réessayer.";
      } else{ 
        message.innerHTML = "An error occured while resubmitting your changes. Please try again.";
      }
    });
}

async function cancelRequest(requestId){

    const requestLang = getRequestLang();
    const message = document.getElementById("reqMessage");
    message.innerHTML = "";

    requestData = {
      jobId: requestId
    }

  _postData('/cancel-request', requestData )
    .then(async json => {
      if(json.status == 200){
          message.classList.remove('error_message');
          message.classList.add('success_message');
          if(requestLang === 'fr'){
            message.innerHTML = "Votre demande a été annulée avec succès. Redirection...";
          } else{
            message.innerHTML = "Your request has been cancelled successfully. Redirecting...";
          }
          await new Promise(r => setTimeout(r, 700));
          window.location = "/myrequests";
      }
      else if(json.status == 402){
          if(requestLang === 'fr'){
            message.innerHTML = "Une erreur s'est produite lors de l'annulation de votre demande. Veuillez réessayer. Redirection...";
          } else{
            message.innerHTML = "An error occured while cancelling your changes. Please try again. Redirecting...";
          }
          await new Promise(r => setTimeout(r, 1500));
          window.location = "/myrequests";
      }
      else{
          if(requestLang === 'fr'){
            message.innerHTML = "Une erreur s'est produite lors de l'annulation de votre demande. Veuillez réessayer.";
          } else{
            message.innerHTML = "An error occured while cancelling your changes. Please try again.";
          }
      }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      if(requestLang === 'fr'){
        message.innerHTML = "Une erreur s'est produite lors de l'annulation de votre demande. Veuillez réessayer.";
      } else{
        message.innerHTML = "An error occured while cancelling your changes. Please try again.";
      }
    });

}

async function cancelBooking(bookingId, proId){
  const requestLang = getRequestLang();
  const message = document.getElementById("reqMessage");
    requestData = {
        bookingId: bookingId
    }
  
    _postData('/cancel-booking', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            if(requestLang === 'fr'){
              message.innerHTML = "Cette réservation a été annulée avec succès.";
            } else{
              message.innerHTML = "This booking has been successfully cancelled.";
            }
            await new Promise(r => setTimeout(r, 1100));
            socket.emit("pushNotification", {
                    "title": "Client has cancelled your booking.",
                    "content": "Client has cancelled your booking. You can no longer access the request.",
                    "userId": proId,
                    "notifType": "pro"
                });
            hideModal('#cancelUserBookingConfModalCta')
            $('#whole-sr-contnr').load(location.href+" #whole-sr-contnr");
        }
        else{
            if(requestLang === 'fr'){
              message.innerHTML = "Une erreur s'est produite. Veuillez réessayer. ("+json.status+")";
            } else{
              message.innerHTML = "Oops. An error occured: "+json.status;
            }
        }
        
      }).catch(err => {
        // console.log(err) // Handle errors
        if(requestLang === 'fr'){
          message.innerHTML = "Une erreur s'est produite. Veuillez réessayer.";
        } else{
          message.innerHTML = "Oops. An error occured. Please try again.";
        }
      });
  }


  async function requestRevision(id, proId) {
    const requestLang = getRequestLang();
    const revisionReason = document.getElementById("revisionReason").value;
    const message = document.getElementById("message");
    message.innerHTML = "";
    const requestBody = {
      revisionReason,
      requestId: id,
    };
    
    _postData('/request-delivery-revision', requestBody ) 
    .then(async json => {
      if(json.status == 200){
        message.classList.remove('error_message');
        message.classList.add('success_message');
        if(requestLang === 'fr'){
          message.innerHTML = "Votre demande de révision a été renvoyée avec succès. Redirection...";
        } else{
          message.innerHTML = "Your revision request has been resubmitted successfully. Redirecting...";
        }
        await new Promise(r => setTimeout(r, 700));
        socket.emit("pushNotification", {
                    "title": "A client has requested a revision of your delivery.",
                    "content": "A client has declined your delivery and requested a revision.",
                    "userId": proId,
                    "notifType": "pro"
                });
        hideModal('#requestRevisionModalCta')
        $('#whole-sr-contnr').load(location.href+" #whole-sr-contnr");
        //window.location = "/manage-request?rq=" + id;
      }
      else if(json.status == 402){
        message.classList.remove('success_message');
        message.classList.add('error_message');
        if(requestLang === 'fr'){
          message.innerHTML = "Une erreur s'est produite lors du renvoi de vos modifications. Veuillez réessayer. Redirection...";
        } else{
          message.innerHTML = "An error occured while resubmitting your changes. Please try again. Redirecting...";
        }
        await new Promise(r => setTimeout(r, 1500));
        window.location = "/manage-request?rq" + id;
      }
      else{
        message.classList.add('error_message');
        if(requestLang === 'fr'){
          message.innerHTML = "Une erreur s'est produite lors du renvoi de vos modifications. Veuillez réessayer.";
        } else{
          message.innerHTML = "An error occured while resubmitting your changes. Please try again.";
        }
      }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      if(requestLang === 'fr'){
        message.innerHTML = "Une erreur s'est produite lors du renvoi de vos modifications. Veuillez réessayer.";
      } else{
        message.innerHTML = "An error occured while resubmitting your changes. Please try again.";
      }
    });
  }

  function downloadFile(filename){
    //const filename = document.getElementById("").value;
    location.replace('files/'+filename);
  }

async function acceptNewDeadline(providerId) {
  let params = new URLSearchParams(document.location.search);
  let rq = params.get("rq");
  const drBox = document.getElementById('dr-card');
  const requestLang = getRequestLang();

  const body = {
    requestId: rq
  };

  _postData('/request/accept-new-deadline', body)
  .then(async json => {
    if(json.status == 200){
      if(requestLang === 'fr'){
        drBox.innerHTML = "<p class='success_message'>La demande de nouveau délai a été acceptée avec succès...</p>";
      } else{
        drBox.innerHTML = "<p class='success_message'>New deadline request has been accepted successfully...</p>";
      }
      await new Promise(r => setTimeout(r, 1500));
      socket.emit("pushNotification", { 
                      "title": "Your deadline request has been accepted",
                      "content": "Client has accepted your deadline request.\n",
                      "userId": providerId,
                      "notifType": "pro"
                  });
      $('#wsection').load(location.href+' #wsection');

    }
    else if(json.status == 402){
      if(requestLang === 'fr'){
        drBox.innerHTML = "<p class='error_message'>Une erreur est survenue, veuillez réessayer...</p>";
      } else{
        drBox.innerHTML = "<p class='error_message'>An error has occured, please try again...</p>";
      }
      await new Promise(r => setTimeout(r, 1500));
      $('#wsection').load(location.href+' #wsection');
    }
    else{
      if(requestLang === 'fr'){
        drBox.innerHTML = "<p class='error_message'>Une erreur est survenue, veuillez réessayer...</p>";
      } else{
        drBox.innerHTML = "<p class='error_message'>An error has occured, please try again...</p>";
      }
      await new Promise(r => setTimeout(r, 1500));
      $('#wsection').load(location.href+' #wsection');
    }
  })
}

async function rejectNewDeadline(providerId) {
  let params = new URLSearchParams(document.location.search);
  let rq = params.get("rq");
  const drBox = document.getElementById('dr-card');
  const requestLang = getRequestLang();

  const body = {
    requestId: rq
  };

  _postData('/request/reject-new-deadline', body)
  .then(async json => {
    if(json.status == 200){
      if(requestLang === 'fr'){
        drBox.innerHTML = "<p class='success_message'>La demande de nouveau délai a été refusée...</p>";
      } else{
        drBox.innerHTML = "<p class='success_message'>New deadline request has been denied...</p>";
      }
      await new Promise(r => setTimeout(r, 2500));
      socket.emit("pushNotification", { 
                    "title": "Your deadline request was rejected",
                    "content": "Client has rejected your deadline request.\n",
                    "userId": providerId,
                    "notifType": "pro"
                });

      $('#wsection').load(location.href+' #wsection');
              
    }
    else if(json.status == 402){
      if(requestLang === 'fr'){
        drBox.innerHTML = "<p class='error_message'>Une erreur est survenue, veuillez réessayer...</p>";
      } else{
        drBox.innerHTML = "<p class='error_message'>An error has occured, please try again...</p>";
      }
      await new Promise(r => setTimeout(r, 1500));
      $('#wsection').load(location.href+' #wsection');
    }
    else{
      if(requestLang === 'fr'){
        drBox.innerHTML = "<p class='error_message'>Une erreur est survenue, veuillez réessayer...</p>";
      } else{
        drBox.innerHTML = "<p class='error_message'>An error has occured, please try again...</p>";
      }
      await new Promise(r => setTimeout(r, 1500));
      $('#wsection').load(location.href+' #wsection');
    }
  })
}

async function acceptQuotation(quotationId, requestId, proId) {
  const qrBox = document.getElementById('qr-card');
  const requestLang = getRequestLang();
  const body = {
    quotationId: quotationId,
    requestId: requestId
  };

  _postData('/request/accept-quotation', body)
  .then(async json => {
    if(json.status == 200){
      if(requestLang === 'fr'){
        qrBox.innerHTML = "<p class='success_message'>La demande de devis a été acceptée avec succès...</p>";
      } else{
        qrBox.innerHTML = "<p class='success_message'>Quotation request has been accepted successfully...</p>";
      }
      await new Promise(r => setTimeout(r, 1500));
      socket.emit("pushNotification", { 
                          "title": "Your quotation has been accepted",
                          "content": "Client has accepted your quotation. The service request is in progress.\n",
                          "userId": proId,
                          "notifType": "pro"
                      });
      $('#wsection').load(location.href+' #wsection');

    }
    else if(json.status == 402){
      if(requestLang === 'fr'){
        qrBox.innerHTML = "<p class='error_message'>Une erreur est survenue. Veuillez réessayer...</p>";
      } else{
        qrBox.innerHTML = "<p class='error_message'>An error occured. Please try again...</p>";
      }
      await new Promise(r => setTimeout(r, 2000));
      $('#wsection').load(location.href+' #wsection');
    }
    else{
      if(requestLang === 'fr'){
        qrBox.classList.add('error_message');
        qrBox.innerHTML = "Une erreur est survenue. Veuillez réessayer.";
      } else{
        qrBox.classList.add('error_message');
        qrBox.innerHTML = "An error occured. Please try again.";
      }
    }
  })
}

async function rejectQuotation(quotationId, requestId, proId) {
  const qrBox = document.getElementById('qr-card');
  const requestLang = getRequestLang();
  const body = {
    quotationId: quotationId,
    requestId: requestId
  };

  _postData('/request/reject-quotation', body)
  .then(async json => {
    if(json.status == 200){
      if(requestLang === 'fr'){
        qrBox.innerHTML = "<p class='success_message'>La demande de devis a été rejetée...</p>";
      } else{
        qrBox.innerHTML = "<p class='success_message'>Quotation request has been rejected...</p>";
      }
      await new Promise(r => setTimeout(r, 2500));
      var lnk = location.href.split("/");
      var baseLnk = lnk[0]+"//"+lnk[2];
      var socket = io(baseLnk, { transports: ['websocket'] });
      
      socket.emit("pushNotification", {
                    "title": "Your quote was rejected.",
                    "content": "Client has rejected your quote. You can resubmit another quote.",
                    "userId": proId,
                    "notifType": "pro"
      });
      $('#wsection').load(location.href+' #wsection');

    }
    else if(json.status == 402){
      if(requestLang === 'fr'){
        qrBox.innerHTML = "<p class='error_message'>Une erreur est survenue. Veuillez réessayer...</p>";
      } else{
        qrBox.innerHTML = "<p class='error_message'>An error occured. Please try again...</p>";
      }
      await new Promise(r => setTimeout(r, 2000));
      $('#wsection').load(location.href+' #wsection');
    }
    else{
      if(requestLang === 'fr'){
        qrBox.classList.add('error_message');
        qrBox.innerHTML = "Une erreur est survenue. Veuillez réessayer.";
      } else{
        qrBox.classList.add('error_message');
        qrBox.innerHTML = "An error occured. Please try again.";
      }
    }
  })
}

async function acceptDelivery(id, proId){
  const requestLang = getRequestLang();
  const message = document.getElementById("acc_message");
  message.innerHTML = "";
  ;
  const requestBody = {
    requestId: id,
  };
  _postData('/accept-delivery', requestBody)
  .then(async json => {
    if(json.status == 200){
      message.classList.remove('d-none');
      message.classList.add('success_message');
      if(requestLang === 'fr'){
        message.innerHTML = "La demande de livraison a été acceptée comme finale...";
      } else{
        message.innerHTML = "Delivery request has been accepted as final...";
      }
      await new Promise(r => setTimeout(r, 2500));
      hideAcceptModal();
      socket.emit("pushNotification", {
                    "title": "Your delivery has been accepted!",
                    "content": "Congrats! Client has accepted your delivery.",
                    "userId": proId,
                    "notifType": "pro"
      });

      await new Promise(r => setTimeout(r, 2500));

      window.location = `/feedback/${id}`;

    }
    else if(json.status == 402){
      message.classList.remove('d-none');
      message.classList.remove('success_message');
      message.classList.add('error_message');
      if(requestLang === 'fr'){
        message.innerHTML = "Une erreur est survenue, veuillez réessayer.";
      } else{
        message.innerHTML = "Error occured, please try again.";
      }
      await new Promise(r => setTimeout(r, 2500));
      hideAcceptModal();
    }
    else{
      message.classList.add('error_message');
      if(requestLang === 'fr'){
        message.innerHTML = "Une erreur est survenue. Veuillez réessayer.";
      } else{
        message.innerHTML = "An error occured while. Please try again.";
      }
      await new Promise(r => setTimeout(r, 2500));
      hideAcceptModal();
    }
  });
}

function showAcceptModal(){
  $('#acceptDeliveryModalCta').modal('show');
}

function hideAcceptModal(){
  $('#acceptDeliveryModalCta').modal('hide');
}
function showModal(id){
  $(id).modal('show');
}
function hideModal(id){
  $(id).modal('hide');
}

async function countRevChars(){
  const revDesc = document.getElementById("revisionReason");
  const charCount = document.getElementById("revCharCount");
  charCount.innerHTML = revDesc.value.length+"/2,000";
}

const getRequestLang = () => {
  const el = document.getElementById('reqlang');
  return (el && el.getAttribute('value')) ? el.getAttribute('value') : 'en';
};

const successPopup = document.getElementById('successPopup');
const closePopupBtn = document.getElementById('closePopup');

// Function to show the pop-up
function showSuccessPopup() {
  successPopup.style.display = 'flex'; // Make it visible
}

// Function to hide the pop-up
function hideSuccessPopup() {
  successPopup.style.display = 'none'; // Hide it
}

// Event listeners
closePopupBtn.addEventListener('click', hideSuccessPopup);

// Optional: Hide pop-up when clicking outside the content
successPopup.addEventListener('click', (event) => {
  if (event.target === successPopup) {
    hideSuccessPopup();
  }
});