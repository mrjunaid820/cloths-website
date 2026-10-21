import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Trash2, 
  MessageSquare, 
  Search, 
  Filter, 
  Send, 
  Loader2, 
  Camera, 
  AlertCircle,
  ThumbsUp,
  ExternalLink,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export function AdminReviews() {
  const { showToast } = useToast();

  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({ total: 0, approved: 0, rejected: 0, hidden: 0, verified: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [activePhotoModal, setActivePhotoModal] = useState(null);
  const [responseModalReview, setResponseModalReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [savingResponse, setSavingResponse] = useState(false);

  // Invitation state
  const [invitationOrderId, setInvitationOrderId] = useState('');
  const [sendingInvitation, setSendingInvitation] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (ratingFilter !== 'all') params.rating = ratingFilter;
      if (verifiedFilter === 'verified') params.verifiedOnly = 'true';
      if (search.trim()) params.search = search.trim();

      const data = await api.getAdminReviews(params);
      setReviews(data.reviews || []);
      setCounts(data.counts || { total: 0, approved: 0, rejected: 0, hidden: 0, verified: 0 });
    } catch (err) {
      console.error('Error loading admin reviews:', err);
      showToast('Failed to load reviews ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter, ratingFilter, verifiedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadReviews();
  };

  // Change review moderation status
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateReviewStatus(id, status, `Moderated by admin to ${status}`);
      showToast(`Review marked as ${status}`);
      loadReviews();
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  // Delete review
  const handleDelete = async (id, customerName) => {
    if (!window.confirm(`Are you certain you want to purge the review from "${customerName}"? This action is logged in audit logs.`)) {
      return;
    }
    try {
      await api.deleteAdminReview(id, 'Purged by administrator');
      showToast('Review removed and audit log updated');
      loadReviews();
    } catch (err) {
      showToast(err.message || 'Failed to delete review', 'error');
    }
  };

  // Save admin public response
  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!responseModalReview) return;
    setSavingResponse(true);
    try {
      await api.respondToReview(responseModalReview.id, responseText);
      showToast('Public atelier response updated');
      setResponseModalReview(null);
      setResponseText('');
      loadReviews();
    } catch (err) {
      showToast(err.message || 'Failed to post response', 'error');
    } finally {
      setSavingResponse(false);
    }
  };

  // Send manual review invitation
  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!invitationOrderId.trim()) return;
    setSendingInvitation(true);
    try {
      const res = await api.sendReviewInvitation(invitationOrderId.trim());
      showToast(res.message || 'Review invitation dispatched to patron');
      setInvitationOrderId('');
    } catch (err) {
      showToast(err.message || 'Failed to send invitation', 'error');
    } finally {
      setSendingInvitation(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Customer Reviews & Ratings Moderation
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Audit customer feedback, verified purchases, photos, and post official atelier responses
          </p>
        </div>

        {/* Dispatch Review Invitation Quick Tool */}
        <form onSubmit={handleSendInvitation} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Delivered Order ID (e.g. ORD-12345)"
            value={invitationOrderId}
            onChange={(e) => setInvitationOrderId(e.target.value.toUpperCase())}
            className="bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white uppercase font-mono rounded-none"
          />
          <button
            type="submit"
            disabled={sendingInvitation || !invitationOrderId.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider py-2 px-3 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{sendingInvitation ? 'Sending...' : 'Invite Review'}</span>
          </button>
        </form>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-stone-950/80 border border-stone-800 text-xs font-mono">
          <span className="text-stone-400 uppercase text-[10px] block">Total Appraisals</span>
          <span className="text-xl font-bold text-white mt-1 block">{counts.total || 0}</span>
        </div>
        <div className="p-3 bg-stone-950/80 border border-stone-800 text-xs font-mono">
          <span className="text-emerald-400 uppercase text-[10px] block">Verified Purchases</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">{counts.verified || 0}</span>
        </div>
        <div className="p-3 bg-stone-950/80 border border-stone-800 text-xs font-mono">
          <span className="text-emerald-500 uppercase text-[10px] block">Approved / Live</span>
          <span className="text-xl font-bold text-emerald-500 mt-1 block">{counts.approved || 0}</span>
        </div>
        <div className="p-3 bg-stone-950/80 border border-stone-800 text-xs font-mono">
          <span className="text-amber-400 uppercase text-[10px] block">Hidden / Censored</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">{counts.hidden || 0}</span>
        </div>
        <div className="p-3 bg-stone-950/80 border border-stone-800 text-xs font-mono">
          <span className="text-rose-400 uppercase text-[10px] block">Rejected Spam</span>
          <span className="text-xl font-bold text-rose-400 mt-1 block">{counts.rejected || 0}</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-stone-950/80 border border-stone-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, order ID, or text..."
            className="w-full bg-stone-900 border border-stone-700 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-xs text-white py-2 px-3 uppercase"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved (Live)</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-xs text-white py-2 px-3 uppercase"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Verified Filter */}
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-xs text-white py-2 px-3 uppercase"
          >
            <option value="all">All Buyers</option>
            <option value="verified">Verified Purchases Only</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Retrieving appraisals ledger...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No customer reviews match your criteria.
        </div>
      ) : (
        <div className="bg-stone-950/80 border border-stone-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 bg-stone-900/60">
                <th className="p-3.5">Garment Product</th>
                <th className="p-3.5">Customer & Order</th>
                <th className="p-3.5 text-center">Rating</th>
                <th className="p-3.5">Feedback & Photos</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-stone-900/40 transition-colors">
                  
                  {/* Product */}
                  <td className="p-3.5 flex items-center gap-3">
                    {r.product_image && (
                      <img
                        src={r.product_image}
                        alt={r.product_name}
                        className="w-10 h-12 object-cover bg-stone-900 border border-stone-800 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="font-sans font-bold text-white text-xs block truncate max-w-[180px]">
                        {r.product_name}
                      </span>
                      <span className="text-[10px] text-stone-500">ID #{r.product_id}</span>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="p-3.5">
                    <span className="text-white font-semibold block">{r.customer_name}</span>
                    <span className="text-[10px] text-stone-500 block truncate max-w-[160px]">{r.customer_email || 'No email provided'}</span>
                    
                    {r.is_verified ? (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase text-emerald-400">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Verified ({r.order_id})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 uppercase block mt-1">Unverified Buyer</span>
                    )}
                  </td>

                  {/* Rating */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center text-amber-400 font-bold">
                      <span className="mr-1">{r.rating}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                    </div>
                    <span className="text-[10px] text-stone-500 block">
                      {r.helpful_count || 0} helpful
                    </span>
                  </td>

                  {/* Content */}
                  <td className="p-3.5 max-w-[280px]">
                    {r.title && (
                      <strong className="text-white block font-serif truncate mb-0.5">{r.title}</strong>
                    )}
                    <p className="line-clamp-2 text-stone-300 font-sans text-xs">
                      "{r.comment}"
                    </p>

                    {/* Customer Photos preview */}
                    {Array.isArray(r.photos) && r.photos.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {r.photos.map((pUrl, idx) => (
                          <img
                            key={idx}
                            src={pUrl}
                            alt="Review attachment"
                            onClick={() => setActivePhotoModal(pUrl)}
                            className="w-8 h-10 object-cover border border-stone-700 cursor-pointer hover:border-amber-400"
                          />
                        ))}
                      </div>
                    )}

                    {/* Admin Response badge */}
                    {r.admin_response && (
                      <div className="mt-2 text-[10px] text-amber-300 italic line-clamp-1 border-l-2 border-amber-400 pl-1.5">
                        Response: "{r.admin_response}"
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                      r.status === 'approved' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : r.status === 'hidden'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {r.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Approve */}
                      {r.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'approved')}
                          className="p-1.5 bg-stone-900 hover:bg-emerald-950 text-stone-400 hover:text-emerald-400 border border-stone-700"
                          title="Approve / Publish Review"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Hide */}
                      {r.status !== 'hidden' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'hidden')}
                          className="p-1.5 bg-stone-900 hover:bg-amber-950 text-stone-400 hover:text-amber-400 border border-stone-700"
                          title="Hide Review from Storefront"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Public Response Modal Trigger */}
                      <button
                        onClick={() => {
                          setResponseModalReview(r);
                          setResponseText(r.admin_response || '');
                        }}
                        className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700"
                        title="Post or Edit Atelier Response"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Purge Delete */}
                      <button
                        onClick={() => handleDelete(r.id, r.customer_name)}
                        className="p-1.5 bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-400 border border-stone-700"
                        title="Purge Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Response Modal */}
      {responseModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-none max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-800">
              <h3 className="font-serif text-lg font-bold text-white">
                Official Atelier Response
              </h3>
              <button 
                onClick={() => setResponseModalReview(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-300 p-3 bg-stone-950 border border-stone-800 space-y-1">
              <p><strong>Patron:</strong> {responseModalReview.customer_name} ({responseModalReview.rating}★)</p>
              <p><strong>Garment:</strong> {responseModalReview.product_name}</p>
              <p className="italic text-stone-400">"{responseModalReview.comment}"</p>
            </div>

            <form onSubmit={handleSaveResponse} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Atelier Concierge Response
                </label>
                <textarea
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Thank the patron and address any fit, styling, or care queries directly..."
                  className="w-full bg-stone-950 border border-stone-700 p-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResponseModalReview(null)}
                  className="px-4 py-2 border border-stone-700 text-xs text-stone-300 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResponse}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs uppercase tracking-wider font-bold px-5 py-2 disabled:opacity-50"
                >
                  {savingResponse ? 'Publishing...' : 'Publish Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActivePhotoModal(null)}>
          <div className="relative max-w-2xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 p-2 bg-black/80 text-white rounded-none hover:bg-stone-800"
            >
              ✕
            </button>
            <img 
              src={activePhotoModal} 
              alt="Enlarged review photo" 
              className="w-full h-auto max-h-[85vh] object-contain border border-stone-700"
            />
          </div>
        </div>
      )}

    </div>
  );
}
