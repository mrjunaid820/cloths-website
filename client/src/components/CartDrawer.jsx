import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  MessageCircle, 
  Check, 
  Tag, 
  Truck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export function CartDrawer({ onNavigate }) {
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
    isDrawerOpen, 
    setIsDrawerOpen,
    getWhatsAppCartUrl 
  } = useCart();

  const { formatPrice } = useSettings();

  if (!isDrawerOpen) return null;

  const handleCheckoutClick = () => {
    setIsDrawerOpen(false);
    onNavigate('checkout');
  };

  const handleFullCartClick = () => {
    setIsDrawerOpen(false);
    onNavigate('cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className="w-screen max-w-md shadow-2xl flex flex-col border-l animate-fade-in transition-colors"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          
          {/* Drawer Header */}
          <div 
            className="p-5 border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
              <h2 className="font-serif text-lg tracking-wider uppercase font-semibold" style={{ color: 'var(--text-primary)' }}>
                Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 transition-colors hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div 
            className="px-5 py-3.5 border-b text-xs"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {amountToFreeShipping > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    Complimentary Express Delivery
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Add {formatPrice(amountToFreeShipping)}
                  </span>
                </div>
                <div className="w-full h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border-subtle)' }}>
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
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium text-[11px] tracking-wider uppercase">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>You have unlocked Complimentary Worldwide Delivery!</span>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6" style={{ color: 'var(--text-muted)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <ShoppingBag className="w-8 h-8 opacity-60" style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Your bag is currently empty</h3>
                <p className="text-xs uppercase tracking-wider mb-6" style={{ color: 'var(--text-muted)' }}>
                  Explore our curated sartorial masterpieces
                </p>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onNavigate('shop');
                  }}
                  className="text-xs tracking-widest uppercase font-semibold py-3 px-6 rounded-xl transition-all shadow-xs hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="py-4 flex gap-4">
                  <div 
                    className="w-20 h-24 shrink-0 rounded-xl overflow-hidden border shadow-2xs"
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
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-semibold line-clamp-2 pr-2" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product_id, item.size, item.color)}
                          className="hover:text-rose-600 transition-colors p-1"
                          style={{ color: 'var(--text-muted)' }}
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        <span>Size: <strong style={{ color: 'var(--text-primary)' }}>{item.size}</strong></span>
                        <span>•</span>
                        <span>Color: <strong style={{ color: 'var(--text-primary)' }}>{item.color}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                          className="p-1 hover:opacity-75 transition-opacity"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold min-w-[20px] text-center" style={{ color: 'var(--text-primary)' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                          className="p-1 hover:opacity-75 transition-opacity"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Coupon & Checkout */}
          {items.length > 0 && (
            <div 
              className="p-5 border-t space-y-4 shadow-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              
              {/* Coupon Box */}
              {!coupon ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="ENTER PROMO (e.g. AURA10)"
                      className="w-full pl-9 pr-3 py-2 text-xs border uppercase tracking-widest rounded-xl focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => applyCoupon()}
                    disabled={couponLoading || !couponCodeInput}
                    className="text-xs px-4 py-2 uppercase tracking-wider font-semibold rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)'
                    }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between p-2.5 border text-xs rounded-xl"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'var(--accent-gold)',
                    color: 'var(--accent-gold)'
                  }}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon <strong>{coupon.code}</strong> applied</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-[11px] underline uppercase hover:opacity-80"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount Savings</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                  <span>Delivery Charges</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {deliveryFee === 0 ? 'Complimentary' : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="h-px my-1" style={{ backgroundColor: 'var(--border-subtle)' }} />
                <div className="flex justify-between text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  <span>Estimated Total</span>
                  <span className="font-serif text-base" style={{ color: 'var(--text-primary)' }}>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3.5 px-4 text-xs tracking-widest uppercase font-semibold transition-all flex items-center justify-center gap-2 rounded-xl shadow-xs hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* WhatsApp Direct Order Button */}
                <a
                  href={getWhatsAppCartUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-2.5 px-4 text-xs tracking-widest uppercase font-semibold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order Entire Bag via WhatsApp</span>
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={handleFullCartClick}
                    className="flex-1 py-2 text-[11px] uppercase tracking-wider text-center font-medium border rounded-xl hover:opacity-80 transition-opacity"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    View Cart Details
                  </button>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 py-2 text-[11px] uppercase tracking-wider text-center font-medium border rounded-xl hover:opacity-80 transition-opacity"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
