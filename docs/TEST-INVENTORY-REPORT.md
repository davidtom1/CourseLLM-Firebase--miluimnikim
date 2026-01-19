# 📋 CourseLLM Test Inventory Report

**Generated:** January 19, 2026  
**Source PRD:** `docs/PRDS/PRD-CourseLLM-Final-Delivery-Phase.md`  
**Status:** VERIFICATION COMPLETE

---

## 📊 Executive Summary

| Category | PRD Requirements | Found in Repo | Status |
|----------|-----------------|---------------|--------|
| Playwright E2E Tests | ✅ Happy Path | ✅ 4 spec files | **PASS** |
| Jest Unit Tests (Frontend) | ✅ IntentInspector, ChatInterface | ✅ 3 test files | **PASS** |
| Pytest Backend Tests | ✅ IST API Tests | ✅ 1 test file (comprehensive) | **PASS** |
| Debug Visualizer | ✅ `/debug/visualizer` | ✅ `/debug/ist-visualizer` | **PASS** |
| Data Connect Script | ✅ Test script | ✅ `scripts/test-dataconnect.ts` | **PASS** |
| Health Endpoints | ✅ Next.js + FastAPI | ✅ Both present | **PASS** |
| Component Docs | ✅ `components.md` | ✅ `docs/components.md` | **PASS** |

**Total Tests/Blocks Mapped:** 8  
**Missing Tests:** 0  
**Status:** ✅ ALL PRD TESTING REQUIREMENTS SATISFIED

---

## 🎭 Playwright E2E Tests

### Test Block #1: Student Journey (Happy Path)

| Field | Value |
|-------|-------|
| **Test / Block Name** | Playwright E2E - Student Journey (Happy Path) |
| **Repo Location** | `tests/e2e/student-journey.spec.ts` |
| **What it Checks** | Login via Mock Student → Navigate to course → Send chat message → Verify AI response displays → IST analysis appears |
| **How it Runs** | `npx playwright test tests/e2e/student-journey.spec.ts` |
| **If Passes, Conclude** | The complete student flow works end-to-end with Firebase emulators |
| **Dependencies / Prerequisites** | Firebase Emulators (Auth: 9099, Firestore: 8080, Functions: 5001), Next.js on port 9002, DSPy service on port 8000 |

**Test Coverage Details:**
- ✅ Login via Mock Student (Auth bypass)
- ✅ Course navigation (`/student/courses/cs-demo-101`)
- ✅ Chat message submission
- ✅ AI response verification
- ✅ IntentInspector widget update

---

### Test Block #2: Authentication & RBAC

| Field | Value |
|-------|-------|
| **Test / Block Name** | Playwright E2E - Auth & Role-Based Access Control |
| **Repo Location** | `tests/auth.spec.ts` |
| **What it Checks** | First login → onboarding redirect, Teacher role → teacher pages only, Student role → student pages only |
| **How it Runs** | `npx playwright test tests/auth.spec.ts` |
| **If Passes, Conclude** | Authentication flow and RBAC work correctly with mock tokens |
| **Dependencies / Prerequisites** | Firebase Auth Emulator (9099), test-token API enabled |

**Test Coverage Details:**
- ✅ Test 1: First login redirects to onboarding
- ✅ Test 2: Teacher-only access to `/teacher` pages
- ✅ Test 3: Student-only access to `/student` pages

---

### Test Block #3: Chat Context Retention

| Field | Value |
|-------|-------|
| **Test / Block Name** | Playwright E2E - Multi-Turn Chat Context |
| **Repo Location** | `tests/e2e/chat-context.spec.ts` |
| **What it Checks** | Multi-turn conversations retain topic context, thread identity persists, IST updates per message |
| **How it Runs** | `npx playwright test tests/e2e/chat-context.spec.ts` |
| **If Passes, Conclude** | The Socratic tutor maintains conversation context across turns |
| **Dependencies / Prerequisites** | Firebase Emulators running, DSPy service for IST analysis |

**Test Coverage Details:**
- ✅ Test 1: Multi-turn conversation retains context
- ✅ Test 2: Conversation maintains thread identity
- ✅ Test 3: IST analysis updates for each message
- ✅ Test 4: Handles topic switching gracefully

---

### Test Block #4: Teacher Analytics

| Field | Value |
|-------|-------|
| **Test / Block Name** | Playwright E2E - Teacher Analytics & IST Report |
| **Repo Location** | `tests/e2e/teacher-analytics.spec.ts` |
| **What it Checks** | Teacher login, dashboard access, IST report generation, RBAC blocking student routes |
| **How it Runs** | `npx playwright test tests/e2e/teacher-analytics.spec.ts` |
| **If Passes, Conclude** | Teacher analytics and IST class reporting work correctly |
| **Dependencies / Prerequisites** | Firebase Emulators, test-token API with `role=teacher` |

**Test Coverage Details:**
- ✅ Test 1: Teacher login and dashboard access
- ✅ Test 2: RBAC - teacher blocked from student routes
- ✅ Test 3: Generate IST class report with data
- ✅ Test 4: Report shows trends section
- ✅ Test 5: Report shows data quality metrics
- ✅ Test 6: Teacher can access materials management

---

## 🧪 Jest Unit Tests (Frontend)

### Test Block #5: IntentInspector Component

| Field | Value |
|-------|-------|
| **Test / Block Name** | Jest Unit - IntentInspector Component |
| **Repo Location** | `src/components/__tests__/IntentInspector.test.tsx` |
| **What it Checks** | Loading state, error state, empty state, success state, Firestore cleanup on unmount |
| **How it Runs** | `npm run test:unit -- IntentInspector` |
| **If Passes, Conclude** | IntentInspector renders correctly in all states with mocked Firestore |
| **Dependencies / Prerequisites** | None (uses Jest mocks for Firestore) |

**Test Coverage Details:**
- ✅ Loading state renders correctly
- ✅ Error state on Firestore errors
- ✅ Error state for missing threadId/messageId
- ✅ Empty state when document doesn't exist
- ✅ Success state with full analysis data
- ✅ Skill roles (FOCUS, SECONDARY) rendered
- ✅ Suggested next nodes rendered
- ✅ Metadata section rendered
- ✅ Unsubscribes from Firestore on unmount

---

### Test Block #6: ChatPanel Component (ChatInterface)

| Field | Value |
|-------|-------|
| **Test / Block Name** | Jest Unit - ChatPanel (ChatInterface) |
| **Repo Location** | `src/app/student/courses/[courseId]/_components/__tests__/chat-panel.test.tsx` |
| **What it Checks** | Render, input behavior, message submission, loading state, AI response, auto-scroll, form submission |
| **How it Runs** | `npm run test:unit -- chat-panel` |
| **If Passes, Conclude** | ChatPanel component handles all UI interactions correctly with mocked AI |
| **Dependencies / Prerequisites** | None (uses Jest mocks for AI functions) |

**Test Coverage Details:**
- ✅ Renders chat input and send button
- ✅ Send button disabled when empty
- ✅ Send button enabled with text
- ✅ Optimistic UI (user message appears immediately)
- ✅ Input clears after submission
- ✅ Calls `socraticCourseChat` with correct params
- ✅ Calls `analyzeAndStoreIstForMessage` for IST
- ✅ Loading spinner during AI response
- ✅ AI response displays correctly
- ✅ Error message on AI failure
- ✅ Auto-scroll on new message
- ✅ IntentInspector integration
- ✅ Form submission via Enter key

---

### Test Block #7: Teacher IST Report Logic

| Field | Value |
|-------|-------|
| **Test / Block Name** | Jest Unit - Teacher IST Report Computation |
| **Repo Location** | `src/features/ist/reports/__tests__/teacherIstReport.test.ts` |
| **What it Checks** | Skill normalization, core metrics computation, coverage metrics, trend analysis |
| **How it Runs** | `npm run test:unit -- teacherIstReport` |
| **If Passes, Conclude** | IST report computation logic is mathematically correct |
| **Dependencies / Prerequisites** | None (pure function tests) |

**Test Coverage Details:**
- ✅ `normalizeSkill` trims, collapses whitespace, lowercases
- ✅ Returns null for invalid inputs
- ✅ Computes `totalSkillAssignments` correctly
- ✅ Computes averages correctly
- ✅ Coverage metrics (top1, top5, top10, longTail shares)
- ✅ Trend computation (last7 vs prev7 windows)
- ✅ Rising/declining skills detection

---

## 🐍 Pytest Backend Tests

### Test Block #8: DSPy Service API (Backend)

| Field | Value |
|-------|-------|
| **Test / Block Name** | Pytest - DSPy Service IST API |
| **Repo Location** | `dspy_service/tests/test_ist_api.py` |
| **What it Checks** | Health endpoint, IST extraction endpoint, error handling, statelessness |
| **How it Runs** | `cd dspy_service && .venv/Scripts/activate && pytest -v` (Windows) or `cd dspy_service && source venv/bin/activate && pytest -v` (Unix) |
| **If Passes, Conclude** | The Python microservice API is functional, returns correct JSON structure, and handles errors gracefully |
| **Dependencies / Prerequisites** | Python venv activated, `pytest` installed, `.env` with `GEMINI_API_KEY` (mocked in tests) |

**Test Coverage Details (6 Test Classes, 30+ Tests):**

**Health Endpoint Tests:**
- ✅ Returns HTTP 200
- ✅ Response is valid JSON
- ✅ Contains required fields (status, service, version)
- ✅ Correct field types
- ✅ Idempotent behavior

**IST API Basic Tests:**
- ✅ Valid request returns 200
- ✅ Response is JSON
- ✅ Contains required fields (intent, skills, trajectory)
- ✅ Correct field types
- ✅ Skills contains strings
- ✅ Trajectory contains strings
- ✅ Intent is non-empty

**Extended Context Tests:**
- ✅ Accepts chat_history
- ✅ Accepts ist_history
- ✅ Accepts student_profile
- ✅ Optional fields have defaults

**Error Handling Tests:**
- ✅ Empty utterance returns 422
- ✅ Missing utterance returns 422
- ✅ Malformed JSON returns 422
- ✅ Error responses are JSON

**Statelessness Tests:**
- ✅ Multiple requests are independent
- ✅ Repeated requests return same structure
- ✅ No side effects on health endpoint

**Edge Case Tests:**
- ✅ Very long utterance handled
- ✅ Special characters handled
- ✅ Unicode characters handled
- ✅ Empty optional context handled

---

## 🔧 Utility Scripts & Tools

### Data Connect Validation Script

| Field | Value |
|-------|-------|
| **Test / Block Name** | Data Connect Validation Script |
| **Repo Location** | `scripts/test-dataconnect.ts` |
| **What it Checks** | Connects to Data Connect Emulator, writes IST event, queries it back, deletes it |
| **How it Runs** | `npx tsx scripts/test-dataconnect.ts` |
| **If Passes, Conclude** | Data Connect SDK is properly generated and emulator connection works |
| **Dependencies / Prerequisites** | Firebase emulators running, `npm run dataconnect:generate` completed |

---

### Debug Visualizer Page

| Field | Value |
|-------|-------|
| **Test / Block Name** | Debug IST Visualizer Page |
| **Repo Location** | `src/app/debug/ist-visualizer/page.tsx` |
| **What it Checks** | Manual verification of IST analysis output (Intent, Skills, Trajectory) |
| **How it Runs** | Navigate to `http://localhost:9002/debug/ist-visualizer` |
| **If Passes, Conclude** | IST engine produces viewable output for debugging |
| **Dependencies / Prerequisites** | Next.js running on port 9002, Firebase emulators |

---

### Health Check Endpoints

| Endpoint | Location | Command to Verify |
|----------|----------|-------------------|
| Next.js `/api/health` | `src/app/api/health/route.ts` | `curl http://localhost:9002/api/health` |
| FastAPI `/health` | `dspy_service/app.py` | `curl http://localhost:8000/health` |

---

## 📁 Test Configuration Files

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Playwright E2E configuration (baseURL: 9002, testMatch: `**/*.spec.ts`) |
| `jest.config.js` | Jest unit test configuration (testMatch: `**/__tests__/**/*.test.*`) |
| `dspy_service/pytest.ini` | Pytest configuration (markers: unit, integration, ist_api, health) |
| `dspy_service/conftest.py` | Pytest fixtures (TestClient, mock IST extractor, sample requests) |
| `tests/utils/test-helpers.ts` | E2E utilities (resetFirestoreEmulator, resetChatData, waitForRateLimit) |

---

## 🚀 Full Suite Commands

### Run All Tests (Recommended Sequence)

```bash
# 1. Start Firebase Emulators (Terminal 1)
firebase emulators:start

# 2. Start DSPy Service (Terminal 2)
cd dspy_service
.venv\Scripts\activate  # Windows
source venv/bin/activate # Unix
python -m uvicorn app:app --host 0.0.0.0 --port 8000

# 3. Start Next.js Dev Server (Terminal 3)
npm run dev

# 4. Run Backend Tests (Terminal 4)
cd dspy_service
pytest -v

# 5. Run Frontend Unit Tests
npm run test:unit

# 6. Run E2E Tests (after services are up)
npm run test:e2e
```

### Quick Commands Reference

| Test Type | Command |
|-----------|---------|
| All E2E | `npm run test:e2e` or `npx playwright test` |
| All Unit | `npm run test:unit` or `npx jest` |
| Backend Only | `cd dspy_service && pytest -v` |
| Specific E2E | `npx playwright test tests/e2e/student-journey.spec.ts` |
| Specific Unit | `npm run test:unit -- IntentInspector` |

---

## ✅ Gap Analysis

### PRD Requirement Mapping

| PRD Section | Requirement | Status | Notes |
|-------------|-------------|--------|-------|
| §4.2 - Dev 2 | Playwright E2E Happy Path | ✅ FOUND | `tests/e2e/student-journey.spec.ts` |
| §4.2 - Dev 2 | Login → Mock Student → Chat → Response | ✅ FOUND | Full flow covered |
| §4.2 - Dev 2 | Jest Unit: IntentInspector | ✅ FOUND | `src/components/__tests__/IntentInspector.test.tsx` |
| §4.2 - Dev 2 | Jest Unit: ChatInterface | ✅ FOUND | `src/app/student/courses/[courseId]/_components/__tests__/chat-panel.test.tsx` |
| §4.2 - Dev 2 | Mocks for backend | ✅ FOUND | Jest mocks in both test files |
| §4.2 - Dev 2 | Debug visualizer page | ✅ FOUND | `/debug/ist-visualizer` |
| §4.2 - Dev 2 | `components.md` | ✅ FOUND | `docs/components.md` |
| §4.1 - Dev 1 | Pytest for IST API | ✅ FOUND | `dspy_service/tests/test_ist_api.py` |
| §4.1 - Dev 1 | Test status 200 | ✅ FOUND | `test_health_check_returns_200`, `test_ist_api_valid_request_returns_200` |
| §4.1 - Dev 1 | Test JSON structure | ✅ FOUND | Multiple structure validation tests |
| §4.1 - Dev 1 | Tests are stateless | ✅ FOUND | `TestIstApiStatelessness` class |
| §4.1 - Dev 1 | Health endpoint | ✅ FOUND | Both Next.js and FastAPI |
| §4.3 - Dev 3 | Data Connect test script | ✅ FOUND | `scripts/test-dataconnect.ts` |

### Missing Tests

**NONE** - All PRD testing requirements have been implemented.

---

## 📝 Notes for Reviewers

1. **E2E tests require all services running**: Emulators, DSPy, Next.js
2. **Rate limiting**: E2E tests include `waitForRateLimit()` for Gemini Free Tier (15 RPM)
3. **Test isolation**: Each test resets Firestore state via `resetFirestoreEmulator()`
4. **Mock authentication**: Uses `/api/test-token` for programmatic auth in E2E
5. **Parallelism disabled**: Playwright configured with `workers: 1` for emulator stability

---

*Report generated by Developer 2 - Frontend QA & Test Verification Specialist*

