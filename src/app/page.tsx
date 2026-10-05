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
import { PullRequestModal } from '@/components/modals/PullRequestModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { ConnectRepoModal } from '@/components/modals/ConnectRepoModal';
import { ACTIVE_REPO } from '@/lib/mock-data';
import { NavTab, RepositoryData } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeRepo, setActiveRepo] = useState<RepositoryData>(ACTIVE_REPO);
  const [isTouring, setIsTouring] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [isPRModalOpen, setIsPRModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConnectRepoOpen, setIsConnectRepoOpen] = useState<boolean>(false);
  const [hasVerifiedFix, setHasVerifiedFix] = useState<boolean>(false);
  const [, setEngineRefresh] = useState(0);

  // Guided demo tour handlers
  const handleStartTour = () => {
    setIsTouring(true);
    setCurrentTourStep(0);
    setActiveTab(TOUR_STEPS[0].tab);
  };

  const handleNextTourStep = () => {
    if (currentTourStep < TOUR_STEPS.length - 1) {
      const nextIdx = currentTourStep + 1;
      setCurrentTourStep(nextIdx);
      setActiveTab(TOUR_STEPS[nextIdx].tab);
    } else {
      setIsTouring(false);
    }
  };

  const handlePrevTourStep = () => {
    if (currentTourStep > 0) {
      const prevIdx = currentTourStep - 1;
      setCurrentTourStep(prevIdx);
      setActiveTab(TOUR_STEPS[prevIdx].tab);
    }
  };

  const handleTourActionClick = () => {
    const step = TOUR_STEPS[currentTourStep];
    if (step.step === 1) {
      setActiveTab('repositories');
      setCurrentTourStep(1);
    } else if (step.step === 2) {
      setActiveTab('issues');
      setCurrentTourStep(2);
    } else if (step.step === 3) {
      setActiveTab('fix');
      setCurrentTourStep(3);
    } else if (step.step === 4) {
      setActiveTab('verification');
      setCurrentTourStep(4);
    } else if (step.step === 5) {
      setIsPRModalOpen(true);
      setHasVerifiedFix(true);
    }
  };

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
        openSettings={() => setIsSettingsOpen(true)}
        hasVerifiedFix={hasVerifiedFix}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          onStartGuidedTour={handleStartTour}
          openSettings={() => setIsSettingsOpen(true)}
          onOpenRepoModal={() => setIsConnectRepoOpen(true)}
          currentRepo={activeRepo}
          isTouring={isTouring}
        />

        {/* Guided Tour Banner (Shown when walkthrough is active) */}
        {isTouring && (
          <DemoTourBanner
            currentStepIndex={currentTourStep}
            onNext={handleNextTourStep}
            onPrev={handlePrevTourStep}
            onClose={() => setIsTouring(false)}
            onActionClick={handleTourActionClick}
          />
        )}

        {/* Main View Router */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => {
                setActiveTab(tab);
                if (tab === 'verification') setHasVerifiedFix(true);
              }}
              onStartDemoTour={handleStartTour}
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

      {/* Select & Connect Repository Modal */}
      <ConnectRepoModal
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

      {/* Settings / AI Engine Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdated={() => setEngineRefresh((prev) => prev + 1)}
      />
    </div>
  );
}
