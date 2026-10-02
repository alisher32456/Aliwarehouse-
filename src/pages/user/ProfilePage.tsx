import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, Copy, Check, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const storeUrl = `${window.location.origin}/products?reseller=${user?.username || 'store'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-display">
          Merchant Store Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Your public seller identity, store address, and security settings.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center font-display shadow-sm">
              {user?.name.charAt(0) || 'R'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {user?.business_name || user?.name}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                @{user?.username} · {user?.city || 'Pakistan'}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Independent Reseller</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Store Link Copied' : 'Share Store Link'}</span>
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <User className="w-4 h-4" />
              <span>Full Name</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-4 h-4" />
              <span>Mobile Phone</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.phone}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="w-4 h-4" />
              <span>Email Address</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span>City / Base Location</span>
            </div>
            <p className="font-semibold text-slate-900">{user?.city || 'Pakistan'}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
