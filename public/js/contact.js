
function enableContactSubmit(){
    document.getElementById("submit-contact-req").disabled = false;
 }

const onContactSubmit = async()=> {
  
    const fname_ = document.getElementById("contactFirstName");
    const lname_ = document.getElementById("contactLastName");
    const email_ = document.getElementById("contactEmail");
    const user_message_ = document.getElementById("concern_message");

    const message = document.getElementById("contact_message");
    message.innerHTML = "";
    if(fname_.value.length < 3){
      message.classList.add('error_message');
      message.innerHTML = "Please enter a valid first name.";
      return;
    }
    if(lname_.value.length < 3){
      message.classList.add('error_message');
      message.innerHTML = "Please enter a valid last name.";
      return;
    }
    if(!validateContactEmail(email_.value)){
      message.classList.add('error_message');
      message.innerHTML = "Please enter a valid email address.";
      return;
    }
    if(user_message_.value.trim().length < 30 ){
      message.classList.add('error_message');
      message.innerHTML = "Please enter a valid message. Message length should be at least 30 characters.";
      return;
    }
    
    requestData = {
        fname : fname_.value,
        lname : lname_.value,
        email : email_.value,
        user_message : user_message_.value
    }

    postUserRequestData('/contact-us', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "Message successfully sent! We will be contacting you soon.";
            

            const contactForm = document.getElementById("contact_form");
            contactForm.innerHTML = "<div class='col-sm-12 '>"+
              "<div class='row justify-content-center align-items-center'><img  src='/images/done.png' class='success-image p-4 mx-auto'  alt='image'></div>"+
              "<div class='row justify-content-center align-items-center'><h1 class='text-light p-4 text-center'> Your message has been successfully sent!</h1></div>"+
              "</div>";
            await new Promise(r => setTimeout(r, 2500));
            $("#contact_form").load("/contact-us #contact_form");
            message.innerHTML = "";
           
        }
        else{
            // console.log("Error: "+json);
            message.innerHTML = "ELSE : An error occured while submitting the message. Please retry again. "+json.status;
        }
        
      }).catch(err => {
        // console.log("Error::: "+err) // Handle errors
        message.innerHTML = "CATCH: An error occured while submitting the message. Please retry again.";
      });
  }

async function postUserRequestData(url = '', data = {}) {
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

const validateContactEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};