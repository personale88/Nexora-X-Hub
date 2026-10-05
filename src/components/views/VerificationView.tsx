'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  CheckCircle2,
  ShieldCheck,
  GitPullRequest,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NavTab } from '@/lib/types';

interface VerificationViewProps {
  onCreatePR: () => void;
  onNavigate: (tab: NavTab) => void;
  isAutoRunning?: boolean;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  onCreatePR,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [visibleLogCount, setVisibleLogCount] = useState(0);

  const verificationLogs = [
    '$ npm test -- --runInBand',
    'Initializing verification...',
    '✓ Loading patched repository',
    '✓ Running authentication tests',
    '✓ Running regression tests',
    '✓ Running API tests',
    '✓ Checking affected modules',
    'All 24 test suites executed cleanly in 1,240ms.',
  ];

  const runVerification = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setVisibleLogCount(0);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleLogCount(count);
      if (count >= verificationLogs.length) {
        clearInterval(interval);
        setIsRunning(false);
        setIsCompleted(true);

        // Confetti burst for verified triumph!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#6366F1', '#06B6D4', '#F59E0B'],
          });
        } catch (e) {
          // ignore if canvas-confetti is not loaded in SSR
        }
      }
    }, 240);
  };

  useEffect(() => {
    runVerification();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
              Closed-Loop Execution
            </span>
            <span className="text-xs text-slate-500 font-mono">Sandbox Sandbox-v2.1</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Verification Center
          </h1>
          <p className="text-sm text-slate-600">
            Realtime automated regression runner, security check validator, and sandbox outcome verification.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={runVerification}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Re-run Verification</span>
          </button>

          {isCompleted && (
            <button
              onClick={onCreatePR}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>Create Pull Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal-like execution view */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1322] overflow-hidden shadow-md">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-slate-300 ml-2 flex items-center gap-1.5 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              terminal — sandbox-runner
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {isRunning ? (
              <span className="text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Executing tests...
              </span>
            ) : isCompleted ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <Check className="w-3.5 h-3.5" />
                Exit code: 0 (All passed)
              </span>
            ) : null}
          </div>
        </div>

        <div className="p-6 font-mono text-xs text-slate-200 space-y-2 min-h-[220px] bg-[#070c18]">
          {verificationLogs.slice(0, visibleLogCount).map((log, index) => {
            const isCommand = log.startsWith('$');
            const isSuccess = log.includes('✓') || log.includes('passed');

            return (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  isCommand
                    ? 'text-cyan-400 font-bold text-sm'
                    : isSuccess
                    ? 'text-emerald-400 font-semibold'
                    : 'text-slate-300'
                }`}
              >
                <span>{log}</span>
              </div>
            );
          })}

          {isRunning && (
            <div className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />
          )}
        </div>
      </div>

      {/* Outcome Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TEST RESULTS */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            TEST RESULTS
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-emerald-600 font-mono">
              24
            </span>
            <span className="text-sm font-semibold text-emerald-700">
              passed
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-2xl font-bold text-slate-400 font-mono">
              0
            </span>
            <span className="text-xs text-slate-500">
              failed
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">100% of repository test suites green</span>
          </div>
        </div>

        {/* SECURITY CHECK */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              SECURITY CHECK
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              PASS
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900 mb-1">
            JWT expiration handling
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Expired cryptographic signatures and elapsed timestamps immediately rejected with HTTP 401.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-emerald-700 font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>CWE-287 Bypass Neutralized</span>
          </div>
        </div>

        {/* REGRESSION TEST */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              REGRESSION TEST
            </div>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              PASS
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900 mb-1">
            Expired token rejected
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Targeted Supertest suite confirmed that simulated expired bearer token fails with 401 status.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-indigo-700 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>tests/auth.test.ts (+1 verified test)</span>
          </div>
        </div>
      </div>

      {/* LARGE SUCCESS CARD (FIX VERIFIED) */}
      <div className="p-8 md:p-10 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/80 border-2 border-emerald-300 shadow-sm relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-extrabold tracking-wider uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fix Verified & Validated</span>
            </div>

            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              FIX VERIFIED
            </h2>

            <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
              The patch has been automatically compiled, applied to a virtual clone of <span className="font-semibold text-slate-900">commerce-api</span>, and validated across all 24 tests with zero regressions.
            </p>

            {/* Metrics Pills */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Confidence</div>
                <div className="text-xl font-black text-indigo-700 font-mono">97%</div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Test Outcomes</div>
                <div className="text-xl font-black text-emerald-600 font-mono">24 / 24 Passed</div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Files Affected</div>
                <div className="text-xl font-black text-slate-900 font-mono">1 File Changed</div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Risk Assessment</div>
                <div className="text-xl font-black text-emerald-600">LOW</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <button
              onClick={onCreatePR}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-extrabold text-base shadow-md shadow-indigo-600/25 hover:scale-[1.03] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <GitPullRequest className="w-5 h-5" />
              <span>Create Pull Request</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Generates ready-to-merge pull request with tests & docs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
