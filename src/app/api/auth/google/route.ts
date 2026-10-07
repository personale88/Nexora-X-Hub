import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthState } from '@/lib/server/crypto';
import { setOAuthStateCookie } from '@/lib/server/auth-helpers';

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${origin}/api/auth/callback/google`;

  const state = generateOAuthState({ provider: 'google', action: 'login', origin });

  // If Google OAuth credentials are not yet configured, show a helpful developer guide
  if (!clientId || clientId === 'your-google-client-id') {
    const devUrl = new URL('/api/auth/dev-mock', origin);
    devUrl.searchParams.set('provider', 'google');
    devUrl.searchParams.set('reason', 'GOOGLE_CREDENTIALS_MISSING');
    return NextResponse.redirect(devUrl);
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authUrl.toString());
  setOAuthStateCookie(response, state);
  return response;
}
