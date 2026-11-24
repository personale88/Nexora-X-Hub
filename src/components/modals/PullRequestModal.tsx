'use client';

import React from 'react';
import {
  X,
  GitPullRequest,
  ShieldCheck,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface PullRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: () => void;
  pullRequest?: {
    number: number;
    htmlUrl: string;
    branch: string;
    title?: string;
  } | null;
  isCreating?: boolean;
  error?: string | null;
}

export const PullRequestModal: React.FC<PullRequestModalProps> = ({
  isOpen,
  onClose,
  onViewHistory,
  pullRequest,
  isCreating = false,
  error = null,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isCreating ? 'Creating Pull Request...' : error ? 'Pull Request Failed' : 'Pull Request Created'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {pullRequest ? `#${pullRequest.number} opened just now by RepoPilot AI` : isCreating ? 'Pushing branch and opening PR on GitHub' : 'Automated GitHub pull request'}
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {isCreating && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-800">Publishing verified repair branch to GitHub...</p>
              <p className="text-xs text-slate-500">Creating branch, committing verified patch, and opening PR</p>
            </div>
          )}

          {error && !isCreating && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Failed to create GitHub Pull Request</p>
                <p className="mt-1 text-rose-700">{error}</p>
                <p className="mt-2 text-[11px] text-rose-600">Ensure your GitHub account has write permissions to this repository.</p>
              </div>
            </div>
          )}

          {pullRequest && !isCreating && (
            <>
              {/* PR Title & Status */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Open & Ready for review
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {pullRequest.branch} &rarr; main
                  </span>
                </div>

                <h4 className="text-lg font-bold text-slate-900 font-mono">
                  {pullRequest.title || `Fix: Automated patch #${pullRequest.number}`}
                </h4>
              </div>

              {/* View PR on GitHub Button */}
              {pullRequest.htmlUrl && (
                <a
                  href={pullRequest.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>View Pull Request #{pullRequest.number} on GitHub</span>
                </a>
              )}

              {/* Security & Verification confirmation */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified with Zero Regressions</span>
                </div>
                <p className="text-emerald-700 leading-relaxed text-[11px]">
                  All automated sandbox test suites passed before branch creation. Full root-cause analysis, reproduction traces, and test results have been documented in the PR body.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onViewHistory();
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            View in Activity History &rarr;
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
