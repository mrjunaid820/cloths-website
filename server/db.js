/**
 * ==============================================================================
 * AURA ATELIER — Database Management & Schema Initializer
 * ==============================================================================
 * SQLite relational database driver powered by better-sqlite3:
 * - WAL (Write-Ahead Logging) mode enabled for high-concurrency read throughput
 * - Declarative DDL migrations for:
 *   - Admins & RBAC permissions
 *   - 14 Haute Couture categories
 *   - Luxury garments, variants, pricing, and live inventory
 *   - Client orders, courier consignments, line items, and tracking timelines
 *   - Verified customer reviews & craftsmanship aspect metrics
 *   - Promotional discount coupons & concierge inquiries
 * - Automated initial seeding for boutique settings, products, and default master admin
 * ==============================================================================
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'ecommerce.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance and concurrent reads
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    reset_token TEXT,
    reset_expires TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    item_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price REAL NOT NULL,
    original_price REAL,
    discount INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'Aura Atelier',
    sizes TEXT NOT NULL, -- JSON array e.g. ["S","M","L","XL"]
    colors TEXT NOT NULL, -- JSON array of objects e.g. [{"name":"Noir","hex":"#18181b"},{"name":"Crème","hex":"#f4f1ea"}]
    stock INTEGER NOT NULL DEFAULT 20,
    sku TEXT UNIQUE NOT NULL,
    is_featured INTEGER DEFAULT 0,
    is_sale INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    images TEXT NOT NULL, -- JSON array of image URLs
    rating REAL DEFAULT 4.9,
    review_count INTEGER DEFAULT 18,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    notes TEXT,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    status TEXT DEFAULT 'New', -- 'New', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'
    subtotal REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    coupon_code TEXT,
    items TEXT NOT NULL, -- JSON array of ordered items
    tracking_history TEXT, -- JSON array of status timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
    discount_value REAL NOT NULL,
    min_order_amount REAL DEFAULT 0,
    max_uses INTEGER DEFAULT 100,
    times_used INTEGER DEFAULT 0,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    rating INTEGER NOT NULL,
    title TEXT,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lookbooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    image TEXT NOT NULL,
    description TEXT,
    season TEXT DEFAULT 'Autumn / Winter',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lookbook_hotspots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lookbook_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    x_percent REAL NOT NULL,
    y_percent REAL NOT NULL,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lookbook_id) REFERENCES lookbooks(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS price_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_email TEXT NOT NULL,
    target_price REAL NOT NULL,
    is_notified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notified_at DATETIME,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS seasonal_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT DEFAULT 'Limited Edition Capsule',
    banner_image TEXT NOT NULL,
    cta_text TEXT DEFAULT 'Explore Collection',
    cta_link TEXT DEFAULT 'shop',
    accent_color TEXT DEFAULT '#d4af37',
    particle_effect TEXT DEFAULT 'gold_shimmer',
    is_active INTEGER DEFAULT 1,
    start_date TEXT,
    end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_username TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details TEXT NOT NULL,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS size_guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT UNIQUE NOT NULL,
    gender TEXT DEFAULT 'Unisex',
    description TEXT,
    measurements_json TEXT NOT NULL,
    fit_tips TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    voter_identifier TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, voter_identifier),
    FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE
  );
`);

// Dynamic schema migrations for reviews table enhancements
try {
  const reviewColumns = db.prepare("PRAGMA table_info(reviews)").all().map(c => c.name);
  if (!reviewColumns.includes('order_id')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN order_id TEXT").run();
  }
  if (!reviewColumns.includes('is_verified')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN is_verified INTEGER DEFAULT 0").run();
  }
  if (!reviewColumns.includes('photos')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN photos TEXT DEFAULT '[]'").run();
  }
  if (!reviewColumns.includes('fabric_rating')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN fabric_rating INTEGER").run();
  }
  if (!reviewColumns.includes('stitching_rating')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN stitching_rating INTEGER").run();
  }
  if (!reviewColumns.includes('fit_rating')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN fit_rating INTEGER").run();
  }
  if (!reviewColumns.includes('color_rating')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN color_rating INTEGER").run();
  }
  if (!reviewColumns.includes('delivery_rating')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN delivery_rating INTEGER").run();
  }
  if (!reviewColumns.includes('helpful_count')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0").run();
  }
  if (!reviewColumns.includes('status')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN status TEXT DEFAULT 'approved'").run();
  }
  if (!reviewColumns.includes('admin_response')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN admin_response TEXT").run();
  }
  if (!reviewColumns.includes('admin_response_at')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN admin_response_at DATETIME").run();
  }
  if (!reviewColumns.includes('edit_token')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN edit_token TEXT").run();
  }
  if (!reviewColumns.includes('updated_at')) {
    db.prepare("ALTER TABLE reviews ADD COLUMN updated_at DATETIME").run();
  }
} catch (migErr) {
  console.error('[DB MIGRATION REVIEWS] Error updating reviews columns:', migErr.message);
}

// Seed Default Admin if none exists
const existingAdmin = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@atelier.com');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO admins (username, email, password_hash, role)
    VALUES (?, ?, ?, 'admin')
  `).run('admin', 'admin@atelier.com', hash);
  console.log('Default admin created: admin@atelier.com / admin123');
}

// Seed Settings
const defaultSettings = {
  store_name: 'AURA ATELIER',
  tagline: 'Haute Couture & Contemporary Sartorial Luxury',
  announcement_bar: 'COMPLIMENTARY WORLDWIDE EXPRESS DELIVERY ON ORDERS OVER $150 | USE CODE: AURA10 FOR 10% OFF',
  logo_text: 'AURA ATELIER',
  currency: '$',
  delivery_charge: '15.00',
  free_shipping_threshold: '150.00',
  tax_rate: '0',
  phone: '+1 (800) 456-AURA',
  whatsapp_number: '+1234567890',
  email: 'concierge@auraatelier.com',
  address: '742 Madison Avenue, Upper East Side, New York, NY 10065',
  google_maps_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3021.879782548232!2d-73.96828592358872!3d40.76790933438902!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c258eb8d58a529%3A0x67dbad97a3cfad28!2sMadison%20Ave%2C%20New%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus',
  opening_hours: 'Monday – Saturday: 10:00 AM – 8:00 PM | Sunday: 12:00 PM – 6:00 PM',
  facebook_url: 'https://facebook.com/auraatelier',
  instagram_url: 'https://instagram.com/auraatelier',
  tiktok_url: 'https://tiktok.com/@auraatelier',
  youtube_url: 'https://youtube.com/@auraatelier',
  return_policy_days: '30'
};

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(defaultSettings)) {
  insertSetting.run(k, v);
}

// Seed Categories
const initialCategories = [
  { name: 'Men', slug: 'men', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop', description: 'Tailored suits, shirts, and timeless masculine classics.' },
  { name: 'Women', slug: 'women', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop', description: 'Graceful haute couture, silk dresses, and chic ensembles.' },
  { name: 'Kids', slug: 'kids', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=1000&auto=format&fit=crop', description: 'Sophisticated yet comfortable luxury fashion for children.' },
  { name: 'Shalwar Qameez', slug: 'shalwar-qameez', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop', description: 'Exquisite eastern heritage craftsmanship with royal finish.' },
  { name: 'Kurta', slug: 'kurta', image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=1000&auto=format&fit=crop', description: 'Bespoke hand-embroidered and premium raw silk kurtas.' },
  { name: 'Shirts', slug: 'shirts', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop', description: 'Egyptian cotton and Italian cut dress shirts.' },
  { name: 'T-Shirts', slug: 't-shirts', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop', description: 'Heavyweight organic pima cotton tees.' },
  { name: 'Jeans', slug: 'jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop', description: 'Selvedge denim crafted with authentic Japanese looms.' },
  { name: 'Pants', slug: 'pants', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop', description: 'Pleated wool trousers and contemporary chinos.' },
  { name: 'Suits', slug: 'suits', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop', description: 'Double-breasted and tuxedo bespoke tailoring.' },
  { name: 'Dresses', slug: 'dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop', description: 'Red carpet evening gowns and breezy summer linen dresses.' },
  { name: 'Abayas', slug: 'abayas', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop', description: 'Modest luxury embellished with French chantilly lace and Nidha silk.' },
  { name: 'Hijabs', slug: 'hijabs', image: 'https://images.unsplash.com/photo-1584297091622-af8e5fd75466?q=80&w=1000&auto=format&fit=crop', description: 'Premium modal, chiffon, and mulberry silk hijabs.' },
  { name: 'Seasonal Collection', slug: 'seasonal-collection', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop', description: 'Curated capsule wardrobes for current and upcoming seasons.' }
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, slug, image, description)
  VALUES (?, ?, ?, ?)
`);

for (const c of initialCategories) {
  insertCategory.run(c.name, c.slug, c.image, c.description);
}

// Seed Coupons
const initialCoupons = [
  { code: 'AURA10', discount_type: 'percentage', discount_value: 10, min_order_amount: 100, max_uses: 500, expires_at: '2027-12-31' },
  { code: 'LUXE20', discount_type: 'percentage', discount_value: 20, min_order_amount: 250, max_uses: 200, expires_at: '2027-12-31' },
  { code: 'VIP50', discount_type: 'fixed', discount_value: 50, min_order_amount: 300, max_uses: 100, expires_at: '2027-12-31' }
];

const insertCoupon = db.prepare(`
  INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);
for (const cp of initialCoupons) {
  insertCoupon.run(cp.code, cp.discount_type, cp.discount_value, cp.min_order_amount, cp.max_uses, cp.expires_at);
}

// Seed Products if none exist
const productCount = db.prepare('SELECT count(*) as count FROM products').get().count;
if (productCount === 0) {
  const products = [
    {
      name: 'Regal Velvet Shawl Sherwani & Shalwar Set',
      slug: 'regal-velvet-shawl-sherwani-shalwar-set',
      price: 380.00,
      original_price: 450.00,
      discount: 16,
      category: 'Shalwar Qameez',
      brand: 'Aura Atelier Imperial',
      sku: 'AA-SQ-001',
      description: 'Handcrafted raw silk sherwani tunic accompanied by a hand-loomed embroidered micro-velvet shawl and tailored matching shalwar. Adorned with delicate zardozi detailing on collar and cuffs for royal soirees.',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      colors: JSON.stringify([
        { name: 'Midnight Jet', hex: '#111827' },
        { name: 'Emerald Velvet', hex: '#064e3b' },
        { name: 'Ivory Pearl', hex: '#fdfbf7' }
      ]),
      stock: 14,
      is_featured: 1,
      is_sale: 1,
      is_new: 1,
      rating: 4.9,
      review_count: 24,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Monogram Cashmere Tailored Suit',
      slug: 'monogram-cashmere-tailored-suit',
      price: 520.00,
      original_price: 650.00,
      discount: 20,
      category: 'Suits',
      brand: 'Aura Sartoriale',
      sku: 'AA-ST-002',
      description: 'Precision cut from double-faced Super 150s Merino wool with silk canvas interior. Unstructured shoulder drape providing modern elegance with Italian peak lapels and horn buttons.',
      sizes: JSON.stringify(['38R', '40R', '42R', '44R', '46R']),
      colors: JSON.stringify([
        { name: 'Charcoal Shadow', hex: '#27272a' },
        { name: 'Navy Sapphire', hex: '#1e3a8a' },
        { name: 'Camel Warmth', hex: '#b45309' }
      ]),
      stock: 18,
      is_featured: 1,
      is_sale: 1,
      is_new: 0,
      rating: 5.0,
      review_count: 42,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Chantilly Lace Ethereal Silk Gown',
      slug: 'chantilly-lace-ethereal-silk-gown',
      price: 460.00,
      original_price: 580.00,
      discount: 21,
      category: 'Dresses',
      brand: 'Aura Privée',
      sku: 'AA-DR-003',
      description: 'Flowing pure mulberry georgette silhouette highlighted by antique gold corded French lace applique. An empire waistline cascading into a dramatic softly pleated floor-length hem.',
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Champagne Gold', hex: '#fef08a' },
        { name: 'Rose Quartz', hex: '#fbcfe8' },
        { name: 'Noir Classic', hex: '#09090b' }
      ]),
      stock: 8,
      is_featured: 1,
      is_sale: 1,
      is_new: 1,
      rating: 4.9,
      review_count: 31,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Nidha Royal Embellished Abaya & Scarf',
      slug: 'nidha-royal-embellished-abaya-scarf',
      price: 245.00,
      original_price: 310.00,
      discount: 21,
      category: 'Abayas',
      brand: 'Aura Modestie',
      sku: 'AA-AB-004',
      description: 'Crafted from ultra-luxurious, lightweight Korean Nidha fabric featuring subtle crystal hand-work along flared kimono sleeves. Includes a coordinated pure georgette wrap.',
      sizes: JSON.stringify(['52', '54', '56', '58', '60']),
      colors: JSON.stringify([
        { name: 'Pure Onyx', hex: '#0f172a' },
        { name: 'Taupe Sand', hex: '#d6d3d1' },
        { name: 'Olive Forest', hex: '#3f6212' }
      ]),
      stock: 22,
      is_featured: 1,
      is_sale: 0,
      is_new: 1,
      rating: 4.8,
      review_count: 19,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584297091622-af8e5fd75466?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Pure Mulberry Silk Pleated Hijab',
      slug: 'pure-mulberry-silk-pleated-hijab',
      price: 65.00,
      original_price: 85.00,
      discount: 24,
      category: 'Hijabs',
      brand: 'Aura Modestie',
      sku: 'AA-HJ-005',
      description: '100% grade 6A mulberry silk with gentle accordion pleats. Breathable, hypoallergenic, with exquisite satin sheen that holds shape effortlessly all day.',
      sizes: JSON.stringify(['Standard 180x75cm']),
      colors: JSON.stringify([
        { name: 'Blush Nude', hex: '#fed7aa' },
        { name: 'Dusty Sage', hex: '#a7f3d0' },
        { name: 'Mocha Crème', hex: '#78350f' },
        { name: 'Midnight', hex: '#1e293b' }
      ]),
      stock: 45,
      is_featured: 0,
      is_sale: 1,
      is_new: 1,
      rating: 4.9,
      review_count: 56,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584297091622-af8e5fd75466?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Hand-Embroidered Raw Silk Kurta',
      slug: 'hand-embroidered-raw-silk-kurta',
      price: 185.00,
      original_price: 220.00,
      discount: 16,
      category: 'Kurta',
      brand: 'Aura Atelier Heritage',
      sku: 'AA-KR-006',
      description: 'Sophisticated mandarin collar kurta cut from hand-spun raw silk. Intricate needlework along placket and cuffs, styled with side vents and mother-of-pearl buttons.',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      colors: JSON.stringify([
        { name: 'Antique Ivory', hex: '#fefce8' },
        { name: 'Slate Azure', hex: '#334155' },
        { name: 'Terracotta Rust', hex: '#c2410c' }
      ]),
      stock: 25,
      is_featured: 1,
      is_sale: 0,
      is_new: 1,
      rating: 4.9,
      review_count: 27,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Giza Egyptian Cotton Luxury Dress Shirt',
      slug: 'giza-egyptian-cotton-luxury-dress-shirt',
      price: 135.00,
      original_price: 160.00,
      discount: 15,
      category: 'Shirts',
      brand: 'Aura Sartoriale',
      sku: 'AA-SH-007',
      description: 'Woven with 200/2 two-ply Egyptian extra-long staple cotton. Cutaway collar, French double cuffs, and split back yoke for seamless movement and pristine drape.',
      sizes: JSON.stringify(['15.0', '15.5', '16.0', '16.5', '17.0']),
      colors: JSON.stringify([
        { name: 'Crisp Optic White', hex: '#ffffff' },
        { name: 'Sky Celeste', hex: '#bae6fd' },
        { name: 'Pink Windsor', hex: '#fbcfe8' }
      ]),
      stock: 30,
      is_featured: 1,
      is_sale: 0,
      is_new: 0,
      rating: 4.8,
      review_count: 38,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Supima Heavyweight Minimalist Tee',
      slug: 'supima-heavyweight-minimalist-tee',
      price: 68.00,
      original_price: 85.00,
      discount: 20,
      category: 'T-Shirts',
      brand: 'Aura Studio',
      sku: 'AA-TS-008',
      description: '280 GSM heavyweight organic Supima cotton. Pre-shrunk relaxed boxy cut, ribbed crew neckline with reinforced double-needle hems. The pinnacle of essential luxury.',
      sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      colors: JSON.stringify([
        { name: 'Off-White Chalk', hex: '#f5f5f4' },
        { name: 'Deep Carbon', hex: '#1c1917' },
        { name: 'Mocha Espresso', hex: '#451a03' }
      ]),
      stock: 50,
      is_featured: 0,
      is_sale: 1,
      is_new: 1,
      rating: 4.7,
      review_count: 49,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Japanese 14oz Selvedge Raw Denim',
      slug: 'japanese-14oz-selvedge-raw-denim',
      price: 210.00,
      original_price: 260.00,
      discount: 19,
      category: 'Jeans',
      brand: 'Aura Atelier Denim',
      sku: 'AA-JN-009',
      description: 'Milled in Okayama on antique shuttle looms. 14oz rope-dyed indigo selvedge with copper rivets, veg-tan leather patch, and button fly. Molds to your body with each wear.',
      sizes: JSON.stringify(['30x32', '32x32', '34x32', '36x34']),
      colors: JSON.stringify([
        { name: 'Deep Indigo', hex: '#1e1b4b' },
        { name: 'Vintage Stone Wash', hex: '#64748b' }
      ]),
      stock: 19,
      is_featured: 1,
      is_sale: 0,
      is_new: 0,
      rating: 4.9,
      review_count: 33,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Pleated Flannel Sartorial Trousers',
      slug: 'pleated-flannel-sartorial-trousers',
      price: 175.00,
      original_price: 220.00,
      discount: 20,
      category: 'Pants',
      brand: 'Aura Sartoriale',
      sku: 'AA-PT-010',
      description: 'Double reverse pleats, side adjusters in place of belt loops, and an extended tab waistband. Cut from breathable virgin wool flannel with an elegant 2-inch cuff.',
      sizes: JSON.stringify(['30', '32', '34', '36', '38']),
      colors: JSON.stringify([
        { name: 'Heather Grey', hex: '#6b7280' },
        { name: 'Midnight Dark Navy', hex: '#0f172a' },
        { name: 'Chocolate Espresso', hex: '#3f2e21' }
      ]),
      stock: 16,
      is_featured: 0,
      is_sale: 1,
      is_new: 1,
      rating: 4.8,
      review_count: 22,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Junior Heritage Velvet Festive Set',
      slug: 'junior-heritage-velvet-festive-set',
      price: 140.00,
      original_price: 175.00,
      discount: 20,
      category: 'Kids',
      brand: 'Aura Bambino',
      sku: 'AA-KD-011',
      description: 'Royal mini collection featuring a plush micro-velvet waistcoat with metallic zari embroidery paired with a soft breathable cotton kurta and pajama for celebrations.',
      sizes: JSON.stringify(['3-4Y', '5-6Y', '7-8Y', '9-10Y', '11-12Y']),
      colors: JSON.stringify([
        { name: 'Royal Burgundy', hex: '#831843' },
        { name: 'Midnight Navy', hex: '#1e3a8a' },
        { name: 'Forest Jade', hex: '#064e3b' }
      ]),
      stock: 20,
      is_featured: 1,
      is_sale: 1,
      is_new: 1,
      rating: 4.9,
      review_count: 15,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Autumn Trench Coat in Waterproof Gabardine',
      slug: 'autumn-trench-coat-waterproof-gabardine',
      price: 490.00,
      original_price: 590.00,
      discount: 17,
      category: 'Seasonal Collection',
      brand: 'Aura Outerwear',
      sku: 'AA-SC-012',
      description: 'Iconic double-breasted silhouette made from weatherproof compact cotton gabardine. Epaulets, horn buckle belt, storm shield, and silk twill signature lining.',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL']),
      colors: JSON.stringify([
        { name: 'Heritage Honey', hex: '#d97706' },
        { name: 'Onyx Black', hex: '#18181b' },
        { name: 'Stone Khaki', hex: '#78716c' }
      ]),
      stock: 12,
      is_featured: 1,
      is_sale: 0,
      is_new: 1,
      rating: 5.0,
      review_count: 28,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Sculpted Linen Evening Blazer',
      slug: 'sculpted-linen-evening-blazer',
      price: 320.00,
      original_price: 390.00,
      discount: 18,
      category: 'Women',
      brand: 'Aura Privée',
      sku: 'AA-WM-013',
      description: 'Hourglass tailored silhouette crafted from pure Belgian flax linen. Sharp padded shoulders with a nipped waistline and gilded engraved button closures.',
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      colors: JSON.stringify([
        { name: 'Ecru Chalk', hex: '#f5f5f4' },
        { name: 'Pistachio Sage', hex: '#bbf7d0' },
        { name: 'Noir Satin', hex: '#0f172a' }
      ]),
      stock: 15,
      is_featured: 1,
      is_sale: 1,
      is_new: 1,
      rating: 4.9,
      review_count: 36,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000&auto=format&fit=crop'
      ])
    },
    {
      name: 'Cashmere Knit Turtleneck Sweater',
      slug: 'cashmere-knit-turtleneck-sweater',
      price: 260.00,
      original_price: 310.00,
      discount: 16,
      category: 'Men',
      brand: 'Aura Sartoriale',
      sku: 'AA-MN-014',
      description: 'Spun from Mongolian grade-A two-ply cashmere yarn. Incredibly soft, featherlight warmth with ribbed roll collar, cuffs, and hem. Pairs effortlessly under tailored jackets.',
      sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
      colors: JSON.stringify([
        { name: 'Oatmeal Heather', hex: '#e7e5e4' },
        { name: 'Charcoal Slate', hex: '#334155' },
        { name: 'Burgundy Wine', hex: '#881337' }
      ]),
      stock: 21,
      is_featured: 1,
      is_sale: 0,
      is_new: 1,
      rating: 4.9,
      review_count: 19,
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop'
      ])
    }
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, slug, price, original_price, discount, category, brand, sku, description,
      sizes, colors, stock, is_featured, is_sale, is_new, rating, review_count, images
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const p of products) {
    insertProduct.run(
      p.name, p.slug, p.price, p.original_price, p.discount, p.category, p.brand, p.sku, p.description,
      p.sizes, p.colors, p.stock, p.is_featured, p.is_sale, p.is_new, p.rating, p.review_count, p.images
    );
  }
  console.log(`Seeded ${products.length} luxury products into catalog.`);
}

// Seed initial orders for dashboard realism
const orderCount = db.prepare('SELECT count(*) as count FROM orders').get().count;
if (orderCount === 0) {
  const initialOrders = [
    {
      id: 'ORD-89412',
      customer_name: 'Lady Eleanor Vance',
      customer_email: 'eleanor.vance@lifestyle.co.uk',
      customer_phone: '+44 7700 900123',
      address: '14 Kensington Palace Gardens',
      city: 'London',
      postal_code: 'W8 4PX',
      notes: 'Please leave with concierge if unavailable.',
      payment_method: 'Direct Bank Transfer',
      status: 'Delivered',
      subtotal: 980.00,
      delivery_fee: 0.00,
      discount_amount: 100.00,
      total_amount: 880.00,
      coupon_code: 'LUXE20',
      items: JSON.stringify([
        { product_id: 2, name: 'Monogram Cashmere Tailored Suit', price: 520.00, quantity: 1, size: '40R', color: 'Charcoal Shadow', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000&auto=format&fit=crop' },
        { product_id: 3, name: 'Chantilly Lace Ethereal Silk Gown', price: 460.00, quantity: 1, size: 'S', color: 'Champagne Gold', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop' }
      ]),
      tracking_history: JSON.stringify([
        { status: 'New', time: '2026-10-01 10:20:00', note: 'Order placed online' },
        { status: 'Confirmed', time: '2026-10-01 11:00:00', note: 'Payment verified' },
        { status: 'Processing', time: '2026-10-01 14:30:00', note: 'Carefully packaged at flagship boutique' },
        { status: 'Shipped', time: '2026-10-02 09:15:00', note: 'Handed to DHL Express courier' },
        { status: 'Delivered', time: '2026-10-04 16:40:00', note: 'Signed for by recipient' }
      ]),
      created_at: '2026-10-01 10:20:00'
    },
    {
      id: 'ORD-91024',
      customer_name: 'Zayn Al-Mansoor',
      customer_email: 'zayn.mansoor@dubai-holdings.ae',
      customer_phone: '+971 50 123 4567',
      address: 'Villa 44, Emirates Hills Grove',
      city: 'Dubai',
      postal_code: '00000',
      notes: 'Call before delivery.',
      payment_method: 'Cash on Delivery',
      status: 'Shipped',
      subtotal: 625.00,
      delivery_fee: 0.00,
      discount_amount: 62.50,
      total_amount: 562.50,
      coupon_code: 'AURA10',
      items: JSON.stringify([
        { product_id: 1, name: 'Regal Velvet Shawl Sherwani & Shalwar Set', price: 380.00, quantity: 1, size: 'L', color: 'Midnight Jet', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1000&auto=format&fit=crop' },
        { product_id: 4, name: 'Nidha Royal Embellished Abaya & Scarf', price: 245.00, quantity: 1, size: '56', color: 'Pure Onyx', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop' }
      ]),
      tracking_history: JSON.stringify([
        { status: 'New', time: '2026-10-07 14:10:00', note: 'Order placed via website' },
        { status: 'Confirmed', time: '2026-10-07 15:30:00', note: 'Order validated with customer' },
        { status: 'Processing', time: '2026-10-08 09:00:00', note: 'Quality inspection passed' },
        { status: 'Shipped', time: '2026-10-08 17:45:00', note: 'Dispatched via Emirates Express' }
      ]),
      created_at: '2026-10-07 14:10:00'
    },
    {
      id: 'ORD-92815',
      customer_name: 'Marcus Sterling',
      customer_email: 'marcus.sterling@manhattan-law.com',
      customer_phone: '+1 (212) 555-0199',
      address: '432 Park Avenue, Penthouse 62B',
      city: 'New York',
      postal_code: '10022',
      notes: 'White glove delivery requested.',
      payment_method: 'Credit Card / Online',
      status: 'Processing',
      subtotal: 395.00,
      delivery_fee: 0.00,
      discount_amount: 0.00,
      total_amount: 395.00,
      coupon_code: null,
      items: JSON.stringify([
        { product_id: 6, name: 'Hand-Embroidered Raw Silk Kurta', price: 185.00, quantity: 1, size: 'XL', color: 'Antique Ivory', image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?q=80&w=1000&auto=format&fit=crop' },
        { product_id: 9, name: 'Japanese 14oz Selvedge Raw Denim', price: 210.00, quantity: 1, size: '34x32', color: 'Deep Indigo', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop' }
      ]),
      tracking_history: JSON.stringify([
        { status: 'New', time: '2026-10-09 08:30:00', note: 'Order placed online' },
        { status: 'Confirmed', time: '2026-10-09 09:15:00', note: 'Payment processed successfully' },
        { status: 'Processing', time: '2026-10-09 11:00:00', note: 'Being pressed and packaged' }
      ]),
      created_at: '2026-10-09 08:30:00'
    },
    {
      id: 'ORD-93041',
      customer_name: 'Sophia Laurent',
      customer_email: 'sophia@atelier-paris.fr',
      customer_phone: '+33 6 12 34 56 78',
      address: '28 Rue du Faubourg Saint-Honoré',
      city: 'Paris',
      postal_code: '75008',
      notes: '',
      payment_method: 'Cash on Delivery',
      status: 'New',
      subtotal: 260.00,
      delivery_fee: 15.00,
      discount_amount: 0.00,
      total_amount: 275.00,
      coupon_code: null,
      items: JSON.stringify([
        { product_id: 14, name: 'Cashmere Knit Turtleneck Sweater', price: 260.00, quantity: 1, size: 'M', color: 'Oatmeal Heather', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1000&auto=format&fit=crop' }
      ]),
      tracking_history: JSON.stringify([
        { status: 'New', time: '2026-10-09 13:45:00', note: 'Order received, pending review' }
      ]),
      created_at: '2026-10-09 13:45:00'
    }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_name, customer_email, customer_phone, address, city, postal_code,
      notes, payment_method, status, subtotal, delivery_fee, discount_amount, total_amount,
      coupon_code, items, tracking_history, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  for (const o of initialOrders) {
    insertOrder.run(
      o.id, o.customer_name, o.customer_email, o.customer_phone, o.address, o.city, o.postal_code,
      o.notes, o.payment_method, o.status, o.subtotal, o.delivery_fee, o.discount_amount, o.total_amount,
      o.coupon_code, o.items, o.tracking_history, o.created_at
    );
  }

  // Seed Customers from orders
  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (name, email, phone, address, city, total_orders, total_spent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertCustomer.run('Lady Eleanor Vance', 'eleanor.vance@lifestyle.co.uk', '+44 7700 900123', '14 Kensington Palace Gardens', 'London', 1, 880.00);
  insertCustomer.run('Zayn Al-Mansoor', 'zayn.mansoor@dubai-holdings.ae', '+971 50 123 4567', 'Villa 44, Emirates Hills Grove', 'Dubai', 1, 562.50);
  insertCustomer.run('Marcus Sterling', 'marcus.sterling@manhattan-law.com', '+1 (212) 555-0199', '432 Park Avenue, Penthouse 62B', 'New York', 1, 395.00);
  insertCustomer.run('Sophia Laurent', 'sophia@atelier-paris.fr', '+33 6 12 34 56 78', '28 Rue du Faubourg Saint-Honoré', 'Paris', 1, 275.00);

  console.log('Seeded sample orders and customers.');
}

// Seed reviews
const reviewCount = db.prepare('SELECT count(*) as count FROM reviews').get().count;
if (reviewCount === 0) {
  const reviews = [
    { product_id: 1, customer_name: 'Hamza Tariq', customer_email: 'hamza@heritage.pk', rating: 5, title: 'Bespoke perfection', comment: 'The velvet drape and gold zardozi collar are breath-taking. Wore it to my brother\'s wedding and received non-stop compliments.' },
    { product_id: 1, customer_name: 'Farhan Qureshi', customer_email: 'farhan@outlook.com', rating: 5, title: 'Flawless craftsmanship', comment: 'Exceptional texture, perfect weight, and imperial finish. Feels genuinely regal.' },
    { product_id: 2, customer_name: 'Julian Sterling', customer_email: 'julian@sterling.com', rating: 5, title: 'Superior to Savile Row', comment: 'The shoulder pitch and unstructured lapel fall gracefully. The Super 150s merino wool has an unrivaled hand feel.' },
    { product_id: 3, customer_name: 'Camilla Dubois', customer_email: 'camilla@paris-art.fr', rating: 5, title: 'Absolute goddess dress', comment: 'Wore this to a charity gala in Monaco. The silk georgette moves like water. Simply sublime.' },
    { product_id: 4, customer_name: 'Maryam Al-Sabah', customer_email: 'maryam@kuwait.net', rating: 5, title: 'Exceptional drape and elegance', comment: 'The Nidha silk is whisper-light yet opaque, and the crystal work on the cuffs is tasteful luxury.' }
  ];

  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const r of reviews) {
    insertReview.run(r.product_id, r.customer_name, r.customer_email, r.rating, r.title, r.comment);
  }
}

// Seed Lookbooks and Hotspots
const lookbookCount = db.prepare('SELECT count(*) as count FROM lookbooks').get().count;
if (lookbookCount === 0) {
  const insertLookbook = db.prepare(`
    INSERT INTO lookbooks (title, subtitle, image, description, season, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const lb1 = insertLookbook.run(
    'Imperial Autumn Soirée',
    'Heirloom Zardozi Embroideries & Royal Micro-Velvet Shawls',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1600&auto=format&fit=crop',
    'Curated evening wear blending classical Mughal heritage cut with regal handcrafted velvet shawls for winter nuptials.',
    'Winter / Festive 2026'
  );

  const lb2 = insertLookbook.run(
    'Metropolitan Sartorial Lineage',
    'Super 150s Merino Wool Suiting & Italian Giza Cotton',
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop',
    'Modern double-breasted suiting with natural shoulders, designed for diplomats and corporate luminaries.',
    'Autumn / Winter 2026'
  );

  const lb3 = insertLookbook.run(
    'Ethereal Modestie & Chantilly Silk',
    'Embellished Korean Nidha Abayas & Mulberry Pleated Hijabs',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1600&auto=format&fit=crop',
    'Subtle crystal handwork along sweeping kimono sleeves with pure mulberry silk headpieces.',
    'Resort & Modestie 2026'
  );

  const insertHotspot = db.prepare(`
    INSERT INTO lookbook_hotspots (lookbook_id, product_id, x_percent, y_percent, label)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Hotspots for lb1 (Lookbook 1)
  insertHotspot.run(lb1.lastInsertRowid, 1, 42.0, 38.0, 'Regal Velvet Sherwani & Shawl');
  insertHotspot.run(lb1.lastInsertRowid, 6, 68.0, 52.0, 'Raw Silk Kurta');

  // Hotspots for lb2 (Lookbook 2)
  insertHotspot.run(lb2.lastInsertRowid, 2, 45.0, 42.0, 'Cashmere Tailored Suit');
  insertHotspot.run(lb2.lastInsertRowid, 7, 52.0, 28.0, 'Giza Egyptian Cotton Shirt');

  // Hotspots for lb3 (Lookbook 3)
  insertHotspot.run(lb3.lastInsertRowid, 4, 46.0, 48.0, 'Royal Embellished Abaya');
  insertHotspot.run(lb3.lastInsertRowid, 5, 48.0, 18.0, 'Mulberry Silk Hijab');

  console.log('Seeded curated lookbooks and interactive outfit hotspots.');
}

// Seed Seasonal Campaigns
const campaignCount = db.prepare('SELECT count(*) as count FROM seasonal_campaigns').get().count;
if (campaignCount === 0) {
  const insertCampaign = db.prepare(`
    INSERT INTO seasonal_campaigns (title, subtitle, badge, banner_image, cta_text, cta_link, accent_color, particle_effect, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCampaign.run(
    'Eid & Festive Couture Edit 2026',
    'Discover our bespoke festive capsule with hand-worked zardozi, imperial brocades, and made-to-measure tailoring.',
    'Limited Festive Capsule',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=2000&auto=format&fit=crop',
    'Shop Festive Collection',
    'shop?category=Shalwar%20Qameez',
    '#d4af37',
    'gold_shimmer',
    1
  );

  console.log('Seeded seasonal promotional campaigns.');
}

// Seed Size Guides
const sizeGuideCount = db.prepare('SELECT count(*) as count FROM size_guides').get().count;
if (sizeGuideCount === 0) {
  const insertGuide = db.prepare(`
    INSERT INTO size_guides (category, gender, description, measurements_json, fit_tips)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertGuide.run(
    'Suits',
    'Men',
    'Imperial structured suiting with natural shoulder drape. All measurements are in inches.',
    JSON.stringify([
      { size: '38R', chest: '38', waist: '32', shoulder: '17.5', jacket_length: '29.5', sleeve: '25.0' },
      { size: '40R', chest: '40', waist: '34', shoulder: '18.0', jacket_length: '30.0', sleeve: '25.5' },
      { size: '42R', chest: '42', waist: '36', shoulder: '18.5', jacket_length: '30.5', sleeve: '26.0' },
      { size: '44R', chest: '44', waist: '38', shoulder: '19.0', jacket_length: '31.0', sleeve: '26.5' },
      { size: '46R', chest: '46', waist: '40', shoulder: '19.5', jacket_length: '31.5', sleeve: '27.0' }
    ]),
    'For broader shoulders, we recommend sizing up one regular chest size. Custom sleeve alterations are available upon request.'
  );

  insertGuide.run(
    'Kurta',
    'Men',
    'Traditional relaxed fit kurta tailored from hand-spun raw silk and combed cotton. Measurements in inches.',
    JSON.stringify([
      { size: 'S', chest: '38', length: '40', shoulder: '17.0', sleeve: '24.5', collar: '15.0' },
      { size: 'M', chest: '40', length: '42', shoulder: '17.5', sleeve: '25.0', collar: '15.5' },
      { size: 'L', chest: '42', length: '44', shoulder: '18.2', sleeve: '25.5', collar: '16.0' },
      { size: 'XL', chest: '45', length: '45', shoulder: '19.0', sleeve: '26.0', collar: '16.5' },
      { size: 'XXL', chest: '48', length: '46', shoulder: '20.0', sleeve: '26.5', collar: '17.0' }
    ]),
    'Cut with 2–3 inches of ease around the chest to ensure regal drape and ease of movement during events.'
  );

  insertGuide.run(
    'Shalwar Qameez',
    'Men',
    'Classic Eastern two-piece ensemble. All measurements in inches.',
    JSON.stringify([
      { size: 'S', chest: '38', shirt_length: '40', shoulder: '17.0', shalwar_length: '40' },
      { size: 'M', chest: '40', shirt_length: '42', shoulder: '17.5', shalwar_length: '41' },
      { size: 'L', chest: '42', shirt_length: '44', shoulder: '18.2', shalwar_length: '42' },
      { size: 'XL', chest: '45', shirt_length: '45', shoulder: '19.0', shalwar_length: '43' },
      { size: 'XXL', chest: '48', shirt_length: '46', shoulder: '20.0', shalwar_length: '44' }
    ]),
    'Standard shalwar includes elastic and drawstring waistband.'
  );

  insertGuide.run(
    'Dresses',
    'Women',
    'Haute couture evening and day silhouettes. All measurements in inches.',
    JSON.stringify([
      { size: 'XS', bust: '32-33', waist: '24-25', hips: '34-35', full_length: '56' },
      { size: 'S', bust: '34-35', waist: '26-27', hips: '36-37', full_length: '57' },
      { size: 'M', bust: '36-37', waist: '28-29', hips: '38-39', full_length: '58' },
      { size: 'L', bust: '38-40', waist: '30-32', hips: '40-42', full_length: '59' },
      { size: 'XL', bust: '41-43', waist: '33-35', hips: '43-45', full_length: '60' }
    ]),
    'Floor-length garments are designed to be worn with 2.5 to 3.5 inch heels. Measure your bust around the fullest part.'
  );

  insertGuide.run(
    'Abayas',
    'Women',
    'Traditional modesty sizing based on client height. Length measured from shoulder to floor in inches.',
    JSON.stringify([
      { size: '52', client_height: "5'0\" - 5'2\"", bust: '42', length: '52', sleeve: '27' },
      { size: '54', client_height: "5'2\" - 5'4\"", bust: '44', length: '54', sleeve: '28' },
      { size: '56', client_height: "5'4\" - 5'6\"", bust: '46', length: '56', sleeve: '28.5' },
      { size: '58', client_height: "5'6\" - 5'8\"", bust: '48', length: '58', sleeve: '29' },
      { size: '60', client_height: "5'8\" - 5'10\"", bust: '50', length: '60', sleeve: '29.5' }
    ]),
    'Choose your abaya size based primarily on your height. Abayas are crafted with ample modest drape.'
  );

  insertGuide.run(
    'Shirts',
    'Men',
    'Tailored dress shirts in Egyptian cotton. Measurements in inches.',
    JSON.stringify([
      { size: '15.0', collar: '15.0', chest: '38', waist: '33', sleeve: '33.5' },
      { size: '15.5', collar: '15.5', chest: '40', waist: '35', sleeve: '34.0' },
      { size: '16.0', collar: '16.0', chest: '42', waist: '37', sleeve: '34.5' },
      { size: '16.5', collar: '16.5', chest: '44', waist: '39', sleeve: '35.0' },
      { size: '17.0', collar: '17.0', chest: '46', waist: '41', sleeve: '35.5' }
    ]),
    'For slim fit preference, take your exact neck measurement.'
  );

  insertGuide.run(
    'Jeans',
    'Unisex',
    'Japanese selvedge raw denim. Measurements in inches.',
    JSON.stringify([
      { size: '30', waist: '31.0', inseam: '32', front_rise: '10.5', thigh: '22.0', leg_opening: '14.5' },
      { size: '32', waist: '33.0', inseam: '32', front_rise: '11.0', thigh: '23.0', leg_opening: '15.0' },
      { size: '34', waist: '35.0', inseam: '34', front_rise: '11.5', thigh: '24.0', leg_opening: '15.5' },
      { size: '36', waist: '37.0', inseam: '34', front_rise: '12.0', thigh: '25.0', leg_opening: '16.0' },
      { size: '38', waist: '39.0', inseam: '34', front_rise: '12.5', thigh: '26.0', leg_opening: '16.5' }
    ]),
    'Raw selvedge will mold to your silhouette after initial wears. Allow approximately 0.5 inches stretch in the waistband.'
  );

  console.log('Seeded comprehensive size guides with measurement charts.');
}

module.exports = db;
