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
  accessToken?: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/vnd.github.v3+json');
  headers.set('User-Agent', 'RepoPilot-Autonomous-Dev-Agent');
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

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
 * Retrieve public repositories for a specific GitHub user.
 * Operates without requiring an OAuth access token.
 */
export async function getPublicUserRepositories(
  username: string,
  options: {
    sort?: 'updated' | 'created' | 'pushed' | 'full_name';
    search?: string;
  } = {}
): Promise<SanitizedRepository[]> {
  const url = `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=${options.sort || 'updated'}`;
  const rawRepos = await githubRequest<any[]>(url);

  let sanitized: SanitizedRepository[] = rawRepos.map((r: any) => ({
    id: String(r.id),
    name: r.name,
    fullName: r.full_name,
    owner: r.owner?.login || username,
    ownerAvatar: r.owner?.avatar_url || '',
    visibility: r.private ? 'Private' : 'Public',
    primaryLanguage: r.language || 'TypeScript',
    lastUpdated: r.updated_at,
    lastUpdatedRelative: formatRelativeTime(r.updated_at),
    accessLevel: 'Read / Write',
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    defaultBranch: r.default_branch || 'main',
    gitUrl: r.clone_url || `https://github.com/${r.full_name}.git`,
    description: r.description || `Repository from ${r.owner?.login || username}`,
    isPrivate: Boolean(r.private),
    permissions: r.permissions || { admin: true, push: true, pull: true },
  }));

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
  accessToken: string | undefined | null,
  owner: string,
  repo: string
): Promise<SanitizedRepository> {
  const r = await githubRequest<any>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, accessToken || undefined);

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
  accessToken: string | undefined | null,
  owner: string,
  repo: string,
  branch = 'main'
): Promise<{ tree: Array<{ path: string; mode: string; type: 'blob' | 'tree'; size?: number; sha: string }> }> {
  return githubRequest<{ tree: Array<any> }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    accessToken || undefined
  );
}

/**
 * Get branches for a repository.
 */
export async function getBranches(
  accessToken: string | undefined | null,
  owner: string,
  repo: string
): Promise<Array<{ name: string; protected: boolean }>> {
  const branches = await githubRequest<any[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=30`,
    accessToken || undefined
  );
  return branches.map((b) => ({ name: b.name, protected: Boolean(b.protected) }));
}

export interface SanitizedGitHubFile {
  repositoryId?: string;
  repositoryOwner: string;
  repositoryName: string;
  branch: string;
  commitSha?: string;
  filePath: string;
  blobSha: string;
  fileSize: number;
  lines: number;
  content: string;
  language: string;
  isBinary: boolean;
  isEmpty: boolean;
  isTruncated?: boolean;
  retrievalStatus: 'VERIFIED' | 'EMPTY' | 'BINARY' | 'TRUNCATED';
}

export function detectLanguageFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    py: 'python',
    pyw: 'python',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    markdown: 'markdown',
    java: 'java',
    go: 'go',
    rs: 'rust',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    php: 'php',
    rb: 'ruby',
    sh: 'bash',
    bash: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    dockerfile: 'dockerfile',
  };
  const base = filePath.split('/').pop()?.toLowerCase() || '';
  if (base === 'dockerfile') return 'dockerfile';
  if (base === 'makefile') return 'makefile';
  return map[ext] || 'plaintext';
}

export function isBinaryBuffer(buf: Buffer): boolean {
  const checkLen = Math.min(buf.length, 8000);
  for (let i = 0; i < checkLen; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

/**
 * Get specific file content from a repository with genuine decoding,
 * binary protection, empty file detection, and raw/blob fallbacks.
 */
export async function getRepositoryFile(
  accessToken: string | undefined | null,
  owner: string,
  repo: string,
  filePath: string,
  branch = 'main'
): Promise<SanitizedGitHubFile> {
  const cleanPath = filePath.replace(/^\/+/, '');
  const encodedPath = cleanPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const language = detectLanguageFromPath(cleanPath);

  // Fast check: Known binary extensions
  const binaryExtensions = [
    '.exe', '.bin', '.dll', '.so', '.dylib', '.png', '.jpg', '.jpeg',
    '.gif', '.webp', '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.mp4', '.mp3'
  ];
  if (binaryExtensions.some(ext => cleanPath.toLowerCase().endsWith(ext))) {
    return {
      repositoryId: `${owner}/${repo}`,
      repositoryOwner: owner,
      repositoryName: repo,
      branch,
      filePath: cleanPath,
      blobSha: '',
      fileSize: 0,
      lines: 0,
      content: '',
      language,
      isBinary: true,
      isEmpty: false,
      retrievalStatus: 'BINARY',
    };
  }

  let rawData: any = null;

  // 1. Try GitHub Contents API with ref
  try {
    const url = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
    rawData = await githubRequest<any>(url, accessToken || undefined);
  } catch (contentsErr: any) {
    if (contentsErr.message?.includes('GITHUB_NOT_FOUND')) {
      throw new Error(`FILE_NOT_FOUND: File "${cleanPath}" was not found in ${owner}/${repo}@${branch}.`);
    }
    console.warn(`Contents API failed for ${cleanPath}, attempting raw fallback:`, contentsErr.message);
  }

  // 2. If Contents API returned a directory instead of a file
  if (Array.isArray(rawData)) {
    throw new Error(`INVALID_PATH: "${cleanPath}" is a directory, not a file.`);
  }

  // 3. If file has a blob SHA and is larger than 1MB (or content missing)
  if (rawData && !rawData.content && rawData.sha) {
    try {
      const blobData = await githubRequest<any>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs/${rawData.sha}`,
        accessToken || undefined
      );
      if (blobData && blobData.content) {
        rawData.content = blobData.content;
        rawData.encoding = blobData.encoding;
      }
    } catch (blobErr: any) {
      console.warn(`Git Blobs API fallback failed for ${rawData.sha}:`, blobErr.message);
    }
  }

  let content = '';
  let blobSha = rawData?.sha || '';
  let size = rawData?.size || 0;

  if (rawData && rawData.content) {
    if (rawData.encoding === 'base64') {
      const cleanBase64 = rawData.content.replace(/\s/g, '');
      const buf = Buffer.from(cleanBase64, 'base64');
      if (isBinaryBuffer(buf)) {
        return {
          repositoryId: `${owner}/${repo}`,
          repositoryOwner: owner,
          repositoryName: repo,
          branch,
          filePath: cleanPath,
          blobSha,
          fileSize: size || buf.length,
          lines: 0,
          content: '',
          language,
          isBinary: true,
          isEmpty: false,
          retrievalStatus: 'BINARY',
        };
      }
      content = buf.toString('utf8');
      size = size || buf.length;
    } else {
      content = String(rawData.content);
    }
  } else {
    // 4. Raw GitHub User Content fallback
    try {
      const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${encodedPath}`;
      const headers: Record<string, string> = {
        'User-Agent': 'RepoPilot-Autonomous-Dev-Agent',
      };
      if (accessToken) {
        headers['Authorization'] = `token ${accessToken}`;
      }
      const rawRes = await fetch(rawUrl, { headers });
      if (rawRes.ok) {
        content = await rawRes.text();
        size = Buffer.byteLength(content, 'utf8');
      } else if (rawRes.status === 404) {
        throw new Error(`FILE_NOT_FOUND: File "${cleanPath}" does not exist in repository ${owner}/${repo} at branch ${branch}.`);
      } else {
        throw new Error(`GitHub raw fetch returned HTTP ${rawRes.status}`);
      }
    } catch (rawErr: any) {
      if (rawErr.message?.startsWith('FILE_NOT_FOUND')) throw rawErr;
      throw new Error(`FAILED_TO_RETRIEVE_SOURCE: Unable to fetch "${cleanPath}" from GitHub (${rawErr.message}).`);
    }
  }

  const isEmpty = content.length === 0;
  let lines = isEmpty ? 0 : content.split(/\r?\n/).length;
  let isTruncated = false;

  // Truncation check for extremely huge files (> 20,000 lines or > 2MB)
  if (lines > 20000) {
    const truncatedLines = content.split(/\r?\n/).slice(0, 20000);
    content = truncatedLines.join('\n') + `\n\n// --- [TRUNCATED] Showing first 20,000 of ${lines} lines for performance ---`;
    isTruncated = true;
  }

  return {
    repositoryId: `${owner}/${repo}`,
    repositoryOwner: owner,
    repositoryName: repo,
    branch,
    filePath: cleanPath,
    blobSha,
    fileSize: size,
    lines,
    content,
    language,
    isBinary: false,
    isEmpty,
    isTruncated,
    retrievalStatus: isTruncated ? 'TRUNCATED' : isEmpty ? 'EMPTY' : 'VERIFIED',
  };
}

/**
 * Filter out sensitive files, environment secrets, and binary blobs from AI context
 */
export function isSensitiveFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  const base = lower.split('/').pop() || lower;

  if (
    base.startsWith('.env') ||
    base === 'credentials.json' ||
    base === 'service-account.json' ||
    base.endsWith('.pem') ||
    base.endsWith('.key') ||
    base.endsWith('.pfx') ||
    base.endsWith('.p12') ||
    base.endsWith('.keystore') ||
    base.includes('id_rsa') ||
    base.includes('id_ed25519') ||
    base.endsWith('.secret') ||
    base.endsWith('.lockb')
  ) {
    return true;
  }

  // Common binary extensions
  const binaryExtensions = [
    '.exe', '.bin', '.dll', '.so', '.dylib', '.png', '.jpg', '.jpeg',
    '.gif', '.webp', '.svg', '.pdf', '.zip', '.tar', '.gz', '.mp4', '.woff', '.woff2'
  ];
  return binaryExtensions.some((ext) => lower.endsWith(ext));
}

/**
 * Create a new Git branch on a GitHub repository
 */
export async function createBranch(
  accessToken: string,
  owner: string,
  repo: string,
  newBranch: string,
  baseBranch = 'main'
): Promise<{ ref: string; sha: string }> {
  // Get latest commit sha of base branch
  const refData = await githubRequest<any>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
    accessToken
  );
  const sha = refData.object?.sha;

  if (!sha) {
    throw new Error(`Failed to retrieve commit SHA for base branch "${baseBranch}".`);
  }

  // Create new reference
  const newRef = await githubRequest<any>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${newBranch}`,
        sha,
      }),
    }
  );

  return { ref: newRef.ref, sha };
}

/**
 * Commit a file change to a specific branch on GitHub
 */
export async function commitFileChange(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  newContent: string,
  commitMessage: string
): Promise<{ commitSha: string; htmlUrl: string }> {
  // Retrieve existing file SHA if the file already exists on this branch
  let fileSha: string | undefined;
  try {
    const existing = await githubRequest<any>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`,
      accessToken
    );
    fileSha = existing.sha;
  } catch {
    // New file being created
  }

  const base64Content = Buffer.from(newContent, 'utf8').toString('base64');

  const result = await githubRequest<any>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(filePath)}`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch,
        ...(fileSha ? { sha: fileSha } : {}),
      }),
    }
  );

  return {
    commitSha: result.commit?.sha,
    htmlUrl: result.commit?.html_url || '',
  };
}

/**
 * Create an official GitHub Pull Request with diagnosis and verification details
 */
export async function createPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  options: {
    title: string;
    head: string;
    base: string;
    body: string;
  }
): Promise<{
  id: number;
  number: number;
  htmlUrl: string;
  title: string;
  state: string;
}> {
  const pr = await githubRequest<any>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        title: options.title,
        head: options.head,
        base: options.base,
        body: options.body,
      }),
    }
  );

  return {
    id: pr.id,
    number: pr.number,
    htmlUrl: pr.html_url,
    title: pr.title,
    state: pr.state,
  };
}
