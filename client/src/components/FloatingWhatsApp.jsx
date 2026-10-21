import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export function FloatingWhatsApp() {
  const { settings } = useSettings();
  const [showTooltip, setShowTooltip] = useState(true);

  const phone = settings.whatsapp_number ? settings.whatsapp_number.replace(/[^0-9]/g, '') : '1234567890';
  const message = encodeURIComponent(`Hello ${settings.store_name || 'Aura Atelier'}, I would like to inquire about your collections and bespoke ordering.`);
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-3">
      {/* Tooltip bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-stone-900 text-stone-100 text-xs py-2 px-3.5 shadow-2xl border border-stone-800 animate-fade-in relative">
          <span className="tracking-wide">Chat with Atelier Concierge</span>
          <button 
            onClick={() => setShowTooltip(false)}
            className="text-stone-400 hover:text-white ml-1"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-stone-900" />
        </div>
      )}

      {/* Pulsing WhatsApp CTA Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110"
        title="Chat on WhatsApp"
        aria-label="Order or Inquire via WhatsApp"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping group-hover:animate-none pointer-events-none" />
        <MessageCircle className="w-6 h-6 fill-current relative z-10" />
      </a>
    </div>
  );
}
