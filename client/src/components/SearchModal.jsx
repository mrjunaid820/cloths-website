import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useSettings } from '../context/SettingsContext';

export function SearchModal({ isOpen, onClose, onSelectProduct, onNavigate }) {
  const { formatPrice } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.getProducts({ search: searchTerm, limit: 8 });
        setResults(data.products || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const quickTags = [
    'Velvet Sherwani',
    'Silk Gown',
    'Raw Silk Kurta',
    'Merino Wool Suit',
    'Selvedge Jeans',
    'Abayas',
    'Mulberry Hijab'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative min-h-screen flex items-start justify-center pt-16 sm:pt-24 px-4">
        <div 
          className="relative w-full max-w-3xl shadow-2xl border overflow-hidden animate-fade-in rounded-2xl sm:rounded-3xl transition-colors duration-300"
          style={{
            backgroundColor: 'var(--modal-bg)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          {/* Header & Search Bar */}
          <div 
            className="p-4 sm:p-6 border-b flex items-center gap-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, SKU, category, or fabric..."
              className="w-full bg-transparent text-base sm:text-lg focus:outline-none tracking-wide"
              style={{
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="hover:opacity-75 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-xs tracking-wider uppercase border transition-colors hover:opacity-80"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)'
              }}
            >
              ESC
            </button>
          </div>

          {/* Quick Search Suggestions */}
          {!searchTerm && (
            <div 
              className="p-6 border-b"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span 
                className="text-[11px] tracking-widest uppercase font-semibold block mb-3"
                style={{ color: 'var(--text-muted)' }}
              >
                Trending Searches:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="text-xs px-3.5 py-1.5 rounded-full border transition-all uppercase tracking-wider font-medium hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6">
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-xs uppercase tracking-widest">Searching Atelier Archives...</span>
              </div>
            )}

            {!loading && searchTerm && results.length === 0 && (
              <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                <p className="font-serif text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                  No garments found matching "{searchTerm}"
                </p>
                <p className="text-xs tracking-wider uppercase">Try searching with a broader category or style name.</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((product) => {
                  const img = Array.isArray(product.images) ? product.images[0] : product.image;
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        onSelectProduct(product);
                      }}
                      className="group flex gap-4 p-3 border rounded-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)'
                      }}
                    >
                      <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col justify-between overflow-hidden">
                        <div>
                          <span 
                            className="text-[10px] tracking-widest uppercase block truncate font-medium"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {product.category}
                          </span>
                          <h4 
                            className="text-xs sm:text-sm font-medium line-clamp-1 group-hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {product.name}
                          </h4>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>SKU: {product.sku}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {formatPrice(product.price)}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-[11px] line-through" style={{ color: 'var(--text-muted)' }}>
                              {formatPrice(product.original_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer View All Link */}
          {results.length > 0 && (
            <div 
              className="p-4 border-t flex justify-between items-center text-xs tracking-wider uppercase"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Found {results.length} garments</span>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('shop', { search: searchTerm });
                }}
                className="font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--accent-primary)' }}
              >
                <span>View Full Catalog Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
