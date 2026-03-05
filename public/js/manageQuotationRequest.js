const sendQuote = async(id, userId)=> {
  
    const quoteBudget_ = document.getElementById("qrBudget").value;
    const quoteType_ = document.getElementById("qrBudgetType").value;
    const quoteBudgetCurrency = document.getElementById("qrBudgetCurrency").value;
    const quoteDetails = document.getElementById("quotationDetails").value;

    const message = document.getElementById("errConfMessage");
    message.innerHTML = "";
  
    if(isNaN(quoteBudget_) || quoteBudget_ < 1){
        
        message.innerHTML = "Enter valid budget.";
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
            message.innerHTML = "Quotation sent successfully! The client has been notified.";
            await new Promise(r => setTimeout(r, 2000));
            hideConfModal('#confSendingQuoteModalCta');
            
            // var lnk = location.href.split("/");
            // var baseLnk = lnk[0]+"//"+lnk[2];
            // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            
            socket.emit("pushNotification", {
                    "title": "New quote from provider.",
                    "content": "Service provider has provided a quote \nto your quotation request.",
                    "userId": userId,
                    "notifType": "user"
                });
            
            $('#whole-qr-contnr').load(location.href+" #whole-qr-contnr");
        }
        else if(json.status == 402){
            message.classList.remove('success_message');
            message.classList.add('error_message');
            message.innerHTML = "An error occured while sending quotation. Please try again. ";
            await new Promise(r => setTimeout(r, 2000));
            hideConfModal('#confSendingQuoteModalCta');
        }
        else{
            message.classList.remove('success_message');
            message.classList.add('error_message');
            message.innerHTML = "An error occured while ending quotation. Please try again. ";
            await new Promise(r => setTimeout(r, 1800));
            hideConfModal('#confSendingQuoteModalCta');
        }
        
      }).catch( err => {
        // console.log(err) // Handle errors
        message.innerHTML = "An error occured while ending quotation. Please try again.";
      
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
 

async function declineQuotationRequest(id, userId){

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
          message.innerHTML = "Your request has been cancelled successfully. Redirecting...";
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
            
            socket.emit("pushNotification", {
                    "title": "Provider has rejected your quotation request.",
                    "content": "Service provider has rejected your service request. \n Submit it as service request with minimum budget\nfor other service providers to apply.",
                    "userId": userId,
                    "notifType": "user"
                });
          //window.location = "/quotations";
          //$('#whole-qr-contnr').load(location.href+" #whole-qr-contnr");
      }
      else if(json.status == 402){
          message.classList.remove('success_message');
          message.classList.add('error_message');
          message.innerHTML = "An error occured while cancelling your changes. Please try again. Redirecting...";
          await new Promise(r => setTimeout(r, 1500));
          $('#whole-qr-contnr').load(location.href+" #whole-qr-contnr");
      }
      else{
        message.classList.remove('success_message');
        message.classList.add('error_message');
        message.innerHTML = "An error occured while cancelling your changes. Please try again.";
      }
      
    }).catch(err => {
      // console.log(err) // Handle errors
      message.innerHTML = "An error occured while cancelling your changes. Please try again.";
    });

}


function downloadFile(filename){
    //const filename = document.getElementById("").value;
    location.replace('files/'+filename);
}


function showConfModal(id){

    const quoteBudget_ = document.getElementById("qrBudget");
  
    if(isNaN(quoteBudget_.value) || quoteBudget_.value == ''){
        quoteBudget_.className += " invalid";
        return;
    }else quoteBudget_.className = "form-control";
    const mess = document.getElementById('confMessage');
    mess.innerHTML = `Are you sure you want to send the quote with the amount of <b> $${document.getElementById("qrBudget").value} </b> - ${document.getElementById('qrBudgetType').value} ? Once you confirm this, you can no longer edit the quotation request.`;
    $(id).modal('show');
}
function showRejModal(id){
  $(id).modal('show');
}

function hideConfModal(id){
  $(id).modal('hide');
}

