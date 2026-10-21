import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

export function ContactPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.sendMessage(form);
      setSubmitted(true);
      showToast('Message transmitted to the atelier concierge.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const whatsappPhone = settings.whatsapp_number ? settings.whatsapp_number.replace(/[^0-9]/g, '') : '1234567890';
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent("Hello Aura Atelier concierge, I would like to inquire regarding a bespoke appointment.")}`;

  return (
    <div 
      className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors duration-300 min-h-[80vh]"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span 
          className="text-xs tracking-[0.3em] uppercase font-semibold block mb-2"
          style={{ color: 'var(--accent-primary)' }}
        >
          Concierge & Flagship Salons
        </span>
        <h1 
          className="font-serif text-3xl sm:text-5xl font-bold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Contact The Atelier
        </h1>
        <p className="text-xs sm:text-sm font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Whether arranging a private salon appointment, requesting custom zardozi embroidery, or seeking bespoke fit consultation, our dedicated team is at your complete disposal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
        
        {/* Left: Contact Info & Action Buttons (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          <div 
            className="border rounded-2xl p-8 space-y-6 shadow-sm transition-colors duration-300"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h2 
              className="font-serif text-xl font-bold border-b pb-3"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              Direct Inquiries
            </h2>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <strong className="block uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-primary)' }}>Flagship Location</strong>
                  <p className="leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>{settings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <strong className="block uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-primary)' }}>Direct Line</strong>
                  <a href={`tel:${settings.phone}`} className="font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
                    {settings.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <strong className="block uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-primary)' }}>Client Relations</strong>
                  <a href={`mailto:${settings.email}`} className="font-medium hover:underline" style={{ color: 'var(--text-secondary)' }}>
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <strong className="block uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-primary)' }}>Opening Hours</strong>
                  <p className="font-light" style={{ color: 'var(--text-secondary)' }}>{settings.opening_hours}</p>
                </div>
              </div>
            </div>

            {/* Quick Action Triggers */}
            <div 
              className="pt-4 border-t space-y-2.5"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#128C7E] hover:bg-[#075E54] text-white py-3 px-4 rounded-xl text-xs tracking-widest uppercase font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat via WhatsApp</span>
              </a>

              <a
                href={`tel:${settings.phone}`}
                className="w-full py-3 px-4 rounded-xl text-xs tracking-widest uppercase font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                <Phone className="w-4 h-4" />
                <span>Call Atelier Telephone</span>
              </a>

              <a
                href={`mailto:${settings.email}`}
                className="w-full border py-3 px-4 rounded-xl text-xs tracking-widest uppercase font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:opacity-80 active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <Mail className="w-4 h-4" />
                <span>Send Direct Email</span>
              </a>
            </div>
          </div>

        </div>

        {/* Right: Working Contact Form (7 cols) */}
        <div className="lg:col-span-7">
          <div 
            className="border rounded-2xl p-8 sm:p-10 shadow-sm transition-colors duration-300"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Send Concierge Message
            </h2>
            <p className="text-xs uppercase tracking-wider mb-8" style={{ color: 'var(--text-muted)' }}>
              We respond to all patrons within 4 business hours.
            </p>

            {submitted ? (
              <div className="py-12 text-center space-y-4 animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Inquiry Transmitted</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Thank you for contacting Aura Atelier. A client relations director will attend to your request shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 rounded-xl text-xs uppercase tracking-widest font-bold py-3 px-6 transition-all"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Lady Clara Ravenscroft"
                      className="w-full border rounded-xl p-3 focus:outline-none text-xs transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="clara@ravenscroft.co.uk"
                      className="w-full border rounded-xl p-3 focus:outline-none text-xs transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+44 7700 900123"
                      className="w-full border rounded-xl p-3 focus:outline-none text-xs transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Bespoke Order / Size Consultation"
                      className="w-full border rounded-xl p-3 focus:outline-none text-xs transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Your Message / Custom Requirements *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Kindly detail your inquiry, specific garment references, or bespoke timeline..."
                    className="w-full border rounded-xl p-3 focus:outline-none text-xs transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl uppercase tracking-widest font-bold py-4 px-8 text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--btn-primary-bg)',
                    color: 'var(--btn-primary-text)'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Message to Concierge</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>

      </div>

      {/* Interactive Google Maps Embed */}
      <div 
        className="border rounded-2xl p-4 shadow-sm transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="pb-3 px-2 flex justify-between items-center text-xs">
          <span className="font-serif font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Flagship Boutique Location</span>
          <span className="uppercase tracking-widest text-[11px]" style={{ color: 'var(--text-muted)' }}>{settings.address}</span>
        </div>
        <div className="w-full h-80 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
          <iframe
            src={settings.google_maps_embed}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Flagship Location Map"
          />
        </div>
      </div>

    </div>
  );
}
