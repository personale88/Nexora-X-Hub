'use client';

import React, { useState } from 'react';
import {
  X,
  GitBranch,
  Search,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  Link2,
  Sparkles,
  ArrowRight,
  Terminal,
  Loader2,
  FolderGit2,
  Key,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AVAILABLE_REPOSITORIES } from '@/lib/mock-data';
import { RepositoryData } from '@/lib/types';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface ConnectRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRepoId: string;
  onSelectRepo: (repo: RepositoryData) => void;
}

export const ConnectRepoModal: React.FC<ConnectRepoModalProps> = ({
  isOpen,
  onClose,
  currentRepoId,
  onSelectRepo,
}) => {
  const [activeTab, setActiveTab] = useState<'select' | 'connect' | 'custom'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string>(currentRepoId);
  const [customGitUrl, setCustomGitUrl] = useState('');
  const [customBranch, setCustomBranch] = useState('main');
  const [customToken, setCustomToken] = useState('');
  const [isGitHubConnected, setIsGitHubConnected] = useState(true);

  // Scanning animation states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  if (!isOpen) return null;

  const scanSteps = [
    'Connecting to Git remote and fetching ref heads...',
    'Cloning commit tree into deterministic isolated sandbox...',
    'Parsing Abstract Syntax Tree (AST) and indexing 180+ symbols...',
    'Evaluating dependency health and cross-module taint call-graph...',
    'Isolating security gap and generating root-cause AST diagnostic...',
  ];

  const filteredRepos = AVAILABLE_REPOSITORIES.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.stack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartAnalysis = (repoToAnalyze?: RepositoryData) => {
    const targetRepo =
      repoToAnalyze ||
      AVAILABLE_REPOSITORIES.find((r) => r.id === selectedRepoId) ||
      AVAILABLE_REPOSITORIES[0];

    setIsAnalyzing(true);
    setScanStep(0);
    setScanProgress(15);

    const stepInterval = setInterval(() => {
      setScanStep((prev) => {
        const next = prev + 1;
        if (next < scanSteps.length) {
          setScanProgress((next + 1) * 20);
          return next;
        } else {
          clearInterval(stepInterval);
          setScanProgress(100);
          setTimeout(() => {
            setIsAnalyzing(false);
            onSelectRepo(targetRepo);
            onClose();
          }, 600);
          return prev;
        }
      });
    }, 550);
  };

  const handleCustomCloneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGitUrl.trim()) return;

    // Create a dynamic repo entry from custom URL
    const repoName = customGitUrl.split('/').pop()?.replace('.git', '') || 'custom-git-service';
    const newRepo: RepositoryData = {
      id: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      name: repoName,
      gitUrl: customGitUrl,
      description: `Cloned from ${customGitUrl} (branch: ${customBranch})`,
      branch: customBranch || 'main',
      stack: ['Node.js', 'TypeScript', 'Express', 'JWT'],
      metrics: {
        files: 184,
        linesOfCode: '14.8k',
        testCoverage: '89%',
        dependencies: 22,
      },
      languages: [
        { name: 'TypeScript', percentage: 76, color: '#3178C6' },
        { name: 'JavaScript', percentage: 16, color: '#F7DF1E' },
        { name: 'JSON', percentage: 8, color: '#00B4D8' },
      ],
      health: {
        architecture: { status: 'Good', score: 92, label: 'Clean Architecture' },
        dependencies: { status: 'Good', count: 0, label: '0 CVEs' },
        security: { status: 'Warning', vulnerabilities: 1, label: '1 Critical Security Gap' },
        testing: { status: 'Good', coverage: 89, label: '89% Coverage' },
      },
      status: '1 high-confidence issue detected',
      activeIssueId: 'AUTH-104',
      stars: 42,
    };

    handleStartAnalysis(newRepo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Select Repository to Analyze
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Git Connected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Choose a repository from your connected Git provider or clone any remote URL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scanning Overlay (Active while AST scanning is executing) */}
        {isAnalyzing ? (
          <div className="p-8 space-y-6 text-center my-auto">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                Running Autonomous AST Analysis
              </h4>
              <p className="text-xs font-mono text-indigo-600 font-semibold min-h-[20px]">
                {scanSteps[scanStep]}
              </p>
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Step {scanStep + 1} of {scanSteps.length}</span>
                <span>{scanProgress}% Completed</span>
              </div>
            </div>

            <div className="p-3 max-w-md mx-auto rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1 font-mono text-slate-600">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Git provider handshake established</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>AST AST-Tree cache allocated in sandbox</span>
              </div>
              {scanStep >= 3 && (
                <div className="flex items-center gap-2 text-indigo-700 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Call graph taint analysis initialized</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('select')}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'select'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Connected Repositories ({AVAILABLE_REPOSITORIES.length})
                </button>
                <button
                  onClick={() => setActiveTab('connect')}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'connect'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Git Providers
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'custom'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Clone Git URL
                </button>
              </div>

              {/* Connected Account Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <GithubIcon className="w-3 h-3 text-slate-800" />
                <span>github.com/acme-corp</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[55vh]">
              {/* TAB 1: SELECT EXISTING CONNECTED REPOSITORIES */}
              {activeTab === 'select' && (
                <div className="space-y-4">
                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search repository by name, stack, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs transition-colors"
                    />
                  </div>

                  {/* Repository Cards List */}
                  <div className="space-y-2.5">
                    {filteredRepos.map((repo) => {
                      const isSelected = selectedRepoId === repo.id;
                      const isCurrentlyActive = currentRepoId === repo.id;

                      return (
                        <div
                          key={repo.id}
                          onClick={() => setSelectedRepoId(repo.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 font-mono">
                                  <span>{repo.name}</span>
                                </div>

                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                  <GitBranch className="w-3 h-3 text-indigo-600" />
                                  <span>{repo.branch}</span>
                                </div>

                                {isCurrentlyActive && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                                    Currently Loaded
                                  </span>
                                )}

                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                  {repo.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-1">
                                {repo.description}
                              </p>

                              {/* Tech Stack & Metrics */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                                <div className="flex items-center gap-1">
                                  {repo.stack.slice(0, 4).map((tech) => (
                                    <span
                                      key={tech}
                                      className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-slate-300">•</span>
                                <span>{repo.metrics.files} files</span>
                                <span className="text-slate-300">•</span>
                                <span>{repo.metrics.linesOfCode} LOC</span>
                              </div>
                            </div>

                            {/* Radio / Selection Indicator */}
                            <div className="pt-1">
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: CONNECT GIT PROVIDERS */}
              {activeTab === 'connect' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <GithubIcon className="w-5 h-5 text-slate-900" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">GitHub</div>
                          <div className="text-[11px] text-slate-500">
                            Connected as @acme-developer (12 repos synced)
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Active Connection
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
                      RepoPilot has read access to repository AST trees and automated branch workflow permissions.
                    </div>
                  </div>

                  {/* Other Git Providers */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitFork className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-bold text-slate-800">GitLab</span>
                      </div>
                      <button
                        onClick={() => alert('GitLab connector ready for configuration.')}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Connect &rarr;
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">Bitbucket</span>
                      </div>
                      <button
                        onClick={() => alert('Bitbucket connector ready for configuration.')}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        Connect &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Personal Access Token fallback */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Connect with Personal Access Token (PAT)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => alert('GitHub Token verified and synchronized!')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                      >
                        Sync
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Requires <code className="text-slate-700">repo:read</code> and <code className="text-slate-700">workflow</code> permissions.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: CLONE CUSTOM GIT URL */}
              {activeTab === 'custom' && (
                <form onSubmit={handleCustomCloneSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Remote Git Repository URL</span>
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/organization/microservice-api.git"
                      value={customGitUrl}
                      onChange={(e) => setCustomGitUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                    <p className="text-[11px] text-slate-500">
                      Supports public repositories or private repositories authenticated above.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Branch / Ref</span>
                      </label>
                      <input
                        type="text"
                        placeholder="main"
                        value={customBranch}
                        onChange={(e) => setCustomBranch(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Auth Token (Optional)</span>
                      </label>
                      <input
                        type="password"
                        placeholder="ghp_..."
                        value={customToken}
                        onChange={(e) => setCustomToken(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      RepoPilot will clone into an ephemeral AST worker sandbox, parse symbol trees, and begin autonomous bug diagnosis.
                    </span>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (activeTab === 'custom') {
                    if (customGitUrl) {
                      handleCustomCloneSubmit({ preventDefault: () => {} } as React.FormEvent);
                    } else {
                      setActiveTab('select');
                    }
                  } else {
                    handleStartAnalysis();
                  }
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {activeTab === 'custom'
                    ? 'Clone & Analyze Repository'
                    : `Analyze ${AVAILABLE_REPOSITORIES.find((r) => r.id === selectedRepoId)?.name || 'Selected Repo'}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
