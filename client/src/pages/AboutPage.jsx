import React from 'react';
import { Sparkles, Scissors, Globe2, ShieldCheck } from 'lucide-react';

export function AboutPage({ onNavigate }) {
  return (
    <div 
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors duration-300 min-h-[80vh]"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span 
          className="text-xs tracking-[0.3em] uppercase font-semibold block mb-3"
          style={{ color: 'var(--accent-primary)' }}
        >
          The Maison & Philosophy
        </span>
        <h1 
          className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Sartorial Lineage.<br />
          <span className="italic font-normal" style={{ color: 'var(--text-muted)' }}>Uncompromising Craftsmanship.</span>
        </h1>
        <p className="text-sm sm:text-base font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Founded with an obsessive dedication to heirloom tailoring, Aura Atelier unites the opulence of royal Eastern zardozi embroideries with the sharp, architectural precision of bespoke Italian suiting.
        </p>
      </div>

      {/* Large Image Feature */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-2xl sm:rounded-3xl mb-20 shadow-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
        <img
          src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=2000&auto=format&fit=crop"
          alt="Atelier Workshop"
          className="w-full h-full object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-8 sm:p-12">
          <p className="text-white font-serif text-lg sm:text-2xl italic max-w-xl">
            "True luxury is not merely worn; it is inherited. Every stitch carries the legacy of generational artisans."
          </p>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div 
          className="border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <Scissors className="w-8 h-8 mb-4" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Master Tailoring</h3>
          <p className="text-xs sm:text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Our master pattern-makers spend over 40 hours crafting each structured silhouette, from canvassed lapels to hand-pleated gowns that move gracefully with every step.
          </p>
        </div>

        <div 
          className="border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <Sparkles className="w-8 h-8 mb-4" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Noble Natural Fibers</h3>
          <p className="text-xs sm:text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            We source exclusively from heritage mills: Mongolian Grade-A Cashmere, Biella Super 150s Merino wool, Okayama selvedge denim, and hand-spun Banarasi raw silks.
          </p>
        </div>

        <div 
          className="border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <Globe2 className="w-8 h-8 mb-4" style={{ color: 'var(--accent-primary)' }} />
          <h3 className="font-serif text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Global White-Glove</h3>
          <p className="text-xs sm:text-sm font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            From our Madison Avenue flagship to private residences in London, Paris, and Dubai, our patrons experience seamless bespoke concierge service and express international delivery.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div 
        className="text-center p-12 sm:p-16 rounded-2xl sm:rounded-3xl border shadow-lg"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Experience The Collection
        </h2>
        <p className="text-xs sm:text-sm max-w-md mx-auto mb-8 font-light" style={{ color: 'var(--text-muted)' }}>
          Discover our current autumn runway arrivals and bespoke custom offerings.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="rounded-xl text-xs tracking-widest uppercase font-bold py-4 px-8 transition-all shadow-md hover:scale-105 active:scale-95"
          style={{
            backgroundColor: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)'
          }}
        >
          Explore Couture Catalog
        </button>
      </div>

    </div>
  );
}
