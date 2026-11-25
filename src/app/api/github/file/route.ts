import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getGitHubAccessToken } from '@/lib/server/db';
import { getRepositoryFile } from '@/lib/server/github-service';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const accessToken = getGitHubAccessToken(auth.user.id);

  const { searchParams } = req.nextUrl;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const path = searchParams.get('path');
  const branch = searchParams.get('branch') || 'main';

  if (!owner || !repo || !path) {
    return NextResponse.json(
      {
        error: 'INVALID_REQUEST',
        message: 'Owner, repo, and path query parameters are required.',
      },
      { status: 400 }
    );
  }

  try {
    const file = await getRepositoryFile(accessToken, owner, repo, path, branch);
    return NextResponse.json({
      success: true,
      file,
    });
  } catch (err: any) {
    const status = err.message?.startsWith('FILE_NOT_FOUND')
      ? 404
      : err.message?.includes('403') || err.message?.includes('RATE_LIMIT')
      ? 403
      : 500;

    return NextResponse.json(
      {
        error: err.message?.startsWith('FILE_NOT_FOUND') ? 'FILE_NOT_FOUND' : 'FILE_FETCH_FAILED',
        message: err.message || 'Failed to retrieve file from GitHub.',
      },
      { status }
    );
  }
}
