import React, { useState, useEffect } from 'react';
import { Search, Filter, Truck, Package, Clock, CheckCircle2, XCircle, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { api } from '../../services/api';

export const ResellerOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const openOrderDetails = async (orderId: string) => {
    const res = await api.getOrderDetails(orderId);
    if (res.success && res.data) {
      setSelectedOrder(res.data.order);
    }
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
              onClick={() => openOrderDetails(o.id)}
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
                  <span>Destination: <strong className="text-slate-700">{o.customer_city}</strong></span>
                  <span>Date: {new Date(o.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Profit & Status badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400">Reseller Profit</span>
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

      {/* Order Details & Timeline Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700">
                  ORDER #{selectedOrder.order_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Order Tracking &amp; Delivery Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5 text-xs">
              {/* Status Header */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Current Status:</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedOrder.status}</p>
                </div>
                {selectedOrder.tracking_number && (
                  <div className="text-right">
                    <span className="text-slate-500">Courier Tracking:</span>
                    <p className="font-mono font-bold text-emerald-700">{selectedOrder.tracking_number}</p>
                  </div>
                )}
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Ordered Items</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl p-3 bg-white space-y-2">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="pt-2 first:pt-0 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-900">{it.product_name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">Qty: {it.quantity} × Rs. {it.selling_price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">Rs. {(it.selling_price * it.quantity).toLocaleString()}</span>
                        <p className="text-[10px] text-emerald-700 font-mono">+Rs. {(it.profit_per_unit * it.quantity).toLocaleString()} profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer & Shipping info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Delivery Address (COD)</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="font-semibold text-slate-900">{selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                  <p className="text-slate-600">{selectedOrder.customer_address}</p>
                  <p className="text-slate-500">{selectedOrder.customer_area}, {selectedOrder.customer_city}, {selectedOrder.customer_province}</p>
                  {selectedOrder.customer_landmark && (
                    <p className="text-[11px] text-slate-400">Landmark: {selectedOrder.customer_landmark}</p>
                  )}
                </div>
              </div>

              {/* Timeline History */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Order Progression Timeline</h4>
                <div className="border-l-2 border-emerald-500 ml-2 pl-4 space-y-3">
                  {selectedOrder.history?.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <p className="font-bold text-slate-900">{h.status}</p>
                      <p className="text-slate-600 text-[11px]">{h.comment}</p>
                      <p className="text-slate-400 text-[10px]">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-300">Customer Total (COD):</span>
                  <span className="font-bold">Rs. {selectedOrder.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-300 font-bold text-sm pt-1 border-t border-slate-800">
                  <span>Your Net Reseller Profit:</span>
                  <span>Rs. {selectedOrder.reseller_profit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
