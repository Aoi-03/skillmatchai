'use client';
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts';
import { useAllocation } from '@/lib/AllocationContext';

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl"
      style={{ background: 'hsl(218 28% 14%)', border: '1px solid hsl(217 25% 22%)', color: 'hsl(210 40% 95%)' }}>
      <p className="font-semibold mb-0.5">{label}</p>
      <p style={{ color: 'hsl(160 84% 39%)' }}>{payload[0].value} matches</p>
    </div>
  );
}

function CustomAreaTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl"
      style={{ background: 'hsl(218 28% 14%)', border: '1px solid hsl(217 25% 22%)', color: 'hsl(210 40% 95%)' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={`tp-${i}`} style={{ color: i === 0 ? 'hsl(160 84% 39%)' : 'hsl(38 92% 50%)' }}>
          {p.name}: {p.value}{i === 1 ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <p className="text-xs font-mono" style={{ color: 'hsl(215 20% 40%)' }}>{label}</p>
    </div>
  );
}

export default function ConfidenceChart() {
  const { results } = useAllocation();

  // Build confidence distribution from real results
  const bands = [
    { range: '90–100%', min: 90, max: 100, fill: '#10b981' },
    { range: '80–89%',  min: 80, max: 89,  fill: '#34d399' },
    { range: '70–79%',  min: 70, max: 79,  fill: '#f59e0b' },
    { range: '60–69%',  min: 60, max: 69,  fill: '#f97316' },
    { range: '<60%',    min: 0,  max: 59,  fill: '#ef4444' },
  ];

  const distribution = bands.map((b) => ({
    range: b.range,
    fill: b.fill,
    count: results.filter((r) => r.confidenceScore >= b.min && r.confidenceScore <= b.max).length,
  }));

  const hasResults = results.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Confidence Distribution */}
      <div className="lg:col-span-2 rounded-xl p-5"
        style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Confidence Distribution</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>Matches by score band</p>
        </div>
        {hasResults ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={distribution} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 25% 18%)" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: 'hsl(215 20% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 20% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(217 25% 18%)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distribution.map((entry) => (
                  <Cell key={`cell-${entry.range}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Run matchmaking engine to see distribution" />
        )}
      </div>

      {/* Match Trend — only shows after runs */}
      <div className="lg:col-span-3 rounded-xl p-5"
        style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Match Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>Confidence scores across current run</p>
          </div>
          {hasResults && (
            <div className="flex items-center gap-3 text-xs" style={{ color: 'hsl(215 20% 55%)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Confidence %</span>
              </div>
            </div>
          )}
        </div>
        {hasResults ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={results.map((r, i) => ({ name: `#${i + 1}`, confidence: r.confidenceScore }))}>
              <defs>
                <linearGradient id="confGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 25% 18%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215 20% 50%)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area type="monotone" dataKey="confidence" name="Confidence" stroke="#10b981" strokeWidth={2} fill="url(#confGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Run matchmaking engine to see trend" />
        )}
      </div>
    </div>
  );
}
