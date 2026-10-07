import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState } from '@/lib/server/crypto';
import { setOAuthStateCookie } from '@/lib/server/auth-helpers';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL || `${origin}/api/auth/callback/github`;

  const state = generateOAuthState({ provider: 'github', action: 'login', origin });

  // If GitHub OAuth credentials are not yet configured, show dev setup option
  if (!clientId || clientId === 'your-github-client-id') {
    const devUrl = new URL('/api/auth/dev-mock', origin);
    devUrl.searchParams.set('provider', 'github');
    devUrl.searchParams.set('reason', 'GITHUB_CREDENTIALS_MISSING');
    return NextResponse.redirect(devUrl);
  }

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('scope', 'read:user user:email repo');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  setOAuthStateCookie(response, state);
  return response;
}
