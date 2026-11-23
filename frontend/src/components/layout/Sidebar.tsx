import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Truck,
  Building2,
  Boxes,
  AlertTriangle,
  FlaskConical,
  ShieldCheck,
  Bot,
  FileText,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Overview', to: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Supply Network', to: '/network', icon: <Network className="w-4 h-4" /> },
    { name: 'Suppliers', to: '/suppliers', icon: <Truck className="w-4 h-4" /> },
    { name: 'Facilities', to: '/facilities', icon: <Building2 className="w-4 h-4" /> },
    { name: 'Inventory', to: '/inventory', icon: <Boxes className="w-4 h-4" /> },
    { name: 'Disruption Scenarios', to: '/scenarios', icon: <AlertTriangle className="w-4 h-4" /> },
    { name: 'Simulation Lab', to: '/simulation', icon: <FlaskConical className="w-4 h-4" /> },
    { name: 'Mitigation Planner', to: '/mitigation', icon: <ShieldCheck className="w-4 h-4" /> },
    { name: 'AI Insights', to: '/agents', icon: <Bot className="w-4 h-4" />, badge: 'LangGraph' },
    { name: 'Reports', to: '/reports', icon: <FileText className="w-4 h-4" /> },
    { name: 'Approvals', to: '/approvals', icon: <CheckSquare className="w-4 h-4" /> },
    { name: 'Organization Settings', to: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={clsx(
        'h-full flex flex-col rounded-2xl bg-[#111127]/90 backdrop-blur-xl text-[#A6A4C3] border border-[rgba(160,140,255,0.16)] transition-all duration-200 select-none shadow-card relative overflow-hidden',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Top subtle glow edge */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#9875FF]/40 to-transparent" />

      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[rgba(160,140,255,0.1)]">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7957E8] to-[#9875FF] flex items-center justify-center font-bold text-white shadow-glow-purple flex-shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-wider text-[#F4F2FF] font-mono flex items-center gap-1.5">
                NEXUS
                <span className="w-1.5 h-1.5 rounded-full bg-[#42D9E8] animate-pulse" />
              </span>
              <span className="text-[10px] text-[#A6A4C3] tracking-widest font-mono uppercase truncate">
                AI Intelligence
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7957E8] to-[#9875FF] flex items-center justify-center font-bold text-white mx-auto shadow-glow-purple">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'p-1.5 rounded-lg text-[#A6A4C3] hover:text-[#F4F2FF] hover:bg-[rgba(121,87,232,0.15)] transition-colors',
            collapsed && 'hidden'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-gradient-to-r from-[#7957E8]/30 to-[#9875FF]/15 text-[#F4F2FF] border border-[#9875FF]/35 shadow-glow-purple font-semibold'
                  : 'text-[#A6A4C3] hover:text-[#F4F2FF] hover:bg-[rgba(121,87,232,0.12)]'
              )
            }
            title={collapsed ? item.name : undefined}
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-[#9875FF]' : 'group-hover:text-[#9875FF]'
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate flex-1">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-[#7957E8]/20 text-[#9875FF] border border-[#9875FF]/30">
                    {item.badge}
                  </span>
                )}

                {/* Hover Tooltip when Collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#141432] text-[#F4F2FF] text-xs rounded-lg shadow-xl border border-[rgba(160,140,255,0.25)] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.name}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Profile & Collapse Toggle */}
      <div className="p-3 border-t border-[rgba(160,140,255,0.1)] space-y-2">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 rounded-xl text-[#A6A4C3] hover:text-[#F4F2FF] hover:bg-[rgba(121,87,232,0.15)] transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between p-2.5 bg-[rgba(25,25,55,0.65)] rounded-xl border border-[rgba(160,140,255,0.14)]">
            <div className="flex items-center gap-2.5 min-w-0 mr-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7957E8]/60 to-[#42D9E8]/40 border border-[#9875FF]/30 flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0">
                {user?.full_name?.substring(0, 2).toUpperCase() || 'SJ'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-[#F4F2FF] truncate">
                  {user?.full_name || 'Sarah Jenkins'}
                </span>
                <span className="text-[10px] text-[#A6A4C3] truncate">
                  {user?.organization_name || 'Apex Manufacturing'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[#A6A4C3] hover:text-[#FF718A] hover:bg-[rgba(255,113,138,0.12)] transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
