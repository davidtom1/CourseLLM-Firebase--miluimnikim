# Data Connect Validation Tests

Validation script for Firebase Data Connect functionality. These tests verify that the Data Connect emulator is properly configured and IST event operations work correctly.

---

## 1. Setup Instructions

### Required Services

| Service | Command | Port |
|---------|---------|------|
| Firebase Emulators | `firebase emulators:start` | DataConnect: 9400 |

**Note:** This script tests Data Connect functionality in isolation. No Next.js or DSPy services are required.

### Prerequisites

1. **Generate Data Connect SDK** (if not already done):

```bash
npm run dataconnect:generate
```

2. **Install dependencies**:

```bash
pnpm install
```

### Required Environment

The script connects to the Data Connect emulator at `127.0.0.1:9400`. Ensure emulators are running before executing.

---

## 2. Run the Automated Test

### Linux / macOS

```bash
# Start Firebase emulators (in one terminal)
firebase emulators:start

# Run validation script (in another terminal)
npx tsx scripts/test-dataconnect.ts
```

### Windows (PowerShell)

```powershell
# Start Firebase emulators (in one terminal)
firebase emulators:start

# Run validation script (in another terminal)
npx tsx scripts/test-dataconnect.ts
```

### Expected Success Output

```
============================================================
Data Connect Validation Tests
============================================================

✓ Connected to Data Connect emulator at 127.0.0.1:9400

Running tests...

✓ PASS: Create IST Event (156ms)
  Created IST event successfully
✓ PASS: Query IST Events (89ms)
  Retrieved 1 event(s)
  Event ID: abc123
  Intent: CLARIFICATION
✓ PASS: Empty Query Returns Empty Array (45ms)
  Empty query returned empty array (correct behavior)
✓ PASS: Multiple Events (234ms)
  Created 2 additional events, total: 3
✓ PASS: JSON Fields (skills, trajectory) (112ms)
  Complex JSON fields stored and retrieved successfully

============================================================
Test Summary
============================================================

Total: 5 tests
Passed: 5
Failed: 0
Duration: 636ms

============================================================
RESULT: ALL TESTS PASSED

Data Connect is working correctly with the emulator.
You can now use IST event queries and mutations.
```

---

## 3. What These Tests Check (and What Passing Means)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| **Create IST Event** | `createIstEvent` mutation works | IST events can be written to Data Connect |
| **Query IST Events** | `istEventsByUserAndCourse` query works | IST history can be retrieved by user and course |
| **Empty Query** | Non-existent user/course returns empty array | Queries handle missing data gracefully |
| **Multiple Events** | Multiple events stored and retrieved | Batch operations work correctly |
| **JSON Fields** | Complex skills/trajectory JSON stored | Data Connect handles nested JSON |

### When All Tests Pass

- Data Connect emulator is properly configured
- IST schema matches expected structure
- Generated SDK is up-to-date
- Read/write operations work for IST events
- The application can safely use Data Connect for IST storage

---

## 4. Manual Verification

### Verify Data Connect Emulator is Running

1. Open Firebase Emulator UI: `http://localhost:4000`
2. Click on "Data Connect" tab
3. Verify the emulator shows as "Running" on port 9400

### Verify IST Events in Emulator

After running the validation script or using the application:

1. **Navigate to**: `http://localhost:9002/ist-dev/dataconnect`
2. **Enter**: `userId = demo-user`, `courseId = cs202`
3. **Click**: "Load IST Events"
4. **Observe**: List of IST events with:
   - `utterance` - The original question
   - `intent` - Extracted learning intent
   - `skills` - Array of identified skills
   - `trajectory` - Recommended next steps
   - `createdAt` - Timestamp

### Direct GraphQL Testing

The Data Connect emulator supports direct GraphQL queries:

```bash
curl -X POST http://localhost:9400/v1beta/projects/coursewise-f2421/locations/us-central1/services/default/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { istEvents { id utterance intent skills } }"}'
```

---

## Test Script Details

**Location:** `scripts/test-dataconnect.ts`

### Test Configuration

```typescript
const TEST_USER_ID = "test-user-" + Date.now();
const TEST_COURSE_ID = "test-course-cs101";
const TEST_THREAD_ID = "test-thread-" + Date.now();
const TEST_MESSAGE_ID = "test-message-" + Date.now();
```

Uses dynamic IDs to ensure test isolation.

### Operations Tested

| Operation | Type | SDK Reference |
|-----------|------|---------------|
| `createIstEvent` | Mutation | `createIstEventRef` |
| `istEventsByUserAndCourse` | Query | `istEventsByUserAndCourseRef` |

### Data Structures Validated

**IST Event Fields:**
- `userId` (string)
- `courseId` (string)
- `threadId` (string)
- `messageId` (string)
- `utterance` (string)
- `intent` (string)
- `skills` (JSON array)
- `trajectory` (JSON array/object)
- `createdAt` (timestamp)

---

## Troubleshooting

### "Failed to initialize Data Connect"

**Cause:** Emulators not running or wrong port

**Solution:**
```bash
# Verify emulators are running
firebase emulators:start

# Check port 9400 is accessible
curl http://localhost:9400/health
```

### "Cannot find module '@dataconnect/generated'"

**Cause:** SDK not generated

**Solution:**
```bash
npm run dataconnect:generate
```

### Tests Pass but App Doesn't Work

**Cause:** Different configuration in app vs. test

**Solution:**
- Verify `NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true` in `.env.local`
- Ensure emulator ports match across configurations
- Check browser console for connection errors

---

## Related Documentation

- [IST UI Test Plan](./testing-ist.md) - Full IST pipeline testing
- [Emulator Troubleshooting](../emulators.md) - Emulator setup issues
- [Data Connect Usage](../../src/dataconnect-generated/.guides/usage.md) - SDK usage guide

---

**Last Updated**: January 2026
