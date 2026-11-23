import React, { useState, useEffect } from 'react';
import { Building2, Plus, MapPin } from 'lucide-react';
import api from '../api/client';
import { Facility } from '../types';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4">
        <div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#9875ff]" />
            Manufacturing Plants & Regional Logistics Hubs
          </h2>
          <p className="text-xs text-[#a6a4c3] mt-0.5">
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 glass-card p-2">
        {['ALL', 'PLANT', 'DISTRIBUTION_CENTER', 'LOGISTICS_HUB'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === type
                ? 'bg-gradient-to-r from-[#7957e8] to-[#9875ff] text-white shadow-[0_0_10px_rgba(152,117,255,0.35)]'
                : 'text-[#a6a4c3] hover:text-[#f4f2ff] hover:bg-white/5'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Facility Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map((fac) => (
          <div
            key={fac.id}
            className="glass-card p-5 group hover:border-[#9875ff]/40 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[#9875ff] text-[10px] block">{fac.code}</span>
                <h3 className="font-bold text-[#f4f2ff] text-sm mt-0.5">{fac.name}</h3>
                <div className="flex items-center gap-1 text-xs text-[#a6a4c3] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#55a8ff]" />
                  <span>
                    {fac.city}, {fac.country}
                  </span>
                </div>
              </div>
              <Badge variant={fac.operating_status === 'NORMAL' ? 'success' : 'danger'}>
                {fac.operating_status}
              </Badge>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(160,140,255,0.12)] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#a6a4c3]">Type:</span>
                <span className="font-semibold text-[#f4f2ff]">{fac.facility_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a6a4c3]">Nominal Daily Capacity:</span>
                <span className="font-semibold text-[#f4f2ff]">{fac.daily_production_capacity} units</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-[#a6a4c3]">Operating Load:</span>
                  <span className="font-bold text-[#f4f2ff]">{fac.current_utilization}%</span>
                </div>
                <div className="w-full bg-[#080817] h-2 rounded-full overflow-hidden border border-[rgba(160,140,255,0.15)]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fac.current_utilization > 90
                        ? 'bg-gradient-to-r from-[#ff718a] to-[#e11d48] shadow-[0_0_8px_#ff718a]'
                        : fac.current_utilization > 75
                        ? 'bg-gradient-to-r from-[#7957e8] to-[#9875ff] shadow-[0_0_8px_#9875ff]'
                        : 'bg-gradient-to-r from-[#35d6a0] to-[#10b981] shadow-[0_0_8px_#35d6a0]'
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
            <label className="font-semibold text-[#f4f2ff] block mb-1">Facility Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-[#f4f2ff] block mb-1">Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff] font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#f4f2ff] block mb-1">Type</label>
              <select
                value={formData.facility_type}
                onChange={(e) => setFormData({ ...formData, facility_type: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
              >
                <option value="PLANT">Manufacturing Plant</option>
                <option value="DISTRIBUTION_CENTER">Distribution Center</option>
                <option value="LOGISTICS_HUB">Logistics Hub</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-[#f4f2ff] block mb-1">Country</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#f4f2ff] block mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#f4f2ff] block mb-1">Daily Capacity</label>
              <input
                type="number"
                required
                value={formData.daily_production_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, daily_production_capacity: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff] font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-[#f4f2ff] block mb-1">Utilization %</label>
              <input
                type="number"
                required
                value={formData.current_utilization}
                onChange={(e) =>
                  setFormData({ ...formData, current_utilization: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-1.5 bg-[#080817]/90 text-[#f4f2ff] border border-[rgba(160,140,255,0.2)] rounded-lg focus:ring-1 focus:ring-[#9875ff] focus:border-[#9875ff] font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(160,140,255,0.12)]">
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
