/**
 * AI Chat Widget - Client-side JavaScript
 * Handles the chat interface and communication with GPT-4 API
 */

(function() {
    'use strict';

    // Configuration
    const CHAT_CONFIG = {
        language: typeof CHAT_LANGUAGE !== 'undefined' ? CHAT_LANGUAGE : 'en',
        maxMessageLength: 500,
        typingDelay: 1000,
        autoExpandHeight: true
    };

    const virtualAssistantName = ['Mira', 'Ava', 'Leo', 'Zara', 'Eli', 'Nia', 'Kai', 'Luna', 'Max', 'Sia'];
    // Translations
    const translations = {
        en: {
            available: 'Online - ' + virtualAssistantName[Math.floor(Math.random() * virtualAssistantName.length)],
            unavailable: 'Currently unavailable',
            errorGeneric: 'Sorry, something went wrong. Please try again.',
            errorNetwork: 'Network error. Please check your connection.',
            chatUnavailable: 'Chat support is not available at the moment.',
            messageTooLong: 'Message is too long. Please keep it under 500 characters.'
        },
        fr: {
            available: 'En ligne - ' + virtualAssistantName[Math.floor(Math.random() * virtualAssistantName.length)],
            unavailable: 'Actuellement indisponible',
            errorGeneric: 'Désolé, quelque chose s\'est mal passé. Veuillez réessayer.',
            errorNetwork: 'Erreur réseau. Veuillez vérifier votre connexion.',
            chatUnavailable: 'Le support par chat n\'est pas disponible pour le moment.',
            messageTooLong: 'Message trop long. Veuillez le limiter à 500 caractères.'
        }
    };

    // DOM Elements
    const elements = {
        chatToggleBtn: document.getElementById('chatToggleBtn'),
        chatWindow: document.getElementById('chatWindow'),
        minimizeChat: document.getElementById('minimizeChat'),
        chatForm: document.getElementById('chatForm'),
        chatInput: document.getElementById('chatInput'),
        sendBtn: document.getElementById('sendBtn'),
        chatMessages: document.getElementById('chatMessages'),
        typingIndicator: document.getElementById('typingIndicator'),
        chatStatus: document.getElementById('chatStatus'),
        suggestedQuestions: document.getElementById('suggestedQuestions')
    };

    // State
    let conversationHistory = [];
    let isChatOpen = false;
    let isTyping = false;
    let chatAvailable = false;

    /**
     * Get translated text
     */
    function t(key) {
        return translations[CHAT_CONFIG.language]?.[key] || translations.en[key] || key;
    }

    /**
     * Initialize chat widget
     */
    async function init() {
        // Check chat availability
        await checkChatStatus();

        // Load suggested questions
        await loadSuggestedQuestions();

        // Event listeners
        elements.chatToggleBtn.addEventListener('click', toggleChat);
        elements.minimizeChat.addEventListener('click', toggleChat);
        elements.chatForm.addEventListener('submit', handleSubmit);
        elements.chatInput.addEventListener('input', handleInputChange);
        elements.chatInput.addEventListener('keydown', handleKeyDown);
    }

    /**
     * Check if chat support is available
     */
    async function checkChatStatus() {
        try {
            const response = await fetch(`/api/chat/status?lang=${CHAT_CONFIG.language}`);
            const data = await response.json();

            chatAvailable = data.available;
            elements.chatStatus.textContent = data.available ? t('available') : t('unavailable');

            if (!data.available) {
                elements.sendBtn.disabled = true;
                elements.chatInput.disabled = true;
                elements.chatInput.placeholder = t('chatUnavailable');
            }
        } catch (error) {
            console.error('Error checking chat status:', error);
            elements.chatStatus.textContent = t('unavailable');
        }
    }

    /**
     * Load suggested questions
     */
    async function loadSuggestedQuestions() {
        try {
            const response = await fetch(`/api/chat/suggestions?lang=${CHAT_CONFIG.language}`);
            const data = await response.json();

            if (data.questions && data.questions.length > 0) {
                // Show first 4 questions
                const questionsToShow = data.questions.slice(0, 4);
                elements.suggestedQuestions.innerHTML = questionsToShow.map(question =>
                    `<button type="button" class="suggested-question" data-question="${escapeHtml(question)}">
                        ${escapeHtml(question)}
                    </button>`
                ).join('');

                // Add click handlers
                elements.suggestedQuestions.querySelectorAll('.suggested-question').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const question = btn.getAttribute('data-question');
                        elements.chatInput.value = question;
                        elements.chatInput.focus();
                        // Auto-submit
                        handleSubmit(new Event('submit'));
                    });
                });
            }
        } catch (error) {
            console.error('Error loading suggested questions:', error);
        }
    }

    /**
     * Toggle chat window
     */
    function toggleChat() {
        isChatOpen = !isChatOpen;
        elements.chatToggleBtn.classList.toggle('active', isChatOpen);
        elements.chatWindow.style.display = isChatOpen ? 'flex' : 'none';

        if (isChatOpen) {
            elements.chatInput.focus();
            scrollToBottom();
        }
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        if (!chatAvailable) {
            addMessage(t('chatUnavailable'), 'bot', true);
            return;
        }

        const message = elements.chatInput.value.trim();

        if (!message) return;

        if (message.length > CHAT_CONFIG.maxMessageLength) {
            addMessage(t('messageTooLong'), 'bot', true);
            return;
        }

        // Add user message to UI
        addMessage(message, 'user');

        // Clear input
        elements.chatInput.value = '';
        elements.chatInput.style.height = 'auto';

        // Hide suggested questions after first message
        if (elements.suggestedQuestions) {
            elements.suggestedQuestions.style.display = 'none';
        }

        // Show typing indicator
        showTyping();

        // Send to API
        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: conversationHistory,
                    language: CHAT_CONFIG.language
                })
            });

            const data = await response.json();

            hideTyping();

            if (data.success) {
                // Add bot response
                addMessage(data.message, 'bot');

                // Update conversation history
                conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.message }
                );

                // Limit history to last 10 messages
                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
            } else {
                addMessage(data.error || t('errorGeneric'), 'bot', true);
            }
        } catch (error) {
            hideTyping();
            console.error('Error sending message:', error);
            addMessage(t('errorNetwork'), 'bot', true);
        }
    }

    /**
     * Add message to chat
     */
    function addMessage(text, sender = 'bot', isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = `message-content ${isError ? 'error-message' : ''}`;

        // Convert markdown-style formatting to HTML
        const formattedText = formatMessage(text);
        contentDiv.innerHTML = formattedText;

        messageDiv.appendChild(contentDiv);
        elements.chatMessages.appendChild(messageDiv);

        scrollToBottom();
    }

    /**
     * Format message text (handle basic markdown)
     */
    function formatMessage(text) {
        // Split by newlines and create paragraphs
        return text
            .split('\n\n')
            .map(para => {
                // Convert **bold** to <strong>
                para = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                // Convert *italic* to <em>
                para = para.replace(/\*(.+?)\*/g, '<em>$1</em>');
                // Convert numbered lists
                if (para.match(/^\d+\./m)) {
                    const items = para.split('\n').map(line => {
                        const match = line.match(/^\d+\.\s*(.+)/);
                        return match ? `<li>${match[1]}</li>` : '';
                    }).filter(Boolean).join('');
                    return `<ol>${items}</ol>`;
                }
                // Convert bullet lists
                if (para.match(/^[-•]\s/m)) {
                    const items = para.split('\n').map(line => {
                        const match = line.match(/^[-•]\s*(.+)/);
                        return match ? `<li>${match[1]}</li>` : '';
                    }).filter(Boolean).join('');
                    return `<ul>${items}</ul>`;
                }
                return `<p>${para}</p>`;
            })
            .join('');
    }

    /**
     * Show typing indicator
     */
    function showTyping() {
        isTyping = true;
        elements.typingIndicator.style.display = 'block';
        elements.sendBtn.disabled = true;
        scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    function hideTyping() {
        isTyping = false;
        elements.typingIndicator.style.display = 'none';
        elements.sendBtn.disabled = false;
    }

    /**
     * Handle input change (auto-resize textarea)
     */
    function handleInputChange() {
        if (CHAT_CONFIG.autoExpandHeight) {
            elements.chatInput.style.height = 'auto';
            elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 100) + 'px';
        }

        // Enable/disable send button
        elements.sendBtn.disabled = !elements.chatInput.value.trim() || isTyping;
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyDown(e) {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elements.chatForm.dispatchEvent(new Event('submit'));
        }
    }

    /**
     * Scroll chat to bottom
     */
    function scrollToBottom() {
        setTimeout(() => {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }, 100);
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
