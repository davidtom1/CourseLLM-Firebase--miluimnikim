import * as functions from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v1/https';
import { analyzeMessageLogic } from '../src/analyzeMessage';
import { saveAnalysisToFirestore, loadRecentMessages, loadStudentProfile, loadGraphSnippet } from '../src/firestoreHelpers';
import { callLLMForAnalysis } from '../src/llm/llmClient';

// Mock the dependencies
jest.mock('../src/firestoreHelpers');
jest.mock('../src/llm/llmClient');

describe('analyzeMessageLogic', () => {
  const mockLoadRecentMessages = loadRecentMessages as jest.Mock;
  const mockLoadStudentProfile = loadStudentProfile as jest.Mock;
  const mockLoadGraphSnippet = loadGraphSnippet as jest.Mock;
  const mockCallLLMForAnalysis = callLLMForAnalysis as jest.Mock;
  const mockSaveAnalysisToFirestore = saveAnalysisToFirestore as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an unauthenticated error if context has no auth', async () => {
    const data = { threadId: 't1', messageText: 'Hello' };
    const context = {} as functions.https.CallableContext;
    await expect(analyzeMessageLogic(data, context)).rejects.toThrow(
      new HttpsError('unauthenticated', 'User must be authenticated.')
    );
  });

  it('should throw an invalid-argument error if threadId is missing', async () => {
    const data = { messageText: 'Hello' };
    const context = { auth: { uid: 'test-uid' } } as functions.https.CallableContext;
    await expect(analyzeMessageLogic(data, context)).rejects.toThrow(
      new HttpsError('invalid-argument', 'threadId and messageText are required.')
    );
  });

  it('should process a valid request', async () => {
    const data = {
      threadId: 't1',
      messageId: 'm1',
      messageText: 'Hello, world!',
      courseId: 'c1',
      language: 'en',
    };
    const context = { auth: { uid: 'test-uid' } } as functions.https.CallableContext;

    mockLoadRecentMessages.mockResolvedValue([]);
    mockLoadStudentProfile.mockResolvedValue({});
    mockLoadGraphSnippet.mockResolvedValue({});
    mockCallLLMForAnalysis.mockResolvedValue({
      intent: { primary: 'TEST_INTENT' },
      skills: { items: [] },
      trajectory: {},
    });

    const result = await analyzeMessageLogic(data, context);

    expect(mockLoadRecentMessages).toHaveBeenCalledWith('t1', 10);
    expect(mockLoadStudentProfile).toHaveBeenCalledWith('test-uid');
    expect(mockLoadGraphSnippet).toHaveBeenCalledWith('c1');
    expect(mockCallLLMForAnalysis).toHaveBeenCalled();
    expect(mockSaveAnalysisToFirestore).toHaveBeenCalled();
    expect(result.intent.primary).toBe('TEST_INTENT');
  });
});
