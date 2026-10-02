import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { adminLogin, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as admin, redirect to /admin/dashboard
  React.useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminLogin(identifier, password);
      if (res.success) {
        const destination = location.state?.from?.pathname && location.state.from.pathname.startsWith('/admin') && location.state.from.pathname !== '/admin/login'
          ? location.state.from.pathname
          : '/admin/dashboard';
        navigate(destination, { replace: true });
      } else {
        setError(res.message || 'Access Denied: Invalid credentials or insufficient permissions.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillDemoAdmin = () => {
    setIdentifier('admin@rozgar.pk');
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white font-display">
            Rozgar HQ Operations Login
          </h1>
          <p className="text-xs text-slate-400">
            Internal Platform Management &amp; Wholesale Fulfillment Portal
          </p>
        </div>

        {/* Demo Fast Fill */}
        <div className="p-3 bg-purple-950/60 rounded-xl border border-purple-800/40 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-purple-300">Evaluating Admin Controls?</span>
          <button
            type="button"
            onClick={handleAutofillDemoAdmin}
            className="text-[11px] underline text-purple-300 hover:text-white font-bold"
          >
            Autofill Ali Sher (Admin)
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/50 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Admin Email or Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@rozgar.pk"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 text-white rounded-xl focus:bg-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700 text-white rounded-xl focus:bg-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Verifying Admin Privileges...' : 'Authenticate & Enter Admin Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>
            Are you a reseller?{' '}
            <a href="/login" className="text-emerald-400 font-bold hover:underline">
              Go to Reseller Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
