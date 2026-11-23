import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { InventoryItem } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      try {
        const res = await api.get<InventoryItem[]>('/inventory');
        setInventory(res.data);
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);

  const filteredInventory = inventory.filter(
    (item) =>
      item.material_name.toLowerCase().includes(search.toLowerCase()) ||
      item.material_sku.toLowerCase().includes(search.toLowerCase()) ||
      item.facility_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass-card p-4">
        <div>
          <h2 className="text-base font-bold text-[#f4f2ff] tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#9875ff]" />
            Multi-Echelon Inventory & Buffer Depletion Monitor
          </h2>
          <p className="text-xs text-[#a6a4c3] mt-0.5">
            Real-time on-hand stocks, safety stock runout projections, and days-of-supply health across manufacturing plants.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-[#a6a4c3] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search parts, SKUs, or facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#080817]/80 text-[#f4f2ff] placeholder-[#a6a4c3]/60 border border-[rgba(160,140,255,0.2)] rounded-lg focus:outline-none focus:border-[#9875ff] focus:ring-1 focus:ring-[#9875ff]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card title={`Tracked SKUs & Material Buffers (${filteredInventory.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080817]/70 text-[#a6a4c3] font-mono uppercase text-[11px] border-b border-[rgba(160,140,255,0.15)]">
              <tr>
                <th className="py-2.5 px-3">Material SKU / Name</th>
                <th className="py-2.5 px-3">Facility Location</th>
                <th className="py-2.5 px-3">On-Hand Stock</th>
                <th className="py-2.5 px-3">Safety Stock</th>
                <th className="py-2.5 px-3">Reorder Point</th>
                <th className="py-2.5 px-3">Days of Supply</th>
                <th className="py-2.5 px-3">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(160,140,255,0.08)]">
              {filteredInventory.map((item) => {
                const isCriticalStock = item.quantity_on_hand <= item.safety_stock;
                const isWarningStock =
                  item.quantity_on_hand > item.safety_stock &&
                  item.quantity_on_hand <= item.reorder_point;

                return (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] text-[#9875ff] block">{item.material_sku}</span>
                      <span className="font-semibold text-[#f4f2ff]">{item.material_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#a6a4c3] font-medium">{item.facility_name}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#f4f2ff]">
                      {item.quantity_on_hand.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#a6a4c3]">
                      {item.safety_stock.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#a6a4c3]">
                      {item.reorder_point.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span
                        className={
                          item.days_of_supply < 10
                            ? 'text-[#ff718a]'
                            : item.days_of_supply < 18
                            ? 'text-[#f5c66b]'
                            : 'text-[#35d6a0]'
                        }
                      >
                        {item.days_of_supply} days
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isCriticalStock ? (
                        <Badge variant="danger">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Stockout Risk
                        </Badge>
                      ) : isWarningStock ? (
                        <Badge variant="warning">Reorder Zone</Badge>
                      ) : (
                        <Badge variant="success">Buffer Healthy</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
