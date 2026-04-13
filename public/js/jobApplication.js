
function applyForJob(userId, lang){

    const jobId = document.getElementById("jobId").value;
    const creatorUsername = document.getElementById("userName").value;
    const mess = document.getElementById("mess");
    const timeOfCompletion = document.getElementById("timeOfCompletion");
    mess.innerHTML="";

    requestData = {
        username: creatorUsername,
        jobId: jobId,
        timeOfCompletion: timeOfCompletion.value,
    }
    
    
    _postData('/apply-for-sr', requestData )
      .then(async json => {
        if(json.status == 200){
            mess.classList.remove('error_message');
            mess.classList.add('success_message');
            mess.innerHTML = lang === 'en' ? "Your application has been sent successfully!" : "Votre candidature a été envoyée avec succès!";
            await new Promise(r => setTimeout(r, 1500));
            

            // var lnk = location.href.split("/");
            // var baseLnk = lnk[0]+"//"+lnk[2];
            // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            // console.log("User Id for push: ", userId);
            await socket.emit("pushNotification", {
                    "title": (lang === 'en' ? "New application for your service request." : "Nouvelle candidature pour votre demande de service."),
                    "content": (lang === 'en' ? "A service provider has applied for your service request." : "Un prestataire de services a postulé pour votre demande de service."),
                    "userId": userId,
                    "notifType": "user"
                });
            mess.innerHTML = "";
            const applyBtn = document.getElementById("apply-btn");
            const quoteBtn = document.getElementById("quote-btn");
            const prevBtn = document.getElementById("prev-btn");
            quoteBtn.style.display = "none";
            prevBtn.style.display = "none";
            applyBtn.innerHTML = lang === 'en' ? "Applied" : "Demande envoyée";
            applyBtn.disabled = true;
            applyBtn.classList.remove("btn-primary-job");
            applyBtn.classList.add("btn-secondary");
            applyBtn.style.cursor = "none";
            // window.location = "/service-requests";
        }
        else{
            mess.innerHTML = "Error json status: "+json.status;
        }
        
      }).catch(err => {
        // console.log(err) // Handle errors
        mess.innerHTML = "Error: "+err;
      });

}

async function sendQuotation(jobId_, userId){
  const message = document.getElementById("err_m");
  const budget_ = document.getElementById("budget").value;
  const quotationType_ = document.getElementById("budgetType").value;
  const budgetCurrency = document.getElementById("budgetCurrency").value;
  const quotationDesc_ = document.getElementById("quotationDesc").value;


  requestData = {
      jobId: jobId_,
      budget: budget_,
      quotationDesc: quotationDesc_,
      quotationType: quotationType_,
      budgetCurrency: budgetCurrency,
      requestType: "application"
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
       
        // var lnk = location.href.split("/");
        // var baseLnk = lnk[0]+"//"+lnk[2];
        // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
        // console.log("User id for push: ", userId);
        await socket.emit("pushNotification", { 
              "title": "New quotation for your service request",
              "content": "Service provider has submitted a quote for your service request.\n",
              "userId": userId,
              "notifType": "user"
        });
        //message.innerHTML = "";
        await new Promise(r => setTimeout(r, 1500));
        window.location = "/service-requests";
    }
    else if(json.status == 402){
        message.innerHTML = "An error occured. Please try again.";
        await new Promise(r => setTimeout(r, 2000));
        message.innerHTML = " ";
    }
    else{
        message.innerHTML = "An error occured. Please try again. "+json.status;
    }
    
  }).catch(async err => {
    
      message.innerHTML = "An error occured. Please try again! ";
      // console.log(err) // Handle errors
      await new Promise(r => setTimeout(r, 2000));
      message.innerHTML = " ";
  });
}


function downloadFile(filename){
  //const filename = document.getElementById("").value;
  location.replace('files/'+filename);
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

async function cancelApplication(jobId_){

    const mess = document.getElementById("mess");
    mess.innerHTML="";
    requestData = {
        jobId: jobId_
    }
    
    _postData('/cancel-application', requestData )
      .then(async json => {
        if(json.status == 200){
            mess.classList.remove('error_message');
            mess.classList.add('success_message');
            mess.innerHTML = "You successfully cancelled your application for this service request.";
            await new Promise(r => setTimeout(r, 1200));
            //window.location = "/service-requests"
        }
        else{
            mess.innerHTML = "Error json status: "+json.status;
        }
        
      }).catch(err => {
        // console.log(err) // Handle errors
        mess.innerHTML = "Error: "+err;
      });
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