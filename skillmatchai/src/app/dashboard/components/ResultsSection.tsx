'use client';
import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronUp, ChevronDown, ChevronsUpDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAllocation } from '@/lib/AllocationContext';
import { MatchResult } from '@/lib/mockData';

type SortDir = 'asc' | 'desc' | null;

function ConfidenceBar({ score }: { score: number }) {
  const color =
    score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : score === 0 ? '#374151' : '#ef4444';
  const label =
    score === 0 ? 'Unmatched' : score >= 85 ? 'High' : score >= 70 ? 'Moderate' : 'Low';

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'hsl(217 25% 18%)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-semibold tabular-nums w-8 text-right" style={{ color }}>
        {score > 0 ? `${score}%` : '—'}
      </span>
      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
        style={{ background: `${color}18`, color, minWidth: '60px', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

function ReasoningCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = text.length > 80 && !expanded;
  return (
    <div className="max-w-xs">
      <p className="text-xs leading-relaxed" style={{ color: 'hsl(215 20% 60%)' }}>
        {truncated ? text.slice(0, 80) + '…' : text}
      </p>
      {text.length > 80 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs mt-0.5 hover:underline"
          style={{ color: 'hsl(160 84% 39%)' }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Healthcare: '#0ea5e9',
  Legal: '#a855f7',
  Education: '#f59e0b',
  Emergency: '#ef4444',
  Finance: '#10b981',
  Environment: '#22c55e',
  'Social Services': '#ec4899',
  Community: '#f97316',
  Administration: '#94a3b8',
};

function exportToCSV(data: MatchResult[]) {
  const headers = ['Task Name', 'Category', 'Assigned Volunteer', 'Confidence Score', 'Status', 'AI Reasoning'];
  const rows = data.map((r) => [
    `"${r.taskName}"`,
    r.taskCategory,
    `"${r.assignedVolunteer}"`,
    r.confidenceScore,
    r.status,
    `"${r.aiReasoning.replace(/"/g, "'")}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skillmatch-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsSection() {
  const { results, isLoading } = useAllocation();
  const data = results;
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    let source = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      source = source.filter(
        (r) =>
          r.assignedVolunteer.toLowerCase().includes(q) ||
          r.taskName.toLowerCase().includes(q)
      );
    }
    if (sortDir) {
      source.sort((a, b) =>
        sortDir === 'desc' ? b.confidenceScore - a.confidenceScore : a.confidenceScore - b.confidenceScore
      );
    }
    return source;
  }, [search, sortDir, data]);

  const handleSort = () => {
    setSortDir((prev) => (prev === 'desc' ? 'asc' : prev === 'asc' ? null : 'desc'));
  };

  const handleExport = () => {
    exportToCSV(filtered);
    toast.success('Schedule exported', {
      description: `${filtered.length} allocations downloaded as CSV`,
    });
  };

  const SortIcon = sortDir === 'desc' ? ChevronDown : sortDir === 'asc' ? ChevronUp : ChevronsUpDown;

  return (
    <div className="rounded-xl mb-8" style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <div>
          <h2 className="text-sm font-semibold text-white">Allocation Results</h2>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>
            {filtered.length} of {data.length} matches shown
            {results.length > 0 && <span className="ml-2 text-emerald-400 font-medium">· Live results</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(215 20% 50%)' }} />
            <input
              type="text"
              placeholder="Search volunteer or task..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none transition-colors w-52"
              style={{
                background: 'hsl(222 47% 8%)',
                border: '1px solid hsl(217 25% 22%)',
                color: 'hsl(210 40% 95%)',
              }}
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 hover:bg-emerald-700 active:scale-95"
            style={{ background: 'hsl(160 84% 39% / 0.15)', border: '1px solid hsl(160 84% 39% / 0.3)', color: 'hsl(160 84% 39%)' }}
          >
            <Download size={13} />
            Export Schedule
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(217 25% 18%)' }}>
              {[
                { key: 'th-task', label: 'Task Name', sortable: false },
                { key: 'th-category', label: 'Category', sortable: false },
                { key: 'th-volunteer', label: 'Assigned Volunteer', sortable: false },
                { key: 'th-confidence', label: 'Confidence Score', sortable: true },
                { key: 'th-reasoning', label: 'AI Reasoning', sortable: false },
              ].map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-3"
                  style={{ color: 'hsl(215 20% 50%)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {col.sortable ? (
                    <button
                      onClick={handleSort}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {col.label}
                      <SortIcon size={12} className={sortDir ? 'text-emerald-400' : ''} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Search size={24} style={{ color: 'hsl(215 20% 35%)' }} />
                    <p className="text-sm font-medium" style={{ color: 'hsl(215 20% 50%)' }}>No matches found</p>
                    <p className="text-xs" style={{ color: 'hsl(215 20% 35%)' }}>
                      Try a different volunteer name or task keyword
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={row.id}
                  className="group transition-colors hover:bg-white/[0.02]"
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid hsl(217 25% 16%)' : 'none',
                    background: row.status === 'unmatched' ? 'hsl(0 72% 51% / 0.04)' : undefined,
                  }}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-slate-200">{row.taskName}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${CATEGORY_COLORS[row.taskCategory] ?? '#94a3b8'}18`,
                        color: CATEGORY_COLORS[row.taskCategory] ?? '#94a3b8',
                        border: `1px solid ${CATEGORY_COLORS[row.taskCategory] ?? '#94a3b8'}30`,
                      }}
                    >
                      {row.taskCategory}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {row.status === 'unmatched' ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'hsl(0 72% 60%)' }}>
                        <Info size={12} />
                        Unassigned
                      </span>
                    ) : (
                      <span className="text-sm text-slate-300 font-medium">{row.assignedVolunteer}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <ConfidenceBar score={row.confidenceScore} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ReasoningCell text={row.aiReasoning} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <p className="text-xs" style={{ color: 'hsl(215 20% 45%)' }}>
          Showing {filtered.length} allocations · Last updated Apr 10, 2026 at 17:09
        </p>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(215 20% 50%)' }}>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span>High ≥85%</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span>Moderate 70–84%</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /><span>Low &lt;70%</span></div>
        </div>
      </div>
    </div>
  );
}