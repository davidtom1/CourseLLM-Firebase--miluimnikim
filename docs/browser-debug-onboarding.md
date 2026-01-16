# Browser Debugging Onboarding Guide

**Document Version:** 1.0  
**Last Updated:** January 16, 2026  
**Audience:** Developers with browser-only access (no IDE or codebase)

---

## Table of Contents

1. [High-Level System Overview](#1-high-level-system-overview)
2. [How the System Behaves in the Browser](#2-how-the-system-behaves-in-the-browser)
3. [Authentication Behavior](#3-authentication-behavior)
4. [Developer Tooling & Observability](#4-developer-tooling--observability)
5. [Known Edge Cases or Gotchas](#5-known-edge-cases-or-gotchas)
6. [Linkage to Backend / External Systems](#6-linkage-to-backend--external-systems)
7. [Testing & Emulator Mode Notes](#7-testing--emulator-mode-notes)
8. [Glossary of Terms](#8-glossary-of-terms)
9. [What You Should Now Be Able To Do](#9-what-you-should-now-be-able-to-do)

---

## 1. High-Level System Overview

### 1.1 Purpose and Scope

**CourseLLM (CourseWise)** is an AI-powered educational platform designed for undergraduate university courses, currently tested on Computer Science courses. The platform provides:

- **Personalized Socratic tutoring** — AI-driven chat that guides students through course material using the Socratic method
- **IST (Intent–Skill–Trajectory) extraction** — Analyzes student questions to understand their learning intent, identify relevant skills, and recommend personalized learning trajectories
- **Role-based dashboards** — Separate UIs for students and teachers
- **Teacher analytics** — Aggregated reports on student learning patterns without exposing individual identities

### 1.2 Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER / CLIENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Next.js 15 Frontend (React 18 + TypeScript)                                │
│  └── Tailwind CSS + Radix UI Components                                     │
│  └── Firebase Client SDK (Auth, Firestore)                                  │
│  └── Data Connect Generated Web SDK                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐     ┌─────────────────────────────────────────┐   │
│  │  Cloud Functions    │     │  DSPy Python Service (FastAPI)          │   │
│  │  (Firebase)         │────▶│  - IST extraction via LLM               │   │
│  │  - analyzeMessage   │     │  - Port 8000                            │   │
│  └─────────────────────┘     └─────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                                          │   │
│  │  ├── Firestore (NoSQL) - threads/analysis documents, user profiles  │   │
│  │  └── Firebase Data Connect (PostgreSQL) - IstEvent table            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI / LLM SERVICES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ├── Google Genkit + Gemini (gemini-2.5-flash) — Socratic chat             │
│  └── DSPy.ai + OpenAI/Gemini — IST extraction                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Frontend/Backend Services

| Service | Technology | Purpose |
|---------|------------|---------|
| **Frontend** | Next.js 15 (App Router) | React-based web app with SSR/RSC |
| **Auth** | Firebase Authentication | Google OAuth + emulator mock login |
| **Database (NoSQL)** | Firestore | User profiles, chat threads, analysis docs |
| **Database (SQL)** | Firebase Data Connect (PostgreSQL) | IST events storage |
| **Cloud Functions** | Firebase Functions v2 | `analyzeMessage` callable |
| **AI (Chat)** | Google Genkit + Gemini | Socratic tutor responses |
| **AI (IST)** | DSPy + OpenAI/Gemini | Intent/Skill/Trajectory extraction |

### 1.4 Technologies in Use

| Category | Technology | Version/Notes |
|----------|------------|---------------|
| Framework | Next.js | 15.x with App Router |
| UI | React | 18.x |
| Styling | Tailwind CSS + Radix UI | Component library |
| Language | TypeScript | 5.x |
| Backend | Firebase Cloud Functions | v2 (callable) |
| Python Service | FastAPI | DSPy microservice |
| Database | Firestore + PostgreSQL | Via Data Connect |
| Auth | Firebase Auth | Google OAuth |
| AI | Genkit 1.24.0 | With Google GenAI |
| AI | DSPy | Python LLM framework |

---

## 2. How the System Behaves in the Browser

### 2.1 All Relevant URLs and Routes

#### Public Routes

| Route | Description | Expected Behavior |
|-------|-------------|-------------------|
| `/` | Root page | Redirects to `/login` (unauthenticated) or dashboard |
| `/login` | Login page | Sign-in options: Google OAuth + Mock login buttons |
| `/onboarding` | Profile setup | New user profile creation (role, department, courses) |

#### Student Routes (require `role: "student"`)

| Route | Description | Expected Behavior |
|-------|-------------|-------------------|
| `/student` | Student dashboard | Course cards with progress, "Continue Learning" buttons |
| `/student/courses` | Course catalog | List of available courses |
| `/student/courses/[courseId]` | Course detail page | **Main Socratic chat interface** + course materials |
| `/student/assessments` | Assessments page | Student assessments |
| `/student/dashboard` | Alternative dashboard | Same as `/student` |

#### Teacher Routes (require `role: "teacher"`)

| Route | Description | Expected Behavior |
|-------|-------------|-------------------|
| `/teacher` | Teacher dashboard | Overview of courses and student engagement |
| `/teacher/courses` | Course management | List of teacher's courses |
| `/teacher/courses/[courseId]` | Course management detail | Course settings + **IST Class Report** tab |
| `/teacher/courses/[courseId]?view=ist-report` | IST Report view | Aggregated skill analytics |
| `/teacher/materials` | Materials management | Upload/manage course materials |
| `/teacher/dashboard` | Alternative dashboard | Same as `/teacher` |

#### Developer/Debug Routes

| Route | Description | Expected Behavior |
|-------|-------------|-------------------|
| `/ist-dev/dataconnect` | Data Connect debug page | Query IST events from PostgreSQL emulator |
| `/debug-analysis` | Analysis debug page | Debug IST analysis |
| `/test/signin` | Test sign-in page | For Playwright tests (requires `token` param) |

### 2.2 What to Expect on Key Routes

#### `/login` Page

**Visual Elements:**
- Card with "Sign in to CourseLLM" header
- "Sign in with Google" primary button
- Divider with "Or use mock login (dev only)"
- Two outline buttons: "Mock Student" and "Mock Teacher"
- Loading overlay when signing in

**Behavior:**
1. Google sign-in triggers OAuth popup
2. Mock buttons use email/password auth against emulator
3. After auth, redirects to appropriate dashboard based on role

#### `/student/courses/[courseId]` Page (Socratic Chat)

**Visual Elements:**
- Course title and description at top
- Two-column layout on large screens:
  - **Left:** Course Materials panel (scrollable list of PDFs, PPTs, docs)
  - **Right:** Socratic Tutor chat panel

**Chat Panel Elements:**
- Bot avatar with message bubbles
- User message bubbles (aligned right)
- Text input at bottom with Send button
- **IntentInspector** appears below user messages (shows IST analysis)
- Loading spinner during AI response

**User Interaction Flow:**
1. Type question in input field
2. Press Enter or click Send
3. User message appears immediately
4. Bot shows loading spinner
5. AI response appears (or fallback message if Gemini fails)
6. IntentInspector shows IST data after analysis completes

#### `/teacher/courses/[courseId]?view=ist-report` Page

**Visual Elements:**
- Course header with title
- "IST Class Report" card with:
  - "Generate IST Class Report" button
  - Executive Summary KPIs (after generation)
  - Trends section (Last 7 vs Previous 7 days)
  - Skills tables (Top Skills + Gaps)
  - Data Quality metrics

**Privacy Note:** No student identifiers, userIds, or raw utterances are displayed.

### 2.3 Simulating User Actions

#### Logging In (Mock Login)

1. Navigate to `http://localhost:9002/login`
2. Click **"Mock Student"** or **"Mock Teacher"**
3. Wait for redirect to appropriate dashboard
4. If emulators not running, you'll see an alert

#### Sending a Socratic Chat Message

1. Sign in as a student
2. Navigate to `/student/courses/cs101` (or `cs-demo-101`)
3. Scroll to the chat panel on the right
4. Type a question, e.g., "What is the time complexity of inserting into a dynamic array?"
5. Press Enter or click Send
6. Observe:
   - Your message appears immediately
   - Bot shows loading spinner
   - AI response arrives (or fallback)
   - IntentInspector loads below your message

#### Generating Teacher IST Report

1. Sign in as a teacher
2. Navigate to `/teacher/courses/cs-demo-101?view=ist-report`
3. Click **"Generate IST Class Report"**
4. Wait for report to render
5. Review Executive Summary, Trends, Skills tables

### 2.4 Available Test Courses

| Course ID | Title | Notes |
|-----------|-------|-------|
| `cs101` | Introduction to Python | Basic course with materials |
| `cs-demo-101` | Data Structures & Algorithms | **Primary test course** — has mock IST data |
| `cs303` | Machine Learning Foundations | Advanced course |

---

## 3. Authentication Behavior

### 3.1 How Auth is Handled in the Frontend

The app uses **Firebase Authentication** with the following storage mechanisms:

| Storage | What's Stored | How to View |
|---------|---------------|-------------|
| **IndexedDB** | Firebase Auth persistence | DevTools → Application → Storage → IndexedDB → `firebaseLocalStorageDb` |
| **Firestore** | User profile (`users/{uid}`) | DevTools → Network (Firestore requests) or Emulator UI |
| **Memory** | Auth context state | React DevTools (if installed) |

#### Auth Context Values

The `AuthProviderClient` provides these values via `useAuth()`:

```typescript
{
  firebaseUser: User | null,      // Raw Firebase user object
  profile: Profile | null,         // Firestore user profile
  loading: boolean,                // Auth loading state
  onboardingRequired: boolean,     // True if profile incomplete
  signInWithGoogle: () => Promise<void>,
  signOut: () => Promise<void>,
  refreshProfile: () => Promise<Profile | null>
}
```

#### Profile Shape

```typescript
type Profile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'student' | 'teacher';  // Critical for routing
  department?: string;
  courses?: string[];
  profileComplete?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

### 3.2 How to Tell if a User is Authenticated

**In Browser DevTools:**

1. **Console Check:**
   ```javascript
   // Run in DevTools Console
   firebase.auth().currentUser  // null if not authenticated
   ```

2. **Application Tab:**
   - Check IndexedDB → `firebaseLocalStorageDb` → `firebaseLocalStorage`
   - Look for `firebase:authUser:...` key

3. **Network Tab:**
   - Authenticated requests include `Authorization: Bearer <token>` header
   - Firestore requests include auth tokens

4. **UI Indicators:**
   - User avatar appears in navigation (top-right)
   - Able to access `/student` or `/teacher` routes
   - Not redirected to `/login`

### 3.3 Common Auth Failure Modes

| Symptom | Likely Cause | How to Identify |
|---------|--------------|-----------------|
| "Login failed" alert on Mock button | Auth emulator not running | Console shows connection error; check `localhost:9099` |
| Stuck on login page after sign-in | Profile not created/loaded | Check Firestore for `users/{uid}` doc |
| Redirected to `/onboarding` | Profile incomplete | Profile missing `role`, `department`, or `courses` |
| Redirected away from `/teacher` | Wrong role | Profile has `role: "student"` instead of `teacher` |
| "Token expired" in console | Auth token needs refresh | Usually auto-handled; try refreshing page |
| "User not found" | Emulator restarted without re-seeding | Run `node scripts/seed-test-users.js` |

### 3.4 Test Accounts (Emulator Mode)

| Role | Email | Password | UID |
|------|-------|----------|-----|
| Student | `student@test.com` | `password123` | Auto-generated |
| Teacher | `teacher@test.com` | `password123` | Auto-generated |

**Important:** Test users must be seeded after each emulator restart:
```bash
node scripts/seed-test-users.js
```

### 3.5 Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         User visits app                                  │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AuthProviderClient checks onAuthStateChanged                            │
├───────────────────────────────┬─────────────────────────────────────────┤
│  No Firebase user             │  Has Firebase user                       │
│  (not authenticated)          │  (authenticated)                        │
└───────────────┬───────────────┴──────────────────┬──────────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────┐       ┌─────────────────────────────────────┐
│  Redirect to /login       │       │  Load Firestore profile              │
└───────────────────────────┘       │  users/{uid}                         │
                                    └──────────────────┬──────────────────┘
                                                       │
                              ┌─────────────────────────┼─────────────────┐
                              │                         │                 │
                              ▼                         ▼                 ▼
               ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────┐
               │  Profile not found   │  │  Profile incomplete │  │  Profile OK  │
               │  (onboardingRequired)│  │  (missing role, etc)│  │              │
               └──────────┬───────────┘  └──────────┬──────────┘  └──────┬───────┘
                          │                         │                     │
                          ▼                         ▼                     ▼
               ┌────────────────────────────────────────┐      ┌────────────────────┐
               │        Redirect to /onboarding         │      │  RoleGuardClient   │
               └────────────────────────────────────────┘      │  checks role       │
                                                               └─────────┬──────────┘
                                                                         │
                                                   ┌─────────────────────┼───────────────┐
                                                   │                     │               │
                                                   ▼                     ▼               ▼
                                        ┌──────────────────┐  ┌─────────────────┐  ┌─────────────┐
                                        │  role: "student" │  │  role: "teacher"│  │  role mismatch│
                                        │  → /student      │  │  → /teacher     │  │  → redirect   │
                                        └──────────────────┘  └─────────────────┘  └─────────────┘
```

---

## 4. Developer Tooling & Observability

### 4.1 What to Look for in Browser DevTools

#### Console Tab

| Log Pattern | Meaning |
|-------------|---------|
| `[IST]` | IST extraction-related logs |
| `[IST][chatIst]` | Chat IST integration logs |
| `[IST][Context]` | IST context loading logs |
| `Connected to Firebase emulators` | Emulator connection confirmed |
| `socraticPrompt failed, returning fallback` | Gemini error (graceful) |
| `[IntentInspector] Firestore onSnapshot error` | Firestore read failed |

**Key Console Messages to Watch:**

```
// Successful IST flow
[IST][chatIst] START analyzeAndStoreIstForMessage {threadId, messageId, courseId}
[IST][chatIst] Calling engine.analyzeMessage...
[IST][chatIst] Received analysis from engine
[IST][chatIst] Successfully saved analysis to Firestore

// Context loading (in Next.js server logs, visible in terminal)
[IST][Context][DEMO] Using demo identity: { userId: 'demo-user-1', courseId: 'cs-demo-101' }
[IST][Context] Loaded recent IST events: 5
[IST][Context] Loaded recent chat messages: 3
```

#### Network Tab

**Key Requests to Monitor:**

| Request URL Pattern | Type | What It Does |
|---------------------|------|--------------|
| `us-central1-analyzeMessage` | Callable Function | IST analysis via Cloud Function |
| `/api/intent-skill-trajectory` | POST | Direct DSPy service call |
| `firestore.googleapis.com` | REST | Firestore reads/writes |
| `/mocks/ist/teacher-class-events.json` | GET | Teacher report mock data |
| `localhost:9400` | GraphQL | Data Connect emulator |

**Example: Tracing a Socratic Chat Message**

1. **Filter by:** `Fetch/XHR`
2. **Look for:** Request to `us-central1-analyzeMessage`
3. **Request Payload:**
   ```json
   {
     "data": {
       "threadId": "demo-thread-cs101",
       "messageId": "msg-1705347200000",
       "messageText": "What is the time complexity of inserting into a dynamic array?",
       "courseId": "cs101"
     }
   }
   ```
4. **Response Payload (success):**
   ```json
   {
     "result": {
       "intent": {
         "primary": "ASK_EXPLANATION",
         "labels": ["ASK_EXPLANATION"],
         "confidence": 0.85
       },
       "skills": {
         "items": [
           { "id": "dynamic-arrays", "displayName": "Dynamic Arrays", "confidence": 0.8, "role": "FOCUS" },
           { "id": "time-complexity", "displayName": "Time Complexity", "confidence": 0.8, "role": "SECONDARY" }
         ]
       },
       "trajectory": {
         "status": "ON_TRACK",
         "currentNodes": [],
         "suggestedNextNodes": [
           { "id": "step-1", "reason": "Review amortized analysis for dynamic arrays", "priority": 1 }
         ]
       },
       "metadata": {
         "processedAt": "2026-01-16T...",
         "modelVersion": "ist-v1-dspy",
         "threadId": "demo-thread-cs101",
         "messageId": "msg-1705347200000",
         "uid": "demo-user"
       }
     }
   }
   ```

#### Application Tab

**What to Check:**

| Section | What to Look For |
|---------|------------------|
| **IndexedDB** → `firebaseLocalStorageDb` | Auth persistence tokens |
| **Local Storage** | Any custom app state (currently minimal) |
| **Session Storage** | Temporary state |
| **Cookies** | Firebase session cookies (if any) |

### 4.2 Key Network Requests to Observe

#### 1. `analyzeMessage` Cloud Function Call

**When:** Every time a student sends a message in Socratic chat

**Request:**
```
POST https://us-central1-{project}.cloudfunctions.net/analyzeMessage
Content-Type: application/json

{
  "data": {
    "threadId": "demo-thread-cs101",
    "messageId": "msg-{timestamp}",
    "messageText": "user question here",
    "courseId": "cs101"
  }
}
```

**Success Response (200):**
```json
{
  "result": { /* MessageAnalysis object */ }
}
```

**Error Response:**
```json
{
  "error": {
    "message": "User must be authenticated",
    "status": "UNAUTHENTICATED"
  }
}
```

#### 2. DSPy Service Call (Internal)

**Note:** This is called by the Cloud Function, not directly from browser. You can test it via:

```bash
curl -X POST http://localhost:8000/api/intent-skill-trajectory \
  -H "Content-Type: application/json" \
  -d '{"utterance": "What is recursion?", "course_context": "CS 101"}'
```

#### 3. Firestore Analysis Document

**Path:** `threads/{threadId}/analysis/{messageId}`

**Document Shape:**
```json
{
  "intent": {
    "primary": "ASK_EXPLANATION",
    "labels": ["ASK_EXPLANATION"],
    "confidence": 0.85
  },
  "skills": {
    "items": [
      {
        "id": "recursion",
        "displayName": "Recursion",
        "confidence": 0.8,
        "role": "FOCUS"
      }
    ]
  },
  "trajectory": {
    "status": "ON_TRACK",
    "currentNodes": [],
    "suggestedNextNodes": [
      {
        "id": "step-1",
        "reason": "Review base cases and recursive calls",
        "priority": 1
      }
    ]
  },
  "metadata": {
    "processedAt": "2026-01-16T12:00:00.000Z",
    "modelVersion": "ist-v1-dspy",
    "threadId": "demo-thread-cs101",
    "messageId": "msg-1705347200000",
    "uid": "demo-user"
  }
}
```

#### 4. Teacher Report Mock Data

**Request:**
```
GET /mocks/ist/teacher-class-events.json
```

**Response:** Array of `IstEventForReport` objects

### 4.3 Identifying Success/Failure Signals

| Signal | Where to See | Meaning |
|--------|--------------|---------|
| HTTP 200 on `analyzeMessage` | Network tab | IST analysis succeeded |
| HTTP 401/403 on function call | Network tab | Auth failed |
| HTTP 500 on function call | Network tab | Server error (check function logs) |
| `result` in response JSON | Network → Response | Successful callable function |
| `error` in response JSON | Network → Response | Function threw error |
| IntentInspector shows data | UI | Firestore read succeeded |
| IntentInspector shows "Loading..." | UI | Waiting for Firestore |
| IntentInspector shows "No analysis available" | UI | Document not found (yet) |
| Bot response appears | UI | Genkit/Gemini call succeeded |
| "AI tutor is temporarily unavailable" | UI (chat) | Gemini returned 503 (fallback) |

### 4.4 Tips for Debugging

1. **Enable Verbose Logging:** Open Console, filter by `[IST]`

2. **Check Emulator Status:** 
   - Visit `http://localhost:4000` for Emulator Suite UI
   - Check individual tabs: Auth, Firestore, Functions, Data Connect

3. **Verify Auth Token:**
   ```javascript
   // In Console
   const user = firebase.auth().currentUser;
   if (user) {
     user.getIdToken().then(token => console.log('Token:', token.substring(0, 50) + '...'));
   }
   ```

4. **Check Firestore Document:**
   - Go to Emulator UI → Firestore
   - Navigate to `threads/{threadId}/analysis/{messageId}`

5. **Network Timing:**
   - Use Network tab waterfall to identify slow requests
   - `analyzeMessage` typically takes 2-10 seconds (LLM call)

---

## 5. Known Edge Cases or Gotchas

### 5.1 Caching Behaviors

| Cache | Behavior | Potential Issue |
|-------|----------|-----------------|
| **Next.js Route Cache** | Pages may be cached | Stale data after login; force refresh |
| **Firestore IndexedDB** | Offline persistence enabled | May show stale data; clear in DevTools |
| **Browser Cache** | Static assets cached | Clear cache if UI doesn't update |
| **React Strict Mode** | Components render twice in dev | Double console logs are normal |

**Clearing Caches:**
1. DevTools → Application → Storage → Clear site data
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### 5.2 Conditions That Affect Component Behavior

| Condition | Effect |
|-----------|--------|
| **User Role** | Determines accessible routes; wrong role = redirect |
| **Emulator Mode** | Mock login available; `demo-user` fallback in functions |
| **IST_DEMO_MODE** | Demo identity used for context loading |
| **No Profile** | Redirects to `/onboarding` |
| **Incomplete Profile** | Missing role/department/courses → onboarding |
| **Gemini 503** | Chat shows fallback message; IST still runs |
| **DSPy Service Down** | IST analysis fails; IntentInspector shows error |

### 5.3 Silent Failures and Misleading UI States

| Scenario | What You See | What's Actually Happening |
|----------|--------------|---------------------------|
| IntentInspector stays "Loading..." | Waiting indefinitely | Firestore document doesn't exist (yet) |
| Chat input disabled | Can't type | `isPending` state is stuck (React transition) |
| "No IST events found" on debug page | Empty list | Wrong userId/courseId or no data |
| Report generation hangs | "Generating..." forever | JSON fetch failed (check Network) |
| User appears logged out after refresh | Redirected to login | Profile load failed (offline?) |
| Mock login alert "Make sure Auth emulator is running" | Auth failed | Emulator not started or wrong port |

### 5.4 Common Pitfalls

1. **Forgetting to seed test users** — After emulator restart, run `node scripts/seed-test-users.js`

2. **Wrong course ID** — Use `cs-demo-101` for teacher reports (has mock data)

3. **Data Connect not started** — Check for port 9400 in emulator output

4. **DSPy service not running** — IST analysis will fail; start it on port 8000

5. **Firestore rules blocking** — In emulator, rules are lenient; production is strict

6. **Browser timezone** — Timestamps in UI are UTC; may appear "off"

---

## 6. Linkage to Backend / External Systems

### 6.1 Message Flow: UI → Cloud Functions → DSPy → Data Connect

```
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User sends message in Socratic Chat                                │
│                                                                            │
│ Browser: ChatPanel component                                               │
│ ├── User types question, clicks Send                                       │
│ ├── Message added to local state immediately                               │
│ └── Fire-and-forget call to analyzeAndStoreIstForMessage()                │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Cloud Function receives request                                    │
│                                                                            │
│ Firebase Functions: analyzeMessage (callable)                              │
│ ├── Validates auth (or uses demo-user in emulator)                         │
│ ├── Extracts threadId, messageText, messageId, courseId                    │
│ └── Attempts to load IST context from Data Connect                         │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Cloud Function calls DSPy service                                  │
│                                                                            │
│ HTTP POST to http://localhost:8000/api/intent-skill-trajectory             │
│ ├── Request: { utterance, course_context, chat_history, ist_history }      │
│ └── Response: { intent, skills[], trajectory[] }                           │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: DSPy service processes with LLM                                    │
│                                                                            │
│ Python FastAPI: /api/intent-skill-trajectory                               │
│ ├── IST extractor module invoked                                           │
│ ├── LLM call (OpenAI or Gemini via LiteLLM)                               │
│ └── Returns structured IST response                                        │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Cloud Function stores results                                      │
│                                                                            │
│ Data Connect (PostgreSQL):                                                 │
│ └── IstEvent row created via CreateIstEvent mutation                       │
│                                                                            │
│ Firestore:                                                                 │
│ └── threads/{threadId}/analysis/{messageId} document written               │
└────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Browser receives & displays results                                │
│                                                                            │
│ IntentInspector component:                                                 │
│ ├── Subscribes to Firestore document via onSnapshot                        │
│ ├── Receives MessageAnalysis when document is written                      │
│ └── Renders intent, skills, trajectory in UI                              │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Request/Response Shapes Visible in Browser

#### `analyzeMessage` Callable Function

**Request (visible in Network tab):**
```json
{
  "data": {
    "threadId": "demo-thread-cs101",
    "messageId": "msg-1705347200000",
    "messageText": "What is the time complexity of inserting into a dynamic array?",
    "courseId": "cs101",
    "language": "en",
    "maxHistoryMessages": 5
  }
}
```

**Response (visible in Network tab):**
```json
{
  "result": {
    "intent": {
      "labels": ["ASK_EXPLANATION"],
      "primary": "ASK_EXPLANATION",
      "confidence": 0.85
    },
    "skills": {
      "items": [
        {
          "id": "dynamic-arrays",
          "displayName": "Dynamic Arrays",
          "confidence": 0.8,
          "role": "FOCUS"
        },
        {
          "id": "time-complexity",
          "displayName": "Time Complexity",
          "confidence": 0.8,
          "role": "SECONDARY"
        }
      ]
    },
    "trajectory": {
      "currentNodes": [],
      "suggestedNextNodes": [
        {
          "id": "step-1",
          "reason": "Review amortized analysis for dynamic arrays",
          "priority": 1
        },
        {
          "id": "step-2",
          "reason": "Compare with linked list insertion complexity",
          "priority": 2
        }
      ],
      "status": "ON_TRACK"
    },
    "metadata": {
      "processedAt": "2026-01-16T12:00:00.000Z",
      "modelVersion": "ist-v1-dspy",
      "threadId": "demo-thread-cs101",
      "messageId": "msg-1705347200000",
      "uid": "demo-user"
    }
  }
}
```

### 6.3 Data Connect GraphQL Operations

**Query: List IST Events**
```graphql
query IstEventsByUserAndCourse($userId: String!, $courseId: String!) {
  istEvents(
    where: { userId: { eq: $userId }, courseId: { eq: $courseId } }
    orderBy: { createdAt: DESC }
  ) {
    id
    userId
    courseId
    threadId
    messageId
    utterance
    intent
    skills
    trajectory
    createdAt
  }
}
```

**Mutation: Create IST Event**
```graphql
mutation CreateIstEvent(
  $userId: String!
  $courseId: String!
  $threadId: String!
  $messageId: String!
  $utterance: String!
  $intent: String!
  $skills: Any
  $trajectory: Any
) {
  istEvent_insert(data: {
    userId: $userId
    courseId: $courseId
    threadId: $threadId
    messageId: $messageId
    utterance: $utterance
    intent: $intent
    skills: $skills
    trajectory: $trajectory
  })
}
```

---

## 7. Testing & Emulator Mode Notes

### 7.1 How the System Behaves Differently in Emulator Mode

| Aspect | Production | Emulator Mode |
|--------|------------|---------------|
| **Auth** | Google OAuth popup | Mock login with email/password |
| **User UID** | Real Firebase UID | Auto-generated emulator UID |
| **analyzeMessage auth** | Requires real auth | Falls back to `demo-user` |
| **Firestore** | Cloud Firestore | Local emulator (port 8080) |
| **Data Connect** | Cloud SQL | Local PGLite (port 9400) |
| **Data Persistence** | Persistent | Lost on emulator restart |
| **IST Context** | Data Connect queries | Falls back to JSON if empty |

### 7.2 How to Know if Emulator Mode is Active

**Check 1: Browser Console**
Look for:
```
Connected to Firebase emulators
```

**Check 2: Network Requests**
- Firestore requests go to `localhost:8080` not `firestore.googleapis.com`
- Functions requests go to `localhost:5001`

**Check 3: Login Page**
- Mock Student/Teacher buttons are visible
- These only work against emulator

**Check 4: Emulator UI**
Visit `http://localhost:4000` — if it loads, emulators are running

### 7.3 Emulator Port Reference

| Service | Port | UI URL |
|---------|------|--------|
| **Emulator Suite UI** | 4000 | `http://localhost:4000` |
| **Auth Emulator** | 9099 | `http://localhost:4000/auth` |
| **Firestore Emulator** | 8080 | `http://localhost:4000/firestore` |
| **Functions Emulator** | 5001 | `http://localhost:4000/functions` |
| **Data Connect Emulator** | 9400 | `http://localhost:4000/dataconnect` |
| **Storage Emulator** | 9199 | `http://localhost:4000/storage` |
| **Realtime Database** | 9000 | `http://localhost:4000/database` |

### 7.4 Test Dataset Preloaded

**Teacher Class Report Mock Data:**
- File: `/mocks/ist/teacher-class-events.json` (served from `public/`)
- Contains ~100 IST events for `courseId: "cs-demo-101"`
- Skills include: Arrays, Linked Lists, Recursion, Binary Trees, Hash Tables, Graphs, etc.
- Time range: ~2 weeks of mock data

**Mock Courses:**
- `cs101` — Introduction to Python
- `cs-demo-101` — Data Structures & Algorithms (**use this for reports**)
- `cs303` — Machine Learning Foundations

### 7.5 Seeding Test Data

**After starting emulators, seed test users:**
```bash
node scripts/seed-test-users.js
```

This creates:
- `student@test.com` with `role: student`
- `teacher@test.com` with `role: teacher`

**Note:** Auth emulator data is ephemeral. Seed users after every emulator restart.

---

## 8. Glossary of Terms

| Term | Definition |
|------|------------|
| **IST** | **I**ntent–**S**kill–**T**rajectory. The core analysis pipeline that extracts learning insights from student questions. |
| **Intent** | What the student is trying to accomplish (e.g., ASK_EXPLANATION, ASK_EXAMPLES). |
| **Skill** | A specific concept or topic the student is asking about (e.g., "Recursion", "Dynamic Arrays"). |
| **Trajectory** | Recommended learning path or next steps for the student. |
| **DSPy** | A Python framework for building LLM pipelines with structured outputs. Used for IST extraction. |
| **Genkit** | Google's AI framework for TypeScript. Used for Socratic chat responses. |
| **Gemini** | Google's LLM (gemini-2.5-flash). Powers chat and some IST. |
| **Socratic Method** | Teaching technique that uses questions to guide learning rather than direct answers. |
| **Callable Function** | Firebase Cloud Functions that can be called directly from client SDK. |
| **Data Connect** | Firebase service providing GraphQL over PostgreSQL. |
| **IstEvent** | A database record storing one IST analysis result. |
| **MessageAnalysis** | The full structured result of IST analysis, stored in Firestore. |
| **IntentInspector** | React component that displays IST analysis below chat messages. |
| **Firestore** | Firebase NoSQL document database. |
| **Emulator** | Local development servers that mimic Firebase services. |
| **Profile** | User's Firestore document containing role, department, courses. |
| **Onboarding** | Process for new users to complete their profile. |
| **RoleGuard** | Client component that enforces role-based route access. |
| **AuthProvider** | React context provider for authentication state. |
| **Thread** | A conversation container (identified by `threadId`). |
| **PGLite** | Lightweight PostgreSQL for local Data Connect emulator. |
| **Utterance** | The raw text of a student's message/question. |
| **KPI** | Key Performance Indicator (metrics in teacher reports). |

### External Documentation Links

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [DSPy Documentation](https://dspy.ai)
- [Google Genkit](https://firebase.google.com/docs/genkit)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 9. What You Should Now Be Able To Do

✅ **Authentication & Access**
- [ ] Sign in using Mock Student or Mock Teacher buttons
- [ ] Recognize when auth fails (emulator not running, user not seeded)
- [ ] Understand why you might be redirected to `/onboarding`
- [ ] Identify auth state in DevTools (IndexedDB, Console)

✅ **Student Socratic Chat**
- [ ] Send a message and observe the complete flow
- [ ] Identify the loading states (spinner, IntentInspector loading)
- [ ] Recognize a successful IST analysis in the UI
- [ ] Understand the fallback message when Gemini fails (503)

✅ **IST Pipeline Understanding**
- [ ] Trace a message from UI → Cloud Function → DSPy → Data Connect
- [ ] Find the `analyzeMessage` request in Network tab
- [ ] Read the IST response payload and understand its structure
- [ ] Check Firestore Emulator UI for stored analysis documents

✅ **Teacher Reports**
- [ ] Navigate to the IST Class Report view
- [ ] Generate a report and understand the KPIs
- [ ] Recognize that no student identifiers appear in the report

✅ **Debugging Skills**
- [ ] Use Console filtering to find IST-related logs
- [ ] Check emulator status at `http://localhost:4000`
- [ ] Identify common failure modes (emulator down, wrong course ID)
- [ ] Clear caches when data appears stale

✅ **Development Environment**
- [ ] Know which ports each emulator uses
- [ ] Understand when to re-seed test users
- [ ] Access the `/ist-dev/dataconnect` debug page
- [ ] Distinguish emulator mode from production behavior

---

**Document Complete**

If you encounter behavior not covered in this document, check:
1. Browser DevTools Console for errors
2. Network tab for failed requests
3. Emulator UI at `http://localhost:4000`
4. Terminal logs for Cloud Functions and DSPy service

For code-level questions, consult the main codebase documentation in `/docs/`.

