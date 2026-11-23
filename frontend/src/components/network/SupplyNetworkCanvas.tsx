import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Search, Filter, AlertTriangle, ShieldCheck, Info, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// Custom Network Node Component
const CustomSupplyNode = ({ data, selected }: any) => {
  const isSPOF = data.is_spof;
  const risk = data.risk_level;

  const riskBorder = {
    CRITICAL: 'border-rose-500 shadow-rose-100',
    HIGH: 'border-amber-500 shadow-amber-100',
    MEDIUM: 'border-sky-500 shadow-sky-100',
    LOW: 'border-emerald-500 shadow-emerald-100',
  }[risk as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'] || 'border-slate-300';

  const tierBadgeBg = {
    'Tier 3': 'bg-purple-100 text-purple-800',
    'Tier 2': 'bg-blue-100 text-blue-800',
    'Tier 1': 'bg-sky-100 text-sky-800',
    'Tier 0': 'bg-amber-100 text-amber-800',
    'Downstream': 'bg-emerald-100 text-emerald-800',
  }[data.tier as string] || 'bg-slate-100 text-slate-800';

  return (
    <div
      className={`px-3 py-2.5 rounded-lg bg-white border-2 shadow-sm transition-all text-xs w-52 select-none ${riskBorder} ${
        selected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
      } ${isSPOF ? 'ring-1 ring-rose-400' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-slate-400" />
      
      <div className="flex items-center justify-between mb-1.5">
        <span className={`px-1.5 py-0.2 rounded font-mono font-medium text-[10px] ${tierBadgeBg}`}>
          {data.tier}
        </span>
        {isSPOF && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-rose-600 text-white animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" /> SPOF
          </span>
        )}
      </div>

      <div className="font-semibold text-slate-900 truncate" title={data.label}>
        {data.label}
      </div>
      <div className="text-[11px] text-slate-500 truncate mt-0.5">{data.location}</div>

      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <span>Cap: {data.capacity}</span>
        <span>Util: {data.utilization}%</span>
      </div>

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-slate-400" />
    </div>
  );
};

interface SupplyNetworkCanvasProps {
  initialNodes: any[];
  initialEdges: any[];
  spofCount: number;
}

export const SupplyNetworkCanvas: React.FC<SupplyNetworkCanvasProps> = ({
  initialNodes,
  initialEdges,
  spofCount,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [highlightSPOFOnly, setHighlightSPOFOnly] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);

  const nodeTypes = useMemo(() => ({ customNode: CustomSupplyNode }), []);

  // Format nodes for React Flow with custom component
  const formattedNodes = useMemo(() => {
    return initialNodes.map((n) => {
      const isFiltered =
        (selectedTier !== 'ALL' && n.tier !== selectedTier) ||
        (search && !n.label.toLowerCase().includes(search.toLowerCase()) && !n.location.toLowerCase().includes(search.toLowerCase())) ||
        (highlightSPOFOnly && !n.is_spof);

      return {
        ...n,
        type: 'customNode',
        data: {
          ...n,
          label: n.label,
        },
        style: {
          opacity: isFiltered ? 0.2 : 1.0,
          transition: 'opacity 0.2s ease',
        },
      };
    });
  }, [initialNodes, selectedTier, search, highlightSPOFOnly]);

  const formattedEdges = useMemo(() => {
    return initialEdges.map((e) => ({
      ...e,
      animated: e.is_critical_path,
      style: {
        stroke: e.is_critical_path ? '#EF4444' : '#94A3B8',
        strokeWidth: e.is_critical_path ? 2.5 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.is_critical_path ? '#EF4444' : '#94A3B8',
      },
    }));
  }, [initialEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNodeData(node.data);
  }, []);

  return (
    <div className="relative w-full h-[680px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Canvas Top Control Bar */}
      <div className="h-14 px-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between z-10 gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers, facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Tier:</span>
          {['ALL', 'Tier 3', 'Tier 2', 'Tier 1', 'Tier 0', 'Downstream'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedTier === tier
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* SPOF Toggle */}
        <Button
          variant={highlightSPOFOnly ? 'danger' : 'outline'}
          size="sm"
          onClick={() => setHighlightSPOFOnly(!highlightSPOFOnly)}
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
        >
          {highlightSPOFOnly ? 'Show All Nodes' : `Highlight ${spofCount} SPOFs`}
        </Button>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={formattedNodes}
          edges={formattedEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background color="#CBD5E1" gap={20} size={1} />
          <Controls className="bg-white border border-slate-200 shadow-sm rounded-lg" />
          <MiniMap
            nodeColor={(n: any) => (n.data?.is_spof ? '#EF4444' : '#0284C7')}
            maskColor="rgba(241, 245, 249, 0.7)"
            className="border border-slate-200 rounded-lg shadow-sm"
          />
        </ReactFlow>

        {/* Node Detail Drawer / Inspection Card */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 w-80 bg-white border border-slate-200/90 rounded-xl shadow-xl p-4 z-20 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                  {selectedNodeData.tier} Node Inspection
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">{selectedNodeData.label}</h4>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-semibold text-slate-800">{selectedNodeData.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-semibold text-slate-800">{selectedNodeData.capacity} units/day</span>
              </div>
              <div className="flex justify-between">
                <span>Utilization:</span>
                <span className="font-semibold text-slate-800">{selectedNodeData.utilization}%</span>
              </div>
              <div className="flex justify-between">
                <span>Centrality:</span>
                <span className="font-semibold text-slate-800">{selectedNodeData.betweenness_centrality}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <span className={`font-bold ${selectedNodeData.risk_level === 'CRITICAL' ? 'text-rose-600' : 'text-slate-800'}`}>
                  {selectedNodeData.risk_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Single Point Failure:</span>
                <span className={selectedNodeData.is_spof ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                  {selectedNodeData.is_spof ? 'YES (CRITICAL)' : 'NO'}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                onClick={() => (window.location.href = `/scenarios?target=${selectedNodeData.id}`)}
              >
                Simulate Disruption on this Entity
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
