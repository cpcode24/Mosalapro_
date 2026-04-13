// Enhanced Job Applications Management with Load More Functionality and Multi-Language Support
class JobApplicationsManager {
    constructor() {
        this.currentType = 'active';
        this.currentSkip = 0;
        this.currentLimit = 6;
        this.isLoading = false;
        this.hasMore = false;
        this.currentApplications = [];
        this.currentLanguage = this.detectLanguage();
        this.translations = this.initializeTranslations();
    }

    // Detect current language from various sources
    detectLanguage() {
        console.log(' Detecting language for job applications...');
        
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

        // Try to get from server-side language variable
        if (typeof window.serverLanguage !== 'undefined' && ['en', 'fr'].includes(window.serverLanguage)) {
            console.log(' Language detected from server:', window.serverLanguage);
            return window.serverLanguage;
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
                appliedOn: 'Applied on',
                loadMore: 'Load More',
                loading: 'Loading...',
                
                // Application actions
                manageApplication: 'Manage Application',
                viewDetails: 'View Details',
                
                // Status types
                active: 'Active',
                applied: 'Applied',
                hired: 'Hired',
                cancelled: 'Cancelled',
                
                // Budget types
                perProject: 'Per project',
                perHour: 'Per hour',
                
                // Messages
                noApplicationsFound: 'No applications found',
                noApplicationsMessage: "You haven't applied to any jobs yet. Start exploring opportunities!",
                exploreJobs: 'Explore Jobs',
                errorLoadingApplications: 'Error loading applications. Please try again.',
            },
            fr: {
                // General terms
                budget: 'Budget',
                deadline: 'Délai',
                status: 'Statut',
                appliedOn: 'Appliqué le',
                loadMore: 'Charger plus',
                loading: 'Chargement...',
                
                // Application actions
                manageApplication: 'Gérer la candidature',
                viewDetails: 'Voir les détails',
                
                // Status types
                active: 'Actif',
                applied: 'Appliqué',
                hired: 'Embauché',
                cancelled: 'Annulé',
                
                // Budget types
                perProject: 'Par projet',
                perHour: 'Par heure',
                
                // Messages
                noApplicationsFound: 'Aucune candidature trouvée',
                noApplicationsMessage: "Vous n'avez pas encore postulé à des emplois. Commencez à explorer les opportunités !",
                exploreJobs: 'Explorer les emplois',
                errorLoadingApplications: 'Erreur lors du chargement des candidatures. Veuillez réessayer.',
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
            console.log(' Job applications language updated to:', language);
        }
    }

    // Debug function to show all language detection sources
    debugLanguageDetection() {
        console.log(' Job Applications Language Detection Debug:');
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
        console.log(' Updating active tab:', type, 'screen:', screen);
        if (screen === 'wide-scr') {
            const tabs = ['active', 'hired', 'cancelled', 'all'];
            tabs.forEach(tab => {
                const elementId = `${tab}-ja`;
                const element = document.getElementById(elementId);
                if (element) {
                    element.classList.remove("active");
                    console.log(' Removed active from:', elementId);
                } else {
                    console.log(' Element not found:', elementId);
                }
            });
            
            const activeElementId = `${type}-ja`;
            const activeElement = document.getElementById(activeElementId);
            if (activeElement) {
                activeElement.classList.add("active");
                console.log(' Added active to:', activeElementId);
            } else {
                console.log(' Active element not found:', activeElementId);
            }
        }
        
        // Also update the dropdown for small screens
        const selectElement = document.getElementById("selected_ja_type");
        if (selectElement && selectElement.value !== type) {
            selectElement.value = type;
        }
    }

    // Get status badge class
    getStatusBadgeClass(status) {
        const statusClasses = {
            'hired': 'badge-success',
            'cancelled': 'badge-danger',
            'applied': 'badge-primary',
            'active': 'badge-primary'
        };
        return statusClasses[status] || 'badge-primary';
    }

    // Get button for application
    getActionButton(application) {
        if (application.appStatus === 'applied') {
            return `<a class="btn-job btn-primary-job-inv" href="/job-application/${application._id}">${this.t('manageApplication', 'Manage Application')}</a>`;
        } else {
            return `<a class="btn-job btn-primary-job-inv-blue" href="/job-application/${application._id}">${this.t('viewDetails', 'View Details')}</a>`;
        }
    }

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
    }

    // Create application card HTML
    createApplicationCard(application, index, convCurr = '') {
        const classes = ["bg-soft-danger", "bg-soft-base", "bg-soft-warning", "bg-soft-success", "bg-soft-info"];
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const statusBadge = this.getStatusBadgeClass(application.appStatus);
        const actionButton = this.getActionButton(application);
        
        // Translate budget type if needed
        let budgetTypeText = application.budgetType;
        if (application.budgetType === 'Per project') {
            budgetTypeText = this.t('perProject', 'Per project');
        } else if (application.budgetType === 'Per hour') {
            budgetTypeText = this.t('perHour', 'Per hour');
        }

        // Translate status for display
        const translatedStatus = this.t(application.appStatus, application.appStatus);

        return `
            <div class="col-lg-4 col-md-6 col-12 mt-1 pt-2 application-card" data-application-index="${index}" style="animation: slideInUp 0.5s ease-out ${index * 0.1}s both;">
                <div class="card border-0 bg-light-job rounded-job shadow-job">
                    <div class="card-body p-4">
                        <span class="btn btn-sm ${randomClass} cat-job float-md-right mb-3 mb-sm-0">${application.requestCategory}</span>
                        <h6>${application.requestTitle}</h6>
                        
                        <div class="mt-3">
                            <span class="d-block job-details">
                                <b class="fa fa-money mr-2" aria-hidden="true"></b>
                                ${this.t('budget', 'Budget')}: ${application.budget} ${application.currency} ${convCurr} - ${budgetTypeText}
                            </span>
                            <span class="d-block job-details">
                                <b class="fa fa-briefcase mr-2" aria-hidden="true"></b>
                                ${this.t('deadline', 'Deadline')}: ${application.deadline}
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
                                ${this.t('appliedOn', 'Applied on')} ${this.formatDate(application.createdAt)}
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

    // Show no applications message
    showNoApplicationsMessage() {
        return `
            <div class="col-12">
                <div class="no-requests-message">
                    <div class="no-requests-icon">
                        <b class="fa fa-briefcase"></b>
                    </div>
                    <h5>${this.t('noApplicationsFound', 'No applications found')}</h5>
                    <p>${this.t('noApplicationsMessage', "You haven't applied to any jobs yet. Start exploring opportunities!")}</p>
                    <a href="/services" class="btn-job btn-primary-job-inv mt-3">
                        <b class="fa fa-search mr-2"></b>${this.t('exploreJobs', 'Explore Jobs')}
                    </a>
                </div>
            </div>
        `;
    }

    // Main function to get applications
    async getApplications(type, lim, screen, isLoadMore = false) {
        if (this.isLoading) return;

        try {
            // Reset if it's a new type
            if (!isLoadMore || type !== this.currentType) {
                this.currentSkip = 0;
                this.currentApplications = [];
                this.currentType = type;
            }

            this.showLoading();
            this.updateActiveTab(type, screen);

            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.set('type', type);
            window.history.replaceState(null, null, url);

            // Fetch applications
            const response = await fetch(`/get-applications?type=${type}&lim=${lim}&skip=${this.currentSkip}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch applications`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            const applicationsBox = document.getElementById("applications-container");
            
            // Handle case where API returns applications directly (backward compatibility)
            const applications = data.uniqJAs || data;
            const convCurrs = data.convCurrs || [];
            const pagination = data.pagination || {
                hasMore: false,
                total: applications.length,
                nextSkip: null
            };
            
            if (applications.length === 0 && !isLoadMore) {
                applicationsBox.innerHTML = this.showNoApplicationsMessage();
                this.updateLoadMoreButton(false);
                return;
            }

            // Add new applications to current list
            this.currentApplications = isLoadMore ? [...this.currentApplications, ...applications] : applications;

            // Generate HTML for all current applications
            let content = "";
            this.currentApplications.forEach((application, index) => {
                const convCurr = convCurrs[index] || '';
                content += this.createApplicationCard(application, index, convCurr);
            });

            applicationsBox.innerHTML = content;

            // Update pagination
            this.currentSkip = pagination.nextSkip || this.currentSkip;
            this.updateLoadMoreButton(pagination.hasMore);
            
            console.log(`Loaded ${applications.length} applications. Total displayed: ${this.currentApplications.length}. Has more: ${pagination.hasMore}`);

        } catch (error) {
            console.error('Error fetching applications:', error);
            const applicationsBox = document.getElementById("applications-container");
            applicationsBox.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        <b class="fa fa-exclamation-triangle mr-2"></b>
                        ${this.t('errorLoadingApplications', 'Error loading applications. Please try again.')}
                    </div>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }
}

// Create global instance
const jobApplicationsManager = new JobApplicationsManager();

// Global functions for backward compatibility
async function getApplications(type, screen) {
    const limit = 6; // Default limit for enhanced UI
    await jobApplicationsManager.getApplications(type, limit, screen, false);
}

async function loadMoreApplications() {
    await jobApplicationsManager.getApplications(jobApplicationsManager.currentType, jobApplicationsManager.currentLimit, 'wide-scr', true);
}

// Global function to update language
function updateJobApplicationsLanguage(newLanguage) {
    if (['en', 'fr'].includes(newLanguage)) {
        jobApplicationsManager.setLanguage(newLanguage);
        // Refresh current applications with new language
        jobApplicationsManager.getApplications(jobApplicationsManager.currentType, jobApplicationsManager.currentLimit, 'wide-scr', false);
        
        // Update the load more button text
        const loadMoreText = document.getElementById('load-more-text');
        if (loadMoreText) {
            loadMoreText.textContent = jobApplicationsManager.t('loadMore', 'Load More');
        }
        
        console.log(`Job applications language updated to: ${newLanguage}`);
    }
}

// Global debug function
function debugJobApplicationsLanguage() {
    return jobApplicationsManager.debugLanguageDetection();
}

// Handle dropdown change for small screens
document.addEventListener('DOMContentLoaded', function() {
    const selectElement = document.getElementById("selected_ja_type");
    if (selectElement) {
        selectElement.addEventListener('change', function() {
            getApplications(this.value, 'small-scr');
        });
    }
    
    // Listen for language changes in the URL
    const currentUrl = new URL(window.location.href);
    const urlLang = currentUrl.searchParams.get('lang');
    if (urlLang && ['en', 'fr'].includes(urlLang)) {
        updateJobApplicationsLanguage(urlLang);
    }
    
    // Listen for language changes via navigation
    window.addEventListener('popstate', function() {
        const newUrl = new URL(window.location.href);
        const newLang = newUrl.searchParams.get('lang');
        if (newLang && ['en', 'fr'].includes(newLang)) {
            updateJobApplicationsLanguage(newLang);
        }
    });
    
    // Auto-detect language change if HTML lang attribute changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                const newLang = document.documentElement.lang;
                if (newLang && ['en', 'fr'].includes(newLang)) {
                    updateJobApplicationsLanguage(newLang);
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