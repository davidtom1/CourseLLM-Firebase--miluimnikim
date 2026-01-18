@echo off
REM ============================================================================
REM CourseLLM Zero-Trust Verification Script (Windows)
REM ============================================================================
REM Run from project root: scripts\verify-system.bat
REM ============================================================================

setlocal EnableDelayedExpansion

echo.
echo ==============================================
echo   CourseLLM Zero-Trust Verification System
echo ==============================================
echo.

REM Get project root directory
pushd "%~dp0\.."
set "PROJECT_ROOT=%CD%"
echo [INFO] Project root: %PROJECT_ROOT%
echo.

REM Initialize variables
set "TEST_EXIT_CODE=0"
set "FIREBASE_CMD=firebase"

REM ============================================================================
REM PHASE 0: PRE-FLIGHT CLEANUP (Kill zombie processes and WAIT for port release)
REM ============================================================================
echo [STEP] ===== PHASE 0: PRE-FLIGHT CLEANUP =====
echo [INFO] Killing any processes on required ports...

REM Kill background processes by window title first
taskkill /FI "WINDOWTITLE eq DSPy_Service*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Firebase_Emulators*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq NextJS_Server*" /F >nul 2>nul

REM Kill Java (Firebase emulator processes)
taskkill /IM "java.exe" /F >nul 2>nul

REM Kill processes on each required port
call :kill_port 9002 "Next.js"
call :kill_port 8000 "Python DSPy"
call :kill_port 9099 "Firebase Auth"
call :kill_port 8080 "Firebase Firestore"
call :kill_port 5001 "Firebase Functions"
call :kill_port 4000 "Firebase Emulator UI"

echo.
echo [INFO] Verifying all ports are free...

REM Verify each port is actually free (with timeout)
call :wait_port_free 9002 30
if errorlevel 1 goto :port_cleanup_failed
call :wait_port_free 8000 30
if errorlevel 1 goto :port_cleanup_failed
call :wait_port_free 9099 30
if errorlevel 1 goto :port_cleanup_failed
call :wait_port_free 8080 30
if errorlevel 1 goto :port_cleanup_failed
call :wait_port_free 5001 30
if errorlevel 1 goto :port_cleanup_failed

echo.
echo [INFO] All ports confirmed free. Pre-flight cleanup complete.
echo.
goto :phase1

:port_cleanup_failed
echo [FAIL] Could not free all required ports within timeout.
echo [FAIL] Please manually close applications using these ports and try again.
set "TEST_EXIT_CODE=1"
goto :cleanup

REM ============================================================================
REM PHASE 1: PROVISIONING
REM ============================================================================
:phase1
echo [STEP] ===== PHASE 1: PROVISIONING =====
echo.

REM 1.1 Check Node.js
echo [STEP] Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo [FAIL] Node.js is not installed. Please install Node.js 18+ and try again.
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)
for /f "tokens=*" %%i in ('node --version') do echo [INFO] Node.js version: %%i

REM 1.2 Check Python
echo [STEP] Checking Python installation...
where python >nul 2>nul
if errorlevel 1 (
    echo [FAIL] Python is not installed. Please install Python 3.11+ and try again.
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)
for /f "tokens=*" %%i in ('python --version') do echo [INFO] Python version: %%i

REM 1.3 Install Root Dependencies
echo [STEP] Installing root dependencies...
call npm install
if errorlevel 1 (
    echo [FAIL] npm install failed.
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)

REM 1.4 Install and Build Firebase Functions
echo [STEP] Installing and building Firebase Functions...
pushd functions
call npm install
if errorlevel 1 (
    echo [FAIL] npm install in functions failed.
    popd
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)
echo [INFO] Compiling TypeScript functions...
call npm run build
if errorlevel 1 (
    echo [FAIL] Firebase Functions build failed.
    popd
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)
popd
echo [INFO] Firebase Functions built successfully.

REM 1.5 Setup Python Virtual Environment
echo [STEP] Setting up Python environment for DSPy service...
pushd dspy_service

if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Installing Python dependencies...
pip install -r requirements.txt --quiet --disable-pip-version-check

popd
echo [INFO] Python environment ready.

REM 1.6 Check Firebase Tools
echo [STEP] Checking firebase-tools...
where firebase >nul 2>nul
if errorlevel 1 (
    echo [WARN] firebase-tools not found globally. Will use npx.
    set "FIREBASE_CMD=npx --yes firebase"
) else (
    for /f "tokens=*" %%i in ('firebase --version') do echo [INFO] firebase-tools version: %%i
)

REM 1.7 Install Playwright browsers
echo [STEP] Ensuring Playwright browsers are installed...
call npx --yes playwright install chromium

echo.
echo [STEP] PHASE 1 COMPLETE: All dependencies installed and built.
echo.

REM ============================================================================
REM PHASE 2: ORCHESTRATION
REM ============================================================================
echo [STEP] ===== PHASE 2: ORCHESTRATION =====
echo.

REM 2.1 Start Python DSPy Service
echo [STEP] Starting Python DSPy service on port 8000...
pushd dspy_service
call venv\Scripts\activate.bat
start "DSPy_Service" /B cmd /c "venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 2>&1"
popd
echo [INFO] Python service starting...

REM 2.2 Start Firebase Emulators
echo [STEP] Starting Firebase Emulators...
start "Firebase_Emulators" /B cmd /c "%FIREBASE_CMD% emulators:start --only auth,firestore,functions 2>&1"
echo [INFO] Firebase Emulators starting...

REM 2.3 Wait for Emulator Ports
echo [STEP] Waiting for emulators to be ready...
call npx --yes wait-on tcp:9099 tcp:8080 tcp:5001 --timeout 90000
if errorlevel 1 (
    echo [FAIL] Emulators failed to start within timeout.
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)
echo [INFO] All emulator ports are ready.

REM 2.4 Wait for Python service
echo [STEP] Waiting for Python DSPy service...
call npx --yes wait-on tcp:8000 --timeout 30000
if errorlevel 1 (
    echo [WARN] Python service may not be fully ready, continuing...
)

REM 2.5 Seed Test Data
echo [STEP] Seeding test users...
call node scripts\seed-test-users.js
if errorlevel 1 (
    echo [WARN] Seed script completed with warnings.
)

REM 2.6 Start Next.js Dev Server
echo [STEP] Starting Next.js dev server on port 9002...
start "NextJS_Server" /B cmd /c "npm run dev 2>&1"
echo [INFO] Next.js server starting...

REM 2.7 Wait for Frontend
echo [STEP] Waiting for frontend to be ready...
call npx --yes wait-on http://localhost:9002 --timeout 180000
if errorlevel 1 (
    echo [FAIL] Frontend failed to start within timeout.
    set "TEST_EXIT_CODE=1"
    goto :cleanup
)
echo [INFO] Frontend is ready at http://localhost:9002

echo.
echo [STEP] PHASE 2 COMPLETE: All services running.
echo.

REM ============================================================================
REM PHASE 3: VERIFICATION
REM ============================================================================
echo [STEP] ===== PHASE 3: VERIFICATION =====
echo.

REM 3.1 Run Playwright E2E Tests
echo [STEP] Running Playwright E2E tests...
call npm run test:e2e
if errorlevel 1 (
    set "TEST_EXIT_CODE=1"
    echo.
    echo [FAIL] ==========================================
    echo [FAIL]   SOME TESTS FAILED
    echo [FAIL] ==========================================
    echo.
) else (
    echo.
    echo [STEP] ==========================================
    echo [STEP]   ALL TESTS PASSED SUCCESSFULLY!
    echo [STEP] ==========================================
    echo.
)

REM ============================================================================
REM PHASE 4: CLEANUP
REM ============================================================================
:cleanup
echo.
echo [STEP] ===== PHASE 4: CLEANUP =====
echo [STEP] Cleaning up background processes...

REM Kill background processes by window title
taskkill /FI "WINDOWTITLE eq DSPy_Service*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Firebase_Emulators*" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq NextJS_Server*" /F >nul 2>nul

REM Kill by port as fallback
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":9002 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":9099 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":8080 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":5001 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":4000 " ^| findstr "LISTENING"') do taskkill /PID %%p /F >nul 2>nul

REM Kill Java (emulator processes) as last resort
taskkill /IM "java.exe" /F >nul 2>nul

echo [STEP] Cleanup complete.

popd 2>nul
endlocal
exit /b %TEST_EXIT_CODE%

REM ============================================================================
REM SUBROUTINE: Kill process on a specific port
REM Usage: call :kill_port PORT_NUMBER "SERVICE_NAME"
REM ============================================================================
:kill_port
set "PORT=%~1"
set "SERVICE_NAME=%~2"
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo [INFO] Killing %SERVICE_NAME% on port %PORT% (PID: %%p)
    taskkill /PID %%p /F >nul 2>nul
)
exit /b 0

REM ============================================================================
REM SUBROUTINE: Wait until a port is free (not LISTENING)
REM Usage: call :wait_port_free PORT_NUMBER TIMEOUT_SECONDS
REM Returns: errorlevel 0 if free, 1 if still occupied after timeout
REM ============================================================================
:wait_port_free
set "CHECK_PORT=%~1"
set "TIMEOUT_SEC=%~2"
set "ELAPSED=0"

:wait_port_loop
REM Check if port is still in use
netstat -aon 2>nul | findstr ":%CHECK_PORT% " | findstr "LISTENING" >nul 2>nul
if errorlevel 1 (
    REM Port is free (findstr didn't find anything)
    echo [OK] Port %CHECK_PORT% is free.
    exit /b 0
)

REM Port still occupied, wait and retry
if %ELAPSED% GEQ %TIMEOUT_SEC% (
    echo [FAIL] Port %CHECK_PORT% still occupied after %TIMEOUT_SEC% seconds.
    exit /b 1
)

echo [WAIT] Port %CHECK_PORT% still in use, waiting... (%ELAPSED%/%TIMEOUT_SEC%s)
timeout /t 1 /nobreak >nul
set /a ELAPSED+=1
goto :wait_port_loop
