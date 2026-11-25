import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  User,
  Session,
  getConnectedGitHubAccount,
  ConnectedGitHubAccount,
  getOAuthAccountsByUserId,
  rehydrateSession,
  getUserById,
} from './db';
import { encryptToken, decryptToken } from './crypto';

export const SESSION_COOKIE_NAME = 'repopilot_session';
export const OAUTH_STATE_COOKIE_NAME = 'repopilot_oauth_state';

const isProduction = process.env.NODE_ENV === 'production';

export interface EncryptedSessionPayload {
  sessionToken: string;
  userId: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  expiresAt: number;
  githubAccount?: {
    githubUsername: string;
    githubId: string;
    avatarUrl: string;
    scope: string;
  };
}

/**
 * Retrieve the current authenticated user and session from request cookies.
 * Supports self-contained encrypted stateless session tokens with automatic
 * database re-hydration across serverless Vercel lambda instances.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<{ user: User; session: Session; connectedGitHub: ConnectedGitHubAccount | null } | null> {
  const cookieValue = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  // 1. Try to decrypt as self-contained stateless session payload
  try {
    const decrypted = decryptToken(cookieValue);
    if (decrypted) {
      const payload: EncryptedSessionPayload = JSON.parse(decrypted);
      if (payload && payload.userId && payload.sessionToken && payload.expiresAt && Date.now() < payload.expiresAt) {
        return rehydrateSession(payload);
      }
    }
  } catch (err) {
    // Not an encrypted payload or decryption failed; fallback to raw db lookup below
  }

  // 2. Direct database session lookup (fallback for raw tokens or development)
  const result = getSession(cookieValue);
  if (!result) return null;

  const connectedGitHub = getConnectedGitHubAccount(result.user.id);

  return {
    user: result.user,
    session: result.session,
    connectedGitHub,
  };
}

/**
 * Enforce authentication on API route; returns 401 response if unauthenticated.
 */
export async function requireAuth(
  req: NextRequest
): Promise<
  | { user: User; session: Session; connectedGitHub: ConnectedGitHubAccount | null; errorResponse?: never }
  | { user?: never; session?: never; connectedGitHub?: never; errorResponse: NextResponse }
> {
  const auth = await getAuthenticatedUser(req);
  if (!auth) {
    return {
      errorResponse: NextResponse.json(
        { error: 'UNAUTHORIZED: Please sign in to access this resource.' },
        { status: 401 }
      ),
    };
  }
  return auth;
}

/**
 * Attach secure HttpOnly session cookie to response.
 * Automatically wraps user & session into an AES-256-GCM encrypted stateless payload
 * so authentication is 100% persistent across page refreshes and serverless lambdas.
 */
export function setSessionCookie(
  res: NextResponse,
  sessionToken: string,
  user?: User | null,
  connectedGitHub?: ConnectedGitHubAccount | null
): void {
  let cookieVal = sessionToken;

  // Look up user if not provided directly
  const resolvedUser = user || (getSession(sessionToken)?.user ?? null);
  const resolvedGh = connectedGitHub !== undefined ? connectedGitHub : (resolvedUser ? getConnectedGitHubAccount(resolvedUser.id) : null);

  if (resolvedUser) {
    const payload: EncryptedSessionPayload = {
      sessionToken,
      userId: resolvedUser.id,
      email: resolvedUser.email,
      name: resolvedUser.name,
      avatarUrl: resolvedUser.avatarUrl,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      githubAccount: resolvedGh
        ? {
            githubUsername: resolvedGh.githubUsername,
            githubId: resolvedGh.githubId,
            avatarUrl: resolvedGh.avatarUrl,
            scope: resolvedGh.scope,
          }
        : undefined,
    };
    cookieVal = encryptToken(JSON.stringify(payload));
  }

  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: cookieVal,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clear session cookie on logout.
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Set secure CSRF OAuth state cookie.
 */
export function setOAuthStateCookie(res: NextResponse, state: string): void {
  res.cookies.set({
    name: OAUTH_STATE_COOKIE_NAME,
    value: state,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });
}

/**
 * Clear OAuth state cookie.
 */
export function clearOAuthStateCookie(res: NextResponse): void {
  res.cookies.set({
    name: OAUTH_STATE_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Sanitize user object for frontend consumption.
 * Never leaks token or password data.
 */
export function sanitizeUserForClient(user: User, connectedGitHub: ConnectedGitHubAccount | null) {
  const oauthAccounts = getOAuthAccountsByUserId(user.id);
  const providers = oauthAccounts.map((a) => a.provider);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    providers,
    connectedAccounts: {
      google: {
        connected: providers.includes('google'),
        email: user.email,
      },
      github: {
        connected: Boolean(connectedGitHub),
        username: connectedGitHub?.githubUsername || null,
        avatarUrl: connectedGitHub?.avatarUrl || null,
        connectedAt: connectedGitHub?.connectedAt || null,
        scope: connectedGitHub?.scope || null,
      },
    },
  };
}
