import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Package, ShieldCheck, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [selectedStatus, setSelectedStatus] = useState<string>('SHIPPED');
  const [statusComment, setStatusComment] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    const res = await api.getOrderDetails(id);
    if (res.success && res.data) {
      setOrder(res.data.order);
      setSelectedStatus(res.data.order.status);
      setTrackingNumberInput(res.data.order.tracking_number || '');
    } else {
      setError(res.message || 'Order not found');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setUpdating(true);

    const res = await api.updateOrderStatus(id, {
      status: selectedStatus,
      comment: statusComment || `Admin marked order as ${selectedStatus}`,
      tracking_number: trackingNumberInput || undefined
    });

    setUpdating(false);
    if (res.success) {
      alert(`Order updated to ${selectedStatus}! Financial ledger synchronized.`);
      setStatusComment('');
      loadOrder();
    } else {
      alert(res.message || 'Status transition failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto p-12 text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">{error || 'Order not found'}</p>
        <Link
          to="/admin/orders"
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl inline-block"
        >
          Return to Orders List
        </Link>
      </div>
    );
  }

  const items = order.items || [];
  const history = order.history || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-display">
                Order #{order.order_number}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : order.status === 'CANCELLED' || order.status === 'RETURNED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.created_at).toLocaleString()} via Reseller @{order.reseller_username}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Breakdown & Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery Address Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Customer &amp; Shipping Destination</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">COD PAYMENT</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px]">Customer Name:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{order.customer_name}</p>
                <p className="text-slate-600 mt-1">Phone: {order.customer_phone}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Delivery Location:</span>
                <p className="font-semibold text-slate-900 mt-0.5">{order.customer_city}, {order.customer_province || 'Pakistan'}</p>
                <p className="text-slate-600 mt-1 leading-relaxed">{order.customer_address}</p>
                {order.customer_landmark && (
                  <p className="text-slate-400 text-[11px] mt-0.5">Near: {order.customer_landmark}</p>
                )}
              </div>
            </div>

            {order.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-700">Customer Note: </span>
                {order.notes}
              </div>
            )}
          </div>

          {/* Ordered Products Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Ordered Items &amp; Margin Split
            </h2>

            <div className="divide-y divide-slate-100">
              {items.map((it: any) => (
                <div key={it.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.product_image || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
                      alt={it.product_name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{it.product_name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Qty: {it.quantity} × Rs. {it.selling_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <p className="font-bold text-slate-900">
                      Rs. {(it.selling_price * it.quantity).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-purple-700">
                      Reseller Profit: +Rs. {((it.selling_price - it.base_price) * it.quantity).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-rose-700">
                      Supplier Cost: Rs. {(it.supplier_cost * it.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-200 space-y-2 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Customer Price):</span>
                <span>Rs. {(order.total_amount - order.delivery_charge).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Courier Delivery Charge:</span>
                <span>Rs. {order.delivery_charge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-100">
                <span>Total Customer COD Payable:</span>
                <span>Rs. {order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status Timeline History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs text-xs">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Status Audit Log
            </h2>

            <div className="space-y-3">
              {history.map((h: any, idx: number) => (
                <div key={h.id || idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    {h.comment && <p className="text-slate-600 mt-0.5">{h.comment}</p>}
                    <p className="text-[10px] text-slate-400">By: {h.changed_by || 'System'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Status Transition Control Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-purple-200 p-6 space-y-5 shadow-xs text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                ADMIN WORKFLOW
              </span>
              <h2 className="font-bold text-slate-900 text-base mt-2 font-display">
                Update Fulfillment Status
              </h2>
              <p className="text-[11px] text-slate-500 mt-1">
                Changing status to <strong>DELIVERED</strong> immediately releases the reseller profit (Rs. {order.reseller_profit.toLocaleString()}) to their available balance.
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Order Status *</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED (Wholesale Packed)</option>
                  <option value="READY_TO_SHIP">READY_TO_SHIP (Handed to Courier)</option>
                  <option value="SHIPPED">SHIPPED (In Transit)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Rider Dispatched)</option>
                  <option value="DELIVERED">DELIVERED (Release Reseller Profit)</option>
                  <option value="CANCELLED">CANCELLED (Reverse Profit &amp; Restock)</option>
                  <option value="RETURNED">RETURNED (Reverse Profit &amp; Restock)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courier Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. TCS-892301923"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Audit Note</label>
                <textarea
                  rows={2}
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="e.g. Dispatched via TCS Courier, delivery expected in 48h."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>{updating ? 'Processing...' : 'Apply Status Transition'}</span>
              </button>
            </form>

            {/* Order Archive & Cancel Safeguard Controls (Requirement 4 & 5) */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              {order.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={async () => {
                    const reason = prompt('Please provide reason for order cancellation:');
                    if (reason === null) return;
                    setUpdating(true);
                    const res = await api.cancelAdminOrder(id!, reason || 'Cancelled by admin');
                    setUpdating(false);
                    if (res.success) {
                      loadOrder();
                    } else {
                      alert(res.message || 'Failed to cancel order');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                >
                  Cancel Order
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Are you sure you want to archive this order? It will be safely hidden from lists while preserving financial and delivery audit trails.')) return;
                  setUpdating(true);
                  const res = await api.archiveAdminOrder(id!);
                  setUpdating(false);
                  if (res.success) {
                    navigate('/admin/orders');
                  } else {
                    alert(res.message || 'Failed to archive order');
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-auto"
              >
                Archive Order
              </button>
            </div>
          </div>

          {/* Financial Breakdown Info Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5 font-display">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Profit Ledger Status
            </h3>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Reseller Profit Amount:</span>
                <span className="text-emerald-400 font-bold">Rs. {order.reseller_profit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profit Ledger State:</span>
                <span className={order.profit_released === 1 ? 'text-emerald-400 font-bold' : order.profit_released === -1 ? 'text-rose-400' : 'text-amber-400 font-bold'}>
                  {order.profit_released === 1 ? 'RELEASED (Available)' : order.profit_released === -1 ? 'REVERSED (Order Cancelled)' : 'PENDING (Escrow)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Base Amount:</span>
                <span className="text-slate-200">Rs. {(order.total_base_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Supplier COGS:</span>
                <span className="text-amber-400">Rs. {order.total_supplier_cost?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
