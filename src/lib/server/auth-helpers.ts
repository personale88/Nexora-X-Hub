import { NextRequest, NextResponse } from 'next/server';
import { getSession, User, Session, getConnectedGitHubAccount, ConnectedGitHubAccount, getOAuthAccountsByUserId } from './db';

export const SESSION_COOKIE_NAME = 'repopilot_session';
export const OAUTH_STATE_COOKIE_NAME = 'repopilot_oauth_state';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Retrieve the current authenticated user and session from request cookies.
 */
export async function getAuthenticatedUser(
  req: NextRequest
): Promise<{ user: User; session: Session; connectedGitHub: ConnectedGitHubAccount | null } | null> {
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const result = getSession(sessionToken);
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
 */
export function setSessionCookie(res: NextResponse, sessionToken: string): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
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
