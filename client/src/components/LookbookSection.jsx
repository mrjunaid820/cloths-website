import React, { useState } from 'react';
import { Eye, ShoppingBag, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export function LookbookSection({ lookbooks = [], onSelectProduct, onQuickView }) {
  const { formatPrice } = useSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState(null);

  if (!lookbooks || lookbooks.length === 0) return null;

  const currentLookbook = lookbooks[activeTab] || lookbooks[0];

  return (
    <section className="py-16 sm:py-24 border-t border-b overflow-hidden" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span 
            className="text-[10px] tracking-[0.3em] uppercase font-bold px-3 py-1 rounded-full shadow-xs inline-block mb-3"
            style={{
              backgroundColor: 'var(--badge-new-bg)',
              color: 'var(--badge-new-text)'
            }}
          >
            Editorial Atelier
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Interactive Fashion Lookbook
          </h2>
          <p className="text-xs sm:text-sm mt-3 font-light leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Tap the illuminated couture pins to explore garment specifications, fabric heritage, and purchase individual ensemble pieces.
          </p>

          {/* Lookbook Tabs */}
          {lookbooks.length > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8">
              {lookbooks.map((lb, idx) => (
                <button
                  key={lb.id}
                  onClick={() => {
                    setActiveTab(idx);
                    setActiveHotspot(null);
                  }}
                  className={`text-xs uppercase tracking-[0.15em] font-medium px-4 py-2 rounded-full border transition-all ${
                    activeTab === idx
                      ? 'shadow-md scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: activeTab === idx ? 'var(--btn-primary-bg)' : 'transparent',
                    color: activeTab === idx ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                    borderColor: activeTab === idx ? 'transparent' : 'var(--border-subtle)'
                  }}
                >
                  {lb.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editorial Showcase Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Visual with Pulsing Interactive Hotspots */}
          <div className="lg:col-span-8 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border aspect-[4/5] sm:aspect-[16/11]" style={{ borderColor: 'var(--border-subtle)' }}>
            <img
              src={currentLookbook.image}
              alt={currentLookbook.title}
              className="w-full h-full object-cover object-center transition-transform duration-1000"
            />
            
            {/* Subtle Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* Hotspots */}
            {currentLookbook.hotspots?.map((hs) => {
              const isSelected = activeHotspot?.id === hs.id;
              return (
                <div
                  key={hs.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${hs.x_percent}%`, top: `${hs.y_percent}%` }}
                >
                  <button
                    onClick={() => setActiveHotspot(isSelected ? null : hs)}
                    className="relative group p-2 focus:outline-none"
                    aria-label={`View outfit detail: ${hs.label || hs.product_name}`}
                  >
                    {/* Pulsing Radar Ring */}
                    <span className="absolute inset-2 rounded-full bg-amber-400/60 animate-hotspot-ping pointer-events-none" />
                    
                    {/* Glowing Core Pin */}
                    <span className={`relative block w-5 h-5 rounded-full border-2 border-white shadow-xl transition-all duration-300 ${
                      isSelected ? 'bg-amber-400 scale-125' : 'bg-stone-900 group-hover:scale-110'
                    }`}>
                      <span className="absolute inset-1 rounded-full bg-white opacity-80" />
                    </span>
                  </button>

                  {/* Hotspot Floating Popover */}
                  {isSelected && (
                    <div 
                      className="absolute z-30 w-64 -translate-x-1/2 mt-2 p-3 rounded-xl border shadow-2xl backdrop-blur-md animate-hero-fade"
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-medium)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] tracking-widest uppercase font-mono text-amber-500 font-bold">
                          Selected Piece
                        </span>
                        <button 
                          onClick={() => setActiveHotspot(null)}
                          className="opacity-60 hover:opacity-100 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-3 items-center">
                        {hs.product_image && (
                          <img
                            src={hs.product_image}
                            alt={hs.product_name}
                            className="w-14 h-16 object-cover rounded-lg border shrink-0"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-serif font-semibold truncate leading-tight">
                            {hs.label || hs.product_name}
                          </p>
                          <p className="text-xs font-bold mt-1 text-amber-600 dark:text-amber-400">
                            {formatPrice(hs.product_price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1.5 mt-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button
                          onClick={() => {
                            if (onSelectProduct) {
                              onSelectProduct({ id: hs.product_id, name: hs.product_name, price: hs.product_price });
                            }
                          }}
                          className="flex-1 py-1.5 text-[10px] uppercase tracking-wider font-semibold rounded-md text-center transition-colors shadow-xs"
                          style={{
                            backgroundColor: 'var(--btn-primary-bg)',
                            color: 'var(--btn-primary-text)'
                          }}
                        >
                          View Details
                        </button>
                        {onQuickView && (
                          <button
                            onClick={() => onQuickView({ id: hs.product_id, name: hs.product_name, price: hs.product_price })}
                            className="p-1.5 rounded-md border transition-colors hover:opacity-80 flex items-center justify-center"
                            style={{ borderColor: 'var(--border-subtle)' }}
                            title="Quick View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lookbook Narrative Sidebar */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-medium">
                {currentLookbook.season || 'Haute Couture Edit'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                {currentLookbook.title}
              </h3>
              <p className="font-serif italic text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {currentLookbook.subtitle}
              </p>
              <p className="text-xs sm:text-sm mt-4 leading-relaxed font-light" style={{ color: 'var(--text-secondary)' }}>
                {currentLookbook.description}
              </p>
            </div>

            {/* Hotspot Catalog List */}
            <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <h4 className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-primary)' }}>
                Featured in this Look:
              </h4>
              {currentLookbook.hotspots?.map((hs) => (
                <div 
                  key={hs.id}
                  onClick={() => setActiveHotspot(hs)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    activeHotspot?.id === hs.id ? 'scale-[1.02] shadow-md' : 'hover:scale-[1.01]'
                  }`}
                  style={{
                    backgroundColor: activeHotspot?.id === hs.id ? 'var(--card-bg)' : 'transparent',
                    borderColor: activeHotspot?.id === hs.id ? 'var(--border-strong)' : 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-xs font-serif font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {hs.label || hs.product_name}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold shrink-0 ml-2" style={{ color: 'var(--text-secondary)' }}>
                    {formatPrice(hs.product_price)}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
