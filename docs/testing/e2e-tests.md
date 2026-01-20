# E2E Tests (Playwright)

End-to-end tests for CourseLLM using Playwright. These tests validate complete user flows including authentication, chat interactions, and analytics.

---

## 1. Setup Instructions

### Required Services

Before running E2E tests, ensure the following services are running:

| Service | Command | Port |
|---------|---------|------|
| Firebase Emulators | `firebase emulators:start` | Auth: 9099, Firestore: 8080, DataConnect: 9400 |
| Next.js Dev Server | `npm run dev` | 9002 |
| DSPy Service | `cd dspy_service && python -m uvicorn app:app --reload --port 8000` | 8000 |

### Required Environment Variables

Create or verify `.env.local` at the project root:

```bash
# Required for E2E tests
ENABLE_TEST_AUTH=true
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099

# API Keys (for AI responses)
GOOGLE_API_KEY=your-google-api-key
GEMINI_API_KEY=your-google-api-key
```

### Seed Test Users

After starting emulators, seed test accounts:

```bash
node scripts/seed-test-users.js
```

This creates:
- `student@test.com` / `password123`
- `teacher@test.com` / `password123`

---

## 2. Run the Automated Tests

### Linux / macOS

Run tests by type (recommended - prevents system overload):

```bash
# 1. Authentication & RBAC Tests
npx playwright test tests/auth.spec.ts

# 2. Student Journey Tests (Chat & IST Flow)
npx playwright test tests/e2e/student-journey.spec.ts

# 3. Chat Context Tests (Multi-turn conversation)
npx playwright test tests/e2e/chat-context.spec.ts

# 4. Teacher Analytics Tests
npx playwright test tests/e2e/teacher-analytics.spec.ts
```

Additional options:

```bash
# Run tests with UI mode (interactive)
npx playwright test --ui

# Run tests with debug mode
npx playwright test --debug

# Run with HTML report
npx playwright test --reporter=html
```

### Windows (PowerShell)

Set environment variables once:

```powershell
$Env:ENABLE_TEST_AUTH = "true"
$Env:NEXT_PUBLIC_FIREBASE_USE_EMULATOR = "true"
```

Run tests by type (recommended - prevents system overload):

```powershell
# 1. Authentication & RBAC Tests
npx playwright test tests/auth.spec.ts

# 2. Student Journey Tests (Chat & IST Flow)
npx playwright test tests/e2e/student-journey.spec.ts

# 3. Chat Context Tests (Multi-turn conversation)
npx playwright test tests/e2e/chat-context.spec.ts

# 4. Teacher Analytics Tests
npx playwright test tests/e2e/teacher-analytics.spec.ts
```

Additional options:

```powershell
# Run tests with UI mode (interactive)
npx playwright test --ui

# Run with HTML report
npx playwright test --reporter=html
```

### Expected Success Output

```
Running 12 tests using 1 worker

  ✓ auth.spec.ts:10:1 › 1 - first login redirects to onboarding (5.2s)
  ✓ auth.spec.ts:22:1 › 2 - teacher only access to /teacher pages (3.8s)
  ✓ auth.spec.ts:37:1 › 3 - student only access to /student pages (3.6s)
  ...

  12 passed (45.2s)
```

---

## 3. What These Tests Check (and What Passing Means)

### Authentication Tests (`tests/auth.spec.ts`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| First login → onboarding | New users without profiles are redirected to `/onboarding` | User registration flow works correctly |
| Teacher role access | Teachers can access `/teacher` and are blocked from `/student` | Role-based access control (RBAC) is enforced |
| Student role access | Students can access `/student` and are blocked from `/teacher` | RBAC prevents unauthorized access |

### Student Journey Tests (`tests/e2e/student-journey.spec.ts`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| Complete chat flow with IST | Login → course → send message → AI response → IST analysis | Full student learning pipeline works |
| Chat input validation | Empty/whitespace input is rejected | Input validation prevents invalid submissions |
| Course materials display | Course materials section renders | Content delivery system works |

### Chat Context Tests (`tests/e2e/chat-context.spec.ts`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| Multi-turn context retention | Follow-up questions understand prior context | AI maintains conversation history |
| Thread identity | Multiple messages stay in same thread | Chat threading works correctly |
| IST analysis updates | Each message triggers IST analysis | Intent extraction pipeline is active |
| Topic switching | Changing topics doesn't crash the system | Graceful handling of conversation pivots |

### Teacher Analytics Tests (`tests/e2e/teacher-analytics.spec.ts`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| Teacher dashboard access | Teachers see dashboard with metrics | Analytics UI renders correctly |
| RBAC enforcement | Teachers blocked from student routes | Security boundaries maintained |
| IST class report generation | Report generates with data | Analytics computation works |
| Trends section | 7-day comparisons render | Trend calculations are correct |
| Data quality metrics | Quality indicators display | Report completeness checks work |

---

## 4. Manual Verification

### Manual Auth Flow Testing

1. **Navigate to**: `http://localhost:9002/login`
2. **Click**: "Mock Student" or "Mock Teacher" button
3. **Observe**: Redirect to appropriate dashboard (`/student` or `/teacher`)
4. **Verify**:
   - User avatar appears in navigation
   - Dashboard content loads
   - Attempting to access wrong role's page redirects back

### Manual Chat Testing

1. **Login as student** via Mock Student
2. **Navigate to**: `http://localhost:9002/student/courses/cs-demo-101`
3. **Send a message**: "Help me understand recursion"
4. **Observe**:
   - User message appears immediately (optimistic update)
   - AI response appears within 60 seconds
   - Intent Inspector panel shows skills and trajectory
5. **Verify in Firebase Emulator UI** (`http://localhost:4000`):
   - `threads` collection contains new thread document
   - `analysis` subcollection contains IST data

### Manual Teacher Analytics Testing

1. **Login as teacher** via Mock Teacher
2. **Navigate to**: `http://localhost:9002/teacher/courses/cs-demo-101`
3. **Click**: "IST Class Report" tab
4. **Click**: "Generate IST Class Report" button
5. **Observe**:
   - Executive Summary with KPI cards
   - Trends section with 7-day comparisons
   - Top Skills table
   - Data Quality metrics
6. **Verify**: No student identifiers (userId, utterances) are visible

---

## Test Files Reference

| File | Purpose |
|------|---------|
| `tests/auth.spec.ts` | Authentication and RBAC tests |
| `tests/e2e/student-journey.spec.ts` | Student chat and IST flow |
| `tests/e2e/chat-context.spec.ts` | Multi-turn conversation tests |
| `tests/e2e/teacher-analytics.spec.ts` | Teacher dashboard and reports |
| `tests/utils/test-helpers.ts` | Emulator reset utilities |

---

## Troubleshooting

### Tests Timeout

- Increase timeout in `playwright.config.ts` (default: 120s)
- Ensure all services are running and healthy
- Check for rate limiting from AI services

### Auth Token Errors

- Verify `ENABLE_TEST_AUTH=true` is set
- Ensure Firebase emulators are running
- Check that `/api/test-token` endpoint responds

### Rate Limiting

Tests include built-in rate limit buffers (`RATE_LIMIT_DELAY = 20000ms`). If tests fail due to rate limits:
- Wait between test runs
- Reduce parallel test execution
- Check Gemini API quotas

---

**Last Updated**: January 2026
