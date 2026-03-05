#!/bin/bash

#################################################
# Llama Performance Diagnostic Script
# Checks current setup and provides recommendations
#################################################

set -e

echo "================================================"
echo "Llama Performance Diagnostic"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Step 1: Check if running on server
echo "================================================"
echo "Step 1: Environment Check"
echo "================================================"
echo ""

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_success "Running on Linux server"
    IS_SERVER=true
else
    print_warning "Not running on Linux (running on $OSTYPE)"
    print_info "This script is meant to run on your production server"
    IS_SERVER=false
    echo ""
    echo "To run on your server:"
    echo "  gcloud compute ssh YOUR-INSTANCE-NAME"
    echo "  cd ~/Mosalapro_"
    echo "  ./scripts/diagnose-llama-performance.sh"
    echo ""
fi

echo ""

# Step 2: Check system resources
echo "================================================"
echo "Step 2: System Resources"
echo "================================================"
echo ""

if [ "$IS_SERVER" = true ]; then
    # CPU
    CPU_CORES=$(nproc)
    echo "CPU Cores: $CPU_CORES"

    if [ $CPU_CORES -lt 2 ]; then
        print_error "Only $CPU_CORES CPU core(s) - CRITICAL!"
        echo "  Recommendation: Upgrade to at least e2-standard-2 (2 vCPUs)"
        NEEDS_UPGRADE=true
    elif [ $CPU_CORES -lt 4 ]; then
        print_warning "$CPU_CORES CPU cores - Below recommended"
        echo "  Current: Likely e2-standard-2 (~$50/mo)"
        echo "  Recommended: n2-standard-4 (4 vCPUs) - ~$120/mo"
        echo "  Speed improvement: 2x faster"
        SHOULD_UPGRADE=true
    else
        print_success "$CPU_CORES CPU cores - Good!"
    fi

    echo ""

    # RAM
    TOTAL_RAM_MB=$(free -m | grep Mem | awk '{print $2}')
    TOTAL_RAM_GB=$((TOTAL_RAM_MB / 1024))
    AVAILABLE_RAM_MB=$(free -m | grep Mem | awk '{print $7}')
    AVAILABLE_RAM_GB=$((AVAILABLE_RAM_MB / 1024))

    echo "Total RAM: ${TOTAL_RAM_GB}GB"
    echo "Available RAM: ${AVAILABLE_RAM_GB}GB"

    if [ $TOTAL_RAM_GB -lt 4 ]; then
        print_error "Only ${TOTAL_RAM_GB}GB RAM - CRITICAL!"
        echo "  Llama 3.2 3B needs at least 4GB RAM"
        NEEDS_UPGRADE=true
    elif [ $TOTAL_RAM_GB -lt 8 ]; then
        print_warning "${TOTAL_RAM_GB}GB RAM - Minimal"
        echo "  Recommended: 16GB for better performance"
        SHOULD_UPGRADE=true
    else
        print_success "${TOTAL_RAM_GB}GB RAM - Good!"
    fi

    echo ""

    # GPU
    if command -v nvidia-smi &> /dev/null; then
        print_success "NVIDIA GPU detected!"
        nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
        echo "  GPU provides 5-10x speedup!"
        echo "  Make sure num_gpu: 1 in services/ragService.js"
    else
        print_warning "No GPU detected"
        echo "  Adding NVIDIA T4 GPU: ~$180/month extra"
        echo "  Speed improvement: 5-10x faster (0.5-1s responses)"
        HAS_NO_GPU=true
    fi

    echo ""

    # Disk
    echo "Disk I/O Performance:"
    DISK_TYPE=$(lsblk -d -o name,rota | grep -v loop | tail -n +2 | awk '{print $2}')
    if [ "$DISK_TYPE" = "0" ]; then
        print_success "SSD detected (fast)"
    else
        print_warning "HDD detected (slow) - Consider SSD"
    fi
else
    print_info "Skipping resource check (not on Linux server)"
fi

echo ""

# Step 3: Check Ollama status
echo "================================================"
echo "Step 3: Ollama Service Status"
echo "================================================"
echo ""

if command -v ollama &> /dev/null; then
    print_success "Ollama is installed"

    # Check if service is running
    if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama service is running"

        # List models
        echo ""
        echo "Installed models:"
        ollama list

        # Check current model size
        CURRENT_MODEL=$(grep "LLAMA_MODEL" .env 2>/dev/null | cut -d'=' -f2 || echo "llama3.2:3b")
        echo ""
        echo "Current model: $CURRENT_MODEL"

        if [[ "$CURRENT_MODEL" == *"3b"* ]]; then
            print_info "Using 3B model (~2GB)"
            echo "  Options for faster responses:"
            echo "    • llama3.2:3b-q4_0 - 50% faster, 1.7GB"
            echo "    • phi:2.7b - 2x faster, good quality"
            echo "    • tinyllama:1.1b - 3x faster, simple queries"
        fi

    else
        print_error "Ollama service is not responding"
        echo "  Try: sudo systemctl restart ollama"
    fi

    # Check Ollama config
    if [ "$IS_SERVER" = true ] && [ -f "/etc/systemd/system/ollama.service" ]; then
        echo ""
        echo "Ollama service configuration:"

        if grep -q "OLLAMA_NUM_PARALLEL=4" /etc/systemd/system/ollama.service; then
            print_success "Parallel processing enabled (4 threads)"
        else
            print_warning "Parallel processing not optimized"
            echo "  Run: ./scripts/optimize-llama-performance.sh"
        fi

        if grep -q "OLLAMA_KEEP_ALIVE=10m" /etc/systemd/system/ollama.service; then
            print_success "Keep-alive optimized (10 minutes)"
        else
            print_warning "Keep-alive not optimized"
            echo "  Run: ./scripts/optimize-llama-performance.sh"
        fi
    fi
else
    print_error "Ollama is not installed"
    echo "  Run: ./scripts/deploy-rag-gcloud.sh"
fi

echo ""

# Step 4: Performance test
echo "================================================"
echo "Step 4: Response Time Test"
echo "================================================"
echo ""

if command -v ollama &> /dev/null && curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    print_info "Running performance test (this may take 10-20 seconds)..."
    echo ""

    # Test 1: First response (cold start)
    echo "Test 1: Cold start (first request after idle)"
    START_TIME=$(date +%s%3N)
    ollama run llama3.2:3b "Say 'OK' only" > /dev/null 2>&1
    END_TIME=$(date +%s%3N)
    COLD_START_MS=$((END_TIME - START_TIME))
    COLD_START_SEC=$((COLD_START_MS / 1000))

    echo "  Time: ${COLD_START_SEC}s (${COLD_START_MS}ms)"

    if [ $COLD_START_MS -lt 3000 ]; then
        print_success "Excellent! (<3s)"
    elif [ $COLD_START_MS -lt 5000 ]; then
        print_success "Good (3-5s)"
    elif [ $COLD_START_MS -lt 10000 ]; then
        print_warning "Acceptable (5-10s) - Could be better"
    else
        print_error "Slow (>10s) - NEEDS OPTIMIZATION"
    fi

    echo ""

    # Test 2: Warm response
    echo "Test 2: Warm response (model already loaded)"
    START_TIME=$(date +%s%3N)
    ollama run llama3.2:3b "Say 'OK' only" > /dev/null 2>&1
    END_TIME=$(date +%s%3N)
    WARM_MS=$((END_TIME - START_TIME))
    WARM_SEC=$((WARM_MS / 1000))

    echo "  Time: ${WARM_SEC}s (${WARM_MS}ms)"

    if [ $WARM_MS -lt 2000 ]; then
        print_success "Excellent! (<2s)"
    elif [ $WARM_MS -lt 5000 ]; then
        print_success "Good (2-5s)"
    elif [ $WARM_MS -lt 10000 ]; then
        print_warning "Acceptable (5-10s) - Could be better"
    else
        print_error "Slow (>10s) - NEEDS OPTIMIZATION"
    fi

    echo ""

    # Test 3: Longer response
    echo "Test 3: Realistic query (full response)"
    START_TIME=$(date +%s%3N)
    ollama run llama3.2:3b "In 2 sentences, what is artificial intelligence?" > /dev/null 2>&1
    END_TIME=$(date +%s%3N)
    FULL_MS=$((END_TIME - START_TIME))
    FULL_SEC=$((FULL_MS / 1000))

    echo "  Time: ${FULL_SEC}s (${FULL_MS}ms)"

    if [ $FULL_MS -lt 3000 ]; then
        print_success "Excellent! (<3s)"
    elif [ $FULL_MS -lt 5000 ]; then
        print_success "Good (3-5s)"
    elif [ $FULL_MS -lt 10000 ]; then
        print_warning "Acceptable (5-10s) - Usable but slow"
    else
        print_error "Slow (>10s) - USER EXPERIENCE POOR"
        SLOW_RESPONSES=true
    fi
else
    print_info "Skipping performance test (Ollama not available)"
fi

echo ""
echo ""

# Final recommendations
echo "================================================"
echo "RECOMMENDATIONS"
echo "================================================"
echo ""

if [ "$SLOW_RESPONSES" = true ] || [ "$NEEDS_UPGRADE" = true ]; then
    echo "🚨 IMMEDIATE ACTION REQUIRED:"
    echo ""

    if [ "$NEEDS_UPGRADE" = true ]; then
        echo "1. Your VM is underpowered for Llama 3.2 3B"
        echo "   Current specs are insufficient"
        echo ""
        echo "   Minimum upgrade:"
        echo "   ┌─────────────────────────────────────────┐"
        echo "   │ Machine Type: e2-standard-2             │"
        echo "   │ vCPUs: 2                                │"
        echo "   │ RAM: 8GB                                │"
        echo "   │ Cost: ~$50/month                        │"
        echo "   │ Expected speed: 5-10s responses         │"
        echo "   └─────────────────────────────────────────┘"
        echo ""
    fi

    if [ "$SLOW_RESPONSES" = true ]; then
        echo "2. Switch to a faster model immediately:"
        echo "   ollama pull llama3.2:3b-q4_0"
        echo "   # Update .env: LLAMA_MODEL=llama3.2:3b-q4_0"
        echo "   # Then: pm2 restart mosalapro"
        echo ""
        echo "   Expected improvement: 50% faster"
        echo ""
    fi

    echo "3. Run optimization script:"
    echo "   ./scripts/optimize-llama-performance.sh"
    echo ""
fi

echo "💡 UPGRADE OPTIONS (if budget allows):"
echo ""

echo "Option 1: Better CPU (Recommended)"
echo "┌─────────────────────────────────────────┐"
echo "│ Machine Type: n2-standard-4             │"
echo "│ vCPUs: 4                                │"
echo "│ RAM: 16GB                               │"
echo "│ Cost: ~$120/month (+$70)                │"
echo "│ Expected speed: 2-3s responses          │"
echo "│ Improvement: 2-3x faster                │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "Upgrade command:"
echo "  gcloud compute instances stop YOUR-INSTANCE"
echo "  gcloud compute instances set-machine-type YOUR-INSTANCE \\"
echo "    --machine-type n2-standard-4"
echo "  gcloud compute instances start YOUR-INSTANCE"
echo ""

echo "Option 2: Add GPU (Best Performance)"
echo "┌─────────────────────────────────────────┐"
echo "│ GPU: NVIDIA T4                          │"
echo "│ Cost: ~$300/month total                 │"
echo "│ Expected speed: 0.5-1s responses        │"
echo "│ Improvement: 10x faster                 │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "Upgrade command:"
echo "  gcloud compute instances stop YOUR-INSTANCE"
echo "  gcloud compute instances set-machine-type YOUR-INSTANCE \\"
echo "    --machine-type n1-standard-4"
echo "  gcloud compute instances attach-gpu YOUR-INSTANCE \\"
echo "    --gpu-type nvidia-tesla-t4 --gpu-count 1"
echo "  gcloud compute instances start YOUR-INSTANCE"
echo "  # Then update ragService.js: num_gpu: 1"
echo ""

echo "Option 3: Switch to Cloud API (No hardware costs)"
echo "┌─────────────────────────────────────────┐"
echo "│ Service: OpenAI GPT-3.5 / Claude Haiku │"
echo "│ Cost: ~$0.002 per request               │"
echo "│ Expected speed: 0.2-0.5s responses      │"
echo "│ Improvement: 20x faster                 │"
echo "│ Tradeoff: Pay per request vs fixed cost│"
echo "└─────────────────────────────────────────┘"
echo ""

echo "🎯 RECOMMENDED PATH:"
echo ""

if [ "$NEEDS_UPGRADE" = true ]; then
    echo "  1. URGENT: Upgrade to e2-standard-2 minimum"
    echo "  2. Switch to quantized model (llama3.2:3b-q4_0)"
    echo "  3. Run optimization script"
    echo "  4. Test - if still slow, upgrade to n2-standard-4"
    echo "  5. If budget allows, add T4 GPU for best results"
elif [ "$SLOW_RESPONSES" = true ]; then
    echo "  1. Switch to quantized model (llama3.2:3b-q4_0) - FREE"
    echo "  2. Run optimization script - FREE"
    echo "  3. Test - if still slow, upgrade to n2-standard-4"
    echo "  4. If budget allows, add T4 GPU"
elif [ "$SHOULD_UPGRADE" = true ]; then
    echo "  1. Try quantized model first (llama3.2:3b-q4_0) - FREE"
    echo "  2. If not satisfied, upgrade to n2-standard-4"
    echo "  3. For production-ready speed, add T4 GPU"
else
    echo "  Your hardware is adequate!"
    echo "  1. Ensure optimization script was run"
    echo "  2. Consider quantized model for extra speed"
    echo "  3. For even better performance, add GPU"
fi

echo ""
echo "================================================"
echo "Full guide: LLAMA_PERFORMANCE_OPTIMIZATION.md"
echo "Quick fixes: LLAMA_QUICK_FIXES.md"
echo "================================================"
echo ""
