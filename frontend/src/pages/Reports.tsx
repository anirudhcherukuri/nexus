import React, { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4">
        <div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#9875ff]" />
            Executive Reports & Audit Export Center
          </h2>
          <p className="text-xs text-[#a6a4c3] mt-0.5">
            Download publication-grade executive PDF intelligence briefings and high-granularity daily time-step CSV files.
          </p>
        </div>
      </div>

      {/* Available Reports Table */}
      <Card title={`Generated Simulation Briefings (${simulations.length})`}>
        <div className="divide-y divide-[rgba(160,140,255,0.08)]">
          {simulations.map((sim) => (
            <div key={sim.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Verified Deterministic</Badge>
                  <span className="font-mono text-xs text-[#9875ff]">Ref: {sim.id.substring(0, 8)}</span>
                </div>
                <h4 className="text-sm font-bold text-[#f4f2ff]">{sim.name}</h4>
                <div className="flex items-center gap-4 text-xs text-[#a6a4c3] font-mono">
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
                  icon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#35d6a0]" />}
                >
                  Download CSV
                </Button>
                <Button
                  variant="primary"
                  size="sm"
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
