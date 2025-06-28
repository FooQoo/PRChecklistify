import { NextResponse } from 'next/server';
import { generateChecklist } from '../../../lib/aiService';
import type { PRData, PRFile } from '@extension/shared';

export async function POST(request: Request) {
  try {
    const { prData, file, language } = (await request.json()) as {
      prData: PRData;
      file: PRFile;
      language: string;
    };

    if (!prData || !file) {
      return NextResponse.json({ error: 'Missing prData or file in request body' }, { status: 400 });
    }

    const fileAnalysis = await generateChecklist(prData, file, language || 'en');

    return NextResponse.json({ fileAnalysis });
  } catch (error) {
    console.error('Error in /api/checklist-file:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to generate checklist for file.', details: errorMessage },
      { status: 500 },
    );
  }
}
