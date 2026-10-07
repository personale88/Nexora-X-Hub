import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState } from '@/lib/server/crypto';
import {
  OAUTH_STATE_COOKIE_NAME,
  setSessionCookie,
  clearOAuthStateCookie,
} from '@/lib/server/auth-helpers';
import {
  getUserByEmail,
  getOAuthAccount,
  createUser,
  updateUser,
  linkOAuthAccount,
  createSession,
} from '@/lib/server/db';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user cancellation or denial
  if (error) {
    console.warn('Google OAuth error from provider:', error);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('Google authentication was cancelled or denied.')}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('Missing OAuth authorization code or state.')}`, origin)
    );
  }

  // 1. Verify CSRF State
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const stateVerification = verifyOAuthState(state);

  if (!stateVerification.valid || (cookieState && cookieState !== state)) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('Invalid or expired OAuth state session. Please try again.')}`, origin)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${origin}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent('Google OAuth is not configured on the server.')}`, origin)
    );
  }

  try {
    // 2. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google token exchange error:', errText);
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent('Failed to exchange Google OAuth code.')}`, origin)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    // 3. Fetch user profile from Google UserInfo
    const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent('Failed to fetch Google profile information.')}`, origin)
      );
    }

    const googleUser = await userInfoRes.json();
    const googleId = googleUser.sub;
    const email = googleUser.email;
    const name = googleUser.name || email.split('@')[0];
    const avatarUrl = googleUser.picture;

    // 4. Safe user account creation or linking
    let user = null;

    // Check if OAuthAccount already exists
    const existingOAuth = getOAuthAccount('google', googleId);
    if (existingOAuth) {
      const { getUserById } = await import('@/lib/server/db');
      user = getUserById(existingOAuth.userId);
    }

    // Otherwise check by verified email
    if (!user && email) {
      user = getUserByEmail(email);
    }

    // Otherwise create new user
    if (!user) {
      user = createUser({
        name,
        email,
        avatarUrl,
      });
    } else {
      // Update avatar or name if missing
      updateUser(user.id, {
        name: user.name || name,
        avatarUrl: user.avatarUrl || avatarUrl,
      });
    }

    // 5. Link Google OAuth credentials
    linkOAuthAccount({
      userId: user.id,
      provider: 'google',
      providerAccountId: googleId,
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
      scope: 'openid profile email',
    });

    // 6. Create authenticated session
    const session = createSession(user.id);

    // 7. Set secure session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/', origin));
    setSessionCookie(response, session.id);
    clearOAuthStateCookie(response);
    return response;
  } catch (err: any) {
    console.error('Google OAuth Callback exception:', err);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(err.message || 'Authentication error')}`, origin)
    );
  }
}
