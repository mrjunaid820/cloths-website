import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Printer, 
  Truck, 
  ShoppingBag, 
  ArrowRight, 
  Download, 
  MapPin, 
  Mail, 
  Phone, 
  Clock 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export function OrderSuccessPage({ order, onNavigate }) {
  const { formatPrice, settings } = useSettings();
  const invoiceRef = useRef(null);

  useEffect(() => {
    // Trigger luxury gold & ivory confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#1c1917', '#f3e5ab', '#ffffff']
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <div 
        className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <h2 className="font-serif text-2xl font-bold mb-2">No Order Information Available</h2>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-4 rounded-xl text-xs tracking-widest uppercase font-bold py-3.5 px-6 transition-all shadow-md hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)'
          }}
        >
          Browse Collections
        </button>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div 
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto transition-colors duration-300 min-h-[80vh]"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      
      {/* Success Notification Banner */}
      <div className="text-center mb-10 animate-fade-in print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-500/30">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <span 
          className="text-xs uppercase tracking-[0.25em] font-bold block mb-1"
          style={{ color: 'var(--accent-primary)' }}
        >
          Commission Confirmed
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Thank You, {order.customer_name}
        </h1>
        <p className="text-xs sm:text-sm max-w-md mx-auto font-light" style={{ color: 'var(--text-muted)' }}>
          Your sartorial commission has been registered with our flagship atelier. A confirmation notice has been sent to <strong>{order.customer_email}</strong>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={handlePrint}
            className="rounded-xl text-xs tracking-widest uppercase font-bold py-3 px-5 flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)'
            }}
          >
            <Printer className="w-4 h-4" />
            <span>Print Luxury Invoice</span>
          </button>

          <button
            onClick={() => onNavigate('track', { query: order.id })}
            className="rounded-xl border text-xs tracking-widest uppercase font-semibold py-3 px-5 flex items-center gap-2 transition-all hover:opacity-80 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <Truck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span>Track Delivery Status</span>
          </button>

          <button
            onClick={() => onNavigate('shop')}
            className="rounded-xl border text-xs tracking-widest uppercase font-semibold py-3 px-5 transition-all hover:opacity-80 active:scale-[0.98]"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <span>Continue Shopping</span>
          </button>
        </div>
      </div>

      {/* Luxury Printable Invoice Sheet */}
      <div 
        ref={invoiceRef}
        className="border rounded-2xl p-8 sm:p-12 shadow-md print:border-none print:shadow-none print:p-0 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-stone-200 gap-6">
          <div>
            <span className="font-serif text-2xl sm:text-3xl tracking-[0.2em] uppercase font-bold text-stone-900 block">
              {settings.logo_text || 'AURA ATELIER'}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-stone-500 font-light block mt-1">
              HAUTE COUTURE & READY-TO-WEAR
            </span>
            <p className="text-xs text-stone-500 mt-2 max-w-xs font-light">
              {settings.address}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs uppercase tracking-widest text-stone-400 block font-semibold">
              OFFICIAL INVOICE
            </span>
            <h2 className="font-mono text-xl sm:text-2xl font-bold text-stone-900 mt-1">
              {order.id}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Date: {order.created_at || new Date().toLocaleDateString()}
            </p>
            <span className="inline-block bg-stone-100 text-stone-800 text-[10px] uppercase font-bold px-2 py-0.5 mt-2 border border-stone-200">
              Status: {order.status || 'Confirmed'}
            </span>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-stone-200 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">
              Billed & Dispatched To:
            </span>
            <p className="font-semibold text-stone-900 text-sm mb-1">{order.customer_name}</p>
            <p className="text-stone-600">{order.address}</p>
            <p className="text-stone-600">{order.city} {order.postal_code ? `, ${order.postal_code}` : ''}</p>
            <p className="text-stone-600 mt-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              {order.customer_phone}
            </p>
            <p className="text-stone-600 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              {order.customer_email}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2">
              Payment & Shipping Method:
            </span>
            <p className="text-stone-800">Payment: <strong>{order.payment_method || 'Cash on Delivery'}</strong></p>
            <p className="text-stone-800 mt-1">Shipping: <strong>Express White-Glove Courier</strong></p>
            {order.notes && (
              <div className="mt-3 p-3 bg-stone-50 border border-stone-100">
                <span className="text-[10px] uppercase text-stone-400 font-bold block">Delivery Remarks:</span>
                <p className="text-stone-600 italic mt-0.5">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="py-8 border-b border-stone-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 uppercase tracking-widest text-stone-400 font-bold text-[10px]">
                <th className="pb-3">Garment Item</th>
                <th className="pb-3 text-center">Variant</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Price</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item, idx) => (
                <tr key={idx} className="py-3">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-stone-900 block">{item.name}</span>
                    <span className="text-[10px] text-stone-400">SKU: {item.sku || 'N/A'}</span>
                  </td>
                  <td className="py-3 text-center text-stone-600">
                    {item.size} / {item.color}
                  </td>
                  <td className="py-3 text-center font-semibold text-stone-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right text-stone-600">
                    {formatPrice(item.price)}
                  </td>
                  <td className="py-3 text-right font-semibold text-stone-900">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div className="pt-6 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-stone-900">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Voucher Discount:</span>
                <span className="font-semibold">-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-stone-900">
                {order.delivery_fee === 0 ? 'Complimentary' : formatPrice(order.delivery_fee)}
              </span>
            </div>
            <div className="border-t border-stone-200 pt-2 flex justify-between text-base font-bold text-stone-900">
              <span>Grand Total:</span>
              <span className="font-serif text-lg">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-6 border-t border-stone-100 text-center text-[10px] text-stone-400 uppercase tracking-widest">
          <p>Thank you for choosing {settings.store_name}. For tailoring adjustments, contact concierge at {settings.email}.</p>
        </div>

      </div>

    </div>
  );
}
