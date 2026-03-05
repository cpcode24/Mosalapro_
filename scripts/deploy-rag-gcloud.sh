#!/bin/bash

#################################################
# Google Cloud RAG Deployment Script
# Automates Ollama installation and RAG setup
#################################################

set -e  # Exit on error

echo "================================================"
echo "MosalaPro RAG Deployment for Google Cloud"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_error() {
    echo -e "${RED} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}  $1${NC}"
}

print_info() {
    echo -e "${NC}  $1${NC}"
}

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    print_error "This script must be run on a Linux server (Google Cloud VM)"
    print_info "Detected OS: $OSTYPE"
    exit 1
fi

print_success "Running on Linux"
echo ""

# Step 1: System Update
echo "================================================"
echo "Step 1: Updating system packages"
echo "================================================"

print_info "Running apt-get update..."
sudo apt-get update -qq

print_info "Running apt-get upgrade..."
sudo apt-get upgrade -y -qq

print_success "System updated"
echo ""

# Step 2: Install Ollama
echo "================================================"
echo "Step 2: Installing Ollama"
echo "================================================"

if command -v ollama &> /dev/null; then
    print_warning "Ollama is already installed"
    ollama --version
else
    print_info "Downloading and installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh

    if command -v ollama &> /dev/null; then
        print_success "Ollama installed successfully"
        ollama --version
    else
        print_error "Ollama installation failed"
        exit 1
    fi
fi

echo ""

# Step 3: Create systemd service
echo "================================================"
echo "Step 3: Setting up Ollama as a system service"
echo "================================================"

SERVICE_FILE="/etc/systemd/system/ollama.service"

if [ -f "$SERVICE_FILE" ]; then
    print_warning "Ollama service already exists"
else
    print_info "Creating systemd service file..."

    sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=$USER
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=127.0.0.1:11434"
Environment="OLLAMA_NUM_PARALLEL=2"
Environment="OLLAMA_MAX_LOADED_MODELS=1"

[Install]
WantedBy=multi-user.target
EOF

    print_success "Service file created"
fi

# Reload systemd
print_info "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service
print_info "Enabling Ollama service to start on boot..."
sudo systemctl enable ollama

# Start service
print_info "Starting Ollama service..."
sudo systemctl start ollama

# Wait for service to start
sleep 3

# Check service status
if sudo systemctl is-active --quiet ollama; then
    print_success "Ollama service is running"
else
    print_error "Ollama service failed to start"
    sudo systemctl status ollama
    exit 1
fi

echo ""

# Step 4: Pull models
echo "================================================"
echo "Step 4: Downloading AI models"
echo "================================================"

print_info "This may take 5-10 minutes depending on your connection..."
echo ""

# Pull Llama model
print_info "Pulling Llama 3.2 3B model (~2GB)..."
ollama pull llama3.2:3b

if [ $? -eq 0 ]; then
    print_success "Llama 3.2 3B model downloaded"
else
    print_error "Failed to download Llama model"
    exit 1
fi

echo ""

# Pull embedding model
print_info "Pulling embedding model (~274MB)..."
ollama pull nomic-embed-text

if [ $? -eq 0 ]; then
    print_success "Embedding model downloaded"
else
    print_error "Failed to download embedding model"
    exit 1
fi

echo ""

# Verify models
print_info "Installed models:"
ollama list

echo ""

# Step 5: Check if Node.js is installed
echo "================================================"
echo "Step 5: Verifying Node.js installation"
echo "================================================"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    print_info "Installing Node.js 22.x..."

    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs

    if command -v node &> /dev/null; then
        print_success "Node.js installed: $(node --version)"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
fi

echo ""

# Step 6: Install project dependencies
echo "================================================"
echo "Step 6: Installing project dependencies"
echo "================================================"

if [ -f "package.json" ]; then
    print_info "Installing npm packages..."
    npm install --legacy-peer-deps
    print_success "Dependencies installed"
else
    print_warning "package.json not found. Skipping dependency installation."
    print_info "Make sure to run 'npm install --legacy-peer-deps' in your project directory"
fi

echo ""

# Step 7: Check for vector database
echo "================================================"
echo "Step 7: Checking vector database"
echo "================================================"

VECTOR_DB_FILE="data/vector_db.json"

if [ -f "$VECTOR_DB_FILE" ]; then
    FILE_SIZE=$(du -h "$VECTOR_DB_FILE" | cut -f1)
    print_success "Vector database found: $FILE_SIZE"
    print_info "Using existing vector database"
else
    print_warning "Vector database not found"
    print_info "You need to either:"
    print_info "  1. Upload from local: gcloud compute scp data/vector_db.json INSTANCE:~/Mosalapro_/data/"
    print_info "  2. Generate on server: node scripts/ingest-knowledge.js"
fi

echo ""

# Step 8: Test the setup
echo "================================================"
echo "Step 8: Testing RAG setup"
echo "================================================"

print_info "Checking if Ollama API is accessible..."
if curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    print_success "Ollama API is responding"
else
    print_error "Ollama API is not responding"
    print_info "Try: sudo systemctl restart ollama"
    exit 1
fi

echo ""

# Final summary
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
print_success "Ollama is installed and running"
print_success "Models downloaded: llama3.2:3b, nomic-embed-text"
print_success "System service configured to start on boot"
echo ""

print_info "Next steps:"
echo ""
echo "1. Make sure your .env file is configured:"
echo "   OLLAMA_URL=http://127.0.0.1:11434"
echo "   LLAMA_MODEL=llama3.2:3b"
echo "   EMBEDDING_MODEL=nomic-embed-text"
echo ""

echo "2. If vector database is missing, either:"
echo "   - Upload it: gcloud compute scp data/vector_db.json INSTANCE:~/Mosalapro_/data/"
echo "   - Generate it: node scripts/ingest-knowledge.js"
echo ""

echo "3. Test the RAG system:"
echo "   node scripts/test-rag.js"
echo ""

echo "4. Start/restart your application:"
echo "   pm2 restart your-app-name"
echo "   # OR"
echo "   npm start"
echo ""

print_info "Check logs for: 'CHAT SUPPORT:: Using Local Llama with RAG'"
echo ""

print_success "Setup complete! Your RAG system is ready to use."
echo ""
