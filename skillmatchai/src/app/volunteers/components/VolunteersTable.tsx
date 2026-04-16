'use client';
import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Edit2,
  UserCheck,
  Filter,
} from 'lucide-react';
import { MOCK_VOLUNTEERS, Volunteer } from '@/lib/mockData';
import { toast } from 'sonner';
import Icon from '@/components/ui/AppIcon';


const AVAILABILITY_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  available: { bg: 'hsl(160 84% 39% / 0.12)', text: 'hsl(160 84% 39%)', dot: '#10b981', label: 'Available' },
  assigned: { bg: 'hsl(217 91% 60% / 0.12)', text: 'hsl(217 91% 65%)', dot: '#60a5fa', label: 'Assigned' },
  'on-leave': { bg: 'hsl(38 92% 50% / 0.12)', text: 'hsl(38 92% 55%)', dot: '#f59e0b', label: 'On Leave' },
};

const EXPERIENCE_STYLES: Record<string, { bg: string; text: string }> = {
  Junior: { bg: 'hsl(215 20% 20%)', text: 'hsl(215 20% 65%)' },
  Mid: { bg: 'hsl(217 91% 60% / 0.1)', text: 'hsl(217 91% 65%)' },
  Senior: { bg: 'hsl(160 84% 39% / 0.1)', text: 'hsl(160 84% 39%)' },
  Expert: { bg: 'hsl(270 70% 60% / 0.1)', text: 'hsl(270 70% 70%)' },
};

type SortField = 'name' | 'totalMatches' | 'successRate' | 'lastActive' | null;
type SortDir = 'asc' | 'desc';

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-md font-medium mr-1 mb-0.5"
      style={{ background: 'hsl(217 25% 18%)', color: 'hsl(215 20% 65%)' }}>
      {skill}
    </span>
  );
}

function SuccessBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full" style={{ background: 'hsl(217 25% 18%)' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${rate}%`, background: color }} />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color }}>{rate}%</span>
    </div>
  );
}

function SortButton({
  field,
  currentField,
  dir,
  onClick,
}: {
  field: SortField;
  currentField: SortField;
  dir: SortDir;
  onClick: () => void;
}) {
  const active = currentField === field;
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button onClick={onClick} className={`ml-1 inline-flex ${active ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}>
      <Icon size={12} />
    </button>
  );
}

const FILTER_OPTIONS = [
  { key: 'filter-all', value: 'all', label: 'All' },
  { key: 'filter-available', value: 'available', label: 'Available' },
  { key: 'filter-assigned', value: 'assigned', label: 'Assigned' },
  { key: 'filter-on-leave', value: 'on-leave', label: 'On Leave' },
];

export default function VolunteersTable() {
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('totalMatches');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...MOCK_VOLUNTEERS];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.role.toLowerCase().includes(q) ||
          v.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (availFilter !== 'all') {
      data = data.filter((v) => v.availability === availFilter);
    }
    if (sortField) {
      data.sort((a, b) => {
        let aVal: string | number = 0;
        let bVal: string | number = 0;
        if (sortField === 'name') { aVal = a.name; bVal = b.name; }
        if (sortField === 'totalMatches') { aVal = a.totalMatches; bVal = b.totalMatches; }
        if (sortField === 'successRate') { aVal = a.successRate; bVal = b.successRate; }
        if (sortField === 'lastActive') { aVal = a.lastActive; bVal = b.lastActive; }
        if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
        return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
    }
    return data;
  }, [search, availFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAssign = (vol: Volunteer) => {
    toast.success(`${vol.name} flagged for assignment`, {
      description: 'Open Tasks page to assign to a specific task',
    });
  };

  return (
    <div className="rounded-xl" style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <div className="flex items-center gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setAvailFilter(opt.value); setPage(1); }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
              style={
                availFilter === opt.value
                  ? { background: 'hsl(160 84% 39% / 0.15)', color: 'hsl(160 84% 39%)', border: '1px solid hsl(160 84% 39% / 0.3)' }
                  : { background: 'hsl(217 25% 15%)', color: 'hsl(215 20% 55%)', border: '1px solid hsl(217 25% 20%)' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(215 20% 50%)' }} />
          <input
            type="text"
            placeholder="Search name, role, or skill..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none w-56 transition-colors"
            style={{ background: 'hsl(222 47% 8%)', border: '1px solid hsl(217 25% 22%)', color: 'hsl(210 40% 95%)' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid hsl(217 25% 18%)' }}>
              {[
                { key: 'col-name', label: 'Volunteer', field: 'name' as SortField },
                { key: 'col-role', label: 'Role / Expertise', field: null },
                { key: 'col-skills', label: 'Skills', field: null },
                { key: 'col-avail', label: 'Availability', field: null },
                { key: 'col-exp', label: 'Level', field: null },
                { key: 'col-matches', label: 'Total Matches', field: 'totalMatches' as SortField },
                { key: 'col-rate', label: 'Success Rate', field: 'successRate' as SortField },
                { key: 'col-active', label: 'Last Active', field: 'lastActive' as SortField },
                { key: 'col-actions', label: '', field: null },
              ].map((col) => (
                <th
                  key={col.key}
                  className="text-left px-5 py-3 whitespace-nowrap"
                  style={{ color: 'hsl(215 20% 50%)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {col.label}
                  {col.field && (
                    <SortButton
                      field={col.field}
                      currentField={sortField}
                      dir={sortDir}
                      onClick={() => handleSort(col.field)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Filter size={24} style={{ color: 'hsl(215 20% 35%)' }} />
                    <p className="text-sm font-medium" style={{ color: 'hsl(215 20% 50%)' }}>No volunteers match this filter</p>
                    <p className="text-xs" style={{ color: 'hsl(215 20% 35%)' }}>Try a different availability status or clear the search</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((vol, i) => {
                const avail = AVAILABILITY_STYLES[vol.availability];
                const exp = EXPERIENCE_STYLES[vol.experienceLevel];
                return (
                  <tr
                    key={vol.id}
                    className="group transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: i < paginated.length - 1 ? '1px solid hsl(217 25% 15%)' : 'none' }}
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: 'hsl(160 84% 39% / 0.15)', color: 'hsl(160 84% 39%)' }}
                        >
                          {vol.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200 leading-tight">{vol.name}</p>
                          <p className="text-xs" style={{ color: 'hsl(215 20% 50%)' }}>{vol.location}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-300">{vol.role}</span>
                    </td>
                    {/* Skills */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <div className="flex flex-wrap">
                        {vol.skills.slice(0, 3).map((s) => (
                          <SkillTag key={`${vol.id}-skill-${s}`} skill={s} />
                        ))}
                        {vol.skills.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{ background: 'hsl(217 25% 18%)', color: 'hsl(215 20% 45%)' }}>
                            +{vol.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Availability */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: avail.bg, color: avail.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: avail.dot }} />
                        {avail.label}
                      </span>
                    </td>
                    {/* Experience */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{ background: exp.bg, color: exp.text }}>
                        {vol.experienceLevel}
                      </span>
                    </td>
                    {/* Total Matches */}
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono tabular-nums font-semibold text-slate-200">{vol.totalMatches}</span>
                    </td>
                    {/* Success Rate */}
                    <td className="px-5 py-3.5">
                      <SuccessBar rate={vol.successRate} />
                    </td>
                    {/* Last Active */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono" style={{ color: 'hsl(215 20% 55%)' }}>
                        {vol.lastActive}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleAssign(vol)}
                          className="p-1.5 rounded-lg hover:bg-emerald-950 transition-colors"
                          title="Assign to task"
                          aria-label={`Assign ${vol.name}`}
                        >
                          <UserCheck size={14} className="text-emerald-400" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                          title="View profile"
                          aria-label={`View ${vol.name}`}
                        >
                          <Eye size={14} className="text-slate-400" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                          title="Edit volunteer"
                          aria-label={`Edit ${vol.name}`}
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
          {filtered.length === 0 ? 'No results' : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} volunteers`}
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