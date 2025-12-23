
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpDown, Trash2, Edit, X, ChevronDown, AlertTriangle, Minus, Image as ImageIcon, Wand2, Loader2, Upload, DollarSign } from 'lucide-react';
import { Product } from '../types';
import { storageService, generateId } from '../services/storageService';
import { editProductImage } from '../services/geminiService';
import Modal from '../components/Modal';

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', quantity: 0, price: 0, minLevel: 5, taxRate: 20, imageUrl: ''
  });

  useEffect(() => { setProducts(storageService.getProducts()); }, []);

  const openNewProductModal = () => {
    setEditingId(null);
    setFormData({ name: '', sku: '', category: 'Genel', quantity: 0, price: 0, minLevel: 5, taxRate: 20, imageUrl: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const data: Product = {
      ...(formData as Product),
      id: editingId || generateId('PRD-'),
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      taxRate: Number(formData.taxRate || 20)
    };
    const updated = editingId ? storageService.updateProduct(data) : storageService.addProduct(data);
    setProducts(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-800">Stok Yönetimi</h1><p className="text-gray-500">Ürün ve envanter takibi.</p></div>
        <button onClick={openNewProductModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm"><Plus size={18}/> Yeni Ürün Ekle</button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-600 font-bold">
            <tr><th className="px-6 py-4">Ürün</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4 text-center">Stok</th><th className="px-6 py-4 text-center">KDV</th><th className="px-6 py-4 text-right">Fiyat</th><th className="px-6 py-4 text-right">İşlemler</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{p.name}</td>
                <td className="px-6 py-4 text-gray-500">{p.category}</td>
                <td className="px-6 py-4 text-center font-bold">{p.quantity}</td>
                <td className="px-6 py-4 text-center text-gray-400">%{p.taxRate || 20}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">₺{p.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditModal(p)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                    <button onClick={() => setDeleteModal({ isOpen: true, id: p.id, name: p.name })} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Ürünü Düzenle" : "Yeni Ürün"}>
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div><label className="block text-xs font-bold mb-1">Ürün Adı</label><input type="text" required className="w-full p-2 border rounded" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1">Kategori</label><input type="text" className="w-full p-2 border rounded" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})}/></div>
            <div><label className="block text-xs font-bold mb-1">KDV Oranı (%)</label><select className="w-full p-2 border rounded" value={formData.taxRate} onChange={e=>setFormData({...formData, taxRate:Number(e.target.value)})}>
              <option value={0}>%0</option><option value={1}>%1</option><option value={10}>%10</option><option value={20}>%20</option>
            </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1">Fiyat (₺)</label><input type="number" required className="w-full p-2 border rounded" value={formData.price} onChange={e=>setFormData({...formData, price:Number(e.target.value)})}/></div>
            <div><label className="block text-xs font-bold mb-1">Stok Miktarı</label><input type="number" required className="w-full p-2 border rounded" value={formData.quantity} onChange={e=>setFormData({...formData, quantity:Number(e.target.value)})}/></div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">{editingId ? "Güncelle" : "Kaydet"}</button>
        </form>
      </Modal>

      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} title="Ürünü Sil">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">"{deleteModal.name}" ürününü silmek istediğinize emin misiniz?</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-2 border rounded text-gray-500">Vazgeç</button>
            <button onClick={() => { setProducts(storageService.deleteProduct(deleteModal.id)); setDeleteModal({ ...deleteModal, isOpen: false }); }} className="flex-1 py-2 bg-red-600 text-white rounded font-bold">Sil</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
