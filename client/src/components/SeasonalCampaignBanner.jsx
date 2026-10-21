import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export function SeasonalCampaignBanner({ campaign, onNavigate }) {
  if (!campaign || !campaign.is_active) return null;

  return (
    <section className="relative w-full overflow-hidden my-10 sm:my-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="relative rounded-3xl overflow-hidden border shadow-2xl min-h-[380px] sm:min-h-[440px] flex items-center"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{ backgroundImage: `url('${campaign.banner_image}')` }}
          >
            {/* Dark & Accent Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/70 to-transparent" />
          </div>

          {/* Subtle Festive Gold Shimmer Floating Particles */}
          {campaign.particle_effect === 'gold_shimmer' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-gold-shimmer rounded-full bg-gradient-to-r from-amber-200 to-amber-500 blur-[0.5px]"
                  style={{
                    width: `${Math.random() * 6 + 3}px`,
                    height: `${Math.random() * 6 + 3}px`,
                    left: `${Math.random() * 95}%`,
                    top: `${Math.random() * 90}%`,
                    animationDelay: `${i * 0.4}s`,
                    animationDuration: `${Math.random() * 3 + 3}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Campaign Narrative */}
          <div className="relative z-10 max-w-xl p-8 sm:p-12 lg:p-16 text-white">
            {campaign.badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] uppercase tracking-[0.25em] font-semibold rounded-full mb-4 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{campaign.badge}</span>
              </div>
            )}

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              {campaign.title}
            </h2>

            {campaign.subtitle && (
              <p className="text-stone-300 text-xs sm:text-sm lg:text-base mt-4 font-light leading-relaxed">
                {campaign.subtitle}
              </p>
            )}

            {campaign.cta_text && (
              <div className="mt-8">
                <button
                  onClick={() => {
                    if (onNavigate) {
                      const link = campaign.cta_link || 'shop';
                      if (link.startsWith('shop?category=')) {
                        const cat = decodeURIComponent(link.replace('shop?category=', ''));
                        onNavigate('shop', { category: cat });
                      } else {
                        onNavigate(link);
                      }
                    }
                  }}
                  className="inline-flex items-center gap-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-widest px-8 py-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
                >
                  <span>{campaign.cta_text}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
