import React, { useState, useEffect } from 'react';
import { Boxes, Search, AlertCircle, CheckCircle, ArrowDownRight } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-slate-700" />
            Multi-Echelon Inventory & Buffer Depletion Monitor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time on-hand stocks, safety stock runout projections, and days-of-supply health across manufacturing plants.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search parts, SKUs, or facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <Card title={`Tracked SKUs & Material Buffers (${filteredInventory.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase text-[11px] border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isCriticalStock = item.quantity_on_hand <= item.safety_stock;
                const isWarningStock =
                  item.quantity_on_hand > item.safety_stock &&
                  item.quantity_on_hand <= item.reorder_point;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] text-slate-400 block">{item.material_sku}</span>
                      <span className="font-semibold text-slate-900">{item.material_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{item.facility_name}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                      {item.quantity_on_hand.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {item.safety_stock.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {item.reorder_point.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span
                        className={
                          item.days_of_supply < 10
                            ? 'text-rose-600'
                            : item.days_of_supply < 18
                            ? 'text-amber-600'
                            : 'text-emerald-700'
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
