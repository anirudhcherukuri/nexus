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
  Zap
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
        'h-screen flex flex-col bg-[#0B132B] text-slate-300 border-r border-[#1C2541] transition-all duration-200 select-none z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1C2541]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-wide text-white font-mono">NEXUS</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono truncate">Supply Intelligence</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-white mx-auto shadow-sm">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#1C2541] transition-colors',
            collapsed && 'hidden'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#1C2541]/70'
              )
            }
            title={collapsed ? item.name : undefined}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate flex-1">{item.name}</span>}
            {!collapsed && item.badge && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {item.badge}
              </span>
            )}

            {/* Hover Tooltip when Collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Profile & Collapse Toggle */}
      <div className="p-3 border-t border-[#1C2541] space-y-2">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-[#1C2541]"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#141E38] rounded-md border border-[#1C2541]">
            <div className="flex flex-col truncate mr-2">
              <span className="text-xs font-semibold text-slate-200 truncate">
                {user?.full_name || 'Sarah Jenkins'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.organization_name || 'Apex Manufacturing'}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1C2541] transition-colors"
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
