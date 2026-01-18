# Product Requirements Document: IST (Intent-Skill-Trajectory) Feature

**Version:** 2.0
**Status:** Implemented
**Date:** January 18, 2026
**Product:** CourseLLM - AI-Powered Educational Platform

---

## 1. Executive Summary

The IST (Intent-Skill-Trajectory) feature is a real-time learning analytics system that automatically extracts pedagogical insights from student questions during chat interactions. It identifies student intent, relevant skills/topics, and suggests learning trajectory steps - providing teachers with actionable insights into student understanding patterns at scale.

**Key Value Proposition:** Transform every student question into a learning signal that helps teachers understand class-wide patterns and enables personalized learning recommendations.

---

## 2. Problem Statement

### Current Pain Points

1. **Teacher Blindspot:** In large classes, teachers cannot observe every student interaction or identify struggling students in real-time.

2. **Delayed Feedback:** Traditional assessments (quizzes, exams) provide feedback too late for timely intervention.

3. **Hidden Patterns:** Students often ask questions that reveal misunderstandings, but these signals are lost without systematic analysis.

4. **Scale Challenge:** Manual analysis of student questions is impractical for classes with hundreds of students.

### Target Users

- **Primary:** Teachers who need visibility into student understanding patterns
- **Secondary:** Students who benefit from personalized learning paths
- **Tertiary:** Course designers who need data-driven curriculum improvement insights

---

## 3. Solution Overview

### What IST Does

When a student types a question in the course chat, the IST system automatically:

1. **Classifies Intent:** What is the student trying to accomplish?
   - Examples: "Ask for explanation", "Request examples", "Clarify concept", "Debug code"

2. **Extracts Skills:** What topics/concepts is the student working with?
   - Examples: "recursion", "binary trees", "time complexity"

3. **Suggests Trajectory:** What learning path steps would help this student?
   - Examples: "Review base case concept", "Practice with simple examples first"

### How It Works

```
Student Question → DSPy AI Service → IST Extraction → Storage → Real-time UI
                                           ↓
                              Teacher Analytics Dashboard
```

---

## 4. Functional Requirements

### 4.1 Core Extraction Pipeline

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | System SHALL analyze student messages in real-time (< 2 seconds) | P0 |
| FR-2 | System SHALL extract intent classification with confidence score | P0 |
| FR-3 | System SHALL extract 1-5 relevant skills/topics per message | P0 |
| FR-4 | System SHALL suggest 1-3 trajectory steps when applicable | P1 |
| FR-5 | System SHALL NOT block the chat response while analyzing | P0 |
| FR-6 | System SHALL gracefully degrade if AI service is unavailable | P0 |

### 4.2 Context Enrichment

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7 | System SHALL include recent chat history (last 10 messages) for context | P1 |
| FR-8 | System SHALL include previous IST events for continuity | P1 |
| FR-9 | System SHALL support course-specific context (syllabus, topics) | P2 |

### 4.3 Storage & Persistence

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10 | System SHALL store IST events in Firestore for real-time UI | P0 |
| FR-11 | System SHALL store events in JSON file for development | P1 |
| FR-12 | System SHALL support DataConnect for structured queries | P1 |
| FR-13 | System SHALL maintain event history per user and course | P0 |

### 4.4 Real-Time Visualization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-14 | IntentInspector component SHALL display results below each message | P0 |
| FR-15 | UI SHALL show loading state while analysis is in progress | P1 |
| FR-16 | UI SHALL show error state gracefully without disrupting chat | P1 |

### 4.5 Teacher Analytics

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-17 | System SHALL aggregate skills across all students in a course | P0 |
| FR-18 | System SHALL compute skill frequency percentages | P0 |
| FR-19 | System SHALL detect rising/declining skill trends (7-day windows) | P1 |
| FR-20 | System SHALL identify top skill gaps across the class | P1 |

---

## 5. Technical Architecture

### 5.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  IntentInspector    │  │  TeacherClassIstReport     │  │
│  │  (Real-time UI)     │  │  (Analytics Dashboard)      │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       API LAYER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/analyze-message (Next.js API Route)           │   │
│  │  analyzeAndStoreIstForMessage()                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     ENGINE LAYER                             │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  ApiIstAnalysisEngine│ │  CallableIstAnalysisEngine  │  │
│  │  (Next.js endpoint)  │  │  (Firebase Cloud Function) │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTRACTION LAYER                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  extractAndStoreIST() - Orchestrator                │   │
│  │  istContextService - Context Builder                │   │
│  │  DSPy Python Service - AI Extraction                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                           │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ JSON File     │ │ Firestore      │ │ DataConnect     │  │
│  │ (Development) │ │ (Real-time UI) │ │ (Queries)       │  │
│  └───────────────┘ └────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Key Files

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Extraction Core | `src/features/ist/extraction/extractIST.ts` | Main orchestration logic |
| Context Service | `src/features/ist/context/istContextService.ts` | Builds enriched context |
| Type Definitions | `src/features/ist/types.ts` | IST event and context types |
| Analysis Engine | `src/features/ist/engine/engine.ts` | Engine factory and interfaces |
| JSON Repository | `src/features/ist/repositories/jsonIstEventRepository.ts` | File-based storage |
| Firestore Repository | `src/features/ist/repositories/repository.ts` | Real-time storage |
| Teacher Reports | `src/features/ist/reports/teacherIstReport.ts` | Analytics computation |
| UI Component | `src/components/IntentInspector.tsx` | Real-time result display |
| Chat Integration | `src/features/ist/api/chatIst.ts` | Entry point for chat system |
| DSPy Service | `dspy_service/app.py` | Python AI extraction service |

### 5.3 Data Flow

1. **Student sends message** in ChatPanel
2. **Chat system calls** `analyzeAndStoreIstForMessage()` (fire-and-forget)
3. **Engine selects** appropriate analyzer based on environment mode
4. **Context service builds** enriched context from history
5. **DSPy service extracts** intent, skills, trajectory via AI
6. **Results stored** to JSON (dev), Firestore (real-time), DataConnect (queries)
7. **IntentInspector subscribes** to Firestore and displays results
8. **Teacher dashboard queries** aggregated data for analytics

---

## 6. Data Models

### 6.1 IST Event

```typescript
interface IstEvent {
  id: string;
  userId: string;
  courseId: string;
  messageId: string;
  timestamp: Date;

  intent: {
    label: string;        // e.g., "Ask for explanation"
    confidence: number;   // 0.0 - 1.0
  };

  skills: Array<{
    name: string;         // e.g., "recursion"
    role: string;         // e.g., "primary", "secondary"
    confidence: number;
  }>;

  trajectory: Array<{
    step: string;         // e.g., "Review base case concept"
    status: string;       // e.g., "suggested", "completed"
  }>;

  metadata: {
    modelVersion: string;
    processingTimeMs: number;
  };
}
```

### 6.2 Teacher Report

```typescript
interface TeacherIstClassReport {
  courseId: string;
  dateRange: { start: Date; end: Date };

  topSkills: Array<{
    skill: string;
    count: number;
    percentage: number;
  }>;

  trends: {
    rising: string[];     // Skills increasing in frequency
    declining: string[];  // Skills decreasing in frequency
  };

  coverage: {
    totalStudents: number;
    studentsWithEvents: number;
    totalEvents: number;
  };
}
```

---

## 7. Integration Points

### 7.1 Chat System

- **Entry Point:** ChatPanel component in student course view
- **Pattern:** Fire-and-forget (non-blocking)
- **Location:** `src/app/student/courses/[courseId]/_components/chat-panel.tsx`

### 7.2 AI Flows

- **Socratic Chat:** Calls `extractAndStoreIST()` for each student question
- **Analyze Message:** Maps DSPy results to MessageAnalysis type
- **Framework:** Google Genkit

### 7.3 Firebase Services

- **Auth:** User context for event attribution
- **Firestore:** Real-time UI updates via subscriptions
- **Cloud Functions:** Optional callable engine mode
- **DataConnect:** Structured GraphQL queries

### 7.4 External Services

- **DSPy Python Service:** `POST /api/intent-skill-trajectory`
- **Default Port:** 8000
- **Health Check:** `GET /health`

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Extraction SHALL complete within 2 seconds |
| **Availability** | System SHALL gracefully degrade if DSPy service is down |
| **Scalability** | System SHALL support concurrent extractions |
| **Reliability** | Extraction failures SHALL NOT affect chat functionality |
| **Security** | Events SHALL be attributed to authenticated users only |
| **Observability** | All operations SHALL be logged with `[IST]` prefix |

---

## 9. Testing Strategy

### 9.1 Unit Tests

- `IntentInspector.test.tsx` - Component rendering and state management
- `teacherIstReport.test.ts` - Analytics computation accuracy

### 9.2 E2E Tests

- `chat-context.spec.ts` - Full flow from message to IST display
- Validates extraction, storage, and UI update

### 9.3 Backend Tests

- DSPy service pytest tests for API endpoints
- Response validation and error handling

---

## 10. Environment Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `DSPY_SERVICE_URL` | DSPy service endpoint | `http://localhost:8000` |
| `NEXT_PUBLIC_IST_ENGINE_MODE` | Engine selection (api/callable) | `api` |
| `IST_DEMO_MODE` | Enable demo data for testing | `false` |
| `ENABLE_TEST_AUTH` | Enable test authentication for E2E | `false` |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Extraction Latency | < 2 seconds (p95) |
| Extraction Success Rate | > 95% |
| Teacher Dashboard Load Time | < 3 seconds |
| Skill Classification Accuracy | > 80% (validated sample) |

---

## 12. Development & Deployment

### Running Locally

```bash
# Terminal 1: Start all servers
.\scripts\start-servers.bat   # Windows
./scripts/start-servers.sh    # Linux/Mac

# Terminal 2: Run tests
npx playwright test
```

### Services Started

| Service | Port | URL |
|---------|------|-----|
| Next.js Frontend | 9002 | http://localhost:9002 |
| DSPy Python Service | 8000 | http://localhost:8000 |
| Firebase Auth Emulator | 9099 | http://localhost:9099 |
| Firestore Emulator | 8080 | http://localhost:8080 |
| Functions Emulator | 5001 | http://localhost:5001 |
| Emulator UI | 4000 | http://localhost:4000 |

### Test Accounts

- **Student:** student@test.com / password123
- **Teacher:** teacher@test.com / password123

---

## 13. Future Enhancements (Out of Scope)

1. **Skill Clustering:** Group similar skills automatically
2. **Adaptive Learning:** Use trajectory data to personalize content
3. **Real-time Alerts:** Notify teachers of struggling students
4. **PostgreSQL Backend:** Production-ready persistent storage
5. **Multi-language Support:** Analyze questions in languages other than English

---

## 14. Appendix

### A. OpenSpec Documentation

- `openspec/ist/proposal.md` - Feature justification
- `openspec/ist/design.md` - Architecture details
- `openspec/ist/plan.md` - Implementation roadmap

### B. Related PRDs

- Chat System PRD - Core messaging infrastructure
- Analytics PRD - Teacher dashboard requirements

### C. Glossary

| Term | Definition |
|------|------------|
| **IST** | Intent-Skill-Trajectory - the three components extracted from student messages |
| **Intent** | What the student is trying to accomplish with their question |
| **Skill** | A topic or concept the student is working with |
| **Trajectory** | Suggested next steps in the learning path |
| **DSPy** | Python framework for programmatic prompting of language models |
| **Fire-and-forget** | Pattern where operation continues without waiting for result |
