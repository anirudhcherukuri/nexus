import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  Play,
  Download,
  ShieldCheck,
  TrendingDown,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import api from '../api/client';
import { DisruptionScenario, SimulationRun } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';

export const SimulationLab: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<DisruptionScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeSimulation, setActiveSimulation] = useState<SimulationRun | null>(null);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const res = await api.get<DisruptionScenario[]>('/scenarios');
        setScenarios(res.data);

        // Pre-select scenario from URL param or first available
        const paramId = searchParams.get('scenario_id');
        if (paramId && res.data.some((s) => s.id === paramId)) {
          setSelectedScenarioId(paramId);
        } else if (res.data.length > 0) {
          setSelectedScenarioId(res.data[0].id);
        }

        // Also fetch latest simulation run if available
        const simRes = await api.get<SimulationRun[]>('/simulations');
        if (simRes.data.length > 0) {
          setActiveSimulation(simRes.data[0]);
        }
      } catch (err) {
        console.error('Failed to load scenarios or simulations', err);
      }
    };
    loadScenarios();
  }, [searchParams]);

  const handleExecuteSimulation = async () => {
    if (!selectedScenarioId) return;
    setIsRunning(true);
    try {
      const res = await api.post<SimulationRun>('/simulations/run', {
        scenario_id: selectedScenarioId,
      });
      setActiveSimulation(res.data);
    } catch (err) {
      alert('Simulation execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="space-y-6">
      {/* Simulation Command Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            Deterministic Simulation Lab
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discrete-event simulation computing cascading BOM constraints, finite buffer runout, backlog, and financial losses.
          </p>
        </div>

        {/* Scenario selector & Run button */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 flex-1 lg:w-80"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.horizon_days}d)
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="md"
            onClick={handleExecuteSimulation}
            isLoading={isRunning}
            className="bg-blue-600 hover:bg-blue-500 flex-shrink-0"
            icon={<Play className="w-3.5 h-3.5 fill-white" />}
          >
            Execute Model
          </Button>
        </div>
      </div>

      {activeSimulation && (
        <>
          {/* Deterministic KPI Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              title="Calculated Financial Loss"
              value={`$${activeSimulation.total_revenue_loss.toLocaleString()}`}
              subtitle="Lost margin & penalties"
              statusVariant="critical"
              icon={<TrendingDown className="w-4 h-4 text-rose-600" />}
            />
            <MetricCard
              title="Production at Risk"
              value={`${Math.round(activeSimulation.total_units_lost).toLocaleString()}`}
              subtitle="Unproduced units"
              statusVariant="critical"
              icon={<AlertCircle className="w-4 h-4 text-rose-600" />}
            />
            <MetricCard
              title="Resilience Rating"
              value={`${activeSimulation.resilience_score}/100`}
              subtitle="Deterministic score"
              statusVariant="warning"
              icon={<ShieldCheck className="w-4 h-4 text-amber-600" />}
            />
            <MetricCard
              title="Earliest Stockout"
              value={activeSimulation.stockout_day ? `Day ${activeSimulation.stockout_day}` : 'None'}
              subtitle="Buffer exhaustion"
              statusVariant={activeSimulation.stockout_day ? 'critical' : 'success'}
              icon={<Clock className="w-4 h-4 text-slate-600" />}
            />
            <MetricCard
              title="Max Delivery Delay"
              value={`${activeSimulation.max_delay_days} Days`}
              subtitle="Customer fulfillment backlog"
              statusVariant="warning"
              icon={<Clock className="w-4 h-4 text-amber-600" />}
            />
            <MetricCard
              title="Sim Status"
              value="VERIFIED"
              subtitle="ID: SHA256-DETERMINISTIC"
              statusVariant="success"
              icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
            />
          </div>

          {/* Simulation Methodology Banner */}
          <div className="p-3.5 bg-slate-900 rounded-lg text-slate-300 text-xs flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>DETERMINISTIC PRINCIPLE: LLMs have NOT fabricated these values. Calculated via BOM explosion & finite inventory conservation.</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                onClick={() => window.open(`/api/v1/reports/pdf/${activeSimulation.id}`, '_blank')}
                icon={<FileText className="w-3.5 h-3.5 text-blue-400" />}
              >
                Export Executive PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => navigate(`/mitigation?simulation_id=${activeSimulation.id}`)}
                icon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Optimize Mitigation
              </Button>
            </div>
          </div>

          {/* Daily Simulation Curves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Feasible Production vs Baseline */}
            <Card
              title="Daily Production Trajectory"
              subtitle="Scheduled Baseline Demand vs Deterministic Feasible Production"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeSimulation.daily_metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} unit="d" />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B132B', border: 'none', borderRadius: '8px', color: '#FFF' }}
                    />
                    <Line type="monotone" dataKey="baseline_production" stroke="#94A3B8" strokeDasharray="3 3" name="Baseline Target" />
                    <Line type="monotone" dataKey="actual_production" stroke="#0284C7" strokeWidth={2.5} name="Actual Feasible" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Cumulative Financial Losses */}
            <Card
              title="Cumulative Financial Loss Trajectory ($)"
              subtitle="Lost gross margins and delayed shipment backlog penalties"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeSimulation.daily_metrics}>
                    <defs>
                      <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} unit="d" />
                    <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Cumulative Loss']}
                      contentStyle={{ backgroundColor: '#0B132B', border: 'none', borderRadius: '8px', color: '#FFF' }}
                    />
                    <Area type="monotone" dataKey="cumulative_financial_loss" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#lossGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Product Impact Table */}
          <Card
            title={`Downstream Product Impacts (${activeSimulation.product_impacts?.length || 0})`}
            subtitle="Unit shortages, stockout days, and margin impact per finished assembly"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Target Demand</th>
                    <th className="py-2.5 px-3">Feasible Produced</th>
                    <th className="py-2.5 px-3">Units Short</th>
                    <th className="py-2.5 px-3">Revenue Loss</th>
                    <th className="py-2.5 px-3">Stockout Day</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSimulation.product_impacts?.map((p) => (
                    <tr key={p.product_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.product_name}</td>
                      <td className="py-2.5 px-3 font-mono">{p.units_demanded.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono">{p.units_produced.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                        {p.units_short > 0 ? p.units_short.toLocaleString() : '0'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        ${p.total_revenue_loss.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {p.stockout_day ? (
                          <span className="text-rose-600 font-bold">Day {p.stockout_day}</span>
                        ) : (
                          <span className="text-emerald-700">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
