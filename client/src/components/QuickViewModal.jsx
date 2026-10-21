import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShoppingBag, 
  Zap, 
  Heart, 
  Check, 
  ArrowRight, 
  MessageCircle, 
  ShieldCheck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';

export function QuickViewModal({ product, isOpen, onClose, onSelectProduct, onNavigate }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { formatPrice, settings } = useSettings();

  if (!isOpen || !product) return null;

  const images = Array.isArray(product.images) ? product.images : [product.image || ''];
  const [selectedImg, setSelectedImg] = useState(images[0] || '');
  const [selectedSize, setSelectedSize] = useState(
    Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : 'Standard'
  );
  const [selectedColor, setSelectedColor] = useState(
    Array.isArray(product.colors) && product.colors.length > 0 
      ? (product.colors[0]?.name || product.colors[0]) 
      : 'Standard'
  );
  const [quantity, setQuantity] = useState(1);

  const isFav = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    onClose();
    if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const getWhatsAppProductUrl = () => {
    const rawPhone = settings.whatsapp_number || '+923004562872';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const pricePKR = `Rs. ${Math.round(product.price).toLocaleString('en-PK')}`;
    const totalPKR = `Rs. ${Math.round(product.price * quantity).toLocaleString('en-PK')}`;
    const text = `Hello ${settings.store_name || 'Aura Atelier'}, I would like to order:\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Price:* ${pricePKR}\n*Size:* ${selectedSize}\n*Color:* ${selectedColor}\n*Quantity:* ${quantity}\n*Total:* ${totalPKR}\n\nPlease assist me with placing this order.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-4xl shadow-2xl border overflow-hidden rounded-3xl animate-fade-in grid grid-cols-1 md:grid-cols-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full border shadow-sm transition-transform hover:scale-110"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left: Gallery with Rounded Frame */}
          <div 
            className="p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div 
              className="aspect-[3/4] w-full overflow-hidden relative rounded-2xl shadow-sm"
              style={{ backgroundColor: 'var(--image-bg)' }}
            >
              <img
                src={selectedImg || images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-500 hover:scale-105"
              />
              {product.discount > 0 && (
                <span 
                  className="absolute top-3 left-3 text-[11px] font-bold tracking-widest px-2.5 py-1 uppercase rounded-md shadow-xs"
                  style={{
                    backgroundColor: 'var(--badge-sale-bg)',
                    color: 'var(--badge-sale-text)'
                  }}
                >
                  -{product.discount}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail selector with matching rounded corners */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                {images.map((img, idx) => {
                  const isSelected = (selectedImg || images[0]) === img;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImg(img)}
                      className={`w-16 h-20 shrink-0 border-2 overflow-hidden rounded-xl transition-all ${
                        isSelected ? 'ring-2' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'
                      }}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover rounded-xl" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Details & Purchase */}
          <div className="p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
            <div>
              <div className="flex items-center justify-between text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
                <span>{product.brand || 'Aura Atelier'}</span>
                <span>SKU: {product.sku}</span>
              </div>

              <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${i < Math.floor(product.rating || 5) ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'}`} 
                    />
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  ({product.review_count || 12} Atelier reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm font-light leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
                {product.description || 'Artisan handcrafted ensemble tailored with precision from high-grade natural silks and wools.'}
              </p>

              {/* Sizes */}
              {Array.isArray(product.sizes) && product.sizes.length > 0 && (
                <div className="mb-4">
                  <span className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>
                    Select Size:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s, idx) => {
                      const isSelected = selectedSize === s;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedSize(s)}
                          className="min-w-[42px] py-1.5 px-3 text-xs tracking-wider uppercase font-semibold border rounded-lg transition-all"
                          style={{
                            backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                            color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                            borderColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--border-subtle)'
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors */}
              {Array.isArray(product.colors) && product.colors.length > 0 && (
                <div className="mb-4">
                  <span className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>
                    Color: <span className="font-normal opacity-80">{selectedColor}</span>
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((c, idx) => {
                      const cName = c.name || c;
                      const cHex = c.hex || '#1c1917';
                      const isSelected = selectedColor === cName;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedColor(cName)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            isSelected ? 'scale-110 ring-2 ring-amber-500' : 'hover:scale-105'
                          }`}
                          style={{
                            backgroundColor: cHex,
                            borderColor: 'var(--bg-surface)'
                          }}
                          title={cName}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Quantity:</span>
                <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-sm hover:opacity-75"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    -
                  </button>
                  <span className="px-3 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="px-3 py-1 text-sm hover:opacity-75"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 text-xs tracking-widest uppercase font-semibold rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3 px-4 text-xs tracking-widest uppercase font-semibold rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'var(--btn-buy-bg)',
                    color: 'var(--btn-buy-text)'
                  }}
                >
                  <Zap className="w-4 h-4" />
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3 border rounded-xl transition-all ${
                    isFav 
                      ? 'border-rose-600 bg-rose-50 text-rose-600' 
                      : 'hover:scale-105'
                  }`}
                  style={{
                    borderColor: isFav ? '#e11d48' : 'var(--border-subtle)',
                    color: isFav ? '#e11d48' : 'var(--text-primary)'
                  }}
                  title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Order via WhatsApp */}
              <a
                href={getWhatsAppProductUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-2.5 px-4 text-xs tracking-widest uppercase font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order via WhatsApp (+92)</span>
              </a>

              {/* Full details link */}
              <button
                onClick={() => {
                  onClose();
                  onSelectProduct(product);
                }}
                className="w-full py-2 text-center text-xs tracking-widest uppercase font-medium flex items-center justify-center gap-1.5 hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>View Complete Product Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
