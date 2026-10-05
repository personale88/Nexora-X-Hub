'use client';

import React, { useState } from 'react';
import {
  X,
  Cpu,
  Key,
  RotateCcw,
} from 'lucide-react';
import { aiEngine } from '@/lib/ai-engine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const status = aiEngine.getStatus();

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    aiEngine.setApiKey(apiKeyInput);
    onUpdated();
    onClose();
  };

  const handleResetToDemo = () => {
    aiEngine.resetToDemo();
    setApiKeyInput('');
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-800">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Engine Configuration</h3>
              <p className="text-[11px] text-slate-500">Zero-Break Guarantee & API Settings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Mode Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Runtime
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {status.label}
              </span>
            </div>

            <div className="text-sm font-semibold text-slate-900">
              {status.model}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Configured with deterministic test trees and simulated compiler sandbox. Guaranteed 100% uptime for hackathon demo presentations with zero API key dependencies.
            </p>
          </div>

          {/* Optional API Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Optional LLM API Key (OpenAI / Anthropic / Gemini)</span>
            </label>
            <input
              type="password"
              placeholder="sk-... (Optional: Leave empty for default Demo Engine)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
            <p className="text-[11px] text-slate-500">
              *The demo will never break if an API key is missing. It defaults to the instant zero-failure engine.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleResetToDemo}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Demo Engine</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveApiKey}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
