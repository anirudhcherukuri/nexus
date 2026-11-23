import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Send,
  Sliders,
  AlertCircle
} from 'lucide-react';
import api from '../api/client';
import { MitigationPlan, SimulationRun } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';

export const MitigationPlanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<SimulationRun[]>([]);
  const [selectedSimId, setSelectedSimId] = useState<string>('');
  const [plans, setPlans] = useState<MitigationPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [objective, setObjective] = useState<string>('BALANCED');

  useEffect(() => {
    const loadSims = async () => {
      try {
        const res = await api.get<SimulationRun[]>('/simulations');
        setSimulations(res.data);

        const paramSimId = searchParams.get('simulation_id');
        const targetId = paramSimId && res.data.some((s) => s.id === paramSimId)
          ? paramSimId
          : res.data[0]?.id;

        if (targetId) {
          setSelectedSimId(targetId);
          fetchPlans(targetId, 'BALANCED');
        }
      } catch (err) {
        console.error('Failed to load simulations', err);
      }
    };
    loadSims();
  }, [searchParams]);

  const fetchPlans = async (simId: string, optObjective: string) => {
    setLoading(true);
    try {
      const res = await api.post<MitigationPlan[]>('/mitigations/optimize', {
        simulation_run_id: simId,
        optimization_objective: optObjective,
      });
      setPlans(res.data);
    } catch (err) {
      console.error('Failed to optimize mitigations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleObjectiveChange = (newObj: string) => {
    setObjective(newObj);
    if (selectedSimId) {
      fetchPlans(selectedSimId, newObj);
    }
  };

  const handleSubmitForApproval = async (plan: MitigationPlan) => {
    try {
      await api.post('/approvals', {
        mitigation_plan_id: plan.id,
        simulation_run_id: plan.simulation_run_id,
        title: `Authorize Sourcing Plan: ${plan.strategy_name}`,
        recommendation_summary: `${plan.description} - Net Benefit: $${plan.net_financial_benefit.toLocaleString()}, Units Recovered: ${plan.units_recovered.toLocaleString()}`,
      });
      alert('Strategy successfully submitted to Human Approval Desk!');
      navigate('/approvals');
    } catch (err) {
      alert('Failed to submit strategy for approval.');
    }
  };

  const activeSim = simulations.find((s) => s.id === selectedSimId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Mitigation Strategy Optimizer & Trade-Off Desk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate alternative supplier capacity, air freight bypass, buffer shifts, and hybrid resilience strategies.
          </p>
        </div>

        {/* Simulation Selector & Objective Toggles */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedSimId}
            onChange={(e) => {
              setSelectedSimId(e.target.value);
              fetchPlans(e.target.value, objective);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            {simulations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (${(s.total_revenue_loss / 1000).toFixed(0)}k loss)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optimization Objectives Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <Sliders className="w-4 h-4 text-slate-400" />
        <span className="text-slate-500 font-semibold mr-2">Objective:</span>
        {[
          { key: 'BALANCED', label: 'Balanced (Max Net Benefit)' },
          { key: 'MIN_COST', label: 'Minimum Total Cost' },
          { key: 'MIN_DELAY', label: 'Minimum Delivery Delay' },
          { key: 'MAX_RECOVERY', label: 'Maximum Production Recovery' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleObjectiveChange(item.key)}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              objective === item.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Evaluated Mitigation Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan, idx) => {
          const totalCost = plan.additional_procurement_cost + plan.additional_logistics_cost;
          const isTopPick = idx === 0;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                isTopPick ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={isTopPick ? 'success' : 'default'}>
                    {isTopPick ? 'Top Recommendation' : plan.strategy_type}
                  </Badge>
                  <span className="font-mono text-xs text-slate-400 font-medium">
                    Feasibility: {plan.feasibility_score}%
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{plan.strategy_name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{plan.description}</p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Net Benefit</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      +${plan.net_financial_benefit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Recovered</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {Math.round(plan.units_recovered).toLocaleString()} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Lead Time Saved</span>
                    <span className="font-bold text-blue-600 text-sm">
                      {plan.recovery_days_saved} Days
                    </span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                  <span>Investment: ${totalCost.toLocaleString()}</span>
                  <span className="text-emerald-700">Avoided Loss: ${plan.avoided_revenue_loss.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  variant={isTopPick ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleSubmitForApproval(plan)}
                  icon={<Send className="w-3 h-3" />}
                  className={isTopPick ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : ''}
                >
                  Submit for Human Approval
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
