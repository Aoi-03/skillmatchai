'use client';
import React from 'react';
import { CheckCircle2, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import ConfidenceChart from './ConfidenceChart';
import { useAllocation } from '@/lib/AllocationContext';

type KPICardData = {
  id: string;
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend: string;
  trendPositive: boolean;
  highlight: boolean;
  alert?: boolean;
};

function KPICard({ card }: { card: KPICardData }) {
  const Icon = card.icon;
  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: card.alert
          ? 'hsl(38 92% 50% / 0.05)'
          : card.highlight
          ? 'hsl(160 84% 39% / 0.05)'
          : 'hsl(217 30% 11%)',
        border: card.alert
          ? '1px solid hsl(38 92% 50% / 0.3)'
          : card.highlight
          ? '1px solid hsl(160 84% 39% / 0.3)'
          : '1px solid hsl(217 25% 18%)',
        minHeight: '130px',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'hsl(215 20% 50%)' }}>
          {card.label}
        </p>
        <div className={`p-2 rounded-lg ${card.iconBg}`}>
          <Icon size={15} className={card.iconColor} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums text-white leading-none mb-1">{card.value}</p>
        <p className="text-xs mb-2" style={{ color: 'hsl(215 20% 50%)' }}>{card.sub}</p>
        <span className={`text-xs font-medium ${card.trendPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
          {card.trend}
        </span>
      </div>
    </div>
  );
}

export default function KPIBentoGrid() {
  const { results, volunteers } = useAllocation();
  const data = results;
  const matched = data.filter((r) => r.status !== 'unmatched').length;
  const unmatched = data.filter((r) => r.status === 'unmatched').length;
  const avgConfidence = matched > 0
    ? (data.filter((r) => r.status !== 'unmatched').reduce((s, r) => s + r.confidenceScore, 0) / matched).toFixed(1)
    : '0';
  const utilization = volunteers.length > 0
    ? Math.round((matched / volunteers.length) * 100)
    : 79;

  const KPI_CARDS: KPICardData[] = [
    {
      id: 'kpi-matches', label: 'Total Matches Made',
      value: String(matched), sub: `of ${data.length} tasks`,
      icon: CheckCircle2, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-950/60',
      trend: `${unmatched} unmatched`, trendPositive: unmatched === 0, highlight: false,
    },
    {
      id: 'kpi-confidence', label: 'Avg Match Confidence',
      value: `${avgConfidence}%`, sub: `across ${matched} matches`,
      icon: TrendingUp, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-950/60',
      trend: Number(avgConfidence) >= 80 ? 'High confidence' : 'Moderate confidence',
      trendPositive: Number(avgConfidence) >= 80, highlight: true,
    },
    {
      id: 'kpi-unassigned', label: 'Unassigned Tasks',
      value: String(unmatched), sub: 'require manual review',
      icon: AlertTriangle, iconColor: 'text-amber-400', iconBg: 'bg-amber-950/60',
      trend: unmatched > 0 ? 'Skill gaps detected' : 'All tasks assigned',
      trendPositive: unmatched === 0, highlight: false, alert: unmatched > 0,
    },
    {
      id: 'kpi-utilization', label: 'Volunteer Utilization',
      value: `${utilization}%`, sub: `${matched} of ${volunteers.length || 24} volunteers`,
      icon: Users, iconColor: 'text-sky-400', iconBg: 'bg-sky-950/60',
      trend: utilization >= 75 ? 'Good utilization' : 'Low utilization',
      trendPositive: utilization >= 75, highlight: false,
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {KPI_CARDS.map((card) => (
          <KPICard key={card.id} card={card} />
        ))}
      </div>
      <ConfidenceChart />
    </div>
  );
}
