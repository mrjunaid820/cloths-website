import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ShoppingBag, 
  Zap, 
  Heart, 
  Truck, 
  RefreshCw, 
  ShieldCheck, 
  MessageCircle, 
  Ruler, 
  Share2, 
  Check, 
  ChevronRight, 
  Plus, 
  Minus, 
  X, 
  Send,
  Bell
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/ProductCard';
import { CompleteTheOutfit } from '../components/CompleteTheOutfit';
import { SmartSizeGuideModal } from '../components/SmartSizeGuideModal';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { api } from '../api';

export function ProductPage({ 
  product: initialProduct, 
  productIdOrSlug, 
  onSelectProduct, 
  onQuickView, 
  onNavigate 
}) {
  const { addToCart, setIsDrawerOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { formatPrice, settings } = useSettings();
  const { showToast } = useToast();

  const [product, setProduct] = useState(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(!initialProduct);

  // Gallery state
  const [activeImage, setActiveImage] = useState('');
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });

  // Variant selections
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Modals & Accordions
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideData, setSizeGuideData] = useState(null);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('shipping'); // 'shipping' | 'care' | 'returns'

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load product if needed
  useEffect(() => {
    async function loadData() {
      const target = productIdOrSlug || initialProduct?.id;
      if (!target) return;
      try {
        setLoading(true);
        const [prodData, recData] = await Promise.all([
          api.getProduct(target),
          api.getProductRecommendations(target).catch(() => ({ recommendations: [] }))
        ]);
        
        setProduct(prodData.product);
        setRelatedProducts(prodData.related || []);
        setRecommendations(recData.recommendations || []);

        const imgs = Array.isArray(prodData.product.images) ? prodData.product.images : [prodData.product.image];
        setActiveImage(imgs[0] || '');

        if (Array.isArray(prodData.product.sizes) && prodData.product.sizes.length > 0) {
          setSelectedSize(prodData.product.sizes[0]);
        }
        if (Array.isArray(prodData.product.colors) && prodData.product.colors.length > 0) {
          setSelectedColor(prodData.product.colors[0]?.name || prodData.product.colors[0]);
        }

        // Fetch size guide for category
        if (prodData.product.category) {
          api.getSizeGuideByCategory(prodData.product.category)
            .then((sg) => setSizeGuideData(sg))
            .catch(() => {});
        }

        // Fetch reviews
        const revData = await api.getReviews(prodData.product.id);
        setReviews(revData || []);
      } catch (err) {
        console.error('Failed to load product page:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productIdOrSlug, initialProduct]);

  if (loading || !product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Unveiling Couture Piece...</span>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [product.image || ''];
  const isFav = isInWishlist(product.id);

  // Interactive Zoom Handler
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${activeImage})`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setIsDrawerOpen(true);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    if (onNavigate) {
      onNavigate('checkout');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Product link copied to clipboard');
    }
  };

  const getWhatsAppProductUrl = () => {
    const rawPhone = settings.whatsapp_number || '+923004562872';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const pricePKR = `Rs. ${Math.round(product.price).toLocaleString('en-PK')}`;
    const totalPKR = `Rs. ${Math.round(product.price * quantity).toLocaleString('en-PK')}`;
    const text = `*ORDER VIA WHATSAPP - ${settings.store_name || 'Aura Atelier'}*\n\n` +
      `*Product:* ${product.name}\n` +
      `*SKU:* ${product.sku}\n` +
      `*Size:* ${selectedSize}\n` +
      `*Color:* ${selectedColor}\n` +
      `*Quantity:* ${quantity}\n` +
      `*Price Each:* ${pricePKR}\n` +
      `*Total Price:* ${totalPKR}\n\n` +
      `Kindly confirm availability and proceed with my delivery concierge.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewName || !newReviewComment) {
      showToast('Please provide your name and review remarks', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const created = await api.createReview({
        product_id: product.id,
        customer_name: newReviewName,
        rating: newReviewRating,
        title: newReviewTitle,
        comment: newReviewComment
      });
      setReviews([created, ...reviews]);
      setShowReviewForm(false);
      setNewReviewName('');
      setNewReviewTitle('');
      setNewReviewComment('');
      showToast('Thank you! Your review has been published.');
    } catch (err) {
      showToast('Failed to post review: ' + err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors" style={{ color: 'var(--text-primary)' }}>
      
      {/* Breadcrumb Navigation */}
      <nav className="text-xs uppercase tracking-widest mb-8 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <button onClick={() => onNavigate('home')} className="hover:opacity-100 transition-opacity">
          Home
        </button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => onNavigate('shop')} className="hover:opacity-100 transition-opacity">
          Catalog
        </button>
        <ChevronRight className="w-3 h-3" />
        <button 
          onClick={() => onNavigate('shop', { category: product.category })}
          className="hover:opacity-100 transition-opacity"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        
        {/* Left: Gallery (Thumbnails + Zoom Viewer) - 7 cols */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          
          {/* Thumbnails Column */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto no-scrollbar shrink-0 max-h-[620px]">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-18 h-24 border-2 transition-all overflow-hidden shrink-0 rounded-xl shadow-2xs ${
                    activeImage === img ? 'scale-102 ring-2 ring-amber-500' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: 'var(--image-bg)',
                    borderColor: activeImage === img ? 'var(--accent-primary)' : 'var(--border-subtle)'
                  }}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover object-center rounded-xl" />
                </button>
              ))}
            </div>
          )}

          {/* Main Large Image with Interactive Zoom in Rounded Frame */}
          <div 
            className="flex-1 relative aspect-[3/4] border overflow-hidden cursor-crosshair rounded-2xl shadow-sm"
            style={{
              backgroundColor: 'var(--image-bg)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <img
              src={activeImage || images[0]}
              alt={product.name}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-300"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
              {product.is_new && (
                <span className="bg-stone-950 text-amber-200 text-xs tracking-widest uppercase font-bold px-3 py-1 shadow-md">
                  Runway Exclusive
                </span>
              )}
              {product.discount > 0 && (
                <span className="bg-rose-700 text-white text-xs tracking-widest uppercase font-bold px-3 py-1 shadow-md">
                  -{product.discount}% OFF
                </span>
              )}
            </div>

            {/* Magnifier Zoom Overlay Container */}
            <div
              className="absolute inset-0 pointer-events-none bg-no-repeat bg-[length:200%_200%] transition-opacity duration-150 z-20"
              style={zoomStyle}
            />
          </div>

        </div>

        {/* Right: Product Details & Controls - 5 cols */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            
            {/* Header info */}
            <div className="flex items-center justify-between text-xs tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{product.brand || 'Aura Atelier'}</span>
              <span>SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
              {product.name}
            </h1>

            {/* Star Rating & Review count */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {product.rating} ({reviews.length || product.review_count} client appraisals)
              </span>
              <span style={{ color: 'var(--border-strong)' }}>•</span>
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{product.category}</span>
            </div>

            {/* Price Box */}
            <div className="flex items-baseline gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="font-serif text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-base line-through" style={{ color: 'var(--text-muted)' }}>
                  {formatPrice(product.original_price)}
                </span>
              )}
              {product.stock > 0 ? (
                <span className="ml-auto text-xs font-semibold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 border border-emerald-200 dark:border-emerald-800 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Available ({product.stock} pieces)
                </span>
              ) : (
                <span className="ml-auto text-xs font-semibold text-rose-800 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-1 border border-rose-200 dark:border-rose-800 rounded-md uppercase tracking-wider">
                  Bespoke Backorder
                </span>
              )}
            </div>

            {/* Description */}
            <div className="text-sm leading-relaxed mb-8 font-light" style={{ color: 'var(--text-secondary)' }}>
              <p>{product.description}</p>
            </div>

            {/* Color Swatches */}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs tracking-wider uppercase mb-2.5">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Selected Shade:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c, idx) => {
                    const colorName = c.name || c;
                    const isSelected = selectedColor === colorName;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(colorName)}
                        className={`flex items-center gap-2 px-3 py-2 border text-xs tracking-wider uppercase transition-all rounded-xl ${
                          isSelected ? 'font-semibold shadow-sm scale-102' : 'hover:opacity-85'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'
                        }}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border shrink-0" 
                          style={{ backgroundColor: c.hex || '#111', borderColor: 'var(--border-strong)' }} 
                        />
                        <span>{colorName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector + Size Guide modal trigger */}
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs tracking-wider uppercase mb-2.5">
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Select Size:</span>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="font-medium flex items-center gap-1 underline underline-offset-2 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Bespoke Size Guide</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s, idx) => {
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-[48px] py-2 px-3.5 text-xs font-semibold tracking-wider uppercase border transition-all rounded-xl ${
                          isSelected ? 'font-semibold shadow-sm' : 'hover:opacity-85'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-primary)' }}>
                Quantity:
              </span>
              <div className="flex items-center border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-1.5 transition-colors hover:opacity-75"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 20, quantity + 1))}
                  className="px-3.5 py-1.5 transition-colors hover:opacity-75"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 px-6 text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 transition-all rounded-xl shadow-md hover:opacity-95"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  boxShadow: 'var(--btn-primary-shadow)'
                }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 px-6 text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 transition-all rounded-xl shadow-md hover:opacity-95 text-white"
                style={{
                  backgroundColor: 'var(--btn-buy-bg)'
                }}
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <button
                onClick={() => toggleWishlist(product)}
                className={`p-4 border transition-all rounded-xl ${
                  isFav ? 'border-rose-600 bg-rose-50 text-rose-600 dark:bg-rose-950/40' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: isFav ? undefined : 'var(--bg-surface)',
                  color: isFav ? undefined : 'var(--text-primary)',
                  borderColor: isFav ? undefined : 'var(--border-subtle)'
                }}
                title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 animate-heart-pop' : ''}`} />
              </button>

              <button
                onClick={() => setShowPriceAlert(true)}
                className="p-4 border transition-colors rounded-xl hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-subtle)'
                }}
                title="Get Price Drop Email Alert"
              >
                <Bell className="w-4 h-4 text-amber-500" />
              </button>

              <button
                onClick={handleShare}
                className="p-4 border transition-colors rounded-xl hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-subtle)'
                }}
                title="Share Garment"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Direct WhatsApp Order Button */}
            <a
              href={getWhatsAppProductUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-3.5 px-6 text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 transition-colors rounded-xl shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Order via WhatsApp Direct</span>
            </a>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <div className="p-2 border rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <Truck className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'var(--accent-primary)' }} />
                <span>Express Courier</span>
              </div>
              <div className="p-2 border rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <ShieldCheck className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'var(--accent-primary)' }} />
                <span>Artisan Authenticity</span>
              </div>
              <div className="p-2 border rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <RefreshCw className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'var(--accent-primary)' }} />
                <span>30-Day Return</span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Accordion Tabs: Shipping / Fabric Care / Returns */}
      <div 
        className="mb-20 border p-6 sm:p-8 rounded-2xl shadow-sm transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex border-b gap-6 text-xs tracking-widest uppercase font-bold mb-6 overflow-x-auto no-scrollbar" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 transition-colors relative whitespace-nowrap ${
              activeTab === 'shipping' ? 'font-bold' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'shipping' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'shipping' ? '2px solid var(--accent-primary)' : 'none'
            }}
          >
            Shipping & White-Glove Delivery
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`pb-3 transition-colors relative whitespace-nowrap ${
              activeTab === 'care' ? 'font-bold' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'care' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'care' ? '2px solid var(--accent-primary)' : 'none'
            }}
          >
            Fabric Craft & Care
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`pb-3 transition-colors relative whitespace-nowrap ${
              activeTab === 'returns' ? 'font-bold' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              color: activeTab === 'returns' ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'returns' ? '2px solid var(--accent-primary)' : 'none'
            }}
          >
            Boutique Exchange & Returns
          </button>
        </div>

        <div className="text-xs sm:text-sm leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>
          {activeTab === 'shipping' && (
            <div className="space-y-3">
              <p>• <strong>Complimentary Delivery Across Pakistan:</strong> Orders exceeding Rs. 7,500 receive express priority courier with live tracking.</p>
              <p>• <strong>Nationwide Delivery:</strong> Dispatched within 24–48 hours; arrives in 2–4 business days via TCS, Leopards, or Trax Express with Cash on Delivery (COD) supported nationwide.</p>
              <p>• <strong>Same-Day / Next-Day Metro:</strong> Expedited doorstep delivery available across Lahore, Karachi, and Islamabad / Rawalpindi.</p>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <p>• <strong>Handcrafted Fabrics:</strong> Due to delicate raw silk fibers, virgin merino wools, and metallic zardozi needlework, professional specialist dry cleaning is strictly recommended.</p>
              <p>• <strong>Garment Steaming:</strong> Use vertical low-temperature steam only. Avoid direct hot irons on embroidered collars or embellishments.</p>
              <p>• <strong>Storage:</strong> Store garments inside the breathable canvas protective dust bag provided with your order.</p>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-3">
              <p>• <strong>30-Day Guarantee:</strong> If the fit or silhouette is not immaculate, return or exchange unworn pieces within 30 days of arrival.</p>
              <p>• <strong>Prepaid Return Courier:</strong> Contact our concierge via WhatsApp or email to schedule complimentary doorstep pickup.</p>
              <p>• <strong>Refunds:</strong> Processed within 48 hours of inspection back to your original payment method.</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews & Ratings System */}
      <ProductReviewsSection
        product={product}
        onReviewUpdated={() => {
          // Refresh product details
          api.getProduct(product.id).then(res => {
            if (res.product) setProduct(res.product);
          }).catch(() => {});
        }}
      />

      {/* Complete The Outfit / Curated Ensemble Section */}
      <CompleteTheOutfit
        currentProduct={product}
        recommendations={recommendations}
        onSelectProduct={onSelectProduct}
      />

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t pt-16 mt-16" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs tracking-[0.25em] uppercase font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                Coordinated Silhouettes
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                You May Also Admire
              </h3>
            </div>
            <button
              onClick={() => onNavigate('shop', { category: product.category })}
              className="text-xs tracking-widest uppercase font-semibold hover:underline"
              style={{ color: 'var(--text-primary)' }}
            >
              View More in {product.category}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onSelectProduct={onSelectProduct}
                onQuickView={onQuickView}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Smart Size Guide Modal */}
      <SmartSizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        category={product.category}
        sizeGuideData={sizeGuideData}
      />

      {/* Price Drop Alert Modal */}
      <PriceAlertModal
        isOpen={showPriceAlert}
        onClose={() => setShowPriceAlert(false)}
        product={product}
      />

    </div>
  );
}
