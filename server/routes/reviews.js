/**
 * ==============================================================================
 * AURA ATELIER — Customer Reviews & Verified Appraisals Service
 * ==============================================================================
 * Manages customer feedback, star ratings, and photo reviews:
 * - Server-side verification: awards 'Verified Purchase' seal ONLY if order is 'Delivered'
 * - Multi-criteria craftsmanship ratings (Fabric quality, stitching, fit silhouette, color fidelity)
 * - Secure customer photo uploads with Multer (JPEG, PNG, WebP up to 5MB)
 * - Helpful vote hashing preventing duplicate ballot manipulation
 * - Administrative moderation: approval, rejection, and official atelier replies
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { verifyAdmin } = require('../auth');
const mailer = require('../mailer');

// Storage for review customer photos
const uploadDir = path.join(__dirname, '../uploads/reviews');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `review-${safeBase}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// Rate limiter for reviews submission & voting
const reviewPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many reviews submitted from this connection. Please try again later.' }
});

const helpfulVoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many votes from this connection. Please try again later.' }
});

// Helper: parse review object
function parseReview(r) {
  if (!r) return null;
  let photos = [];
  try {
    photos = typeof r.photos === 'string' ? JSON.parse(r.photos) : (r.photos || []);
  } catch (e) {
    photos = [];
  }
  return {
    ...r,
    rating: Number(r.rating),
    is_verified: Boolean(r.is_verified),
    helpful_count: Number(r.helpful_count || 0),
    photos,
    fabric_rating: r.fabric_rating ? Number(r.fabric_rating) : null,
    stitching_rating: r.stitching_rating ? Number(r.stitching_rating) : null,
    fit_rating: r.fit_rating ? Number(r.fit_rating) : null,
    color_rating: r.color_rating ? Number(r.color_rating) : null,
    delivery_rating: r.delivery_rating ? Number(r.delivery_rating) : null,
  };
}

// Helper: recalculate product average rating & count
function recalculateProductRating(productId) {
  const stats = db.prepare(`
    SELECT AVG(rating) as avg_rating, count(*) as count 
    FROM reviews 
    WHERE product_id = ? AND status = 'approved'
  `).get(productId);

  const rounded = stats && stats.count > 0 ? Math.round(stats.avg_rating * 10) / 10 : 5.0;
  const count = stats ? Number(stats.count) : 0;

  db.prepare(`
    UPDATE products 
    SET rating = ?, review_count = ? 
    WHERE id = ?
  `).run(rounded, count, productId);

  return { rating: rounded, review_count: count };
}

// -------------------------------------------------------------
// PUBLIC CUSTOMER ENDPOINTS
// -------------------------------------------------------------

// POST /api/reviews/upload-photos - Upload review photos
router.post('/upload-photos', upload.array('photos', 4), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }
    const urls = req.files.map(f => `/uploads/reviews/${f.filename}`);
    res.json({ urls });
  } catch (err) {
    console.error('Review photo upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload review photos' });
  }
});

// GET /api/reviews/:productId - Get approved reviews with distribution & aspect averages
router.get('/:productId', (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = db.prepare(`
      SELECT 
        id, product_id, customer_name, rating, title, comment, created_at, updated_at,
        order_id, is_verified, photos, fabric_rating, stitching_rating,
        fit_rating, color_rating, delivery_rating, helpful_count,
        admin_response, admin_response_at
      FROM reviews 
      WHERE product_id = ? AND status = 'approved'
      ORDER BY is_verified DESC, helpful_count DESC, created_at DESC
    `).all(productId).map(parseReview);

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalScore = 0;
    const aspectSums = { fabric: 0, stitching: 0, fit: 0, color: 0, delivery: 0 };
    const aspectCounts = { fabric: 0, stitching: 0, fit: 0, color: 0, delivery: 0 };

    for (const r of reviews) {
      const rNum = Math.min(5, Math.max(1, Math.round(r.rating)));
      distribution[rNum] = (distribution[rNum] || 0) + 1;
      totalScore += r.rating;

      if (r.fabric_rating) { aspectSums.fabric += r.fabric_rating; aspectCounts.fabric++; }
      if (r.stitching_rating) { aspectSums.stitching += r.stitching_rating; aspectCounts.stitching++; }
      if (r.fit_rating) { aspectSums.fit += r.fit_rating; aspectCounts.fit++; }
      if (r.color_rating) { aspectSums.color += r.color_rating; aspectCounts.color++; }
      if (r.delivery_rating) { aspectSums.delivery += r.delivery_rating; aspectCounts.delivery++; }
    }

    const count = reviews.length;
    const average = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 5.0;

    const aspectAverages = {
      fabric: aspectCounts.fabric > 0 ? Math.round((aspectSums.fabric / aspectCounts.fabric) * 10) / 10 : null,
      stitching: aspectCounts.stitching > 0 ? Math.round((aspectSums.stitching / aspectCounts.stitching) * 10) / 10 : null,
      fit: aspectCounts.fit > 0 ? Math.round((aspectSums.fit / aspectCounts.fit) * 10) / 10 : null,
      color: aspectCounts.color > 0 ? Math.round((aspectSums.color / aspectCounts.color) * 10) / 10 : null,
      delivery: aspectCounts.delivery > 0 ? Math.round((aspectSums.delivery / aspectCounts.delivery) * 10) / 10 : null,
    };

    res.json({
      reviews,
      count,
      average,
      distribution,
      aspectAverages
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to retrieve reviews' });
  }
});

// GET /api/reviews/verify-eligibility - Check if an order is eligible for verified review
router.get('/check/eligibility', (req, res) => {
  try {
    const { orderId, email, phone, productId } = req.query;

    if (!orderId || !productId) {
      return res.status(400).json({ eligible: false, message: 'Order reference and product ID are required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ? COLLATE NOCASE').get(orderId.trim());
    if (!order) {
      return res.json({ eligible: false, message: 'Order reference number was not found in our ledger.' });
    }

    // Verify contact matches customer record (email or phone)
    if (email) {
      if (order.customer_email.toLowerCase() !== email.trim().toLowerCase()) {
        return res.json({ eligible: false, message: 'Customer email does not match this order.' });
      }
    } else if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const cleanOrderPhone = (order.customer_phone || '').replace(/[^0-9]/g, '');
      if (!cleanOrderPhone.endsWith(cleanPhone.slice(-9))) {
        return res.json({ eligible: false, message: 'Customer phone does not match this order.' });
      }
    }

    // Check delivery status
    if (order.status !== 'Delivered') {
      return res.json({ 
        eligible: false, 
        message: `Reviews are available once the order is delivered. Current status: "${order.status}".` 
      });
    }

    // Check item exists in order
    let items = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {
      items = [];
    }

    const hasItem = items.some(it => String(it.product_id || it.id) === String(productId));
    if (!hasItem) {
      return res.json({ eligible: false, message: 'This garment was not part of the specified order.' });
    }

    // Check if already reviewed
    const existing = db.prepare('SELECT id, edit_token FROM reviews WHERE order_id = ? AND product_id = ?').get(order.id, productId);
    if (existing) {
      return res.json({ 
        eligible: true, 
        alreadyReviewed: true, 
        reviewId: existing.id, 
        editToken: existing.edit_token,
        message: 'You have already reviewed this product. You may edit your existing review.' 
      });
    }

    return res.json({ 
      eligible: true, 
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      orderDate: order.created_at,
      alreadyReviewed: false,
      message: 'Verified Purchase confirmed. You are eligible to submit a verified appraisal.' 
    });
  } catch (err) {
    console.error('Eligibility check error:', err);
    res.status(500).json({ error: 'Failed to verify review eligibility' });
  }
});

// POST /api/reviews - Add review (with verified check & photo upload support)
router.post('/', reviewPostLimiter, (req, res) => {
  try {
    const { 
      product_id, 
      customer_name, 
      customer_email, 
      customer_phone,
      rating, 
      title, 
      comment,
      order_id,
      photos,
      fabric_rating,
      stitching_rating,
      fit_rating,
      color_rating,
      delivery_rating
    } = req.body;

    if (!product_id || !customer_name || !rating || !comment) {
      return res.status(400).json({ error: 'Name, rating, and review comment are required' });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    // Sanitize comment & title
    const sanitizedTitle = (title || '').trim().substring(0, 150);
    const sanitizedComment = comment.trim().substring(0, 2000);
    if (sanitizedComment.length < 5) {
      return res.status(400).json({ error: 'Review comment must be at least 5 characters long' });
    }

    // Verify purchase check
    let isVerified = 0;
    let validOrderId = null;

    if (order_id && order_id.trim()) {
      const order = db.prepare('SELECT * FROM orders WHERE id = ? COLLATE NOCASE').get(order_id.trim());
      if (order && order.status === 'Delivered') {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) { items = []; }

        const hasItem = items.some(it => String(it.product_id || it.id) === String(product_id));
        if (hasItem) {
          // Check for duplicate review for same order & product
          const existingReview = db.prepare('SELECT id FROM reviews WHERE order_id = ? AND product_id = ?').get(order.id, product_id);
          if (existingReview) {
            return res.status(400).json({ 
              error: 'A verified review for this product and order already exists. Please edit your existing review.' 
            });
          }
          isVerified = 1;
          validOrderId = order.id;
        }
      }
    }

    const editToken = crypto.randomBytes(24).toString('hex');
    const photosJson = JSON.stringify(Array.isArray(photos) ? photos.slice(0, 4) : []);

    const insertStmt = db.prepare(`
      INSERT INTO reviews (
        product_id, customer_name, customer_email, rating, title, comment,
        order_id, is_verified, photos, fabric_rating, stitching_rating,
        fit_rating, color_rating, delivery_rating, edit_token, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'approved'
      )
    `);

    const result = insertStmt.run(
      product_id,
      customer_name.trim().substring(0, 80),
      (customer_email || '').trim().toLowerCase().substring(0, 100),
      numRating,
      sanitizedTitle,
      sanitizedComment,
      validOrderId,
      isVerified,
      photosJson,
      fabric_rating ? Math.min(5, Math.max(1, Number(fabric_rating))) : null,
      stitching_rating ? Math.min(5, Math.max(1, Number(stitching_rating))) : null,
      fit_rating ? Math.min(5, Math.max(1, Number(fit_rating))) : null,
      color_rating ? Math.min(5, Math.max(1, Number(color_rating))) : null,
      delivery_rating ? Math.min(5, Math.max(1, Number(delivery_rating))) : null,
      editToken
    );

    // Recalculate product rating
    recalculateProductRating(product_id);

    const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      review: parseReview(created),
      editToken,
      message: isVerified 
        ? 'Thank you! Your verified patron review has been recorded.' 
        : 'Thank you! Your review has been submitted.'
    });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Failed to submit review: ' + err.message });
  }
});

// PUT /api/reviews/:id - Customer Edit own review (verified with editToken or orderId match)
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { edit_token, order_id, customer_email, rating, title, comment, photos, fabric_rating, stitching_rating, fit_rating, color_rating, delivery_rating } = req.body;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Ownership verification
    let authorized = false;
    if (edit_token && review.edit_token && edit_token === review.edit_token) {
      authorized = true;
    } else if (order_id && review.order_id && order_id.trim().toUpperCase() === review.order_id.toUpperCase()) {
      authorized = true;
    } else if (customer_email && review.customer_email && customer_email.trim().toLowerCase() === review.customer_email.toLowerCase()) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Unauthorized to modify this review' });
    }

    const numRating = rating ? Number(rating) : review.rating;
    const sanitizedTitle = title !== undefined ? String(title).trim().substring(0, 150) : review.title;
    const sanitizedComment = comment !== undefined ? String(comment).trim().substring(0, 2000) : review.comment;
    const photosJson = photos !== undefined ? JSON.stringify(Array.isArray(photos) ? photos.slice(0, 4) : []) : review.photos;

    db.prepare(`
      UPDATE reviews SET
        rating = ?,
        title = ?,
        comment = ?,
        photos = ?,
        fabric_rating = ?,
        stitching_rating = ?,
        fit_rating = ?,
        color_rating = ?,
        delivery_rating = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      numRating,
      sanitizedTitle,
      sanitizedComment,
      photosJson,
      fabric_rating !== undefined ? fabric_rating : review.fabric_rating,
      stitching_rating !== undefined ? stitching_rating : review.stitching_rating,
      fit_rating !== undefined ? fit_rating : review.fit_rating,
      color_rating !== undefined ? color_rating : review.color_rating,
      delivery_rating !== undefined ? delivery_rating : review.delivery_rating,
      id
    );

    recalculateProductRating(review.product_id);

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    res.json({ review: parseReview(updated), message: 'Review updated successfully' });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id - Customer Delete own review
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { edit_token, order_id, customer_email } = req.body || {};

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    let authorized = false;
    if (edit_token && review.edit_token && edit_token === review.edit_token) {
      authorized = true;
    } else if (order_id && review.order_id && order_id.trim().toUpperCase() === review.order_id.toUpperCase()) {
      authorized = true;
    } else if (customer_email && review.customer_email && customer_email.trim().toLowerCase() === review.customer_email.toLowerCase()) {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    recalculateProductRating(review.product_id);

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// POST /api/reviews/:id/helpful - Vote review as helpful
router.post('/:id/helpful', helpfulVoteLimiter, (req, res) => {
  try {
    const { id } = req.params;
    // Identifier can be browser fingerprint / IP hash or email
    const voterId = req.body.voterId || req.ip || 'anonymous-voter';
    const hash = crypto.createHash('sha256').update(String(voterId)).digest('hex').substring(0, 32);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if voter already voted
    const existingVote = db.prepare('SELECT id FROM review_helpful_votes WHERE review_id = ? AND voter_identifier = ?').get(id, hash);
    if (existingVote) {
      return res.status(400).json({ error: 'You have already marked this review as helpful', helpful_count: review.helpful_count });
    }

    db.prepare('INSERT INTO review_helpful_votes (review_id, voter_identifier) VALUES (?, ?)').run(id, hash);
    db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(id);

    const newCount = review.helpful_count + 1;
    res.json({ success: true, helpful_count: newCount });
  } catch (err) {
    console.error('Error voting helpful:', err);
    res.status(500).json({ error: 'Failed to register helpful vote' });
  }
});

// -------------------------------------------------------------
// ADMIN MANAGEMENT ENDPOINTS
// -------------------------------------------------------------

// GET /api/reviews/admin/all - Get all reviews with rich filtering for moderation
router.get('/admin/all', verifyAdmin, (req, res) => {
  try {
    const { status, rating, productId, verifiedOnly, search, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT r.*, p.name as product_name, p.slug as product_slug, p.images as product_images
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (rating && rating !== 'all') {
      sql += ' AND r.rating = ?';
      params.push(Number(rating));
    }
    if (productId && productId !== 'all') {
      sql += ' AND r.product_id = ?';
      params.push(Number(productId));
    }
    if (verifiedOnly === 'true' || verifiedOnly === '1') {
      sql += ' AND r.is_verified = 1';
    }
    if (search && search.trim()) {
      sql += ' AND (r.customer_name LIKE ? OR r.customer_email LIKE ? OR r.title LIKE ? OR r.comment LIKE ? OR r.order_id LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    sql += ' ORDER BY r.created_at DESC';

    const all = db.prepare(sql).all(...params).map(r => {
      let product_image = '';
      try {
        const imgs = typeof r.product_images === 'string' ? JSON.parse(r.product_images) : r.product_images;
        product_image = Array.isArray(imgs) ? imgs[0] : '';
      } catch (e) {}
      return {
        ...parseReview(r),
        product_name: r.product_name,
        product_slug: r.product_slug,
        product_image
      };
    });

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const paginated = all.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Summary counters
    const counts = db.prepare(`
      SELECT 
        count(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) as hidden,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified
      FROM reviews
    `).get();

    res.json({
      reviews: paginated,
      total: all.length,
      page: pageNum,
      totalPages: Math.ceil(all.length / limitNum) || 1,
      counts
    });
  } catch (err) {
    console.error('Admin fetching reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews ledger' });
  }
});

// PATCH /api/reviews/admin/:id/status - Moderate review status (approve, reject, hide)
router.patch('/admin/:id/status', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Invalid moderation status. Choose approved, rejected, or hidden.' });
    }

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);

    // Audit log moderation action
    const adminUser = req.admin ? req.admin.username : 'admin';
    db.prepare(`
      INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminUser,
      `REVIEW_MODERATION_${status.toUpperCase()}`,
      'reviews',
      String(id),
      `Set review status to "${status}". Reason: ${reason || 'Administrative policy moderation'}. Customer: ${review.customer_name}`
    );

    recalculateProductRating(review.product_id);

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    res.json({ review: parseReview(updated), message: `Review marked as ${status}` });
  } catch (err) {
    console.error('Error updating review status:', err);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

// POST /api/reviews/admin/:id/response - Public atelier response to a review
router.post('/admin/:id/response', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const cleanResponse = (response || '').trim();

    db.prepare(`
      UPDATE reviews 
      SET admin_response = ?, admin_response_at = datetime('now', 'localtime') 
      WHERE id = ?
    `).run(cleanResponse || null, id);

    const adminUser = req.admin ? req.admin.username : 'admin';
    db.prepare(`
      INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminUser,
      'REVIEW_RESPONSE',
      'reviews',
      String(id),
      cleanResponse ? `Posted public response to review #${id}` : `Removed response from review #${id}`
    );

    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    res.json({ review: parseReview(updated), message: 'Atelier response published successfully' });
  } catch (err) {
    console.error('Error posting admin response:', err);
    res.status(500).json({ error: 'Failed to post response' });
  }
});

// DELETE /api/reviews/admin/:id - Administrative deletion
router.delete('/admin/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

    const adminUser = req.admin ? req.admin.username : 'admin';
    db.prepare(`
      INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminUser,
      'REVIEW_DELETE',
      'reviews',
      String(id),
      `Deleted review #${id} by ${review.customer_name}. Reason: ${reason || 'Spam / Terms violation'}`
    );

    recalculateProductRating(review.product_id);

    res.json({ message: 'Review purged successfully' });
  } catch (err) {
    console.error('Error deleting review by admin:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// POST /api/reviews/admin/send-request - Dispatch review invitation to delivered customer
router.post('/admin/send-request', verifyAdmin, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order reference required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ error: 'Review invitations may only be sent for Delivered orders.' });
    }

    let items = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) { items = []; }

    const firstItem = items[0];
    if (!firstItem) {
      return res.status(400).json({ error: 'No items in order' });
    }

    // Send email invitation
    await mailer.sendReviewInvitationEmail(order, firstItem);

    // Audit log
    const adminUser = req.admin ? req.admin.username : 'admin';
    db.prepare(`
      INSERT INTO audit_logs (admin_username, action, entity, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      adminUser,
      'REVIEW_INVITATION_SENT',
      'orders',
      String(order.id),
      `Sent post-delivery review invitation to ${order.customer_email} for order #${order.id}`
    );

    res.json({ message: `Review invitation sent successfully to ${order.customer_email}` });
  } catch (err) {
    console.error('Error sending review invitation:', err);
    res.status(500).json({ error: 'Failed to send review invitation: ' + err.message });
  }
});

module.exports = router;
