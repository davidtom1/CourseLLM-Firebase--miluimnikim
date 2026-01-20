# Setup Guide

This guide covers 4 ways to set up the project:

1. [Automated Windows Setup](#1-automated-windows-setup) - Recommended for Windows users
2. [Automated Linux Setup](#2-automated-linux-setup) - Recommended for Linux/macOS users
3. [Manual Windows Setup](#3-manual-windows-setup) - Step-by-step for Windows
4. [Manual Linux Setup](#4-manual-linux-setup) - Step-by-step for Linux/macOS

---

## Prerequisites

Install Node.js 22+, Python 3.12+, and Java 11+ before proceeding:

**Windows (Chocolatey):**
```powershell
choco install nodejs python openjdk11
```

**Windows (WinGet):**
```powershell
winget install OpenJS.NodeJS Python.Python.3.12 EclipseAdoptium.Temurin.11.JRE
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm python3.12 python3-pip python3-venv openjdk-11-jre
```

**macOS (Homebrew):**
```bash
brew install node@22 python@3.12 openjdk@11
```

**Verify installations:**
```bash
node --version    # Should show v22.x.x
python --version  # Should show 3.12.x or higher
java -version     # Should show 11 or higher
```

---

## 1. Automated Windows Setup

### Step 1: Clone the Repository

```powershell
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
```

### Step 2: Create Environment Files

Create two environment files from the examples:

```powershell
cp .env.example .env.local
cp dspy_service/.env.example dspy_service/.env
```

**Edit `.env.local`** (project root) - Add your **Google API Key**:
```bash
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_API_KEY=your-google-api-key-here
```
Get your Google API key from: https://aistudio.google.com/app/apikey

**Edit `dspy_service/.env`** - Add your **OpenAI API Key**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```
Get your OpenAI API key from: https://platform.openai.com/api-keys

### Step 3: Run the Automated Script

```powershell
.\scripts\start-servers.bat
```

The script will automatically install all dependencies and start all services.

### Step 4: Testing

For testing instructions, see the [Testing Guide](testing/readme.md).

---

## 2. Automated Linux Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
```

### Step 2: Create Environment Files

Create two environment files from the examples:

```bash
cp .env.example .env.local
cp dspy_service/.env.example dspy_service/.env
```

**Edit `.env.local`** (project root) - Add your **Google API Key**:
```bash
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_API_KEY=your-google-api-key-here
```
Get your Google API key from: https://aistudio.google.com/app/apikey

**Edit `dspy_service/.env`** - Add your **OpenAI API Key**:
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```
Get your OpenAI API key from: https://platform.openai.com/api-keys

### Step 3: Run the Automated Script

```bash
./scripts/start-servers.sh
```

The script will automatically install all dependencies and start all services.

### Step 4: Access the Application

Once the script completes, open http://localhost:9002 and login with:
- **Student**: `student@test.com` / `password123`
- **Teacher**: `teacher@test.com` / `password123`

### Step 5: Testing

For testing instructions, see the [Testing Guide](testing/readme.md).

---

## 3. Manual Windows Setup

Follow these steps exactly as they appear in the `scripts/start-servers.bat` script.

### Phase 0: Pre-flight Cleanup

Kill any processes on required ports:

```powershell
# Kill background processes by window title
taskkill /FI "WINDOWTITLE eq DSPy_Service*" /F 2>$null
taskkill /FI "WINDOWTITLE eq Firebase_Emulators*" /F 2>$null
taskkill /FI "WINDOWTITLE eq NextJS_Server*" /F 2>$null

# Kill Java (Firebase emulator processes)
taskkill /IM "java.exe" /F 2>$null

# Kill processes on each required port
netstat -ano | findstr ":9002 " | findstr "LISTENING"
netstat -ano | findstr ":8000 " | findstr "LISTENING"
netstat -ano | findstr ":9099 " | findstr "LISTENING"
netstat -ano | findstr ":8080 " | findstr "LISTENING"
netstat -ano | findstr ":5001 " | findstr "LISTENING"
netstat -ano | findstr ":4000 " | findstr "LISTENING"
# Use taskkill /PID <PID> /F to kill any processes found
```

### Phase 1: Provisioning

#### 1.1 Check Node.js

```powershell
node --version
```

#### 1.2 Check Python

```powershell
python --version
```

#### 1.3 Install Root Dependencies

```powershell
# If node_modules doesn't exist
npm install
```

#### 1.4 Build Firebase Functions

```powershell
# If functions/lib doesn't exist
cd functions
npm install
npm run build
cd ..
```

#### 1.5 Setup Python Virtual Environment

```powershell
cd dspy_service

# Create virtual environment if it doesn't exist
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate.bat

# Install Python dependencies
pip install -r requirements.txt --quiet --disable-pip-version-check

cd ..
```

#### 1.6 Check Firebase Tools

```powershell
# Check if firebase-tools is installed
firebase --version

# If not installed globally, use npx
npx --yes firebase --version
```

#### 1.7 Install Playwright Browsers

```powershell
# If Playwright browsers not installed
npx --yes playwright install chromium
```

### Phase 2: Orchestration

#### 2.1 Start Python DSPy Service (Terminal 1)

```powershell
cd dspy_service
.\venv\Scripts\activate.bat
venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
```

#### 2.2 Start Firebase Emulators (Terminal 2)

```powershell
firebase emulators:start --only auth,firestore,functions
# Or if firebase not installed globally:
npx --yes firebase emulators:start --only auth,firestore,functions
```

#### 2.3 Wait for Emulators

```powershell
npx --yes wait-on tcp:9099 tcp:8080 tcp:5001 --timeout 90000
```

#### 2.4 Wait for Python Service

```powershell
npx --yes wait-on tcp:8000 --timeout 30000
```

#### 2.5 Seed Test Users (Terminal 3)

```powershell
node scripts\seed-test-users.js
```

#### 2.6 Start Next.js Dev Server (Terminal 4)

```powershell
npm run dev
```

#### 2.7 Wait for Frontend

```powershell
npx --yes wait-on http://localhost:9002 --timeout 180000
```

### Access the Application

Open http://localhost:9002 and login with:
- **Student**: `student@test.com` / `password123`
- **Teacher**: `teacher@test.com` / `password123`

### Service URLs

| Service | URL |
|---------|-----|
| Next.js Frontend | http://localhost:9002 |
| Python DSPy | http://localhost:8000 |
| Firebase Auth | http://localhost:9099 |
| Firebase Firestore | http://localhost:8080 |
| Firebase Functions | http://localhost:5001 |
| Emulator UI | http://localhost:4000 |

---

## 4. Manual Linux Setup

Follow these steps exactly as they appear in the `scripts/start-servers.sh` script.

### Phase 0: Pre-flight Cleanup

Kill any processes on required ports:

```bash
for port in 9002 8000 9099 8080 5001 4000; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill $pid 2>/dev/null || true
        sleep 1
    fi
done
```

### Phase 1: Provisioning

#### 1.1 Check Node.js

```bash
node --version
```

#### 1.2 Check Python

```bash
python3 --version
# Or if python3 not available:
python --version
```

#### 1.3 Install Root Dependencies

```bash
# If node_modules doesn't exist
npm install
```

#### 1.4 Build Firebase Functions

```bash
# If functions/lib doesn't exist
cd functions
npm install
npm run build
cd ..
```

#### 1.5 Setup Python Virtual Environment

```bash
cd dspy_service

# Create virtual environment if it doesn't exist
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt --quiet --disable-pip-version-check

cd ..
```

#### 1.6 Check Firebase Tools

```bash
# Check if firebase-tools is installed
firebase --version

# If not installed globally, use npx
npx --yes firebase --version
```

#### 1.7 Install Playwright Browsers

```bash
# If Playwright browsers not installed (~/.cache/ms-playwright doesn't exist)
npx --yes playwright install chromium
```

### Phase 2: Orchestration

#### 2.1 Start Python DSPy Service (Terminal 1)

```bash
cd dspy_service
source venv/bin/activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

#### 2.2 Start Firebase Emulators (Terminal 2)

```bash
firebase emulators:start --only auth,firestore,functions
# Or if firebase not installed globally:
npx --yes firebase emulators:start --only auth,firestore,functions
```

#### 2.3 Wait for Emulators

```bash
npx --yes wait-on tcp:9099 tcp:8080 tcp:5001 --timeout 90000
```

#### 2.4 Wait for Python Service

```bash
npx --yes wait-on tcp:8000 --timeout 30000
```

#### 2.5 Seed Test Users (Terminal 3)

```bash
node scripts/seed-test-users.js
```

#### 2.6 Start Next.js Dev Server (Terminal 4)

```bash
npm run dev
```

#### 2.7 Wait for Frontend

```bash
npx --yes wait-on http://localhost:9002 --timeout 180000
```

### Access the Application

Open http://localhost:9002 and login with:
- **Student**: `student@test.com` / `password123`
- **Teacher**: `teacher@test.com` / `password123`

### Service URLs

| Service | URL |
|---------|-----|
| Next.js Frontend | http://localhost:9002 |
| Python DSPy | http://localhost:8000 |
| Firebase Auth | http://localhost:9099 |
| Firebase Firestore | http://localhost:8080 |
| Firebase Functions | http://localhost:5001 |
| Emulator UI | http://localhost:4000 |

---

## Troubleshooting

### Port Already in Use

**Windows:**
```powershell
netstat -ano | findstr :9002
taskkill /PID <PID> /F
```

**Linux/macOS:**
```bash
lsof -i :9002 && kill -9 <PID>
```

### Firebase Emulator Won't Start (Java Missing)

Firebase emulators require Java 11+. Install from [adoptium.net](https://adoptium.net).

```bash
java -version
```

### Module Not Found (Node)

```bash
npm install
cd functions && npm install && npm run build && cd ..
```

### Module Not Found (Python)

```bash
cd dspy_service
source venv/bin/activate   # Linux/macOS
# or .\venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
```

---

**Last Updated**: January 2026
