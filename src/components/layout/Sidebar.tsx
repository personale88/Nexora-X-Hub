'use client';

import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  AlertTriangle,
  Wrench,
  ShieldCheck,
  History,
  Cpu,
  Sparkles,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { NavTab } from '@/lib/types';
import { aiEngine } from '@/lib/ai-engine';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openSettings: () => void;
  hasVerifiedFix?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  openSettings,
  hasVerifiedFix = false,
}) => {
  const engineStatus = aiEngine.getStatus();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'repositories' as NavTab,
      label: 'Repositories',
      icon: GitBranch,
      badge: '3',
    },
    {
      id: 'issues' as NavTab,
      label: 'Issues',
      icon: AlertTriangle,
      badge: '1 High',
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
    },
    {
      id: 'fix' as NavTab,
      label: 'Fix & Patch',
      icon: Wrench,
      badge: 'Ready',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    },
    {
      id: 'verification' as NavTab,
      label: 'Verification',
      icon: ShieldCheck,
      badge: hasVerifiedFix ? 'Passed' : 'Pending',
      badgeColor: hasVerifiedFix
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
        : 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    },
    {
      id: 'history' as NavTab,
      label: 'History',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none h-screen sticky top-0 z-30 shadow-xs">
      <div>
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-black/5">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">RepoPilot</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[125px]">
                Autonomous Dev Agent
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                        item.badgeColor || 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom AI Engine Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        <div
          onClick={openSettings}
          className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all hover:border-slate-300 shadow-xs group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-semibold text-slate-700">AI Engine</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {engineStatus.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate max-w-[150px]">Deterministic Zero-Fail</span>
            <Sparkles className="w-3 h-3 text-indigo-500 group-hover:rotate-12 transition-transform" />
          </div>
        </div>
      </div>
    </aside>
  );
};
