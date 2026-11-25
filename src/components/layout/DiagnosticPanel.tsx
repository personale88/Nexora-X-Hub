'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, ChevronUp, ChevronDown, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { RepositoryData } from '@/lib/types';

interface DiagnosticPanelProps {
  currentRepo: RepositoryData;
  currentJobId: string | null;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  currentRepo,
  currentJobId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  const fetchHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const savedOllamaUrl = typeof window !== 'undefined' ? localStorage.getItem('repopilot_ollama_url') : null;
      const url = savedOllamaUrl ? `/api/ai/health?ollama_url=${encodeURIComponent(savedOllamaUrl)}` : '/api/ai/health';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAiHealth(data);
      }
    } catch (e) {
      console.warn('Could not fetch AI health:', e);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [currentRepo.name]);

  const activeProvider = aiHealth?.activeMode || 'gemini';
  const geminiStatus = aiHealth?.gemini?.status || 'UNKNOWN';
  const ollamaStatus = aiHealth?.ollama?.status || 'UNKNOWN';

  return (
    <div className="fixed bottom-0 right-6 z-40 max-w-xl w-full">
      <div className="bg-slate-900 border border-slate-700/80 rounded-t-2xl shadow-2xl text-xs font-mono text-slate-300 overflow-hidden">
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-slate-800/90 hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">System Diagnostics</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-400">{currentRepo.name}</span>
            <span className="text-slate-500">({currentRepo.branch || 'main'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px]">
              {activeProvider.toUpperCase()}
            </span>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {/* Expanded Diagnostic Content */}
        {isOpen && (
          <div className="p-4 space-y-3 bg-slate-900/95 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">ACTIVE REPOSITORY</span>
                <span className="text-white font-semibold">{currentRepo.name}</span>
                <span className="text-slate-400 text-[10px] block">ID: {currentRepo.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SELECTED BRANCH</span>
                <span className="text-emerald-400">{currentRepo.branch || 'main'}</span>
                <span className="text-slate-400 text-[10px] block">Files: {currentRepo.metrics?.files || 0}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">CURRENT REPAIR JOB ID</span>
                <span className="text-amber-400">{currentJobId || 'None (Awaiting submission)'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SANDBOX EXECUTION</span>
                <span className="text-cyan-400">Isolated Workspace (Active)</span>
              </div>
            </div>

            {/* AI Provider Status */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-semibold text-[11px]">AI Providers Status</span>
                <button
                  onClick={fetchHealth}
                  className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {aiHealth?.gemini?.model ? (aiHealth.gemini.model.includes('2.0') ? 'Gemini 2.0' : aiHealth.gemini.model) : 'Gemini 2.0'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        geminiStatus === 'CONNECTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {geminiStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {aiHealth?.gemini?.latencyMs ? `${aiHealth.gemini.latencyMs}ms` : 'Cloud API'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Ollama Local</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        ollamaStatus === 'CONNECTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {ollamaStatus}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {aiHealth?.ollama?.model || 'qwen2.5-coder:7b'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
