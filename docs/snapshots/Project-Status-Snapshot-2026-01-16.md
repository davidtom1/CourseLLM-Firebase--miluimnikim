# Project Status Snapshot - Data Connect Pipeline Fix

**Date:** January 16, 2026

---

## Key Achievement

Successfully repaired the **broken IST Data Connect pipeline**, achieving full End-to-End functionality in the Firebase Emulator environment. The system now correctly writes IST (Intent-Skill-Trajectory) events from Cloud Functions to the PostgreSQL emulator and reads them in the Frontend Viewer.

---

## Session Goal

Fix the IST Data Connect pipeline which was experiencing multiple cascading failures:
- Frontend crashes when attempting to read IST events
- Backend writes silently failing or going to production instead of emulator
- Data inconsistency between write and read paths due to user ID mismatches

---

## Problems Encountered & Solutions

### 1. Frontend Crash: `TypeError: Cannot read properties of undefined (reading 'host')`

**Root Cause:** The `initializeApp()` call in `istEventsWebClient.ts` only provided `projectId`, which was insufficient for the Firebase Data Connect SDK v11 internal checks. The SDK requires a fuller configuration object.

**Solution:**
- Added `apiKey` and `authDomain` to the initialization config
- Used a **named Firebase app** (`dataconnect-client`) to avoid conflicts with other Firebase initializations in the Next.js app
- Applied the same pattern to `extractIST.ts` with its own named app (`ist-dataconnect`)

```typescript
// Before (broken)
initializeApp({ projectId: "coursewise-f2421" });

// After (fixed)
initializeApp({
  projectId: "coursewise-f2421",
  apiKey: "demo-api-key",
  authDomain: "coursewise-f2421.firebaseapp.com",
}, "dataconnect-client");
```

### 2. Backend 404: `Resource not found` Errors

**Root Cause:** Cloud Functions were not detecting the emulator environment correctly. The `getDataConnect()` call was silently defaulting to production endpoints, which returned 404 because the Data Connect service doesn't exist in production.

**Solution:**
- Updated `functions/src/dataconnect/istEventsClient.ts` to use a **named Firebase app** (`functions-dataconnect`)
- Explicitly passed the `app` instance to `getDataConnect(app, connectorConfig)`
- Added robust emulator detection: `FUNCTIONS_EMULATOR === 'true' || !!FIREBASE_AUTH_EMULATOR_HOST`

### 3. Network Issues: `localhost` vs `127.0.0.1`

**Root Cause:** Node.js 18+ has changes in DNS resolution that can cause issues with `localhost`. Additionally, SSL handshake failures occurred in the emulator environment.

**Solution:**
- Changed all `connectDataConnectEmulator()` calls to use `127.0.0.1` instead of `localhost`
- Added `sslEnabled: false` parameter to disable SSL for local development

```typescript
// Before (problematic)
connectDataConnectEmulator(dc, 'localhost', 9400);

// After (fixed)
connectDataConnectEmulator(dc, '127.0.0.1', 9400, false);
```

### 4. Data Consistency: "Identity Crisis"

**Root Cause:** The Frontend Viewer queried for `demo-user-1`, but the Backend saved IST events under the real Firebase Auth UID (a random string like `GaWLOzD7dggBxBgAzS3IDML609pP`). This caused the viewer to show "No IST events found" even though data existed.

**Solution:**
Implemented **Demo Identity Override** in `functions/src/analyzeMessage.ts`:

```typescript
// Demo Identity Override - use demo-user-1 for demo contexts
const isDemoContext = data.threadId?.startsWith('demo-') || data.courseId?.includes('demo');
const uid = isDemoContext
  ? 'demo-user-1'
  : (request.auth?.uid ?? (isEmulator ? 'demo-user-1' : undefined));
```

### 5. TypeScript Build Error: `App` vs `FirebaseApp`

**Root Cause:** The Firebase Client SDK exports the type as `FirebaseApp`, not `App`.

**Solution:** Updated import in `functions/src/dataconnect/istEventsClient.ts`:

```typescript
// Before
import { initializeApp, getApps, App } from 'firebase/app';

// After
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
```

### 6. Firestore Security Rules

**Root Cause:** Missing rules for `users/{userId}` and `threads/{threadId}` collections caused `PERMISSION_DENIED` errors during login and chat flows.

**Solution:** Added precise security rules to `firestore.rules`:

```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

match /threads/{threadId} {
  allow read, write: if request.auth != null && 
    (resource.data.userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
  
  match /analysis/{analysisId} {
    allow read, write: if request.auth != null;
  }
}
```

---

## Files Modified

### Frontend (Next.js App)

| File | Change |
|------|--------|
| `src/shared/lib/dataConnect/istEventsWebClient.ts` | Named app, fuller config, emulator fixes |
| `src/features/ist/extraction/extractIST.ts` | Named app, proper DC initialization |
| `src/features/firebase.ts` | Updated fallback project ID to `coursewise-f2421` |
| `src/shared/firebase/client.ts` | Updated fallback project ID to `coursewise-f2421` |
| `src/app/api/analyze-message/route.ts` | Added Firebase import for DC SDK |
| `firestore.rules` | Added `users` and `threads` collection rules |

### Backend (Cloud Functions)

| File | Change |
|------|--------|
| `functions/src/dataconnect/istEventsClient.ts` | Named app, explicit app passing, emulator fixes, cleanup |
| `functions/src/analyzeMessage.ts` | Demo identity override logic |

---

## Current System Status (Verified ✅)

### Data Flow (End-to-End Working)

```
Student Chat Input
       ↓
Next.js API Route (/student/courses/[courseId])
       ↓
DSPy Python Service (IST Extraction)
       ↓
Cloud Function (analyzeMessage)
       ↓
Data Connect Emulator (PostgreSQL)
       ↓
Frontend Viewer (/ist-dev/dataconnect) ✅
```

### Component Status

| Component | Status |
|-----------|--------|
| Student Chat UI | ✅ Working |
| DSPy IST Extraction | ✅ Working |
| Cloud Functions (analyzeMessage) | ✅ Writing to Emulator |
| Data Connect Emulator (Postgres) | ✅ Receiving Mutations |
| Frontend IST Viewer | ✅ Displaying Events |
| Teacher IST Report | ✅ Loading Data |
| Firestore Security Rules | ✅ Allowing Auth Users |

### Emulator Ports

| Service | Port |
|---------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Data Connect | 9400 |
| Emulator UI | 4000 |
| Next.js Dev | 9002 |
| DSPy Service | 8000 |

---

## Diagnostic Tools Created

A diagnostic script was created during debugging and can be retained for future troubleshooting:

- **`scripts/scan-ist-data.ts`** - Probes the Data Connect emulator directly to verify data existence
  - Run with: `npx tsx scripts/scan-ist-data.ts`

---

## Lessons Learned

1. **Named Firebase Apps:** When multiple Firebase SDKs are in use (Auth, Firestore, Data Connect), use named apps to avoid initialization conflicts.

2. **Emulator Network Config:** Always use `127.0.0.1` instead of `localhost` for emulator connections in Node.js 18+, and disable SSL.

3. **Demo Mode Consistency:** When running demo flows, ensure all services (Frontend and Backend) use the same user identity.

4. **Generated SDK Quirks:** The Data Connect generated SDK has specific expectations about config property names (`service` vs `serviceId`) - always pass the raw `connectorConfig` from the generated SDK.

5. **Fuller App Config:** Even for emulator use, provide `apiKey` and `authDomain` in `initializeApp()` to satisfy SDK internal checks.

---

## Next Steps

1. **Git Commit:** Commit all fixes with a descriptive message
2. **Production Testing:** Test deployment to Google Cloud (Data Connect service creation)
3. **API Key Rotation:** Rotate the leaked `GEMINI_API_KEY` (Google revoked it)
4. **Remove Diagnostic Script:** Optionally remove `scripts/scan-ist-data.ts` after confirming stability

---

## Notes

- All verbose debug logging has been cleaned up from production code
- The codebase maintains the DDD architecture established in the previous snapshot
- Emulator-specific code paths are clearly marked and conditional

---

**Status:** ✅ **Data Connect Pipeline Fixed - Emulator Environment Fully Functional**


