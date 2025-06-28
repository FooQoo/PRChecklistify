import { NextResponse } from 'next/server';
import { getAiResponseStream } from '../../../lib/aiService';
import type { PRData, PRFile } from '@extension/shared';

export const runtime = 'edge';

type RequestBody = {
  messages: { role: 'user' | 'assistant'; content: string }[];
  prData: PRData;
  file: PRFile;
  language: string;
};

export async function POST(req: Request) {
  try {
    const { messages, prData, file, language }: RequestBody = await req.json();

    if (!messages || !prData || !file) {
      return new NextResponse('Missing messages, prData, or file in request body', { status: 400 });
    }

    const stream = await getAiResponseStream(messages, prData, file, language);

    return stream.toDataStreamResponse();
  } catch (error) {
    console.error('Error in /api/chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ error: 'Failed to get AI response.', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
