const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// POST /api/coupons/validate - Public checkout check
router.post('/validate', (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Please enter a coupon code' });
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE').get(code.trim());
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid coupon code' });
    }

    if (!coupon.is_active) {
      return res.status(400).json({ error: 'This coupon is no longer active' });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }

    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return res.status(400).json({ error: 'This coupon has reached its maximum usage limit' });
    }

    const cartTotal = Number(subtotal) || 0;
    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      return res.status(400).json({
        error: `Minimum order of $${coupon.min_order_amount.toFixed(2)} required for this coupon`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartTotal * coupon.discount_value) / 100;
    } else {
      discountAmount = coupon.discount_value;
    }

    if (discountAmount > cartTotal) discountAmount = cartTotal;

    res.json({
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: Number(discountAmount.toFixed(2)),
      message: `Coupon applied: ${coupon.discount_type === 'percentage' ? coupon.discount_value + '% off' : '$' + coupon.discount_value + ' off'}`
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// GET /api/coupons - Admin list
router.get('/', verifyAdmin, (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
    res.json(coupons);
  } catch (err) {
    console.error('Error fetching coupons:', err);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/coupons - Admin create
router.post('/', verifyAdmin, (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ error: 'A coupon with this code already exists' });
    }

    const result = db.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      cleanCode,
      discount_type,
      Number(discount_value),
      Number(min_order_amount) || 0,
      Number(max_uses) || 100,
      expires_at || null
    );

    const created = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating coupon:', err);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PUT /api/coupons/:id - Admin update / toggle
router.put('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;

    db.prepare(`
      UPDATE coupons SET
        code = COALESCE(?, code),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_order_amount = COALESCE(?, min_order_amount),
        max_uses = COALESCE(?, max_uses),
        expires_at = COALESCE(?, expires_at),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      code ? code.trim().toUpperCase() : null,
      discount_type,
      discount_value !== undefined ? Number(discount_value) : null,
      min_order_amount !== undefined ? Number(min_order_amount) : null,
      max_uses !== undefined ? Number(max_uses) : null,
      expires_at,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating coupon:', err);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/coupons/:id - Admin delete
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    console.error('Error deleting coupon:', err);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

module.exports = router;
