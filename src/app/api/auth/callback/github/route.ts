import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '@/lib/server/crypto';
import {
  OAUTH_STATE_COOKIE_NAME,
  setSessionCookie,
  clearOAuthStateCookie,
} from '@/lib/server/auth-helpers';
import {
  getUserByEmail,
  getUserById,
  getOAuthAccount,
  createUser,
  updateUser,
  linkOAuthAccount,
  createSession,
  saveConnectedGitHubAccount,
} from '@/lib/server/db';
import { getGitHubUser } from '@/lib/server/github-service';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.warn('GitHub OAuth authorization error:', error);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('GitHub authorization was denied or cancelled.')}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('Missing OAuth code or state parameter.')}`, origin)
    );
  }

  // 1. Verify CSRF state
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const stateVerification = verifyOAuthState(state);

  if (!stateVerification.valid || (cookieState && cookieState !== state)) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('Invalid or expired OAuth state session. Please try again.')}`, origin)
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${origin}/api/auth/callback/github`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('GitHub OAuth credentials are not configured on the server.')}`, origin)
    );
  }

  try {
    // 2. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent('Failed to exchange GitHub authorization code.')}`, origin)
      );
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(tokenData.error_description || 'GitHub OAuth token error')}`, origin)
      );
    }

    const accessToken = tokenData.access_token;
    const scope = tokenData.scope || 'read:user user:email repo';

    // 3. Fetch user profile from GitHub API
    const ghUser = await getGitHubUser(accessToken);

    // Retrieve verified primary email if not public in profile
    let primaryEmail = ghUser.email;
    if (!primaryEmail) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'RepoPilot-Autonomous-Dev-Agent',
          },
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          const primary = emails.find((e: any) => e.primary && e.verified);
          if (primary) primaryEmail = primary.email;
        }
      } catch (e) {
        console.warn('Could not fetch GitHub user emails', e);
      }
    }

    // 4. Find or create User
    let user = null;
    const existingOAuth = getOAuthAccount('github', String(ghUser.id));

    if (existingOAuth) {
      user = getUserById(existingOAuth.userId);
    }

    if (!user && primaryEmail) {
      user = getUserByEmail(primaryEmail);
    }

    if (!user) {
      user = createUser({
        name: ghUser.name || ghUser.login,
        email: primaryEmail,
        avatarUrl: ghUser.avatarUrl,
      });
    } else {
      updateUser(user.id, {
        name: user.name || ghUser.name || ghUser.login,
        avatarUrl: user.avatarUrl || ghUser.avatarUrl,
      });
    }

    // 5. Link GitHub OAuth credentials
    linkOAuthAccount({
      userId: user.id,
      provider: 'github',
      providerAccountId: String(ghUser.id),
      accessToken,
      scope,
    });

    // 6. Connect GitHub Account for repository access
    saveConnectedGitHubAccount({
      userId: user.id,
      githubUsername: ghUser.login,
      githubId: String(ghUser.id),
      avatarUrl: ghUser.avatarUrl,
      scope,
    });

    // 7. Create Session
    const session = createSession(user.id);

    // 8. Set session cookie and redirect
    const response = NextResponse.redirect(new URL('/', origin));
    setSessionCookie(response, session.id);
    clearOAuthStateCookie(response);
    return response;
  } catch (err: any) {
    console.error('GitHub OAuth Callback exception:', err);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(err.message || 'Authentication error')}`, origin)
    );
  }
}
