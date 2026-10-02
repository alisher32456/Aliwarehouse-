import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, Search, CheckCircle2, XCircle, AlertTriangle, Clock,
  ShieldCheck, ShieldAlert, History, Filter, RefreshCw, UserCheck, UserX, Trash2
} from 'lucide-react';
import { User, AdminActivityLog } from '../../types';
import { api } from '../../services/api';

export const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'PENDING_APPROVAL';

  const [activeTab, setActiveTab] = useState<string>(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0
  });

  // Action Modals
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Activity Logs View
  const [showLogs, setShowLogs] = useState(false);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const filterStatus = activeTab === 'ALL' ? undefined : activeTab;
    const res = await api.getAdminUsers({
      status: filterStatus,
      search: search || undefined
    });

    if (res.success && res.data) {
      setUsers(res.data.users);
      setCounts(res.data.counts);
    }
    setLoading(false);
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    const res = await api.getAdminUserLogs();
    if (res.success && res.data) {
      setActivityLogs(res.data.logs);
    }
    setLogsLoading(false);
  };

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && urlStatus !== activeTab) {
      setActiveTab(urlStatus);
    }
  }, [searchParams]);

  useEffect(() => {
    loadUsers();
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'ALL' ? {} : { status: tab });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  // 1. APPROVE ACTION
  const handleApprove = async (user: User) => {
    if (!confirm(`Are you sure you want to APPROVE @${user.username} (${user.name})? This user will immediately be permitted to log in.`)) return;
    setActionLoading(true);
    const res = await api.adminUserAction(user.id, 'APPROVE');
    setActionLoading(false);

    if (res.success) {
      loadUsers();
    } else {
      alert(res.message || 'Failed to approve user');
    }
  };

  // 2. REJECT ACTION
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    setActionLoading(true);
    const res = await api.adminUserAction(rejectingUser.id, 'REJECT', rejectionReason);
    setActionLoading(false);

    if (res.success) {
      setRejectingUser(null);
      setRejectionReason('');
      loadUsers();
    } else {
      alert(res.message || 'Failed to reject user');
    }
  };

  // 3. SUSPEND ACTION
  const handleConfirmSuspend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingUser) return;
    setActionLoading(true);
    const res = await api.adminUserAction(suspendingUser.id, 'SUSPEND', suspensionReason);
    setActionLoading(false);

    if (res.success) {
      setSuspendingUser(null);
      setSuspensionReason('');
      loadUsers();
    } else {
      alert(res.message || 'Failed to suspend user');
    }
  };

  // 4. REACTIVATE ACTION
  const handleReactivate = async (user: User) => {
    if (!confirm(`Are you sure you want to REACTIVATE @${user.username} (${user.name})?`)) return;
    setActionLoading(true);
    const res = await api.adminUserAction(user.id, 'REACTIVATE');
    setActionLoading(false);

    if (res.success) {
      loadUsers();
    } else {
      alert(res.message || 'Failed to reactivate user');
    }
  };

  // 5. SAFE DELETE USER (Requirement 4 & 5)
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    const res = await api.deleteAdminUser(deletingUser.id);
    setActionLoading(false);
    setDeletingUser(null);

    if (res.success) {
      setFeedbackMessage(res.message || 'User account handled successfully.');
      loadUsers();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } else {
      alert(res.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Reseller Accounts &amp; Approvals</h2>
          <p className="text-xs text-slate-500">
            Verify newly registered entrepreneurs, authorize storefront access, and govern account permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowLogs(!showLogs);
              if (!showLogs) loadLogs();
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
              showLogs
                ? 'bg-purple-100 text-purple-900 border-purple-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>{showLogs ? 'Hide Audit Log' : 'Approval Activity Log'}</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Activity Log Drawer / Panel */}
      {showLogs && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl border border-slate-800 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-sm font-display text-white">Admin User Audit Trail</h3>
            </div>
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="text-[11px] text-purple-300 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {logsLoading ? (
            <div className="py-6 text-center text-slate-400 text-xs">Loading audit trail...</div>
          ) : activityLogs.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">No admin activity records yet.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2.5 font-mono text-[11px]">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start justify-between gap-3">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'USER_APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : log.action === 'USER_REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : log.action === 'USER_SUSPENDED'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {log.action}
                    </span>
                    <p className="font-sans text-slate-200 mt-1">{log.details}</p>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Target: {log.target_user_name || log.target_id} · Admin: {log.admin_name || log.admin_id}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'PENDING_APPROVAL', label: 'Pending Approval', count: counts.pending, color: 'text-amber-800 bg-amber-100', activeBg: 'bg-amber-50 border-amber-300 text-amber-950 font-bold' },
            { id: 'ACTIVE', label: 'Approved (Active)', count: counts.approved, color: 'text-emerald-800 bg-emerald-100', activeBg: 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' },
            { id: 'REJECTED', label: 'Rejected', count: counts.rejected, color: 'text-rose-800 bg-rose-100', activeBg: 'bg-rose-50 border-rose-300 text-rose-950 font-bold' },
            { id: 'SUSPENDED', label: 'Suspended', count: counts.suspended, color: 'text-purple-800 bg-purple-100', activeBg: 'bg-purple-50 border-purple-300 text-purple-950 font-bold' },
            { id: 'ALL', label: 'All Accounts', count: counts.total, color: 'text-slate-700 bg-slate-100', activeBg: 'bg-slate-100 border-slate-300 text-slate-900 font-bold' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 border transition-all whitespace-nowrap shadow-2xs ${
                  isActive
                    ? tab.activeBg
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-bold ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, username..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">No resellers found</p>
            <p className="text-slate-400 text-xs">There are no accounts matching the "{activeTab}" filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/60 font-semibold tracking-wider">
                  <th className="py-3 px-4">Applicant &amp; Store</th>
                  <th className="py-3">Contact</th>
                  <th className="py-3">Location</th>
                  <th className="py-3">Registration Date</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3">Approval Metadata</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {users.map((u) => {
                  const isPending = u.status === 'PENDING_APPROVAL';
                  const isActive = u.status === 'ACTIVE';
                  const isRejected = u.status === 'REJECTED';
                  const isSuspended = u.status === 'SUSPENDED';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Store */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                            isPending
                              ? 'bg-amber-100 text-amber-900'
                              : isActive
                              ? 'bg-emerald-100 text-emerald-900'
                              : isRejected
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-purple-100 text-purple-900'
                          }`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-[11px] text-purple-700 font-medium">@{u.username}</p>
                            {u.business_name && (
                              <p className="text-[10px] text-slate-500 font-sans">{u.business_name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 font-sans text-slate-600">
                        <p className="font-mono text-slate-800 font-medium">{u.phone}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 font-sans text-slate-600">
                        <p>{u.city || 'Pakistan'}</p>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 font-sans text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {u.created_at ? new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 text-center font-sans">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : isActive
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : isRejected
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-purple-100 text-purple-900 border border-purple-200'
                        }`}>
                          {isPending && <Clock className="w-3 h-3 text-amber-700" />}
                          {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                          {isRejected && <XCircle className="w-3 h-3 text-rose-700" />}
                          {isSuspended && <AlertTriangle className="w-3 h-3 text-purple-700" />}
                          <span>{u.status}</span>
                        </span>
                      </td>

                      {/* Approval Metadata */}
                      <td className="py-3.5 text-xs text-slate-600 font-sans max-w-xs">
                        {isPending && (
                          <span className="text-[11px] text-amber-800 italic">Awaiting initial admin verification</span>
                        )}
                        {isActive && (
                          <div>
                            <span className="text-[11px] text-emerald-800 font-medium block">
                              Approved {u.approved_at ? `on ${new Date(u.approved_at).toLocaleDateString()}` : ''}
                            </span>
                            {u.approved_by && (
                              <span className="text-[10px] text-slate-400">By: {u.approved_by}</span>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div>
                            <span className="text-[11px] text-rose-800 font-medium block">
                              Rejected {u.rejected_at ? `on ${new Date(u.rejected_at).toLocaleDateString()}` : ''}
                            </span>
                            {u.rejection_reason && (
                              <span className="text-[10px] text-rose-700 block italic leading-tight">
                                "{u.rejection_reason}"
                              </span>
                            )}
                          </div>
                        )}
                        {isSuspended && (
                          <div>
                            <span className="text-[11px] text-purple-800 font-medium block">
                              Suspended {u.suspended_at ? `on ${new Date(u.suspended_at).toLocaleDateString()}` : ''}
                            </span>
                            {u.suspended_by && (
                              <span className="text-[10px] text-slate-400">By: {u.suspended_by}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(u)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingUser(u);
                                  setRejectionReason('');
                                }}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs transition-colors border border-rose-200"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {isActive && (
                            <button
                              onClick={() => {
                                setSuspendingUser(u);
                                setSuspensionReason('');
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 font-semibold rounded-lg text-xs transition-colors border border-slate-200"
                            >
                              Suspend
                            </button>
                          )}

                          {isRejected && (
                            <button
                              onClick={() => handleApprove(u)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs transition-colors border border-emerald-200"
                            >
                              Re-evaluate &amp; Approve
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => handleReactivate(u)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold rounded-lg text-xs transition-colors border border-purple-200"
                            >
                              Reactivate
                            </button>
                          )}

                          {/* Safe Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete / Archive User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                REJECT APPLICATION
              </span>
              <h3 className="text-base font-bold text-slate-900 font-display mt-2">
                Reject Reseller @{rejectingUser.username}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {rejectingUser.name} will not be able to log in or access the wholesale reseller portal.
              </p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason (Optional / Shown to user on login failure)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Phone number could not be verified / Incomplete business details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingUser(null)}
                  className="px-4 py-2 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-white font-bold bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                SUSPEND ACCOUNT
              </span>
              <h3 className="text-base font-bold text-slate-900 font-display mt-2">
                Suspend Reseller @{suspendingUser.username}
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Immediately revokes session access and blocks subsequent logins.
              </p>
            </div>

            <form onSubmit={handleConfirmSuspend} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Suspension
                </label>
                <textarea
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g. Disputed customer delivery policy violations..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendingUser(null)}
                  className="px-4 py-2 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-white font-bold bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Suspend Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal (Safe Delete) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Delete User @{deletingUser.username}?
              </h3>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                If this user has previous customer orders or wallet activity, the account will be safely <strong>suspended &amp; archived</strong> to protect historical order economics and audit trails. If unreferenced, it will be removed permanently.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 text-white font-bold bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Processing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
