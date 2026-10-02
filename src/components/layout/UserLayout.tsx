import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Wallet, Bell, LogOut, Home, ClipboardList, User as UserIcon, Check } from 'lucide-react';
import { api } from '../../services/api';
import { NotificationsModal } from '../reseller/NotificationsModal';

export const UserLayout: React.FC = () => {
  const { user, isAuthenticated, logout, quickSwitchAccount } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);

  const loadUnreadNotifs = async () => {
    if (!isAuthenticated) return;
    const res = await api.getNotifications();
    if (res.success && res.data) {
      const unread = res.data.notifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    }
  };

  useEffect(() => {
    loadUnreadNotifs();
  }, [isAuthenticated, location.pathname]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 md:pb-0">
      {/* User Top Navbar (Never displays Admin portal links) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Zone 1: Single text element wordmark */}
            <div className="flex items-center gap-3">
              <Link
                to={isAuthenticated ? '/dashboard' : '/'}
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
                    Reseller Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Zone 2: Clean text navigation links for Resellers */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link
                to="/"
                className={`hover:text-emerald-700 transition-colors ${isActive('/') && location.pathname === '/' ? 'text-emerald-600 font-semibold' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`hover:text-emerald-700 transition-colors ${isActive('/products') ? 'text-emerald-600 font-semibold' : ''}`}
              >
                Wholesale Catalog
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`hover:text-emerald-700 transition-colors ${isActive('/dashboard') ? 'text-emerald-600 font-semibold' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/orders"
                    className={`hover:text-emerald-700 transition-colors ${isActive('/orders') ? 'text-emerald-600 font-semibold' : ''}`}
                  >
                    My Orders
                  </Link>
                  <Link
                    to="/wallet"
                    className={`hover:text-emerald-700 transition-colors ${isActive('/wallet') || isActive('/withdraw') ? 'text-emerald-600 font-semibold' : ''}`}
                  >
                    Wallet &amp; Payouts
                  </Link>
                </>
              )}
            </nav>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Demo Reseller helper */}
              {!isAuthenticated && (
                <button
                  onClick={() => quickSwitchAccount('reseller')}
                  className="hidden lg:inline-block px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Quick Demo Reseller
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Notifications */}
                  <button
                    onClick={() => setIsNotifsOpen(true)}
                    className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full" />
                    )}
                  </button>

                  {/* Profile link */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {user?.name.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:block truncate max-w-[120px]">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {user?.business_name || user?.name}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        {user?.role}
                      </p>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-700/20 whitespace-nowrap"
                  >
                    Start Reselling
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Routed Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation for Resellers */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              isActive(isAuthenticated ? '/dashboard' : '/') ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">
              {isAuthenticated ? 'Dashboard' : 'Home'}
            </span>
          </Link>

          <Link
            to="/products"
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              isActive('/products') ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Products</span>
          </Link>

          <Link
            to={isAuthenticated ? '/orders' : '/login'}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              isActive('/orders') ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Orders</span>
          </Link>

          <Link
            to={isAuthenticated ? '/wallet' : '/login'}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              isActive('/wallet') || isActive('/withdraw') ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Wallet</span>
          </Link>

          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              isActive('/profile') ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">
              {isAuthenticated ? 'Profile' : 'Sign In'}
            </span>
          </Link>
        </div>
      </nav>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        onRefreshUnread={loadUnreadNotifs}
      />
    </div>
  );
};
