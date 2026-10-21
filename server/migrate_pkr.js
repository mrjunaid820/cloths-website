const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'ecommerce.db');
const backupPath = path.join(__dirname, 'ecommerce.db.bak');
const timestampedBackupPath = path.join(__dirname, `ecommerce.db.backup-${Date.now()}.bak`);

// 1. SAFE BACKUP: Create physical backups
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  fs.copyFileSync(dbPath, timestampedBackupPath);
  console.log(`[BACKUP SUCCESS] Database backed up to:`);
  console.log(`  - ${backupPath}`);
  console.log(`  - ${timestampedBackupPath}`);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 2. SCHEMA EVOLUTION: Add missing columns safely
function addColumnIfNotExists(table, column, def) {
  const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = tableInfo.some(col => col.name === column);
  if (!exists) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`).run();
    console.log(`[SCHEMA] Added column '${column}' to table '${table}'`);
  }
}

// Evolution for products
addColumnIfNotExists('products', 'currency', "TEXT DEFAULT 'PKR'");
addColumnIfNotExists('products', 'legacy_usd_price', 'REAL');
addColumnIfNotExists('products', 'legacy_usd_original_price', 'REAL');
addColumnIfNotExists('products', 'is_published', 'INTEGER DEFAULT 1');
addColumnIfNotExists('products', 'variant_stock', 'TEXT');

// Evolution for orders
addColumnIfNotExists('orders', 'currency', "TEXT DEFAULT 'PKR'");
addColumnIfNotExists('orders', 'courier_name', 'TEXT');
addColumnIfNotExists('orders', 'courier_tracking_number', 'TEXT');
addColumnIfNotExists('orders', 'payment_status', "TEXT DEFAULT 'Pending'");
addColumnIfNotExists('orders', 'payment_reference', 'TEXT');
addColumnIfNotExists('orders', 'city_delivery_type', "TEXT DEFAULT 'Nationwide'");
addColumnIfNotExists('orders', 'cost_price', 'REAL DEFAULT 0');

// Evolution for admins (role-based permissions)
addColumnIfNotExists('admins', 'permissions', "TEXT DEFAULT 'all'");

// 3. CURRENCY & PRICING MIGRATION (Realistic Pakistani Luxury Fashion Pricing)
// Prestigious couture price points in Pakistan
const pkrPriceMap = {
  1: { price: 38500, original_price: 45000 }, // Regal Velvet Shawl Sherwani & Shalwar Set
  2: { price: 52000, original_price: 65000 }, // Monogram Cashmere Tailored Suit
  3: { price: 46000, original_price: 58000 }, // Chantilly Lace Ethereal Silk Gown
  4: { price: 24500, original_price: 31000 }, // Nidha Royal Embellished Abaya & Scarf
  5: { price: 4500,  original_price: 5900 },  // Pure Mulberry Silk Pleated Hijab
  6: { price: 18500, original_price: 22000 }, // Hand-Embroidered Raw Silk Kurta
  7: { price: 11500, original_price: 13500 }, // Giza Egyptian Cotton Luxury Dress Shirt
  8: { price: 4950,  original_price: 5950 },  // Supima Heavyweight Minimalist Tee
  9: { price: 16500, original_price: 19500 }, // Japanese 14oz Selvedge Raw Denim
  10: { price: 14500, original_price: 17500 }, // Pleated Flannel Sartorial Trousers
  11: { price: 12500, original_price: 15500 }, // Junior Heritage Velvet Festive Set
  12: { price: 42000, original_price: 49000 }, // Autumn Trench Coat in Waterproof Gabardine
  13: { price: 28500, original_price: 34500 }, // Sculpted Linen Evening Blazer
  14: { price: 21500, original_price: 26000 }, // Cashmere Knit Turtleneck Sweater
  15: { price: 8500,  original_price: 8500 },  // Kurta
};

const products = db.prepare('SELECT id, name, price, original_price, legacy_usd_price FROM products').all();
const updateProdStmt = db.prepare(`
  UPDATE products 
  SET price = ?, 
      original_price = ?, 
      legacy_usd_price = COALESCE(legacy_usd_price, ?),
      legacy_usd_original_price = COALESCE(legacy_usd_original_price, ?),
      currency = 'PKR',
      is_published = 1
  WHERE id = ?
`);

const migrateProducts = db.transaction(() => {
  for (const p of products) {
    let newPrice, newOrigPrice;
    if (pkrPriceMap[p.id]) {
      newPrice = pkrPriceMap[p.id].price;
      newOrigPrice = pkrPriceMap[p.id].original_price;
    } else {
      // If product was added with USD price (< 1000), convert using realistic benchmark (x 100 or x 150)
      if (p.price < 1000) {
        newPrice = Math.round(p.price * 100);
        newOrigPrice = p.original_price ? Math.round(p.original_price * 100) : newPrice;
      } else {
        newPrice = p.price;
        newOrigPrice = p.original_price || p.price;
      }
    }

    updateProdStmt.run(newPrice, newOrigPrice, p.price, p.original_price || p.price, p.id);
  }
});
migrateProducts();
console.log(`[PRODUCTS MIGRATION] Updated ${products.length} products to PKR pricing with legacy audit trail.`);

// 4. MIGRATE EXISTING ORDERS
const orders = db.prepare('SELECT id, subtotal, delivery_fee, discount_amount, total_amount, items, currency FROM orders').all();
const updateOrderStmt = db.prepare(`
  UPDATE orders 
  SET subtotal = ?, 
      delivery_fee = ?, 
      discount_amount = ?, 
      total_amount = ?, 
      items = ?, 
      currency = 'PKR'
  WHERE id = ?
`);

const migrateOrders = db.transaction(() => {
  for (const o of orders) {
    if (o.currency !== 'PKR' || o.total_amount < 1000) {
      // Multiply legacy USD figures by 100 for authentic realistic PKR scale
      const factor = 100;
      const newSubtotal = Math.round(o.subtotal * factor);
      const newDelivery = o.delivery_fee > 0 ? 299 : 0;
      const newDiscount = Math.round((o.discount_amount || 0) * factor);
      const newTotal = newSubtotal - newDiscount + newDelivery;

      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        items = items.map(it => {
          const matched = pkrPriceMap[it.product_id];
          const newUnitPrice = matched ? matched.price : Math.round((it.price || 50) * factor);
          return {
            ...it,
            price: newUnitPrice
          };
        });
      } catch (e) {
        console.error('Failed to parse order items for order', o.id);
      }

      updateOrderStmt.run(newSubtotal, newDelivery, newDiscount, newTotal, JSON.stringify(items), o.id);
    }
  }
});
migrateOrders();
console.log(`[ORDERS MIGRATION] Migrated ${orders.length} historical orders to PKR representation.`);

// 5. UPDATE COUPONS TO PKR REALITY
db.prepare("UPDATE coupons SET min_order_amount = 5000 WHERE code = 'AURA10'").run();
db.prepare("UPDATE coupons SET min_order_amount = 10000 WHERE code = 'LUXE20'").run();
db.prepare("UPDATE coupons SET discount_value = 2500, min_order_amount = 15000 WHERE code = 'VIP50'").run();
console.log('[COUPONS] Updated coupon thresholds for PKR shopping.');

// 6. UPDATE STORE SETTINGS FOR PAKISTAN
const pakistanSettings = {
  store_name: 'AURA ATELIER',
  tagline: 'Haute Couture & Contemporary Sartorial Luxury — Pakistan',
  announcement_bar: 'COMPLIMENTARY NATIONWIDE EXPRESS DELIVERY ACROSS PAKISTAN ON ORDERS OVER RS. 7,500 | USE CODE: AURA10 FOR 10% OFF',
  logo_text: 'AURA ATELIER',
  currency: 'PKR',
  currency_symbol: 'Rs.',
  country: 'Pakistan',
  delivery_charge: '299.00',
  delivery_charge_local: '199.00',
  free_shipping_threshold: '7500.00',
  tax_rate: '0',
  phone: '+92 300 4562872',
  whatsapp_number: '+923004562872',
  email: 'concierge@auraatelier.pk',
  address: 'Flagship Salon: 12-C, MM Alam Road, Gulberg III, Lahore | Boutique Suite: Phase 6, DHA, Karachi, Pakistan',
  google_maps_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.4429792688825!2d74.34863337628357!3d31.511979947621175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919045a55555555%3A0x67dbad97a3cfad28!2sM.M.%20Alam%20Rd%2C%20Gulberg%20III%2C%20Lahore%2C%20Pakistan!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk',
  opening_hours: 'Monday – Saturday: 11:00 AM – 9:00 PM | Sunday: 2:00 PM – 8:00 PM',
  facebook_url: 'https://facebook.com/auraatelier.pk',
  instagram_url: 'https://instagram.com/auraatelier.pk',
  tiktok_url: 'https://tiktok.com/@auraatelier.pk',
  youtube_url: 'https://youtube.com/@auraatelier.pk',
  return_policy_days: '7',
  courier_list: 'TCS, Leopard Courier, Trax, PostEx, M&P, Call Courier',
  payment_cod_enabled: '1',
  payment_bank_transfer_enabled: '1',
  bank_title: 'AURA ATELIER (PVT) LTD',
  bank_name: 'Meezan Bank Limited (Islamic Banking)',
  bank_account_number: '02010108924512',
  bank_iban: 'PK45MEZN0002010108924512',
  bank_branch: 'MM Alam Road Branch, Lahore',
  raast_id: '03004562872',
  payment_jazzcash_enabled: '1',
  payment_jazzcash_sandbox: '1',
  payment_jazzcash_merchant_id: 'MC12345',
  payment_easypaisa_enabled: '1',
  payment_easypaisa_sandbox: '1',
  payment_easypaisa_store_id: 'EP_STORE_99'
};

const upsertSetting = db.prepare(`
  INSERT INTO settings (key, value)
  VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

for (const [k, v] of Object.entries(pakistanSettings)) {
  upsertSetting.run(k, v);
}
console.log('[SETTINGS] Updated store settings with Pakistani locale, currency, bank, Raast, and couriers.');

db.close();
console.log('[COMPLETE] Migration to PKR successfully finished.');
