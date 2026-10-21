import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag, Zap, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export function ProductCard({ product, onSelectProduct, onQuickView, onNavigate }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, setIsDrawerOpen } = useCart();
  const { formatPrice } = useSettings();

  const [isHovered, setIsHovered] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000'];
  const primaryImg = images[0];
  const secondaryImg = images[1] || primaryImg;
  const hasMultipleImages = images.length > 1;

  const isFav = isInWishlist(product.id);

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    setHeartAnim(true);
    toggleWishlist(product);
    setTimeout(() => setHeartAnim(false), 400);
  };

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    const size = Array.isArray(product.sizes) ? product.sizes[0] : 'M';
    const color = Array.isArray(product.colors) ? (product.colors[0]?.name || product.colors[0]) : 'Standard';
    addToCart(product, size, color, 1);
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    const size = Array.isArray(product.sizes) ? product.sizes[0] : 'M';
    const color = Array.isArray(product.colors) ? (product.colors[0]?.name || product.colors[0]) : 'Standard';
    addToCart(product, size, color, 1);
    if (onNavigate) {
      onNavigate('checkout');
    }
  };

  return (
    <div 
      className="group relative flex flex-col p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--card-shadow)'
      }}
      onClick={() => onSelectProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Elegantly Rounded Product Image Container Frame */}
      <div 
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[14px] sm:rounded-[16px] transition-transform duration-500"
        style={{ backgroundColor: 'var(--image-bg)' }}
      >
        {/* Primary Image (Always Mounted) */}
        <img
          src={images[activeImgIndex] || primaryImg}
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-cover object-center rounded-[14px] sm:rounded-[16px] transition-all duration-700 ease-out group-hover:scale-105 ${
            isHovered && hasMultipleImages && activeImgIndex === 0 ? 'sm:opacity-0' : 'opacity-100'
          }`}
        />

        {/* Secondary Back/Alternate Image (Smooth Crossfade on Desktop Hover) */}
        {hasMultipleImages && (
          <img
            src={secondaryImg}
            alt={`${product.name} alternate view`}
            loading="lazy"
            aria-hidden="true"
            className={`hidden sm:block absolute inset-0 w-full h-full object-cover object-center rounded-[14px] sm:rounded-[16px] transition-all duration-700 ease-out group-hover:scale-105 ${
              isHovered && activeImgIndex === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Mobile Alternate Image Indicator Dots */}
        {hasMultipleImages && (
          <div 
            className="sm:hidden absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex(i);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeImgIndex === i ? 'bg-white w-3' : 'bg-white/50'
                }`}
                aria-label={`View photo ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.is_new && (
            <span 
              className="text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors"
              style={{
                backgroundColor: 'var(--badge-new-bg)',
                color: 'var(--badge-new-text)'
              }}
            >
              New
            </span>
          )}
          {product.discount > 0 && (
            <span 
              className="text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors"
              style={{
                backgroundColor: 'var(--badge-sale-bg)',
                color: 'var(--badge-sale-text)'
              }}
            >
              -{product.discount}%
            </span>
          )}
          {product.is_featured && !product.is_new && (
            <span 
              className="text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors"
              style={{
                backgroundColor: 'var(--badge-feat-bg)',
                color: 'var(--badge-feat-text)'
              }}
            >
              Featured
            </span>
          )}
        </div>

        {/* Animated Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            heartAnim ? 'animate-heart-pop' : ''
          } ${
            isFav 
              ? 'bg-rose-600 text-white shadow-md' 
              : 'bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-200 hover:scale-110 shadow-sm'
          }`}
          title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
        </button>

        {/* Quick Actions Hover Overlay */}
        <div className="absolute inset-x-2.5 bottom-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="w-full bg-white/95 hover:bg-white text-stone-900 text-[11px] tracking-widest uppercase font-semibold py-2 px-3 flex items-center justify-center gap-1.5 shadow-md rounded-lg border border-stone-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
          
          <div className="flex gap-1.5">
            <button
              onClick={handleQuickAdd}
              className="flex-1 text-[10px] tracking-widest uppercase font-semibold py-2 px-2 flex items-center justify-center gap-1 shadow-md rounded-lg transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)'
              }}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Add to Bag</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 text-[10px] tracking-widest uppercase font-semibold py-2 px-2 flex items-center justify-center gap-1 shadow-md rounded-lg transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--btn-buy-bg)',
                color: 'var(--btn-buy-text)'
              }}
            >
              <Zap className="w-3 h-3" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Details Information */}
      <div className="pt-3 pb-1 px-1 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>{product.brand || 'Aura Atelier'}</span>
            <span>{product.category}</span>
          </div>

          <h3 
            className="font-serif text-sm sm:text-base font-semibold line-clamp-1 transition-colors hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < Math.floor(product.rating || 5) ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'}`} 
                />
              ))}
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-500">
              {Number(product.rating || 5.0).toFixed(1)}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              ({product.review_count || 0})
            </span>
          </div>
        </div>

        {/* Price & Colors */}
        <div 
          className="mt-3 pt-2.5 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                {formatPrice(product.original_price)}
              </span>
            )}
          </div>

          {/* Colors Count Preview */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="flex items-center -space-x-1">
              {product.colors.slice(0, 3).map((col, idx) => (
                <span
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-white dark:border-stone-800 shadow-2xs"
                  style={{ backgroundColor: col.hex || '#18181b' }}
                  title={col.name || ''}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-[9px] pl-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
