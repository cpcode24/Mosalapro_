/*********************************************************************************************************
*	chatSupport.js : Handles AI-powered chat support using Local Llama with RAG
*   Author: Constant Pagoui.
*	Date: 03-02-2026
*	Copyright: MosalaPro TM
*
*   This version uses a local Llama model with Retrieval Augmented Generation (RAG)
*   instead of external APIs like Google Gemini or OpenAI.
**********************************************************************************************************/

const RAGService = require('./ragService');
const log4js = require("log4js");
const logger = log4js.getLogger();

class ChatSupport {
    constructor() {
        // Initialize RAG service with local Llama
        this.ragService = new RAGService();
        this.provider = 'local-llama-rag';

        logger.info('CHAT SUPPORT:: Using Local Llama with RAG');

        // Initialize RAG service asynchronously
        this.initPromise = this.ragService.initialize().then(success => {
            if (success) {
                logger.info('CHAT SUPPORT:: RAG Service initialized successfully');
            } else {
                logger.warn('CHAT SUPPORT:: RAG Service initialization failed');
            }
            return success;
        });
    }

    /**
     * Send a message to the AI chat and get a response
     * @param {Array} messages - Array of message objects with role and content
     * @param {Object} options - Additional options (temperature, max_tokens, language, etc.)
     * @returns {Promise<Object>} - AI response
     */
    async chat(messages, options = {}) {
        try {
            // Wait for initialization
            await this.initPromise;

            const {
                language = 'en'
            } = options;

            // Extract user message from messages array
            const userMessage = messages[messages.length - 1].content;

            // Get conversation history (exclude the last message which is the current one)
            const conversationHistory = messages.slice(0, -1);

            // Use RAG service to generate response
            const response = await this.ragService.generateResponse(
                userMessage,
                conversationHistory,
                language
            );

            if (!response.success) {
                const errorMessages = {
                    en: "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.",
                    fr: "Je m'excuse, mais j'ai du mal à traiter votre demande en ce moment. Veuillez réessayer plus tard ou contacter notre équipe de support."
                };

                return {
                    success: false,
                    error: response.error,
                    message: errorMessages[language] || errorMessages.en
                };
            }

            return response;

        } catch (error) {
            logger.error(`CHAT SUPPORT:: Error occurred: ${error.message}`);

            const errorMessages = {
                en: "I apologize, but I'm having trouble processing your request right now. Please try again later or contact our support team.",
                fr: "Je m'excuse, mais j'ai du mal à traiter votre demande en ce moment. Veuillez réessayer plus tard ou contacter notre équipe de support."
            };

            return {
                success: false,
                error: error.message,
                message: errorMessages[options.language || 'en'] || errorMessages.en
            };
        }
    }

    /**
     * Simple chat method for single user message with automatic language detection
     * @param {String} userMessage - User's message
     * @param {Array} conversationHistory - Optional previous conversation history
     * @param {String} userLanguage - Optional language override ('en' or 'fr')
     * @returns {Promise<Object>} - AI response
     */
    async sendMessage(userMessage, conversationHistory = [], userLanguage = null) {
        const messages = [
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        // Detect language from message if not provided
        const detectedLanguage = userLanguage || this.detectLanguage(userMessage);

        return await this.chat(messages, { language: detectedLanguage });
    }

    /**
     * Validate API key is configured (for RAG, we check if Ollama is available)
     * @returns {Boolean}
     */
    async isConfigured() {
        try {
            const status = await this.ragService.getStatus();
            return status.available;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get current provider
     * @returns {String}
     */
    getProvider() {
        return this.provider;
    }

    /**
     * Get suggested questions for users based on language
     * @param {String} language - Language code ('en' or 'fr')
     * @returns {Array} - Array of suggested questions
     */
    getSuggestedQuestions(language = 'en') {
        const questions = {
            en: [
                "How do I post a service request?",
                "How can I hire a service provider?",
                "What payment methods are supported?",
                "How do I become a service provider?",
                "How does the rating system work?",
                "How do I send a quotation to a client?",
                "What happens after I submit my work?",
                "How do I verify my account?"
            ],
            fr: [
                "Comment publier une demande de service ?",
                "Comment embaucher un prestataire de services ?",
                "Quels modes de paiement sont acceptés ?",
                "Comment devenir prestataire de services ?",
                "Comment fonctionne le système de notation ?",
                "Comment envoyer un devis à un client ?",
                "Que se passe-t-il après avoir soumis mon travail ?",
                "Comment vérifier mon compte ?"
            ]
        };

        return questions[language] || questions.en;
    }

    /**
     * Detect language from user message (simple detection)
     * @param {String} message - User's message
     * @returns {String} - Detected language code ('en' or 'fr')
     */
    detectLanguage(message) {
        // Simple French keyword detection
        const frenchKeywords = [
            'comment', 'pourquoi', 'quoi', 'où', 'quand', 'qui',
            'puis-je', 'peux-tu', 'pouvez-vous', 'je', 'mon', 'ma',
            'mes', 'le', 'la', 'les', 'un', 'une', 'des',
            'bonjour', 'salut', 'merci', 'aide', 'aidez',
            'besoin', 'voudrais', 'veux', 'suis'
        ];

        const lowerMessage = message.toLowerCase();

        // Count French keyword matches
        const frenchMatches = frenchKeywords.filter(keyword =>
            lowerMessage.includes(' ' + keyword + ' ') ||
            lowerMessage.startsWith(keyword + ' ') ||
            lowerMessage.endsWith(' ' + keyword)
        ).length;

        // If multiple French keywords detected, assume French
        return frenchMatches >= 2 ? 'fr' : 'en';
    }

    /**
     * Get RAG system status
     * @returns {Promise<Object>} - Status information
     */
    async getStatus() {
        try {
            await this.initPromise;
            return await this.ragService.getStatus();
        } catch (error) {
            return {
                available: false,
                error: error.message,
                provider: this.provider
            };
        }
    }
}

module.exports = ChatSupport;
