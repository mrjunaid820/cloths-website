import React, { useState, useEffect } from 'react';
import { Settings, Save, Lock, KeyRound, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminSettings() {
  const { settings, refreshSettings } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({ ...settings });
  const [savingSettings, setSavingSettings] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.updateSettings(form);
      await refreshSettings();
      showToast('Store settings updated and synchronized across boutique.');
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      showToast('Admin password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Atelier Configuration & Master Settings
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Configure boutique identity, contact lines, currency, shipping rules, and security
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-8 text-xs font-mono">
        
        {/* Brand & Identity */}
        <div className="bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-2">
            1. Brand Identity & Header
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-stone-400 mb-1">Store / Maison Name</label>
              <input
                type="text"
                name="store_name"
                value={form.store_name || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Logo Text</label>
              <input
                type="text"
                name="logo_text"
                value={form.logo_text || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">Tagline</label>
            <input
              type="text"
              name="tagline"
              value={form.tagline || ''}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">Top Announcement Bar Text</label>
            <input
              type="text"
              name="announcement_bar"
              value={form.announcement_bar || ''}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-amber-300 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Currency & Delivery Pricing */}
        <div className="bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-2">
            2. Currency & Pakistani Shipping Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block uppercase text-stone-400 mb-1">Currency Symbol</label>
              <input
                type="text"
                name="currency"
                value={form.currency || 'Rs.'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 text-center font-bold text-sm"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Standard Nationwide Delivery (PKR)</label>
              <input
                type="number"
                name="delivery_charge"
                value={form.delivery_charge || '299'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Metro Express Delivery (PKR)</label>
              <input
                type="number"
                name="local_delivery_charge"
                value={form.local_delivery_charge || '199'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Free Shipping Threshold (PKR)</label>
              <input
                type="number"
                name="free_shipping_threshold"
                value={form.free_shipping_threshold || '7500'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Pakistani Banking & Raast Configuration */}
        <div className="bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-2">
            3. Pakistani Corporate Banking & Raast IBFT Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-stone-400 mb-1">Bank Name</label>
              <input
                type="text"
                name="bank_name"
                value={form.bank_name || 'Meezan Bank Limited'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Account Title</label>
              <input
                type="text"
                name="bank_account_title"
                value={form.bank_account_title || 'Aura Atelier Fashion Pvt Ltd'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">IBAN Number (24 chars)</label>
              <input
                type="text"
                name="bank_iban"
                value={form.bank_iban || 'PK52MEZN0001000102030405'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Raast ID / Registered Phone</label>
              <input
                type="text"
                name="bank_raast_id"
                value={form.bank_raast_id || '03004562872'}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Contact & Boutique Location */}
        <div className="bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-2">
            3. Salon Concierge & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block uppercase text-stone-400 mb-1">Telephone</label>
              <input
                type="text"
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp_number"
                value={form.whatsapp_number || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-emerald-400 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">Physical Flagship Address</label>
            <input
              type="text"
              name="address"
              value={form.address || ''}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">Google Maps Embed URL</label>
            <input
              type="text"
              name="google_maps_embed"
              value={form.google_maps_embed || ''}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">Store Opening Hours</label>
            <input
              type="text"
              name="opening_hours"
              value={form.opening_hours || ''}
              onChange={handleChange}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-stone-950/80 border border-stone-800 p-6 space-y-4">
          <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-2">
            4. Social Media Portals
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-stone-400 mb-1">Instagram URL</label>
              <input
                type="url"
                name="instagram_url"
                value={form.instagram_url || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">Facebook URL</label>
              <input
                type="url"
                name="facebook_url"
                value={form.facebook_url || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">TikTok URL</label>
              <input
                type="url"
                name="tiktok_url"
                value={form.tiktok_url || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block uppercase text-stone-400 mb-1">YouTube URL</label>
              <input
                type="url"
                name="youtube_url"
                value={form.youtube_url || ''}
                onChange={handleChange}
                className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={savingSettings}
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 uppercase font-bold text-xs py-3.5 flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
          >
            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Configuration Settings</span>
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <div className="bg-stone-950/80 border border-stone-800 p-6 space-y-4 text-xs font-mono">
        <h3 className="font-serif text-lg font-bold text-white border-b border-stone-800 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Security: Update Master Admin Password</span>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block uppercase text-stone-400 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">New Secure Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block uppercase text-stone-400 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="bg-stone-800 hover:bg-stone-700 text-white uppercase font-bold text-xs py-2.5 px-6 flex items-center gap-2 transition-colors disabled:opacity-50 border border-stone-600"
          >
            {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>Update Master Password</span>
          </button>
        </form>
      </div>

    </div>
  );
}
