import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Upload, 
  X, 
  Check, 
  Loader2, 
  Filter, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../../api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminProducts() {
  const { formatPrice } = useSettings();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDiscountInput, setBulkDiscountInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = async (status) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkLoading(true);
      await api.bulkUpdateProductStatus(selectedIds, status);
      showToast(`Updated status to "${status}" for ${selectedIds.length} garments`);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      showToast(err.message || 'Bulk status update failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDiscount = async () => {
    if (selectedIds.length === 0) return;
    const disc = parseInt(bulkDiscountInput, 10);
    if (isNaN(disc) || disc < 0 || disc > 90) {
      showToast('Enter valid discount percentage (0 - 90%)', 'error');
      return;
    }
    try {
      setBulkLoading(true);
      await api.bulkUpdateProductDiscount(selectedIds, disc);
      showToast(`Applied ${disc}% discount across ${selectedIds.length} garments`);
      setSelectedIds([]);
      setBulkDiscountInput('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Bulk discount update failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you certain you wish to delete ${selectedIds.length} garments from the atelier database?`)) {
      return;
    }
    try {
      setBulkLoading(true);
      await api.bulkDeleteProducts(selectedIds);
      showToast(`Deleted ${selectedIds.length} products`);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      showToast(err.message || 'Bulk delete failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    original_price: '',
    discount: 0,
    category: '',
    brand: 'Aura Atelier',
    sku: '',
    stock: 20,
    description: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Noir', hex: '#111827' },
      { name: 'Ivory', hex: '#fdfbf7' }
    ],
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000'],
    is_featured: false,
    is_sale: false,
    is_new: true,
  });

  const [newSizeInput, setNewSizeInput] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111827');
  const [imageUrlInput, setImageUrlInput] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({ limit: 100 }),
        api.getCategories()
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes || []);
      if (catRes && catRes.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: catRes[0].name }));
      }
    } catch (err) {
      console.error('Error loading products in admin:', err);
      showToast('Failed to load products: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setCurrentId(null);
    setFormData({
      name: '',
      price: '',
      original_price: '',
      discount: 0,
      category: categories[0]?.name || 'Men',
      brand: 'Aura Atelier',
      sku: 'AA-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      stock: 20,
      description: '',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        { name: 'Noir', hex: '#111827' },
        { name: 'Ivory', hex: '#fdfbf7' }
      ],
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000'],
      is_featured: false,
      is_sale: false,
      is_new: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setModalMode('edit');
    setCurrentId(p.id);
    setFormData({
      name: p.name,
      price: p.price,
      original_price: p.original_price || p.price,
      discount: p.discount || 0,
      category: p.category,
      brand: p.brand || 'Aura Atelier',
      sku: p.sku,
      stock: p.stock,
      description: p.description,
      sizes: Array.isArray(p.sizes) ? p.sizes : ['M'],
      colors: Array.isArray(p.colors) ? p.colors : [{ name: 'Noir', hex: '#111827' }],
      images: Array.isArray(p.images) ? p.images : [p.image || ''],
      is_featured: Boolean(p.is_featured),
      is_sale: Boolean(p.is_sale),
      is_new: Boolean(p.is_new),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you certain you wish to delete "${name}" from the atelier catalog?`)) {
      return;
    }
    try {
      await api.deleteProduct(id);
      showToast(`Product "${name}" deleted`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleDuplicate = async (id, name) => {
    try {
      await api.duplicateProduct(id);
      showToast(`Product duplicated successfully`);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to duplicate product', 'error');
    }
  };

  // Image upload handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }

    setUploadingImage(true);
    try {
      const res = await api.uploadImages(data);
      if (res.urls && res.urls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...res.urls]
        }));
        showToast(`Uploaded ${res.urls.length} images`);
      }
    } catch (err) {
      showToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()]
    }));
    setImageUrlInput('');
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Size helper
  const addSize = () => {
    if (!newSizeInput.trim()) return;
    if (!formData.sizes.includes(newSizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSizeInput.trim().toUpperCase()]
      }));
    }
    setNewSizeInput('');
  };

  const removeSize = (sz) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(s => s !== sz)
    }));
  };

  // Color helper
  const addColor = () => {
    if (!newColorName.trim()) return;
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: newColorName.trim(), hex: newColorHex }]
    }));
    setNewColorName('');
  };

  const removeColor = (idx) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== idx)
    }));
  };

  // Save product
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      showToast('Please specify name, price, and category', 'error');
      return;
    }

    if (formData.images.length === 0) {
      showToast('Please attach at least one image', 'error');
      return;
    }

    setSavingProduct(true);
    try {
      if (modalMode === 'add') {
        await api.createProduct(formData);
        showToast(`Product "${formData.name}" added to catalog`);
      } else {
        await api.updateProduct(currentId, formData);
        showToast(`Product "${formData.name}" updated successfully`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase()) || 
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Product Catalog Management
          </h1>
          <p className="text-xs text-stone-400 font-mono mt-0.5">
            Create, edit, duplicate, and monitor inventory items
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 flex items-center gap-2 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-stone-950/80 border border-stone-800 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            className="w-full bg-stone-900 border border-stone-700 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone-900 border border-stone-700 text-xs text-white py-2 px-3 focus:outline-none focus:border-amber-400 font-mono uppercase"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map(c => (
              <option key={c.id || c.slug} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Controls Bar (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">
              {selectedIds.length} garment{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatus('published')}
              disabled={bulkLoading}
              className="bg-stone-900 hover:bg-stone-800 text-stone-200 px-3 py-1.5 border border-stone-700"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkStatus('draft')}
              disabled={bulkLoading}
              className="bg-stone-900 hover:bg-stone-800 text-stone-200 px-3 py-1.5 border border-stone-700"
            >
              Unpublish Selected
            </button>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="90"
                placeholder="% Disc"
                value={bulkDiscountInput}
                onChange={(e) => setBulkDiscountInput(e.target.value)}
                className="w-16 bg-stone-900 border border-stone-700 p-1.5 text-xs text-white"
              />
              <button
                onClick={handleBulkDiscount}
                disabled={bulkLoading}
                className="bg-stone-900 hover:bg-stone-800 text-stone-200 px-3 py-1.5 border border-stone-700"
              >
                Set Discount
              </button>
            </div>

            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 px-3 py-1.5 border border-rose-800/80"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400 mb-2" />
          <span className="text-xs font-mono uppercase">Retrieving catalog records...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-stone-950/80 border border-stone-800 p-12 text-center text-stone-400 font-mono text-xs">
          No garments found matching criteria.
        </div>
      ) : (
        <div className="bg-stone-950/80 border border-stone-800 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-800 text-[10px] uppercase tracking-wider text-stone-400 bg-stone-900/60">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 bg-stone-950 border-stone-700 text-amber-500 rounded-sm"
                  />
                </th>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5 text-right">Price</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-center">Status Badges</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {filteredProducts.map((p) => {
                const img = Array.isArray(p.images) ? p.images[0] : '';
                const isSelected = selectedIds.includes(p.id);
                return (
                  <tr key={p.id} className={`hover:bg-stone-900/40 transition-colors ${isSelected ? 'bg-amber-500/5' : ''}`}>
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(p.id)}
                        className="w-4 h-4 bg-stone-950 border-stone-700 text-amber-500 rounded-sm"
                      />
                    </td>
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={img}
                        alt={p.name}
                        className="w-10 h-12 object-cover bg-stone-900 border border-stone-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-sans font-bold text-white text-xs block truncate max-w-[220px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">{p.brand}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-stone-300">
                      {p.category}
                    </td>

                    <td className="p-3.5 text-amber-400 font-semibold">
                      {p.sku}
                    </td>

                    <td className="p-3.5 text-right font-bold text-white">
                      {formatPrice(p.price)}
                      {p.original_price && p.original_price > p.price && (
                        <span className="block text-[10px] text-stone-500 line-through">
                          {formatPrice(p.original_price)}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                        p.stock <= 5 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                          : p.stock <= 12 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex flex-wrap justify-center gap-1 text-[9px] uppercase font-semibold">
                        {p.is_featured && <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 border border-amber-500/30">Feat</span>}
                        {p.is_sale && <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 border border-rose-500/30">Sale</span>}
                        {p.is_new && <span className="bg-sky-500/20 text-sky-300 px-1.5 py-0.5 border border-sky-500/30">New</span>}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id, p.name)}
                          className="p-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-400 border border-stone-700"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 p-6 sm:p-8 max-w-3xl w-full shadow-2xl my-8 text-xs font-mono animate-fade-in max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-stone-800 mb-6">
              <h3 className="font-serif text-xl font-bold text-white">
                {modalMode === 'add' ? 'Add New Sartorial Garment' : 'Edit Garment Details'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Product Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block uppercase text-stone-300 mb-1 font-bold">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Imperial Hand-Embroidered Sherwani"
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block uppercase text-stone-300 mb-1 font-bold">Brand Line</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Category, SKU, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase text-stone-300 mb-1 font-bold">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {categories.map(c => (
                      <option key={c.id || c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-stone-300 mb-1 font-bold">SKU Identifier</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block uppercase text-stone-300 mb-1 font-bold">Inventory Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Price, Original Price, Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block uppercase text-stone-300 mb-1 font-bold">Selling Price (PKR / Rs.) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-bold text-sm"
                    placeholder="e.g. 24950"
                  />
                </div>

                <div>
                  <label className="block uppercase text-stone-300 mb-1">Original Price (PKR / Rs.)</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
                    placeholder="e.g. 29500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-stone-300 mb-1">Discount (% OFF)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block uppercase text-stone-300 mb-1 font-bold">Garment Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail fabric origin, embroidery technique, and silhouette specifications..."
                  className="w-full bg-stone-950 border border-stone-700 p-2.5 text-white focus:outline-none focus:border-amber-400 font-sans text-xs"
                />
              </div>

              {/* Image Management Section */}
              <div className="space-y-3 p-4 bg-stone-950 border border-stone-800">
                <div className="flex justify-between items-center">
                  <label className="block uppercase text-stone-300 font-bold">Product Photography Gallery</label>
                  <span className="text-[10px] text-stone-500">First image will be the primary catalogue cover</span>
                </div>

                {/* Upload or Add URL */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="w-full bg-stone-900 border border-stone-700 p-2 text-white text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="bg-stone-800 hover:bg-stone-700 text-white px-3 py-2 uppercase font-bold"
                  >
                    Add URL
                  </button>

                  <label className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 uppercase">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image Previews with Reorder Controls */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group w-24 h-28 border border-stone-700 bg-stone-900 overflow-hidden flex flex-col justify-between">
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      
                      {/* Reorder Left/Right controls */}
                      <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newImgs = [...formData.images];
                              const temp = newImgs[idx - 1];
                              newImgs[idx - 1] = newImgs[idx];
                              newImgs[idx] = temp;
                              setFormData({ ...formData, images: newImgs });
                            }}
                            className="bg-stone-900/90 text-white px-1 py-0.5 text-[9px] hover:bg-stone-800"
                            title="Move Earlier"
                          >
                            ←
                          </button>
                        )}
                        {idx < formData.images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newImgs = [...formData.images];
                              const temp = newImgs[idx + 1];
                              newImgs[idx + 1] = newImgs[idx];
                              newImgs[idx] = temp;
                              setFormData({ ...formData, images: newImgs });
                            }}
                            className="bg-stone-900/90 text-white px-1 py-0.5 text-[9px] hover:bg-stone-800"
                            title="Move Later"
                          >
                            →
                          </button>
                        )}
                      </div>

                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-stone-950 text-[9px] font-bold text-center py-0.5">
                          MAIN (1st)
                        </span>
                      )}
                      {idx === 1 && (
                        <span className="absolute bottom-0 inset-x-0 bg-sky-500 text-stone-950 text-[9px] font-bold text-center py-0.5">
                          HOVER (2nd)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes and Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sizes */}
                <div className="p-3 bg-stone-950 border border-stone-800 space-y-2">
                  <label className="block uppercase text-stone-300 font-bold">Sizes</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSizeInput}
                      onChange={(e) => setNewSizeInput(e.target.value)}
                      placeholder="e.g. XXL or 42R"
                      className="flex-1 bg-stone-900 border border-stone-700 p-1.5 text-xs text-white uppercase"
                    />
                    <button type="button" onClick={addSize} className="bg-stone-800 px-3 py-1 text-white">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formData.sizes.map(s => (
                      <span key={s} className="bg-stone-800 text-stone-200 px-2 py-0.5 text-[11px] flex items-center gap-1">
                        {s}
                        <button type="button" onClick={() => removeSize(s)} className="text-stone-400 hover:text-rose-400">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="p-3 bg-stone-950 border border-stone-800 space-y-2">
                  <label className="block uppercase text-stone-300 font-bold">Colors</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Color Name (e.g. Emerald)"
                      className="flex-1 bg-stone-900 border border-stone-700 p-1.5 text-xs text-white"
                    />
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-7 h-7 bg-transparent border-0 cursor-pointer"
                    />
                    <button type="button" onClick={addColor} className="bg-stone-800 px-3 py-1 text-white">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {formData.colors.map((c, i) => (
                      <span key={i} className="bg-stone-800 text-stone-200 px-2 py-0.5 text-[11px] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                        <button type="button" onClick={() => removeColor(i)} className="text-stone-400 hover:text-rose-400">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-6 pt-2 border-t border-stone-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span className="text-stone-200 uppercase">Featured Runway Piece</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) => setFormData({ ...formData, is_new: e.target.checked })}
                    className="w-4 h-4 text-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span className="text-stone-200 uppercase">New Arrival</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_sale}
                    onChange={(e) => setFormData({ ...formData, is_sale: e.target.checked })}
                    className="w-4 h-4 text-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span className="text-rose-400 uppercase font-bold">Special Sale Item</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published !== false}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 bg-stone-950 border-stone-700"
                  />
                  <span className="text-emerald-400 uppercase font-bold">Published on Storefront</span>
                </label>
              </div>

              {/* Form CTAs */}
              <div className="flex gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-stone-700 text-stone-300 uppercase tracking-wider font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 uppercase tracking-wider font-bold py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Catalog...</span>
                    </>
                  ) : (
                    <span>Save Product</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
