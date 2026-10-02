import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, MapPin, Search, Trash2, Power, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Supplier } from '../../types';
import { api } from '../../services/api';

export const AdminSuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Supplier Form modal/state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSuppliers = async () => {
    setLoading(true);
    const res = await api.getAdminSuppliers();
    if (res.success && res.data) {
      setSuppliers(res.data.suppliers);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    const res = await api.createAdminSupplier({
      name,
      phone,
      whatsapp,
      address,
      notes
    });
    setSubmitting(false);

    if (res.success) {
      setName('');
      setPhone('');
      setWhatsapp('');
      setAddress('');
      setNotes('');
      setIsModalOpen(false);
      setNotification({ type: 'success', text: `Supplier "${name}" added successfully.` });
      loadSuppliers();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({ type: 'error', text: res.message || 'Failed to create supplier' });
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await api.updateAdminSupplierStatus(supplier.id, newStatus);
    if (res.success) {
      setNotification({
        type: 'success',
        text: `Supplier "${supplier.name}" is now ${newStatus}`
      });
      loadSuppliers();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({
        type: 'error',
        text: res.message || 'Failed to update supplier status'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    const res = await api.deleteAdminSupplier(supplierToDelete.id);
    setIsDeleting(false);
    setSupplierToDelete(null);

    if (res.success) {
      setNotification({
        type: 'success',
        text: res.message || 'Supplier deleted successfully'
      });
      loadSuppliers();
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'error',
        text: res.message || 'Failed to delete supplier'
      });
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone && s.phone.includes(search)) ||
    (s.address && s.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Wholesale Suppliers &amp; Vendors</h2>
          <p className="text-xs text-slate-500">
            Source factories and distributors connected to the Rozgar inventory network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendors..."
              className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Wholesale Vendor</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 text-xs rounded-2xl flex items-center gap-2 font-semibold animate-fadeIn ${
          notification.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading vendors...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No wholesale suppliers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3">Contact Number</th>
                  <th className="py-3">WhatsApp</th>
                  <th className="py-3">Warehouse City / Address</th>
                  <th className="py-3 text-center">Connected Products</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3 px-4 text-slate-500">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600">{s.phone}</td>
                    <td className="py-3 text-emerald-700 font-medium">{s.whatsapp || s.phone}</td>
                    <td className="py-3 text-slate-600">{s.address}</td>
                    <td className="py-3 text-center font-bold text-purple-700 font-mono">
                      {s.products_count || 0}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                      {s.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Status (Requirement 4) */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
                          title={s.status === 'ACTIVE' ? 'Deactivate supplier' : 'Activate supplier'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            s.status === 'ACTIVE'
                              ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Supplier (Requirement 4) */}
                        <button
                          type="button"
                          onClick={() => setSupplierToDelete(s)}
                          title="Delete supplier"
                          className="p-1.5 text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl border border-slate-200 text-xs animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Delete Supplier</h3>
              <p className="text-slate-600 text-xs">
                Are you sure you want to delete <strong className="text-slate-900">{supplierToDelete.name}</strong>?
              </p>
              {supplierToDelete.products_count && supplierToDelete.products_count > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] text-left">
                  Note: This supplier is linked to <strong>{supplierToDelete.products_count} active product(s)</strong>.
                  Please reassign or archive those products before deleting, or deactivate the supplier instead.
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-white font-bold bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 text-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Add Wholesale Supplier</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Register a factory, distributor or import vendor.</p>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Fashion Mill Lahore"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Factory / Warehouse Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shah Alam Market, Lahore"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, credit cycle, rep name..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-white font-bold bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
