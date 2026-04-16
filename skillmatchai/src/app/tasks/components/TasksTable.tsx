'use client';
import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  UserPlus,
  Eye,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { MOCK_TASKS, Task } from '@/lib/mockData';
import { toast } from 'sonner';

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

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'hsl(0 72% 51% / 0.12)', text: 'hsl(0 72% 65%)', border: 'hsl(0 72% 51% / 0.3)' },
  High: { bg: 'hsl(38 92% 50% / 0.12)', text: 'hsl(38 92% 55%)', border: 'hsl(38 92% 50% / 0.3)' },
  Medium: { bg: 'hsl(217 91% 60% / 0.1)', text: 'hsl(217 91% 65%)', border: 'hsl(217 91% 60% / 0.25)' },
  Low: { bg: 'hsl(215 20% 18%)', text: 'hsl(215 20% 55%)', border: 'hsl(215 20% 25%)' },
};

const STATUS_STYLES: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  open: { icon: AlertTriangle, color: '#f59e0b', label: 'Open' },
  matched: { icon: CheckCircle2, color: '#10b981', label: 'Matched' },
  confirmed: { icon: CheckCircle2, color: '#34d399', label: 'Confirmed' },
  completed: { icon: CheckCircle2, color: '#6ee7b7', label: 'Completed' },
};

type SortField = 'deadline' | 'confidenceScore' | 'estimatedHours' | null;
type SortDir = 'asc' | 'desc';

const CATEGORY_FILTERS = [
  { key: 'cat-all', value: 'all', label: 'All Categories' },
  { key: 'cat-healthcare', value: 'Healthcare', label: 'Healthcare' },
  { key: 'cat-education', value: 'Education', label: 'Education' },
  { key: 'cat-legal', value: 'Legal', label: 'Legal' },
  { key: 'cat-emergency', value: 'Emergency', label: 'Emergency' },
  { key: 'cat-admin', value: 'Administration', label: 'Admin' },
];

const STATUS_FILTERS = [
  { key: 'status-all', value: 'all', label: 'All Status' },
  { key: 'status-open', value: 'open', label: 'Unassigned' },
  { key: 'status-matched', value: 'matched', label: 'Matched' },
  { key: 'status-confirmed', value: 'confirmed', label: 'Confirmed' },
];

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-md font-medium mr-1 mb-0.5"
      style={{ background: 'hsl(217 25% 18%)', color: 'hsl(215 20% 65%)' }}>
      {skill}
    </span>
  );
}

function ConfidencePill({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-xs" style={{ color: 'hsl(215 20% 40%)' }}>—</span>;
  }
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1.5 rounded-full" style={{ background: 'hsl(217 25% 18%)' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono tabular-nums font-semibold" style={{ color }}>{score}%</span>
    </div>
  );
}

function DeadlineCell({ deadline }: { deadline: string }) {
  const today = new Date('2026-04-10');
  const due = new Date(deadline);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays <= 3;
  const isPast = diffDays < 0;

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={12} style={{ color: isPast ? '#ef4444' : isUrgent ? '#f59e0b' : 'hsl(215 20% 45%)' }} />
      <span className="text-xs font-mono" style={{ color: isPast ? '#ef4444' : isUrgent ? '#f59e0b' : 'hsl(215 20% 60%)' }}>
        {deadline}
      </span>
      {isUrgent && !isPast && (
        <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>({diffDays}d)</span>
      )}
      {isPast && (
        <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>Overdue</span>
      )}
    </div>
  );
}

export default function TasksTable() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...MOCK_TASKS];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.assignedVolunteer ?? '').toLowerCase().includes(q) ||
          t.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== 'all') data = data.filter((t) => t.category === categoryFilter);
    if (statusFilter !== 'all') data = data.filter((t) => t.status === statusFilter);
    if (sortField) {
      data.sort((a, b) => {
        if (sortField === 'deadline') {
          return sortDir === 'asc'
            ? a.deadline.localeCompare(b.deadline)
            : b.deadline.localeCompare(a.deadline);
        }
        if (sortField === 'confidenceScore') {
          const aS = a.confidenceScore ?? -1;
          const bS = b.confidenceScore ?? -1;
          return sortDir === 'asc' ? aS - bS : bS - aS;
        }
        if (sortField === 'estimatedHours') {
          return sortDir === 'asc' ? a.estimatedHours - b.estimatedHours : b.estimatedHours - a.estimatedHours;
        }
        return 0;
      });
    }
    return data;
  }, [search, categoryFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const SortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown size={11} className="text-slate-600" />;
    return sortDir === 'asc' ? <ChevronUp size={11} className="text-emerald-400" /> : <ChevronDown size={11} className="text-emerald-400" />;
  };

  return (
    <div className="rounded-xl" style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
      {/* Toolbar */}
      <div className="px-5 py-4 border-b space-y-3" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_FILTERS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setCategoryFilter(opt.value); setPage(1); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
                style={
                  categoryFilter === opt.value
                    ? { background: 'hsl(160 84% 39% / 0.15)', color: 'hsl(160 84% 39%)', border: '1px solid hsl(160 84% 39% / 0.3)' }
                    : { background: 'hsl(217 25% 15%)', color: 'hsl(215 20% 55%)', border: '1px solid hsl(217 25% 20%)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
                style={
                  statusFilter === opt.value
                    ? { background: 'hsl(217 91% 60% / 0.15)', color: 'hsl(217 91% 65%)', border: '1px solid hsl(217 91% 60% / 0.3)' }
                    : { background: 'hsl(217 25% 15%)', color: 'hsl(215 20% 55%)', border: '1px solid hsl(217 25% 20%)' }
                }
              >
                {opt.label}
              </button>
            ))}
            <div className="relative ml-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(215 20% 50%)' }} />
              <input
                type="text"
                placeholder="Search task, volunteer, skill..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none w-52 transition-colors"
                style={{ background: 'hsl(222 47% 8%)', border: '1px solid hsl(217 25% 22%)', color: 'hsl(210 40% 95%)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(217 25% 18%)' }}>
              {[
                { key: 'col-task', label: 'Task Name', field: null as SortField },
                { key: 'col-cat', label: 'Category', field: null as SortField },
                { key: 'col-skills', label: 'Required Skills', field: null as SortField },
                { key: 'col-priority', label: 'Priority', field: null as SortField },
                { key: 'col-deadline', label: 'Deadline', field: 'deadline' as SortField },
                { key: 'col-hours', label: 'Hours', field: 'estimatedHours' as SortField },
                { key: 'col-volunteer', label: 'Assigned Volunteer', field: null as SortField },
                { key: 'col-status', label: 'Status', field: null as SortField },
                { key: 'col-confidence', label: 'Confidence', field: 'confidenceScore' as SortField },
                { key: 'col-actions', label: '', field: null as SortField },
              ].map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-3 whitespace-nowrap"
                  style={{ color: 'hsl(215 20% 50%)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {col.field ? (
                    <button onClick={() => handleSort(col.field)} className="flex items-center gap-1 hover:text-white transition-colors">
                      {col.label}
                      {SortIcon(col.field)}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList size={24} style={{ color: 'hsl(215 20% 35%)' }} />
                    <p className="text-sm font-medium" style={{ color: 'hsl(215 20% 50%)' }}>No tasks match this filter</p>
                    <p className="text-xs" style={{ color: 'hsl(215 20% 35%)' }}>
                      Try a different category, status, or clear the search
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((task, i) => {
                const catColor = CATEGORY_COLORS[task.category] ?? '#94a3b8';
                const priority = PRIORITY_STYLES[task.priority];
                const status = STATUS_STYLES[task.status];
                const StatusIcon = status.icon;
                const isUnassigned = task.status === 'open';

                return (
                  <tr
                    key={task.id}
                    className="group transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom: i < paginated.length - 1 ? '1px solid hsl(217 25% 15%)' : 'none',
                      background: isUnassigned ? 'hsl(38 92% 50% / 0.03)' : undefined,
                    }}
                  >
                    {/* Task Name */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-slate-200">{task.name}</span>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 45%)' }}>{task.location}</p>
                    </td>
                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}
                      >
                        {task.category}
                      </span>
                    </td>
                    {/* Required Skills */}
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <div className="flex flex-wrap">
                        {task.requiredSkills.slice(0, 2).map((s) => (
                          <SkillTag key={`${task.id}-req-${s}`} skill={s} />
                        ))}
                        {task.requiredSkills.length > 2 && (
                          <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{ background: 'hsl(217 25% 18%)', color: 'hsl(215 20% 45%)' }}>
                            +{task.requiredSkills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Priority */}
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: priority.bg, color: priority.text, border: `1px solid ${priority.border}` }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    {/* Deadline */}
                    <td className="px-5 py-3.5">
                      <DeadlineCell deadline={task.deadline} />
                    </td>
                    {/* Hours */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono tabular-nums" style={{ color: 'hsl(215 20% 60%)' }}>
                        {task.estimatedHours}h
                      </span>
                    </td>
                    {/* Assigned Volunteer */}
                    <td className="px-5 py-3.5">
                      {task.assignedVolunteer ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'hsl(160 84% 39% / 0.15)', color: 'hsl(160 84% 39%)' }}
                          >
                            {task.assignedVolunteer.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{task.assignedVolunteer}</span>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                          style={{ background: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 55%)', border: '1px solid hsl(38 92% 50% / 0.2)' }}
                        >
                          <AlertTriangle size={10} />
                          Unassigned
                        </span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <StatusIcon size={12} style={{ color: status.color }} />
                        <span style={{ color: status.color }}>{status.label}</span>
                      </span>
                    </td>
                    {/* Confidence */}
                    <td className="px-5 py-3.5">
                      <ConfidencePill score={task.confidenceScore} />
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUnassigned && (
                          <button
                            onClick={() =>
                              toast.success('Assignment flow opened', {
                                description: `Select a volunteer for "${task.name}"`,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-emerald-950 transition-colors"
                            title="Assign volunteer"
                            aria-label={`Assign volunteer to ${task.name}`}
                          >
                            <UserPlus size={14} className="text-emerald-400" />
                          </button>
                        )}
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                          title="View task details"
                          aria-label={`View ${task.name}`}
                        >
                          <Eye size={14} className="text-slate-400" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                          title="Edit task"
                          aria-label={`Edit ${task.name}`}
                        >
                          <Edit2 size={14} className="text-slate-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <p className="text-xs" style={{ color: 'hsl(215 20% 45%)' }}>
          {filtered.length === 0
            ? 'No tasks found'
            : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} tasks`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
            style={{ background: 'hsl(217 25% 15%)', color: 'hsl(215 20% 60%)', border: '1px solid hsl(217 25% 20%)' }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={`page-${p}`}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={
                page === p
                  ? { background: 'hsl(160 84% 39%)', color: '#fff' }
                  : { background: 'hsl(217 25% 15%)', color: 'hsl(215 20% 60%)', border: '1px solid hsl(217 25% 20%)' }
              }
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
            style={{ background: 'hsl(217 25% 15%)', color: 'hsl(215 20% 60%)', border: '1px solid hsl(217 25% 20%)' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Fix missing import inside component
function ClipboardList({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}