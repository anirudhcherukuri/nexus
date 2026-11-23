import React, { useState, useEffect } from 'react';
import { Building2, Plus, Activity, MapPin } from 'lucide-react';
import api from '../api/client';
import { Facility } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

export const Facilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facility_type: 'PLANT',
    country: 'USA',
    city: 'Austin',
    daily_production_capacity: 1000,
    current_utilization: 80,
    operating_status: 'NORMAL',
  });

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const res = await api.get<Facility[]>('/facilities');
      setFacilities(res.data);
    } catch (err) {
      console.error('Failed to load facilities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/facilities', formData);
      setIsCreateOpen(false);
      loadFacilities();
    } catch (err) {
      alert('Failed to register facility.');
    }
  };

  const filteredFacilities = facilities.filter(
    (f) => filterType === 'ALL' || f.facility_type === filterType
  );

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Manufacturing Plants & Regional Logistics Hubs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Assembly plants, finished goods warehouses, distribution centers, and global transit corridors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormData({
                name: '',
                code: `FAC-${facilities.length + 1}`,
                facility_type: 'PLANT',
                country: 'USA',
                city: 'Austin',
                daily_production_capacity: 1000,
                current_utilization: 80,
                operating_status: 'NORMAL',
              });
              setIsCreateOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Facility
          </Button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <span className="text-slate-500 font-medium">Type:</span>
        {['ALL', 'PLANT', 'DISTRIBUTION_CENTER', 'LOGISTICS_HUB'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map((fac) => (
          <div
            key={fac.id}
            className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-400 block">{fac.code}</span>
                <h3 className="font-semibold text-slate-900 text-sm">{fac.name}</h3>
              </div>
              <Badge variant={fac.operating_status === 'NORMAL' ? 'success' : 'danger'}>
                {fac.operating_status}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {fac.city}, {fac.country}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Type:</span>
                <span className="font-semibold text-slate-800">{fac.facility_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal Daily Capacity:</span>
                <span className="font-semibold text-slate-800">{fac.daily_production_capacity} units</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-500">Operating Load:</span>
                  <span className="font-bold text-slate-800">{fac.current_utilization}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      fac.current_utilization > 90
                        ? 'bg-rose-500'
                        : fac.current_utilization > 75
                        ? 'bg-blue-600'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, fac.current_utilization)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Manufacturing or Logistics Facility"
        subtitle="Specify plant capacity, throughput parameters, and location."
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Facility Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Type</label>
              <select
                value={formData.facility_type}
                onChange={(e) => setFormData({ ...formData, facility_type: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900"
              >
                <option value="PLANT">Manufacturing Plant</option>
                <option value="DISTRIBUTION_CENTER">Distribution Center</option>
                <option value="LOGISTICS_HUB">Logistics Hub</option>
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
              <label className="font-semibold text-slate-700 block mb-1">Daily Capacity</label>
              <input
                type="number"
                required
                value={formData.daily_production_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, daily_production_capacity: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Utilization %</label>
              <input
                type="number"
                required
                value={formData.current_utilization}
                onChange={(e) =>
                  setFormData({ ...formData, current_utilization: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Facility
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
