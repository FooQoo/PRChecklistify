import { NextResponse } from 'next/server';
import { GithubClient, type PRIdentifier } from '../../../lib/github';
import { getSession } from '../../../lib/session';
import { fetchPRData } from '../../../lib/prDataService';

function getPRIdentifier(url: string): PRIdentifier | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    if (pathParts.length >= 4 && pathParts[2] === 'pull') {
      return {
        owner: pathParts[0],
        repo: pathParts[1],
        prNumber: parseInt(pathParts[3], 10),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { prUrl } = (await request.json()) as { prUrl: string };

    if (!prUrl) {
      return NextResponse.json({ error: 'prUrl is required' }, { status: 400 });
    }

    const identifier = getPRIdentifier(prUrl);
    if (!identifier) {
      return NextResponse.json({ error: 'Invalid PR URL format' }, { status: 400 });
    }

    const session = await getSession();
    const githubToken = session.accessToken;

    if (!githubToken) {
      return NextResponse.json({ error: 'Not authenticated. Please log in.' }, { status: 401 });
    }

    const githubClient = new GithubClient(githubToken);

    const prData = await fetchPRData(githubClient, identifier);

    if (!prData) {
      return NextResponse.json({ error: 'Failed to fetch PR data.' }, { status: 500 });
    }

    return NextResponse.json(prData);
  } catch (error) {
    console.error('Error in /api/fetch-pr:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch PR data.', details: errorMessage }, { status: 500 });
  }
}
