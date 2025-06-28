import { NextResponse } from 'next/server';
import { generateSummaryStream } from '../../../lib/aiService';
import type { PRData } from '@extension/shared';

export async function POST(request: Request) {
  try {
    const { prData, language } = (await request.json()) as {
      prData: PRData;
      language: string;
    };

    if (!prData) {
      return NextResponse.json({ error: 'Missing prData in request body' }, { status: 400 });
    }

    const stream = await generateSummaryStream(prData, language || 'en');

    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('Error in /api/summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate summary.', details: errorMessage }, { status: 500 });
  }
}
