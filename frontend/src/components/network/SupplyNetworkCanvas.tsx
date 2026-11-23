import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Search, Filter, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';

// Custom Network Node Component matching dark glass theme
const CustomSupplyNode = ({ data, selected }: any) => {
  const isSPOF = data.is_spof;
  const risk = data.risk_level;

  const riskBorder = {
    CRITICAL: 'border-[#ff718a] shadow-[0_0_15px_rgba(255,113,138,0.25)]',
    HIGH: 'border-[#f5c66b] shadow-[0_0_15px_rgba(245,198,107,0.25)]',
    MEDIUM: 'border-[#55a8ff] shadow-[0_0_15px_rgba(85,168,255,0.25)]',
    LOW: 'border-[#35d6a0] shadow-[0_0_15px_rgba(53,214,160,0.25)]',
  }[risk as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'] || 'border-[rgba(160,140,255,0.3)]';

  const tierBadgeBg = {
    'Tier 3': 'bg-[#7957e8]/20 text-[#9875ff] border border-[#7957e8]/40',
    'Tier 2': 'bg-[#55a8ff]/20 text-[#55a8ff] border border-[#55a8ff]/40',
    'Tier 1': 'bg-[#42d9e8]/20 text-[#42d9e8] border border-[#42d9e8]/40',
    'Tier 0': 'bg-[#f5c66b]/20 text-[#f5c66b] border border-[#f5c66b]/40',
    'Downstream': 'bg-[#35d6a0]/20 text-[#35d6a0] border border-[#35d6a0]/40',
  }[data.tier as string] || 'bg-white/10 text-[#f4f2ff] border border-white/20';

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-[#0d1024]/90 backdrop-blur-xl border-2 transition-all text-xs w-52 select-none ${riskBorder} ${
        selected ? 'ring-2 ring-[#9875ff] shadow-[0_0_20px_rgba(152,117,255,0.4)]' : ''
      } ${isSPOF ? 'ring-1 ring-[#ff718a]' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-[#9875ff] !border-none" />
      
      <div className="flex items-center justify-between mb-1.5">
        <span className={`px-2 py-0.5 rounded font-mono font-medium text-[10px] ${tierBadgeBg}`}>
          {data.tier}
        </span>
        {isSPOF && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono font-bold text-[9px] bg-[#ff718a] text-white animate-pulse shadow-[0_0_8px_rgba(255,113,138,0.5)]">
            <AlertTriangle className="w-2.5 h-2.5" /> SPOF
          </span>
        )}
      </div>

      <div className="font-semibold text-[#f4f2ff] truncate tracking-tight" title={data.label}>
        {data.label}
      </div>
      <div className="text-[11px] text-[#a6a4c3] truncate mt-0.5">{data.location}</div>

      <div className="mt-2 pt-1.5 border-t border-[rgba(160,140,255,0.12)] flex items-center justify-between text-[10px] text-[#a6a4c3] font-mono">
        <span>Cap: {data.capacity}</span>
        <span className="text-[#f4f2ff] font-semibold">Util: {data.utilization}%</span>
      </div>

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-[#9875ff] !border-none" />
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
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [highlightSPOFOnly, setHighlightSPOFOnly] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);

  const nodeTypes = useMemo(() => ({ customNode: CustomSupplyNode }), []);

  // Format nodes for React Flow with custom component & guaranteed position
  const formattedNodes = useMemo(() => {
    return initialNodes.map((n, idx) => {
      const isFiltered =
        (selectedTier !== 'ALL' && n.tier !== selectedTier) ||
        (search &&
          !n.label.toLowerCase().includes(search.toLowerCase()) &&
          !n.location.toLowerCase().includes(search.toLowerCase())) ||
        (highlightSPOFOnly && !n.is_spof);

      const defaultX = n.tier === 'Tier 3' ? 80 : n.tier === 'Tier 2' ? 420 : n.tier === 'Tier 1' ? 760 : 1100;
      const defaultY = 60 + idx * 80;

      return {
        id: n.id,
        position: n.position || { x: defaultX, y: defaultY },
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
        stroke: e.is_critical_path ? '#ff718a' : 'rgba(160,140,255,0.3)',
        strokeWidth: e.is_critical_path ? 2.5 : 1.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.is_critical_path ? '#ff718a' : 'rgba(160,140,255,0.4)',
      },
    }));
  }, [initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(formattedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(formattedEdges);

  useEffect(() => {
    setNodes(formattedNodes);
  }, [formattedNodes, setNodes]);

  useEffect(() => {
    setEdges(formattedEdges);
  }, [formattedEdges, setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNodeData(node.data);
  }, []);

  return (
    <div className="relative w-full h-[680px] bg-[#080817] border border-[rgba(160,140,255,0.18)] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col">
      {/* Canvas Top Control Bar */}
      <div className="h-14 px-4 bg-[#0d1024]/85 backdrop-blur-xl border-b border-[rgba(160,140,255,0.14)] flex items-center justify-between z-10 gap-3">
        {/* Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-[#a6a4c3] absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers, facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#080817]/80 text-[#f4f2ff] placeholder-[#a6a4c3]/60 border border-[rgba(160,140,255,0.2)] rounded-lg focus:outline-none focus:border-[#9875ff] focus:ring-1 focus:ring-[#9875ff]"
          />
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#a6a4c3]">
          <Filter className="w-3.5 h-3.5 text-[#9875ff]" />
          <span>Tier:</span>
          {['ALL', 'Tier 3', 'Tier 2', 'Tier 1', 'Tier 0', 'Downstream'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                selectedTier === tier
                  ? 'bg-gradient-to-r from-[#7957e8] to-[#9875ff] text-white shadow-[0_0_10px_rgba(152,117,255,0.35)]'
                  : 'bg-white/5 text-[#a6a4c3] hover:text-[#f4f2ff] hover:bg-white/10'
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
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background color="rgba(160,140,255,0.12)" gap={22} size={1} />
          <Controls className="!bg-[#0d1024]/90 !border !border-[rgba(160,140,255,0.2)] !shadow-xl !rounded-xl !text-[#f4f2ff]" />
          <MiniMap
            nodeColor={(n: any) => (n.data?.is_spof ? '#ff718a' : '#7957e8')}
            maskColor="rgba(8, 8, 23, 0.85)"
            className="!bg-[#0d1024] !border !border-[rgba(160,140,255,0.2)] !rounded-xl !shadow-xl"
          />
        </ReactFlow>

        {/* Node Detail Drawer / Inspection Card */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 w-80 glass-card p-4 z-20 space-y-3 border border-[#9875ff]/40 shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-medium text-[#9875ff] uppercase">
                  {selectedNodeData.tier} Node Inspection
                </span>
                <h4 className="text-sm font-bold text-[#f4f2ff] mt-0.5">{selectedNodeData.label}</h4>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 rounded-md text-[#a6a4c3] hover:text-[#f4f2ff] hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-[#a6a4c3] bg-[#080817]/70 p-3 rounded-lg border border-[rgba(160,140,255,0.12)] font-mono">
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-semibold text-[#f4f2ff]">{selectedNodeData.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacity:</span>
                <span className="font-semibold text-[#f4f2ff]">{selectedNodeData.capacity} units/day</span>
              </div>
              <div className="flex justify-between">
                <span>Utilization:</span>
                <span className="font-semibold text-[#f4f2ff]">{selectedNodeData.utilization}%</span>
              </div>
              <div className="flex justify-between">
                <span>Centrality:</span>
                <span className="font-semibold text-[#9875ff]">{selectedNodeData.betweenness_centrality}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level:</span>
                <span
                  className={`font-bold ${
                    selectedNodeData.risk_level === 'CRITICAL' ? 'text-[#ff718a]' : 'text-[#f4f2ff]'
                  }`}
                >
                  {selectedNodeData.risk_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Single Point Failure:</span>
                <span className={selectedNodeData.is_spof ? 'text-[#ff718a] font-bold' : 'text-[#35d6a0]'}>
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
