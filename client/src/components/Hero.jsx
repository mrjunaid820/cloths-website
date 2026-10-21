import React from 'react';
import { ArrowRight, Sparkles, Shield, Truck, RefreshCw } from 'lucide-react';

export function Hero({ onNavigate }) {
  return (
    <section className="relative w-full overflow-hidden bg-stone-950 text-white">
      {/* Background Hero Image with Subtle Parallax & Gradient Overlay */}
      <div className="relative min-h-[75vh] sm:min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop')`
          }}
        >
          {/* Multi-layered luxury gradient mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/65 to-stone-950/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/30" />
        </div>

        {/* Content Container with Staggered Entrance Animations */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-start justify-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-amber-200 text-xs tracking-[0.25em] uppercase font-semibold mb-6 rounded-full animate-hero-slide delay-100 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Autumn / Winter 2026 Haute Couture Collection</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-3xl leading-[1.08] mb-6 animate-hero-slide delay-200">
            Timeless Elegance.<br />
            <span className="italic font-normal text-stone-300">Modern Refinement.</span>
          </h1>

          <p className="text-stone-300 text-sm sm:text-base lg:text-lg max-w-xl font-light tracking-wide leading-relaxed mb-10 animate-hero-slide delay-300">
            From handcrafted raw silk kurtas and regal velvet sherwanis to Italian-cut cashmere tailoring and ethereal gowns. Indulge in bespoke artisanal perfection across Pakistan.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto animate-hero-slide delay-400">
            <button
              onClick={() => onNavigate('shop', { filter: 'new' })}
              className="bg-white text-stone-950 hover:bg-stone-200 text-xs sm:text-sm tracking-[0.2em] uppercase font-bold py-4 px-8 rounded-full transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl hover:scale-105 group"
            >
              <span>Shop New Arrivals</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('shop')}
              className="bg-stone-900/80 hover:bg-stone-900 text-white border border-stone-600 text-xs sm:text-sm tracking-[0.2em] uppercase font-medium py-4 px-8 rounded-full backdrop-blur-md transition-all duration-300 hover:border-white hover:scale-105 flex items-center justify-center"
            >
              <span>Explore Entire Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* Luxury Trust Pillars Bar */}
      <div 
        className="border-t py-6 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: 'var(--bg-announcement)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-announcement)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase">Express Delivery</h4>
              <p className="text-[11px] opacity-75">Complimentary on orders over Rs. 7,500</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase">Bespoke Artisan Craft</h4>
              <p className="text-[11px] opacity-75">Finest silks, wools, & French lace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase">Effortless Returns</h4>
              <p className="text-[11px] opacity-75">30-day seamless boutique exchange</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase">White-Glove Care</h4>
              <p className="text-[11px] opacity-75">24/7 dedicated concierge assistance</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
