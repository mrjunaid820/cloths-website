/**
 * ==============================================================================
 * AURA ATELIER — Centralized HTTP Client & API Interface
 * ==============================================================================
 * Provides typed, error-handled access to all backend REST micro-services:
 * - Products, Categories, Lookbooks & Seasonal Campaigns
 * - Orders, Checkout, Pakistani Courier Tracking (TCS/Leopards)
 * - Reviews, Craftsmanship Ratings & Photo Uploads
 * - Administrator Operations, Financial Stats, CSV Exports & Authentication
 * 
 * Security:
 * - Intercepts requests to inject sessionStorage/cookie bearer tokens
 * - Sends `credentials: 'same-origin'` to share HttpOnly session cookies
 * - Normalizes error payloads for consistent toast feedback
 * ==============================================================================
 */

const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = sessionStorage.getItem('aura_admin_token') || localStorage.getItem('aura_admin_token');
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    }
    const qStr = query.toString();
    return request(`/products${qStr ? '?' + qStr : ''}`);
  },
  getProduct: (idOrSlug) => request(`/products/${idOrSlug}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  duplicateProduct: (id) => request(`/products/${id}/duplicate`, { method: 'POST' }),
  uploadImages: (formData) => request('/products/upload', { method: 'POST', body: formData }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Orders
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  trackOrder: (ref) => request(`/orders/track/${encodeURIComponent(ref)}`),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? '?' + query : ''}`);
  },
  getOrder: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status, note, courier_name, courier_tracking_number, payment_status) => request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note, courier_name, courier_tracking_number, payment_status })
  }),

  // Coupons
  validateCoupon: (code, subtotal) => request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal })
  }),
  getCoupons: () => request('/coupons'),
  createCoupon: (data) => request('/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id, data) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),

  // Reviews
  getReviews: (productId) => request(`/reviews/${productId}`),
  createReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  checkReviewEligibility: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reviews/check/eligibility?${q}`);
  },
  updateReview: (id, data) => request(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReview: (id, data) => request(`/reviews/${id}`, { method: 'DELETE', body: JSON.stringify(data) }),
  voteReviewHelpful: (id, voterId) => request(`/reviews/${id}/helpful`, {
    method: 'POST',
    body: JSON.stringify({ voterId })
  }),
  uploadReviewPhotos: (formData) => request('/reviews/upload-photos', { method: 'POST', body: formData }),

  // Admin Review Moderation
  getAdminReviews: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reviews/admin/all${q ? '?' + q : ''}`);
  },
  updateReviewStatus: (id, status, reason) => request(`/reviews/admin/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason })
  }),
  respondToReview: (id, response) => request(`/reviews/admin/${id}/response`, {
    method: 'POST',
    body: JSON.stringify({ response })
  }),
  deleteAdminReview: (id, reason) => request(`/reviews/admin/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason })
  }),
  sendReviewInvitation: (orderId) => request('/reviews/admin/send-request', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  }),

  // Customers
  getCustomers: (search = '') => request(`/customers${search ? '?search=' + encodeURIComponent(search) : ''}`),
  getCustomer: (id) => request(`/customers/${id}`),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Messages (Contact)
  sendMessage: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  getMessages: () => request('/messages'),
  markMessageRead: (id) => request(`/messages/${id}/read`, { method: 'PATCH' }),
  deleteMessage: (id) => request(`/messages/${id}`, { method: 'DELETE' }),

  // Admin Auth & Stats
  adminLogin: (identifier, password) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  }),
  adminLogout: () => request('/admin/logout', { method: 'POST' }),
  getAdminProfile: () => request('/admin/me'),
  changePassword: (currentPassword, newPassword) => request('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),
  forgotPassword: (email) => request('/admin/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  resetPassword: (token, newPassword) => request('/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword })
  }),
  getAdminStats: () => request('/admin/stats'),
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${query ? '?' + query : ''}`);
  },
  getInventoryAlerts: () => request('/admin/inventory/alerts'),
  exportOrdersCSV: async (params = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    }
    const token = sessionStorage.getItem('aura_admin_token') || localStorage.getItem('aura_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/admin/reports/orders/export?${query.toString()}`, {
      headers,
      credentials: 'same-origin'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Export failed with status ${res.status}`);
    }

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition');
    let filename = `customer-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
  },

  // Product Extended (Recommendations, Bulk, Reorder)
  getProductRecommendations: (id) => request(`/products/${id}/recommendations`),
  bulkUpdateProductStatus: (ids, status) => request('/products/bulk-status', {
    method: 'POST',
    body: JSON.stringify({ ids, status })
  }),
  bulkUpdateProductDiscount: (ids, discount_percent) => request('/products/bulk-discount', {
    method: 'POST',
    body: JSON.stringify({ ids, discount_percent })
  }),
  bulkDeleteProducts: (ids) => request('/products/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids })
  }),
  reorderProductImages: (id, images) => request(`/products/${id}/reorder-images`, {
    method: 'POST',
    body: JSON.stringify({ images })
  }),

  // Lookbooks
  getLookbooks: () => request('/lookbooks'),
  getAllLookbooks: () => request('/lookbooks/all'),
  createLookbook: (data) => request('/lookbooks', { method: 'POST', body: JSON.stringify(data) }),
  updateLookbook: (id, data) => request(`/lookbooks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLookbook: (id) => request(`/lookbooks/${id}`, { method: 'DELETE' }),
  addLookbookHotspot: (lookbookId, data) => request(`/lookbooks/${lookbookId}/hotspots`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteLookbookHotspot: (hotspotId) => request(`/lookbooks/hotspots/${hotspotId}`, { method: 'DELETE' }),

  // Seasonal Campaigns
  getActiveCampaign: () => request('/campaigns'),
  getAllCampaigns: () => request('/campaigns/all'),
  createCampaign: (data) => request('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  updateCampaign: (id, data) => request(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCampaign: (id) => request(`/campaigns/${id}`, { method: 'DELETE' }),

  // Size Guides
  getSizeGuides: () => request('/size-guides'),
  getSizeGuideByCategory: (category) => request(`/size-guides/${encodeURIComponent(category)}`),
  upsertSizeGuide: (data) => request('/size-guides', { method: 'POST', body: JSON.stringify(data) }),

  // Price Alerts
  createPriceAlert: (productId, email, desiredPrice) => request('/price-alerts', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, email, desired_price: desiredPrice })
  }),
  getAllPriceAlerts: () => request('/price-alerts/all'),
};
