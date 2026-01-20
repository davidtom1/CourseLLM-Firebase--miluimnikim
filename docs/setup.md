# Setup Guide

---

## Recommended Path for Reviewers & Grading

> **This project runs entirely in local development mode using Firebase emulators.**
> **No production deployment or production credentials are required for grading.**

### Prerequisites

Install Node.js 22+, Python 3.12+, and Java 11+ before proceeding:

**macOS (Homebrew):**
```bash
brew install node@22 python@3.12 openjdk@11
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm python3.12 python3-pip python3-venv openjdk-11-jre
```

**Windows (Chocolatey):**
```powershell
choco install nodejs python openjdk11
```

**Windows (WinGet):**
```powershell
winget install OpenJS.NodeJS Python.Python.3.12 EclipseAdoptium.Temurin.11.JRE
```

**Verify installations:**
```bash
node --version    # Should show v22.x.x
python --version  # Should show 3.12.x or higher
java -version     # Should show 11 or higher
```

### Fastest Local Setup (5 Steps)

1. **Clone the repository**:

2. **Clone the repository**:
   ```bash
   git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
   cd CourseLLM-Firebase
   ```

3. **Create environment files**:
   ```bash
   # Main app environment
   cp .env.example .env.local

   # DSPy service environment
   cp dspy_service/.env.example dspy_service/.env
   ```
   Then add your Google API key to BOTH files (see [Environment Configuration](#environment-configuration))

4. **Install npm dependencies** (first time only):
   ```bash
   npm install
   ```

5. **Run the automated setup script**:
   ```bash
   ./scripts/start-servers.sh        # Linux/macOS
   .\scripts\start-servers.bat       # Windows (PowerShell)
   ```

6. **Open the app**: http://localhost:9002
   - Login with `student@test.com` / `password123`

**That's it.** If this works, you do NOT need to read the rest of this document.

---

## Table of Contents

- [Environment Configuration](#environment-configuration) - **Read this section**
- [Automated Setup Script](#automated-setup-script) - Recommended approach
- [Manual Setup](#manual-setup-step-by-step) - For debugging only
- [Running Services](#running-services-4-terminals) - If not using automated script
- [Troubleshooting](#troubleshooting)
- [Reviewer Confidence Checklist](#reviewer-confidence-checklist)

---

## Environment Configuration

> **This is the ONE place for environment setup.** All other sections reference this.

### Two Environment Files Required

This project requires **TWO** environment files:

| File | Location | Purpose |
|------|----------|---------|
| `.env.local` | Project root | Next.js app configuration |
| `.env` | `dspy_service/` | Python DSPy service configuration |

### Step 1: Create Both Environment Files

```bash
# From project root
cp .env.example .env.local
cp dspy_service/.env.example dspy_service/.env
```

### Step 2: Add Your API Key to Both Files

**Edit `.env.local`** (project root):
```bash
# REQUIRED: Google AI API Key (get free at https://aistudio.google.com/app/apikey)
GOOGLE_API_KEY=your-google-api-key
GEMINI_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key

# ALREADY SET (do not change) - Firebase runs in emulator mode
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

**Edit `dspy_service/.env`**:
```bash
# REQUIRED: Same Google API Key
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-google-api-key
GOOGLE_API_KEY=your-google-api-key
```

### What You Need to Know

| Credential | Required? | Where to Get |
|------------|-----------|--------------|
| Google API Key | **Yes** | [Google AI Studio](https://aistudio.google.com/app/apikey) (free tier) |
| Firebase Production Keys | **No** | Emulators handle everything locally |
| OpenAI Key | **No** | Optional alternative to Gemini |

---

## Automated Setup Script

> **If this script runs successfully, skip the [Manual Setup](#manual-setup-step-by-step) section entirely.**

The automated script installs all dependencies and starts all services locally.

### Before Running the Script

Ensure you have completed:
1. **Installed prerequisites** (see [Prerequisites](#prerequisites) above)
2. **Created both environment files** with your API key (see [Environment Configuration](#environment-configuration))
3. **Run `npm install`** at least once

### Linux / macOS

```bash
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase

# Create environment files
cp .env.example .env.local
cp dspy_service/.env.example dspy_service/.env
# Edit both files to add your Google API key

# Install dependencies (required before first run)
npm install

# Run automated setup
./scripts/start-servers.sh
```

### Windows (PowerShell)

```powershell
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase

# Create environment files
cp .env.example .env.local
cp dspy_service/.env.example dspy_service/.env
# Edit both files to add your Google API key

# Install dependencies (required before first run)
npm install

# Run automated setup
.\scripts\start-servers.bat
```

### What the Script Does

The script automatically:
- Checks Node.js and Python are installed
- Installs root `node_modules/` (if missing)
- Builds `functions/lib/` and installs `functions/node_modules/` (if missing)
- Creates Python virtual environment `dspy_service/venv/` (if missing)
- Installs Python dependencies
- Installs Playwright browsers (if missing)
- Starts Firebase emulators
- Starts DSPy service
- Seeds test users
- Starts Next.js development server

**When complete**, open http://localhost:9002 and login with test credentials.

---

## Manual Setup (Step-by-Step)

> **This section is for debugging or advanced control only.**
> **Not required for grading if the automated script works.**

### Prerequisites

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 22 LTS | Frontend & build | [nodejs.org](https://nodejs.org) |
| **Python** | 3.12+ | DSPy service | [python.org](https://python.org) |
| **Java** | 11+ | Firebase emulators | [adoptium.net](https://adoptium.net) |
| **Firebase CLI** | 13.0.0+ | Emulator management | `npm install -g firebase-tools` |

<details>
<summary><strong>Platform-Specific Installation Commands</strong></summary>

**macOS (Homebrew):**
```bash
brew install node@22 python@3.12 openjdk@11
npm install -g firebase-tools
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm python3.12 python3-pip python3-venv openjdk-11-jre
npm install -g firebase-tools
```

**Windows (Chocolatey):**
```powershell
choco install nodejs python openjdk11 firebase-tools
```

**Windows (WinGet):**
```powershell
winget install OpenJS.NodeJS Python.Python.3.12 EclipseAdoptium.Temurin.11.JRE
npm install -g firebase-tools
```

</details>

### Step 1: Clone Repository

```bash
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
```

### Step 2: Create Environment Files

```bash
# Main app environment
cp .env.example .env.local

# DSPy service environment
cp dspy_service/.env.example dspy_service/.env
```

Edit BOTH files to add your Google API key. See [Environment Configuration](#environment-configuration).

### Step 3: Install Node.js Dependencies

```bash
# Install root dependencies
npm install

# Install and build Firebase Functions
cd functions
npm install
npm run build
cd ..
```

This creates:
- `node_modules/` - Root dependencies
- `functions/node_modules/` - Functions dependencies
- `functions/lib/` - Compiled functions

### Step 4: Set Up Python Environment

```bash
cd dspy_service

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate        # Linux/macOS
.\venv\Scripts\Activate.ps1     # Windows

# Install Python dependencies
pip install -r requirements.txt

cd ..
```

This creates:
- `dspy_service/venv/` - Python virtual environment

### Step 5: Generate DataConnect SDK (if needed)

```bash
npm run dataconnect:generate
```

This creates:
- `src/dataconnect-generated/` - Client SDK

### Step 6: Start Services

See [Running Services](#running-services-4-terminals) below.

---

## Running Services (4 Terminals)

> **Skip this if using the automated setup script.**

You need **4 separate terminals** running simultaneously:

### Terminal 1: DSPy Service

```bash
cd dspy_service
source venv/bin/activate        # Linux/macOS
# .\venv\Scripts\Activate.ps1   # Windows
python -m uvicorn app:app --reload --port 8000
```

**Expected:** `Uvicorn running on http://127.0.0.1:8000`

### Terminal 2: Firebase Emulators

```bash
firebase emulators:start --only auth,firestore,functions
```

**Expected:** `All emulators ready!`

> **Note:** Requires Java 11+ installed

### Terminal 3: Seed Test Users

Run **every time** you restart emulators:

```bash
node scripts/seed-test-users.js
```

**Expected:** `Done! Test users: student@test.com, teacher@test.com`

### Terminal 4: Next.js Server

```bash
npm run dev
```

**Expected:** `Ready` on http://localhost:9002

---

## Generated Files & Folders

These are created locally and listed in `.gitignore`:

| Path | Created By | Purpose |
|------|------------|---------|
| `node_modules/` | `npm install` | Root dependencies |
| `functions/node_modules/` | `cd functions && npm install` | Functions dependencies |
| `functions/lib/` | `cd functions && npm run build` | Compiled functions |
| `dspy_service/venv/` | `python -m venv venv` | Python environment |
| `src/dataconnect-generated/` | `npm run dataconnect:generate` | DataConnect SDK |
| `.env.local` | `cp .env.example .env.local` | App configuration |
| `dspy_service/.env` | `cp dspy_service/.env.example dspy_service/.env` | DSPy configuration |

---

## Service URLs & Test Credentials

| Service | URL |
|---------|-----|
| **Main App** | http://localhost:9002 |
| **Emulator UI** | http://localhost:4000 |
| **DSPy API Docs** | http://localhost:8000/docs |

| Role | Email | Password |
|------|-------|----------|
| Student | `student@test.com` | `password123` |
| Teacher | `teacher@test.com` | `password123` |

---

## Troubleshooting

### Port Already in Use

```bash
# Linux/macOS
lsof -i :9002 && kill -9 <PID>

# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F
```

### Firebase Emulator Won't Start (Java Missing)

Firebase emulators require Java 11+. Install from [adoptium.net](https://adoptium.net).

```bash
# Verify Java is installed
java -version
```

### Firebase Emulator Won't Connect

```bash
# Linux/macOS
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Windows PowerShell
$Env:FIRESTORE_EMULATOR_HOST = "localhost:8080"
$Env:FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
```

### Module Not Found (Node)

```bash
npm install
cd functions && npm install && npm run build && cd ..
```

### Module Not Found (Python)

```bash
cd dspy_service
source venv/bin/activate   # or .\venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
```

### DataConnect SDK Missing

```bash
npm run dataconnect:generate
```

---

## Reviewer Confidence Checklist

Use this to verify your local setup is complete:

- [ ] Prerequisites installed (Node.js 22+, Python 3.12+, Java 11+)
- [ ] `.env.local` file exists with Google API key
- [ ] `dspy_service/.env` file exists with Google API key
- [ ] `node_modules/` folder exists
- [ ] `functions/lib/` folder exists
- [ ] `dspy_service/venv/` folder exists
- [ ] Firebase emulators running (check http://localhost:4000)
- [ ] DSPy service running on port 8000 (check http://localhost:8000/health)
- [ ] Next.js running on port 9002 (check http://localhost:9002/api/health)
- [ ] App loads in browser at http://localhost:9002
- [ ] Can login with `student@test.com` / `password123`
- [ ] Chat interface appears on course page

**If all boxes are checked, the project is ready for grading.**

---

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Start dev server | `npm run dev` |
| Run E2E tests | `npm run test:e2e` |
| Run unit tests | `npm run test` |
| Run linter | `npm run lint` |
| Build production | `npm run build` |
| Generate DataConnect SDK | `npm run dataconnect:generate` |

---

**Last Updated**: January 2026
