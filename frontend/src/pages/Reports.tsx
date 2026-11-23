import React, { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { SimulationRun } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const Reports: React.FC = () => {
  const [simulations, setSimulations] = useState<SimulationRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSims = async () => {
      try {
        const res = await api.get<SimulationRun[]>('/simulations');
        setSimulations(res.data);
      } catch (err) {
        console.error('Failed to load simulations', err);
      } finally {
        setLoading(false);
      }
    };
    loadSims();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Executive Reports & Audit Export Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Download publication-grade executive PDF intelligence briefings and high-granularity daily time-step CSV files.
          </p>
        </div>
      </div>

      {/* Available Reports Table */}
      <Card title={`Generated Simulation Briefings (${simulations.length})`}>
        <div className="divide-y divide-slate-100">
          {simulations.map((sim) => (
            <div key={sim.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Verified Deterministic</Badge>
                  <span className="font-mono text-xs text-slate-400">Ref: {sim.id.substring(0, 8)}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{sim.name}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  <span>Loss: ${sim.total_revenue_loss.toLocaleString()}</span>
                  <span>Units Lost: {Math.round(sim.total_units_lost).toLocaleString()}</span>
                  <span>Resilience: {sim.resilience_score}/100</span>
                  <span>Executed: {new Date(sim.executed_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/v1/reports/csv/${sim.id}`, '_blank')}
                  icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Download CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500"
                  onClick={() => window.open(`/api/v1/reports/pdf/${sim.id}`, '_blank')}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download PDF Briefing
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
