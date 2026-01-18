#!/bin/bash
# ============================================================================
# CourseLLM Server Startup Script (Linux/macOS/Codespaces)
# ============================================================================
# Starts all servers for manual testing/development
# Run from project root: ./scripts/start-servers.sh
# ============================================================================

set -e

echo ""
echo "=============================================="
echo "  CourseLLM Development Server Startup"
echo "=============================================="
echo ""

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
echo "[INFO] Project root: $PROJECT_ROOT"
echo ""

# Initialize variables
FIREBASE_CMD="firebase"

# Track PIDs for cleanup
PIDS=()

# Cleanup function
cleanup() {
    echo ""
    echo "[STEP] ===== CLEANUP: Stopping all services ====="

    # Kill tracked PIDs
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "[INFO] Killing process $pid"
            kill "$pid" 2>/dev/null || true
        fi
    done

    # Kill by port as fallback
    for port in 9002 8000 9099 8080 5001 4000; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            echo "[INFO] Killing process on port $port (PID: $pid)"
            kill $pid 2>/dev/null || true
        fi
    done

    echo "[STEP] Cleanup complete."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ============================================================================
# PHASE 0: PRE-FLIGHT CLEANUP (Kill zombie processes)
# ============================================================================
echo "[STEP] ===== PHASE 0: PRE-FLIGHT CLEANUP ====="
echo "[INFO] Killing any processes on required ports..."

for port in 9002 8000 9099 8080 5001 4000; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "[INFO] Killing process on port $port (PID: $pid)"
        kill $pid 2>/dev/null || true
        sleep 1
    fi
done

echo ""
echo "[INFO] Pre-flight cleanup complete."
echo ""

# ============================================================================
# PHASE 1: PROVISIONING (Quick check for dependencies)
# ============================================================================
echo "[STEP] ===== PHASE 1: PROVISIONING ====="
echo ""

# 1.1 Check Node.js
echo "[STEP] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "[FAIL] Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi
echo "[INFO] Node.js version: $(node --version)"

# 1.2 Check Python
echo "[STEP] Checking Python installation..."
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    if command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo "[FAIL] Python is not installed. Please install Python 3.11+ and try again."
        exit 1
    fi
fi
echo "[INFO] Python version: $($PYTHON_CMD --version)"

# 1.3 Check Root Dependencies (quick check)
echo "[STEP] Checking root dependencies..."
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing root dependencies (first run)"
    npm install
    echo "[INFO] Root dependencies installed successfully."
else
    echo "[INFO] Root dependencies already present, skipping install."
fi

# 1.4 Check Firebase Functions Build
echo "[STEP] Checking Firebase Functions..."
if [ ! -d "functions/lib" ]; then
    echo "[INFO] Building Firebase Functions (first run)"
    cd functions
    npm install
    npm run build
    cd "$PROJECT_ROOT"
    echo "[INFO] Firebase Functions built successfully."
else
    echo "[INFO] Firebase Functions already built, skipping."
fi

# 1.5 Setup Python Virtual Environment
echo "[STEP] Checking Python environment for DSPy service..."
cd dspy_service

if [ ! -d "venv" ]; then
    echo "[INFO] Creating Python virtual environment (first run)"
    $PYTHON_CMD -m venv venv
    echo "[INFO] Virtual environment created."
else
    echo "[INFO] Virtual environment already exists."
fi

source venv/bin/activate

# Check if requirements are installed
if ! python -c "import dspy" 2>/dev/null; then
    echo "[INFO] Installing Python dependencies (first run)"
    pip install -r requirements.txt --quiet --disable-pip-version-check
    echo "[INFO] Python dependencies installed."
else
    echo "[INFO] Python dependencies already installed, skipping."
fi

cd "$PROJECT_ROOT"
echo "[INFO] Python environment ready."

# 1.6 Check Firebase Tools
echo "[STEP] Checking firebase-tools..."
if ! command -v firebase &> /dev/null; then
    echo "[WARN] firebase-tools not found globally. Will use npx."
    FIREBASE_CMD="npx --yes firebase"
else
    echo "[INFO] firebase-tools version: $(firebase --version)"
fi

# 1.7 Ensure Playwright browsers (if needed)
echo "[STEP] Checking Playwright browsers..."
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "[INFO] Installing Playwright browsers (first run)"
    npx --yes playwright install chromium
    echo "[INFO] Playwright browsers installed."
else
    echo "[INFO] Playwright browsers already installed, skipping."
fi

echo ""
echo "[STEP] PHASE 1 COMPLETE: All dependencies ready."
echo ""

# ============================================================================
# PHASE 2: ORCHESTRATION (Start all services)
# ============================================================================
echo "[STEP] ===== PHASE 2: ORCHESTRATION ====="
echo ""

# 2.1 Start Python DSPy Service
echo "[STEP] Starting Python DSPy service on port 8000..."
cd dspy_service
source venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000 &
PIDS+=($!)
cd "$PROJECT_ROOT"
echo "[INFO] Python service starting in background (PID: ${PIDS[-1]})"

# 2.2 Start Firebase Emulators
echo "[STEP] Starting Firebase Emulators..."
$FIREBASE_CMD emulators:start --only auth,firestore,functions &
PIDS+=($!)
echo "[INFO] Firebase Emulators starting in background (PID: ${PIDS[-1]})"

# 2.3 Wait for Emulator Ports
echo "[STEP] Waiting for emulators to be ready - this may take up to 90 seconds"
npx --yes wait-on tcp:9099 tcp:8080 tcp:5001 --timeout 90000 || {
    echo "[FAIL] Emulators failed to start within timeout."
    exit 1
}
echo "[INFO] All emulator ports are ready."

# 2.4 Wait for Python service
echo "[STEP] Waiting for Python DSPy service..."
npx --yes wait-on tcp:8000 --timeout 30000 || {
    echo "[WARN] Python service may not be fully ready but continuing"
}

# 2.5 Seed Test Data
echo "[STEP] Seeding test users..."
node scripts/seed-test-users.js || {
    echo "[WARN] Seed script completed with warnings - users may already exist"
}

# 2.6 Start Next.js Dev Server
echo "[STEP] Starting Next.js dev server on port 9002..."
npm run dev &
PIDS+=($!)
echo "[INFO] Next.js server starting in background (PID: ${PIDS[-1]})"

# 2.7 Wait for Frontend
echo "[STEP] Waiting for frontend to be ready - this may take up to 3 minutes"
npx --yes wait-on http://localhost:9002 --timeout 180000 || {
    echo "[FAIL] Frontend failed to start within timeout."
    exit 1
}
echo "[INFO] Frontend is ready at http://localhost:9002"

echo ""
echo "[STEP] PHASE 2 COMPLETE: All services running."
echo ""

# ============================================================================
# READY STATE
# ============================================================================
echo ""
echo "====================================================="
echo "  ✓✓✓ SERVERS READY - WAITING FOR MANUAL TESTS ✓✓✓"
echo "====================================================="
echo ""
echo "Services running:"
echo "  • Python DSPy:        http://localhost:8000"
echo "  • Firebase Auth:      http://localhost:9099"
echo "  • Firebase Firestore: http://localhost:8080"
echo "  • Firebase Functions: http://localhost:5001"
echo "  • Emulator UI:        http://localhost:4000"
echo "  • Next.js Frontend:   http://localhost:9002"
echo ""
echo "Test accounts (seeded):"
echo "  • Student: student@test.com / password123"
echo "  • Teacher: teacher@test.com / password123"
echo ""
echo "To run E2E tests:"
echo "  npx playwright test tests/e2e/chat-context.spec.ts"
echo ""
echo "Press Ctrl+C to stop servers and exit..."
echo "====================================================="
echo ""

# Keep script running
wait
