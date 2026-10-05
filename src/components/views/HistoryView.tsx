'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { INITIAL_HISTORY } from '@/lib/mock-data';
import { NavTab } from '@/lib/types';

interface HistoryViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            Audit Trail
          </span>
          <span className="text-xs text-slate-500 font-mono">5 events logged</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Activity & Verification History
        </h1>
        <p className="text-sm text-slate-600">
          Historical timeline of autonomous diagnostic runs, patches synthesized, and verified test outcomes.
        </p>
      </div>

      {/* History Items List */}
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-xs">
        {INITIAL_HISTORY.map((item) => {
          const isVerified = item.action === 'Fixed + Verified';
          const isAnalyzed = item.action === 'Analyzed';

          return (
            <div
              key={item.id}
              className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs w-14 shrink-0 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.timestamp}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {item.issueCode}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-slate-400" />
                      <span>{item.repository}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-600">
                      {item.file}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fixed + Verified ({item.confidence}%)</span>
                  </span>
                ) : isAnalyzed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Analyzed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                )}

                {item.issueCode === 'AUTH-104' && (
                  <button
                    onClick={() => onNavigate('verification')}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    title="View Verification Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
