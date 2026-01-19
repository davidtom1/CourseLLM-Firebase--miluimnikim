# 🗺️ Markdown Documentation Navigation Map

**Generated:** 2026-01-19  
**Purpose:** Guide reviewers through project documentation in a logical sequence  
**Total Files:** 49 Markdown files

---

## 🔄 Recommended Navigation Flow

This diagram shows the optimal reading order for a project reviewer:

```
                           ┌────────────────────────────────────┐
                           │         🏠 ENTRY POINT             │
                           │          README.md                 │
                           └───────────────┬────────────────────┘
                                           │
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
        ▼                                  ▼                                  ▼
┌───────────────┐               ┌─────────────────┐               ┌────────────────┐
│ 🚀 QUICK PATH │               │  📖 FULL SETUP  │               │ 📊 PROJECT     │
│ QUICK-START.md│               │    SETUP.md     │               │    STATUS      │
└───────┬───────┘               └────────┬────────┘               │  report.md     │
        │                                │                        └────────┬───────┘
        │                                ▼                                 │
        │                    ┌─────────────────────┐                       │
        │                    │ HOW-TO-RUN.md       │                       │
        │                    │ START-EMULATORS.md  │                       │
        │                    └─────────┬───────────┘                       │
        │                              │                                   │
        └──────────────────────────────┼───────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │       📚 DEEP DIVE DOCUMENTATION     │
                    └──────────────────┬───────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────────┐
        │                              │                                  │
        ▼                              ▼                                  ▼
┌───────────────────┐      ┌─────────────────────┐       ┌────────────────────┐
│ 🏗️ ARCHITECTURE   │      │ 🔐 AUTHENTICATION   │       │ 🎯 OPENSPEC        │
│ docs/00-PROJECT-  │      │ docs/Auth/          │       │ openspec/project.md│
│   BLUEPRINT.md    │      │ auth-implementation │       │ openspec/AGENTS.md │
│ docs/04-DATABASE- │      │ SETUP-COMPLETE.md   │       │ openspec/ist/      │
│   AND-DATA-FLOW.md│      │ EMULATOR-TEST-      │       │ openspec/chat/     │
│ docs/components.md│      │   ACCOUNTS.md       │       │ openspec/analytics/│
└───────────────────┘      └─────────────────────┘       └────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │         🧪 TESTING & QA              │
                    │  dspy_service/TESTING.md             │
                    │  docs/ist-ui-test-plan.md            │
                    └──────────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │       🤝 CONTRIBUTING                │
                    │    CONTRIBUTING.md                   │
                    │    agent.md (for AI assistants)      │
                    └──────────────────────────────────────┘
```

---

## 📁 Documentation Categories

### Category 1: 🏠 Entry Points (Start Here)

| File | For | Summary |
|------|-----|---------|
| `README.md` | Everyone | Project overview, tech stack, links to all docs |
| `QUICK-START.md` | Developers | 4-command TL;DR for running the project |
| `SETUP.md` | Developers | Comprehensive 1000+ line setup guide |

### Category 2: 🚀 Setup & Running

| File | For | Summary |
|------|-----|---------|
| `HOW-TO-RUN.md` | Developers | Step-by-step with expected outputs |
| `START-EMULATORS.md` | Developers | Firebase emulator troubleshooting |
| `docs/EMULATOR-TEST-ACCOUNTS.md` | Testers | Test credentials (student/teacher) |
| `docs/01-LOCAL-SETUP-GUIDE.md` | Developers | Alternative local setup guide |

### Category 3: 🏗️ Architecture & Design

| File | For | Summary |
|------|-----|---------|
| `docs/00-PROJECT-BLUEPRINT.md` | Architects | Core features and style guidelines |
| `docs/04-DATABASE-AND-DATA-FLOW.md` | Backend Devs | Firestore, JSON storage, data flow |
| `docs/components.md` | Frontend Devs | UI component → source file mapping |
| `openspec/project.md` | All Developers | Conventions, patterns, file structure |

### Category 4: 🔐 Authentication

| File | For | Summary |
|------|-----|---------|
| `docs/Auth/auth-implementation.md` | Backend Devs | Complete auth flow implementation |
| `docs/Auth/SETUP-COMPLETE.md` | Developers | How to test auth locally |
| `docs/Auth/Authentication PRD.md` | Product Team | Auth feature requirements |

### Category 5: 🎯 OpenSpec Feature Documentation

| File | For | Summary |
|------|-----|---------|
| `openspec/project.md` | All | Project conventions and patterns |
| `openspec/AGENTS.md` | AI Assistants | How to work with OpenSpec |
| `openspec/ist/spec.md` | Developers | IST feature requirements |
| `openspec/ist/design.md` | Architects | IST architecture diagrams |
| `openspec/ist/plan.md` | PMs | IST roadmap |
| `openspec/ist/proposal.md` | Reviewers | IST feature rationale |
| `openspec/chat/spec.md` | Developers | Chat feature requirements |
| `openspec/chat/design.md` | Architects | Chat architecture |
| `openspec/chat/plan.md` | PMs | Chat roadmap |
| `openspec/analytics/spec.md` | Developers | Analytics requirements |
| `openspec/analytics/design.md` | Architects | Analytics architecture |
| `openspec/analytics/plan.md` | PMs | Analytics roadmap |

### Category 6: 🐍 Python Backend (DSPy Service)

| File | For | Summary |
|------|-----|---------|
| `dspy_service/README.md` | Backend Devs | Setup, API endpoints, LLM config |
| `dspy_service/TESTING.md` | QA | Pytest commands and markers |
| `dspy_service/SETUP_NOTES.md` | Backend Devs | Additional setup notes |

### Category 7: 📊 Status & Reports

| File | For | Summary |
|------|-----|---------|
| `report.md` | Instructor | Developer 3's final report with AI reflection |
| `SUMMARY-DEV3.md` | TA/Reviewer | Task completion checklist |
| `docs/snapshots/Project-Status-Snapshot-2026-01-18_FINAL_SUBMISSION_READY.md` | Instructor | Final submission audit |
| `docs/snapshots/Project-Status-Snapshot-2026-01-17.md` | Team | Historical snapshot |
| `docs/snapshots/Project-Status-Snapshot-2026-01-16.md` | Team | Historical snapshot |
| `docs/snapshots/Project-Status-Snapshot-2026-01-12.md` | Team | Historical snapshot |

### Category 8: 🤝 Contributing & AI Agents

| File | For | Summary |
|------|-----|---------|
| `CONTRIBUTING.md` | Contributors | Code quality, DataConnect policy |
| `agent.md` | AI Assistants | Codebase context for agents |
| `AGENTS.md` | AI Assistants | OpenSpec trigger instructions |
| `CLINE.md` | AI Assistants | Alternative agent instructions |

### Category 9: 📝 PRDs & Planning

| File | For | Summary |
|------|-----|---------|
| `docs/PRDS/PRD-CourseLLM-Final-Delivery-Phase.md` | Team Leads | Final phase work breakdown |
| `docs/07-AI-ASSISTANT-SETUP-GUIDE.md` | AI/Developers | Setting up AI assistants |
| `docs/ist-ui-test-plan.md` | QA | IST UI test scenarios |
| `docs/browser-debug-onboarding.md` | Developers | Browser debugging guide |

### Category 10: 🗄️ Archived (Quarantine)

| File | For | Summary |
|------|-----|---------|
| `_unused_quarantine/docs_archive/blueprint.md` | Reference | Old blueprint |
| `_unused_quarantine/docs_archive/Database-Data-Pipes-Report.md` | Reference | Old data flow doc |
| `_unused_quarantine/docs_archive/IST-Teacher-Report-*.md` | Reference | Old status snapshots |
| `_unused_quarantine/root_clutter/PARTNER_SETUP.md` | Reference | Old partner setup |

---

## 📄 File Details

### 🏠 Entry Points

---

#### 📘 README.md
- **Path:** `/README.md`
- **Lines:** ~78
- **Purpose:** Primary entry point; explains project purpose, technologies, and links to all other documentation.
- **Reviewer Learns:** What CourseLLM is, the tech stack (Next.js, Firebase, Genkit, DSPy), and where to find setup instructions.
- **Links To:** `SETUP.md`, `HOW-TO-RUN.md`, `QUICK-START.md`, `START-EMULATORS.md`, `docs/00-PROJECT-BLUEPRINT.md`, `docs/04-DATABASE-AND-DATA-FLOW.md`, `docs/Auth/`, `openspec/project.md`
- **Audience:** Everyone (first file to read)

---

#### ⚡ QUICK-START.md
- **Path:** `/QUICK-START.md`
- **Lines:** ~140
- **Purpose:** 30-second TL;DR for developers who want to run the project immediately.
- **Reviewer Learns:** The 4-terminal setup commands, test credentials, port assignments.
- **Links To:** `HOW-TO-RUN.md`
- **Audience:** Developers in a hurry

---

#### 📖 SETUP.md
- **Path:** `/SETUP.md`
- **Lines:** ~1080
- **Purpose:** The authoritative, comprehensive setup guide covering all platforms and scenarios.
- **Reviewer Learns:** Prerequisites, OS-specific installation, environment variables, troubleshooting (15+ solutions), verification checklist.
- **Links To:** `README.md`, `HOW-TO-RUN.md`, `START-EMULATORS.md`, `docs/00-PROJECT-BLUEPRINT.md`, `openspec/project.md`
- **Audience:** All developers (primary setup reference)

---

### 🚀 Setup & Running

---

#### 🏃 HOW-TO-RUN.md
- **Path:** `/HOW-TO-RUN.md`
- **Lines:** ~429
- **Purpose:** Step-by-step guide with detailed explanations and expected output for each command.
- **Reviewer Learns:** Terminal-by-terminal setup, what "success" looks like, common issues and solutions.
- **Links To:** `docs/Auth/SETUP-COMPLETE.md`, `docs/EMULATOR-TEST-ACCOUNTS.md`, `docs/Auth/auth-implementation.md`
- **Audience:** Developers who want context, not just commands

---

#### 🔥 START-EMULATORS.md
- **Path:** `/START-EMULATORS.md`
- **Lines:** ~161
- **Purpose:** Firebase emulator troubleshooting when "No emulators to start" error appears.
- **Reviewer Learns:** 6 solutions to emulator issues, how to verify emulators are working.
- **Links To:** None (standalone troubleshooting)
- **Audience:** Developers hitting emulator issues

---

#### 🧪 docs/EMULATOR-TEST-ACCOUNTS.md
- **Path:** `/docs/EMULATOR-TEST-ACCOUNTS.md`
- **Lines:** ~105
- **Purpose:** Documents test credentials and how authentication works with emulators.
- **Reviewer Learns:** Test accounts (`student@test.com`, `teacher@test.com`), seeding process, auth flow.
- **Links To:** None
- **Audience:** Testers, QA engineers

---

### 🏗️ Architecture & Design

---

#### 🎨 docs/00-PROJECT-BLUEPRINT.md
- **Path:** `/docs/00-PROJECT-BLUEPRINT.md`
- **Lines:** ~20 (summary)
- **Purpose:** High-level app vision including core features and style guidelines.
- **Reviewer Learns:** App name (CourseWise), core features, color palette, font choices.
- **Links To:** None
- **Audience:** Designers, product managers

---

#### 🗄️ docs/04-DATABASE-AND-DATA-FLOW.md
- **Path:** `/docs/04-DATABASE-AND-DATA-FLOW.md`
- **Lines:** ~600
- **Purpose:** Complete mapping of data storage systems and IST pipeline data flow.
- **Reviewer Learns:** Firestore collections, JSON storage, repository pattern, environment variables.
- **Links To:** None
- **Audience:** Backend developers, data engineers

---

#### 🧩 docs/components.md
- **Path:** `/docs/components.md`
- **Lines:** ~167
- **Purpose:** Maps UI elements to source code locations for debugging.
- **Reviewer Learns:** Which file renders which UI component, CSS selectors for testing.
- **Links To:** None
- **Audience:** Frontend developers, QA engineers

---

#### 📐 openspec/project.md
- **Path:** `/openspec/project.md`
- **Lines:** ~139
- **Purpose:** Technical project context including conventions, patterns, and constraints.
- **Reviewer Learns:** Code style rules, architecture patterns, file structure, testing strategy.
- **Links To:** None
- **Audience:** All developers

---

### 🔐 Authentication

---

#### 🔑 docs/Auth/auth-implementation.md
- **Path:** `/docs/Auth/auth-implementation.md`
- **Lines:** ~166
- **Purpose:** Complete auth implementation details including file locations and APIs.
- **Reviewer Learns:** Firebase auth flow, React context API, test token route.
- **Links To:** None
- **Audience:** Backend developers

---

#### ✅ docs/Auth/SETUP-COMPLETE.md
- **Path:** `/docs/Auth/SETUP-COMPLETE.md`
- **Lines:** ~181
- **Purpose:** Confirms auth setup is complete and how to test it.
- **Reviewer Learns:** Mock login buttons, expected behavior, troubleshooting.
- **Links To:** None
- **Audience:** QA engineers, testers

---

### 🎯 OpenSpec Documentation

---

#### 📋 openspec/ist/spec.md
- **Path:** `/openspec/ist/spec.md`
- **Lines:** ~140
- **Purpose:** IST feature specification with user stories and requirements.
- **Reviewer Learns:** Intent categories, skill identification, trajectory tracking, API contracts.
- **Links To:** `openspec/ist/design.md`, `openspec/ist/plan.md`
- **Audience:** Product managers, developers

---

#### 💬 openspec/chat/spec.md
- **Path:** `/openspec/chat/spec.md`
- **Lines:** ~298
- **Purpose:** Chat feature specification for Socratic tutoring.
- **Reviewer Learns:** User stories, functional requirements, Genkit integration.
- **Links To:** `openspec/chat/design.md`
- **Audience:** Product managers, developers

---

#### 📊 openspec/analytics/spec.md
- **Path:** `/openspec/analytics/spec.md`
- **Lines:** ~379
- **Purpose:** Analytics feature specification for teacher dashboards.
- **Reviewer Learns:** Report types, aggregation rules, visualization requirements.
- **Links To:** `openspec/analytics/design.md`
- **Audience:** Product managers, developers

---

#### 🤖 openspec/AGENTS.md
- **Path:** `/openspec/AGENTS.md`
- **Lines:** ~457
- **Purpose:** Instructions for AI coding assistants using OpenSpec.
- **Reviewer Learns:** Three-stage workflow, spec file format, CLI commands.
- **Links To:** `openspec/project.md`
- **Audience:** AI assistants (Claude, Cursor, etc.)

---

### 🐍 Python Backend

---

#### 🐍 dspy_service/README.md
- **Path:** `/dspy_service/README.md`
- **Lines:** ~188
- **Purpose:** Setup and usage guide for the Python DSPy microservice.
- **Reviewer Learns:** Virtual env setup, LLM configuration (OpenAI/Gemini), API endpoints.
- **Links To:** None
- **Audience:** Backend developers

---

#### 🧪 dspy_service/TESTING.md
- **Path:** `/dspy_service/TESTING.md`
- **Lines:** ~69
- **Purpose:** How to run pytest tests for the Python service.
- **Reviewer Learns:** Pytest commands, markers, coverage reports.
- **Links To:** None
- **Audience:** QA engineers

---

### 📊 Status & Reports

---

#### 📝 report.md
- **Path:** `/report.md`
- **Lines:** ~352
- **Purpose:** Developer 3's final report documenting AI-assisted development.
- **Reviewer Learns:** What was done, AI prompts that worked, manual interventions needed.
- **Links To:** None
- **Audience:** Instructors, graders

---

#### ✅ docs/snapshots/Project-Status-Snapshot-2026-01-18_FINAL_SUBMISSION_READY.md
- **Path:** `/docs/snapshots/Project-Status-Snapshot-2026-01-18_FINAL_SUBMISSION_READY.md`
- **Lines:** ~271
- **Purpose:** Final submission audit confirming all requirements are met.
- **Reviewer Learns:** Professor's requirements checklist, test results, deliverables.
- **Links To:** Various OpenSpec files
- **Audience:** Instructors, TAs

---

### 🤝 Contributing

---

#### 🤝 CONTRIBUTING.md
- **Path:** `/CONTRIBUTING.md`
- **Lines:** ~128
- **Purpose:** How to contribute code, including DataConnect policy.
- **Reviewer Learns:** Setup steps, code quality requirements, file organization.
- **Links To:** None
- **Audience:** Contributors

---

#### 🤖 agent.md
- **Path:** `/agent.md`
- **Lines:** ~272
- **Purpose:** Context document for AI coding assistants.
- **Reviewer Learns:** Project overview, key files, environment variables, common tasks.
- **Links To:** `openspec/` files
- **Audience:** AI assistants

---

## 📋 Quick Reference: File Count by Category

| Category | Count | Key Files |
|----------|-------|-----------|
| Entry Points | 3 | README.md, SETUP.md, QUICK-START.md |
| Setup & Running | 4 | HOW-TO-RUN.md, START-EMULATORS.md, etc. |
| Architecture | 4 | Blueprint, Database, Components, Project |
| Authentication | 3 | auth-implementation.md, SETUP-COMPLETE.md, PRD |
| OpenSpec | 13 | project.md, AGENTS.md, IST/Chat/Analytics specs |
| Python Backend | 3 | README.md, TESTING.md, SETUP_NOTES.md |
| Status Reports | 5 | report.md, snapshots/* |
| Contributing | 4 | CONTRIBUTING.md, agent.md, AGENTS.md, CLINE.md |
| PRDs & Planning | 4 | PRD-Final-Delivery.md, AI-Setup-Guide.md, etc. |
| Archived | 6 | _unused_quarantine/docs_archive/* |
| **Total** | **49** | |

---

## 🎯 Reviewer Paths

### Path A: "I want to run this project" (5 min)
1. `README.md` → Overview
2. `QUICK-START.md` → Run commands
3. `docs/EMULATOR-TEST-ACCOUNTS.md` → Test credentials

### Path B: "I want to understand the architecture" (30 min)
1. `README.md` → Overview
2. `openspec/project.md` → Conventions
3. `docs/00-PROJECT-BLUEPRINT.md` → Core features
4. `docs/04-DATABASE-AND-DATA-FLOW.md` → Data layer
5. `openspec/ist/design.md` → IST architecture

### Path C: "I want to grade this submission" (45 min)
1. `README.md` → Project overview
2. `docs/snapshots/Project-Status-Snapshot-2026-01-18_FINAL_SUBMISSION_READY.md` → Compliance audit
3. `report.md` → AI reflection report
4. `SETUP.md` → Attempt to run
5. `openspec/ist/spec.md` → Feature documentation quality

### Path D: "I want to contribute code" (15 min)
1. `README.md` → Overview
2. `CONTRIBUTING.md` → Contribution guidelines
3. `agent.md` → Codebase context
4. `openspec/AGENTS.md` → How to propose changes

---

## ✅ Documentation Health Check

| Check | Status |
|-------|--------|
| Entry point exists (README.md) | ✅ |
| Setup instructions complete | ✅ |
| Architecture documented | ✅ |
| Authentication documented | ✅ |
| Features have OpenSpec | ✅ (IST, Chat, Analytics) |
| Python backend documented | ✅ |
| Test instructions exist | ✅ |
| Contributing guide exists | ✅ |
| Final report submitted | ✅ |

---

*This navigation map helps reviewers understand the documentation structure and find relevant files efficiently.*

