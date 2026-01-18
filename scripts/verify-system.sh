#!/bin/bash
# =============================================================================
# CourseLLM Zero-Trust Verification Script
# =============================================================================
# This script provisions, orchestrates, tests, and cleans up the entire system.
# Run from a fresh clone with: bash scripts/verify-system.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_step() { echo -e "${GREEN}[STEP]${NC} $1"; }
echo_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
echo_fail() { echo -e "${RED}[FAIL]${NC} $1"; }
echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# Store PIDs for cleanup
PIDS=()

cleanup() {
    echo ""
    echo_step "===== PHASE 4: CLEANUP ====="
    echo_step "Cleaning up background processes..."
    
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo_info "Killing process $pid"
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Kill any remaining processes by name
    echo_info "Cleaning up any remaining services..."
    pkill -f "firebase emulators" 2>/dev/null || true
    pkill -f "uvicorn app:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    echo_step "Cleanup complete."
}

# Trap exit signals to ensure cleanup
trap cleanup EXIT INT TERM

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "=============================================="
echo "  CourseLLM Zero-Trust Verification System"
echo "=============================================="
echo ""
echo_info "Project root: $PROJECT_ROOT"
echo ""

# =============================================================================
# PHASE 1: PROVISIONING
# =============================================================================
echo_step "===== PHASE 1: PROVISIONING ====="
echo ""

# 1.1 Check Node.js
echo_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo_fail "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi
echo_info "Node.js version: $(node --version)"

# 1.2 Check Python
echo_step "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo_fail "Python is not installed. Please install Python 3.11+ and try again."
    exit 1
fi
echo_info "Python version: $($PYTHON_CMD --version)"

# 1.3 Install Root Dependencies
echo_step "Installing root dependencies (npm install)..."
npm install

# 1.4 Install and Build Firebase Functions (CRITICAL)
echo_step "Installing and building Firebase Functions..."
cd functions
npm install
echo_info "Compiling TypeScript functions..."
npm run build
cd "$PROJECT_ROOT"
echo_info "Firebase Functions built successfully."

# 1.5 Setup Python Virtual Environment
echo_step "Setting up Python environment for DSPy service..."
cd dspy_service

if [ ! -d "venv" ]; then
    echo_info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate venv (cross-platform)
if [ -f "venv/Scripts/activate" ]; then
    # Windows Git Bash
    source venv/Scripts/activate
elif [ -f "venv/bin/activate" ]; then
    # Unix/Mac
    source venv/bin/activate
else
    echo_fail "Could not find venv activation script."
    exit 1
fi

echo_info "Installing Python dependencies..."
pip install -r requirements.txt --quiet --disable-pip-version-check
cd "$PROJECT_ROOT"
echo_info "Python environment ready."

# 1.6 Check Firebase Tools
echo_step "Checking firebase-tools..."
if ! command -v firebase &> /dev/null; then
    echo_warn "firebase-tools not found globally. Checking local installation..."
    if [ -f "node_modules/.bin/firebase" ]; then
        FIREBASE_CMD="npx firebase"
        echo_info "Using local firebase-tools via npx."
    else
        echo_warn "Installing firebase-tools globally..."
        npm install -g firebase-tools
        FIREBASE_CMD="firebase"
    fi
else
    FIREBASE_CMD="firebase"
    echo_info "firebase-tools version: $(firebase --version)"
fi

# 1.7 Install Playwright browsers if needed
echo_step "Ensuring Playwright browsers are installed..."
npx --yes playwright install chromium --with-deps 2>/dev/null || npx --yes playwright install chromium

echo ""
echo_step "PHASE 1 COMPLETE: All dependencies installed and built."
echo ""

# =============================================================================
# PHASE 2: ORCHESTRATION
# =============================================================================
echo_step "===== PHASE 2: ORCHESTRATION ====="
echo ""

# 2.1 Start Python DSPy Service (Port 8000)
echo_step "Starting Python DSPy service on port 8000..."
cd dspy_service

# Activate venv again (in case it was deactivated)
if [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Start uvicorn in background
uvicorn app:app --host 0.0.0.0 --port 8000 &
PIDS+=($!)
PYTHON_PID=$!
cd "$PROJECT_ROOT"
echo_info "Python service started (PID: $PYTHON_PID)"

# 2.2 Start Firebase Emulators
echo_step "Starting Firebase Emulators (auth:9099, firestore:8080, functions:5001)..."
$FIREBASE_CMD emulators:start --only auth,firestore,functions &
PIDS+=($!)
FIREBASE_PID=$!
echo_info "Firebase Emulators starting (PID: $FIREBASE_PID)"

# 2.3 Wait for Emulator Ports
echo_step "Waiting for emulators to be ready..."
echo_info "Waiting for ports: 9099 (auth), 8080 (firestore), 5001 (functions)..."

# Use wait-on to wait for TCP ports (--yes avoids npx prompts)
npx --yes wait-on tcp:9099 tcp:8080 tcp:5001 --timeout 90000 || {
    echo_fail "Emulators failed to start within timeout."
    exit 1
}
echo_info "All emulator ports are ready."

# 2.4 Wait for Python service
echo_step "Waiting for Python DSPy service..."
npx --yes wait-on tcp:8000 --timeout 30000 || {
    echo_warn "Python service may not be fully ready, continuing..."
}

# 2.5 Seed Test Data
echo_step "Seeding test users..."
node scripts/seed-test-users.js || {
    echo_warn "Seed script completed with warnings (users may already exist)."
}

# 2.6 Start Next.js Dev Server (Port 9002)
echo_step "Starting Next.js dev server on port 9002..."
npm run dev &
PIDS+=($!)
NEXTJS_PID=$!
echo_info "Next.js server starting (PID: $NEXTJS_PID)"

# 2.7 Wait for Frontend
echo_step "Waiting for frontend to be ready (this may take a minute)..."
npx --yes wait-on http://localhost:9002 --timeout 180000 || {
    echo_fail "Frontend failed to start within timeout."
    exit 1
}
echo_info "Frontend is ready at http://localhost:9002"

echo ""
echo_step "PHASE 2 COMPLETE: All services running."
echo ""

# =============================================================================
# PHASE 3: VERIFICATION
# =============================================================================
echo_step "===== PHASE 3: VERIFICATION ====="
echo ""

# 3.1 Run Playwright E2E Tests
echo_step "Running Playwright E2E tests..."
npm run test:e2e

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo_step "=========================================="
    echo_step "  ALL TESTS PASSED SUCCESSFULLY!"
    echo_step "=========================================="
    echo ""
else
    echo ""
    echo_fail "=========================================="
    echo_fail "  SOME TESTS FAILED (exit code: $TEST_EXIT_CODE)"
    echo_fail "=========================================="
    echo ""
fi

# Cleanup will be called automatically via trap
exit $TEST_EXIT_CODE

