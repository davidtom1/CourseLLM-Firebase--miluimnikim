'use server';

import { ai } from '@/features/ai/config/genkit';
import { z } from 'zod';
import type { AnalyzeMessageRequest, MessageAnalysis } from '@/shared/types';
import { extractAndStoreIST } from '@/features/ist/extraction/extractIST';

// Zod schema for the AnalyzeMessageRequest type
const AnalyzeMessageRequestSchema = z.object({
  threadId: z.string(),
  messageText: z.string(),
  messageId: z.string().optional(),
  courseId: z.string().optional(),
  language: z.string().optional(),
  maxHistoryMessages: z.number().optional(),
});

// Zod schema for the MessageAnalysis type
const MessageAnalysisSchema = z.object({
  intent: z.object({
    labels: z.array(z.enum([
      'ASK_EXPLANATION',
      'ASK_EXAMPLES',
      'ASK_STEP_BY_STEP_HELP',
      'ASK_QUIZ',
      'ASK_SUMMARY',
      'ASK_WHAT_TO_LEARN_NEXT',
      'META_SYSTEM_HELP',
      'OFF_TOPIC',
      'OTHER',
    ])),
    primary: z.enum([
      'ASK_EXPLANATION',
      'ASK_EXAMPLES',
      'ASK_STEP_BY_STEP_HELP',
      'ASK_QUIZ',
      'ASK_SUMMARY',
      'ASK_WHAT_TO_LEARN_NEXT',
      'META_SYSTEM_HELP',
      'OFF_TOPIC',
      'OTHER',
    ]),
    confidence: z.number(),
  }),
  skills: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        displayName: z.string().optional(),
        confidence: z.number(),
        role: z.enum(['FOCUS', 'SECONDARY', 'PREREQUISITE']).optional(),
      })
    ),
  }),
  trajectory: z.object({
    currentNodes: z.array(z.string()),
    suggestedNextNodes: z.array(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
        priority: z.number().optional(),
      })
    ),
    status: z.enum([
      'ON_TRACK',
      'STRUGGLING',
      'TOO_ADVANCED',
      'REVIEW_NEEDED',
      'NEW_TOPIC',
      'UNKNOWN',
    ]),
  }),
  metadata: z.object({
    processedAt: z.string(),
    modelVersion: z.string(),
    threadId: z.string(),
    messageId: z.string().nullable().optional(),
    uid: z.string(),
  }),
});

export async function analyzeMessage(
  input: AnalyzeMessageRequest
): Promise<MessageAnalysis> {
  return analyzeMessageFlow(input);
}

const analyzeMessageFlow = ai.defineFlow(
  {
    name: 'analyzeMessageFlow',
    inputSchema: AnalyzeMessageRequestSchema,
    outputSchema: MessageAnalysisSchema,
  },
  async (input): Promise<MessageAnalysis> => {
    // Call the real DSPy IST extraction service
    const istResult = await extractAndStoreIST({
      utterance: input.messageText,
      courseContext: null, // TODO: Pass course context if available
      userId: null, // TODO: Get from auth
      courseId: input.courseId ?? null,
    });

    // If IST extraction failed, return a fallback response
    if (!istResult) {
      console.warn('[IST] extractAndStoreIST returned null, returning fallback data');
      return {
        intent: {
          labels: ['OTHER'],
          primary: 'OTHER',
          confidence: 0.5,
        },
        skills: {
          items: [],
        },
        trajectory: {
          currentNodes: [],
          suggestedNextNodes: [],
          status: 'UNKNOWN',
        },
        metadata: {
          processedAt: new Date().toISOString(),
          modelVersion: 'ist-v1-fallback',
          threadId: input.threadId,
          messageId: input.messageId ?? null,
          uid: 'user-placeholder',
        },
      };
    }

    // Map the DSPy IST result to the MessageAnalysis format
    return {
      intent: {
        labels: ['ASK_EXPLANATION'], // TODO: Map from istResult.intent
        primary: 'ASK_EXPLANATION',
        confidence: 0.95,
      },
      skills: {
        items: istResult.skills.map((skill, index) => ({
          id: skill.toLowerCase().replace(/\s+/g, '-'),
          displayName: skill,
          confidence: 0.9,
          role: index === 0 ? 'FOCUS' : 'SECONDARY',
        })),
      },
      trajectory: {
        currentNodes: istResult.trajectory.slice(0, 1), // Use first trajectory step as current
        suggestedNextNodes: istResult.trajectory.slice(1).map((step, index) => ({
          id: step.toLowerCase().replace(/\s+/g, '-'),
          reason: step,
          priority: index + 1,
        })),
        status: 'ON_TRACK',
      },
      metadata: {
        processedAt: new Date().toISOString(),
        modelVersion: 'ist-dspy-v1',
        threadId: input.threadId,
        messageId: input.messageId ?? null,
        uid: 'user-placeholder',
      },
    };
  }
);

