import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Building2, Tag, AlertCircle, Plus } from 'lucide-react';
import { Category, Supplier } from '../../types';
import { api } from '../../services/api';
import { ProductImageUploader, UploadedImageItem } from '../../components/admin/ProductImageUploader';

export const AdminProductCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form Fields (Requirement 7)
  const [name, setName] = useState('');
  const [sku, setSku] = useState(() => `ROZ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`);
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierCost, setSupplierCost] = useState('800');
  const [basePrice, setBasePrice] = useState('1000');
  const [minPrice, setMinPrice] = useState('1000');
  const [maxPrice, setMaxPrice] = useState('1800');
  const [deliveryCharge, setDeliveryCharge] = useState('150');
  const [stock, setStock] = useState('50');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [description, setDescription] = useState('');
  const [specifications, setSpecifications] = useState('');

  // Gallery Images (Requirement 1 & 2)
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  // Category & Supplier quick creation modal state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeta() {
      const [catRes, supRes] = await Promise.all([
        api.getCategories(),
        api.getAdminSuppliers()
      ]);
      if (catRes.success && catRes.data) {
        setCategories(catRes.data.categories);
        if (catRes.data.categories.length > 0) {
          setCategoryId(catRes.data.categories[0].id);
        }
      }
      if (supRes.success && supRes.data) {
        setSuppliers(supRes.data.suppliers);
        if (supRes.data.suppliers.length > 0) {
          setSupplierId(supRes.data.suppliers[0].id);
        }
      }
    }
    loadMeta();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await api.createAdminCategory({ name: newCatName.trim() });
    if (res.success && res.data) {
      const catRes = await api.getCategories();
      if (catRes.success && catRes.data) {
        setCategories(catRes.data.categories);
        setCategoryId(res.data.id);
      }
      setNewCatName('');
      setShowAddCategory(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupName.trim()) return;
    const res = await api.createAdminSupplier({ name: newSupName.trim(), phone: newSupPhone.trim() });
    if (res.success && res.data) {
      const supRes = await api.getAdminSuppliers();
      if (supRes.success && supRes.data) {
        setSuppliers(supRes.data.suppliers);
        setSupplierId(res.data.id);
      }
      setNewSupName('');
      setNewSupPhone('');
      setShowAddSupplier(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation (Requirement 7)
    if (!name.trim()) {
      setError('Product title is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select or create a category.');
      return;
    }
    if (!supplierId) {
      setError('Please select or create a wholesale supplier.');
      return;
    }

    const sCost = parseFloat(supplierCost);
    const bPrice = parseFloat(basePrice);
    const minP = parseFloat(minPrice || basePrice);
    const maxP = parseFloat(maxPrice || (bPrice * 1.5).toString());
    const sQty = parseInt(stock || '0', 10);
    const dCharge = parseFloat(deliveryCharge || '150');

    if (isNaN(sCost) || sCost < 0) {
      setError('Validation failed: Supplier Cost must be greater than or equal to 0.');
      return;
    }
    if (isNaN(bPrice) || bPrice <= 0) {
      setError('Validation failed: Platform Base Price must be greater than 0.');
      return;
    }
    if (isNaN(minP) || minP < bPrice) {
      setError('Validation failed: Minimum Selling Price cannot be lower than Platform Base Price.');
      return;
    }
    if (isNaN(maxP) || maxP < minP) {
      setError('Validation failed: Maximum Selling Price cannot be lower than Minimum Selling Price.');
      return;
    }
    if (isNaN(sQty) || sQty < 0) {
      setError('Validation failed: Stock Quantity cannot be negative.');
      return;
    }

    if (images.length === 0) {
      setError('Please select and upload at least one image from your gallery.');
      return;
    }

    setLoading(true);

    const res = await api.createAdminProduct({
      name: name.trim(),
      sku: sku.trim(),
      category_id: categoryId,
      supplier_id: supplierId,
      supplier_cost: sCost,
      base_price: bPrice,
      min_selling_price: minP,
      max_selling_price: maxP,
      delivery_charge: dCharge,
      stock: sQty,
      status,
      description,
      specifications,
      images: images.map((img, idx) => ({
        image_url: img.image_url,
        is_primary: img.is_primary === 1 || img.is_primary === true ? 1 : 0,
        sort_order: img.sort_order !== undefined ? img.sort_order : idx
      }))
    });

    setLoading(false);
    if (res.success) {
      navigate('/admin/products');
    } else {
      setError(res.message || 'Failed to create product');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display">Add Wholesale Product</h1>
            <p className="text-xs text-slate-500">Configure sourcing cost, platform base, multiple gallery images &amp; margins.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs text-xs">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Basic Information</span>
            <span className="text-[10px] text-slate-400 font-mono">PRODUCT IDENTIFIERS</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Luxury Embroidered 3-Piece Stitched Lawn Suit"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="ROZ-LAWN-001"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              {showAddCategory ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-purple-300 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-2.5 py-1.5 bg-purple-700 text-white rounded-xl font-bold text-xs"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {categories.length === 0 && <option value="">No categories available - add one</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Wholesale Supplier *</label>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(!showAddSupplier)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              {showAddSupplier ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Supplier / Vendor Name"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-purple-300 rounded-lg text-xs"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Phone / WhatsApp"
                      value={newSupPhone}
                      onChange={(e) => setNewSupPhone(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white border border-purple-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleCreateSupplier}
                      className="px-2.5 py-1 bg-purple-700 text-white rounded-lg font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {suppliers.length === 0 && <option value="">No suppliers available - add one</option>}
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Published to Resellers)</option>
                <option value="INACTIVE">INACTIVE (Hidden Draft)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing Strategy & Validation */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Wholesale Cost &amp; Price Governance</span>
            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-mono">FINANCIAL CORE</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/70">
              <label className="block font-bold text-rose-950 mb-1">
                Supplier Cost (Rs.) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={supplierCost}
                onChange={(e) => setSupplierCost(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-rose-300 font-bold font-mono text-rose-900 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-rose-600 mt-1 block font-medium">Platform cost to supplier</span>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/70">
              <label className="block font-bold text-purple-950 mb-1">
                Platform Base Price (Rs.) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-purple-300 font-bold font-mono text-purple-900 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-purple-600 mt-1 block font-medium">Wholesale price for resellers</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-1">Min Selling Price (Rs.) *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 font-mono font-bold rounded-lg"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Must be &gt;= Platform Base Price</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-1">Max Selling Price (Rs.) *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 font-mono font-bold rounded-lg"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Must be &gt;= Min Selling Price</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Delivery Charge (Rs.) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 font-mono rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stock Quantity (Units) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 font-mono font-bold rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Product Gallery Upload & Management (Requirement 1 & 2) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <ProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={8}
          />
        </div>

        {/* Section 4: Description & Specifications */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Description &amp; Specifications</h2>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed wholesale product overview, materials, and selling points for resellers..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Specifications (Bullets or key details)</label>
            <textarea
              rows={3}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="e.g. Fabric: Premium Lawn, Stitched 3-Piece, Available Sizes: S, M, L..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Product...' : 'Save Wholesale Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
