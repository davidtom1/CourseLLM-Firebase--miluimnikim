# Health Checks and Debug Pages

Documentation for health check endpoints and debug/development pages used for system verification and troubleshooting.

---

## 1. Health Check Endpoints

### Next.js Frontend Health (`/api/health`)

**Location:** `src/app/api/health/route.ts`

**Purpose:** Verifies the Next.js frontend server is running and responsive.

#### Endpoint Details

| Property | Value |
|----------|-------|
| URL | `http://localhost:9002/api/health` |
| Method | GET |
| Auth | None required |
| Response | JSON |

#### Response Format

```json
{
  "status": "ok",
  "service": "nextjs-frontend"
}
```

#### Manual Verification

**Linux / macOS:**
```bash
curl http://localhost:9002/api/health
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:9002/api/health"
```

**Expected:** HTTP 200 with JSON response

---

### DSPy Service Health (`/health`)

**Location:** `dspy_service/app.py`

**Purpose:** Verifies the Python DSPy service is running and ready to process IST requests.

#### Endpoint Details

| Property | Value |
|----------|-------|
| URL | `http://localhost:8000/health` |
| Method | GET |
| Auth | None required |
| Response | JSON |

#### Response Format

```json
{
  "status": "healthy",
  "service": "CourseLLM DSPy Service",
  "version": "1.0.0"
}
```

#### Manual Verification

**Linux / macOS:**
```bash
curl http://localhost:8000/health
```

**Windows (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

**Expected:** HTTP 200 with JSON response

---

## 2. Debug and Development Pages

### IST Visualizer (`/debug/ist-visualizer`)

**Location:** `src/app/debug/ist-visualizer/page.tsx`

**Purpose:** Visual debugging tool for IST (Intent-Skill-Trajectory) extraction results.

#### Access

Navigate to: `http://localhost:9002/debug/ist-visualizer`

#### Features

- View raw IST extraction output
- Inspect intent labels and confidence scores
- Browse skill assignments
- Trace trajectory recommendations

#### When to Use

- Debugging IST extraction issues
- Verifying DSPy service responses
- Testing new IST prompt configurations

---

### Data Connect Introspection (`/ist-dev/dataconnect`)

**Location:** `src/app/ist-dev/dataconnect/page.tsx`

**Purpose:** Query and inspect IST events stored in Firebase Data Connect.

#### Access

Navigate to: `http://localhost:9002/ist-dev/dataconnect`

#### Features

- Query IST events by userId and courseId
- View stored IST event details:
  - Utterance (original question)
  - Intent (extracted learning goal)
  - Skills (identified competencies)
  - Trajectory (recommended next steps)
  - Metadata (timestamps, IDs)

#### Manual Verification Steps

1. **Navigate to** `http://localhost:9002/ist-dev/dataconnect`
2. **Enter parameters:**
   - userId: `demo-user` (or your test user ID)
   - courseId: `cs202` (or your test course ID)
3. **Click** "Load IST Events"
4. **Verify:**
   - Events load without errors
   - Event data matches recent chat interactions
   - Skills and trajectory arrays are populated

#### When to Use

- Verifying IST events are being saved to Data Connect
- Debugging Data Connect query issues
- Inspecting historical IST data

---

## 3. Firebase Emulator UI

**URL:** `http://localhost:4000`

**Purpose:** Central dashboard for all Firebase emulator services.

### Available Tabs

| Tab | Port | Purpose |
|-----|------|---------|
| Authentication | 9099 | View/manage test users |
| Firestore | 8080 | Browse collections and documents |
| Functions | 5001 | View function logs |
| Data Connect | 9400 | Inspect Data Connect status |

### Key Verification Points

#### Authentication Tab
- Verify test users exist (student@test.com, teacher@test.com)
- Check user metadata and custom claims

#### Firestore Tab
- Browse `threads` collection for chat data
- Check `analysis` subcollections for IST results
- Verify `users` collection for profiles

#### Functions Tab
- View `analyzeMessage` function invocations
- Check for errors or timeouts
- Monitor execution logs

---

## 4. System Verification Script

**Location:** `scripts/verify-system.sh` (Linux/macOS) and `scripts/verify-system.bat` (Windows)

**Purpose:** Automated verification of all system components.

### Running the Script

**Linux / macOS:**
```bash
./scripts/verify-system.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\verify-system.bat
```

### What It Checks

1. Node.js version (22+ required)
2. Python version (3.12+ required)
3. Firebase CLI version (13.0.0+ required)
4. pnpm availability
5. uv availability
6. Service port availability

---

## 5. Complete Health Check Procedure

Use this checklist to verify the entire system is operational:

### Step 1: Check Infrastructure

```bash
# Verify Node.js
node --version  # Should be v22.x.x

# Verify Python
python --version  # Should be 3.12+

# Verify Firebase CLI
firebase --version  # Should be 13.0.0+
```

### Step 2: Check Services

| Service | Check Command | Expected Result |
|---------|---------------|-----------------|
| Next.js | `curl http://localhost:9002/api/health` | `{"status":"ok"}` |
| DSPy | `curl http://localhost:8000/health` | `{"status":"healthy"}` |
| Emulator UI | Open `http://localhost:4000` | Dashboard loads |
| Auth Emulator | Check port 9099 | Emulator running |
| Firestore Emulator | Check port 8080 | Emulator running |

### Step 3: Check Data Flow

1. Login as student via Mock Student button
2. Send a chat message
3. Verify:
   - AI response appears
   - Intent Inspector shows analysis
   - Firestore has new thread/analysis documents

### Step 4: Check Teacher Analytics

1. Login as teacher via Mock Teacher button
2. Navigate to IST Class Report
3. Generate report
4. Verify metrics display

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Health check fails | Service not running | Start the service |
| Port already in use | Previous process | Kill process on port |
| Emulator UI blank | Emulators not started | `firebase emulators:start` |
| IST events missing | Data Connect not connected | Check emulator connection |
| Auth fails | Test users not seeded | Run `node scripts/seed-test-users.js` |

---

**Last Updated**: January 2026
