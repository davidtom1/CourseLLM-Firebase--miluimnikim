import { mapLLMResponseToMessageAnalysis } from '../src/llm/analysisMapper';

describe('mapLLMResponseToMessageAnalysis', () => {
  const meta = { uid: 'test-uid', threadId: 'test-thread', messageId: 'test-message' };

  it('should map a valid LLM response correctly', () => {
    const raw = {
      intent: {
        labels: ['ASK_EXPLANATION'],
        primary: 'ASK_EXPLANATION',
        confidence: 0.9,
      },
      skills: {
        items: [{ id: 'test-skill', confidence: 0.8, role: 'FOCUS' }],
      },
      trajectory: {
        currentNodes: ['node1'],
        suggestedNextNodes: [{ id: 'node2' }],
        status: 'ON_TRACK',
      },
    };
    const result = mapLLMResponseToMessageAnalysis(raw, meta);
    expect(result.intent.primary).toBe('ASK_EXPLANATION');
    expect(result.skills.items[0].id).toBe('test-skill');
    expect(result.trajectory.status).toBe('ON_TRACK');
    expect(result.metadata.uid).toBe('test-uid');
  });

  it('should handle missing fields with fallbacks', () => {
    const raw = {};
    const result = mapLLMResponseToMessageAnalysis(raw, meta);
    expect(result.intent.primary).toBe('OTHER');
    expect(result.intent.confidence).toBe(0.5);
    expect(result.trajectory.status).toBe('UNKNOWN');
  });
});
