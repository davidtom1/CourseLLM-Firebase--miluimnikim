
import { getIstAnalysisEngine } from '../engine/engine';
import { getIstAnalysisRepository } from '../repositories/repository';
import type { AnalyzeMessageRequest, MessageAnalysis } from '@/shared/types';

export async function analyzeAndStoreIstForMessage(params: {
  threadId: string;
  messageId: string;
  courseId?: string;
  language?: string;
  maxHistoryMessages?: number;
  messageText: string;
}): Promise<MessageAnalysis> {
  console.log('[IST][chatIst] START analyzeAndStoreIstForMessage', {
    threadId: params.threadId,
    messageId: params.messageId,
    courseId: params.courseId
  });

  const engine = getIstAnalysisEngine();
  const repo = getIstAnalysisRepository();

  const request: AnalyzeMessageRequest = {
    threadId: params.threadId,
    messageId: params.messageId,
    courseId: params.courseId,
    language: params.language ?? 'en',
    maxHistoryMessages: params.maxHistoryMessages ?? 10,
    messageText: params.messageText,
  };

  console.log('[IST][chatIst] Calling engine.analyzeMessage...');
  const analysis = await engine.analyzeMessage(request);
  console.log('[IST][chatIst] Received analysis from engine');

  // Save to Firestore for real-time UI (IntentInspector component)
  try {
    console.log('[IST][chatIst] Attempting to save to Firestore...');
    await repo.save(analysis);
    console.log('[IST][chatIst] Successfully saved analysis to Firestore');
  } catch (error) {
    console.error('[IST][chatIst] Failed to save analysis to Firestore:', error);
  }

  // Note: DataConnect save is handled by the old socratic chat flow via extractAndStoreIST
  // which saves to JSON files. To see IST in the dev page, use user-placeholder/cs101.

  return analysis;
}

