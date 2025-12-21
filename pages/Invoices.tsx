import React, { useState, useEffect } from 'react';
import { FileText, Printer, PlusCircle, CheckCircle, Clock, AlertCircle, Plus, Trash2, Filter, ChevronDown, ArrowUpDown, Settings, Download, FileCode, Search, Calendar, DollarSign, X, HelpCircle, RefreshCw, CreditCard, Banknote, Scroll, CalendarClock, Building2 } from 'lucide-react';
import { Invoice, InvoiceStatus, Product, InvoiceItem, PaymentMethod, CompanyInfo } from '../types';
import { storageService, generateId } from '../services/storageService';
import { exportInvoiceToXML } from '../services/xmlExportService';
import { LOGO_SVG_STRING } from '../components/Logo';
import Modal from '../components/Modal';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{isOpen: boolean, id: string, currentStatus: InvoiceStatus | null}>({ isOpen: false, id: '', currentStatus: null });
  
  // Advanced Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<PaymentMethod | 'ALL'>('ALL');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc' | 'customerAsc' | 'maturityAsc'>('dateDesc');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>(InvoiceStatus.PENDING);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [maturityDate, setMaturityDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);

  // Item input state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemTaxRate, setItemTaxRate] = useState<number>(20);

  useEffect(() => {
    setInvoices(storageService.getInvoices());
    setProducts(storageService.getProducts());
  }, []);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    
    // Auto-set tax rate based on product default
    const product = products.find(p => p.id === productId);
    if (product) {
      setItemTaxRate(product.taxRate || 20);
    }
  };

  const createInvoiceItem = (productId: string, qty: number, taxRate: number): InvoiceItem | null => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    if (product.quantity < qty) {
      if(!confirm(`Stok yetersiz! "${product.name}" için mevcut stok: ${product.quantity}. Yine de faturaya eklemek istiyor musunuz?`)) {
          return null;
      }
    }

    // Logic: Base Price * Qty, then add Tax on top to get Total
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
    
    const newItem = createInvoiceItem(selectedProductId, itemQuantity, itemTaxRate);
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

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      alert("Lütfen Müşteri / Firma adını giriniz.");
      return;
    }

    let finalItems = [...selectedItems];
    if (selectedProductId) {
       const autoAddedItem = createInvoiceItem(selectedProductId, itemQuantity, itemTaxRate);
       if (autoAddedItem) {
         finalItems.push(autoAddedItem);
       }
    }

    if (finalItems.length === 0) {
      alert("Lütfen faturaya en az bir ürün ekleyiniz.");
      return;
    }

    // Vade Tarihi Kontrolü
    const isMaturityRequired = paymentMethod === PaymentMethod.CHECK || paymentMethod === PaymentMethod.PROMISSORY_NOTE;
    if (isMaturityRequired && !maturityDate) {
        alert("Çek veya Senet seçimi için Vade Tarihi girilmesi zorunludur.");
        return;
    }

    const newInvoice: Invoice = {
      id: generateId('FAT-'),
      customerName,
      date: invoiceDate,
      amount: calculateTotal(finalItems),
      status: invoiceStatus,
      items: finalItems,
      paymentMethod: paymentMethod,
      maturityDate: isMaturityRequired ? maturityDate : undefined
    };

    // Save
    const updatedInvoices = storageService.addInvoice(newInvoice);
    setInvoices(updatedInvoices);
    
    const updatedProducts = storageService.getProducts();
    setProducts(updatedProducts);
    
    setIsModalOpen(false);
    
    // Reset form
    setCustomerName('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceStatus(InvoiceStatus.PENDING);
    setPaymentMethod(PaymentMethod.CASH);
    setMaturityDate('');
    setSelectedItems([]);
    setSelectedProductId('');
    setItemQuantity(1);
    setItemTaxRate(20);
  };

  const handleDeleteInvoice = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(confirm('Faturayı silmek istediğinize emin misiniz?')) {
        const updated = storageService.deleteInvoice(id);
        setInvoices(updated);
    }
  }

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    if (statusModal.id) {
       const updated = storageService.updateInvoiceStatus(statusModal.id, newStatus);
       setInvoices(updated);
       setStatusModal({ isOpen: false, id: '', currentStatus: null });
       
       const updatedProducts = storageService.getProducts();
       setProducts(updatedProducts);
    }
  };

  const handleExportXML = (invoice: Invoice) => {
    const savedInfo = localStorage.getItem('muhasebe_company_info');
    const companyInfo: CompanyInfo = savedInfo ? JSON.parse(savedInfo) : {};

    if (!companyInfo.vkn || !companyInfo.title) {
       alert("XML oluşturmak için önce sol menüdeki 'Ayarlar' bölümünden Firma Bilgilerinizi (VKN ve Unvan) girmelisiniz.");
       return;
    }
    exportInvoiceToXML(invoice, companyInfo);
  };

  const handlePrint = (invoice: Invoice) => {
    const savedInfo = localStorage.getItem('muhasebe_company_info');
    const companyInfo: CompanyInfo = savedInfo ? JSON.parse(savedInfo) : {};
    
    let subTotal = 0;
    let taxTotal = 0;

    invoice.items.forEach(item => {
        const rate = item.taxRate || 0;
        const itemTotal = item.total;
        const baseAmount = itemTotal / (1 + rate / 100);
        const taxAmount = itemTotal - baseAmount;
        subTotal += baseAmount;
        taxTotal += taxAmount;
    });

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fatura - ${invoice.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
              .logo-area { display: flex; align-items: center; gap: 15px; }
              .company-details { text-align: right; font-size: 14px; color: #4b5563; }
              .company-title { font-size: 20px; font-weight: bold; color: #111827; margin: 0 0 5px 0; text-transform: uppercase; }
              
              .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6; }
              .invoice-info div { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
              
              .table-header { display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; border-bottom: 2px solid #374151; padding-bottom: 10px; font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #111827; }
              .item { display: grid; grid-template-columns: 3fr 1fr 1fr 1fr; margin-bottom: 12px; font-size: 14px; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 10px; }
              
              .totals-area { margin-top: 30px; display: flex; flex-direction: column; align-items: flex-end; }
              .total-row { display: flex; justify-content: space-between; width: 250px; font-size: 14px; margin-bottom: 8px; color: #4b5563; }
              .grand-total { font-weight: bold; font-size: 20px; border-top: 2px solid #111827; padding-top: 10px; margin-top: 5px; color: #111827; }
              
              .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo-area">
                ${LOGO_SVG_STRING}
                <div style="font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: -1px;">Mustafa Ticaret</div>
              </div>
              <div class="company-details">
                 <div class="company-title">${companyInfo.title || 'FİRMA ÜNVANI'}</div>
                 ${companyInfo.address ? `${companyInfo.address}<br>` : ''}
                 ${companyInfo.city ? `${companyInfo.city}<br>` : ''}
                 ${companyInfo.vkn ? `VKN/TCKN: ${companyInfo.vkn}` : ''}
              </div>
            </div>
            
            <div class="invoice-info">
              <div>
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Sayın</span>
                <strong style="font-size: 16px;">${invoice.customerName}</strong>
              </div>
              <div style="text-align: right;">
                <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: bold;">Belge No & Tarih</span>
                <strong>${invoice.id}</strong>
                <span>${new Date(invoice.date).toLocaleDateString('tr-TR')}</span>
                ${invoice.maturityDate ? `<br><span style="color:#d97706">Vade: ${new Date(invoice.maturityDate).toLocaleDateString('tr-TR')}</span>` : ''}
              </div>
            </div>

            <div class="table-header">
              <span>Ürün / Hizmet</span>
              <span style="text-align:center">Miktar</span>
              <span style="text-align:center">KDV</span>
              <span style="text-align:right">Tutar (Dahil)</span>
            </div>

            <div>
              ${invoice.items.map(item => `
                <div class="item">
                  <span>${item.productName}</span>
                  <span style="text-align:center">${item.quantity}</span>
                  <span style="text-align:center">%${item.taxRate || 0}</span>
                  <span style="text-align:right">${item.total.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
                </div>
              `).join('')}
            </div>

            <div class="totals-area">
              <div class="total-row">
                 <span>Ara Toplam (KDV Hariç):</span>
                 <span>${subTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
              </div>
              <div class="total-row">
                 <span>Toplam KDV:</span>
                 <span>${taxTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
              </div>
              <div class="total-row grand-total">
                 <span>GENEL TOPLAM:</span>
                 <span>${invoice.amount.toLocaleString('tr-TR', {minimumFractionDigits: 2})} ₺</span>
              </div>
            </div>

            <div class="footer">
              <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
              <p style="margin-top:5px; font-style: italic;">* Bu belge VUK (Vergi Usul Kanunu) uyarınca resmi fatura yerine geçmez. Bilgi fişidir.</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case InvoiceStatus.PENDING: return 'bg-amber-100 text-amber-800 border-amber-200';
      case InvoiceStatus.OVERDUE: return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return <CheckCircle size={14} className="mr-1.5" />;
      case InvoiceStatus.PENDING: return <Clock size={14} className="mr-1.5" />;
      case InvoiceStatus.OVERDUE: return <AlertCircle size={14} className="mr-1.5" />;
    }
  };

  const getStatusText = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID: return 'Ödendi';
      case InvoiceStatus.PENDING: return 'Bekliyor';
      case InvoiceStatus.OVERDUE: return 'Gecikmiş';
    }
  };

  const paymentMethodsConfig = [
    { id: PaymentMethod.CASH, label: 'Nakit', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', hover: 'hover:bg-emerald-100' },
    { id: PaymentMethod.CREDIT_CARD, label: 'Kredi Kartı', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', hover: 'hover:bg-purple-100' },
    { id: PaymentMethod.BANK_TRANSFER, label: 'Havale/EFT', icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', hover: 'hover:bg-blue-100' },
    { id: PaymentMethod.CHECK, label: 'Çek', icon: Scroll, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', hover: 'hover:bg-orange-100' },
    { id: PaymentMethod.PROMISSORY_NOTE, label: 'Senet', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', hover: 'hover:bg-indigo-100' },
  ];

  const getPaymentMethodIcon = (method?: PaymentMethod) => {
    const config = paymentMethodsConfig.find(m => m.id === method);
    if (!config) return <DollarSign size={14} className="text-gray-400" />;
    
    const Icon = config.icon;
    return <Icon size={14} className={config.color} />;
  };

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    const config = paymentMethodsConfig.find(m => m.id === method);
    return config ? config.label : 'Bilinmiyor';
  };

  const calculateDaysRemaining = (maturityDateStr: string) => {
     const maturity = new Date(maturityDateStr);
     const today = new Date();
     // Reset time parts for accurate day diff
     maturity.setHours(0,0,0,0);
     today.setHours(0,0,0,0);
     
     const diffTime = maturity.getTime() - today.getTime();
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
     
     if (diffDays < 0) return { text: `${Math.abs(diffDays)} gün geçti`, color: 'text-red-600 font-bold' };
     if (diffDays === 0) return { text: 'Bugün', color: 'text-orange-600 font-bold' };
     return { text: `${diffDays} gün kaldı`, color: 'text-emerald-600' };
  };

  // --- Filter & Sort Logic ---
  const filteredInvoices = invoices
    .filter(i => {
      const matchesSearch = searchTerm === '' || 
        i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || i.status === filterStatus;
      const matchesPaymentMethod = filterPaymentMethod === 'ALL' || i.paymentMethod === filterPaymentMethod;
      
      let matchesDate = true;
      if (dateRange.start && i.date < dateRange.start) matchesDate = false;
      if (dateRange.end && i.date > dateRange.end) matchesDate = false;
      
      let matchesAmount = true;
      if (amountRange.min && i.amount < Number(amountRange.min)) matchesAmount = false;
      if (amountRange.max && i.amount > Number(amountRange.max)) matchesAmount = false;

      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate && matchesAmount;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dateDesc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'dateAsc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amountDesc': return b.amount - a.amount;
        case 'amountAsc': return a.amount - b.amount;
        case 'customerAsc': return a.customerName.localeCompare(b.customerName);
        case 'maturityAsc': return (a.maturityDate || '9999').localeCompare(b.maturityDate || '9999');
        default: return 0;
      }
    });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setFilterPaymentMethod('ALL');
    setDateRange({ start: '', end: '' });
    setAmountRange({ min: '', max: '' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Faturalar & Fişler</h1>
          <p className="text-gray-500">Kesilen faturaları, fişleri ve ödeme durumlarını takip edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center justify-center p-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            title="E-Fatura Yardım Rehberi"
          >
            <HelpCircle size={18} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <PlusCircle size={18} />
            Yeni Fatura/Fiş Kes
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
               <CheckCircle size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Ödenen Faturalar</p>
               <p className="text-xl font-bold text-gray-900">
                  ₺{invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((a,b) => a+b.amount, 0).toLocaleString('tr-TR')}
               </p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Bekleyen Ödemeler</p>
               <p className="text-xl font-bold text-gray-900">
                 ₺{invoices.filter(i => i.status === InvoiceStatus.PENDING).reduce((a,b) => a+b.amount, 0).toLocaleString('tr-TR')}
               </p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
               <AlertCircle size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Gecikmiş Alacaklar</p>
               <p className="text-xl font-bold text-gray-900">
                 ₺{invoices.filter(i => i.status === InvoiceStatus.OVERDUE).reduce((a,b) => a+b.amount, 0).toLocaleString('tr-TR')}
               </p>
            </div>
         </div>
      </div>

       {/* Advanced Filters Toolbar */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
         <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Fatura No veya Müşteri Adı Ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
               <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
               >
                <Filter size={16} />
                Filtrele
                {showFilters ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
               </button>

               <div className="relative group">
                 <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors">
                    <ArrowUpDown size={16} />
                    Sırala
                 </button>
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-100 rounded-lg shadow-lg hidden group-hover:block z-10">
                     <button onClick={() => setSortBy('dateDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'dateDesc' ? 'font-bold text-indigo-600' : ''}`}>Tarih (Yeni &gt; Eski)</button>
                     <button onClick={() => setSortBy('dateAsc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'dateAsc' ? 'font-bold text-indigo-600' : ''}`}>Tarih (Eski &gt; Yeni)</button>
                     <button onClick={() => setSortBy('amountDesc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'amountDesc' ? 'font-bold text-indigo-600' : ''}`}>Tutar (Yüksek &gt; Düşük)</button>
                     <button onClick={() => setSortBy('amountAsc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'amountAsc' ? 'font-bold text-indigo-600' : ''}`}>Tutar (Düşük &gt; Yüksek)</button>
                     <button onClick={() => setSortBy('maturityAsc')} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === 'maturityAsc' ? 'font-bold text-indigo-600' : ''}`}>Vade Tarihi (Yakın &gt; Uzak)</button>
                  </div>
               </div>
            </div>
         </div>

         {showFilters && (
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-scale-in">
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fatura Durumu</label>
                  <select 
                    className="w-full text-sm border-gray-300 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                  >
                    <option value="ALL">Tümü</option>
                    <option value={InvoiceStatus.PAID}>Ödenenler</option>
                    <option value={InvoiceStatus.PENDING}>Bekleyenler</option>
                    <option value={InvoiceStatus.OVERDUE}>Gecikmişler</option>
                  </select>
               </div>

               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ödeme Yöntemi</label>
                  <select 
                    className="w-full text-sm border-gray-300 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value as any)}
                  >
                    <option value="ALL">Tümü</option>
                    <option value={PaymentMethod.CASH}>Nakit</option>
                    <option value={PaymentMethod.CREDIT_CARD}>Kredi Kartı</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Havale/EFT</option>
                    <option value={PaymentMethod.CHECK}>Çek</option>
                    <option value={PaymentMethod.PROMISSORY_NOTE}>Senet</option>
                  </select>
               </div>
               
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tarih Aralığı</label>
                  <div className="flex gap-2">
                     <div className="relative flex-1">
                        <input 
                           type="date"
                           className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                           value={dateRange.start}
                           onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                           placeholder="Başlangıç"
                        />
                     </div>
                     <span className="self-center text-gray-400">-</span>
                     <div className="relative flex-1">
                        <input 
                           type="date"
                           className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                           value={dateRange.end}
                           onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                           placeholder="Bitiş"
                        />
                     </div>
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tutar Aralığı (TL)</label>
                  <div className="flex gap-2">
                     <input 
                        type="number"
                        placeholder="Min"
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={amountRange.min}
                        onChange={(e) => setAmountRange({...amountRange, min: e.target.value})}
                     />
                     <span className="self-center text-gray-400">-</span>
                     <input 
                        type="number"
                        placeholder="Max"
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={amountRange.max}
                        onChange={(e) => setAmountRange({...amountRange, max: e.target.value})}
                     />
                  </div>
               </div>

               <div className="flex items-end sm:col-span-2 lg:col-span-4 justify-end">
                  <button 
                     onClick={clearFilters}
                     className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={14} />
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
                <th className="px-6 py-4">Fatura/Fiş No</th>
                <th className="px-6 py-4">Müşteri / Firma</th>
                <th className="px-6 py-4">İşlem Tarihi</th>
                <th className="px-6 py-4">Vade Tarihi</th>
                <th className="px-6 py-4 text-center">Ödeme</th>
                <th className="px-6 py-4 text-right">Tutar</th>
                <th className="px-6 py-4 text-center">Durum</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    {invoice.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">{invoice.customerName}</td>
                  <td className="px-6 py-4 text-gray-500">{invoice.date}</td>
                  <td className="px-6 py-4 text-gray-500">
                      {invoice.maturityDate ? (
                        <div>
                           <div className="font-medium text-gray-900 flex items-center gap-1.5">
                              <CalendarClock size={14} className="text-gray-400"/>
                              {invoice.maturityDate}
                           </div>
                           <div className={`text-[10px] mt-0.5 ${calculateDaysRemaining(invoice.maturityDate).color}`}>
                               {calculateDaysRemaining(invoice.maturityDate).text}
                           </div>
                        </div>
                      ) : (
                         <span className="text-gray-300 text-xl">-</span>
                      )}
                  </td>
                  <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500" title={getPaymentMethodLabel(invoice.paymentMethod)}>
                         {getPaymentMethodIcon(invoice.paymentMethod)}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₺{invoice.amount.toLocaleString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                         onClick={() => setStatusModal({ isOpen: true, id: invoice.id, currentStatus: invoice.status })}
                         className="text-gray-400 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded transition-colors" 
                         title="Durumu Değiştir"
                       >
                         <RefreshCw size={18} />
                       </button>
                       <button 
                         onClick={() => handleExportXML(invoice)}
                         className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded transition-colors" 
                         title="E-Fatura XML (UBL) İndir"
                       >
                         <FileCode size={18} />
                       </button>
                       <button 
                         onClick={() => handlePrint(invoice)}
                         className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors" 
                         title="Yazdır / Fiş Çıkar"
                       >
                         <Printer size={18} />
                       </button>
                       <button 
                         onClick={(e) => handleDeleteInvoice(e, invoice.id)}
                         className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors" 
                         title="Sil"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                   <td colSpan={8} className="text-center py-8 text-gray-500">
                     Kayıt bulunamadı.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Creation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Fatura / Fiş Kes">
        <form onSubmit={handleSaveInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri / Cari Adı</label>
            <input 
              type="text" 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Örn: Nakit Müşteri, ABC Ltd..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fatura Tarihi</label>
              <input 
                type="date" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={invoiceStatus}
                onChange={e => setInvoiceStatus(e.target.value as InvoiceStatus)}
              >
                <option value={InvoiceStatus.PAID}>Ödendi (Gelir İşle)</option>
                <option value={InvoiceStatus.PENDING}>Bekliyor</option>
                <option value={InvoiceStatus.OVERDUE}>Gecikmiş</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {paymentMethodsConfig.map((method) => {
                 const isSelected = paymentMethod === method.id;
                 const Icon = method.icon;
                 return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all ${
                          isSelected 
                            ? `${method.bg} border-2 ${method.color.replace('text-', 'border-')}` 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                       <Icon size={20} className={isSelected ? method.color : 'text-gray-400'} />
                       <span className={`text-[10px] font-medium ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{method.label}</span>
                    </button>
                 );
              })}
            </div>
          </div>

          {(paymentMethod === PaymentMethod.CHECK || paymentMethod === PaymentMethod.PROMISSORY_NOTE) && (
              <div className="animate-fade-in p-4 bg-orange-50 border border-orange-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                     <CalendarClock className="text-orange-600" size={20} />
                     <label className="font-bold text-orange-900">Vade Tarihi Belirle</label>
                  </div>
                  <input 
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-orange-900 font-medium"
                      value={maturityDate}
                      onChange={e => setMaturityDate(e.target.value)}
                  />
                  <p className="text-xs text-orange-700 mt-2">
                     * Çek veya Senet için vade tarihi girilmesi zorunludur. Fatura listesinde geri sayım gösterilecektir.
                  </p>
              </div>
          )}
          
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
                     <option key={p.id} value={p.id}>{p.name} (Stok: {p.quantity}) - ₺{p.price}</option>
                   ))}
                 </select>
               </div>
               <div className="w-20">
                 <label className="block text-xs text-gray-500 mb-1">Adet</label>
                 <input 
                   type="number" 
                   min="1"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                   value={itemQuantity}
                   onChange={e => setItemQuantity(Number(e.target.value))}
                 />
               </div>
               <div className="w-24">
                 <label className="block text-xs text-gray-500 mb-1">KDV (%)</label>
                 <select 
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                   value={itemTaxRate}
                   onChange={e => setItemTaxRate(Number(e.target.value))}
                 >
                   <option value={0}>%0</option>
                   <option value={1}>%1</option>
                   <option value={10}>%10</option>
                   <option value={20}>%20</option>
                 </select>
               </div>
               <button 
                 type="button" 
                 onClick={handleAddItem}
                 className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
               >
                 <Plus size={20} />
               </button>
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              * Toplam Tutar, (Birim Fiyat x Adet) üzerine seçilen KDV oranı eklenerek hesaplanır.
            </p>

            {selectedItems.length > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="text-left text-gray-500 border-b border-gray-200">
                       <th className="pb-2">Ürün</th>
                       <th className="pb-2 text-center">Birim</th>
                       <th className="pb-2 text-center">Adet</th>
                       <th className="pb-2 text-center">KDV</th>
                       <th className="pb-2 text-right">Toplam</th>
                       <th className="pb-2"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {selectedItems.map((item, index) => (
                       <tr key={index} className="border-b border-gray-100 last:border-0">
                         <td className="py-2">{item.productName}</td>
                         <td className="py-2 text-center text-gray-500">₺{item.unitPrice.toLocaleString()}</td>
                         <td className="py-2 text-center">{item.quantity}</td>
                         <td className="py-2 text-center text-xs text-gray-500">% {item.taxRate || 0}</td>
                         <td className="py-2 text-right font-medium">₺{item.total.toLocaleString()}</td>
                         <td className="py-2 text-right">
                           <button onClick={() => handleRemoveItem(index)} type="button" className="text-red-500 hover:text-red-700">
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr>
                       <td colSpan={4} className="pt-3 font-bold text-gray-700 text-right">Genel Toplam (KDV Dahil):</td>
                       <td className="pt-3 font-bold text-indigo-700 text-right">₺{calculateTotal(selectedItems).toLocaleString()}</td>
                       <td></td>
                     </tr>
                   </tfoot>
                 </table>
              </div>
            )}
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
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              Onayla ve Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Status Modal */}
      <Modal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ isOpen: false, id: '', currentStatus: null })} title="Fatura Durumu Değiştir">
         <div className="space-y-4">
            <p className="text-sm text-gray-600">
               Bu faturanın durumunu değiştirmek üzeresiniz.
            </p>
            <div className="flex flex-col gap-2">
                <button 
                   onClick={() => handleStatusChange(InvoiceStatus.PAID)} 
                   disabled={statusModal.currentStatus === InvoiceStatus.PAID}
                   className="flex items-center gap-3 w-full p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <CheckCircle className="shrink-0" />
                   <div className="text-left">
                      <div className="font-bold">Ödendi Olarak İşaretle</div>
                      <div className="text-xs mt-0.5">Stoktan düşülür ve kasaya gelir eklenir.</div>
                   </div>
                </button>
                <button 
                   onClick={() => handleStatusChange(InvoiceStatus.PENDING)} 
                   disabled={statusModal.currentStatus === InvoiceStatus.PENDING}
                   className="flex items-center gap-3 w-full p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <Clock className="shrink-0" />
                   <div className="text-left">
                      <div className="font-bold">Bekliyor Olarak İşaretle</div>
                      <div className="text-xs mt-0.5">Eğer ödendiyse; işlem geri alınır, stok iade edilir.</div>
                   </div>
                </button>
                <button 
                   onClick={() => handleStatusChange(InvoiceStatus.OVERDUE)} 
                   disabled={statusModal.currentStatus === InvoiceStatus.OVERDUE}
                   className="flex items-center gap-3 w-full p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <AlertCircle className="shrink-0" />
                   <div className="text-left">
                      <div className="font-bold">Gecikmiş Olarak İşaretle</div>
                      <div className="text-xs mt-0.5">Vadesi geçmiş alacak olarak takip edilir.</div>
                   </div>
                </button>
            </div>
         </div>
      </Modal>
      
      {/* Help / How-To Modal */}
      <Modal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title="E-Fatura & Resmileştirme Süreci">
         <div className="space-y-6 text-gray-700">
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <div className="bg-white p-2 rounded-full h-fit">
                 <FileCode className="text-blue-600" size={24} />
              </div>
              <div>
                 <h4 className="font-bold text-blue-900">Bu uygulama verileri hazırlar</h4>
                 <p className="text-sm text-blue-800 mt-1">
                    Bu sistem "Ön Muhasebe" takibi içindir. Resmi faturayı Maliye Bakanlığı'na iletmek için <strong>Entegratör</strong> veya <strong>GİB Portalı</strong> kullanılır.
                 </p>
              </div>
           </div>

           <div>
              <h4 className="font-bold text-gray-900 mb-3 text-lg">Adım Adım E-Fatura Kesme</h4>
              <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                 <li className="ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-white">
                       <span className="text-xs font-bold text-indigo-600">1</span>
                    </span>
                    <h5 className="font-semibold text-gray-900">Faturayı Oluşturun</h5>
                    <p className="text-sm text-gray-500 mt-1">Bu ekrandaki "Yeni Fatura Kes" butonunu kullanarak cari, ürün ve tutarları girip kaydedin.</p>
                 </li>
                 <li className="ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-white">
                       <span className="text-xs font-bold text-indigo-600">2</span>
                    </span>
                    <h5 className="font-semibold text-gray-900">XML Dosyasını İndirin</h5>
                    <p className="text-sm text-gray-500 mt-1">
                       Oluşturduğunuz faturanın sağındaki <FileCode size={14} className="inline mx-1"/> butonuna basarak 
                       resmi UBL formatındaki <strong>.xml</strong> dosyasını bilgisayarınıza indirin.
                    </p>
                 </li>
                 <li className="ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-white">
                       <span className="text-xs font-bold text-indigo-600">3</span>
                    </span>
                    <h5 className="font-semibold text-gray-900">Portalınıza Yükleyin</h5>
                    <p className="text-sm text-gray-500 mt-1">
                       Çalıştığınız Entegratör firmasının paneline (Logo, Paraşüt, Uyumsoft vb.) veya GİB E-Arşiv Portalına giriş yapın.
                       <strong>"Fatura Yükle"</strong> veya <strong>"Dışarıdan Al (Import)"</strong> seçeneği ile indirdiğiniz dosyayı seçin.
                    </p>
                 </li>
                 <li className="ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 ring-8 ring-white">
                       <span className="text-xs font-bold text-indigo-600">4</span>
                    </span>
                    <h5 className="font-semibold text-gray-900">İmzalayın ve Gönderin</h5>
                    <p className="text-sm text-gray-500 mt-1">
                       Yüklenen faturayı portal üzerinden kontrol edip Mali Mühür veya E-İmza ile onaylayın.
                    </p>
                 </li>
              </ol>
           </div>
           
           <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
              <AlertCircle size={16} className="shrink-0" />
              <span>Unutmayın: Fatura numarasını ve tarihini portalınızdaki sıraya göre güncellemeniz gerekebilir.</span>
           </div>
         </div>
      </Modal>
    </div>
  );
};

export default Invoices;