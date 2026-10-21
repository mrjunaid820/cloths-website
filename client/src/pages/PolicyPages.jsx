import React from 'react';

export function PolicyPage({ type = 'shipping' }) {
  const content = {
    shipping: {
      title: 'Express Shipping & White-Glove Delivery',
      subtitle: 'Global logistics and secure tracked fulfillment',
      body: [
        {
          heading: 'Complimentary Shipping Across Pakistan',
          text: 'Aura Atelier extends complimentary express courier delivery on all couture commissions exceeding Rs. 7,500. For commissions below this threshold, a standardized rate applies (Rs. 199 for metro cities like Lahore, Karachi, and Islamabad; Rs. 299 nationwide).'
        },
        {
          heading: 'Fulfillment & Inspection Timelines',
          text: 'Every ready-to-wear piece is hand-inspected, steam-pressed, and enveloped in our protective luxury dust-bag within 24 to 48 hours of order confirmation. Custom tailored pieces undergo bespoke finishing and require 3–5 working days.'
        },
        {
          heading: 'Courier Partners & Tracking',
          text: 'All parcels are dispatched through TCS Express, Leopards Courier, Trax Logistics, or PostEx. Patrons receive an encrypted real-time tracking link and SMS/WhatsApp delivery milestone notifications with Cash on Delivery (COD) supported nationwide.'
        }
      ]
    },
    return: {
      title: 'Boutique Returns & 30-Day Exchanges',
      subtitle: 'Our guarantee of absolute fit and immaculate quality',
      body: [
        {
          heading: '30-Day Consideration Window',
          text: 'We welcome returns and size exchanges within 30 days of parcel receipt. All garments must remain unworn, unwashed, unaltered, and with original atelier seals attached.'
        },
        {
          heading: 'Complimentary Return Collection',
          text: 'Patrons may contact our concierge team via WhatsApp or email to schedule doorstep courier pickup at zero cost to the client.'
        },
        {
          heading: 'Refund Issuance',
          text: 'Following inspection by our quality director, refunds are credited back to your original payment card or direct bank account within 2 business days.'
        }
      ]
    },
    privacy: {
      title: 'Client Privacy & Data Confidentiality',
      subtitle: 'Preserving patron discretion and transaction security',
      body: [
        {
          heading: 'Data Discretion',
          text: 'Aura Atelier strictly safeguards all client measurements, delivery addresses, and contact communications. We never sell, lease, or distribute private information to third parties.'
        },
        {
          heading: 'Encrypted Payment Processing',
          text: 'All payment interactions utilize bank-grade 256-bit SSL encryption. We do not store sensitive credit or debit card CVV credentials on our servers.'
        }
      ]
    },
    terms: {
      title: 'Terms & Conditions of Commission',
      subtitle: 'Atelier standards and client agreements',
      body: [
        {
          heading: 'Bespoke Order Commitments',
          text: 'By placing a commission with Aura Atelier, patrons confirm accuracy of sizing preferences. Custom hand-embroidered bespoke commissions with individual alterations are final sale once production begins.'
        },
        {
          heading: 'Intellectual Property',
          text: 'All bespoke embroidery designs, photography, silhouettes, and textile patterns remain the exclusive intellectual copyright of Aura Atelier.'
        }
      ]
    }
  };

  const current = content[type] || content.shipping;

  return (
    <div 
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto transition-colors duration-300 min-h-[80vh]"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div 
        className="border-b pb-8 mb-10"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span 
          className="text-xs uppercase tracking-[0.25em] font-semibold block mb-2"
          style={{ color: 'var(--accent-primary)' }}
        >
          Atelier Policies
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {current.title}
        </h1>
        <p className="text-xs uppercase tracking-wider font-light" style={{ color: 'var(--text-muted)' }}>
          {current.subtitle}
        </p>
      </div>

      <div 
        className="border rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {current.body.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {item.heading}
            </h3>
            <p className="text-xs sm:text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
