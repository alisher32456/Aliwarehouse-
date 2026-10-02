import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, Clock, History, AlertCircle } from 'lucide-react';
import { WalletTransaction, Withdrawal } from '../../types';
import { api } from '../../services/api';

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();

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

  useEffect(() => {
    async function loadWallet() {
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
    }
    loadWallet();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">
            Wallet &amp; Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Transparent, double-entry ledger tracking profit clearances and mobile wallet payouts.
          </p>
        </div>

        <Link
          to="/withdraw"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Request Withdrawal Payout</span>
        </Link>
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
            Locked during delivery &amp; 7-day return
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
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
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
    </div>
  );
};
