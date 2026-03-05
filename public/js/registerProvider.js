
// Modal validation and processing - country/city selection now handled in registerModal.ejs
$(document).ready(function() {
    $('#regModalCta').on('hidden', function() {
      $(':input', this).val('');
    });
});
const lang_reg_p = document.getElementById("lang_r").getAttribute("value");

// reCAPTCHA callback function - defined here to be available globally  
function enableProRegBtn(){
    document.getElementById("register-p").disabled = false;
}

let skills = [];

const loadSkills = () => {
  document.getElementById("skillsList").innerHTML = skills.join(', ');
}

const addNewSkill = () => {
  const skill = document.getElementById("inputSkill").value;
  // const skillBox = document.getElementById("skillBox");
  // const newSkill = `<div class="d-flex justify-content-between my-2">
  //                     <p>${skill}</p>
  //                     <img style="width: 20px;" src="icons/delete-icon.svg" onClick="removeSkill(this, '${skill}');"/>
  //                   </div>`;

  if(skill !== "") {
    // skillBox.innerHTML += newSkill;
    skills.push(skill);
    document.getElementById("inputSkill").value = "";
    loadSkills();
  }
}

const removeSkill = (e, skill) => {
  const newSkills = skills.filter(s => s !== skill);
  skills = newSkills;
  loadSkills();
}


function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(cleaned);
}

function validateAndRegisterP(){
  const pass = document.getElementById("password-input");
  const passConf = document.getElementById("password-input-conf");
  const regMessage = document.getElementById("rMessagePro");
  const category = document.getElementById("pRegisterCategory");
  const firstName = document.getElementById("pRegisterFirstName");
  const lastName = document.getElementById("pRegisterLastName");
  const emailOrPhone = document.getElementById("pRegisterEmailOrPhone");
  const city = document.getElementById("city_p");
  const country = document.getElementById("country_p");
  const termsAndConds = document.getElementById('regPCheck');

  regMessage.innerHTML = "";

  const categoryValue = category.getAttribute('data-value') || category.value;
  if(categoryValue.length < 2 ){
    category.classList.add("invalid");
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Veuillez sélectionner une catégorie.";
    }else{  
      regMessage.innerHTML = "Please select a category.";
    }
    return;
  }
  if(firstName.value.length < 2){
    firstName.classList.add("invalid");
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Veuillez entrer votre prénom.";
    }else{
      regMessage.innerHTML = "Please enter your firstname.";
    }
    return;
  }

  if(lastName.value.length < 2){
    lastName.classList.add("invalid");
    if(lang_reg_p == 'fr'){
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
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Veuillez entrer une adresse e-mail ou un numéro de téléphone valide.";
    }else{
      regMessage.innerHTML = "Please enter a valid email address or phone number.";
    }
    return;
  }

  const countryValue = country.getAttribute('data-value') || country.value;
  const cityValue = city.getAttribute('data-value') || city.value;

  if(countryValue.length < 2){
    country.classList.add("invalid");
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Veuillez sélectionner un pays.";
    }else{
      regMessage.innerHTML = "Please select country.";
    }
    return;
  }
  
  if(cityValue.length < 2){
    city.classList.add("invalid");
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Veuillez sélectionner une ville.";
    } else{
      regMessage.innerHTML = "Please select city.";
    }
    return;
  }

  

  regMessage.innerHTML = "";

  if (pass.value != passConf.value) {
    //alert("Passwords Do not match");
    pass.classList.add("invalid");
    passConf.classList.add("invalid");
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Les mots de passe ne correspondent pas!";
    }else{
      regMessage.innerHTML = "Passwords do not match!";
    }
    return;
  }
  if(pass.value.length < 6){
    pass.classList.add("invalid");
    passConf.classList.add("invalid");
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Le mot de passe est trop court, veuillez entrer un mot de passe plus long.";
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
      if(lang_reg_p == 'fr'){
        regMessage.innerHTML = "Inclure au moins une lettre dans le mot de passe.";
      }else{  
        regMessage.innerHTML = "Include at least letter in password.";
      }
      return;
    }
    if(!numBoolean){
      pass.classList.add("invalid");
      passConf.classList.add("invalid");
      if(lang_reg_p == 'fr'){
        regMessage.innerHTML = "Inclure au moins un numéro dans votre mot de passe.";
      }else{
        regMessage.innerHTML = "Include at least a number in your password.";
      }
      return;
    }
    if(!specialCharBoolean){
      pass.classList.add("invalid");
      passConf.classList.add("invalid");
      if(lang_reg_p == 'fr'){
        regMessage.innerHTML = "Inclure au moins un caractère spécial dans votre mot de passe.";
      }else{
        regMessage.innerHTML = "Include at least a special char in your password";
      }
      return;
    }
  }

  if (!termsAndConds.checked){
    if(lang_reg_p == 'fr'){
      regMessage.innerHTML = "Vous devez accepter les termes et conditions";
    }else{
      regMessage.innerHTML = "You must accept the terms and conditions";
    }
    return;
  }

  // Prepare request data based on whether it's email or phone registration
  const emailOrPhoneValue2 = emailOrPhone.value.trim();
  const isEmail2 = isValidEmail(emailOrPhoneValue2);
  
  if (isEmail2) {
    // Email registration
    requestData = {
      pFirstName: document.getElementById("pRegisterFirstName").value,
      pLastName: document.getElementById("pRegisterLastName").value,
      pEmail: emailOrPhoneValue2,
      pPhone: "", // Empty phone for email registration
      pAddress: document.getElementById("pRegisterAddress").value,
      pCategory: document.getElementById("pRegisterCategory").getAttribute('data-value') || document.getElementById("pRegisterCategory").value,
      userType: document.getElementById("proType").value,
      country_p: document.getElementById("country_p").getAttribute('data-value') || document.getElementById("country_p").value,
      city_p: document.getElementById("city_p").getAttribute('data-value') || document.getElementById("city_p").value,
      pPassword: document.getElementById("password-input").value,
      pSkills: skills,
      registrationType: 'email'
    }
  } else {
    // Phone registration
    requestData = {
      pFirstName: document.getElementById("pRegisterFirstName").value,
      pLastName: document.getElementById("pRegisterLastName").value,
      pEmail: "", // Empty email for phone registration  
      pPhone: emailOrPhoneValue2,
      pAddress: document.getElementById("pRegisterAddress").value,
      pCategory: document.getElementById("pRegisterCategory").getAttribute('data-value') || document.getElementById("pRegisterCategory").value,
      userType: document.getElementById("proType").value,
      country_p: document.getElementById("country_p").getAttribute('data-value') || document.getElementById("country_p").value,
      city_p: document.getElementById("city_p").getAttribute('data-value') || document.getElementById("city_p").value,
      pPassword: document.getElementById("password-input").value,
      pSkills: skills,
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
              if(lang_reg_p == 'fr'){
                regMessage.innerHTML = "Inscription réussie! Redirection pour vérifier votre numéro de téléphone..";
              }else{
                regMessage.innerHTML = "Registration successful! Redirecting to verify your phone number..";
              }
              await new Promise(r => setTimeout(r, 1000));
              window.location.href = `/verify-phone?phone=${encodeURIComponent(requestData.pPhone || emailOrPhoneValue2)}&userId=${response.userId}`;
            } else {
              // For email registration, continue as usual
              if(lang_reg_p == 'fr'){
                regMessage.innerHTML = "Inscription réussie! Redirection..";
              }else{
                regMessage.innerHTML = "Registration successful! Redirecting..";
              }
              await new Promise(r => setTimeout(r, 1000));
              document.getElementById("iddl").value = response.userId;
              document.theForm.submit();
            }
        }
        else{
          const contactType = requestData.registrationType === 'phone' ? 'phone number' : 'email';
          if(lang_reg_p == 'fr'){
            regMessage.innerHTML  = `Un compte avec le ${contactType} donné existe, <a class="text-primary" href="#logModalCta" data-toggle="modal" data-dismiss="modal" data-caption-animate="fadeInUp">connectez-vous.</a>`;
          }else{
            regMessage.innerHTML  = `An account with the given ${contactType} exists, <a class="text-primary" href="#logModalCta" data-toggle="modal" data-dismiss="modal" data-caption-animate="fadeInUp">login.</a>`;
          }
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
        const contactType = requestData.registrationType === 'phone' ? 'phone number' : 'email';
        if(lang_reg_p == 'fr'){
          regMessage.innerHTML = `Un compte avec le ${contactType} donné existe, <a class="text-primary" href="#logModalCta" data-toggle="modal" data-dismiss="modal" data-caption-animate="fadeInUp">connectez-vous.</a>`;
        }else{
          regMessage.innerHTML = `An account with the given ${contactType} exists, <a class="text-primary" href="#logModalCta" data-toggle="modal" data-dismiss="modal" data-caption-animate="fadeInUp">login.</a>`;
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