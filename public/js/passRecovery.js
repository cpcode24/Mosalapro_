
document.getElementById("recover_email").addEventListener("keyup", logEnterKey);

function logEnterKey(e) {
  if(e.code == 'Enter'){
    onPassRecoverSubmit();
  }
}

// Validate phone number (basic validation for international formats)
function validatePhone(phone) {
  // Remove all whitespace and special characters except + and digits
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Check if it's a valid phone format (starts with + or digit, has 7-15 digits)
  const phoneRegex = /^[\+]?[0-9]{7,15}$/;
  return phoneRegex.test(cleanedPhone);
}

const onPassRecoverSubmit = async(lang_recover)=> {
    const emailOrPhone = document.getElementById("recover_email").value.trim();
    const message = document.getElementById("recov_message");
    console.log("Language:: ",lang_recover);
    message.innerHTML = "";

    // Detect if input is email or phone number
    const isEmail = validateEmail(emailOrPhone);
    const isPhone = validatePhone(emailOrPhone);

    if(!isEmail && !isPhone){
      message.classList.add('error_message');
      if(lang_recover == 'fr'){
        message.innerHTML = "Veuillez entrer une adresse e-mail ou un numéro de téléphone valide";
      }else{
        message.innerHTML = "Please enter a valid email address or phone number";
      }
      return;
    }

    requestData = {
        emailOrPhone: emailOrPhone.toLowerCase(),
        isEmail: isEmail,
        isPhone: isPhone
    }

    _postData('/recover-pass', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            if(lang_recover == 'fr'){
              message.innerHTML = "Compte trouvé ! Redirection..";
            }else{
              message.innerHTML = "Account found! Redirecting..";
            }
            await new Promise(r => setTimeout(r, 500));
            window.location = "/recover-pass/"+json.userId+(isEmail ? "/email" : "/phone");
        }
        else{
            message.classList.remove('success_message');
            message.classList.add('error_message');
            if(lang_recover == 'fr'){
              message.innerHTML = "Compte introuvable ! Assurez-vous d'entrer l'adresse e-mail ou le numéro de téléphone associé à votre compte.";
            }else{
              message.innerHTML = "Account not found! Make sure you enter the email address or phone number associated with your account.";
            }
        }

      }).catch(err => {
        console.log(err) // Handle errors
        message.classList.remove('success_message');
        message.classList.add('error_message');
        if(lang_recover == 'fr'){
          message.innerHTML = "Une erreur s'est produite lors de la recherche de votre compte. Veuillez réessayer.";
        }else{
          message.innerHTML = "An error occured while trying to find your account. Please try again.";
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