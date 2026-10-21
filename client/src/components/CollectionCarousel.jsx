import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';

export function CollectionCarousel({ 
  title, 
  subtitle, 
  badge, 
  products = [], 
  onSelectProduct, 
  onQuickView, 
  onNavigate,
  viewAllLink
}) {
  const scrollRef = useRef(null);

  if (!products || products.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Title and Nav Arrows */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          {badge && (
            <span 
              className="inline-block text-[10px] tracking-[0.25em] uppercase font-bold px-3 py-1 rounded-full mb-3 shadow-xs"
              style={{
                backgroundColor: 'var(--badge-new-bg)',
                color: 'var(--badge-new-text)'
              }}
            >
              {badge}
            </span>
          )}
          <h2 
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="text-xs sm:text-sm mt-1.5 max-w-xl font-light"
              style={{ color: 'var(--text-secondary)' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {viewAllLink && (
            <button
              onClick={() => onNavigate(viewAllLink.page, viewAllLink.params)}
              className="text-xs tracking-widest uppercase font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity mr-2"
              style={{ color: 'var(--text-primary)' }}
            >
              View All
            </button>
          )}

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 sm:p-2.5 rounded-full border transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 sm:p-2.5 rounded-full border transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Horizontal Carousel */}
      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label={`${title} product carousel`}
        className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth no-scrollbar pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 focus:outline-none focus:ring-1 focus:ring-stone-400 rounded-xl"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') scroll('left');
          if (e.key === 'ArrowRight') scroll('right');
        }}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="w-[230px] sm:w-[270px] lg:w-[290px] shrink-0"
          >
            <ProductCard
              product={product}
              onSelectProduct={onSelectProduct}
              onQuickView={onQuickView}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
