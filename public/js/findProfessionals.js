const input = document.getElementById("search");
input.addEventListener("keyup", getKey);

let page = 1;
let mode = "line";
let totalPages = 1;

const setPage = async (pages, pageNum) => {
  if(pageNum < 1 || pageNum > pages) return;
  
  page = pageNum;
  totalPages = pages;
  
  // Update active page in pagination
  updatePaginationUI();
  
  if(mode == "line")
    handleSearch();
  else  
    handleSearchMD();
}

const updatePaginationUI = () => {
  // Remove active class from all pages
  for(let i = 1; i <= totalPages; i++){
    const pg = document.getElementById(`${i}`);
    if(pg) pg.classList.remove("active");
  }
  
  // Add active class to current page
  const currentPageEl = document.getElementById(`${page}`);
  if(currentPageEl) currentPageEl.classList.add("active");
}

const nextPage = (pages) => {
  if (page < pages) {
    setPage(pages, page + 1);
  } 
}

const prevPage = (pages) => {
  if (page > 1) {
    setPage(pages, page - 1);
  } 
}
 

function getKey(e) {
  //if(e.code == 'Enter'){
    if(mode == "line")
    handleSearch();
  else  
    handleSearchMD();
  //}
}

// Input change handlers for autocomplete inputs
function _(element){return document.getElementById(element); }

// Add change event listeners for autocomplete inputs
document.addEventListener('DOMContentLoaded', function() {
  const countryInput = _('country_search');
  const cityInput = _('city_search');
  const categoryInput = _('selected_category');

  if (countryInput) {
    countryInput.addEventListener('change', function() {
      if(mode == "line")
        handleSearch();
      else  
        handleSearchMD();
    });
  }

  if (cityInput) {
    cityInput.addEventListener('change', function() {
      if(mode == "line")
        handleSearch();
      else  
        handleSearchMD();
    });
  }

  if (categoryInput) {
    categoryInput.addEventListener('change', function() {
      if(mode == "line")
        handleSearch();
      else  
        handleSearchMD();
    });
  }
});
    

// search result based on filters
const prepareProfessionalsSearch = () => {
  const country = document.getElementById("country_search");
  const city = document.getElementById("city_search");
  const search = document.getElementById("search");
  const category = document.getElementById("selected_category");

  const params = new URLSearchParams(window.location.search);
  const countryParam = !params.get("country_search") || params.get("country_search") === "Country" ? "" : params.get("country_search");
  const cityParam = !params.get("city_search") || params.get("city_search") === "Select City" ? "" : params.get("city_search");
  const searchParam = !params.get("search") || params.get("search") === "" ? "" : params.get("search");
  const categoryParam = !params.get("selected_category") || params.get("selected_category") === "" ? "" : params.get("selected_category");
  
  country.value = countryParam;
  category.value = categoryParam;
  city.value = cityParam;
  
  // Trigger autocomplete value updates
  if (countryParam) {
    country.setAttribute('data-value', countryParam);
  }
  if (cityParam) {
    city.setAttribute('data-value', cityParam);
  }
  if (categoryParam) {
    category.setAttribute('data-value', categoryParam);
  }
  
  // Trigger search after a short delay to allow autocomplete to initialize
  setTimeout(() => {
    handleSearch();
  }, 1000);
  
  search.value = searchParam;
}

prepareProfessionalsSearch();

const handleSearch = async () => {
  const params = new URLSearchParams(window.location.search);
  const country = document.getElementById("country_search");
  const city = document.getElementById("city_search");
  const search = document.getElementById("search");
  const categoryParam = document.getElementById("selected_category");
  
  // Get values from autocomplete inputs, preferring data-value attribute
  const categoryValue = categoryParam.getAttribute('data-value') || categoryParam.value;
  const countryValue = country.getAttribute('data-value') || country.value;
  const cityValue = city.getAttribute('data-value') || city.value;
  const searchValue = search.value;
  
  if( categoryValue != "" || countryValue != "" || cityValue != "" || searchValue != "")
    page = 1; 
    
  const url = new URL(window.location.href);
  url.searchParams.set('selected_category', categoryValue);
  url.searchParams.set('country_search', countryValue);
  url.searchParams.set('city_search', cityValue);
  url.searchParams.set('search', searchValue);
  url.searchParams.set('page', page);

  window.history.replaceState(null, null, url); 
  
  const res = await fetch(`/find-professionals?selected_category=${encodeURIComponent(categoryValue)}&country_search=${encodeURIComponent(countryValue)}&city_search=${encodeURIComponent(cityValue)}&search=${encodeURIComponent(searchValue)}&page=${page}`);
  
  const data = await res.json();
  const professionals = data.results || data;
  const lang = data.lang;
  const pagination = data.pagination || {};
  const classes = ["bg-soft-danger", "bg-soft-base", "bg-soft-warning", "bg-soft-success", "bg-soft-info"];

  const professionalsBox = document.getElementById("professionals-box");
  const paging = document.getElementById("paging");
  const resultCount = document.getElementById("result-count");
  
  professionalsBox.innerHTML = "";
  let content = "";
  if(professionals.length == 0){
        professionalsBox.innerHTML = '<div class="d-flex justify-content-center align-items-center"><h6 class="text-light text-muted">No service provider found!</h6></div>';
        if(paging) paging.innerHTML = "";
        if(resultCount) resultCount.innerHTML = "No professionals found";
  }else{
    // Update result count display
    const total = pagination.total || professionals.length;
    const currentPage = pagination.currentPage || page;
    const startResult = ((currentPage - 1) * 10) + 1;
    const endResult = Math.min(currentPage * 10, total);
    
    if(resultCount) {
      resultCount.innerHTML = `Showing ${startResult}-${endResult} of ${total} professionals`;
    }
    
    // Update pagination if provided
    if(pagination.pages && pagination.pages > 1) {
      generatePagination(pagination.pages, pagination.currentPage || page);
    } else if (professionals.length < 10 && page <=1 && paging) {
      paging.innerHTML = "";
    }
    const loc = lang === 'fr' ? 'Localisation' : 'Location';
    for(const prof of professionals) {
      
            const pict =  prof.photo && prof.photo.includes("https://") ? prof.photo : "/photo/"+(prof.photo || 'default.png');
            
            const item = `
            <tr>
            <td>
                <div class="widget-26-job-emp-img">
                    <img src="${pict}" alt="Company" onerror="this.src='/photo/default.png'" />
                </div>
            </td>
            <td>
                <div class="widget-26-job-title">
                    <a href="/pro-profile/${prof._id}">${prof.firstName} ${prof.lastName ? prof.lastName: "" }</a>
                    <p class="m-0">${prof.role ? prof.role : ""}</p>
                </div>
            </td>
            <td>
                <div class="widget-26-job-info">
                    <p class="type m-0">${loc}</p>
                    <p class="text-muted m-0">in <span class="location">${prof.city}, ${prof.country}</span></p>
                </div>
            </td>
           
            <td>
                <div class="widget-26-job-category ${classes[Math.floor(Math.random() * 5)]}">
                    <b class="fa fa-briefcase mr-2"></b>
                    <span>${ prof.category}</span>
                </div>
            </td>
            <td>
               
            </td>
            </tr>`
            content = content + item;
        
    }

    professionalsBox.innerHTML = content;
  }
}

const generatePagination = (pages, currentPage) => {
  const paging = document.getElementById("paging");
  if(!paging) return;
  
  totalPages = pages;
  page = currentPage;
  
  let paginationHTML = `
    <nav class="d-flex justify-content-center">
      <ul class="pagination pagination-base pagination-boxed pagination-square mb-0">
        <li class="page-item page-link no-border ${currentPage <= 1 ? 'disabled' : ''}" onclick="${currentPage > 1 ? `prevPage(${pages})` : ''}">
          <span aria-hidden="true">«</span>
        </li>`;
        
  // Show all pages (keep original simple style)
  for(let i = 1; i <= pages; i++) {
    paginationHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}" id="${i}" onclick="setPage(${pages}, ${i})">
        <span class="page-link no-border">${i}</span>
      </li>`;
  }
  
  paginationHTML += `
        <li class="page-item page-link no-border ${currentPage >= pages ? 'disabled' : ''}" onclick="${currentPage < pages ? `nextPage(${pages})` : ''}">
          <span aria-hidden="true">»</span>
        </li>
      </ul>
    </nav>`;
    
  paging.innerHTML = paginationHTML;
}

const handleSearchMD = async () => {
  mode = "square";
  const params = new URLSearchParams(window.location.search);
  const country = document.getElementById("country_search");
  const city = document.getElementById("city_search");
  const search = document.getElementById("search");
  const categoryParam = document.getElementById("selected_category");
  
  // Get values from autocomplete inputs, preferring data-value attribute
  const categoryValue = categoryParam.getAttribute('data-value') || categoryParam.value;
  const countryValue = country.getAttribute('data-value') || country.value;
  const cityValue = city.getAttribute('data-value') || city.value;
  const searchValue = search.value;
  
  const url = new URL(window.location.href);
  url.searchParams.set('selected_category', categoryValue);
  url.searchParams.set('country_search', countryValue);
  url.searchParams.set('city_search', cityValue);
  url.searchParams.set('search', searchValue);
  url.searchParams.set('page', page);

  window.history.replaceState(null, null, url); 
  
  const res = await fetch(`/find-professionals?selected_category=${encodeURIComponent(categoryValue)}&country_search=${encodeURIComponent(countryValue)}&city_search=${encodeURIComponent(cityValue)}&search=${encodeURIComponent(searchValue)}&page=${page}`);
  const data = await res.json();
  const professionals = data.results || data;
  const pagination = data.pagination || {};

  const professionalsBox = document.getElementById("professionals-box");
  const resultCount = document.getElementById("result-count");
  
  professionalsBox.innerHTML = "";
  let content = '<div class="row">';
  if(professionals.length == 0){
        professionalsBox.innerHTML = '<div class="d-flex justify-content-center align-items-center"><h6 class="text-light text-muted">No service provider found!</h6></div>';
        if(resultCount) resultCount.innerHTML = "No professionals found";
  }else{
    // Update result count display
    const total = pagination.total || professionals.length;
    const currentPage = pagination.currentPage || page;
    const startResult = ((currentPage - 1) * 10) + 1;
    const endResult = Math.min(currentPage * 10, total);
    
    if(resultCount) {
      resultCount.innerHTML = `Showing ${startResult}-${endResult} of ${total} professionals`;
    }
    
    // Update pagination if provided
    if(pagination.pages && pagination.pages > 1) {
      generatePagination(pagination.pages, pagination.currentPage || page);
    }
    
    it = 0;
    for(const prof of professionals) {
            const pict = prof.photo === "" || !prof.photo ? "photo/default.png" : prof.photo.includes("https://")? prof.photo: "/photo/"+prof.photo;
            const item = `
            <div class="col-lg-3">
                        <div class="text-center card-box-pro">
                        <div class="member-card pt-2 pb-2">
                        <div class="thumb-lg member-thumb mx-auto"><img src="${pict}" class="rounded-circle img-thumbnail" alt="profile-image" style="height: 6.5em !important; width: 10em !important;" onerror="this.src='/photo/default.png'"></div>
                        <div class="">
                        <h6><a href="/pro-profile/${prof._id}">${prof.firstName} ${prof.lastName || '' }</a></h6>
                        <span class="text-muted ">${prof.role || 'Professional'} </span>
                        
                        </div>
                        <ul class="social-links list-inline">
                          <li class="text-muted m-0">in <span class="location">${prof.city}, ${prof.country}</span></li>
                        </ul>
                        <a href="/pro-profile/${prof._id}"><button type="button" class="btn button-primary mt-2 ">Message Now</button></a>
                        <div class="mt-4">
                        </div>
                        </div>
                        </div>
                        </div>`;
            content = content + item;
            it = it + 1;

            if(it % 4  == 0)
              content = content + '</div><div class="row">';
    }
    professionalsBox.innerHTML = content;
  }
}