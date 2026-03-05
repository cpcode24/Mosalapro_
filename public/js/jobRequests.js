
// The autocomplete functionality is now handled by the AutoComplete class
// This file only contains the helper functions and filtering logic
function _(element){return document.getElementById(element); }

// Translation function for client-side use
function t(key, lang) {
    // Check if translations are available from the page
    if (window.translations && window.translations[key]) {
        return window.translations[key];
    }
    if (lang  === 'fr') {
        const fallbacks = {
            'NoServiceRequestFoundIn': 'Aucun demande de service trouvée dans',
            'Budget': 'Budget',
            'Deadline': 'Délai',
            'ViewJobDetailsAndApply': 'Voir les détails et postuler',
            'PostedOn': 'Publié le'
        };
        
        return fallbacks[key] || key;
    }
    // Fallback to hardcoded English if translations not available
    const fallbacks = {
        'NoServiceRequestFoundIn': 'No service request found in',
        'Budget': 'Budget',
        'Deadline': 'Deadline',
        'ViewJobDetailsAndApply': 'View job details and apply',
        'PostedOn': 'Posted on'
    };
    
    return fallbacks[key] || key;
}

async function filterRequestsByCat(){
    const categoryInput = document.getElementById("selected_category");
    const categoryValue = categoryInput.getAttribute('data-value') || categoryInput.value || 'all';

    const url = new URL(window.location.href);
    url.searchParams.set('category', categoryValue);
    window.history.replaceState(null, null, url);

    const res = await fetch(`/get-service-requests?category=${categoryValue}`);
    const results = await res.json();
    const filteredJrs = results.result;
    const convCurrs = results.convCurrs;
    const lang = results.lang || 'en';
    //alert("Res: "+filteredJrs);
    const container = document.getElementById("requestsRow");
    var rowContent = "";
    const classes = ["bg-soft-danger", "bg-soft-base", "bg-soft-warning", "bg-soft-success", "bg-soft-info"]; 
    if(filteredJrs.length == 0){
        rowContent = `<div class="col py-4"><center><h6 class="text-light text-muted mt-4 mb-4">${t('NoServiceRequestFoundIn', lang)} ${categoryValue}.</h6></center></div>`;
    }
    else {
        let i = 0;
        for(const fjr of filteredJrs){
            const req = `
                <div class="col-lg-4 col-md-6 col-12 mt-1 pt-2">
                    <div class="card border-0 bg-light-job rounded-job shadow-job">
                        <div class="card-body p-4">
                            <span class="btn btn-sm ${classes[Math.floor(Math.random() * 5)]} cat-job float-md-right mb-3 mb-sm-0">${fjr.requestCategory }</span>
                            <h6>${fjr.requestTitle}</h6>
                            <div class="mt-3">
                                <span class="d-block job-details"><b class="fa fa-money mr-2" aria-hidden="true"></b>  ${t('Budget', lang)}: ${fjr.budget} ${fjr.currency} ${convCurrs[i]} - ${fjr.budgetType}</span>
                                <span class="d-block job-details"><b class="fa fa-calendar mr-2" aria-hidden="true"></b> ${t('Deadline', lang)}: ${fjr.deadline}</span>
                            </div>
                            <div class="mt-3 border-bottom pb-4 d-flex ">
                                <a class="btn-job btn-primary-job-inv" href="/sr-details/${fjr._id}">${t('ViewJobDetailsAndApply', lang)}</a>
                            </div>
                            <div class="">
                                <span class="float-md-right text-small mt-1">${t('PostedOn', lang)} ${new Date(fjr.createdAt).getUTCMonth() + 1}/${new Date(fjr.createdAt).getUTCDate()}/${new Date(fjr.createdAt).getUTCFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            rowContent = rowContent + req;
            i++;
        }
    }
    container.innerHTML = rowContent;

}