'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  Code2,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

// Official SVG for Google
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// Official SVG for GitHub
const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const LoginLandingView: React.FC = () => {
  const { loginWithGoogle, loginWithGitHub } = useAuth();
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'github' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Read any OAuth error query parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('auth_error') || params.get('github_error');
      if (err) setAuthError(err);
    }
  }, []);

  const handleGoogleClick = () => {
    setConnectingProvider('google');
    loginWithGoogle();
  };

  const handleGitHubClick = () => {
    setConnectingProvider('github');
    loginWithGitHub();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Simple Header */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-slate-900">RepoPilot</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Lock className="w-3.5 h-3.5 text-indigo-600" />
          <span>OAuth 2.0 Secure Session</span>
        </div>
      </header>

      {/* Main Authentication Hero Container */}
      <main className="flex-1 flex items-center justify-center p-6 my-auto">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/50 space-y-8 animate-in fade-in duration-300">
          {/* Logo & Headline */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>RepoPilot AI</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your AI software engineer.
            </h1>

            <p className="text-sm text-slate-500 font-normal leading-relaxed max-w-sm mx-auto">
              Understand repositories. Fix bugs. Verify the solution.
            </p>
          </div>

          {/* Error Banner if any */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Authentication notice</span>
                <span>{authError}</span>
              </div>
            </div>
          )}

          {/* Authentication Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Continue with Google */}
            <button
              onClick={handleGoogleClick}
              disabled={connectingProvider !== null}
              className="w-full h-12 flex items-center justify-center gap-3 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer disabled:opacity-60 group"
            >
              {connectingProvider === 'google' ? (
                <>
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-slate-600">Connecting securely...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Clean Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-semibold absolute">
                OR
              </span>
            </div>

            {/* Continue with GitHub */}
            <button
              onClick={handleGitHubClick}
              disabled={connectingProvider !== null}
              className="w-full h-12 flex items-center justify-center gap-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md shadow-slate-900/10 hover:shadow-slate-900/20 transition-all cursor-pointer disabled:opacity-60 group"
            >
              {connectingProvider === 'github' ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Connecting GitHub...</span>
                </>
              ) : (
                <>
                  <GithubIcon className="w-5 h-5 text-white group-hover:scale-105 transition-transform" />
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Security & Least-Privilege Trust Badge */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted OAuth token exchange · Zero secrets in browser</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-6 md:px-12 flex items-center justify-between text-xs text-slate-400 border-t border-slate-200/80 bg-white/60">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>RepoPilot AI · Developer Tools</span>
        </div>
        <div>
          <span>Privacy & Security Compliant</span>
        </div>
      </footer>
    </div>
  );
};
