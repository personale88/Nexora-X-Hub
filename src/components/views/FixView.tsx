'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  Activity,
  Cpu,
} from 'lucide-react';
import { PRIMARY_PATCH, PRIMARY_REGRESSION_TEST } from '@/lib/mock-data';
import { NavTab } from '@/lib/types';

interface FixViewProps {
  onVerifyFix: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const FixView: React.FC<FixViewProps> = ({
  onVerifyFix,
}) => {
  const [copiedTest, setCopiedTest] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);

  const agentSteps = [
    'Loaded repository context',
    'Located authentication middleware',
    'Traced token validation',
    'Identified missing expiration handling',
    'Generated minimal patch',
    'Generated regression test',
  ];

  const handleCopyTest = () => {
    navigator.clipboard.writeText(PRIMARY_REGRESSION_TEST.code);
    setCopiedTest(true);
    setTimeout(() => setCopiedTest(false), 2000);
  };

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(PRIMARY_PATCH.afterCode);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Fix & Regression Suite
            </span>
            <span className="text-xs text-slate-500 font-mono">AUTH-104 Patch Ready</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Automated Patch & Regression Verification
          </h1>
          <p className="text-sm text-slate-600">
            Surgical non-breaking diff synthesized alongside automated regression test suites.
          </p>
        </div>

        <button
          onClick={onVerifyFix}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all self-start md:self-auto"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify Fix in Sandbox</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* AI Agent Progress Log */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide">
                RepoPilot Agent
              </h3>
              <p className="text-[11px] text-slate-500">
                Deterministic autonomous synthesis pipeline
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed in 480ms
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agentSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-800">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PATCH READY METRICS */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/80 border border-emerald-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
              PATCH READY
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Ready for verification testing
            </span>
          </div>

          <button
            onClick={handleCopyPatch}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors shadow-xs"
          >
            {copiedPatch ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Patch</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
              File
            </div>
            <div className="text-sm font-mono font-bold text-slate-900 truncate" title={PRIMARY_PATCH.file}>
              {PRIMARY_PATCH.file}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Single module impact</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
              Lines Changed
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              8
            </div>
            <div className="text-[10px] text-slate-500 mt-1">+11 added / -3 removed</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
              Risk Assessment
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xl font-bold text-emerald-700 uppercase">
                {PRIMARY_PATCH.risk}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Zero breaking API changes</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
              Confidence
            </div>
            <div className="text-2xl font-bold text-indigo-600 font-mono">
              {PRIMARY_PATCH.confidence}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">High semantic alignment</div>
          </div>
        </div>
      </div>

      {/* REGRESSION TEST DISPLAY */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="font-mono text-xs font-bold text-slate-900">
                {PRIMARY_REGRESSION_TEST.filename}
              </span>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-semibold">
                {PRIMARY_REGRESSION_TEST.framework}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTest}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors shadow-xs"
            >
              {copiedTest ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Test</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-5 font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto bg-[#fafafa]">
          <pre className="space-y-1">
            {PRIMARY_REGRESSION_TEST.code.split('\n').map((line, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <span className="text-slate-400 select-none w-6 text-right shrink-0">
                  {idx + 1}
                </span>
                <span className="whitespace-pre">{line}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>

      {/* Verify Fix Action Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Ready for Automated Sandbox Verification
            </h3>
          </div>
          <p className="text-xs text-slate-600 max-w-xl">
            RepoPilot will run the full test suite, execute the newly generated regression test, and verify that AUTH-104 is completely resolved without regressions.
          </p>
        </div>

        <button
          onClick={onVerifyFix}
          className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verify Fix</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
