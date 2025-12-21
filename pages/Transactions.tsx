import React, { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Camera, Loader2, Edit, CreditCard, Banknote, Scroll, CalendarDays, AlertTriangle } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { storageService, generateId } from '../services/storageService';
import { analyzeReceipt } from '../services/geminiService';
import Modal from '../components/Modal';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string, description: string}>({
    isOpen: false,
    id: '',
    description: ''
  });
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: PaymentMethod.CASH,
    maturityDate: ''
  });

  useEffect(() => {
    setTransactions(storageService.getTransactions());
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      description: '',
      amount: 0,
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CASH,
      maturityDate: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: t.date,
      paymentMethod: t.paymentMethod || PaymentMethod.CASH,
      maturityDate: t.maturityDate || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    if (editingId) {
      // Update existing
      const updatedTransaction: Transaction = {
        id: editingId,
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type as TransactionType,
        date: formData.date || new Date().toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod,
        maturityDate: formData.maturityDate
      };
      const updated = storageService.updateTransaction(updatedTransaction);
      setTransactions(updated);
    } else {
      // Create new
      const newTransaction: Transaction = {
        id: generateId('TRX-MANUAL-'),
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type as TransactionType,
        date: formData.date || new Date().toISOString().split('T')[0],
        paymentMethod: formData.paymentMethod,
        maturityDate: formData.maturityDate
      };
      const updated = storageService.addTransaction(newTransaction);
      setTransactions(updated);
    }
    
    setIsModalOpen(false);
    setEditingId(null);
    
    // Reset form
    setFormData({
      description: '',
      amount: 0,
      type: TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: PaymentMethod.CASH,
      maturityDate: ''
    });
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setEditingId(null); // Scanning implies new
    setIsModalOpen(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await analyzeReceipt(base64);
        
        if (result) {
          setFormData({
            description: result.description || 'Fiş Okunamadı',
            amount: result.amount || 0,
            date: result.date || new Date().toISOString().split('T')[0],
            type: TransactionType.EXPENSE,
            paymentMethod: PaymentMethod.CREDIT_CARD, // Default scan assume card/cash
            maturityDate: ''
          });
        } else {
          alert("Fiş analiz edilemedi. Lütfen manuel giriniz.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("Bir hata oluştu.");
    }
  };

  const handleDeleteClick = (t: Transaction) => {
    setDeleteModal({
        isOpen: true,
        id: t.id,
        description: t.description
    });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          const updated = storageService.deleteTransaction(deleteModal.id);
          setTransactions(updated);
          setDeleteModal({ isOpen: false, id: '', description: '' });
      }
  };

  const handleDeleteAll = () => {
    if (confirm('DİKKAT: Tüm gelir ve gider kayıtları kalıcı olarak silinecektir. Bu işlem geri alınamaz.\n\nOnaylıyor musunuz?')) {
      const updated = storageService.deleteAllTransactions();
      setTransactions(updated);
    }
  };

  const getPaymentMethodIcon = (method?: PaymentMethod) => {
    switch (method) {
        case PaymentMethod.CREDIT_CARD: return <CreditCard size={14} className="text-purple-500" />;
        case PaymentMethod.CHECK: return <Scroll size={14} className="text-orange-500" />;
        case PaymentMethod.PROMISSORY_NOTE: return <Scroll size={14} className="text-orange-600" />;
        case PaymentMethod.BANK_TRANSFER: return <Banknote size={14} className="text-blue-500" />;
        default: return <DollarSign size={14} className="text-emerald-500" />;
    }
  };

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
        case PaymentMethod.CREDIT_CARD: return 'Kredi Kartı';
        case PaymentMethod.CHECK: return 'Çek';
        case PaymentMethod.PROMISSORY_NOTE: return 'Senet';
        case PaymentMethod.BANK_TRANSFER: return 'Havale/EFT';
        default: return 'Nakit';
    }
  };

  const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kasa & Gider Yönetimi</h1>
          <p className="text-gray-500">Nakit akışını, kredi kartı, çek ve senet işlemlerini buradan takip edin.</p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <button 
            onClick={handleDeleteAll}
            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors shadow-sm font-medium"
            title="Tüm kayıtları sil"
          >
             <Trash2 size={18} />
             Tümünü Sil
          </button>
          <label className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm font-medium cursor-pointer">
             <Camera size={18} />
             Fiş Tara (AI)
             <input type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} />
          </label>
          <button 
            onClick={openNewModal}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-black transition-colors shadow-sm font-medium"
          >
            <Plus size={18} />
            Manuel Ekle
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Toplam Gelir</p>
               <h3 className="text-2xl font-bold text-emerald-600">₺{income.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
               <TrendingUp size={24} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Toplam Gider</p>
               <h3 className="text-2xl font-bold text-rose-600">₺{expense.toLocaleString('tr-TR')}</h3>
            </div>
            <div className="p-3 bg-rose-50 rounded-full text-rose-600">
               <TrendingDown size={24} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Net Nakit Durumu</p>
               <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₺{balance.toLocaleString('tr-TR')}
               </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600">
               <DollarSign size={24} />
            </div>
         </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Son Hareketler</h3>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="px-6 py-3 font-medium">Tür</th>
                 <th className="px-6 py-3 font-medium">Açıklama</th>
                 <th className="px-6 py-3 font-medium">Ödeme Yöntemi</th>
                 <th className="px-6 py-3 font-medium">Tarih</th>
                 <th className="px-6 py-3 font-medium text-right">Tutar</th>
                 <th className="px-6 py-3 font-medium text-right">İşlem</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {transactions.map((t) => (
                 <tr key={t.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4">
                      {t.type === TransactionType.INCOME ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded text-xs">
                           <ArrowUpCircle size={14} /> Gelir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded text-xs">
                           <ArrowDownCircle size={14} /> Gider
                        </span>
                      )}
                   </td>
                   <td className="px-6 py-4 font-medium text-gray-800">
                      {t.description}
                      {t.maturityDate && (
                          <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                             <CalendarDays size={10} /> Vade: {t.maturityDate}
                          </div>
                      )}
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 text-xs font-medium border border-gray-200 rounded px-2 py-1 w-fit">
                         {getPaymentMethodIcon(t.paymentMethod)}
                         {getPaymentMethodLabel(t.paymentMethod)}
                      </div>
                   </td>
                   <td className="px-6 py-4 text-gray-500">{t.date}</td>
                   <td className={`px-6 py-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {t.type === TransactionType.INCOME ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button onClick={() => handleEdit(t)} className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Düzenle">
                           <Edit size={18} />
                         </button>
                         <button onClick={() => handleDeleteClick(t)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Kaydı Sil">
                           <Trash2 size={18} />
                         </button>
                      </div>
                   </td>
                 </tr>
               ))}
               {transactions.length === 0 && (
                 <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">Henüz bir işlem kaydı yok.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "İşlemi Düzenle" : "Gelir/Gider Ekle"}>
        {isScanning ? (
           <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
              <div>
                <h4 className="font-bold text-gray-900">Fiş Analiz Ediliyor...</h4>
                <p className="text-sm text-gray-500">Yapay zeka fiş üzerindeki tarihi, tutarı ve mağazayı okuyor.</p>
              </div>
           </div>
        ) : (
          <form onSubmit={handleSaveTransaction} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Türü</label>
               <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: TransactionType.INCOME})}
                    className={`py-2 rounded-lg border font-medium transition-colors ${formData.type === TransactionType.INCOME ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    Gelir (Tahsilat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, type: TransactionType.EXPENSE})}
                    className={`py-2 rounded-lg border font-medium transition-colors ${formData.type === TransactionType.EXPENSE ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    Gider (Ödeme)
                  </button>
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
               <input 
                 type="text"
                 required
                 placeholder="Örn: Kira, Elektrik, Satış..."
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                 value={formData.description}
                 onChange={e => setFormData({...formData, description: e.target.value})}
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL)</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
                  value={formData.paymentMethod}
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                >
                   <option value={PaymentMethod.CASH}>Nakit</option>
                   <option value={PaymentMethod.CREDIT_CARD}>Kredi Kartı</option>
                   <option value={PaymentMethod.BANK_TRANSFER}>Havale / EFT</option>
                   <option value={PaymentMethod.CHECK}>Çek</option>
                   <option value={PaymentMethod.PROMISSORY_NOTE}>Senet</option>
                </select>
             </div>

             {(formData.paymentMethod === PaymentMethod.CHECK || formData.paymentMethod === PaymentMethod.PROMISSORY_NOTE) && (
                <div className="animate-fade-in p-3 bg-orange-50 border border-orange-100 rounded-lg">
                    <label className="block text-xs font-bold text-orange-800 mb-1">Vade Tarihi (Çek/Senet)</label>
                    <input 
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        value={formData.maturityDate}
                        onChange={e => setFormData({...formData, maturityDate: e.target.value})}
                    />
                </div>
             )}

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
                 className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${formData.type === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
               >
                 {editingId ? "Güncelle" : "Kaydet"}
               </button>
             </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: '', description: '' })} title="İşlemi Sil">
         <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-100">
               <AlertTriangle className="shrink-0 mt-0.5" />
               <div className="text-sm">
                 <p className="font-bold">Dikkat!</p>
                 <p className="mt-1">"{deleteModal.description}" işlemini silmek üzeresiniz. Bu işlem geri alınamaz.</p>
               </div>
            </div>
            <div className="flex gap-3 pt-2">
               <button onClick={() => setDeleteModal({ isOpen: false, id: '', description: '' })} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Vazgeç</button>
               <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium shadow-sm">Evet, Sil</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default Transactions;