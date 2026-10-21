/**
 * ==============================================================================
 * AURA ATELIER — Order Lifecycle & Fulfillment Service
 * ==============================================================================
 * Handles the complete purchase-to-delivery lifecycle:
 * - Server-side price recalculation in PKR (preventing client-side tampering)
 * - Pakistani phone number validation (03xx-xxxxxxx & +92 formats)
 * - Metro city delivery fee logic (Lahore, Karachi, Islamabad, Rawalpindi)
 * - Stock inventory deduction upon successful placement
 * - Real-time TCS, Leopards, Trax consignment tracking link generators
 * - Automated review reminder emails dispatched upon transition to 'Delivered'
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyAdmin } = require('../auth');
const mailer = require('../mailer');

// Major Pakistani metro cities eligible for local express delivery rates
const METRO_CITIES = ['lahore', 'karachi', 'islamabad', 'rawalpindi'];

// Courier tracking URL generators
function getCourierTrackingUrl(courier, trackingNumber) {
  if (!trackingNumber) return null;
  const tn = encodeURIComponent(trackingNumber.trim());
  const c = (courier || '').toLowerCase();
  if (c.includes('tcs')) return `https://www.tcsexpress.com/tracking?tracking_number=${tn}`;
  if (c.includes('leopard')) return `https://leopardscourier.com/tracking/`;
  if (c.includes('trax')) return `https://trax.pk/tracking/`;
  if (c.includes('postex')) return `https://postex.pk/tracking?cn=${tn}`;
  return `https://www.google.com/search?q=${encodeURIComponent((courier || 'courier') + ' tracking ' + trackingNumber)}`;
}

// Clean and normalize Pakistani phone number
function validateAndNormalizePakistaniPhone(phone) {
  if (!phone) return null;
  // Strip spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Match standard Pakistani mobile formats: 03xx-xxxxxxx or +923xxxxxxxxx or 923xxxxxxxxx
  const pkMobileRegex = /^(?:\+92|92|0)?(3[0-9]{9})$/;
  const match = cleaned.match(pkMobileRegex);
  if (!match) return null;
  // Return normalized standard 03xx format
  return '0' + match[1];
}

function parseOrder(o) {
  if (!o) return null;
  const courierUrl = o.courier_tracking_number
    ? getCourierTrackingUrl(o.courier_name, o.courier_tracking_number)
    : null;

  return {
    ...o,
    currency: o.currency || 'PKR',
    items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
    tracking_history: typeof o.tracking_history === 'string' ? JSON.parse(o.tracking_history) : (o.tracking_history || []),
    courier_tracking_url: courierUrl
  };
}

// POST /api/orders - Customer checkout with strict PKR server-side pricing & Pakistani validations
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      postal_code,
      notes,
      payment_method = 'Cash on Delivery',
      items,
      coupon_code
    } = req.body;

    // Validate essential customer info
    if (!customer_name || !customer_email || !customer_phone || !address || !city) {
      return res.status(400).json({ error: 'Please provide all required shipping and recipient details' });
    }

    // Strict Pakistani mobile validation
    const normalizedPhone = validateAndNormalizePakistaniPhone(customer_phone);
    if (!normalizedPhone) {
      return res.status(400).json({
        error: 'Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or +923001234567)'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your shopping cart is empty' });
    }

    // Duplicate order prevention: check if identical order was placed within last 60 seconds
    const recentDuplicate = db.prepare(`
      SELECT * FROM orders 
      WHERE (customer_phone = ? OR customer_email = ?) 
      AND created_at >= datetime('now', '-60 seconds', 'localtime')
      ORDER BY created_at DESC LIMIT 1
    `).get(normalizedPhone, customer_email.trim());

    if (recentDuplicate) {
      console.log(`[IDEMPOTENCY] Prevented duplicate order submission for ${customer_email}. Returning existing order #${recentDuplicate.id}`);
      return res.status(200).json(parseOrder(recentDuplicate));
    }

    // Server-side authoritative price verification & inventory check
    let subtotal = 0;
    const verifiedItems = [];
    const getProductStmt = db.prepare('SELECT id, name, price, original_price, stock, sku, images, is_published FROM products WHERE id = ?');
    const updateStockStmt = db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?');

    for (const item of items) {
      const prodId = item.product_id || item.id;
      const prod = getProductStmt.get(prodId);

      if (!prod) {
        return res.status(400).json({ error: `Garment item with ID ${prodId} is no longer available in our collection.` });
      }

      if (prod.is_published === 0) {
        return res.status(400).json({ error: `"${prod.name}" is currently unlisted from our atelier catalog.` });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (prod.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for "${prod.name}". Only ${prod.stock} unit(s) remaining in the atelier.`
        });
      }

      // Authoritative DB price in PKR (never trust client price)
      const authoritativePrice = Number(prod.price);
      subtotal += authoritativePrice * qty;

      let itemImages = [];
      try {
        itemImages = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
      } catch (e) {
        itemImages = [];
      }

      verifiedItems.push({
        product_id: prod.id,
        name: prod.name,
        price: authoritativePrice,
        original_price: prod.original_price ? Number(prod.original_price) : authoritativePrice,
        quantity: qty,
        size: item.size || 'Standard',
        color: item.color || 'Default',
        sku: prod.sku || '',
        image: Array.isArray(itemImages) && itemImages.length > 0 ? itemImages[0] : null
      });

      // Safely decrement inventory
      updateStockStmt.run(qty, prod.id);
    }

    // Determine Pakistani delivery charges based on city and cart subtotal
    const normCity = city.trim().toLowerCase();
    const isMetro = METRO_CITIES.some(mc => normCity.includes(mc));

    const standardDeliverySetting = db.prepare("SELECT value FROM settings WHERE key = 'delivery_charge'").get();
    const localDeliverySetting = db.prepare("SELECT value FROM settings WHERE key = 'local_delivery_charge'").get();
    const freeThresholdSetting = db.prepare("SELECT value FROM settings WHERE key = 'free_shipping_threshold'").get();

    const standardFee = standardDeliverySetting ? Number(standardDeliverySetting.value) : 299;
    const localFee = localDeliverySetting ? Number(localDeliverySetting.value) : 199;
    const freeThreshold = freeThresholdSetting ? Number(freeThresholdSetting.value) : 7500;

    let delivery_fee = 0;
    if (subtotal >= freeThreshold) {
      delivery_fee = 0;
    } else {
      delivery_fee = isMetro ? localFee : standardFee;
    }

    // Apply coupon if valid
    let discount_amount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const cp = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(coupon_code.trim().toUpperCase());
      if (cp) {
        if (!cp.min_order_amount || subtotal >= cp.min_order_amount) {
          if (cp.discount_type === 'percentage') {
            discount_amount = Math.round((subtotal * cp.discount_value) / 100);
          } else {
            discount_amount = Math.round(cp.discount_value);
          }
          if (discount_amount > subtotal) discount_amount = subtotal;
          appliedCoupon = cp.code;

          // Increment coupon usage
          db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?').run(cp.id);
        }
      }
    }

    const total_amount = Math.max(0, subtotal - discount_amount + delivery_fee);

    // Initial payment status
    let initialPaymentStatus = 'Pending (COD)';
    if (payment_method.toLowerCase().includes('bank') || payment_method.toLowerCase().includes('raast')) {
      initialPaymentStatus = 'Awaiting Deposit Slip';
    } else if (payment_method.toLowerCase().includes('jazzcash') || payment_method.toLowerCase().includes('easypaisa')) {
      initialPaymentStatus = 'Payment Pending';
    }

    // Generate unique order ID in format PK-ORD-XXXXX
    const orderId = 'PK-' + Math.floor(100000 + Math.random() * 900000);

    const initialTracking = [
      {
        status: 'New',
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        note: `Order booked via ${payment_method}. Awaiting boutique confirmation.`
      }
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, address, city, postal_code,
        notes, payment_method, payment_status, currency, status, subtotal, delivery_fee,
        discount_amount, total_amount, coupon_code, items, tracking_history, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 'PKR', 'New', ?, ?,
        ?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime')
      )
    `);

    insertOrder.run(
      orderId,
      customer_name.trim(),
      customer_email.trim().toLowerCase(),
      normalizedPhone,
      address.trim(),
      city.trim(),
      postal_code ? postal_code.trim() : '',
      notes ? notes.trim() : '',
      payment_method,
      initialPaymentStatus,
      subtotal,
      delivery_fee,
      discount_amount,
      total_amount,
      appliedCoupon,
      JSON.stringify(verifiedItems),
      JSON.stringify(initialTracking)
    );

    // Update or insert customer record
    const existingCustomer = db.prepare('SELECT * FROM customers WHERE email = ?').get(customer_email.trim().toLowerCase());
    if (existingCustomer) {
      db.prepare(`
        UPDATE customers SET
          total_orders = total_orders + 1,
          total_spent = total_spent + ?,
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          city = COALESCE(?, city)
        WHERE id = ?
      `).run(total_amount, normalizedPhone, address.trim(), city.trim(), existingCustomer.id);
    } else {
      db.prepare(`
        INSERT INTO customers (name, email, phone, address, city, total_orders, total_spent)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(customer_name.trim(), customer_email.trim().toLowerCase(), normalizedPhone, address.trim(), city.trim(), total_amount);
    }

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const parsedCreated = parseOrder(created);

    // Trigger transactional notifications asynchronously
    mailer.sendOrderNotification(parsedCreated, 'placed').catch(err => console.error('Customer email error:', err));
    mailer.sendAdminOrderNotification(parsedCreated).catch(err => console.error('Admin email error:', err));

    res.status(201).json(parsedCreated);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to process order: ' + err.message });
  }
});

// GET /api/orders/track/:query - Public tracking by Order ID or Pakistani Phone
router.get('/track/:query', (req, res) => {
  try {
    const rawQuery = req.params.query.trim();
    let order = db.prepare('SELECT * FROM orders WHERE id = ? COLLATE NOCASE').get(rawQuery);
    
    if (!order) {
      // Try searching by phone (including normalized version)
      const normalized = validateAndNormalizePakistaniPhone(rawQuery);
      if (normalized) {
        order = db.prepare('SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 1').get(normalized);
      }
    }

    if (!order) {
      order = db.prepare('SELECT * FROM orders WHERE customer_phone = ? OR customer_email = ? ORDER BY created_at DESC LIMIT 1').get(rawQuery, rawQuery);
    }

    if (!order) {
      return res.status(404).json({ error: 'No order found matching the provided reference' });
    }

    res.json(parseOrder(order));
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ error: 'Unable to track order' });
  }
});

// GET /api/orders - Admin list
router.get('/', verifyAdmin, (req, res) => {
  try {
    const { status, search, limit = 100, page = 1 } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all' && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR city LIKE ? OR courier_tracking_number LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC';

    const all = db.prepare(sql).all(...params).map(parseOrder);
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      orders: paginated,
      total: all.length,
      page: pageNum,
      totalPages: Math.ceil(all.length / limitNum) || 1
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// GET /api/orders/:id - Single order
router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(parseOrder(order));
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// PATCH /api/orders/:id/status - Admin change status, assign courier and tracking number
router.patch('/:id/status', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      note,
      courier_name,
      courier_tracking_number,
      payment_status
    } = req.body;

    const validStatuses = ['New', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentHistory = typeof order.tracking_history === 'string'
      ? JSON.parse(order.tracking_history)
      : (order.tracking_history || []);

    let entryNote = note;
    if (!entryNote) {
      if (status === 'Shipped' && (courier_name || courier_tracking_number)) {
        entryNote = `Dispatched via ${courier_name || 'Courier'} with Tracking #${courier_tracking_number || 'N/A'}`;
      } else {
        entryNote = `Status updated to ${status} by atelier administration.`;
      }
    }

    currentHistory.push({
      status,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      note: entryNote
    });

    const newCourier = courier_name !== undefined ? courier_name : order.courier_name;
    const newTrackingNum = courier_tracking_number !== undefined ? courier_tracking_number : order.courier_tracking_number;
    const newPaymentStatus = payment_status !== undefined ? payment_status : order.payment_status;

    db.prepare(`
      UPDATE orders SET
        status = ?,
        courier_name = ?,
        courier_tracking_number = ?,
        payment_status = ?,
        tracking_history = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      status,
      newCourier,
      newTrackingNum,
      newPaymentStatus,
      JSON.stringify(currentHistory),
      id
    );

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    const parsedUpdated = parseOrder(updated);

    // Trigger status update transactional email
    mailer.sendStatusUpdateEmail(parsedUpdated, status, entryNote).catch(e => console.error('Status email error:', e));

    // When status changes to Delivered, trigger review invitation for customer
    if (status === 'Delivered') {
      let orderItems = [];
      try {
        orderItems = typeof parsedUpdated.items === 'string' ? JSON.parse(parsedUpdated.items) : parsedUpdated.items;
      } catch (e) { orderItems = []; }

      if (Array.isArray(orderItems) && orderItems.length > 0) {
        mailer.sendReviewInvitationEmail(parsedUpdated, orderItems[0]).catch(e => console.error('Review email error:', e));
      }
    }

    res.json(parsedUpdated);
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;
