import React, { useState } from 'react';
import { 
  Star, 
  ThumbsUp, 
  CheckCircle, 
  Camera, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  MessageSquareQuote,
  Sparkles,
  Upload,
  AlertCircle,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export function ProductReviewsSection({ product, onReviewUpdated }) {
  const { showToast } = useToast();

  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    count: product.review_count || 0,
    average: product.rating || 5.0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    aspectAverages: {}
  });
  const [loading, setLoading] = useState(true);

  // Form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form inputs
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderId, setOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);

  // Aspect ratings
  const [fabricRating, setFabricRating] = useState(5);
  const [stitchingRating, setStitchingRating] = useState(5);
  const [fitRating, setFitRating] = useState(5);
  const [colorRating, setColorRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);

  // Verification helper state
  const [verifyingOrder, setVerifyingOrder] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Helpful voting local tracking
  const [votedReviewIds, setVotedReviewIds] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_voted_reviews');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Photo viewer modal state
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Filter state
  const [filterRating, setFilterRating] = useState('all');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [filterWithPhotosOnly, setFilterWithPhotosOnly] = useState(false);

  // Load reviews from API
  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.getReviews(product.id);
      setReviewsData(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (product?.id) {
      loadReviews();
    }
  }, [product?.id]);

  // Check verified order eligibility
  const handleCheckOrder = async () => {
    if (!orderId.trim()) {
      showToast('Please enter your Order Reference ID (e.g. ORD-12345)', 'error');
      return;
    }
    setVerifyingOrder(true);
    setVerificationResult(null);
    try {
      const res = await api.checkReviewEligibility({
        orderId: orderId.trim(),
        productId: product.id,
        email: customerEmail.trim()
      });
      setVerificationResult(res);
      if (res.eligible && res.customerName && !customerName) {
        setCustomerName(res.customerName);
      }
      if (res.eligible && res.customerEmail && !customerEmail) {
        setCustomerEmail(res.customerEmail);
      }
      if (res.eligible) {
        showToast('Order verified! Verified Purchase badge will be awarded.', 'info');
      } else {
        showToast(res.message || 'Order could not be verified', 'error');
      }
    } catch (err) {
      setVerificationResult({ eligible: false, message: err.message || 'Verification failed' });
    } finally {
      setVerifyingOrder(false);
    }
  };

  // Upload review photos
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (photos.length + files.length > 4) {
      showToast('Maximum 4 photos allowed per review', 'error');
      return;
    }

    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));

    setUploadingPhotos(true);
    try {
      const res = await api.uploadReviewPhotos(formData);
      setPhotos(prev => [...prev, ...res.urls].slice(0, 4));
      showToast('Photos uploaded successfully');
    } catch (err) {
      showToast(err.message || 'Failed to upload photos', 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !comment.trim()) {
      showToast('Name and feedback are required', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        product_id: product.id,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        order_id: orderId.trim() || null,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        photos,
        fabric_rating: fabricRating,
        stitching_rating: stitchingRating,
        fit_rating: fitRating,
        color_rating: colorRating,
        delivery_rating: deliveryRating
      };

      const res = await api.createReview(payload);
      showToast(res.message || 'Review posted successfully!');
      
      // Save edit token in local storage for customer self-editing
      if (res.editToken && res.review?.id) {
        const myReviews = JSON.parse(localStorage.getItem('aura_my_reviews') || '{}');
        myReviews[res.review.id] = res.editToken;
        localStorage.setItem('aura_my_reviews', JSON.stringify(myReviews));
      }

      // Reset form
      setShowReviewForm(false);
      setTitle('');
      setComment('');
      setPhotos([]);
      setVerificationResult(null);

      // Reload
      loadReviews();
      if (onReviewUpdated) onReviewUpdated();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Mark Helpful
  const handleVoteHelpful = async (reviewId) => {
    if (votedReviewIds.includes(reviewId)) {
      showToast('You have already marked this review as helpful', 'info');
      return;
    }

    try {
      const res = await api.voteReviewHelpful(reviewId);
      const newVoted = [...votedReviewIds, reviewId];
      setVotedReviewIds(newVoted);
      localStorage.setItem('aura_voted_reviews', JSON.stringify(newVoted));

      // Update state
      setReviewsData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r.id === reviewId ? { ...r, helpful_count: res.helpful_count } : r)
      }));
      showToast('Marked as helpful');
    } catch (err) {
      showToast(err.message || 'Failed to vote', 'error');
    }
  };

  // Filtering reviews
  const filteredReviews = reviewsData.reviews.filter(r => {
    if (filterRating !== 'all' && Math.round(r.rating) !== Number(filterRating)) return false;
    if (filterVerifiedOnly && !r.is_verified) return false;
    if (filterWithPhotosOnly && (!r.photos || r.photos.length === 0)) return false;
    return true;
  });

  return (
    <section 
      className="mb-20 border p-6 sm:p-10 rounded-2xl shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Header & Stats Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-8 border-b mb-8 gap-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs tracking-[0.25em] uppercase font-bold text-amber-500">
              Verified Patron Appraisals
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Customer Reviews & Ratings
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Authentic feedback from verified patrons across Pakistan.
          </p>
        </div>

        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="text-xs tracking-widest uppercase font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] self-start lg:self-center flex items-center gap-2 cursor-pointer"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)'
          }}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{showReviewForm ? 'Close Form' : 'Write A Review'}</span>
        </button>
      </div>

      {/* Ratings Overview & Detailed Aspect Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10 pb-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        
        {/* Score & Stars */}
        <div className="md:col-span-4 flex flex-col justify-center items-center text-center p-6 rounded-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <div className="font-serif text-5xl sm:text-6xl font-bold mb-2 text-amber-500">
            {reviewsData.average.toFixed(1)}
          </div>
          <div className="flex text-amber-500 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                className={`w-5 h-5 ${s <= Math.round(reviewsData.average) ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'}`} 
              />
            ))}
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Based on {reviewsData.count} patron appraisal{reviewsData.count !== 1 ? 's' : ''}
          </span>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="md:col-span-4 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviewsData.distribution[stars] || 0;
            const pct = reviewsData.count > 0 ? (count / reviewsData.count) * 100 : 0;
            return (
              <div 
                key={stars} 
                onClick={() => setFilterRating(filterRating === String(stars) ? 'all' : String(stars))}
                className="flex items-center gap-3 text-xs cursor-pointer group"
              >
                <div className="flex items-center gap-1 w-14 shrink-0 font-mono">
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                </div>
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quality Aspect Metrices */}
        <div className="md:col-span-4 p-5 rounded-2xl border flex flex-col justify-between text-xs space-y-2.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-amber-500">
            Craftsmanship Ratings
          </h4>
          
          <div className="space-y-2">
            {[
              { label: 'Fabric Quality', val: reviewsData.aspectAverages?.fabric },
              { label: 'Stitching & Finish', val: reviewsData.aspectAverages?.stitching },
              { label: 'Size & Silhouette Fit', val: reviewsData.aspectAverages?.fit },
              { label: 'Color Accuracy', val: reviewsData.aspectAverages?.color },
              { label: 'Delivery Experience', val: reviewsData.aspectAverages?.delivery }
            ].map((aspect, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>{aspect.label}</span>
                <span className="font-mono font-bold text-amber-500">
                  {aspect.val ? `${aspect.val.toFixed(1)} / 5.0` : '5.0 ★'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Review Submission Form with Verified Purchase Check */}
      {showReviewForm && (
        <form 
          onSubmit={handleSubmitReview}
          className="mb-12 p-6 sm:p-8 rounded-2xl border space-y-6 animate-fade-in"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h4 className="font-serif text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Compose Your Garment Review
              </h4>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Share your detailed appraisal with fellow luxury fashion connoisseurs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="p-1 rounded-full hover:opacity-70 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Star Selection with Smooth Hover */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Overall Star Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  aria-label={`${s} Stars`}
                >
                  <Star 
                    className={`w-7 h-7 transition-colors ${
                      s <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-700'
                    }`} 
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-bold text-amber-500 ml-2">
                {rating === 5 && 'Exceptional / Bespoke Standard'}
                {rating === 4 && 'Very Good Craftsmanship'}
                {rating === 3 && 'Average Quality'}
                {rating === 2 && 'Needs Improvement'}
                {rating === 1 && 'Unsatisfactory'}
              </span>
            </div>
          </div>

          {/* Verified Purchase Check Section */}
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-500">
                Verified Purchase Verification (Optional but Recommended)
              </span>
            </div>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              Enter your Order ID (e.g. <strong>ORD-89412</strong>) to verify your purchase and receive the prestigious <strong>Verified Purchase</strong> badge.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Order ID (e.g. ORD-12345)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                className="flex-1 text-xs p-2.5 rounded-lg border uppercase font-mono"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="button"
                onClick={handleCheckOrder}
                disabled={verifyingOrder || !orderId.trim()}
                className="text-xs uppercase font-bold px-4 py-2.5 rounded-lg border transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                {verifyingOrder ? 'Verifying...' : 'Verify Order'}
              </button>
            </div>

            {verificationResult && (
              <div className={`mt-3 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                verificationResult.eligible 
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
              }`}>
                {verificationResult.eligible ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                )}
                <span>{verificationResult.message}</span>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Your Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Fatima Tariq"
                className="w-full text-xs p-2.5 rounded-lg border focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Email Address (Confidential, never published)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="fatima@example.pk"
                className="w-full text-xs p-2.5 rounded-lg border focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Aspect Ratings (Fabric, Stitching, Fit, Color, Delivery) */}
          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs uppercase font-bold tracking-wider block text-amber-500">
              Detailed Garment Impressions (1 - 5 Stars)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: 'Fabric Quality', state: fabricRating, setter: setFabricRating },
                { label: 'Stitching Finish', state: stitchingRating, setter: setStitchingRating },
                { label: 'Fitting & Sizing', state: fitRating, setter: setFitRating },
                { label: 'Color Accuracy', state: colorRating, setter: setColorRating },
                { label: 'Delivery Care', state: deliveryRating, setter: setDeliveryRating },
              ].map((aspect, i) => (
                <div key={i} className="text-xs">
                  <span className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {aspect.label}
                  </span>
                  <select
                    value={aspect.state}
                    onChange={(e) => aspect.setter(Number(e.target.value))}
                    className="w-full text-xs p-1.5 rounded-md border bg-transparent font-mono"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <option value={5}>5 ★ - Flawless</option>
                    <option value={4}>4 ★ - Good</option>
                    <option value={3}>3 ★ - Adequate</option>
                    <option value={2}>2 ★ - Fair</option>
                    <option value={1}>1 ★ - Poor</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Review Title & Comment */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Appraisal Headline
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Regal velvet drape, exceptional collar zardozi embroidery"
              className="w-full text-xs p-2.5 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Written Feedback *
            </label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the fabric texture, fit, compliments received, and packaging presentation..."
              className="w-full text-xs p-2.5 rounded-lg border focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Customer Uploaded Photos */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Upload Photos of Your Received Piece (Optional, max 4)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {photos.map((pUrl, idx) => (
                <div key={idx} className="relative w-20 h-24 rounded-lg overflow-hidden border shadow-sm group">
                  <img src={pUrl} alt="Review" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <label className="w-20 h-24 rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-amber-400 text-center p-2" style={{ borderColor: 'var(--border-medium)' }}>
                  <Camera className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {uploadingPhotos ? 'Uploading...' : 'Add Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploadingPhotos}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submittingReview}
              className="py-3 px-8 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)'
              }}
            >
              {submittingReview ? 'Recording Appraisal...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="py-3 px-6 text-xs uppercase tracking-widest rounded-xl border transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Filter / Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b text-xs font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span style={{ color: 'var(--text-muted)' }}>Filter:</span>
          
          <button
            onClick={() => setFilterRating('all')}
            className={`px-3 py-1 rounded-full border transition-all ${filterRating === 'all' ? 'bg-amber-400 text-stone-950 font-bold' : 'opacity-70'}`}
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            All Ratings ({reviewsData.reviews.length})
          </button>

          {[5, 4, 3, 2, 1].map(stars => (
            <button
              key={stars}
              onClick={() => setFilterRating(filterRating === String(stars) ? 'all' : String(stars))}
              className={`px-3 py-1 rounded-full border transition-all ${filterRating === String(stars) ? 'bg-amber-400 text-stone-950 font-bold' : 'opacity-70'}`}
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {stars} ★
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterVerifiedOnly}
              onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
              className="rounded-xs text-amber-500"
            />
            <span style={{ color: 'var(--text-secondary)' }}>Verified Purchases Only</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterWithPhotosOnly}
              onChange={(e) => setFilterWithPhotosOnly(e.target.checked)}
              className="rounded-xs text-amber-500"
            />
            <span style={{ color: 'var(--text-secondary)' }}>With Customer Photos</span>
          </label>
        </div>
      </div>

      {/* Customer Reviews Feed */}
      {loading ? (
        <div className="text-center py-12 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          Retrieving patron appraisals...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p className="font-serif text-base mb-1" style={{ color: 'var(--text-primary)' }}>
            No reviews match your selected filter criteria.
          </p>
          <p className="text-xs uppercase tracking-wider">
            Be the first to share your impressions for this couture garment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredReviews.map((rev) => {
            const isVoted = votedReviewIds.includes(rev.id);
            return (
              <div 
                key={rev.id} 
                className="p-5 sm:p-6 rounded-2xl border transition-all duration-300 hover:shadow-md"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                {/* Header: Rating + Verification Badge + Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-4 h-4 ${s <= rev.rating ? 'fill-amber-500' : 'text-stone-300 dark:text-stone-700'}`} 
                        />
                      ))}
                    </div>

                    {rev.is_verified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                        <span>Verified Purchase</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border opacity-60" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span>Unverified Feedback</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                  </span>
                </div>

                {/* Title & Comment */}
                {rev.title && (
                  <h4 className="font-serif font-bold text-sm sm:text-base mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    {rev.title}
                  </h4>
                )}

                <p className="text-xs sm:text-sm leading-relaxed font-light mb-4 whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  "{rev.comment}"
                </p>

                {/* Customer Uploaded Photos */}
                {Array.isArray(rev.photos) && rev.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {rev.photos.map((photoUrl, pIdx) => (
                      <img
                        key={pIdx}
                        src={photoUrl}
                        alt="Customer photo"
                        onClick={() => setActivePhotoModal(photoUrl)}
                        className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-xl border cursor-pointer hover:scale-105 transition-transform"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    ))}
                  </div>
                )}

                {/* Aspect Ratings Badges */}
                {(rev.fabric_rating || rev.stitching_rating || rev.fit_rating) && (
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono mb-4 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    {rev.fabric_rating && <span>Fabric: <strong>{rev.fabric_rating}★</strong></span>}
                    {rev.stitching_rating && <span>• Stitching: <strong>{rev.stitching_rating}★</strong></span>}
                    {rev.fit_rating && <span>• Fit: <strong>{rev.fit_rating}★</strong></span>}
                    {rev.color_rating && <span>• Color: <strong>{rev.color_rating}★</strong></span>}
                    {rev.delivery_rating && <span>• Delivery: <strong>{rev.delivery_rating}★</strong></span>}
                  </div>
                )}

                {/* Footer: Customer Name & Helpful Button */}
                <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-[11px]" style={{ color: 'var(--text-primary)' }}>
                      {rev.customer_name}
                    </span>
                    {rev.order_id && (
                      <span className="text-[10px] font-mono opacity-50">
                        ({rev.order_id})
                      </span>
                    )}
                  </div>

                  {/* Helpful Button */}
                  <button
                    onClick={() => handleVoteHelpful(rev.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                      isVoted 
                        ? 'bg-amber-400/20 text-amber-500 border-amber-400/40 font-bold' 
                        : 'hover:bg-stone-500/10 opacity-75 hover:opacity-100'
                    }`}
                    style={{ borderColor: isVoted ? undefined : 'var(--border-subtle)' }}
                    title="Mark this review as helpful"
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-amber-500' : ''}`} />
                    <span>Helpful ({rev.helpful_count || 0})</span>
                  </button>
                </div>

                {/* Public Atelier Administration Response */}
                {rev.admin_response && (
                  <div 
                    className="mt-4 p-4 rounded-xl border border-l-4 border-amber-500/40 space-y-1 animate-fade-in"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-subtle)',
                      borderLeftColor: '#d4af37'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500 font-mono">
                        Atelier Concierge Response
                      </span>
                    </div>
                    <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      "{rev.admin_response}"
                    </p>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Customer Photo Zoom */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActivePhotoModal(null)}>
          <div className="relative max-w-2xl max-h-[90vh] p-2 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activePhotoModal} 
              alt="Enlarged review photo" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </section>
  );
}
