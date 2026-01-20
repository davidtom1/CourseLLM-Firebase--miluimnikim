# Setup Guide

---

## Recommended Path for Reviewers & Grading

> **This project runs entirely in local development mode using Firebase emulators.**
> **No production deployment or production credentials are required for grading.**

### Fastest Local Setup (4 Steps)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
   cd CourseLLM-Firebase
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env.local
   ```
   Then add your Google API key (see [Environment Configuration](#environment-configuration) for details)

3. **Run the automated setup script**:
   ```bash
   ./scripts/start-servers.sh        # Linux/macOS
   .\scripts\start-servers.bat       # Windows (PowerShell)
   ```

4. **Open the app**: http://localhost:9002
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

### Step 1: Create the Environment File

```bash
cp .env.example .env.local
```

### Step 2: Add Your API Key

Edit `.env.local` and set ONE real API key:

```bash
# REQUIRED: Google AI API Key (get free at https://aistudio.google.com/app/apikey)
GOOGLE_API_KEY=your-google-api-key
GEMINI_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key

# ALREADY SET (do not change) - Firebase runs in emulator mode
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
LLM_PROVIDER=gemini
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

### Linux / macOS

```bash
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
cp .env.example .env.local   # Add your API key (see above)
./scripts/start-servers.sh
```

### Windows (PowerShell)

```powershell
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
cp .env.example .env.local   # Add your API key (see above)
.\scripts\start-servers.bat
```

### What the Script Does

- Installs Node.js dependencies (pnpm)
- Installs Python dependencies (uv)
- Starts Firebase emulators
- Starts DSPy service
- Starts Next.js development server

**When complete**, open http://localhost:9002 and login with test credentials.

---

## Manual Setup (Step-by-Step)

> **This section is for debugging or advanced control only.**
> **Not required for grading if the automated script works.**

### Prerequisites

| Tool | Version | Installation |
|------|---------|--------------|
| Node.js | 22 LTS | [nodejs.org](https://nodejs.org) |
| Python | 3.12+ | [python.org](https://python.org) |
| pnpm | Latest | `npm install -g pnpm` |
| uv | Latest | `pip install uv` |
| Firebase CLI | 13.0.0+ | `npm install -g firebase-tools` |

<details>
<summary><strong>Platform-Specific Installation Commands</strong></summary>

**macOS (Homebrew):**
```bash
brew install node@22 python@3.12 pnpm
pip3 install uv
npm install -g firebase-tools
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm python3.12 python3-pip
npm install -g pnpm firebase-tools
pip3 install uv
```

**Windows (Chocolatey):**
```powershell
choco install nodejs python pnpm firebase-tools
pip install uv
```

**Windows (WinGet):**
```powershell
winget install OpenJS.NodeJS Python
npm install -g pnpm firebase-tools
pip install uv
```

</details>

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
pnpm install
uv sync
```

### Step 2: Configure Environment

See [Environment Configuration](#environment-configuration) above.

### Step 3: Set Up Python Environment

```bash
cd dspy_service
python -m venv venv

# Activate:
source venv/bin/activate        # Linux/macOS
.\venv\Scripts\Activate.ps1     # Windows

uv sync
cd ..
```

### Step 4: Start Services

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
firebase emulators:start --only auth,firestore,dataconnect
```

**Expected:** `All emulators ready!`

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

### Firebase Emulator Won't Connect

```bash
# Linux/macOS
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# Windows PowerShell
$Env:FIRESTORE_EMULATOR_HOST = "localhost:8080"
$Env:FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
```

### Module Not Found

```bash
# Node modules
pnpm install --force

# Python modules
cd dspy_service && uv sync --force
```

---

## Reviewer Confidence Checklist

Use this to verify your local setup is complete:

- [ ] `.env.local` file exists with Google API key
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
| Start dev server | `npm run dev` |
| Run E2E tests | `npm run test:e2e` |
| Run unit tests | `npm run test` |
| Run linter | `npm run lint` |
| Build production | `npm run build` |

---

**Last Updated**: January 2026
