import fs from 'fs';
import path from 'path';
import { encryptToken, decryptToken, generateSessionToken } from './crypto';

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: 'google' | 'github';
  providerAccountId: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  expiresAt?: number;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string; // sessionToken
  userId: string;
  expiresAt: number;
  createdAt: string;
}

export interface ConnectedGitHubAccount {
  id: string;
  userId: string;
  githubUsername: string;
  githubId: string;
  avatarUrl: string;
  connectedAt: string;
  scope: string;
  lastSyncAt: string;
}

interface DatabaseSchema {
  users: User[];
  oauthAccounts: OAuthAccount[];
  sessions: Session[];
  connectedGitHubAccounts: ConnectedGitHubAccount[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'repopilot_db.json');

// Memory cache of DB for fast zero-latency access
let memoryDb: DatabaseSchema | null = null;

function ensureDbLoaded(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
    } else {
      memoryDb = {
        users: [],
        oauthAccounts: [],
        sessions: [],
        connectedGitHubAccounts: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error loading database, using memory store:', err);
    memoryDb = {
      users: [],
      oauthAccounts: [],
      sessions: [],
      connectedGitHubAccounts: [],
    };
  }

  return memoryDb!;
}

function persistDb(): void {
  if (!memoryDb) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

// ==========================================
// USER OPERATIONS
// ==========================================

export function getUserById(id: string): User | null {
  const db = ensureDbLoaded();
  return db.users.find((u) => u.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  const db = ensureDbLoaded();
  if (!email) return null;
  return db.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

export function createUser(data: { name: string; email: string | null; avatarUrl?: string | null }): User {
  const db = ensureDbLoaded();
  const now = new Date().toISOString();
  const user: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: data.name,
    email: data.email ? data.email.toLowerCase() : null,
    avatarUrl: data.avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(user);
  persistDb();
  return user;
}

export function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
  const db = ensureDbLoaded();
  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  persistDb();
  return db.users[index];
}

// ==========================================
// OAUTH ACCOUNT & IDENTITY LINKING
// ==========================================

export function getOAuthAccount(provider: 'google' | 'github', providerAccountId: string): OAuthAccount | null {
  const db = ensureDbLoaded();
  return (
    db.oauthAccounts.find(
      (acc) => acc.provider === provider && acc.providerAccountId === String(providerAccountId)
    ) || null
  );
}

export function getOAuthAccountsByUserId(userId: string): OAuthAccount[] {
  const db = ensureDbLoaded();
  return db.oauthAccounts.filter((acc) => acc.userId === userId);
}

export function linkOAuthAccount(params: {
  userId: string;
  provider: 'google' | 'github';
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
}): OAuthAccount {
  const db = ensureDbLoaded();
  const now = new Date().toISOString();
  const encryptedAccess = encryptToken(params.accessToken);
  const encryptedRefresh = params.refreshToken ? encryptToken(params.refreshToken) : undefined;

  const existingIndex = db.oauthAccounts.findIndex(
    (acc) => acc.provider === params.provider && acc.providerAccountId === String(params.providerAccountId)
  );

  const account: OAuthAccount = {
    id: existingIndex >= 0 ? db.oauthAccounts[existingIndex].id : `oa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    provider: params.provider,
    providerAccountId: String(params.providerAccountId),
    accessTokenEncrypted: encryptedAccess,
    refreshTokenEncrypted: encryptedRefresh,
    expiresAt: params.expiresAt,
    scope: params.scope,
    createdAt: existingIndex >= 0 ? db.oauthAccounts[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    db.oauthAccounts[existingIndex] = account;
  } else {
    db.oauthAccounts.push(account);
  }

  persistDb();
  return account;
}

export function unlinkOAuthAccount(userId: string, provider: 'google' | 'github'): boolean {
  const db = ensureDbLoaded();
  const initialLen = db.oauthAccounts.length;
  db.oauthAccounts = db.oauthAccounts.filter(
    (acc) => !(acc.userId === userId && acc.provider === provider)
  );
  if (db.oauthAccounts.length !== initialLen) {
    persistDb();
    return true;
  }
  return false;
}

// ==========================================
// SESSION MANAGEMENT (Secure HttpOnly Sessions)
// ==========================================

const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): Session {
  const db = ensureDbLoaded();
  const sessionToken = generateSessionToken();
  const now = new Date().toISOString();
  const session: Session = {
    id: sessionToken,
    userId,
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
    createdAt: now,
  };
  db.sessions.push(session);
  persistDb();
  return session;
}

export function getSession(sessionToken: string): { session: Session; user: User } | null {
  if (!sessionToken) return null;
  const db = ensureDbLoaded();
  const session = db.sessions.find((s) => s.id === sessionToken);
  if (!session) return null;

  // Check expiration
  if (Date.now() > session.expiresAt) {
    deleteSession(sessionToken);
    return null;
  }

  const user = getUserById(session.userId);
  if (!user) {
    deleteSession(sessionToken);
    return null;
  }

  return { session, user };
}

export function deleteSession(sessionToken: string): void {
  const db = ensureDbLoaded();
  db.sessions = db.sessions.filter((s) => s.id !== sessionToken);
  persistDb();
}

export function deleteAllUserSessions(userId: string): void {
  const db = ensureDbLoaded();
  db.sessions = db.sessions.filter((s) => s.userId !== userId);
  persistDb();
}

// ==========================================
// CONNECTED GITHUB ACCOUNT MANAGEMENT
// ==========================================

export function getConnectedGitHubAccount(userId: string): ConnectedGitHubAccount | null {
  const db = ensureDbLoaded();
  return db.connectedGitHubAccounts.find((c) => c.userId === userId) || null;
}

export function saveConnectedGitHubAccount(data: {
  userId: string;
  githubUsername: string;
  githubId: string;
  avatarUrl: string;
  scope: string;
}): ConnectedGitHubAccount {
  const db = ensureDbLoaded();
  const now = new Date().toISOString();
  const existingIdx = db.connectedGitHubAccounts.findIndex((c) => c.userId === data.userId);

  const account: ConnectedGitHubAccount = {
    id: existingIdx >= 0 ? db.connectedGitHubAccounts[existingIdx].id : `cgh_${Date.now()}`,
    userId: data.userId,
    githubUsername: data.githubUsername,
    githubId: String(data.githubId),
    avatarUrl: data.avatarUrl,
    connectedAt: existingIdx >= 0 ? db.connectedGitHubAccounts[existingIdx].connectedAt : now,
    scope: data.scope,
    lastSyncAt: now,
  };

  if (existingIdx >= 0) {
    db.connectedGitHubAccounts[existingIdx] = account;
  } else {
    db.connectedGitHubAccounts.push(account);
  }

  persistDb();
  return account;
}

export function removeConnectedGitHubAccount(userId: string): boolean {
  const db = ensureDbLoaded();
  const initialLen = db.connectedGitHubAccounts.length;
  db.connectedGitHubAccounts = db.connectedGitHubAccounts.filter((c) => c.userId !== userId);
  // Also unlink GitHub OAuth account
  unlinkOAuthAccount(userId, 'github');
  if (db.connectedGitHubAccounts.length !== initialLen) {
    persistDb();
    return true;
  }
  return false;
}

/**
 * Securely retrieve decrypted GitHub access token for a user.
 * Available ONLY on the server side; never sent to frontend.
 */
export function getGitHubAccessToken(userId: string): string | null {
  const db = ensureDbLoaded();
  const account = db.oauthAccounts.find(
    (acc) => acc.userId === userId && acc.provider === 'github'
  );
  if (!account || !account.accessTokenEncrypted) return null;
  return decryptToken(account.accessTokenEncrypted);
}
