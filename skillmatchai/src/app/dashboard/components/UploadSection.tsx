'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Play, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import TerminalEngine from './TerminalEngine';
import { parseVolunteers, parseTasks, VolunteerPayload, TaskPayload } from '@/lib/api';
import { useAllocation } from '@/lib/AllocationContext';

interface FileState {
  file: File | null;
  recordCount: number | null;
  error: string | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

const INITIAL_FILE_STATE: FileState = { file: null, recordCount: null, error: null, status: 'idle' };

function FileUploadZone({
  label, description, state, onFileAccepted, onClear,
}: {
  label: string;
  description: string;
  state: FileState;
  onFileAccepted: (file: File) => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileAccepted(file);
  }, [onFileAccepted]);

  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';

  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'hsl(215 20% 55%)' }}>
        {label}
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isSuccess && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-5 transition-all duration-200 cursor-pointer ${
          isSuccess ? 'cursor-default border-emerald-500/50 bg-emerald-950/20'
          : isError ? 'border-red-500/50 bg-red-950/10'
          : dragging ? 'border-emerald-400 bg-emerald-950/20 scale-[1.01]'
          : 'border-slate-700 hover:border-slate-500 bg-navy-800/30'
        }`}
        style={{ minHeight: '120px' }}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileAccepted(f); }}
          aria-label={`File input for ${label}`}
        />
        {isSuccess && state.file ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-300 truncate">{state.file.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>{state.recordCount} records parsed</p>
              <p className="text-xs mt-1 font-mono" style={{ color: 'hsl(160 84% 39%)' }}>✓ Ready for processing</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="p-1 rounded hover:bg-slate-700 transition-colors" aria-label="Remove file">
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        ) : isError ? (
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Upload Failed</p>
              <p className="text-xs mt-0.5 text-red-400">{state.error}</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(215 20% 55%)' }}>Click to try again</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-2 py-2">
            <div className={`p-2.5 rounded-lg transition-colors ${dragging ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
              <Upload size={18} className={dragging ? 'text-emerald-400' : 'text-slate-400'} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">{dragging ? 'Drop to upload' : 'Drop file here'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>{description}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'hsl(217 25% 18%)', color: 'hsl(215 20% 55%)' }}>
              CSV / JSON
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadSection() {
  const [volunteerFile, setVolunteerFile] = useState<FileState>(INITIAL_FILE_STATE);
  const [taskFile, setTaskFile] = useState<FileState>(INITIAL_FILE_STATE);
  const [engineRunning, setEngineRunning] = useState(false);
  const [engineComplete, setEngineComplete] = useState(false);
  const [parsedVolunteers, setParsedVolunteers] = useState<VolunteerPayload[]>([]);
  const [parsedTasks, setParsedTasks] = useState<TaskPayload[]>([]);
  const { setVolunteers, setTasks } = useAllocation();

  const handleFileAccepted = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<FileState>>,
    type: 'volunteer' | 'task',
    label: string
  ) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      setter({ file, recordCount: null, error: 'Only CSV and JSON files are accepted.', status: 'error' });
      return;
    }
    const text = await file.text();
    if (!text.trim()) {
      setter({ file, recordCount: null, error: 'File is empty.', status: 'error' });
      return;
    }
    try {
      if (type === 'volunteer') {
        const parsed = parseVolunteers(text, file.name);
        if (parsed.length === 0) throw new Error('No valid records found.');
        setParsedVolunteers(parsed);
        setVolunteers(parsed);
        setter({ file, recordCount: parsed.length, error: null, status: 'success' });
      } else {
        const parsed = parseTasks(text, file.name);
        if (parsed.length === 0) throw new Error('No valid records found.');
        setParsedTasks(parsed);
        setTasks(parsed);
        setter({ file, recordCount: parsed.length, error: null, status: 'success' });
      }
      toast.success(`${label} uploaded`, { description: `${file.name} parsed successfully`, duration: 4000 });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to parse file.';
      setter({ file, recordCount: null, error: msg, status: 'error' });
    }
  };

  const canRun = volunteerFile.status === 'success' && taskFile.status === 'success';

  const handleRunEngine = () => {
    if (!canRun) {
      toast.error('Upload required', { description: 'Please upload both files before running.' });
      return;
    }
    setEngineRunning(true);
    setEngineComplete(false);
  };

  const handleEngineComplete = () => {
    setEngineRunning(false);
    setEngineComplete(true);
    toast.success('Matchmaking complete', { description: 'Results loaded below.', duration: 5000 });
  };

  const handleEngineError = (msg: string) => {
    setEngineRunning(false);
    toast.error('Allocation failed', { description: msg, duration: 8000 });
  };

  if (engineRunning) {
    return (
      <TerminalEngine
        volunteers={parsedVolunteers}
        tasks={parsedTasks}
        onComplete={handleEngineComplete}
        onError={handleEngineError}
      />
    );
  }

  return (
    <div className="rounded-xl p-5 mb-6" style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Data Ingestion</h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>
            Upload volunteer roster and task database to begin matching
          </p>
        </div>
        {engineComplete && (
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-lg"
            style={{ background: 'hsl(160 84% 39% / 0.1)', border: '1px solid hsl(160 84% 39% / 0.3)', color: 'hsl(160 84% 39%)' }}>
            <CheckCircle2 size={12} />
            Results loaded below
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <FileUploadZone
          label="Volunteer Roster"
          description="id, name, skills (pipe-separated), availability"
          state={volunteerFile}
          onFileAccepted={(f) => handleFileAccepted(f, setVolunteerFile, 'volunteer', 'Volunteer Roster')}
          onClear={() => { setVolunteerFile(INITIAL_FILE_STATE); setParsedVolunteers([]); }}
        />
        <div className="flex items-center justify-center shrink-0">
          <ChevronRight size={18} style={{ color: 'hsl(215 20% 40%)' }} />
        </div>
        <FileUploadZone
          label="Task Database"
          description="id, title, required_skills (pipe-separated), urgency_level"
          state={taskFile}
          onFileAccepted={(f) => handleFileAccepted(f, setTaskFile, 'task', 'Task Database')}
          onClear={() => { setTaskFile(INITIAL_FILE_STATE); setParsedTasks([]); }}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(215 20% 55%)' }}>
          <div className="flex items-center gap-1.5">
            <FileText size={12} />
            <span>Volunteers: <span className={volunteerFile.status === 'success' ? 'text-emerald-400 font-medium' : ''}>
              {volunteerFile.status === 'success' ? `${volunteerFile.recordCount} records` : 'Not uploaded'}
            </span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText size={12} />
            <span>Tasks: <span className={taskFile.status === 'success' ? 'text-emerald-400 font-medium' : ''}>
              {taskFile.status === 'success' ? `${taskFile.recordCount} records` : 'Not uploaded'}
            </span></span>
          </div>
        </div>
        <button
          onClick={handleRunEngine}
          disabled={!canRun}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            canRun ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 shadow-lg shadow-emerald-900/40'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play size={14} />
          Run Matchmaking Engine
        </button>
      </div>
    </div>
  );
}
