import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Truck, Package } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setLoading(true);
      const res = await api.getOrderDetails(id);
      if (res.success && res.data) {
        setOrder(res.data.order);
      } else {
        setError(res.message || 'Order not found');
      }
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">{error || 'Order not found'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <button
        onClick={() => navigate('/orders')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Orders List</span>
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              ORDER #{order.order_number}
            </span>
            <h1 className="text-xl font-bold text-slate-900 font-display mt-1">
              Customer Package Tracking
            </h1>
            <p className="text-xs text-slate-400">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
              order.status === 'CANCELLED' || order.status === 'RETURNED' ? 'bg-rose-100 text-rose-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Courier tracking alert */}
        {order.tracking_number && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-950">{order.courier || 'TCS Courier'}</p>
                <p className="text-[11px] text-emerald-800">Tracking: <strong className="font-mono">{order.tracking_number}</strong></p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
              Live Courier Tracking
            </span>
          </div>
        )}

        {/* Ordered items */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Ordered Products</h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            {order.items?.map((it) => (
              <div key={it.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{it.product_name}</p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Quantity: {it.quantity} × Rs. {it.selling_price.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">
                    Rs. {(it.selling_price * it.quantity).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-emerald-700 font-mono font-semibold">
                    +Rs. {(it.profit_per_unit * it.quantity).toLocaleString()} profit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer & Address */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Customer Delivery Address (COD)</h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-900">{order.customer_name} ({order.customer_phone})</p>
            <p className="text-slate-600">{order.customer_address}</p>
            <p className="text-slate-500">{order.customer_area}, {order.customer_city}, {order.customer_province}</p>
            {order.customer_landmark && (
              <p className="text-[11px] text-slate-400">Landmark: {order.customer_landmark}</p>
            )}
          </div>
        </div>

        {/* Timeline Progression */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Status History Timeline</h3>
          <div className="border-l-2 border-emerald-500 ml-3 pl-4 space-y-4 text-xs">
            {order.history?.map((h) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                <p className="font-bold text-slate-900">{h.status}</p>
                <p className="text-slate-600 text-[11px]">{h.comment}</p>
                <p className="text-slate-400 text-[10px] font-mono">{new Date(h.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>Customer Subtotal:</span>
            <span className="font-bold">Rs. {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Delivery Fee:</span>
            <span className="font-bold">Rs. {order.delivery_charge}</span>
          </div>
          <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
            <span>Customer Total (COD):</span>
            <span className="text-emerald-400">Rs. {order.total_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-emerald-300 font-bold text-sm pt-2 border-t border-slate-800">
            <span>Your Reseller Profit:</span>
            <span>+Rs. {order.reseller_profit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
