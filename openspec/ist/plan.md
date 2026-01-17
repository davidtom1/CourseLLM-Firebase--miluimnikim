# IST Feature - Implementation Plan

## Current State Assessment

### Implemented Components
- [x] Extraction pipeline (`extractIST.ts`)
- [x] Context service (`istContextService.ts`)
- [x] Repository pattern with JSON implementation
- [x] Firestore real-time storage
- [x] DataConnect integration
- [x] IntentInspector UI component
- [x] Teacher class report computation
- [x] Analysis engine factory (API + Callable modes)

### Known Gaps
- [ ] Retry logic for DSPy service failures
- [ ] PostgreSQL repository implementation (stub only)
- [ ] Production-ready error monitoring
- [ ] Student profile integration (currently optional)

---

## Implementation Roadmap

### Phase 1: Core Stability (Current)

**Goal**: Ensure reliable IST extraction in development environment.

**Tasks**:
1. Verify DSPy service connectivity
2. Confirm Firestore emulator integration
3. Test DataConnect mutations/queries
4. Validate end-to-end flow from ChatPanel to IntentInspector

**Acceptance Criteria**:
- Student message triggers IST extraction
- Results appear in IntentInspector within 5 seconds
- Events persist in DataConnect (queryable via debug page)

---

### Phase 2: Production Hardening

**Goal**: Make IST extraction production-ready.

**Tasks**:
1. Add exponential backoff retry for DSPy calls
2. Implement circuit breaker pattern for service failures
3. Add structured logging for debugging
4. Create health check endpoint for DSPy service

**Acceptance Criteria**:
- System recovers gracefully from DSPy downtime
- Errors are logged with correlation IDs
- Chat flow never blocked by IST failures

---

### Phase 3: Analytics Enhancement

**Goal**: Provide meaningful insights to teachers.

**Tasks**:
1. Implement trend analysis algorithm
2. Add skill clustering/normalization
3. Create visualization components for skill distribution
4. Add export functionality (CSV/PDF)

**Acceptance Criteria**:
- Teachers see weekly trend comparisons
- Similar skills are grouped (e.g., "loops", "looping", "for loops")
- Reports can be exported for external use

---

### Phase 4: Scale Optimization

**Goal**: Prepare for production traffic.

**Tasks**:
1. Implement PostgreSQL repository
2. Add caching layer for frequent queries
3. Optimize Firestore queries with composite indexes
4. Consider batch processing for high-volume scenarios

**Acceptance Criteria**:
- System handles 100+ concurrent extractions
- Query response times < 200ms
- Storage costs remain predictable

---

## Integration Specs

### Dependencies on Other Systems

| System | Dependency Type | Integration Point |
|--------|----------------|-------------------|
| Chat | Trigger | `ChatPanel.handleChatSubmit()` calls IST extraction |
| DSPy Service | External | HTTP POST to `/api/intent-skill-trajectory` |
| Firestore | Storage | Real-time writes to `threads/{threadId}/analysis/{messageId}` |
| DataConnect | Storage | Structured queries via generated SDK |
| Analytics | Consumer | `computeTeacherIstClassReportV2()` reads IST events |

### Integration Contracts

**Chat → IST**:
```typescript
// ChatPanel must call this after receiving student message
analyzeAndStoreIstForMessage({
  message: string,
  threadId: string,
  messageId: string,
  userId: string,
  courseId: string
}): Promise<void>  // Fire-and-forget
```

**IST → DSPy**:
```typescript
// Request
POST {DSPY_SERVICE_URL}/api/intent-skill-trajectory
{
  utterance: string,
  context: IstContext
}

// Response
{
  intent: string,
  skills: string[],
  trajectory: string[]
}
```

**IST → Firestore**:
```typescript
// Document structure
threads/{threadId}/analysis/{messageId}: {
  intent: string,
  skills: string[],
  trajectory: string[],
  timestamp: Timestamp
}
```

**IST → DataConnect**:
```graphql
mutation CreateIstEvent($data: IstEvent_Data!) {
  istEvent_insert(data: $data) { id }
}

query IstEventsByUserAndCourse($userId: String!, $courseId: String!) {
  istEvents(where: { userId: { eq: $userId }, courseId: { eq: $courseId } }) {
    id, intent, skills, trajectory, createdAt
  }
}
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| DSPy service unavailable | High | Implement retry + fallback to cached results |
| Firestore quota exceeded | Medium | Monitor usage, implement batching |
| Incorrect skill extraction | Medium | Human review dashboard, feedback loop |
| Performance degradation | Low | Async processing, caching |

---

## Success Metrics

1. **Extraction Success Rate**: > 99% of student messages processed
2. **Latency**: < 3s from message to IntentInspector update
3. **Accuracy**: Teacher satisfaction with extracted intents/skills
4. **Reliability**: Zero chat flow interruptions due to IST failures
