import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Truck, Users, Wallet,
  Building2, BarChart3, Settings, LogOut, Shield, ChevronRight, Wrench
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/admin/orders', label: 'Orders & Fulfillment', icon: Truck },
    { to: '/admin/products', label: 'Wholesale Products', icon: ShoppingBag },
    { to: '/admin/withdrawals', label: 'Payout Approvals', icon: Wallet },
    { to: '/admin/users', label: 'Reseller Accounts', icon: Users },
    { to: '/admin/suppliers', label: 'Wholesale Suppliers', icon: Building2 },
    { to: '/admin/reports', label: 'Financial Reports', icon: BarChart3 },
    { to: '/admin/settings', label: 'Platform Rules', icon: Settings },
    { to: '/admin/maintenance', label: 'Maintenance & Cleanup', icon: Wrench }
  ];

  const isActive = (path: string) => location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Admin Executive Top Navigation */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight font-display">Rozgar HQ Operations</h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Authorized: {user?.name} · Role: {user?.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Body with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-1 shrink-0">
          <div className="pb-3 mb-2 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Admin Portal</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">SECURE</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-purple-700' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Admin Routed Page Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
