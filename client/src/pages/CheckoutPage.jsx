import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  Building2, 
  Check, 
  MessageCircle, 
  Lock, 
  ArrowLeft, 
  Loader2,
  Wallet,
  Smartphone,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

const PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Bahawalpur',
  'Sargodha',
  'Sukkur',
  'Sheikhupura',
  'Jhelum',
  'Wah Cantt',
  'Rahim Yar Khan',
  'Gujrat',
  'Mardan',
  'Kasur',
  'Dera Ghazi Khan',
  'Sahiwal',
  'Okara'
];

export function CheckoutPage({ onNavigate, onOrderSuccess }) {
  const { 
    items, 
    subtotal, 
    discountAmount, 
    coupon, 
    clearCart,
    getWhatsAppCartUrl 
  } = useCart();

  const { formatPrice, settings } = useSettings();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedCityType, setSelectedCityType] = useState('Lahore');
  const [customCity, setCustomCity] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    address: '',
    city: 'Lahore',
    postal_code: '',
    notes: '',
    payment_method: 'Cash on Delivery' // 'Cash on Delivery' | 'Bank Transfer / Raast' | 'JazzCash' | 'Easypaisa'
  });

  // Dynamic delivery charge calculation based on Pakistani city & threshold
  const currentCityName = (selectedCityType === 'Other' ? customCity : selectedCityType).trim().toLowerCase();
  const isMetro = ['lahore', 'karachi', 'islamabad', 'rawalpindi'].some(mc => currentCityName.includes(mc));

  const standardFee = Number(settings.delivery_charge) || 299;
  const localFee = Number(settings.local_delivery_charge) || 199;
  const freeThreshold = Number(settings.free_shipping_threshold) || 7500;

  const deliveryFee = subtotal >= freeThreshold ? 0 : (isMetro ? localFee : standardFee);
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCitySelect = (e) => {
    const val = e.target.value;
    setSelectedCityType(val);
    if (val !== 'Other') {
      setFormData(prev => ({ ...prev, city: val }));
    } else {
      setFormData(prev => ({ ...prev, city: customCity }));
    }
  };

  const handleCustomCityChange = (e) => {
    const val = e.target.value;
    setCustomCity(val);
    setFormData(prev => ({ ...prev, city: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!items || items.length === 0) {
      showToast('Your shopping bag is empty', 'error');
      onNavigate('shop');
      return;
    }

    const effectiveCity = selectedCityType === 'Other' ? customCity.trim() : formData.city.trim();

    if (!formData.customer_name || !formData.customer_email || !formData.customer_phone || !formData.address || !effectiveCity) {
      showToast('Please fill in all required Pakistani delivery fields', 'error');
      return;
    }

    // Validate Pakistani mobile format (03xx-xxxxxxx or 03xxxxxxxxx or +923xxxxxxxxx)
    const pkPhoneClean = formData.customer_phone.replace(/[\s\-\(\)]/g, '');
    const pkRegex = /^(?:\+92|92|0)?3[0-9]{9}$/;
    if (!pkRegex.test(pkPhoneClean)) {
      showToast('Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or +923001234567)', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        ...formData,
        city: effectiveCity,
        items,
        coupon_code: coupon ? coupon.code : null,
      };

      const createdOrder = await api.createOrder(orderPayload);
      try {
        const existing = JSON.parse(localStorage.getItem('aura_customer_orders') || '[]');
        const updated = [createdOrder.id, ...existing.filter(id => id !== createdOrder.id)].slice(0, 10);
        localStorage.setItem('aura_customer_orders', JSON.stringify(updated));
      } catch (e) {}
      clearCart();
      showToast('Order confirmed successfully!');
      if (onOrderSuccess) {
        onOrderSuccess(createdOrder);
      } else {
        onNavigate('order-success', { order: createdOrder });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No items to checkout</h2>
        <p className="text-xs uppercase tracking-wider mb-6" style={{ color: 'var(--text-muted)' }}>Add pieces to your bag before proceeding.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs tracking-widest uppercase font-bold py-3.5 px-6 rounded-xl shadow-xs transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)'
          }}
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Checkout Header */}
      <div className="border-b pb-6 mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <button
            onClick={() => onNavigate('cart')}
            className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-2 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bag</span>
          </button>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Artisan Commission Checkout
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Express nationwide delivery across Pakistan with Cash on Delivery & Raast IBFT
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Delivery & Payment Details (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Customer & Shipping Information */}
          <div 
            className="border p-6 sm:p-8 space-y-5 rounded-2xl shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h2 className="font-serif text-xl font-bold border-b pb-3 flex items-center justify-between" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
              <span>1. Client & Delivery Details (Pakistan)</span>
              <span className="text-[11px] font-sans font-normal uppercase" style={{ color: 'var(--text-muted)' }}>Required fields *</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="e.g. Malik Hamza Khan"
                  className="w-full border p-3 text-xs rounded-xl focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  placeholder="hamza@domain.com"
                  className="w-full border p-3 text-xs rounded-xl focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Pakistani Mobile Number *
              </label>
              <input
                type="tel"
                required
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                placeholder="0300-1234567 or +923001234567"
                className="w-full border p-3 text-xs rounded-xl font-mono focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                Courier rider will call this number before arrival for doorstep dispatch.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Full Delivery Street Address *
              </label>
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House / Flat No., Street, Sector/Phase, Colony"
                className="w-full border p-3 text-xs rounded-xl focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  City (Pakistan) *
                </label>
                <select
                  value={selectedCityType}
                  onChange={handleCitySelect}
                  className="w-full border p-3 text-xs rounded-xl focus:outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c} {['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'].includes(c) ? '(Metro Express: Rs. 199)' : '(Nationwide: Rs. 299)'}
                    </option>
                  ))}
                  <option value="Other">Other Pakistani City / Tehsil</option>
                </select>

                {selectedCityType === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={handleCustomCityChange}
                    placeholder="Enter city / town name"
                    className="w-full border p-3 text-xs mt-2 rounded-xl focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Postal Code (Optional)
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="e.g. 54000"
                  className="w-full border p-3 text-xs rounded-xl focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Special Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Gate color, landmark near house, preferred delivery timing, etc."
                className="w-full border p-3 text-xs rounded-xl focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div 
            className="border p-6 sm:p-8 space-y-4 rounded-2xl shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h2 className="font-serif text-xl font-bold border-b pb-3" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
              2. Select Payment Method
            </h2>

            <div className="space-y-3">
              
              {/* Cash on Delivery */}
              <label 
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-all rounded-xl ${
                  formData.payment_method === 'Cash on Delivery'
                    ? 'ring-1 ring-amber-400 shadow-sm'
                    : 'hover:opacity-85'
                }`}
                style={{
                  backgroundColor: formData.payment_method === 'Cash on Delivery' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                  borderColor: formData.payment_method === 'Cash on Delivery' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="Cash on Delivery"
                  checked={formData.payment_method === 'Cash on Delivery'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span>Cash on Delivery (COD)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-md font-sans font-semibold">
                        Most Popular in Pakistan
                      </span>
                    </span>
                    <Truck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Pay exact cash in Pakistani Rupees (PKR) to the courier representative when your parcel arrives at your doorstep. Parcel inspection before payment supported.
                  </p>
                </div>
              </label>

              {/* Direct Bank Transfer / Raast */}
              <label 
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-all rounded-xl ${
                  formData.payment_method === 'Bank Transfer / Raast'
                    ? 'ring-1 ring-amber-400 shadow-sm'
                    : 'hover:opacity-85'
                }`}
                style={{
                  backgroundColor: formData.payment_method === 'Bank Transfer / Raast' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                  borderColor: formData.payment_method === 'Bank Transfer / Raast' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="Bank Transfer / Raast"
                  checked={formData.payment_method === 'Bank Transfer / Raast'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span>Raast / Direct Bank Transfer (IBFT)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md font-sans font-semibold">
                        Instant • 0% Surcharge
                      </span>
                    </span>
                    <Building2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Transfer directly via your Pakistani bank app (Meezan, HBL, Bank Alfalah, etc.) using Raast ID or IBAN.
                  </p>

                  {formData.payment_method === 'Bank Transfer / Raast' && (
                    <div className="mt-3 p-3 border text-xs space-y-1.5 font-mono rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-subtle)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Bank:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{settings.bank_name || 'Meezan Bank Limited'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Account Title:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{settings.bank_account_title || 'Aura Atelier Fashion Pvt Ltd'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>IBAN:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{settings.bank_iban || 'PK52MEZN0001000102030405'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Raast ID:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{settings.bank_raast_id || '03004562872'}</strong>
                      </div>
                      <p className="text-[10px] font-sans pt-1" style={{ color: 'var(--text-muted)' }}>
                        Please include your Order ID in the payment remarks and submit the reference number.
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* JazzCash */}
              <label 
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-all rounded-xl ${
                  formData.payment_method === 'JazzCash'
                    ? 'ring-1 ring-amber-400 shadow-sm'
                    : 'hover:opacity-85'
                }`}
                style={{
                  backgroundColor: formData.payment_method === 'JazzCash' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                  borderColor: formData.payment_method === 'JazzCash' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="JazzCash"
                  checked={formData.payment_method === 'JazzCash'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span>JazzCash Mobile Account / Voucher</span>
                    </span>
                    <Smartphone className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Pay securely using your JazzCash wallet balance, debit card, or cash voucher.
                  </p>
                </div>
              </label>

              {/* Easypaisa */}
              <label 
                className={`flex items-start gap-3 p-4 border cursor-pointer transition-all rounded-xl ${
                  formData.payment_method === 'Easypaisa'
                    ? 'ring-1 ring-amber-400 shadow-sm'
                    : 'hover:opacity-85'
                }`}
                style={{
                  backgroundColor: formData.payment_method === 'Easypaisa' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
                  borderColor: formData.payment_method === 'Easypaisa' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="Easypaisa"
                  checked={formData.payment_method === 'Easypaisa'}
                  onChange={handleChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <span>Easypaisa Mobile Account / Debit Card</span>
                    </span>
                    <Wallet className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Seamless digital checkout using your Easypaisa registered account or card.
                  </p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5">
          <div 
            className="border p-6 sm:p-8 space-y-6 sticky top-28 shadow-sm rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h2 className="font-serif text-xl font-bold pb-3 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
              Your Garments ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            {/* Items list preview */}
            <div className="max-h-64 overflow-y-auto divide-y pr-2" style={{ borderColor: 'var(--border-subtle)' }}>
              {items.map((item, idx) => (
                <div key={idx} className="py-3 flex gap-3 items-center" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div 
                    className="w-14 h-18 rounded-lg overflow-hidden border shrink-0 shadow-2xs"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--image-bg)'
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </h4>
                    <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {item.size} • {item.color} • Qty: {item.quantity}
                    </p>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs border-t pt-4" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Voucher Savings ({coupon?.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <span>Delivery ({isMetro ? 'Metro Express' : 'Nationwide TCS/Leopards'})</span>
                  {deliveryFee === 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Complimentary on orders over Rs. {freeThreshold.toLocaleString('en-PK')}</span>
                  )}
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {deliveryFee === 0 ? 'Complimentary' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between text-base font-bold" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                <span>Payable Total (PKR)</span>
                <span className="font-serif text-xl" style={{ color: 'var(--accent-gold)' }}>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 text-xs tracking-widest uppercase font-bold transition-all shadow-xs flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Confirm Order ({formData.payment_method})</span>
                )}
              </button>

              <a
                href={getWhatsAppCartUrl(formData)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-3 px-6 text-xs tracking-widest uppercase font-bold transition-colors flex items-center justify-center gap-2 rounded-xl shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order via WhatsApp (+92)</span>
              </a>
            </div>

            <p className="text-[10px] text-center uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              By confirming order you agree to our 30-day exchange and bespoke care terms across Pakistan.
            </p>
          </div>
        </div>

      </form>

    </div>
  );
}
