/**
 * Knowledge Base Ingestion Script
 * Loads knowledge base documents into the vector database
 */

require('dotenv').config();
const VectorDBService = require('../services/vectorDB');
const fs = require('fs').promises;
const path = require('path');

async function ingestKnowledgeBase() {
    console.log('MosalaPro Knowledge Base Ingestion');

    try {
        // Initialize vector database
        console.log(' Initializing Vector Database...');
        const vectorDB = new VectorDBService();
        await vectorDB.initialize();

        // Load knowledge base
        console.log('Loading knowledge base from file...');
        const knowledgeBasePath = path.join(__dirname, '../data/knowledge-base.json');
        const knowledgeBaseContent = await fs.readFile(knowledgeBasePath, 'utf-8');
        const documents = JSON.parse(knowledgeBaseContent);

        console.log(`Loaded ${documents.length} documents from knowledge base\n`);

        // Clear existing data (optional - comment out to append instead)
        console.log('Clearing existing collection...');
        await vectorDB.clearCollection();
        console.log('Collection cleared\n');

        // Add documents to vector database
        console.log('Adding documents to vector database...');
        const result = await vectorDB.addDocuments(documents);

        if (result.success) {
            console.log(`\nSuccessfully ingested ${result.count} documents!\n`);

            // Get stats
            const stats = await vectorDB.getStats();
            console.log('Collection Statistics:');
            console.log(`   - Name: ${stats.name}`);
            console.log(`   - Total Documents: ${stats.documentCount}`);
            console.log(`   - Status: ${stats.initialized ? 'Initialized' : 'Not Initialized'}`);
        } else {
            console.error(`\nError during ingestion: ${result.error}`);
            process.exit(1);
        }

        console.log(' Ingestion Complete!');

    } catch (error) {
        console.error('\n Fatal error during ingestion:');
        console.error(error);
        process.exit(1);
    }
}

// Run ingestion
ingestKnowledgeBase();
