import fs from 'fs';
import path from 'path';
import { encryptToken, decryptToken, generateSessionToken } from './crypto';
import { RepairJob, RepairEvent } from '../types';

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
  repairJobs: RepairJob[];
  repairEvents: RepairEvent[];
}

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', '.data') : path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'repopilot_db.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), '.data', 'repopilot_db.json');

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
    } else if (fs.existsSync(BUNDLED_DB_FILE)) {
      const content = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
      // Persist to writable directory
      try {
        fs.writeFileSync(DB_FILE, content, 'utf-8');
      } catch (e) {
        // Ignore write error if read-only
      }
    } else {
      memoryDb = {
        users: [],
        oauthAccounts: [],
        sessions: [],
        connectedGitHubAccounts: [],
        repairJobs: [],
        repairEvents: [],
      };
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
      } catch (e) {
        // In-memory fallback
      }
    }

    // Migration safety for existing DB files
    if (memoryDb) {
      if (!memoryDb.repairJobs) memoryDb.repairJobs = [];
      if (!memoryDb.repairEvents) memoryDb.repairEvents = [];
    }
  } catch (err) {
    console.error('Error loading database, using memory store:', err);
    memoryDb = {
      users: [],
      oauthAccounts: [],
      sessions: [],
      connectedGitHubAccounts: [],
      repairJobs: [],
      repairEvents: [],
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

export function rehydrateSession(payload: {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  sessionToken: string;
  expiresAt: number;
  githubAccount?: {
    githubUsername: string;
    githubId: string;
    avatarUrl: string;
    scope: string;
    accessTokenEncrypted?: string;
  };
}): { user: User; session: Session; connectedGitHub: ConnectedGitHubAccount | null } {
  const db = ensureDbLoaded();
  let user = db.users.find((u) => u.id === payload.userId);
  if (!user) {
    user = {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      avatarUrl: payload.avatarUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(user);
  } else {
    if (payload.name) user.name = payload.name;
    if (payload.email) user.email = payload.email;
    if (payload.avatarUrl) user.avatarUrl = payload.avatarUrl;
  }

  let session = db.sessions.find((s) => s.id === payload.sessionToken);
  if (!session) {
    session = {
      id: payload.sessionToken,
      userId: payload.userId,
      expiresAt: payload.expiresAt,
      createdAt: new Date().toISOString(),
    };
    db.sessions.push(session);
  } else {
    session.expiresAt = payload.expiresAt;
  }

  let connectedGitHub: ConnectedGitHubAccount | null = null;
  if (payload.githubAccount) {
    connectedGitHub = db.connectedGitHubAccounts.find((c) => c.userId === payload.userId) || null;
    if (!connectedGitHub) {
      connectedGitHub = {
        id: `cgh_${Date.now()}`,
        userId: payload.userId,
        githubUsername: payload.githubAccount.githubUsername,
        githubId: payload.githubAccount.githubId,
        avatarUrl: payload.githubAccount.avatarUrl,
        connectedAt: new Date().toISOString(),
        scope: payload.githubAccount.scope,
        lastSyncAt: new Date().toISOString(),
      };
      db.connectedGitHubAccounts.push(connectedGitHub);
    }

    // Rehydrate OAuth account with encrypted access token
    if (payload.githubAccount.accessTokenEncrypted) {
      let oauthAcc = db.oauthAccounts.find((a) => a.userId === payload.userId && a.provider === 'github');
      if (!oauthAcc) {
        db.oauthAccounts.push({
          id: `oa_gh_${payload.userId}`,
          userId: payload.userId,
          provider: 'github',
          providerAccountId: payload.githubAccount.githubId,
          accessTokenEncrypted: payload.githubAccount.accessTokenEncrypted,
          scope: payload.githubAccount.scope,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        oauthAcc.accessTokenEncrypted = payload.githubAccount.accessTokenEncrypted;
      }
    }
  } else {
    connectedGitHub = db.connectedGitHubAccounts.find((c) => c.userId === payload.userId) || null;
  }

  persistDb();
  return { user, session, connectedGitHub };
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

// ==========================================
// AUTONOMOUS REPAIR JOB & EVENT OPERATIONS
// ==========================================

export function createRepairJob(data: {
  id?: string;
  userId: string;
  repository: RepairJob['repository'];
  issueDescription: string;
  issueCode?: string;
  reproductionEvidence?: string;
  maxRetries?: number;
}): RepairJob {
  const db = ensureDbLoaded();
  const now = new Date().toISOString();
  const jobId = data.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const job: RepairJob = {
    id: jobId,
    userId: data.userId,
    repository: data.repository,
    issueDescription: data.issueDescription,
    issueCode: data.issueCode,
    reproductionEvidence: data.reproductionEvidence,
    status: 'QUEUED',
    currentStage: 'Queued for autonomous investigation',
    testRuns: [],
    retryCount: 0,
    maxRetries: data.maxRetries ?? 3,
    verificationOutcome: 'INCOMPLETE',
    unresolvedRisks: [],
    createdAt: now,
    updatedAt: now,
  };

  db.repairJobs.unshift(job);
  persistDb();

  // Record initial event
  appendRepairEvent(jobId, {
    stage: 'QUEUED',
    type: 'repair.started',
    message: `Repair job initialized for ${data.repository.owner}/${data.repository.name}@${data.repository.pinnedCommitSha.substring(0, 7)}`,
    payload: {
      repository: `${data.repository.owner}/${data.repository.name}`,
      branch: data.repository.branch,
      commitSha: data.repository.pinnedCommitSha,
      issueCode: data.issueCode,
    },
  });

  return job;
}

export function getRepairJob(id: string): RepairJob | null {
  const db = ensureDbLoaded();
  return db.repairJobs.find((j) => j.id === id) || null;
}

export function getRepairJobsByUserId(userId: string): RepairJob[] {
  const db = ensureDbLoaded();
  return db.repairJobs.filter((j) => j.userId === userId);
}

export function updateRepairJob(
  id: string,
  updates: Partial<Omit<RepairJob, 'id' | 'userId' | 'createdAt'>>
): RepairJob | null {
  const db = ensureDbLoaded();
  const index = db.repairJobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  db.repairJobs[index] = {
    ...db.repairJobs[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  persistDb();
  return db.repairJobs[index];
}

export function appendRepairEvent(
  jobId: string,
  eventData: {
    type: string;
    stage: string;
    message: string;
    payload?: Record<string, unknown>;
  }
): RepairEvent {
  const db = ensureDbLoaded();
  const now = new Date().toISOString();

  // Determine next sequence for this job
  const existingJobEvents = db.repairEvents.filter((e) => e.jobId === jobId);
  const nextSequence = existingJobEvents.length + 1;
  const eventId = `evt_${jobId}_${nextSequence}_${Math.random().toString(36).substring(2, 6)}`;

  const event: RepairEvent = {
    eventId,
    jobId,
    sequence: nextSequence,
    type: eventData.type,
    timestamp: now,
    stage: eventData.stage,
    message: eventData.message,
    payload: eventData.payload,
  };

  db.repairEvents.push(event);
  persistDb();
  return event;
}

export function getRepairEvents(jobId: string, afterSequence: number = 0): RepairEvent[] {
  const db = ensureDbLoaded();
  return db.repairEvents
    .filter((e) => e.jobId === jobId && e.sequence > afterSequence)
    .sort((a, b) => a.sequence - b.sequence);
}

export function deleteRepairJob(id: string): boolean {
  const db = ensureDbLoaded();
  const initJobLen = db.repairJobs.length;
  db.repairJobs = db.repairJobs.filter((j) => j.id !== id);
  db.repairEvents = db.repairEvents.filter((e) => e.jobId !== id);
  if (db.repairJobs.length !== initJobLen) {
    persistDb();
    return true;
  }
  return false;
}

