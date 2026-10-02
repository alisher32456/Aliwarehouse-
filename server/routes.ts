import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { query, queryOne, run, transaction, getDemoStats, removeDemoData } from './db';
import { AuthenticatedRequest, requireAuth, requireRole, generateToken, AuthUser } from './auth';

export const apiRouter = Router();

// Multer Disk Storage Configuration for Persistent Gallery Uploads
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per image
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPG, PNG, and WEBP formats are allowed.'));
    }
  }
});

// ==========================================
// 1. PUBLIC & AUTHENTICATION ENDPOINTS
// ==========================================

// Public Platform Settings
apiRouter.get('/settings/public', (req, res) => {
  const settingsRows = query<{ key: string; value: string }>('SELECT key, value FROM settings');
  const settingsMap: Record<string, string> = {};
  for (const s of settingsRows) {
    settingsMap[s.key] = s.value;
  }
  res.json({
    success: true,
    data: {
      site_name: settingsMap.site_name || 'Rozgar Reseller Network',
      currency: settingsMap.currency || 'PKR',
      currency_symbol: settingsMap.currency_symbol || 'Rs.',
      min_withdrawal: Number(settingsMap.min_withdrawal || '500'),
      default_delivery_charge: Number(settingsMap.default_delivery_charge || '150'),
      return_period_days: Number(settingsMap.return_period_days || '7'),
      support_whatsapp: settingsMap.support_whatsapp || '+92 300 1234567',
      min_reseller_margin: Number(settingsMap.min_reseller_margin || '50'),
      max_reseller_margin: Number(settingsMap.max_reseller_margin || '1500')
    }
  });
});

// Reseller Register (Requires Admin Approval)
apiRouter.post('/auth/register', (req, res) => {
  const { name, email, phone, username, password, business_name, city, address } = req.body;

  if (!name || !email || !phone || !username || !password) {
    res.status(400).json({ success: false, message: 'All required registration fields must be provided' });
    return;
  }

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const cleanEmail = email.toLowerCase().trim();

  // Check unique constraints
  const existingUser = queryOne('SELECT id FROM users WHERE email = ? OR username = ? OR phone = ?', [
    cleanEmail,
    cleanUsername,
    phone
  ]);

  if (existingUser) {
    res.status(400).json({
      success: false,
      message: 'A user with this email, phone number, or reseller username already exists'
    });
    return;
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  try {
    transaction(() => {
      run(
        `INSERT INTO users (id, name, email, phone, username, password_hash, role, status, business_name, city, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'RESELLER', 'PENDING_APPROVAL', ?, ?, ?, ?)`,
        [userId, name, cleanEmail, phone, cleanUsername, passwordHash, business_name || `${name}'s Store`, city || address || 'Pakistan', now, now]
      );

      // Create associated wallet in ready state
      run(
        `INSERT INTO wallets (id, user_id, pending_balance, available_balance, withdrawn_balance, total_earned, total_refunded, updated_at)
         VALUES (?, ?, 0, 0, 0, 0, 0, ?)`,
        [`wlt_${userId}`, userId, now]
      );

      // Record Activity Log
      run(
        `INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
         VALUES (?, 'SYSTEM', 'USER_REGISTERED', 'USER', ?, ?, ?)`,
        [`log_${Date.now()}`, userId, `New reseller registration submitted: @${cleanUsername} (${name}, ${phone})`, now]
      );

      // Registration submitted notification
      run(
        `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, 'Registration Submitted', 'Your registration has been submitted and is pending admin approval.', 'SYSTEM', 0, ?)`,
        [`notif_${Date.now()}`, userId, now]
      );
    });

    const user = queryOne<AuthUser>(
      'SELECT id, name, email, phone, username, role, status, business_name, city, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) throw new Error('User creation failed');

    // Do NOT generate token! Do NOT start session! Require Admin Approval!
    res.status(201).json({
      success: true,
      status: 'PENDING_APPROVAL',
      message: 'Your registration has been submitted. Your account will become active after admin approval.',
      data: { user }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login (Supports Reseller and Admin with Status Governance)
apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ success: false, message: 'Please provide email or username, and password' });
    return;
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = queryOne<any>(
    'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? OR phone = ?',
    [cleanId, cleanId, cleanId]
  );

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    return;
  }

  // Account Status Verification Rules
  if (user.status !== 'ACTIVE') {
    if (user.status === 'PENDING_APPROVAL') {
      res.status(403).json({
        success: false,
        status: 'PENDING_APPROVAL',
        message: 'Your account is waiting for admin approval.'
      });
      return;
    }
    if (user.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        status: 'REJECTED',
        message: 'Your registration was not approved.'
      });
      return;
    }
    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        status: 'SUSPENDED',
        message: 'Your account has been suspended. Please contact support.'
      });
      return;
    }
    res.status(403).json({
      success: false,
      message: 'Your account is not active.'
    });
    return;
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    username: user.username,
    role: user.role,
    business_name: user.business_name,
    city: user.city,
    status: user.status
  };

  const token = generateToken(authUser);
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: authUser, token }
  });
});

// Admin Dedicated Login (Strictly verifies ADMIN / SUPER_ADMIN role)
apiRouter.post('/auth/admin-login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400).json({ success: false, message: 'Please provide administrator credentials' });
    return;
  }

  const cleanId = identifier.trim().toLowerCase();
  const user = queryOne<any>(
    'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ? OR phone = ?',
    [cleanId, cleanId, cleanId]
  );

  if (!user) {
    res.status(401).json({ success: false, message: 'Administrator account not found.' });
    return;
  }

  if (user.status === 'SUSPENDED') {
    res.status(403).json({ success: false, message: 'This administrator account is suspended.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    return;
  }

  // Strict Server-Side Role Verification: Only ADMIN and SUPER_ADMIN allowed
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access Denied: You do not possess administrator privileges.'
    });
    return;
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    username: user.username,
    role: user.role,
    business_name: user.business_name,
    city: user.city,
    status: user.status
  };

  const token = generateToken(authUser);
  res.json({
    success: true,
    message: 'Admin authentication verified',
    data: { user: authUser, token }
  });
});

// Get Current User Profile
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// ==========================================
// 2. PRODUCT CATALOG (RESELLER & PUBLIC)
// ==========================================

// Reseller Product Catalog: Notice supplier_cost is NEVER returned here!
apiRouter.get('/products', (req, res) => {
  const { category, search, minPrice, maxPrice, sort } = req.query;

  let sql = `
    SELECT p.id, p.name, p.slug, p.sku, p.category_id, p.base_price,
           p.min_selling_price, p.max_selling_price, p.delivery_charge,
           p.stock, p.status, p.description, p.specifications, p.rating, p.reviews_count,
           c.name as category_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'ACTIVE'
  `;
  const params: any[] = [];

  if (category && category !== 'all') {
    sql += ' AND p.category_id = ?';
    params.push(category);
  }

  if (search) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice) {
    sql += ' AND p.base_price >= ?';
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    sql += ' AND p.base_price <= ?';
    params.push(Number(maxPrice));
  }

  if (sort === 'profit_high') {
    sql += ' ORDER BY (p.max_selling_price - p.base_price) DESC';
  } else if (sort === 'price_low') {
    sql += ' ORDER BY p.base_price ASC';
  } else if (sort === 'price_high') {
    sql += ' ORDER BY p.base_price DESC';
  } else {
    sql += ' ORDER BY p.created_at DESC';
  }

  const products = query(sql, params);
  res.json({ success: true, data: { products } });
});

// Categories list
apiRouter.get('/categories', (req, res) => {
  const categories = query('SELECT * FROM categories WHERE status = "ACTIVE" ORDER BY name ASC');
  res.json({ success: true, data: { categories } });
});

// Single Product for Reseller
apiRouter.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const product = queryOne(`
    SELECT p.id, p.name, p.slug, p.sku, p.category_id, p.base_price,
           p.min_selling_price, p.max_selling_price, p.delivery_charge,
           p.stock, p.status, p.description, p.specifications, p.rating, p.reviews_count,
           c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `, [id]);

  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  const images = query('SELECT id, image_url, is_primary FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC', [id]);

  res.json({
    success: true,
    data: {
      product: {
        ...product,
        images
      }
    }
  });
});

// ==========================================
// 3. SOCIAL COMMERCE / CUSTOMER RESELLER LINK
// /api/r/:username/product/:productId
// ==========================================

apiRouter.get('/r/:username/product/:productId', (req, res) => {
  const { username, productId } = req.params;

  const reseller = queryOne<any>(
    'SELECT id, name, username, business_name, city, phone FROM users WHERE LOWER(username) = ? AND status = "ACTIVE"',
    [username.toLowerCase()]
  );

  if (!reseller) {
    res.status(404).json({ success: false, message: 'Reseller storefront not found' });
    return;
  }

  // Get product (CRITICAL: Do NOT expose supplier_cost or base_price to customer!)
  const product = queryOne<any>(`
    SELECT p.id, p.name, p.slug, p.sku, p.min_selling_price, p.max_selling_price,
           p.delivery_charge, p.stock, p.status, p.description, p.specifications,
           p.rating, p.reviews_count, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ? AND p.status = 'ACTIVE'
  `, [productId]);

  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found or currently unavailable' });
    return;
  }

  const images = query('SELECT image_url FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC', [productId]);

  res.json({
    success: true,
    data: {
      reseller: {
        id: reseller.id,
        name: reseller.name,
        business_name: reseller.business_name,
        city: reseller.city
      },
      product: {
        ...product,
        images
      }
    }
  });
});

// ==========================================
// 4. CUSTOMER ORDER PLACEMENT
// (No login required for end customer)
// ==========================================

apiRouter.post('/orders/customer', (req, res) => {
  const {
    reseller_id,
    reseller_username,
    product_id,
    quantity,
    selling_price,
    customer_name,
    customer_phone,
    customer_province,
    customer_city,
    customer_area,
    customer_address,
    customer_landmark,
    notes
  } = req.body;

  // 1. Basic validation
  if (!product_id || !quantity || !selling_price || !customer_name || !customer_phone || !customer_city || !customer_address) {
    res.status(400).json({ success: false, message: 'Please fill in all mandatory customer and delivery details.' });
    return;
  }

  const orderQty = Math.max(1, parseInt(quantity, 10));
  const customerSellingPrice = parseFloat(selling_price);

  // 2. Resolve Reseller
  let reseller: any = null;
  if (reseller_id) {
    reseller = queryOne('SELECT id, name, username FROM users WHERE id = ?', [reseller_id]);
  } else if (reseller_username) {
    reseller = queryOne('SELECT id, name, username FROM users WHERE LOWER(username) = ?', [reseller_username.toLowerCase()]);
  }

  if (!reseller) {
    res.status(400).json({ success: false, message: 'Valid reseller reference is required to place an order.' });
    return;
  }

  // 3. Load product & verify server-side price invariants
  const product = queryOne<any>('SELECT * FROM products WHERE id = ?', [product_id]);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  if (product.status !== 'ACTIVE' || product.stock < orderQty) {
    res.status(400).json({ success: false, message: 'Selected product is out of stock or inactive.' });
    return;
  }

  // Invariant verification: selling price must not be below minimum price or above max allowed price
  if (customerSellingPrice < product.min_selling_price) {
    res.status(400).json({
      success: false,
      message: `Selling price Rs. ${customerSellingPrice} cannot be lower than minimum allowable price Rs. ${product.min_selling_price}`
    });
    return;
  }

  if (customerSellingPrice > product.max_selling_price) {
    res.status(400).json({
      success: false,
      message: `Selling price Rs. ${customerSellingPrice} cannot exceed maximum allowable price Rs. ${product.max_selling_price}`
    });
    return;
  }

  // 4. Strict Financial Calculation on Server:
  const subtotal = customerSellingPrice * orderQty;
  const deliveryCharge = product.delivery_charge;
  const totalAmount = subtotal + deliveryCharge;

  const totalBaseAmount = product.base_price * orderQty;
  const totalSupplierCost = product.supplier_cost * orderQty;
  const resellerProfit = subtotal - totalBaseAmount; // Profit guaranteed >= (min_selling_price - base_price)

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const orderNumber = `RZ-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  try {
    transaction(() => {
      // Create Order
      run(`
        INSERT INTO orders (
          id, order_number, reseller_id, customer_name, customer_phone, customer_province,
          customer_city, customer_area, customer_address, customer_landmark, payment_method,
          status, courier, tracking_number, subtotal, delivery_charge, total_amount,
          total_base_amount, total_supplier_cost, reseller_profit, profit_released, notes, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COD', 'PENDING', 'TCS Courier', null,
          ?, ?, ?, ?, ?, ?, 0, ?, ?, ?
        )
      `, [
        orderId, orderNumber, reseller.id, customer_name, customer_phone, customer_province || 'Punjab',
        customer_city, customer_area || customer_city, customer_address, customer_landmark || '',
        subtotal, deliveryCharge, totalAmount, totalBaseAmount, totalSupplierCost, resellerProfit,
        notes || '', now, now
      ]);

      // Create Order Item (LOCKED prices at order creation)
      run(`
        INSERT INTO order_items (
          id, order_id, product_id, product_name, quantity, supplier_cost, base_price, selling_price, profit_per_unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `item_${orderId}_0`, orderId, product.id, product.name, orderQty,
        product.supplier_cost, product.base_price, customerSellingPrice, (customerSellingPrice - product.base_price)
      ]);

      // Deduct stock
      run('UPDATE products SET stock = stock - ? WHERE id = ?', [orderQty, product.id]);

      // Status history
      run(`
        INSERT INTO order_status_history (id, order_id, status, comment, changed_by, created_at)
        VALUES (?, ?, 'PENDING', 'Customer placed order via reseller link (Cash on Delivery)', 'Customer', ?)
      `, [`hist_${orderId}_0`, orderId, now]);

      // Wallet: Book pending profit for reseller
      run('UPDATE wallets SET pending_balance = pending_balance + ?, updated_at = ? WHERE user_id = ?', [
        resellerProfit, now, reseller.id
      ]);

      // Wallet ledger transaction: ORDER_PROFIT_PENDING
      const wallet = queryOne<any>('SELECT available_balance FROM wallets WHERE user_id = ?', [reseller.id]);
      const currentAvail = wallet ? wallet.available_balance : 0;
      run(`
        INSERT INTO wallet_transactions (
          id, user_id, order_id, amount, type, status, balance_before, balance_after, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'ORDER_PROFIT_PENDING', 'PENDING', ?, ?, ?, ?, ?)
      `, [
        `tx_${orderId}_pend`, reseller.id, orderId, resellerProfit,
        currentAvail, currentAvail, `Pending profit booked for new Order #${orderNumber}`, now, now
      ]);

      // Reseller Notification
      run(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (?, ?, 'New Customer Order Placed!', ?, 'ORDER', 0, ?)
      `, [
        `notif_${orderId}`, reseller.id,
        `Customer ${customer_name} placed Order #${orderNumber} for "${product.name}". Expected profit: Rs. ${resellerProfit.toLocaleString()}.`,
        now
      ]);

      // Admin Notification
      run(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (?, 'ADMIN', 'New COD Order Received', ?, 'ORDER', 0, ?)
      `, [
        `notif_adm_${orderId}`,
        `New order #${orderNumber} from reseller ${reseller.name} (${customer_city}). Total: Rs. ${totalAmount.toLocaleString()}.`,
        now
      ]);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! Cash on Delivery confirmed.',
      data: {
        order_number: orderNumber,
        customer_name,
        total_amount: totalAmount,
        status: 'PENDING'
      }
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: 'Server error processing order: ' + (err?.message || err) });
  }
});

// ==========================================
// 5. RESELLER ORDERS & TRACKING
// ==========================================

apiRouter.get('/orders/my-orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { status, search } = req.query;

  let sql = `
    SELECT o.id, o.order_number, o.customer_name, o.customer_phone, o.customer_city,
           o.status, o.subtotal, o.delivery_charge, o.total_amount, o.reseller_profit,
           o.profit_released, o.tracking_number, o.created_at,
           (SELECT product_name FROM order_items WHERE order_id = o.id LIMIT 1) as item_name,
           (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    WHERE o.reseller_id = ?
  `;
  const params: any[] = [userId];

  if (status && status !== 'ALL') {
    sql += ' AND o.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_city LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY o.created_at DESC';
  const orders = query(sql, params);
  res.json({ success: true, data: { orders } });
});

apiRouter.get('/orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const order = queryOne(`
    SELECT id, order_number, reseller_id, customer_name, customer_phone, customer_province,
           customer_city, customer_area, customer_address, customer_landmark,
           payment_method, status, courier, tracking_number, subtotal, delivery_charge,
           total_amount, reseller_profit, profit_released, profit_released_at, notes, created_at, updated_at
    FROM orders
    WHERE id = ? AND (reseller_id = ? OR ? IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT'))
  `, [id, userId, req.user!.role]);

  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  const items = query('SELECT * FROM order_items WHERE order_id = ?', [id]);
  const history = query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC', [id]);

  res.json({
    success: true,
    data: {
      order: {
        ...order,
        items,
        history
      }
    }
  });
});

// ==========================================
// 6. RESELLER WALLET & WITHDRAWALS
// ==========================================

apiRouter.get('/wallet', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const wallet = queryOne('SELECT * FROM wallets WHERE user_id = ?', [userId]) || {
    pending_balance: 0,
    available_balance: 0,
    withdrawn_balance: 0,
    total_earned: 0,
    total_refunded: 0
  };

  const recentTransactions = query(
    'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 15',
    [userId]
  );

  res.json({
    success: true,
    data: {
      wallet,
      recentTransactions
    }
  });
});

apiRouter.get('/wallet/transactions', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const transactions = query(
    'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  res.json({ success: true, data: { transactions } });
});

// Request Withdrawal
apiRouter.post('/withdrawals', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { amount, payment_method, account_title, account_number, payment_details } = req.body;

  const withdrawAmount = parseFloat(amount);
  if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
    res.status(400).json({ success: false, message: 'Please provide a valid withdrawal amount.' });
    return;
  }

  if (!payment_method || !account_title || !account_number) {
    res.status(400).json({ success: false, message: 'Please provide payment method, account title, and account number.' });
    return;
  }

  // Get min withdrawal setting
  const minSetting = queryOne<{ value: string }>('SELECT value FROM settings WHERE key = "min_withdrawal"');
  const minWithdrawal = minSetting ? Number(minSetting.value) : 500;

  if (withdrawAmount < minWithdrawal) {
    res.status(400).json({
      success: false,
      message: `Minimum withdrawal amount is Rs. ${minWithdrawal.toLocaleString()}`
    });
    return;
  }

  // Verify wallet available balance
  const wallet = queryOne<any>('SELECT * FROM wallets WHERE user_id = ?', [userId]);
  if (!wallet || wallet.available_balance < withdrawAmount) {
    res.status(400).json({
      success: false,
      message: `Insufficient available balance. You have Rs. ${(wallet ? wallet.available_balance : 0).toLocaleString()} available.`
    });
    return;
  }

  const withdrawalId = `wd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const withdrawalNumber = `WD-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  try {
    transaction(() => {
      // 1. Deduct available balance
      const newAvail = wallet.available_balance - withdrawAmount;
      run('UPDATE wallets SET available_balance = ?, updated_at = ? WHERE user_id = ?', [
        newAvail, now, userId
      ]);

      // 2. Create withdrawal record
      run(`
        INSERT INTO withdrawals (
          id, withdrawal_number, user_id, amount, payment_method, account_title,
          account_number, payment_details, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `, [
        withdrawalId, withdrawalNumber, userId, withdrawAmount, payment_method,
        account_title, account_number, payment_details || '', now, now
      ]);

      // 3. Create wallet ledger entry: WITHDRAWAL_PENDING
      run(`
        INSERT INTO wallet_transactions (
          id, user_id, withdrawal_id, amount, type, status, balance_before, balance_after,
          description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'WITHDRAWAL_PENDING', 'PENDING', ?, ?, ?, ?, ?)
      `, [
        `tx_${withdrawalId}`, userId, withdrawalId, withdrawAmount,
        wallet.available_balance, newAvail, `Withdrawal request #${withdrawalNumber} via ${payment_method}`, now, now
      ]);

      // 4. Notify admin
      run(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (?, 'ADMIN', 'New Withdrawal Request', ?, 'WITHDRAWAL', 0, ?)
      `, [
        `notif_adm_wd_${withdrawalId}`,
        `Reseller ${req.user!.name} requested Rs. ${withdrawAmount.toLocaleString()} via ${payment_method}.`,
        now
      ]);
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully! It will be reviewed by admin.',
      data: { withdrawal_number: withdrawalNumber, amount: withdrawAmount }
    });
  } catch (err: any) {
    console.error('Withdrawal error:', err);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal request.' });
  }
});

apiRouter.get('/withdrawals', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const withdrawals = query('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  res.json({ success: true, data: { withdrawals } });
});

// Notifications
apiRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notifications = query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
    [userId]
  );
  res.json({ success: true, data: { notifications } });
});

apiRouter.post('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  res.json({ success: true });
});

// Reseller Dashboard Summary
apiRouter.get('/reseller/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const totalOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders WHERE reseller_id = ?', [userId])?.count || 0;
  const deliveredOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders WHERE reseller_id = ? AND status = "DELIVERED"', [userId])?.count || 0;
  const pendingOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders WHERE reseller_id = ? AND status IN ("PENDING", "CONFIRMED", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "OUT_FOR_DELIVERY")', [userId])?.count || 0;
  const cancelledOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders WHERE reseller_id = ? AND status IN ("CANCELLED", "RETURNED")', [userId])?.count || 0;

  const wallet = queryOne('SELECT * FROM wallets WHERE user_id = ?', [userId]) || {
    pending_balance: 0,
    available_balance: 0,
    withdrawn_balance: 0,
    total_earned: 0
  };

  const recentOrders = query(`
    SELECT o.id, o.order_number, o.customer_name, o.customer_city, o.status,
           o.total_amount, o.reseller_profit, o.created_at,
           (SELECT product_name FROM order_items WHERE order_id = o.id LIMIT 1) as product_name
    FROM orders o
    WHERE o.reseller_id = ?
    ORDER BY o.created_at DESC
    LIMIT 5
  `, [userId]);

  res.json({
    success: true,
    data: {
      stats: {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        cancelledOrders,
        pending_balance: wallet.pending_balance,
        available_balance: wallet.available_balance,
        withdrawn_balance: wallet.withdrawn_balance,
        total_earned: wallet.total_earned
      },
      recentOrders
    }
  });
});

// ==========================================
// 7. ADMIN PORTAL ENDPOINTS
// Protected by requireAuth & requireRole(['SUPER_ADMIN', 'ADMIN'])
// ==========================================

const requireAdmin = [requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN'])];

// Admin Dashboard Summary
apiRouter.get('/admin/dashboard', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "RESELLER"')?.count || 0;
  const activeResellers = queryOne<{ count: number }>('SELECT COUNT(DISTINCT reseller_id) as count FROM orders')?.count || 0;
  const totalOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders')?.count || 0;

  const deliveredOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders WHERE status = "DELIVERED"')?.count || 0;
  const cancelledOrders = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders WHERE status IN ("CANCELLED", "RETURNED")')?.count || 0;

  // Reseller approval status metrics
  const pendingApprovalsCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "RESELLER" AND status = "PENDING_APPROVAL"')?.count || 0;
  const approvedUsersCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "RESELLER" AND status = "ACTIVE"')?.count || 0;
  const rejectedUsersCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "RESELLER" AND status = "REJECTED"')?.count || 0;
  const suspendedUsersCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = "RESELLER" AND status = "SUSPENDED"')?.count || 0;

  // Financial aggregates
  const financials = queryOne<any>(`
    SELECT
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(SUM(total_base_amount), 0) as total_base,
      COALESCE(SUM(total_supplier_cost), 0) as total_supplier_cost,
      COALESCE(SUM(reseller_profit), 0) as total_reseller_profit
    FROM orders
    WHERE status != 'CANCELLED'
  `);

  const platformRevenue = financials.total_base - financials.total_supplier_cost;

  // Pending withdrawals
  const pendingWithdrawalsCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM withdrawals WHERE status = "PENDING"')?.count || 0;
  const pendingWithdrawalsAmount = queryOne<{ total: number }>('SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = "PENDING"')?.total || 0;

  // Wallet liabilities
  const totalAvailableLiability = queryOne<{ total: number }>('SELECT COALESCE(SUM(available_balance), 0) as total FROM wallets')?.total || 0;
  const totalPendingLiability = queryOne<{ total: number }>('SELECT COALESCE(SUM(pending_balance), 0) as total FROM wallets')?.total || 0;

  // Top products
  const topProducts = query(`
    SELECT p.id, p.name, p.sku, p.base_price, p.supplier_cost, p.stock,
           COUNT(oi.id) as orders_count,
           SUM(oi.quantity) as total_units_sold
    FROM products p
    JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.id
    ORDER BY total_units_sold DESC
    LIMIT 5
  `);

  // Recent 6 orders
  const recentOrders = query(`
    SELECT o.id, o.order_number, o.customer_name, o.customer_city, o.status,
           o.total_amount, o.reseller_profit, o.total_base_amount, o.total_supplier_cost,
           o.created_at, u.name as reseller_name, u.business_name
    FROM orders o
    JOIN users u ON o.reseller_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 6
  `);

  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        activeResellers,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        totalSales: financials.total_sales,
        platformRevenue,
        resellerProfits: financials.total_reseller_profit,
        supplierCosts: financials.total_supplier_cost,
        pendingWithdrawalsCount,
        pendingWithdrawalsAmount,
        totalAvailableLiability,
        totalPendingLiability,
        pendingApprovalsCount,
        approvedUsersCount,
        rejectedUsersCount,
        suspendedUsersCount
      },
      topProducts,
      recentOrders
    }
  });
});

// ==========================================
// ADMIN IMAGE UPLOADER (Gallery & Storage)
// ==========================================

// Multipart form upload supporting up to 10 images directly from device gallery
apiRouter.post('/admin/upload-images', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  upload.array('images', 10)(req, res, (err: any) => {
    if (err) {
      console.error('Image upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error. Check file type (JPG, PNG, WEBP) and size (max 10MB).'
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images were selected for upload.' });
    }

    const urls = files.map(f => `/uploads/${f.filename}`);
    return res.json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: { urls }
    });
  });
});

// Base64 upload fallback endpoint for mobile / programmatic image uploads
apiRouter.post('/admin/upload-image-base64', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing base64 image data payload.' });
  }

  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ success: false, message: 'Invalid base64 image format.' });
  }

  const mimeType = matches[1].toLowerCase();
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(mimeType)) {
    return res.status(400).json({ success: false, message: 'Only JPG, PNG, and WEBP formats are supported.' });
  }

  let ext = '.jpg';
  if (mimeType.includes('png')) ext = '.png';
  if (mimeType.includes('webp')) ext = '.webp';

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > 10 * 1024 * 1024) {
    return res.status(400).json({ success: false, message: 'Image exceeds maximum 10MB size limit.' });
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const outName = `product-${uniqueSuffix}${ext}`;
  const outPath = path.resolve(UPLOAD_DIR, outName);

  fs.writeFileSync(outPath, buffer);

  const url = `/uploads/${outName}`;
  return res.json({
    success: true,
    message: 'Image uploaded successfully',
    data: { url }
  });
});

// Admin Product Management
apiRouter.get('/admin/products', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const products = query(`
    SELECT p.*, c.name as category_name, s.name as supplier_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.deleted_at IS NULL
    ORDER BY p.created_at DESC
  `);
  res.json({ success: true, data: { products } });
});

apiRouter.get('/admin/products/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const product = queryOne(`
    SELECT p.*, c.name as category_name, s.name as supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `, [id]);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const images = query(
    'SELECT id, image_url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC',
    [id]
  );

  return res.json({
    success: true,
    data: {
      product: {
        ...product,
        images
      }
    }
  });
});

apiRouter.post('/admin/products', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    name, sku, category_id, supplier_id, supplier_cost, base_price,
    min_selling_price, max_selling_price, delivery_charge, stock,
    status, description, specifications, images, image_url
  } = req.body;

  // Numerical parsing and strict validation (Requirement 7)
  const sCost = parseFloat(supplier_cost);
  const bPrice = parseFloat(base_price);
  const minP = parseFloat(min_selling_price !== undefined && min_selling_price !== '' ? min_selling_price : base_price);
  const maxP = parseFloat(max_selling_price !== undefined && max_selling_price !== '' ? max_selling_price : (bPrice * 1.5).toString());
  const sQty = parseInt(stock !== undefined && stock !== '' ? stock : '0', 10);
  const dCharge = parseFloat(delivery_charge !== undefined && delivery_charge !== '' ? delivery_charge : '150');

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Product title is required' });
  }
  if (!category_id) {
    return res.status(400).json({ success: false, message: 'Category is required' });
  }
  if (!supplier_id) {
    return res.status(400).json({ success: false, message: 'Supplier is required' });
  }
  if (isNaN(sCost) || sCost < 0) {
    return res.status(400).json({ success: false, message: 'Supplier Cost must be greater than or equal to 0' });
  }
  if (isNaN(bPrice) || bPrice <= 0) {
    return res.status(400).json({ success: false, message: 'Platform Base Price must be greater than 0' });
  }
  if (isNaN(minP) || minP < bPrice) {
    return res.status(400).json({ success: false, message: 'Minimum Selling Price cannot be lower than Platform Base Price' });
  }
  if (isNaN(maxP) || maxP < minP) {
    return res.status(400).json({ success: false, message: 'Maximum Selling Price cannot be lower than Minimum Selling Price' });
  }
  if (isNaN(sQty) || sQty < 0) {
    return res.status(400).json({ success: false, message: 'Stock Quantity cannot be negative' });
  }

  const id = `prod_${Date.now()}`;
  const finalSku = sku && sku.trim() ? sku.trim().toUpperCase() : `ROZ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const prodStatus = status && ['ACTIVE', 'INACTIVE'].includes(status) ? status : 'ACTIVE';

  // Process Images List (Multiple Images, Primary selection, Ordering)
  const imageList: Array<{ image_url: string; is_primary: number; sort_order: number }> = [];
  if (Array.isArray(images) && images.length > 0) {
    const hasExplicitPrimary = images.some((img: any) => img.is_primary === 1 || img.is_primary === true);
    images.forEach((img: any, idx: number) => {
      const url = typeof img === 'string' ? img : img.image_url;
      if (url && url.trim()) {
        const isPrimary = (typeof img === 'object' && (img.is_primary === 1 || img.is_primary === true))
          ? 1
          : (!hasExplicitPrimary && idx === 0 ? 1 : 0);
        imageList.push({
          image_url: url.trim(),
          is_primary: isPrimary,
          sort_order: typeof img === 'object' && img.sort_order !== undefined ? Number(img.sort_order) : idx
        });
      }
    });
  } else if (image_url && image_url.trim()) {
    imageList.push({ image_url: image_url.trim(), is_primary: 1, sort_order: 0 });
  }

  try {
    transaction(() => {
      run(`
        INSERT INTO products (
          id, name, slug, sku, category_id, supplier_id, supplier_cost, base_price,
          min_selling_price, max_selling_price, delivery_charge, stock, status,
          description, specifications, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name.trim(), slug, finalSku, category_id, supplier_id,
        sCost, bPrice, minP, maxP, dCharge, sQty, prodStatus,
        description || '', specifications || '', now, now
      ]);

      for (let i = 0; i < imageList.length; i++) {
        const img = imageList[i];
        run(
          'INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
          [`img_${id}_${i}_${Date.now()}`, id, img.image_url, img.is_primary, img.sort_order]
        );
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { id, sku: finalSku }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error creating product: ' + err.message });
  }
});

apiRouter.put('/admin/products/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    name, sku, category_id, supplier_id, supplier_cost, base_price,
    min_selling_price, max_selling_price, delivery_charge, stock,
    status, description, specifications, images, image_url
  } = req.body;

  const existingProd = queryOne<any>('SELECT * FROM products WHERE id = ?', [id]);
  if (!existingProd) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Parse numerical fields
  const sCost = supplier_cost !== undefined ? parseFloat(supplier_cost) : existingProd.supplier_cost;
  const bPrice = base_price !== undefined ? parseFloat(base_price) : existingProd.base_price;
  const minP = min_selling_price !== undefined ? parseFloat(min_selling_price) : existingProd.min_selling_price;
  const maxP = max_selling_price !== undefined ? parseFloat(max_selling_price) : existingProd.max_selling_price;
  const sQty = stock !== undefined ? parseInt(stock, 10) : existingProd.stock;
  const dCharge = delivery_charge !== undefined ? parseFloat(delivery_charge) : existingProd.delivery_charge;

  // Validation
  if (sCost !== undefined && (isNaN(sCost) || sCost < 0)) {
    return res.status(400).json({ success: false, message: 'Supplier Cost must be >= 0' });
  }
  if (bPrice !== undefined && (isNaN(bPrice) || bPrice <= 0)) {
    return res.status(400).json({ success: false, message: 'Platform Base Price must be > 0' });
  }
  if (minP !== undefined && bPrice !== undefined && minP < bPrice) {
    return res.status(400).json({ success: false, message: 'Minimum Selling Price cannot be lower than Platform Base Price' });
  }
  if (maxP !== undefined && minP !== undefined && maxP < minP) {
    return res.status(400).json({ success: false, message: 'Maximum Selling Price cannot be lower than Minimum Selling Price' });
  }
  if (sQty !== undefined && (isNaN(sQty) || sQty < 0)) {
    return res.status(400).json({ success: false, message: 'Stock Quantity cannot be negative' });
  }

  const now = new Date().toISOString();

  try {
    transaction(() => {
      run(`
        UPDATE products SET
          name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          category_id = COALESCE(?, category_id),
          supplier_id = COALESCE(?, supplier_id),
          supplier_cost = COALESCE(?, supplier_cost),
          base_price = COALESCE(?, base_price),
          min_selling_price = COALESCE(?, min_selling_price),
          max_selling_price = COALESCE(?, max_selling_price),
          delivery_charge = COALESCE(?, delivery_charge),
          stock = COALESCE(?, stock),
          status = COALESCE(?, status),
          description = COALESCE(?, description),
          specifications = COALESCE(?, specifications),
          updated_at = ?
        WHERE id = ?
      `, [
        name ? name.trim() : null,
        sku ? sku.trim().toUpperCase() : null,
        category_id || null,
        supplier_id || null,
        sCost, bPrice, minP, maxP, dCharge, sQty,
        status || null,
        description !== undefined ? description : null,
        specifications !== undefined ? specifications : null,
        now, id
      ]);

      // Update product images if provided
      if (Array.isArray(images)) {
        run('DELETE FROM product_images WHERE product_id = ?', [id]);
        const hasExplicitPrimary = images.some((img: any) => img.is_primary === 1 || img.is_primary === true);
        images.forEach((img: any, idx: number) => {
          const url = typeof img === 'string' ? img : img.image_url;
          if (url && url.trim()) {
            const isPrimary = (typeof img === 'object' && (img.is_primary === 1 || img.is_primary === true))
              ? 1
              : (!hasExplicitPrimary && idx === 0 ? 1 : 0);
            run(
              'INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
              [
                `img_${id}_${idx}_${Date.now()}`,
                id,
                url.trim(),
                isPrimary,
                typeof img === 'object' && img.sort_order !== undefined ? Number(img.sort_order) : idx
              ]
            );
          }
        });
      } else if (image_url) {
        const existingImg = queryOne('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1', [id]);
        if (existingImg) {
          run('UPDATE product_images SET image_url = ? WHERE id = ?', [image_url.trim(), existingImg.id]);
        } else {
          run('INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, 1, 0)', [
            `img_${id}_${Date.now()}`, id, image_url.trim()
          ]);
        }
      }
    });

    return res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Error updating product: ' + err.message });
  }
});

// Safe Delete / Deactivate Product (Requirement 4 & 5)
apiRouter.delete('/admin/products/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id || 'usr_superadmin';
  const now = new Date().toISOString();

  // Check historical orders connected to this product
  const historicalOrders = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
    [id]
  )?.count || 0;

  if (historicalOrders > 0) {
    // If product has historical orders: do NOT hard delete. Deactivate and archive safely!
    run('UPDATE products SET status = "INACTIVE", deleted_at = ?, deleted_by = ? WHERE id = ?', [now, adminId, id]);
    run(
      'INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, "PRODUCT_ARCHIVED", "PRODUCT", ?, ?, ?)',
      [`log_${Date.now()}`, adminId, id, `Product archived due to ${historicalOrders} historical orders to preserve order history.`, now]
    );
    return res.json({
      success: true,
      message: `Product is connected to ${historicalOrders} historical order(s). It has been safely deactivated & archived to preserve order economics.`,
      isArchived: true
    });
  } else {
    // No historical orders: safe to remove images and product record
    run('DELETE FROM product_images WHERE product_id = ?', [id]);
    run('DELETE FROM products WHERE id = ?', [id]);
    run(
      'INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, "PRODUCT_DELETED", "PRODUCT", ?, "Product deleted permanently", ?)',
      [`log_${Date.now()}`, adminId, id, now]
    );
    return res.json({
      success: true,
      message: 'Product deleted permanently.',
      isArchived: false
    });
  }
});

// Quick Status Toggle (Activate / Deactivate)
apiRouter.put('/admin/products/:id/status', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Valid status (ACTIVE or INACTIVE) is required' });
  }
  const now = new Date().toISOString();
  run('UPDATE products SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
  return res.json({ success: true, message: `Product is now ${status}` });
});

// Delete specific product image
apiRouter.delete('/admin/products/:productId/images/:imageId', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { productId, imageId } = req.params;
  const img = queryOne<any>('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);
  if (!img) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }

  run('DELETE FROM product_images WHERE id = ?', [imageId]);

  // If deleted image was primary, select next image as primary
  if (img.is_primary === 1) {
    const nextImg = queryOne<any>('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1', [productId]);
    if (nextImg) {
      run('UPDATE product_images SET is_primary = 1 WHERE id = ?', [nextImg.id]);
    }
  }

  return res.json({ success: true, message: 'Product image deleted' });
});

// Set specific product image as primary / cover
apiRouter.put('/admin/products/:productId/images/:imageId/primary', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { productId, imageId } = req.params;
  transaction(() => {
    run('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
    run('UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?', [imageId, productId]);
  });
  return res.json({ success: true, message: 'Cover image updated' });
});

// Admin Suppliers
apiRouter.get('/admin/suppliers', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const suppliers = query(`
    SELECT s.*,
           (SELECT COUNT(*) FROM products WHERE supplier_id = s.id) as products_count
    FROM suppliers s
    ORDER BY s.created_at DESC
  `);
  res.json({ success: true, data: { suppliers } });
});

apiRouter.post('/admin/suppliers', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, whatsapp, address, notes } = req.body;
  if (!name) {
    res.status(400).json({ success: false, message: 'Supplier name is required' });
    return;
  }
  const id = `sup_${Date.now()}`;
  const now = new Date().toISOString();
  run(
    'INSERT INTO suppliers (id, name, phone, whatsapp, address, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "ACTIVE", ?)',
    [id, name, phone || '', whatsapp || '', address || '', notes || '', now]
  );
  res.status(201).json({ success: true, message: 'Supplier created successfully', data: { id } });
});

apiRouter.delete('/admin/suppliers/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id || 'usr_superadmin';
  const now = new Date().toISOString();

  const prodCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM products WHERE supplier_id = ? AND deleted_at IS NULL',
    [id]
  )?.count || 0;

  if (prodCount > 0) {
    run('UPDATE suppliers SET status = "INACTIVE", deleted_at = ?, deleted_by = ? WHERE id = ?', [now, adminId, id]);
    return res.json({
      success: true,
      message: `Supplier is assigned to ${prodCount} active product(s). Safely deactivated and archived.`,
      isArchived: true
    });
  } else {
    run('DELETE FROM suppliers WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Supplier deleted successfully.', isArchived: false });
  }
});

apiRouter.put('/admin/suppliers/:id/status', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE' });
  }
  run('UPDATE suppliers SET status = ? WHERE id = ?', [status, id]);
  return res.json({ success: true, message: `Supplier status changed to ${status}` });
});

// Admin Categories Management
apiRouter.get('/admin/categories', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const categories = query(`
    SELECT c.*,
           (SELECT COUNT(*) FROM products WHERE category_id = c.id AND deleted_at IS NULL) as products_count
    FROM categories c
    WHERE c.deleted_at IS NULL
    ORDER BY c.name ASC
  `);
  res.json({ success: true, data: { categories } });
});

apiRouter.post('/admin/categories', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, image_url } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }
  const id = `cat_${Date.now()}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();
  run(
    'INSERT INTO categories (id, name, slug, image_url, status, created_at) VALUES (?, ?, ?, ?, "ACTIVE", ?)',
    [id, name.trim(), slug, image_url || null, now]
  );
  return res.status(201).json({ success: true, message: 'Category created successfully', data: { id } });
});

apiRouter.delete('/admin/categories/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id || 'usr_superadmin';
  const now = new Date().toISOString();

  const prodCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL',
    [id]
  )?.count || 0;

  if (prodCount > 0) {
    run('UPDATE categories SET status = "INACTIVE", deleted_at = ?, deleted_by = ? WHERE id = ?', [now, adminId, id]);
    return res.json({
      success: true,
      message: `Category has ${prodCount} active product(s). Safely deactivated & archived.`,
      isArchived: true
    });
  } else {
    run('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Category deleted successfully.', isArchived: false });
  }
});

apiRouter.put('/admin/categories/:id/status', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE' });
  }
  run('UPDATE categories SET status = ? WHERE id = ?', [status, id]);
  return res.json({ success: true, message: `Category status updated to ${status}` });
});

// Admin Orders Management & Status Control
apiRouter.get('/admin/orders', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query;
  let sql = `
    SELECT o.*, u.name as reseller_name, u.username as reseller_username, u.phone as reseller_phone
    FROM orders o
    JOIN users u ON o.reseller_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'ALL') {
    sql += ' AND o.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_phone LIKE ? OR u.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY o.created_at DESC';
  const orders = query(sql, params);
  res.json({ success: true, data: { orders } });
});

apiRouter.get('/admin/orders/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = queryOne(`
    SELECT o.*, u.name as reseller_name, u.username as reseller_username,
           u.phone as reseller_phone, u.business_name as reseller_business
    FROM orders o
    JOIN users u ON o.reseller_id = u.id
    WHERE o.id = ?
  `, [id]);

  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  const items = query('SELECT * FROM order_items WHERE order_id = ?', [id]);
  const history = query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC', [id]);

  res.json({
    success: true,
    data: {
      order: {
        ...order,
        items,
        history
      }
    }
  });
});

// Update Order Status (With ACID Profit Invariant & Reversal Rules)
apiRouter.post('/admin/orders/:id/status', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, comment, tracking_number } = req.body;

  const validStatuses = [
    'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP',
    'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURN_REQUESTED',
    'RETURNED', 'CANCELLED', 'REFUNDED'
  ];

  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    return;
  }

  const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  const now = new Date().toISOString();
  const adminName = req.user!.name;

  try {
    transaction(() => {
      // Status update
      run(
        'UPDATE orders SET status = ?, tracking_number = COALESCE(?, tracking_number), updated_at = ? WHERE id = ?',
        [status, tracking_number || null, now, id]
      );

      // Record status transition in history
      run(
        'INSERT INTO order_status_history (id, order_id, status, comment, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [`hist_${id}_${Date.now()}`, id, status, comment || `Status updated to ${status}`, adminName, now]
      );

      // Profit Ledger Transitions:
      // Case A: Order marked as DELIVERED -> Profit release workflow
      if (status === 'DELIVERED' && order.profit_released === 0) {
        // Automatically release profit to reseller's available balance
        run(
          'UPDATE orders SET profit_released = 1, profit_released_at = ?, updated_at = ? WHERE id = ?',
          [now, now, id]
        );

        // Adjust wallet: move from pending to available
        run(
          'UPDATE wallets SET pending_balance = MAX(0, pending_balance - ?), available_balance = available_balance + ?, total_earned = total_earned + ?, updated_at = ? WHERE user_id = ?',
          [order.reseller_profit, order.reseller_profit, order.reseller_profit, now, order.reseller_id]
        );

        // Ledger transaction
        const wallet = queryOne<any>('SELECT available_balance FROM wallets WHERE user_id = ?', [order.reseller_id]);
        const availNow = wallet ? wallet.available_balance : 0;

        run(`
          INSERT INTO wallet_transactions (
            id, user_id, order_id, amount, type, status, balance_before, balance_after,
            description, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'ORDER_PROFIT_RELEASED', 'COMPLETED', ?, ?, ?, ?, ?)
        `, [
          `tx_${id}_released`, order.reseller_id, id, order.reseller_profit,
          availNow - order.reseller_profit, availNow,
          `Delivered - Profit released to available balance for Order #${order.order_number}`, now, now
        ]);

        // Reseller notification
        run(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, 'Profit Credited to Wallet!', ?, 'PROFIT', 0, ?)
        `, [
          `notif_rel_${id}`, order.reseller_id,
          `Order #${order.order_number} has been delivered. Rs. ${order.reseller_profit.toLocaleString()} has been added to your available balance.`,
          now
        ]);
      }

      // Case B: Order CANCELLED or RETURNED -> Profit Reversal Workflow
      if (['CANCELLED', 'RETURNED', 'REFUNDED'].includes(status)) {
        if (order.profit_released === 0) {
          // It was still pending -> deduct from pending balance
          run(
            'UPDATE wallets SET pending_balance = MAX(0, pending_balance - ?), updated_at = ? WHERE user_id = ?',
            [order.reseller_profit, now, order.reseller_id]
          );

          run('UPDATE orders SET profit_released = -1, updated_at = ? WHERE id = ?', [now, id]);

          // Ledger entry
          run(`
            INSERT INTO wallet_transactions (
              id, user_id, order_id, amount, type, status, balance_before, balance_after,
              description, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'ORDER_PROFIT_REVERSED', 'REVERSED', 0, 0, ?, ?, ?)
          `, [
            `tx_${id}_rev`, order.reseller_id, id, order.reseller_profit,
            `Order #${order.order_number} ${status.toLowerCase()} - Pending profit removed`, now, now
          ]);
        } else if (order.profit_released === 1) {
          // Already released to available -> reverse from available!
          run(
            'UPDATE wallets SET available_balance = MAX(0, available_balance - ?), total_refunded = total_refunded + ?, updated_at = ? WHERE user_id = ?',
            [order.reseller_profit, order.reseller_profit, now, order.reseller_id]
          );

          run('UPDATE orders SET profit_released = -1, updated_at = ? WHERE id = ?', [now, id]);

          const wallet = queryOne<any>('SELECT available_balance FROM wallets WHERE user_id = ?', [order.reseller_id]);
          const availNow = wallet ? wallet.available_balance : 0;

          run(`
            INSERT INTO wallet_transactions (
              id, user_id, order_id, amount, type, status, balance_before, balance_after,
              description, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'ORDER_PROFIT_REVERSED', 'REVERSED', ?, ?, ?, ?, ?)
          `, [
            `tx_${id}_rev`, order.reseller_id, id, order.reseller_profit,
            availNow + order.reseller_profit, availNow,
            `Order #${order.order_number} ${status.toLowerCase()} - Profit reversed`, now, now
          ]);
        }

        // Restock inventory for items
        const items = query<{ product_id: string; quantity: number }>('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
        for (const it of items) {
          run('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
        }
      }

      // Log admin activity
      run(`
        INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
        VALUES (?, ?, 'UPDATE_ORDER_STATUS', 'ORDER', ?, ?, ?)
      `, [`log_${Date.now()}`, req.user!.id, id, `Status changed from ${order.status} to ${status}`, now]);
    });

    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err: any) {
    console.error('Status transition error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status: ' + err.message });
  }
});

// Admin Users Management & Approval Workflow
apiRouter.get('/admin/users', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query;

  let sql = `
    SELECT u.id, u.name, u.email, u.phone, u.username, u.role, u.status,
           u.business_name, u.city, u.created_at,
           u.approved_at, u.approved_by, u.rejected_at, u.rejected_by, u.rejection_reason,
           u.suspended_at, u.suspended_by,
           w.available_balance, w.pending_balance, w.withdrawn_balance, w.total_earned,
           (SELECT COUNT(*) FROM orders WHERE reseller_id = u.id) as orders_count,
           (SELECT COUNT(*) FROM orders WHERE reseller_id = u.id AND status = "DELIVERED") as delivered_orders_count
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    WHERE u.role = 'RESELLER'
  `;
  const params: any[] = [];

  if (status && status !== 'ALL') {
    sql += ' AND u.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.business_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY u.created_at DESC';
  const users = query(sql, params);

  // Status breakdown counts
  const total = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users WHERE role = "RESELLER"')?.c || 0;
  const pending = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users WHERE role = "RESELLER" AND status = "PENDING_APPROVAL"')?.c || 0;
  const approved = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users WHERE role = "RESELLER" AND status = "ACTIVE"')?.c || 0;
  const rejected = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users WHERE role = "RESELLER" AND status = "REJECTED"')?.c || 0;
  const suspended = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM users WHERE role = "RESELLER" AND status = "SUSPENDED"')?.c || 0;

  res.json({
    success: true,
    data: {
      users,
      counts: {
        total,
        pending,
        approved,
        rejected,
        suspended
      }
    }
  });
});

// Admin User Approval, Rejection, and Suspension Actions
apiRouter.post('/admin/users/:id/action', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, reason } = req.body; // 'APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE'

  const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (user.role === 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Cannot modify Super Admin accounts' });
    return;
  }

  const now = new Date().toISOString();
  const adminId = req.user!.id;
  const adminName = req.user!.name;

  try {
    transaction(() => {
      if (action === 'APPROVE') {
        run(
          `UPDATE users SET
            status = 'ACTIVE',
            approved_at = ?,
            approved_by = ?,
            rejected_at = NULL,
            rejected_by = NULL,
            rejection_reason = NULL,
            suspended_at = NULL,
            suspended_by = NULL,
            updated_at = ?
           WHERE id = ?`,
          [now, adminName, now, id]
        );

        run(
          `INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
           VALUES (?, ?, 'USER_APPROVED', 'USER', ?, ?, ?)`,
          [`log_${Date.now()}`, adminId, id, `Approved reseller account: @${user.username} (${user.name})`, now]
        );

        run(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
           VALUES (?, ?, 'Account Approved!', 'Congratulations! Your reseller registration has been approved by admin. You can now log in, explore the wholesale catalog, and book customer orders.', 'SYSTEM', 0, ?)`,
          [`notif_${Date.now()}`, id, now]
        );
      } else if (action === 'REJECT') {
        run(
          `UPDATE users SET
            status = 'REJECTED',
            rejected_at = ?,
            rejected_by = ?,
            rejection_reason = ?,
            updated_at = ?
           WHERE id = ?`,
          [now, adminName, reason || 'Registration details could not be verified', now, id]
        );

        run(
          `INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
           VALUES (?, ?, 'USER_REJECTED', 'USER', ?, ?, ?)`,
          [`log_${Date.now()}`, adminId, id, `Rejected reseller registration: @${user.username} - Reason: ${reason || 'Details could not be verified'}`, now]
        );

        run(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
           VALUES (?, ?, 'Registration Not Approved', ?, 'SYSTEM', 0, ?)`,
          [`notif_${Date.now()}`, id, `Your registration was not approved: "${reason || 'Details could not be verified'}". Contact support if you believe this is an error.`, now]
        );
      } else if (action === 'SUSPEND') {
        run(
          `UPDATE users SET
            status = 'SUSPENDED',
            suspended_at = ?,
            suspended_by = ?,
            updated_at = ?
           WHERE id = ?`,
          [now, adminName, now, id]
        );

        run(
          `INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
           VALUES (?, ?, 'USER_SUSPENDED', 'USER', ?, ?, ?)`,
          [`log_${Date.now()}`, adminId, id, `Suspended reseller account: @${user.username} - Reason: ${reason || 'Policy violation'}`, now]
        );

        run(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
           VALUES (?, ?, 'Account Suspended', ?, 'SYSTEM', 0, ?)`,
          [`notif_${Date.now()}`, id, `Your account has been suspended: "${reason || 'Platform compliance check'}".`, now]
        );
      } else if (action === 'REACTIVATE') {
        run(
          `UPDATE users SET
            status = 'ACTIVE',
            approved_at = ?,
            approved_by = ?,
            suspended_at = NULL,
            suspended_by = NULL,
            updated_at = ?
           WHERE id = ?`,
          [now, adminName, now, id]
        );

        run(
          `INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
           VALUES (?, ?, 'USER_REACTIVATED', 'USER', ?, ?, ?)`,
          [`log_${Date.now()}`, adminId, id, `Reactivated reseller account: @${user.username}`, now]
        );

        run(
          `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
           VALUES (?, ?, 'Account Reactivated', 'Your reseller account has been reactivated. You have full access to wholesale catalog and payouts.', 'SYSTEM', 0, ?)`,
          [`notif_${Date.now()}`, id, now]
        );
      } else {
        throw new Error(`Unsupported action: ${action}`);
      }
    });

    res.json({
      success: true,
      message: `User @${user.username} successfully updated via ${action}.`
    });
  } catch (err: any) {
    console.error('User action error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update user status' });
  }
});

// Admin User Approval & Action Activity Logs
apiRouter.get('/admin/users/logs', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const logs = query(`
    SELECT l.*,
           u.name as target_user_name, u.username as target_username,
           adm.name as admin_name
    FROM admin_activity_logs l
    LEFT JOIN users u ON l.target_id = u.id
    LEFT JOIN users adm ON l.admin_id = adm.id
    WHERE l.target_type = 'USER'
    ORDER BY l.created_at DESC
    LIMIT 100
  `);
  res.json({ success: true, data: { logs } });
});

// Admin Withdrawals Management
apiRouter.get('/admin/withdrawals', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const withdrawals = query(`
    SELECT w.*, u.name as user_name, u.username, u.phone as user_phone, u.email as user_email
    FROM withdrawals w
    JOIN users u ON w.user_id = u.id
    WHERE w.deleted_at IS NULL
    ORDER BY w.created_at DESC
  `);
  res.json({ success: true, data: { withdrawals } });
});

apiRouter.post('/admin/withdrawals/:id/action', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, note } = req.body; // 'APPROVE_PAY' or 'REJECT'

  const withdrawal = queryOne<any>('SELECT * FROM withdrawals WHERE id = ?', [id]);
  if (!withdrawal) {
    res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    return;
  }

  if (withdrawal.status !== 'PENDING') {
    res.status(400).json({ success: false, message: `Withdrawal has already been marked as ${withdrawal.status}` });
    return;
  }

  const now = new Date().toISOString();

  try {
    transaction(() => {
      if (action === 'APPROVE_PAY') {
        // Mark paid
        run(
          'UPDATE withdrawals SET status = "PAID", admin_note = ?, processed_at = ?, updated_at = ? WHERE id = ?',
          [note || 'Approved & Dispatched by Admin', now, now, id]
        );

        // Update wallet withdrawn balance
        run(
          'UPDATE wallets SET withdrawn_balance = withdrawn_balance + ?, updated_at = ? WHERE user_id = ?',
          [withdrawal.amount, now, withdrawal.user_id]
        );

        // Update transaction status
        run(
          'UPDATE wallet_transactions SET status = "COMPLETED", description = ? WHERE withdrawal_id = ?',
          [`Payout processed successfully via ${withdrawal.payment_method} (#${withdrawal.withdrawal_number})`, id]
        );

        // Reseller notification
        run(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, 'Withdrawal Paid!', ?, 'WITHDRAWAL', 0, ?)
        `, [
          `notif_wd_${id}`, withdrawal.user_id,
          `Your withdrawal of Rs. ${withdrawal.amount.toLocaleString()} has been sent to your ${withdrawal.payment_method} account (${withdrawal.account_number}).`,
          now
        ]);
      } else if (action === 'REJECT') {
        // Reject and refund to available balance
        run(
          'UPDATE withdrawals SET status = "REJECTED", admin_note = ?, processed_at = ?, updated_at = ? WHERE id = ?',
          [note || 'Rejected by Admin', now, now, id]
        );

        // Refund available balance
        run(
          'UPDATE wallets SET available_balance = available_balance + ?, updated_at = ? WHERE user_id = ?',
          [withdrawal.amount, now, withdrawal.user_id]
        );

        // Create reversal transaction
        const wallet = queryOne<any>('SELECT available_balance FROM wallets WHERE user_id = ?', [withdrawal.user_id]);
        const availNow = wallet ? wallet.available_balance : 0;

        run(`
          INSERT INTO wallet_transactions (
            id, user_id, withdrawal_id, amount, type, status, balance_before, balance_after,
            description, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 'WITHDRAWAL_REJECTED', 'REJECTED', ?, ?, ?, ?, ?)
        `, [
          `tx_rej_${id}`, withdrawal.user_id, id, withdrawal.amount,
          availNow - withdrawal.amount, availNow,
          `Withdrawal #${withdrawal.withdrawal_number} rejected (${note || 'Invalid account details'}) - Funds returned`, now, now
        ]);

        // Reseller notification
        run(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
          VALUES (?, ?, 'Withdrawal Request Rejected', ?, 'WITHDRAWAL', 0, ?)
        `, [
          `notif_wd_rej_${id}`, withdrawal.user_id,
          `Your withdrawal of Rs. ${withdrawal.amount.toLocaleString()} was rejected: "${note || 'Account details could not be verified'}". Funds returned to your available balance.`,
          now
        ]);
      }
    });

    res.json({ success: true, message: `Withdrawal successfully ${action === 'APPROVE_PAY' ? 'paid' : 'rejected'}` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error processing withdrawal: ' + err.message });
  }
});

// Admin Settings
apiRouter.get('/admin/settings', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const settings = query('SELECT * FROM settings');
  res.json({ success: true, data: { settings } });
});

apiRouter.put('/admin/settings', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    res.status(400).json({ success: false, message: 'Invalid settings object' });
    return;
  }

  transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      run('INSERT INTO settings (key, value, description) VALUES (?, ?, "") ON CONFLICT(key) DO UPDATE SET value = ?', [
        key, String(value), String(value)
      ]);
    }
  });

  res.json({ success: true, message: 'Settings saved successfully' });
});

// Admin Reports
apiRouter.get('/admin/reports', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { timeframe } = req.query; // 'today', '7days', '30days', 'all'

  let dateFilter = '';
  if (timeframe === 'today') {
    dateFilter = "AND date(o.created_at) = date('now')";
  } else if (timeframe === '7days') {
    dateFilter = "AND o.created_at >= date('now', '-7 days')";
  } else if (timeframe === '30days') {
    dateFilter = "AND o.created_at >= date('now', '-30 days')";
  }

  // Summary
  const summary = queryOne<any>(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(SUM(total_base_amount), 0) as total_base,
      COALESCE(SUM(total_supplier_cost), 0) as total_supplier,
      COALESCE(SUM(reseller_profit), 0) as total_profit
    FROM orders o
    WHERE o.status != 'CANCELLED' ${dateFilter}
  `);

  // Order breakdown by status
  const ordersByStatus = query(`
    SELECT status, COUNT(*) as count, SUM(total_amount) as total
    FROM orders o
    WHERE 1=1 ${dateFilter}
    GROUP BY status
  `);

  // Top Resellers
  const topResellers = query(`
    SELECT u.id, u.name, u.username, u.phone, u.city,
           COUNT(o.id) as orders_count,
           SUM(o.total_amount) as total_sales,
           SUM(o.reseller_profit) as total_profit
    FROM users u
    JOIN orders o ON u.id = o.reseller_id
    WHERE o.status != 'CANCELLED' ${dateFilter}
    GROUP BY u.id
    ORDER BY total_sales DESC
    LIMIT 10
  `);

  // Top Products
  const topProducts = query(`
    SELECT p.name, p.sku, c.name as category_name,
           SUM(oi.quantity) as units_sold,
           SUM(oi.selling_price * oi.quantity) as gross_sales,
           SUM((oi.base_price - oi.supplier_cost) * oi.quantity) as platform_margin
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'CANCELLED' ${dateFilter}
    GROUP BY p.id
    ORDER BY units_sold DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    data: {
      summary: {
        total_orders: summary.total_orders,
        total_sales: summary.total_sales,
        platform_margin: summary.total_base - summary.total_supplier,
        reseller_profits: summary.total_profit,
        supplier_costs: summary.total_supplier
      },
      ordersByStatus,
      topResellers,
      topProducts
    }
  });
});

// ==========================================
// ADMIN DELETE & SAFE CONTROLS (Requirements 4 & 5)
// ==========================================

// Safe User Delete / Suspend / Activate
apiRouter.delete('/admin/users/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentAdmin = req.user!;
  const targetUser = queryOne<any>('SELECT * FROM users WHERE id = ?', [id]);

  if (!targetUser) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Prevent deleting Super Admin / Admin accounts
  if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Cannot delete an Admin or Super Admin account.' });
  }

  if (targetUser.id === currentAdmin.id) {
    return res.status(403).json({ success: false, message: 'You cannot delete your own account.' });
  }

  const ordersCount = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM orders WHERE reseller_id = ?', [id])?.c || 0;
  const withdrawalsCount = queryOne<{ c: number }>('SELECT COUNT(*) as c FROM withdrawals WHERE user_id = ?', [id])?.c || 0;
  const now = new Date().toISOString();

  if (ordersCount > 0 || withdrawalsCount > 0) {
    // Soft delete to protect financial/order history
    run('UPDATE users SET status = "SUSPENDED", deleted_at = ?, deleted_by = ? WHERE id = ?', [now, currentAdmin.id, id]);
    run(
      'INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, "USER_ARCHIVED", "USER", ?, ?, ?)',
      [`log_${Date.now()}`, currentAdmin.id, id, `User account suspended and archived due to ${ordersCount} order(s) and ${withdrawalsCount} withdrawal(s).`, now]
    );
    return res.json({
      success: true,
      message: `User has ${ordersCount} order(s) and ${withdrawalsCount} withdrawal(s). Account safely suspended and archived to preserve financial records.`,
      isArchived: true
    });
  } else {
    // Completely unreferenced user - safe to permanently delete
    run('DELETE FROM wallet_transactions WHERE user_id = ?', [id]);
    run('DELETE FROM wallets WHERE user_id = ?', [id]);
    run('DELETE FROM notifications WHERE user_id = ?', [id]);
    run('DELETE FROM users WHERE id = ?', [id]);
    run(
      'INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at) VALUES (?, ?, "USER_DELETED", "USER", ?, "User deleted permanently", ?)',
      [`log_${Date.now()}`, currentAdmin.id, id, now]
    );
    return res.json({
      success: true,
      message: 'User removed permanently.',
      isArchived: false
    });
  }
});

apiRouter.put('/admin/users/:id/status', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['ACTIVE', 'PENDING_APPROVAL', 'REJECTED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid user status' });
  }

  const now = new Date().toISOString();
  run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
  return res.json({ success: true, message: `User status changed to ${status}` });
});

// Orders Management: Cancel, Archive, Safe Delete
apiRouter.post('/admin/orders/:id/cancel', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const now = new Date().toISOString();
  transaction(() => {
    run('UPDATE orders SET status = "CANCELLED", updated_at = ? WHERE id = ?', [now, id]);
    run(
      'INSERT INTO order_status_history (id, order_id, status, comment, changed_by, created_at) VALUES (?, ?, "CANCELLED", ?, ?, ?)',
      [`hist_${id}_${Date.now()}`, id, reason || 'Order cancelled by Admin', req.user!.name, now]
    );

    // If profit was booked or released, reverse it safely
    if (order.profit_released === 1) {
      run(
        'UPDATE wallets SET available_balance = MAX(0, available_balance - ?), total_refunded = total_refunded + ?, updated_at = ? WHERE user_id = ?',
        [order.reseller_profit, order.reseller_profit, now, order.reseller_id]
      );
      run('UPDATE orders SET profit_released = -1, updated_at = ? WHERE id = ?', [now, id]);
    } else if (order.profit_released === 0) {
      run(
        'UPDATE wallets SET pending_balance = MAX(0, pending_balance - ?), updated_at = ? WHERE user_id = ?',
        [order.reseller_profit, now, order.reseller_id]
      );
      run('UPDATE orders SET profit_released = -1, updated_at = ? WHERE id = ?', [now, id]);
    }

    // Restock items
    const items = query<{ product_id: string; quantity: number }>('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
    for (const it of items) {
      run('UPDATE products SET stock = stock + ? WHERE id = ?', [it.quantity, it.product_id]);
    }
  });

  return res.json({ success: true, message: 'Order cancelled and inventory restored' });
});

apiRouter.post('/admin/orders/:id/archive', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  run('UPDATE orders SET deleted_at = ?, deleted_by = ? WHERE id = ?', [now, req.user!.id, id]);
  return res.json({ success: true, message: 'Order archived successfully' });
});

apiRouter.delete('/admin/orders/:id', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = queryOne<any>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // If order has financial settlement, forbid permanent hard delete
  if (order.profit_released === 1) {
    return res.status(400).json({
      success: false,
      message: 'This order has released financial profit. It cannot be permanently deleted. Please use Archive instead.'
    });
  }

  const now = new Date().toISOString();
  // Safe Archive
  run('UPDATE orders SET deleted_at = ?, deleted_by = ? WHERE id = ?', [now, req.user!.id, id]);
  return res.json({ success: true, message: 'Order safely archived.' });
});

// Withdrawal archive
apiRouter.post('/admin/withdrawals/:id/archive', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  run('UPDATE withdrawals SET deleted_at = ?, deleted_by = ? WHERE id = ?', [now, req.user!.id, id]);
  return res.json({ success: true, message: 'Withdrawal record archived' });
});

// ==========================================
// ADMIN MAINTENANCE & DEMO DATA CLEANUP (Requirement 6)
// ==========================================

apiRouter.get('/admin/maintenance/stats', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const stats = getDemoStats();
  return res.json({
    success: true,
    data: { stats }
  });
});

apiRouter.post('/admin/maintenance/cleanup-demo', ...requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const adminId = req.user?.id || 'usr_superadmin';
  const summary = removeDemoData(adminId);

  return res.json({
    success: true,
    message: 'Demo and test data removed successfully. Admin account and platform configuration preserved.',
    data: summary
  });
});
