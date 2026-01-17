import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessage } from '@/features/ai/flows/analyze-message';
import type { AnalyzeMessageRequest } from '@/shared/types';

// Ensure Firebase app is initialized before using Data Connect SDK
import '@/features/firebase';

import { executeMutation } from 'firebase/data-connect';
import { connectorConfig, createIstEventRef } from '@dataconnect/generated';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AnalyzeMessageRequest;

  if (!body.threadId || !body.messageText) {
    return NextResponse.json(
      { error: 'threadId and messageText are required' },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeMessage(body);
    console.log('🔥 Analysis API result:', analysis);

    // Save to DataConnect for IST dev page
    try {
      const ref = createIstEventRef(connectorConfig, {
        userId: analysis.metadata.uid || 'user-placeholder',
        courseId: body.courseId || 'unknown-course',
        threadId: body.threadId,
        messageId: body.messageId || `msg-${Date.now()}`,
        utterance: body.messageText,
        intent: analysis.intent.primary,
        skills: analysis.skills.items,
        trajectory: analysis.trajectory.suggestedNextNodes,
      });
      await executeMutation(ref);
      console.log('🔥 Saved to DataConnect successfully');
    } catch (dcError) {
      console.error('🔥 Failed to save to DataConnect:', dcError);
      // Don't fail the whole request if DataConnect save fails
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('🔥 Error in analyze-message API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
