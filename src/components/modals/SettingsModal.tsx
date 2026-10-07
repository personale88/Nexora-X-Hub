'use client';

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Key,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Link2,
  Unlink,
} from 'lucide-react';
import { aiEngine } from '@/lib/ai-engine';
import { useAuth } from '@/lib/auth-context';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  initialTab?: 'engine' | 'connected_accounts';
}

// Google SVG Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

// GitHub SVG Icon
const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
  initialTab = 'engine',
}) => {
  const { user, connectGitHub, disconnectGitHub } = useAuth();
  const [activeTab, setActiveTab] = useState<'engine' | 'connected_accounts'>(initialTab);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const status = aiEngine.getStatus();

  if (!isOpen) return null;

  const isGoogleConnected = Boolean(user?.connectedAccounts?.google?.connected);
  const isGitHubConnected = Boolean(user?.connectedAccounts?.github?.connected);
  const ghAccount = user?.connectedAccounts?.github;

  const handleSaveApiKey = () => {
    aiEngine.setApiKey(apiKeyInput);
    onUpdated();
    onClose();
  };

  const handleResetToDemo = () => {
    aiEngine.resetToDemo();
    setApiKeyInput('');
    onUpdated();
    onClose();
  };

  const handleConfirmDisconnect = async () => {
    setIsDisconnecting(true);
    await disconnectGitHub();
    setIsDisconnecting(false);
    setShowDisconnectConfirm(false);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <h3 className="text-base font-bold text-slate-900">Settings</h3>
            <p className="text-[11px] text-slate-500">Configure AI engine runtime & OAuth connected accounts</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/50 px-6 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('engine')}
            className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'engine'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('connected_accounts')}
            className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'connected_accounts'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Connected Accounts</span>
            {isGitHubConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Tab 1: AI Engine Configuration */}
        {activeTab === 'engine' && (
          <div className="p-6 space-y-5">
            {/* Active Mode Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Runtime
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {status.label}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-900">
                {status.model}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Configured with deterministic test trees and simulated compiler sandbox. Guaranteed 100% uptime for hackathon demo presentations with zero API key dependencies.
              </p>
            </div>

            {/* Optional API Key Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Optional LLM API Key (OpenAI / Anthropic / Gemini)</span>
              </label>
              <input
                type="password"
                placeholder="sk-... (Optional: Leave empty for default Demo Engine)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
              <p className="text-[11px] text-slate-500">
                *The demo will never break if an API key is missing. It defaults to the instant zero-failure engine.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <button
                onClick={handleResetToDemo}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Demo Engine</span>
              </button>

              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Connected Accounts */}
        {activeTab === 'connected_accounts' && (
          <div className="p-6 space-y-6">
            {/* Google Account Row */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Google</h4>
                      {isGoogleConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ● Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Not Connected</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {isGoogleConnected
                        ? user?.email || 'Connected via Google Single Sign-On'
                        : 'Sign in with Google to enable verified developer identity.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Account Row */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-2xs">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">GitHub</h4>
                      {isGitHubConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ● Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          ○ Disconnected
                        </span>
                      )}
                    </div>

                    {isGitHubConnected ? (
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2 pt-1">
                          {ghAccount?.avatarUrl && (
                            <img
                              src={ghAccount.avatarUrl}
                              alt={ghAccount.username || ''}
                              className="w-5 h-5 rounded-full ring-1 ring-slate-200"
                            />
                          )}
                          <span className="font-semibold text-slate-900 font-mono">
                            @{ghAccount?.username}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                          <div>
                            Connected on:{' '}
                            <span className="font-medium text-slate-700">
                              {ghAccount?.connectedAt
                                ? new Date(ghAccount.connectedAt).toLocaleDateString()
                                : 'Recent session'}
                            </span>
                          </div>
                          <div>
                            Repository access status:{' '}
                            <span className="font-semibold text-indigo-700">
                              Read & Write Authorized
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Connect your GitHub account to access your repositories, branch trees, and AST analysis.
                      </p>
                    )}
                  </div>
                </div>

                {/* Connect / Disconnect Buttons */}
                <div>
                  {isGitHubConnected ? (
                    <button
                      onClick={() => setShowDisconnectConfirm(true)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect GitHub</span>
                    </button>
                  ) : (
                    <button
                      onClick={connectGitHub}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>Connect GitHub</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Explanatory Disconnection Prompt as explicitly requested */}
              {showDisconnectConfirm && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Important:</span>
                      <span>
                        Disconnecting GitHub will revoke RepoPilot's authorization to inspect authorized repositories. Active repository analysis requires a connected GitHub account.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end pt-1">
                    <button
                      onClick={() => setShowDisconnectConfirm(false)}
                      className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-amber-100/60 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDisconnect}
                      disabled={isDisconnecting}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isDisconnecting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Confirm Disconnect</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Least-Privilege & Privacy Guarantee */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                RepoPilot operates on least privilege: access tokens are encrypted with AES-256-GCM at rest and never exposed to the frontend.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
