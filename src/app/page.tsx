'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { DemoTourBanner, TOUR_STEPS } from '@/components/layout/DemoTourBanner';
import { DashboardView } from '@/components/views/DashboardView';
import { RepositoryView } from '@/components/views/RepositoryView';
import { InvestigationView } from '@/components/views/InvestigationView';
import { FixView } from '@/components/views/FixView';
import { VerificationView } from '@/components/views/VerificationView';
import { HistoryView } from '@/components/views/HistoryView';
import { LoginLandingView } from '@/components/views/LoginLandingView';
import { PullRequestModal } from '@/components/modals/PullRequestModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { YourRepositoriesModal } from '@/components/modals/YourRepositoriesModal';
import { ACTIVE_REPO } from '@/lib/mock-data';
import { NavTab, RepositoryData } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const {
    isAuthenticated,
    isLoading,
    isSettingsOpen,
    openSettings,
    closeSettings,
    settingsTab,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeRepo, setActiveRepo] = useState<RepositoryData>(ACTIVE_REPO);
  const [isTouring, setIsTouring] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [isPRModalOpen, setIsPRModalOpen] = useState<boolean>(false);
  const [isConnectRepoOpen, setIsConnectRepoOpen] = useState<boolean>(false);
  const [hasVerifiedFix, setHasVerifiedFix] = useState<boolean>(false);
  const [, setEngineRefresh] = useState(0);

  // 1. Loading State while session is verified
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-500 font-mono">
          Connecting securely...
        </span>
      </div>
    );
  }

  // 2. Unauthenticated state: Route protection -> Landing Login View
  if (!isAuthenticated) {
    return <LoginLandingView />;
  }

  // 3. Authenticated state: RepoPilot Workspace & Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-row selection:bg-indigo-100 selection:text-indigo-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'verification') {
            setHasVerifiedFix(true);
          }
        }}
        openSettings={() => openSettings('engine')}
        hasVerifiedFix={hasVerifiedFix}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          openSettings={(tab) => openSettings(tab || 'engine')}
          onOpenRepoModal={() => setIsConnectRepoOpen(true)}
          currentRepo={activeRepo}
        />

        {/* Main View Router */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => {
                setActiveTab(tab);
                if (tab === 'verification') setHasVerifiedFix(true);
              }}
              currentRepo={activeRepo}
              onOpenRepoModal={() => setIsConnectRepoOpen(true)}
            />
          )}

          {activeTab === 'repositories' && (
            <RepositoryView
              onNavigate={setActiveTab}
              currentRepo={activeRepo}
              onOpenRepoModal={() => setIsConnectRepoOpen(true)}
              onInvestigateIssue={() => {
                setActiveTab('issues');
                if (isTouring) setCurrentTourStep(2);
              }}
            />
          )}

          {activeTab === 'issues' && (
            <InvestigationView
              onGenerateFix={() => {
                setActiveTab('fix');
                if (isTouring) setCurrentTourStep(3);
              }}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'fix' && (
            <FixView
              onVerifyFix={() => {
                setActiveTab('verification');
                setHasVerifiedFix(true);
                if (isTouring) setCurrentTourStep(4);
              }}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'verification' && (
            <VerificationView
              onCreatePR={() => {
                setIsPRModalOpen(true);
                setHasVerifiedFix(true);
              }}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView onNavigate={setActiveTab} />
          )}
        </main>
      </div>

      {/* Your Authorized Repositories Selection Modal */}
      <YourRepositoriesModal
        isOpen={isConnectRepoOpen}
        onClose={() => setIsConnectRepoOpen(false)}
        currentRepoId={activeRepo.id}
        onSelectRepo={(newRepo) => {
          setActiveRepo(newRepo);
          setActiveTab('repositories');
        }}
      />

      {/* Pull Request Created Modal */}
      <PullRequestModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        onViewHistory={() => {
          setActiveTab('history');
          setIsPRModalOpen(false);
          setIsTouring(false);
        }}
      />

      {/* Settings / AI Engine & Connected Accounts Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        initialTab={settingsTab}
        onUpdated={() => setEngineRefresh((prev) => prev + 1)}
      />
    </div>
  );
}
