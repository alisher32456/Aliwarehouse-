import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Search, Eye, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    const res = await api.getAdminOrders({
      status: statusFilter,
      search: search || undefined
    });
    if (res.success && res.data) {
      setOrders(res.data.orders);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Order Fulfillment &amp; Profit Release</h2>
          <p className="text-xs text-slate-500">
            Dispatch orders, enter tracking numbers, and trigger automated wallet ledger profit releases.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="READY_TO_SHIP">READY_TO_SHIP</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
            <option value="DELIVERED">DELIVERED (Profit Credited)</option>
            <option value="CANCELLED">CANCELLED (Reversed)</option>
            <option value="RETURNED">RETURNED (Reversed)</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer name, mobile, reseller..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors"
        >
          Search
        </button>
      </form>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No orders match your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Reseller</th>
                  <th className="py-3">Customer &amp; City</th>
                  <th className="py-3 text-right">Customer COD</th>
                  <th className="py-3 text-right">Supplier Cost</th>
                  <th className="py-3 text-right">Reseller Profit</th>
                  <th className="py-3 text-center">Profit Status</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      #{o.order_number}
                      {o.tracking_number && (
                        <p className="text-[10px] text-slate-400 font-mono">Trk: {o.tracking_number}</p>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 font-sans">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-sans">
                      <p className="font-semibold text-slate-900">{o.reseller_name}</p>
                      <p className="text-[10px] text-slate-400">@{o.reseller_username}</p>
                    </td>
                    <td className="py-3 font-sans text-slate-700">
                      <p className="font-medium text-slate-900">{o.customer_name}</p>
                      <p className="text-[10px] text-slate-500">{o.customer_city} · {o.customer_phone}</p>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      Rs. {o.total_amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-rose-700 font-semibold bg-rose-50/30">
                      Rs. {o.total_supplier_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-purple-700 font-bold">
                      +Rs. {o.reseller_profit.toLocaleString()}
                    </td>
                    <td className="py-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.profit_released === 1
                          ? 'bg-emerald-50 text-emerald-800'
                          : o.profit_released === -1
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {o.profit_released === 1 ? 'Released' : o.profit_released === -1 ? 'Reversed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 text-center font-sans">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.status === 'CANCELLED' || o.status === 'RETURNED'
                          ? 'bg-rose-100 text-rose-800'
                          : o.status === 'SHIPPED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded-lg transition-colors text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
