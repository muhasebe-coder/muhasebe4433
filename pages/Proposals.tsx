import React, { useState, useEffect } from 'react';
import { FileSignature, PlusCircle, CheckCircle, Clock, XCircle, FileInput, Trash2, Printer, Plus, Send, Calendar } from 'lucide-react';
import { Proposal, ProposalStatus, Product, InvoiceItem, Invoice, InvoiceStatus, PaymentMethod, CompanyInfo } from '../types';
import { storageService, generateId } from '../services/storageService';
import { LOGO_SVG_STRING } from '../components/Logo';
import Modal from '../components/Modal';

const Proposals: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // --- Helper Functions ---

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

    return {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      taxRate: taxRate,
      total: finalTotal
    };
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

  const calculateTotal = (items: InvoiceItem[]) => {
    return items.reduce((acc, item) => acc + item.total, 0);
  };

  // --- Main Actions ---

  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
        alert("Lütfen bir müşteri/firma adı giriniz.");
        return;
    }
    if (selectedItems.length === 0) {
        alert("Lütfen teklife en az bir ürün ekleyiniz.");
        return;
    }

    const newProposal: Proposal = {
        id: generateId('TEK-'),
        customerName,
        date: proposalDate,
        validUntil: validUntil || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // Default 7 days
        amount: calculateTotal(selectedItems),
        status: proposalStatus,
        items: selectedItems,
        notes
    };

    const updated = storageService.addProposal(newProposal);
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

      if(confirm(`"${proposal.customerName}" için oluşturulan teklifi faturaya dönüştürmek istiyor musunuz? Stoktan düşülecek ve faturalara eklenecektir.`)) {
          
          // 1. Create Invoice
          const newInvoice: Invoice = {
              id: generateId('FAT-AUTO-'),
              customerName: proposal.customerName,
              date: new Date().toISOString().split('T')[0],
              amount: proposal.amount,
              status: InvoiceStatus.PENDING, // Starts as pending payment
              items: proposal.items,
              paymentMethod: PaymentMethod.CASH
          };

          storageService.addInvoice(newInvoice);

          // 2. Update Proposal Status
          const updated = storageService.updateProposalStatus(proposal.id, ProposalStatus.ACCEPTED);
          setProposals(updated);

          alert("Teklif başarıyla faturaya dönüştürüldü! 'Faturalar' sayfasından görüntüleyebilirsiniz.");
      }
  };

  const handleUpdateStatus = (id: string, newStatus: ProposalStatus) => {
      const updated = storageService.updateProposalStatus(id, newStatus);
      setProposals(updated);
  };

  const handlePrint = (proposal: Proposal) => {
     const savedInfo = localStorage.getItem('muhasebe_company_info');
     const companyInfo: CompanyInfo = savedInfo ? JSON.parse(savedInfo) : {};
     
     let subTotal = 0;
     let taxTotal = 0;
     proposal.items.forEach(item => {
         const rate = item.taxRate || 0;
         const baseAmount = item.total / (1 + rate / 100);
         subTotal += baseAmount;
         taxTotal += (item.total - baseAmount);
     });

     const printWindow = window.open('', '', 'width=800,height=600');
     if(printWindow) {
         printWindow.document.write(`
            <html>
             <head>
               <title>Teklif Formu - ${proposal.id}</title>
               <style>
                 body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
                 .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                 .logo { font-size: 24px; font-weight: bold; color: #2563eb; display: flex; align-items: center; gap: 10px; }
                 .company-info { text-align: right; font-size: 14px; color: #666; line-height: 1.5; }
                 .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
                 .doc-title { font-size: 32px; font-weight: 800; color: #1e293b; letter-spacing: -1px; }
                 .client-box { background: #f8fafc; padding: 20px; border-radius: 8px; width: 45%; }
                 .meta-box { text-align: right; }
                 .meta-item { margin-bottom: 5px; font-size: 14px; }
                 .meta-label { color: #64748b; font-weight: 600; margin-right: 10px; }
                 .meta-value { font-weight: bold; }
                 table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                 th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
                 td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                 .totals { width: 250px; margin-left: auto; }
                 .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                 .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 5px; color: #2563eb; }
                 .footer { margin-top: 60px; font-size: 12px; text-align: center; color: #94a3b8; border-top: 1px solid #eee; padding-top: 20px; }
                 .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #eee; }
               </style>
             </head>
             <body>
               <div class="header">
                  <div class="logo">
                    ${LOGO_SVG_STRING}
                    <span>Mustafa Ticaret</span>
                  </div>
                  <div class="company-info">
                     <strong>${companyInfo.title || 'FİRMA ÜNVANI'}</strong><br>
                     ${companyInfo.address || ''}<br>
                     ${companyInfo.city || ''}<br>
                     ${companyInfo.vkn ? `VKN: ${companyInfo.vkn}` : ''}
                  </div>
               </div>

               <div class="title-row">
                  <div class="client-box">
                     <div style="font-size:11px; color:#64748b; text-transform:uppercase; font-weight:bold; margin-bottom:5px;">SAYIN</div>
                     <div style="font-size:18px; font-weight:bold;">${proposal.customerName}</div>
                  </div>
                  <div class="meta-box">
                     <div class="doc-title">TEKLİF FORMU</div>
                     <div class="meta-item"><span class="meta-label">TEKLİF NO:</span><span class="meta-value">${proposal.id}</span></div>
                     <div class="meta-item"><span class="meta-label">TARİH:</span><span class="meta-value">${new Date(proposal.date).toLocaleDateString('tr-TR')}</span></div>
                     <div class="meta-item"><span class="meta-label">GEÇERLİLİK:</span><span class="meta-value" style="color:#ef4444">${new Date(proposal.validUntil).toLocaleDateString('tr-TR')}</span></div>
                  </div>
               </div>

               <table>
                 <thead>
                   <tr>
                     <th>Ürün / Hizmet</th>
                     <th style="text-align:center">Miktar</th>
                     <th style="text-align:right">Birim Fiyat</th>
                     <th style="text-align:center">KDV</th>
                     <th style="text-align:right">Tutar</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${proposal.items.map(item => `
                     <tr>
                       <td>
                         <div style="font-weight:bold;">${item.productName}</div>
                       </td>
                       <td style="text-align:center">${item.quantity}</td>
                       <td style="text-align:right">${item.unitPrice.toLocaleString('tr-TR')} ₺</td>
                       <td style="text-align:center">%${item.taxRate}</td>
                       <td style="text-align:right">${item.total.toLocaleString('tr-TR')} ₺</td>
                     </tr>
                   `).join('')}
                 </tbody>
               </table>

               <div class="totals">
                  <div class="total-row"><span>Ara Toplam:</span><span>${subTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span></div>
                  <div class="total-row"><span>Toplam KDV:</span><span>${taxTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span></div>
                  <div class="total-row grand-total"><span>TOPLAM:</span><span>${proposal.amount.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span></div>
               </div>

               ${proposal.notes ? `
                 <div style="margin-top:30px; padding:15px; background:#fff7ed; border-radius:6px; font-size:13px; border-left:4px solid #f97316;">
                    <strong>Notlar:</strong><br>
                    ${proposal.notes}
                 </div>
               ` : ''}

               <div class="footer">
                 <p>Bu belge bilgilendirme amaçlıdır. Onaylandığında fatura niteliği taşıyabilir.</p>
                 <p>Teklifimiz ${new Date(proposal.validUntil).toLocaleDateString('tr-TR')} tarihine kadar geçerlidir.</p>
               </div>
               <script>window.print();</script>
             </body>
            </html>
         `);
         printWindow.document.close();
     }
  };

  // --- UI Helpers ---

  const getStatusBadge = (status: ProposalStatus) => {
      switch(status) {
          case ProposalStatus.DRAFT: return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 flex items-center gap-1"><Clock size={12}/> TASLAK</span>;
          case ProposalStatus.SENT: return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600 flex items-center gap-1"><Send size={12}/> GÖNDERİLDİ</span>;
          case ProposalStatus.ACCEPTED: return <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> ONAYLANDI</span>;
          case ProposalStatus.REJECTED: return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 flex items-center gap-1"><XCircle size={12}/> REDDEDİLDİ</span>;
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teklif Yönetimi</h1>
          <p className="text-gray-500">Müşterilerinize fiyat teklifi hazırlayın ve takip edin.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <PlusCircle size={18} />
          Yeni Teklif Oluştur
        </button>
      </header>

      {/* Proposals List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                 <tr>
                    <th className="px-6 py-4">Teklif No</th>
                    <th className="px-6 py-4">Müşteri</th>
                    <th className="px-6 py-4">Tarih</th>
                    <th className="px-6 py-4">Geçerlilik</th>
                    <th className="px-6 py-4 text-center">Durum</th>
                    <th className="px-6 py-4 text-right">Tutar</th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {proposals.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          <FileSignature size={16} className="text-indigo-400" />
                          {p.id}
                       </td>
                       <td className="px-6 py-4">{p.customerName}</td>
                       <td className="px-6 py-4 text-gray-500">{p.date}</td>
                       <td className="px-6 py-4 text-gray-500">{p.validUntil}</td>
                       <td className="px-6 py-4 text-center">{getStatusBadge(p.status)}</td>
                       <td className="px-6 py-4 text-right font-bold text-gray-900">₺{p.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {/* Action Buttons */}
                             {p.status !== ProposalStatus.ACCEPTED && (
                                <button 
                                   onClick={() => handleConvertToInvoice(p)}
                                   className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
                                   title="Faturaya Dönüştür"
                                >
                                   <FileInput size={18} />
                                </button>
                             )}
                             
                             <button onClick={() => handlePrint(p)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors" title="Yazdır">
                                <Printer size={18} />
                             </button>

                             {p.status !== ProposalStatus.ACCEPTED && (
                                 <button 
                                    onClick={() => handleUpdateStatus(p.id, ProposalStatus.SENT)} 
                                    className="p-1.5 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                                    title="Gönderildi İşaretle"
                                 >
                                    <Send size={18} />
                                 </button>
                             )}

                             <button onClick={() => handleDeleteProposal(p.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Sil">
                                <Trash2 size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {proposals.length === 0 && (
                    <tr>
                       <td colSpan={7} className="text-center py-12 text-gray-400">
                          <FileSignature size={48} className="mx-auto mb-2 opacity-20" />
                          <p>Henüz kayıtlı bir teklif yok.</p>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      {/* New Proposal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Teklif Oluştur">
         <form onSubmit={handleSaveProposal} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri / Firma</label>
               <input 
                  type="text" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Örn: ABC İnşaat A.Ş."
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teklif Tarihi</label>
                  <input 
                     type="date" required
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={proposalDate}
                     onChange={e => setProposalDate(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Son Geçerlilik</label>
                  <input 
                     type="date"
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={validUntil}
                     onChange={e => setValidUntil(e.target.value)}
                  />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
               <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={proposalStatus}
                  onChange={e => setProposalStatus(e.target.value as ProposalStatus)}
               >
                  <option value={ProposalStatus.DRAFT}>Taslak (Düzenleniyor)</option>
                  <option value={ProposalStatus.SENT}>Gönderildi (Cevap Bekleniyor)</option>
                  <option value={ProposalStatus.ACCEPTED}>Onaylandı</option>
                  <option value={ProposalStatus.REJECTED}>Reddedildi</option>
               </select>
            </div>

            <div className="border-t border-b border-gray-100 py-4 my-4">
               <h4 className="font-medium text-gray-700 mb-3">Ürün/Hizmet Ekle</h4>
               <div className="flex gap-2 items-end">
                  <div className="flex-[2]">
                     <label className="block text-xs text-gray-500 mb-1">Ürün Seç</label>
                     <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        value={selectedProductId}
                        onChange={handleProductSelect}
                     >
                        <option value="">Seçiniz...</option>
                        {products.map(p => (
                           <option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>
                        ))}
                     </select>
                  </div>
                  <div className="w-20">
                     <label className="block text-xs text-gray-500 mb-1">Adet</label>
                     <input 
                        type="number" min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        value={itemQuantity}
                        onChange={e => setItemQuantity(Number(e.target.value))}
                     />
                  </div>
                  <button type="button" onClick={handleAddItem} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                     <Plus size={20} />
                  </button>
               </div>

               {selectedItems.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                     <table className="w-full text-sm">
                        <tbody>
                           {selectedItems.map((item, index) => (
                              <tr key={index} className="border-b border-gray-100 last:border-0">
                                 <td className="py-2">{item.productName} <span className="text-gray-400 text-xs">x{item.quantity}</span></td>
                                 <td className="py-2 text-right font-medium">₺{item.total.toLocaleString()}</td>
                                 <td className="py-2 text-right w-8">
                                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                        <tfoot>
                           <tr>
                              <td className="pt-3 font-bold text-gray-700 text-right">Toplam:</td>
                              <td className="pt-3 font-bold text-indigo-700 text-right">₺{calculateTotal(selectedItems).toLocaleString()}</td>
                              <td></td>
                           </tr>
                        </tfoot>
                     </table>
                  </div>
               )}
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
               <textarea 
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Örn: Nakliye alıcıya aittir."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
               />
            </div>

            <div className="pt-2 flex gap-3">
               <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">İptal</button>
               <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Teklifi Kaydet</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default Proposals;