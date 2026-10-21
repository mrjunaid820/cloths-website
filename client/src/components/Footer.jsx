import React, { useState } from 'react';
import { 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

// Clean SVG Brand Icons
function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
      <polygon points="10 15 15 12 10 9 10 15"/>
    </svg>
  );
}

export function Footer({ onNavigate }) {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setSubscribed(true);
    showToast('Welcome to the Atelier Privé. Your 10% voucher has been generated: AURA10');
    setNewsletterEmail('');
  };

  const shopLinks = [
    { label: 'Men\'s Collection', category: 'Men' },
    { label: 'Women\'s Collection', category: 'Women' },
    { label: 'Shalwar Qameez & Kurta', category: 'Shalwar Qameez' },
    { label: 'Bespoke Suits', category: 'Suits' },
    { label: 'Abayas & Modestie', category: 'Abayas' },
    { label: 'Mulberry Silk Hijabs', category: 'Hijabs' },
    { label: 'Japanese Selvedge Denim', category: 'Jeans' },
    { label: 'Autumn / Winter Capsule', category: 'Seasonal Collection' }
  ];

  return (
    <footer 
      className="border-t transition-colors duration-300"
      style={{
        backgroundColor: 'var(--footer-bg)',
        color: 'var(--footer-text)',
        borderColor: 'var(--footer-border)'
      }}
    >
      {/* Newsletter Section */}
      <div 
        className="border-b py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
        style={{ borderColor: 'var(--footer-border)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span 
            className="text-[11px] tracking-[0.3em] uppercase font-semibold block mb-3"
            style={{ color: 'var(--accent-primary)' }}
          >
            Privé Circle
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-white font-bold mb-4">
            Join the Aura Atelier Gazette
          </h3>
          <p className="text-stone-400 text-xs sm:text-sm font-light max-w-xl mx-auto mb-8">
            Receive private runway invites, bespoke tailoring announcements, and enjoy 10% off your inaugural couture commission.
          </p>

          {subscribed ? (
            <div 
              className="inline-flex items-center gap-2 border px-6 py-3 text-xs tracking-wider uppercase rounded-xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)'
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Thank you for subscribing. Use code <strong>AURA10</strong> at checkout.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row max-w-md mx-auto gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="flex-1 rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors border placeholder:text-stone-500"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderColor: 'var(--footer-border)',
                  color: '#ffffff'
                }}
              />
              <button
                type="submit"
                className="rounded-xl text-xs tracking-widest uppercase font-bold py-3 px-6 transition-all duration-300 flex items-center justify-center gap-2 shrink-0 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                <span>Subscribe</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        
        {/* Brand Bio */}
        <div className="lg:col-span-2 space-y-4">
          <span className="font-serif text-2xl tracking-[0.25em] uppercase font-bold text-white block">
            {settings.logo_text || 'AURA ATELIER'}
          </span>
          <p className="text-xs text-stone-400 font-light leading-relaxed max-w-sm">
            {settings.tagline || 'Haute Couture & Contemporary Sartorial Luxury.'} Dedicated to preserving heirloom craftsmanship, fine silks, tailored Italian fabrics, and timeless luxury wardrobe essentials.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3 pt-2">
            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-white hover:text-stone-950 text-stone-300 flex items-center justify-center transition-all"
                title="Instagram"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
            )}
            {settings.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-white hover:text-stone-950 text-stone-300 flex items-center justify-center transition-all"
                title="Facebook"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            )}
            {settings.youtube_url && (
              <a
                href={settings.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-white hover:text-stone-950 text-stone-300 flex items-center justify-center transition-all"
                title="YouTube"
              >
                <YoutubeIcon className="w-4 h-4" />
              </a>
            )}
            {settings.whatsapp_number && (
              <a
                href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-stone-900 hover:bg-white hover:text-stone-950 text-stone-300 flex items-center justify-center transition-all"
                title="WhatsApp Concierge"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Shop Collections */}
        <div>
          <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-white mb-4">
            Collections
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            {shopLinks.map((link) => (
              <li key={link.label}>
                <button
                  onClick={() => onNavigate('shop', { category: link.category })}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Client Care & Services */}
        <div>
          <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-white mb-4">
            Client Concierge
          </h4>
          <ul className="space-y-2.5 text-xs text-stone-400">
            <li>
              <button onClick={() => onNavigate('track')} className="hover:text-white transition-colors">
                Track Your Shipment
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors">
                Bespoke Sizing & FAQ
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shipping-policy')} className="hover:text-white transition-colors">
                Express Shipping Policy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('return-policy')} className="hover:text-white transition-colors">
                Returns & 30-Day Exchange
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('privacy-policy')} className="hover:text-white transition-colors">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors">
                Terms of Service
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('account')} className="hover:text-white transition-colors">
                Customer Account Portal
              </button>
            </li>
            <li className="pt-2">
              <button 
                onClick={() => onNavigate('admin')} 
                className="text-amber-400/90 hover:text-amber-300 font-semibold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Management</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Boutique Flagship Contact */}
        <div className="space-y-3 text-xs text-stone-400">
          <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-white mb-4">
            Flagship Atelier
          </h4>
          <p className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{settings.address}</span>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-amber-400 shrink-0" />
            <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">
              {settings.phone}
            </a>
          </p>
          <p className="flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
            <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
              {settings.email}
            </a>
          </p>
          <p className="flex items-start gap-2.5 pt-1 text-stone-500 text-[11px]">
            <Clock className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <span>{settings.opening_hours}</span>
          </p>
        </div>

      </div>

      {/* Bottom Legal Bar */}
      <div 
        className="border-t py-6 px-4 sm:px-6 lg:px-8 text-[11px] text-stone-500 transition-colors duration-300"
        style={{ borderColor: 'var(--footer-border)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {settings.store_name}. All rights reserved. Haute couture & bespoke tailoring.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('privacy-policy')} className="hover:text-stone-300">Privacy</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-stone-300">Terms</button>
            <button onClick={() => onNavigate('shipping-policy')} className="hover:text-stone-300">Shipping</button>
            <button onClick={() => onNavigate('return-policy')} className="hover:text-stone-300">Returns</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
