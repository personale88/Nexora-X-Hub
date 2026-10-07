import { NextRequest, NextResponse } from 'next/server';
import {
  createUser,
  getUserByEmail,
  linkOAuthAccount,
  createSession,
  saveConnectedGitHubAccount,
} from '@/lib/server/db';
import { setSessionCookie } from '@/lib/server/auth-helpers';

/**
 * Development Helper Route:
 * When OAuth credentials (GOOGLE_CLIENT_ID or GITHUB_CLIENT_ID) are not configured,
 * this endpoint provides a clean UI explaining the required setup and allows
 * instant local dev session simulation without breaking the application flow.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams;
  const provider = searchParams.get('provider') || 'google';
  const action = searchParams.get('action') || 'login';
  const userId = searchParams.get('userId');

  // If simulate query is passed, immediately create real session in database
  if (searchParams.get('simulate') === 'true') {
    const isGoogle = provider === 'google';

    const testUser = {
      name: isGoogle ? 'Demo Engineer (Google)' : 'personale88',
      email: isGoogle ? 'developer@example.com' : 'personale88@users.noreply.github.com',
      avatarUrl: isGoogle
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://avatars.githubusercontent.com/u/214250353?v=4',
    };

    if (action === 'connect' && userId) {
      // Connect GitHub to existing user
      linkOAuthAccount({
        userId,
        provider: 'github',
        providerAccountId: '214250353',
        accessToken: 'gho_dev_simulated_token_at_rest',
        scope: 'read:user user:email repo',
      });

      saveConnectedGitHubAccount({
        userId,
        githubUsername: 'personale88',
        githubId: '214250353',
        avatarUrl: 'https://avatars.githubusercontent.com/u/214250353?v=4',
        scope: 'read:user user:email repo',
      });

      return NextResponse.redirect(new URL('/?github_connected=true', origin));
    }

    let user = testUser.email ? getUserByEmail(testUser.email) : null;
    if (!user) {
      user = createUser(testUser);
    }

    linkOAuthAccount({
      userId: user.id,
      provider: isGoogle ? 'google' : 'github',
      providerAccountId: isGoogle ? 'google_sim_123' : '214250353',
      accessToken: 'oauth_simulated_token_at_rest',
      scope: isGoogle ? 'openid profile email' : 'read:user user:email repo',
    });

    if (!isGoogle) {
      saveConnectedGitHubAccount({
        userId: user.id,
        githubUsername: 'personale88',
        githubId: '214250353',
        avatarUrl: testUser.avatarUrl,
        scope: 'read:user user:email repo',
      });
    }

    const session = createSession(user.id);
    const response = NextResponse.redirect(new URL('/', origin));
    setSessionCookie(response, session.id);
    return response;
  }

  // Render clean informational page explaining setup
  const providerName = provider === 'google' ? 'Google OAuth' : 'GitHub OAuth';
  const callbackUrl = provider === 'google'
    ? `${origin}/api/auth/callback/google`
    : `${origin}/api/auth/callback/github`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RepoPilot AI — OAuth Setup Guide</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 flex items-center justify-center min-h-screen p-6 font-sans">
  <div class="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
        RP
      </div>
      <div>
        <h1 class="text-xl font-bold text-slate-900">${providerName} Setup Required</h1>
        <p class="text-xs text-slate-500">Configure your OAuth app credentials in .env.local</p>
      </div>
    </div>

    <div class="space-y-4 text-xs text-slate-600 leading-relaxed mb-6">
      <div class="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900">
        <p class="font-semibold mb-1">To connect real ${providerName}:</p>
        <p>1. Register an OAuth application in your ${provider === 'google' ? 'Google Cloud Console' : 'GitHub Developer Settings'}.</p>
        <p>2. Set the Authorization Callback URL to:</p>
        <code class="block bg-white p-2 rounded mt-1.5 border border-indigo-200 font-mono text-slate-800 break-all select-all">${callbackUrl}</code>
        <p class="mt-2">3. Add client credentials to your <code>.env.local</code> file:</p>
        <pre class="bg-slate-900 text-slate-100 p-2.5 rounded mt-1 font-mono text-[11px] overflow-x-auto">${provider === 'google' ? 'GOOGLE_CLIENT_ID=your-id\nGOOGLE_CLIENT_SECRET=your-secret' : 'GITHUB_CLIENT_ID=your-id\nGITHUB_CLIENT_SECRET=your-secret'}</pre>
      </div>

      <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start gap-2">
        <span class="font-bold text-emerald-600">✓</span>
        <span>Local Development Mode: You can simulate a successful ${providerName} callback to verify the full dashboard and repository integration immediately.</span>
      </div>
    </div>

    <div class="flex items-center gap-3 pt-2">
      <a href="/api/auth/dev-mock?provider=${provider}&action=${action}&userId=${userId || ''}&simulate=true"
         class="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl text-center shadow-md transition-all">
        Simulate ${providerName} Login (Local Dev)
      </a>
      <a href="/"
         class="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl text-center transition-all">
        Back to App
      </a>
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
