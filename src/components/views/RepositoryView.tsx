'use client';

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Layers,
  FileJson,
  FolderGit2,
} from 'lucide-react';
import { ACTIVE_REPO, REPO_FILE_TREE, PRIMARY_ISSUE } from '@/lib/mock-data';
import { FileNode, NavTab, RepositoryData } from '@/lib/types';

interface RepositoryViewProps {
  onNavigate: (tab: NavTab) => void;
  onInvestigateIssue: () => void;
  currentRepo?: RepositoryData;
  onOpenRepoModal?: () => void;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  onInvestigateIssue,
  currentRepo = ACTIVE_REPO,
  onOpenRepoModal,
}) => {
  const [selectedFile, setSelectedFile] = useState<FileNode>(() => {
    // Default select auth.ts
    const src = REPO_FILE_TREE.find((n) => n.name === 'src');
    const middleware = src?.children?.find((n) => n.name === 'middleware');
    const authFile = middleware?.children?.find((n) => n.name === 'auth.ts');
    return authFile || REPO_FILE_TREE[0];
  });

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
          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs font-mono transition-all ${
            isSelected
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

          <button
            onClick={onInvestigateIssue}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Investigate with AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

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
            {renderTree(REPO_FILE_TREE)}
          </div>
        </div>

        {/* Code Preview Column */}
        <div className="lg:col-span-8 rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-slate-800 ml-2 font-semibold">
                {selectedFile?.path || 'src/middleware/auth.ts'}
              </span>
            </div>

            {selectedFile?.hasIssue && (
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                AUTH-104 Vulnerability Detected Here
              </span>
            )}
          </div>

          <div className="p-4 font-mono text-xs overflow-x-auto text-slate-800 bg-[#fafafa] leading-relaxed max-h-[420px]">
            {selectedFile?.content ? (
              <pre className="space-y-0.5">
                {selectedFile.content.split('\n').map((line, idx) => {
                  const lineNum = idx + 1;
                  const isBugLine = selectedFile.hasIssue && lineNum >= 18 && lineNum <= 24;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-4 px-2 py-0.5 rounded ${
                        isBugLine
                          ? 'bg-rose-100/80 text-rose-950 border-l-4 border-rose-500 font-medium'
                          : 'hover:bg-slate-200/50'
                      }`}
                    >
                      <span className="text-slate-400 select-none w-6 text-right shrink-0">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre">{line}</span>
                    </div>
                  );
                })}
              </pre>
            ) : (
              <div className="text-slate-400 italic py-8 text-center">
                Select a file from the repository tree to preview contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
