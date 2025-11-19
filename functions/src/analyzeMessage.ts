import * as functions from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v1/https';
import { saveAnalysisToFirestore, loadRecentMessages, loadStudentProfile, loadGraphSnippet } from './firestoreHelpers';
import { callLLMForAnalysis } from './llm/llmClient';
import { mapLLMResponseToMessageAnalysis } from './llm/analysisMapper';

export const analyzeMessageLogic = async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  if (!data.threadId || !data.messageText) {
    throw new HttpsError('invalid-argument', 'threadId and messageText are required.');
  }

  const { threadId, messageText, messageId, courseId, language, maxHistoryMessages } = data;
  const finalMessageId = messageId || `analysis-${Date.now()}`;
  const uid = context.auth.uid;

  try {
    const [recentMessages, studentProfile, graphSnippet] = await Promise.all([
      loadRecentMessages(threadId, maxHistoryMessages || 10),
      loadStudentProfile(uid),
      loadGraphSnippet(courseId),
    ]);

    const llmInput = {
      messageText,
      recentMessages,
      studentProfile,
      graphSnippet,
      language: language || 'en',
    };

    const rawAnalysis = await callLLMForAnalysis(llmInput);
    const analysis = mapLLMResponseToMessageAnalysis(rawAnalysis, { uid, threadId, messageId: finalMessageId });

    await saveAnalysisToFirestore(threadId, finalMessageId, analysis);

    return analysis;
  } catch (err) {
    console.error({ uid, threadId, messageId: finalMessageId, err });
    throw new HttpsError('internal', 'Failed to analyze message');
  }
};

export const analyzeMessage = functions.https.onCall(analyzeMessageLogic);
