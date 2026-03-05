function loadMoreUnread(){
    const limit = document.getElementById("limit");
    requestData = {
        lim : limit.value,
        status: "unread"
    };

    _postData('/notifications', requestData )
      .then(async response => {
        
        if(response.status == 200){
            let contnt = "";
            let i = 0;
            for(const noti of response.loadNotifs){
                let partHtml2= "";

                if (noti.title == "You have a new message.") { 
                    partHtml2 = `<a href="/messages?id=${noti.causedByUserId}" class="noti-lnk"> Read and reply message </a>`;
                } 
                else if(noti.title.includes('booking') && response.accType == 'user'){
                    partHtml2 = `<a href="/manage-request?rq=${noti.causedByItem}" class="noti-lnk"> View booking update </a>`;
                }
                else if(noti.title.includes('provider')){
                    partHtml2 = `<a href="/applicant?p=${noti.causedByUserId}&j=${noti.causedByItem}" class="noti-lnk"> Check provider profile </a>`;
                }
                else if(response.accType == 'provider' && !noti.title.includes('new message')){ 
                    partHtml2 = `<a href="/booking?b=${noti.bookingId}" class="noti-lnk"> View booking details </a>`;
                }

                let html = `
                    <div class="unread border-top" id="notif-container${i}">
                        <div class="notif_header" data-bs-toggle="collapse" data-bs-target="#collapseOne${i}" aria-expanded="true" aria-controls="collapseOne${i}">

                            <div onClick="readNotification('${noti._id}', '${i}')" class="px-3 d-flex align-items-center unread border-bottom osahan-post-header">
                                <div class="dropdown-list-image mr-3"> <b class="fa ${noti.icon} fa-2x rounded-circle file-icon"></b>` +
                                `</div>
                                <div class="font-weight-bold mr-2">
                                        <div class="text-wrap">${noti.title}</div>
                                        <div class="small" id="noti-content">${noti.content}</div>
                                </div>
                                <span class="ml-auto mb-auto">
                                    
                                    <br/>
                                    <div class="text-right text-muted pt-1">${response.ages[i]}d</div>
                                </span>
                            </div>
                                
                            <div id="collapseOne${i}" class="collapse hide"  data-bs-parent="#accordion">
                                    <div class="row mt-0">
                                        <div class="col d-flex justify-content-center mb-3">`+partHtml2+
                                            `
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </div>
                `;
                i = i + 1;
                contnt = contnt + html;
            }
            const newLimit = response.loadNotifs.length + 3;
            contnt = contnt + `<input id="limit" class="d-none" value="${newLimit}" >`;
            document.getElementById("unreadNotifs").innerHTML = contnt;
            
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
      });

    }


function loadMoreRead(){
    const limit = document.getElementById("limit");
    requestData = {
        lim : limit.value,
        status: "read"
    };

    _postData('/notifications', requestData )
      .then(async response => {
        
        if(response.status == 200){
            let contnt = "";
            let i = 0;
            for(const noti of response.loadNotifs){
                let partHtml2= "";
                let partHtml3="";

                if (noti.title == "A service provider has applied for your service request.") { 
                    partHtml2 = `<a href="/notification?n=${noti._id}&p=${noti.causedByUserId}"> <button class="dropdown-item" type="button" ><i class="mdi mdi-check"></i> Check provider profile</button> </a>`;
                } else if(noti.title == "You have a new message.") { 
                    partHtml2 = `<a href="/message?m=messageId&p=causedByUserId"><button class="dropdown-item" type="button"><i class="mdi mdi-delete"></i> Read message</button> </a>`;
                }

                let html = `
                <div class="p-3 d-flex align-items-center read border-bottom osahan-post-header">
                                <div class="dropdown-list-image mr-3"> <b class="fa ${noti.icon} fa-2x rounded-circle file-icon"></b>`+
                                    
                                `</div>
                                <div class="font-weight-bold mr-2">
                                    <div class="text-wrap">${noti.title}</div>
                                    <div class="small">${noti.content}</div>
                                </div>
                                <span class="ml-auto mb-auto">
                                    <div class="btn-group">
                                        <button type="button" class="btn btn-light btn-sm rounded" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <i class="mdi mdi-dots-vertical"></i>
                                        </button>
                                        <div class="dropdown-menu dropdown-menu-right" style>
                                            `+partHtml2+`
                                            <button class="dropdown-item" type="button" onClick="deleteReadAlert(${noti._id})" ><i class="mdi mdi-close"></i> Delete alert</button>
                                        </div>
                                    </div>
                                    <br/>
                                    <div class="text-right text-muted pt-1">${response.ages[i]}d</div>
                                </span>
                            </div>
                `;
                i = i + 1;
                contnt = contnt + html;
            }
            const newLimit = response.loadNotifs.length + 3;
            contnt = contnt + `<input id="limit" class="d-none" value="${newLimit}" >`;
            document.getElementById("readNotifs").innerHTML = contnt;
            
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
      });

    }

async function _postData(url = '/read-notif', data = {}) {
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

async function readNotification(notifId, id){
    const notiContainer = document.getElementById("notif-container"+id);
    requestData = {
        _id: notifId,
    };
    _postData("/read-notif", requestData )
      .then(async json => {
        if(json.status == 200){
            console.log(json.message);
            notiContainer.classList.remove("unread");
            notiContainer.classList.add("read");
        }
        else
            console.log(json.message);
        }).catch(err => {
        console.log(err); 
      });
}

async function deleteReadAlert(notifId){
    requestData = {
        _id: notifId,
    };
    _postData("/delete-notif", requestData )
      .then(async json => {
        if(json.status == 200){
            console.log(json.message);
            await new Promise(r => setTimeout(r, 500));
            $("#readNotifs").load("/notifications #readNotifs");
        }
        else
            console.log(json.message);
        }).catch(err => {
        console.log(err);
      });
}

async function deleteUnreadAlert(notifId){

requestData = {
    _id: notifId,
};
_postData("/delete-notif", requestData )
  .then(async json => {
    if(json.status == 200){
        // console.log(json.message);
        await new Promise(r => setTimeout(r, 500));
        $("#unreadNotifs").load("/notifications #unreadNotifs");
    }
    }).catch(err => {
     console.log(err);
  });
}
