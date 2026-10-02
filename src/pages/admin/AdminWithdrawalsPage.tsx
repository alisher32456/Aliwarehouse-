import React, { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, XCircle, Clock, Search, AlertCircle } from 'lucide-react';
import { Withdrawal } from '../../types';
import { api } from '../../services/api';

export const AdminWithdrawalsPage: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadWithdrawals = async () => {
    setLoading(true);
    const res = await api.getAdminWithdrawals();
    if (res.success && res.data) {
      setWithdrawals(res.data.withdrawals);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleApprovePay = async (w: Withdrawal) => {
    if (!confirm(`Confirm payout of Rs. ${w.amount.toLocaleString()} to ${w.account_title} (${w.payment_method})?`)) return;
    setProcessing(true);
    const res = await api.processWithdrawal(w.id, 'APPROVE_PAY', 'Dispatched via Direct Mobile Banking Transfer');
    setProcessing(false);

    if (res.success) {
      alert(`Withdrawal #${w.withdrawal_number} marked as PAID. Reseller notified!`);
      loadWithdrawals();
    } else {
      alert(res.message || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;
    setProcessing(true);
    const res = await api.processWithdrawal(
      selectedWithdrawal.id,
      'REJECT',
      rejectionNote || 'Account number or title mismatch'
    );
    setProcessing(false);

    if (res.success) {
      alert(`Withdrawal #${selectedWithdrawal.withdrawal_number} rejected. Funds returned to reseller available balance.`);
      setSelectedWithdrawal(null);
      setRejectionNote('');
      loadWithdrawals();
    } else {
      alert(res.message || 'Failed to reject withdrawal');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Reseller Payout Approvals</h2>
        <p className="text-xs text-slate-500">
          Review, approve, and execute bank/Easypaisa/JazzCash payout disbursements to resellers.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading withdrawal requests...
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No withdrawal requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Reseller</th>
                  <th className="py-3 text-right">Requested Amount</th>
                  <th className="py-3">Payment Method</th>
                  <th className="py-3">Account Title &amp; Number</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                      #{w.withdrawal_number}
                    </td>
                    <td className="py-3 text-slate-500 font-sans">
                      {new Date(w.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-sans">
                      <p className="font-semibold text-slate-900">{w.user_name}</p>
                      <p className="text-[10px] text-slate-400">@{w.username} · {w.user_phone}</p>
                    </td>
                    <td className="py-3 text-right font-bold text-base text-slate-900">
                      Rs. {w.amount.toLocaleString()}
                    </td>
                    <td className="py-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">
                        {w.payment_method}
                      </span>
                    </td>
                    <td className="py-3 font-sans text-slate-800">
                      <p className="font-bold">{w.account_title}</p>
                      <p className="font-mono text-[11px] text-slate-600">{w.account_number}</p>
                    </td>
                    <td className="py-3 text-center font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-800'
                          : w.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {w.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprovePay(w)}
                            disabled={processing}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                          >
                            Approve &amp; Pay
                          </button>
                          <button
                            onClick={() => setSelectedWithdrawal(w)}
                            disabled={processing}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[11px] text-slate-400 italic">
                            {w.admin_note || 'Completed'}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Archive completed withdrawal record #${w.withdrawal_number}? It will be hidden from the active list while preserving all financial ledgers.`)) return;
                              setProcessing(true);
                              const res = await api.archiveAdminWithdrawal(w.id);
                              setProcessing(false);
                              if (res.success) {
                                loadWithdrawals();
                              } else {
                                alert(res.message || 'Failed to archive withdrawal');
                              }
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                            title="Archive financial record"
                          >
                            Archive
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Reject Withdrawal #{selectedWithdrawal.withdrawal_number}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Rs. {selectedWithdrawal.amount.toLocaleString()} will be automatically refunded back to reseller's available wallet balance.
              </p>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Rejection *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Account title does not match bank records. Please re-check and submit."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawal(null)}
                  className="px-4 py-2 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 text-white font-bold bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Rejection & Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
