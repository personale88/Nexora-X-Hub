'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  GitBranch,
  Settings,
  Code2,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { RepositoryData } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

interface TopNavbarProps {
  onStartGuidedTour?: () => void;
  openSettings: (tab?: 'engine' | 'connected_accounts') => void;
  onOpenRepoModal?: () => void;
  currentRepo?: RepositoryData;
  isTouring?: boolean;
}

// Mini SVGs for providers
const MiniGoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const MiniGithubIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const TopNavbar: React.FC<TopNavbarProps> = ({
  openSettings,
  onOpenRepoModal,
  currentRepo,
}) => {
  const { user, isAuthenticated, logout, connectGitHub } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const repoName = currentRepo?.name || 'Nexora-X-Hub';
  const repoBranch = currentRepo?.branch || 'main';

  const isGitHubConnected = Boolean(user?.connectedAccounts?.github?.connected);
  const ghUsername = user?.connectedAccounts?.github?.username;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Repo selector pill (Clickable to switch / connect repo) */}
        <button
          onClick={onOpenRepoModal}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-medium text-slate-800 transition-all shadow-2xs cursor-pointer"
          title="Click to switch repository or view authorized repositories"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
          <span className="font-semibold text-slate-900 group-hover:text-indigo-700">{repoName}</span>
          <span className="text-slate-400">/</span>
          <div className="flex items-center gap-1 text-slate-600 group-hover:text-indigo-600">
            <GitBranch className="w-3 h-3 text-indigo-600" />
            <span>{repoBranch}</span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 ml-0.5 transition-transform group-hover:translate-y-0.5" />
        </button>

        {/* Tagline */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium border-l border-slate-200 pl-4">
          <span className="text-indigo-600 font-semibold">RepoPilot:</span>
          <span>From bug report to verified fix.</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Hackathon Track Badge */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Code2 className="w-3 h-3 text-indigo-600" />
          <span>iQOO Hackathon · Developer Tools</span>
        </div>

        {/* Account Menu as specified in Requirements */}
        {isAuthenticated && user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
            >
              {/* User Avatar with provider overlay */}
              <div className="relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Provider micro icon */}
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white shadow-2xs flex items-center justify-center border border-slate-200">
                  {user.providers.includes('google') ? (
                    <MiniGoogleIcon className="w-2.5 h-2.5" />
                  ) : (
                    <MiniGithubIcon className="w-2.5 h-2.5 text-slate-900" />
                  )}
                </div>
              </div>

              <span className="font-semibold text-slate-900 text-xs max-w-[120px] truncate">
                {user.name}
              </span>

              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {/* Account Menu Dropdown matching specification */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                {/* User Summary */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-xs text-slate-900 truncate">{user.name}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                  {user.email && (
                    <div className="text-[11px] text-slate-500 truncate font-mono">
                      {user.email}
                    </div>
                  )}
                </div>

                <div className="p-1 space-y-0.5 text-xs text-slate-700">
                  {/* 1. Profile */}
                  <div className="px-3 py-2 text-slate-500 font-medium flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Profile</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">
                      {user.id}
                    </span>
                  </div>

                  {/* 2. Connected Accounts */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openSettings('connected_accounts');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left font-medium cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Connected Accounts</span>
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold">View</span>
                  </button>

                  {/* 3. GitHub Status */}
                  <div className="px-3 py-2 flex items-center justify-between rounded-lg bg-slate-50/60 border border-slate-100">
                    <span className="flex items-center gap-2 text-slate-800 font-medium">
                      <MiniGithubIcon className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </span>

                    {isGitHubConnected ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          connectGitHub();
                        }}
                        className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 cursor-pointer"
                      >
                        + Connect
                      </button>
                    )}
                  </div>

                  {/* 4. Settings */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openSettings('engine');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left font-medium cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600" />
                    <span>Settings</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  {/* 5. Sign Out */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Settings button */}
        <button
          onClick={() => openSettings('engine')}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
          title="Settings & AI Engine Configuration"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
