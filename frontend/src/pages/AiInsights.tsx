import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  Shield,
  FileCheck,
  Search,
  Cpu
} from 'lucide-react';
import api from '../api/client';
import { DisruptionScenario } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const AiInsights: React.FC = () => {
  const [scenarios, setScenarios] = useState<DisruptionScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<any | null>(null);

  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const res = await api.get<DisruptionScenario[]>('/scenarios');
        setScenarios(res.data);
        if (res.data.length > 0) {
          setSelectedScenarioId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load scenarios', err);
      }
    };
    loadScenarios();
  }, []);

  const handleRunInvestigation = async (customPrompt?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/agents/investigate', {
        scenario_id: selectedScenarioId || undefined,
        prompt: customPrompt || userPrompt,
      });
      setAgentResult(res.data);
    } catch (err) {
      alert('Agent investigation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Center Header */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] rounded-xl p-5 text-white border border-[#1C2541] shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500 text-white">
              LANGGRAPH MULTI-AGENT ARCHITECTURE
            </span>
            <span className="text-xs text-slate-400">Strict Deterministic Tool Calling</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            NEXUS Autonomous Supply Chain Intelligence Agents
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Orchestrates 6 specialized AI agents: Scenario Analyst, Network Investigator, Simulation Orchestrator, Mitigation Strategist, Risk Analyst, and Executive Reporter.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            className="px-3 py-2 bg-[#141E38] border border-slate-700 text-xs text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 lg:w-64"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="md"
            onClick={() => handleRunInvestigation()}
            isLoading={isLoading}
            className="bg-blue-600 hover:bg-blue-500 flex-shrink-0"
            icon={<Sparkles className="w-3.5 h-3.5 text-white" />}
          >
            Launch Investigation
          </Button>
        </div>
      </div>

      {/* 6 Specialized Agent Roster Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { role: 'Agent 1: Scenario Analyst', duty: 'Parses NL & validates parameters', icon: <Search className="w-4 h-4 text-blue-500" /> },
          { role: 'Agent 2: Network Investigator', duty: 'Identifies SPOFs & bottlenecks', icon: <Cpu className="w-4 h-4 text-purple-500" /> },
          { role: 'Agent 3: Sim Orchestrator', duty: 'Triggers deterministic engine', icon: <Layers className="w-4 h-4 text-emerald-500" /> },
          { role: 'Agent 4: Mitigation Strategist', duty: 'Evaluates trade-offs & frontiers', icon: <Shield className="w-4 h-4 text-amber-500" /> },
          { role: 'Agent 5: Risk Analyst', duty: 'Audits assumptions & vulnerabilities', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
          { role: 'Agent 6: Executive Reporter', duty: 'Produces citable briefing & signoff', icon: <FileCheck className="w-4 h-4 text-sky-500" /> },
        ].map((agent, i) => (
          <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              {agent.icon}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <h4 className="font-semibold text-slate-900 text-[11px] leading-tight">{agent.role}</h4>
            <p className="text-[10px] text-slate-500 leading-normal">{agent.duty}</p>
          </div>
        ))}
      </div>

      {/* Investigation Results */}
      {agentResult && (
        <div className="space-y-6">
          {/* Executive Briefing Container */}
          <Card
            title="Verified Executive Intelligence Briefing"
            subtitle="Cites verified simulation outputs. LLM interpretations are distinct from calculated numbers."
            className="border-blue-200 bg-blue-50/10"
          >
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs whitespace-pre-line border border-slate-800">
                {agentResult.executive_summary}
              </div>

              {/* Key Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Calculated Findings
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {agentResult.key_findings.map((f: string, idx: number) => (
                      <li key={idx} className="font-medium text-slate-800">{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Audited Residual Vulnerabilities
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                    {agentResult.residual_risks.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Agent Step Traces */}
          <Card
            title="LangGraph Verifiable Step Traces"
            subtitle="Immutable step-by-step tool invocation log with strict citation hashes"
          >
            <div className="space-y-3">
              {agentResult.traces.map((trace: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900">{trace.agent_name}</span>
                    </div>
                    <Badge variant={trace.verified ? 'success' : 'warning'}>
                      {trace.verified ? 'DETERMINISTIC VERIFIED' : 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 pl-7">{trace.output_summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
