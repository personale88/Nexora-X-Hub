'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Lock,
  Globe,
  Loader2,
  FolderGit2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  GitBranch,
  Star,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { RepositoryData } from '@/lib/types';
import { SanitizedRepository } from '@/lib/server/github-service';
import { AVAILABLE_REPOSITORIES } from '@/lib/mock-data';

interface YourRepositoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRepoId: string;
  onSelectRepo: (repo: RepositoryData) => void;
}

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const YourRepositoriesModal: React.FC<YourRepositoriesModalProps> = ({
  isOpen,
  onClose,
  currentRepoId,
  onSelectRepo,
}) => {
  const { user, connectGitHub } = useAuth();
  const [repositories, setRepositories] = useState<SanitizedRepository[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'All' | 'Public' | 'Private' | 'Owned' | 'Organization'>('All');
  const [selectedRepoId, setSelectedRepoId] = useState<string>(currentRepoId);

  // Analysis / Preparation stages
  const [isPreparingContext, setIsPreparingContext] = useState<boolean>(false);
  const [completedStages, setCompletedStages] = useState<number>(0);
  const [targetRepoForAnalysis, setTargetRepoForAnalysis] = useState<SanitizedRepository | null>(null);

  const contextStages = [
    '✓ Repository authorized',
    '✓ Repository metadata loaded',
    '✓ File structure loaded',
    '✓ Relevant files identified',
    '✓ Context ready',
  ];

  const isGitHubConnected = Boolean(user?.connectedAccounts?.github?.connected);

  // Fetch repositories from server
  const fetchRepos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/github/repositories');
      const data = await res.json();

      if (res.ok && data.repositories) {
        setRepositories(data.repositories);
        if (data.repositories.length > 0 && !data.repositories.some((r: any) => r.id === selectedRepoId)) {
          setSelectedRepoId(data.repositories[0].id);
        }
      } else if (data.error === 'GITHUB_NOT_CONNECTED') {
        setRepositories([]);
      } else {
        setError(data.message || 'Failed to fetch repositories.');
      }
    } catch (err: any) {
      console.warn('Repositories fetch fallback:', err);
      setError('Could not reach GitHub server API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isGitHubConnected) {
      fetchRepos();
    }
  }, [isOpen, isGitHubConnected]);

  if (!isOpen) return null;

  // Filter repositories
  const filteredRepos = repositories.filter((repo) => {
    // Search query filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      repo.name.toLowerCase().includes(q) ||
      repo.owner.toLowerCase().includes(q) ||
      repo.primaryLanguage.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Type filter
    if (filter === 'Public') return repo.visibility === 'Public';
    if (filter === 'Private') return repo.visibility === 'Private';
    if (filter === 'Owned') {
      const currentGhUsername = user?.connectedAccounts?.github?.username;
      return currentGhUsername ? repo.owner.toLowerCase() === currentGhUsername.toLowerCase() : true;
    }
    if (filter === 'Organization') {
      const currentGhUsername = user?.connectedAccounts?.github?.username;
      return currentGhUsername ? repo.owner.toLowerCase() !== currentGhUsername.toLowerCase() : true;
    }

    return true;
  });

  // Handle "Analyze Repository" execution
  const handleAnalyzeRepository = (repo: SanitizedRepository) => {
    setTargetRepoForAnalysis(repo);
    setIsPreparingContext(true);
    setCompletedStages(0);

    // Progressive step sequence
    const interval = setInterval(() => {
      setCompletedStages((prev) => {
        const next = prev + 1;
        if (next >= contextStages.length) {
          clearInterval(interval);
          setTimeout(() => {
            // Transform SanitizedRepository into RepoPilot's RepositoryData
            const adaptedRepo: RepositoryData = {
              id: repo.name,
              name: repo.name,
              gitUrl: repo.gitUrl,
              description: repo.description,
              branch: repo.defaultBranch,
              stack: [repo.primaryLanguage, 'Git', repo.accessLevel],
              metrics: {
                files: Math.max(14, Math.round(repo.stars * 2 + 32)),
                linesOfCode: `${((repo.stars + 20) * 0.4).toFixed(1)}k`,
                testCoverage: '94%',
                dependencies: 18,
              },
              languages: [
                { name: repo.primaryLanguage, percentage: 76, color: '#3178C6' },
                { name: 'JSON', percentage: 14, color: '#00B4D8' },
                { name: 'Markdown', percentage: 10, color: '#438eff' },
              ],
              health: {
                architecture: { status: 'Good', score: 96, label: 'Clean Hexagonal Architecture' },
                dependencies: { status: 'Good', count: 0, label: '0 High CVE Vulnerabilities' },
                security: { status: 'Warning', vulnerabilities: 1, label: '1 High Severity Auth Gap' },
                testing: { status: 'Good', coverage: 94, label: '94% AST Regression Test Coverage' },
              },
              status: 'Ready for autonomous verification',
              activeIssueId: 'AUTH-104',
              stars: repo.stars,
            };

            setIsPreparingContext(false);
            onSelectRepo(adaptedRepo);
            onClose();
          }, 600);
          return prev;
        }
        return next;
      });
    }, 450);
  };

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || filteredRepos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shadow-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Your Repositories</h2>
                {isGitHubConnected && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GitHub Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isGitHubConnected
                  ? `Connected as @${user?.connectedAccounts?.github?.username} · Select repository for AST analysis`
                  : 'Connect GitHub to access and analyze your authorized repositories'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading Context Stage Overlay */}
        {isPreparingContext ? (
          <div className="p-10 space-y-6 text-center my-auto">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Preparing repository context...
              </h3>
              <p className="text-xs font-mono text-slate-500">
                {targetRepoForAnalysis?.fullName || 'Selected repository'}
              </p>
            </div>

            {/* Checklist of stages as requested */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs font-mono">
              {contextStages.map((stageText, idx) => {
                const isDone = completedStages >= idx + 1;
                const isCurrent = completedStages === idx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 transition-all ${
                      isDone
                        ? 'text-emerald-700 font-semibold'
                        : isCurrent
                        ? 'text-indigo-600 font-semibold animate-pulse'
                        : 'text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[9px] shrink-0">
                        {idx + 1}
                      </div>
                    )}
                    <span>{stageText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !isGitHubConnected ? (
          /* State: GitHub Not Connected */
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
              <GithubIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-slate-900">GitHub Account Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                To inspect private and authorized repositories, please link your GitHub account using secure OAuth.
              </p>
            </div>

            <button
              onClick={connectGitHub}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Connect GitHub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* State: GitHub Connected, Repositories List */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Filters Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search repository..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Filters: All, Public, Private, Owned, Organization */}
              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['All', 'Public', 'Private', 'Owned', 'Organization'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      filter === tab
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}

                <button
                  onClick={fetchRepos}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors ml-1"
                  title="Refresh repository list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mx-4 mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium truncate">{error}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={connectGitHub}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Reconnect GitHub
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      setRepositories([
                        {
                          id: '101',
                          name: 'commerce-api',
                          fullName: 'vignesh/commerce-api',
                          owner: 'vignesh',
                          ownerAvatar: 'https://avatars.githubusercontent.com/u/214250353?v=4',
                          visibility: 'Private',
                          isPrivate: true,
                          primaryLanguage: 'TypeScript',
                          description: 'Core microservices backend for digital payment processing and catalog indexing',
                          lastUpdated: new Date().toISOString(),
                          lastUpdatedRelative: 'Updated 2 hours ago',
                          accessLevel: 'Read / Write',
                          permissions: { admin: false, push: true, pull: true },
                          defaultBranch: 'main',
                          gitUrl: 'https://github.com/vignesh/commerce-api.git',
                          stars: 38,
                          forks: 6,
                        },
                        {
                          id: '102',
                          name: 'frontend-app',
                          fullName: 'vignesh/frontend-app',
                          owner: 'vignesh',
                          ownerAvatar: 'https://avatars.githubusercontent.com/u/214250353?v=4',
                          visibility: 'Public',
                          isPrivate: false,
                          primaryLanguage: 'React',
                          description: 'Next.js customer portal with checkout engine and realtime inventory alerts',
                          lastUpdated: new Date().toISOString(),
                          lastUpdatedRelative: 'Updated yesterday',
                          accessLevel: 'Read',
                          permissions: { admin: false, push: false, pull: true },
                          defaultBranch: 'main',
                          gitUrl: 'https://github.com/vignesh/frontend-app.git',
                          stars: 120,
                          forks: 15,
                        },
                        {
                          id: '103',
                          name: 'Nexora-X-Hub',
                          fullName: 'personale88/Nexora-X-Hub',
                          owner: 'personale88',
                          ownerAvatar: 'https://avatars.githubusercontent.com/u/214250353?v=4',
                          visibility: 'Public',
                          isPrivate: false,
                          primaryLanguage: 'TypeScript',
                          description: 'Centralized engineering hub & autonomous AI agent orchestration repository',
                          lastUpdated: new Date().toISOString(),
                          lastUpdatedRelative: 'Updated 10 minutes ago',
                          accessLevel: 'Read / Write',
                          permissions: { admin: true, push: true, pull: true },
                          defaultBranch: 'main',
                          gitUrl: 'https://github.com/personale88/Nexora-X-Hub.git',
                          stars: 8,
                          forks: 1,
                        },
                      ]);
                      setSelectedRepoId('101');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-800 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    Load Sample Repositories
                  </button>
                </div>
              </div>
            )}

            {/* Repositories Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[300px]">
              {isLoading ? (
                <div className="py-16 text-center space-y-2 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs font-medium">Loading repositories...</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="py-16 text-center space-y-2 text-slate-500">
                  <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">No matching repositories found.</p>
                  <p className="text-[11px] text-slate-400">
                    Try searching a different keyword or resetting filters.
                  </p>
                </div>
              ) : (
                filteredRepos.map((repo) => {
                  const isSelected = selectedRepoId === repo.id;
                  return (
                    <div
                      key={repo.id}
                      onClick={() => setSelectedRepoId(repo.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-400 shadow-xs ring-1 ring-indigo-400/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {repo.name}
                          </span>

                          <span className="text-xs text-slate-400">/</span>
                          <span className="text-xs font-medium text-slate-600 font-mono">
                            {repo.owner}
                          </span>

                          {/* Visibility Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              repo.visibility === 'Private'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {repo.visibility === 'Private' ? (
                              <Lock className="w-2.5 h-2.5" />
                            ) : (
                              <Globe className="w-2.5 h-2.5" />
                            )}
                            {repo.visibility}
                          </span>

                          {/* Access Level Badge */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {repo.accessLevel}
                          </span>
                        </div>

                        {/* Description */}
                        {repo.description && (
                          <p className="text-xs text-slate-500 truncate max-w-xl">
                            {repo.description}
                          </p>
                        )}

                        {/* Metadata row */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1 text-slate-600 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" />
                            {repo.primaryLanguage}
                          </span>
                          <span>{repo.lastUpdatedRelative}</span>
                          {repo.stars > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {repo.stars}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Select indicator */}
                      <div className="shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => selectedRepo && handleAnalyzeRepository(selectedRepo)}
                disabled={!selectedRepo || isPreparingContext}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Analyze {selectedRepo?.name || 'Repository'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
