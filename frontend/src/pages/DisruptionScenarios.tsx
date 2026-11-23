import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Copy, Trash2, Play, Sparkles, Calendar, Layers } from 'lucide-react';
import api from '../api/client';
import { DisruptionScenario, Supplier, Facility } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const DisruptionScenarios: React.FC = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState<DisruptionScenario[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Create scenario modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [horizonDays, setHorizonDays] = useState(60);
  const [events, setEvents] = useState<any[]>([
    {
      entity_type: 'SUPPLIER',
      entity_id: '',
      disruption_type: 'SHUTDOWN',
      start_day: 5,
      duration_days: 14,
      capacity_reduction_pct: 100,
      extra_lead_time_days: 0,
      notes: '',
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scenRes, tplRes, supRes, facRes] = await Promise.all([
        api.get<DisruptionScenario[]>('/scenarios'),
        api.get('/scenarios/templates/all'),
        api.get<Supplier[]>('/suppliers'),
        api.get<Facility[]>('/facilities'),
      ]);
      setScenarios(scenRes.data);
      setTemplates(tplRes.data);
      setSuppliers(supRes.data);
      setFacilities(facRes.data);

      if (supRes.data.length > 0 && !events[0].entity_id) {
        setEvents([{ ...events[0], entity_id: supRes.data[0].id }]);
      }
    } catch (err) {
      console.error('Failed to load scenarios', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddEvent = () => {
    setEvents([
      ...events,
      {
        entity_type: 'SUPPLIER',
        entity_id: suppliers[0]?.id || '',
        disruption_type: 'CAPACITY_REDUCTION',
        start_day: 10,
        duration_days: 14,
        capacity_reduction_pct: 50,
        extra_lead_time_days: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/scenarios', {
        name: scenarioName,
        description: scenarioDesc,
        horizon_days: horizonDays,
        events: events,
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to create scenario.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/scenarios/${id}/duplicate`);
      loadData();
    } catch (err) {
      alert('Failed to duplicate scenario.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete scenario "${name}"?`)) return;
    try {
      await api.delete(`/scenarios/${id}`);
      loadData();
    } catch (err) {
      alert('Failed to delete scenario.');
    }
  };

  const handleUseTemplate = async (tpl: any) => {
    try {
      await api.post('/scenarios', {
        name: tpl.name,
        description: tpl.description,
        horizon_days: tpl.horizon_days,
        events: tpl.events,
      });
      loadData();
    } catch (err) {
      alert('Failed to apply template.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Disruption Scenario Studio
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure multi-event what-if stress tests: supplier shutdowns, capacity curtailments, and port congestion corridors.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setScenarioName('');
            setScenarioDesc('');
            setHorizonDays(60);
            setIsCreateOpen(true);
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Build Custom Scenario
        </Button>
      </div>

      {/* Pre-Configured Templates Carousel */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pre-Configured Enterprise Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.template_id}
              className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono font-medium text-slate-400">
                  {tpl.horizon_days}d Horizon • {tpl.events.length} event(s)
                </span>
                <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">{tpl.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleUseTemplate(tpl)}>
                  Deploy Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Scenarios List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Configured What-If Scenarios ({scenarios.length})
        </h3>

        <div className="space-y-3">
          {scenarios.map((scen) => (
            <Card key={scen.id} className="hover:border-slate-300 transition-all">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={scen.status === 'SIMULATED' ? 'success' : 'warning'}>
                      {scen.status}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">
                      Horizon: {scen.horizon_days} Days
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{scen.name}</h4>
                  <p className="text-xs text-slate-500 max-w-3xl">{scen.description}</p>

                  {/* Disruption Events Breakdown */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {scen.events?.map((ev, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {ev.disruption_type} ({ev.capacity_reduction_pct}% red, Days {ev.start_day}-{ev.start_day + ev.duration_days})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scenario Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(scen.id)}
                    icon={<Copy className="w-3.5 h-3.5" />}
                  >
                    Clone
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(scen.id, scen.name)}
                    icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/simulation?scenario_id=${scen.id}`)}
                    className="bg-blue-600 hover:bg-blue-500"
                    icon={<Play className="w-3.5 h-3.5 fill-white" />}
                  >
                    Run Simulation
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Build Scenario Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Construct Disruption Scenario"
        subtitle="Define one or more compounding supply perturbations over the discrete planning horizon."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateScenario} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Scenario Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Tier 1 Radar Module Fab Outage (21 Days)"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Description</label>
              <input
                type="text"
                placeholder="Operational context and stress test rationale"
                value={scenarioDesc}
                onChange={(e) => setScenarioDesc(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Simulation Horizon (Days)</label>
              <input
                type="number"
                min={10}
                max={180}
                required
                value={horizonDays}
                onChange={(e) => setHorizonDays(parseInt(e.target.value) || 60)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Events Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                Disruption Events ({events.length})
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddEvent} icon={<Plus className="w-3 h-3" />}>
                Add Another Event
              </Button>
            </div>

            {events.map((ev, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Event #{idx + 1}</span>
                  {events.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Entity Target</label>
                    <select
                      value={ev.entity_id}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[idx].entity_id = e.target.value;
                        setEvents(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.tier} • {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Disruption Type</label>
                    <select
                      value={ev.disruption_type}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[idx].disruption_type = e.target.value;
                        setEvents(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    >
                      <option value="SHUTDOWN">Complete Shutdown</option>
                      <option value="CAPACITY_REDUCTION">Capacity Reduction</option>
                      <option value="PORT_CLOSURE">Port Closure / Transit Surge</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Capacity Reduction %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ev.capacity_reduction_pct}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[idx].capacity_reduction_pct = parseFloat(e.target.value) || 0;
                        setEvents(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Start Day</label>
                    <input
                      type="number"
                      min={1}
                      value={ev.start_day}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[idx].start_day = parseInt(e.target.value) || 1;
                        setEvents(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5 text-[11px]">Duration (Days)</label>
                    <input
                      type="number"
                      min={1}
                      value={ev.duration_days}
                      onChange={(e) => {
                        const updated = [...events];
                        updated[idx].duration_days = parseInt(e.target.value) || 1;
                        setEvents(updated);
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Scenario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
