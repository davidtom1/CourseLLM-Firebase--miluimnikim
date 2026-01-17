# Chat Feature - Specification

## Feature Overview

The Chat feature provides a **Socratic tutoring experience** for students within course contexts. Students can ask questions about course material and receive AI-guided responses that encourage critical thinking rather than direct answers.

---

## User Stories

### US-CHAT-001: Student Asks Course Question
**As a** student
**I want to** ask questions about course material
**So that** I can understand concepts through guided discovery

**Acceptance Criteria**:
- Student can type questions in chat panel
- System responds within 5 seconds
- Response uses Socratic method (questions, hints, not direct answers)
- Chat history persists during session

### US-CHAT-002: Real-Time IST Analysis Display
**As a** student
**I want to** see what skills my question relates to
**So that** I understand my learning trajectory

**Acceptance Criteria**:
- IntentInspector shows intent, skills, trajectory
- Updates automatically when analysis completes
- Shows loading state while processing

### US-CHAT-003: Context-Aware Responses
**As a** student
**I want to** receive responses that consider the course material
**So that** guidance is relevant to my specific course

**Acceptance Criteria**:
- AI response incorporates course material context
- Learning objectives influence response framing
- Course-specific terminology is used appropriately

---

## Functional Requirements

### FR-CHAT-001: Message Submission
- System SHALL accept text input from authenticated users
- System SHALL generate unique threadId and messageId for each conversation/message
- System SHALL prevent empty message submission

### FR-CHAT-002: AI Response Generation
- System SHALL use Gemini 2.5 Flash model via Genkit
- System SHALL apply Socratic prompting methodology
- System SHALL include course material in context window
- System SHALL return response within 10 seconds (timeout)

### FR-CHAT-003: IST Analysis Integration
- System SHALL trigger IST extraction asynchronously (fire-and-forget)
- System SHALL NOT block chat response on IST completion
- System SHALL store IST results in Firestore for real-time UI

### FR-CHAT-004: Chat State Management
- System SHALL maintain message history in component state
- System SHALL display user and bot messages with visual distinction
- System SHALL auto-scroll to latest message

---

## Non-Functional Requirements

### NFR-CHAT-001: Performance
- Chat response latency: < 5 seconds (P95)
- IST analysis latency: < 10 seconds (background)
- UI remains responsive during processing

### NFR-CHAT-002: Reliability
- IST failures SHALL NOT affect chat functionality
- AI service errors SHALL display user-friendly message
- Network interruptions SHALL preserve local message state

### NFR-CHAT-003: Scalability
- Support concurrent users per course instance
- Stateless backend design for horizontal scaling

---

## API Contracts

### Chat Submission (Server Action)

**Function**: `socraticCourseChat()`

**Request**:
```typescript
{
  courseMaterial: string;      // Course content for context
  studentQuestion: string;     // User's message
  threadId: string;           // Conversation identifier
}
```

**Response**:
```typescript
{
  response: string;           // Socratic tutoring response
}
```

### IST Analysis (Fire-and-Forget)

**Function**: `analyzeAndStoreIstForMessage()`

**Request**:
```typescript
{
  message: string;            // Student's question
  threadId: string;           // Conversation identifier
  messageId: string;          // Message identifier
  userId: string;             // Authenticated user ID
  courseId: string;           // Course identifier
}
```

**Response**: `Promise<void>` (fire-and-forget)

### API Route: Analyze Message

**Endpoint**: `POST /api/analyze-message`

**Request Body**:
```typescript
{
  message: string;
  threadId?: string;
  messageId?: string;
  userId?: string;
  courseId?: string;
}
```

**Response**:
```typescript
{
  intent: {
    labels: string[];
    primary: string;
    confidence: number;
  };
  skills: {
    items: Array<{
      id: string;
      displayName: string;
      confidence: number;
      role: 'FOCUS' | 'SECONDARY';
    }>;
  };
  trajectory: {
    currentNodes: string[];
    suggestedNextNodes: string[];
    status: 'ON_TRACK' | 'NEEDS_REVIEW' | 'ADVANCED';
  };
  metadata: {
    processedAt: string;
    modelVersion: string;
    threadId?: string;
    messageId?: string;
    uid?: string;
  };
}
```

---

## Integration Specs

### 1. Genkit/Gemini Integration

**Purpose**: Generate Socratic tutoring responses.

**Configuration**:
```typescript
// src/features/ai/config/genkit.ts
const ai = genkit({
  plugins: [googleGenAi({ apiKey: process.env.GOOGLE_API_KEY })],
  model: googleGenAi.model('gemini-2.5-flash'),
});
```

**Flow**:
```
ChatPanel → socraticCourseChat() → Genkit Flow → Gemini API → Response
```

### 2. IST Feature Integration

**Purpose**: Extract learning insights from student questions.

**Trigger Point**: `ChatPanel.handleChatSubmit()` calls `analyzeAndStoreIstForMessage()` without awaiting.

**Data Flow**:
```
ChatPanel → analyzeAndStoreIstForMessage() → IstAnalysisEngine
         → extractAndStoreIST() → DSPy Service
         → FirestoreIstAnalysisRepository → threads/{threadId}/analysis/{messageId}
```

### 3. Firestore Integration

**Purpose**: Real-time IST display in IntentInspector.

**Document Path**: `threads/{threadId}/analysis/{messageId}`

**Subscription Pattern**:
```typescript
// IntentInspector.tsx
onSnapshot(doc(db, 'threads', threadId, 'analysis', messageId), (snapshot) => {
  setAnalysis(snapshot.data() as MessageAnalysis);
});
```

### 4. Course Materials Integration

**Purpose**: Provide context for AI responses.

**Data Source**: Course material loaded from course detail page.

**Context Injection**:
```typescript
socraticCourseChat({
  courseMaterial: course.material,  // From course page
  studentQuestion: userMessage,
  threadId: currentThreadId
});
```

### 5. Authentication Integration

**Purpose**: Identify user for IST storage.

**User Context**:
```typescript
// From Firebase Auth
const userId = auth.currentUser?.uid;
analyzeAndStoreIstForMessage({ userId, ... });
```

---

## UI Components

### ChatPanel (`src/app/student/courses/[courseId]/_components/chat-panel.tsx`)

**Props**:
```typescript
{
  courseId: string;
  courseMaterial: string;
}
```

**State**:
- `messages: Array<{role: 'user'|'bot', content: string}>`
- `isPending: boolean` (via useTransition)
- `threadId: string`

**Key Features**:
- Form submission with validation
- Loading indicator during response
- Auto-scroll to latest message
- Avatar distinction for user/bot

### IntentInspector (`src/components/IntentInspector.tsx`)

**Props**:
```typescript
{
  threadId: string;
  messageId: string;
}
```

**Displays**:
- Primary intent with confidence
- Skills with role indicators (FOCUS/SECONDARY)
- Trajectory status and suggestions
- Processing metadata

---

## Environment Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `GOOGLE_API_KEY` | Gemini API authentication | Required |
| `DSPY_SERVICE_URL` | Python IST service | `http://localhost:8000` |
| `NEXT_PUBLIC_IST_ENGINE_MODE` | 'api' or 'callable' | 'api' |
| `NEXT_PUBLIC_FIREBASE_USE_EMULATOR` | Enable emulators | 'true' (dev) |
