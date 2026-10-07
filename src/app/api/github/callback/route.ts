import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '@/lib/server/crypto';
import {
  OAUTH_STATE_COOKIE_NAME,
  getAuthenticatedUser,
  clearOAuthStateCookie,
} from '@/lib/server/auth-helpers';
import {
  linkOAuthAccount,
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
    return NextResponse.redirect(
      new URL(`/?github_error=${encodeURIComponent('GitHub authorization was denied. You can reconnect your account from Settings.')}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/?github_error=${encodeURIComponent('Missing OAuth authorization code.')}`, origin)
    );
  }

  // 1. Verify CSRF State
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const stateVerification = verifyOAuthState(state);

  if (!stateVerification.valid || (cookieState && cookieState !== state)) {
    return NextResponse.redirect(
      new URL(`/?github_error=${encodeURIComponent('Invalid or expired OAuth state session.')}`, origin)
    );
  }

  // 2. Ensure current authenticated user matches state
  const auth = await getAuthenticatedUser(req);
  const targetUserId = stateVerification.data?.userId || auth?.user.id;

  if (!targetUserId) {
    return NextResponse.redirect(
      new URL(`/?github_error=${encodeURIComponent('Session expired. Please sign in again.')}`, origin)
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = `${origin}/api/github/callback`;

  try {
    // 3. Exchange code for access token
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
        new URL(`/?github_error=${encodeURIComponent('Failed to exchange GitHub authorization code.')}`, origin)
      );
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/?github_error=${encodeURIComponent(tokenData.error_description || 'GitHub error')}`, origin)
      );
    }

    const accessToken = tokenData.access_token;
    const scope = tokenData.scope || 'read:user user:email repo';

    // 4. Fetch GitHub user metadata
    const ghUser = await getGitHubUser(accessToken);

    // 5. Link GitHub OAuth identity to the active user
    linkOAuthAccount({
      userId: targetUserId,
      provider: 'github',
      providerAccountId: String(ghUser.id),
      accessToken,
      scope,
    });

    // 6. Save ConnectedGitHubAccount for repository queries
    saveConnectedGitHubAccount({
      userId: targetUserId,
      githubUsername: ghUser.login,
      githubId: String(ghUser.id),
      avatarUrl: ghUser.avatarUrl,
      scope,
    });

    const response = NextResponse.redirect(new URL('/?github_connected=true', origin));
    clearOAuthStateCookie(response);
    return response;
  } catch (err: any) {
    console.error('GitHub connect callback error:', err);
    return NextResponse.redirect(
      new URL(`/?github_error=${encodeURIComponent(err.message || 'Failed to connect GitHub account.')}`, origin)
    );
  }
}
