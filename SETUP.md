# Setup & Development Guide

This is the authoritative guide for setting up and developing on the CourseLLM project. All setup instructions are consolidated here.

---

## ⚡ Quick Start (TL;DR)

### 🎯 Choose Your Path

#### 🚀 GitHub Codespaces (Easiest - Recommended!)
Perfect for cloud development. Everything auto-installs in 2-3 minutes.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/LLMs-for-SE-2026-BGU/CourseLLM-Firebase)

**After creating Codespace:**
1. Update `.env.local` with your API keys
2. Run the 4-Terminal Setup (see below)

#### 💻 Local Development
Perfect for offline work and maximum control.

```bash
# 1. Install prerequisites (see Prerequisites section)
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
pnpm install && uv sync
cp .env.example .env.local  # Add your API keys
```

### 4-Terminal Service Setup (Both Paths)
**Run these simultaneously in 4 separate terminals:**

```bash
# Terminal 1: DSPy Service
cd dspy_service && source venv/bin/activate && python -m uvicorn app:app --reload --port 8000

# Terminal 2: Firebase Emulators
firebase emulators:start --only auth,firestore,dataconnect

# Terminal 3: Seed Test Users
node scripts/seed-test-users.js

# Terminal 4: Next.js Dev Server
npm run dev  # Opens http://localhost:9002
```

**Wait for all services to show "Ready" messages before proceeding.**

### Essential Commands Reference
| Task | Command |
|------|---------|
| **Lint check** | `npm run lint` |
| **Type check** | `npm run typecheck` |
| **Format code** | `npm run format` |
| **Build prod** | `npm run build` |
| **Add npm package** | `pnpm add <pkg>` |
| **Add python package** | `uv add <pkg>` |
| **Run tests** | `npm run test:e2e` |

---

## 🛠 Prerequisites

### Required Tools

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| **Node.js** | 22 LTS | Frontend (Next.js) | [nodejs.org](https://nodejs.org) |
| **Python** | 3.12+ | DSPy service | [python.org](https://python.org) |
| **pnpm** | Latest | Node package manager | `npm install -g pnpm` |
| **uv** | Latest | Python package manager | `pip install uv` |
| **Firebase CLI** | 13.0.0+ | Local emulators | `npm install -g firebase-tools` |

### Installation by OS

#### 🍎 macOS (Homebrew)
```bash
brew install node@22 python@3.12 pnpm
pip3 install uv
npm install -g firebase-tools
```

#### 🐧 Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nodejs npm python3.12 python3-pip
npm install -g pnpm firebase-tools
pip3 install uv
```

#### 🪟 Windows
```powershell
# Using Chocolatey
choco install nodejs python pnpm firebase-tools

# Using WinGet
winget install OpenJS.NodeJS Python

# Then install uv and pnpm
pip install uv
npm install -g pnpm firebase-tools
```

Or download manually:
- Node.js: https://nodejs.org (choose 22 LTS)
- Python: https://python.org (choose 3.12+)
- Then: `npm install -g pnpm && pip install uv`

---

## 🔑 Environment Variables

### Setup Your .env.local File

```bash
# Copy the template
cp .env.example .env.local

# Edit with your API keys (see values below)
code .env.local  # or use your editor
```

### Required Variables

```bash
# ============================================================================
# Google API & AI Services (Required for IST analysis & Socratic chat)
# ============================================================================
GOOGLE_API_KEY=your-google-api-key
GEMINI_API_KEY=your-google-api-key
NEXT_PUBLIC_GOOGLE_API_KEY=your-google-api-key

# ============================================================================
# Firebase Configuration (Required for Firestore & Auth)
# ============================================================================
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# ============================================================================
# LLM Provider (Choose one)
# ============================================================================
LLM_PROVIDER=gemini
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-your-key (if using OpenAI)
```

### Getting API Keys

#### 🔑 Google API Key (for Gemini)
1. Go: https://console.cloud.google.com
2. Create new project (or use existing)
3. Enable: Google AI Generative API
4. Go: Credentials → Create API Key
5. Copy the key

**OR use free tier at:** https://aistudio.google.com/app/apikey

#### 🔥 Firebase Configuration
1. Go: https://console.firebase.google.com
2. Create project or select existing: `coursewise-f2421`
3. Get config from: Project Settings → Web App
4. Copy the config values (we use emulator locally, so these can be placeholders)

### Full .env.example Reference
See `.env.example` in the root directory for all available configuration options.

---

## 💻 Local Development Setup

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase

# Install Node dependencies (using pnpm - faster than npm!)
pnpm install

# Install Python dependencies (using uv - faster than pip!)
uv sync
```

**First time only - it takes a few minutes.**

### Step 2: Configure Environment

```bash
# Copy template
cp .env.example .env.local

# Edit with your API keys (see above)
```

### Step 3: Start Services (4 Terminals)

You need **4 separate terminals** running simultaneously. Don't close them during development!

#### Terminal 1: DSPy Service (Python AI Engine)

```bash
cd dspy_service

# First time: Create virtual environment
python -m venv venv
source venv/bin/activate      # macOS/Linux
# OR
.\venv\Scripts\activate       # Windows

# Install Python dependencies
uv sync

# Start the service
python -m uvicorn app:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

⚠️ Keep this terminal running!

#### Terminal 2: Firebase Emulators (Local Backend)

```bash
# From project root
firebase emulators:start --only auth,firestore,dataconnect
```

**Expected output:**
```
✔  All emulators ready! It is now safe to connect your app.
  Auth Emulator: http://127.0.0.1:9099
  Firestore Emulator: http://127.0.0.1:8080
  DataConnect Emulator: http://127.0.0.1:9400
  Emulator Suite UI: http://127.0.0.1:4000
```

**If you get "No emulators to start":**
```bash
# Update Firebase CLI
npm install -g firebase-tools@latest

# Then try again
firebase emulators:start
```

⚠️ Keep this terminal running!

#### Terminal 3: Seed Test Users (One-time Per Emulator Reset)

**Run this EVERY TIME you restart the emulators:**

```bash
node scripts/seed-test-users.js
```

**Expected output:**
```
✓ Created auth user: student@test.com
✓ Created Firestore profile for student@test.com
✓ Created auth user: teacher@test.com
✓ Created Firestore profile for teacher@test.com

Done! Test users:
  Student: student@test.com / password123
  Teacher: teacher@test.com / password123
```

#### Terminal 4: Next.js Dev Server (Frontend)

```bash
npm run dev
```

**Expected output:**
```
✓ Ready in Xs
○ Local:   http://localhost:9002
○ Localhost: http://localhost:9002
```

Then **open in browser:** http://localhost:9002

### Step 4: Test the Setup

1. **Browser**: Open http://localhost:9002
2. **Login**: Use `student@test.com` / `password123`
3. **Check Console**: Press F12, watch for `[IST]` logs
4. **Test Chat**: Send a message, see response
5. **Firebase UI**: Open http://localhost:4000 to see data

---

## ☁️ GitHub Codespaces

### One-Click Setup

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/LLMs-for-SE-2026-BGU/CourseLLM-Firebase)

### What Happens Automatically

When you create a Codespace:
1. ✅ Node.js 22 LTS installed
2. ✅ Python 3.12 installed
3. ✅ uv package manager installed
4. ✅ pnpm package manager installed
5. ✅ All npm dependencies installed
6. ✅ All Python dependencies installed
7. ✅ 11 VS Code extensions installed
8. ✅ All ports forwarded (ready to use)

The `postCreateCommand` in `.devcontainer/devcontainer.json` handles everything.

### First Steps in Codespaces

1. **Create Codespaces**: Click the badge above
2. **Wait**: Environment initializes (2-3 minutes)
3. **Create .env.local**:
   ```bash
   cp .env.example .env.local
   code .env.local  # Add your API keys
   ```
4. **Start Services**: Follow [Terminal 1-4 section above](#terminal-1-dspy-service-python-ai-engine)

### Ports (Automatically Forwarded)

| Port | Service | Status |
|------|---------|--------|
| 3000 | Next.js Production | ✅ |
| 9002 | Next.js Dev (default) | ✅ |
| 8000 | DSPy API | ✅ |
| 8080 | Firestore Emulator | ✅ |
| 9099 | Auth Emulator | ✅ |
| 5001 | Functions Emulator | ✅ |
| 4000 | Emulator UI | ✅ |
| 9400 | DataConnect Emulator | ✅ |

All ports appear in VS Code **Ports** tab (bottom panel).

### Machine Types

| Type | vCPU | RAM | Best For |
|------|------|-----|----------|
| 2-core | 2 | 8GB | Quick tests |
| **4-core** | 4 | 16GB | **Recommended** |
| 8-core | 8 | 32GB | Heavy development |

To upgrade: Click profile → Codespaces → Edit machine type

### Tips for Codespaces

- Keep all 4 terminals running
- Use browser's DevTools (F12) for frontend debugging
- Check Emulator UI (port 4000) for data inspection
- Upgrade to 4-core if performance is slow
- Share the SSH remote URL to collaborate

---

## 🩺 Troubleshooting & Verification

### Installation Verification

Run these to verify your setup:

```bash
# Check Node.js
node --version        # Should be v22.x.x or higher

# Check Python
python --version      # Should be 3.12 or higher

# Check pnpm
pnpm --version        # Should be 8.0.0 or higher

# Check uv
uv --version          # Should show recent version

# Check Firebase CLI
firebase --version    # Should be 13.0.0 or higher
```

### Common Issues & Solutions

#### ❌ "Port Already in Use"
**Problem**: Service won't start on port 9002, 8000, etc.

**Solution**:
```bash
# macOS/Linux - Find and kill process
lsof -i :9002
kill -9 <PID>

# Windows - Find and kill process
netstat -ano | findstr :9002
taskkill /PID <PID> /F
```

#### ❌ "Module Not Found: xyz" (Python)
**Problem**: `ModuleNotFoundError` when running DSPy service

**Solution**:
```bash
cd dspy_service
uv sync --force
python -m uvicorn app:app --reload --port 8000
```

#### ❌ "Cannot Find Module" (Node.js)
**Problem**: `Cannot find module 'xyz'`

**Solution**:
```bash
# Reinstall node dependencies
pnpm install

# Or clean and reinstall
pnpm install --force
```

#### ❌ "Firebase Emulator Won't Connect"
**Problem**: Firestore shows connection error

**Solution**:
```bash
# macOS/Linux - Set environment variables
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
firebase emulators:start

# Windows PowerShell - Set environment variables
$Env:FIRESTORE_EMULATOR_HOST = "localhost:8080"
$Env:FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
firebase emulators:start
```

#### ❌ "Codespaces Runs Slowly"
**Problem**: Services timeout or are unresponsive

**Solutions**:
1. Upgrade to 4-core machine (see above)
2. Check internet connection
3. Restart the Codespace
4. Use local development instead

#### ❌ ".env.local Not Recognized"
**Problem**: API keys not loading

**Solution**:
```bash
# 1. Verify file exists
ls -la .env.local  # macOS/Linux
dir .env.local     # Windows

# 2. Check Next.js sees it
npm run dev  # Should log which env it's using

# 3. Verify format
cat .env.local  # macOS/Linux
type .env.local # Windows
```

#### ❌ "TypeScript Errors After Pull"
**Problem**: Lint or typecheck fails

**Solutions**:
```bash
# Reinstall dependencies
pnpm install
uv sync

# Run lint
npm run lint

# Run typecheck
npm run typecheck

# Format code
npm run format
```

### Verification Checklist

After setup, verify everything works:

```bash
✅ Node.js 22+: node --version
✅ Python 3.12+: python --version
✅ pnpm: pnpm --version
✅ uv: uv --version
✅ Firebase CLI 13.0.0+: firebase --version
✅ Dependencies installed: pnpm install (no errors)
✅ Python deps: uv sync (no errors)
✅ DSPy runs: Can access http://localhost:8000/docs
✅ Emulators ready: See "All emulators ready" message
✅ Test login: student@test.com / password123 works
✅ Emulator UI loads: http://localhost:4000
```

### Debug Logs to Check

**Browser Console (F12):**
- Look for `[IST]` logs (Intent analysis)
- Look for `[Firebase]` logs (Firestore operations)
- Look for errors in red

**Terminal 2 (Firebase):**
- Should show `info: GET /` requests
- Should show firestore write operations

**Terminal 1 (DSPy):**
- Should show `POST /analyze_message` requests
- Should show analysis results in response

**Terminal 4 (Next.js):**
- Should show page loads
- Should show HMR updates when you edit files

---

## � Quick Command Reference

### Development Commands
```bash
npm run dev           # Start dev server (port 9002)
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
npm run format        # Auto-format code with Prettier
npm run test:e2e      # Run Playwright E2E tests
npm run dataconnect:generate  # Regenerate DataConnect SDK
```

### Package Management
```bash
# Node.js (pnpm - faster than npm)
pnpm install          # Install all dependencies
pnpm add <pkg>        # Add new package
pnpm remove <pkg>     # Remove package
pnpm run <script>     # Run npm script

# Python (uv - 100x faster than pip)
uv sync               # Install from pyproject.toml
uv add <pkg>          # Add new package
uv remove <pkg>       # Remove package
```

### Service Management
```bash
# Stop a service: Press Ctrl+C in the terminal

# Kill stuck processes:
# macOS/Linux
lsof -i :9002; kill -9 <PID>

# Windows
netstat -ano | findstr :9002
taskkill /PID <PID> /F

# Kill all Node processes (last resort)
taskkill /F /IM node.exe  # Windows
pkill -f node              # macOS/Linux
```

### Debugging
```bash
# View console logs
open http://localhost:9002  # Click F12 for DevTools

# Check Firebase data
open http://localhost:4000  # Emulator UI

# View DSPy API
open http://localhost:8000/docs  # Interactive API docs

# Monitor terminal output
# Terminal 1: DSPy logs
# Terminal 2: Firestore/Auth logs
# Terminal 4: Next.js build logs
```

---

## �📚 Related Documentation

- **Project Overview**: [README.md](README.md)
- **How to Run (Legacy)**: [HOW-TO-RUN.md](HOW-TO-RUN.md)
- **Emulator Troubleshooting**: [START-EMULATORS.md](START-EMULATORS.md)
- **Project Architecture**: [docs/00-PROJECT-BLUEPRINT.md](docs/00-PROJECT-BLUEPRINT.md)
- **Database Guide**: [docs/04-DATABASE-AND-DATA-FLOW.md](docs/04-DATABASE-AND-DATA-FLOW.md)
- **OpenSpec**: [openspec/project.md](openspec/project.md)

---

## 🚀 Next Steps

### After Successful Setup

1. **Explore the Code**: Check `src/app/`, `src/features/`
2. **Read the Blueprint**: [docs/00-PROJECT-BLUEPRINT.md](docs/00-PROJECT-BLUEPRINT.md)
3. **Understand IST**: How Intent-Skill-Trajectory extraction works
4. **Make Changes**: Create a feature branch
5. **Test Locally**: Run lint, typecheck, verify in browser
6. **Commit & Push**: Create a PR

### Common Development Tasks

```bash
# Lint check
npm run lint

# Type check
npm run typecheck

# Format code (auto-fix)
npm run format

# Build for production
npm run build

# Start production server
npm start

# Run E2E tests
npm run test:e2e

# Generate DataConnect SDK
npm run dataconnect:generate
```

---

## 💡 Tips & Best Practices

### Use Modern Package Managers
- ✅ Use `pnpm` instead of `npm` - 50% faster, better for monorepos
- ✅ Use `uv` instead of `pip` - 100x faster, locks versions
- ✅ Run `pnpm install` after pulling changes
- ✅ Run `uv sync` after pulling changes

### Development Workflow
1. **Pull Changes**: `git pull`
2. **Install Deps**: `pnpm install && uv sync`
3. **Create Branch**: `git checkout -b feature/my-feature`
4. **Make Changes**: Edit files
5. **Check Quality**: `npm run lint && npm run typecheck`
6. **Test Locally**: Open browser, test manually
7. **Commit**: `git add . && git commit -m "feat: description"`
8. **Push**: `git push`

### Debugging Tips
- Use browser DevTools (F12) for frontend issues
- Check terminal logs for API errors
- Use Emulator UI (port 4000) to inspect Firestore data
- Add `console.log` in code for debugging
- Use `debugger` statement with DevTools

### Performance
- Codespaces: Upgrade to 4-core machine for best experience
- Local: SSD is much faster than HDD
- Both: Close unused terminals to save resources

---

## ❓ Getting Help

1. **Check Troubleshooting** above (15+ solutions)
2. **Check Related Docs** (links above)
3. **Search GitHub Issues**: https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase/issues
4. **Ask on GitHub**: Create a new issue with details

---

**Last Updated**: January 17, 2026  
**Version**: 1.0 - Consolidated Setup Guide  
**Status**: ✅ Complete & Ready

### One-Click Setup
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/LLMs-for-SE-2026-BGU/CourseLLM-Firebase)

When you open the project in Codespaces:
1. ✅ All dependencies are automatically installed
2. ✅ Environment is pre-configured with Node 22 LTS, Python 3.12, uv, and pnpm
3. ✅ VS Code extensions are auto-installed
4. ✅ All ports are automatically forwarded

**After opening Codespaces:**
1. Create `.env.local` with your API keys (see [Environment Variables](#-environment-variables) below)
2. Follow [Step 2: Start Services](#step-2-start-services-4-terminals)

---

## 💻 Local Setup (macOS, Linux, Windows)

### Step 1: Prerequisites

Install the required tools:

#### macOS (using Homebrew)
```bash
brew install node@22 python@3.12 pnpm
pip3 install uv
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nodejs npm python3.12 python3-pip
npm install -g pnpm
pip3 install uv
```

#### Windows (using Chocolatey or WinGet)
```powershell
# Using Chocolatey
choco install nodejs python pnpm uv

# OR using WinGet
winget install OpenJS.NodeJS Python Google.Chrome-Dev
npm install -g pnpm
pip install uv
```

Or download directly:
- **Node.js 22 LTS**: https://nodejs.org
- **Python 3.12**: https://python.org
- **pnpm**: `npm install -g pnpm`
- **uv**: `pip install uv`

### Step 2: Clone & Install

```bash
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase

# Install Node dependencies
pnpm install

# Install Python dependencies
uv sync
```

### Step 3: Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your API keys
code .env.local  # or use your favorite editor
```

**Required Variables:**
```bash
GOOGLE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
LLM_PROVIDER=gemini
```

**Getting API Keys:**
- 🔑 **Google API Key**: https://console.cloud.google.com/apis/credentials
- 🔥 **Firebase Config**: https://console.firebase.google.com

---

## 🔧 Step 2: Start Services (4 Terminals)

### Terminal 1: DSPy Service (Python)

```bash
# Navigate to DSPy service directory
cd dspy_service

# First time only: Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR
.\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start the service
python -m uvicorn app:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

⚠️ Keep this terminal running!

---

### Terminal 2: Firebase Emulators

```bash
# From root directory
firebase emulators:start --only auth,firestore,dataconnect
```

**Expected output:**
```
✔  All emulators ready! It is now safe to connect your app.
  Auth Emulator: http://127.0.0.1:9099
  Firestore Emulator: http://127.0.0.1:8080
  DataConnect Emulator: http://127.0.0.1:9400
  Emulator Suite UI: http://127.0.0.1:4000
```

**If you get "No emulators to start":**
```bash
# Option A: Start all available emulators
firebase emulators:start

# Option B: Update Firebase CLI
npm install -g firebase-tools
```

⚠️ Keep this terminal running!

---

### Terminal 3: Seed Test Users

**Every time you restart emulators, run this:**

```bash
node scripts/seed-test-users.js
```

**Expected output:**
```
✓ Created auth user: student@test.com
✓ Created Firestore profile for student@test.com
✓ Created auth user: teacher@test.com
✓ Created Firestore profile for teacher@test.com

Done! Test users:
  Student: student@test.com / password123
  Teacher: teacher@test.com / password123
```

---

### Terminal 4: Next.js Dev Server

```bash
npm run dev
```

**Expected output:**
```
✓ Ready in Xs
○ Local:   http://localhost:9002
```

---

## 🌐 Access the Application

### Application URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Next.js App** | http://localhost:9002 | Main application |
| **Emulator UI** | http://localhost:4000 | Firebase emulator dashboard |
| **DSPy API** | http://localhost:8000/docs | DSPy API documentation |

### Test Credentials

**Student Account:**
- Email: `student@test.com`
- Password: `password123`

**Teacher Account:**
- Email: `teacher@test.com`
- Password: `password123`

---

## 📊 Ports Reference

| Port | Service | Notes |
|------|---------|-------|
| **3000** | Next.js Production | Production builds only |
| **9002** | Next.js Dev Server | Development server (default) |
| **8000** | DSPy FastAPI | Intent analysis engine |
| **8080** | Firestore Emulator | Local database |
| **9099** | Auth Emulator | Local authentication |
| **5001** | Functions Emulator | Firebase cloud functions |
| **4000** | Emulator Suite UI | Firebase dashboard |
| **9400** | DataConnect Emulator | PostgreSQL GraphQL layer |

---

## 🛠️ Troubleshooting

### Python Virtual Environment Issues

**Issue:** `ModuleNotFoundError: No module named 'xyz'`

**Solution:**
```bash
cd dspy_service
pip install -r requirements.txt --upgrade
```

### Firebase Emulator Connection Issues

**Issue:** `FIRESTORE_EMULATOR_HOST not recognized`

**Solution - macOS/Linux:**
```bash
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
firebase emulators:start
```

**Solution - Windows (PowerShell):**
```powershell
$Env:FIRESTORE_EMULATOR_HOST = "localhost:8080"
$Env:FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099"
firebase emulators:start
```

### Port Already in Use

**Issue:** `Error: listen EADDRINUSE: address already in use :::9002`

**Solution:**
```bash
# Find process using port 9002
lsof -i :9002  # macOS/Linux
netstat -ano | findstr :9002  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Slow Performance in Codespaces

**Issue:** Services run slowly or timeouts

**Solutions:**
1. Upgrade to a larger machine type in Codespaces settings
2. Use local development for better performance
3. Check available disk space: `df -h`

---

## 📦 Package Managers

### Why pnpm?

We use `pnpm` instead of `npm` because it's:
- ⚡ **Faster** - Uses content-addressable store
- 💾 **Lighter** - Saves disk space
- 🔒 **Stricter** - Prevents dependency issues
- 📦 **Better for monorepos** - Supports workspaces

```bash
# Common pnpm commands
pnpm install          # Install dependencies
pnpm add <package>    # Add package
pnpm remove <package> # Remove package
pnpm run <script>     # Run npm script
```

### Why uv?

We use `uv` for Python because it's:
- ⚡ **10-100x faster** than pip
- 🔒 **Locks dependencies** (like npm)
- 🌐 **Drop-in pip replacement**

```bash
# Common uv commands
uv sync               # Install from pyproject.toml
uv add <package>      # Add package
uv remove <package>   # Remove package
```

---

## 🚀 Common Tasks

### Run Linter
```bash
npm run lint
```

### Run Type Checker
```bash
npm run typecheck
```

### Format Code
```bash
npm run format
```

### Build for Production
```bash
npm run build
npm start
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Generate DataConnect SDK
```bash
npm run dataconnect:generate
```

---

## 📚 Additional Resources

- **Project Blueprint**: [`docs/00-PROJECT-BLUEPRINT.md`](docs/00-PROJECT-BLUEPRINT.md)
- **Database Guide**: [`docs/04-DATABASE-AND-DATA-FLOW.md`](docs/04-DATABASE-AND-DATA-FLOW.md)
- **How to Run**: [`HOW-TO-RUN.md`](HOW-TO-RUN.md)
- **Emulator Troubleshooting**: [`START-EMULATORS.md`](START-EMULATORS.md)
- **OpenSpec**: [`openspec/project.md`](openspec/project.md)

---

## 💡 Tips & Best Practices

### Development Workflow
1. Always run `npm run lint` before committing
2. Use `npm run typecheck` to catch TypeScript errors
3. Keep all 4 terminals running during development
4. Check Firebase Emulator UI (port 4000) to debug data issues

### Git Workflow
```bash
# Create a new branch
git checkout -b feature/my-feature

# Make changes, then
npm run lint           # Fix linting issues
npm run typecheck      # Ensure types are correct
git add .
git commit -m "feat: describe your change"
git push
```

### Performance Optimization
- Use `pnpm install --frozen-lockfile` for reproducible builds
- Run `npm run build` locally before pushing to catch build errors
- Monitor DSPy service logs for slow queries

---

## 🤝 Contributing

Before submitting a PR, ensure:
- ✅ No lint errors: `npm run lint`
- ✅ TypeScript passes: `npm run typecheck`
- ✅ Code is formatted: `npm run format`
- ✅ E2E tests pass: `npm run test:e2e`

---

**Happy coding! 🎉**
