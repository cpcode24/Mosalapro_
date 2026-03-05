var currentBoxNumber = 0;
const newPassInput = document.getElementById("newPass_");
const newPassConfInput = document.getElementById("newPassConf_");
newPassInput.addEventListener("keyup", getInputKey);

function getInputKey(e) {
    if(e.code == 'Enter'){
        textboxes = $("input.form-control");
        currentBoxNumber = textboxes.index(this);
        //console.log(textboxes.index(this));
        if (textboxes[currentBoxNumber + 1] != null) {
            nextBox = textboxes[currentBoxNumber + 1];
            nextBox.focus();
            nextBox.select();
            e.preventDefault();
            return false;
        }
    }
  }



const updatePassword = async(user_id)=> {
    
    //const oldPass = document.getElementById("currentPass").value;
    const newPass = document.getElementById("newPass_");
    const newPassConf = document.getElementById("newPassConf_");
    //const userId = document.getElementById("user_id_");
    const message = document.getElementById("e_message");

    if(newPass == null || newPassConf == null){
        newPass.classList.add("invalid");
        newPassConf.classList.add("invalid");
        message.innerHTML = "Passwords do not match!";
        return;
    }

    if (newPass.value != newPassConf.value) {
    //alert("Passwords Do not match");
        newPass.classList.add("invalid");
        newPassConf.classList.add("invalid");
        message.innerHTML = "Passwords do not match!";
        return;
    }
    if(newPass.value.length < 6){
        newPass.classList.add("invalid");
        newPassConf.classList.add("invalid");
        message.innerHTML = "Password is too short, enter a longer password.";
        return;
    }
    else{
        const specialChars = "!@#$%^&*()-_=+[{]}\\|;:'\",<.>/?`~";
        let letterBoolean = newPass.value.match(/[a-z]/i);
        let numBoolean = false;
        for (let i = 0; i < newPass.value.length; i++) {
            if(!isNaN(newPass.value[i]))
            numBoolean = true;
        }

        let specialCharBoolean = false;
            for (let i = 0; i < newPass.value.length; i++) {
            for (let j = 0; j < specialChars.length; j++) {
                if (newPass.value[i] == specialChars[j]) {
                specialCharBoolean = true;
                }
            }
        }
        if(!letterBoolean){
            newPass.classList.add("invalid");
            newPassConf.classList.add("invalid");
            message.innerHTML = "Include at least letter in password.";
            return;
        }
        if(!numBoolean){
            newPass.classList.add("invalid");
            newPassConf.classList.add("invalid");
            message.innerHTML = "Include at least a number in your password.";
            return;
        }
        if(!specialCharBoolean){
            newPass.classList.add("invalid");
            newPassConf.classList.add("invalid");
            message.innerHTML = "Include at least a special char in your password";
            return;
        }
    }

    requestData = {
        newPassword: newPass.value,
        userId: user_id
    }
    _postData('/change-password', requestData )
        .then(async response => {
        if(response.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "Your password has been successfully updated! Login with the new password to access your account.";
            await new Promise(r => setTimeout(r, 600));
            window.location = "/";
        }
        else{
            message.innerHTML = "Error occured while changing password, please try again. "+response;
        }
        
        }).catch(err => {
        // console.log(err) // Handle errors
        message.innerHTML = "Error occured while changing password, please try again. "+response;
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
