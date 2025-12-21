import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Building2, Phone, MapPin, Mail, Edit, Trash2, ArrowUpRight, ArrowDownLeft, FileText, ChevronRight, X, Filter, Wallet, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
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

  // --- Logic Helpers ---

  const calculateBalance = (customerName: string) => {
    // 1. Invoices (Only pending amount adds to debt)
    // Note: Positive means "They owe us" (Receivable), unless it's a supplier logic which usually works reverse but for simplicity:
    // We assume Invoices are SALES. So invoice = +Debt for Customer.
    // If we had Purchase Invoices, we would subtract.
    
    // Total Sales (Invoiced)
    const totalInvoiced = invoices
        .filter(i => i.customerName.toLowerCase() === customerName.toLowerCase())
        .reduce((acc, inv) => acc + inv.amount, 0);

    // Total Payments/Collections linked to this name
    // INCOME transactions reduce the debt (Customer paid us)
    // EXPENSE transactions increase the debt (We paid them / Refund?) -> Usually Expense is for Suppliers.
    
    // Let's refine for "Current Account Logic":
    // Balance = (Sales Invoices + Refunds/Expenses) - (Collections/Income)
    
    // Simplify:
    // Sales Invoices creates Debt (+).
    // Income Transactions reduces Debt (-).
    
    // Direct Transactions (Manual entries not linked to invoices)
    const customerTransactions = transactions.filter(t => t.description.toLowerCase().includes(customerName.toLowerCase()));
    
    const totalCollections = customerTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
        
    const totalPaymentsToCustomer = customerTransactions
        .filter(t => t.type === TransactionType.EXPENSE) // e.g. We paid a supplier
        .reduce((acc, t) => acc + t.amount, 0);

    // If Customer: Balance = Invoices - Collections
    // If Supplier: We usually don't have "Sales Invoices" for suppliers in this app structure yet.
    // For Supplier: Balance = (Opening Debt?) - Payments + (Purchase Invoices? - Not implemented yet)
    
    // Implemented Logic:
    // Balance = (Invoices Total) - (Income Total) + (Expense Total - treated as "we gave money")
    // This is a simplified view. 
    // Positive Result = They owe us (Borçlu)
    // Negative Result = We owe them (Alacaklı)
    
    return totalInvoiced - totalCollections + totalPaymentsToCustomer; // Basic approach
  };

  // Summary Calculations
  const totalReceivables = customers
    .filter(c => c.type === 'CUSTOMER')
    .reduce((acc, c) => {
        const bal = calculateBalance(c.name);
        return bal > 0 ? acc + bal : acc;
    }, 0);

  const totalPayables = customers
    .filter(c => c.type === 'SUPPLIER' || c.type === 'CUSTOMER') // Check all in case we owe a customer
    .reduce((acc, c) => {
        const bal = calculateBalance(c.name);
        return bal < 0 ? acc + Math.abs(bal) : acc;
    }, 0);


  const getCustomerHistory = (customerName: string) => {
     const relatedInvoices = invoices.filter(i => i.customerName.toLowerCase() === customerName.toLowerCase());
     const relatedTransactions = transactions.filter(t => t.description.toLowerCase().includes(customerName.toLowerCase()));

     const history = [
        ...relatedInvoices.map(i => ({
            id: i.id,
            date: i.date,
            type: 'FATURA',
            desc: `Satış Faturası: ${i.id}`,
            amount: i.amount,
            isDebt: true, // Increases balance
            status: i.status,
            direction: undefined
        })),
        ...relatedTransactions.map(t => ({
            id: t.id,
            date: t.date,
            type: t.type === TransactionType.INCOME ? 'TAHSİLAT' : 'ÖDEME',
            desc: t.description,
            amount: t.amount,
            isDebt: t.type === TransactionType.EXPENSE, // Expense increases balance (we gave money?), Income decreases it
            // Correction: 
            // Income (Tahsilat) -> Reduces Customer Debt.
            // Expense (Ödeme) -> Reduces Supplier Debt (or creates credit).
            // Visual logic: Income is Green (-Balance), Expense is Red (+Balance for supplier context? No.)
            // Let's stick to: INCOME = Money In, EXPENSE = Money Out.
            direction: t.type, // 'INCOME' | 'EXPENSE'
            status: undefined
        }))
     ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

     return history;
  };

  // --- Handlers ---

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

  // --- Quick Transaction Handlers ---

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

      const updatedTrx = storageService.addTransaction(newTrx);
      setTransactions(updatedTrx);
      setIsTransactionModalOpen(false);
  };

  // --- Filtering & Sorting ---

  const filteredCustomers = customers
    .filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm);
        const matchesTab = activeTab === 'ALL' || c.type === activeTab;
        return matchesSearch && matchesTab;
    })
    // Sort: High balance (Debt) first
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
          <Plus size={18} />
          Yeni Cari Ekle
        </button>
      </header>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Toplam Alacak (Müşteriler)</p>
               <h3 className="text-2xl font-bold text-indigo-600">₺{totalReceivables.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
               <TrendingUp size={24} />
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-gray-500 mb-1">Toplam Borç (Tedarikçiler)</p>
               <h3 className="text-2xl font-bold text-orange-600">₺{totalPayables.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-full text-orange-600">
               <TrendingDown size={24} />
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-280px)]">
           {/* Tabs */}
           <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('ALL')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ALL' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Tümü
              </button>
              <button 
                onClick={() => setActiveTab('CUSTOMER')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'CUSTOMER' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Müşteriler
              </button>
              <button 
                onClick={() => setActiveTab('SUPPLIER')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'SUPPLIER' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Tedarikçiler
              </button>
           </div>
           
           <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="İsim veya Telefon Ara..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(customer => {
                      const balance = calculateBalance(customer.name);
                      const isSelected = selectedCustomer?.id === customer.id;
                      return (
                        <div 
                          key={customer.id} 
                          onClick={() => setSelectedCustomer(customer)}
                          className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex items-center justify-between group ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${customer.type === 'CUSTOMER' ? 'bg-indigo-500' : 'bg-orange-500'}`}>
                                    {customer.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{customer.name}</h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        {customer.type === 'CUSTOMER' ? 'Müşteri' : 'Tedarikçi'}
                                        {customer.city && <span>&bull; {customer.city}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-bold ${balance > 0 ? 'text-indigo-600' : (balance < 0 ? 'text-orange-600' : 'text-gray-400')}`}>
                                    {balance !== 0 ? `₺${Math.abs(balance).toLocaleString()}` : '-'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                   {balance > 0 ? 'Borçlu' : (balance < 0 ? 'Alacaklı' : 'Bakiye Yok')}
                                </p>
                            </div>
                        </div>
                      );
                  })
              ) : (
                  <div className="p-8 text-center text-gray-400">
                      <User size={48} className="mx-auto mb-2 opacity-20" />
                      <p>Kayıt bulunamadı.</p>
                  </div>
              )}
           </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100vh-280px)] overflow-hidden">
           {selectedCustomer ? (
               <>
                 <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                    <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md ${selectedCustomer.type === 'CUSTOMER' ? 'bg-indigo-600' : 'bg-orange-600'}`}>
                             {selectedCustomer.name.substring(0,1)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedCustomer.phone && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                                        <Phone size={12} /> {selectedCustomer.phone}
                                    </span>
                                )}
                                {selectedCustomer.taxNumber && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                                        <Building2 size={12} /> {selectedCustomer.taxNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenCustomerModal(selectedCustomer)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Düzenle">
                            <Edit size={18} />
                        </button>
                        <button onClick={() => handleDeleteCustomer(selectedCustomer.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sil">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={() => setSelectedCustomer(null)} className="p-2 text-gray-400 hover:text-gray-600 lg:hidden">
                            <X size={18} />
                        </button>
                    </div>
                 </div>

                 {/* Balance & Actions Bar */}
                 <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100">
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${calculateBalance(selectedCustomer.name) > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                        <div>
                            <p className={`text-xs font-bold uppercase ${calculateBalance(selectedCustomer.name) > 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                                {calculateBalance(selectedCustomer.name) >= 0 ? 'GÜNCEL BAKİYE (BORÇ)' : 'GÜNCEL BAKİYE (ALACAK)'}
                            </p>
                            <p className={`text-2xl font-bold mt-1 ${calculateBalance(selectedCustomer.name) > 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
                                ₺{Math.abs(calculateBalance(selectedCustomer.name)).toLocaleString()}
                            </p>
                        </div>
                        <Wallet className={`opacity-20 ${calculateBalance(selectedCustomer.name) > 0 ? 'text-indigo-600' : 'text-orange-600'}`} size={40} />
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={() => openQuickTransaction(TransactionType.INCOME)}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors font-medium text-sm p-2"
                        >
                            <ArrowDownLeft size={20} />
                            Tahsilat Ekle
                        </button>
                        <button 
                            onClick={() => openQuickTransaction(TransactionType.EXPENSE)}
                            className="flex-1 h-full flex flex-col items-center justify-center gap-1 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors font-medium text-sm p-2"
                        >
                            <ArrowUpRight size={20} />
                            Ödeme Yap
                        </button>
                    </div>
                 </div>

                 <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Tarih</th>
                                <th className="px-6 py-3 font-medium">İşlem Türü</th>
                                <th className="px-6 py-3 font-medium">Açıklama</th>
                                <th className="px-6 py-3 font-medium text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {getCustomerHistory(selectedCustomer.name).map((item, idx) => {
                                let badgeColor = 'bg-gray-100 text-gray-700';
                                if (item.type === 'FATURA') badgeColor = 'bg-blue-100 text-blue-700';
                                else if (item.direction === TransactionType.INCOME) badgeColor = 'bg-emerald-100 text-emerald-700';
                                else if (item.direction === TransactionType.EXPENSE) badgeColor = 'bg-rose-100 text-rose-700';

                                return (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 text-gray-500">{item.date}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badgeColor}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-700">{item.desc}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${
                                        item.type === 'FATURA' 
                                            ? 'text-indigo-600' // Sales invoice increases debt
                                            : (item.direction === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600')
                                    }`}>
                                        {item.direction === TransactionType.INCOME ? '-' : '+'}₺{item.amount.toLocaleString()}
                                    </td>
                                </tr>
                                )
                            })}
                            {getCustomerHistory(selectedCustomer.name).length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-12 text-gray-400">
                                        <FileText size={48} className="mx-auto mb-2 opacity-20" />
                                        <p>Bu cariye ait hesap hareketi bulunamadı.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
               </>
           ) : (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                   <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <User size={32} className="text-gray-300" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-700">Cari Seçimi Yapın</h3>
                   <p className="text-sm text-gray-500 mt-2 max-w-sm">
                       Hesap detaylarını, geçmiş işlemleri görmek ve hızlı tahsilat/ödeme yapmak için sol listeden bir cari seçin.
                   </p>
               </div>
           )}
        </div>
      </div>

      {/* CUSTOMER MODAL */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={editingId ? "Cari Düzenle" : "Yeni Cari Ekle"}>
         <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Cari Tipi</label>
               <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCustomerForm({...customerForm, type: 'CUSTOMER'})} className={`py-2 border rounded-lg font-medium transition-all ${customerForm.type === 'CUSTOMER' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Müşteri (Alıcı)</button>
                  <button type="button" onClick={() => setCustomerForm({...customerForm, type: 'SUPPLIER'})} className={`py-2 border rounded-lg font-medium transition-all ${customerForm.type === 'SUPPLIER' ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>Tedarikçi (Satıcı)</button>
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Unvan / Ad Soyad</label>
               <input 
                 type="text" required 
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                 value={customerForm.name}
                 onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
               />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                   <input 
                     type="text" 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={customerForm.phone}
                     onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">E-Posta</label>
                   <input 
                     type="email" 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={customerForm.email}
                     onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                   />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                   <input 
                     type="text" 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={customerForm.city}
                     onChange={e => setCustomerForm({...customerForm, city: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">VKN / TCKN</label>
                   <input 
                     type="text" 
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                     value={customerForm.taxNumber}
                     onChange={e => setCustomerForm({...customerForm, taxNumber: e.target.value})}
                   />
                </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Açık Adres</label>
               <textarea 
                 rows={2}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                 value={customerForm.address}
                 onChange={e => setCustomerForm({...customerForm, address: e.target.value})}
               />
            </div>

            <div className="pt-2 flex gap-3">
               <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">İptal</button>
               <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">Kaydet</button>
            </div>
         </form>
      </Modal>

      {/* QUICK TRANSACTION MODAL */}
      <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={transactionForm.type === TransactionType.INCOME ? 'Hızlı Tahsilat Ekle' : 'Hızlı Ödeme Yap'}>
         <form onSubmit={handleSaveTransaction} className="space-y-4">
            <div className={`p-3 rounded-lg border flex items-center gap-3 ${transactionForm.type === TransactionType.INCOME ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                {transactionForm.type === TransactionType.INCOME ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                <div>
                    <p className="text-xs font-bold uppercase">{selectedCustomer?.name}</p>
                    <p className="text-sm">{transactionForm.type === TransactionType.INCOME ? 'Cariye para girişi (Borç düşer)' : 'Cariden para çıkışı (Ödeme yapılır)'}</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (TL)</label>
                <input 
                    type="number" 
                    required min="0" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                    value={transactionForm.amount}
                    onChange={e => setTransactionForm({...transactionForm, amount: Number(e.target.value)})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                    <input 
                        type="date" 
                        required 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={transactionForm.date}
                        onChange={e => setTransactionForm({...transactionForm, date: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                    <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={transactionForm.paymentMethod}
                        onChange={e => setTransactionForm({...transactionForm, paymentMethod: e.target.value as PaymentMethod})}
                    >
                        <option value={PaymentMethod.CASH}>Nakit</option>
                        <option value={PaymentMethod.CREDIT_CARD}>Kredi Kartı</option>
                        <option value={PaymentMethod.BANK_TRANSFER}>Havale/EFT</option>
                        <option value={PaymentMethod.CHECK}>Çek</option>
                        <option value={PaymentMethod.PROMISSORY_NOTE}>Senet</option>
                    </select>
                 </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <input 
                    type="text" 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={transactionForm.description}
                    onChange={e => setTransactionForm({...transactionForm, description: e.target.value})}
                />
            </div>

            <div className="pt-2 flex gap-3">
               <button type="button" onClick={() => setIsTransactionModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">İptal</button>
               <button type="submit" className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${transactionForm.type === TransactionType.INCOME ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>İşlemi Kaydet</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default Customers;