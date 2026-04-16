'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { LayoutDashboard, Users, ClipboardList, Settings, ChevronLeft, ChevronRight, Zap,  } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { key: 'nav-dashboard', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { key: 'nav-volunteers', href: '/volunteers', icon: Users, label: 'Volunteers', badge: null },
  { key: 'nav-tasks', href: '/tasks', icon: ClipboardList, label: 'Tasks', badge: null },
];

const BOTTOM_ITEMS = [
  { key: 'nav-settings', href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="relative flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'hsl(222 47% 8%)',
        borderRight: '1px solid hsl(217 25% 18%)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        <div className="shrink-0">
          <AppLogo size={32} />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white tracking-tight truncate">SkillMatch AI</span>
            <span className="text-xs" style={{ color: 'hsl(160 84% 39%)' }}>NGO Platform</span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 z-10 flex items-center justify-center w-6 h-6 rounded-full border transition-colors duration-150 hover:bg-emerald-900"
        style={{
          background: 'hsl(222 47% 8%)',
          borderColor: 'hsl(217 25% 18%)',
          color: 'hsl(160 84% 39%)',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Campaign pill */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'hsl(217 30% 11%)', border: '1px solid hsl(217 25% 18%)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium truncate" style={{ color: 'hsl(215 20% 65%)' }}>
            Spring Campaign 2026
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-2 pt-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative ${
                isActive
                  ? 'bg-emerald-950 text-emerald-400' :'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-emerald-500" />
              )}
              <Icon size={18} className="shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'hsl(160 84% 39% / 0.15)', color: 'hsl(160 84% 39%)' }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Engine status */}
      {!collapsed && (
        <div className="mx-3 mb-3">
          <div className="px-3 py-3 rounded-lg" style={{ background: 'hsl(160 84% 39% / 0.08)', border: '1px solid hsl(160 84% 39% / 0.25)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">AI Engine</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'hsl(215 20% 55%)' }}>
              Ready — upload files to run
            </p>
          </div>
        </div>
      )}

      {/* Bottom items */}
      <div className="px-2 pb-3 pt-2 border-t space-y-1" style={{ borderColor: 'hsl(217 25% 18%)' }}>
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-navy-800 hover:text-slate-200 transition-all duration-150"
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {/* User profile placeholder */}
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-navy-800 transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-slate-300">?</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-400 truncate">Not signed in</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}