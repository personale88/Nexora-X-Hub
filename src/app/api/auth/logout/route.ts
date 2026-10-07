import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, clearSessionCookie } from '@/lib/server/auth-helpers';
import { deleteSession } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    deleteSession(sessionToken);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully.',
  });

  clearSessionCookie(response);
  return response;
}
