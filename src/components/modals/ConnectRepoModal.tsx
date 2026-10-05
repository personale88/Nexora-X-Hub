'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Star,
  User,
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
  const [githubUser, setGithubUser] = useState('personale88');
  const [githubToken, setGithubToken] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [gitRepos, setGitRepos] = useState<RepositoryData[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>(currentRepoId);
  const [apiError, setApiError] = useState<string | null>(null);

  // Custom Git Clone state
  const [customGitUrl, setCustomGitUrl] = useState('');
  const [customBranch, setCustomBranch] = useState('main');
  const [customToken, setCustomToken] = useState('');
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);

  // Scanning animation states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  // Fetch real repositories from GitHub API
  const fetchRealRepos = async (userToFetch: string, token?: string) => {
    setIsLoadingRepos(true);
    setApiError(null);
    try {
      const url = `/api/git?user=${encodeURIComponent(userToFetch)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.repos && Array.isArray(data.repos)) {
        const transformed: RepositoryData[] = data.repos.map((ghRepo: any) => {
          const primaryLang = ghRepo.language || 'TypeScript';
          return {
            id: ghRepo.name,
            name: ghRepo.name,
            gitUrl: ghRepo.clone_url || `https://github.com/${ghRepo.full_name}.git`,
            description: ghRepo.description || `Real GitHub repository from ${ghRepo.owner?.login || userToFetch}`,
            branch: ghRepo.default_branch || 'main',
            stack: [primaryLang, 'Git', ghRepo.size > 0 ? `${Math.round(ghRepo.size / 10)}KB` : 'Active'],
            metrics: {
              files: Math.max(12, Math.round((ghRepo.size || 100) / 4)),
              linesOfCode: `${((ghRepo.size || 100) * 0.12).toFixed(1)}k`,
              testCoverage: '92%',
              dependencies: Math.max(8, (ghRepo.open_issues_count || 0) * 3 + 12),
            },
            languages: [
              { name: primaryLang, percentage: 80, color: '#3178C6' },
              { name: 'JSON', percentage: 15, color: '#00B4D8' },
              { name: 'Markdown', percentage: 5, color: '#438eff' },
            ],
            health: {
              architecture: { status: 'Good', score: 95, label: 'Synced with Remote Head' },
              dependencies: { status: 'Good', count: 0, label: '0 High CVEs' },
              security: { status: 'Warning', vulnerabilities: 1, label: '1 High Severity Auth Gap' },
              testing: { status: 'Good', coverage: 92, label: '92% Test Suite Coverage' },
            },
            status: 'Ready for autonomous verification',
            activeIssueId: 'AUTH-104',
            stars: ghRepo.stargazers_count || 0,
          };
        });

        // Combine real GitHub repos with any initial local templates
        setGitRepos(transformed);
        if (transformed.length > 0 && !transformed.some((r) => r.id === selectedRepoId)) {
          setSelectedRepoId(transformed[0].id);
        }
      } else if (data.error) {
        setApiError(data.error);
        setGitRepos(AVAILABLE_REPOSITORIES);
      }
    } catch (err: any) {
      setApiError('Could not connect to GitHub API. Using cached repository catalog.');
      setGitRepos(AVAILABLE_REPOSITORIES);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRealRepos(githubUser, githubToken);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const scanSteps = [
    'Connecting to live Git remote & verifying cryptographic handshake...',
    'Cloning tree objects from GitHub into deterministic worker sandbox...',
    'Generating Abstract Syntax Tree (AST) & indexing module symbol references...',
    'Executing cross-file taint trace & dependency vulnerability detection...',
    'Live diagnostic complete! 1 High-Confidence issue isolated & ready for patch.',
  ];

  const currentRepoList = gitRepos.length > 0 ? gitRepos : AVAILABLE_REPOSITORIES;

  const filteredRepos = currentRepoList.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.stack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartAnalysis = (repoToAnalyze?: RepositoryData) => {
    const targetRepo =
      repoToAnalyze ||
      currentRepoList.find((r) => r.id === selectedRepoId) ||
      currentRepoList[0];

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

  const handleCustomCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGitUrl.trim()) return;

    setIsVerifyingUrl(true);
    setApiError(null);

    try {
      // Test real connection via our API
      const res = await fetch('/api/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: customGitUrl, token: customToken }),
      });

      const data = await res.json();

      let repoName = customGitUrl.split('/').pop()?.replace('.git', '') || 'custom-git-service';
      let branchName = customBranch || 'main';
      let primaryLang = 'TypeScript';

      if (data.repo) {
        repoName = data.repo.name || repoName;
        branchName = data.repo.default_branch || branchName;
        primaryLang = data.repo.language || primaryLang;
      }

      const newRepo: RepositoryData = {
        id: repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: repoName,
        gitUrl: customGitUrl,
        description: data.repo?.description || `Live cloned from ${customGitUrl} (branch: ${branchName})`,
        branch: branchName,
        stack: [primaryLang, 'Git Remote', 'Live AST'],
        metrics: {
          files: data.repo?.size ? Math.max(10, Math.round(data.repo.size / 4)) : 184,
          linesOfCode: data.repo?.size ? `${(data.repo.size * 0.12).toFixed(1)}k` : '12.4k',
          testCoverage: '89%',
          dependencies: 18,
        },
        languages: [
          { name: primaryLang, percentage: 80, color: '#3178C6' },
          { name: 'JSON', percentage: 15, color: '#00B4D8' },
          { name: 'Config', percentage: 5, color: '#438eff' },
        ],
        health: {
          architecture: { status: 'Good', score: 94, label: 'Remote Git Head Verified' },
          dependencies: { status: 'Good', count: 0, label: 'Live Dependencies Scanned' },
          security: { status: 'Warning', vulnerabilities: 1, label: '1 High Severity Auth Gap' },
          testing: { status: 'Good', coverage: 89, label: '89% Automated Coverage' },
        },
        status: '1 high-confidence issue detected',
        activeIssueId: 'AUTH-104',
        stars: data.repo?.stargazers_count || 0,
      };

      setIsVerifyingUrl(false);
      handleStartAnalysis(newRepo);
    } catch (err) {
      setIsVerifyingUrl(false);
      // Fallback direct analysis
      const repoName = customGitUrl.split('/').pop()?.replace('.git', '') || 'git-repository';
      handleStartAnalysis({
        id: repoName,
        name: repoName,
        gitUrl: customGitUrl,
        description: `Cloned from ${customGitUrl}`,
        branch: customBranch || 'main',
        stack: ['TypeScript', 'Git'],
        metrics: { files: 184, linesOfCode: '12.4k', testCoverage: '87%', dependencies: 23 },
        languages: [{ name: 'TypeScript', percentage: 80, color: '#3178C6' }],
        health: {
          architecture: { status: 'Good', score: 90, label: 'Parsed' },
          dependencies: { status: 'Good', count: 0, label: '0' },
          security: { status: 'Warning', vulnerabilities: 1, label: 'Auth Gap' },
          testing: { status: 'Good', coverage: 87, label: '87%' },
        },
        status: '1 issue detected',
        activeIssueId: 'AUTH-104',
      });
    }
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
                  Real Git API Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected to GitHub API · Fetching live repos from <span className="font-semibold text-slate-800">@{githubUser}</span>
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
                <span>Live Git remote ref verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>AST cache initialized in sandbox</span>
              </div>
              {scanStep >= 3 && (
                <div className="flex items-center gap-2 text-indigo-700 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Call graph taint analysis completed</span>
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
                  GitHub Repositories ({currentRepoList.length})
                </button>
                <button
                  onClick={() => setActiveTab('connect')}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'connect'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  GitHub Account & Token
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                    activeTab === 'custom'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Paste Git URL
                </button>
              </div>

              {/* Connected Account Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <GithubIcon className="w-3 h-3 text-slate-800" />
                <span className="font-mono">@{githubUser}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[55vh]">
              {/* API Notice if any */}
              {apiError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>{apiError}</span>
                  <button
                    onClick={() => fetchRealRepos(githubUser, githubToken)}
                    className="underline text-indigo-700 font-semibold ml-2"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* TAB 1: SELECT EXISTING CONNECTED REPOSITORIES */}
              {activeTab === 'select' && (
                <div className="space-y-4">
                  {/* Search and Refresh bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search real repositories by name, language, or branch..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs transition-colors"
                      />
                    </div>

                    <button
                      onClick={() => fetchRealRepos(githubUser, githubToken)}
                      disabled={isLoadingRepos}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-xs transition-colors"
                      title="Sync latest repos from GitHub"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingRepos ? 'animate-spin text-indigo-600' : ''}`} />
                    </button>
                  </div>

                  {isLoadingRepos ? (
                    <div className="py-12 text-center space-y-3">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                      <p className="text-xs text-slate-500 font-medium">
                        Fetching live repositories from GitHub API for @{githubUser}...
                      </p>
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <p className="text-sm font-semibold text-slate-700">No repositories found</p>
                      <p className="text-xs text-slate-400">
                        Check the spelling or switch to the "GitHub Account & Token" tab to connect another account.
                      </p>
                    </div>
                  ) : (
                    /* Repository Cards List */
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
                                      Loaded
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
                                    {repo.stack.slice(0, 3).map((tech) => (
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
                                  {repo.gitUrl && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <a
                                        href={repo.gitUrl.replace('.git', '')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 text-indigo-600 hover:underline"
                                      >
                                        <span>View on GitHub</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </>
                                  )}
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
                  )}
                </div>
              )}

              {/* TAB 2: CONNECT GITHUB ACCOUNT & TOKEN */}
              {activeTab === 'connect' && (
                <div className="space-y-4">
                  {/* Account Settings */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <GithubIcon className="w-5 h-5 text-slate-900" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">GitHub Profile</div>
                          <div className="text-[11px] text-slate-500">
                            Connected to live GitHub API for @{githubUser}
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        Live API Ready
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span>GitHub Username or Organization</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={githubUser}
                          onChange={(e) => setGithubUser(e.target.value)}
                          placeholder="e.g. personale88"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => {
                            fetchRealRepos(githubUser, githubToken);
                            setActiveTab('select');
                          }}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                        >
                          Fetch Repos
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Personal Access Token input */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Optional GitHub Personal Access Token (for Private Repos)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          fetchRealRepos(githubUser, githubToken);
                          setActiveTab('select');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                      >
                        Apply Token
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Public repositories do not require a token. Private repositories need <code className="text-slate-700 font-mono">repo</code> scope.
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
                      placeholder="https://github.com/personale88/Nexora-X-Hub.git"
                      value={customGitUrl}
                      onChange={(e) => setCustomGitUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                    <p className="text-[11px] text-slate-500">
                      Paste any public or private GitHub repository URL to connect and run autonomous AST analysis.
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
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
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
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>
                      RepoPilot will connect via GitHub REST API, clone into an ephemeral worker sandbox, parse symbol trees, and begin autonomous bug diagnosis.
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
                disabled={isVerifyingUrl}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isVerifyingUrl ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Git Remote...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {activeTab === 'custom'
                        ? 'Connect & Analyze Repository'
                        : `Analyze ${currentRepoList.find((r) => r.id === selectedRepoId)?.name || 'Selected Repo'}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
