import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    const res = await api.getMyOrders({
      status: statusFilter,
      search: searchQuery
    });
    if (res.success && res.data) {
      setOrders(res.data.orders);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            My Customer Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track courier delivery status, customer details, and profit clearance milestones.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Order #, customer name..."
              className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none w-56 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'ALL', label: 'All Orders' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'CONFIRMED', label: 'Confirmed' },
          { key: 'SHIPPED', label: 'In Transit / Shipped' },
          { key: 'DELIVERED', label: 'Delivered (Profit Cleared)' },
          { key: 'CANCELLED', label: 'Cancelled / Returned' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-2">
          <Package className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No orders found in this view</p>
          <p className="text-xs text-slate-500">Orders placed by your customers will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">#{o.order_number}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                    ['CANCELLED', 'RETURNED', 'REFUNDED'].includes(o.status) ? 'bg-rose-100 text-rose-800' :
                    ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status) ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {o.status.replace('_', ' ')}
                  </span>
                  {o.tracking_number && (
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      TCS: {o.tracking_number}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-800 truncate">
                  {o.item_name || 'Customer Package'}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span>Customer: <strong className="text-slate-700">{o.customer_name}</strong></span>
                  <span>City: <strong className="text-slate-700">{o.customer_city}</strong></span>
                  <span>Date: {new Date(o.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Profit & Status badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400">Your Profit</span>
                  <p className="text-sm font-bold font-mono text-emerald-700">
                    +Rs. {o.reseller_profit.toLocaleString()}
                  </p>
                </div>

                <div className="mt-1">
                  {o.profit_released === 1 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Profit Available in Wallet
                    </span>
                  ) : o.profit_released === -1 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      <XCircle className="w-3 h-3" />
                      Profit Reversed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      Pending Delivery Clearance
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
