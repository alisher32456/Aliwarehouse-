import React from 'react';
import { Home, ShoppingBag, ClipboardList, Wallet, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onNavigate, onOpenAuth }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  const handleTabClick = (tab: string) => {
    if (!isAuthenticated && ['dashboard', 'orders', 'wallet', 'profile'].includes(tab)) {
      onOpenAuth();
      return;
    }
    onNavigate(tab);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
        {/* Tab 1: Home */}
        <button
          onClick={() => handleTabClick(isAuthenticated ? 'dashboard' : 'home')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
            ['home', 'dashboard'].includes(currentTab) ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">
            {isAuthenticated ? 'Dashboard' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Catalog */}
        <button
          onClick={() => handleTabClick('catalog')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
            currentTab === 'catalog' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Products</span>
        </button>

        {/* Tab 3: Orders */}
        <button
          onClick={() => handleTabClick('orders')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
            currentTab === 'orders' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Orders</span>
        </button>

        {/* Tab 4: Wallet */}
        <button
          onClick={() => handleTabClick('wallet')}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
            currentTab === 'wallet' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Wallet</span>
        </button>

        {/* Tab 5: Profile or Admin */}
        {isAdmin ? (
          <button
            onClick={() => handleTabClick('admin')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              currentTab === 'admin' ? 'text-purple-700 font-semibold' : 'text-purple-600 hover:text-purple-800'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1 font-semibold">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[44px] transition-colors ${
              currentTab === 'profile' ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">
              {isAuthenticated ? 'Profile' : 'Sign In'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
