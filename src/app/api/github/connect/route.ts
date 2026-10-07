import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, setOAuthStateCookie } from '@/lib/server/auth-helpers';
import { generateOAuthState } from '@/lib/server/crypto';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const auth = await getAuthenticatedUser(req);

  if (!auth) {
    return NextResponse.redirect(
      new URL('/?auth_error=Please sign in first before connecting your GitHub account.', origin)
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = `${origin}/api/github/callback`;

  // If credentials are not yet configured, provide mock dev connection
  if (!clientId || clientId === 'your-github-client-id') {
    const devUrl = new URL('/api/auth/dev-mock', origin);
    devUrl.searchParams.set('provider', 'github');
    devUrl.searchParams.set('action', 'connect');
    devUrl.searchParams.set('userId', auth.user.id);
    return NextResponse.redirect(devUrl);
  }

  const state = generateOAuthState({
    provider: 'github',
    action: 'connect',
    userId: auth.user.id,
    origin,
  });

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('scope', 'read:user user:email repo');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  setOAuthStateCookie(response, state);
  return response;
}
