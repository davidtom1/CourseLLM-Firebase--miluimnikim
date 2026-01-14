# How to Run CourseLLM Project

## Quick Start (4 Terminals Required)

### Terminal 1: Start DSPy Service (Python)

**First time setup:**
```bash
cd dspy_service
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Set API Key (choose one):**
```powershell
# Option A: OpenAI (Recommended)
$Env:LLM_PROVIDER = "openai"
$Env:OPENAI_API_KEY = "sk-your-key-here"

# Option B: Gemini (Alternative)
$Env:LLM_PROVIDER = "gemini"
$Env:GEMINI_API_KEY = "your-gemini-key-here"
```

**Start the service:**
```bash
python -m uvicorn app:app --reload --port 8000
```

**Wait for:** `Uvicorn running on http://127.0.0.1:8000`

⚠️ **Keep this terminal running!**

---

### Terminal 2: Start Firebase Emulators

```bash
firebase emulators:start --only auth,firestore,dataconnect
```

**Wait for this message:**
```
✔  All emulators ready! It is now safe to connect your app.
```

You should see:
- **Auth Emulator**: `127.0.0.1:9099`
- **Firestore Emulator**: `127.0.0.1:8080`
- **DataConnect Emulator**: `127.0.0.1:9400`
- **Emulator UI**: `http://127.0.0.1:4000`

⚠️ **Keep this terminal running** - Don't close it!

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

### Terminal 4: Start Next.js Development Server

```bash
npm run dev
```

**Wait for:**
```
✓ Ready in Xs
○ Local:   http://localhost:3000
```

---

## Step-by-Step First Run

### 1. Open Your Browser

Navigate to: **http://localhost:3000**

You'll be automatically redirected to: **http://localhost:3000/login**

---

### 2. Sign In

You'll see the login page with these options:

**Option A: Mock Test Accounts (Recommended for Development)**
- Click **"Mock Student"** button
  - Uses: `student@test.com` / `password123`
  - Redirects to: `/student` dashboard

- Click **"Mock Teacher"** button
  - Uses: `teacher@test.com` / `password123`
  - Redirects to: `/teacher` dashboard

**Option B: Google OAuth (If Configured)**
- Click **"Sign in with Google"**
  - Opens Google sign-in popup
  - First-time users → redirected to onboarding
  - Returning users → redirected to dashboard

---

### 3. Verify You're Signed In

After signing in, you should see:
- Your name/avatar in the top-right corner
- Navigation sidebar (Dashboard, Courses, etc.)
- No redirect back to login page

**Troubleshooting Sign-In:**
- If you see "Login failed" → Check Terminal 1 (emulators must be running)
- If you see "User not found" → Run Terminal 2 again (seed test users)
- If page keeps redirecting → Check browser console for errors

---

### 4. Test the App

**As a Student:**
1. Go to `/student` - View student dashboard
2. Go to `/student/courses` - View enrolled courses
3. Click logout (top-right menu) - Should return to login

**As a Teacher:**
1. Go to `/teacher` - View teacher dashboard
2. Go to `/teacher/courses` - Manage courses
3. Test trajectory feature (if applicable)

---

## What's Running?

When everything is started correctly:

| Service | URL | Purpose |
|---------|-----|---------|
| **DSPy Service** | http://localhost:8000 | AI/LLM for Intent-Skill-Trajectory |
| **Next.js App** | http://localhost:3000 | Main application |
| **Emulator UI** | http://127.0.0.1:4000 | View Firebase data |
| Auth Emulator | 127.0.0.1:9099 | Authentication |
| Firestore Emulator | 127.0.0.1:8080 | Database |
| DataConnect Emulator | 127.0.0.1:9400 | IST Trajectory data storage |

---

## Common Issues & Solutions

### ❌ "DSPy service not responding" / IST feature not working

**Problem:** DSPy service isn't running or API key is missing

**Solution:**
```bash
# Terminal 1 - Make sure DSPy is running
cd dspy_service
.\venv\Scripts\activate

# Set your API key
$Env:OPENAI_API_KEY = "sk-your-key-here"

# Start service
python -m uvicorn app:app --reload --port 8000
```

**Test it's working:**
```powershell
Invoke-RestMethod "http://localhost:8000/health"
```
Should return: `{"status":"healthy","service":"CourseLLM DSPy Service"}`

---

### ❌ "Cannot connect to emulator"

**Problem:** Emulators aren't running

**Solution:**
```bash
# Terminal 1
firebase emulators:start --only auth,firestore,dataconnect
```

---

### ❌ "User not found" when clicking Mock Student/Teacher

**Problem:** Test users weren't seeded

**Solution:**
```bash
# Terminal 2
node scripts/seed-test-users.js
```

---

### ❌ "Port already in use"

**Problem:** Previous emulator instance still running

**Solution:**
```bash
# Kill processes on emulator ports
taskkill //F //IM node.exe

# Then restart emulators
firebase emulators:start --only auth,firestore,dataconnect
```

---

### ❌ "Permission denied" errors in Firestore

**Problem:** Firestore rules are too restrictive

**Solution:** Check `firestore.rules` - should allow all for development:
```javascript
match /{document=**} {
  allow read, write: if true;  // Development only!
}
```

---

### ❌ Page stuck on login/blank screen

**Problem:** Auth provider not loaded or network error

**Solution:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed requests
4. Verify `.env.local` has `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true`

---

### ❌ "Module not found" errors

**Problem:** Dependencies not installed

**Solution:**
```bash
npm install
```

---

## Stopping the Project

### Proper Shutdown:

1. **Terminal 4** (Next.js): Press `Ctrl+C`
2. **Terminal 2** (Emulators): Press `Ctrl+C`
3. **Terminal 1** (DSPy): Press `Ctrl+C`
4. **Terminal 3**: Can be closed anytime

### Force Stop Everything:

```bash
# Windows PowerShell
taskkill //F //IM node.exe
taskkill //F //IM python.exe

# Then check ports are free
netstat -ano | findstr "3000 8000 9099 8080 9400"
```

---

## Next Time You Run

You only need to repeat:

1. **Start DSPy** (Terminal 1) - Don't forget to set API key!
2. **Start emulators** (Terminal 2)
3. **Seed users** (Terminal 3) - ⚠️ Required after every emulator restart
4. **Start Next.js** (Terminal 4)

**Why re-seed users?**
Auth emulator data is in-memory only. When you stop the emulators, test users are deleted. You must recreate them each time.

---

## Using Emulator UI

Open http://127.0.0.1:4000 to view:

**Authentication Tab:**
- See all users (student@test.com, teacher@test.com)
- View user UIDs
- Add/delete users manually

**Firestore Tab:**
- Browse `users` collection
- View user profiles
- See trajectory data
- Edit documents manually

**Logs Tab:**
- View emulator activity
- Debug authentication issues

---

## Environment Configuration

Your `.env.local` should have:

```bash
# Enable emulators
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true

# Firebase project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coursewise-f2421

# Other Firebase config (can be defaults for emulator)
NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-project.firebaseapp.com
# ... etc
```

**Important:** With emulators, you don't need real Firebase credentials!

---

## Test Accounts Reference

| Email | Password | Role | Use Case |
|-------|----------|------|----------|
| student@test.com | password123 | Student | Testing student features |
| teacher@test.com | password123 | Teacher | Testing teacher features |

**UIDs:** Auto-generated each time you seed (changes on restart)

---

## Production Deployment (Future)

When ready to deploy:

1. **Disable emulators:**
   ```bash
   # .env.local
   NEXT_PUBLIC_FIREBASE_USE_EMULATOR=false
   ```

2. **Add real Firebase credentials** to `.env.local`

3. **Update Firestore rules** (remove `allow read, write: if true`)

4. **Build and deploy:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## Getting Help

- **Auth Documentation**: `docs/Auth/SETUP-COMPLETE.md`
- **Test Accounts**: `docs/EMULATOR-TEST-ACCOUNTS.md`
- **Auth Implementation**: `docs/Auth/auth-implementation.md`
- **Firebase Console**: https://console.firebase.google.com/project/coursewise-f2421

---

## Quick Commands Cheat Sheet

```bash
# Start everything (4 separate terminals)

# Terminal 1: DSPy
cd dspy_service
.\venv\Scripts\activate
$Env:OPENAI_API_KEY = "sk-your-key"
python -m uvicorn app:app --reload --port 8000

# Terminal 2: Firebase Emulators
firebase emulators:start --only auth,firestore,dataconnect

# Terminal 3: Seed Users
node scripts/seed-test-users.js

# Terminal 4: Next.js
npm run dev

# Check what's running
netstat -ano | findstr "3000 8000 9099 8080 9400"

# View emulator UI
start http://127.0.0.1:4000

# View app
start http://localhost:3000

# Stop everything
# Ctrl+C in each terminal, or:
taskkill //F //IM node.exe
```

---

**Last Updated:** 2026-01-14
**Project:** CourseLLM Firebase
**Status:** ✅ Ready to Run
