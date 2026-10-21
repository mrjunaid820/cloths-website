/**
 * ==============================================================================
 * AURA ATELIER — Application Root & Client-Side Router
 * ==============================================================================
 * Master application orchestrator coordinating context providers & views:
 * - HTML5 History API URL routing with browser popstate Back/Forward support
 * - Dedicated admin routes (/admin/dashboard, /admin/orders, /admin/products, etc.)
 * - Session state preservation across page refreshes (no kickback to homepage)
 * - Deep link query handlers for order review invitations (?reviewOrderId=...)
 * - Global layout overlays: Cart Drawer, Wishlist Drawer, Search Modal, Quick View
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Public Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';

// Public Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PolicyPage } from './pages/PolicyPages';
import { AccountPage } from './pages/AccountPage';

// Admin Components
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminMessages } from './pages/admin/AdminMessages';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminReviews } from './pages/admin/AdminReviews';

const VALID_ADMIN_TABS = ['overview', 'products', 'orders', 'reviews', 'inventory', 'customers', 'coupons', 'messages', 'settings'];

function parseCurrentRoute() {
  if (typeof window === 'undefined') return { page: 'home', params: {} };
  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);

  // Dedicated admin routes: /admin, /admin/dashboard, /admin/orders, /admin/products, etc.
  if (path === '/admin' || path === '/admin/dashboard' || path.startsWith('/admin/')) {
    let tab = 'overview';
    const sub = path.replace(/^\/admin(\/dashboard)?\/?/, '').trim();
    if (sub && VALID_ADMIN_TABS.includes(sub)) {
      tab = sub;
    } else if (searchParams.get('tab') && VALID_ADMIN_TABS.includes(searchParams.get('tab'))) {
      tab = searchParams.get('tab');
    }
    return { page: 'admin', adminTab: tab, params: Object.fromEntries(searchParams.entries()) };
  }

  // Public boutique routes
  if (path === '/shop') return { page: 'shop', params: Object.fromEntries(searchParams.entries()) };
  if (path === '/cart') return { page: 'cart', params: {} };
  if (path === '/checkout') return { page: 'checkout', params: {} };
  if (path === '/order-success') return { page: 'order-success', params: {} };
  if (path === '/track') return { 
    page: 'track', 
    params: { 
      query: searchParams.get('query') || searchParams.get('orderId') || '', 
      productId: searchParams.get('productId') || searchParams.get('reviewProductId') || '' 
    } 
  };
  if (path === '/account') return { page: 'account', params: {} };
  if (path === '/about') return { page: 'about', params: {} };
  if (path === '/contact') return { page: 'contact', params: {} };
  if (path === '/faq') return { page: 'faq', params: {} };
  if (path === '/shipping-policy') return { page: 'shipping-policy', params: {} };
  if (path === '/return-policy') return { page: 'return-policy', params: {} };
  if (path === '/privacy-policy') return { page: 'privacy-policy', params: {} };
  if (path === '/terms') return { page: 'terms', params: {} };

  if (path.startsWith('/product/')) {
    const productId = path.replace('/product/', '').trim();
    return { page: 'product', params: { productId } };
  }
  if (path === '/product') {
    return { page: 'product', params: { productId: searchParams.get('productId') || searchParams.get('id') } };
  }

  return { page: 'home', params: Object.fromEntries(searchParams.entries()) };
}

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  // Route Initialization from current URL (persists across page refresh)
  const [currentRoute, setCurrentRoute] = useState(() => parseCurrentRoute());
  const [currentPage, setCurrentPage] = useState(() => currentRoute.page);
  const [navParams, setNavParams] = useState(() => currentRoute.params || {});
  const [adminTab, setAdminTab] = useState(() => currentRoute.adminTab || 'overview');

  // Active Product for dedicated Product Details page
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Active Order for confirmation page
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Overlays
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Listen to browser Back/Forward navigation (PopState)
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setCurrentPage(route.page);
      if (route.adminTab) setAdminTab(route.adminTab);
      setNavParams(route.params || {});
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check URL parameters on mount (e.g. from review email / WhatsApp direct link)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const reviewOrderId = params.get('reviewOrderId');
      const reviewProductId = params.get('reviewProductId');
      if (reviewOrderId) {
        navigate('track', { query: reviewOrderId, productId: reviewProductId });
      }
    } catch (e) {}
  }, []);

  // Standard navigation with history URL sync
  const navigate = (page, params = {}, replace = false) => {
    setCurrentPage(page);
    setNavParams(params);

    let newUrl = '/';
    if (page === 'admin') {
      const targetTab = params.tab || (page === currentPage ? adminTab : 'overview');
      if (targetTab) setAdminTab(targetTab);
      newUrl = targetTab === 'overview' ? '/admin/dashboard' : `/admin/${targetTab}`;
    } else if (page === 'home') {
      newUrl = '/';
    } else if (page === 'product' && params.productId) {
      newUrl = `/product/${params.productId}`;
    } else {
      const q = new URLSearchParams(params).toString();
      newUrl = `/${page}${q ? '?' + q : ''}`;
    }

    if (replace) {
      window.history.replaceState({ page, params, adminTab: params.tab || adminTab }, '', newUrl);
    } else if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState({ page, params, adminTab: params.tab || adminTab }, '', newUrl);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminTabChange = (newTab) => {
    setAdminTab(newTab);
    const newUrl = newTab === 'overview' ? '/admin/dashboard' : `/admin/${newTab}`;
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ page: 'admin', adminTab: newTab }, '', newUrl);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    navigate('product', { productId: product.id });
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const handleOrderSuccess = (order) => {
    setConfirmedOrder(order);
    navigate('order-success', { order });
  };

  // If on admin route
  if (currentPage === 'admin') {
    // Wait for authentication check to complete on startup/refresh
    if (authLoading) {
      return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-amber-400 font-mono text-xs space-y-4">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="font-bold uppercase tracking-widest text-white mb-1">AURA ATELIER CONSOLE</p>
            <p className="text-stone-400">Verifying administrator session & credentials...</p>
          </div>
        </div>
      );
    }

    // If not authenticated or expired, show login on the same admin route
    if (!isAuthenticated) {
      return (
        <AdminLogin 
          onExitToStore={() => navigate('home')} 
          onLoginSuccess={() => {
            navigate('admin', { tab: adminTab });
          }}
        />
      );
    }

    // Authenticated admin view (preserved across refresh)
    return (
      <AdminLayout
        activeTab={adminTab}
        onTabChange={handleAdminTabChange}
        onExitToStore={() => navigate('home')}
      >
        {adminTab === 'overview' && (
          <AdminOverview 
            onTabChange={handleAdminTabChange} 
            onSelectOrder={(ord) => handleAdminTabChange('orders')} 
          />
        )}
        {adminTab === 'products' && <AdminProducts />}
        {adminTab === 'orders' && <AdminOrders />}
        {adminTab === 'reviews' && <AdminReviews />}
        {adminTab === 'inventory' && <AdminInventory />}
        {adminTab === 'customers' && <AdminCustomers />}
        {adminTab === 'coupons' && <AdminCoupons />}
        {adminTab === 'messages' && <AdminMessages />}
        {adminTab === 'settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  // Public Storefront View
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Sticky Header */}
      <Header
        onNavigate={navigate}
        currentPage={currentPage}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Page Router */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={navigate}
            onSelectProduct={handleSelectProduct}
            onQuickView={handleQuickView}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            initialCategory={navParams.category}
            initialFilter={navParams.filter}
            initialSearch={navParams.search}
            onSelectProduct={handleSelectProduct}
            onQuickView={handleQuickView}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'product' && (
          <ProductPage
            product={selectedProduct}
            productIdOrSlug={navParams.productId}
            onSelectProduct={handleSelectProduct}
            onQuickView={handleQuickView}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            onNavigate={navigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            onNavigate={navigate}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentPage === 'order-success' && (
          <OrderSuccessPage
            order={confirmedOrder || navParams.order}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'track' && (
          <TrackOrderPage
            initialQuery={navParams.query}
            initialProductId={navParams.productId}
            onNavigate={navigate}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage onNavigate={navigate} />
        )}

        {currentPage === 'contact' && (
          <ContactPage />
        )}

        {currentPage === 'faq' && (
          <FAQPage onNavigate={navigate} />
        )}

        {currentPage === 'shipping-policy' && (
          <PolicyPage type="shipping" />
        )}

        {currentPage === 'return-policy' && (
          <PolicyPage type="return" />
        )}

        {currentPage === 'privacy-policy' && (
          <PolicyPage type="privacy" />
        )}

        {currentPage === 'terms' && (
          <PolicyPage type="terms" />
        )}

        {currentPage === 'account' && (
          <AccountPage
            onNavigate={navigate}
            onSelectProduct={handleSelectProduct}
          />
        )}
      </main>

      {/* Luxury Footer */}
      <Footer onNavigate={navigate} />

      {/* Modals & Sliders */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectProduct={handleSelectProduct}
        onNavigate={navigate}
      />

      <CartDrawer onNavigate={navigate} />

      <WishlistDrawer
        onSelectProduct={handleSelectProduct}
        onNavigate={navigate}
      />

      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onSelectProduct={handleSelectProduct}
        onNavigate={navigate}
      />

      {/* Floating Concierge WhatsApp Action */}
      <FloatingWhatsApp />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <AdminAuthProvider>
                <AppContent />
              </AdminAuthProvider>
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
