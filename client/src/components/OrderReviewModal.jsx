/**
 * ==============================================================================
 * AURA ATELIER — Verified Garment Appraisal Modal
 * ==============================================================================
 * Customer feedback modal displayed for delivered orders:
 * - 1 to 5 luxury gold interactive star rating with descriptive tooltips
 * - Craftsmanship metrics: Fabric hand-feel, stitching, fit accuracy, color fidelity
 * - Customer photo uploads (up to 4 images) with live preview
 * - Automatic duplicate review detection & seamless edit mode
 * - Full theme synchronization across Black, White, and Blue themes
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Scissors,
  Layers,
  Ruler,
  Palette,
  Truck,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

const STAR_LABELS = {
  1: 'Poor — Needs Major Improvement',
  2: 'Fair — Below Expectations',
  3: 'Average — Satisfactory Craftsmanship',
  4: 'Good — Highly Pleased',
  5: 'Exceptional — Flawless Runway Quality'
};

export function OrderReviewModal({ 
  isOpen, 
  onClose, 
  order, 
  productItem, 
  onSuccess,
  onNavigate 
}) {
  const { showToast } = useToast();
  const { formatPrice } = useSettings();

  // Primary form state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Craftsmanship ratings
  const [fabricRating, setFabricRating] = useState(5);
  const [stitchingRating, setStitchingRating] = useState(5);
  const [fitRating, setFitRating] = useState(5);
  const [colorRating, setColorRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [showAspects, setShowAspects] = useState(true);

  // Status & submission state
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const productId = productItem?.product_id || productItem?.id;

  // Check eligibility and load existing review if already submitted
  useEffect(() => {
    if (!isOpen || !order?.id || !productId) return;

    // Reset initial states
    setErrorMsg('');
    setSubmittedSuccess(false);
    setIsEditing(false);
    setExistingReview(null);

    const checkStatus = async () => {
      setCheckingExisting(true);
      try {
        const res = await api.checkReviewEligibility({
          orderId: order.id,
          productId: productId,
          email: order.customer_email || ''
        });

        if (res.alreadyReviewed && res.reviewId) {
          setIsEditing(true);
          // Fetch product reviews to find this customer's review
          const prodReviews = await api.getReviews(productId);
          const found = (prodReviews.reviews || []).find(r => String(r.order_id) === String(order.id) && String(r.id) === String(res.reviewId));
          if (found) {
            setExistingReview(found);
            setRating(found.rating || 5);
            setTitle(found.title || '');
            setComment(found.comment || '');
            setPhotos(Array.isArray(found.photos) ? found.photos : []);
            if (found.fabric_rating) setFabricRating(found.fabric_rating);
            if (found.stitching_rating) setStitchingRating(found.stitching_rating);
            if (found.fit_rating) setFitRating(found.fit_rating);
            if (found.color_rating) setColorRating(found.color_rating);
            if (found.delivery_rating) setDeliveryRating(found.delivery_rating);
          }
        }
      } catch (err) {
        console.error('Error checking review status:', err);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkStatus();
  }, [isOpen, order?.id, productId]);

  if (!isOpen || !productItem) return null;

  // Handle image upload
  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 4) {
      showToast('You can upload a maximum of 4 photos per review', 'error');
      return;
    }

    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));

    setUploadingFiles(true);
    try {
      const res = await api.uploadReviewPhotos(formData);
      if (res && res.urls) {
        setPhotos(prev => [...prev, ...res.urls].slice(0, 4));
        showToast('Photo uploaded successfully', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setErrorMsg('Please select a star rating (1–5).');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMsg('Please provide detailed feedback of at least 5 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        product_id: productId,
        order_id: order.id,
        customer_name: order.customer_name || 'Valued Patron',
        customer_email: order.customer_email || '',
        customer_phone: order.customer_phone || '',
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        photos: photos,
        fabric_rating: Number(fabricRating),
        stitching_rating: Number(stitchingRating),
        fit_rating: Number(fitRating),
        color_rating: Number(colorRating),
        delivery_rating: Number(deliveryRating)
      };

      if (isEditing && existingReview?.id) {
        await api.updateReview(existingReview.id, payload);
        showToast('Your review has been successfully updated!', 'success');
      } else {
        await api.createReview(payload);
        showToast('Thank you! Your feedback has been submitted successfully.', 'success');
      }

      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit feedback. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-auto transition-colors duration-300 max-h-[92vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Modal Header */}
        <div 
          className="p-5 sm:p-6 border-b flex items-start justify-between gap-4 shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  color: '#10b981'
                }}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Verified Order #{order.id} • Delivered
              </span>
              {isEditing && (
                <span 
                  className="text-[10px] tracking-widest uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border"
                  style={{
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    borderColor: 'rgba(217, 119, 6, 0.3)',
                    color: 'var(--accent-primary)'
                  }}
                >
                  <Edit3 className="w-3 h-3" />
                  Editing Appraisal
                </span>
              )}
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {isEditing ? 'Update Your Garment Appraisal' : 'Rate & Review Delivered Garment'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Your feedback is verified with Order <strong>{order.id}</strong> and directly informs our tailoring atelier.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* Success Screen */}
          {submittedSuccess ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981'
                }}
              >
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="font-serif text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Thank you! Your feedback has been submitted successfully.
                </h3>
                <p className="text-xs sm:text-sm max-w-md mx-auto mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Your review has been verified with delivered Order <strong>{order.id}</strong> and awarded the official <strong className="text-emerald-500">Verified Purchase</strong> seal.
                </p>
              </div>

              {/* Summary Card */}
              <div 
                className="p-4 rounded-xl border max-w-md mx-auto text-left space-y-2 text-xs"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{productItem.name}</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map(st => (
                      <Star key={st} className={`w-3.5 h-3.5 ${st <= rating ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                  </div>
                </div>
                {title && <p className="font-medium italic" style={{ color: 'var(--text-primary)' }}>"{title}"</p>}
                <p className="line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{comment}</p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                {onNavigate && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('product', { productId: productId });
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center gap-2 border transition-all hover:scale-105"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span>View Product Reviews</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  Return to Order
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Info Bar */}
              <div 
                className="flex items-center gap-4 p-3.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                {productItem.image && (
                  <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <img 
                      src={productItem.image} 
                      alt={productItem.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider font-bold block" style={{ color: 'var(--accent-primary)' }}>
                    Delivered Garment
                  </span>
                  <h4 className="font-serif text-sm sm:text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {productItem.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {productItem.size && <span>Size: <strong>{productItem.size}</strong></span>}
                    {productItem.color && <span>• Color: <strong>{productItem.color}</strong></span>}
                    <span>• {formatPrice(productItem.price)}</span>
                  </div>
                </div>
              </div>

              {checkingExisting && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs" style={{ color: 'var(--accent-primary)' }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying order status & records...</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Star Rating Section */}
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>
                    Overall Garment Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-none"
                          aria-label={`Rate ${star} stars out of 5`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              (hoverRating || rating) >= star
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-stone-300 dark:text-stone-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-semibold ml-2" style={{ color: 'var(--accent-primary)' }}>
                      {STAR_LABELS[hoverRating || rating]}
                    </span>
                  </div>
                </div>

                {/* Craftsmanship Specific Ratings */}
                <div 
                  className="p-4 rounded-xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-xs uppercase tracking-wider font-bold" style={{ color: 'var(--text-primary)' }}>
                        Craftsmanship & Fit Ratings (Optional)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAspects(!showAspects)}
                      className="text-[11px] underline"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showAspects ? 'Collapse' : 'Expand'}
                    </button>
                  </div>

                  {showAspects && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      {/* Fabric */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <Layers className="w-3.5 h-3.5 text-amber-500" />
                          Fabric Quality
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setFabricRating(v)}
                              className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                fabricRating >= v ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stitching */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <Scissors className="w-3.5 h-3.5 text-amber-500" />
                          Stitching & Finishing
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setStitchingRating(v)}
                              className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                stitchingRating >= v ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size & Fit */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <Ruler className="w-3.5 h-3.5 text-amber-500" />
                          Size & Fitting Accuracy
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setFitRating(v)}
                              className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                fitRating >= v ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Fidelity */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <Palette className="w-3.5 h-3.5 text-amber-500" />
                          Color Accuracy
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setColorRating(v)}
                              className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                colorRating >= v ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5 sm:col-span-2">
                        <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-secondary)' }}>
                          <Truck className="w-3.5 h-3.5 text-amber-500" />
                          Delivery & Luxury Unboxing Experience
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setDeliveryRating(v)}
                              className={`w-6 h-6 rounded text-[11px] font-bold transition-all ${
                                deliveryRating >= v ? 'bg-amber-400 text-stone-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Headline */}
                <div>
                  <label className="text-xs uppercase tracking-widest font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Majestic drape, exquisite embroidery & swift delivery"
                    className="w-full border rounded-xl p-3 text-xs focus:outline-none transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Written Feedback Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
                      Written Feedback <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {comment.length}/2000 characters
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe how the garment feels, how the sizing fits your silhouette, fabric quality, and your overall experience..."
                    className="w-full border rounded-xl p-3 text-xs focus:outline-none transition-colors resize-y"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Photo Upload Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase tracking-widest font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      <Camera className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                      <span>Garment Photos (Optional, Max 4)</span>
                    </label>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {photos.length}/4 images attached
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Existing photos preview */}
                    {photos.map((url, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border shadow-sm group" style={{ borderColor: 'var(--border-subtle)' }}>
                        <img src={url} alt={`Review photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors"
                          aria-label="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Upload trigger button */}
                    {photos.length < 4 && (
                      <label 
                        className="w-20 h-20 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-amber-500/80 hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        {uploadingFiles ? (
                          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mb-1" style={{ color: 'var(--text-muted)' }} />
                            <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handlePhotoSelect}
                          disabled={uploadingFiles}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Show how the garment drapes in natural daylight. Supported formats: JPEG, PNG, WebP (up to 5MB each).
                  </p>
                </div>

                {/* Submitting Customer details display */}
                <div 
                  className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block font-bold" style={{ color: 'var(--text-muted)' }}>
                      Submitting as Verified Customer:
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {order.customer_name} ({order.customer_email || order.customer_phone || 'Verified Patron'})
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Order Linked
                  </span>
                </div>

                {/* Submit button bar */}
                <div 
                  className="pt-4 border-t flex flex-col sm:flex-row items-center justify-end gap-3"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading || uploadingFiles}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)'
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Appraisal...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isEditing ? 'Update Review' : 'Submit Verified Review'}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
