export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT' | 'RESELLER';
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  business_name?: string;
  city?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  suspended_at?: string;
  suspended_by?: string;
  created_at?: string;
  orders_count?: number;
  delivered_orders_count?: number;
  available_balance?: number;
  pending_balance?: number;
  total_earned?: number;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: string;
  created_at: string;
  target_user_name?: string;
  target_username?: string;
  admin_name?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  status: string;
  products_count?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  category_name?: string;
  subcategory_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_cost?: number; // Only present for Admin!
  base_price: number;
  min_selling_price: number;
  max_selling_price: number;
  delivery_charge: number;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DRAFT';
  description: string;
  specifications?: string;
  rating: number;
  reviews_count: number;
  image_url?: string;
  images?: { id: string; image_url: string; is_primary: number }[];
  orders_count?: number;
  total_units_sold?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  supplier_cost?: number;
  base_price: number;
  selling_price: number;
  profit_per_unit: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  order_number: string;
  reseller_id: string;
  reseller_name?: string;
  reseller_username?: string;
  reseller_phone?: string;
  reseller_business?: string;
  customer_name: string;
  customer_phone: string;
  customer_province: string;
  customer_city: string;
  customer_area: string;
  customer_address: string;
  customer_landmark?: string;
  payment_method: string;
  status: OrderStatus;
  courier?: string;
  tracking_number?: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  total_base_amount?: number;
  total_supplier_cost?: number;
  reseller_profit: number;
  profit_released: number; // 0 = pending, 1 = released to available, -1 = reversed
  profit_released_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  item_name?: string;
  items?: OrderItem[];
  history?: {
    id: string;
    status: OrderStatus;
    comment: string;
    changed_by: string;
    created_at: string;
  }[];
}

export interface Wallet {
  id: string;
  user_id: string;
  pending_balance: number;
  available_balance: number;
  withdrawn_balance: number;
  total_earned: number;
  total_refunded: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  order_id?: string;
  withdrawal_id?: string;
  amount: number;
  type:
    | 'ORDER_PROFIT_PENDING'
    | 'ORDER_PROFIT_RELEASED'
    | 'ORDER_PROFIT_REVERSED'
    | 'WITHDRAWAL_PENDING'
    | 'WITHDRAWAL_APPROVED'
    | 'WITHDRAWAL_REJECTED'
    | 'MANUAL_ADJUSTMENT';
  status: 'PENDING' | 'COMPLETED' | 'REVERSED' | 'REJECTED';
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export interface Withdrawal {
  id: string;
  withdrawal_number: string;
  user_id: string;
  user_name?: string;
  username?: string;
  user_phone?: string;
  user_email?: string;
  amount: number;
  payment_method: 'Easypaisa' | 'JazzCash' | 'Bank Transfer';
  account_title: string;
  account_number: string;
  payment_details?: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  admin_note?: string;
  processed_at?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  notes: string;
  status: string;
  products_count?: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'ORDER' | 'PROFIT' | 'WITHDRAWAL' | 'SYSTEM';
  is_read: number;
  created_at: string;
}

export interface PublicSettings {
  site_name: string;
  currency: string;
  currency_symbol: string;
  min_withdrawal: number;
  default_delivery_charge: number;
  return_period_days: number;
  support_whatsapp: string;
  min_reseller_margin: number;
  max_reseller_margin: number;
}
