import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Check, 
  Plus, 
  Minus, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminInventory() {
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'low' | 'out'
  const [updatingId, setUpdatingId] = useState(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts({ limit: 150 });
      setProducts(res.products || []);
    } catch (err) {
      showToast('Failed to load inventory: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleStockUpdate = async (product, newStock) => {
    const updatedValue = Math.max(0, Number(newStock));
    setUpdatingId(product.id);
    try {
      await api.updateProduct(product.id, { stock: updatedValue });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: updatedValue } : p));
      showToast(`Updated stock for "${product.name}" to ${updatedValue} units`);
    } catch (err) {
      showToast('Stock update failed: ' + err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) || 
      p.category.toLowerCase().includes(search.toLowerCase());

    if (filterMode === 'low') return matchesSearch && p.stock <= 8 && p.stock > 0;
    if (filterMode === 'out') return matchesSearch && p.stock === 0;
    return matchesSearch;
  });

  const lowCount = products.filter(p => p.stock <= 8 && p.stock > 0).length;
  const outCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Inventory & Stock Reserves
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Monitor SKU levels, variant availability, and execute inline quantity adjustments
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs uppercase tracking-wider font-mono px-3.5 py-2 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Stock status pills & Search */}
      <div className="bg-stone-950/80 border border-stone-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs font-mono uppercase">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 border ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                  : 'bg-stone-900 text-stone-400 border-stone-700 hover:border-stone-500'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setFilterMode('low')}
              className={`px-3 py-1.5 border ${
                filterMode === 'low'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                  : 'bg-stone-900 text-amber-400 border-stone-700 hover:border-stone-500'
              }`}
            >
              Low Stock Warnings ({lowCount})
            </button>
            <button
              onClick={() => setFilterMode('out')}
              className={`px-3 py-1.5 border ${
                filterMode === 'out'
                  ? 'bg-rose-600 text-white border-rose-600 font-bold'
                  : 'bg-stone-900 text-rose-400 border-stone-700 hover:border-stone-500'
              }`}
            >
              Out of Stock ({outCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or Title..."
              className="w-full bg-stone-900 border border-stone-700 pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Auditing inventory records...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No inventory records found.
        </div>
      ) : (
        <div className="bg-stone-950/80 border border-stone-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 bg-stone-900/60">
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Garment Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Variants Available</th>
                <th className="p-3.5 text-right">Unit Price</th>
                <th className="p-3.5 text-center">Current Reserve</th>
                <th className="p-3.5 text-center">Fast Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {filtered.map((p) => {
                const img = Array.isArray(p.images) ? p.images[0] : '';
                const isUpdating = updatingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-amber-400">
                      {p.sku}
                    </td>

                    <td className="p-3.5 flex items-center gap-2.5">
                      <img src={img} alt={p.name} className="w-8 h-10 object-cover bg-stone-900 border border-stone-800" />
                      <span className="font-sans font-bold text-white truncate max-w-[200px]">{p.name}</span>
                    </td>

                    <td className="p-3.5 text-stone-400">
                      {p.category}
                    </td>

                    <td className="p-3.5 text-[11px] text-stone-400">
                      <span>Sizes: {Array.isArray(p.sizes) ? p.sizes.join(', ') : 'Std'}</span>
                    </td>

                    <td className="p-3.5 text-right font-bold text-white">
                      {formatPrice(p.price)}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 text-[10px] uppercase font-bold border ${
                        p.stock === 0
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : p.stock <= 8
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} units`}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center border border-stone-700 bg-stone-900">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStockUpdate(p, p.stock - 1)}
                          className="px-2.5 py-1 text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          disabled={isUpdating}
                          value={p.stock}
                          onChange={(e) => handleStockUpdate(p, e.target.value)}
                          className="w-14 bg-stone-950 text-center font-bold text-white text-xs py-1 focus:outline-none"
                        />
                        <button
                          disabled={isUpdating}
                          onClick={() => handleStockUpdate(p, p.stock + 1)}
                          className="px-2.5 py-1 text-stone-400 hover:text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
