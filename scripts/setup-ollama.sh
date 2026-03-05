#!/bin/bash

# Ollama Setup Script for MosalaPro RAG System
# This script sets up Ollama and pulls the necessary models

echo "=================================="
echo "MosalaPro Ollama Setup Script"
echo "=================================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed."
    echo ""
    echo "Please install Ollama first:"
    echo "  macOS/Linux: curl -fsSL https://ollama.com/install.sh | sh"
    echo "  Or visit: https://ollama.com/download"
    echo ""
    exit 1
fi

echo "Ollama is installed"
echo ""

# Check if Ollama service is running
if ! curl -s http://localhost:11434/api/tags &> /dev/null; then
    echo "Ollama service is not running"
    echo "Starting Ollama service..."
    ollama serve &
    sleep 3
fi

echo "Ollama service is running"
echo ""

# Pull Llama 3.2 model (3B - lightweight and fast)
echo "Pulling Llama 3.2 3B model..."
echo "   (This may take a few minutes depending on your internet speed)"
ollama pull llama3.2:3b

if [ $? -eq 0 ]; then
    echo "Llama 3.2 3B model downloaded successfully"
else
    echo "Failed to download Llama 3.2 3B model"
    exit 1
fi

echo ""

# Pull embedding model for RAG
echo "Pulling embedding model (nomic-embed-text)..."
ollama pull nomic-embed-text

if [ $? -eq 0 ]; then
    echo "Embedding model downloaded successfully"
else
    echo "Failed to download embedding model"
    exit 1
fi

echo ""
echo "=================================="
echo " Setup Complete!"
echo "=================================="
echo ""
echo "Models installed:"
echo "  1. llama3.2:3b - Main chat model"
echo "  2. nomic-embed-text - Embedding model for RAG"
echo ""
echo "You can now start using the RAG system!"
echo ""
echo "To verify installation, run:"
echo "  ollama list"
echo ""
