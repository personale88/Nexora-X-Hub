import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get('user');
  const repo = searchParams.get('repo');
  const tree = searchParams.get('tree');
  const branch = searchParams.get('branch') || 'main';
  const token = searchParams.get('token') || process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'RepoPilot-Autonomous-Dev-Agent',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    // 1. Fetch file tree for a repo
    if (tree) {
      const cleanTree = tree.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
      const url = `https://api.github.com/repos/${cleanTree}/git/trees/${branch}?recursive=1`;
      const res = await fetch(url, { headers, next: { revalidate: 60 } });

      if (!res.ok) {
        return NextResponse.json({ error: `GitHub tree fetch failed: ${res.statusText}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // 2. Fetch single repository details
    if (repo) {
      const cleanRepo = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
      const url = `https://api.github.com/repos/${cleanRepo}`;
      const res = await fetch(url, { headers, next: { revalidate: 60 } });

      if (!res.ok) {
        return NextResponse.json({ error: `Repository not found on GitHub (${res.status})` }, { status: res.status });
      }

      const repoData = await res.json();

      // Fetch languages
      let languages: Record<string, number> = {};
      try {
        const langRes = await fetch(repoData.languages_url, { headers });
        if (langRes.ok) {
          languages = await langRes.json();
        }
      } catch (e) {
        // ignore language fetch failure
      }

      return NextResponse.json({ ...repoData, languagesBreakdown: languages });
    }

    // 3. Fetch user or organization repositories
    const targetUser = user || 'personale88';
    const url = `https://api.github.com/users/${targetUser}/repos?sort=updated&per_page=30`;
    const res = await fetch(url, { headers, next: { revalidate: 60 } });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch repos for user ${targetUser} (${res.status})` }, { status: res.status });
    }

    const repos = await res.json();
    return NextResponse.json({ user: targetUser, repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error connecting to GitHub API' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, user, token } = body;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'RepoPilot-Autonomous-Dev-Agent',
    };

    const authToken = token || process.env.GITHUB_TOKEN;
    if (authToken) {
      headers['Authorization'] = `token ${authToken}`;
    }

    // If a Git URL was submitted
    if (url) {
      const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
      if (!match) {
        return NextResponse.json({ error: 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)' }, { status: 400 });
      }

      const [, owner, repoName] = match;
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
      const res = await fetch(apiUrl, { headers });

      if (!res.ok) {
        return NextResponse.json({ error: `Could not connect to GitHub repository ${owner}/${repoName}: ${res.statusText}` }, { status: res.status });
      }

      const repoData = await res.json();

      // Fetch languages
      let languages: Record<string, number> = {};
      try {
        const langRes = await fetch(repoData.languages_url, { headers });
        if (langRes.ok) {
          languages = await langRes.json();
        }
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        repo: {
          ...repoData,
          languagesBreakdown: languages,
        },
      });
    }

    // If searching user/org
    const targetUser = user || 'personale88';
    const userUrl = `https://api.github.com/users/${targetUser}/repos?sort=updated&per_page=30`;
    const res = await fetch(userUrl, { headers });

    if (!res.ok) {
      return NextResponse.json({ error: `GitHub user/organization '${targetUser}' not found.` }, { status: res.status });
    }

    const repos = await res.json();
    return NextResponse.json({ success: true, user: targetUser, repos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed connecting to real Git remote.' }, { status: 500 });
  }
}
