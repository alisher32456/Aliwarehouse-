import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, ArrowRight, Clock, ShieldAlert, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export const UserLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{
    message: string;
    status?: string;
  } | null>(null);

  // If already authenticated, redirect to /dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res.success) {
        // Redirection rule: Resellers ALWAYS redirect to /dashboard, NEVER to /admin
        const destination = location.state?.from?.pathname && !location.state.from.pathname.startsWith('/admin')
          ? location.state.from.pathname
          : '/dashboard';
        navigate(destination, { replace: true });
      } else {
        setErrorInfo({
          message: res.message || 'Invalid credentials',
          status: (res as any).status
        });
      }
    } catch (err: any) {
      setErrorInfo({
        message: err.message || 'Login failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorInfo(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-bold text-xl font-display">
            R
          </div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Reseller Store Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Access your wholesale catalog, track customer deliveries, and manage your profit payouts.
          </p>
        </div>

        {/* Demo Fast Fill Helpers */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Test Account Profiles:
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleAutofill('ayeshacollections', 'Password123!')}
              className="px-2 py-1.5 text-left rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors font-medium truncate"
            >
              ✅ Ayesha (Active)
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('tariqelectronics', 'Password123!')}
              className="px-2 py-1.5 text-left rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors font-medium truncate"
            >
              ⏳ Tariq (Pending)
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('kamrangoods', 'Password123!')}
              className="px-2 py-1.5 text-left rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors font-medium truncate"
            >
              ❌ Kamran (Rejected)
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('zahidbazaar', 'Password123!')}
              className="px-2 py-1.5 text-left rounded-lg bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition-colors font-medium truncate"
            >
              ⚠️ Zahid (Suspended)
            </button>
          </div>
        </div>

        {/* Error / Status Alert Banners */}
        {errorInfo && (
          <div>
            {errorInfo.status === 'PENDING_APPROVAL' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Account Pending Approval</span>
                </div>
                <p className="text-amber-900 font-medium text-xs leading-relaxed">
                  Your account is waiting for admin approval.
                </p>
                <p className="text-[11px] text-amber-700">
                  Our operations team is reviewing your registration. You will be able to sign in once an administrator approves your account.
                </p>
              </div>
            ) : errorInfo.status === 'REJECTED' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Registration Not Approved</span>
                </div>
                <p className="text-rose-900 font-medium text-xs leading-relaxed">
                  Your registration was not approved.
                </p>
                <p className="text-[11px] text-rose-700">
                  Contact platform support via WhatsApp or email if you believe this is in error.
                </p>
              </div>
            ) : errorInfo.status === 'SUSPENDED' ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Account Suspended</span>
                </div>
                <p className="text-rose-900 font-medium text-xs leading-relaxed">
                  Your account has been suspended. Please contact support.
                </p>
              </div>
            ) : (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorInfo.message}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Store Username, Email, or Mobile
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ayeshacollections or 03001234567"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-emerald-700/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Store'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
          New entrepreneur?{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-900">
            Submit Reseller Application
          </Link>
        </div>
      </div>
    </div>
  );
};
