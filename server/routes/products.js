const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { verifyAdmin } = require('../auth');

// Multer storage setup for image uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'prod-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// Helper to parse JSON fields safely
function parseProduct(p) {
  if (!p) return null;
  return {
    ...p,
    currency: p.currency || 'PKR',
    sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : (p.sizes || []),
    colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []),
    images: typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []),
    variant_stock: typeof p.variant_stock === 'string' ? JSON.parse(p.variant_stock) : (p.variant_stock || null),
    is_featured: Boolean(p.is_featured),
    is_sale: Boolean(p.is_sale),
    is_new: Boolean(p.is_new),
    is_published: p.is_published === undefined || p.is_published === null ? true : Boolean(p.is_published)
  };
}

// GET /api/products - Search & Filter (Storefront & Admin)
router.get('/', (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      size,
      color,
      inStock,
      isSale,
      isFeatured,
      isNew,
      includeUnpublished,
      sort = 'newest',
      page = 1,
      limit = 50
    } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Filter out unpublished items for public storefront unless requested by admin
    if (includeUnpublished !== 'true') {
      query += ` AND (is_published = 1 OR is_published IS NULL)`;
    }

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ? OR brand LIKE ? OR sku LIKE ? OR category LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    if (category && category !== 'all' && category !== 'All') {
      query += ` AND (LOWER(category) = LOWER(?) OR LOWER(REPLACE(category, ' ', '-')) = LOWER(?))`;
      params.push(category, category);
    }

    if (minPrice) {
      query += ` AND price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND price <= ?`;
      params.push(Number(maxPrice));
    }

    if (inStock === 'true' || inStock === '1') {
      query += ` AND stock > 0`;
    }

    if (isSale === 'true' || isSale === '1') {
      query += ` AND is_sale = 1`;
    }

    if (isFeatured === 'true' || isFeatured === '1') {
      query += ` AND is_featured = 1`;
    }

    if (isNew === 'true' || isNew === '1') {
      query += ` AND is_new = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY price DESC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC, review_count DESC';
        break;
      case 'popular':
        query += ' ORDER BY review_count DESC, rating DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY id DESC';
        break;
    }

    const allProducts = db.prepare(query).all(...params).map(parseProduct);

    // Filter in-memory for JSON-based nested attributes if requested (size/color)
    let filtered = allProducts;
    if (size) {
      filtered = filtered.filter(p => Array.isArray(p.sizes) && p.sizes.some(s => String(s).toLowerCase() === String(size).toLowerCase()));
    }
    if (color) {
      filtered = filtered.filter(p => Array.isArray(p.colors) && p.colors.some(c => (c.name && c.name.toLowerCase().includes(color.toLowerCase())) || (c.hex && c.hex.toLowerCase() === color.toLowerCase())));
    }

    const total = filtered.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    res.json({
      products: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// GET /api/products/:idOrSlug
router.get('/:idOrSlug', (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product;

    if (/^\d+$/.test(idOrSlug)) {
      product = db.prepare('SELECT * FROM products WHERE id = ?').get(idOrSlug);
    } else {
      product = db.prepare('SELECT * FROM products WHERE slug = ?').get(idOrSlug);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const parsed = parseProduct(product);

    // Fetch related products in the same category
    const related = db.prepare(`
      SELECT * FROM products 
      WHERE category = ? AND id != ? AND (is_published = 1 OR is_published IS NULL)
      ORDER BY rating DESC 
      LIMIT 4
    `).all(product.category, product.id).map(parseProduct);

    res.json({
      product: parsed,
      related
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

// POST /api/products/upload - Admin image upload
router.post('/upload', verifyAdmin, upload.array('images', 8), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const host = req.get('host');
    const protocol = req.protocol;
    const urls = req.files.map(file => `${protocol}://${host}/uploads/${file.filename}`);
    res.json({ urls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

// POST /api/products - Admin create product
router.post('/', verifyAdmin, (req, res) => {
  try {
    const {
      name,
      price,
      original_price,
      discount = 0,
      description,
      category,
      brand = 'Aura Atelier',
      sizes = ['S', 'M', 'L', 'XL'],
      colors = [{ name: 'Black', hex: '#000000' }],
      stock = 20,
      variant_stock = null,
      sku,
      is_featured = false,
      is_sale = false,
      is_new = true,
      is_published = true,
      images = []
    } = req.body;

    if (!name || price === undefined || price === null || !category) {
      return res.status(400).json({ error: 'Name, PKR price, and category are required' });
    }

    // Auto-generate slug and SKU if missing
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    const finalSku = sku || 'AA-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const stmt = db.prepare(`
      INSERT INTO products (
        name, slug, price, original_price, discount, currency, description, category, brand,
        sizes, colors, stock, variant_stock, sku, is_featured, is_sale, is_new, is_published,
        images, rating, review_count
      ) VALUES (?, ?, ?, ?, ?, 'PKR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5.0, 1)
    `);

    const result = stmt.run(
      name.trim(),
      slug,
      Number(price),
      original_price ? Number(original_price) : Number(price),
      Number(discount),
      description || '',
      category,
      brand,
      JSON.stringify(Array.isArray(sizes) ? sizes : [sizes]),
      JSON.stringify(Array.isArray(colors) ? colors : [colors]),
      Number(stock),
      variant_stock ? JSON.stringify(variant_stock) : null,
      finalSku,
      is_featured ? 1 : 0,
      is_sale ? 1 : 0,
      is_new ? 1 : 0,
      is_published !== false ? 1 : 0,
      JSON.stringify(Array.isArray(images) ? images : [images])
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseProduct(created));
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id - Admin update product
router.put('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      original_price,
      discount,
      description,
      category,
      brand,
      sizes,
      colors,
      stock,
      variant_stock,
      sku,
      is_featured,
      is_sale,
      is_new,
      is_published,
      images
    } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stmt = db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        original_price = COALESCE(?, original_price),
        discount = COALESCE(?, discount),
        currency = 'PKR',
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        brand = COALESCE(?, brand),
        sizes = COALESCE(?, sizes),
        colors = COALESCE(?, colors),
        stock = COALESCE(?, stock),
        variant_stock = COALESCE(?, variant_stock),
        sku = COALESCE(?, sku),
        is_featured = COALESCE(?, is_featured),
        is_sale = COALESCE(?, is_sale),
        is_new = COALESCE(?, is_new),
        is_published = COALESCE(?, is_published),
        images = COALESCE(?, images),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      name ? name.trim() : null,
      price !== undefined ? Number(price) : null,
      original_price !== undefined ? Number(original_price) : null,
      discount !== undefined ? Number(discount) : null,
      description !== undefined ? description : null,
      category || null,
      brand || null,
      sizes ? JSON.stringify(sizes) : null,
      colors ? JSON.stringify(colors) : null,
      stock !== undefined ? Number(stock) : null,
      variant_stock !== undefined ? (variant_stock ? JSON.stringify(variant_stock) : null) : null,
      sku || null,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_sale !== undefined ? (is_sale ? 1 : 0) : null,
      is_new !== undefined ? (is_new ? 1 : 0) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      images ? JSON.stringify(images) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    // Audit Log recording
    try {
      const adminUser = req.admin?.username || 'admin';
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      db.prepare(`
        INSERT INTO audit_logs (admin_username, action, entity, entity_id, details, ip_address)
        VALUES (?, 'PRODUCT_UPDATE', 'product', ?, ?, ?)
      `).run(adminUser, String(id), JSON.stringify({ name: updated.name, price: updated.price, stock: updated.stock }), ip);

      // Price Drop Alert check
      if (price !== undefined && Number(price) < existing.price) {
        const alerts = db.prepare(`
          SELECT * FROM price_alerts 
          WHERE product_id = ? AND is_notified = 0 AND target_price >= ?
        `).all(id, Number(price));

        if (alerts.length > 0) {
          const markNotified = db.prepare('UPDATE price_alerts SET is_notified = 1, notified_at = CURRENT_TIMESTAMP WHERE id = ?');
          for (const a of alerts) {
            markNotified.run(a.id);
            console.log(`[PRICE ALERT]: Dispatched price drop notification to ${a.customer_email} for "${updated.name}" (Now Rs. ${updated.price})`);
          }
        }
      }
    } catch (e) {
      console.warn('Non-critical audit/alert logging error:', e.message);
    }

    res.json(parseProduct(updated));
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// GET /api/products/:id/recommendations - Complete the outfit recommendations
router.get('/:id/recommendations', (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Complementary category mapping for complete the outfit
    const pairMap = {
      'Suits': ['Shirts', 'Jeans', 'Pants'],
      'Kurta': ['Shalwar Qameez', 'Pants', 'Suits'],
      'Shalwar Qameez': ['Kurta', 'Suits'],
      'Dresses': ['Abayas', 'Hijabs'],
      'Abayas': ['Hijabs', 'Dresses'],
      'Shirts': ['Jeans', 'Pants', 'Suits'],
      'T-Shirts': ['Jeans', 'Pants'],
      'Jeans': ['Shirts', 'T-Shirts', 'Suits'],
      'Pants': ['Shirts', 'T-Shirts', 'Kurta']
    };

    const targetCategories = pairMap[current.category] || ['Shirts', 'Pants', 'Kurta'];
    const placeholders = targetCategories.map(() => '?').join(',');

    const query = `
      SELECT * FROM products 
      WHERE id != ? 
        AND category IN (${placeholders}) 
        AND stock > 0 
        AND (is_published = 1 OR is_published IS NULL)
      ORDER BY rating DESC, is_featured DESC 
      LIMIT 4
    `;

    const complementary = db.prepare(query).all(id, ...targetCategories);
    
    // If not enough complementary items, fill with other popular items
    let results = complementary;
    if (results.length < 3) {
      const existingIds = [current.id, ...results.map(r => r.id)];
      const idPlaceholders = existingIds.map(() => '?').join(',');
      const fillItems = db.prepare(`
        SELECT * FROM products 
        WHERE id NOT IN (${idPlaceholders}) 
          AND stock > 0 
          AND (is_published = 1 OR is_published IS NULL)
        ORDER BY is_featured DESC, rating DESC 
        LIMIT ${4 - results.length}
      `).all(...existingIds);
      results = [...results, ...fillItems];
    }

    res.json(results.map(parseProduct));
  } catch (err) {
    console.error('Error fetching outfit recommendations:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// POST /api/products/bulk-status - Admin toggle publish status
router.post('/bulk-status', verifyAdmin, (req, res) => {
  try {
    const { ids, is_published } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of product ids required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`
      UPDATE products SET is_published = ? WHERE id IN (${placeholders})
    `).run(is_published ? 1 : 0, ...ids);

    // Audit log
    try {
      db.prepare(`
        INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
        VALUES (?, 'BULK_STATUS_CHANGE', 'products', ?, ?)
      `).run(req.admin?.username || 'admin', ids.join(','), `Changed is_published to ${is_published}`);
    } catch (e) {}

    res.json({ success: true, updatedCount: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/bulk-discount - Admin apply bulk discount
router.post('/bulk-discount', verifyAdmin, (req, res) => {
  try {
    const { ids, discount } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || discount === undefined) {
      return res.status(400).json({ error: 'Array of product ids and discount % required' });
    }

    const disc = Math.max(0, Math.min(100, Number(discount)));
    const placeholders = ids.map(() => '?').join(',');
    
    // Update discount and is_sale
    db.prepare(`
      UPDATE products 
      SET discount = ?, is_sale = ?
      WHERE id IN (${placeholders})
    `).run(disc, disc > 0 ? 1 : 0, ...ids);

    // Audit log
    try {
      db.prepare(`
        INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
        VALUES (?, 'BULK_DISCOUNT_UPDATE', 'products', ?, ?)
      `).run(req.admin?.username || 'admin', ids.join(','), `Applied ${disc}% discount`);
    } catch (e) {}

    res.json({ success: true, updatedCount: ids.length, discount: disc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/bulk-delete - Admin delete multiple products
router.post('/bulk-delete', verifyAdmin, (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of product ids required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);

    try {
      db.prepare(`
        INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
        VALUES (?, 'BULK_DELETE', 'products', ?, ?)
      `).run(req.admin?.username || 'admin', ids.join(','), `Deleted ${ids.length} products`);
    } catch (e) {}

    res.json({ success: true, deletedCount: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/:id/reorder-images - Admin reorder images
router.post('/:id/reorder-images', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;
    if (!Array.isArray(images)) {
      return res.status(400).json({ error: 'images array required' });
    }

    db.prepare('UPDATE products SET images = ? WHERE id = ?').run(JSON.stringify(images), id);
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json(parseProduct(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id - Admin delete product
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/:id/duplicate - Admin duplicate product
router.post('/:id/duplicate', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const orig = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!orig) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newName = `${orig.name} (Copy)`;
    const newSlug = orig.slug + '-copy-' + Date.now().toString().slice(-4);
    const newSku = orig.sku + '-CPY-' + Math.floor(Math.random() * 900 + 100);

    const stmt = db.prepare(`
      INSERT INTO products (
        name, slug, price, original_price, discount, currency, description, category, brand,
        sizes, colors, stock, variant_stock, sku, is_featured, is_sale, is_new, is_published,
        images, rating, review_count
      ) VALUES (?, ?, ?, ?, ?, 'PKR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      newName, newSlug, orig.price, orig.original_price, orig.discount, orig.description,
      orig.category, orig.brand, orig.sizes, orig.colors, orig.stock, orig.variant_stock, newSku,
      orig.is_featured, orig.is_sale, orig.is_new, orig.is_published, orig.images, orig.rating, orig.review_count
    );

    const duplicated = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseProduct(duplicated));
  } catch (err) {
    console.error('Error duplicating product:', err);
    res.status(500).json({ error: 'Failed to duplicate product' });
  }
});

module.exports = router;

