'use client';

import React from 'react';
import {
  GitBranch,
  Play,
  Settings,
  Sparkles,
  Code2,
  ChevronDown,
} from 'lucide-react';
import { RepositoryData } from '@/lib/types';

interface TopNavbarProps {
  onStartGuidedTour: () => void;
  openSettings: () => void;
  onOpenRepoModal?: () => void;
  currentRepo?: RepositoryData;
  isTouring?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onStartGuidedTour,
  openSettings,
  onOpenRepoModal,
  currentRepo,
  isTouring = false,
}) => {
  const repoName = currentRepo?.name || 'commerce-api';
  const repoBranch = currentRepo?.branch || 'main';

  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Repo selector pill (Clickable to switch / connect repo) */}
        <button
          onClick={onOpenRepoModal}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-medium text-slate-800 transition-all shadow-2xs"
          title="Click to switch repository or connect Git provider"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
          <span className="font-semibold text-slate-900 group-hover:text-indigo-700">{repoName}</span>
          <span className="text-slate-400">/</span>
          <div className="flex items-center gap-1 text-slate-600 group-hover:text-indigo-600">
            <GitBranch className="w-3 h-3 text-indigo-600" />
            <span>{repoBranch}</span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 ml-0.5 transition-transform group-hover:translate-y-0.5" />
        </button>

        {/* Tagline badge */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium border-l border-slate-200 pl-4">
          <span className="text-indigo-600 font-semibold">RepoPilot:</span>
          <span>From bug report to verified fix.</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Hackathon Track Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Code2 className="w-3 h-3 text-indigo-600" />
          <span>iQOO Hackathon · Developer Tools</span>
        </div>

        {/* 2-Minute Demo Flow Quick Button */}
        <button
          onClick={onStartGuidedTour}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            isTouring
              ? 'bg-amber-500 text-white font-bold animate-pulse shadow-md shadow-amber-500/25'
              : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-indigo-600/20 hover:shadow-sm'
          }`}
          title="Autoplay or restart the complete 2-minute judge walkthrough"
        >
          {isTouring ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tour Active (Click Next)</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>2-Min Demo Walkthrough</span>
            </>
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={openSettings}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-xs"
          title="AI Engine Configuration"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
