import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { getGitHubAccessToken } from '@/lib/server/db';
import { getRepository, getRepositoryTree, isSensitiveFile } from '@/lib/server/github-service';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const accessToken = getGitHubAccessToken(auth.user.id);
  const body = await req.json().catch(() => ({}));
  const { owner, repo, branch } = body;

  if (!owner || !repo) {
    return NextResponse.json({ error: 'Owner and repository name are required.' }, { status: 400 });
  }

  try {
    // Stage 1: Authorization & Permission Validation
    const repoMeta = await getRepository(accessToken || undefined, owner, repo);
    const targetBranch = branch || repoMeta.defaultBranch || 'main';

    // Stage 2: Repository Metadata Extraction
    const primaryLanguage = repoMeta.primaryLanguage || 'Unknown';

    // Stage 3: File Tree & Source Indexing
    const treeData = await getRepositoryTree(accessToken, owner, repo, targetBranch);
    const allFiles = treeData.tree || [];

    // Filter out sensitive files, credentials, and binary files
    const safeSourceFiles = allFiles.filter(
      (node) => node.type === 'blob' && !isSensitiveFile(node.path)
    );

    const totalFilesCount = safeSourceFiles.length;
    const estimatedLoc = `${((totalFilesCount * 95) / 1000).toFixed(1)}k`;

    // Stage 4 & 5: Relevant files localization index
    const keyManifests = safeSourceFiles
      .filter((node) =>
        /^(package\.json|requirements\.txt|go\.mod|Cargo\.toml|pom\.xml|build\.gradle)$/i.test(
          node.path.split('/').pop() || ''
        )
      )
      .map((node) => node.path);

    return NextResponse.json({
      success: true,
      repository: {
        id: repoMeta.id,
        name: repoMeta.name,
        fullName: repoMeta.fullName,
        owner: repoMeta.owner,
        branch: targetBranch,
        gitUrl: repoMeta.gitUrl,
        description: repoMeta.description,
        primaryLanguage,
        fileCount: totalFilesCount,
        loc: estimatedLoc,
        keyManifests,
        fileTree: safeSourceFiles.map((n) => n.path),
        stages: [
          '✓ Repository authorized and permissions validated',
          `✓ Repository metadata extracted (${repoMeta.visibility})`,
          `✓ File tree indexed (${totalFilesCount} safe files)`,
          `✓ Key manifests identified (${keyManifests.length} manifests)`,
          '✓ Source context ready for autonomous investigation',
        ],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'PREPARE_CONTEXT_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
