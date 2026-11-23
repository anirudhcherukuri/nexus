import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Trash2, Edit2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { Supplier } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    tier: 'Tier 2',
    country: 'USA',
    city: 'Detroit',
    daily_capacity: 1000,
    current_utilization: 75,
    lead_time_days: 7,
    unit_cost: 50,
    reliability_score: 0.95,
    financial_risk: 0.2,
    operational_risk: 0.2,
    status: 'ACTIVE',
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get<Supplier[]>('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to load suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', formData);
      setIsCreateOpen(false);
      loadSuppliers();
    } catch (err) {
      alert('Failed to create supplier.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSupplier) return;
    try {
      await api.put(`/suppliers/${activeSupplier.id}`, formData);
      setIsEditOpen(false);
      loadSuppliers();
    } catch (err) {
      alert('Failed to update supplier.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${name}"? This will remove connected supply edges.`)) {
      return;
    }
    try {
      await api.delete(`/suppliers/${id}`);
      loadSuppliers();
    } catch (err) {
      alert('Failed to delete supplier.');
    }
  };

  const openEditModal = (s: Supplier) => {
    setActiveSupplier(s);
    setFormData({
      name: s.name,
      code: s.code,
      tier: s.tier,
      country: s.country,
      city: s.city,
      daily_capacity: s.daily_capacity,
      current_utilization: s.current_utilization,
      lead_time_days: s.lead_time_days,
      unit_cost: s.unit_cost,
      reliability_score: s.reliability_score,
      financial_risk: s.financial_risk,
      operational_risk: s.operational_risk,
      status: s.status,
    });
    setIsEditOpen(true);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase());
    const matchesTier = selectedTier === 'ALL' || s.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Supplier Directory & Resilience Profiles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-tier supplier catalog, operating capacities, lead times, and single-source risk indices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open('/api/v1/suppliers/export/csv', '_blank')}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormData({
                name: '',
                code: `SUP-${suppliers.length + 1}`,
                tier: 'Tier 2',
                country: 'USA',
                city: 'Dallas',
                daily_capacity: 1000,
                current_utilization: 75,
                lead_time_days: 7,
                unit_cost: 50,
                reliability_score: 0.95,
                financial_risk: 0.2,
                operational_risk: 0.2,
                status: 'ACTIVE',
              });
              setIsCreateOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Tier:</span>
          {['ALL', 'Tier 1', 'Tier 2', 'Tier 3'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedTier === tier
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <Card title={`Suppliers (${filteredSuppliers.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Code / Name</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3">Lead Time</th>
                <th className="py-2.5 px-3">Reliability</th>
                <th className="py-2.5 px-3">Risk Index</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-slate-400 text-[10px] block">{s.code}</span>
                    <span className="font-semibold text-slate-900">{s.name}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                      {s.tier}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {s.city}, {s.country}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {s.daily_capacity} <span className="text-[10px] text-slate-400">({s.current_utilization}%)</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{s.lead_time_days} days</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-emerald-700">
                    {(s.reliability_score * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        s.financial_risk + s.operational_risk > 0.6
                          ? 'text-rose-600'
                          : s.financial_risk + s.operational_risk > 0.4
                          ? 'text-amber-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {((s.financial_risk + s.operational_risk) / 2).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Supplier Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }}
        title={isCreateOpen ? 'Register New Supplier' : 'Update Supplier Specifications'}
        subtitle="Configure topological capacity constraints, operational risks, and fulfillment metrics."
        maxWidth="xl"
      >
        <form onSubmit={isCreateOpen ? handleCreate : handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Supplier Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tier Level</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              >
                <option value="Tier 1">Tier 1 (Direct Module Assembler)</option>
                <option value="Tier 2">Tier 2 (Component Specialist)</option>
                <option value="Tier 3">Tier 3 (Raw Materials / Extraction)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DISRUPTED">DISRUPTED</option>
                <option value="RESTRICTED">RESTRICTED</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Country</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Daily Capacity (Units)</label>
              <input
                type="number"
                required
                value={formData.daily_capacity}
                onChange={(e) => setFormData({ ...formData, daily_capacity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Lead Time (Days)</label>
              <input
                type="number"
                required
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {isCreateOpen ? 'Create Supplier' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
