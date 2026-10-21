/**
 * ==============================================================================
 * AURA ATELIER — Patron Suite & Personal Archive Controller
 * ==============================================================================
 * Account and curation suite for boutique patrons:
 * - Order history records inspection & courier tracking status
 * - Automatic "Rate & Review Product" triggers for all delivered items
 * - Personal wishlist management with single-click transfer to shopping bag
 * - Secure staff admin portal gateway entry
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShoppingBag, 
  Heart, 
  Truck, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  ArrowRight,
  Star,
  Package,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { OrderReviewModal } from '../components/OrderReviewModal';

export function AccountPage({ onNavigate, onSelectProduct }) {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, setIsDrawerOpen } = useCart();
  const { formatPrice, settings } = useSettings();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist'
  const [orderSearchId, setOrderSearchId] = useState('');
  
  // Orders tracking states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Active review modal state
  const [reviewModalData, setReviewModalData] = useState(null); // { order, item }

  // Load customer recent orders on mount
  const loadRecentOrders = async () => {
    setOrdersLoading(true);
    setSearchError('');
    try {
      let savedIds = [];
      try {
        const raw = localStorage.getItem('aura_customer_orders');
        savedIds = raw ? JSON.parse(raw) : [];
      } catch {
        savedIds = [];
      }

      // If no stored orders yet, preload sample delivered order for effortless demonstration
      if (!savedIds.length) {
        savedIds = ['ORD-89412', 'PK-509155'];
      }

      const fetched = [];
      for (const id of savedIds.slice(0, 5)) {
        try {
          const ord = await api.trackOrder(id);
          if (ord && ord.id) fetched.push(ord);
        } catch (e) {
          // ignore single order fetch error
        }
      }
      setOrders(fetched);
    } catch (err) {
      console.error('Failed to load recent orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadRecentOrders();
  }, []);

  // Search single order by ID or phone
  const handleSearchOrder = async (e) => {
    if (e) e.preventDefault();
    if (!orderSearchId.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    try {
      const ord = await api.trackOrder(orderSearchId.trim());
      if (ord && ord.id) {
        setOrders(prev => {
          const filtered = prev.filter(o => o.id !== ord.id);
          return [ord, ...filtered];
        });
        // Cache to localStorage
        try {
          const existing = JSON.parse(localStorage.getItem('aura_customer_orders') || '[]');
          const updated = [ord.id, ...existing.filter(i => i !== ord.id)].slice(0, 10);
          localStorage.setItem('aura_customer_orders', JSON.stringify(updated));
        } catch (e) {}
      }
    } catch (err) {
      setSearchError(err.message || 'No order found matching the provided reference number.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div 
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[75vh] transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      
      {/* Top Banner */}
      <div 
        className="border-b pb-8 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <span 
            className="text-xs uppercase tracking-[0.25em] font-semibold block mb-1"
            style={{ color: 'var(--accent-primary)' }}
          >
            Client Suite
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Patron Account & Archives
          </h1>
        </div>

        <button
          onClick={() => onNavigate('admin')}
          className="self-start sm:self-auto rounded-xl text-xs uppercase tracking-widest font-bold py-2.5 px-4 flex items-center gap-2 border shadow-sm transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span>Staff Admin Portal</span>
        </button>
      </div>

      {/* Tabs */}
      <div 
        className="flex border-b gap-8 text-xs tracking-widest uppercase font-bold mb-8"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          onClick={() => setActiveTab('orders')}
          className="pb-3 transition-colors relative"
          style={{
            color: activeTab === 'orders' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'orders' ? '2px solid var(--accent-primary)' : 'none'
          }}
        >
          Order History & Reviews ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className="pb-3 transition-colors relative"
          style={{
            color: activeTab === 'wishlist' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'wishlist' ? '2px solid var(--accent-primary)' : 'none'
          }}
        >
          Saved Wishlist ({wishlist.length})
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Order Search Bar */}
          <div 
            className="border rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-sm transition-colors duration-300"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h3 className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Look Up Order & Review Garments
              </h3>
            </div>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              Enter your Order Reference ID (e.g. <strong>ORD-89412</strong>) or registered phone number. Once marked as <strong>Delivered</strong>, you can rate and review your purchased garments.
            </p>

            <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={orderSearchId}
                onChange={(e) => setOrderSearchId(e.target.value)}
                placeholder="Enter Order Reference ID (e.g. ORD-89412)..."
                className="flex-1 border rounded-xl p-3.5 text-xs uppercase tracking-wider focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="rounded-xl text-xs uppercase tracking-widest font-bold px-6 py-3.5 transition-all shadow-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Look Up</span>
              </button>
            </form>

            {searchError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="py-12 text-center text-xs flex items-center justify-center gap-2" style={{ color: 'var(--accent-primary)' }}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Retrieving order archives...</span>
            </div>
          ) : orders.length === 0 ? (
            <div 
              className="border rounded-2xl p-12 text-center max-w-2xl mx-auto"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <Package className="w-12 h-12 mx-auto mb-3 stroke-1" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-serif text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No Orders on Record</h3>
              <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
                Search for an existing order ID above or discover our new runway collections.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="rounded-xl text-xs tracking-widest uppercase font-bold py-3.5 px-6 transition-all shadow-md hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {orders.map((ord) => {
                const isDelivered = ord.status === 'Delivered';
                return (
                  <div 
                    key={ord.id}
                    className="border rounded-2xl p-5 sm:p-7 shadow-sm transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            {ord.id}
                          </span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                            isDelivered 
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                              : ord.status === 'Cancelled'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Placed on {ord.created_at || 'Recently'} • {ord.customer_name} • {ord.city}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase block tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                          <span className="font-serif text-base font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(ord.total_amount)}</span>
                        </div>
                        <button
                          onClick={() => onNavigate('track', { query: ord.id })}
                          className="px-3 py-1.5 rounded-lg border text-[11px] font-semibold uppercase tracking-wider transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <span>Full Tracking</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Delivered Prompt Banner */}
                    {isDelivered && (
                      <div 
                        className="my-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          borderColor: 'rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span style={{ color: 'var(--text-secondary)' }}>
                          This order has been successfully delivered. You can submit your verified appraisal for each garment below:
                        </span>
                      </div>
                    )}

                    {/* Order Line Items */}
                    <div className="mt-4 space-y-3">
                      {Array.isArray(ord.items) && ord.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            borderColor: 'var(--border-subtle)'
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.image && (
                              <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border-subtle)' }}>
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-serif text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {item.name}
                              </h4>
                              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ''} {item.color ? `• ${item.color}` : ''}
                              </p>
                              <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                                {formatPrice(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>

                          {/* Rate & Review Button: STRICTLY only when order.status is Delivered */}
                          {isDelivered ? (
                            <button
                              type="button"
                              onClick={() => setReviewModalData({ order: ord, item })}
                              className="shrink-0 rounded-xl text-xs uppercase tracking-wider font-bold py-2.5 px-4 flex items-center justify-center gap-2 border shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                              style={{
                                backgroundColor: 'var(--btn-primary-bg)',
                                color: 'var(--btn-primary-text)',
                                borderColor: 'var(--border-subtle)'
                              }}
                            >
                              <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                              <span>Rate & Review Product</span>
                            </button>
                          ) : (
                            <span 
                              className="shrink-0 text-[11px] px-3 py-1.5 rounded-lg border font-medium text-center"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--text-muted)'
                              }}
                            >
                              Reviews available upon delivery
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Wishlist Tab Content */}
      {activeTab === 'wishlist' && (
        <div className="animate-fade-in">
          {wishlist.length === 0 ? (
            <div 
              className="border rounded-2xl p-12 text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <Heart className="w-12 h-12 mx-auto mb-3 stroke-1" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-serif text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No Pieces in Wishlist</h3>
              <p className="text-xs uppercase tracking-wider mb-6" style={{ color: 'var(--text-muted)' }}>
                Curate your personal collection of desired runway designs.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="rounded-xl text-xs tracking-widest uppercase font-bold py-3.5 px-6 transition-all shadow-md hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlist.map((item) => {
                const img = Array.isArray(item.images) ? item.images[0] : item.image;
                return (
                  <div 
                    key={item.id} 
                    className="border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-stone-100 dark:bg-stone-800">
                        <img src={img} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider block font-medium" style={{ color: 'var(--text-muted)' }}>{item.category}</span>
                      <h4 className="font-serif text-sm font-bold mt-0.5 line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.name}</h4>
                      <span className="text-xs font-semibold mt-1 block" style={{ color: 'var(--text-primary)' }}>{formatPrice(item.price)}</span>
                    </div>

                    <div 
                      className="space-y-2 mt-4 pt-3 border-t"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <button
                        onClick={() => {
                          const size = Array.isArray(item.sizes) ? item.sizes[0] : 'M';
                          const color = Array.isArray(item.colors) ? (item.colors[0]?.name || item.colors[0]) : 'Standard';
                          addToCart(item, size, color, 1);
                          setIsDrawerOpen(true);
                        }}
                        className="w-full rounded-xl text-[11px] tracking-wider uppercase font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-90 active:scale-[0.98]"
                        style={{
                          backgroundColor: 'var(--btn-primary-bg)',
                          color: 'var(--btn-primary-text)'
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="w-full text-[10px] uppercase tracking-wider py-1 hover:text-rose-600 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalData && (
        <OrderReviewModal
          isOpen={Boolean(reviewModalData)}
          order={reviewModalData.order}
          productItem={reviewModalData.item}
          onClose={() => setReviewModalData(null)}
          onNavigate={onNavigate}
        />
      )}

    </div>
  );
}
