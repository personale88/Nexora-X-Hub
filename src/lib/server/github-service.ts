/**
 * Dedicated GitHub Service Layer for RepoPilot AI.
 * Communicates directly with the official GitHub REST API v3.
 * Follows least-privilege principles and guarantees credentials are never returned to client.
 */

export interface SanitizedGitHubUser {
  id: number;
  login: string;
  name: string;
  email: string | null;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  publicRepos: number;
}

export interface SanitizedRepository {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatar: string;
  visibility: 'Public' | 'Private';
  primaryLanguage: string;
  lastUpdated: string;
  lastUpdatedRelative: string;
  accessLevel: 'Read / Write' | 'Read' | 'Admin';
  stars: number;
  forks: number;
  defaultBranch: string;
  gitUrl: string;
  description: string;
  isPrivate: boolean;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Format timestamp into human-readable relative time (e.g. "Updated 2 hours ago", "Updated yesterday").
 */
function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Updated just now';
    if (diffMin < 60) return `Updated ${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `Updated ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 30) return `Updated ${diffDays} days ago`;
    return `Updated on ${date.toLocaleDateString()}`;
  } catch {
    return 'Recently updated';
  }
}

/**
 * Base GitHub API request wrapper with robust error handling.
 */
async function githubRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/vnd.github.v3+json');
  headers.set('User-Agent', 'RepoPilot-Autonomous-Dev-Agent');
  headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(url, {
    ...options,
    headers,
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('GITHUB_TOKEN_EXPIRED: GitHub authorization has expired. Reconnect GitHub to continue.');
    }
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error('GITHUB_RATE_LIMIT: GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error('GITHUB_ACCESS_DENIED: GitHub access was denied or required scope is missing.');
    }
    if (response.status === 404) {
      throw new Error('GITHUB_NOT_FOUND: The requested repository was not found or your account does not have permission.');
    }

    const errBody = await response.text().catch(() => '');
    throw new Error(`GitHub API error (${response.status}): ${response.statusText}. ${errBody}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Get authenticated user profile from GitHub.
 */
export async function getGitHubUser(accessToken: string): Promise<SanitizedGitHubUser> {
  const data = await githubRequest<any>('/user', accessToken);
  return {
    id: data.id,
    login: data.login,
    name: data.name || data.login,
    email: data.email || null,
    avatarUrl: data.avatar_url,
    htmlUrl: data.html_url,
    bio: data.bio || null,
    publicRepos: data.public_repos || 0,
  };
}

/**
 * Get repositories accessible by the authenticated user with filtering.
 */
export async function getRepositories(
  accessToken: string,
  options: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: 'owner,collaborator,organization_member' | string;
    sort?: 'updated' | 'created' | 'pushed' | 'full_name';
    search?: string;
  } = {}
): Promise<SanitizedRepository[]> {
  const params = new URLSearchParams({
    per_page: '100',
    sort: options.sort || 'updated',
    direction: 'desc',
    affiliation: options.affiliation || 'owner,collaborator,organization_member',
  });

  if (options.visibility && options.visibility !== 'all') {
    params.set('visibility', options.visibility);
  }

  const rawRepos = await githubRequest<any[]>(`/user/repos?${params.toString()}`, accessToken);

  let sanitized: SanitizedRepository[] = rawRepos.map((r) => {
    let accessLevel: 'Read / Write' | 'Read' | 'Admin' = 'Read';
    if (r.permissions?.admin) {
      accessLevel = 'Admin';
    } else if (r.permissions?.push) {
      accessLevel = 'Read / Write';
    }

    return {
      id: String(r.id),
      name: r.name,
      fullName: r.full_name,
      owner: r.owner?.login || '',
      ownerAvatar: r.owner?.avatar_url || '',
      visibility: r.private ? 'Private' : 'Public',
      primaryLanguage: r.language || 'TypeScript',
      lastUpdated: r.updated_at,
      lastUpdatedRelative: formatRelativeTime(r.updated_at),
      accessLevel,
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      defaultBranch: r.default_branch || 'main',
      gitUrl: r.clone_url || `https://github.com/${r.full_name}.git`,
      description: r.description || `Repository from ${r.owner?.login || 'GitHub'}`,
      isPrivate: Boolean(r.private),
      permissions: r.permissions,
    };
  });

  // Apply in-memory search if specified
  if (options.search) {
    const q = options.search.toLowerCase();
    sanitized = sanitized.filter(
      (repo) =>
        repo.name.toLowerCase().includes(q) ||
        repo.owner.toLowerCase().includes(q) ||
        repo.primaryLanguage.toLowerCase().includes(q) ||
        repo.description.toLowerCase().includes(q)
    );
  }

  return sanitized;
}

/**
 * Get detailed repository metadata.
 */
export async function getRepository(
  accessToken: string,
  owner: string,
  repo: string
): Promise<SanitizedRepository> {
  const r = await githubRequest<any>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, accessToken);

  let accessLevel: 'Read / Write' | 'Read' | 'Admin' = 'Read';
  if (r.permissions?.admin) {
    accessLevel = 'Admin';
  } else if (r.permissions?.push) {
    accessLevel = 'Read / Write';
  }

  return {
    id: String(r.id),
    name: r.name,
    fullName: r.full_name,
    owner: r.owner?.login || '',
    ownerAvatar: r.owner?.avatar_url || '',
    visibility: r.private ? 'Private' : 'Public',
    primaryLanguage: r.language || 'TypeScript',
    lastUpdated: r.updated_at,
    lastUpdatedRelative: formatRelativeTime(r.updated_at),
    accessLevel,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    defaultBranch: r.default_branch || 'main',
    gitUrl: r.clone_url || `https://github.com/${r.full_name}.git`,
    description: r.description || '',
    isPrivate: Boolean(r.private),
    permissions: r.permissions,
  };
}

/**
 * Get repository tree (file structure).
 */
export async function getRepositoryTree(
  accessToken: string,
  owner: string,
  repo: string,
  branch = 'main'
): Promise<{ tree: Array<{ path: string; mode: string; type: 'blob' | 'tree'; size?: number; sha: string }> }> {
  return githubRequest<{ tree: Array<any> }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    accessToken
  );
}

/**
 * Get branches for a repository.
 */
export async function getBranches(
  accessToken: string,
  owner: string,
  repo: string
): Promise<Array<{ name: string; protected: boolean }>> {
  const branches = await githubRequest<any[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=30`,
    accessToken
  );
  return branches.map((b) => ({ name: b.name, protected: Boolean(b.protected) }));
}

/**
 * Get specific file content from a repository.
 */
export async function getRepositoryFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<{ content: string; encoding: string; size: number }> {
  const data = await githubRequest<any>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
    accessToken
  );

  let content = data.content;
  if (data.encoding === 'base64') {
    content = Buffer.from(data.content, 'base64').toString('utf8');
  }

  return {
    content,
    encoding: 'utf8',
    size: data.size,
  };
}
