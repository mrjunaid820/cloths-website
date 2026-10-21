import React, { useState } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { useSettings } from '../context/SettingsContext';

export function PriceAlertModal({ isOpen, onClose, product }) {
  const { formatPrice } = useSettings();
  const [email, setEmail] = useState('');
  const [desiredPrice, setDesiredPrice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.createPriceAlert(
        product.id,
        email,
        desiredPrice ? parseFloat(desiredPrice) : null
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to register price alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-hero-fade">
      <div 
        className="relative w-full max-w-md rounded-2xl border shadow-2xl p-6"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-medium)',
          color: 'var(--text-primary)'
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold">Alert Active</h3>
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              We will instantly notify you at <strong className="font-mono text-amber-500">{email}</strong> the moment the price of "{product.name}" drops.
            </p>
            <button
              onClick={onClose}
              className="mt-6 py-2 px-6 rounded-xl text-xs uppercase tracking-wider font-semibold"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-500">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">Price Drop Alert</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Current price: <strong className="font-mono text-amber-500">{formatPrice(product.price)}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Opt in to receive an immediate email notification when this bespoke piece goes on sale or gets discounted by our master atelier.
            </p>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.pk"
                  className="w-full text-xs p-2.5 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1">
                  Target Price (PKR Rs. - Optional)
                </label>
                <input
                  type="number"
                  value={desiredPrice}
                  onChange={(e) => setDesiredPrice(e.target.value)}
                  placeholder={`Notify if below e.g. ${Number(product.price) * 0.85}`}
                  className="w-full text-xs p-2.5 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all shadow-md cursor-pointer"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  {loading ? 'Subscribing...' : 'Set Price Alert'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
