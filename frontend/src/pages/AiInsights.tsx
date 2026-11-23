import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
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
      <div className="glass-card relative overflow-hidden p-6 border border-[#9875ff]/35 shadow-[0_0_35px_rgba(152,117,255,0.15)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#7957e8]/20 via-[#42d9e8]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gradient-to-r from-[#7957e8] to-[#9875ff] text-white shadow-[0_0_10px_rgba(152,117,255,0.4)]">
              LANGGRAPH MULTI-AGENT ARCHITECTURE
            </span>
            <span className="text-xs text-[#a6a4c3]">Strict Deterministic Tool Calling</span>
          </div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight">
            NEXUS Autonomous Supply Chain Intelligence Agents
          </h2>
          <p className="text-xs text-[#a6a4c3] max-w-2xl leading-relaxed">
            Orchestrates 6 specialized AI agents: Scenario Analyst, Network Investigator, Simulation Orchestrator, Mitigation Strategist, Risk Analyst, and Executive Reporter.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto relative z-10">
          <select
            value={selectedScenarioId}
            onChange={(e) => setSelectedScenarioId(e.target.value)}
            className="flex-1 lg:w-64 px-3 py-2 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.25)] rounded-lg text-xs font-mono focus:ring-1 focus:ring-[#9875ff]"
          >
            {scenarios.map((scen) => (
              <option key={scen.id} value={scen.id} className="bg-[#0d1024] text-[#f4f2ff]">
                Target: {scen.name}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="md"
            onClick={() => handleRunInvestigation()}
            isLoading={isLoading}
            className="flex-shrink-0"
            icon={<Play className="w-3.5 h-3.5 fill-white" />}
          >
            Dispatch Swarm
          </Button>
        </div>
      </div>

      {/* Roster of 6 Specialized Autonomous Agents */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { role: 'Agent 1: Scenario Analyst', duty: 'Parses supply perturbation parameters', icon: <Cpu className="w-4 h-4 text-[#9875ff]" /> },
          { role: 'Agent 2: Network Investigator', duty: 'Maps topological paths & SPOF links', icon: <Search className="w-4 h-4 text-[#55a8ff]" /> },
          { role: 'Agent 3: Sim Orchestrator', duty: 'Runs Python SimPy discrete engine', icon: <Sparkles className="w-4 h-4 text-[#42d9e8]" /> },
          { role: 'Agent 4: Mitigation Strategist', duty: 'Solves Pareto frontier trade-offs', icon: <CheckCircle2 className="w-4 h-4 text-[#35d6a0]" /> },
          { role: 'Agent 5: Risk Analyst', duty: 'Audits assumptions & vulnerabilities', icon: <AlertTriangle className="w-4 h-4 text-[#ff718a]" /> },
          { role: 'Agent 6: Executive Reporter', duty: 'Produces citable briefing & signoff', icon: <FileCheck className="w-4 h-4 text-[#f5c66b]" /> },
        ].map((agent, i) => (
          <div key={i} className="glass-card p-3.5 space-y-1.5 group hover:border-[#9875ff]/40 transition-all">
            <div className="flex items-center justify-between">
              {agent.icon}
              <span className="w-1.5 h-1.5 rounded-full bg-[#35d6a0] shadow-[0_0_6px_#35d6a0]" />
            </div>
            <h4 className="font-semibold text-[#f4f2ff] text-[11px] leading-tight">{agent.role}</h4>
            <p className="text-[10px] text-[#a6a4c3] leading-normal">{agent.duty}</p>
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
            className="border-[#9875ff]/35 shadow-[0_0_30px_rgba(152,117,255,0.12)]"
          >
            <div className="space-y-4 text-xs leading-relaxed text-[#f4f2ff]">
              <div className="p-4 bg-[#080817]/90 text-[#f4f2ff] rounded-xl font-mono text-xs whitespace-pre-line border border-[rgba(160,140,255,0.2)] shadow-inner">
                {agentResult.executive_summary}
              </div>

              {/* Key Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="glass-card p-4">
                  <h4 className="font-bold text-[#f4f2ff] mb-2 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#35d6a0]" />
                    Verified Calculated Findings
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#a6a4c3]">
                    {agentResult.key_findings.map((f: string, idx: number) => (
                      <li key={idx} className="font-medium text-[#f4f2ff]">{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-4">
                  <h4 className="font-bold text-[#f4f2ff] mb-2 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f5c66b]" />
                    Audited Residual Vulnerabilities
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-[#a6a4c3]">
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
                <div key={idx} className="p-3.5 bg-[#080817]/70 border border-[rgba(160,140,255,0.14)] rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-r from-[#7957e8] to-[#9875ff] text-white font-mono text-[10px] flex items-center justify-center font-bold shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#f4f2ff]">{trace.agent_name}</span>
                    </div>
                    <Badge variant={trace.verified ? 'success' : 'warning'}>
                      {trace.verified ? 'DETERMINISTIC VERIFIED' : 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-[#a6a4c3] pl-7">{trace.output_summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
