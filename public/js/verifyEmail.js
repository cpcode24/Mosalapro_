const verifyCode = async(redirect_link, user_id, lang)=> {
    const first_ = document.getElementById("first");
    const second_ = document.getElementById("second");
    const third_ = document.getElementById("third");
    const fourth_ = document.getElementById("fourth");
    const fifth_ = document.getElementById("fifth");
    const sixth_ = document.getElementById("sixth");
    const msg = document.getElementById("e_message"); 

    msg.innerHTML = "";
    
    if(first_.value.length == 0 || first_.value == "" ){
      first_.className += " invalid";
      return;
    }
    if(second_.value.length == 0 || second_.value == "" ){
      second_.className += " invalid";
      return;
    }
    if(third_.value.length == 0 || third_.value == "" ){
      third_.className += " invalid";
      return;
    }
    if(fourth_.value.length == 0 || fourth_.value == "" ){
      fourth_.className += " invalid";
      return;
    }
    if(fifth_.value.length == 0 || fifth_.value == "" ){
      fifth_.className += " invalid";
      return;
    }
    if(sixth_.value.length == 0 || sixth_.value == "" ){
      sixth_.className += " invalid";
      return;
    }

    requestData = {
        first: first_.value,
        second: second_.value,
        third: third_.value,
        fourth: fourth_.value,
        fifth: fifth_.value,
        sixth: sixth_.value,
        id: user_id
    }
    post_link = redirect_link == "/change-pass"? "/verify-code":"/verify-email";
    
    _postData(post_link, requestData )
      .then(async json => {
        if(json.status == 200){
            msg.classList.remove('error_message');
            msg.classList.add('success_message');
            if(lang == 'fr'){
              msg.innerHTML = "Adresse e-mail vérifiée avec succès ! Redirection...";
            }else{
              msg.innerHTML = "Email address successfully verified! Redirecting...";
            }
            await new Promise(r => setTimeout(r, 500));
            if(redirect_link == "/change-pass")
              window.location = "/change-pass/"+user_id;
            else
              window.location = "/";
        }
        else{
            msg.classList.remove('success_message');
            msg.classList.add('error_message');
            if(lang == 'fr'){
              msg.innerHTML = "Le code que vous avez entré ne correspond pas. Veuillez réessayer.";
            }else{  
              msg.innerHTML = "The code you entered does not match. Please try again. ";
            }
            first_.innerHTML = ""; second_.innerHTML = ""; third_.innerHTML = "";
            fourth_.innerHTML = ""; fifth_.innerHTML = ""; sixth_.innerHTML = "";
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
        msg.classList.remove('success_message');
        msg.classList.add('error_message');
        if(lang == 'fr'){
          msg.innerHTML = "Le code que vous avez entré ne correspond pas. Veuillez réessayer.";
        }else{
          msg.innerHTML = "The code you entered does not match. Please try again. ";
        }
        first_.innerHTML = ""; second_.innerHTML = ""; third_.innerHTML = "";
        fourth_.innerHTML = ""; fifth_.innerHTML = ""; sixth_.innerHTML = "";
      });
  }


  const resendCode = async(redirectlink, user_id, lang)=>{
    const first_ = document.getElementById("first");
    const second_ = document.getElementById("second");
    const third_ = document.getElementById("third");
    const fourth_ = document.getElementById("fourth");
    const fifth_ = document.getElementById("fifth");
    const sixth_ = document.getElementById("sixth");

    const msg = document.getElementById("e_message");
    const resend_txt_lnk = document.getElementById("resend_code");

    msg.innerHTML = ""
    first_.innerHTML = ""; second_.innerHTML = ""; third_.innerHTML = "";
    fourth_.innerHTML = ""; fifth_.innerHTML = ""; sixth_.innerHTML = "";
  
    requestData = {
      id: user_id, 
      redirect_link: redirectlink
    }
  
  _postData('/resendCode', requestData )
    .then(async json => {
      if(json.status == 200){
          msg.classList.remove('error_message');
          msg.classList.add('success_message');
          if(lang == 'fr'){
            msg.innerHTML = "Le code a été renvoyé avec succès...";
          }else{
            msg.innerHTML = "The code has been resent successfully...";
          }
          resend_txt_lnk.classList.remove("fake_link");
          resend_txt_lnk.classList.add("text-muted");

          await new Promise(r => setTimeout(r, 35000));
          resend_txt_lnk.classList.remove("text-muted");
          resend_txt_lnk.classList.add("fake_link");
          msg.innerHTML = "";
          
      }
      else{
        msg.classList.remove('success_message');
        msg.classList.add('error_message');
        if(lang == 'fr'){
          msg.innerHTML = "Une erreur s'est produite lors du renvoi du lien, veuillez réessayer.";
        }else{
          msg.innerHTML = "An error occured while resending the link, please try again ";
        }

      }
      
    }).catch(err => {
      msg.classList.remove('success_message');
      msg.classList.add('error_message');
      console.log(err) // Handle errors
      if(lang == 'fr'){
        msg.innerHTML = "Une erreur s'est produite lors du renvoi du lien, veuillez réessayer. ";
      }else{  
        msg.innerHTML = "An error occured while resending the link, please try again . ";
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

