import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldCheck, Check, Layers, Plus, Trash2, Power, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Category } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Category management state
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [catActionError, setCatActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [settingsRes, catRes] = await Promise.all([
      api.getAdminSettings(),
      api.getAdminCategories()
    ]);

    if (settingsRes.success && settingsRes.data) {
      const map: Record<string, string> = {};
      settingsRes.data.settings.forEach(s => {
        map[s.key] = s.value;
      });
      setSettings(map);
    }

    if (catRes.success && catRes.data) {
      setCategories(catRes.data.categories);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api.updateAdminSettings(settings);
    setSaving(false);

    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } else {
      alert(res.message || 'Failed to save settings');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    setCatActionError(null);
    const res = await api.createAdminCategory({ name: newCatName.trim() });
    setCreatingCat(false);

    if (res.success) {
      setNewCatName('');
      const updated = await api.getAdminCategories();
      if (updated.success && updated.data) setCategories(updated.data.categories);
    } else {
      setCatActionError(res.message || 'Failed to create category');
    }
  };

  const handleToggleCategoryStatus = async (cat: Category) => {
    setCatActionError(null);
    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await api.updateAdminCategoryStatus(cat.id, newStatus);
    if (res.success) {
      const updated = await api.getAdminCategories();
      if (updated.success && updated.data) setCategories(updated.data.categories);
    } else {
      setCatActionError(res.message || 'Failed to update category status');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    setCatActionError(null);
    const res = await api.deleteAdminCategory(cat.id);
    if (res.success) {
      const updated = await api.getAdminCategories();
      if (updated.success && updated.data) setCategories(updated.data.categories);
    } else {
      setCatActionError(res.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
        Loading platform rules...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Platform Rules &amp; Governance</h2>
        <p className="text-xs text-slate-500">
          Configure return periods, minimum withdrawal thresholds, delivery fees, and category governance.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Platform configuration successfully saved and updated across all portals.</span>
        </div>
      )}

      {/* Categories Governance Card (Requirement 4) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <span>Product Categories Management</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              Manage retail catalog departments, toggle visibility, and safely remove unused categories.
            </p>
          </div>

          <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creatingCat || !newCatName.trim()}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {catActionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{catActionError}</span>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat.id} className="py-2.5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{cat.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cat.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cat.status || 'ACTIVE'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {cat.products_count !== undefined ? `${cat.products_count} active product(s)` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleCategoryStatus(cat)}
                  title={cat.status === 'ACTIVE' ? 'Deactivate category' : 'Activate category'}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    cat.status === 'ACTIVE'
                      ? 'text-amber-700 border-amber-200 hover:bg-amber-50'
                      : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  title="Delete category"
                  className="p-1.5 text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs text-xs">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Withdrawal &amp; Financial Governance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Reseller Withdrawal Limit (Rs.)
              </label>
              <input
                type="number"
                value={settings.min_withdrawal || '500'}
                onChange={(e) => handleChange('min_withdrawal', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Resellers cannot withdraw amounts lower than this threshold.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer Return Window (Days)
              </label>
              <input
                type="number"
                value={settings.return_period_days || '7'}
                onChange={(e) => handleChange('return_period_days', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Days after delivery before profit is permanently unlocked without dispute.
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Shipping &amp; Margin Guardrails
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Courier Delivery Fee (Rs.)
              </label>
              <input
                type="number"
                value={settings.default_delivery_charge || '150'}
                onChange={(e) => handleChange('default_delivery_charge', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Reseller Markup Margin (Rs.)
              </label>
              <input
                type="number"
                value={settings.min_reseller_margin || '50'}
                onChange={(e) => handleChange('min_reseller_margin', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum Reseller Markup Margin (Rs.)
              </label>
              <input
                type="number"
                value={settings.max_reseller_margin || '1500'}
                onChange={(e) => handleChange('max_reseller_margin', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Branding &amp; Operations Support
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Platform Brand Name
              </label>
              <input
                type="text"
                value={settings.site_name || 'Rozgar Reseller Network'}
                onChange={(e) => handleChange('site_name', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Support WhatsApp Helpline
              </label>
              <input
                type="text"
                value={settings.support_whatsapp || '+92 300 1234567'}
                onChange={(e) => handleChange('support_whatsapp', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
