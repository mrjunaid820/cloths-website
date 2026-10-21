import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  ChevronDown, 
  LayoutGrid, 
  Grid3X3, 
  RotateCcw, 
  Loader2 
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../api';

export function ShopPage({ 
  initialCategory, 
  initialFilter, 
  initialSearch, 
  onSelectProduct, 
  onQuickView, 
  onNavigate 
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(initialFilter === 'sale');
  const [featuredOnly, setFeaturedOnly] = useState(initialFilter === 'featured');
  const [newOnly, setNewOnly] = useState(initialFilter === 'new');
  const [sortOption, setSortOption] = useState(initialFilter === 'popular' ? 'popular' : 'newest');
  
  // UI Layout States
  const [gridColumns, setGridColumns] = useState(4); // 3 or 4
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load Categories
  useEffect(() => {
    async function loadCats() {
      try {
        const catData = await api.getCategories();
        setCategories(catData || []);
      } catch (err) {
        console.error('Failed to load categories in shop:', err);
      }
    }
    loadCats();
  }, []);

  // Update when props change
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialFilter === 'sale') setOnSaleOnly(true);
    if (initialFilter === 'new') setNewOnly(true);
    if (initialFilter === 'featured') setFeaturedOnly(true);
    if (initialFilter === 'popular') setSortOption('popular');
    if (initialSearch) setSearchTerm(initialSearch);
  }, [initialCategory, initialFilter, initialSearch]);

  // Load Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : '',
        minPrice,
        maxPrice,
        size: selectedSize,
        color: selectedColor,
        inStock: inStockOnly ? 'true' : '',
        isSale: onSaleOnly ? 'true' : '',
        isFeatured: featuredOnly ? 'true' : '',
        isNew: newOnly ? 'true' : '',
        sort: sortOption,
        limit: 100
      };
      const res = await api.getProducts(params);
      setProducts(res.products || []);
    } catch (err) {
      console.error('Error fetching shop products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [
    searchTerm, 
    selectedCategory, 
    minPrice, 
    maxPrice, 
    selectedSize, 
    selectedColor, 
    inStockOnly, 
    onSaleOnly, 
    featuredOnly, 
    newOnly, 
    sortOption
  ]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSize('');
    setSelectedColor('');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setFeaturedOnly(false);
    setNewOnly(false);
    setSortOption('newest');
  };

  const hasActiveFilters = Boolean(
    searchTerm || 
    (selectedCategory && selectedCategory !== 'all') || 
    minPrice || 
    maxPrice || 
    selectedSize || 
    selectedColor || 
    inStockOnly || 
    onSaleOnly || 
    featuredOnly || 
    newOnly
  );

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38R', '40R', '42R', '44R'];
  const commonColors = [
    { name: 'Black', hex: '#111827' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Ivory', hex: '#fdfbf7' },
    { name: 'Navy', hex: '#1e3a8a' },
    { name: 'Emerald', hex: '#064e3b' },
    { name: 'Burgundy', hex: '#831843' },
    { name: 'Charcoal', hex: '#374151' },
    { name: 'Indigo', hex: '#1e1b4b' }
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Breadcrumb & Header */}
      <div className="mb-8 border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>Home</span> <span className="mx-1">/</span> <strong style={{ color: 'var(--text-primary)' }}>The Catalog</strong>
          {selectedCategory !== 'all' && (
            <> <span className="mx-1">/</span> <strong style={{ color: 'var(--text-primary)' }}>{selectedCategory}</strong></>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {selectedCategory === 'all' ? 'All Collections' : selectedCategory}
            </h1>
            <p className="text-xs sm:text-sm font-light mt-1" style={{ color: 'var(--text-muted)' }}>
              Showing {products.length} bespoke garments crafted with exceptional sartorial artistry.
            </p>
          </div>

          {/* Quick Search in Shop */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU..."
              className="w-full border pl-9 pr-8 py-2 text-xs rounded-xl focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-2.5 hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Filter & Products Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
              <span className="text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--text-primary)' }}>
                Filters
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-[11px] uppercase tracking-wider flex items-center gap-1 font-medium hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Category
            </h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-2 no-scrollbar text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left py-1.5 px-2.5 uppercase tracking-wider transition-all rounded-lg ${
                  selectedCategory === 'all'
                    ? 'font-semibold shadow-xs'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'all' ? 'var(--btn-primary-bg)' : 'transparent',
                  color: selectedCategory === 'all' ? 'var(--btn-primary-text)' : 'var(--text-secondary)'
                }}
              >
                All Garments
              </button>
              {categories.map((c) => {
                const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.id || c.slug}
                    onClick={() => setSelectedCategory(c.name)}
                    className={`w-full text-left py-1.5 px-2.5 uppercase tracking-wider flex items-center justify-between transition-all rounded-lg ${
                      isSelected
                        ? 'font-semibold shadow-xs'
                        : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'transparent',
                      color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-secondary)'
                    }}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] opacity-70">({c.item_count || 0})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Price Range (Rs.)
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min Rs."
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full border p-2 text-xs rounded-lg focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input
                type="number"
                placeholder="Max Rs."
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border p-2 text-xs rounded-lg focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* Size Filter */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Size
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                    className={`px-2.5 py-1 text-[11px] font-semibold border transition-all uppercase tracking-wider rounded-lg ${
                      isSelected ? 'shadow-xs' : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Filter */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              Color Palette
            </h3>
            <div className="flex flex-wrap gap-2">
              {commonColors.map((col) => (
                <button
                  key={col.name}
                  onClick={() => setSelectedColor(selectedColor === col.name ? '' : col.name)}
                  title={col.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    selectedColor === col.name ? 'scale-115 shadow-md ring-2 ring-amber-400' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex, borderColor: 'var(--border-medium)' }}
                />
              ))}
            </div>
          </div>

          {/* Availability & Status Switches */}
          <div className="pt-4 border-t space-y-2.5 text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="uppercase tracking-wider">In Stock Only</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => setOnSaleOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="uppercase tracking-wider text-rose-600 font-medium">On Sale Only</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(e) => setNewOnly(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="uppercase tracking-wider">New Arrivals Only</span>
            </label>
          </div>
        </aside>

        {/* Product Catalog Content */}
        <div className="flex-1">
          
          {/* Controls Bar */}
          <div 
            className="border p-4 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl shadow-xs transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 text-xs px-4 py-2 uppercase tracking-wider font-semibold rounded-xl transition-all shadow-xs"
              style={{
                backgroundColor: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)'
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Garments</span>
            </button>

            {/* Active Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {selectedCategory !== 'all' && (
                <span 
                  className="inline-flex items-center gap-1 px-2.5 py-1 uppercase tracking-wider font-medium border rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3 hover:opacity-80" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </span>
              )}
              {selectedSize && (
                <span 
                  className="inline-flex items-center gap-1 px-2.5 py-1 uppercase tracking-wider font-medium border rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Size: {selectedSize}
                  <button onClick={() => setSelectedSize('')}>
                    <X className="w-3 h-3 hover:opacity-80" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </span>
              )}
              {selectedColor && (
                <span 
                  className="inline-flex items-center gap-1 px-2.5 py-1 uppercase tracking-wider font-medium border rounded-lg"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  Color: {selectedColor}
                  <button onClick={() => setSelectedColor('')}>
                    <X className="w-3 h-3 hover:opacity-80" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </span>
              )}
              {onSaleOnly && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 px-2.5 py-1 uppercase tracking-wider font-semibold border border-rose-200 dark:border-rose-800 rounded-lg">
                  Sale Items
                  <button onClick={() => setOnSaleOnly(false)}>
                    <X className="w-3 h-3 text-rose-500 hover:opacity-80" />
                  </button>
                </span>
              )}
            </div>

            {/* Sorting & Layout Grid */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  Sort:
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border text-xs py-1.5 px-3 uppercase tracking-wider rounded-lg focus:outline-none font-medium"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* Grid Column Selector (Desktop) */}
              <div className="hidden sm:flex items-center border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setGridColumns(3)}
                  className={`p-1.5 transition-colors`}
                  style={{
                    backgroundColor: gridColumns === 3 ? 'var(--btn-primary-bg)' : 'transparent',
                    color: gridColumns === 3 ? 'var(--btn-primary-text)' : 'var(--text-muted)'
                  }}
                  title="3 Columns"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridColumns(4)}
                  className={`p-1.5 transition-colors`}
                  style={{
                    backgroundColor: gridColumns === 4 ? 'var(--btn-primary-bg)' : 'transparent',
                    color: gridColumns === 4 ? 'var(--btn-primary-text)' : 'var(--text-muted)'
                  }}
                  title="4 Columns"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3" style={{ color: 'var(--text-muted)' }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xs uppercase tracking-widest">Loading Sartorial Archives...</span>
            </div>
          ) : products.length === 0 ? (
            <div 
              className="border py-20 px-6 text-center rounded-2xl shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <h3 className="font-serif text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>No garments match your filters</h3>
              <p className="text-xs uppercase tracking-wider max-w-md mx-auto mb-6" style={{ color: 'var(--text-muted)' }}>
                Try widening your price range, clearing selected size/color filters, or browsing all categories.
              </p>
              <button
                onClick={resetAllFilters}
                className="text-xs tracking-widest uppercase font-semibold py-3 px-6 rounded-xl shadow-xs hover:opacity-90"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              gridColumns === 3 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                  onQuickView={onQuickView}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-y-auto p-6" style={{ backgroundColor: 'var(--modal-bg)', color: 'var(--text-primary)' }}>
          <div className="flex items-center justify-between pb-4 border-b mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="font-serif text-lg font-bold tracking-wider uppercase" style={{ color: 'var(--text-primary)' }}>
              Filter Catalog
            </span>
            <button onClick={() => setMobileFilterOpen(false)} className="p-1 hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6 text-xs">
            {/* Category */}
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Category</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`p-2.5 border text-left uppercase tracking-wider rounded-lg transition-all ${
                    selectedCategory === 'all' ? 'font-semibold shadow-xs' : ''
                  }`}
                  style={{
                    backgroundColor: selectedCategory === 'all' ? 'var(--btn-primary-bg)' : 'var(--bg-secondary)',
                    color: selectedCategory === 'all' ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  All
                </button>
                {categories.map((c) => {
                  const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.id || c.slug}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`p-2.5 border text-left uppercase tracking-wider truncate rounded-lg transition-all ${
                        isSelected ? 'font-semibold shadow-xs' : ''
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-secondary)',
                        color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-primary)',
                        borderColor: 'var(--border-subtle)'
                      }}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>Price Range (Rs.)</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Rs."
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border p-2.5 text-xs rounded-lg focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
                <input
                  type="number"
                  placeholder="Max Rs."
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border p-2.5 text-xs rounded-lg focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-6 border-t flex gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => { resetAllFilters(); setMobileFilterOpen(false); }}
                className="flex-1 py-3 border uppercase tracking-widest font-semibold rounded-xl hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 uppercase tracking-widest font-bold rounded-xl shadow-xs hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
