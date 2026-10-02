import { Product, Order, Wallet, WalletTransaction, Withdrawal, NotificationItem, PublicSettings, User, Supplier, Category } from '../types';

const TOKEN_KEY = 'rozgar_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string; status?: string; isArchived?: boolean }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (!(options.body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    return {
      success: false,
      message: err.message || 'Network communication error'
    };
  }
}

export const api = {
  // Public
  getPublicSettings: () => request<PublicSettings>('/settings/public'),
  getCategories: () => request<{ categories: Category[] }>('/categories'),
  getProducts: (params?: { category?: string; search?: string; sort?: string; minPrice?: number; maxPrice?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.minPrice) searchParams.set('minPrice', String(params.minPrice));
    if (params?.maxPrice) searchParams.set('maxPrice', String(params.maxPrice));
    const qs = searchParams.toString();
    return request<{ products: Product[] }>(`/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id: string) => request<{ product: Product }>(`/products/${id}`),

  // Customer link
  getCustomerStorefront: (username: string, productId: string) =>
    request<{ reseller: { id: string; name: string; business_name?: string; city?: string }; product: Product }>(
      `/r/${username}/product/${productId}`
    ),

  createCustomerOrder: (orderData: {
    reseller_id?: string;
    reseller_username?: string;
    product_id: string;
    quantity: number;
    selling_price: number;
    customer_name: string;
    customer_phone: string;
    customer_province?: string;
    customer_city: string;
    customer_area?: string;
    customer_address: string;
    customer_landmark?: string;
    notes?: string;
  }) => request<{ order_number: string; customer_name: string; total_amount: number; status: string }>('/orders/customer', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  // Auth
  register: (userData: any) => request<{ user: User; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  login: (credentials: { identifier: string; password: string }) => request<{ user: User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  adminLogin: (credentials: { identifier: string; password: string }) => request<{ user: User; token: string }>('/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  getMe: () => request<{ user: User }>('/auth/me'),

  // Reseller Portal
  getResellerDashboard: () => request<{
    stats: {
      totalOrders: number;
      deliveredOrders: number;
      pendingOrders: number;
      cancelledOrders: number;
      pending_balance: number;
      available_balance: number;
      withdrawn_balance: number;
      total_earned: number;
    };
    recentOrders: Order[];
  }>('/reseller/dashboard'),

  getMyOrders: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request<{ orders: Order[] }>(`/orders/my-orders${qs ? `?${qs}` : ''}`);
  },

  getOrderDetails: (id: string) => request<{ order: Order }>(`/orders/${id}`),

  getWallet: () => request<{ wallet: Wallet; recentTransactions: WalletTransaction[] }>('/wallet'),
  getWalletTransactions: () => request<{ transactions: WalletTransaction[] }>('/wallet/transactions'),

  requestWithdrawal: (data: {
    amount: number;
    payment_method: string;
    account_title: string;
    account_number: string;
    payment_details?: string;
  }) => request<{ withdrawal_number: string; amount: number }>('/withdrawals', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getWithdrawals: () => request<{ withdrawals: Withdrawal[] }>('/withdrawals'),

  getNotifications: () => request<{ notifications: NotificationItem[] }>('/notifications'),
  markNotificationsRead: () => request<void>('/notifications/read-all', { method: 'POST' }),

  // Admin Portal
  getAdminDashboard: () => request<{
    metrics: {
      totalUsers: number;
      activeResellers: number;
      totalOrders: number;
      deliveredOrders: number;
      cancelledOrders: number;
      totalSales: number;
      platformRevenue: number;
      resellerProfits: number;
      supplierCosts: number;
      pendingWithdrawalsCount: number;
      pendingWithdrawalsAmount: number;
      totalAvailableLiability: number;
      totalPendingLiability: number;
    };
    topProducts: any[];
    recentOrders: Order[];
  }>('/admin/dashboard'),

  getAdminProducts: () => request<{ products: Product[] }>('/admin/products'),
  getAdminProductById: (id: string) => request<{ product: Product }>(`/admin/products/${id}`),
  createAdminProduct: (productData: any) => request<{ id: string; sku: string }>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  updateAdminProduct: (id: string, productData: any) => request<void>(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  deleteAdminProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
  updateAdminProductStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => request<void>(`/admin/products/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  deleteProductImage: (productId: string, imageId: string) => request<void>(`/admin/products/${productId}/images/${imageId}`, {
    method: 'DELETE'
  }),
  setPrimaryProductImage: (productId: string, imageId: string) => request<void>(`/admin/products/${productId}/images/${imageId}/primary`, {
    method: 'PUT'
  }),

  // Gallery Image Uploaders
  uploadImages: (formData: FormData) => request<{ urls: string[] }>('/admin/upload-images', {
    method: 'POST',
    body: formData
  }),
  uploadImageBase64: (dataUrl: string, filename?: string) => request<{ url: string }>('/admin/upload-image-base64', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, filename })
  }),

  // Admin Suppliers
  getAdminSuppliers: () => request<{ suppliers: Supplier[] }>('/admin/suppliers'),
  createAdminSupplier: (data: any) => request<{ id: string }>('/admin/suppliers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAdminSupplier: (id: string) => request<void>(`/admin/suppliers/${id}`, { method: 'DELETE' }),
  updateAdminSupplierStatus: (id: string, status: string) => request<void>(`/admin/suppliers/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),

  // Admin Categories
  getAdminCategories: () => request<{ categories: Category[] }>('/admin/categories'),
  createAdminCategory: (data: { name: string; image_url?: string }) => request<{ id: string }>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteAdminCategory: (id: string) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),
  updateAdminCategoryStatus: (id: string, status: string) => request<void>(`/admin/categories/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),

  getAdminOrders: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request<{ orders: Order[] }>(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  updateOrderStatus: (id: string, statusData: { status: string; comment?: string; tracking_number?: string }) =>
    request<void>(`/admin/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(statusData)
    }),
  cancelAdminOrder: (id: string, reason?: string) => request<void>(`/admin/orders/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
  archiveAdminOrder: (id: string) => request<void>(`/admin/orders/${id}/archive`, {
    method: 'POST'
  }),
  deleteAdminOrder: (id: string) => request<void>(`/admin/orders/${id}`, {
    method: 'DELETE'
  }),

  getAdminUsers: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return request<{
      users: User[];
      counts: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        suspended: number;
      };
    }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  adminUserAction: (id: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE', reason?: string) =>
    request<void>(`/admin/users/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason })
    }),
  getAdminUserLogs: () => request<{ logs: any[] }>('/admin/users/logs'),
  updateUserStatus: (id: string, status: string) => request<void>(`/admin/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  deleteAdminUser: (id: string) => request<void>(`/admin/users/${id}`, {
    method: 'DELETE'
  }),

  getAdminWithdrawals: () => request<{ withdrawals: Withdrawal[] }>('/admin/withdrawals'),
  processWithdrawal: (id: string, action: 'APPROVE_PAY' | 'REJECT', note?: string) =>
    request<void>(`/admin/withdrawals/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, note })
    }),
  archiveAdminWithdrawal: (id: string) => request<void>(`/admin/withdrawals/${id}/archive`, {
    method: 'POST'
  }),

  getAdminSettings: () => request<{ settings: { key: string; value: string; description: string }[] }>('/admin/settings'),
  updateAdminSettings: (settings: Record<string, any>) => request<void>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings })
  }),

  getAdminReports: (timeframe: string = 'all') => request<{
    summary: {
      total_orders: number;
      total_sales: number;
      platform_margin: number;
      reseller_profits: number;
      supplier_costs: number;
    };
    ordersByStatus: { status: string; count: number; total: number }[];
    topResellers: any[];
    topProducts: any[];
  }>(`/admin/reports?timeframe=${timeframe}`),

  // Maintenance & Demo Cleanup (Requirement 6)
  getMaintenanceStats: () => request<{
    stats: {
      demoUsers: number;
      demoProducts: number;
      demoOrders: number;
      demoSuppliers: number;
      demoTransactions: number;
      demoWithdrawals: number;
      demoNotifications: number;
    };
  }>('/admin/maintenance/stats'),

  cleanupDemoData: () => request<{
    usersRemoved: number;
    productsRemoved: number;
    ordersRemoved: number;
    otherRemoved: number;
  }>('/admin/maintenance/cleanup-demo', {
    method: 'POST'
  })
};
