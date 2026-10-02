import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Users, ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';

export const AdminReportsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    const res = await api.getAdminReports(timeframe);
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, [timeframe]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Financial Reports &amp; Analytics</h2>
          <p className="text-xs text-slate-500">
            Platform revenue, margin splits, top performing resellers, and product demand metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                timeframe === t.id
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Aggregating financial data...
        </div>
      ) : !data ? (
        <div className="p-12 text-center text-xs text-rose-600">Failed to load reports data.</div>
      ) : (
        <div className="space-y-6">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                Rs. {data.summary.total_sales.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-2">{data.summary.total_orders} total orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Platform Margin</span>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                Rs. {data.summary.platform_margin.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Net company profit</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Reseller Earnings</span>
              <p className="text-2xl font-bold font-mono text-purple-700 mt-1">
                Rs. {data.summary.reseller_profits.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Paid out / payable to resellers</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Factory COGS</span>
              <p className="text-2xl font-bold font-mono text-amber-700 mt-1">
                Rs. {data.summary.supplier_costs.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500 mt-2">Wholesale inventory costs</p>
            </div>
          </div>

          {/* Top Resellers & Top Products Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Resellers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Top Performing Resellers
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Reseller</th>
                      <th className="pb-2 text-center">Orders</th>
                      <th className="pb-2 text-right">Sales Volume</th>
                      <th className="pb-2 text-right">Profit Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {data.topResellers?.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2.5 font-sans">
                          <p className="font-bold text-slate-900">{r.name}</p>
                          <p className="text-[10px] text-slate-400">@{r.username} · {r.city}</p>
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-700">{r.orders_count}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">Rs. {r.total_sales.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-700">Rs. {r.total_profit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Wholesale Products */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Top In-Demand Products
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2 text-center">Units Sold</th>
                      <th className="pb-2 text-right">Gross Sales</th>
                      <th className="pb-2 text-right">Platform Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {data.topProducts?.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2.5 font-sans">
                          <p className="font-bold text-slate-900 truncate max-w-[180px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                        </td>
                        <td className="py-2.5 text-center font-bold text-purple-700">{p.units_sold}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">Rs. {p.gross_sales.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-bold text-emerald-700">Rs. {p.platform_margin.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
