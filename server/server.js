/**
 * ==============================================================================
 * AURA ATELIER — Production Application Server
 * ==============================================================================
 * Primary HTTP backend powered by Node.js & Express 5.
 * Coordinates database access, REST APIs, static uploads, authentication,
 * order processing, courier integrations, and SPA frontend serving.
 * 
 * Features:
 * - Express 5 REST API architecture with modular routers
 * - SQLite persistent database initialization (WAL mode)
 * - Rate limiting on public checkout & login endpoints to prevent brute force
 * - Static file serving for luxury product photography & review uploads
 * - Single-Page Application (SPA) client fallback routing for React Router
 * - Centralized asynchronous error handling and process safety
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Initialize SQLite database, execute migrations, and seed default records
require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================================================================
// 1. Security & Request Parsing Middlewares
// ==============================================================================
app.use(cors({
  origin: true,
  credentials: true // Allow session cookies to be shared across requests
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ==============================================================================
// 2. Rate Limiting Protection
// ==============================================================================
// Mitigate checkout abuse, cart spamming, and automated order placement
const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 30, // Maximum 30 order placement attempts per IP per window
  message: { error: 'Too many checkout attempts from this connection. Please wait a few moments before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Protect administrator credentials from brute-force dictionary attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Maximum 20 login attempts per IP per window
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==============================================================================
// 3. Static Media Assets Storage
// ==============================================================================
// Ensure dedicated upload directories exist for product imagery and review photos
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==============================================================================
// 4. Operational Health Check Endpoint
// ==============================================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    brand: 'AURA ATELIER PAKISTAN',
    currency: 'PKR',
    locale: 'en-PK'
  });
});

// Apply rate limit rules to sensitive public paths
app.use('/api/orders', (req, res, next) => {
  if (req.method === 'POST') {
    return checkoutLimiter(req, res, next);
  }
  next();
});
app.use('/api/admin/login', loginLimiter);

// ==============================================================================
// 5. REST API Route Registrations
// ==============================================================================
app.use('/api/products', require('./routes/products'));         // Product catalog, variants, pricing & inventory
app.use('/api/categories', require('./routes/categories'));     // 14 Haute Couture fashion collections
app.use('/api/orders', require('./routes/orders'));             // Order placement, tracking & status updates
app.use('/api/payment', require('./routes/payment'));           // Payment options: COD, JazzCash, Easypaisa, Raast
app.use('/api/coupons', require('./routes/coupons'));           // Promotional discount vouchers
app.use('/api/reviews', require('./routes/reviews'));           // Verified customer appraisals, star ratings, photo reviews
app.use('/api/customers', require('./routes/customers'));       // Registered client directory and purchase histories
app.use('/api/settings', require('./routes/settings'));         // Boutique brand info, shipping thresholds, bank details
app.use('/api/messages', require('./routes/messages'));         // Concierge contact form inquiries
app.use('/api/admin', require('./routes/admin'));               // Administrative portal, stats, audit logs, CSV exports
app.use('/api/lookbooks', require('./routes/lookbooks'));       // Runway fashion lookbooks and interactive hotspots
app.use('/api/campaigns', require('./routes/campaigns'));       // Seasonal promotional banner campaigns
app.use('/api/size-guides', require('./routes/sizeGuides'));     // Bespoke garment sizing measurements
app.use('/api/price-alerts', require('./routes/priceAlerts'));   // Client price drop notifications

// ==============================================================================
// 6. Production SPA Frontend Serving & Route Fallback
// ==============================================================================
// In production builds, serve compiled React assets from client/dist and provide
// a fallback to index.html for client-side HTML5 history routing
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  
  // Express 5 compatible SPA fallback handler: sends index.html for all non-API GET requests
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// ==============================================================================
// 7. Global Centralized Error Handling
// ==============================================================================
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]:', err);
  res.status(500).json({
    error: 'An internal server error occurred',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// ==============================================================================
// 8. Server Bootstrapping
// ==============================================================================
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✨ AURA ATELIER PAKISTAN PRODUCTION SERVER RUNNING ON http://localhost:${PORT}`);
  console.log(`🇵🇰 Currency: Pakistani Rupees (PKR / Rs.)`);
  console.log(`🛡️  Admin API ready: Default login admin@atelier.com / admin123`);
  console.log(`💳 Payment Architecture: COD, JazzCash, Easypaisa, Raast IBFT`);
  console.log(`=======================================================`);
});
