
function setCorrespondentId(id) {
    window.history.replaceState(null, null, `messages?id=${id}`);
}
async function getMessages(userId_, total, navId){
    
        for(let i = 1; i <= total; i++){
            document.getElementById(`${i}`).classList.remove('active-chat');
        }
        document.getElementById(`${navId}`).classList.add('active-chat');
    
    setCorrespondentId(userId_);

    const chatBoxTop = document.getElementById('chat-box-top');
    const chatContent = document.getElementById('chat-content');
    requestData = {
        userId: userId_,
    }
    
    postData('/messages', requestData )
      .then(async json => {
        if(json.status == 200){
            const pict = json.chatUser.photo === "" ? "/photo/default.png" : json.chatUser.photo.includes("https://")? json.chatUser.photo: "/photo/"+json.chatUser.photo;
            chatBoxTop.innerHTML = `<div class="position-relative">
                                <img src="${pict}" class="rounded-circle mr-1" style="height: 45px !important; width: 45px !important;" alt="${json.chatUser.firstName} ${json.chatUser.lastName} " width="40" height="40">
                                </div>
                                <div class="flex-grow-1 pl-3">
                                    <strong>${json.chatUser.firstName} ${json.chatUser.lastName}</strong>
                                    <div class="text-muted small"><em>${json.chatUser.accountType}</em></div>
                                </div>`;

            let chat = "";
                

            for(const dat of json.data){
                let attachmentsEls = "";
                dat.attachments.forEach(attch => {
                    attachmentsEls +=`<div class="mr-4" onclick="downloadFile('${attch}')">
                            <b class="fa fa-file-text mb-1 file-icon" aria-hidden="true"></b>
                            <span class="pr-2">${attch}</span>
                        </div>`;
                });

                
                if(json.usr._id == dat.senderId){
                     if (dat.isQuotation) {
                        var quotation = {};
                        for(const q of json.quotations){
                            if(q._id == dat.quotationId){
                                quotation = q;
                                break;
                            }
                        }
                        chat = chat + `
                        <div class="chat-message-right pb-4">
                            <div class="d-none d-lg-block d-md-block">
                                <img src="${pict}" class="rounded-circle mr-1" alt="" style="height: 45px !important; width: 45px !important;">
                            </div>
                            <div class="flex-shrink-1 sender-chat text-wrap py-2 sender-chat px-3 mr-3">
                                
                                <div class="font-weight-bold mb-1">You</div>
                                <h5 class="mb-2 text-white">New Quotation</h5>
                                <h6 class="text-white"><b>${quotation.requestTitle}</b></h6>
                                <p class="mt-0 mb-1">$${quotation.budget} / ${quotation.budgetType}</p> `;
                            
                            if(quotation.budgetType === 'Per hour') {
                                    chat = chat + `
                                    <p class="small mt-0 ">Time of completion</p>
                                    <p class="mt-0 mb-1">${quotation.timeOfCompletion}</p>`;
                            } 
                            chat = chat + `
                                <hr />
                                <p class="mt-1">${quotation.requestDescription}</p> 
                                <div class="row mt-1 pl-1">
                                    <div class="col-6">
                                        <p class=" small">Category</p>
                                        <p class="mt-0">${quotation.requestCategory}</p> 
                                    </div>
                                    <div class="col-6">
                                        <p class=" small">Deadline</p>
                                        <p class="mt-0">${quotation.deadline}</p> 
                                    </div>
                                </div>
                                <div class=" text-petit text-light-g text-wrap my-2">${new Date(dat.createdAt).toLocaleDateString('us-EN', { month: 'short', day: 'numeric', year: 'numeric' }) +' at '+ new Date(dat.createdAt).toLocaleTimeString('us-EN')}</div>`;

                            if (quotation.status === 'accepted') { 
                                chat = chat + `
                                    <i class="success_message">Accepted</i>`;
                            }
                            else if (quotation.status === 'rejected') {
                                chat = chat + `
                                    <i class="error_message">Rejected</i>`;
                            } 
                            else { 
                                chat = chat + `
                                    <button class="btn-job btn-primary-job-inv-blue" onClick="">Cancel</button>`;
                            } 
                            chat = chat + ` </div>  </div>`;

                 } else {

                    const ppict = json.usr.photo === "" ? "/photo/default.png" : json.usr.photo.includes("https://")? json.usr.photo: "/photo/"+json.usr.photo;
                    chat = chat +  `<div class="chat-message-right pb-4">
                        <div class="d-none d-lg-block d-md-block">
                            <img src="${ppict}" class="rounded-circle mr-1" alt="" style="height: 45px !important; width: 45px !important;">
                            
                        </div>
                        <div class="flex-shrink-1 <%=bg%> py-2 text-wrap  sender-chat px-3 mr-3">
                            <div class="font-weight-bold mb-1">You</div>
                                ${ dat.content }
                            <div class="text-petit text-light-g text-wrap mt-2">${new Date(dat.createdAt).toLocaleDateString('us-EN', { month: 'short', day: 'numeric', year: 'numeric' }) +' at '+ new Date(dat.createdAt).toLocaleTimeString('us-EN')}</div>
                            <div>
                                ${attachmentsEls}
                            </div>
                        </div>
                        </div>`;
                    }
                }else{
                    if(dat.isQuotation) {
                        var quotation = {};
                        for(const q of json.quotations){
                            if(q._id == dat.quotationId){
                                quotation = q;
                                break;
                            }
                        }
                        const ppict = json.chatUser.photo === "" ? "/photo/default.png" : json.chatUser.photo.includes("https://")? json.chatUser.photo: "/photo/"+json.chatUser.photo;
                        chat = chat + `
                        <div class="chat-message-left pb-4">
                            <div class="d-none d-lg-block d-md-block">
                                <img src="${ppict}" class="rounded-circle mr-1" alt="" style="height: 45px !important; width: 45px !important;">
                            </div>
                            <div class="flex-shrink-1 bg-light-user text-primary text-wrap  round-border py-2 px-3 ml-3">
                                <div class="font-weight-bold mb-1">${json.chatUser.firstName} ${json.chatUser.lastName} </div>
                                <span id="qr-message-${dat.quotationId}"></span>
                                <h5 class="mb-2">New Quotation</h5>
                                <h6><b>${quotation.requestTitle}</b></h6>
                                <p class="mt-0 mb-1">$${quotation.budget} / ${quotation.budgetType} </p> `;
        
                             if(quotation.budgetType === 'Per hour') { 
                                    chat = chat + `
                                    <p class="text-muted small">Time of completion</p>
                                    <p class="mt-0">${quotation.timeOfCompletion}</p> `;
                             }
                             chat = chat + `
                                <hr />
                                <p class="mt-1">${quotation.requestDescription}</p> 
                                <div class="row mt-1 pl-1">
                                    <div class="col-6">
                                        <p class="text-muted small">Category</p>
                                        <p class="mt-0">${quotation.requestCategory}</p> 
                                    </div>
                                    <div class="col-6">
                                        <p class="text-muted small">Deadline</p>
                                        <p class="mt-0">${quotation.deadline}</p> 
                                    </div>
                                </div>
                                <div class="text-muted text-petit text-wrap my-2">${new Date(dat.createdAt).toLocaleDateString('us-EN', { month: 'short', day: 'numeric', year: 'numeric' }) +' at '+ new Date(dat.createdAt).toLocaleTimeString('us-EN')}</div>`;

                            if (quotation.status === 'accepted') { 
                                    chat = chat + `
                                    <i class="success_message">Accepted</i>`;
                            }
                            else if (quotation.status === 'rejected') {
                                chat = chat + `
                                    <i class="error_message">Rejected</i>`;
                            } else {
                                chat = chat + `
                                    <div class="row justify-content-center">
                                        <button class="btn-job btn-primary-job mr-3" onClick="acceptQuotation(${quotation._id})">Accept</button>
                                        <button class="btn-job btn-primary-job-inv-dgr " onClick="rejectQuotation(${quotation._id})">Reject</button>
                                    </div>`;
                            } 
                        chat = chat + "</div> </div>";
                     } else {

                        const  usrPict = json.chatUser.photo.includes('https://')? json.chatUser.photo : '/photo/'+json.chatUser.photo;
                        chat = chat + ` <div class="chat-message-left pb-4">
                            <div class="d-none d-lg-block d-md-block">
                                <img src="${usrPict}" class="rounded-circle mr-1" style="height: 45px !important; width: 45px !important;" alt="${json.chatUser.firstName} ${json.chatUser.lasttName}" width="40" height="40">
                              
                            </div>
                            <div class="flex-shrink-1 <%=bg%> text-primary bg-light-user text-wrap  round-border py-2 px-3 ml-3 ">
                                <div class="font-weight-bold mb-1">${json.chatUser.firstName} ${json.chatUser.lastName}</div>
                                    ${dat.content}
                                <div class="text-muted text-petit text-wrap mt-2">${new Date(dat.createdAt).toLocaleDateString('us-EN', { month: 'short', day: 'numeric', year: 'numeric' }) +' at '+ new Date(dat.createdAt).toLocaleTimeString('us-EN')}</div>
                                <div>
                                    ${attachmentsEls}
                                </div>
                            </div>
                            </div>`;
                     }
                }

            }
            
            chatContent.innerHTML = chat;
            chatContent.scrollTop = chatContent.scrollHeight;
               
            // await new Promise(r => setTimeout(r, 500));
            //$('#message-block').load('/messages #message-block');
        }
        else{
            // console.log("Error occured: "+json.message);
        }
        
      }).catch(err => {
        console.log(err) // Handle errors
        //mess.innerHTML = "Error: "+err;
      });

}

async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: {
            "Access-Control-Allow-Origin" : "*", 
            "Access-Control-Allow-Credentials" : true,
            "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify(data)
    });
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    }else{ return response;}
}

let selectedAttachments = [];

function openAttachmentModal() {
    const input = document.getElementById("attachmentInput");

    input.click();
}

function addAttachment() {
    const input = document.getElementById("attachmentInput");
    selectedAttachments.push(...input.files);
    // console.log(input.files);
    renderAttachments();
}

function removeAttachment(index) {
    selectedAttachments.splice(index, 1); 

    renderAttachments();
}

function renderAttachments() {
    const attachmentListEl = document.getElementById("attachmentList");

    attachmentListEl.innerHTML = "";

    selectedAttachments.forEach((item, index) => {
        const attachment = `
            <div class="mr-4">
                <b class="fa fa-file-text-o mb-1 file-icon" aria-hidden="true"></b>
                <span class="pr-2">${item.name}</span>
                <span class="pfa fa-trash cursor-pointer" role="button" aria-hidden="true" onclick="removeAttachment(${index})"></span>
            </div>`;

        attachmentListEl.innerHTML += attachment;
    });
}


async function acceptQuotation(quotationId) {
    const chatContent = document.getElementById('chat-content');
    const body = {
      quotationId: quotationId
    };
  
    _postData('messages/quotation/accept-quotation', body)
    .then(async json => {
    if(json.status == 200){
        await new Promise(r => setTimeout(r, 2000));
        $('#w-chat-content').load(location.href+' #w-chat-content');
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    else if(json.status == 402){
        await new Promise(r => setTimeout(r, 2000));
        $('#w-chat-content').load(location.href+' #w-chat-content');
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    else{
        // console.log("Error occured. Try again.</p>");
        await new Promise(r => setTimeout(r, 2000));
        //message.innerHTML = "";
        $('#w-chat-content').load(location.href+' #w-chat-content');
        chatContent.scrollTop = chatContent.scrollHeight;
      }
    })
  }

  async function rejectQuotation(quotationId) {
    const chatContent = document.getElementById('chat-content');
    const body = {
      quotationId: quotationId
    };
  
    _postData('messages/quotation/reject-quotation', body)
    .then(async json => {
      if(json.status == 200){
        await new Promise(r => setTimeout(r, 1000));
        $('#w-chat-content').load(location.href+' #w-chat-content');
        chatContent.scrollTop = chatContent.scrollHeight;
  
      }
      else if(json.status == 402){
        $('#w-chat-content').load(location.href+' #w-chat-content');
        chatContent.scrollTop = chatContent.scrollHeight;
      }
      else{
        $('#w-chat-content').load(location.href+' #w-chat-content');
      }
    })
  }