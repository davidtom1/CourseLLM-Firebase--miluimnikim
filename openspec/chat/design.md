# Chat Feature - Design Document

## Architecture Overview

The Chat feature implements a **layered architecture** with separation between UI, AI orchestration, and storage concerns. It follows a **fire-and-forget pattern** for IST analysis to ensure responsive user experience.

```
┌─────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                         │
│  ChatPanel (chat UI)  │  IntentInspector (real-time IST view)   │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATION LAYER                        │
│  socraticCourseChat()  │  analyzeAndStoreIstForMessage()       │
│  (blocking)             │  (fire-and-forget)                    │
└─────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│         AI LAYER              │ │       IST LAYER               │
│  Genkit Flow                  │ │  IstAnalysisEngine            │
│  Gemini 2.5 Flash            │ │  extractAndStoreIST()         │
│  Socratic Prompting          │ │  DSPy Service                 │
└───────────────────────────────┘ └───────────────────────────────┘
                    │                             │
                    ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│         RESPONSE              │ │       STORAGE                 │
│  Text returned to UI          │ │  Firestore (real-time)        │
│                               │ │  JSON (context)               │
│                               │ │  DataConnect (optional)       │
└───────────────────────────────┘ └───────────────────────────────┘
```

---

## Component Design

### 1. ChatPanel Component

**Location**: `src/app/student/courses/[courseId]/_components/chat-panel.tsx`

**Purpose**: Primary chat interface for students.

**Design Decisions**:
- **useTransition Hook**: Provides `isPending` state without blocking UI
- **Local State for Messages**: Avoids unnecessary server round-trips
- **Generated IDs**: threadId and messageId created client-side for immediate use
- **Fire-and-Forget IST**: Wrapped in `.catch()` for error isolation

**Component Structure**:
```typescript
function ChatPanel({ courseId, courseMaterial }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [threadId] = useState(() => generateThreadId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function handleChatSubmit(formData: FormData) {
    const question = formData.get('question') as string;
    const messageId = generateMessageId();

    // 1. Optimistic UI update
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    // 2. Fire-and-forget IST analysis
    analyzeAndStoreIstForMessage({ ... }).catch(console.error);

    // 3. Get Socratic response (blocking)
    startTransition(async () => {
      const result = await socraticCourseChat({ ... });
      setMessages(prev => [...prev, { role: 'bot', content: result.response }]);
    });
  }

  return (
    <Card>
      <ScrollArea>{/* Messages */}</ScrollArea>
      <form onSubmit={handleChatSubmit}>{/* Input */}</form>
    </Card>
  );
}
```

### 2. Socratic Chat Flow

**Location**: `src/features/ai/flows/socratic-course-chat.ts`

**Purpose**: Generate pedagogically appropriate responses using Gemini.

**Design Decisions**:
- **Server Action**: Marked with `'use server'` for secure execution
- **Context Injection**: Course material included in prompt
- **Compliance Checking**: Stub tool for future content filtering
- **Model Selection**: Gemini 2.5 Flash for speed/cost balance

**Prompt Strategy**:
```typescript
const socraticPrompt = `
You are a Socratic tutor helping students learn through guided discovery.
Instead of giving direct answers, ask clarifying questions and provide hints.

Course Material:
${courseMaterial}

Student Question: ${studentQuestion}

Guide the student toward understanding without revealing the answer directly.
`;
```

### 3. IntentInspector Component

**Location**: `src/components/IntentInspector.tsx`

**Purpose**: Real-time display of IST analysis results.

**Design Decisions**:
- **Firestore onSnapshot**: Real-time updates without polling
- **Graceful Loading**: Shows "Analyzing..." until data arrives
- **Structured Display**: Intent, Skills, Trajectory in cards
- **Confidence Indicators**: Visual feedback on analysis certainty

**Subscription Pattern**:
```typescript
useEffect(() => {
  const docRef = doc(db, 'threads', threadId, 'analysis', messageId);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      setAnalysis(snapshot.data() as MessageAnalysis);
      setLoading(false);
    }
  });
  return () => unsubscribe();
}, [threadId, messageId]);
```

---

## Data Flow Diagrams

### Flow 1: User Sends Message

```
User types question in ChatPanel
          │
          ▼
handleChatSubmit(formData)
          │
          ├─→ Generate messageId
          │
          ├─→ Add user message to state (optimistic update)
          │
          ├─→ analyzeAndStoreIstForMessage() [fire-and-forget]
          │         │
          │         ▼
          │   IstAnalysisEngine.analyzeMessage()
          │         │
          │         ▼
          │   POST /api/analyze-message
          │         │
          │         ▼
          │   extractAndStoreIST() → DSPy Service
          │         │
          │         ▼
          │   Save to Firestore: threads/{threadId}/analysis/{messageId}
          │
          └─→ socraticCourseChat() [blocking]
                    │
                    ▼
              Genkit Flow → Gemini API
                    │
                    ▼
              Return response text
                    │
                    ▼
              Add bot message to state
                    │
                    ▼
              Auto-scroll to bottom
```

### Flow 2: IST Real-Time Update

```
IST extraction completes (background)
          │
          ▼
FirestoreIstAnalysisRepository.save()
          │
          ▼
Firestore document created: threads/{threadId}/analysis/{messageId}
          │
          ▼
IntentInspector onSnapshot() listener fires
          │
          ▼
setAnalysis(snapshot.data())
          │
          ▼
UI re-renders with intent, skills, trajectory
```

---

## State Management

### ChatPanel State

| State | Type | Purpose |
|-------|------|---------|
| `messages` | `Message[]` | Chat history for display |
| `isPending` | `boolean` | Loading indicator during response |
| `threadId` | `string` | Conversation identifier (stable) |

### IntentInspector State

| State | Type | Purpose |
|-------|------|---------|
| `analysis` | `MessageAnalysis | null` | Current IST result |
| `loading` | `boolean` | Initial loading state |

---

## Integration Specs

### 1. Genkit Configuration

**File**: `src/features/ai/config/genkit.ts`

**Setup**:
```typescript
import { genkit } from 'genkit';
import { googleGenAi } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleGenAi({ apiKey: process.env.GOOGLE_API_KEY })],
  model: googleGenAi.model('gemini-2.5-flash'),
});
```

**Integration Point**: `socraticCourseChat()` uses this configuration to call Gemini.

### 2. IST Feature Coupling

**Trigger**: ChatPanel calls `analyzeAndStoreIstForMessage()` after each user message.

**Contract**:
```typescript
// chatIst.ts
export async function analyzeAndStoreIstForMessage(params: {
  message: string;
  threadId: string;
  messageId: string;
  userId: string;
  courseId: string;
}): Promise<void>
```

**Error Handling**: Errors are caught and logged; chat flow continues unaffected.

### 3. Firestore Real-Time System

**Collection Structure**:
```
threads/
  └── {threadId}/
      └── analysis/
          └── {messageId}/
              ├── intent: { labels, primary, confidence }
              ├── skills: { items: [...] }
              ├── trajectory: { currentNodes, suggestedNextNodes, status }
              └── metadata: { processedAt, modelVersion, ... }
```

**Security Rules**: Read/write restricted to authenticated users who own the thread.

### 4. Course Context Integration

**Data Source**: Course material passed from course detail page.

**Flow**:
```
CourseDetailPage → ChatPanel(courseMaterial) → socraticCourseChat(courseMaterial)
```

---

## Error Handling Strategy

### 1. AI Service Errors

- **Timeout**: 10-second limit on Gemini calls
- **Fallback**: Display generic error message to user
- **Logging**: Log error with context for debugging

### 2. IST Extraction Errors

- **Isolation**: Wrapped in `.catch()` - never affects chat
- **Logging**: Console error with full context
- **Recovery**: User can continue chatting; IST may not display

### 3. Firestore Errors

- **Offline Support**: Firestore SDK handles offline gracefully
- **UI State**: IntentInspector shows "Analyzing..." indefinitely if no data
- **No Blocking**: Chat continues regardless of Firestore status

---

## Performance Considerations

### Optimizations Implemented

1. **Fire-and-Forget Pattern**: IST runs in background
2. **useTransition**: Non-blocking UI updates
3. **Optimistic Updates**: User message appears immediately
4. **Local State**: No server round-trips for message history

### Future Optimizations

1. **Message Streaming**: Stream Gemini response for perceived speed
2. **IST Caching**: Cache recent IST results client-side
3. **Prefetching**: Load course material before chat opens
