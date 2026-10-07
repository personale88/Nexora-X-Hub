import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getGitHubAccessToken } from '@/lib/server/db';
import { getRepositories } from '@/lib/server/github-service';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const accessToken = getGitHubAccessToken(auth.user.id);

  if (!accessToken || !auth.connectedGitHub) {
    return NextResponse.json(
      {
        error: 'GITHUB_NOT_CONNECTED',
        message: 'No GitHub account connected. Please connect your GitHub account to access repositories.',
      },
      { status: 400 }
    );
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') || undefined;
  const visibility = (searchParams.get('visibility') as 'all' | 'public' | 'private') || 'all';
  const filter = searchParams.get('filter') || 'all';

  let affiliation: string | undefined = undefined;
  if (filter === 'owned') {
    affiliation = 'owner';
  } else if (filter === 'organization') {
    affiliation = 'organization_member';
  }

  try {
    const repositories = await getRepositories(accessToken, {
      search,
      visibility,
      affiliation,
      sort: 'updated',
    });

    return NextResponse.json({
      success: true,
      repositories,
      count: repositories.length,
      connectedUser: auth.connectedGitHub.githubUsername,
    });
  } catch (err: any) {
    console.error('Error fetching GitHub repositories:', err.message);

    if (err.message.includes('GITHUB_TOKEN_EXPIRED')) {
      return NextResponse.json(
        {
          error: 'GITHUB_TOKEN_EXPIRED',
          message: 'GitHub authorization has expired. Reconnect GitHub to continue.',
        },
        { status: 401 }
      );
    }

    if (err.message.includes('GITHUB_RATE_LIMIT')) {
      return NextResponse.json(
        {
          error: 'GITHUB_RATE_LIMIT',
          message: 'GitHub API rate limit reached. Please wait a few moments and try again.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'GITHUB_FETCH_FAILED',
        message: err.message || 'Failed to fetch repositories from GitHub.',
      },
      { status: 500 }
    );
  }
}
