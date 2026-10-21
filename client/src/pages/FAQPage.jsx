import React, { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

export function FAQPage({ onNavigate }) {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How does bespoke sizing and tailoring consultation work?',
      a: 'Patrons can reference our comprehensive Bespoke Size Guide on every product page. If you require custom alterations, length adjustments, or made-to-measure tailoring, click "Order via WhatsApp" to speak directly with our head fitter.'
    },
    {
      q: 'What are your delivery timeframes and charges across Pakistan?',
      a: 'We provide complimentary express courier delivery on all orders exceeding Rs. 7,500 across Pakistan. For orders below this threshold, standard shipping is Rs. 299 nationwide (or Rs. 199 in metro cities like Lahore, Karachi, and Islamabad). Orders arrive within 2–4 business days via TCS or Leopards Express.'
    },
    {
      q: 'What is your returns and exchange policy?',
      a: 'We extend an effortless 30-day return and exchange policy for all unworn garments with original atelier tags and security seals intact. Contact our concierge team to schedule complimentary doorstep return courier pickup.'
    },
    {
      q: 'How should I care for raw silk, velvet, and embroidered garments?',
      a: 'All pieces crafted with raw silk, French Chantilly lace, micro-velvet, or hand-applied zardozi metal embroidery must be professionally dry cleaned by luxury garment specialists. Never machine wash or apply direct hot iron.'
    },
    {
      q: 'Can I order directly through WhatsApp?',
      a: 'Yes. Every garment card, product details view, and shopping bag includes a direct "Order via WhatsApp" button which automatically pre-fills your selected items, colors, sizes, and concierge delivery instructions.'
    },
    {
      q: 'What payment methods do you accept in Pakistan?',
      a: 'We accept Cash on Delivery (COD) across all cities and towns in Pakistan, Instant Raast ID / Direct Bank Transfer (Meezan Bank IBFT), JazzCash Mobile Accounts, and Easypaisa.'
    }
  ];

  return (
    <div 
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto transition-colors duration-300 min-h-[80vh]"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="text-center mb-16">
        <span 
          className="text-xs tracking-[0.3em] uppercase font-semibold block mb-2"
          style={{ color: 'var(--accent-primary)' }}
        >
          Patron Concierge
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm font-light" style={{ color: 'var(--text-muted)' }}>
          Everything you need to know about our craftsmanship, sizing, and international fulfillment.
        </p>
      </div>

      <div 
        className="border rounded-2xl divide-y overflow-hidden shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="p-6" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left font-serif text-base sm:text-lg font-bold gap-4 transition-opacity hover:opacity-80"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>{faq.q}</span>
                <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div 
                  className="mt-4 text-xs sm:text-sm font-light leading-relaxed animate-fade-in pr-6"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        <p>Still have questions? Contact our salon director directly.</p>
        <button
          onClick={() => onNavigate('contact')}
          className="mt-3 rounded-xl uppercase tracking-widest font-bold py-3.5 px-6 transition-all shadow-md hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)'
          }}
        >
          Contact Salon Concierge
        </button>
      </div>
    </div>
  );
}
