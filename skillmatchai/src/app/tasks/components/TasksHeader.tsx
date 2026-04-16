import React from 'react';
import { ClipboardList, Plus, AlertTriangle } from 'lucide-react';

export default function TasksHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={16} className="text-emerald-400" />
          <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: 'hsl(160 84% 39%)' }}>
            Task Database
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Tasks</h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>
          14 tasks · 11 matched · 3 unassigned
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: 'hsl(38 92% 50% / 0.1)', border: '1px solid hsl(38 92% 50% / 0.25)', color: 'hsl(38 92% 55%)' }}>
          <AlertTriangle size={12} />
          3 unassigned tasks
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-150 active:scale-95 shadow-lg shadow-emerald-900/30">
          <Plus size={15} />
          Add Task
        </button>
      </div>
    </div>
  );
}