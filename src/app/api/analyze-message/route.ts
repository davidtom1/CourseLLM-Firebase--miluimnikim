import { NextRequest, NextResponse } from 'next/server';
import { analyzeMessage } from '@/features/ai/flows/analyze-message';
import type { AnalyzeMessageRequest } from '@/shared/types';

/**
 * API route for analyzing student messages.
 * DataConnect saving is handled by extractAndStoreIST in the socratic chat flow,
 * so we don't duplicate it here to avoid the "Resource not found" emulator issue.
 */
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
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('🔥 Error in analyze-message API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
