const loginPassInput = document.getElementById("password");
const lang_log= document.getElementById("lang").getAttribute("value");
loginPassInput.addEventListener("keyup", logKey);

function logKey(e) {
  if(e.code == 'Enter'){
    onLoginSubmit();
  }
}

const onLoginSubmit = async()=> {

    const username_ = document.getElementById("username").value;
    const password_ = document.getElementById("password").value;
    const message = document.getElementById("message");
    message.innerHTML = "";
    if(username_.length < 6){
      message.classList.add('error_message');
      if(lang_log== 'fr'){
        message.innerHTML = "Veuillez entrer un nom d'utilisateur valide";
      }else {
        message.innerHTML = "Please enter a valid username";
      }
      return;
    }
    if(password_ == "" || password_.length < 1){
      message.classList.add('error_message');
      if(lang_log== 'fr'){
        message.innerHTML = "Veuillez entrer un mot de passe pour vous connecter.";
      }else {
        message.innerHTML = "Please enter a password to login.";
      }
      return;
    }
    requestData = {
        username: username_.trim().toLowerCase(),
        password: password_
    }

    _postData('/login-u', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            if(lang_log== 'fr'){
              message.innerHTML = "Connexion réussie! Redirection..";
            }else {
              message.innerHTML = "Login successful! Redirecting..";
            }
            await new Promise(r => setTimeout(r, 100));
            window.location.reload();
        }
        else if(json.status == 402){
          if(lang_log== 'fr'){
            message.innerHTML = "Votre compte n'est pas vérifié! Vérifiez votre e-mail pour le code de vérification. Redirection...";
          }else {
            message.innerHTML = "Your account is not verified! Check your email for verification code. Redirecting...";
          }
            await new Promise(r => setTimeout(r, 1500));
            window.location = "/resendCode/"+json.id;
        }else if(json.status == 405){
          message.classList.remove('error_message');
          message.classList.add('success_message');
          if(lang_log== 'fr'){
            message.innerHTML = "Authentification à deux facteurs activée. Vérifiez votre e-mail pour le code de vérification. Redirection...";
          }else {
            message.innerHTML = "Two factors authentification enabled. Check your email for verification code. Redirecting...";
          }
          await new Promise(r => setTimeout(r, 1500));
          window.location = "/resendCode/"+json.id;
        }
        else{
          if(lang_log== 'fr'){
            message.innerHTML = "Nom d'utilisateur ou mot de passe incorrect! ";
          }else { 
            message.innerHTML = "Incorrect username or password! ";
          }
        }
        
      }).catch(err => {
        // console.log(err) // Handle errors
          if(lang_log== 'fr'){
            message.innerHTML = "Nom d'utilisateur ou mot de passe incorrect! ";
          }else {
          message.innerHTML = "Incorrect username or password! ";
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