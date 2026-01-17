# IST (Intent-Skill-Trajectory) Feature Specification

## Overview

The IST feature extracts learning analytics from student utterances in real-time. When a student asks a question in the Socratic chat, the system analyzes their intent, identifies relevant skills, and tracks their learning trajectory.

## User Stories

### Student Perspective
- As a student, I want my learning progress to be tracked automatically so I can see my growth over time
- As a student, I want personalized guidance based on my identified skill gaps

### Teacher Perspective
- As a teacher, I want to see aggregated class-level insights about student intent patterns
- As a teacher, I want to identify common skill gaps across my course to adjust my teaching
- As a teacher, I want trend analysis showing how student skills evolve over time

## Requirements

### Functional Requirements

1. **Intent Detection**
   - Classify student messages into one of 9 intent categories:
     - ASK_EXPLANATION, ASK_EXAMPLES, CONFIRM_UNDERSTANDING
     - EXPRESS_CONFUSION, ANSWER_QUESTION, REQUEST_SIMPLER
     - REQUEST_DEEPER, COMPARE_CONTRAST, META_LEARNING
   - Provide confidence score (0-1) for the primary intent

2. **Skill Identification**
   - Extract skills/concepts mentioned in the utterance
   - Assign roles: FOCUS (primary topic), SECONDARY, PREREQUISITE
   - Provide confidence score per skill

3. **Trajectory Tracking**
   - Track current learning nodes/topics
   - Suggest next learning steps with priorities
   - Determine status: ON_TRACK, STRUGGLING, TOO_ADVANCED, REVIEW_NEEDED, NEW_TOPIC

4. **Storage & Persistence**
   - Store IST events with full metadata (user, course, thread, message IDs)
   - Support multiple storage backends (JSON file, DataConnect, Firestore)
   - Enable historical context retrieval for enriched analysis

5. **Real-Time Updates**
   - Firestore subscription for live UI updates
   - Non-blocking extraction (chat flow not interrupted)

### Non-Functional Requirements

- **Latency**: IST extraction should complete within 3 seconds
- **Reliability**: Extraction failures must not crash the chat interface
- **Privacy**: Teacher reports show aggregated data only, no individual utterances
- **Scalability**: Repository pattern supports swappable backends

## API Contract

### Input (AnalyzeMessageRequest)
```typescript
{
  threadId: string;          // Conversation thread ID
  messageText: string;       // Student's message
  messageId?: string;        // Optional message ID
  courseId?: string;         // Optional course context
  language?: string;         // Language code (default: 'en')
  maxHistoryMessages?: number; // History context limit
}
```

### Output (MessageAnalysis)
```typescript
{
  intent: {
    labels: IntentLabel[];   // All applicable intents
    primary: IntentLabel;    // Most likely intent
    confidence: number;      // 0-1 confidence score
  };
  skills: {
    items: Array<{
      id: string;
      displayName?: string;
      confidence: number;
      role?: "FOCUS" | "SECONDARY" | "PREREQUISITE";
    }>;
  };
  trajectory: {
    currentNodes: string[];
    suggestedNextNodes: Array<{
      id: string;
      reason?: string;
      priority?: number;
    }>;
    status: TrajectoryStatus;
  };
  metadata: {
    processedAt: string;     // ISO timestamp
    modelVersion: string;
    threadId: string;
    messageId?: string;
    uid: string;
  };
}
```

---

## Integration Specs

### How IST Integrates with Other System Components

1. **Socratic Chat Integration**
   - **Trigger**: Every student message in `ChatPanel` triggers IST extraction
   - **Method**: `analyzeAndStoreIstForMessage()` called as fire-and-forget
   - **Data Flow**: ChatPanel → chatIst.ts → extractIST.ts → DSPy Service
   - **Non-Blocking**: Chat response returns independently of IST completion

2. **DSPy Service Integration**
   - **Endpoint**: `POST {DSPY_SERVICE_URL}/api/intent-skill-trajectory`
   - **Payload**: Utterance + course context + chat history + IST history + student profile
   - **Response**: Raw IST extraction result (intent, skills, trajectory)

3. **Firebase DataConnect Integration**
   - **Write**: `CreateIstEvent` mutation stores new IST events
   - **Read**: `IstEventsByUserAndCourse` query retrieves history for context enrichment
   - **Emulator Support**: Auto-connects to 127.0.0.1:9400 in development

4. **Firestore Integration**
   - **Path**: `threads/{threadId}/analysis/{messageId}`
   - **Purpose**: Real-time UI updates via `onSnapshot()` subscription
   - **Consumer**: `IntentInspector` component displays live analysis

5. **Teacher Analytics Integration**
   - **Data Source**: IST events aggregated from JSON mock or DataConnect
   - **Consumer**: `TeacherClassIstReport` component for class-level insights
   - **Privacy**: Aggregates only, no individual student data exposed

6. **Context Enrichment Flow**
   - `istContextService` loads recent events from repositories
   - Historical IST events passed to DSPy for better accuracy
   - Chat history included for conversational context
