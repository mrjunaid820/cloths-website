const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// POST /api/price-alerts - Customer opt-in for price alert
router.post('/', (req, res) => {
  try {
    const { product_id, customer_email, target_price } = req.body;
    if (!product_id || !customer_email) {
      return res.status(400).json({ error: 'product_id and customer_email are required' });
    }

    const email = customer_email.trim().toLowerCase();
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    const prod = db.prepare('SELECT id, name, price FROM products WHERE id = ?').get(product_id);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const alertPrice = target_price ? Number(target_price) : prod.price;

    // Check if already subscribed to prevent duplicate alerts
    const existing = db.prepare(`
      SELECT id FROM price_alerts 
      WHERE product_id = ? AND customer_email = ? AND is_notified = 0
    `).get(product_id, email);

    if (existing) {
      return res.json({ 
        success: true, 
        message: `You are already registered for price alerts on "${prod.name}". We will notify ${email} if the price decreases.` 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO price_alerts (product_id, customer_email, target_price, is_notified)
      VALUES (?, ?, ?, 0)
    `);
    stmt.run(product_id, email, alertPrice);

    res.status(201).json({
      success: true,
      message: `Price drop alert activated. We will notify ${email} if "${prod.name}" goes on sale or price drops.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to save alert preference' });
  }
});

// GET /api/price-alerts/all - Admin list
router.get('/all', verifyAdmin, (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT a.*, p.name as product_name, p.price as current_price, p.sku
      FROM price_alerts a
      LEFT JOIN products p ON a.product_id = p.id
      ORDER BY a.id DESC
      LIMIT 100
    `).all();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
