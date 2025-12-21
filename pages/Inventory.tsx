import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpDown, Trash2, Edit, X, ChevronDown, AlertTriangle, Minus, Image as ImageIcon, Wand2, Loader2, Upload } from 'lucide-react';
import { Product } from '../types';
import { storageService, generateId } from '../services/storageService';
import { editProductImage } from '../services/geminiService';
import Modal from '../components/Modal';

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', name: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Advanced Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<'all' | 'critical' | 'normal'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'stockDesc'>('name');

  // AI Image Edit State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    minLevel: 5,
    taxRate: 20,
    imageUrl: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const data = storageService.getProducts();
    setProducts(data);
  };

  // Calculate unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const openNewProductModal = () => {
    setEditingId(null);
    setFormData({ name: '', sku: '', category: '', quantity: 0, price: 0, minLevel: 5, taxRate: 20, imageUrl: '' });
    setAiPrompt('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData({ ...product });
    setAiPrompt('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined) {
      alert("Lütfen ürün adı ve fiyatını giriniz.");
      return;
    }

    if (editingId) {
      // Update existing
      const updatedProduct: Product = {
        ...(formData as Product),
        id: editingId,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        minLevel: Number(formData.minLevel),
        taxRate: Number(formData.taxRate)
      };
      const updatedList = storageService.updateProduct(updatedProduct);
      setProducts(updatedList);
    } else {
      // Create new
      const newProduct: Product = {
        id: generateId('PRD-'),
        name: formData.name || 'İsimsiz Ürün',
        sku: formData.sku || `SKU-${Math.floor(Math.random() * 1000)}`,
        category: formData.category || 'Genel',
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        minLevel: Number(formData.minLevel),
        taxRate: Number(formData.taxRate || 20),
        imageUrl: formData.imageUrl
      };
      const updatedList = storageService.addProduct(newProduct);
      setProducts(updatedList);
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    // Stop event from bubbling up to row click
    e.preventDefault(); 
    e.stopPropagation(); 
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      const updatedList = storageService.deleteProduct(deleteModal.id);
      setProducts(updatedList);
      setDeleteModal({ isOpen: false, id: '', name: '' });
    }
  };

  const handleStockUpdate = (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    const product = products.find(p => p.id === id);
    if (product) {
        const updated = { ...product, quantity: newQuantity };
        const updatedList = storageService.updateProduct(updated);
        setProducts(updatedList);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiImageEdit = async () => {
    if (!formData.imageUrl) {
        alert("Lütfen önce bir kaynak görsel yükleyin.");
        return;
    }
    if (!aiPrompt) {
        alert("Lütfen bir düzenleme komutu girin (örn: Arka planı beyaza boya).");
        return;
    }

    setIsAiLoading(true);
    try {
        const newImage = await editProductImage(formData.imageUrl, aiPrompt);
        if (newImage) {
            setFormData({ ...formData, imageUrl: newImage });
            setAiPrompt('');
        }
    } catch (error) {
        alert("Görsel oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const getStockBarProps = (quantity: number, minLevel: number) => {
    const safeTarget = Math.max(minLevel * 3, 10); 
    const percentage = Math.min(100, (quantity / safeTarget) * 100);
    
    let colorClass = 'bg-emerald-500';
    let label = 'Yeterli';
    let textClass = 'text-emerald-700';

    if (quantity <= minLevel) {
        colorClass = 'bg-red-500';
        label = 'Kritik';
        textClass = 'text-red-700';
    } else if (quantity <= minLevel * 1.5) {
        colorClass = 'bg-amber-400'; 
        label = 'Azalıyor';
        textClass = 'text-amber-700';
    }

    return { width: `${percentage}%`, colorClass, label, textClass };
  };

  // --- Filtering & Sorting Logic ---
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      let matchesStock = true;
      if (stockStatus === 'critical') matchesStock = p.quantity <= p.minLevel;
      if (stockStatus === 'normal') matchesStock = p.quantity > p.minLevel;
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priceAsc': return a.price - b.price;
        case 'priceDesc': return b.price - a.price;
        case 'stockAsc': return a.quantity - b.quantity;
        case 'stockDesc': return b.quantity - a.quantity;
        default: return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Stok Yönetimi</h1>
          <p className="text-gray-500">Ürünlerinizi, stok seviyelerini ve fiyatlandırmayı yönetin.</p>
        </div>
        <button 
          onClick={openNewProductModal}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} />
          Yeni Ürün Ekle
        </button>
      </header>

      {/* Tools... */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
           <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ürün adı veya SKU ara..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
            >
              <Filter size={16} />
              Filtrele
              {showFilters ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
            </button>
            <div className="relative group">
               <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium cursor-pointer">
                  <ArrowUpDown size={16} />
                  <span>Sırala</span>
               </div>
               <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg hidden group-hover:block z-10">
                 <button onClick={() => setSortBy('name')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'name' ? 'font-bold text-blue-600' : ''}`}>İsim (A-Z)</button>
                 <button onClick={() => setSortBy('priceDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'priceDesc' ? 'font-bold text-blue-600' : ''}`}>Fiyat (Önce Yüksek)</button>
                 <button onClick={() => setSortBy('priceAsc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'priceAsc' ? 'font-bold text-blue-600' : ''}`}>Fiyat (Önce Düşük)</button>
                 <button onClick={() => setSortBy('stockDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'stockDesc' ? 'font-bold text-blue-600' : ''}`}>Stok (Önce Çok)</button>
                 <button onClick={() => setSortBy('stockAsc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'stockAsc' ? 'font-bold text-blue-600' : ''}`}>Stok (Önce Az)</button>
               </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-scale-in">
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
               <select 
                 className="w-full text-sm border-gray-300 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                 value={selectedCategory}
                 onChange={(e) => setSelectedCategory(e.target.value)}
               >
                 <option value="all">Tüm Kategoriler</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-500 mb-1">Stok Durumu</label>
               <select 
                 className="w-full text-sm border-gray-300 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                 value={stockStatus}
                 onChange={(e) => setStockStatus(e.target.value as any)}
               >
                 <option value="all">Tümü</option>
                 <option value="critical">Kritik Stok</option>
                 <option value="normal">Yeterli Stok</option>
               </select>
             </div>
             <div className="flex items-end">
               <button 
                  onClick={() => { setSelectedCategory('all'); setStockStatus('all'); }}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
               >
                 Filtreleri Temizle
               </button>
             </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Ürün</th>
                <th className="px-6 py-4">SKU/Kategori</th>
                <th className="px-6 py-4 text-center">Stok Yönetimi</th>
                <th className="px-6 py-4 text-center">KDV</th>
                <th className="px-6 py-4 text-right">Fiyat</th>
                <th className="px-6 py-4">Stok Durumu</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const barProps = getStockBarProps(product.quantity, product.minLevel);
                
                return (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                             {product.imageUrl ? (
                                 <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                             ) : (
                                 <ImageIcon size={18} className="text-gray-400" />
                             )}
                        </div>
                        <div>
                            <div className="font-medium">{product.name}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-500 font-mono text-xs mb-1">{product.sku}</div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(product.id, Number(product.quantity) - 1)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          className={`w-14 text-center text-sm font-bold border rounded py-1 px-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            product.quantity <= product.minLevel ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-700 border-gray-200'
                          }`}
                          value={product.quantity}
                          onChange={(e) => handleStockUpdate(product.id, Number(e.target.value))}
                        />
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(product.id, Number(product.quantity) + 1)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                    </div>
                  </td>
                   <td className="px-6 py-4 text-center text-gray-500">
                    %{product.taxRate || 0}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    ₺{product.price.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 align-middle">
                    <div className="flex flex-col gap-1 min-w-[100px]">
                       <div className="flex justify-between text-xs mb-0.5">
                          <span className={`font-semibold ${barProps.textClass}`}>{barProps.label}</span>
                       </div>
                       <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full transition-all ${barProps.colorClass}`} style={{ width: barProps.width }}></div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(product)} className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full"><Edit size={18} /></button>
                      <button onClick={(e) => handleDeleteClick(e, product.id, product.name)} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}>
        <form onSubmit={handleSaveProduct} className="space-y-4">
          
          {/* AI Image Studio Section */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
             <div className="flex items-center gap-2 mb-3">
                <Wand2 className="text-indigo-600" size={18} />
                <h4 className="font-bold text-indigo-900 text-sm">AI Ürün Görseli Stüdyosu</h4>
             </div>
             
             <div className="flex gap-4 items-start">
                 <div className="w-24 h-24 bg-white border border-indigo-200 rounded-lg flex items-center justify-center overflow-hidden relative group shrink-0">
                     {formData.imageUrl ? (
                         <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                         <div className="text-center p-2">
                            <ImageIcon className="mx-auto text-indigo-300 mb-1" size={24} />
                            <span className="text-[10px] text-indigo-400">Görsel Yok</span>
                         </div>
                     )}
                     <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                         <Upload className="text-white" size={20} />
                         <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </label>
                 </div>
                 
                 <div className="flex-1 space-y-2">
                    <textarea 
                        className="w-full text-xs p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                        rows={2}
                        placeholder="Yapay Zeka Komutu: Örn: 'Arka planı beyaza boya', 'Ürünü ahşap masaya koy' veya 'Daha parlak yap'"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                    />
                    <button 
                        type="button"
                        onClick={handleAiImageEdit}
                        disabled={isAiLoading || !formData.imageUrl}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        {isAiLoading ? 'Oluşturuluyor...' : 'AI ile Düzenle / Oluştur'}
                    </button>
                 </div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                placeholder="Otomatik"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
              <input 
                type="number" 
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.price}
                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
              <input 
                type="number" 
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
               <select 
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 value={formData.taxRate}
                 onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})}
               >
                 <option value="0">%0</option>
                 <option value="1">%1</option>
                 <option value="10">%10</option>
                 <option value="20">%20</option>
               </select>
             </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kritik Stok</label>
              <input 
                type="number" 
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.minLevel}
                onChange={e => setFormData({...formData, minLevel: Number(e.target.value)})}
              />
             </div>
           </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {editingId ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })} title="Ürünü Sil">
         <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100">
               <AlertTriangle className="shrink-0 mt-0.5" />
               <div className="text-sm">
                 <p className="font-bold">Dikkat!</p>
                 <p className="mt-1">"{deleteModal.name}" adlı ürünü silmek üzeresiniz. Bu işlem geri alınamaz.</p>
               </div>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Vazgeç</button>
               <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Evet, Sil</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Inventory;