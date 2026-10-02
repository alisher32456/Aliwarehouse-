import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Building2, Trash2, AlertCircle, CheckCircle2, Power } from 'lucide-react';
import { Category, Supplier, Product } from '../../types';
import { api } from '../../services/api';
import { ProductImageUploader, UploadedImageItem } from '../../components/admin/ProductImageUploader';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
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

  // Gallery Images
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Safe delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      const [prodRes, catRes, supRes] = await Promise.all([
        api.getAdminProductById(id),
        api.getCategories(),
        api.getAdminSuppliers()
      ]);

      if (catRes.success && catRes.data) setCategories(catRes.data.categories);
      if (supRes.success && supRes.data) setSuppliers(supRes.data.suppliers);

      if (prodRes.success && prodRes.data) {
        const p = prodRes.data.product;
        setName(p.name);
        setSku(p.sku || '');
        setCategoryId(p.category_id);
        setSupplierId(p.supplier_id || '');
        setSupplierCost(String(p.supplier_cost !== undefined ? p.supplier_cost : p.base_price * 0.8));
        setBasePrice(String(p.base_price));
        setMinPrice(String(p.min_selling_price));
        setMaxPrice(String(p.max_selling_price));
        setDeliveryCharge(String(p.delivery_charge));
        setStock(String(p.stock));
        setStatus((p.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
        setDescription(p.description || '');
        setSpecifications(p.specifications || '');

        // Populate images
        if (p.images && p.images.length > 0) {
          setImages(p.images.map((img: any, idx: number) => ({
            id: img.id,
            image_url: img.image_url,
            is_primary: img.is_primary === 1 || img.is_primary === true ? 1 : 0,
            sort_order: img.sort_order !== undefined ? img.sort_order : idx
          })));
        } else if (p.image_url) {
          setImages([{
            image_url: p.image_url,
            is_primary: 1,
            sort_order: 0
          }]);
        }
      } else {
        setError(prodRes.message || 'Product not found');
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setActionSuccess(null);

    // Validation (Requirement 7)
    if (!name.trim()) {
      setError('Product title is required');
      return;
    }

    const sCost = parseFloat(supplierCost);
    const bPrice = parseFloat(basePrice);
    const minP = parseFloat(minPrice);
    const maxP = parseFloat(maxPrice);
    const sQty = parseInt(stock, 10);
    const dCharge = parseFloat(deliveryCharge);

    if (isNaN(sCost) || sCost < 0) {
      setError('Supplier Cost must be greater than or equal to 0.');
      return;
    }
    if (isNaN(bPrice) || bPrice <= 0) {
      setError('Platform Base Price must be greater than 0.');
      return;
    }
    if (isNaN(minP) || minP < bPrice) {
      setError('Minimum Selling Price cannot be lower than Platform Base Price.');
      return;
    }
    if (isNaN(maxP) || maxP < minP) {
      setError('Maximum Selling Price cannot be lower than Minimum Selling Price.');
      return;
    }
    if (isNaN(sQty) || sQty < 0) {
      setError('Stock Quantity cannot be negative.');
      return;
    }
    if (images.length === 0) {
      setError('Product must have at least one image in its gallery.');
      return;
    }

    setSaving(true);

    const res = await api.updateAdminProduct(id, {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
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

    setSaving(false);
    if (res.success) {
      setActionSuccess('Product details and gallery updated successfully!');
      setTimeout(() => setActionSuccess(null), 3500);
    } else {
      setError(res.message || 'Failed to update product');
    }
  };

  const handleToggleStatus = async () => {
    if (!id) return;
    const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await api.updateAdminProductStatus(id, newStatus);
    if (res.success) {
      setStatus(newStatus);
      setActionSuccess(`Product status changed to ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      setError(res.message || 'Failed to update status');
    }
  };

  const handleSafeDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    const res = await api.deleteAdminProduct(id);
    setIsDeleting(false);
    setShowDeleteModal(false);

    if (res.success) {
      navigate('/admin/products');
    } else {
      setError(res.message || 'Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-xs">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
        Loading product details and gallery...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-display">Edit Wholesale Product</h1>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">SKU: {sku || 'ROZ-DEFAULT'}</p>
          </div>
        </div>

        {/* Quick Top Actions: Status Toggle & Safe Delete */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleStatus}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
              status === 'ACTIVE'
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{status === 'ACTIVE' ? 'Deactivate Product' : 'Activate Product'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs text-xs">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>Basic Info &amp; Governance</span>
            <span className="text-[10px] text-slate-400 font-mono">IDENTIFIERS</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Wholesale Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} {s.phone ? `(${s.phone})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Published in Catalog)</option>
                <option value="INACTIVE">INACTIVE (Hidden / Archived)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Strategy */}
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
              <span className="text-[10px] text-rose-600 mt-1 block">Payable to supplier</span>
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
              <span className="text-[10px] text-purple-600 mt-1 block">Shown to resellers</span>
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Delivery Charge (Rs.) *</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Available Stock Units *</label>
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

        {/* Gallery Image Uploader & Reordering */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <ProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={8}
          />
        </div>

        {/* Description & Specifications */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Description &amp; Specifications</h2>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Specifications</label>
            <textarea
              rows={3}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Product</span>
          </button>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="px-4 py-2.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Update Product'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Safe Delete Confirmation Modal (Requirement 4 & 5) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Wholesale Product</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                If this product has historical orders, it will be safely <strong>deactivated and archived</strong> so previous customer orders and reseller earnings remain intact. If it has no orders, it will be deleted permanently.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleSafeDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Processing...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
