import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, sanitizeUserForClient } from '@/lib/server/auth-helpers';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);

  if (!auth) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }

  const sanitized = sanitizeUserForClient(auth.user, auth.connectedGitHub);

  return NextResponse.json({
    authenticated: true,
    user: sanitized,
  });
}
