
let skills = []; 

const loadSkills = () => {
  const skillsArray = document.getElementById('skillsData').dataset.skills;
  skills = skillsArray.split(',');
  document.getElementById("skillsForm").value = skillsArray;
 
  //console.log(skillsArray);
}

const updateSkills = () => {
  document.getElementById('skillsData').dataset.skills = skills.length > 1 ? skills.join(',') : skills[0];
  let requestData = {
    skills: skills
  }

  _postData('/update-skills', requestData )
      .then(async response => {
      if(response.status == 200){
        console.log("Skills updated! msg: ", response.msg);
      }
      else{
        console.log("Error occured! msg: ", response.msg);
      }
    });
} 

const addNewSkill = () => {
  const skill = document.getElementById("inputSkill").value;
  const skillBox = document.getElementById("skillBox");
  const newSkill = `<div class="d-flex justify-content-between my-2">
                      <p>${skill}</p>
                      <span style="cursor: pointer; color: red;" onClick="removeSkill(this, ${skill});" ><b class="fas fa-times"></b></span>
                    </div>`;

  if(skill !== "") {
    skillBox.innerHTML += newSkill;
    skills.push(skill);
    document.getElementById("skillsForm").value = skills;
    document.getElementById("inputSkill").value = "";
    updateSkills();
  }
}

const removeSkill = (e, skill) => {
  const newSkills = skills.filter(s => s !== skill);
  skills = newSkills;
  document.getElementById("skillsForm").value = newSkills;
  e.parentElement.remove();
  //console.log(e.parentElement);
  updateSkills();
}


const onPhotoChange = () => {
  const photoInput = document.getElementById('photoInput');
  const photoBox = document.getElementById('photoBox');

  const photoURL = URL.createObjectURL(photoInput.files[0]);

  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    console.log(event.target);
    photoBox.style.backgroundImage = `url(${event.target.result})`;
  });

  reader.readAsDataURL(photoInput.files[0]);
}

  loadSkills(); 
    setTimeout(() =>  {
      const category = document.getElementById("user-category");
      const country = document.getElementById("country_search");
      const city = document.getElementById("city_search");
      country.value = "<%= usr.country %>" ;
      category.value = "<%= usr.category %>" ;
      const event = new Event('change');
      country.dispatchEvent(event);

      setTimeout(() =>  city.value = "<%= usr.city %>", 100);
    }, 100);
  

function _(element){return document.getElementById(element); }
_('countrySearch').onchange = function(){
  filename = "./data/cities/" + _('countrySearch').value +".json";
  $.getJSON(filename, function(data) {
    var items = [];
    items.push('<option value="">City</option>');
    $.each(data, function( key, val ) {
          items.push('<option value="' + val.name + '">' + val.name+ '</option>');
      });
      items.sort();
      _('citySearch').innerHTML = items;
   });
  }

function editSubscription() {
  const subBox = document.getElementById("subscriptionsBox");

  if (window.getComputedStyle(subBox, null).display === "none")
    subBox.style.display = "block";
  else     
    subBox.style.display = "none";
}

function changeSubscription(plan) {
  const body = { plan };

  fetch('/charge', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  })
  .then(res => windows.location.href = '/p-profile');
}

async function changePassword(){
  
  const oldPass = document.getElementById("oldPass");
  const newPass = document.getElementById("newPass");
  const newPassConf = document.getElementById("confNewPass");
  const message = document.getElementById("err_message");

  if (oldPass.value === "" || oldPass.value.length < 6) {
        oldPass.classList.add("invalid");
        message.classList.remove("success_message");
        message.classList.add("error_message");
        message.innerHTML = "Current password is incorrect";
        await new Promise(r => setTimeout(r, 5500));
          message.innerHTML = "";
        return;
    }

  if (newPass.value != newPassConf.value) {
      newPass.classList.add("invalid");
      newPassConf.classList.add("invalid");
      message.innerHTML = "Passwords do not match!";
      await new Promise(r => setTimeout(r, 5500));
          message.innerHTML = "";
      return;
  }
  if (oldPass.value === newPass.value) {
    newPass.classList.add("invalid");
    newPassConf.classList.add("invalid");
    message.innerHTML = "New password is the same as current password.";
    await new Promise(r => setTimeout(r, 5500));
    message.innerHTML = "";
    return;
  }
  if(newPass.value.length < 6){
      newPass.classList.add("invalid");
      newPassConf.classList.add("invalid");
      message.innerHTML = "Password is too short, enter a longer password.";
      await new Promise(r => setTimeout(r, 5500));
          message.innerHTML = "";
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
          await new Promise(r => setTimeout(r, 5500));
          message.innerHTML = "";
          return;
      }
      if(!numBoolean){
          newPass.classList.add("invalid");
          newPassConf.classList.add("invalid");
          message.innerHTML = "Include at least a number in your password.";
          await new Promise(r => setTimeout(r, 5500));
          message.innerHTML = "";
          return;
      }
      if(!specialCharBoolean){
          newPass.classList.add("invalid");
          newPassConf.classList.add("invalid");
          message.innerHTML = "Include at least a special char in your password";
          await new Promise(r => setTimeout(r, 5500));
          message.innerHTML = "";
          return;
      }
  }

  requestData = {
      accountPassword: oldPass.value,
      newPassword: newPass.value
  }

  _postData('/update-password', requestData )
      .then(async response => {
      if(response.status == 200){
          message.classList.remove('error_message');
          message.classList.add('success_message');
          message.innerHTML = "Your password has been successfully updated!";
          await new Promise(r => setTimeout(r, 2500));
          message.innerHTML = "";
          hideModal('#changePasswordModalCta');
      }
      else{
          message.classList.remove("success_message");
          message.classList.add("error_message");
          message.innerHTML = "Current password is incorrect.";
          await new Promise(r => setTimeout(r, 3500));
          message.innerHTML = "";
      }
      
      }).catch(async err => {
        message.classList.remove("success_message");
        message.classList.add("error_message");
        console.log("Error occured while changing password: ",err) 
        message.innerHTML = "Current password is incorrect. ";
        await new Promise(r => setTimeout(r, 3500));
        message.innerHTML = "";
      });
  }

function setTwoFactAuth(id){
    requestData = {
        id: id
    }
    _postData('/enable-two-fact-auth', requestData )
        .then(async response => {
        if(response.status == 200){
            console.log("Two factors auth successfully set!");
        }
        else{
            console.log("Error occured while setting two factors auth!");
        }
        
        }).catch(err => {
            console.log(err);
        });
}

function setbkgUpdateNotifs(id){
  requestData = {
      id: id
  }
  _postData('/set-bkg-updte-email-notifs', requestData )
      .then(async response => {
      if(response.status == 200){
          console.log("Booking updates emails notifs successfully set!");
      }
      else{
          console.log("Error occured while setting updates emails notifs!");
      }
      
      }).catch(err => {
          console.log(err);
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

function showModal(id){
    $(id).modal('show');
}
function hideModal(id){
    $(id).modal('hide');
}

async function deleteAccount(id){
const delAccModalPass = document.getElementById('delAccModalPass');
    const message = document.getElementById("errConfDelMessage");
    requestData = {
        accountPassword: delAccModalPass.value,
        id: id
    }

    if(delAccModalPass.value === "" || delAccModalPass.value.length < 6){
        delAccModalPass.classList.add("invalid");
        message.classList.remove("success_message");
        message.classList.add("error_message");
        message.innerHTML = "Password is incorrect.";
        await new Promise(r => setTimeout(r, 2500));
        message.innerHTML = "";
        return;
    }
    _postData('/delete-pro-account', requestData )
        .then(async response => {
        if(response.status == 210){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "Your account has been deleted, logging you out...";
            await new Promise(r => setTimeout(r, 3500));
            data = {id: id};
            _postData('/remove-user-account', data ).then(
                async response =>{
                    if(response.status == 200)
                        console.log("Provider account successfully deleted!");
                }
            ).catch(err =>{ console.log("Error occured while deleting user: "+err);});
            window.location = "/";
        }
        else if(response.status == 211){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "Your provider account has been deleted, but you can still logging as a user. Redirecting...";
            await new Promise(r => setTimeout(r, 3500));
            window.location = "/logout";
        }else if(response.status == 411){
            message.classList.remove('success_message');
            message.classList.add('error_message');
            message.innerHTML = "You still have active / in-progress requests or booking. "+
            "Wait for those to complete or cancel them before deleting your account.";
            await new Promise(r => setTimeout(r, 5200));
            message.innerHTML = "";
            $('#confirmAccountDeletionModalCta').modal('hide');
        }
        else{
            delAccModalPass.classList.add("invalid");
            message.classList.remove("success_message");
            message.classList.add("error_message");
            message.innerHTML = "Password is incorrect.";
        }
        
        }).catch(err => {
            console.log(err) 
            delAccModalPass.classList.add("invalid");
            message.classList.remove("success_message");
            message.classList.add("error_message");
            message.innerHTML = "Password is incorrect. ";
        });

}