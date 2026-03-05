async function requestQuotation(proId){
  window.location = "/service-request-booking/"+proId;
}
async function addToFavorite(proId_){
    const message = document.getElementById("mess__");

    requestData = {
        proId: proId_
      }
  
    postInfo('/addfavpro', requestData )
      .then(async json => {
        if(json.status == 200){
            message.classList.remove('error_message');
            message.classList.add('success_message');
            message.innerHTML = "This provider has been successfully added as your favorite.";
            await new Promise(r => setTimeout(r, 1600));
            // window.location.reload();
            $("#topInfo").load("/pro-profile/"+proId_+" #topInfo");
            message.innerHTML = " ";
        }
        else if(json.status == 402){
            message.innerHTML = "An error occured while adding provider as favorite. Please try again.";
            await new Promise(r => setTimeout(r, 1500));
            message.innerHTML = " ";
        }
        else{
            message.innerHTML = "An error occured while adding provider as favorite. Please try again.";
            await new Promise(r => setTimeout(r, 1500));
            message.innerHTML = " ";
        }
        
      }).catch(async err => {
        // console.log(err) // Handle errors
        message.innerHTML = "An error occured while adding provider as favorite. Please try again.";
        await new Promise(r => setTimeout(r, 1500));
        message.innerHTML = " ";
      });
}

async function postInfo(url = '', data = {}) {
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



// function setProUrl() {
//   const shareBtn = document.getElementById("shareProButton");
//   shareBtn.setAttribute("data-href", window.location.href);
// }
// window.onload = setProUrl();