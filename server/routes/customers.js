const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');

// GET /api/customers - Admin list
router.get('/', verifyAdmin, (req, res) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY total_spent DESC, total_orders DESC';
    const customers = db.prepare(sql).all(...params);
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

// GET /api/customers/:id - Admin view customer with their orders
router.get('/:id', verifyAdmin, (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC').all(customer.email);
    res.json({
      customer,
      orders: orders.map(o => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items
      }))
    });
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    res.status(500).json({ error: 'Failed to retrieve customer' });
  }
});

module.exports = router;
