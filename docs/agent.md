# Agent Documentation - CourseLLM Firebase

This document provides context for AI agents working with this codebase.

## Project Overview

CourseLLM is an educational platform that uses AI to provide Socratic tutoring to students. It extracts Intent-Skill-Trajectory (IST) data from student interactions to help teachers understand learning patterns.

**Tech Stack**:
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **AI**: Genkit with Gemini 2.5 Flash, DSPy (Python service)
- **Database**: Firebase Firestore, Firebase DataConnect
- **Functions**: Firebase Cloud Functions v2
- **Styling**: Tailwind CSS, shadcn/ui components

**Related Documentation**:
- [Setup Guide](./setup.md) - Development environment setup
- [Architecture](./architecture.md) - System design overview
- [Database](./database.md) - Data flow and schema

---

## Data Connect Policy

**CRITICAL: Generated files must NOT be committed to Git.**

### Generated Directories (All .gitignored)

```
src/dataconnect-generated/      # Client SDK
src/dataconnect-admin-generated/ # Admin SDK
dataconnect/.dataconnect/       # Build artifacts
```

### How to Regenerate SDK

After cloning or when schema changes:

```bash
npm install                     # Runs postinstall automatically
# OR
npm run dataconnect:generate    # Manual regeneration
```

### Schema Location

The source of truth for DataConnect schema:

```
dataconnect/
├── schema/                     # GraphQL schema definitions
│   └── schema.gql             # Main schema
└── connector/                  # Query/mutation definitions
    └── connector.gql          # Operations
```

### Why This Policy?

1. Generated code is environment-specific
2. Prevents merge conflicts
3. Reducible from schema (don't commit what you can generate)
4. Different emulator vs production configurations

### Testing DataConnect

1. Start emulators: `firebase emulators:start`
2. Navigate to: `http://localhost:9002/ist-dev/dataconnect`
3. Use test page to verify queries work

---

## Code Quality Requirements

Before committing changes:

```bash
npm run typecheck    # Must pass with 0 errors
npm run lint         # Must pass with 0 errors (warnings OK)
```

### TypeScript Guidelines

- Use `unknown` instead of `any` for external data
- Use type assertions with validation
- All files must compile without errors

### ESLint Configuration

Ignored paths (see `.eslintignore`):
- `_unused_quarantine/`
- `functions/`
- `src/dataconnect-generated/`
- `src/dataconnect-admin-generated/`

---

## Key Feature Areas

### IST (Intent-Skill-Trajectory)

**Purpose**: Extract learning insights from student messages.

**Key Files**:
- `src/features/ist/extraction/extractIST.ts` - Core extraction logic
- `src/features/ist/api/chatIst.ts` - Chat integration
- `src/features/ist/reports/teacherIstReport.ts` - Analytics

**Pattern**: Fire-and-forget (non-blocking)

### Chat

**Purpose**: Socratic tutoring for students.

**Key Files**:
- `src/app/student/courses/[courseId]/_components/chat-panel.tsx` - UI
- `src/features/ai/flows/socratic-course-chat.ts` - AI flow
- `src/components/IntentInspector.tsx` - Real-time IST display

**Pattern**: Genkit server action with Gemini 2.5 Flash

### Analytics

**Purpose**: Teacher dashboards and reports.

**Key Files**:
- `src/features/ist/reports/teacherIstReport.ts` - Report computation
- `src/app/teacher/courses/[courseId]/_components/TeacherClassIstReport.tsx` - UI
- `src/components/teacher/AnalyticsChart.tsx` - Visualizations

**Pattern**: Pure computation from IST events

---

## Environment Variables

### Required for Development

```env
# Gemini API
GOOGLE_API_KEY=your-gemini-api-key

# DSPy Service
DSPY_SERVICE_URL=http://localhost:8000

# Firebase Emulators
NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Optional

```env
# IST Configuration
IST_DEMO_MODE=true
IST_STORAGE_MODE=json
NEXT_PUBLIC_IST_ENGINE_MODE=api
```

See [Setup Guide - Environment Configuration](./setup.md#environment-configuration) for complete details.

---

## Running the Application

### Quick Start

```bash
# Clone and setup
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase
cp .env.example .env.local   # Add your API key

# Run automated setup
./scripts/start-servers.sh   # Linux/macOS
.\scripts\start-servers.bat  # Windows
```

### Manual Setup (4 Terminals)

```bash
# Terminal 1: Firebase Emulators
firebase emulators:start

# Terminal 2: Seed Test Users
node scripts/seed-test-users.js

# Terminal 3: DSPy Service
cd dspy_service && python -m uvicorn app:app --reload --port 8000

# Terminal 4: Next.js Dev Server
npm run dev
```

### Access Points

| Service | URL |
|---------|-----|
| App | http://localhost:9002 |
| Emulator UI | http://localhost:4000 |
| DSPy API Docs | http://localhost:8000/docs |

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | `student@test.com` | `password123` |
| Teacher | `teacher@test.com` | `password123` |

---

## Repository Pattern

The codebase uses repository pattern for storage abstraction:

```typescript
// Interface
interface IstEventRepository {
  save(event: CreateIstEventInput): Promise<IstEvent>;
  findById(id: string): Promise<IstEvent | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<IstEvent[]>;
}

// Implementations
- JsonIstEventRepository      # File-based (development)
- PostgresIstEventRepository  # Stub (future)
- FirestoreIstAnalysisRepository # Real-time UI
```

---

## Common Tasks

### Adding a New IST Query

1. Add query to `dataconnect/connector/connector.gql`
2. Run `npm run dataconnect:generate`
3. Import generated function in your code
4. Test with emulators

### Modifying Chat Behavior

1. Edit prompt in `src/features/ai/flows/socratic-course-chat.ts`
2. Test with dev server
3. Check IST extraction still works

### Adding Analytics Metrics

1. Update `computeTeacherIstClassReportV2()` in `teacherIstReport.ts`
2. Update types in `src/features/ist/types.ts`
3. Update UI in `TeacherClassIstReport.tsx`

---

## Troubleshooting

### DataConnect SDK Import Errors

```
Module not found: @dataconnect/generated
```

**Solution**: Run `npm run dataconnect:generate`

### Firestore Connection Errors

**Cause**: Emulator not running or wrong host.

**Solution**:
1. Start emulators: `firebase emulators:start`
2. Check `FIRESTORE_EMULATOR_HOST` in `.env.local`

### DSPy Service Errors

**Cause**: Python service not running.

**Solution**:
1. Start service: `cd dspy_service && python -m uvicorn app:app --port 8000`
2. Check `DSPY_SERVICE_URL` in `.env.local`

See [Emulator Troubleshooting](./emulators.md) for more solutions.

---

## Testing

### Test Commands

| Test Type | Command |
|-----------|---------|
| E2E (Playwright) | `npm run test:e2e` |
| Frontend Unit (Jest) | `npm run test` |
| Backend (pytest) | `cd dspy_service && pytest` |
| Data Connect | `npx tsx scripts/test-dataconnect.ts` |

### Test Documentation

- [E2E Tests](./testing/e2e-tests.md)
- [Backend Tests](./testing/backend-tests.md)

---

## OpenSpec Documentation

Feature specifications are in `openspec/`:

```
openspec/
├── ist/
│   ├── spec.md      # Requirements
│   ├── design.md    # Architecture
│   └── plan.md      # Roadmap
├── chat/
│   ├── spec.md
│   ├── design.md
│   └── plan.md
└── analytics/
    ├── spec.md
    ├── design.md
    └── plan.md
```
