import React, { useState } from 'react';
import { ShoppingBag, Check, Plus } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';

export function CompleteTheOutfit({ currentProduct, recommendations = [], onSelectProduct }) {
  const { formatPrice } = useSettings();
  const { addToCart, setIsDrawerOpen } = useCart();

  // Selected recommendations ids (default to all selected for convenient bundle)
  const [selectedIds, setSelectedIds] = useState(() => recommendations.map((r) => r.id));
  const [isAddingBundle, setIsAddingBundle] = useState(false);

  if (!recommendations || recommendations.length === 0) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedProducts = recommendations.filter((r) => selectedIds.includes(r.id));
  const bundleAdditionalPrice = selectedProducts.reduce((sum, item) => sum + Number(item.price), 0);
  const totalOutfitPrice = Number(currentProduct.price) + bundleAdditionalPrice;

  const handleAddBundleToBag = () => {
    setIsAddingBundle(true);
    // Add current product
    const currentSize = Array.isArray(currentProduct.sizes) ? currentProduct.sizes[0] : 'M';
    const currentColor = Array.isArray(currentProduct.colors) 
      ? (currentProduct.colors[0]?.name || currentProduct.colors[0]) 
      : 'Standard';
    addToCart(currentProduct, currentSize, currentColor, 1);

    // Add selected bundle pieces
    selectedProducts.forEach((item) => {
      const size = Array.isArray(item.sizes) ? item.sizes[0] : 'M';
      const color = Array.isArray(item.colors) 
        ? (item.colors[0]?.name || item.colors[0]) 
        : 'Standard';
      addToCart(item, size, color, 1);
    });

    setTimeout(() => {
      setIsAddingBundle(false);
      setIsDrawerOpen(true);
    }, 400);
  };

  return (
    <section className="mt-16 pt-12 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="mb-6">
        <span 
          className="text-[10px] tracking-[0.25em] uppercase font-bold px-3 py-1 rounded-full shadow-xs inline-block mb-2"
          style={{
            backgroundColor: 'var(--badge-new-bg)',
            color: 'var(--badge-new-text)'
          }}
        >
          Curated Ensemble
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Complete The Outfit
        </h3>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Atelier stylists have paired this piece with complementary signature garments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Pieces List */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* Main Piece Indicator Card */}
          <div 
            className="p-3 rounded-2xl border flex flex-col justify-between opacity-90"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                <img
                  src={Array.isArray(currentProduct.images) ? currentProduct.images[0] : currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 bg-black/75 text-white rounded-md">
                  This Item
                </span>
              </div>
              <h4 className="text-xs font-serif font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {currentProduct.name}
              </h4>
            </div>
            <p className="text-xs font-bold font-serif mt-2" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(currentProduct.price)}
            </p>
          </div>

          {/* Complementary Recommendations */}
          {recommendations.map((item) => {
            const isChecked = selectedIds.includes(item.id);
            const firstImg = Array.isArray(item.images) ? item.images[0] : item.image;
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${
                  isChecked ? 'ring-2 ring-amber-400 shadow-md' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: isChecked ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }}
              >
                <div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
                    <img
                      src={firstImg}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center border shadow-md transition-all ${
                        isChecked ? 'bg-amber-400 text-stone-950 border-amber-400' : 'bg-white/80 text-transparent border-stone-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                  <h4 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProduct(item);
                    }}
                    className="text-xs font-serif font-semibold line-clamp-1 hover:underline cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-xs font-bold font-serif" style={{ color: 'var(--text-primary)' }}>
                    {formatPrice(item.price)}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500">
                    {isChecked ? 'Included' : 'Add piece'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bundle Summary & Multi-Select Add to Bag */}
        <div 
          className="lg:col-span-4 p-6 rounded-2xl border shadow-lg"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <h4 className="font-serif text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Ensemble Summary
          </h4>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Selected {selectedProducts.length + 1} piece{selectedProducts.length > 0 ? 's' : ''} for a complete coordinated aesthetic.
          </p>

          <div className="my-6 space-y-2 border-t border-b py-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>Base Piece:</span>
              <span className="font-mono">{formatPrice(currentProduct.price)}</span>
            </div>
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="truncate pr-2">{p.name}:</span>
                <span className="font-mono">{formatPrice(p.price)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold pt-2 border-t font-serif" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
              <span>Total Ensemble:</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">{formatPrice(totalOutfitPrice)}</span>
            </div>
          </div>

          <button
            onClick={handleAddBundleToBag}
            disabled={isAddingBundle}
            className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)'
            }}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isAddingBundle ? 'Adding Ensemble...' : 'Add All to Bag'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
