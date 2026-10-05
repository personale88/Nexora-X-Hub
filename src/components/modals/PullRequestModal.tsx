'use client';

import React from 'react';
import {
  X,
  GitPullRequest,
  ShieldCheck,
} from 'lucide-react';

interface PullRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: () => void;
}

export const PullRequestModal: React.FC<PullRequestModalProps> = ({
  isOpen,
  onClose,
  onViewHistory,
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
              <h3 className="text-base font-bold text-slate-900">Pull Request Created</h3>
              <p className="text-[11px] text-slate-500">#412 opened 1 minute ago by RepoPilot AI</p>
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
          {/* PR Title & Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ready for review
              </span>
              <span className="text-xs text-slate-500 font-mono">
                repopilot/fix-auth-104 &rarr; main
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 font-mono">
              fix(auth): reject expired JWT tokens
            </h4>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Files changed</div>
              <div className="text-base font-bold text-slate-900 font-mono">1</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Tests</div>
              <div className="text-base font-bold text-emerald-600 font-mono">24 passed</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Verification</div>
              <div className="text-base font-bold text-indigo-700 font-mono">Verified (97%)</div>
            </div>
          </div>

          {/* Description Snippet */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              AI Generated Summary
            </div>
            <p className="text-slate-700 leading-relaxed">
              Patched <code className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded font-mono">src/middleware/auth.ts</code> to enforce token payload type checking and check <code className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded font-mono">decoded.exp</code> timestamp validity before invoking downstream middleware. Includes regression test in <code className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded font-mono">tests/auth.test.ts</code>.
            </p>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px] pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All automated CI checks passing. Zero breaking changes.</span>
            </div>
          </div>
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
