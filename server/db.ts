import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.resolve(process.cwd(), 'data.sqlite');

let dbInstance: Database | null = null;
let inTransaction = false;

// Synchronous helper to save db to disk
export function saveDb(): void {
  if (!dbInstance || inTransaction) return;
  try {
    const data = dbInstance.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function query<T = any>(sql: string, params: SqlValue[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: SqlValue[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: SqlValue[] = []): { changes: number } {
  const db = getDb();
  if (params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
  } else {
    db.run(sql);
  }
  if (!inTransaction) {
    saveDb();
  }
  return { changes: db.getRowsModified() };
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  inTransaction = true;
  db.run('BEGIN TRANSACTION;');
  try {
    const result = fn();
    db.run('COMMIT;');
    inTransaction = false;
    saveDb();
    return result;
  } catch (error) {
    console.error('Transaction execution failed with error:', error);
    try {
      db.run('ROLLBACK;');
    } catch {
      // ignore rollback failure if transaction already aborted
    }
    inTransaction = false;
    throw error;
  }
}

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  let fileBuffer: Buffer | null = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      fileBuffer = fs.readFileSync(DB_FILE);
    } catch (e) {
      console.warn('Could not read existing SQLite database, creating new one.', e);
    }
  }

  if (fileBuffer && fileBuffer.length > 0) {
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Create tables and schema
  createSchema();
  applyMigrations();

  // Ensure Real Admin account and core platform settings always exist
  ensureAdminAndSettings();

  // Clean demo records immediately on initial boot
  const demoUsersCount = queryOne<{ count: number }>(`
    SELECT COUNT(*) as count FROM users 
    WHERE role NOT IN ('SUPER_ADMIN', 'ADMIN') 
      AND (id LIKE 'usr_reseller_%' OR id LIKE 'usr_demo_%' OR username IN ('ayeshacollections', 'hamzastyle', 'zainabtrends', 'bilalgadgets', 'maryamdeals', 'tariqelectronics', 'kamrangoods', 'zahidbazaar'))
  `);

  if (demoUsersCount && demoUsersCount.count > 0) {
    console.log(`[Database] Found ${demoUsersCount.count} legacy demo users. Cleaning demo data...`);
    removeDemoData('SYSTEM_BOOT');
  }
}

function applyMigrations(): void {
  const db = getDb();
  const alterStatements = [
    'ALTER TABLE users ADD COLUMN approved_at TEXT;',
    'ALTER TABLE users ADD COLUMN approved_by TEXT;',
    'ALTER TABLE users ADD COLUMN rejected_at TEXT;',
    'ALTER TABLE users ADD COLUMN rejected_by TEXT;',
    'ALTER TABLE users ADD COLUMN rejection_reason TEXT;',
    'ALTER TABLE users ADD COLUMN suspended_at TEXT;',
    'ALTER TABLE users ADD COLUMN suspended_by TEXT;',
    'ALTER TABLE users ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE users ADD COLUMN deleted_by TEXT;',
    'ALTER TABLE products ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE products ADD COLUMN deleted_by TEXT;',
    'ALTER TABLE suppliers ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE suppliers ADD COLUMN deleted_by TEXT;',
    'ALTER TABLE categories ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE categories ADD COLUMN deleted_by TEXT;',
    'ALTER TABLE orders ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE orders ADD COLUMN deleted_by TEXT;',
    'ALTER TABLE withdrawals ADD COLUMN deleted_at TEXT;',
    'ALTER TABLE withdrawals ADD COLUMN deleted_by TEXT;'
  ];

  for (const stmt of alterStatements) {
    try {
      db.run(stmt);
    } catch {
      // Column already exists, safe to ignore
    }
  }
  saveDb();
}

export function ensureAdminAndSettings(): void {
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Roles
  run("INSERT OR IGNORE INTO roles VALUES ('r_super_admin', 'SUPER_ADMIN', 'Platform Owner with full control')");
  run("INSERT OR IGNORE INTO roles VALUES ('r_admin', 'ADMIN', 'Store Administrator')");
  run("INSERT OR IGNORE INTO roles VALUES ('r_support', 'SUPPORT', 'Order Support Agent')");
  run("INSERT OR IGNORE INTO roles VALUES ('r_reseller', 'RESELLER', 'Independent Merchant/Reseller')");

  // 2. Real Super Admin (Preserve if exists, otherwise create)
  const existingSuperAdmin = queryOne('SELECT id FROM users WHERE role = "SUPER_ADMIN" OR username = "alisher" OR email = "admin@rozgar.pk"');
  if (!existingSuperAdmin) {
    run(`
      INSERT INTO users (id, name, email, phone, username, password_hash, role, status, business_name, city, approved_at, approved_by, created_at, updated_at)
      VALUES ('usr_superadmin', 'Ali Sher (Platform Owner)', 'admin@rozgar.pk', '03001234567', 'alisher', ?, 'SUPER_ADMIN', 'ACTIVE', 'Rozgar HQ', 'Lahore', ?, 'SYSTEM_INIT', ?, ?)
    `, [passwordHash, now, now, now]);

    run(`INSERT OR IGNORE INTO wallets (id, user_id, updated_at) VALUES ('wlt_usr_superadmin', 'usr_superadmin', ?)`, [now]);
  }

  // 3. Platform Settings
  const settings = [
    { key: 'site_name', value: 'Rozgar Reseller Network', description: 'Platform Title' },
    { key: 'currency', value: 'PKR', description: 'Platform Currency' },
    { key: 'currency_symbol', value: 'Rs.', description: 'Currency Symbol' },
    { key: 'min_withdrawal', value: '500', description: 'Minimum balance to request withdrawal' },
    { key: 'default_delivery_charge', value: '150', description: 'Standard delivery fee' },
    { key: 'return_period_days', value: '7', description: 'Days after delivery before profit auto-releases' },
    { key: 'support_whatsapp', value: '+92 300 1234567', description: 'Official WhatsApp Helpdesk' },
    { key: 'min_reseller_margin', value: '50', description: 'Minimum required profit margin per item' },
    { key: 'max_reseller_margin', value: '1500', description: 'Maximum allowed profit margin per item' }
  ];

  for (const s of settings) {
    run('INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)', [s.key, s.value, s.description]);
  }

  saveDb();
}

export function getDemoStats(): {
  demoUsers: number;
  demoProducts: number;
  demoOrders: number;
  demoSuppliers: number;
  demoTransactions: number;
  demoWithdrawals: number;
  demoNotifications: number;
} {
  const users = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM users 
    WHERE role NOT IN ('SUPER_ADMIN', 'ADMIN')
      AND (id LIKE 'usr_reseller_%' OR id LIKE 'usr_demo_%' OR username IN ('ayeshacollections', 'hamzastyle', 'zainabtrends', 'bilalgadgets', 'maryamdeals', 'tariqelectronics', 'kamrangoods', 'zahidbazaar'))
  `)?.c || 0;

  const products = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM products 
    WHERE id LIKE 'prod_1' OR id LIKE 'prod_2' OR id LIKE 'prod_3' OR id LIKE 'prod_4' OR id LIKE 'prod_5'
       OR id LIKE 'prod_6' OR id LIKE 'prod_7' OR id LIKE 'prod_8' OR id LIKE 'prod_9' OR id LIKE 'prod_10'
       OR sku LIKE 'ROZ-LAWN-%' OR sku LIKE 'ROZ-MEN-%' OR sku LIKE 'ROZ-AUD-%' OR sku LIKE 'ROZ-KIT-%' OR sku LIKE 'ROZ-BEA-%'
  `)?.c || 0;

  const orders = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM orders 
    WHERE id LIKE 'ord_10%' OR id LIKE 'ord_11%' OR order_number LIKE 'RZ-98%'
  `)?.c || 0;

  const suppliers = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM suppliers 
    WHERE id IN ('sup_1', 'sup_2') OR name LIKE '%Khaadi Textiles Wholesale Hub%' OR name LIKE '%Metro Gadgets & Electronics Direct%'
  `)?.c || 0;

  const transactions = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM wallet_transactions 
    WHERE id LIKE 'tx_ord_%'
  `)?.c || 0;

  const withdrawals = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM withdrawals 
    WHERE id IN ('wd_1', 'wd_2') OR withdrawal_number LIKE 'WD-81%'
  `)?.c || 0;

  const notifications = queryOne<{ c: number }>(`
    SELECT COUNT(*) as c FROM notifications 
    WHERE id IN ('notif_1', 'notif_2', 'notif_admin_1')
  `)?.c || 0;

  return {
    demoUsers: users,
    demoProducts: products,
    demoOrders: orders,
    demoSuppliers: suppliers,
    demoTransactions: transactions,
    demoWithdrawals: withdrawals,
    demoNotifications: notifications
  };
}

export function removeDemoData(adminId: string = 'usr_superadmin'): {
  usersRemoved: number;
  productsRemoved: number;
  ordersRemoved: number;
  otherRemoved: number;
} {
  return transaction(() => {
    let usersRemoved = 0;
    let productsRemoved = 0;
    let ordersRemoved = 0;
    let otherRemoved = 0;

    // 1. Identify Demo Reseller Users (NEVER delete SUPER_ADMIN or ADMIN accounts!)
    const demoUsers = query<{ id: string }>(`
      SELECT id FROM users 
      WHERE role NOT IN ('SUPER_ADMIN', 'ADMIN') 
        AND (id LIKE 'usr_reseller_%' OR id LIKE 'usr_demo_%' OR username IN ('ayeshacollections', 'hamzastyle', 'zainabtrends', 'bilalgadgets', 'maryamdeals', 'tariqelectronics', 'kamrangoods', 'zahidbazaar'))
    `);
    const demoUserIds = demoUsers.map(u => `'${u.id}'`).join(',');

    // 2. Identify Demo Orders
    const demoOrders = query<{ id: string }>(`
      SELECT id FROM orders 
      WHERE id LIKE 'ord_10%' OR id LIKE 'ord_11%' OR order_number LIKE 'RZ-98%'
         ${demoUserIds ? `OR reseller_id IN (${demoUserIds})` : ''}
    `);
    const demoOrderIds = demoOrders.map(o => `'${o.id}'`).join(',');

    if (demoOrderIds) {
      const delStatusHist = run(`DELETE FROM order_status_history WHERE order_id IN (${demoOrderIds})`);
      const delItems = run(`DELETE FROM order_items WHERE order_id IN (${demoOrderIds})`);
      const delOrders = run(`DELETE FROM orders WHERE id IN (${demoOrderIds})`);
      ordersRemoved = delOrders.changes;
      otherRemoved += delStatusHist.changes + delItems.changes;
    }

    // 3. Remove Demo Withdrawals & Wallet Transactions
    const delWd = run(`
      DELETE FROM withdrawals 
      WHERE id IN ('wd_1', 'wd_2') OR withdrawal_number LIKE 'WD-81%'
         ${demoUserIds ? `OR user_id IN (${demoUserIds})` : ''}
    `);
    otherRemoved += delWd.changes;

    const delTx = run(`
      DELETE FROM wallet_transactions 
      WHERE id LIKE 'tx_%'
         ${demoUserIds ? `OR user_id IN (${demoUserIds})` : ''}
    `);
    otherRemoved += delTx.changes;

    // 4. Remove Demo Users & their Wallets
    if (demoUserIds) {
      const delWallets = run(`DELETE FROM wallets WHERE user_id IN (${demoUserIds})`);
      const delUsers = run(`DELETE FROM users WHERE id IN (${demoUserIds}) AND role NOT IN ('SUPER_ADMIN', 'ADMIN')`);
      usersRemoved = delUsers.changes;
      otherRemoved += delWallets.changes;
    }

    // 5. Remove Demo Products & their Images
    const demoProds = query<{ id: string }>(`
      SELECT id FROM products 
      WHERE id LIKE 'prod_1' OR id LIKE 'prod_2' OR id LIKE 'prod_3' OR id LIKE 'prod_4' OR id LIKE 'prod_5'
         OR id LIKE 'prod_6' OR id LIKE 'prod_7' OR id LIKE 'prod_8' OR id LIKE 'prod_9' OR id LIKE 'prod_10'
         OR sku LIKE 'ROZ-LAWN-%' OR sku LIKE 'ROZ-MEN-%' OR sku LIKE 'ROZ-AUD-%' OR sku LIKE 'ROZ-KIT-%' OR sku LIKE 'ROZ-BEA-%'
    `);
    const demoProdIds = demoProds.map(p => `'${p.id}'`).join(',');

    if (demoProdIds) {
      const delImages = run(`DELETE FROM product_images WHERE product_id IN (${demoProdIds})`);
      const delProds = run(`DELETE FROM products WHERE id IN (${demoProdIds})`);
      productsRemoved = delProds.changes;
      otherRemoved += delImages.changes;
    }

    // 6. Remove Demo Suppliers
    const delSup = run(`
      DELETE FROM suppliers 
      WHERE id IN ('sup_1', 'sup_2') OR name LIKE '%Khaadi Textiles Wholesale Hub%' OR name LIKE '%Metro Gadgets & Electronics Direct%'
    `);
    otherRemoved += delSup.changes;

    // 7. Remove Demo Notifications
    const delNotif = run(`
      DELETE FROM notifications 
      WHERE id IN ('notif_1', 'notif_2', 'notif_admin_1')
         ${demoUserIds ? `OR user_id IN (${demoUserIds})` : ''}
    `);
    otherRemoved += delNotif.changes;

    // 8. Record Activity Log
    const now = new Date().toISOString();
    run(`
      INSERT INTO admin_activity_logs (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, 'DEMO_DATA_CLEANUP', 'SYSTEM', 'MAINTENANCE', ?, ?)
    `, [
      `log_clean_${Date.now()}`,
      adminId,
      `Removed ${usersRemoved} demo users, ${productsRemoved} demo products, ${ordersRemoved} demo orders, and ${otherRemoved} other test records.`,
      now
    ]);

    saveDb();

    return {
      usersRemoved,
      productsRemoved,
      ordersRemoved,
      otherRemoved
    };
  });
}

function createSchema(): void {
  const db = getDb();
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'RESELLER',
      status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      business_name TEXT,
      city TEXT,
      approved_at TEXT,
      approved_by TEXT,
      rejected_at TEXT,
      rejected_by TEXT,
      rejection_reason TEXT,
      suspended_at TEXT,
      suspended_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      address TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subcategories (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      subcategory_id TEXT,
      supplier_id TEXT NOT NULL,
      supplier_cost REAL NOT NULL,
      base_price REAL NOT NULL,
      min_selling_price REAL NOT NULL,
      max_selling_price REAL NOT NULL,
      delivery_charge REAL NOT NULL DEFAULT 150,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      description TEXT,
      specifications TEXT,
      rating REAL DEFAULT 4.8,
      reviews_count INTEGER DEFAULT 16,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      reseller_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_province TEXT NOT NULL,
      customer_city TEXT NOT NULL,
      customer_area TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      customer_landmark TEXT,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      status TEXT NOT NULL DEFAULT 'PENDING',
      courier TEXT DEFAULT 'TCS Courier',
      tracking_number TEXT,
      subtotal REAL NOT NULL,
      delivery_charge REAL NOT NULL,
      total_amount REAL NOT NULL,
      total_base_amount REAL NOT NULL,
      total_supplier_cost REAL NOT NULL,
      reseller_profit REAL NOT NULL,
      profit_released INTEGER NOT NULL DEFAULT 0,
      profit_released_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (reseller_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_reseller ON orders(reseller_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      supplier_cost REAL NOT NULL,
      base_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      profit_per_unit REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      comment TEXT,
      changed_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      pending_balance REAL NOT NULL DEFAULT 0,
      available_balance REAL NOT NULL DEFAULT 0,
      withdrawn_balance REAL NOT NULL DEFAULT 0,
      total_earned REAL NOT NULL DEFAULT 0,
      total_refunded REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_id TEXT,
      withdrawal_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);

    CREATE TABLE IF NOT EXISTS withdrawals (
      id TEXT PRIMARY KEY,
      withdrawal_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      account_title TEXT NOT NULL,
      account_number TEXT NOT NULL,
      payment_details TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      admin_note TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
    CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      data TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );
  `);
  saveDb();
}

function seedDatabase(): void {
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // Settings
  const settings = [
    { key: 'site_name', value: 'Rozgar Reseller Network', description: 'Platform Title' },
    { key: 'currency', value: 'PKR', description: 'Platform Currency' },
    { key: 'currency_symbol', value: 'Rs.', description: 'Currency Symbol' },
    { key: 'min_withdrawal', value: '500', description: 'Minimum balance to request withdrawal' },
    { key: 'default_delivery_charge', value: '150', description: 'Standard delivery fee' },
    { key: 'return_period_days', value: '7', description: 'Days after delivery before profit auto-releases' },
    { key: 'support_whatsapp', value: '+92 300 1234567', description: 'Official WhatsApp Helpdesk' },
    { key: 'min_reseller_margin', value: '50', description: 'Minimum required profit margin per item' },
    { key: 'max_reseller_margin', value: '1500', description: 'Maximum allowed profit margin per item' }
  ];

  for (const s of settings) {
    run('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)', [s.key, s.value, s.description]);
  }

  // Roles
  run("INSERT INTO roles VALUES ('r_super_admin', 'SUPER_ADMIN', 'Platform Owner with full control')");
  run("INSERT INTO roles VALUES ('r_admin', 'ADMIN', 'Store Administrator')");
  run("INSERT INTO roles VALUES ('r_support', 'SUPPORT', 'Order Support Agent')");
  run("INSERT INTO roles VALUES ('r_reseller', 'RESELLER', 'Independent Merchant/Reseller')");

  // Users: 1 Super Admin, 1 Admin, 5 Resellers
  const users = [
    {
      id: 'usr_superadmin',
      name: 'Ali Sher (Platform Owner)',
      email: 'admin@rozgar.pk',
      phone: '03001234567',
      username: 'alisher',
      role: 'SUPER_ADMIN',
      business_name: 'Rozgar HQ',
      city: 'Lahore'
    },
    {
      id: 'usr_admin2',
      name: 'Fatima Noor (Operations)',
      email: 'ops@rozgar.pk',
      phone: '03019876543',
      username: 'fatima_ops',
      role: 'ADMIN',
      business_name: 'Rozgar Fulfillment',
      city: 'Karachi'
    },
    {
      id: 'usr_reseller_1',
      name: 'Ayesha Khan',
      email: 'ayesha.reseller@gmail.com',
      phone: '03123456789',
      username: 'ayeshacollections',
      role: 'RESELLER',
      business_name: 'Ayesha Boutique & Lawn',
      city: 'Faisalabad'
    },
    {
      id: 'usr_reseller_2',
      name: 'Hamza Tariq',
      email: 'hamza.tech@gmail.com',
      phone: '03214567890',
      username: 'hamzastyle',
      role: 'RESELLER',
      business_name: 'Hamza Men Fashion',
      city: 'Rawalpindi'
    },
    {
      id: 'usr_reseller_3',
      name: 'Zainab Bibi',
      email: 'zainab.reseller@gmail.com',
      phone: '03335678901',
      username: 'zainabtrends',
      role: 'RESELLER',
      business_name: 'Zainab Kitchen & Home',
      city: 'Multan'
    },
    {
      id: 'usr_reseller_4',
      name: 'Bilal Ahmed',
      email: 'bilal.gadgets@gmail.com',
      phone: '03456789012',
      username: 'bilalgadgets',
      role: 'RESELLER',
      business_name: 'Smart Gadget Hub',
      city: 'Peshawar'
    },
    {
      id: 'usr_reseller_5',
      name: 'Maryam Siddiqui',
      email: 'maryam.deals@gmail.com',
      phone: '03157890123',
      username: 'maryamdeals',
      role: 'RESELLER',
      business_name: 'Maryam Reseller Store',
      city: 'Gujranwala'
    }
  ];

  for (const u of users) {
    run(
      `INSERT INTO users (id, name, email, phone, username, password_hash, role, status, business_name, city, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)`,
      [u.id, u.name, u.email, u.phone, u.username, passwordHash, u.role, u.business_name, u.city, now, now]
    );

    // Initial wallet for each user
    const pendingBal = u.id === 'usr_reseller_1' ? 950 : u.id === 'usr_reseller_2' ? 500 : 0;
    const availBal = u.id === 'usr_reseller_1' ? 3200 : u.id === 'usr_reseller_2' ? 1800 : u.id === 'usr_reseller_3' ? 850 : 250;
    const withdrawnBal = u.id === 'usr_reseller_1' ? 4000 : 0;
    const totalEarned = availBal + withdrawnBal + (u.id === 'usr_reseller_1' ? 1200 : 0);

    run(
      `INSERT INTO wallets (id, user_id, pending_balance, available_balance, withdrawn_balance, total_earned, total_refunded, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [`wlt_${u.id}`, u.id, pendingBal, availBal, withdrawnBal, totalEarned, now]
    );
  }

  // Suppliers (2 wholesale suppliers)
  run(
    `INSERT INTO suppliers (id, name, phone, whatsapp, address, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
    ['sup_1', 'Khaadi Textiles Wholesale Hub', '042-35119922', '03008889911', 'Azam Cloth Market, Shah Alam, Lahore', 'Top lawn and unstitched vendor. 2-day dispatch.', now]
  );
  run(
    `INSERT INTO suppliers (id, name, phone, whatsapp, address, notes, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
    ['sup_2', 'Metro Gadgets & Electronics Direct', '021-32219900', '03217774433', 'Regal Chowk, Saddar, Karachi', 'OEM consumer electronics importer. Direct batch warranty.', now]
  );

  // Categories (5 categories)
  const categories = [
    { id: 'cat_women', name: "Women's Fashion", slug: 'womens-fashion', image: '/src/assets/images/product_embroidered_kurti_1790877397139.jpg' },
    { id: 'cat_men', name: "Men's Apparel & Accessories", slug: 'mens-apparel', image: '/src/assets/images/product_leather_wallet_1790877407119.jpg' },
    { id: 'cat_electronics', name: 'Electronics & Audio', slug: 'electronics-audio', image: '/src/assets/images/product_wireless_earbuds_1790877417427.jpg' },
    { id: 'cat_home', name: 'Kitchen & Home Living', slug: 'kitchen-home', image: '/src/assets/images/product_kitchen_chopper_1790877428042.jpg' },
    { id: 'cat_beauty', name: 'Beauty & Personal Care', slug: 'beauty-care', image: '/src/assets/images/hero_reseller_app_1790877386517.jpg' }
  ];

  for (const c of categories) {
    run('INSERT INTO categories (id, name, slug, image_url, status, created_at) VALUES (?, ?, ?, ?, "ACTIVE", ?)', [
      c.id, c.name, c.slug, c.image, now
    ]);
  }

  // Subcategories
  run("INSERT INTO subcategories VALUES ('sub_lawn', 'cat_women', 'Embroidered Lawn Suits', 'embroidered-lawn', 'ACTIVE')");
  run("INSERT INTO subcategories VALUES ('sub_wallets', 'cat_men', 'Leather Wallets & Sets', 'leather-wallets', 'ACTIVE')");
  run("INSERT INTO subcategories VALUES ('sub_audio', 'cat_electronics', 'Wireless TWS Earbuds', 'wireless-earbuds', 'ACTIVE')");
  run("INSERT INTO subcategories VALUES ('sub_kitchen', 'cat_home', 'Electric Choppers & Blenders', 'electric-choppers', 'ACTIVE')");

  // Products (10 high quality wholesale products with realistic Pakistani reseller economics)
  // Example from prompt:
  // Supplier Cost: Rs. 800, Base Price: Rs. 1000, Reseller can sell at Rs. 1250 (profit Rs. 250)
  const products = [
    {
      id: 'prod_1',
      name: 'Luxury 3-Piece Stitched Embroidered Lawn Suit',
      slug: 'luxury-3pc-embroidered-lawn-suit',
      sku: 'ROZ-LAWN-001',
      category_id: 'cat_women',
      subcategory_id: 'sub_lawn',
      supplier_id: 'sup_1',
      supplier_cost: 1600, // Wholesale supplier price
      base_price: 2100,    // Platform base price (reseller cost)
      min_selling_price: 2100,
      max_selling_price: 3500,
      delivery_charge: 180,
      stock: 65,
      rating: 4.9,
      reviews_count: 38,
      description: 'Handcrafted embroidered organza neckline with printed pure lawn shirt, dyed cambric trouser, and printed voil dupatta. Fully stitched in standard medium/large sizes with premium interlock stitching.',
      specifications: 'Fabric: 100% Fine Lawn\nPieces: 3 (Shirt, Trouser, Dupatta)\nStitching: Ready to Wear\nCare: Hand wash or dry clean',
      image: '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'
    },
    {
      id: 'prod_2',
      name: 'Vintage Full-Grain Leather Wallet & Quartz Watch Gift Set',
      slug: 'vintage-leather-wallet-watch-set',
      sku: 'ROZ-MEN-002',
      category_id: 'cat_men',
      subcategory_id: 'sub_wallets',
      supplier_id: 'sup_1',
      supplier_cost: 800,  // Exact prompt example: Supplier Cost = 800
      base_price: 1000,   // Base price = 1000
      min_selling_price: 1000,
      max_selling_price: 1800,
      delivery_charge: 150,
      stock: 120,
      rating: 4.8,
      reviews_count: 24,
      description: 'Genuine cowhide brown bifold wallet with 8 card slots, dual cash compartments, and matching minimalist quartz wrist watch with stainless steel buckle. Packaged in a velvet gift box.',
      specifications: 'Material: Genuine Leather\nColor: Dark Walnut Brown\nBox: Velvet Presentation Case\nWatch: Japanese Quartz Movement',
      image: '/src/assets/images/product_leather_wallet_1790877407119.jpg'
    },
    {
      id: 'prod_3',
      name: 'Pro ANC Wireless Earbuds with Digital LED Display',
      slug: 'pro-anc-wireless-earbuds-led',
      sku: 'ROZ-AUD-003',
      category_id: 'cat_electronics',
      subcategory_id: 'sub_audio',
      supplier_id: 'sup_2',
      supplier_cost: 950,
      base_price: 1350,
      min_selling_price: 1350,
      max_selling_price: 2400,
      delivery_charge: 150,
      stock: 85,
      rating: 4.7,
      reviews_count: 52,
      description: 'True Wireless Stereo Bluetooth 5.3 earbuds featuring Active Noise Cancellation, punchy bass 13mm drivers, smart touch sensors, and a digital LED power display case with 36-hour playback.',
      specifications: 'Bluetooth: v5.3 + EDR\nBattery Life: 6h per charge + 30h case\nWater Resistance: IPX5 Splashproof\nCharging: Type-C Fast Charge',
      image: '/src/assets/images/product_wireless_earbuds_1790877417427.jpg'
    },
    {
      id: 'prod_4',
      name: 'Stainless Steel 2L Multi-Blade Electric Food Chopper',
      slug: 'stainless-steel-2l-electric-chopper',
      sku: 'ROZ-KIT-004',
      category_id: 'cat_home',
      subcategory_id: 'sub_kitchen',
      supplier_id: 'sup_2',
      supplier_cost: 1400,
      base_price: 1850,
      min_selling_price: 1850,
      max_selling_price: 2900,
      delivery_charge: 200,
      stock: 45,
      rating: 4.9,
      reviews_count: 41,
      description: 'High-torque 350W pure copper motor with 4-dimensional S-shaped dual stainless steel blades. Chops mutton, chicken mince, onions, garlic, and nuts in just 6 seconds with dual speed control.',
      specifications: 'Capacity: 2.0 Liters\nMotor: 350W Pure Copper\nBowl: Shatterproof Food Grade Steel\nSpeed: 2 Speed Pulsing',
      image: '/src/assets/images/product_kitchen_chopper_1790877428042.jpg'
    },
    {
      id: 'prod_5',
      name: 'Organic Rose Water & Vitamin C Brightening Serum Set',
      slug: 'organic-rose-water-vitamin-c-serum',
      sku: 'ROZ-BEA-005',
      category_id: 'cat_beauty',
      subcategory_id: 'sub_lawn',
      supplier_id: 'sup_1',
      supplier_cost: 500,
      base_price: 750,
      min_selling_price: 750,
      max_selling_price: 1500,
      delivery_charge: 120,
      stock: 200,
      rating: 4.8,
      reviews_count: 19,
      description: 'Pure steam-distilled Kashmiri rose water toner (120ml spray) paired with 20% Vitamin C Hyaluronic brightening facial serum (30ml). Reduces dark spots, tightens pores, and deeply hydrates.',
      specifications: 'Ingredients: Pure Kashmiri Rose, 20% L-Ascorbic Acid, Hyaluronic Acid\nVolume: 120ml + 30ml\nSkin Type: All Skin Types',
      image: '/src/assets/images/hero_reseller_app_1790877386517.jpg'
    },
    {
      id: 'prod_6',
      name: 'Chiffon Embroidered Wedding Party Dupatta & Shawl',
      slug: 'chiffon-embroidered-party-dupatta',
      sku: 'ROZ-LAWN-006',
      category_id: 'cat_women',
      subcategory_id: 'sub_lawn',
      supplier_id: 'sup_1',
      supplier_cost: 850,
      base_price: 1200,
      min_selling_price: 1200,
      max_selling_price: 2200,
      delivery_charge: 150,
      stock: 50,
      rating: 4.7,
      reviews_count: 14,
      description: 'Intricate zari and sequin border embroidery on soft crinkle chiffon. Generous 2.5-meter length suitable for weddings, festive Eid functions, and formal dinner wear.',
      specifications: 'Fabric: Pure Crinkle Chiffon\nLength: 2.5 Meters\nEmbroidery: Zari & Sequins Border Work',
      image: '/src/assets/images/product_embroidered_kurti_1790877397139.jpg'
    },
    {
      id: 'prod_7',
      name: 'Men Ultra-Slim Reversible Black/Brown Formal Belt',
      slug: 'men-ultra-slim-reversible-leather-belt',
      sku: 'ROZ-MEN-007',
      category_id: 'cat_men',
      subcategory_id: 'sub_wallets',
      supplier_id: 'sup_1',
      supplier_cost: 450,
      base_price: 680,
      min_selling_price: 680,
      max_selling_price: 1350,
      delivery_charge: 140,
      stock: 90,
      rating: 4.6,
      reviews_count: 11,
      description: '360-degree rotating buckle allows switching between classic matte black and rich mahogany brown leather with one pull. Alloy buckle with scratch-resistant coating.',
      specifications: 'Material: Microfiber Reinforced Leather\nWidth: 35mm\nSizes: 30 to 44 Inches (Adjustable)',
      image: '/src/assets/images/product_leather_wallet_1790877407119.jpg'
    },
    {
      id: 'prod_8',
      name: 'Smart Fitness Tracker with Blood Oxygen & Heart Rate Monitor',
      slug: 'smart-fitness-tracker-band',
      sku: 'ROZ-AUD-008',
      category_id: 'cat_electronics',
      subcategory_id: 'sub_audio',
      supplier_id: 'sup_2',
      supplier_cost: 1100,
      base_price: 1550,
      min_selling_price: 1550,
      max_selling_price: 2700,
      delivery_charge: 150,
      stock: 70,
      rating: 4.7,
      reviews_count: 31,
      description: '1.47-inch vibrant curved AMOLED color screen with 24/7 heart rate tracking, SpO2 monitor, sleep analytics, 15 sport modes, and WhatsApp call/message notifications with 10-day standby.',
      specifications: 'Display: 1.47 inch AMOLED\nBattery: 10 Days Typical Use\nWaterproof: 5ATM\nApp: Android & iOS compatible',
      image: '/src/assets/images/product_wireless_earbuds_1790877417427.jpg'
    },
    {
      id: 'prod_9',
      name: 'Electric Hot Water Kettle 1.8L Fast Boiling Steel',
      slug: 'electric-hot-water-kettle-1-8l',
      sku: 'ROZ-KIT-009',
      category_id: 'cat_home',
      subcategory_id: 'sub_kitchen',
      supplier_id: 'sup_2',
      supplier_cost: 850,
      base_price: 1250,
      min_selling_price: 1250,
      max_selling_price: 2100,
      delivery_charge: 180,
      stock: 55,
      rating: 4.8,
      reviews_count: 22,
      description: 'Double-wall cool-touch stainless steel interior boiling kettle. 1500W rapid heating element boils 1.8 liters in under 4 minutes with auto shut-off and boil-dry safety protection.',
      specifications: 'Capacity: 1.8 Liters\nPower: 1500W\nBody: Dual Wall 304 Stainless Steel',
      image: '/src/assets/images/product_kitchen_chopper_1790877428042.jpg'
    },
    {
      id: 'prod_10',
      name: 'Moroccan Argan Hair Repair Oil & Serum 100ml',
      slug: 'moroccan-argan-hair-repair-oil',
      sku: 'ROZ-BEA-010',
      category_id: 'cat_beauty',
      subcategory_id: 'sub_lawn',
      supplier_id: 'sup_1',
      supplier_cost: 600,
      base_price: 900,
      min_selling_price: 900,
      max_selling_price: 1750,
      delivery_charge: 120,
      stock: 140,
      rating: 4.9,
      reviews_count: 47,
      description: 'Cold-pressed Moroccan Argan kernel oil infused with Keratin and Vitamin E. Eliminates frizz, seals split ends, restores natural hair shine and protects against styling heat.',
      specifications: 'Volume: 100ml Glass Pump Bottle\nExtraction: Cold-Pressed Organic\nApplication: Leave-in serum or hot oil treatment',
      image: '/src/assets/images/hero_reseller_app_1790877386517.jpg'
    }
  ];

  for (const p of products) {
    run(
      `INSERT INTO products (id, name, slug, sku, category_id, subcategory_id, supplier_id, supplier_cost, base_price, min_selling_price, max_selling_price, delivery_charge, stock, status, description, specifications, rating, reviews_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.name, p.slug, p.sku, p.category_id, p.subcategory_id, p.supplier_id,
        p.supplier_cost, p.base_price, p.min_selling_price, p.max_selling_price,
        p.delivery_charge, p.stock, p.description, p.specifications, p.rating, p.reviews_count, now, now
      ]
    );

    // Primary image
    run('INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, 1, 0)', [
      `img_${p.id}`, p.id, p.image
    ]);
  }

  // 10 Sample Orders showing different lifecycle states
  // Example prompt:
  // Supplier Cost: Rs. 800, Platform Base: Rs. 1000, Reseller Selling Price: Rs. 1250, Reseller Profit = Rs. 250
  const sampleOrders = [
    {
      id: 'ord_101',
      order_number: 'RZ-9841',
      reseller_id: 'usr_reseller_1',
      customer_name: 'Sadia Imran',
      customer_phone: '03004455667',
      customer_province: 'Punjab',
      customer_city: 'Lahore',
      customer_area: 'DHA Phase 5',
      customer_address: 'House 142, Street 8, Sector C',
      customer_landmark: 'Near Jalal Sons',
      status: 'DELIVERED',
      profit_released: 1, // Profit already released to available balance
      profit_released_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      tracking_number: 'TCS78912301',
      items: [{ product_id: 'prod_1', qty: 1, selling_price: 2600, base_price: 2100, supplier_cost: 1600 }]
    },
    {
      id: 'ord_102',
      order_number: 'RZ-9842',
      reseller_id: 'usr_reseller_1',
      customer_name: 'Kamran Siddique',
      customer_phone: '03218899001',
      customer_province: 'Punjab',
      customer_city: 'Faisalabad',
      customer_area: 'People\'s Colony No 1',
      customer_address: 'Plot 45-B, ChenOne Road',
      customer_landmark: 'Opposite Shell Pump',
      status: 'SHIPPED',
      profit_released: 0, // Profit in pending!
      tracking_number: 'TCS78912302',
      items: [{ product_id: 'prod_2', qty: 1, selling_price: 1250, base_price: 1000, supplier_cost: 800 }]
    },
    {
      id: 'ord_103',
      order_number: 'RZ-9843',
      reseller_id: 'usr_reseller_1',
      customer_name: 'Mehwish Naveed',
      customer_phone: '03332211998',
      customer_province: 'Sindh',
      customer_city: 'Karachi',
      customer_area: 'Gulshan-e-Iqbal Block 13D',
      customer_address: 'Flat 402, Al-Razi Heights',
      customer_landmark: 'Near Disco Bakery',
      status: 'READY_TO_SHIP',
      profit_released: 0,
      tracking_number: 'TCS78912303',
      items: [{ product_id: 'prod_4', qty: 1, selling_price: 2350, base_price: 1850, supplier_cost: 1400 }]
    },
    {
      id: 'ord_104',
      order_number: 'RZ-9844',
      reseller_id: 'usr_reseller_2',
      customer_name: 'Umer Farooq',
      customer_phone: '03451122334',
      customer_province: 'Punjab',
      customer_city: 'Rawalpindi',
      customer_area: 'Bahria Town Phase 7',
      customer_address: 'Villa 88, Spring North',
      customer_landmark: 'Near Clock Tower',
      status: 'CONFIRMED',
      profit_released: 0,
      tracking_number: null,
      items: [{ product_id: 'prod_3', qty: 1, selling_price: 1850, base_price: 1350, supplier_cost: 950 }]
    },
    {
      id: 'ord_105',
      order_number: 'RZ-9845',
      reseller_id: 'usr_reseller_2',
      customer_name: 'Tariq Mehmood',
      customer_phone: '03134445566',
      customer_province: 'KPK',
      customer_city: 'Peshawar',
      customer_area: 'Hayatabad Phase 3',
      customer_address: 'Street 4, Sector B2',
      customer_landmark: 'Near Tatara Park',
      status: 'DELIVERED',
      profit_released: 1,
      profit_released_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      tracking_number: 'TCS78912305',
      items: [{ product_id: 'prod_2', qty: 2, selling_price: 1250, base_price: 1000, supplier_cost: 800 }]
    },
    {
      id: 'ord_106',
      order_number: 'RZ-9846',
      reseller_id: 'usr_reseller_3',
      customer_name: 'Saima Bano',
      customer_phone: '03029988776',
      customer_province: 'Punjab',
      customer_city: 'Multan',
      customer_area: 'Bosan Road',
      customer_address: 'House 12, Officers Colony',
      customer_landmark: 'Near Chungi No 9',
      status: 'PENDING',
      profit_released: 0,
      tracking_number: null,
      items: [{ product_id: 'prod_5', qty: 2, selling_price: 1100, base_price: 750, supplier_cost: 500 }]
    },
    {
      id: 'ord_107',
      order_number: 'RZ-9847',
      reseller_id: 'usr_reseller_3',
      customer_name: 'Farhan Ali',
      customer_phone: '03223344556',
      customer_province: 'Sindh',
      customer_city: 'Hyderabad',
      customer_area: 'Latifabad Unit 7',
      customer_address: 'Bungalow 21, Street 3',
      customer_landmark: 'Near Citizen Club',
      status: 'OUT_FOR_DELIVERY',
      profit_released: 0,
      tracking_number: 'TCS78912307',
      items: [{ product_id: 'prod_9', qty: 1, selling_price: 1600, base_price: 1250, supplier_cost: 850 }]
    },
    {
      id: 'ord_108',
      order_number: 'RZ-9848',
      reseller_id: 'usr_reseller_4',
      customer_name: 'Asad Shah',
      customer_phone: '03467788990',
      customer_province: 'Islamabad Capital',
      customer_city: 'Islamabad',
      customer_area: 'F-10/2',
      customer_address: 'House 55, Street 19',
      customer_landmark: 'Near Roundabout',
      status: 'RETURNED',
      profit_released: -1, // Reversed because customer returned!
      tracking_number: 'TCS78912308',
      items: [{ product_id: 'prod_8', qty: 1, selling_price: 2100, base_price: 1550, supplier_cost: 1100 }]
    },
    {
      id: 'ord_109',
      order_number: 'RZ-9849',
      reseller_id: 'usr_reseller_4',
      customer_name: 'Danish Qureshi',
      customer_phone: '03318877665',
      customer_province: 'Punjab',
      customer_city: 'Sialkot',
      customer_area: 'Cantt Area',
      customer_address: 'House 7, Mall Road',
      customer_landmark: 'Near Garrison Club',
      status: 'CANCELLED',
      profit_released: -1, // Cancelled by customer before dispatch
      tracking_number: null,
      items: [{ product_id: 'prod_7', qty: 2, selling_price: 950, base_price: 680, supplier_cost: 450 }]
    },
    {
      id: 'ord_110',
      order_number: 'RZ-9850',
      reseller_id: 'usr_reseller_5',
      customer_name: 'Nida Jamil',
      customer_phone: '03165544332',
      customer_province: 'Punjab',
      customer_city: 'Gujranwala',
      customer_area: 'Model Town',
      customer_address: 'Plot 310, Block B',
      customer_landmark: 'Near Trust Plaza',
      status: 'PROCESSING',
      profit_released: 0,
      tracking_number: 'TCS78912310',
      items: [{ product_id: 'prod_10', qty: 2, selling_price: 1300, base_price: 900, supplier_cost: 600 }]
    }
  ];

  for (const o of sampleOrders) {
    let subtotal = 0;
    let totalBase = 0;
    let totalSupplier = 0;
    let resellerProfit = 0;
    const delivery = 150;

    for (const item of o.items) {
      subtotal += item.selling_price * item.qty;
      totalBase += item.base_price * item.qty;
      totalSupplier += item.supplier_cost * item.qty;
      resellerProfit += (item.selling_price - item.base_price) * item.qty;
    }

    const totalAmount = subtotal + delivery;

    run(
      `INSERT INTO orders (id, order_number, reseller_id, customer_name, customer_phone, customer_province, customer_city, customer_area, customer_address, customer_landmark, payment_method, status, courier, tracking_number, subtotal, delivery_charge, total_amount, total_base_amount, total_supplier_cost, reseller_profit, profit_released, profit_released_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COD', ?, 'TCS Courier', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        o.id, o.order_number, o.reseller_id, o.customer_name, o.customer_phone,
        o.customer_province, o.customer_city, o.customer_area, o.customer_address, o.customer_landmark,
        o.status, o.tracking_number, subtotal, delivery, totalAmount, totalBase, totalSupplier,
        resellerProfit, o.profit_released, o.profit_released_at || null, now, now
      ]
    );

    // Items
    for (let i = 0; i < o.items.length; i++) {
      const it = o.items[i];
      const prod = products.find(p => p.id === it.product_id);
      run(
        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, supplier_cost, base_price, selling_price, profit_per_unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `item_${o.id}_${i}`, o.id, it.product_id, prod ? prod.name : 'Sample Product',
          it.qty, it.supplier_cost, it.base_price, it.selling_price, (it.selling_price - it.base_price)
        ]
      );
    }

    // Status history
    run(
      `INSERT INTO order_status_history (id, order_id, status, comment, changed_by, created_at)
       VALUES (?, ?, ?, ?, 'System Migration', ?)`,
      [`hist_${o.id}`, o.id, o.status, `Order created in ${o.status} state`, now]
    );

    // Ledger transactions for these sample orders
    if (o.profit_released === 1) {
      run(
        `INSERT INTO wallet_transactions (id, user_id, order_id, amount, type, status, balance_before, balance_after, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ORDER_PROFIT_RELEASED', 'COMPLETED', 2000, ?, ?, ?, ?)`,
        [`tx_${o.id}_rel`, o.reseller_id, o.id, resellerProfit, 2000 + resellerProfit, `Delivered & Return Cleared - Profit released for Order #${o.order_number}`, o.profit_released_at || now, o.profit_released_at || now]
      );
    } else if (o.profit_released === 0 && o.status !== 'CANCELLED') {
      run(
        `INSERT INTO wallet_transactions (id, user_id, order_id, amount, type, status, balance_before, balance_after, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'ORDER_PROFIT_PENDING', 'PENDING', 0, 0, ?, ?, ?)`,
        [`tx_${o.id}_pend`, o.reseller_id, o.id, resellerProfit, `Pending profit booked for active Order #${o.order_number}`, now, now]
      );
    }
  }

  // Sample Withdrawals
  run(
    `INSERT INTO withdrawals (id, withdrawal_number, user_id, amount, payment_method, account_title, account_number, payment_details, status, admin_note, processed_at, created_at, updated_at)
     VALUES (?, ?, ?, 4000, 'Easypaisa', 'Ayesha Khan', '03123456789', 'Easypaisa Mobile Wallet', 'PAID', 'Approved and paid via Easypaisa Batch Transfer', ?, ?, ?)`,
    ['wd_1', 'WD-8101', 'usr_reseller_1', new Date(Date.now() - 4 * 86400000).toISOString(), new Date(Date.now() - 5 * 86400000).toISOString(), now]
  );
  run(
    `INSERT INTO withdrawals (id, withdrawal_number, user_id, amount, payment_method, account_title, account_number, payment_details, status, admin_note, processed_at, created_at, updated_at)
     VALUES (?, ?, ?, 1000, 'JazzCash', 'Hamza Tariq', '03214567890', 'JazzCash Account', 'PENDING', null, null, ?, ?)`,
    ['wd_2', 'WD-8102', 'usr_reseller_2', now, now]
  );

  // Notifications
  run(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
     VALUES (?, ?, 'Profit Credited!', 'Congratulations! Rs. 500 profit released to your available balance for Order #RZ-9841.', 'PROFIT', 0, ?)`,
    ['notif_1', 'usr_reseller_1', now]
  );
  run(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
     VALUES (?, ?, 'Order Shipped', 'Order #RZ-9842 is dispatched via TCS Tracking TCS78912302.', 'ORDER', 0, ?)`,
    ['notif_2', 'usr_reseller_1', now]
  );
  run(
    `INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
     VALUES (?, 'ADMIN', 'New Withdrawal Request', 'Reseller Hamza Tariq submitted a withdrawal request for Rs. 1,000.', 'WITHDRAWAL', 0, ?)`,
    ['notif_admin_1', now]
  );

  saveDb();
}
