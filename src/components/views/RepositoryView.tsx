'use client';

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Layers,
  FileJson,
  FolderGit2,
  Zap,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { ACTIVE_REPO, REPO_FILE_TREE, PRIMARY_ISSUE } from '@/lib/mock-data';
import { FileNode, NavTab, RepositoryData } from '@/lib/types';

interface RepositoryViewProps {
  onNavigate: (tab: NavTab) => void;
  onInvestigateIssue: () => void;
  currentRepo?: RepositoryData;
  onOpenRepoModal?: () => void;
  onStartLiveFix?: () => void;
}

function pathsToFileNodes(paths: string[]): FileNode[] {
  const root: FileNode[] = [];
  for (const filePath of paths) {
    const parts = filePath.split('/');
    let currentLevel = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existing = currentLevel.find((n) => n.name === part);
      if (existing) {
        if (!isFile && existing.children) {
          currentLevel = existing.children;
        }
      } else {
        const ext = part.split('.').pop() || '';
        const newNode: FileNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          language: isFile ? ext : undefined,
          content: undefined,
          children: isFile ? undefined : [],
        };
        currentLevel.push(newNode);
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }
  return root;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  onNavigate,
  onInvestigateIssue,
  currentRepo = ACTIVE_REPO,
  onOpenRepoModal,
  onStartLiveFix,
}) => {
  const isDemoRepo = currentRepo?.name === 'commerce-api' || currentRepo?.name === 'sample-vulnerable-repo';

  const activeTree = React.useMemo(() => {
    if (currentRepo?.fileTree && currentRepo.fileTree.length > 0) {
      return pathsToFileNodes(currentRepo.fileTree);
    }
    return isDemoRepo ? REPO_FILE_TREE : [];
  }, [currentRepo?.name, currentRepo?.fileTree, isDemoRepo]);

  const [selectedFile, setSelectedFile] = useState<FileNode>(() => {
    if (isDemoRepo) {
      const src = REPO_FILE_TREE.find((n) => n.name === 'src');
      const middleware = src?.children?.find((n) => n.name === 'middleware');
      const authFile = middleware?.children?.find((n) => n.name === 'auth.ts');
      return authFile || REPO_FILE_TREE[0];
    }
    return {
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      content: undefined,
    };
  });

  const [fileDetails, setFileDetails] = useState<{
    filePath: string;
    content: string;
    blobSha?: string;
    fileSize?: number;
    lines?: number;
    language?: string;
    isBinary?: boolean;
    isEmpty?: boolean;
    isTruncated?: boolean;
    retrievalStatus?: string;
  } | null>(null);
  const [isFileLoading, setIsFileLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileCacheRef = React.useRef<Map<string, any>>(new Map());
  const abortCtrlRef = React.useRef<AbortController | null>(null);
  const activeReqRef = React.useRef<string | null>(null);

  const fetchSourceFile = React.useCallback(async (filePath: string) => {
    if (!filePath) return;

    // For demo repo commerce-api / sample-vulnerable-repo, use predefined source if present
    if (isDemoRepo && selectedFile?.content) {
      setFileDetails({
        filePath,
        content: selectedFile.content,
        lines: selectedFile.content.split('\n').length,
        fileSize: selectedFile.content.length,
        language: selectedFile.language || 'typescript',
        retrievalStatus: 'VERIFIED',
      });
      setFileError(null);
      setIsFileLoading(false);
      return;
    }

    const repoOwner = currentRepo?.owner;
    const repoName = currentRepo?.name;
    const branch = currentRepo?.branch || 'main';

    if (!repoOwner || !repoName) {
      setFileError('Repository owner and name are required.');
      return;
    }

    const requestKey = `${repoOwner}/${repoName}:${branch}:${filePath}`;
    activeReqRef.current = requestKey;

    if (fileCacheRef.current.has(requestKey)) {
      setFileDetails(fileCacheRef.current.get(requestKey));
      setFileError(null);
      setIsFileLoading(false);
      return;
    }

    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }
    const controller = new AbortController();
    abortCtrlRef.current = controller;

    setIsFileLoading(true);
    setFileError(null);

    try {
      const url = `/api/github/file?owner=${encodeURIComponent(repoOwner)}&repo=${encodeURIComponent(repoName)}&path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branch)}`;
      const res = await fetch(url, { signal: controller.signal });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status} error fetching source code.`);
      }

      // Check that response matches the active requested file to prevent race conditions
      if (activeReqRef.current !== requestKey) {
        return;
      }

      if (data.success && data.file) {
        fileCacheRef.current.set(requestKey, data.file);
        setFileDetails(data.file);
        setFileError(null);
      } else {
        throw new Error('Invalid file response from server.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      if (activeReqRef.current !== requestKey) return;
      setFileError(err.message || 'Failed to retrieve file from GitHub.');
      setFileDetails(null);
    } finally {
      if (activeReqRef.current === requestKey) {
        setIsFileLoading(false);
      }
    }
  }, [currentRepo?.owner, currentRepo?.name, currentRepo?.branch, isDemoRepo, selectedFile?.content, selectedFile?.language]);

  React.useEffect(() => {
    if (selectedFile?.path && selectedFile.type === 'file') {
      fetchSourceFile(selectedFile.path);
    }
  }, [selectedFile?.path, fetchSourceFile]);

  // When repository changes, clear cache and reset
  React.useEffect(() => {
    fileCacheRef.current.clear();
    setFileDetails(null);
    setFileError(null);
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }
  }, [currentRepo?.id, currentRepo?.name, currentRepo?.owner]);

  const handleCopy = () => {
    if (fileDetails?.content) {
      navigator.clipboard.writeText(fileDetails.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  React.useEffect(() => {
    if (activeTree.length > 0) {
      const findFirstFile = (nodes: FileNode[]): FileNode | null => {
        for (const n of nodes) {
          if (n.type === 'file') return n;
          if (n.children) {
            const f = findFirstFile(n.children);
            if (f) return f;
          }
        }
        return null;
      };
      const first = findFirstFile(activeTree);
      if (first) setSelectedFile(first);
    }
  }, [activeTree]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
    'src/middleware': true,
    'src/controllers': false,
    'src/services': false,
    'src/routes': false,
    'src/utils': false,
    tests: false,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === 'folder';
      const isExpanded = expandedFolders[node.path];
      const isSelected = selectedFile?.path === node.path;

      if (isFolder) {
        return (
          <div key={node.path} className="select-none">
            <div
              onClick={() => toggleFolder(node.path)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer text-xs font-medium text-slate-700 transition-colors"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span className="font-mono">{node.name}/</span>
            </div>

            {isExpanded && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          onClick={() => setSelectedFile(node)}
          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs font-mono transition-all ${isSelected
              ? 'bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          style={{ paddingLeft: `${depth * 14 + 14}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            {node.language === 'json' ? (
              <FileJson className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            ) : node.language === 'markdown' ? (
              <FileText className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {node.hasIssue && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-xs" title="Issue Detected" />
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title & Metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Repository Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">AST v4.1 Synced</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {currentRepo.name}
          </h1>
          <p className="text-sm text-slate-600">
            {currentRepo.description}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {onOpenRepoModal && (
            <button
              onClick={onOpenRepoModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs shadow-xs transition-colors"
              title="Switch repository or connect Git"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Switch / Connect Git</span>
            </button>
          )}

          <button
            onClick={onInvestigateIssue}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Investigate {currentRepo.activeIssueId || 'Issue'} with AI</span>
          </button>
        </div>
      </div>

      {/* Languages & Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Languages Breakdown */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Languages
            </span>
            <span className="text-xs text-slate-400">{currentRepo.languages.length} detected</span>
          </div>

          {/* Color stacked bar */}
          <div className="h-3 w-full rounded-full overflow-hidden flex gap-1 mb-4 bg-slate-100">
            {currentRepo.languages.map((lang) => (
              <div
                key={lang.name}
                style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                className="h-full rounded-full"
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>

          <div className="space-y-2">
            {currentRepo.languages.map((lang) => (
              <div key={lang.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: lang.color }}
                  />
                  <span className="text-slate-800 font-medium">{lang.name}</span>
                </div>
                <span className="font-mono text-slate-500">{lang.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Health */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Code Health
            </span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Automated Audit Completed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Architecture */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 mb-1">Architecture</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-900">{currentRepo.health.architecture.status}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {currentRepo.health.architecture.label}
              </div>
            </div>

            {/* Dependencies */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 mb-1">Dependencies</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-900">{currentRepo.health.dependencies.status}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {currentRepo.health.dependencies.label}
              </div>
            </div>

            {/* Security */}
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200">
              <div className="text-[11px] text-rose-700 font-semibold mb-1">Security</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-sm font-bold text-rose-700">{currentRepo.health.security.status}</span>
              </div>
              <div className="text-[10px] text-rose-600 mt-1 truncate">
                {currentRepo.health.security.label}
              </div>
            </div>

            {/* Testing */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 mb-1">Testing</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-900">{currentRepo.health.testing.status}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {currentRepo.health.testing.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI DETECTED ISSUE CALLOUT (Highlight Box) */}
      {!isDemoRepo && !currentRepo?.activeIssueId ? (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Repository Clean
                </span>
                <span className="text-xs text-slate-500 font-mono">No Confirmed Issues Found</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {currentRepo.name} has no confirmed vulnerabilities
              </h3>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Source tree indexed ({currentRepo.metrics.files} files). No active JWT bugs or security flaws detected. Run an autonomous deep scan to inspect code and tests.
              </p>
            </div>
            <button
              onClick={onInvestigateIssue}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Run Autonomous Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-50/90 via-white to-indigo-50/60 border-2 border-rose-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                  AI DETECTED ISSUE
                </span>
                <span className="text-xs font-mono font-bold bg-rose-100 border border-rose-300 px-2 py-0.5 rounded text-rose-800">
                  {PRIMARY_ISSUE.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Severity: {PRIMARY_ISSUE.severity}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Confidence: {PRIMARY_ISSUE.confidence}%
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {PRIMARY_ISSUE.title}
              </h3>

              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                {PRIMARY_ISSUE.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono pt-1">
                <span>Affected file:</span>
                <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {PRIMARY_ISSUE.affectedFile} ({PRIMARY_ISSUE.lines})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => {
                  if (onStartLiveFix) {
                    onStartLiveFix();
                  } else {
                    onNavigate('live-fix');
                  }
                }}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-4 h-4 text-cyan-300" />
                <span>Watch Live Fix &amp; Learn</span>
              </button>

              <button
                onClick={onInvestigateIssue}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Investigate Issue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Tree & Code Preview Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tree Column */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Repository Structure
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{currentRepo.metrics.files} files</span>
          </div>

          <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
            {renderTree(activeTree)}
          </div>
        </div>

        {/* Code Preview Column */}
        <div className="lg:col-span-8 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-slate-800 ml-1 font-semibold truncate max-w-[280px]" title={selectedFile?.path}>
                {selectedFile?.path || 'No file selected'}
              </span>

              {fileDetails?.blobSha && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded" title={`Git Blob SHA: ${fileDetails.blobSha}`}>
                  SHA: {fileDetails.blobSha.slice(0, 7)}
                </span>
              )}

              {fileDetails && !fileDetails.isBinary && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {fileDetails.lines} lines · {fileDetails.fileSize && fileDetails.fileSize >= 1024 ? `${(fileDetails.fileSize / 1024).toFixed(1)} KB` : `${fileDetails.fileSize || 0} B`}
                </span>
              )}

              {fileDetails?.language && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {fileDetails.language}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {fileDetails?.content && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                  title="Copy full file source code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[11px]">Copy Source</span>
                    </>
                  )}
                </button>
              )}

              {isDemoRepo && selectedFile?.hasIssue && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    AUTH-104 Vulnerability Detected Here
                  </span>
                  <button
                    onClick={() => onNavigate('live-fix')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                  >
                    <Zap className="w-3 h-3 text-cyan-300" />
                    <span>Fix Live</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 font-mono text-xs overflow-x-auto text-slate-800 bg-[#fafafa] leading-relaxed max-h-[520px] overflow-y-auto min-h-[320px]">
            {isFileLoading ? (
              <div className="py-28 text-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  Retrieving source code from GitHub...
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  {currentRepo.owner}/{currentRepo.name}@{currentRepo.branch || 'main'} • {selectedFile?.path}
                </p>
              </div>
            ) : fileError ? (
              <div className="py-20 px-4 text-center space-y-3 bg-rose-50/50 rounded-xl border border-rose-100">
                <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
                <h4 className="text-xs font-bold text-rose-900">Failed to Retrieve Source Code</h4>
                <p className="text-xs text-rose-700 max-w-md mx-auto font-mono">
                  {fileError}
                </p>
                <button
                  onClick={() => selectedFile?.path && fetchSourceFile(selectedFile.path)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
                >
                  Retry Retrieval
                </button>
              </div>
            ) : fileDetails?.isBinary ? (
              <div className="py-24 text-center space-y-2 text-slate-500">
                <FileCode className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Binary Asset Detected</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedFile?.path} cannot be displayed in text editor ({fileDetails.fileSize} bytes).
                </p>
              </div>
            ) : fileDetails?.isEmpty ? (
              <div className="py-24 text-center space-y-2 text-slate-400">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">This file is empty (0 lines, 0 bytes).</p>
              </div>
            ) : fileDetails?.content !== undefined && fileDetails?.content !== null ? (
              <div>
                {fileDetails.isTruncated && (
                  <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Large file notice: Truncated for editor performance (showing first 20,000 lines).</span>
                  </div>
                )}
                <pre className="space-y-0.5">
                  {fileDetails.content.split('\n').map((line, idx) => {
                    const lineNum = idx + 1;
                    const isBugLine = isDemoRepo && selectedFile?.hasIssue && lineNum >= 18 && lineNum <= 24;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-4 px-2 py-0.5 rounded ${isBugLine
                            ? 'bg-rose-100/80 text-rose-950 border-l-4 border-rose-500 font-medium'
                            : 'hover:bg-slate-200/50'
                          }`}
                      >
                        <span className="text-slate-400 select-none w-8 text-right shrink-0 font-mono text-[11px]">
                          {lineNum}
                        </span>
                        <span className="whitespace-pre font-mono text-[12px]">{line}</span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            ) : (
              <div className="text-slate-400 italic py-20 text-center">
                Select a file from the repository tree to preview contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
