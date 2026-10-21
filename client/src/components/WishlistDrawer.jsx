import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export function WishlistDrawer({ onSelectProduct, onNavigate }) {
  const { wishlist, removeFromWishlist, isWishlistOpen, setIsWishlistOpen } = useWishlist();
  const { addToCart, setIsDrawerOpen } = useCart();
  const { formatPrice } = useSettings();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className="w-screen max-w-md shadow-2xl flex flex-col border-l animate-fade-in transition-colors duration-300"
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header */}
          <div 
            className="p-5 border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 fill-current" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="font-serif text-lg tracking-wider uppercase font-semibold" style={{ color: 'var(--text-primary)' }}>
                Saved Wishlist ({wishlist.length})
              </h2>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-1.5 hover:opacity-75 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items */}
          <div 
            className="flex-1 overflow-y-auto p-5 divide-y"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {wishlist.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6" style={{ color: 'var(--text-muted)' }}>
                <Heart className="w-12 h-12 mb-3 stroke-1" style={{ color: 'var(--text-muted)' }} />
                <h3 className="font-serif text-lg mb-1" style={{ color: 'var(--text-primary)' }}>Your wishlist is empty</h3>
                <p className="text-xs uppercase tracking-wider mb-6" style={{ color: 'var(--text-muted)' }}>
                  Save your desired runway and ready-to-wear pieces here.
                </p>
                <button
                  onClick={() => {
                    setIsWishlistOpen(false);
                    onNavigate('shop');
                  }}
                  className="rounded-xl text-xs tracking-widest uppercase font-semibold py-3 px-6 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  Explore Collection
                </button>
              </div>
            ) : (
              wishlist.map((item) => {
                const img = Array.isArray(item.images) ? item.images[0] : item.image;
                return (
                  <div key={item.id} className="py-4 flex gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                      <img
                        src={img}
                        alt={item.name}
                        onClick={() => {
                          setIsWishlistOpen(false);
                          onSelectProduct(item);
                        }}
                        className="w-full h-full object-cover object-center cursor-pointer transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 
                            onClick={() => {
                              setIsWishlistOpen(false);
                              onSelectProduct(item);
                            }}
                            className="text-xs font-semibold line-clamp-2 cursor-pointer hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.name}
                          </h4>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="hover:text-rose-600 p-1 transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider mt-1 block" style={{ color: 'var(--text-muted)' }}>
                          {item.category}
                        </span>
                        <div className="text-xs font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
                          {formatPrice(item.price)}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const size = Array.isArray(item.sizes) ? item.sizes[0] : 'M';
                          const color = Array.isArray(item.colors) ? (item.colors[0]?.name || item.colors[0]) : 'Standard';
                          addToCart(item, size, color, 1);
                          setIsWishlistOpen(false);
                          setIsDrawerOpen(true);
                        }}
                        className="mt-3 w-full py-2.5 rounded-xl text-[11px] tracking-widest uppercase font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:opacity-90 active:scale-[0.98]"
                        style={{
                          backgroundColor: 'var(--btn-primary-bg)',
                          color: 'var(--btn-primary-text)'
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {wishlist.length > 0 && (
            <div 
              className="p-4 border-t"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <button
                onClick={() => {
                  setIsWishlistOpen(false);
                  onNavigate('shop');
                }}
                className="w-full text-center text-xs tracking-widest uppercase font-semibold py-2 transition-colors hover:opacity-80"
                style={{ color: 'var(--text-secondary)' }}
              >
                Continue Browsing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
