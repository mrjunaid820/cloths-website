import React, { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, Check, X, Loader2, Calendar, Percent, DollarSign } from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminCoupons() {
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage', // 'percentage' | 'fixed'
    discount_value: '',
    min_order_amount: 100,
    max_uses: 200,
    expires_at: '2027-12-31'
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons();
      setCoupons(data || []);
    } catch (err) {
      showToast('Failed to load coupons: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleToggleActive = async (cp) => {
    try {
      await api.updateCoupon(cp.id, { is_active: cp.is_active ? 0 : 1 });
      showToast(`Coupon "${cp.code}" is now ${cp.is_active ? 'inactive' : 'active'}`);
      loadCoupons();
    } catch (err) {
      showToast(err.message || 'Failed to update coupon', 'error');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon code "${code}"?`)) return;
    try {
      await api.deleteCoupon(id);
      showToast(`Coupon "${code}" deleted`);
      loadCoupons();
    } catch (err) {
      showToast(err.message || 'Failed to delete coupon', 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discount_value) return;

    setSaving(true);
    try {
      await api.createCoupon(formData);
      showToast(`Voucher code "${formData.code.toUpperCase()}" established`);
      setShowModal(false);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: 100,
        max_uses: 200,
        expires_at: '2027-12-31'
      });
      loadCoupons();
    } catch (err) {
      showToast(err.message || 'Failed to create coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Voucher & Promotional Privileges
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Admin-controlled coupons, minimum thresholds, and redemption quotas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Coupon</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Accessing promotional treasury...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No active vouchers found.
        </div>
      ) : (
        <div className="bg-stone-950/80 border border-stone-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 bg-stone-900/60">
                <th className="p-3.5">Promo Code</th>
                <th className="p-3.5">Discount Benefit</th>
                <th className="p-3.5">Min Order</th>
                <th className="p-3.5 text-center">Redemptions</th>
                <th className="p-3.5">Expiry Date</th>
                <th className="p-3.5 text-center">Active Status</th>
                <th className="p-3.5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="p-3.5 font-bold text-amber-400 text-sm">
                    {c.code}
                  </td>

                  <td className="p-3.5 font-bold text-white">
                    {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `${formatPrice(c.discount_value)} OFF`}
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : 'None'}
                  </td>

                  <td className="p-3.5 text-center text-stone-300">
                    {c.times_used} / {c.max_uses || '∞'}
                  </td>

                  <td className="p-3.5 text-stone-400">
                    {c.expires_at || 'Never'}
                  </td>

                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`px-3 py-1 text-[10px] uppercase font-bold border transition-colors ${
                        c.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-stone-800 text-stone-500 border-stone-700'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="p-1.5 bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-400 border border-stone-700"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 max-w-md w-full shadow-2xl text-xs font-mono animate-fade-in space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-stone-800">
              <h3 className="font-serif text-xl font-bold text-white">Issue Promotional Voucher</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block uppercase text-stone-300 font-bold mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. VIP25 or AUTUMN50"
                  className="w-full bg-stone-950 border border-stone-700 p-2.5 text-amber-400 font-bold uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-stone-300 font-bold mb-1">Benefit Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-stone-300 font-bold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '20%' : 'Rs. 500'}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-stone-300 mb-1">Min Order Amount (PKR)</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block uppercase text-stone-300 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase text-stone-300 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-stone-700 text-stone-300 uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 uppercase font-bold py-2.5"
                >
                  {saving ? 'Creating...' : 'Activate Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
