import React, { useState, useEffect } from 'react';
import { Network, Table as TableIcon, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import api from '../api/client';
import { SupplyNetworkCanvas } from '../components/network/SupplyNetworkCanvas';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const SupplyNetwork: React.FC = () => {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; spof_count: number; tier_counts: any }>({
    nodes: [],
    edges: [],
    spof_count: 0,
    tier_counts: {},
  });

  const loadGraph = async () => {
    setLoading(true);
    try {
      const res = await api.get('/network/graph');
      setGraphData(res.data);
    } catch (err) {
      console.error('Failed to load network graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  return (
    <div className="space-y-5">
      {/* View Toggle and Summary Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            Global Multi-Tier Topological Supply Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive multi-echelon graph connecting Tier 3 raw extraction, Tier 2 component specialists, Tier 1 module assemblers, and Tier 0 plants.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'graph' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Graph Canvas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Node Table
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={loadGraph} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Tier Topology Summary Pills */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(graphData.tier_counts || {}).map(([tier, count]: [string, any]) => (
          <div key={tier} className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">{tier}</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-slate-900">{count}</span>
              <span className="text-xs text-slate-400">nodes</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="h-96 flex items-center justify-center bg-white border border-slate-200 rounded-xl">
          <div className="text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Computing topological centrality & betweenness...</p>
          </div>
        </div>
      ) : viewMode === 'graph' ? (
        <SupplyNetworkCanvas
          initialNodes={graphData.nodes}
          initialEdges={graphData.edges}
          spofCount={graphData.spof_count}
        />
      ) : (
        <Card title={`All Topological Entities (${graphData.nodes.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Node Label</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Utilization</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">SPOF Status</th>
                  <th className="py-2.5 px-3">Centrality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {graphData.nodes.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{n.label}</td>
                    <td className="py-2.5 px-3 font-mono">{n.tier}</td>
                    <td className="py-2.5 px-3 text-slate-600">{n.location}</td>
                    <td className="py-2.5 px-3 font-mono">{n.capacity}</td>
                    <td className="py-2.5 px-3 font-mono">{n.utilization}%</td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          n.risk_level === 'CRITICAL'
                            ? 'danger'
                            : n.risk_level === 'HIGH'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {n.risk_level}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {n.is_spof ? (
                        <span className="font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> SPOF
                        </span>
                      ) : (
                        <span className="text-slate-400">Redundant</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{n.betweenness_centrality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
