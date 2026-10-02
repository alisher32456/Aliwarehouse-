import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp, History, Building2, Smartphone } from 'lucide-react';
import { WalletTransaction, Withdrawal } from '../../types';
import { api } from '../../services/api';

export const ResellerWallet: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>({
    available_balance: 0,
    pending_balance: 0,
    withdrawn_balance: 0,
    total_earned: 0,
    total_refunded: 0
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<'ledger' | 'withdrawals'>('ledger');

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Easypaisa' | 'JazzCash' | 'Bank Transfer'>('Easypaisa');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const fetchWalletData = async () => {
    setLoading(true);
    const [walletRes, withdrawRes] = await Promise.all([
      api.getWallet(),
      api.getWithdrawals()
    ]);

    if (walletRes.success && walletRes.data) {
      setWallet(walletRes.data.wallet);
      setTransactions(walletRes.data.recentTransactions);
    }
    if (withdrawRes.success && withdrawRes.data) {
      setWithdrawals(withdrawRes.data.withdrawals);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 500) {
      setWithdrawError('Minimum withdrawal amount is Rs. 500');
      return;
    }

    if (withdrawAmount > wallet.available_balance) {
      setWithdrawError(`Insufficient funds. Your available balance is Rs. ${wallet.available_balance.toLocaleString()}`);
      return;
    }

    if (!accountTitle || !accountNumber) {
      setWithdrawError('Please enter valid account title and number');
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const res = await api.requestWithdrawal({
        amount: withdrawAmount,
        payment_method: paymentMethod,
        account_title: accountTitle,
        account_number: accountNumber,
        payment_details: paymentDetails
      });

      if (res.success && res.data) {
        setWithdrawSuccess(`Withdrawal request #${res.data.withdrawal_number} for Rs. ${res.data.amount.toLocaleString()} submitted successfully!`);
        setAmount('');
        await fetchWalletData();
      } else {
        setWithdrawError(res.message || 'Withdrawal request failed');
      }
    } catch (err: any) {
      setWithdrawError(err.message || 'Error communicating with server');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Wallet &amp; Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent, ledger-backed profit clearances and mobile wallet disbursements.
          </p>
        </div>

        <button
          onClick={() => {
            setIsWithdrawModalOpen(true);
            setWithdrawError(null);
            setWithdrawSuccess(null);
          }}
          disabled={wallet.available_balance < 500}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdraw Available Funds</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Available Balance
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            Rs. {wallet.available_balance.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Ready to transfer to Easypaisa / JazzCash
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Pending Profit
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            Rs. {wallet.pending_balance.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Locked during dispatch &amp; 7-day return
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Withdrawn Balance
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            Rs. {wallet.withdrawn_balance.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Total successfully paid out
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
            Total Gross Earned
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            Rs. {wallet.total_earned.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 mt-2">
            Reversed/Refunded: Rs. {wallet.total_refunded.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tabs: Ledger vs Withdrawal History */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Wallet Ledger History ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'withdrawals' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Withdrawal Requests ({withdrawals.length})
          </button>
        </div>

        {activeTab === 'ledger' ? (
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Date &amp; Time</th>
                    <th className="pb-3 font-semibold">Transaction Type</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'ORDER_PROFIT_RELEASED';
                    const isDebit = tx.type === 'WITHDRAWAL_PENDING' || tx.type === 'ORDER_PROFIT_REVERSED';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-3 text-slate-500 font-sans">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === 'ORDER_PROFIT_RELEASED' ? 'bg-emerald-100 text-emerald-800' :
                            tx.type === 'ORDER_PROFIT_PENDING' ? 'bg-amber-100 text-amber-800' :
                            tx.type === 'ORDER_PROFIT_REVERSED' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 font-sans text-slate-700 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className={`py-3 text-right font-bold ${
                          isCredit ? 'text-emerald-700' : isDebit ? 'text-rose-600' : 'text-slate-800'
                        }`}>
                          {isCredit ? '+' : isDebit ? '-' : ''}Rs. {tx.amount.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-slate-600">
                          Rs. {tx.balance_after.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Ref #</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Method &amp; Account</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold">Admin Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50">
                      <td className="py-3 font-bold text-slate-900">#{w.withdrawal_number}</td>
                      <td className="py-3 text-slate-500 font-sans">
                        {new Date(w.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-sans text-slate-700">
                        <span className="font-semibold">{w.payment_method}</span>: {w.account_title} ({w.account_number})
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        Rs. {w.amount.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          w.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          w.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 font-sans text-slate-500 text-[11px]">
                        {w.admin_note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Payout Request
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display mt-0.5">
                  Withdraw to Mobile Wallet / Bank
                </h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="p-5 space-y-4 text-xs">
              {withdrawError && (
                <div className="p-3 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
                  {withdrawError}
                </div>
              )}
              {withdrawSuccess && (
                <div className="p-3 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
                  {withdrawSuccess}
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-baseline">
                <span className="text-slate-500">Available Balance:</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  Rs. {wallet.available_balance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Withdrawal Amount (Rs.)
                </label>
                <input
                  type="number"
                  min={500}
                  max={wallet.available_balance}
                  step={50}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min Rs. 500"
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Number / Mobile Number / IBAN
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 03123456789"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingWithdraw}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
              >
                {submittingWithdraw ? 'Submitting...' : 'Submit Payout Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
