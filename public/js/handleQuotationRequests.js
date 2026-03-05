// Enhanced Quotation Requests Management with Load More Functionality and Multi-Language Support
class QuotationRequestsManager {
    constructor() {
        this.currentType = 'new';
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
        console.log('🌍 Detecting language for quotation requests...');
        
        // Try to get language from URL first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        console.log('URL lang parameter:', urlLang);
        if (urlLang && ['en', 'fr'].includes(urlLang)) {
            console.log('✅ Language detected from URL:', urlLang);
            return urlLang;
        }

        // Check if there's a language in the URL path (like /lang/fr)
        const pathMatch = window.location.pathname.match(/\/lang\/([a-z]{2})/);
        if (pathMatch && ['en', 'fr'].includes(pathMatch[1])) {
            console.log('✅ Language detected from path:', pathMatch[1]);
            return pathMatch[1];
        }

        // Try to get from server-side language variable
        if (typeof window.serverLanguage !== 'undefined' && ['en', 'fr'].includes(window.serverLanguage)) {
            console.log('✅ Language detected from server:', window.serverLanguage);
            return window.serverLanguage;
        }

        // Try to get from localStorage
        const storedLang = localStorage.getItem('language');
        console.log('Stored language in localStorage:', storedLang);
        if (storedLang && ['en', 'fr'].includes(storedLang)) {
            console.log('✅ Language detected from localStorage:', storedLang);
            return storedLang;
        }

        // Try to get from HTML lang attribute
        const htmlLang = document.documentElement.lang;
        console.log('HTML lang attribute:', htmlLang);
        if (htmlLang && ['en', 'fr'].includes(htmlLang)) {
            console.log('✅ Language detected from HTML:', htmlLang);
            return htmlLang;
        }

        // Check if there's a selected language indicator in the DOM
        const activeLanguageLink = document.querySelector('a[href*="/lang/"] .fa-check');
        if (activeLanguageLink) {
            const parentLink = activeLanguageLink.closest('a[href*="/lang/"]');
            if (parentLink) {
                const linkLang = parentLink.href.match(/\/lang\/([a-z]{2})/)?.[1];
                console.log('Active language from DOM:', linkLang);
                if (linkLang && ['en', 'fr'].includes(linkLang)) {
                    console.log('✅ Language detected from active DOM element:', linkLang);
                    return linkLang;
                }
            }
        }

        // Try to get from browser language
        const browserLang = navigator.language.slice(0, 2);
        console.log('Browser language:', browserLang);
        if (['en', 'fr'].includes(browserLang)) {
            console.log('✅ Language detected from browser:', browserLang);
            return browserLang;
        }

        // Default to English
        console.log('⚠️ No language detected, defaulting to English');
        return 'en';
    }

    // Initialize translations object
    initializeTranslations() {
        return {
            en: {
                // General terms
                deadline: 'Deadline',
                category: 'Category',
                status: 'Status',
                submittedOn: 'Submitted on',
                loadMore: 'Load More',
                loading: 'Loading...',
                
                // Quotation actions
                provideQuote: 'Provide Quote',
                viewDetails: 'View Details',
                
                // Status types
                new: 'New',
                pending: 'Pending',
                completed: 'Completed',
                rejected: 'Rejected',
                accepted: 'Accepted',
                
                // Messages
                noQuotationRequestsFound: 'No quotation requests found',
                noQuotationRequestsMessage: "You haven't received any quotation requests yet. Promote your services to get started!",
                updateProfile: 'Update Your Profile',
                errorLoadingQuotations: 'Error loading quotation requests. Please try again.',
            },
            fr: {
                // General terms
                deadline: 'Délai',
                category: 'Catégorie',
                status: 'Statut',
                submittedOn: 'Soumis le',
                loadMore: 'Charger plus',
                loading: 'Chargement...',
                
                // Quotation actions
                provideQuote: 'Fournir un devis',
                viewDetails: 'Voir les détails',
                
                // Status types
                new: 'Nouveau',
                pending: 'En attente',
                completed: 'Terminé',
                rejected: 'Rejeté',
                accepted: 'Accepté',
                
                // Messages
                noQuotationRequestsFound: 'Aucune demande de devis trouvée',
                noQuotationRequestsMessage: "Vous n'avez pas encore reçu de demandes de devis. Faites la promotion de vos services pour commencer !",
                updateProfile: 'Mettre à jour votre profil',
                errorLoadingQuotations: 'Erreur lors du chargement des demandes de devis. Veuillez réessayer.',
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
            console.log('🔄 Quotation requests language updated to:', language);
        }
    }

    // Debug function to show all language detection sources
    debugLanguageDetection() {
        console.log('🔍 Quotation Requests Language Detection Debug:');
        console.log('Current detected language:', this.currentLanguage);
        console.log('URL parameters:', new URLSearchParams(window.location.search).get('lang'));
        console.log('URL path match:', window.location.pathname.match(/\/lang\/([a-z]{2})/)?.[1]);
        console.log('window.serverLanguage:', typeof window.serverLanguage !== 'undefined' ? window.serverLanguage : 'undefined');
        console.log('localStorage:', localStorage.getItem('language'));
        console.log('HTML lang attribute:', document.documentElement.lang);
        console.log('Browser language:', navigator.language);
        console.log('Active DOM language link:', document.querySelector('a[href*="/lang/"] .fa-check')?.closest('a[href*="/lang/"]')?.href);
        return this.currentLanguage;
    }

    // Update active tab styling
    updateActiveTab(type, screen) {
        console.log('🎯 Updating active tab:', type, 'screen:', screen);
        if (screen === 'wide-scr') {
            const tabs = ['new', 'completed', 'rejected', 'accepted', 'all'];
            tabs.forEach(tab => {
                const elementId = `${tab}-quotations`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.classList.remove("active");
                    console.log('🔴 Removed active from:', elementId);
                } else {
                    console.log('❌ Element not found:', elementId);
                }
            });
            
            const activeElementId = `${type}-quotations`;
            const activeElement = document.getElementById(activeElementId);
            if (activeElement) {
                activeElement.classList.add("active");
                console.log('🟢 Added active to:', activeElementId);
            } else {
                console.log('❌ Active element not found:', activeElementId);
            }
        }
        
        // Also update the dropdown for small screens
        const selectElement = document.getElementById("selected_quotation_type");
        if (selectElement && selectElement.value !== type) {
            selectElement.value = type;
        }
    }

    // Get status badge class
    getStatusBadgeClass(status) {
        const statusClasses = {
            'completed': 'badge-success',
            'rejected': 'badge-danger',
            'accepted': 'badge-info',
            'new': 'badge-primary',
            'pending': 'badge-primary'
        };
        return statusClasses[status] || 'badge-primary';
    }

    // Get button for quotation request
    getActionButton(quotation) {
        if (quotation.status === 'new') {
            return `<a class="btn-job btn-primary-job-inv" href="/quotation?q=${quotation._id}">${this.t('provideQuote', 'Provide Quote')}</a>`;
        } else {
            return `<a class="btn-job btn-primary-job-inv-blue" href="/quotation?q=${quotation._id}">${this.t('viewDetails', 'View Details')}</a>`;
        }
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
    }

    // Create quotation request card HTML
    createQuotationCard(quotation, index) {
        const statusBadge = this.getStatusBadgeClass(quotation.status);
        const actionButton = this.getActionButton(quotation);
        
        // Translate status for display
        const translatedStatus = this.t(quotation.status, quotation.status);

        return `
            <div class="col-lg-4 col-md-6 col-12 mt-1 pt-2 request-card" data-request-index="${index}" style="animation: slideInUp 0.5s ease-out ${index * 0.1}s both;">
                <div class="card border-0 bg-light-job rounded-job shadow-job">
                    <div class="card-body p-4">
                        <h6>${quotation.requestTitle}</h6>
                        
                        <div class="mt-3">
                            <span class="d-block job-details">
                                <b class="fa fa-calendar mr-2" aria-hidden="true"></b>
                                ${this.t('deadline', 'Deadline')}: ${quotation.deadline}
                            </span>
                            <span class="d-block job-details">
                                <b class="fa fa-briefcase mr-2" aria-hidden="true"></b>
                                ${this.t('category', 'Category')}: <i>${quotation.category}</i>
                            </span>
                            <span class="d-block job-details">
                                <b class="fa fa-flag mr-2" aria-hidden="true"></b>
                                ${this.t('status', 'Status')}: <span class="badge ${statusBadge}">${translatedStatus}</span>
                            </span>
                        </div>
                        
                        <div class="mt-3 border-bottom pb-4 d-flex justify-content-center">
                            ${actionButton}
                        </div>
                        <div class="">
                            <span class="float-md-right text-small mt-1">
                                ${this.t('submittedOn', 'Submitted on')} ${this.formatDate(quotation.createdAt)}
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

    // Show no quotation requests message
    showNoQuotationsMessage() {
        return `
            <div class="col-12">
                <div class="no-requests-message">
                    <div class="no-requests-icon">
                        <b class="fa fa-file-text-o"></b>
                    </div>
                    <h5>${this.t('noQuotationRequestsFound', 'No quotation requests found')}</h5>
                    <p>${this.t('noQuotationRequestsMessage', "You haven't received any quotation requests yet. Promote your services to get started!")}</p>
                    <a href="/profile" class="btn-job btn-primary-job-inv mt-3">
                        <b class="fa fa-edit mr-2"></b>${this.t('updateProfile', 'Update Your Profile')}
                    </a>
                </div>
            </div>
        `;
    }

    // Main function to get quotation requests
    async getQuotations(type, lim, screen, isLoadMore = false) {
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

            // Fetch quotation requests
            const response = await fetch(`/getquotations?type=${type}&lim=${lim}&skip=${this.currentSkip}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch quotation requests`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            const requestsBox = document.getElementById("requests-container");
            
            // Handle case where API returns quotations directly (backward compatibility)
            const quotations = data.quotations || data;
            const pagination = data.pagination || {
                hasMore: false,
                total: quotations.length,
                nextSkip: null
            };
            
            if (quotations.length === 0 && !isLoadMore) {
                requestsBox.innerHTML = this.showNoQuotationsMessage();
                this.updateLoadMoreButton(false);
                return;
            }

            // Add new quotations to current list
            this.currentRequests = isLoadMore ? [...this.currentRequests, ...quotations] : quotations;

            // Generate HTML for all current quotations
            let content = "";
            this.currentRequests.forEach((quotation, index) => {
                content += this.createQuotationCard(quotation, index);
            });

            requestsBox.innerHTML = content;

            // Update pagination
            this.currentSkip = pagination.nextSkip || this.currentSkip;
            this.updateLoadMoreButton(pagination.hasMore);
            
            console.log(`Loaded ${quotations.length} quotations. Total displayed: ${this.currentRequests.length}. Has more: ${pagination.hasMore}`);

        } catch (error) {
            console.error('Error fetching quotation requests:', error);
            const requestsBox = document.getElementById("requests-container");
            requestsBox.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <b class="fa fa-exclamation-triangle mr-2"></b>
                        ${this.t('errorLoadingQuotations', 'Error loading quotation requests. Please try again.')}
                    </div>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }
}

// Create global instance
const quotationRequestsManager = new QuotationRequestsManager();

// Global functions for backward compatibility
async function getQuotations(type, screen) {
    const limit = 6; // Default limit for enhanced UI
    await quotationRequestsManager.getQuotations(type, limit, screen, false);
}

async function loadMoreQuotations() {
    await quotationRequestsManager.getQuotations(quotationRequestsManager.currentType, quotationRequestsManager.currentLimit, 'wide-scr', true);
}

// Global function to update language
function updateQuotationRequestsLanguage(newLanguage) {
    if (['en', 'fr'].includes(newLanguage)) {
        quotationRequestsManager.setLanguage(newLanguage);
        // Refresh current quotations with new language
        quotationRequestsManager.getQuotations(quotationRequestsManager.currentType, quotationRequestsManager.currentLimit, 'wide-scr', false);
        
        // Update the load more button text
        const loadMoreText = document.getElementById('load-more-text');
        if (loadMoreText) {
            loadMoreText.textContent = quotationRequestsManager.t('loadMore', 'Load More');
        }
        
        console.log(`Quotation requests language updated to: ${newLanguage}`);
    }
}

// Global debug function
function debugQuotationRequestsLanguage() {
    return quotationRequestsManager.debugLanguageDetection();
}

// Handle dropdown change for small screens
document.addEventListener('DOMContentLoaded', function() {
    const selectElement = document.getElementById("selected_quotation_type");
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            getQuotations(this.value, 'small-scr');
        });
    }
    
    // Listen for language changes in the URL
    const currentUrl = new URL(window.location.href);
    const urlLang = currentUrl.searchParams.get('lang');
    if (urlLang && ['en', 'fr'].includes(urlLang)) {
        updateQuotationRequestsLanguage(urlLang);
    }
    
    // Listen for language changes via navigation
    window.addEventListener('popstate', function() {
        const newUrl = new URL(window.location.href);
        const newLang = newUrl.searchParams.get('lang');
        if (newLang && ['en', 'fr'].includes(newLang)) {
            updateQuotationRequestsLanguage(newLang);
        }
    });
    
    // Auto-detect language change if HTML lang attribute changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                const newLang = document.documentElement.lang;
                if (newLang && ['en', 'fr'].includes(newLang)) {
                    updateQuotationRequestsLanguage(newLang);
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