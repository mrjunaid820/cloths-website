import React, { useState, useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { api } from '../api';

export function CategorySection({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div 
        className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b transition-colors"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <span 
            className="text-xs tracking-[0.25em] uppercase font-semibold block mb-2"
            style={{ color: 'var(--text-muted)' }}
          >
            Curated Universes
          </span>
          <h2 
            className="font-serif text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Explore By Category
          </h2>
        </div>
        <p 
          className="text-xs sm:text-sm max-w-md mt-4 md:mt-0 font-light leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Discover our distinctive collections tailored with master artisan precision across eastern heritage and western contemporary silhouettes.
        </p>
      </div>

      {/* Grid of Categories with Elegantly Rounded Frames */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat, index) => {
          const isFeaturedSpan = index === 0 || index === 1;

          return (
            <div
              key={cat.id || cat.slug}
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer border shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 aspect-[3/4] ${
                isFeaturedSpan ? 'sm:aspect-[3/4] lg:aspect-[4/5]' : ''
              }`}
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--image-bg)'
              }}
            >
              {/* Category Background Image inside Rounded Container */}
              <img
                src={cat.image}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover object-center rounded-2xl group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-stone-950/85 via-stone-950/25 to-transparent group-hover:from-stone-950/95 transition-all duration-300" />

              {/* Content Overlay */}
              <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between z-10">
                <div className="flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-md">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] tracking-[0.2em] uppercase font-medium text-amber-200/90 block mb-1">
                    {cat.item_count ? `${cat.item_count} Designs` : 'Boutique Collection'}
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-wide group-hover:text-amber-100 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-[11px] text-stone-300 font-light mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
