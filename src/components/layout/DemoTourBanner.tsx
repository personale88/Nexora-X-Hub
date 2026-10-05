'use client';

import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
} from 'lucide-react';
import { NavTab } from '@/lib/types';

export interface TourStep {
  step: number;
  tab: NavTab;
  title: string;
  narration: string;
  actionText: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    tab: 'dashboard',
    title: 'Step 1: Dashboard & Core Value',
    narration: 'RepoPilot is an AI software engineer that doesn\'t stop at code generation — it verifies the fix.',
    actionText: 'Investigate Active Issue',
  },
  {
    step: 2,
    tab: 'repositories',
    title: 'Step 2: Repository Intelligence',
    narration: 'Scans the repository AST, language metrics, and detects high-confidence security gaps like AUTH-104.',
    actionText: 'Investigate AUTH-104 with AI',
  },
  {
    step: 3,
    tab: 'issues',
    title: 'Step 3: Root-Cause Analysis',
    narration: 'AI autonomously traces the execution path from middleware to JWT verification and explains why it fails.',
    actionText: 'Review Code Diff & Generate Patch',
  },
  {
    step: 4,
    tab: 'fix',
    title: 'Step 4: Fix & Regression Test Generation',
    narration: 'Produces a surgical, low-risk patch along with an automated Jest regression test to prevent recurrence.',
    actionText: 'Run Verification Engine',
  },
  {
    step: 5,
    tab: 'verification',
    title: 'Step 5: Verification Center & Sandbox Test',
    narration: 'Runs actual verification sandbox: 24/24 tests pass, security check PASS, 97% confidence achieved.',
    actionText: 'Create Pull Request',
  },
];

interface DemoTourBannerProps {
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onActionClick: () => void;
}

export const DemoTourBanner: React.FC<DemoTourBannerProps> = ({
  currentStepIndex,
  onNext,
  onPrev,
  onClose,
  onActionClick,
}) => {
  const step = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const progressPercent = ((currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-white border-b border-indigo-200/80 px-6 py-3 sticky top-14 z-20 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Judge Demo Walkthrough · Step {step.step} of {TOUR_STEPS.length}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                — {step.title}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 italic">
              "{step.narration}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={onActionClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
          >
            <span>{step.actionText}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
            <button
              onClick={onPrev}
              disabled={currentStepIndex === 0}
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              disabled={currentStepIndex === TOUR_STEPS.length - 1}
              className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
            title="Exit Demo Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
