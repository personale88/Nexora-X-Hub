import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth-helpers';
import { removeConnectedGitHubAccount } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const success = removeConnectedGitHubAccount(auth.user.id);

  return NextResponse.json({
    success,
    message: success
      ? 'GitHub account disconnected successfully.'
      : 'No active GitHub account found to disconnect.',
  });
}
