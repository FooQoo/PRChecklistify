import { NextResponse } from 'next/server';
import { generateChecklist } from '../../../lib/aiService';
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

    const analysisPromises = prData.files.map(file => generateChecklist(prData, file, language || 'en'));
    const fileAnalysis = await Promise.all(analysisPromises);

    return NextResponse.json({ fileAnalysis });
  } catch (error) {
    console.error('Error in /api/checklist:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate checklist.', details: errorMessage }, { status: 500 });
  }
}
