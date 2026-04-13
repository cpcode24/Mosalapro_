async function countChars(){
  const desc = document.getElementById("submissionComment");
  const charCount = document.getElementById("cbCharCount");
  charCount.innerHTML = desc.value.length+"/2,000";
}

async function countRevChars(){
  const revDesc = document.getElementById("revisionReason");
  const charCount = document.getElementById("revCharCount");
  charCount.innerHTML = revDesc.value.length+"/2,000";
}
const confirmBooking = async(bookingId_, userId)=> {

    const message = document.getElementById("cnf_bk_msg");
    requestData = {
        bookingId: bookingId_
    }

    _postData('/confirm-booking', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "You have confirm the booking! This service is now in progress.";
            await new Promise(r => setTimeout(r, 2500));
            // var lnk = location.href.split("/");
            // var baseLnk = lnk[0]+"//"+lnk[2];
            // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            socket.emit("pushNotification", {
                          "title": "Your booking has been confirmed",
                          "content": "A provider has confirmed your booking. Your request is in progress.\n",
                          "userId": userId,
                          "notifType": "user"
                      });
            hideModal('#confBookingModalCta');
            $('#whole-sect-containr').load(location.href+' #whole-sect-containr');
            //window.location = "/mybookings";
        }
        else{
            message.innerHTML = "Oops. An error occured: "+json.status;
        }

      }).catch(err => {
        // console.log(err) // Handle errors
        message.innerHTML = "Oops. An error occured. Please try again.";
      });
}

const cancelBooking = async(bookingId, userId)=> {
const message = document.getElementById("booking-msg");
  requestData = {
      bookingId: bookingId
  }

  _postData('/cancel-booking', requestData )
    .then(async json => {
      if(json.status == 200){ 
          message.classList.remove('error_message');
          message.classList.add('success_message');
          message.innerHTML = "This booking has been cancelled. The request is available to other providers.";
          await new Promise(r => setTimeout(r, 2100));

          // var lnk = location.href.split("/");
          // var baseLnk = lnk[0]+"//"+lnk[2];
          // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            
            socket.emit("pushNotification", {
                    "title": "Service provider has declined your booking.",
                    "content": "Service provider has declined your booking request for a \n service. The service request is now available \nfor other service providers to apply.",
                    "userId": userId,
                    "notifType": "user"
                });
          hideModal('#cancelBookingConfModalCta');
          $('#whole-sect-containr').load(location.href+' #whole-sect-containr');
      }
      else{
          message.innerHTML = "Oops. An error occured: "+json.status;
      }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      message.innerHTML = "Oops. An error occured. Please try again.";
    });
}

async function sendQuotation(jobId_, userId){
  const message = document.getElementById("err_bm");
  const budget_ = document.getElementById("budget").value;
  const quotationType_ = document.getElementById("budgetType").value;
  const budgetCurrency = document.getElementById("budgetCurrency").value;
  const quotationDesc_ = document.getElementById("quotationDesc").value;

  requestData = {
      jobId: jobId_,
      budget: budget_,
      budgetCurrency: budgetCurrency,
      quotationDesc: quotationDesc_,
      quotationType: quotationType_,
      requestType: "booking"
  }

  if (quotationType_ === "Per hour") {
    const timeOfCompletion = document.getElementById("timeOfCompletion").value;
    requestData.timeOfCompletion = timeOfCompletion;
  }

  _postData('/quotation', requestData )
  .then(async json => {
    if(json.status == 200){
        message.classList.remove('error_message');
        message.classList.add('success_message');
        message.innerHTML = "Quotation sent successfully! Redirecting...";
        await new Promise(r => setTimeout(r, 1500));
        // var lnk = location.href.split("/");
        // var baseLnk = lnk[0]+"//"+lnk[2];
        // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
        socket.emit("pushNotification", { 
                      "title": "New quotation for your service request",
                      "content": "Service provider has submitted a quote for your service request.\n",
                      "userId": userId,
                      "notifType": "user"
                });
        hideModal('#quotationModalCta');
        $('#whole-sect-containr').load(location.href+' #whole-sect-containr');
    }
    else if(json.status == 402){
        message.innerHTML = "An error occured. Please try again.";
        await new Promise(r => setTimeout(r, 2000));
        message.innerHTML = " ";
    }
    else{
      message.classList.add('error_message');
      message.classList.remove('success_message');
        message.innerHTML = "An error occured. Please try again. "+json.status;
    }
    
  }).catch(async err => {
    message.classList.add('error_message');
    message.classList.remove('success_message');
      message.innerHTML = "An error occured. Please try again! ";
      console.log(err) // Handle errors
      await new Promise(r => setTimeout(r, 2000));
      message.innerHTML = " ";
  });
}

async function completeBooking(bookingId_, userId){

  const providerComments_ = document.getElementById("submissionComment").value;
  const file_ = document.getElementById("submission-file").files[0];
  const message = document.getElementById("booking-comp-err");
  // requestData = {
  //     bookingId: bookingId_,
  //     providerComments: providerComments_,
  //     file: file_
  // };

  const body = new FormData();
  body.append("bookingId", bookingId_);
  body.append("providerComments", providerComments_);
  if(file_)
    body.append("file", file_, file_.fileName);

  await fetch('/complete-booking', {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  
    body: body
  }).then(async json => {
    if(json.status == 200){
        message.classList.remove('error_message');
        message.classList.add('success_message');
        message.innerHTML = "Booking successfully completed and submitted! The customer will review it and evaluate your job.";
        await new Promise(r => setTimeout(r, 1500));
        // var lnk = location.href.split("/");
        // var baseLnk = lnk[0]+"//"+lnk[2];
        // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
        //console.log("User id for push booking handler: ", userId);
        socket.emit("pushNotification", { 
                      "title": "Your service request has been completed.",
                      "content": "Service provider has completed your service request.\n",
                      "userId": userId,
                      "notifType": "user"
                });
        hideModal('#confBookingCompleteModalCta');
        $('#whole-sect-containr').load(location.href+' #whole-sect-containr');
    }
    else{
      message.classList.add('error_message');
      message.classList.remove('success_message');
      message.innerHTML = "Oops. An error occured: "+json.status;
      // Handle errors
      hideModal('#confBookingCompleteModalCta');
      $('#whole-sect-containr').load(location.href+' #whole-sect-containr');
    }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      message.innerHTML = "Oops. An error occured. Please try again.";
      hideModal('#confBookingCompleteModalCta');
      $('#whole-sect-containr').load(location.href+' #whole-sect-containr');
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


function onSelectQuoteType(e) {
  const budgetTypeEl = document.getElementById("budgetType");
  const timeOfCompletionField = document.getElementById("timeOfCompletionField");

  if(budgetTypeEl.value === "Per hour") {
    timeOfCompletionField.style.display = "block";
  }  else {
    timeOfCompletionField.style.display = "none";
  }
}

function downloadFile(filename){
  //const filename = document.getElementById("").value;
  //location.replace('uploads/'+filename);
  location.replace('files/'+filename);
}

function showModal(id){
  $(id).modal('show');
}
function hideModal(id){
  $(id).modal('hide');
}