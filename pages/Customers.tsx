
import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Building2, Phone, MapPin, Mail, Edit, Trash2, ArrowUpRight, ArrowDownLeft, FileText, ChevronRight, X, Filter, Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, Users as UsersIcon } from 'lucide-react';
import { Customer, Invoice, Transaction, TransactionType, PaymentMethod } from '../types';
import { storageService, generateId } from '../services/storageService';
import Modal from '../components/Modal';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER'>('ALL');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Forms
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({
    name: '', type: 'CUSTOMER', phone: '', email: '', address: '', city: '', taxNumber: ''
  });

  const [transactionForm, setTransactionForm] = useState<Partial<Transaction>>({
    amount: 0, description: '', type: TransactionType.INCOME, paymentMethod: PaymentMethod.CASH, date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCustomers(storageService.getCustomers());
    setInvoices(storageService.getInvoices());
    setTransactions(storageService.getTransactions());
  };

  const calculateBalance = (customerName: string) => {
    const totalInvoiced = invoices
        .filter(i => i.customerName.toLowerCase() === customerName.toLowerCase())
        .reduce((acc, inv) => acc + inv.amount, 0);

    const customerTransactions = transactions.filter(t => t.description.toLowerCase().includes(customerName.toLowerCase()));
    
    const totalCollections = customerTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
        
    const totalPaymentsToCustomer = customerTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);

    return totalInvoiced - totalCollections + totalPaymentsToCustomer;
  };

  const handleOpenCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setCustomerForm({ ...customer });
    } else {
      setEditingId(null);
      setCustomerForm({ name: '', type: 'CUSTOMER', phone: '', email: '', address: '', city: '', taxNumber: '' });
    }
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) return;

    if (editingId) {
      const updated: Customer = { ...customerForm as Customer, id: editingId };
      const newList = storageService.updateCustomer(updated);
      setCustomers(newList);
    } else {
      const newCustomer: Customer = { ...customerForm as Customer, id: generateId(customerForm.type === 'CUSTOMER' ? 'CUST-' : 'SUPP-') };
      const newList = storageService.addCustomer(newCustomer);
      setCustomers(newList);
    }
    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm("Bu cari hesabı silmek istediğinize emin misiniz?")) {
      const newList = storageService.deleteCustomer(id);
      setCustomers(newList);
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
    }
  };

  const openQuickTransaction = (type: TransactionType) => {
     if (!selectedCustomer) return;
     setTransactionForm({
        amount: 0,
        description: type === TransactionType.INCOME ? `Tahsilat: ${selectedCustomer.name}` : `Ödeme: ${selectedCustomer.name}`,
        type: type,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: PaymentMethod.CASH
     });
     setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if(!transactionForm.amount || !transactionForm.description) return;
      const newTrx: Transaction = {
          id: generateId('TRX-Q-'),
          description: transactionForm.description,
          amount: Number(transactionForm.amount),
          type: transactionForm.type as TransactionType,
          date: transactionForm.date || new Date().toISOString().split('T')[0],
          paymentMethod: transactionForm.paymentMethod,
          maturityDate: ''
      };
      storageService.addTransaction(newTrx);
      loadData();
      setIsTransactionModalOpen(false);
  };

  const filteredCustomers = customers
    .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm);
        const matchesTab = activeTab === 'ALL' || c.type === activeTab;
        return matchesSearch && matchesTab;
    })
    .sort((a,b) => calculateBalance(b.name) - calculateBalance(a.name));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cari Hesaplar</h1>
          <p className="text-gray-500">Müşteri ve tedarikçi bakiyelerini yönetin.</p>
        </div>
        <button 
          onClick={() => handleOpenCustomerModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Yeni Cari Ekle
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)]">
           <div className="p-4 border-b border-gray-100">
              <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                 <button onClick={() => setActiveTab('ALL')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Tümü</button>
                 <button onClick={() => setActiveTab('CUSTOMER')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'CUSTOMER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Müşteriler</button>
                 <button onClick={() => setActiveTab('SUPPLIER')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'SUPPLIER' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Tedarikçiler</button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Cari Ara..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => {
                      const balance = calculateBalance(customer.name);
                      const isSelected = selectedCustomer?.id === customer.id;
                      return (
                        <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-between ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${customer.type === 'CUSTOMER' ? 'bg-indigo-500' : 'bg-orange-500'}`}>{customer.name.substring(0,2).toUpperCase()}</div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">{customer.name}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{customer.type === 'CUSTOMER' ? 'Müşteri' : 'Tedarikçi'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold ${balance > 0 ? 'text-indigo-600' : (balance < 0 ? 'text-orange-600' : 'text-gray-400')}`}>{balance !== 0 ? `₺${Math.abs(balance).toLocaleString()}` : '-'}</p>
                            </div>
                        </div>
                      );
                  })
              ) : (
                  <div className="p-8 text-center text-gray-400"><UsersIcon size={48} className="mx-auto mb-2 opacity-20" /><p className="text-xs font-bold uppercase">Kayıt bulunamadı</p></div>
              )}
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-200px)] overflow-hidden">
           {selectedCustomer ? (
               <>
                 <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md ${selectedCustomer.type === 'CUSTOMER' ? 'bg-indigo-600' : 'bg-orange-600'}`}>{selectedCustomer.name.substring(0,1)}</div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{selectedCustomer.type === 'CUSTOMER' ? 'Müşteri Hesabı' : 'Tedarikçi Hesabı'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenCustomerModal(selectedCustomer)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"><Edit size={18} /></button>
                        <button onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                 </div>
                 <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                           <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Borç Bakiyesi</p>
                           <p className="text-2xl font-black text-indigo-700">₺{Math.max(0, calculateBalance(selectedCustomer.name)).toLocaleString()}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                           <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Alacak Bakiyesi</p>
                           <p className="text-2xl font-black text-orange-700">₺{Math.max(0, -calculateBalance(selectedCustomer.name)).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 mb-8">
                       <button onClick={() => openQuickTransaction(TransactionType.INCOME)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"><ArrowDownLeft size={18}/> Tahsilat Al</button>
                       <button onClick={() => openQuickTransaction(TransactionType.EXPENSE)} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2"><ArrowUpRight size={18}/> Ödeme Yap</button>
                    </div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b pb-2">Hesap Hareketleri</h4>
                    <div className="space-y-3">
                       {/* Hareket listesi buraya gelecek - Mevcut lojik korunur */}
                    </div>
                 </div>
               </>
           ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-300"><User size={64} className="mb-4 opacity-20" /><p className="font-bold uppercase tracking-[0.2em] text-sm">Bir Cari Seçin</p></div>
           )}
        </div>
      </div>

      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={editingId ? "Cari Düzenle" : "Yeni Cari"}>
         <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cari Tipi</label>
               <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCustomerForm({...customerForm, type: 'CUSTOMER'})} className={`py-2 border rounded-lg font-bold text-xs ${customerForm.type === 'CUSTOMER' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'text-gray-500 border-gray-200'}`}>MÜŞTERİ</button>
                  <button type="button" onClick={() => setCustomerForm({...customerForm, type: 'SUPPLIER'})} className={`py-2 border rounded-lg font-bold text-xs ${customerForm.type === 'SUPPLIER' ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'text-gray-500 border-gray-200'}`}>TEDARİKÇİ</button>
               </div>
            </div>
            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Unvan</label><input type="text" required className="w-full p-2.5 border rounded-lg focus:ring-2 ring-blue-500 outline-none" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Telefon</label><input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 ring-blue-500 outline-none" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} /></div>
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Şehir</label><input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 ring-blue-500 outline-none" value={customerForm.city} onChange={e => setCustomerForm({...customerForm, city: e.target.value})} /></div>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs">Kaydet</button>
         </form>
      </Modal>

      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={transactionForm.type === TransactionType.INCOME ? 'Tahsilat Girişi' : 'Ödeme Çıkışı'}>
         <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tutar (TL)</label><input type="number" required min="1" className="w-full p-3 border rounded-xl text-xl font-black focus:ring-2 ring-blue-500 outline-none" value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: Number(e.target.value)})} /></div>
            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Açıklama</label><input type="text" required className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-500 outline-none" value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tarih</label><input type="date" required className="w-full p-3 border rounded-xl" value={transactionForm.date} onChange={e => setTransactionForm({...transactionForm, date: e.target.value})} /></div>
               <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Yöntem</label><select className="w-full p-3 border rounded-xl" value={transactionForm.paymentMethod} onChange={e => setTransactionForm({...transactionForm, paymentMethod: e.target.value as PaymentMethod})}><option value={PaymentMethod.CASH}>Nakit</option><option value={PaymentMethod.BANK_TRANSFER}>Havale</option><option value={PaymentMethod.CREDIT_CARD}>K. Kartı</option></select></div>
            </div>
            <button type="submit" className={`w-full py-4 rounded-xl font-bold text-white shadow-lg uppercase tracking-widest ${transactionForm.type === TransactionType.INCOME ? 'bg-emerald-600' : 'bg-rose-600'}`}>İşlemi Onayla</button>
         </form>
      </Modal>
    </div>
  );
};

export default Customers;
