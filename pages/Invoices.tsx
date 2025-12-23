
import React, { useState, useEffect } from 'react';
import { FileText, Printer, PlusCircle, CheckCircle, Clock, AlertCircle, Plus, Trash2, Edit, X, RefreshCw, FileCode, Search, DollarSign, CreditCard, Banknote, Scroll, CalendarClock, HelpCircle } from 'lucide-react';
import { Invoice, InvoiceStatus, Product, InvoiceItem, PaymentMethod, CompanyInfo } from '../types';
import { storageService, generateId } from '../services/storageService';
import { exportInvoiceToXML } from '../services/xmlExportService';
import { LOGO_SVG_STRING } from '../components/Logo';
import Modal from '../components/Modal';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(InvoiceStatus.PENDING);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  
  // Item input
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemTaxRate, setItemTaxRate] = useState<number>(20);

  useEffect(() => {
    setInvoices(storageService.getInvoices());
    setProducts(storageService.getProducts());
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value; setSelectedProductId(pId);
    const p = products.find(x => x.id === pId);
    if(p) setItemTaxRate(p.taxRate || 20);
  };

  const handleAddItem = () => {
    if(!selectedProductId) return;
    const p = products.find(x => x.id === selectedProductId);
    if(!p) return;
    const base = p.price * itemQuantity;
    const total = base + (base * (itemTaxRate / 100));
    setSelectedItems([...selectedItems, { productId: p.id, productName: p.name, quantity: itemQuantity, unitPrice: p.price, taxRate: itemTaxRate, total }]);
    setSelectedProductId(''); setItemQuantity(1);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setCustomerName(inv.customerName);
    setInvoiceDate(inv.date);
    setInvoiceStatus(inv.status);
    setPaymentMethod(inv.paymentMethod || PaymentMethod.CASH);
    setSelectedItems([...inv.items]);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if(!customerName || selectedItems.length === 0) return;

    const data: Invoice = {
      id: editingId || generateId('FAT-'),
      customerName, date: invoiceDate,
      amount: selectedItems.reduce((a,b)=>a+b.total, 0),
      status: invoiceStatus,
      items: selectedItems,
      paymentMethod
    };

    let updated;
    if(editingId) {
        // Manual override for edit in local cache
        const all = storageService.getInvoices();
        const idx = all.findIndex(x => x.id === editingId);
        if(idx !== -1) {
            all[idx] = data;
            localStorage.setItem('muhasebe_invoices', JSON.stringify(all));
            updated = all;
        } else updated = all;
    } else {
        updated = storageService.addInvoice(data);
    }
    
    setInvoices(updated);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName(''); setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceStatus(InvoiceStatus.PENDING); setSelectedItems([]);
  };

  const getStatusStyle = (s: InvoiceStatus) => {
    if(s === InvoiceStatus.PAID) return 'bg-emerald-100 text-emerald-800';
    if(s === InvoiceStatus.PENDING) return 'bg-amber-100 text-amber-800';
    return 'bg-rose-100 text-rose-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-gray-800">Faturalar</h1><p className="text-gray-500">Gelir ve ödeme takibi yapın.</p></div>
        <button onClick={handleOpenNew} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2"><Plus size={18}/> Yeni Fatura</button>
      </header>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-bold border-b">
            <tr><th className="px-6 py-4">Fatura No</th><th className="px-6 py-4">Müşteri</th><th className="px-6 py-4">Tarih</th><th className="px-6 py-4 text-right">Tutar</th><th className="px-6 py-4 text-center">Durum</th><th className="px-6 py-4 text-right">İşlemler</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-indigo-600">{inv.id}</td>
                <td className="px-6 py-4 font-bold">{inv.customerName}</td>
                <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                <td className="px-6 py-4 text-right font-bold">₺{inv.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(inv.status)}`}>{inv.status}</span></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(inv)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                    <button onClick={() => { if(confirm('Silinsin mi?')) setInvoices(storageService.deleteInvoice(inv.id)); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Faturayı Düzenle" : "Fatura Kes"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-xs font-bold mb-1">Müşteri</label><input type="text" required className="w-full p-2 border rounded" value={customerName} onChange={e=>setCustomerName(e.target.value)}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold mb-1">Tarih</label><input type="date" className="w-full p-2 border rounded" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)}/></div>
            <div><label className="block text-xs font-bold mb-1">Durum</label><select className="w-full p-2 border rounded" value={invoiceStatus} onChange={e=>setInvoiceStatus(e.target.value as InvoiceStatus)}><option value={InvoiceStatus.PENDING}>Bekliyor</option><option value={InvoiceStatus.PAID}>Ödendi</option></select></div>
          </div>
          <div className="border-t pt-4">
            <h4 className="text-sm font-bold mb-2">Ürünler</h4>
            <div className="flex gap-2 mb-2">
              <select className="flex-1 p-2 border rounded text-xs" value={selectedProductId} onChange={handleProductSelect}>
                <option value="">Ürün Seç...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (₺{p.price})</option>)}
              </select>
              <input type="number" className="w-12 p-2 border rounded text-xs" value={itemQuantity} onChange={e=>setItemQuantity(Number(e.target.value))}/>
              <button type="button" onClick={handleAddItem} className="bg-gray-900 text-white p-2 rounded"><Plus size={16}/></button>
            </div>
            {selectedItems.map((it,idx) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-gray-50 mb-1 rounded">
                <span>{it.productName} x {it.quantity} (%{it.taxRate})</span>
                <span className="font-bold">₺{it.total.toLocaleString()}</span>
              </div>
            ))}
            <div className="text-right font-bold text-indigo-600 mt-2">Toplam: ₺{selectedItems.reduce((a,b)=>a+b.total, 0).toLocaleString()}</div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-lg">{editingId ? "Güncelle" : "Faturayı Kaydet"}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
