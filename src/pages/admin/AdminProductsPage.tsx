import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Search, Trash2, Power, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deletion modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const res = await api.getAdminProducts();
    if (res.success && res.data) {
      setProducts(res.data.products);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const res = await api.updateAdminProductStatus(product.id, newStatus);
    if (res.success) {
      setNotification({
        type: 'success',
        text: `Product "${product.name}" is now ${newStatus}`
      });
      loadProducts();
      setTimeout(() => setNotification(null), 3000);
    } else {
      setNotification({
        type: 'error',
        text: res.message || 'Failed to update status'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    const res = await api.deleteAdminProduct(productToDelete.id);
    setIsDeleting(false);
    setProductToDelete(null);

    if (res.success) {
      setNotification({
        type: 'success',
        text: res.message || 'Product deleted / archived successfully'
      });
      loadProducts();
      setTimeout(() => setNotification(null), 4000);
    } else {
      setNotification({
        type: 'error',
        text: res.message || 'Failed to delete product'
      });
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name && p.category_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Wholesale Product Catalog</h2>
          <p className="text-xs text-slate-500">Configure factory costs, platform base prices, and reseller limits.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU..."
              className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <Link
            to="/admin/products/create"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Wholesale Product</span>
          </Link>
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

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">No wholesale products found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your first wholesale product with custom photos from your phone gallery to make it available to resellers.
            </p>
            <Link
              to="/admin/products/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Product</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                  <th className="py-3 px-4">Product Info</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Supplier</th>
                  <th className="py-3 text-right">Supplier Cost (Private)</th>
                  <th className="py-3 text-right">Platform Base</th>
                  <th className="py-3 text-right">Allowed Reseller Range</th>
                  <th className="py-3 text-center">Stock</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/src/assets/images/product_embroidered_kurti_1790877397139.jpg';
                          }}
                        />
                        <div>
                          <p className="font-bold text-slate-900 max-w-xs truncate">{p.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-sans text-slate-600">{p.category_name}</td>
                    <td className="py-3 font-sans text-slate-600">{p.supplier_name || 'Direct Wholesale'}</td>
                    <td className="py-3 text-right text-rose-700 font-bold bg-rose-50/40">
                      Rs. {p.supplier_cost?.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-slate-900 font-bold">
                      Rs. {p.base_price.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-emerald-700">
                      Rs. {p.min_selling_price} - {p.max_selling_price}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.stock > 10 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1">
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.status === 'ACTIVE'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={p.status === 'ACTIVE' ? 'Deactivate Product' : 'Activate Product'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>

                        {/* Safe Delete Button */}
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete / Archive product"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Delete / Archive Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Product: {productToDelete.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                If this product has historical orders, it will be safely <strong>deactivated and archived</strong> so previous customer orders and reseller earnings remain intact. If unreferenced, it will be removed permanently.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
