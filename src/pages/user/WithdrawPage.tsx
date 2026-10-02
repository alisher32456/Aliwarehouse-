import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Wallet, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export const WithdrawPage: React.FC = () => {
  const navigate = useNavigate();

  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(500);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Easypaisa' | 'JazzCash' | 'Bank Transfer'>('Easypaisa');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWalletInfo() {
      const [walletRes, settingsRes] = await Promise.all([
        api.getWallet(),
        api.getPublicSettings()
      ]);

      if (walletRes.success && walletRes.data) {
        setAvailableBalance(walletRes.data.wallet.available_balance);
      }
      if (settingsRes.success && settingsRes.data) {
        setMinWithdrawal(settingsRes.data.min_withdrawal);
      }
    }
    loadWalletInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < minWithdrawal) {
      setError(`Minimum withdrawal amount is Rs. ${minWithdrawal.toLocaleString()}`);
      return;
    }

    if (withdrawAmount > availableBalance) {
      setError(`Insufficient available balance. You have Rs. ${availableBalance.toLocaleString()} available.`);
      return;
    }

    if (!accountTitle || !accountNumber) {
      setError('Please provide account title and account number.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.requestWithdrawal({
        amount: withdrawAmount,
        payment_method: paymentMethod,
        account_title: accountTitle,
        account_number: accountNumber,
        payment_details: paymentDetails
      });

      if (res.success && res.data) {
        alert(`Withdrawal request #${res.data.withdrawal_number} for Rs. ${res.data.amount.toLocaleString()} submitted successfully! It will be reviewed by admin.`);
        navigate('/wallet');
      } else {
        setError(res.message || 'Withdrawal submission failed');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <button
        onClick={() => navigate('/wallet')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Wallet</span>
      </button>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Payout Request
          </span>
          <h1 className="text-xl font-bold text-slate-900 font-display mt-2">
            Withdraw Earnings
          </h1>
          <p className="text-xs text-slate-500">
            Transfer cleared profit directly to your Easypaisa, JazzCash, or Pakistani bank account.
          </p>
        </div>

        {/* Available Balance Box */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-semibold">Your Available Balance:</span>
            <p className="text-2xl font-bold font-mono text-emerald-950 mt-0.5">
              Rs. {availableBalance.toLocaleString()}
            </p>
          </div>
          <span className="text-[11px] text-emerald-800 font-mono">Min: Rs. {minWithdrawal}</span>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Withdrawal Amount (Rs.)
            </label>
            <input
              type="number"
              min={minWithdrawal}
              max={availableBalance}
              step={50}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min Rs. ${minWithdrawal}`}
              className="w-full px-3 py-2.5 text-sm font-bold font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Easypaisa', 'JazzCash', 'Bank Transfer'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-1 text-center font-semibold rounded-xl border text-[11px] transition-all ${
                    paymentMethod === m
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Account Title (Recipient Name)
            </label>
            <input
              type="text"
              required
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              placeholder="As registered in Easypaisa / JazzCash"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Account Number / Mobile Wallet / IBAN
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 03123456789"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Bank Name / Additional Transfer Notes (Optional)
            </label>
            <input
              type="text"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder="e.g. Meezan Bank, Gulberg Branch"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || availableBalance < minWithdrawal}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Submitting Request...' : 'Confirm Withdrawal Request'}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
