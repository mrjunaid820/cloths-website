import React from 'react';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  MessageCircle, 
  Tag, 
  Truck, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export function CartPage({ onNavigate, onSelectProduct }) {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    deliveryFee, 
    discountAmount, 
    grandTotal, 
    amountToFreeShipping, 
    freeShippingProgress, 
    coupon, 
    couponCodeInput, 
    setCouponCodeInput, 
    couponLoading, 
    applyCoupon, 
    removeCoupon, 
    getWhatsAppCartUrl 
  } = useCart();

  const { formatPrice } = useSettings();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4 text-center transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <ShoppingBag className="w-10 h-10 opacity-60" style={{ color: 'var(--text-muted)' }} />
        </div>
        <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs uppercase tracking-widest max-w-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Explore our seasonal collection and timeless couture designs.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs tracking-widest uppercase font-bold py-4 px-8 rounded-xl shadow-md transition-all hover:opacity-90"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)'
          }}
        >
          Explore Collection
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Title */}
      <div className="border-b pb-6 mb-8" style={{ borderColor: 'var(--border-subtle)' }}>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Your Shopping Bag
        </h1>
        <p className="text-xs uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
          {items.reduce((s, i) => s + i.quantity, 0)} curated items selected
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Free Shipping Alert Bar */}
          <div className="border p-4 rounded-2xl shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            {amountToFreeShipping > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    Complimentary Worldwide Express Delivery
                  </span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Add {formatPrice(amountToFreeShipping)} more
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border-subtle)' }}>
                  <div 
                    className="h-full transition-all duration-500 rounded-full" 
                    style={{ 
                      width: `${freeShippingProgress}%`,
                      backgroundColor: 'var(--accent-primary)'
                    }} 
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>You have unlocked Complimentary Express Delivery on this commission!</span>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="border divide-y rounded-2xl overflow-hidden shadow-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            {items.map((item) => (
              <div key={`${item.product_id}-${item.size}-${item.color}`} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <div 
                  className="w-24 h-32 shrink-0 rounded-xl overflow-hidden border shadow-2xs"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--image-bg)'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center rounded-xl"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-serif text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.product_id, item.size, item.color)}
                        className="hover:text-rose-600 p-1 transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      <span>Size: <strong style={{ color: 'var(--text-primary)' }}>{item.size}</strong></span>
                      <span>Color: <strong style={{ color: 'var(--text-primary)' }}>{item.color}</strong></span>
                      <span style={{ color: 'var(--text-muted)' }}>SKU: {item.sku}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    {/* Qty controls */}
                    <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                        className="px-3 py-1.5 hover:opacity-75 transition-opacity"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                        className="px-3 py-1.5 hover:opacity-75 transition-opacity"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                        {formatPrice(item.price)} each
                      </span>
                      <span className="text-sm sm:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-xs tracking-widest uppercase font-semibold py-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Continue Browsing Collections
          </button>
        </div>

        {/* Right: Summary Box (4 cols) */}
        <div className="lg:col-span-4">
          <div 
            className="border p-6 sm:p-8 space-y-6 shadow-sm sticky top-28 rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h2 className="font-serif text-xl font-bold pb-4 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
              Order Summary
            </h2>

            {/* Coupon Code Input */}
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold block mb-2" style={{ color: 'var(--text-primary)' }}>
                Promotional Voucher
              </span>
              {!coupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. AURA10"
                    className="flex-1 border p-2.5 text-xs uppercase tracking-widest rounded-xl focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button
                    onClick={() => applyCoupon()}
                    disabled={couponLoading || !couponCodeInput}
                    className="text-xs px-4 py-2 uppercase tracking-wider font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
                    style={{
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)'
                    }}
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between p-3 border text-xs rounded-xl"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--accent-gold)',
                    color: 'var(--accent-gold)'
                  }}
                >
                  <span className="font-semibold">
                    Voucher <strong>{coupon.code}</strong> Active
                  </span>
                  <button onClick={removeCoupon} className="underline uppercase hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm border-t pt-4" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount Savings</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {deliveryFee === 0 ? 'Complimentary' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base font-bold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <span>Total Amount</span>
                <span className="font-serif text-lg">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => onNavigate('checkout')}
                className="w-full py-4 px-6 text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={getWhatsAppCartUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-3 px-6 text-xs tracking-widest uppercase font-bold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order Bag via WhatsApp</span>
              </a>
            </div>

            <div className="text-[11px] text-center flex items-center justify-center gap-2 pt-2" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Encrypted SSL 256-bit Secure Transaction</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
