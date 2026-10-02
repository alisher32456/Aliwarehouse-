import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RequireUser, RequireAdmin } from './components/guards/RequireAuth';

// Layouts
import { UserLayout } from './components/layout/UserLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Auth Pages
import { UserLoginPage } from './pages/auth/UserLoginPage';
import { UserRegisterPage } from './pages/auth/UserRegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// User / Reseller Portal Pages
import { HomePage } from './pages/user/HomePage';
import { ProductCatalogPage } from './pages/user/ProductCatalogPage';
import { ProductDetailPage } from './pages/user/ProductDetailPage';
import { DashboardPage } from './pages/user/DashboardPage';
import { OrdersPage } from './pages/user/OrdersPage';
import { OrderDetailPage } from './pages/user/OrderDetailPage';
import { WalletPage } from './pages/user/WalletPage';
import { WithdrawPage } from './pages/user/WithdrawPage';
import { ProfilePage } from './pages/user/ProfilePage';

// Customer Direct COD Storefront Page
import { CustomerStorefrontPage } from './pages/customer/CustomerStorefrontPage';

// Admin Portal Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminProductCreatePage } from './pages/admin/AdminProductCreatePage';
import { AdminProductEditPage } from './pages/admin/AdminProductEditPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSuppliersPage } from './pages/admin/AdminSuppliersPage';
import { AdminWithdrawalsPage } from './pages/admin/AdminWithdrawalsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminMaintenancePage } from './pages/admin/AdminMaintenancePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ================================================= */}
          {/* 1. ADMIN AUTHENTICATION (Unauthenticated Entry)    */}
          {/* ================================================= */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ================================================= */}
          {/* 2. ADMIN PORTAL (Guarded by RequireAdmin)        */}
          {/* ================================================= */}
          <Route path="/admin" element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="products/create" element={<AdminProductCreatePage />} />
              <Route path="products/:id/edit" element={<AdminProductEditPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="suppliers" element={<AdminSuppliersPage />} />
              <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="maintenance" element={<AdminMaintenancePage />} />
            </Route>
          </Route>

          {/* ================================================= */}
          {/* 3. CUSTOMER DIRECT STOREFRONT (No User/Admin Nav) */}
          {/* ================================================= */}
          <Route path="/r/:username/product/:productId" element={<CustomerStorefrontPage />} />

          {/* ================================================= */}
          {/* 4. USER / RESELLER AUTHENTICATION                */}
          {/* ================================================= */}
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/register" element={<UserRegisterPage />} />

          {/* ================================================= */}
          {/* 5. USER / RESELLER PORTAL (Guarded by UserLayout) */}
          {/* ================================================= */}
          <Route element={<UserLayout />}>
            {/* Public catalog and landing */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductCatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />

            {/* Authenticated Reseller Protected Routes */}
            <Route element={<RequireUser />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/withdraw" element={<WithdrawPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* ================================================= */}
          {/* 6. CATCH-ALL ROUTE                                */}
          {/* ================================================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
