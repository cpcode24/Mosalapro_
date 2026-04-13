const hirePro = async(proId, jobId_)=> {

    const message = document.getElementById("notif-msg");
    const translations = window.hireTranslations || {};
    requestData = {
        providerId: proId,
        jobId: jobId_
    }

    _postData('/hire-pro', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = translations.providerHiredSuccess ;
            await new Promise(r => setTimeout(r, 1500));

            var lnk = location.href.split("/");
            var baseLnk = lnk[0]+"//"+lnk[2];
            var socket = io(baseLnk, { transports: ['websocket']});

              socket.emit("pushNotification", {
                      "title": translations.providerHiredTitle ,
                      "content": translations.providerHiredContent,
                      "userId": proId,
                      "notifType": "pro"
                  });
          $('#contentId').load(location.href+" #contentId");
        }
        else{
            message.innerHTML = (translations.hireErrorOccurred || "Oops. An error occurred: ") + json.status;
        }

      }).catch(err => {
        console.log(err) // Handle errors
        message.innerHTML = translations.hireErrorTryAgain || "Oops. An error occurred. Please try again.";
      });
}

const rejectApplication = async(proId, jobId_)=> {
const message = document.getElementById("notif-msg");
  const translations = window.hireTranslations || {};
  requestData = {
      providerId: proId,
      jobId: jobId_
  }

  _postData('/reject-pro', requestData )
    .then(async json => {
      if(json.status == 200){
          message.classList.remove('error_message');
          message.classList.add('success_message');
          message.innerHTML = translations.applicationRejectedSuccess;
          await new Promise(r => setTimeout(r, 1100));
          // var lnk = location.href.split("/");
          // var baseLnk = lnk[0]+"//"+lnk[2];
          // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });

          socket.emit("pushNotification", {
                    "title": translations.applicationRejectedTitle,
                    "content": translations.applicationRejectedContent,
                    "userId": proId,
                    "notifType": "pro"
          });
          $('#contentId').load(location.href+" #contentId");
      }
      else{
          message.innerHTML = (translations.hireErrorOccurred || "Oops. An error occurred: ") + json.status;
      }

    }).catch(err => {
      console.log(err) // Handle errors
      message.innerHTML = translations.hireErrorTryAgain;
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