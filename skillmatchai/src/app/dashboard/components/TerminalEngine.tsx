'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Terminal, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { VolunteerPayload, TaskPayload, optimizeAllocation } from '@/lib/api';
import { useAllocation, mapToMatchResult } from '@/lib/AllocationContext';

interface TerminalStep {
  id: string;
  delay: number;
  text: string;
  type: 'info' | 'success' | 'warn' | 'done' | 'error';
}

function buildSteps(volCount: number, taskCount: number): TerminalStep[] {
  return [
    { id: 'step-init',     delay: 0,    text: 'Initializing SkillMatch AI v2.4.1...', type: 'info' },
    { id: 'step-vol',      delay: 700,  text: `Loading volunteer roster → ${volCount} records ingested`, type: 'success' },
    { id: 'step-task',     delay: 1300, text: `Loading task database → ${taskCount} tasks queued`, type: 'success' },
    { id: 'step-embed',    delay: 1900, text: 'Generating skill embeddings (dim=768)...', type: 'info' },
    { id: 'step-vectors',  delay: 2800, text: `Computing skill vectors for ${volCount} volunteers...`, type: 'info' },
    { id: 'step-cosine',   delay: 3900, text: `Running cosine similarity matrix (${volCount}×${taskCount})...`, type: 'info' },
    { id: 'step-weights',  delay: 4900, text: 'Applying availability and priority weights...', type: 'info' },
    { id: 'step-gemini',   delay: 5700, text: 'Sending allocation request to Gemini AI...', type: 'info' },
    { id: 'step-schedule', delay: 6500, text: 'Finalizing schedule and conflict resolution...', type: 'info' },
  ];
}

interface TerminalEngineProps {
  volunteers: VolunteerPayload[];
  tasks: TaskPayload[];
  onComplete: () => void;
  onError: (msg: string) => void;
}

export default function TerminalEngine({ volunteers, tasks, onComplete, onError }: TerminalEngineProps) {
  const [visibleSteps, setVisibleSteps] = useState<TerminalStep[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { setResults, setLoading, setError } = useAllocation();

  const steps = buildSteps(volunteers.length, tasks.length);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    setLoading(true);

    // Show animated steps up to the API call
    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setActiveStep(step.id);
        setVisibleSteps((prev) => [...prev, step]);
        setProgress(Math.round(((i + 1) / (steps.length + 2)) * 100));
      }, step.delay);
      timers.push(t);
    });

    // Fire real API call after animation reaches the gemini step
    const apiTimer = setTimeout(async () => {
      try {
        const response = await optimizeAllocation(volunteers, tasks);

        if ('error' in response) {
          setFailed(true);
          setLoading(false);
          setError(response.message);
          setVisibleSteps((prev) => [
            ...prev,
            { id: 'step-error', delay: 0, text: `ERROR: ${response.message}`, type: 'error' },
          ]);
          onError(response.message);
          return;
        }

        const mapped = response.allocations.map((a) =>
          mapToMatchResult(a, tasks, volunteers)
        );
        setResults(mapped);
        setLoading(false);
        setError(null);

        const matched = mapped.filter((r) => r.status !== 'unmatched').length;
        const unmatched = mapped.filter((r) => r.status === 'unmatched').length;

        setVisibleSteps((prev) => [
          ...prev,
          { id: 'step-matches', delay: 0, text: `Resolved ${matched} matches successfully`, type: 'success' },
          ...(unmatched > 0
            ? [{ id: 'step-warn', delay: 0, text: `WARNING: ${unmatched} task(s) unmatched — skill gap detected`, type: 'warn' as const }]
            : []),
          { id: 'step-done', delay: 0, text: `Matchmaking complete. ${mapped.length} allocations ready.`, type: 'done' },
        ]);
        setProgress(100);
        setDone(true);

        setTimeout(() => onComplete(), 1200);
      } catch {
        setFailed(true);
        setLoading(false);
        setError('Unexpected error during allocation.');
        setVisibleSteps((prev) => [
          ...prev,
          { id: 'step-error', delay: 0, text: 'ERROR: Could not reach backend. Is the server running?', type: 'error' },
        ]);
        onError('Could not reach backend. Is the server running on port 8000?');
      }
    }, 6000);
    timers.push(apiTimer);

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleSteps]);

  const getStepColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-emerald-400';
      case 'warn':    return 'text-amber-400';
      case 'done':    return 'text-emerald-300';
      case 'error':   return 'text-red-400';
      default:        return 'text-slate-300';
    }
  };

  const getStepPrefix = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'warn':    return '⚠';
      case 'done':    return '●';
      case 'error':   return '✗';
      default:        return '›';
    }
  };

  return (
    <div className="rounded-xl p-5 mb-6" style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-sm font-semibold text-white font-mono">SkillMatch AI Engine</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono"
            style={{ background: 'hsl(160 84% 39% / 0.1)', color: 'hsl(160 84% 39%)', border: '1px solid hsl(160 84% 39% / 0.2)' }}>
            v2.4.1
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!done && !failed && <Loader2 size={14} className="text-emerald-400 animate-spin" />}
          {done && <CheckCircle2 size={14} className="text-emerald-400" />}
          {failed && <AlertTriangle size={14} className="text-red-400" />}
          <span className="text-xs font-mono font-medium"
            style={{ color: failed ? 'hsl(0 72% 60%)' : done ? 'hsl(160 84% 39%)' : 'hsl(215 20% 55%)' }}>
            {failed ? 'FAILED' : done ? 'COMPLETE' : `${progress}%`}
          </span>
        </div>
      </div>

      <div className="w-full h-1 rounded-full mb-4" style={{ background: 'hsl(217 25% 18%)' }}>
        <div
          className="h-1 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: failed ? '#ef4444' : 'hsl(160 84% 39%)' }}
        />
      </div>

      <div
        className="rounded-lg p-4 font-mono text-xs leading-relaxed overflow-y-auto"
        style={{ background: 'hsl(222 47% 8%)', border: '1px solid hsl(217 25% 15%)', maxHeight: '240px', minHeight: '200px' }}
      >
        <div className="mb-2" style={{ color: 'hsl(215 20% 40%)' }}>
          # SkillMatch Allocation Engine — {volunteers.length} volunteers · {tasks.length} tasks
        </div>
        {visibleSteps.map((step) => (
          <div key={step.id} className={`flex items-start gap-2 mb-1 ${getStepColor(step.type)}`}>
            <span className="shrink-0 w-3 text-center">{getStepPrefix(step.type)}</span>
            <span>{step.text}</span>
            {activeStep === step.id && !done && !failed && <span className="terminal-cursor" />}
          </div>
        ))}
        {done && (
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'hsl(217 25% 18%)' }}>
            <span className="text-emerald-400 font-semibold">Ready. Loading results dashboard...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
