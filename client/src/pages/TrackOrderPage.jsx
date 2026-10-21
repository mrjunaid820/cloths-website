/**
 * ==============================================================================
 * AURA ATELIER — Client Logistics & Order Tracking Concierge
 * ==============================================================================
 * Real-time order monitoring interface for luxury patrons:
 * - Order reference lookup (e.g. ORD-89412) or customer telephone
 * - Multi-stage fulfillment stepper timeline (Registered -> Confirmed -> Tailored -> In Transit -> Delivered)
 * - Dynamic direct link to courier tracking portal (TCS, Leopards, Trax, PostEx)
 * - Automatic "Rate & Review Product" prompt strictly unlocked upon delivery
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Package, 
  MapPin, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Star,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { api } from '../api';
import { useSettings } from '../context/SettingsContext';
import { OrderReviewModal } from '../components/OrderReviewModal';

export function TrackOrderPage({ initialQuery, initialProductId, onNavigate }) {
  const { formatPrice } = useSettings();
  const [query, setQuery] = useState(initialQuery || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewingItem, setReviewingItem] = useState(null);

  const handleTrack = async (overrideQuery) => {
    const q = overrideQuery || query;
    if (!q || !q.trim()) return;

    setLoading(true);
    setError('');
    try {
      const data = await api.trackOrder(q.trim());
      setOrder(data);
      if (initialProductId && data.status === 'Delivered' && Array.isArray(data.items)) {
        const itemToReview = data.items.find(it => String(it.product_id || it.id) === String(initialProductId));
        if (itemToReview) {
          setReviewingItem(itemToReview);
        }
      }
    } catch (err) {
      setError(err.message || 'No order found matching the provided reference number or telephone.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleTrack(initialQuery);
    }
  }, [initialQuery, initialProductId]);

  // Order status steps timeline definition
  const steps = [
    { key: 'New', label: 'Order Registered', desc: 'Received online by atelier reception' },
    { key: 'Confirmed', label: 'Payment Confirmed', desc: 'Validated and scheduled for preparation' },
    { key: 'Processing', label: 'Tailored & Packaged', desc: 'Quality inspection & boutique gift packaging' },
    { key: 'Shipped', label: 'In Transit', desc: 'Dispatched with priority express air courier' },
    { key: 'Delivered', label: 'Delivered', desc: 'Successfully received by patron' }
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    const orderIndex = steps.findIndex((s) => s.key === currentStatus);
    const thisIndex = steps.findIndex((s) => s.key === stepKey);

    if (currentStatus === 'Cancelled') return 'cancelled';
    if (currentStatus === 'Returned') return 'returned';
    if (thisIndex < orderIndex) return 'completed';
    if (thisIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div 
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[75vh] transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span 
          className="text-xs tracking-[0.25em] uppercase font-semibold block mb-2"
          style={{ color: 'var(--accent-primary)' }}
        >
          Concierge Logistics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          Enter your unique Order Reference ID (e.g. <strong>ORD-89412</strong>) or registered phone number to monitor real-time fulfillment progress.
        </p>

        {/* Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleTrack(); }} className="mt-8 flex gap-2 max-w-md mx-auto">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Order ID or Phone..."
            className="flex-1 border rounded-xl p-3.5 text-xs focus:outline-none uppercase tracking-widest transition-colors shadow-sm"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl text-xs uppercase tracking-widest font-bold px-6 py-3.5 transition-all flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)'
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Tracking Information Display */}
      {order && (
        <div 
          className="border rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 animate-fade-in transition-colors duration-300"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          
          {/* Top Overview */}
          <div 
            className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b gap-4"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Order Tracking Status
              </span>
              <h2 className="font-serif text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <span>{order.id}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                  order.status === 'Delivered' 
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                    : order.status === 'Cancelled'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  {order.status}
                </span>
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Placed on {order.created_at || 'Recently'} by {order.customer_name} • {order.city}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span 
                  className="text-[11px] px-2.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Payment: <strong>{order.payment_method}</strong> ({order.payment_status || 'Pending'})
                </span>
                {order.courier_name && (
                  <span 
                    className="text-[11px] px-2.5 py-0.5 rounded-md border font-semibold"
                    style={{
                      backgroundColor: 'rgba(217, 119, 6, 0.1)',
                      borderColor: 'rgba(217, 119, 6, 0.3)',
                      color: 'var(--accent-primary)'
                    }}
                  >
                    Courier: {order.courier_name}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase block tracking-widest" style={{ color: 'var(--text-muted)' }}>Order Total (PKR)</span>
              <span className="font-serif text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Courier Live Tracking Bar if dispatched */}
          {order.courier_tracking_number && (
            <div 
              className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--accent-primary)' }}>
                    Courier Consignment Number ({order.courier_name || 'TCS / Leopards'})
                  </span>
                  <p className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{order.courier_tracking_number}</p>
                </div>
              </div>

              {order.courier_tracking_url && (
                <a
                  href={order.courier_tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all shrink-0 text-center hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  Track on {order.courier_name || 'Courier'} Portal →
                </a>
              )}
            </div>
          )}

          {/* Timeline Visual Steps */}
          <div>
            <h3 className="text-xs uppercase tracking-widest font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Fulfillment Milestones
            </h3>

            <div className="relative">
              {/* Stepper bar */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {steps.map((st, idx) => {
                  const state = getStepStatus(st.key, order.status);
                  return (
                    <div key={st.key} className="relative flex md:flex-col items-center gap-3 md:text-center">
                      {/* Step Circle */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-colors ${
                        state === 'completed' 
                          ? 'bg-emerald-600 text-white' 
                          : state === 'current'
                          ? 'ring-4'
                          : 'border'
                      }`}
                      style={
                        state === 'current' ? {
                          backgroundColor: 'var(--btn-primary-bg)',
                          color: 'var(--btn-primary-text)'
                        } : state === 'completed' ? {} : {
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                          borderColor: 'var(--border-subtle)'
                        }
                      }
                      >
                        {state === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      {/* Text */}
                      <div className="md:mt-2">
                        <h4 
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            state === 'current' ? 'font-bold' : ''
                          }`}
                          style={{
                            color: state === 'current' ? 'var(--text-primary)' : state === 'completed' ? '#10b981' : 'var(--text-muted)'
                          }}
                        >
                          {st.label}
                        </h4>
                        <p className="text-[11px] font-light hidden md:block mt-1" style={{ color: 'var(--text-muted)' }}>
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Status Event Logs */}
          {Array.isArray(order.tracking_history) && order.tracking_history.length > 0 && (
            <div className="border-t pt-6" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Tracking Updates & Courier Log
              </h4>
              <div className="divide-y text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                {order.tracking_history.map((h, i) => (
                  <div key={i} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      <strong className="uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{h.status}:</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{h.note}</span>
                    </div>
                    <span className="text-[11px] font-mono sm:text-right" style={{ color: 'var(--text-muted)' }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Destination & Ordered Items */}
          <div className="border-t pt-6 space-y-6" style={{ borderColor: 'var(--border-subtle)' }}>
            
            {/* Delivered Order Review Banner */}
            {order.status === 'Delivered' && (
              <div 
                className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.25)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Order Delivered • Verified Review Eligible
                    </span>
                    <p className="mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      As this order is marked <strong>Delivered</strong>, you can submit an authentic appraisal for each garment below to receive the official <strong>Verified Purchase</strong> badge.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Destination Address:
                </span>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{order.customer_name}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{order.address}</p>
                <p style={{ color: 'var(--text-secondary)' }}>{order.city} {order.postal_code}</p>
                <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Contact: {order.customer_phone}</p>
                <p style={{ color: 'var(--text-muted)' }}>Email: {order.customer_email}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold block mb-2" style={{ color: 'var(--text-muted)' }}>
                  Purchased Garments ({Array.isArray(order.items) ? order.items.length : 0}):
                </span>
                <div className="space-y-3">
                  {Array.isArray(order.items) && order.items.map((it, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)'
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {it.image && (
                          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border-subtle)' }}>
                            <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {it.name}
                          </h4>
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            Qty: {it.quantity} {it.size ? `• Size: ${it.size}` : ''} {it.color ? `• ${it.color}` : ''}
                          </p>
                          <p className="font-semibold text-xs mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(it.price * it.quantity)}
                          </p>
                        </div>
                      </div>

                      {/* Rate & Review Product Button: Only for Delivered status */}
                      {order.status === 'Delivered' && (
                        <button
                          type="button"
                          onClick={() => setReviewingItem(it)}
                          className="shrink-0 text-[11px] font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)',
                            borderColor: 'var(--border-subtle)'
                          }}
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>Rate & Review Product</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Verified Order Review Modal */}
      {reviewingItem && order && (
        <OrderReviewModal
          isOpen={Boolean(reviewingItem)}
          order={order}
          productItem={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onNavigate={onNavigate}
        />
      )}

    </div>
  );
}
