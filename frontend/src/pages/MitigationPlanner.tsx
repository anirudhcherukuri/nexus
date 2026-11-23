import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Send,
  Sliders,
} from 'lucide-react';
import api from '../api/client';
import { MitigationPlan, SimulationRun } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

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
        estimated_cost: plan.additional_procurement_cost + plan.additional_logistics_cost,
        estimated_savings: plan.avoided_revenue_loss,
      });
      alert('Strategy successfully submitted to Human-in-the-Loop Governance Queue!');
      navigate('/approvals');
    } catch (err) {
      alert('Failed to submit approval request.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Simulation Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-4">
        <div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#35d6a0]" />
            Pareto Frontier Mitigation Optimizer & Trade-Off Engine
          </h2>
          <p className="text-xs text-[#a6a4c3] mt-0.5">
            Evaluate secondary supplier activation, air freight expediting, buffer rebalancing, and inventory pre-build tradeoffs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a6a4c3] font-medium">Select Sim Run:</span>
          <select
            value={selectedSimId}
            onChange={(e) => {
              setSelectedSimId(e.target.value);
              fetchPlans(e.target.value, objective);
            }}
            className="px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.25)] rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#9875ff]"
          >
            {simulations.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0d1024] text-[#f4f2ff]">
                Run #{s.id.slice(0, 8)} - Loss: ${s.total_revenue_loss.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Objective Filter Pills */}
      <div className="flex items-center gap-2 glass-card p-2">
        <span className="text-xs text-[#a6a4c3] font-medium flex items-center gap-1 pl-2">
          <Sliders className="w-3.5 h-3.5 text-[#9875ff]" /> Objective Function:
        </span>
        {[
          { key: 'BALANCED', label: 'Balanced Net Value' },
          { key: 'MINIMIZE_COST', label: 'Minimize Out-of-Pocket Cost' },
          { key: 'MAXIMIZE_RECOVERY', label: 'Maximize Production Recovery' },
          { key: 'MINIMIZE_LEAD_TIME', label: 'Fastest Lead Time' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleObjectiveChange(item.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              objective === item.key
                ? 'bg-gradient-to-r from-[#7957e8] to-[#9875ff] text-white shadow-[0_0_10px_rgba(152,117,255,0.35)]'
                : 'text-[#a6a4c3] hover:text-[#f4f2ff] hover:bg-white/5'
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
              className={`glass-card p-5 transition-all flex flex-col justify-between group ${
                isTopPick
                  ? 'border-[#35d6a0]/50 shadow-[0_0_25px_rgba(53,214,160,0.15)] ring-1 ring-[#35d6a0]/30'
                  : 'hover:border-[#9875ff]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={isTopPick ? 'success' : 'default'}>
                    {isTopPick ? 'Top Recommendation' : plan.strategy_type}
                  </Badge>
                  <span className="font-mono text-xs text-[#9875ff] font-medium">
                    Feasibility: {plan.feasibility_score}%
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#f4f2ff] mb-1">{plan.strategy_name}</h3>
                <p className="text-xs text-[#a6a4c3] leading-relaxed mb-4">{plan.description}</p>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#080817]/70 rounded-xl border border-[rgba(160,140,255,0.14)] font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[#a6a4c3] block uppercase">Net Benefit</span>
                    <span className="font-bold text-[#35d6a0] text-sm drop-shadow-[0_0_6px_rgba(53,214,160,0.3)]">
                      +${plan.net_financial_benefit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#a6a4c3] block uppercase">Recovered</span>
                    <span className="font-bold text-[#f4f2ff] text-sm">
                      {Math.round(plan.units_recovered).toLocaleString()} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#a6a4c3] block uppercase">Lead Time Saved</span>
                    <span className="font-bold text-[#55a8ff] text-sm">
                      {plan.recovery_days_saved} Days
                    </span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="mt-3 pt-2.5 border-t border-[rgba(160,140,255,0.12)] flex items-center justify-between text-xs text-[#a6a4c3] font-mono">
                  <span>Investment: ${totalCost.toLocaleString()}</span>
                  <span className="text-[#35d6a0]">Avoided Loss: ${plan.avoided_revenue_loss.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-[rgba(160,140,255,0.12)] flex justify-end">
                <Button
                  variant={isTopPick ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleSubmitForApproval(plan)}
                  icon={<Send className="w-3 h-3" />}
                  className={isTopPick ? '!bg-gradient-to-r !from-[#059669] !to-[#35d6a0] !border-[#35d6a0]/40 !shadow-[0_0_15px_rgba(53,214,160,0.3)] text-white' : ''}
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
