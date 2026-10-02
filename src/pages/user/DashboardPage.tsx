import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Clock, Wallet, ArrowUpRight, Copy, Check } from 'lucide-react';
import { Order, Product } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    pending_balance: 0,
    available_balance: 0,
    withdrawn_balance: 0,
    total_earned: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [dashRes, prodRes] = await Promise.all([
        api.getResellerDashboard(),
        api.getProducts()
      ]);

      if (dashRes.success && dashRes.data) {
        setStats(dashRes.data.stats);
        setRecentOrders(dashRes.data.recentOrders);
      }

      if (prodRes.success && prodRes.data) {
        setTopProducts(prodRes.data.products.slice(0, 4));
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const storeUrl = `${window.location.origin}/products?reseller=${user?.username || 'store'}`;

  const handleCopyStoreLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopiedStoreLink(true);
    setTimeout(() => setCopiedStoreLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold">
            <span>Store: {user?.business_name || `${user?.name}'s Collection`}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display">
            Assalam-o-Alaikum, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            Track your customer orders, monitor pending profit clearances, and request instant payouts to your mobile wallet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Products</span>
          </button>
          <button
            onClick={handleCopyStoreLink}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5"
          >
            {copiedStoreLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedStoreLink ? 'Link Copied!' : 'Copy Store Link'}</span>
          </button>
        </div>
      </div>

      {/* Wallet Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Wallet Balance &amp; Earnings
          </h2>
          <button
            onClick={() => navigate('/wallet')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
          >
            View Full Ledger →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Available Balance */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Available for Payout
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  Rs. {stats.available_balance.toLocaleString()}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Min. payout: Rs. 500</span>
              <button
                onClick={() => navigate('/withdraw')}
                disabled={stats.available_balance < 500}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-40"
              >
                Withdraw Funds →
              </button>
            </div>
          </div>

          {/* Card 2: Pending Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Pending Profit
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  Rs. {stats.pending_balance.toLocaleString()}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Releases after delivery &amp; return window
            </p>
          </div>

          {/* Card 3: Withdrawn */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Withdrawn Amount
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  Rs. {stats.withdrawn_balance.toLocaleString()}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Paid to Easypaisa / JazzCash
            </p>
          </div>

          {/* Card 4: Total Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Total Profit Earned
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                  Rs. {stats.total_earned.toLocaleString()}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              Lifetime gross margin earned
            </p>
          </div>
        </div>
      </div>

      {/* Order Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="text-center p-2">
          <span className="text-xs text-slate-500">Total Orders</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{stats.totalOrders}</p>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <span className="text-xs text-amber-700">Pending / In-Transit</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">{stats.pendingOrders}</p>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <span className="text-xs text-emerald-700">Delivered Orders</span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{stats.deliveredOrders}</p>
        </div>
        <div className="text-center p-2 border-l border-slate-100">
          <span className="text-xs text-slate-500">Cancelled / Returned</span>
          <p className="text-xl font-bold font-mono text-slate-500 mt-0.5">{stats.cancelledOrders}</p>
        </div>
      </div>

      {/* Recent Orders & Quick Share Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Orders */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Recent Customer Orders
            </h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              View All Orders →
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No orders placed yet. Share products to start earning!
              </div>
            ) : (
              recentOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">#{o.order_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        o.status === 'CANCELLED' || o.status === 'RETURNED' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate mt-1">
                      {o.item_name || 'Customer Order'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Customer: {o.customer_name} ({o.customer_city})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400">Your Profit</span>
                    <p className="font-mono font-bold text-xs text-emerald-700">
                      +Rs. {o.reseller_profit.toLocaleString()}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500">
                      Total: Rs. {o.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Share Spotlight */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Quick Share Products
            </h2>
            <button
              onClick={() => navigate('/products')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Browse All →
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.map((p) => {
              const profitMargin = p.max_selling_price - p.base_price;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <img
                    src={p.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
                    alt={p.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Base: Rs. {p.base_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Earn ~Rs. {profitMargin}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
