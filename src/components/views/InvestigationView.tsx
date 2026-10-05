'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { PRIMARY_ISSUE, PRIMARY_PATCH } from '@/lib/mock-data';
import { NavTab } from '@/lib/types';

interface InvestigationViewProps {
  onGenerateFix: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  onGenerateFix,
}) => {
  const [diffViewMode, setDiffViewMode] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);

  const reasoningSteps = [
    {
      id: 'step-1',
      text: 'Repository context loaded',
      detail: 'Indexed 184 files and parsed AST symbol references.',
      status: 'completed',
    },
    {
      id: 'step-2',
      text: 'Relevant files identified',
      detail: 'Identified src/middleware/auth.ts and user route chains.',
      status: 'completed',
    },
    {
      id: 'step-3',
      text: 'Authentication flow traced',
      detail: 'Traced Bearer token extraction -> jwt.verify() -> next() middleware execution.',
      status: 'completed',
    },
    {
      id: 'step-4',
      text: 'Root cause identified',
      detail: 'Missing explicit expiration condition allows expired tokens through.',
      status: 'completed',
    },
    {
      id: 'step-5',
      text: 'Fix strategy generated',
      detail: 'Enforce payload verification and decoded.exp timestamp validation against Date.now().',
      status: 'completed',
    },
    {
      id: 'step-6',
      text: 'Regression test generated',
      detail: 'Synthesized automated Supertest spec with expired JWT token payload.',
      status: 'completed',
    },
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PRIMARY_PATCH.afterCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              AI Investigation
            </span>
            <span className="text-xs font-mono font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {PRIMARY_ISSUE.code}
            </span>
            <span className="text-xs text-slate-500 font-mono">Confidence: 96%</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {PRIMARY_ISSUE.title}
          </h1>
          <p className="text-sm text-slate-600">
            Automated execution-path tracing and root-cause vulnerability diagnosis.
          </p>
        </div>

        <button
          onClick={onGenerateFix}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Fix</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* AI Reasoning Timeline */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              AI Reasoning Timeline
            </h2>
          </div>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            6/6 Analysis Steps Completed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reasoningSteps.map((step) => (
            <div
              key={step.id}
              className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 transition-all flex items-start gap-3 shadow-xs"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span>
                  <span>{step.text}</span>
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Root Cause & Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ROOT CAUSE */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Root Cause
            </span>
            <span className="text-xs text-slate-400 font-mono">auth.ts:38-42</span>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            "{PRIMARY_ISSUE.rootCause}"
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <span>Affected File:</span>
            <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
              {PRIMARY_ISSUE.affectedFile}
            </span>
          </div>
        </div>

        {/* IMPACT */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Security Impact
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              HIGH RISK
            </span>
          </div>

          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            "{PRIMARY_ISSUE.impact}"
          </p>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <span>Vulnerability Class:</span>
            <span className="font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              CWE-287: Improper Authentication
            </span>
          </div>
        </div>
      </div>

      {/* CODE DIFF (Visually Impressive Split or Unified) */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Diff Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span className="font-mono text-xs font-bold text-slate-900">
                {PRIMARY_PATCH.file}
              </span>
              <span className="text-[11px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-200/70">
                +11 / -3 lines
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <button
                onClick={() => setDiffViewMode('split')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  diffViewMode === 'split'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setDiffViewMode('unified')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  diffViewMode === 'unified'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unified Diff
              </button>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diff Body */}
        {diffViewMode === 'split' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 font-mono text-xs">
            {/* BEFORE (Red Removal) */}
            <div className="p-4 bg-rose-50/30">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-200">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  BEFORE (VULNERABLE)
                </span>
                <span className="text-[11px] text-slate-500">Lines 38–44</span>
              </div>

              <div className="space-y-1 text-slate-700">
                <div className="text-slate-600 px-2 py-0.5">
                  <span className="text-slate-400 select-none mr-3">37</span>
                  <span className="text-indigo-600 font-semibold">const</span> decoded = jwt.verify(token, SECRET);
                </div>
                <div className="bg-rose-100 text-rose-950 px-2 py-1 rounded border-l-2 border-rose-500 flex items-start gap-2">
                  <span className="text-rose-600 select-none font-bold">-</span>
                  <span className="text-slate-500 select-none">38</span>
                  <pre className="whitespace-pre font-mono">if (decoded) {'{'}</pre>
                </div>
                <div className="bg-rose-100 text-rose-950 px-2 py-1 rounded border-l-2 border-rose-500 flex items-start gap-2">
                  <span className="text-rose-600 select-none font-bold">-</span>
                  <span className="text-slate-500 select-none">39</span>
                  <pre className="whitespace-pre font-mono">    return next();</pre>
                </div>
                <div className="bg-rose-100 text-rose-950 px-2 py-1 rounded border-l-2 border-rose-500 flex items-start gap-2">
                  <span className="text-rose-600 select-none font-bold">-</span>
                  <span className="text-slate-500 select-none">40</span>
                  <pre className="whitespace-pre font-mono">{'}'}</pre>
                </div>
              </div>
            </div>

            {/* AFTER (Green Addition) */}
            <div className="p-4 bg-emerald-50/30">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-200">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  AFTER (VERIFIED FIX)
                </span>
                <span className="text-[11px] text-slate-500">Lines 38–52</span>
              </div>

              <div className="space-y-1 text-slate-700">
                <div className="text-slate-600 px-2 py-0.5">
                  <span className="text-slate-400 select-none mr-3">37</span>
                  <span className="text-indigo-600 font-semibold">const</span> decoded = jwt.verify(token, SECRET);
                </div>

                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">38</span>
                  <pre className="whitespace-pre font-mono">if (!decoded || typeof decoded === "string") {'{'}</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">39</span>
                  <pre className="whitespace-pre font-mono">    return res.status(401).json({'{'}</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">40</span>
                  <pre className="whitespace-pre font-mono">        error: "Invalid token"</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">41</span>
                  <pre className="whitespace-pre font-mono">    {'}'});</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">42</span>
                  <pre className="whitespace-pre font-mono">{'}'}</pre>
                </div>

                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">43</span>
                  <pre className="whitespace-pre font-mono">if (decoded.exp && decoded.exp * 1000 &lt; Date.now()) {'{'}</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">44</span>
                  <pre className="whitespace-pre font-mono">    return res.status(401).json({'{'}</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">45</span>
                  <pre className="whitespace-pre font-mono">        error: "Token expired"</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">46</span>
                  <pre className="whitespace-pre font-mono">    {'}'});</pre>
                </div>
                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">47</span>
                  <pre className="whitespace-pre font-mono">{'}'}</pre>
                </div>

                <div className="bg-emerald-100/80 text-emerald-950 px-2 py-0.5 rounded border-l-2 border-emerald-500 flex items-start gap-2">
                  <span className="text-emerald-700 select-none font-bold">+</span>
                  <span className="text-slate-500 select-none">48</span>
                  <pre className="whitespace-pre font-mono">return next();</pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Unified Diff View */
          <div className="p-4 font-mono text-xs space-y-0.5 bg-[#fafafa]">
            {PRIMARY_PATCH.diffLines.map((line, idx) => {
              if (line.type === 'deletion') {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 px-2 py-0.5 rounded bg-rose-100 text-rose-950 border-l-2 border-rose-500"
                  >
                    <span className="text-slate-400 select-none w-6 text-right">
                      {line.oldLineNumber}
                    </span>
                    <span className="text-rose-600 select-none font-bold">-</span>
                    <span className="whitespace-pre">{line.content.replace(/^-\s*/, '')}</span>
                  </div>
                );
              }

              if (line.type === 'addition') {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border-l-2 border-emerald-500"
                  >
                    <span className="text-slate-400 select-none w-6 text-right">
                      {line.newLineNumber}
                    </span>
                    <span className="text-emerald-700 select-none font-bold">+</span>
                    <span className="whitespace-pre">{line.content.replace(/^\+\s*/, '')}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className="flex items-center gap-4 px-2 py-0.5 text-slate-600">
                  <span className="text-slate-400 select-none w-6 text-right">
                    {line.newLineNumber || line.oldLineNumber}
                  </span>
                  <span className="text-slate-400 select-none font-bold"> </span>
                  <span className="whitespace-pre">{line.content}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer action trigger */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-xs">
        <div>
          <h4 className="text-base font-bold text-slate-900">Ready to proceed to Fix Generation?</h4>
          <p className="text-xs text-slate-600">
            RepoPilot will construct the minimal patch and synthesize automated regression specs.
          </p>
        </div>

        <button
          onClick={onGenerateFix}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Fix & Tests</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
