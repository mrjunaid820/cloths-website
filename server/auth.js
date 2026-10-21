/**
 * ==============================================================================
 * AURA ATELIER — Administrator Authentication & Security Engine
 * ==============================================================================
 * Implements JWT (JSON Web Token) issuance and multi-source verification.
 * 
 * Authentication Strategy:
 * - Issues signed tokens valid for 7 days containing administrative claims.
 * - Extracts credentials from three independent transmission channels:
 *   1. Standard HTTP Authorization header: "Bearer <token>" (for AJAX requests)
 *   2. URL query parameter: "?token=<token>" (for direct file exports & downloads)
 *   3. Secure HTTP-only session cookie: "aura_admin_token" (for seamless page refreshes)
 * - Guarantees sensitive endpoints remain strictly protected from unauthorized visitors.
 * ==============================================================================
 */

const jwt = require('jsonwebtoken');

// Secret key for cryptographic signing (configurable via environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'aura-atelier-super-secret-jwt-key-2026';

/**
 * Generate a cryptographically signed JWT for an authenticated administrator.
 * @param {Object} admin - Administrator record from SQLite database
 * @param {number} admin.id - Primary key ID
 * @param {string} admin.username - Admin username
 * @param {string} admin.email - Admin email
 * @param {string} admin.role - Assigned administrative role
 * @returns {string} Signed JWT token string (expires in 7 days)
 */
function generateToken(admin) {
  return jwt.sign(
    { 
      id: admin.id, 
      username: admin.username, 
      email: admin.email, 
      role: admin.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Express middleware to protect administrative routes.
 * Inspects Authorization headers, query string tokens, and HTTP session cookies.
 * Rejects unauthenticated or expired requests with HTTP 401 Unauthorized.
 */
function verifyAdmin(req, res, next) {
  let token = null;

  // Channel 1: HTTP Authorization Bearer Header (Standard REST API calls)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // Channel 2: URL Query Parameter (Direct browser download tabs, e.g. CSV reports)
  else if (req.query && req.query.token) {
    token = req.query.token;
  } 
  // Channel 3: Secure HTTP Cookie (Direct browser navigation & page refresh preservation)
  else if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const parts = c.trim().split('=');
      if (parts.length >= 2) {
        acc[parts[0]] = parts.slice(1).join('=');
      }
      return acc;
    }, {});
    token = cookies['aura_admin_token'];
  }

  // Reject if no credential token was provided across any channel
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Access token missing' });
  }

  try {
    // Cryptographically verify signature and token expiration
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Attach validated claims to the request context
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyAdmin
};
