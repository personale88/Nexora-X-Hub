'use client';

import React from 'react';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Search,
  Check,
  Zap,
  FolderGit2,
  RefreshCw,
} from 'lucide-react';
import { ACTIVE_REPO } from '@/lib/mock-data';
import { NavTab, RepositoryData } from '@/lib/types';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onStartDemoTour?: () => void;
  currentRepo?: RepositoryData;
  onOpenRepoModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  currentRepo = ACTIVE_REPO,
  onOpenRepoModal,
}) => {
  const workflowSteps = [
    {
      id: 'understand',
      label: 'UNDERSTAND',
      detail: 'AST & Dependencies',
      icon: Search,
      tab: 'repositories' as NavTab,
    },
    {
      id: 'diagnose',
      label: 'DIAGNOSE',
      detail: 'Root-Cause Analysis',
      icon: AlertTriangle,
      tab: 'issues' as NavTab,
    },
    {
      id: 'fix',
      label: 'FIX',
      detail: 'Surgical Patch',
      icon: FileCode2,
      tab: 'fix' as NavTab,
    },
    {
      id: 'test',
      label: 'TEST',
      detail: 'Regression Suite',
      icon: ShieldCheck,
      tab: 'fix' as NavTab,
    },
    {
      id: 'verify',
      label: 'VERIFY',
      detail: 'Deterministic Sandbox',
      icon: CheckCircle2,
      tab: 'verification' as NavTab,
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/60 border border-indigo-100 p-8 md:p-10 shadow-xs">
        {/* Subtle grid background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          {/* Header pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>RepoPilot AI · From bug report to verified fix.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
            Your AI software engineer.
          </h1>

          <p className="text-lg text-slate-600 font-normal leading-relaxed mb-8">
            Understand repositories, diagnose bugs, generate fixes, write regression tests, and verify solutions.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenRepoModal ? onOpenRepoModal : () => onNavigate('repositories')}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Analyze Repository</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow Pipeline Display */}
        <div className="mt-10 pt-8 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Autonomous Verification Loop
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Closed-Loop Verification Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  onClick={() => onNavigate(step.tab)}
                  className="group relative cursor-pointer p-4 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-sm transition-all text-center"
                >
                  <div className="flex items-center justify-center mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xs font-bold tracking-wider text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {step.label}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {step.detail}
                  </div>

                  {index < workflowSteps.length - 1 && (
                    <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400 font-bold">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
            Repositories
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">3</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Indexed & Monitored</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
            Issues Detected
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tracking-tight">7</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>1 High Severity Active</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
            Issues Resolved
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">6</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Patches Auto-Generated</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
            Verification Rate
          </div>
          <div className="text-3xl font-extrabold text-indigo-600 tracking-tight">94%</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Suite Pass Rate</span>
          </div>
        </div>
      </div>

      {/* Active Repository Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                Active Repository
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                {currentRepo.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {currentRepo.name}
              </h2>
              <span className="text-xs text-slate-600 font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                branch: {currentRepo.branch}
              </span>

              {onOpenRepoModal && (
                <button
                  onClick={onOpenRepoModal}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors"
                  title="Switch or connect another repository"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch</span>
                </button>
              )}
            </div>

            <p className="text-sm text-slate-600 max-w-xl">
              {currentRepo.description}
            </p>

            {/* Tech Stack Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {currentRepo.stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Metrics summary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:border-l lg:border-slate-200 lg:pl-8">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Total Files</div>
                <div className="text-lg font-bold text-slate-900">{currentRepo.metrics.files}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Lines of Code</div>
                <div className="text-lg font-bold text-slate-900">{currentRepo.metrics.linesOfCode}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Test Coverage</div>
                <div className="text-lg font-bold text-emerald-600">{currentRepo.metrics.testCoverage}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500">Dependencies</div>
                <div className="text-lg font-bold text-slate-900">{currentRepo.metrics.dependencies}</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('issues')}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Investigate Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* KEY DIFFERENTIATOR COMPARISON BANNER */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 p-6 md:p-8 shadow-xs">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Why RepoPilot?
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            "Most AI coding tools generate code."
          </h3>
          <p className="text-xl font-bold text-indigo-700 mt-1">
            "RepoPilot verifies engineering outcomes."
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Traditional AI Box */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Traditional AI Coding (Chatbots / Copilots)
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                Unverified Output
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">1</span>
                <span>Prompt Input</span>
              </div>
              <div className="text-center text-slate-400 text-xs">↓</div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">2</span>
                <span>Generated Code Snippet</span>
              </div>
              <div className="text-center text-slate-400 text-xs">↓</div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium">
                <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold">3</span>
                <span>Developer Must Manually Test & Debug Hallucinations</span>
              </div>
            </div>
          </div>

          {/* RepoPilot AI Box */}
          <div className="p-6 rounded-xl bg-white border-2 border-indigo-300 relative shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                RepoPilot AI Autonomous Loop
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Guaranteed Verified
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-800">
                <div className="font-bold">Repository</div>
                <div className="text-[10px] text-indigo-600">Context</div>
              </div>
              <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-800">
                <div className="font-bold">Root Cause</div>
                <div className="text-[10px] text-indigo-600">Analysis</div>
              </div>
              <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-800">
                <div className="font-bold">Patch</div>
                <div className="text-[10px] text-indigo-600">Surgical</div>
              </div>
              <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-800">
                <div className="font-bold">Regression</div>
                <div className="text-[10px] text-indigo-600">Test Gen</div>
              </div>
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                <div className="font-bold">Verified</div>
                <div className="text-[10px] text-emerald-600">Sandbox</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                RepoPilot executes the tests, inspects runtime outcomes, and creates developer-ready PRs with verified zero-regression guarantees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
