import React, { useState, useEffect } from 'react';
import {
  Wrench, Trash2, Users, ShoppingBag, Truck, Building2,
  Wallet, Bell, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Check
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminMaintenancePage: React.FC = () => {
  const [stats, setStats] = useState<{
    demoUsers: number;
    demoProducts: number;
    demoOrders: number;
    demoSuppliers: number;
    demoTransactions: number;
    demoWithdrawals: number;
    demoNotifications: number;
  }>({
    demoUsers: 0,
    demoProducts: 0,
    demoOrders: 0,
    demoSuppliers: 0,
    demoTransactions: 0,
    demoWithdrawals: 0,
    demoNotifications: 0
  });

  const [loading, setLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const [cleanupResult, setCleanupResult] = useState<{
    usersRemoved: number;
    productsRemoved: number;
    ordersRemoved: number;
    otherRemoved: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    const res = await api.getMaintenanceStats();
    if (res.success && res.data?.stats) {
      setStats(res.data.stats);
    } else {
      setError(res.message || 'Failed to load maintenance statistics');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExecuteCleanup = async () => {
    setIsCleaning(true);
    setError(null);
    try {
      const res = await api.cleanupDemoData();
      if (res.success && res.data) {
        setCleanupResult(res.data);
        setShowConfirmModal(false);
        setConfirmInput('');
        await loadStats();
      } else {
        setError(res.message || 'Cleanup operation failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during cleanup');
    } finally {
      setIsCleaning(false);
    }
  };

  const sections = [
    { title: 'Demo Users', count: stats.demoUsers, icon: Users, desc: 'Fake reseller accounts & pending demo accounts' },
    { title: 'Demo Products', count: stats.demoProducts, icon: ShoppingBag, desc: 'Sample wholesale catalogue test products' },
    { title: 'Demo Orders', count: stats.demoOrders, icon: Truck, desc: 'Seed customer orders & ledger logs' },
    { title: 'Demo Suppliers', count: stats.demoSuppliers, icon: Building2, desc: 'Placeholder textile & gadget vendor records' },
    { title: 'Demo Wallet Transactions', count: stats.demoTransactions, icon: Wallet, desc: 'Test profit release and pending earnings transactions' },
    { title: 'Demo Withdrawals', count: stats.demoWithdrawals, icon: Wallet, desc: 'Sample Easypaisa and JazzCash requests' },
    { title: 'Demo Notifications', count: stats.demoNotifications, icon: Bell, desc: 'Sample merchant and admin push alert messages' },
  ];

  const totalDemoItems =
    stats.demoUsers +
    stats.demoProducts +
    stats.demoOrders +
    stats.demoSuppliers +
    stats.demoTransactions +
    stats.demoWithdrawals +
    stats.demoNotifications;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-700" />
            <span>Demo/Test Data Cleanup</span>
          </h1>
          <p className="text-xs text-slate-500">
            Permanently remove pre-seeded fake items while protecting real Super Admin credentials and platform settings.
          </p>
        </div>

        <button
          type="button"
          onClick={loadStats}
          disabled={loading || isCleaning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Scan</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2.5 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* After-Cleanup Success Report (Requirement 6) */}
      {cleanupResult && (
        <div className="p-6 bg-emerald-50/90 border border-emerald-200 rounded-3xl space-y-4 animate-fadeIn shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-emerald-950 text-base">Cleanup Execution Completed Successfully</h2>
              <p className="text-xs text-emerald-700">All demo records have been safely cleared from the database.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Users Removed</span>
              <span className="text-2xl font-bold font-mono text-emerald-900">{cleanupResult.usersRemoved}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Products Removed</span>
              <span className="text-2xl font-bold font-mono text-emerald-900">{cleanupResult.productsRemoved}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Orders Removed</span>
              <span className="text-2xl font-bold font-mono text-emerald-900">{cleanupResult.ordersRemoved}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Other Records Removed</span>
              <span className="text-2xl font-bold font-mono text-emerald-900">{cleanupResult.otherRemoved}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Cleanup Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Database Demo Records Scan</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                totalDemoItems > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {totalDemoItems > 0 ? `${totalDemoItems} Demo Items Found` : 'Database Clean (0 Demo Items)'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Scans all SQLite tables for test fixtures, demo resellers, sample catalogues, and test transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmInput('');
              setShowConfirmModal(true);
            }}
            disabled={isCleaning || totalDemoItems === 0}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Demo Data</span>
          </button>
        </div>

        {/* 7 Sections Display (Requirement 6) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.title}
                className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex items-start gap-3.5"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  sec.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/60 text-slate-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">{sec.title}</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                      sec.count > 0 ? 'bg-amber-200/60 text-amber-900' : 'bg-slate-200/50 text-slate-600'
                    }`}>
                      {sec.count} items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sec.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safeguard Notice */}
        <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-3 text-xs text-purple-900">
          <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Real Data &amp; Credentials Protection Safeguard</p>
            <p className="text-purple-800 leading-relaxed text-[11px]">
              Cleaning demo data does NOT delete the real Super Admin account (<code>admin@rozgar.pk</code>), system settings, application code, database schema, or any newly registered merchant users.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal (Requirement 6) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-slate-900 text-lg">Confirm Demo Data Removal</h3>
              <p className="text-xs text-slate-700 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed font-semibold">
                "This will permanently remove demo/test records. Your Admin account and application configuration will not be deleted."
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600">
                To confirm deletion, please type <span className="font-mono font-bold text-rose-700">DELETE DEMO DATA</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="DELETE DEMO DATA"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCleaning || confirmInput.trim().toUpperCase() !== 'DELETE DEMO DATA'}
                onClick={handleExecuteCleanup}
                className="px-6 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1.5"
              >
                {isCleaning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Cleaning Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Demo Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
