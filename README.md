# CourseLLM (CourseWise)

## Feature Pipeline Explanation

CourseLLM is an AI-powered educational platform that provides personalized learning experiences for university students. The core feature pipeline works as follows:

### End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CourseLLM Feature Pipeline                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. LOGIN                2. CHAT                 3. IST EXTRACTION          │
│  ┌─────────┐            ┌─────────┐             ┌─────────────────┐         │
│  │ Student │ ──────────▶│ Socratic│ ──────────▶ │ DSPy Service    │         │
│  │ /Teacher│            │ Tutor   │             │ (FastAPI)       │         │
│  └─────────┘            └─────────┘             └────────┬────────┘         │
│       │                      │                           │                  │
│       │ Firebase Auth        │ Gemini AI                 │ Intent           │
│       │                      │ Response                  │ Skills           │
│       ▼                      ▼                           │ Trajectory       │
│  ┌─────────┐            ┌─────────┐                      │                  │
│  │ Role    │            │ Chat    │                      ▼                  │
│  │ Guard   │            │ History │             ┌─────────────────┐         │
│  └─────────┘            │ (Firestore)           │ 4. STORAGE      │         │
│       │                 └─────────┘             │                 │         │
│       │                                         │ ┌─────────────┐ │         │
│       ▼                                         │ │Data Connect │ │         │
│  ┌─────────────┐                                │ │(IST Events) │ │         │
│  │ Student or  │                                │ └─────────────┘ │         │
│  │ Teacher     │                                │ ┌─────────────┐ │         │
│  │ Dashboard   │                                │ │ Firestore   │ │         │
│  └─────────────┘                                │ │ (Analysis)  │ │         │
│                                                 │ └─────────────┘ │         │
│                                                 └────────┬────────┘         │
│                                                          │                  │
│                         5. ANALYTICS UI                  │                  │
│                        ┌─────────────────────────────────┘                  │
│                        │                                                    │
│                        ▼                                                    │
│               ┌─────────────────┐                                           │
│               │ Teacher IST     │                                           │
│               │ Class Report    │                                           │
│               │ (Aggregated)    │                                           │
│               └─────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Steps

1. **Login & Authentication**
   - Users authenticate via Firebase Auth (Google OAuth or test accounts)
   - Role-based access control directs students to `/student` and teachers to `/teacher`
   - New users complete onboarding to set their role and profile

2. **Socratic Chat Interaction**
   - Students navigate to course pages and interact with the AI-powered Socratic Tutor
   - Questions are processed by Gemini AI to generate Socratic-style responses
   - Chat history is persisted in Firestore for context retention

3. **IST (Intent-Skill-Trajectory) Extraction**
   - Each student question is analyzed by the DSPy FastAPI service
   - The service extracts:
     - **Intent**: What the student is trying to learn
     - **Skills**: Relevant competencies being developed
     - **Trajectory**: Recommended next learning steps

4. **Data Storage**
   - IST events are stored in Firebase Data Connect (PostgreSQL backend)
   - Chat analysis is stored in Firestore for the Intent Inspector UI
   - All data supports the learning analytics pipeline

5. **Teacher Analytics UI**
   - Teachers access aggregated IST Class Reports
   - Reports show skill distributions, trends, and data quality metrics
   - Privacy-preserving: no individual student data exposed

### Major Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 15, React 18, TypeScript | Student/Teacher dashboards, Chat UI |
| Styling | Tailwind CSS, Radix UI | Consistent, accessible UI |
| Backend | Firebase Cloud Functions | Message analysis orchestration |
| AI Service | FastAPI, DSPy | IST extraction and reasoning |
| AI Models | Gemini 2.5 Flash | Socratic responses and analysis |
| Database | Firestore, Data Connect | Document and relational data |
| Auth | Firebase Authentication | Google OAuth, role management |

---

## Setup

For complete setup instructions including prerequisites, installation, and configuration:

**[See docs/setup.md for the full setup guide](./docs/setup.md)**

The setup guide includes:
- Prerequisites and installation for macOS, Linux, and Windows
- Automated setup scripts for both OS families
- Manual step-by-step instructions
- Environment variable configuration
- Service startup (4 terminals)
- Verification checklist

### Quick Start (Local Development)

> This project runs locally using Firebase emulators. No production credentials required.

```bash
# 1. Clone the repository
git clone https://github.com/LLMs-for-SE-2026-BGU/CourseLLM-Firebase.git
cd CourseLLM-Firebase

# 2. Create environment file and add your Google API key
cp .env.example .env.local

# 3. Run automated setup script
./scripts/start-servers.sh        # Linux/macOS
.\scripts\start-servers.bat       # Windows (PowerShell)

# 4. Open http://localhost:9002 and login with:
#    student@test.com / password123
```

---

## Tests

Comprehensive test documentation for all test types:

### E2E Tests (Playwright)

**[docs/testing/e2e-tests.md](./docs/testing/e2e-tests.md)** - Validates complete user flows including authentication, chat interactions, and teacher analytics.

### Backend Tests (pytest)

**[docs/testing/backend-tests.md](./docs/testing/backend-tests.md)** - Tests the DSPy FastAPI service including health endpoints and IST extraction API.

### IST UI Test Plan (Manual Testing)

**[docs/testing-ist.md](./docs/testing-ist.md)** - Comprehensive manual UI testing guide for the complete IST pipeline with step-by-step scenarios.

### Test Summary Table

| Test Type | Location | Command | What It Tests |
|-----------|----------|---------|---------------|
| E2E (Playwright) | `tests/` | `npm run test:e2e` | Auth flows, student journey, teacher analytics |
| Frontend Unit (Jest) | `src/**/__tests__/` | `npm run test` | React components, utility functions |
| Backend (pytest) | `dspy_service/tests/` | `cd dspy_service && pytest` | IST API, health endpoints |
| Data Connect | `scripts/test-dataconnect.ts` | `npx tsx scripts/test-dataconnect.ts` | IST event storage |
| Manual IST | N/A | See docs | Full pipeline verification |

---

## Documentation

Detailed documentation is available in the [docs/](./docs/) folder:

### Setup & Development

| Document | Purpose |
|----------|---------|
| **[docs/setup.md](./docs/setup.md)** | Complete setup guide (main reference) |
| [docs/emulators.md](./docs/emulators.md) | Firebase emulator troubleshooting |

### Architecture & Design

| Document | Purpose |
|----------|---------|
| [docs/architecture.md](./docs/architecture.md) | System architecture overview |
| [docs/database.md](./docs/database.md) | Database structure and data flow |
| [docs/components.md](./docs/components.md) | UI component documentation |
| [openspec/project.md](./openspec/project.md) | Technical specifications |

### Authentication

| Document | Purpose |
|----------|---------|
| [docs/Auth/auth-implementation.md](./docs/Auth/auth-implementation.md) | Auth implementation details |
| [docs/Auth/auth-prd.md](./docs/Auth/auth-prd.md) | Auth requirements document |

### Testing

| Document | Purpose |
|----------|---------|
| [docs/testing/](./docs/testing/) | Test documentation directory |
| [docs/testing-ist.md](./docs/testing-ist.md) | IST pipeline manual testing |

---

## Tech Stack

- **Frontend**: Next.js 15 with React 18 (TypeScript)
- **Styling**: Tailwind CSS with Radix UI components
- **Backend**: Firebase Cloud Functions, Firebase Admin SDK
- **AI Service**: FastAPI Python micro-services on Google Cloud Run
- **Database**: Firestore (NoSQL), Firebase DataConnect (PostgreSQL)
- **Authentication**: Firebase Authentication (Google OAuth)
- **AI/ML**: Google Genkit with Gemini models, DSPy for reasoning
- **Testing**: Playwright (E2E), Jest (Unit), pytest (Backend)
- **Dev Tools**: TypeScript 5, pnpm, Node.js, uv

More technical details are available in [openspec/project.md](./openspec/project.md)

---

## License

Private educational project - not for redistribution.
