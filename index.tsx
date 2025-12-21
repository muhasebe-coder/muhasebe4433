
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Package, FileText, Settings, Wallet, Bot, PieChart, Users, 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowRight, Plus, 
  Trash2, Edit, X, ChevronDown, Minus, Image as ImageIcon, Search, 
  CheckCircle2, Printer, LogOut, Clock, AlertCircle, CalendarDays, Wallet2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';

/** --- TIPLER --- **/

enum TransactionType { INCOME = 'INCOME', EXPENSE = 'EXPENSE' }
enum InvoiceStatus { PAID = 'PAID', PENDING = 'PENDING', OVERDUE = 'OVERDUE' }

interface Customer { id: string; name: string; type: 'CUSTOMER' | 'SUPPLIER'; phone?: string; city?: string; }
interface Product { id: string; name: string; sku: string; quantity: number; price: number; category: string; minLevel: number; taxRate: number; }
interface InvoiceItem { productId: string; productName: string; quantity: number; unitPrice: number; taxRate: number; total: number; }
interface Invoice { id: string; customerName: string; date: string; amount: number; status: InvoiceStatus; items: InvoiceItem[]; }
interface Transaction { id: string; description: string; amount: number; type: TransactionType; date: string; }

/** --- SERVISLER --- **/

// Fix: Correct initialization of GoogleGenAI using named parameter and environment variable directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const storageService = {
  getProducts: (): Product[] => JSON.parse(localStorage.getItem('products') || '[]'),
  setProducts: (data: Product[]) => localStorage.setItem('products', JSON.stringify(data)),
  getInvoices: (): Invoice[] => JSON.parse(localStorage.getItem('invoices') || '[]'),
  setInvoices: (data: Invoice[]) => localStorage.setItem('invoices', JSON.stringify(data)),
  getTransactions: (): Transaction[] => JSON.parse(localStorage.getItem('transactions') || '[]'),
  setTransactions: (data: Transaction[]) => localStorage.setItem('transactions', JSON.stringify(data)),
  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem('customers') || '[]'),
  setCustomers: (data: Customer[]) => localStorage.setItem('customers', JSON.stringify(data))
};

/** --- BILEŞENLER --- **/

// Fix: Explicitly define props to include children to avoid TypeScript errors in TSX
const Modal = ({ isOpen, onClose, title, children }: { isOpen: any; onClose: any; title: any; children: any }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <h3 className="text-xl font-bold dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border dark:border-slate-700 flex items-center justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold dark:text-white">{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${color} bg-opacity-10`}><Icon className={color.replace('bg-', 'text-')} size={24} /></div>
  </div>
);

/** --- ANA UYGULAMA --- **/

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuth, setIsAuth] = useState(localStorage.getItem('auth') === 'true');
  const [products, setProducts] = useState(storageService.getProducts());
  const [invoices, setInvoices] = useState(storageService.getInvoices());
  const [transactions, setTransactions] = useState(storageService.getTransactions());
  const [customers, setCustomers] = useState(storageService.getCustomers());

  useEffect(() => {
    // İlk açılışta demo verileri
    if (products.length === 0) {
      const demoProds = [
        { id: '1', name: 'Laptop Pro X', sku: 'LAP-001', quantity: 12, price: 35000, category: 'Elektronik', minLevel: 5, taxRate: 20 },
        { id: '2', name: 'Kablosuz Mouse', sku: 'MOU-022', quantity: 45, price: 850, category: 'Aksesuar', minLevel: 10, taxRate: 20 }
      ];
      storageService.setProducts(demoProds);
      setProducts(demoProds);
    }
  }, []);

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">M</div>
          <h1 className="text-2xl font-extrabold mb-2 text-slate-900">Mustafa Ticaret</h1>
          <p className="text-slate-500 mb-8 text-sm">Giriş yapmak için butona tıklayın.</p>
          <button 
            onClick={() => { localStorage.setItem('auth', 'true'); setIsAuth(true); }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Sisteme Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden lg:flex shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">M</div>
          <span className="font-bold tracking-tight text-lg">Mustafa Ticaret</span>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'inventory', label: 'Stok Takibi', icon: Package },
            { id: 'invoices', label: 'Faturalar', icon: FileText },
            { id: 'transactions', label: 'Kasa & Hareket', icon: Wallet },
            { id: 'ai-advisor', label: 'AI Asistan', icon: Bot },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={20}/> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-8 text-slate-500 hover:text-rose-400 flex items-center gap-2 text-sm font-bold border-t border-slate-800 transition-colors"><LogOut size={18}/> Çıkış Yap</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'inventory' && <InventoryView products={products} setProducts={setProducts} />}
        {activeTab === 'invoices' && <InvoiceView invoices={invoices} setInvoices={setInvoices} products={products} />}
        {activeTab === 'transactions' && <TransactionView transactions={transactions} setTransactions={setTransactions} />}
        {activeTab === 'ai-advisor' && <AIAdvisorView />}
      </main>
    </div>
  );
};

/** --- DASHBOARD --- **/

const DashboardView = () => {
  const p = storageService.getProducts();
  const t = storageService.getTransactions();
  const inc = t.filter(x => x.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
  const exp = t.filter(x => x.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Genel Durum</h1>
          <p className="text-slate-500 mt-1">İşletmenizin bugünkü performansı.</p>
        </div>
        <div className="text-right">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kasa Bakiyesi</span>
           <div className="text-2xl font-black text-blue-600">₺{(inc - exp).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Toplam Gelir" value={`₺${inc.toLocaleString()}`} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Toplam Gider" value={`₺${exp.toLocaleString()}`} icon={TrendingDown} color="bg-rose-500" />
        <StatCard title="Net Kar" value={`₺${(inc - exp).toLocaleString()}`} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Kritik Stok" value={p.filter(x => x.quantity <= x.minLevel).length} icon={AlertTriangle} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border dark:border-slate-700">
          <h3 className="font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2"><PieChart size={20} className="text-blue-500"/> Aylık Analiz</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n: 'Gelir', v: inc}, {n: 'Gider', v: exp}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="n" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="v" fill="#3b82f6" radius={[8,8,0,0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border dark:border-slate-700">
           <h3 className="font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2"><Clock size={20} className="text-orange-500"/> Son Hareketler</h3>
           <div className="space-y-4">
              {t.slice(-5).reverse().map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                         {item.type === TransactionType.INCOME ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                      </div>
                      <div>
                         <div className="text-sm font-bold dark:text-white">{item.description}</div>
                         <div className="text-xs text-slate-400">{item.date}</div>
                      </div>
                   </div>
                   <div className={`font-bold ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.type === TransactionType.INCOME ? '+' : '-'}₺{item.amount.toLocaleString()}
                   </div>
                </div>
              ))}
              {t.length === 0 && <div className="text-center text-slate-400 py-10">Kayıt bulunamadı.</div>}
           </div>
        </div>
      </div>
    </div>
  );
};

/** --- STOK TAKIBI --- **/

const InventoryView = ({ products, setProducts }) => {
  const [modal, setModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', sku: '', category: '', quantity: 0, price: 0, minLevel: 5, taxRate: 20 });

  const saveProduct = (e) => {
    e.preventDefault();
    const newProd = { ...formData, id: Date.now().toString() };
    const updated = [...products, newProd];
    storageService.setProducts(updated);
    setProducts(updated);
    setModal(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Stok Yönetimi</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"><Plus size={20}/> Yeni Ürün</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 dark:text-white font-bold">
            <tr>
              <th className="p-5">Ürün Bilgisi</th>
              <th className="p-5">Kategori</th>
              <th className="p-5">Mevcut Stok</th>
              <th className="p-5">Birim Fiyat</th>
              <th className="p-5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-5">
                   <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                   <div className="text-xs text-slate-400">{p.sku}</div>
                </td>
                <td className="p-5 text-slate-500 dark:text-slate-400">{p.category}</td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.quantity <= p.minLevel ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {p.quantity} Adet
                  </span>
                </td>
                <td className="p-5 font-bold text-slate-900 dark:text-white">₺{p.price.toLocaleString()}</td>
                <td className="p-5 text-right">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18}/></button>
                  <button onClick={() => {
                    const filtered = products.filter(x => x.id !== p.id);
                    storageService.setProducts(filtered);
                    setProducts(filtered);
                  }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Ürün Ekle">
        <form onSubmit={saveProduct} className="space-y-4">
          <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Ürün Adı" required onChange={e => setFormData({...formData, name: e.target.value})}/>
          <div className="grid grid-cols-2 gap-4">
             <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="SKU" required onChange={e => setFormData({...formData, sku: e.target.value})}/>
             <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Kategori" required onChange={e => setFormData({...formData, category: e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Miktar" required onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}/>
             <input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Fiyat" required onChange={e => setFormData({...formData, price: Number(e.target.value)})}/>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg">Ürünü Kaydet</button>
        </form>
      </Modal>
    </div>
  );
};

/** --- FATURA YÖNETİMİ --- **/

const InvoiceView = ({ invoices, setInvoices, products }) => {
  const [modal, setModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ customerName: '', items: [] });
  const [selectedProdId, setSelectedProdId] = useState('');
  const [qty, setQty] = useState(1);

  const addItem = () => {
    const prod = products.find(x => x.id === selectedProdId);
    if (!prod) return;
    const item = { productId: prod.id, productName: prod.name, quantity: qty, unitPrice: prod.price, taxRate: prod.taxRate, total: prod.price * qty * (1 + prod.taxRate/100) };
    setNewInvoice({...newInvoice, items: [...newInvoice.items, item]});
  };

  const saveInvoice = () => {
    const amount = newInvoice.items.reduce((a, b) => a + b.total, 0);
    const invoice = { ...newInvoice, id: 'FAT-' + Date.now().toString().slice(-6), date: new Date().toLocaleDateString('tr-TR'), amount, status: InvoiceStatus.PENDING };
    const updated = [...invoices, invoice];
    storageService.setInvoices(updated);
    setInvoices(updated);
    setModal(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Faturalar</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"><Plus size={20}/> Fatura Kes</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 dark:text-white font-bold">
            <tr>
              <th className="p-5">Fatura No</th>
              <th className="p-5">Müşteri</th>
              <th className="p-5">Tarih</th>
              <th className="p-5">Toplam Tutar</th>
              <th className="p-5">Durum</th>
              <th className="p-5 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-5 font-bold text-blue-600">{inv.id}</td>
                <td className="p-5 text-slate-900 dark:text-white font-medium">{inv.customerName}</td>
                <td className="p-5 text-slate-500 dark:text-slate-400">{inv.date}</td>
                <td className="p-5 font-bold text-slate-900 dark:text-white">₺{inv.amount.toLocaleString()}</td>
                <td className="p-5">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                     {inv.status === InvoiceStatus.PAID ? 'Ödendi' : 'Bekliyor'}
                   </span>
                </td>
                <td className="p-5 text-right">
                  <button className="p-2 text-slate-400 hover:text-blue-600"><Printer size={18}/></button>
                  <button onClick={() => {
                    const filtered = invoices.filter(x => x.id !== inv.id);
                    storageService.setInvoices(filtered);
                    setInvoices(filtered);
                  }} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Fatura Oluştur">
         <div className="space-y-6">
            <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Müşteri / Firma Adı" onChange={e => setNewInvoice({...newInvoice, customerName: e.target.value})}/>
            
            <div className="p-5 bg-gray-50 dark:bg-slate-700 rounded-3xl border border-dashed border-gray-300 dark:border-slate-600">
               <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Kalem Ekle</h4>
               <div className="flex gap-2">
                  <select className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-xl outline-none" onChange={e => setSelectedProdId(e.target.value)}>
                    <option value="">Ürün Seçin</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>)}
                  </select>
                  <input type="number" className="w-20 p-3 bg-white dark:bg-slate-800 rounded-xl outline-none" value={qty} onChange={e => setQty(Number(e.target.value))}/>
                  <button onClick={addItem} className="bg-slate-900 dark:bg-blue-600 text-white p-3 rounded-xl"><Plus size={20}/></button>
               </div>
            </div>

            <div className="space-y-2">
               {newInvoice.items.map((item, i) => (
                 <div key={i} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
                    <span className="font-medium dark:text-blue-100">{item.productName} (x{item.quantity})</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">₺{item.total.toLocaleString()}</span>
                 </div>
               ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
               <div className="text-slate-500">Genel Toplam:</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white">₺{newInvoice.items.reduce((a,b)=>a+b.total, 0).toLocaleString()}</div>
            </div>

            <button onClick={saveInvoice} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg">Faturayı Kaydet ve Kes</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- KASA & HAREKET --- **/

const TransactionView = ({ transactions, setTransactions }) => {
  const [modal, setModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: 0, type: TransactionType.EXPENSE, date: new Date().toISOString().split('T')[0] });

  const saveTx = (e) => {
    e.preventDefault();
    const tx = { ...formData, id: Date.now().toString() };
    const updated = [...transactions, tx];
    storageService.setTransactions(updated);
    setTransactions(updated);
    setModal(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Kasa Hareketleri</h1>
        <button onClick={() => setModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-black shadow-lg"><Plus size={20}/> Hareket Ekle</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 dark:text-white font-bold">
            <tr>
              <th className="p-5">Tarih</th>
              <th className="p-5">Açıklama</th>
              <th className="p-5">Tür</th>
              <th className="p-5 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {transactions.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-5 text-slate-500 dark:text-slate-400">{item.date}</td>
                <td className="p-5 font-bold text-slate-900 dark:text-white">{item.description}</td>
                <td className="p-5">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                     {item.type === TransactionType.INCOME ? 'Gelir' : 'Gider'}
                   </span>
                </td>
                <td className={`p-5 text-right font-black ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {item.type === TransactionType.INCOME ? '+' : '-'}₺{item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Kasa Hareketi">
        <form onSubmit={saveTx} className="space-y-4">
          <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Açıklama (Örn: Kira, Satış)" required onChange={e => setFormData({...formData, description: e.target.value})}/>
          <div className="grid grid-cols-2 gap-4">
             <input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Tutar" required onChange={e => setFormData({...formData, amount: Number(e.target.value)})}/>
             <select className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}>
                <option value={TransactionType.EXPENSE}>Gider</option>
                <option value={TransactionType.INCOME}>Gelir</option>
             </select>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-black shadow-lg">Hareketi Kaydet</button>
        </form>
      </Modal>
    </div>
  );
};

/** --- AI ASISTAN --- **/

const AIAdvisorView = () => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{r: 'ai', t: 'Merhaba Mustafa Bey, bugün finansal verilerinizde yardımcı olabilirim. Ne sormak istersiniz?'}]);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!msg.trim()) return;
    const ut = msg;
    setMsg("");
    setChat(c => [...c, {r: 'user', t: ut}]);
    setLoading(true);
    
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Muhasebe Danışmanısın. Soru: ${ut}`
      });
      setChat(c => [...c, {r: 'ai', t: resp.text || "Şu an cevap veremiyorum."}]);
    } catch {
      setChat(c => [...c, {r: 'ai', t: "Bağlantı hatası oluştu."}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col space-y-4">
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border dark:border-slate-700 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.r === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-5 rounded-3xl max-w-[85%] text-sm leading-relaxed ${c.r === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-slate-700 dark:text-slate-200 border dark:border-slate-600'}`}>
              {c.t}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 animate-pulse">Asistan düşünüyor...</div>}
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border dark:border-slate-700 flex gap-3">
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && askAI()}
          placeholder="Asistan ile konuşun..." 
          className="flex-1 bg-transparent outline-none dark:text-white px-4 text-sm"
        />
        <button onClick={askAI} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg"><ArrowRight size={20}/></button>
      </div>
    </div>
  );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
