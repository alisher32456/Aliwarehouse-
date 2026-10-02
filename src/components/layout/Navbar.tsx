import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Wallet, Bell, Shield, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onOpenAuth, unreadCount = 0 }) => {
  const { user, isAuthenticated, isAdmin, logout, quickSwitchAccount } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                R
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                  Rozgar
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Reseller Network
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-emerald-700 transition-colors ${currentTab === 'home' ? 'text-emerald-600 font-semibold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className={`hover:text-emerald-700 transition-colors ${currentTab === 'catalog' ? 'text-emerald-600 font-semibold' : ''}`}
            >
              Wholesale Catalog
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`hover:text-emerald-700 transition-colors ${currentTab === 'dashboard' ? 'text-emerald-600 font-semibold' : ''}`}
                >
                  Reseller Dashboard
                </button>
                <button
                  onClick={() => onNavigate('orders')}
                  className={`hover:text-emerald-700 transition-colors ${currentTab === 'orders' ? 'text-emerald-600 font-semibold' : ''}`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => onNavigate('wallet')}
                  className={`hover:text-emerald-700 transition-colors ${currentTab === 'wallet' ? 'text-emerald-600 font-semibold' : ''}`}
                >
                  Wallet & Payouts
                </button>
              </>
            )}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold transition-colors ${currentTab === 'admin' ? 'ring-1 ring-purple-300' : ''}`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Portal
              </button>
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Demo Switcher helper */}
            <div className="hidden lg:flex items-center text-xs bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => quickSwitchAccount('reseller')}
                className={`px-2.5 py-1 rounded-md transition-colors ${user?.role === 'RESELLER' ? 'bg-white text-emerald-800 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Switch to Demo Reseller Ayesha"
              >
                Demo Reseller
              </button>
              <button
                onClick={() => quickSwitchAccount('admin')}
                className={`px-2.5 py-1 rounded-md transition-colors ${isAdmin ? 'bg-white text-purple-800 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                title="Switch to Demo Admin Ali Sher"
              >
                Demo Admin
              </button>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications trigger */}
                <button
                  onClick={() => onNavigate('notifications')}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full" />
                  )}
                </button>

                {/* Profile Pill */}
                <button
                  onClick={() => onNavigate('profile')}
                  className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {user?.name.charAt(0) || 'U'}
                  </div>
                  <div className="truncate max-w-[120px]">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {user?.business_name || user?.name}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      {user?.role}
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-700/20 whitespace-nowrap"
                >
                  Start Reselling
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
