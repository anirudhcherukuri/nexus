import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Building2,
  AlertTriangle,
  ShieldAlert,
  Boxes,
  Activity,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import api from '../api/client';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CriticalSupplierReport } from '../types';

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [criticalSuppliers, setCriticalSuppliers] = useState<CriticalSupplierReport[]>([]);
  const [stats, setStats] = useState({
    totalSuppliers: 30,
    totalFacilities: 8,
    activeDisruptions: 2,
    spofCount: 3,
    resilienceScore: 82.4,
    financialLossAtRisk: 1425000,
  });

  useEffect(() => {
    const loadOverviewData = async () => {
      try {
        const [graphRes, critRes] = await Promise.all([
          api.get('/network/graph'),
          api.get('/network/criticality'),
        ]);

        const g = graphRes.data;
        setCriticalSuppliers(critRes.data.slice(0, 5));
        setStats({
          totalSuppliers: g.tier_counts['Tier 1'] + g.tier_counts['Tier 2'] + g.tier_counts['Tier 3'] || 30,
          totalFacilities: g.tier_counts['Tier 0'] + g.tier_counts['Downstream'] || 8,
          activeDisruptions: 2,
          spofCount: g.spof_count || 3,
          resilienceScore: 82.4,
          financialLossAtRisk: 1425000,
        });
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    };
    loadOverviewData();
  }, []);

  const riskDistributionData = [
    { name: 'Critical Risk', count: 4, color: '#EF4444' },
    { name: 'High Risk', count: 8, color: '#F97316' },
    { name: 'Medium Risk', count: 12, color: '#F59E0B' },
    { name: 'Low Risk', count: 6, color: '#10B981' },
  ];

  const plantUtilizationData = [
    { name: 'Detroit Plant', capacity: 1200, utilization: 85, color: '#0284C7' },
    { name: 'Stuttgart Plant', capacity: 1000, utilization: 80, color: '#0284C7' },
    { name: 'Tokyo Hub', capacity: 900, utilization: 78, color: '#0284C7' },
    { name: 'Ohio Works', capacity: 1500, utilization: 92, color: '#EF4444' },
    { name: 'Monterrey Plant', capacity: 1100, utilization: 82, color: '#0284C7' },
  ];

  const simulationTrendData = [
    { day: 'Day 1', baseline: 1200, disrupted: 1200 },
    { day: 'Day 5', baseline: 1200, disrupted: 1100 },
    { day: 'Day 10', baseline: 1200, disrupted: 780 },
    { day: 'Day 15', baseline: 1200, disrupted: 620 },
    { day: 'Day 20', baseline: 1200, disrupted: 650 },
    { day: 'Day 25', baseline: 1200, disrupted: 890 },
    { day: 'Day 30', baseline: 1200, disrupted: 1150 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Agent Intelligence Alert */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1C2541] to-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500 text-white">
              NEXUS AI ADVISORY
            </span>
            <span className="text-xs text-slate-300">Deterministic Model Run #SIM-4029</span>
          </div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Primary Semiconductor Single-Point-of-Failure Detected: Potential $1.42M Exposure
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Simulated 21-day fab outage at Taiwan Microelectronics will exhaust Detroit and Stuttgart buffer stock by Day 12.
            AI Multi-Agent portfolio recommended secondary supplier activation and air freight priority.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/agents')}
            icon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
          >
            Open AI Agent Briefing
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/simulation')}
            className="bg-blue-600 hover:bg-blue-500"
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Run Simulation Lab
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total Suppliers"
          value={stats.totalSuppliers}
          subtitle="Tiers 1, 2, and 3"
          icon={<Truck className="w-4 h-4 text-blue-600" />}
        />
        <MetricCard
          title="Facilities"
          value={stats.totalFacilities}
          subtitle="5 Plants / 3 DCs"
          icon={<Building2 className="w-4 h-4 text-slate-600" />}
        />
        <MetricCard
          title="Active Disruptions"
          value={stats.activeDisruptions}
          subtitle="1 Outage / 1 Port Delay"
          statusVariant="warning"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          title="Critical SPOFs"
          value={stats.spofCount}
          subtitle="Single Points of Failure"
          statusVariant="critical"
          icon={<ShieldAlert className="w-4 h-4 text-rose-600" />}
        />
        <MetricCard
          title="Resilience Score"
          value={`${stats.resilienceScore}/100`}
          trend={{ value: '-6.2%', isPositive: false }}
          statusVariant="warning"
          icon={<Activity className="w-4 h-4 text-amber-600" />}
        />
        <MetricCard
          title="At-Risk Exposure"
          value={`$${(stats.financialLossAtRisk / 1000000).toFixed(2)}M`}
          subtitle="Projected 60-day loss"
          statusVariant="critical"
          icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Loss Trajectory */}
        <Card
          title="Production Impact Trajectory (Units/Day)"
          subtitle="Baseline Target Demand vs Disrupted Daily Feasible Output"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulationTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', border: 'none', borderRadius: '8px', color: '#FFF' }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Line type="monotone" dataKey="baseline" stroke="#94A3B8" strokeDasharray="4 4" name="Baseline Target" />
                <Line type="monotone" dataKey="disrupted" stroke="#EF4444" strokeWidth={2.5} name="Disrupted Production" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Supplier Risk Breakdown */}
        <Card
          title="Supplier Risk Distribution"
          subtitle="Topological & Financial Risk Ratings"
        >
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2 pt-2 border-t border-slate-100">
            {riskDistributionData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600 truncate">{d.name}:</span>
                <span className="font-bold text-slate-800">{d.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Facilities & Critical Suppliers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant Capacity Utilization */}
        <Card
          title="Manufacturing Facility Utilization"
          subtitle="Nominal daily capacity vs current operating utilization rate"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/facilities')}>
              View All Facilities
            </Button>
          }
        >
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={plantUtilizationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#0284C7" radius={[0, 4, 4, 0]} name="Utilization %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Critical Single Points of Failure Table */}
        <Card
          title="Critical Single Points of Failure (SPOFs)"
          subtitle="Suppliers with high betweenness centrality and sole-source dependency"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/network')}>
              Open Canvas
            </Button>
          }
        >
          <div className="divide-y divide-slate-100 overflow-hidden">
            {criticalSuppliers.map((s) => (
              <div key={s.supplier_id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{s.name}</span>
                    <Badge variant={s.is_spof ? 'danger' : 'warning'}>
                      {s.is_spof ? 'SPOF' : 'Critical'}
                    </Badge>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {s.tier} • {s.country} • Centrality: {s.betweenness_centrality}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-800 font-medium">
                    {s.downstream_impact_count} downstream plants
                  </span>
                  <div className="text-[11px] text-rose-600 font-semibold">
                    Risk Score: {s.risk_score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
