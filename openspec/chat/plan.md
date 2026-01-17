# Chat Feature - Implementation Plan

## Current State Assessment

### Implemented Components
- [x] ChatPanel UI component with message display
- [x] Socratic chat flow with Genkit/Gemini
- [x] Fire-and-forget IST integration
- [x] IntentInspector real-time display
- [x] Basic error handling

### Known Gaps
- [ ] Message persistence across sessions
- [ ] Streaming responses for better UX
- [ ] Compliance checking implementation (stub only)
- [ ] Chat history Firestore integration

---

## Implementation Roadmap

### Phase 1: Core Stability (Current)

**Goal**: Reliable chat experience in development environment.

**Tasks**:
1. Verify Genkit/Gemini connectivity
2. Test IST fire-and-forget pattern
3. Confirm IntentInspector real-time updates
4. Validate course material context injection

**Acceptance Criteria**:
- Student receives Socratic response within 5 seconds
- IST appears in IntentInspector within 10 seconds
- No UI blocking during processing

---

### Phase 2: Message Persistence

**Goal**: Chat history survives page refresh and session changes.

**Tasks**:
1. Design Firestore schema for chat messages
2. Implement ChatHistoryRepository for Firestore
3. Load chat history on component mount
4. Save messages to Firestore (optimistic + server)

**Firestore Schema**:
```
threads/
  └── {threadId}/
      ├── metadata: { userId, courseId, createdAt, lastMessageAt }
      └── messages/
          └── {messageId}/
              ├── role: 'user' | 'bot'
              ├── content: string
              ├── timestamp: Timestamp
              └── userId: string
```

**Acceptance Criteria**:
- Chat history loads on page refresh
- Messages persist across browser sessions
- Thread continues from where user left off

---

### Phase 3: Response Streaming

**Goal**: Improved perceived performance with streaming responses.

**Tasks**:
1. Enable Gemini streaming mode in Genkit
2. Implement streaming API route (Server-Sent Events)
3. Update ChatPanel to render streaming tokens
4. Handle stream interruption gracefully

**Technical Approach**:
```typescript
// Stream response from Gemini
const stream = await ai.generateStream({ prompt });
for await (const chunk of stream) {
  yield chunk.text;
}
```

**Acceptance Criteria**:
- User sees response appearing word-by-word
- Perceived latency reduced by 50%
- Clean interruption handling

---

### Phase 4: Compliance & Safety

**Goal**: Content filtering and safety guardrails.

**Tasks**:
1. Implement compliance checking tool
2. Add content moderation for user input
3. Filter inappropriate AI responses
4. Log compliance violations for review

**Compliance Rules**:
- No profanity in responses
- No direct homework answers (Socratic method enforced)
- Academic integrity guidelines
- Age-appropriate content

**Acceptance Criteria**:
- Inappropriate content blocked before response
- Violations logged for teacher review
- Clear user feedback on policy violations

---

### Phase 5: Advanced Features

**Goal**: Enhanced learning experience.

**Tasks**:
1. Multi-turn context awareness
2. Reference to previous IST in prompts
3. Personalized response style
4. Export chat transcript

**Acceptance Criteria**:
- AI references earlier conversation naturally
- Students with different skill levels get appropriate guidance
- Chat exportable for offline review

---

## Integration Specs

### Dependencies on Other Systems

| System | Dependency Type | Integration Point |
|--------|----------------|-------------------|
| IST | Consumer | `analyzeAndStoreIstForMessage()` trigger |
| Firestore | Storage | Chat messages, IST results |
| Genkit/Gemini | AI Provider | Response generation |
| Course System | Data Source | Course material for context |
| Auth | Identity | User ID for message ownership |

### Integration Contracts

**Chat → IST**:
```typescript
// Fire-and-forget after each user message
analyzeAndStoreIstForMessage({
  message: userQuestion,
  threadId: threadId,
  messageId: messageId,
  userId: currentUser.uid,
  courseId: courseId
}).catch(console.error);
```

**Chat → Genkit**:
```typescript
// Blocking call for Socratic response
const result = await socraticCourseChat({
  courseMaterial: course.material,
  studentQuestion: userQuestion,
  threadId: threadId
});
return result.response;
```

**Chat → Firestore (Future)**:
```typescript
// Save message to Firestore
await setDoc(
  doc(db, 'threads', threadId, 'messages', messageId),
  {
    role: 'user',
    content: question,
    timestamp: serverTimestamp(),
    userId: currentUser.uid
  }
);
```

**IntentInspector → Firestore**:
```typescript
// Real-time subscription
onSnapshot(
  doc(db, 'threads', threadId, 'analysis', messageId),
  (snapshot) => setAnalysis(snapshot.data())
);
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API downtime | High | Graceful error message, retry logic |
| Inappropriate AI response | High | Compliance checking, human review |
| Message loss | Medium | Optimistic updates + server persistence |
| Slow response times | Medium | Streaming, loading indicators |
| IST failures | Low | Fire-and-forget pattern isolates impact |

---

## Success Metrics

1. **Response Time**: < 5 seconds for 95% of requests
2. **IST Completion Rate**: > 99% of messages analyzed
3. **User Engagement**: Average 5+ messages per session
4. **Error Rate**: < 0.1% of chat submissions fail
5. **Compliance**: 100% of responses pass content filter
