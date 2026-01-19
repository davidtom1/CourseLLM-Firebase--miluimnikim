#!/bin/bash
# ============================================================================
# CourseLLM Server Startup Script (Linux/macOS/Codespaces)
# ============================================================================
# Starts all servers for manual testing/development
# Run from project root: bash scripts/start-servers.sh
# ============================================================================

set -e  # Exit on error (will be selectively disabled where needed)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root directory (script is in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Track background PIDs for cleanup
PIDS=()

echo ""
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}  CourseLLM Development Server Startup${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""
echo -e "[INFO] Project root: $PROJECT_ROOT"
echo ""

# ============================================================================
# CLEANUP HANDLER (runs on Ctrl+C or script exit)
# ============================================================================
cleanup() {
    echo ""
    echo -e "${YELLOW}[STEP] ===== CLEANUP: Stopping all services =====${NC}"
    
    # Kill tracked background processes
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "[INFO] Killing process $pid"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 1
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    # Kill processes on specific ports as fallback
    kill_port 9002 "Next.js" || true
    kill_port 8000 "Python DSPy" || true
    kill_port 9099 "Firebase Auth" || true
    kill_port 8080 "Firebase Firestore" || true
    kill_port 5001 "Firebase Functions" || true
    kill_port 4000 "Firebase Emulator UI" || true
    kill_port 9400 "Firebase Data Connect" || true
    
    # Kill any remaining Java processes (Firebase emulators)
    pkill -f "firebase" 2>/dev/null || true
    pkill -f "java.*emulator" 2>/dev/null || true
    
    echo -e "${GREEN}[STEP] Cleanup complete.${NC}"
    exit 0
}

# Trap signals for cleanup
trap cleanup SIGINT SIGTERM EXIT

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# Kill process on a specific port
kill_port() {
    local PORT=$1
    local SERVICE_NAME=$2
    
    # Try lsof first (macOS and most Linux)
    if command -v lsof &> /dev/null; then
        local PID=$(lsof -ti :"$PORT" 2>/dev/null)
        if [ -n "$PID" ]; then
            echo -e "[INFO] Killing $SERVICE_NAME on port $PORT (PID: $PID)"
            kill -9 $PID 2>/dev/null || true
            return 0
        fi
    fi
    
    # Fallback to fuser (Linux)
    if command -v fuser &> /dev/null; then
        fuser -k "$PORT/tcp" 2>/dev/null || true
    fi
    
    # Fallback to ss + kill (Linux)
    if command -v ss &> /dev/null; then
        local PID=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K\d+' | head -1)
        if [ -n "$PID" ]; then
            echo -e "[INFO] Killing $SERVICE_NAME on port $PORT (PID: $PID)"
            kill -9 $PID 2>/dev/null || true
        fi
    fi
}

# Wait for a port to be free
wait_port_free() {
    local PORT=$1
    local TIMEOUT=$2
    local ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        # Check if port is in use
        if command -v lsof &> /dev/null; then
            if ! lsof -i :"$PORT" &>/dev/null; then
                echo -e "${GREEN}[OK] Port $PORT is free.${NC}"
                return 0
            fi
        elif command -v ss &> /dev/null; then
            if ! ss -tln | grep -q ":$PORT "; then
                echo -e "${GREEN}[OK] Port $PORT is free.${NC}"
                return 0
            fi
        elif command -v netstat &> /dev/null; then
            if ! netstat -tln | grep -q ":$PORT "; then
                echo -e "${GREEN}[OK] Port $PORT is free.${NC}"
                return 0
            fi
        else
            # No tool available, assume free
            return 0
        fi
        
        echo -e "[WAIT] Port $PORT still in use, waiting... ($ELAPSED/${TIMEOUT}s)"
        sleep 1
        ((ELAPSED++))
    done
    
    echo -e "${RED}[FAIL] Port $PORT still occupied after $TIMEOUT seconds.${NC}"
    return 1
}

# Wait for a port to be ready (accepting connections)
wait_port_ready() {
    local PORT=$1
    local TIMEOUT=$2
    local ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if nc -z localhost "$PORT" 2>/dev/null || (echo > /dev/tcp/localhost/$PORT) 2>/dev/null; then
            echo -e "${GREEN}[OK] Port $PORT is ready.${NC}"
            return 0
        fi
        
        echo -e "[WAIT] Waiting for port $PORT... ($ELAPSED/${TIMEOUT}s)"
        sleep 2
        ((ELAPSED+=2))
    done
    
    echo -e "${RED}[FAIL] Port $PORT not ready after $TIMEOUT seconds.${NC}"
    return 1
}

# ============================================================================
# PHASE 0: PRE-FLIGHT CLEANUP (Kill zombie processes)
# ============================================================================
echo -e "${YELLOW}[STEP] ===== PHASE 0: PRE-FLIGHT CLEANUP =====${NC}"
echo -e "[INFO] Killing any processes on required ports..."

kill_port 9002 "Next.js"
kill_port 8000 "Python DSPy"
kill_port 9099 "Firebase Auth"
kill_port 8080 "Firebase Firestore"
kill_port 5001 "Firebase Functions"
kill_port 4000 "Firebase Emulator UI"
kill_port 9400 "Firebase Data Connect"

# Kill any lingering Firebase/Java processes
pkill -f "firebase" 2>/dev/null || true
pkill -f "java.*emulator" 2>/dev/null || true

echo ""
echo -e "[INFO] Verifying all ports are free..."

set +e  # Don't exit on error for port checks
wait_port_free 9002 30 || { echo -e "${RED}[FAIL] Could not free port 9002${NC}"; exit 1; }
wait_port_free 8000 30 || { echo -e "${RED}[FAIL] Could not free port 8000${NC}"; exit 1; }
wait_port_free 9099 30 || { echo -e "${RED}[FAIL] Could not free port 9099${NC}"; exit 1; }
wait_port_free 8080 30 || { echo -e "${RED}[FAIL] Could not free port 8080${NC}"; exit 1; }
wait_port_free 5001 30 || { echo -e "${RED}[FAIL] Could not free port 5001${NC}"; exit 1; }
set -e

echo ""
echo -e "${GREEN}[INFO] All ports confirmed free. Pre-flight cleanup complete.${NC}"
echo ""

# ============================================================================
# PHASE 1: PROVISIONING (Quick check for dependencies)
# ============================================================================
echo -e "${YELLOW}[STEP] ===== PHASE 1: PROVISIONING =====${NC}"
echo ""

# 1.1 Check Node.js
echo -e "[STEP] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[FAIL] Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi
echo -e "[INFO] Node.js version: $(node --version)"

# 1.2 Check Python
echo -e "[STEP] Checking Python installation..."
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo -e "${RED}[FAIL] Python is not installed. Please install Python 3.11+ and try again.${NC}"
    exit 1
fi
echo -e "[INFO] Python version: $($PYTHON_CMD --version)"

# 1.3 Check Root Dependencies
echo -e "[STEP] Checking root dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "[INFO] Installing root dependencies (first run)..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[FAIL] npm install failed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[INFO] Root dependencies installed successfully.${NC}"
else
    echo -e "[INFO] Root dependencies already present, skipping install."
fi

# 1.4 Check Firebase Functions Build
echo -e "[STEP] Checking Firebase Functions..."
if [ ! -d "functions/lib" ]; then
    echo -e "[INFO] Building Firebase Functions (first run)..."
    pushd functions > /dev/null
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[FAIL] npm install in functions failed.${NC}"
        popd > /dev/null
        exit 1
    fi
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}[FAIL] Firebase Functions build failed.${NC}"
        popd > /dev/null
        exit 1
    fi
    popd > /dev/null
    echo -e "${GREEN}[INFO] Firebase Functions built successfully.${NC}"
else
    echo -e "[INFO] Firebase Functions already built, skipping."
fi

# 1.5 Setup Python Virtual Environment
echo -e "[STEP] Checking Python environment for DSPy service..."
pushd dspy_service > /dev/null

if [ ! -d "venv" ]; then
    echo -e "[INFO] Creating Python virtual environment (first run)..."
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}[FAIL] Failed to create Python venv.${NC}"
        popd > /dev/null
        exit 1
    fi
    echo -e "${GREEN}[INFO] Virtual environment created.${NC}"
else
    echo -e "[INFO] Virtual environment already exists."
fi

# Activate venv
source venv/bin/activate

# Check if requirements are installed by testing for a key package
if ! python -c "import dspy" 2>/dev/null; then
    echo -e "[INFO] Installing Python dependencies (first run)..."
    pip install -r requirements.txt --quiet --disable-pip-version-check
    if [ $? -ne 0 ]; then
        echo -e "${RED}[FAIL] pip install failed.${NC}"
        popd > /dev/null
        exit 1
    fi
    echo -e "${GREEN}[INFO] Python dependencies installed.${NC}"
else
    echo -e "[INFO] Python dependencies already installed, skipping."
fi

popd > /dev/null
echo -e "${GREEN}[INFO] Python environment ready.${NC}"

# 1.6 Check Firebase Tools
echo -e "[STEP] Checking firebase-tools..."
FIREBASE_CMD=""
if command -v firebase &> /dev/null; then
    echo -e "[INFO] firebase-tools version: $(firebase --version)"
    FIREBASE_CMD="firebase"
else
    echo -e "${YELLOW}[WARN] firebase-tools not found globally. Will use npx.${NC}"
    FIREBASE_CMD="npx --yes firebase"
fi

# 1.7 Ensure Playwright browsers (if needed for future tests)
echo -e "[STEP] Checking Playwright browsers..."
if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "/root/.cache/ms-playwright" ]; then
    echo -e "[INFO] Installing Playwright browsers (first run)..."
    npx --yes playwright install chromium
    echo -e "${GREEN}[INFO] Playwright browsers installed.${NC}"
else
    echo -e "[INFO] Playwright browsers already installed, skipping."
fi

echo ""
echo -e "${GREEN}[STEP] PHASE 1 COMPLETE: All dependencies ready.${NC}"
echo ""

# ============================================================================
# PHASE 2: ORCHESTRATION (Start all services)
# ============================================================================
echo -e "${YELLOW}[STEP] ===== PHASE 2: ORCHESTRATION =====${NC}"
echo ""

# 2.1 Start Python DSPy Service
echo -e "[STEP] Starting Python DSPy service on port 8000..."
pushd dspy_service > /dev/null
source venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000 &
DSPY_PID=$!
PIDS+=($DSPY_PID)
popd > /dev/null
echo -e "[INFO] Python service starting (PID: $DSPY_PID)..."

# 2.2 Start Firebase Emulators
echo -e "[STEP] Starting Firebase Emulators..."
$FIREBASE_CMD emulators:start --only auth,firestore,functions &
FIREBASE_PID=$!
PIDS+=($FIREBASE_PID)
echo -e "[INFO] Firebase Emulators starting (PID: $FIREBASE_PID)..."

# 2.3 Wait for Emulator Ports
echo -e "[STEP] Waiting for emulators to be ready (up to 90 seconds)..."
set +e  # Don't exit on wait failure
npx --yes wait-on tcp:9099 tcp:8080 tcp:5001 --timeout 90000
if [ $? -ne 0 ]; then
    echo -e "${RED}[FAIL] Emulators failed to start within timeout.${NC}"
    echo -e "${RED}[FAIL] Check terminal output for Firebase errors.${NC}"
    exit 1
fi
set -e
echo -e "${GREEN}[INFO] All emulator ports are ready.${NC}"

# 2.4 Wait for Python service
echo -e "[STEP] Waiting for Python DSPy service..."
set +e
npx --yes wait-on tcp:8000 --timeout 30000
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[WARN] Python service may not be fully ready but continuing...${NC}"
fi
set -e

# 2.5 Seed Test Data
echo -e "[STEP] Seeding test users..."
set +e
node scripts/seed-test-users.js
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[WARN] Seed script completed with warnings - users may already exist${NC}"
fi
set -e

# 2.6 Start Next.js Dev Server
echo -e "[STEP] Starting Next.js dev server on port 9002..."
npm run dev &
NEXTJS_PID=$!
PIDS+=($NEXTJS_PID)
echo -e "[INFO] Next.js server starting (PID: $NEXTJS_PID)..."

# 2.7 Wait for Frontend
echo -e "[STEP] Waiting for frontend to be ready (up to 3 minutes)..."
set +e
npx --yes wait-on http://localhost:9002 --timeout 180000
if [ $? -ne 0 ]; then
    echo -e "${RED}[FAIL] Frontend failed to start within timeout.${NC}"
    exit 1
fi
set -e
echo -e "${GREEN}[INFO] Frontend is ready at http://localhost:9002${NC}"

echo ""
echo -e "${GREEN}[STEP] PHASE 2 COMPLETE: All services running.${NC}"
echo ""

# ============================================================================
# READY STATE
# ============================================================================
echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  ✓✓✓ SERVERS READY - WAITING FOR MANUAL TESTS ✓✓✓${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo -e "Services running:"
echo -e "  • Python DSPy:        http://localhost:8000"
echo -e "  • Firebase Auth:      http://localhost:9099"
echo -e "  • Firebase Firestore: http://localhost:8080"
echo -e "  • Firebase Functions: http://localhost:5001"
echo -e "  • Emulator UI:        http://localhost:4000"
echo -e "  • Next.js Frontend:   http://localhost:9002"
echo ""
echo -e "Test accounts (seeded):"
echo -e "  • Student: student@test.com / password123"
echo -e "  • Teacher: teacher@test.com / password123"
echo ""
echo -e "Background PIDs:"
echo -e "  • DSPy Service:       $DSPY_PID"
echo -e "  • Firebase Emulators: $FIREBASE_PID"
echo -e "  • Next.js Server:     $NEXTJS_PID"
echo ""
echo -e "To run E2E tests:"
echo -e "  npx playwright test tests/e2e/student-journey.spec.ts"
echo ""
echo -e "Press Ctrl+C to stop all servers and exit..."
echo -e "${GREEN}=====================================================${NC}"
echo ""

# Keep script running - wait for any background process to exit
# This allows Ctrl+C to trigger the cleanup trap
wait

