const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// GET /api/lookbooks - Get active lookbooks with outfit hotspots and real product data
router.get('/', (req, res) => {
  try {
    const lookbooks = db.prepare(`
      SELECT * FROM lookbooks WHERE is_active = 1 ORDER BY id ASC
    `).all();

    const result = lookbooks.map(lb => {
      const hotspots = db.prepare(`
        SELECT 
          h.id, h.lookbook_id, h.product_id, h.x_percent, h.y_percent, h.label,
          p.name as product_name, p.slug as product_slug, p.price as product_price,
          p.original_price as product_original_price, p.discount as product_discount,
          p.images as product_images, p.category as product_category, p.stock as product_stock,
          p.brand as product_brand
        FROM lookbook_hotspots h
        LEFT JOIN products p ON h.product_id = p.id
        WHERE h.lookbook_id = ?
      `).all(lb.id);

      const parsedHotspots = hotspots.map(h => {
        let imgs = [];
        try {
          imgs = typeof h.product_images === 'string' ? JSON.parse(h.product_images) : (h.product_images || []);
        } catch (e) {
          imgs = [];
        }
        return {
          id: h.id,
          lookbook_id: h.lookbook_id,
          product_id: h.product_id,
          x_percent: h.x_percent,
          y_percent: h.y_percent,
          label: h.label || h.product_name,
          product: {
            id: h.product_id,
            name: h.product_name || 'Atelier Garment',
            slug: h.product_slug || '',
            price: h.product_price || 0,
            original_price: h.product_original_price || 0,
            discount: h.product_discount || 0,
            category: h.product_category || 'Haute Couture',
            brand: h.product_brand || 'Aura Atelier',
            stock: h.product_stock || 0,
            images: imgs,
            image: imgs[0] || ''
          }
        };
      });

      return {
        ...lb,
        is_active: Boolean(lb.is_active),
        hotspots: parsedHotspots
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching lookbooks:', err);
    res.status(500).json({ error: 'Failed to fetch lookbooks' });
  }
});

// GET /api/lookbooks/all - Admin list
router.get('/all', verifyAdmin, (req, res) => {
  try {
    const lookbooks = db.prepare('SELECT * FROM lookbooks ORDER BY id DESC').all();
    const result = lookbooks.map(lb => {
      const hotspots = db.prepare(`
        SELECT h.*, p.name as product_name, p.price as product_price 
        FROM lookbook_hotspots h
        LEFT JOIN products p ON h.product_id = p.id
        WHERE h.lookbook_id = ?
      `).all(lb.id);
      return { ...lb, is_active: Boolean(lb.is_active), hotspots };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lookbooks - Admin create lookbook
router.post('/', verifyAdmin, (req, res) => {
  try {
    const { title, subtitle, image, description, season } = req.body;
    if (!title || !image) {
      return res.status(400).json({ error: 'Title and image URL are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO lookbooks (title, subtitle, image, description, season, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const r = stmt.run(title, subtitle || '', image, description || '', season || 'Autumn / Winter 2026');
    const created = db.prepare('SELECT * FROM lookbooks WHERE id = ?').get(r.lastInsertRowid);
    res.status(201).json({ ...created, is_active: true, hotspots: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/lookbooks/:id - Admin update lookbook
router.put('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, description, season, is_active } = req.body;

    const stmt = db.prepare(`
      UPDATE lookbooks SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        image = COALESCE(?, image),
        description = COALESCE(?, description),
        season = COALESCE(?, season),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);

    stmt.run(
      title || null,
      subtitle !== undefined ? subtitle : null,
      image || null,
      description !== undefined ? description : null,
      season || null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM lookbooks WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lookbooks/:id - Admin delete lookbook
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM lookbook_hotspots WHERE lookbook_id = ?').run(id);
    db.prepare('DELETE FROM lookbooks WHERE id = ?').run(id);
    res.json({ success: true, message: 'Lookbook removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lookbooks/:id/hotspots - Admin add hotspot
router.post('/:id/hotspots', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, x_percent, y_percent, label } = req.body;
    if (!product_id || x_percent === undefined || y_percent === undefined) {
      return res.status(400).json({ error: 'product_id, x_percent, and y_percent are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO lookbook_hotspots (lookbook_id, product_id, x_percent, y_percent, label)
      VALUES (?, ?, ?, ?, ?)
    `);
    const r = stmt.run(id, product_id, Number(x_percent), Number(y_percent), label || null);
    const created = db.prepare(`
      SELECT h.*, p.name as product_name, p.price as product_price 
      FROM lookbook_hotspots h
      LEFT JOIN products p ON h.product_id = p.id
      WHERE h.id = ?
    `).get(r.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lookbooks/hotspots/:hotspotId - Admin delete hotspot
router.delete('/hotspots/:hotspotId', verifyAdmin, (req, res) => {
  try {
    const { hotspotId } = req.params;
    db.prepare('DELETE FROM lookbook_hotspots WHERE id = ?').run(hotspotId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
