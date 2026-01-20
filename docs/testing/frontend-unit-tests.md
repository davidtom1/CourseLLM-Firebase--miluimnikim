# Frontend Unit Tests (Jest)

Unit tests for React components and TypeScript utilities using Jest and React Testing Library.

---

## 1. Setup Instructions

### Required Services

Frontend unit tests run in isolation with mocked Firebase dependencies. **No running services required.**

### Prerequisites

Ensure dependencies are installed:

```bash
pnpm install
```

### Test Configuration

Tests are configured via:
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global mocks and setup

The Jest setup includes:
- `@testing-library/jest-dom` for DOM assertions
- Mocked `ResizeObserver` and `PointerCapture` for Radix UI
- Suppressed `act()` warnings for async components

---

## 2. Run the Automated Tests

### Linux / macOS

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- src/components/__tests__/IntentInspector.test.tsx

# Run tests with coverage
npm run test -- --coverage
```

### Windows (PowerShell)

```powershell
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- src/components/__tests__/IntentInspector.test.tsx

# Run with verbose output
npm run test -- --verbose
```

### Expected Success Output

```
PASS  src/components/__tests__/IntentInspector.test.tsx
  IntentInspector
    Loading State
      ✓ renders loading state initially (45 ms)
    Error State
      ✓ renders error state when Firestore returns an error (23 ms)
      ✓ renders error state when threadId is missing (12 ms)
      ✓ renders error state when messageId is missing (10 ms)
    Empty State
      ✓ renders empty state when document does not exist (18 ms)
    Success State
      ✓ renders analysis data when document exists (156 ms)
      ✓ renders skill roles correctly (42 ms)
      ✓ renders suggested next nodes (38 ms)
      ✓ renders metadata section (35 ms)
    Cleanup
      ✓ unsubscribes from Firestore on unmount (8 ms)

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

---

## 3. What These Tests Check (and What Passing Means)

### IntentInspector Component (`src/components/__tests__/IntentInspector.test.tsx`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| Loading state | Shows "Loading analysis..." while fetching | Component handles async loading correctly |
| Error state (Firestore error) | Displays error message on Firestore failure | Error boundary works for backend failures |
| Error state (missing IDs) | Shows error when threadId/messageId missing | Input validation prevents invalid renders |
| Empty state | Shows "No analysis available" when doc missing | Graceful handling of missing data |
| Success state | Renders intent, skills, trajectory correctly | IST data displays properly |
| Skill roles | Shows FOCUS/SECONDARY role badges | Skill categorization renders |
| Suggested next nodes | Displays trajectory recommendations | Learning path UI works |
| Metadata section | Shows model version, thread/message IDs | Debug info available |
| Cleanup | Unsubscribes from Firestore on unmount | No memory leaks |

### Chat Panel Component (`src/app/student/courses/[courseId]/_components/__tests__/chat-panel.test.tsx`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| Message rendering | User and bot messages display correctly | Chat UI works |
| Input handling | Text input and submit work | User can send messages |
| Loading states | Shows loading indicators during AI response | UX feedback during processing |

### Teacher IST Report Analytics (`src/features/ist/reports/__tests__/teacherIstReport.test.ts`)

| Test | What It Verifies | Passing Means |
|------|------------------|---------------|
| `normalizeSkill()` | Trims, lowercases, handles edge cases | Skill normalization is consistent |
| Core metrics | Calculates totalEvents, eventsWithSkills, etc. | Basic counting is accurate |
| Coverage metrics | Computes top1Share, top5Share, top10Share | Distribution analysis works |
| Trends | Calculates last7 vs prev7 days windows | Time-based comparisons work |
| Rising/declining skills | Identifies skill frequency changes | Trend detection is accurate |

---

## 4. Manual Verification

### Verifying IntentInspector UI

1. **Login as student** in the running application
2. **Navigate to**: `http://localhost:9002/student/courses/cs-demo-101`
3. **Send a message** in the Socratic chat
4. **Observe**: Intent Inspector panel appears below chat
5. **Verify**:
   - "Intent Inspector" heading visible
   - Primary Intent displayed with confidence score
   - Skills list with role badges (FOCUS, SECONDARY)
   - Trajectory section with suggested next steps
   - Metadata section with timestamps

### Verifying Analytics Calculations

1. **Login as teacher**
2. **Navigate to**: `http://localhost:9002/teacher/courses/cs-demo-101?view=ist-report`
3. **Click**: "Generate IST Class Report"
4. **Compare**: UI values against expected calculations:
   - Total events count
   - Unique skills count
   - Top skill and its share percentage
   - 7-day trend comparisons

---

## Test Files Reference

| File | Purpose |
|------|---------|
| `src/components/__tests__/IntentInspector.test.tsx` | Intent Inspector component tests |
| `src/app/student/courses/[courseId]/_components/__tests__/chat-panel.test.tsx` | Chat panel component tests |
| `src/features/ist/reports/__tests__/teacherIstReport.test.ts` | Analytics calculation tests |
| `jest.config.js` | Jest configuration |
| `jest.setup.js` | Global test setup and mocks |

---

## Mocking Strategy

### Firebase Mocking

Tests mock Firebase Firestore using Jest:

```typescript
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock('@/shared/firebase/client', () => ({
  db: { type: 'mock-db' },
}));
```

This allows testing component behavior without running Firebase services.

### Mock Data

Tests use realistic mock data matching the `MessageAnalysis` type:
- Intent labels and confidence scores
- Skills with roles (FOCUS, SECONDARY)
- Trajectory with current and suggested nodes
- Metadata with timestamps and model versions

---

## Troubleshooting

### "Cannot find module" Errors

```bash
pnpm install
```

### Timeout Errors

Increase Jest timeout in test file:

```typescript
jest.setTimeout(10000); // 10 seconds
```

### React Testing Library Warnings

The `jest.setup.js` file suppresses known `act()` warnings. If new warnings appear, wrap async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

---

**Last Updated**: January 2026
