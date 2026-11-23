import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Database, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import api from '../../api/client';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  // Derive friendly page title
  const pageTitles: Record<string, string> = {
    '/': 'Executive Overview & Control Tower',
    '/network': 'Multi-Tier Supply Network Visualizer',
    '/suppliers': 'Supplier Directory & Risk Profiles',
    '/facilities': 'Manufacturing Plants & Logistics Hubs',
    '/inventory': 'Multi-Echelon Inventory & Buffer Health',
    '/scenarios': 'Disruption Scenario Studio',
    '/simulation': 'Deterministic Discrete-Event Simulation Lab',
    '/mitigation': 'Mitigation Strategy Optimizer & Frontier',
    '/agents': 'LangGraph Multi-Agent Intelligence Center',
    '/reports': 'Executive Reports & Audit Export',
    '/approvals': 'Human-in-the-Loop Governance & Approvals',
    '/settings': 'Organization Profile & Security Settings',
  };

  const currentTitle = pageTitles[location.pathname] || 'Control Tower';

  const handleResetData = async () => {
    if (!window.confirm('Reset supply chain back to Apex Manufacturing Group baseline synthetic dataset?')) {
      return;
    }
    setIsSeeding(true);
    try {
      await api.post('/demo/seed');
      window.location.reload();
    } catch (err) {
      alert('Failed to re-seed demo data.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{currentTitle}</h1>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Shield className="w-3.5 h-3.5 text-sky-600" />
          <span>{user?.organization_name || 'Apex Manufacturing Group'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Synthetic Demo Indicator */}
        <Badge variant="synthetic">
          SYNTHETIC DEMO ENVIRONMENT
        </Badge>

        {/* 1-Click Demo Seed Reset */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetData}
          isLoading={isSeeding}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          title="Reset back to baseline Apex synthetic data"
        >
          Reset Demo Data
        </Button>

        {/* User Role Pill */}
        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {user?.role || 'SupplyChainManager'}
        </span>
      </div>
    </header>
  );
};
