/**
 * RAG Service for MosalaPro
 * Handles Retrieval Augmented Generation with multiple LLM providers
 * Supports: Local Llama (via Ollama) and Groq (cloud-based)
 */

const VectorDBService = require('./vectorDB');
const { Ollama } = require('ollama');
const GroqService = require('./groqService');

class RAGService {
    constructor() {
        this.vectorDB = new VectorDBService();

        // Determine which provider to use
        this.provider = process.env.LLM_PROVIDER || 'groq'; // Default to Groq for better performance

        // Initialize Ollama (for local Llama)
        this.ollama = new Ollama({
            host: process.env.OLLAMA_URL
        });
        this.model = process.env.LLAMA_MODEL || 'llama3.2:3b';

        // Initialize Groq service
        this.groqService = new GroqService();

        this.initialized = false;
        this.topK = 3; // Reduced from 5 to 3 - less context = faster
        this.temperature = 0.7;

        // Keep model loaded in memory to avoid reload latency (for Ollama)
        this.keepModelLoaded = true;

        console.log(`RAG Service configured to use: ${this.provider.toUpperCase()}`);
    }

    /**
     * Initialize the RAG service
     */
    async initialize() {
        try {
            console.log('Initializing RAG Service...');

            // Initialize vector database
            await this.vectorDB.initialize();

            // Initialize based on selected provider
            if (this.provider === 'groq') {
                // Initialize Groq service
                const success = await this.groqService.initialize();
                if (success) {
                    console.log('RAG Service initialized with Groq');
                    this.initialized = true;
                    return true;
                } else {
                    console.warn(' Groq initialization failed, falling back to Ollama...');
                    this.provider = 'ollama';
                }
            }

            // Initialize Ollama (either selected or fallback)
            if (this.provider === 'ollama') {
                try {
                    const models = await this.ollama.list();
                    const modelExists = models.models.some(m => m.name.includes(this.model.split(':')[0]));

                    if (!modelExists) {
                        console.warn(` Model ${this.model} not found. Please run: ollama pull ${this.model}`);
                        return false;
                    }

                    console.log('RAG Service initialized with Ollama');
                    this.initialized = true;

                    // Warmup: Preload model into memory for faster first response
                    if (this.keepModelLoaded) {
                        this.warmupModel().catch(err =>
                            console.warn(' Model warmup failed (non-critical):', err.message)
                        );
                    }

                    return true;
                } catch (error) {
                    console.error(` Ollama is not running on ${process.env.OLLAMA_URL}. Please start Ollama service.`);
                    console.error('   Run: ollama serve');
                    return false;
                }
            }

            return false;
        } catch (error) {
            console.error('Failed to initialize RAG Service:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Warmup the model by running a quick dummy inference
     * This preloads the model into memory for faster subsequent responses
     */
    async warmupModel() {
        try {
            console.log('Warming up Llama model...');
            await this.ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: 'Hi' }],
                options: {
                    num_predict: 5,
                    num_ctx: 512
                },
                keep_alive: '10m'
            });
            console.log('Model warmed up and loaded in memory');
        } catch (error) {
            console.warn('Failed to warmup model:', error.message);
        }
    }

    /**
     * Retrieve relevant documents based on query
     * @param {string} query - User query
     * @param {string} language - Language code (en/fr)
     */
    async retrieveContext(query, language = 'en') {
        try {
            // Search vector database
            const filter = language ? { language } : null;
            const results = await this.vectorDB.search(query, this.topK, filter);

            // Format context from retrieved documents
            const context = results.map((doc, idx) => {
                return `[Document ${idx + 1}]\nCategory: ${doc.metadata.category}\n${doc.text}`;
            }).join('\n\n');

            return {
                context,
                documents: results,
                count: results.length
            };
        } catch (error) {
            console.error('Error retrieving context:', error);
            return { context: '', documents: [], count: 0 };
        }
    }

    /**
     * Generate response using RAG
     * @param {string} userMessage - User's message
     * @param {array} conversationHistory - Previous conversation messages
     * @param {string} language - Language code (en/fr)
     */
    async generateResponse(userMessage, conversationHistory = [], language = 'en') {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.initialized) {
            return {
                success: false,
                message: language === 'fr'
                    ? "Le service de chat n'est pas disponible pour le moment. Veuillez réessayer plus tard."
                    : "Chat service is not available at the moment. Please try again later.",
                error: 'RAG service not initialized'
            };
        }

        // Route to appropriate provider
        if (this.provider === 'groq') {
            return await this.groqService.generateResponse(userMessage, conversationHistory, language);
        }

        // Ollama implementation (local Llama)
        try {
            // Retrieve relevant context
            console.log(`Retrieving context for query: "${userMessage}"`);
            const { context, count } = await this.retrieveContext(userMessage, language);
            console.log(`Retrieved ${count} relevant documents`);

            // Build system prompt
            const systemPrompt = this.buildSystemPrompt(language, context);

            // Build messages for Llama
            const messages = [
                { role: 'system', content: systemPrompt }
            ];

            // Add conversation history (limited to last 4 messages to save context and speed)
            // Reduced from 6 to 4 - less history = faster processing
            const recentHistory = conversationHistory.slice(-4);
            messages.push(...recentHistory);

            // Add current user message
            messages.push({ role: 'user', content: userMessage });

            // Generate response using Ollama
            console.log('Generating response with Llama...');
            const response = await this.ollama.chat({
                model: this.model,
                messages: messages,
                options: {
                    temperature: this.temperature,
                    num_predict: 300, // Reduced from 800 to 300 tokens (faster, still enough for 2-4 sentences)
                    top_p: 0.9,
                    top_k: 40,
                    num_ctx: 2048, // Context window (reduced for speed)
                    num_thread: 4, // Use 4 CPU threads for parallel processing
                    num_gpu: 0, // Set to 1 if you have GPU available
                    repeat_penalty: 1.1,
                    stop: ['\n\n\n', 'User:', 'Assistant:'] // Stop early if response is complete
                },
                keep_alive: this.keepModelLoaded ? '10m' : '5m' // Keep model loaded for 10 minutes
            });

            const assistantMessage = response.message.content;

            return {
                success: true,
                message: assistantMessage,
                usage: {
                    prompt_tokens: response.prompt_eval_count || 0,
                    completion_tokens: response.eval_count || 0,
                    total_tokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
                },
                retrievedDocs: count,
                model: this.model,
                provider: 'ollama'
            };

        } catch (error) {
            console.error('Error generating response:', error);

            return {
                success: false,
                message: language === 'fr'
                    ? "Désolé, une erreur s'est produite. Veuillez réessayer."
                    : "Sorry, an error occurred. Please try again.",
                error: error.message
            };
        }
    }

    /**
     * Build system prompt with retrieved context
     */
    buildSystemPrompt(language, context) {
        if (language === 'fr') {
            return `Tu es l'assistant virtuel de MosalaPro, une plateforme qui connecte les chercheurs de services avec les fournisseurs de services en Afrique.

CONTEXTE PERTINENT:
${context || 'Aucun contexte spécifique disponible.'}

INSTRUCTIONS:
- Utilise le CONTEXTE PERTINENT ci-dessus pour répondre aux questions sur MosalaPro
- Si le contexte contient l'information, utilise-le pour donner une réponse précise
- Si le contexte ne contient pas l'information, donne une réponse brève et générale
- Réponds TOUJOURS en français
- Sois professionnel, amical et serviable
- Garde les réponses COURTES et concises (2-3 phrases maximum)
- Si tu ne sais pas quelque chose, admets-le brièvement et suggère de contacter le support

CAPACITÉS DE LA PLATEFORME:
- Publier et parcourir des demandes de services
- Envoyer et recevoir des devis
- Messagerie en temps réel entre clients et fournisseurs
- Paiements sécurisés via Stripe et mobile money
- Système d'évaluations et avis
- Vérification de compte et badges de confiance`;
        } else {
            return `You are MosalaPro's virtual assistant, a platform connecting service seekers with service providers across Africa.

RELEVANT CONTEXT:
${context || 'No specific context available.'}

INSTRUCTIONS:
- Use the RELEVANT CONTEXT above to answer questions about MosalaPro
- If the context contains the information, use it to give an accurate response
- If the context doesn't contain the information, provide a brief general answer
- ALWAYS respond in English
- Be professional, friendly, and helpful
- Keep responses SHORT and concise (2-3 sentences maximum)
- If you don't know something, admit it briefly and suggest contacting support

PLATFORM CAPABILITIES:
- Post and browse service requests
- Send and receive quotations
- Real-time messaging between clients and providers
- Secure payments via Stripe and mobile money
- Rating and review system
- Account verification and trust badges`;
        }
    }

    /**
     * Detect language from message
     * @param {string} message - User message
     */
    detectLanguage(message) {
        const frenchKeywords = [
            'bonjour', 'comment', 'je', 'puis', 'est', 'sont', 'faire',
            'merci', 'aide', 'besoin', 'quel', 'quelle', 'où', 'pourquoi',
            'service', 'devis', 'paiement'
        ];

        const lowerMessage = message.toLowerCase();
        const frenchMatches = frenchKeywords.filter(keyword =>
            lowerMessage.includes(keyword)
        ).length;

        return frenchMatches >= 2 ? 'fr' : 'en';
    }

    /**
     * Get service status
     */
    async getStatus() {
        try {
            if (this.provider === 'groq') {
                return await this.groqService.getStatus();
            }

            // Ollama status
            const models = await this.ollama.list();
            const modelExists = models.models.some(m => m.name.includes(this.model.split(':')[0]));
            const stats = await this.vectorDB.getStats();

            return {
                available: this.initialized && modelExists,
                model: this.model,
                vectorDB: {
                    initialized: stats ? stats.initialized : false,
                    documentCount: stats ? stats.documentCount : 0
                },
                provider: 'ollama'
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                provider: this.provider
            };
        }
    }
}

module.exports = RAGService;
