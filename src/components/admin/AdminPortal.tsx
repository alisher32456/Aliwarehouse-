import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingBag, Truck, Users, Wallet, Building2,
  Settings, BarChart3, ShieldAlert, Plus, Search, Edit2, Trash2,
  CheckCircle2, XCircle, Clock, AlertTriangle, ArrowUpRight, DollarSign,
  Package, ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { Product, Order, User as UserType, Supplier, Withdrawal, Category } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminPortal: React.FC<{ onExitToStore: () => void }> = ({ onExitToStore }) => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'orders' | 'withdrawals' | 'users' | 'suppliers' | 'settings' | 'reports'
  >('dashboard');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Products Data
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodSupplier, setProdSupplier] = useState('');
  const [prodSupplierCost, setProdSupplierCost] = useState('');
  const [prodBasePrice, setProdBasePrice] = useState('');
  const [prodMinPrice, setProdMinPrice] = useState('');
  const [prodMaxPrice, setProdMaxPrice] = useState('');
  const [prodDelivery, setProdDelivery] = useState('150');
  const [prodStock, setProdStock] = useState('50');
  const [prodDescription, setProdDescription] = useState('');
  const [prodSpecs, setProdSpecs] = useState('');
  const [prodImage, setProdImage] = useState('');

  // Orders Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('SHIPPED');

  // Withdrawals Data
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [rejectionNote, setRejectionNote] = useState('');

  // Users Data
  const [users, setUsers] = useState<UserType[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Suppliers Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Settings
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Reports
  const [reportsTimeframe, setReportsTimeframe] = useState('all');
  const [reportsData, setReportsData] = useState<any>(null);

  // Initial Load
  useEffect(() => {
    loadDashboard();
    loadCategories();
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'withdrawals') loadWithdrawals();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'suppliers') loadSuppliers();
    if (activeTab === 'settings') loadSettings();
    if (activeTab === 'reports') loadReports();
  }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await api.getAdminDashboard();
    if (res.success && res.data) {
      setDashboardData(res.data);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    setLoading(true);
    const res = await api.getAdminProducts();
    if (res.success && res.data) setProducts(res.data.products);
    setLoading(false);
  };

  const loadOrders = async () => {
    setLoading(true);
    const res = await api.getAdminOrders({ status: orderStatusFilter, search: orderSearch });
    if (res.success && res.data) setOrders(res.data.orders);
    setLoading(false);
  };

  const loadWithdrawals = async () => {
    setLoading(true);
    const res = await api.getAdminWithdrawals();
    if (res.success && res.data) setWithdrawals(res.data.withdrawals);
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.getAdminUsers();
    if (res.success && res.data) setUsers(res.data.users);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    const res = await api.getAdminSuppliers();
    if (res.success && res.data) setSuppliers(res.data.suppliers);
  };

  const loadCategories = async () => {
    const res = await api.getCategories();
    if (res.success && res.data) setCategories(res.data.categories);
  };

  const loadSettings = async () => {
    const res = await api.getAdminSettings();
    if (res.success && res.data) {
      const map: Record<string, string> = {};
      res.data.settings.forEach(s => { map[s.key] = s.value; });
      setSettings(map);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    const res = await api.getAdminReports(reportsTimeframe);
    if (res.success && res.data) setReportsData(res.data);
    setLoading(false);
  };

  // Product Actions
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory(categories[0]?.id || 'cat_women');
    setProdSupplier(suppliers[0]?.id || 'sup_1');
    setProdSupplierCost('800');
    setProdBasePrice('1000');
    setProdMinPrice('1000');
    setProdMaxPrice('1800');
    setProdDelivery('150');
    setProdStock('50');
    setProdDescription('');
    setProdSpecs('');
    setProdImage('/src/assets/images/product_embroidered_kurti_1790877397139.jpg');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category_id);
    setProdSupplier(p.supplier_id || suppliers[0]?.id || 'sup_1');
    setProdSupplierCost(String(p.supplier_cost || p.base_price * 0.8));
    setProdBasePrice(String(p.base_price));
    setProdMinPrice(String(p.min_selling_price));
    setProdMaxPrice(String(p.max_selling_price));
    setProdDelivery(String(p.delivery_charge));
    setProdStock(String(p.stock));
    setProdDescription(p.description || '');
    setProdSpecs(p.specifications || '');
    setProdImage(p.image_url || '');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      category_id: prodCategory,
      supplier_id: prodSupplier,
      supplier_cost: parseFloat(prodSupplierCost),
      base_price: parseFloat(prodBasePrice),
      min_selling_price: parseFloat(prodMinPrice),
      max_selling_price: parseFloat(prodMaxPrice),
      delivery_charge: parseFloat(prodDelivery),
      stock: parseInt(prodStock, 10),
      description: prodDescription,
      specifications: prodSpecs,
      image_url: prodImage
    };

    if (editingProduct) {
      await api.updateAdminProduct(editingProduct.id, payload);
    } else {
      await api.createAdminProduct(payload);
    }
    setIsProductModalOpen(false);
    loadProducts();
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const res = await api.updateOrderStatus(orderId, {
      status,
      comment: statusComment || `Admin updated status to ${status}`,
      tracking_number: trackingNumberInput || undefined
    });

    if (res.success) {
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const orderDetails = await api.getOrderDetails(orderId);
        if (orderDetails.success && orderDetails.data) setSelectedOrder(orderDetails.data.order);
      }
      setStatusComment('');
      setTrackingNumberInput('');
    } else {
      alert(res.message || 'Status transition failed');
    }
  };

  // Process Withdrawal
  const handleProcessWithdrawal = async (id: string, action: 'APPROVE_PAY' | 'REJECT') => {
    const note = action === 'REJECT' ? (rejectionNote || 'Account information verification failed') : 'Dispatched via Batch Transfer';
    const res = await api.processWithdrawal(id, action, note);
    if (res.success) {
      loadWithdrawals();
      setRejectionNote('');
    } else {
      alert(res.message || 'Action failed');
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userObj: UserType) => {
    const newStatus = userObj.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await api.updateUserStatus(userObj.id, newStatus);
    loadUsers();
  };

  // Create Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName) return;
    await api.createAdminSupplier({
      name: newSupplierName,
      phone: newSupplierPhone,
      address: newSupplierAddress
    });
    setNewSupplierName('');
    setNewSupplierPhone('');
    setNewSupplierAddress('');
    loadSuppliers();
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateAdminSettings(settings);
    alert('Settings updated successfully');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500">
            You do not have administrative authorization to view this internal management system.
          </p>
          <button
            onClick={onExitToStore}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
          >
            Return to Reseller Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 h-16 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight font-display">Rozgar HQ Operations</h1>
            <p className="text-[10px] text-slate-400 font-mono">Platform Admin: {user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExitToStore}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            ← View Reseller Storefront
          </button>
        </div>
      </header>

      {/* Main Admin View with Tabs */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-60 bg-white border-r border-slate-200 p-4 space-y-1 shrink-0">
          <div className="pb-3 mb-2 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations Menu
          </div>

          {[
            { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
            { id: 'orders', label: 'Fulfillment & Orders', icon: Truck },
            { id: 'products', label: 'Wholesale Products', icon: ShoppingBag },
            { id: 'withdrawals', label: 'Payout Approvals', icon: Wallet },
            { id: 'users', label: 'Reseller Accounts', icon: Users },
            { id: 'suppliers', label: 'Wholesale Vendors', icon: Building2 },
            { id: 'reports', label: 'Financial Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Platform Rules', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Admin Tab Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Executive Command Center</h2>
                <p className="text-xs text-slate-500">Live platform finances, supplier liabilities, and sales volume.</p>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Platform Sales</span>
                  <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    Rs. {dashboardData.metrics.totalSales.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">{dashboardData.metrics.totalOrders} total orders processed</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Platform Gross Margin</span>
                  <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    Rs. {dashboardData.metrics.platformRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">Platform Base minus Supplier Cost</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Reseller Profit Generated</span>
                  <p className="text-2xl font-bold font-mono text-purple-700 mt-1">
                    Rs. {dashboardData.metrics.resellerProfits.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">Reseller selling markup share</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Supplier COGS Due</span>
                  <p className="text-2xl font-bold font-mono text-amber-700 mt-1">
                    Rs. {dashboardData.metrics.supplierCosts.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2">Cost payable to wholesale vendors</p>
                </div>
              </div>

              {/* Pending Liabilities Alert Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900">Pending Withdrawal Payouts:</span>
                    <p className="text-xl font-bold font-mono text-purple-950 mt-0.5">
                      Rs. {dashboardData.metrics.pendingWithdrawalsAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-purple-700">{dashboardData.metrics.pendingWithdrawalsCount} resellers waiting for review</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="px-3 py-1.5 bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                  >
                    Review Payouts →
                  </button>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Total Available Wallet Liability:</span>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                      Rs. {dashboardData.metrics.totalAvailableLiability.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400">Pending clearing liability: Rs. {dashboardData.metrics.totalPendingLiability.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-semibold text-xs rounded-xl shadow-xs"
                  >
                    Fulfill Orders →
                  </button>
                </div>
              </div>

              {/* Recent Orders List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-display">Live Order Feed</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-purple-700">
                    View All Orders →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                        <th className="pb-2">Order #</th>
                        <th className="pb-2">Reseller</th>
                        <th className="pb-2">Customer &amp; City</th>
                        <th className="pb-2 text-right">Customer Total</th>
                        <th className="pb-2 text-right">Supplier Cost</th>
                        <th className="pb-2 text-right">Reseller Profit</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {dashboardData.recentOrders?.map((o: Order) => (
                        <tr key={o.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-bold text-slate-900 font-sans">#{o.order_number}</td>
                          <td className="py-2.5 font-sans text-slate-700">{o.reseller_name}</td>
                          <td className="py-2.5 font-sans text-slate-600">{o.customer_name} ({o.customer_city})</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">Rs. {o.total_amount.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-amber-700">Rs. {o.total_supplier_cost?.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-purple-700 font-bold">+Rs. {o.reseller_profit.toLocaleString()}</td>
                          <td className="py-2.5 text-center font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHOLESALE PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Wholesale Product Catalog</h2>
                  <p className="text-xs text-slate-500">Configure factory costs, platform base prices, and reseller limits.</p>
                </div>

                <button
                  onClick={handleOpenCreateProduct}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Wholesale Product</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                        <th className="py-3 px-4">Product Info</th>
                        <th className="py-3">Category</th>
                        <th className="py-3">Supplier</th>
                        <th className="py-3 text-right">Supplier Cost (Confidential)</th>
                        <th className="py-3 text-right">Platform Base</th>
                        <th className="py-3 text-right">Reseller Selling Range</th>
                        <th className="py-3 text-center">Stock</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-sans">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image_url || '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                                referrerPolicy="no-referrer"
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg"
                              title="Edit product prices and margins"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS FULFILLMENT & PROFIT CLEARANCE */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Order Fulfillment &amp; Profit Release</h2>
                  <p className="text-xs text-slate-500">
                    Update order shipping, dispatch tracking numbers, and trigger automated wallet ledger profit credits.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="READY_TO_SHIP">Ready to Ship</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered (Profit Cleared)</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3">Reseller</th>
                        <th className="py-3">Customer &amp; City</th>
                        <th className="py-3 text-right">Customer Total (COD)</th>
                        <th className="py-3 text-right">Base Share</th>
                        <th className="py-3 text-right">Reseller Profit</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 text-center">Profit Ledger</th>
                        <th className="py-3 px-4 text-right">Status Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900 font-sans">#{o.order_number}</td>
                          <td className="py-3 font-sans text-slate-700">
                            <div>
                              <p className="font-semibold">{o.reseller_name}</p>
                              <span className="text-[10px] text-slate-400">@{o.reseller_username}</span>
                            </div>
                          </td>
                          <td className="py-3 font-sans text-slate-600">
                            <div>
                              <p className="font-medium text-slate-900">{o.customer_name}</p>
                              <p className="text-[10px] text-slate-400">{o.customer_city}</p>
                            </div>
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900">
                            Rs. {o.total_amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-slate-600">
                            Rs. {o.total_base_amount?.toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-emerald-700 font-bold">
                            +Rs. {o.reseller_profit.toLocaleString()}
                          </td>
                          <td className="py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'CANCELLED' || o.status === 'RETURNED' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 text-center font-sans">
                            {o.profit_released === 1 ? (
                              <span className="text-[10px] font-bold text-emerald-700">Cleared in Wallet</span>
                            ) : o.profit_released === -1 ? (
                              <span className="text-[10px] font-bold text-rose-600">Reversed</span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                setSelectedNewStatus(
                                  o.status === 'PENDING' ? 'CONFIRMED' :
                                  o.status === 'CONFIRMED' ? 'PROCESSING' :
                                  o.status === 'PROCESSING' ? 'READY_TO_SHIP' :
                                  o.status === 'READY_TO_SHIP' ? 'SHIPPED' :
                                  o.status === 'SHIPPED' ? 'OUT_FOR_DELIVERY' :
                                  'DELIVERED'
                                );
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                            >
                              Update Status →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYOUTS & WITHDRAWAL APPROVALS */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Reseller Payout Approvals</h2>
                <p className="text-xs text-slate-500">Verify mobile wallet accounts and approve or reject payouts.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                        <th className="py-3 px-4">Ref #</th>
                        <th className="py-3">Reseller</th>
                        <th className="py-3">Payment Account</th>
                        <th className="py-3 text-right">Payout Amount</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">#{w.withdrawal_number}</td>
                          <td className="py-3 font-sans">
                            <p className="font-semibold text-slate-900">{w.user_name}</p>
                            <span className="text-[10px] text-slate-400">@{w.username} · {w.user_phone}</span>
                          </td>
                          <td className="py-3 font-sans text-slate-700">
                            <span className="font-bold text-slate-900">{w.payment_method}</span>: {w.account_title} ({w.account_number})
                          </td>
                          <td className="py-3 text-right font-bold text-slate-900 text-sm">
                            Rs. {w.amount.toLocaleString()}
                          </td>
                          <td className="py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              w.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            {w.status === 'PENDING' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleProcessWithdrawal(w.id, 'APPROVE_PAY')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg"
                                >
                                  Approve &amp; Pay
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for rejection:');
                                    if (reason) {
                                      setRejectionNote(reason);
                                      handleProcessWithdrawal(w.id, 'REJECT');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg"
                                >
                                  Reject &amp; Refund
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">{w.admin_note || 'Completed'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESELLER USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Reseller User Accounts</h2>
                  <p className="text-xs text-slate-500">Manage reseller performance, order histories, and account status.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                        <th className="py-3 px-4">Reseller</th>
                        <th className="py-3">Contact</th>
                        <th className="py-3">City</th>
                        <th className="py-3 text-center">Total Orders</th>
                        <th className="py-3 text-right">Available Balance</th>
                        <th className="py-3 text-right">Total Profit Earned</th>
                        <th className="py-3 text-center">Account Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-sans">
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <span className="text-[10px] text-slate-400">@{u.username} · {u.business_name}</span>
                          </td>
                          <td className="py-3 font-sans text-slate-600">{u.phone}</td>
                          <td className="py-3 font-sans text-slate-600">{u.city}</td>
                          <td className="py-3 text-center font-bold text-slate-900">{u.orders_count || 0}</td>
                          <td className="py-3 text-right font-bold text-emerald-700">Rs. {u.available_balance?.toLocaleString() || 0}</td>
                          <td className="py-3 text-right font-bold text-purple-700">Rs. {u.total_earned?.toLocaleString() || 0}</td>
                          <td className="py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                u.status === 'ACTIVE'
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Wholesale Factory Suppliers</h2>
                  <p className="text-xs text-slate-500">Manage direct manufacturers, fulfillment centers, and trade vendors.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] bg-slate-50/50">
                        <th className="py-3 px-4">Supplier Name</th>
                        <th className="py-3">Contact</th>
                        <th className="py-3">Warehouse Address</th>
                        <th className="py-3 text-center">Products</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {suppliers.map((s) => (
                        <tr key={s.id}>
                          <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                          <td className="py-3 text-slate-600">{s.phone} {s.whatsapp && `· WA: ${s.whatsapp}`}</td>
                          <td className="py-3 text-slate-500 max-w-xs truncate">{s.address}</td>
                          <td className="py-3 text-center font-mono font-bold text-slate-900">{s.products_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Add New Wholesale Supplier</h3>
                  <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Company / Factory Name</label>
                      <input
                        type="text"
                        required
                        value={newSupplierName}
                        onChange={(e) => setNewSupplierName(e.target.value)}
                        placeholder="e.g. Al-Rehman Weaving Mills"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Phone / WhatsApp</label>
                      <input
                        type="text"
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">City &amp; Address</label>
                      <input
                        type="text"
                        value={newSupplierAddress}
                        onChange={(e) => setNewSupplierAddress(e.target.value)}
                        placeholder="Faisalabad / Karachi"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl"
                    >
                      Save Supplier
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS */}
          {activeTab === 'reports' && reportsData && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-display">Financial &amp; Performance Reports</h2>
                  <p className="text-xs text-slate-500">Breakdown of order sales, profit distribution, and top resellers.</p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                  {['today', '7days', '30days', 'all'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setReportsTimeframe(t)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize ${
                        reportsTimeframe === t ? 'bg-purple-700 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t === '7days' ? 'Last 7 Days' : t === '30days' ? 'Last 30 Days' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Revenue</span>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                    Rs. {reportsData.summary.total_sales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-emerald-700 uppercase font-semibold">Platform Margin</span>
                  <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
                    Rs. {reportsData.summary.platform_margin.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-purple-700 uppercase font-semibold">Reseller Profit</span>
                  <p className="text-xl font-bold font-mono text-purple-700 mt-1">
                    Rs. {reportsData.summary.reseller_profits.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-amber-700 uppercase font-semibold">Supplier Costs</span>
                  <p className="text-xl font-bold font-mono text-amber-700 mt-1">
                    Rs. {reportsData.summary.supplier_costs.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Top Resellers Leaderboard */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 font-display">Top Reseller Leaderboard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                        <th className="pb-2">Reseller</th>
                        <th className="pb-2">City</th>
                        <th className="pb-2 text-center">Orders</th>
                        <th className="pb-2 text-right">Total Sales</th>
                        <th className="pb-2 text-right">Profit Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {reportsData.topResellers?.map((r: any) => (
                        <tr key={r.id}>
                          <td className="py-2.5 font-bold font-sans text-slate-900">{r.name} (@{r.username})</td>
                          <td className="py-2.5 font-sans text-slate-600">{r.city}</td>
                          <td className="py-2.5 text-center font-bold">{r.orders_count}</td>
                          <td className="py-2.5 text-right font-bold text-slate-900">Rs. {r.total_sales.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-bold text-emerald-700">+Rs. {r.total_profit.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Platform Governance &amp; Financial Settings</h2>
                <p className="text-xs text-slate-500">Configure marketplace parameters, delivery pricing, and payout thresholds.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Platform Brand Name</label>
                  <input
                    type="text"
                    value={settings.site_name || ''}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={settings.currency || 'PKR'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={settings.currency_symbol || 'Rs.'}
                      onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Minimum Withdrawal Limit (Rs.)</label>
                    <input
                      type="number"
                      value={settings.min_withdrawal || '500'}
                      onChange={(e) => setSettings({ ...settings, min_withdrawal: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default TCS Delivery Charge (Rs.)</label>
                    <input
                      type="number"
                      value={settings.default_delivery_charge || '150'}
                      onChange={(e) => setSettings({ ...settings, default_delivery_charge: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer Return Window (Days)</label>
                    <input
                      type="number"
                      value={settings.return_period_days || '7'}
                      onChange={(e) => setSettings({ ...settings, return_period_days: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Days after delivery before profit automatically unlocks.</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Official Support WhatsApp</label>
                    <input
                      type="text"
                      value={settings.support_whatsapp || ''}
                      onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Save Platform Settings
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Update Order Status */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 font-mono">
                  Order #{selectedOrder.order_number}
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display">Update Order Fulfillment Status</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">✕</button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reseller Profit:</span>
                  <span className="font-bold font-mono text-emerald-700">Rs. {selectedOrder.reseller_profit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-medium text-slate-800">{selectedOrder.customer_name} ({selectedOrder.customer_city})</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Status</label>
                <select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="READY_TO_SHIP">READY_TO_SHIP</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED (Release profit to reseller wallet!)</option>
                  <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
                  <option value="RETURNED">RETURNED (Reverse reseller profit)</option>
                  <option value="CANCELLED">CANCELLED (Reverse reseller profit)</option>
                </select>
              </div>

              {selectedNewStatus === 'SHIPPED' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Courier Tracking Number (TCS)</label>
                  <input
                    type="text"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    placeholder="e.g. TCS78912345"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Audit Comment</label>
                <input
                  type="text"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="e.g. Parcel dispatched from Lahore hub"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {selectedNewStatus === 'DELIVERED' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                  ✓ Marking as <strong>DELIVERED</strong> will trigger an atomic database transaction moving Rs. {selectedOrder.reseller_profit.toLocaleString()} from pending to available balance in the reseller's wallet.
                </div>
              )}

              {['CANCELLED', 'RETURNED'].includes(selectedNewStatus) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] leading-relaxed">
                  ⚠ Marking as <strong>{selectedNewStatus}</strong> will reverse the reseller's profit and return items to warehouse inventory.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateOrderStatus(selectedOrder.id, selectedNewStatus)}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl"
                >
                  Execute Transition
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {editingProduct ? 'Edit Wholesale Product Pricing' : 'Add New Wholesale Factory Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Embroidered Lawn Suit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wholesale Supplier</label>
                  <select
                    value={prodSupplier}
                    onChange={(e) => setProdSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Core Inputs */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  Financial Pricing Matrix (PKR)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-rose-700 mb-1">
                      Supplier Wholesale Cost (Confidential)
                    </label>
                    <input
                      type="number"
                      required
                      value={prodSupplierCost}
                      onChange={(e) => setProdSupplierCost(e.target.value)}
                      placeholder="e.g. 800"
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-900 mb-1">
                      Platform Base Price (Reseller Cost)
                    </label>
                    <input
                      type="number"
                      required
                      value={prodBasePrice}
                      onChange={(e) => setProdBasePrice(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Min Selling Price</label>
                    <input
                      type="number"
                      required
                      value={prodMinPrice}
                      onChange={(e) => setProdMinPrice(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Max Selling Price</label>
                    <input
                      type="number"
                      required
                      value={prodMaxPrice}
                      onChange={(e) => setProdMaxPrice(e.target.value)}
                      placeholder="e.g. 1800"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Available Stock (Units)</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Charge (Rs.)</label>
                  <input
                    type="number"
                    value={prodDelivery}
                    onChange={(e) => setProdDelivery(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image Asset Path / URL</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="/src/assets/images/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Description</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specifications</label>
                <textarea
                  rows={2}
                  value={prodSpecs}
                  onChange={(e) => setProdSpecs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm"
              >
                Save Wholesale Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
