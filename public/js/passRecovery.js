document.getElementById("recover_email").addEventListener("keyup", logEnterKey);

function logEnterKey(e) {
  if(e.code == 'Enter'){
    onPassRecoverSubmit();
  }
}

const onPassRecoverSubmit = async()=> {
  
    const email_ = document.getElementById("recover_email").value;
    const message = document.getElementById("recov_message");
    message.innerHTML = "";
    if(!validateEmail(email_)){
      message.classList.add('error_message');
      message.innerHTML = "Please enter a valid email address";
      return;
    }
    requestData = {
        email: email_.trim().toLowerCase()
    }

    _postData('/recover-pass', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "Account found! Redirecting..";
            await new Promise(r => setTimeout(r, 500));
            window.location = "/recover-pass/"+json.userId;
        }
        else{
            message.classList.remove('success_message');
            message.classList.add('error_message');
            message.innerHTML = "Account not found! Make sure you enter the email address associated with your account.";
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
        message.classList.remove('success_message');
        message.classList.add('error_message');
        message.innerHTML = "An error occured while trying to find your account. Please try again.";
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