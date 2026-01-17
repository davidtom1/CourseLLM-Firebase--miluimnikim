# IST Feature - Design Document

## Architecture Overview

The IST feature follows a **layered architecture** with clear separation between extraction, storage, and presentation concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                         │
│  IntentInspector (real-time UI) │ TeacherClassIstReport (analytics)│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  chatIst.ts (analyzeAndStoreIstForMessage)                      │
│  /api/analyze-message (Next.js route)                           │
│  analyzeMessage (Cloud Function)                                │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ENGINE LAYER                               │
│  IstAnalysisEngine (interface)                                  │
│  ├── ApiIstAnalysisEngine (calls Next.js endpoint)              │
│  └── CallableIstAnalysisEngine (calls Cloud Function)           │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTRACTION LAYER                             │
│  extractIST.ts → DSPy Service (Python backend)                  │
│  istContextService.ts (context enrichment)                      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REPOSITORY LAYER                            │
│  IstEventRepository (interface)                                 │
│  ├── JsonIstEventRepository (file-based)                        │
│  ├── PostgresIstEventRepository (stub)                          │
│  └── FirestoreIstAnalysisRepository (real-time)                 │
│  ChatHistoryRepository (interface)                              │
│  └── InMemoryChatHistoryRepository (stub with demo mode)        │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Extraction Pipeline (`src/features/ist/extraction/extractIST.ts`)

**Purpose**: Core function that orchestrates IST extraction from student utterances.

**Design Decisions**:
- **Non-blocking execution**: Uses fire-and-forget pattern to avoid blocking chat
- **Dual storage**: Writes to both JSON file (for context) and DataConnect (for dev tools)
- **Graceful degradation**: Catches all errors, logs them, continues execution

**Key Function**: `extractAndStoreIST(params)`
```typescript
// 1. Build enriched context
const context = await getIstContextForIstExtraction({...});

// 2. Call DSPy service
const response = await fetch(`${DSPY_SERVICE_URL}/api/intent-skill-trajectory`, {...});

// 3. Store to JSON repository (non-blocking)
getIstEventRepository().save(istEvent).catch(console.error);

// 4. Store to DataConnect (non-blocking)
saveToDataConnect(istEvent).catch(console.error);

// 5. Return result
return { intent, skills, trajectory };
```

### 2. Context Service (`src/features/ist/context/istContextService.ts`)

**Purpose**: Builds enriched context for IST extraction by loading historical data.

**Context Components**:
- `recentIstEvents`: Last N IST extractions for this user/course
- `recentChatMessages`: Recent conversation history
- `studentProfile`: Optional profile with strong/weak skills

**Demo Mode**: When `IST_DEMO_MODE=true`, uses hardcoded demo user/course for testing.

### 3. Repository Pattern

**Why Repository Pattern?**
- Enables swappable storage backends without changing business logic
- Supports testing with in-memory implementations
- Prepares for future migration (JSON → PostgreSQL → production DB)

**IstEventRepository Interface**:
```typescript
interface IstEventRepository {
  save(event: CreateIstEventInput): Promise<IstEvent>;
  findById(id: string): Promise<IstEvent | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<IstEvent[]>;
  getRecentEvents(params: GetRecentIstEventsParams): Promise<IstEvent[]>;
}
```

**Implementation: JsonIstEventRepository**
- File location: `src/mocks/ist/events.json`
- Lazy loading with in-memory cache
- Auto-creates directory structure
- Atomic writes with JSON serialization

### 4. Analysis Engine Factory

**Purpose**: Abstracts the choice between API-based and Cloud Function-based analysis.

**Modes**:
- `api`: Uses Next.js `/api/analyze-message` endpoint
- `callable`: Uses Firebase Cloud Function `analyzeMessage`

**Configuration**: `NEXT_PUBLIC_IST_ENGINE_MODE` environment variable

### 5. Teacher Reports (`src/features/ist/reports/teacherIstReport.ts`)

**Purpose**: Computes aggregated analytics for teacher dashboards.

**Key Function**: `computeTeacherIstClassReportV2(events, courseId, options)`

**Algorithm**:
1. Filter events by courseId
2. Normalize skills (lowercase, trim, deduplicate per event)
3. Aggregate frequency counts across all events
4. Compute share percentages
5. Calculate trend deltas (last 7 days vs previous 7 days)
6. Identify rising/declining skills
7. Flag data quality issues

## Data Flow Diagrams

### Flow 1: Student Chat → IST Extraction

```
Student types question in ChatPanel
          │
          ▼
ChatPanel.handleChatSubmit()
          │
          ├──────────────────────────────────────┐
          │                                      │
          ▼                                      ▼
analyzeAndStoreIstForMessage()          socraticCourseChat()
(fire-and-forget)                       (blocking, returns response)
          │
          ▼
getIstAnalysisEngine().analyzeMessage()
          │
          ▼
extractAndStoreIST()
          │
          ├─→ Build IstContext (load history)
          │
          ├─→ Call DSPy service
          │
          ├─→ Save to JsonIstEventRepository
          │
          └─→ Save to DataConnect (optional)
```

### Flow 2: Real-Time UI Update

```
IST extraction completes
          │
          ▼
Save to Firestore: threads/{threadId}/analysis/{messageId}
          │
          ▼
IntentInspector subscribes via onSnapshot()
          │
          ▼
UI updates with intent, skills, trajectory
```

## Error Handling Strategy

1. **DSPy Service Errors**
   - Retry with exponential backoff (not currently implemented)
   - Return empty result on failure
   - Log error for debugging

2. **Storage Errors**
   - Non-fatal: Log and continue
   - Chat flow never blocked by storage failures

3. **Firestore Errors**
   - Handle offline scenarios gracefully
   - UI shows "Analyzing..." state until data arrives

---

## Integration Specs

### System Integration Points

1. **Chat System**
   - Entry point: `ChatPanel` calls `analyzeAndStoreIstForMessage()`
   - Decoupled via async fire-and-forget pattern
   - Chat response independent of IST completion

2. **Firebase Ecosystem**
   - Firestore: Real-time subscriptions for UI
   - DataConnect: Structured storage for dev tools
   - Cloud Functions: Alternative analysis backend

3. **External Services**
   - DSPy Python service (required for extraction)
   - Genkit/Gemini (separate, for chat responses)

4. **Shared Type System**
   - `@/shared/types`: MessageAnalysis, AnalyzeMessageRequest
   - `@/features/ist/types`: IstEvent, IstContext, ChatMessage

5. **Configuration**
   - Environment variables control behavior
   - Demo mode for testing without auth
   - Emulator detection for local development
