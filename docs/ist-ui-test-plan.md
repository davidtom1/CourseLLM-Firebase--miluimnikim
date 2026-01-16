# IST UI Test Plan

This document describes manual UI-based tests for the IST (Intent–Skill–Trajectory) pipeline. These tests validate the end-to-end flow from the **student Socratic chat UI** through:

- Next.js 15 frontend (Socratic course page)
- Cloud Functions (`analyzeMessage`)
- DSPy FastAPI service (`/api/intent-skill-trajectory`)
- **Firebase Data Connect** (IstEvent storage + history queries)
- Firestore Emulator (threads / analysis documents)
- Developer/debug views (e.g., `/ist-dev/dataconnect`)

The focus is on what a **developer/TA can see in the UI and logs** to confirm that IST extraction, storage, and history usage are working as intended in emulator mode.

---

## 1. Overview

The IST UI currently supports:

- **Student Socratic chat UI** on the course page (`/student/courses/[courseId]`), where students ask questions.
- **IST extraction** (intent, skills, trajectory) via a Python DSPy microservice.
- Integration with:
  - **Cloud Functions**: `us-central1-analyzeMessage` callable function
  - **Data Connect**: `IstEvent` table for persistent IST history (write + read)
  - **Firestore**: Thread-level analysis documents for the IntentInspector UI
  - **DSPy service**: `/api/intent-skill-trajectory` endpoint
  - **Debug/Developer views**: `/ist-dev/dataconnect` for Data Connect introspection

In emulator mode, Data Connect is the **source of truth** for IST history used in prompts; JSON file storage is kept only as a fallback and is no longer the primary focus of this test plan.

---

## 2. Prerequisites

### 2.1 Tools Installed

- **Node.js and npm**
  - Verify: `node --version` and `npm --version`
  - Recommended: Node.js 18.x or higher
- **Python 3.x**
  - Verify: `python --version` (3.8+)
  - Verify: `pip --version`
- **Firebase CLI**
  - Required to run `firebase emulators:start`

### 2.2 Environment Variables

#### DSPy Service (`dspy_service/.env`)

Create or verify `dspy_service/.env`:

```env
# Required for LLM access (OpenAI or Gemini via LiteLLM)
OPENAI_API_KEY=sk-...your-real-key...

# Optional: Provider selection
LLM_PROVIDER=openai  # or "gemini"
LLM_MODEL=openai/gpt-4o-mini  # Optional override
```

#### Next.js App (`.env.local` at project root)

Create or verify `.env.local`:

```env
# Gemini/Google AI (for Genkit Socratic chat)
GOOGLE_API_KEY=AIzaSy...your-real-key...
GEMINI_API_KEY=AIzaSy...your-real-key...  # Alternative

# DSPy service URL (defaults to localhost:8000)
DSPY_SERVICE_URL=http://localhost:8000

# Emulator flags
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true

# Optional demo mode for IST context
IST_DEMO_MODE=true
```

> **Note**: Restart `npm run dev` after editing `.env.local`. Next.js only reads env vars at startup.

### 2.3 Services Running

Run each of the following in its own terminal:

- **Terminal 1 – DSPy FastAPI service**

  ```powershell
  cd dspy_service
  .\venv\Scripts\Activate.ps1
  python -m uvicorn app:app --reload --port 8000
  ```

- **Terminal 2 – Firebase Emulators (Functions, Firestore, Data Connect)**

  ```powershell
  firebase emulators:start
  ```

- **Terminal 3 – Next.js dev server**

  ```powershell
  npm run dev
  ```

**Expected output on startup**:
```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:9002
   - Ready in X.Xs

  ○ Compiling / ...
  ✓ Compiled / in X.Xs
```

**When visiting pages, you should see logs like**:
```
GET /student 200 in Xms
GET /student/courses/cs202 200 in Xms
```

**When IST extraction runs, you should see logs like**:
```
[IST][Context][DEMO] Using demo identity: { userId: 'demo-user-1', courseId: 'cs-demo-101' }
[IST][Context] Loaded recent IST events: 0
[IST][Context] Loaded recent chat messages: 3
[IST] Extracted IST: { utterance: 'I don't understand linked lists at all', courseContext: '...', ist: {...} }
[IST][Repository] Stored IST event
```

**Keep this terminal open** – the Next.js server must remain running for the UI to work.
### Terminal 3 – Firebase Emulator (Hosting & Functions)

Start the Firebase Emulator Suite in a **third** terminal to provide local Hosting and Functions endpoints used by the app.

- From the project root (replace path as needed):

```powershell
cd path/to/CourseLLM-Firebase--miluimnikim
firebase emulators:start --only hosting,functions
```

- Or with `npx` if you don't have `firebase-tools` globally:

```powershell
npx firebase emulators:start --only hosting,functions
```

This will start the local Emulator UI (typically `http://localhost:4000`) and expose the Hosting and Functions emulators so the Next.js client and callable functions work as expected.

Mandatory checks before starting:
- Ensure `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` is set in your `\.env.local` (client-side) so the app connects to local emulators. See `\.env.local` for example values.
- Verify `FIRESTORE_EMULATOR_HOST`, `FIRESTORE_EMULATOR_PORT`, `FIREBASE_FUNCTIONS_EMULATOR_HOST`, and `FIREBASE_FUNCTIONS_EMULATOR_PORT` are set in `\.env.local` when the emulator is required.
- Confirm `firebase.json` and `.firebaserc` are configured for the services you intend to emulate.
- Keep Terminal 3 open while running the UI tests so emulator endpoints remain available.


---

## 3. Test Scenario 1 – Basic Socratic Chat with IST Extraction

### 3.1 Steps

1. Open:

   ```text
   http://localhost:9002/student/courses/cs202
   ```

2. Scroll to the **Socratic chat** section.
3. In the chat input, ask a conceptual question, for example:

   ```text
   What is the time complexity of inserting into a dynamic array?
   ```

4. Send the question (press Enter or click **Send**).

### 3.2 Expected Results – UI

- The Socratic tutor responds with a course-aware explanation or guiding question.  
- If Gemini is overloaded or returns a 503, the UI shows a **fallback tutor message** instead of a red error page.  
- The chat remains responsive; no unhandled errors are shown to the user.

### 3.3 Expected Results – Functions & DSPy Logs

- **Functions emulator** (`analyzeMessage`):
  - `Running IST analysis for threadId ... messageId ...`
  - `DSPy response received: { intent: ..., skillsCount: ..., trajectoryCount: ... }`
  - `About to save IST event to DataConnect for messageId ...`
  - `DataConnect save completed for messageId ...`

- **DSPy terminal**:
  - `[IST] Processing request - utterance: ...`
  - `[IST] Received chat_history size: N`
  - `[IST] Received ist_history size: M`
  - `[IST] Returning response - intent length: X, skills count: Y, trajectory count: Z`

### 3.4 Expected Results – Firestore Emulator

In the **Firestore Emulator UI** (`http://127.0.0.1:4000/`), you should see:

- Collection: `threads`
  - Document: `<threadId>`
    - Subcollection: `analysis`
      - Document: `<messageId>` containing the `MessageAnalysis` JSON written by `analyzeMessage`.

This confirms the IntentInspector UI has a Firestore-backed analysis document to read from.

---

## 4. Test Scenario 2 – IST Event Stored in Data Connect

### 4.1 Steps

1. From the Socratic chat page, send one or more questions (as in Scenario 1).
2. Watch the **Functions emulator** terminal.

### 4.2 Expected Logs

- `[analyzeMessage] About to save IST event to DataConnect for messageId ...`
- `[DataConnect] Successfully created IstEvent for messageId ...`
- `[analyzeMessage] DataConnect save completed for messageId ...`

### 4.3 Expected Results

- No Data Connect–related errors are printed in the Functions logs.  
- Data Connect emulator log files (`dataconnect-debug.log`) remain free of fatal errors.  
- Each Socratic question corresponds to a new `IstEvent` row in the emulator’s Postgres instance (verified via `/ist-dev/dataconnect` in Scenario 4).

---

## 5. Test Scenario 3 – Frontend Reads IST History from Data Connect

### 5.1 Steps

1. With all services running, send **several** questions in the same course (`/student/courses/cs202`).  
2. Refresh the page or send another question to trigger history loading.
3. Inspect the **Next.js dev server** logs.

### 5.2 Expected Logs – Next.js

You should see messages similar to:

```text
[IST][Context][DEMO] Using demo identity: { userId: 'demo-user-1', courseId: 'cs-demo-101' }
[IST][Context] Loaded recent IST events: X
[IST][Context] Loaded recent chat messages: Y
```

Where:

- `X > 0` after you have sent some questions (e.g., `10` recent events).  
- `Y` is the number of chat messages included in the context (e.g., `3` recent turns).

### 5.3 Expected Logs – DSPy

In the DSPy terminal:

```text
[IST] Received chat_history size: Y
[IST] Received ist_history size: X
```

**Interpretation**:

- `chat_history` and `ist_history` are non-empty, confirming that:
  - Data Connect is queried for recent `IstEvent` history.
  - The frontend (or Cloud Function) passes these into DSPy on subsequent requests.

---

## 6. Test Scenario 4 – `/ist-dev/dataconnect` Debug View

### 6.1 Steps

1. Navigate to:

   ```text
   http://localhost:9002/ist-dev/dataconnect
   ```

2. Leave the default values (e.g., `userId = demo-user`, `courseId = cs202`) or adjust to match your test user/course.  
3. Click **“Load IST Events”**.

### 6.2 Expected Results

- The page renders a list of IST events fetched from **Data Connect** using the generated web SDK.
- For each event, verify fields such as:
  - `utterance` – matches your Socratic questions.
  - `intent` – natural-language description of the student’s goal.
  - `skills` – array of skills or concepts (rendered as a list).
  - `trajectory` – array of recommended next steps (rendered as a numbered list).
  - `createdAt`, `threadId`, `messageId`, `userId`, `courseId` – metadata consistent with your session.
- The data in this UI should match what you see in Functions and DSPy logs.

---

## 7. Test Scenario 5 – Gemini Quota / Error Behavior (Optional but Recommended)

### 7.1 Goal

Validate that **Genkit / Gemini errors** (e.g., 429/503) do **not** break the IST pipeline or crash the UI.

### 7.2 Steps

1. With all services running, send several Socratic questions in quick succession.  
2. Intentionally push towards Gemini rate limits, or temporarily misconfigure Genkit to trigger an upstream error.  
3. Observe the **Next.js** logs and browser UI.

### 7.3 Expected Results

- In the Next.js logs:

  ```text
  [socratic-course-chat] socraticPrompt failed, returning fallback tutor message instead of throwing: GenkitError ...
  ```

- In the UI:
  - The Socratic chat displays a fallback tutor message such as:
    > “The AI tutor is temporarily unavailable because the upstream model is overloaded (503). Your question was still processed for IST analysis – please try again in a bit.”
  - No red error page or unhandled exception is shown.

- In the Functions & DSPy logs:
  - `analyzeMessage` still runs and calls DSPy.
  - DSPy logs still show `Received chat_history size: ...` and `Received ist_history size: ...`.
  - Data Connect logs still show successful `IstEvent` creations.

**Conclusion**: Gemini quota issues affect **only** the tutor answer text, not IST extraction or Data Connect read/write behavior.

---

## 8. Test Scenario 6 – Teacher IST Class Report (Aggregated, JSON-First)

### 8.1 Steps

1. With all services running (Next.js dev server, emulators), open:

   ```text
   http://localhost:9002/teacher/courses/cs-demo-101?view=ist-report
   ```

2. In the Teacher UI:
   - Navigate via sidebar or directly to the **“Courses”** section.
   - Open the **“Data Structures & Algorithms”** course (`cs-demo-101`).
   - Switch to the **“IST Class Report”** tab.
3. Click the button:

   ```text
   Generate IST Class Report
   ```

4. Wait for the report to generate (a short loading state) and ensure no errors appear in the browser console or Next.js dev logs.

### 8.2 Expected Results – UI

- The IST Class Report section renders a **course-level aggregated dashboard** (no per-student details), including:
  - **Executive Summary KPI cards** (total events, events with skills, unique skills, total skill assignments, averages, top skill, top-10 concentration, observation window).
  - **Trends (Last 7 vs Previous 7 days)** section with:
    - A small comparison table for events and skill assignments.
    - Two lists: **Rising skills** and **Declining skills**.
  - **Skills** section with:
    - A **“Search skills…”** input that filters both **Top Skills** and **Gaps**.
    - A **Top Skills** table (up to 10 skills, or filtered subset).
    - A **Gaps** table with a toggle between **“Show first 20”** and **“Show all (N)”**.
  - **Data Quality** cards summarizing how many events are missing or have malformed `skills` data.
- No raw **student identifiers** or **utterance text** are rendered anywhere in the report:
  - No `userId`, `threadId`, or `messageId`.
  - No raw `utterance` or chat text.
- The copy explicitly frames the view as a **course-level aggregated IST report**.

### 8.3 Data Source (JSON-First Mock Dataset)

- The current implementation reads from a **JSON-first mock dataset**:
  - Fetches `GET /mocks/ist/teacher-class-events.json` from `public/mocks/ist/teacher-class-events.json`.
  - Uses:

    ```ts
    fetch("/mocks/ist/teacher-class-events.json", { cache: "no-store" })
    ```

  - Filters the mock `IstEventForReport[]` in-memory to events where `courseId === "cs-demo-101"`.
- No live Data Connect queries are performed yet for this Teacher UI; the report is **JSON-backed** while analytics code remains DataConnect-agnostic.

### 8.4 Expected Metrics (Current Mock Dataset – cs-demo-101)

For the existing mock dataset (as of the latest snapshot), after clicking **Generate IST Class Report** for `cs-demo-101`, you should see approximate values:

- **Core metrics**
  - `totalEvents` ≈ **100**
  - `eventsWithSkills` ≈ **90** (**90.0%** of events)
  - `uniqueSkillsCount` ≈ **74**
  - `totalSkillAssignments` ≈ **183** (per-event, de-duplicated, normalized skills)
- **Coverage**
  - Top skill **“recursion”** share ≈ **6.6%** of all skill assignments.
  - **Top 10 concentration** ≈ **40.4%** of all skill assignments.
- **Trends (Last 7 vs Previous 7 days)**
  - `last7Days`: **70 events**, **122** skill assignments.
  - `prev7Days`: **30 events**, **61** skill assignments.
  - Relative deltas (approximate):
    - Events: **+133.3%** vs previous 7 days.
    - Skill assignments: **+100%** vs previous 7 days.
- **Data quality**
  - `eventsMissingSkillsField` ≈ **4**
  - `eventsEmptySkillsArray` ≈ **4**
  - `invalidSkillEntriesDropped` ≈ **4**
  - `eventsSkillsNotArray` ≈ **0** (non-array skills should not appear in this dataset).

You do **not** need to match these exact numbers for every run, but they should be in the same ballpark if you have not changed the JSON mock file.

### 8.5 Expected Logs / Observability

- **Browser DevTools – Network tab**:
  - A `GET /mocks/ist/teacher-class-events.json` request when clicking **Generate IST Class Report`.
  - Response should be HTTP 200 with a JSON array of mock events.
- **Browser DevTools – Console**:
  - No unhandled exceptions.
  - On failure cases, you may see a logged error from `TeacherClassIstReport` such as:

    ```text
    [TeacherClassIstReport] Failed to generate report ...
    ```

    but for this happy-path test, the console should remain clean.
- **Next.js dev server logs**:
  - Normal page navigation logs for `/teacher/courses/cs-demo-101?view=ist-report`.
  - No reappearance of the dynamic params warning:

    ```text
    params.courseId must be awaited
    ```

### 8.6 Privacy Constraints (Must Hold)

- The Teacher IST Class Report is strictly **aggregated at course level**:
  - No **`userId`**, **`threadId`**, or **`messageId`** values may be rendered anywhere in the UI.
  - No raw **student `utterance`** or message text may appear – only normalized skills and derived aggregates.
- All surfaced metrics (counts, shares, trends, gaps, data quality) must be interpretable **without** exposing any per-student identity or raw messages.

### 8.7 Notes / Common Issues

- **Next.js dynamic params warning**:
  - Previously, navigation to the Teacher course page could produce:

    ```text
    params.courseId must be awaited
    ```

  - This has been fixed by making `app/teacher/courses/[courseId]/page.tsx` `async` and `await`ing `params`.  
  - **Expected behavior now**: No such warning or error appears in the Next.js dev console when visiting `/teacher/courses/cs-demo-101?view=ist-report`.
- **Jest tests note**:
  - Jest unit tests exist for the analytics helper (`teacherIstReport.test.ts`), but `package.json` may not define an `npm test` script yet (`Missing script: "test"`).  
  - This is **not** part of the manual UI test run; it is only a note for developers wiring up automated tests later.

---

## 8. Where to See Each Result (Summary Table)

| Feature                                   | Where to see it                                                |
| ---------------------------------------- | -------------------------------------------------------------- |
| Student message + tutor reply            | Course page UI (`/student/courses/cs202`)                      |
| IST extraction (intent/skills/trajectory)| DSPy logs (`dspy_service` terminal)                            |
| IST saved to Data Connect                | Functions logs (`analyzeMessage`), `/ist-dev/dataconnect`      |
| IST history loaded into context          | Next.js logs (`[IST][Context] Loaded recent ...`) + DSPy logs  |
| Firestore write (thread/message)         | Firestore Emulator UI (`http://127.0.0.1:4000/`)               |
| Data Connect emulator status             | Firebase emulator logs, `/ist-dev/dataconnect` UI              |
| Teacher IST aggregated report            | Teacher UI (`/teacher/courses/cs-demo-101?view=ist-report`)    |

---

## 9. Validation Summary

These IST UI tests validate that:

- **End-to-end connectivity** from UI → Next.js → Cloud Functions → DSPy → Data Connect → Firestore is working in emulator mode.
- **IST history and chat history** are loaded from Data Connect and passed into DSPy as `ist_history` and `chat_history`.
- **Data Connect** is the primary store for IST events, with the `/ist-dev/dataconnect` page providing a clear visual for developers.
- **Fallback behavior** for Gemini/Genkit errors keeps the UI stable while IST + Data Connect processing continues.
- **Teacher IST Class Report** aggregates course-level skill signals (counts, shares, trends, gaps, data quality) without exposing any student identifiers or raw utterances.
- **Teacher-side report generation** works end-to-end in the UI: fetch JSON mock dataset → compute v2 analytics → render the aggregated IST class report with expected KPIs and trends.

This test plan should be used by developers and TAs to validate changes to the IST pipeline, especially when iterating on Data Connect integration, DSPy prompts, or UI behavior.

---

## 10. Auth Behavior Validation

This section documents the authentication layer introduced across the IST pipeline and provides test steps to validate its behavior in both local/dev and production-like environments.

### 10.1 Authentication Architecture Overview

The authentication layer spans multiple layers of the IST pipeline:

| Layer | Auth Type | File(s) | Description |
|-------|-----------|---------|-------------|
| Frontend | Firebase Auth (Client SDK) | `src/features/firebase.ts` | Firebase init + emulator connection |
| Frontend | Auth Context | `src/components/AuthProviderClient.tsx` | React context providing auth state |
| Frontend | Route Protection | `src/components/RoleGuardClient.tsx` | Client-side role-based access control |
| Frontend | Auto-redirect | `src/components/AuthRedirector.tsx` | Redirects neutral pages to appropriate dashboard |
| Frontend | Auth Service | `src/features/authService.ts` | Google OAuth helpers (popup + redirect fallback) |
| Cloud Functions | `request.auth?.uid` | `functions/src/analyzeMessage.ts` | Auth check with emulator fallback (`demo-user`) |
| DSPy Service | None (CORS only) | `dspy_service/app.py` | No direct auth; relies on caller validation |
| Data Connect | `@auth(level: PUBLIC)` | `dataconnect/connector/ist_events_operations.gql` | Dev-mode public access |
| Firestore | Security Rules | `firestore.rules` | User-ownership-based document security |

### 10.2 Auth Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Authentication Flow                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User visits app                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────┐                                                     │
│  │ AuthRedirector  │──────────────────────────────────────────┐         │
│  └────────┬────────┘                                          │         │
│           │ (checks auth state)                               │         │
│           ▼                                                   │         │
│  ┌─────────────────┐   no auth   ┌───────────┐               │         │
│  │AuthProviderClient├────────────►│ /login    │               │         │
│  └────────┬────────┘             └─────┬─────┘               │         │
│           │ has auth                   │                      │         │
│           ▼                            │ Google OAuth         │         │
│  ┌─────────────────┐                   │ or Mock Login        │         │
│  │ Load profile    │◄──────────────────┘                      │         │
│  │ from Firestore  │                                          │         │
│  └────────┬────────┘                                          │         │
│           │                                                   │         │
│      ┌────┴────┐                                             │         │
│      │         │                                             │         │
│   no profile  has profile                                    │         │
│      │         │                                             │         │
│      ▼         ▼                                             │         │
│ ┌──────────┐ ┌────────────────┐                             │         │
│ │/onboarding│ │RoleGuardClient │                             │         │
│ └────┬─────┘ └───────┬────────┘                             │         │
│      │               │                                       │         │
│      │ complete      │ role check                            │         │
│      │ profile       │                                       │         │
│      │               ▼                                       │         │
│      │        ┌──────────────┐                              │         │
│      │        │ /student or  │                              │         │
│      └───────►│ /teacher     │◄─────────────────────────────┘         │
│               └──────────────┘                                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Auth Components Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| `AuthProviderClient` | `src/components/AuthProviderClient.tsx` | Root context provider for auth state (Firebase user, profile, loading states) |
| `RoleGuardClient` | `src/components/RoleGuardClient.tsx` | Protects routes by required role; redirects on mismatch |
| `AuthRedirector` | `src/components/AuthRedirector.tsx` | Auto-redirects logged-in users away from `/login` to their dashboard |
| `user-nav` | `src/components/layout/user-nav.tsx` | User dropdown with sign-out functionality |
| `authService` | `src/features/authService.ts` | `signInWithGoogle()`, `signOutUser()`, `handleAuthError()` |

### 10.4 Test Accounts for Emulator Mode

Test accounts are seeded via `scripts/seed-test-users.js` after starting emulators:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Student | `student@test.com` | `password123` | Test student access |
| Teacher | `teacher@test.com` | `password123` | Test teacher access |

**Seeding command:**
```bash
node scripts/seed-test-users.js
```

### 10.5 Test Scenario: Student UI Auth Behavior

#### 10.5.1 Steps

1. Start all services (Firebase emulators, Next.js, DSPy).
2. Seed test users: `node scripts/seed-test-users.js`
3. Navigate to `http://localhost:9002/login`
4. Click **"Mock Student"** button.

#### 10.5.2 Expected Results

- User is signed in using the Auth emulator.
- Firestore profile is created/updated with `role: "student"`.
- User is redirected to `/student` dashboard.
- Attempting to visit `/teacher` redirects back to `/student`.
- User avatar and name appear in the navigation.
- Socratic chat on `/student/courses/[courseId]` is accessible.

#### 10.5.3 Failure Cases

| Failure Case | Expected Behavior |
|--------------|-------------------|
| Auth emulator not running | Login fails with "Make sure Auth emulator is running" alert |
| Profile missing after login | User redirected to `/onboarding` |
| Wrong role tries to access route | Redirected to correct dashboard |

### 10.6 Test Scenario: Teacher UI Auth Behavior

#### 10.6.1 Steps

1. Start all services (Firebase emulators, Next.js, DSPy).
2. Seed test users: `node scripts/seed-test-users.js`
3. Navigate to `http://localhost:9002/login`
4. Click **"Mock Teacher"** button.

#### 10.6.2 Expected Results

- User is signed in using the Auth emulator.
- Firestore profile is created/updated with `role: "teacher"`.
- User is redirected to `/teacher` dashboard.
- Attempting to visit `/student` redirects back to `/teacher`.
- Teacher IST Class Report accessible at `/teacher/courses/cs-demo-101?view=ist-report`.

### 10.7 Test Scenario: Socratic Chat Auth Flow

#### 10.7.1 Steps

1. Sign in as a student (Mock Student button).
2. Navigate to `/student/courses/cs202`.
3. Send a message in the Socratic chat.
4. Observe auth propagation through the IST pipeline.

#### 10.7.2 Expected Results

| Layer | Auth Behavior |
|-------|---------------|
| **Chat Panel** | Message includes demo thread/message IDs |
| **Cloud Function (`analyzeMessage`)** | Uses `request.auth?.uid` or fallback `demo-user` in emulator |
| **DSPy Service** | No direct auth validation; receives `userId` in request payload |
| **Data Connect** | Writes `IstEvent` with `userId` from Cloud Function |
| **Firestore** | Writes analysis to `threads/{threadId}/analysis/{messageId}` |

#### 10.7.3 Expected Logs

**Functions emulator (analyzeMessage):**
```
[analyzeMessage] No auth in emulator, using demo UID "demo-user"
[analyzeMessage] Running IST analysis for threadId: demo-thread-cs202, messageId: msg-...
[analyzeMessage] About to save IST event to DataConnect for messageId ...
[analyzeMessage] DataConnect save completed for messageId ...
```

### 10.8 Test Scenario: Developer/Debug Views

#### 10.8.1 `/ist-dev/dataconnect` Page

**Steps:**
1. Navigate to `http://localhost:9002/ist-dev/dataconnect`
2. Keep default values (`userId: demo-user`, `courseId: cs202`).
3. Click **"Load IST Events"**.

**Expected Results:**
- Page loads without authentication requirement (development page).
- IST events are fetched from Data Connect emulator.
- Events display intent, skills, trajectory, and metadata.

**Auth Note:** This page uses `@auth(level: PUBLIC)` Data Connect operations and does not enforce user authentication. This is intentional for development/debugging. Production should tighten auth rules.

### 10.9 Test Scenario: First-Time User Onboarding

#### 10.9.1 Steps

1. Clear browser storage or use incognito mode.
2. Navigate to `/login`.
3. Sign in with Google (production) or use test token route (development).
4. Observe redirect to `/onboarding`.
5. Complete profile (role, department, courses).
6. Submit profile.

#### 10.9.2 Expected Results

- New user is detected via Firebase metadata (`creationTime === lastSignInTime`).
- User is redirected to `/onboarding`.
- Profile form validates all fields before enabling submit.
- After submission, profile is written to `users/{uid}` in Firestore.
- User is redirected to `/student` or `/teacher` based on selected role.

### 10.10 Test Scenario: Sign-Out Behavior

#### 10.10.1 Steps

1. Sign in as any user.
2. Click the user avatar in the navigation.
3. Select **"Log out"** from the dropdown.

#### 10.10.2 Expected Results

- Firebase `signOut()` is called.
- Auth context is cleared (`profile: null`, `firebaseUser: null`).
- User is redirected to `/login`.
- Attempting to access protected routes redirects back to `/login`.

### 10.11 Auth-Related Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` | Connect to Firebase emulators | `false` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | `demo-api-key` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Required |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Required |
| `ENABLE_TEST_AUTH` | Enable `/api/test-token` route | `false` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account for test tokens | Optional |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account file | Optional |

### 10.12 Emulator Port Reference

| Service | Port | UI URL |
|---------|------|--------|
| Auth Emulator | `9099` | `http://localhost:4000/auth` |
| Firestore Emulator | `8080` | `http://localhost:4000/firestore` |
| Functions Emulator | `5001` | `http://localhost:4000/functions` |
| Data Connect Emulator | `9400` | `http://localhost:4000/dataconnect` |
| Emulator Suite UI | `4000` | `http://localhost:4000` |

### 10.13 Playwright E2E Auth Tests

Existing Playwright tests in `tests/auth.spec.ts` cover:

1. **First login → Onboarding**: New user without profile is redirected to `/onboarding`.
2. **Teacher role access**: Teacher can access `/teacher`, redirected from `/student`.
3. **Student role access**: Student can access `/student`, redirected from `/teacher`.

**Run tests:**
```powershell
# Set required env vars
$env:ENABLE_TEST_AUTH = "true"
$env:FIREBASE_SERVICE_ACCOUNT_PATH = ".\secrets\firebase-admin.json"

# Run tests
npm run test:e2e
```

### 10.14 Security Notes

1. **Test token route** (`/api/test-token`):
   - Only enabled when `ENABLE_TEST_AUTH=true`.
   - Can mint arbitrary custom tokens.
   - **Never enable in production.**

2. **Data Connect `@auth(level: PUBLIC)`**:
   - Current IST operations use public auth for dev/demo.
   - Production should use `@auth(level: USER)` or custom policies.

3. **Firestore security rules**:
   - Enforce user-ownership model.
   - Admin SDK (Cloud Functions) bypasses rules.

4. **DSPy service CORS**:
   - Allows requests from localhost ports only.
   - Production should restrict origins appropriately.

---

## 11. Where to See Each Result (Summary Table)

| Feature                                   | Where to see it                                                |
| ---------------------------------------- | -------------------------------------------------------------- |
| Student message + tutor reply            | Course page UI (`/student/courses/cs202`)                      |
| IST extraction (intent/skills/trajectory)| DSPy logs (`dspy_service` terminal)                            |
| IST saved to Data Connect                | Functions logs (`analyzeMessage`), `/ist-dev/dataconnect`      |
| IST history loaded into context          | Next.js logs (`[IST][Context] Loaded recent ...`) + DSPy logs  |
| Firestore write (thread/message)         | Firestore Emulator UI (`http://127.0.0.1:4000/`)               |
| Data Connect emulator status             | Firebase emulator logs, `/ist-dev/dataconnect` UI              |
| Teacher IST aggregated report            | Teacher UI (`/teacher/courses/cs-demo-101?view=ist-report`)    |
| Auth state (login, profile, role)        | Browser DevTools → Application → Storage; Emulator UI Auth tab |
| Role-based redirects                     | Browser URL changes; Network tab redirect responses            |

---

## 12. Validation Summary

These IST UI tests validate that:

- **End-to-end connectivity** from UI → Next.js → Cloud Functions → DSPy → Data Connect → Firestore is working in emulator mode.
- **IST history and chat history** are loaded from Data Connect and passed into DSPy as `ist_history` and `chat_history`.
- **Data Connect** is the primary store for IST events, with the `/ist-dev/dataconnect` page providing a clear visual for developers.
- **Fallback behavior** for Gemini/Genkit errors keeps the UI stable while IST + Data Connect processing continues.
- **Teacher IST Class Report** aggregates course-level skill signals (counts, shares, trends, gaps, data quality) without exposing any student identifiers or raw utterances.
- **Teacher-side report generation** works end-to-end in the UI: fetch JSON mock dataset → compute v2 analytics → render the aggregated IST class report with expected KPIs and trends.
- **Authentication layer** properly protects routes based on user roles (student/teacher).
- **Auth flows** work correctly: login → profile check → onboarding/dashboard redirect → sign-out.
- **Emulator mode auth** uses test accounts and fallback UIDs without breaking the IST pipeline.

This test plan should be used by developers and TAs to validate changes to the IST pipeline, especially when iterating on Data Connect integration, DSPy prompts, UI behavior, or authentication changes.

---

**Last Updated**: January 16, 2026  
**Status**: ✅ Updated with Auth Behavior Validation section for IST pipeline authentication layer
