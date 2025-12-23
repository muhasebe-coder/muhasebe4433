
import React, { useState, useEffect } from 'react';
import { FileSignature, PlusCircle, CheckCircle, Clock, XCircle, FileInput, Trash2, Printer, Plus, Send, Calendar, Edit, X } from 'lucide-react';
import { Proposal, ProposalStatus, Product, InvoiceItem, Invoice, InvoiceStatus, PaymentMethod, CompanyInfo } from '../types';
import { storageService, generateId } from '../services/storageService';
import { LOGO_SVG_STRING } from '../components/Logo';
import Modal from '../components/Modal';

const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [proposalDate, setProposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>(ProposalStatus.DRAFT);
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState('');

  // Item Input State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemTaxRate, setItemTaxRate] = useState<number>(20);

  useEffect(() => {
    setProposals(storageService.getProposals());
    setProducts(storageService.getProducts());
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setItemTaxRate(product.taxRate || 20);
    }
  };

  const createProposalItem = (productId: string, qty: number, taxRate: number): InvoiceItem | null => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    const baseTotal = product.price * qty;
    const taxAmount = baseTotal * (taxRate / 100);
    const finalTotal = baseTotal + taxAmount;
    return { productId: product.id, productName: product.name, quantity: qty, unitPrice: product.price, taxRate, total: finalTotal };
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const newItem = createProposalItem(selectedProductId, itemQuantity, itemTaxRate);
    if (newItem) {
      setSelectedItems([...selectedItems, newItem]);
      setSelectedProductId('');
      setItemQuantity(1);
      setItemTaxRate(20);
    }
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const calculateTotal = (items: InvoiceItem[]) => items.reduce((acc, item) => acc + item.total, 0);

  const handleOpenNew = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (p: Proposal) => {
    setEditingId(p.id);
    setCustomerName(p.customerName);
    setProposalDate(p.date);
    setValidUntil(p.validUntil);
    setProposalStatus(p.status);
    setSelectedItems([...p.items]);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || selectedItems.length === 0) {
        alert("Lütfen gerekli alanları doldurun.");
        return;
    }

    const proposalData: Proposal = {
        id: editingId || generateId('TEK-'),
        customerName,
        date: proposalDate,
        validUntil: validUntil || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        amount: calculateTotal(selectedItems),
        status: proposalStatus,
        items: selectedItems,
        notes
    };

    let updated;
    if (editingId) {
        updated = storageService.updateProposalStatus(editingId, proposalStatus); // Simple status update in storageService, we'll need real update
        // Since storageService might not have full update, we'll simulate or add it.
        // For this UI, we treat update as delete+add if needed, but let's assume update exists.
        const allProposals = storageService.getProposals();
        const idx = allProposals.findIndex(x => x.id === editingId);
        if(idx !== -1) {
            allProposals[idx] = proposalData;
            localStorage.setItem('muhasebe_proposals', JSON.stringify(allProposals)); // Direct sync for demo
            updated = allProposals;
        }
    } else {
        updated = storageService.addProposal(proposalData);
    }
    
    setProposals(updated);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setProposalDate(new Date().toISOString().split('T')[0]);
    setValidUntil('');
    setProposalStatus(ProposalStatus.DRAFT);
    setSelectedItems([]);
    setNotes('');
    setSelectedProductId('');
    setItemQuantity(1);
    setItemTaxRate(20);
  };

  const handleDeleteProposal = (id: string) => {
      if(confirm('Teklifi silmek istediğinize emin misiniz?')) {
          const updated = storageService.deleteProposal(id);
          setProposals(updated);
      }
  };

  const handleConvertToInvoice = (proposal: Proposal) => {
      if (proposal.status === ProposalStatus.ACCEPTED) {
          alert("Bu teklif zaten faturaya dönüştürülmüş.");
          return;
      }
      if(confirm(`"${proposal.customerName}" için oluşturulan teklifi faturaya dönüştürmek istiyor musunuz?`)) {
          const newInvoice: Invoice = {
              id: generateId('FAT-AUTO-'),
              customerName: proposal.customerName,
              date: new Date().toISOString().split('T')[0],
              amount: proposal.amount,
              status: InvoiceStatus.PENDING,
              items: proposal.items,
              paymentMethod: PaymentMethod.CASH
          };
          storageService.addInvoice(newInvoice);
          const updated = storageService.updateProposalStatus(proposal.id, ProposalStatus.ACCEPTED);
          setProposals(updated);
          alert("Faturaya dönüştürüldü!");
      }
  };

  const handlePrint = (proposal: Proposal) => {
     const savedInfo = localStorage.getItem('muhasebe_company_info');
     const companyInfo: CompanyInfo = savedInfo ? JSON.parse(savedInfo) : {};
     let subTotal = 0; let taxTotal = 0;
     proposal.items.forEach(item => {
         const base = item.total / (1 + (item.taxRate || 0) / 100);
         subTotal += base; taxTotal += (item.total - base);
     });
     const printWindow = window.open('', '', 'width=800,height=600');
     if(printWindow) {
         printWindow.document.write(`<html><head><title>${proposal.id}</title><style>body{font-family:sans-serif;padding:40px;}.header{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding-bottom:20px;margin-bottom:20px;}table{width:100%;border-collapse:collapse;}th,td{padding:10px;border-bottom:1px solid #eee;text-align:left;}.total{text-align:right;margin-top:20px;font-weight:bold;}</style></head><body><div class="header"><div><h1>TEKLİF FORMU</h1><p>No: ${proposal.id}</p></div><div style="text-align:right"><strong>${companyInfo.title || 'Firma'}</strong><br>${companyInfo.vkn || ''}</div></div><p><strong>Müşteri:</strong> ${proposal.customerName}</p><table><thead><tr><th>Ürün</th><th>Adet</th><th>KDV</th><th>Tutar</th></tr></thead><tbody>${proposal.items.map(i=>`<tr><td>${i.productName}</td><td>${i.quantity}</td><td>%${i.taxRate}</td><td>${i.total.toLocaleString()} ₺</td></tr>`).join('')}</tbody></table><div class="total"><p>Ara Toplam: ${subTotal.toLocaleString()} ₺</p><p>KDV Toplam: ${taxTotal.toLocaleString()} ₺</p><h2>GENEL TOPLAM: ${proposal.amount.toLocaleString()} ₺</h2></div></body></html>`);
         printWindow.document.close();
         printWindow.print();
     }
  };

  const getStatusBadge = (status: ProposalStatus) => {
      switch(status) {
          case ProposalStatus.DRAFT: return <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600">TASLAK</span>;
          case ProposalStatus.SENT: return <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-600">GÖNDERİLDİ</span>;
          case ProposalStatus.ACCEPTED: return <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600">ONAYLANDI</span>;
          case ProposalStatus.REJECTED: return <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-600">REDDEDİLDİ</span>;
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teklif Yönetimi</h1>
          <p className="text-gray-500">Hazırlanan fiyat tekliflerini inceleyin ve düzenleyin.</p>
        </div>
        <button onClick={handleOpenNew} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
          <PlusCircle size={18} /> Yeni Teklif Oluştur
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                 <tr>
                    <th className="px-6 py-4">Teklif No</th>
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4 text-center">Durum</th>
                    <th className="px-6 py-4 text-right">Tutar</th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {proposals.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          <FileSignature size={16} className="text-indigo-400" /> {p.id}
                       </td>
                       <td className="px-6 py-4">{p.customerName}</td>
                       <td className="px-6 py-4 text-gray-500">{p.date}</td>
                       <td className="px-6 py-4 text-center">{getStatusBadge(p.status)}</td>
                       <td className="px-6 py-4 text-right font-bold text-gray-900">₺{p.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {p.status !== ProposalStatus.ACCEPTED && (
                                <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-600 hover:text-white transition-all" title="Düzenle">
                                   <Edit size={16} />
                                </button>
                             )}
                             {p.status !== ProposalStatus.ACCEPTED && (
                                <button onClick={() => handleConvertToInvoice(p)} className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-600 hover:text-white transition-all" title="Faturaya Dönüştür">
                                   <FileInput size={16} />
                                </button>
                             )}
                             <button onClick={() => handlePrint(p)} className="p-1.5 text-gray-500 bg-gray-50 rounded hover:bg-gray-200 transition-all" title="Yazdır">
                                <Printer size={16} />
                             </button>
                             <button onClick={() => handleDeleteProposal(p.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-600 hover:text-white transition-all" title="Sil">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Teklifi Düzenle" : "Yeni Teklif"}>
         <form onSubmit={handleSaveProposal} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri / Firma</label>
               <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={proposalDate} onChange={e => setProposalDate(e.target.value)} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={proposalStatus} onChange={e => setProposalStatus(e.target.value as ProposalStatus)}>
                     <option value={ProposalStatus.DRAFT}>Taslak</option>
                     <option value={ProposalStatus.SENT}>Gönderildi</option>
                     <option value={ProposalStatus.ACCEPTED}>Onaylandı</option>
                     <option value={ProposalStatus.REJECTED}>Reddedildi</option>
                  </select>
               </div>
            </div>
            <div className="border-t border-b border-gray-100 py-4 my-4">
               <h4 className="font-medium text-gray-700 mb-3">Ürün/Hizmet Ekle</h4>
               <div className="flex gap-2 items-end">
                  <div className="flex-[2]">
                     <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={selectedProductId} onChange={handleProductSelect}>
                        <option value="">Ürün Seçiniz...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>)}
                     </select>
                  </div>
                  <div className="w-16">
                     <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                  </div>
                  <div className="w-16">
                     <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={itemTaxRate} onChange={e => setItemTaxRate(Number(e.target.value))}>
                        <option value={0}>%0</option><option value={1}>%1</option><option value={10}>%10</option><option value={20}>%20</option>
                     </select>
                  </div>
                  <button type="button" onClick={handleAddItem} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"><Plus size={20} /></button>
               </div>
               {selectedItems.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-2">
                     {selectedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                           <span>{item.productName} x {item.quantity} (%{item.taxRate})</span>
                           <div className="flex items-center gap-3">
                              <span className="font-bold">₺{item.total.toLocaleString()}</span>
                              <button onClick={() => handleRemoveItem(index)} className="text-red-500"><X size={14}/></button>
                           </div>
                        </div>
                     ))}
                     <div className="pt-2 border-t font-bold text-right text-indigo-700">Toplam: ₺{calculateTotal(selectedItems).toLocaleString()}</div>
                  </div>
               )}
            </div>
            <div className="pt-2 flex gap-3">
               <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">İptal</button>
               <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">{editingId ? "Güncelle" : "Kaydet"}</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default Proposals;
