// Modal validation and processing - country/city selection now handled in registerModal.ejs
$(document).ready(function() {
    $('#regModalCta').on('hidden', function() {
      $(':input', this).val('');
    });
});

const lang_reg_u = document.getElementById("lang_r").getAttribute("value");

// reCAPTCHA callback function - defined here to be available globally
function enableUserRegBtn(){
    
    document.getElementById("register-u").disabled = false;
}

 const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
}

function validateAndRegisterU(){
  const pass = document.getElementById("registerPassword");
  const passConf = document.getElementById("registerConfPassword");
  const regMessage = document.getElementById("rMessage");
  const firstName = document.getElementById("registerFirstName");
  const lastName = document.getElementById("registerLastName");
  const emailOrPhone = document.getElementById("registerEmailOrPhone");
  const city = document.getElementById("city");
  const country = document.getElementById("country");
  const termsAndConds = document.getElementById('regUCheck');

  regMessage.innerHTML = "";

  if(firstName.value.length < 2){
    firstName.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Veuillez entrer votre prénom.";
    }else{
      regMessage.innerHTML = "Please enter your firstname.";
    }
    return;
  }

  if(lastName.value.length < 2){
    lastName.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Veuillez entrer votre nom de famille.";
    }else{
      regMessage.innerHTML = "Please enter your lastname.";
    }
    return;
  }

  const emailOrPhoneValue1 = emailOrPhone.value.trim();
  const isEmail1 = isValidEmail(emailOrPhoneValue1);
  const isPhone1 = isValidPhone(emailOrPhoneValue1);
  
  if(!isEmail1 && !isPhone1){
    emailOrPhone.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Veuillez entrer une adresse e-mail ou un numéro de téléphone valide.";
    }else{
      regMessage.innerHTML = "Please enter a valid email address or phone number.";
    }
    return;
  }

  // Get the actual value from autocomplete input
  const countryValue = country.getAttribute('data-value') || country.value;
  const cityValue = city.getAttribute('data-value') || city.value;

  if(countryValue.length < 2){
    country.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Veuillez sélectionner le pays.";
    }else{
      regMessage.innerHTML = "Please select country.";
    }
    return;
  }
 
  if(cityValue.length < 2){
    city.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Veuillez sélectionner la ville.";
    }else{
      regMessage.innerHTML = "Please select city.";
    }
    return;
  }

  if (pass.value != passConf.value) {
    //alert("Passwords Do not match");
    pass.classList.add("invalid");
    passConf.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Les mots de passe ne correspondent pas !";
    }else{
      regMessage.innerHTML = "Passwords do not match!";
    }
    return;
  }
  if(pass.value.length < 6){
    pass.classList.add("invalid");
    passConf.classList.add("invalid");
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Le mot de passe est trop court, choisissez un mot de passe plus long.";
    }else{
      regMessage.innerHTML = "Password is too short, enter a longer password.";
    }
    return;
  }
  else{
    const specialChars = "!@#$%^&*()-_=+[{]}\\|;:'\",<.>/?`~";
    let letterBoolean = pass.value.match(/[a-z]/i);
    let numBoolean = false;
    for (let i = 0; i < pass.value.length; i++) {
        if(!isNaN(pass.value[i]))
          numBoolean = true;
    }

    let specialCharBoolean = false;
        for (let i = 0; i < pass.value.length; i++) {
          for (let j = 0; j < specialChars.length; j++) {
            if (pass.value[i] == specialChars[j]) {
              specialCharBoolean = true;
            }
          }
      }
    if(!letterBoolean){
      pass.classList.add("invalid");
      passConf.classList.add("invalid");
      if(lang_reg_u == 'fr'){
        regMessage.innerHTML = "Incluez au moins une lettre dans le mot de passe.";
      }else{
        regMessage.innerHTML = "Include at least a letter in password.";
      }
      return;
    }
    if(!numBoolean){
      pass.classList.add("invalid");
      passConf.classList.add("invalid");
      if(lang_reg_u == 'fr'){
        regMessage.innerHTML = "Incluez au moins un chiffre dans votre mot de passe.";
      }else{
        regMessage.innerHTML = "Include at least a number in your password.";
      }
      return;
    }
    if(!specialCharBoolean){
      pass.classList.add("invalid");
      passConf.classList.add("invalid");
      if(lang_reg_u == 'fr'){
        regMessage.innerHTML = "Incluez au moins un caractère spécial dans votre mot de passe.";
      }else{
        regMessage.innerHTML = "Include at least a special char in your password";
      }
      return;
    }
  }

  if (!termsAndConds.checked){
    if(lang_reg_u == 'fr'){
      regMessage.innerHTML = "Veuillez accepter les termes et conditions";
    }else{
      regMessage.innerHTML = "Please agree to the terms and conditions";
    }
    return;
  }
  
  // Prepare request data based on whether it's email or phone registration
  const emailOrPhoneValue2 = emailOrPhone.value.trim();
  const isEmail2 = isValidEmail(emailOrPhoneValue2);
  
  if (isEmail2) {
    // Email registration - continue as usual
    requestData = {
      firstName: document.getElementById("registerFirstName").value,
      lastName: document.getElementById("registerLastName").value,
      email: emailOrPhoneValue2,
      phone: "", // Empty phone for email registration
      address: document.getElementById("registerAddress").value,
      username: emailOrPhoneValue2,
      userType: document.getElementById("userType").value,
      country: document.getElementById("country").getAttribute('data-value') || document.getElementById("country").value,
      city: document.getElementById("city").getAttribute('data-value') || document.getElementById("city").value,
      password: document.getElementById("registerPassword").value,
      registrationType: 'email'
    }
  } else {
    // Phone registration - redirect to OTP verification
    requestData = {
      firstName: document.getElementById("registerFirstName").value,
      lastName: document.getElementById("registerLastName").value,
      email: "", // Empty email for phone registration
      phone: emailOrPhoneValue2,
      address: document.getElementById("registerAddress").value,
      username: emailOrPhoneValue2, // Use phone as username
      userType: document.getElementById("userType").value,
      country: document.getElementById("country").getAttribute('data-value') || document.getElementById("country").value,
      city: document.getElementById("city").getAttribute('data-value') || document.getElementById("city").value,
      password: document.getElementById("registerPassword").value,
      registrationType: 'phone'
    }
  }

    _postData('/register-user', requestData )
      .then(async response => {
        
        if(response.status == 200){
          
            regMessage.classList.remove('error_message');
            regMessage.classList.add('success_message');
            
            if (requestData.registrationType === 'phone') {
              // For phone registration, redirect to OTP verification
              if(lang_reg_u == 'fr'){
                regMessage.innerHTML = "Inscription réussie ! Redirection pour vérifier votre numéro de téléphone...";
              }else{
                regMessage.innerHTML = "Registration successful! Redirecting to verify your phone number..";
              }
              await new Promise(r => setTimeout(r, 1000));
              window.location.href = `/verify-phone?phone=${encodeURIComponent(requestData.phone || emailOrPhoneValue2)}&userId=${response.userId}`;
            } else {
              // For email registration, continue as usual
              if(lang_reg_u == 'fr'){
                regMessage.innerHTML = "Inscription réussie ! Redirection...";
              }else{
                regMessage.innerHTML = "Registration successful! Redirecting..";
              }
              await new Promise(r => setTimeout(r, 500));
              document.getElementById("iddl").value = response.userId;
              document.theForm.submit();
            }
        }
        else if(response.status == 409 || response.status == 408){
          const contactType = requestData.registrationType === 'phone' ? 'phone number' : 'email';
          const contactTypeFr = requestData.registrationType === 'phone' ? 'numéro de téléphone' : "adresse e-mail";
          if(lang_reg_u == 'fr'){
            regMessage.innerHTML  = `Un compte avec le ${contactTypeFr} donné existe, <a class="text-primary" href="#logModalCta" data-toggle="modal" data-dismiss="modal" data-caption-animate="fadeInUp">connectez-vous.</a>`;
          }else{
            regMessage.innerHTML  = `An account with the given ${contactType} exists, <a class="text-primary" href="#logModalCta" data-toggle="modal" data-dismiss="modal" data-caption-animate="fadeInUp">login.</a>`;
          }
        }else if(response.status == 411){
          if(lang_reg_u == 'fr'){
            regMessage.innerHTML  = `Une erreur s'est produite lors de l'envoi du code de vérification. Veuillez verifier que vous avez entré le bon numéro de téléphone ou email et réessayer.`;
          }else{
            regMessage.innerHTML  = `An error occurred while sending the verification code. Please check that you entered the correct phone number or email and try again.`;
          }
        }else{
          if(lang_reg_u == 'fr'){
            regMessage.innerHTML  = `Une erreur s'est produite lors de l'inscription. Veuillez réessayer.`;
          }else{
            regMessage.innerHTML  = `An error occurred during registration. Please try again.`;
          }
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
        if(lang_reg_p == 'fr'){
            regMessage.innerHTML  = `Une erreur s'est produite lors de l'inscription. Veuillez réessayer.`;
          }else{
            regMessage.innerHTML  = `An error occurred during registration. Please try again.`;
          }
      });

}

async function _postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
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