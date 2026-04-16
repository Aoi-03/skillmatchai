import React from 'react';
import { Users, UserPlus } from 'lucide-react';

export default function VolunteersHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-emerald-400" />
          <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: 'hsl(160 84% 39%)' }}>
            Volunteer Roster
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Volunteers</h1>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(215 20% 55%)' }}>
          24 registered volunteers · 19 currently assigned · 1 on leave
        </p>
      </div>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-150 active:scale-95 shadow-lg shadow-emerald-900/30">
        <UserPlus size={15} />
        Add Volunteer
      </button>
    </div>
  );
}