async function getRequests(type, screen){

  if(screen === 'wide-scr'){
    const completed = document.getElementById("completed-bookings");
    const inprogress = document.getElementById("inprogress-bookings");
    const active = document.getElementById("active-bookings");
    const cancelled = document.getElementById("cancelled-bookings");
    const accepted = document.getElementById("accepted-bookings");
    const all = document.getElementById("all-bookings");
    if(type=="all"){
      completed.classList.remove("active");
      cancelled.classList.remove("active");
      active.classList.remove("active");
      accepted.classList.remove("active");
      all.classList.add("active");
      inprogress.classList.remove("active");
    }
    else if(type=="active"){
      completed.classList.remove("active");
      cancelled.classList.remove("active");
      active.classList.add("active");
      accepted.classList.remove("active");
      all.classList.remove("active");
      inprogress.classList.remove("active");
    }
    else if(type=="in-progress"){
      inprogress.classList.add("active");
      completed.classList.remove("active");
      cancelled.classList.remove("active");
      active.classList.remove("active");
      accepted.classList.remove("active");
      all.classList.remove("active");
    }
    else if(type=="cancelled"){
      completed.classList.remove("active");
      cancelled.classList.add("active");
      active.classList.remove("active");
      accepted.classList.remove("active");
      all.classList.remove("active");
      inprogress.classList.remove("active");
    }
    else if(type=="completed"){
      completed.classList.add("active");
      cancelled.classList.remove("active");
      active.classList.remove("active");
      accepted.classList.remove("active");
      all.classList.remove("active");
      inprogress.classList.remove("active");
    }
    else if(type=="accepted"){
      completed.classList.remove("active");
      cancelled.classList.remove("active");
      active.classList.remove("active");
      accepted.classList.add("active");
      all.classList.remove("active");
      inprogress.classList.remove("active");
    }
  }

  const url = new URL(window.location.href);
  url.searchParams.set('type', type);
  window.history.replaceState(null, null, url); 
  const res = await fetch(`/getbookings?type=${type}`);
  const results = await res.json();
  const bookings = results.bookings;
  const convCurrs = results.convCurrs;
  const bookingsBox = document.getElementById("requests-container");
  bookingsBox.innerHTML = "";
  let content = "";
  if(bookings.length == 0)
        bookingsBox.innerHTML = '<div class="d-flex justify-content-center"><h6 class="text-light text-muted align-items-center">No booking found!</h6></div>';
  else{
    const classes = ["bg-soft-danger", "bg-soft-base", "bg-soft-warning", "bg-soft-success", "bg-soft-info"];
    let i = 0;
    for(const booking of bookings) {
      let date = booking.createdAt.split("-");
      let partHtml = "";
      if(booking.status == "active")
        partHtml = `<a class="btn-job btn-primary-job-inv" href="/booking?b=${booking._id}">Manage booking</a>`;
      else
        partHtml = `<a class="btn-job btn-primary-job-inv-blue" href="/booking?b=${booking._id}">View details</a>`
        const reqt =  `
            <div class="col-lg-4 col-md-6 col-12 mt-1 pt-2">
              <div class="card border-0 bg-light-job rounded-job shadow-job">
                  <div class="card-body p-4">
                  <h6>${ booking.bookingTitle }</h6>
                  <div class="mt-1">
                      <span class="d-block job-details"><b class="fa fa-money mr-2" aria-hidden="true"></b>  Budget: ${booking.budget} ${booking.currency} ${convCurrs[i]} - ${ booking.budgetType}</span>
                      <span class="d-block job-details"><b class="fa fa-calendar mr-2" aria-hidden="true"></b> Deadline: ${ booking.deadline }</span>
                      <span class="d-block job-details"><b class="fa fa-briefcase mr-2" aria-hidden="true"></b> Category: <i> ${ booking.category }</i></span>
                  </div>
                  <div class="mt-3 border-bottom pb-4 d-flex justify-content-center">`+partHtml+


                      
                  ` </div>
                      <div class=""><span class="float-md-right text-small mt-1">Submitted on ${date[1]}/${date[2].substr(0,2)}/${date[0]}</span></div>
                  </div>
              
              </div>
            </div>
            `;
        content = content + reqt;
        i = i+1;
      }
      bookingsBox.innerHTML = content;
    } 
    
}

_("selected_req_type").onchange = function(){
  getRequests(_("selected_req_type").value, 'small-scr');
}
function _(element){return document.getElementById(element); }