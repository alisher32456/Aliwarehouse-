import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Truck, Users, Wallet,
  ArrowUpRight, DollarSign, TrendingUp, AlertTriangle, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const res = await api.getAdminDashboard();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
        Loading executive metrics...
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-xs text-rose-600">Failed to load admin metrics.</div>;
  }

  const { metrics, recentOrders, topProducts } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Executive Command Center</h2>
        <p className="text-xs text-slate-500">Live platform finances, supplier liabilities, and sales volume.</p>
      </div>

      {/* Pending User Approvals Alert Card */}
      <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs border ${
        metrics.pendingApprovalsCount > 0
          ? 'bg-amber-50 border-amber-300'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            metrics.pendingApprovalsCount > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-sm ${metrics.pendingApprovalsCount > 0 ? 'text-amber-950' : 'text-slate-900'}`}>
                Pending User Approvals: {metrics.pendingApprovalsCount || 0}
              </h3>
              {metrics.pendingApprovalsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                  ACTION REQUIRED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {metrics.pendingApprovalsCount > 0
                ? `${metrics.pendingApprovalsCount} new reseller ${metrics.pendingApprovalsCount === 1 ? 'account is' : 'accounts are'} awaiting admin approval to activate store and place orders.`
                : 'All reseller applications are up to date. No pending approvals.'}
            </p>
          </div>
        </div>

        <Link
          to="/admin/users?status=PENDING_APPROVAL"
          className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap text-center ${
            metrics.pendingApprovalsCount > 0
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          View Pending Resellers →
        </Link>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Platform Sales</span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            Rs. {metrics.totalSales.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">{metrics.totalOrders} total orders processed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Platform Gross Margin</span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            Rs. {metrics.platformRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Platform Base minus Supplier Cost</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Reseller Profit Generated</span>
          <p className="text-2xl font-bold font-mono text-purple-700 mt-1">
            Rs. {metrics.resellerProfits.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Reseller markup earnings</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Supplier COGS Payable</span>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">
            Rs. {metrics.supplierCosts.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">Payable to wholesale vendors</p>
        </div>
      </div>

      {/* Liabilities & Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-900">Pending Withdrawal Requests:</span>
            <p className="text-2xl font-bold font-mono text-purple-950 mt-1">
              Rs. {metrics.pendingWithdrawalsAmount.toLocaleString()}
            </p>
            <p className="text-[11px] text-purple-700 mt-1">{metrics.pendingWithdrawalsCount} resellers awaiting payout approval</p>
          </div>
          <Link
            to="/admin/withdrawals"
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Review Payouts →
          </Link>
        </div>

        <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Available Wallet Balance Liability:</span>
            <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              Rs. {metrics.totalAvailableLiability.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Pending order clearing liability: Rs. {metrics.totalPendingLiability.toLocaleString()}</p>
          </div>
          <Link
            to="/admin/orders"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Fulfill Orders →
          </Link>
        </div>
      </div>

      {/* Live Orders Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Recent Orders</h3>
            <p className="text-[11px] text-slate-500">Latest orders submitted across all reseller stores</p>
          </div>
          <Link to="/admin/orders" className="text-xs font-semibold text-purple-700 hover:text-purple-900">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="pb-2">Order #</th>
                <th className="pb-2">Reseller</th>
                <th className="pb-2">Customer &amp; City</th>
                <th className="pb-2 text-right">Customer Total</th>
                <th className="pb-2 text-right">Supplier Cost</th>
                <th className="pb-2 text-right">Reseller Profit</th>
                <th className="pb-2 text-center">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recentOrders?.map((o: Order) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 font-bold text-slate-900 font-sans">#{o.order_number}</td>
                  <td className="py-2.5 font-sans text-slate-700">{o.reseller_name}</td>
                  <td className="py-2.5 font-sans text-slate-600">{o.customer_name} ({o.customer_city})</td>
                  <td className="py-2.5 text-right font-bold text-slate-900">Rs. {o.total_amount.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-amber-700">Rs. {o.total_supplier_cost?.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-purple-700 font-bold">+Rs. {o.reseller_profit.toLocaleString()}</td>
                  <td className="py-2.5 text-center font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-sans">
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
