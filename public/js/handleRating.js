async function submitRating(proId, jobId, jobTitle){
    const one = document.getElementById('1').value;
    const two = document.getElementById('2').value;
    const three = document.getElementById('3').value;
    const four = document.getElementById('4').value;
    const five = document.getElementById('5').value;
    const rating = one != -1 ? 1 : two != -1 ? 2: three != -1 ?  3 : four != -1 ? 4: five != -1 ? 5 : 0;
    const msg = document.getElementById('e_message');
    if(rating == 0) {
        msg.innerHTML = "Please rate the provider";
        msg.classList.add('error_message');
        msg.classList.remove('success_message');
        return;
    }

    if(rating < 2)
        msg.innerHTML = `Rating:  ${rating} star`;
    else msg.innerHTML = `Rating:  ${rating} stars`;
    msg.classList.remove('error_message');
    msg.classList.add('success_message');
    const userComment = document.getElementById('ratingComment').value;
    
    // Get privacy settings
    const visibilityRadios = document.getElementsByName('reviewVisibility');
    let visibility = 'public';
    for (const radio of visibilityRadios) {
        if (radio.checked) {
            visibility = radio.value;
            break;
        }
    }
    
    // Map visibility to database fields
    let isPublic = true;
    let visibleToFriendsOnly = false;
    
    if (visibility === 'friendsOnly') {
        isPublic = true;
        visibleToFriendsOnly = true;
    } else if (visibility === 'private') {
        isPublic = false;
        visibleToFriendsOnly = false;
    }

    requestData = {
        proId: proId,
        jobId: jobId,
        ratingTitle: "",
        userComment: userComment,
        rating: rating,
        isPublic: isPublic,
        visibleToFriendsOnly: visibleToFriendsOnly
    }

    _postData('/submit-rating', requestData )
      .then(async json => {
        if(json.status == 200){
            msg.classList.remove('error_message');
            msg.classList.add('success_message');
            msg.innerHTML = "Your rating and feedback have been saved successfully saved.";
            const ratingForm = document.getElementById('rating-form');
            const ratingSuccess = document.getElementById('rating-success');

            ratingForm.style.display = "none";
            ratingSuccess.classList.remove('d-none');
            ratingSuccess.style.display = "block";
            
            // var lnk = location.href.split("/");
            // var baseLnk = lnk[0]+"//"+lnk[2];
            // var socket = io(baseLnk, { transports: ['websocket', 'polling', 'flashsocket'], 'force new connection': true });
            //console.log("User id for push booking handler: ", userId);
            socket.emit("pushNotification", { 
                        "title": "A user has provided a feedback for your service.",
                        "content": "A user has provided a feedback for the service: "+jobTitle+"\n",
                        "userId": proId,
                        "notifType": "pro"
            });
            //window.location = '/myrequests?type=completed';
        }
        else if(json.status == 402){
            msg.innerHTML = "An error occured while saving your rating. Please try again. Redirecting...";
            await new Promise(r => setTimeout(r, 1500));
        }
        else{
            msg.innerHTML = "An error occured while saving your rating. Please try again. ";
        }
        
      }).catch(err => {
        // console.log(err) // Handle errors
        msg.innerHTML = "An error occured while saving your changes. Please try again.";
    });
}

async function setValue(val){
    const elt = document.getElementById(`${val}`);
    elt.value = val;
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