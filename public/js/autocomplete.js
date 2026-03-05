/**
 * AutoComplete Component
 * Provides search-as-you-type functionality with dropdown selection
 */

// Global registry to track all AutoComplete instances
window.AutoCompleteRegistry = window.AutoCompleteRegistry || {};

class AutoComplete {
    constructor(options = {}) {
        // Validate required options
        if (!options.inputId) {
            throw new Error('inputId is required');
        }
        if (!options.apiUrl) {
            throw new Error('apiUrl is required');
        }

        this.input = document.getElementById(options.inputId);
        if (!this.input) {
            throw new Error(`Input element with id "${options.inputId}" not found`);
        }

        this.options = {
            minLength: 1,
            maxResults: 10,
            placeholder: 'Type to search...',
            noResultsText: 'No results found',
            debounceDelay: 300,
            dependsOn: null,
            onSelect: null,
            ...options
        };

        this.results = [];
        this.selectedIndex = -1;
        this.isOpen = false;
        this.debounceTimer = null;
        this.container = null;
        this.resultsList = null;
        this.dependentElement = null;

        this.init();
    }

    init() {
        // Register this instance in the global registry
        window.AutoCompleteRegistry[this.options.inputId] = this;
        
        this.createContainer();
        this.setupEventListeners();
        this.input.setAttribute('autocomplete', 'off');
        
        if (this.options.placeholder) {
            this.input.setAttribute('placeholder', this.options.placeholder);
        }

        // Setup dependency if specified
        if (this.options.dependsOn) {
            this.dependentElement = document.getElementById(this.options.dependsOn);
            if (this.dependentElement) {
                this.input.disabled = !this.hasValidDependency();
                this.setupDependencyListener();
            }
        }
    }

    createContainer() {
        // Create autocomplete container
        this.container = document.createElement('div');
        this.container.className = 'autocomplete-container';
        this.container.style.cssText = `
            position: relative;
            width: 100%;
        `;

        // Create results list
        this.resultsList = document.createElement('ul');
        this.resultsList.className = 'autocomplete-results';
        this.resultsList.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            margin: 0;
            padding: 0;
            list-style: none;
            display: none;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        `;

        // Wrap input and add container
        const parent = this.input.parentNode;
        parent.insertBefore(this.container, this.input);
        this.container.appendChild(this.input);
        this.container.appendChild(this.resultsList);

        // Add required CSS styles
        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('autocomplete-styles')) return;

        const style = document.createElement('style');
        style.id = 'autocomplete-styles';
        style.textContent = `
            .autocomplete-container .form-control:focus {
                border-color: #007bff;
                box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
            }
            
            .autocomplete-results {
                font-size: 14px;
            }
            
            .autocomplete-results li {
                padding: 10px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f1f1f1;
                color: #333;
                transition: background-color 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .autocomplete-results li:last-child {
                border-bottom: none;
            }
            
            .autocomplete-results li:hover,
            .autocomplete-results li.highlighted {
                background-color: #f8f9fa;
            }
            
            .autocomplete-results li.selected {
                background-color: #007bff;
                color: white;
            }
            
            .autocomplete-no-results {
                padding: 10px 12px;
                color: #6c757d;
                font-style: italic;
                cursor: default;
            }
            
            .autocomplete-disabled {
                background-color: #e9ecef !important;
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Input events
        this.input.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            const value = e.target.value.trim();
            
            if (value.length >= this.options.minLength) {
                this.debounceTimer = setTimeout(() => {
                    this.search(value);
                }, this.options.debounceDelay);
            } else {
                this.hideResults();
                this.clearSelection();
            }
        });

        this.input.addEventListener('focus', () => {
            const value = this.input.value.trim();
            if (value.length >= this.options.minLength && this.results.length > 0) {
                this.showResults();
            }
        });

        this.input.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        this.input.addEventListener('blur', (e) => {
            // Delay hiding to allow click events on results
            setTimeout(() => {
                if (!this.container.contains(document.activeElement)) {
                    this.hideResults();
                }
            }, 150);
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideResults();
            }
        });
    }

    setupDependencyListener() {
        if (!this.dependentElement) return;

        const updateDependentState = () => {
            const hasValidDependency = this.hasValidDependency();
            this.input.disabled = !hasValidDependency;
            
            if (!hasValidDependency) {
                this.clearInput();
                this.hideResults();
            }
        };

        // Listen for changes on the dependent element
        this.dependentElement.addEventListener('input', updateDependentState);
        this.dependentElement.addEventListener('change', updateDependentState);
    }

    hasValidDependency() {
        if (!this.dependentElement) return true;
        const value = this.dependentElement.getAttribute('data-value') || this.dependentElement.value;
        return value && value.trim() !== '';
    }

    async search(query) {
        if (this.input.disabled) return;

        try {
            const url = new URL(this.options.apiUrl, window.location.origin);
            url.searchParams.set('search', query);
            
            // Add dependency parameter if needed
            if (this.dependentElement) {
                const dependencyValue = this.dependentElement.getAttribute('data-value') || this.dependentElement.value;
                if (dependencyValue) {
                    url.searchParams.set('dependsOn', dependencyValue);
                }
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.results = data.results || data || [];
            this.selectedIndex = -1;
            this.displayResults();
        } catch (error) {
            console.error('Autocomplete search error:', error);
            this.results = [];
            this.hideResults();
        }
    }

    displayResults() {
        this.resultsList.innerHTML = '';

        if (this.results.length === 0) {
            const noResultsItem = document.createElement('li');
            noResultsItem.className = 'autocomplete-no-results';
            noResultsItem.textContent = this.options.noResultsText;
            document.getElementById(this.options.inputId).classList.add('invalid');
            this.resultsList.appendChild(noResultsItem);
        } else {
            
            this.results.slice(0, this.options.maxResults).forEach((result, index) => {
                const item = document.createElement('li');
                item.textContent = result.display || result.text || result.name || result;
                item.setAttribute('data-value', result.value || result.name || result);
                item.setAttribute('data-index', index);
                
                item.addEventListener('click', () => {
                    document.getElementById(this.options.inputId).classList.remove('invalid');
                    this.selectItem(index);
                });

                this.resultsList.appendChild(item);
            });
        }

        this.showResults();
    }

    showResults() {
        if (this.results.length > 0 || this.resultsList.children.length > 0) {
            this.resultsList.style.display = 'block';
            this.isOpen = true;
        }
    }

    hideResults() {
        this.resultsList.style.display = 'none';
        this.isOpen = false;
        this.selectedIndex = -1;
        this.updateHighlight();
    }

    selectItem(index) {
        if (index < 0 || index >= this.results.length) return;

        const result = this.results[index];
        const displayValue = result.display || result.text || result.name || result;
        const dataValue = result.value || result.name || result;

        // Update input
        this.input.value = displayValue;
        this.input.setAttribute('data-value', dataValue);

        // Hide results
        this.hideResults();

        // Trigger change event
        this.input.dispatchEvent(new Event('change', { bubbles: true }));

        // Call onSelect callback if provided
        if (this.options.onSelect) {
            this.options.onSelect(result, this.input);
        }

        // Clear dependent inputs if this input affects others
        this.clearDependentInputs();
    }

    clearDependentInputs() {
        // Find any AutoComplete instances that depend on this one
        Object.values(window.AutoCompleteRegistry).forEach(instance => {
            if (instance.options.dependsOn === this.input.id) {
                instance.clearInput();
            }
        });
    }

    clearInput() {
        this.input.value = '';
        this.input.removeAttribute('data-value');
        this.clearDependentInputs();
    }

    clearSelection() {
        this.input.removeAttribute('data-value');
    }

    handleKeyDown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                this.updateHighlight();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateHighlight();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.selectedIndex);
                }
                break;
            case 'Escape':
                this.hideResults();
                break;
        }
    }

    updateHighlight() {
        const items = this.resultsList.querySelectorAll('li:not(.autocomplete-no-results)');
        items.forEach((item, index) => {
            item.classList.toggle('highlighted', index === this.selectedIndex);
        });
    }

    // Public methods
    getValue() {
        return this.input.getAttribute('data-value') || this.input.value;
    }

    setValue(value, display) {
        this.input.value = display || value;
        this.input.setAttribute('data-value', value);
    }

    clear() {
        this.clearInput();
        this.hideResults();
    }

    hasValidSelection() {
        const dataValue = this.input.getAttribute('data-value');
        return dataValue && dataValue.trim() !== '';
    }

    getSubmissionValue() {
        // For form submission, use data-value if available, otherwise fall back to input value
        return this.input.getAttribute('data-value') || this.input.value;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoComplete;
}