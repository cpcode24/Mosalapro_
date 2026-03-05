/**
 * Vector Database Service for MosalaPro RAG System
 * Uses file-based storage with Ollama embeddings (no external ChromaDB server needed)
 */

const { OllamaEmbeddings } = require('@langchain/ollama');
const fs = require('fs').promises;
const path = require('path');

class VectorDBService {
    constructor() {
        this.embeddings = null;
        this.collectionName = 'mosalapro_knowledge';
        this.initialized = false;
        this.dbPath = path.join(__dirname, '../data/vector_db.json');
        this.documents = [];
    }

    /**
     * Initialize the vector database connection
     */
    async initialize() {
        try {
            console.log('Initializing Vector Database...');

            // Initialize Ollama embeddings
            this.embeddings = new OllamaEmbeddings({
                model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
                baseUrl: process.env.OLLAMA_URL 
            });

            // Load existing database if it exists
            try {
                const data = await fs.readFile(this.dbPath, 'utf-8');
                this.documents = JSON.parse(data);
                console.log(`Loaded ${this.documents.length} documents from database`);
            } catch (error) {
                // File doesn't exist yet, start with empty array
                this.documents = [];
                console.log('Starting with empty database');
            }

            this.initialized = true;
            console.log('Vector Database initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Vector Database:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * Save database to file
     */
    async _saveDatabase() {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(this.documents, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving database:', error);
            return false;
        }
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    _cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Add documents to the vector database
     * @param {Array} documents - Array of document objects with text and metadata
     */
    async addDocuments(documents) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            console.log(`Adding ${documents.length} documents to vector database...`);

            // Process each document
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];

                console.log(`   Processing document ${i + 1}/${documents.length}: ${doc.id}`);

                // Generate embedding
                const embedding = await this.embeddings.embedQuery(doc.text);

                // Create document entry
                const docEntry = {
                    id: doc.id || `doc_${Date.now()}_${i}`,
                    text: doc.text,
                    embedding: embedding,
                    metadata: {
                        category: doc.category || 'general',
                        language: doc.language || 'en',
                        source: doc.source || 'manual',
                        timestamp: new Date().toISOString(),
                        ...doc.metadata
                    }
                };

                this.documents.push(docEntry);
            }

            // Save to file
            await this._saveDatabase();

            console.log(`Successfully added ${documents.length} documents`);
            return { success: true, count: documents.length };
        } catch (error) {
            console.error('Error adding documents:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search for similar documents
     * @param {string} query - Search query
     * @param {number} topK - Number of results to return
     * @param {object} filter - Optional metadata filter
     */
    async search(query, topK = 5, filter = null) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            if (this.documents.length === 0) {
                console.log('No documents in database');
                return [];
            }

            // Generate query embedding
            const queryEmbedding = await this.embeddings.embedQuery(query);

            // Calculate similarities for all documents
            let results = this.documents.map(doc => {
                const similarity = this._cosineSimilarity(queryEmbedding, doc.embedding);
                return {
                    text: doc.text,
                    metadata: doc.metadata,
                    similarity: similarity,
                    distance: 1 - similarity, // Convert to distance
                    id: doc.id
                };
            });

            // Apply filter if provided
            if (filter) {
                results = results.filter(doc => {
                    for (const [key, value] of Object.entries(filter)) {
                        if (doc.metadata[key] !== value) {
                            return false;
                        }
                    }
                    return true;
                });
            }

            // Sort by similarity (highest first) and get top K
            results.sort((a, b) => b.similarity - a.similarity);
            results = results.slice(0, topK);

            return results;
        } catch (error) {
            console.error('Error searching vector database:', error);
            return [];
        }
    }

    /**
     * Delete documents by IDs
     * @param {Array} ids - Array of document IDs to delete
     */
    async deleteDocuments(ids) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const initialCount = this.documents.length;
            this.documents = this.documents.filter(doc => !ids.includes(doc.id));
            const deletedCount = initialCount - this.documents.length;

            await this._saveDatabase();

            console.log(`Deleted ${deletedCount} documents`);
            return { success: true, count: deletedCount };
        } catch (error) {
            console.error('Error deleting documents:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Clear all documents from the collection
     */
    async clearCollection() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            this.documents = [];
            await this._saveDatabase();

            console.log('Collection cleared successfully');
            return { success: true };
        } catch (error) {
            console.error('Error clearing collection:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get collection statistics
     */
    async getStats() {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            return {
                name: this.collectionName,
                documentCount: this.documents.length,
                initialized: this.initialized
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }
}

module.exports = VectorDBService;
