// Enhanced User Requests Management with Load More Functionality
class RequestsManager {
    constructor() {
        this.currentType = 'active';
        this.currentSkip = 0;
        this.currentLimit = 6;
        this.isLoading = false;
        this.hasMore = false;
        this.currentRequests = [];
        this.currentLanguage = this.detectLanguage();
        this.translations = this.initializeTranslations();
    }

    // Detect current language from various sources
    detectLanguage() {
        console.log(' Detecting language...');
        
        // Try to get language from URL first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        console.log('URL lang parameter:', urlLang);
        if (urlLang && ['en', 'fr'].includes(urlLang)) {
            console.log(' Language detected from URL:', urlLang);
            return urlLang;
        }

        // Check if there's a language in the URL path (like /lang/fr)
        const pathMatch = window.location.pathname.match(/\/lang\/([a-z]{2})/);
        if (pathMatch && ['en', 'fr'].includes(pathMatch[1])) {
            console.log(' Language detected from path:', pathMatch[1]);
            return pathMatch[1];
        }

        // Try to get from localStorage
        const storedLang = localStorage.getItem('language');
        console.log('Stored language in localStorage:', storedLang);
        if (storedLang && ['en', 'fr'].includes(storedLang)) {
            console.log(' Language detected from localStorage:', storedLang);
            return storedLang;
        }

        // Try to get from HTML lang attribute
        const htmlLang = document.documentElement.lang;
        console.log('HTML lang attribute:', htmlLang);
        if (htmlLang && ['en', 'fr'].includes(htmlLang)) {
            console.log(' Language detected from HTML:', htmlLang);
            return htmlLang;
        }

        // Try to get from meta tag
        const metaLang = document.querySelector('meta[name="language"]')?.content;
        console.log('Meta language tag:', metaLang);
        if (metaLang && ['en', 'fr'].includes(metaLang)) {
            console.log(' Language detected from meta tag:', metaLang);
            return metaLang;
        }

        // Try to get from server-side language variable
        if (typeof window.serverLanguage !== 'undefined' && ['en', 'fr'].includes(window.serverLanguage)) {
            console.log(' Language detected from server:', window.serverLanguage);
            return window.serverLanguage;
        }

        // Try to get from global variable if available
        if (typeof lang !== 'undefined' && ['en', 'fr'].includes(lang)) {
            console.log(' Language detected from global variable:', lang);
            return lang;
        }

        // Try to get from window.i18n if available
        if (typeof window.i18n !== 'undefined' && window.i18n.language && ['en', 'fr'].includes(window.i18n.language)) {
            console.log(' Language detected from window.i18n:', window.i18n.language);
            return window.i18n.language;
        }

        // Check for language preference in cookies
        const cookieLang = document.cookie.split(';')
            .find(cookie => cookie.trim().startsWith('language='))
            ?.split('=')[1];
        console.log('Cookie language:', cookieLang);
        if (cookieLang && ['en', 'fr'].includes(cookieLang)) {
            console.log(' Language detected from cookie:', cookieLang);
            return cookieLang;
        }

        // Check if there's a selected language indicator in the DOM
        const activeLanguageLink = document.querySelector('a[href*="/lang/"] .fa-check');
        if (activeLanguageLink) {
            const parentLink = activeLanguageLink.closest('a[href*="/lang/"]');
            if (parentLink) {
                const linkLang = parentLink.href.match(/\/lang\/([a-z]{2})/)?.[1];
                console.log('Active language from DOM:', linkLang);
                if (linkLang && ['en', 'fr'].includes(linkLang)) {
                    console.log(' Language detected from active DOM element:', linkLang);
                    return linkLang;
                }
            }
        }

        // Try to get from browser language
        const browserLang = navigator.language.slice(0, 2);
        console.log('Browser language:', browserLang);
        if (['en', 'fr'].includes(browserLang)) {
            console.log(' Language detected from browser:', browserLang);
            return browserLang;
        }

        // Default to English
        console.log(' No language detected, defaulting to English');
        return 'en';
    }

    // Initialize translations object
    initializeTranslations() {
        return {
            en: {
                // General terms
                budget: 'Budget',
                deadline: 'Deadline',
                status: 'Status',
                submittedOn: 'Submitted on',
                loadMore: 'Load More',
                loading: 'Loading...',
                
                // Request actions
                editRequest: 'Edit Request',
                resubmitRequest: 'Resubmit Request',
                viewDetails: 'View Details',
                
                // Status types
                active: 'Active',
                pending: 'Pending',
                completed: 'Completed',
                cancelled: 'Cancelled',
                inProgress: 'In Progress',
                accepted: 'Accepted',
                booked: 'Booked',
                
                // Messages
                noRequestsFound: 'No requests found',
                noRequestsMessage: "You haven't created any service requests yet. Create your first request to get started!",
                createFirstRequest: 'Create Your First Request',
                errorLoadingRequests: 'Error loading requests. Please try again.',
                
                // Budget types
                perProject: 'Per project',
                perHour: 'Per hour'
            },
            fr: {
                // General terms
                budget: 'Budget',
                deadline: 'Délai',
                status: 'Statut',
                submittedOn: 'Soumis le',
                loadMore: 'Charger plus',
                loading: 'Chargement...',
                
                // Request actions
                editRequest: 'Modifier la demande',
                resubmitRequest: 'Resoumettre la demande',
                viewDetails: 'Voir les détails',
                
                // Status types
                active: 'Actif',
                pending: 'En attente',
                completed: 'Terminé',
                cancelled: 'Annulé',
                inProgress: 'En cours',
                accepted: 'Accepté',
                booked: 'Réservé',
                
                // Messages
                noRequestsFound: 'Aucune demande trouvée',
                noRequestsMessage: "Vous n'avez pas encore créé de demandes de service. Créez votre première demande pour commencer !",
                createFirstRequest: 'Créer votre première demande',
                errorLoadingRequests: 'Erreur lors du chargement des demandes. Veuillez réessayer.',
                
                // Budget types
                perProject: 'Par projet',
                perHour: 'Par heure'
            }
        };
    }

    // Get translated text
    t(key, defaultText = '') {
        const translation = this.translations[this.currentLanguage]?.[key];
        return translation || defaultText || key;
    }

    // Update language
    setLanguage(language) {
        if (['en', 'fr'].includes(language)) {
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            console.log(' Language updated to:', language);
        }
    }

    // Debug function to show all language detection sources
    debugLanguageDetection() {
        console.log(' Language Detection Debug:');
        console.log('Current detected language:', this.currentLanguage);
        console.log('URL parameters:', new URLSearchParams(window.location.search).get('lang'));
        console.log('URL path match:', window.location.pathname.match(/\/lang\/([a-z]{2})/)?.[1]);
        console.log('localStorage:', localStorage.getItem('language'));
        console.log('HTML lang attribute:', document.documentElement.lang);
        console.log('Meta language tag:', document.querySelector('meta[name="language"]')?.content);
        console.log('Global lang variable:', typeof lang !== 'undefined' ? lang : 'undefined');
        console.log('window.serverLanguage:', typeof window.serverLanguage !== 'undefined' ? window.serverLanguage : 'undefined');
        console.log('window.i18n:', typeof window.i18n !== 'undefined' ? window.i18n : 'undefined');
        console.log('Browser language:', navigator.language);
        console.log('Active DOM language link:', document.querySelector('a[href*="/lang/"] .fa-check')?.closest('a[href*="/lang/"]')?.href);
        console.log('Cookies:', document.cookie);
        return this.currentLanguage;
    }

    // Update active tab styling
    updateActiveTab(type, screen) {
        if (screen === 'wide-scr') {
            const tabs = ['completed', 'inprogress', 'active', 'cancelled', 'accepted', 'booked', 'all'];
            tabs.forEach(tab => {
                const element = document.getElementById(`${tab === 'inprogress' ? 'inprogress' : tab}-bookings`);
                if (element) {
                    element.classList.remove("active");
                }
            });
            
            const activeElement = document.getElementById(`${type === 'in-progress' ? 'inprogress' : type}-bookings`);
            if (activeElement) {
                activeElement.classList.add("active");
            }
        }
        
        // Also update the dropdown for small screens
        const selectElement = document.getElementById("selected_request_type");
        if (selectElement && selectElement.value !== type) {
            selectElement.value = type;
        }
    }

    // Get status badge class
    getStatusBadgeClass(status) {
        const statusClasses = {
            'completed': 'badge-success',
            'cancelled': 'badge-danger',
            'in-progress': 'badge-warning',
            'active': 'badge-primary',
            'accepted': 'badge-info',
            'booked': 'badge-secondary'
        };
        return statusClasses[status] || 'badge-primary';
    }

    // Get button for request
    getActionButton(request) {
        if (request.status === 'active') {
            return `<a class="btn-job btn-primary-job-inv" href="/manage-request?rq=${request._id}">${this.t('editRequest', 'Edit request')}</a>`;
        } else if (request.status === 'cancelled') {
            return `<a class="btn-job btn-primary-job-inv-blue" href="/manage-request?rq=${request._id}">${this.t('resubmitRequest', 'Resubmit request')}</a>`;
        } else {
            return `<a class="btn-job btn-primary-job-inv-blue" href="/manage-request?rq=${request._id}">${this.t('viewDetails', 'View details')}</a>`;
        }
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
    }

    // Create request card HTML
    createRequestCard(request, index) {
        const classes = ["bg-soft-danger", "bg-soft-base", "bg-soft-warning", "bg-soft-success", "bg-soft-info"];
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const statusBadge = this.getStatusBadgeClass(request.status);
        const actionButton = this.getActionButton(request);
        
        // Translate budget type if needed
        let budgetTypeText = request.budgetType;
        if (request.budgetType === 'Per project') {
            budgetTypeText = this.t('perProject', 'Per project');
        } else if (request.budgetType === 'Per hour') {
            budgetTypeText = this.t('perHour', 'Per hour');
        }

        // Translate status for display
        const statusTranslationKey = request.status === 'in-progress' ? 'inProgress' : request.status;
        const translatedStatus = this.t(statusTranslationKey, request.status);

        return `
            <div class="col-lg-4 col-md-6 col-12 mt-1 pt-2 request-card" data-request-index="${index}" style="animation: slideInUp 0.5s ease-out ${index * 0.1}s both;">
                <div class="card border-0 bg-light-job rounded-job shadow-job">
                    <div class="card-body p-4">
                        <span class="btn btn-sm ${randomClass} cat-job float-md-right mb-3 mb-sm-0">${request.requestCategory}</span>
                        <h6>${request.requestTitle}</h6>
                        
                        <div class="mt-3">
                            <span class="d-block job-details">
                                <b class="fa fa-money mr-2" aria-hidden="true"></b>
                                ${this.t('budget', 'Budget')}: ${request.budget} ${request.currency} - ${budgetTypeText}
                            </span>
                            <span class="d-block job-details">
                                <b class="fa fa-calendar mr-2" aria-hidden="true"></b>
                                ${this.t('deadline', 'Deadline')}: ${request.deadline}
                            </span>
                            <span class="d-block job-details">
                                <b class="fa fa-flag mr-2" aria-hidden="true"></b>
                                ${this.t('status', 'Status')}: <span class="badge ${statusBadge}">${translatedStatus}</span>
                            </span>
                        </div>
                        
                        <div class="mt-3 border-bottom pb-4 d-flex">
                            ${actionButton}
                        </div>
                        <div class="">
                            <span class="float-md-right text-small mt-1">
                                ${this.t('submittedOn', 'Submitted on')} ${this.formatDate(request.lastUpdate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show loading state
    showLoading() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const loadingSpinner = document.getElementById('loading-spinner');
        const loadMoreText = document.getElementById('load-more-text');
        const loadMoreIcon = document.getElementById('load-more-icon');

        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreText.textContent = this.t('loading', 'Loading...');
            loadMoreIcon.style.display = 'none';
            loadingSpinner.style.display = 'inline-block';
        }
        this.isLoading = true;
    }

    // Hide loading state
    hideLoading() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        const loadingSpinner = document.getElementById('loading-spinner');
        const loadMoreText = document.getElementById('load-more-text');
        const loadMoreIcon = document.getElementById('load-more-icon');

        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreText.textContent = this.t('loadMore', 'Load More');
            loadMoreIcon.style.display = 'inline-block';
            loadingSpinner.style.display = 'none';
        }
        this.isLoading = false;
    }

    // Update load more button visibility
    updateLoadMoreButton(hasMore) {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = hasMore ? 'block' : 'none';
        }
        this.hasMore = hasMore;
    }

    // Show no requests message
    showNoRequestsMessage() {
        return `
            <div class="col-12">
                <div class="no-requests-message">
                    <div class="no-requests-icon">
                        <b class="fa fa-file-text-o"></b>
                    </div>
                    <h5>${this.t('noRequestsFound', 'No requests found')}</h5>
                    <p>${this.t('noRequestsMessage', "You haven't created any service requests yet. Create your first request to get started!")}</p>
                    <a href="/service-request" class="btn-job btn-primary-job-inv mt-3">
                        <b class="fa fa-plus mr-2"></b>${this.t('createFirstRequest')}
                    </a>
                </div>
            </div>
        `;
    }

    // Main function to get requests
    async getRequests(type, lim, screen, isLoadMore = false) {
        if (this.isLoading) return;

        try {
            // Reset if it's a new type
            if (!isLoadMore || type !== this.currentType) {
                this.currentSkip = 0;
                this.currentRequests = [];
                this.currentType = type;
            }

            this.showLoading();
            this.updateActiveTab(type, screen);

            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.set('type', type);
            window.history.replaceState(null, null, url);

            // Fetch requests
            const response = await fetch(`/getrequests?type=${type}&lim=${lim}&skip=${this.currentSkip}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch requests`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            const requestsBox = document.getElementById("requests-container");
            
            // Handle case where API returns requests directly (backward compatibility)
            const requests = data.requests || data;
            const pagination = data.pagination || {
                hasMore: false,
                total: requests.length,
                nextSkip: null
            };
            
            if (requests.length === 0 && !isLoadMore) {
                requestsBox.innerHTML = this.showNoRequestsMessage();
                this.updateLoadMoreButton(false);
                return;
            }

            // Add new requests to current list
            this.currentRequests = isLoadMore ? [...this.currentRequests, ...requests] : requests;

            // Generate HTML for all current requests
            let content = "";
            this.currentRequests.forEach((request, index) => {
                content += this.createRequestCard(request, index);
            });

            requestsBox.innerHTML = content;

            // Update pagination
            this.currentSkip = pagination.nextSkip || this.currentSkip;
            this.updateLoadMoreButton(pagination.hasMore);
            
            console.log(`Loaded ${requests.length} requests. Total displayed: ${this.currentRequests.length}. Has more: ${pagination.hasMore}`);

        } catch (error) {
            console.error('Error fetching requests:', error);
            const requestsBox = document.getElementById("requests-container");
            requestsBox.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <b class="fa fa-exclamation-triangle mr-2"></b>
                        ${this.t('errorLoadingRequests', 'Error loading requests. Please try again.')}
                    </div>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }
}

// Create global instance
const requestsManager = new RequestsManager();

// Global functions for backward compatibility
async function getRequests(type, lim, screen) {
    await requestsManager.getRequests(type, lim, screen, false);
}

async function loadMoreRequests() {
    await requestsManager.getRequests(requestsManager.currentType, requestsManager.currentLimit, 'wide-scr', true);
}

// Global function to update language
function updateRequestsLanguage(newLanguage) {
    if (['en', 'fr'].includes(newLanguage)) {
        requestsManager.setLanguage(newLanguage);
        // Refresh current requests with new language
        requestsManager.getRequests(requestsManager.currentType, requestsManager.currentLimit, 'wide-scr', false);
        
        // Update the load more button text
        const loadMoreText = document.getElementById('load-more-text');
        if (loadMoreText) {
            loadMoreText.textContent = requestsManager.t('loadMore', 'Load More');
        }
        
        console.log(`Language updated to: ${newLanguage}`);
    }
}

// Global debug function
function debugRequestsLanguage() {
    return requestsManager.debugLanguageDetection();
}

// Handle dropdown change for small screens
document.addEventListener('DOMContentLoaded', function() {
    const selectElement = document.getElementById("selected_request_type");
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            getRequests(this.value, 6, 'small-scr');
        });
    }
    
    // Listen for language changes in the URL
    const currentUrl = new URL(window.location.href);
    const urlLang = currentUrl.searchParams.get('lang');
    if (urlLang && ['en', 'fr'].includes(urlLang)) {
        updateRequestsLanguage(urlLang);
    }
    
    // Listen for language changes via navigation
    window.addEventListener('popstate', function() {
        const newUrl = new URL(window.location.href);
        const newLang = newUrl.searchParams.get('lang');
        if (newLang && ['en', 'fr'].includes(newLang)) {
            updateRequestsLanguage(newLang);
        }
    });
    
    // Auto-detect language change if HTML lang attribute changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                const newLang = document.documentElement.lang;
                if (newLang && ['en', 'fr'].includes(newLang)) {
                    updateRequestsLanguage(newLang);
                }
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
    });
});

// Helper function for backward compatibility
function _(element) {
    return document.getElementById(element);
}

// Add CSS animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);