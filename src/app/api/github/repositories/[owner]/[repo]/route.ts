import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getGitHubAccessToken } from '@/lib/server/db';
import { getRepository, getBranches, getRepositoryTree } from '@/lib/server/github-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const accessToken = getGitHubAccessToken(auth.user.id);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'GITHUB_NOT_CONNECTED', message: 'GitHub account is not connected.' },
      { status: 400 }
    );
  }

  const { owner, repo } = await params;

  try {
    const repository = await getRepository(accessToken, owner, repo);
    const branches = await getBranches(accessToken, owner, repo);

    // Optionally fetch file tree if requested
    const withTree = req.nextUrl.searchParams.get('tree') === 'true';
    let tree = null;
    if (withTree) {
      try {
        const treeData = await getRepositoryTree(accessToken, owner, repo, repository.defaultBranch);
        tree = treeData.tree;
      } catch (e) {
        console.warn('Could not fetch repository tree', e);
      }
    }

    return NextResponse.json({
      success: true,
      repository,
      branches,
      tree,
    });
  } catch (err: any) {
    if (err.message.includes('GITHUB_NOT_FOUND')) {
      return NextResponse.json(
        {
          error: 'REPOSITORY_NOT_FOUND',
          message: `This repository is private or does not exist, and your connected GitHub account does not have access.`,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'REPOSITORY_FETCH_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
