import React from 'react';
import { Zap, RefreshCw } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium" style={{ color: 'hsl(160 84% 39%)' }}>
            SPRING CAMPAIGN 2026
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Allocation Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>
          AI-powered volunteer-to-task matching engine
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)', color: 'hsl(215 20% 55%)' }}>
          <RefreshCw size={12} />
          <span>Last run: 2h ago</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'hsl(160 84% 39% / 0.1)', border: '1px solid hsl(160 84% 39% / 0.3)', color: 'hsl(160 84% 39%)' }}>
          <Zap size={12} />
          <span>Engine Ready</span>
        </div>
      </div>
    </div>
  );
}