# CourseLLM - Quick Start Guide

## 🚀 Run These 4 Commands (in 4 separate terminals)

### ⚠️ IMPORTANT: You NEED 4 terminals open!

---

## Terminal 1: DSPy Service (AI/LLM)

```bash
cd dspy_service
.\venv\Scripts\activate
$Env:LLM_PROVIDER = "gemini"
$Env:GEMINI_API_KEY = "AIzaSyBUdUiRpBlNj16AnrCIJ1VCvveTyS3op7w"
python -m uvicorn app:app --reload --port 8000
```

**Wait for:** `Uvicorn running on http://0.0.0.0:8000`

---

## Terminal 2: Firebase Emulators

```bash
firebase emulators:start --only auth,firestore,dataconnect
```

**Wait for:** `✔ All emulators ready!`

---

## Terminal 3: Seed Test Users

```bash
node scripts/seed-test-users.js
```

**Should see:** `Done! Test users: Student: student@test.com / password123`

---

## Terminal 4: Next.js App

```bash
npm run dev
```

**Wait for:** `✓ Ready` and `○ Local: http://localhost:3000`

---

## ✅ Then Open Browser

Go to: **http://localhost:3000**

Click: **"Mock Student"** or **"Mock Teacher"**

Login credentials:
- **Student**: student@test.com / password123
- **Teacher**: teacher@test.com / password123

---

## What Each Service Does:

| Terminal | Service | Port | Purpose |
|----------|---------|------|---------|
| 1 | DSPy | 8000 | AI for Intent-Skill-Trajectory analysis |
| 2 | Firebase | 9099, 8080, 9400 | Auth, Database, IST storage |
| 3 | Seed | - | Creates test users (run once per session) |
| 4 | Next.js | 3000 | Your web app |

---

## 🔧 First Time Setup

**Only need to do this once:**

```bash
# 1. Install Node dependencies (root folder)
npm install

# 2. Setup Python virtual environment (in dspy_service folder)
cd dspy_service
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

---

## 🛑 How to Stop

Press `Ctrl+C` in each terminal (Terminals 1, 2, 4)

Or force kill everything:
```bash
taskkill //F //IM node.exe
taskkill //F //IM python.exe
```

---

## ❌ Common Issues

**"DSPy not responding"**
→ Terminal 1 must be running with API key set

**"User not found"**
→ Run Terminal 3 again (seed users)

**"Cannot connect to emulator"**
→ Terminal 2 must be running

**"Port already in use"**
→ Kill old processes: `taskkill //F //IM node.exe`

---

## 📚 Full Documentation

See [HOW-TO-RUN.md](HOW-TO-RUN.md) for detailed explanations, troubleshooting, and more.

---

**Quick Health Check:**

```powershell
# Test DSPy
Invoke-RestMethod "http://localhost:8000/health"

# Test Next.js
Invoke-RestMethod "http://localhost:3000"

# View Firebase Emulator UI
start http://127.0.0.1:4000
```
