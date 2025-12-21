import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Package, FileText, Wallet, Bot, Users, 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowRight, Plus, 
  Trash2, Edit, X, Printer, LogOut, Clock, CheckCircle2, FileSignature,
  Briefcase, PieChart, Search, Filter, ArrowUpRight, ArrowDownLeft, FileCode,
  Calendar, CreditCard, Banknote, Scroll, Zap, HardDrive, Download
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

/** --- TIPLER & ENUMLAR --- **/
enum TransactionType { INCOME = 'INCOME', EXPENSE = 'EXPENSE' }
enum InvoiceStatus { PAID = 'PAID', PENDING = 'PENDING' }
enum ProposalStatus { DRAFT = 'DRAFT', SENT = 'SENT', ACCEPTED = 'ACCEPTED' }
enum PaymentMethod { CASH = 'CASH', CARD = 'CARD', TRANSFER = 'TRANSFER' }

interface Product { id: string; name: string; quantity: number; price: number; category: string; minLevel: number; taxRate: number; }
interface Customer { id: string; name: string; type: 'CUSTOMER' | 'SUPPLIER'; phone?: string; city?: string; taxNumber?: string; }
interface Transaction { id: string; description: string; amount: number; type: TransactionType; date: string; method: PaymentMethod; }
interface Invoice { id: string; customerName: string; date: string; amount: number; status: InvoiceStatus; items: any[]; }
interface Proposal { id: string; customerName: string; date: string; amount: number; status: ProposalStatus; items: any[]; }
interface Employee { id: string; name: string; position: string; salary: number; startDate: string; }

/** --- SERVISLER --- **/
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const store = {
  get: (key: string, def: any) => JSON.parse(localStorage.getItem('m_' + key) || JSON.stringify(def)),
  set: (key: string, val: any) => localStorage.setItem('m_' + key, JSON.stringify(val)),
  generateId: (pre: string) => pre + Date.now().toString(36).toUpperCase()
};

/** --- BILEŞENLER --- **/
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <h3 className="text-xl font-bold dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border dark:border-slate-700 flex items-center justify-between hover:scale-[1.02] transition-transform">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black dark:text-white">{value}</h3>
      {trend && <p className="text-[10px] mt-1 text-emerald-500 font-bold">{trend}</p>}
    </div>
    <div className={`p-4 rounded-xl ${color} bg-opacity-10`}><Icon className={color.replace('bg-', 'text-')} size={24} /></div>
  </div>
);

/** --- ANA UYGULAMA --- **/
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuth, setIsAuth] = useState(localStorage.getItem('m_auth') === 'true');
  
  // Data States
  const [products, setProducts] = useState<Product[]>(store.get('products', []));
  const [customers, setCustomers] = useState<Customer[]>(store.get('customers', []));
  const [transactions, setTransactions] = useState<Transaction[]>(store.get('transactions', []));
  const [invoices, setInvoices] = useState<Invoice[]>(store.get('invoices', []));
  const [proposals, setProposals] = useState<Proposal[]>(store.get('proposals', []));
  const [employees, setEmployees] = useState<Employee[]>(store.get('employees', []));

  useEffect(() => {
    store.set('products', products);
    store.set('customers', customers);
    store.set('transactions', transactions);
    store.set('invoices', invoices);
    store.set('proposals', proposals);
    store.set('employees', employees);
  }, [products, customers, transactions, invoices, proposals, employees]);

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-8 shadow-xl shadow-blue-900/40">M</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Mustafa Ticaret</h1>
          <p className="text-slate-500 mb-10">Profesyonel Ön Muhasebe Sistemi</p>
          <button onClick={() => { localStorage.setItem('m_auth', 'true'); setIsAuth(true); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95">Sisteme Giriş Yap</button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stok Takibi', icon: Package },
    { id: 'customers', label: 'Cari Hesaplar', icon: Users },
    { id: 'proposals', label: 'Teklifler', icon: FileSignature },
    { id: 'invoices', label: 'Faturalar', icon: FileText },
    { id: 'transactions', label: 'Kasa & Banka', icon: Wallet },
    { id: 'personnel', label: 'Personel & Maaş', icon: Briefcase },
    { id: 'reports', label: 'Raporlar', icon: PieChart },
    { id: 'ai', label: 'AI Danışman', icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-white hidden lg:flex flex-col border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">M</div>
          <span className="font-black text-xl tracking-tight">MUHASEBE<span className="text-blue-500">PRO</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all font-semibold text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={18}/> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 font-bold transition-all"><LogOut size={16}/> Çıkış</button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-10">
        {activeTab === 'dashboard' && <DashboardView products={products} transactions={transactions} invoices={invoices} />}
        {activeTab === 'inventory' && <InventoryView products={products} setProducts={setProducts} />}
        {activeTab === 'customers' && <CustomersView customers={customers} setCustomers={setCustomers} invoices={invoices} transactions={transactions} setTransactions={setTransactions} />}
        {activeTab === 'proposals' && <ProposalsView proposals={proposals} setProposals={setProposals} products={products} setInvoices={setInvoices} />}
        {activeTab === 'invoices' && <InvoicesView invoices={invoices} setInvoices={setInvoices} products={products} setTransactions={setTransactions} setProducts={setProducts} />}
        {activeTab === 'transactions' && <TransactionsView transactions={transactions} setTransactions={setTransactions} />}
        {activeTab === 'personnel' && <PersonnelView employees={employees} setEmployees={setEmployees} setTransactions={setTransactions} />}
        {activeTab === 'reports' && <ReportsView products={products} transactions={transactions} invoices={invoices} />}
        {activeTab === 'ai' && <AIView products={products} transactions={transactions} />}
      </main>
    </div>
  );
};

/** --- GÖRÜNÜMLER --- **/

const DashboardView = ({ products, transactions, invoices }: any) => {
  const inc = transactions.filter((x:any) => x.type === TransactionType.INCOME).reduce((a:any, b:any) => a + b.amount, 0);
  const exp = transactions.filter((x:any) => x.type === TransactionType.EXPENSE).reduce((a:any, b:any) => a + b.amount, 0);
  const critical = products.filter((p:any) => p.quantity <= p.minLevel).length;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white">Genel Durum</h1>
          <p className="text-slate-500 mt-1">İşletmenizin finansal özeti ve operasyonel verileri.</p>
        </div>
        <div className="text-right">
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kasa Mevcudu</span>
           <div className="text-3xl font-black text-blue-600">₺{(inc - exp).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Toplam Gelir" value={`₺${inc.toLocaleString()}`} icon={TrendingUp} color="bg-emerald-500" trend="+12% Bu Ay" />
        <StatCard title="Toplam Gider" value={`₺${exp.toLocaleString()}`} icon={TrendingDown} color="bg-rose-500" trend="-4% Geçen Ay" />
        <StatCard title="Kritik Stok" value={critical} icon={AlertTriangle} color="bg-orange-500" />
        <StatCard title="Bekleyen Fatura" value={invoices.filter((i:any)=>i.status === InvoiceStatus.PENDING).length} icon={Clock} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border dark:border-slate-700">
          <h3 className="font-bold mb-6 flex items-center gap-2"><PieChart size={20} className="text-blue-600"/> Gelir-Gider Analizi</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n: 'Gelir', v: inc}, {n: 'Gider', v: exp}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="n" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="v" radius={[10,10,0,0]} barSize={80}>
                   <Cell fill="#10b981" />
                   <Cell fill="#f43f5e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border dark:border-slate-700">
           <h3 className="font-bold mb-6 flex items-center gap-2"><Clock size={20} className="text-orange-500"/> Son İşlemler</h3>
           <div className="space-y-4">
              {transactions.slice(-5).reverse().map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-2xl">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                         {t.type === 'INCOME' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                      </div>
                      <div className="text-sm">
                         <div className="font-bold dark:text-white">{t.description}</div>
                         <div className="text-xs text-slate-400">{t.date}</div>
                      </div>
                   </div>
                   <div className={`font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}₺{t.amount.toLocaleString()}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ products, setProducts }: any) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: 'Genel', quantity: 0, price: 0, minLevel: 5 });

  const save = () => {
    if(!form.name) return;
    setProducts([...products, { ...form, id: store.generateId('STK') }]);
    setModal(false);
    setForm({ name: '', sku: '', category: 'Genel', quantity: 0, price: 0, minLevel: 5 });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black dark:text-white">Stok Yönetimi</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"><Plus size={20}/> Yeni Ürün</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50 dark:text-white font-bold uppercase text-[10px] tracking-widest">
            <tr><th className="p-5">Ürün Bilgisi</th><th className="p-5">Kategori</th><th className="p-5 text-center">Durum</th><th className="p-5 text-right">Fiyat</th><th className="p-5"></th></tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {products.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-5">
                   <div className="font-bold dark:text-white">{p.name}</div>
                   <div className="text-[10px] text-gray-400 uppercase">{p.id}</div>
                </td>
                <td className="p-5 text-gray-500">{p.category}</td>
                <td className="p-5 text-center">
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${p.quantity <= p.minLevel ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.quantity} Adet</span>
                </td>
                <td className="p-5 text-right font-black dark:text-white">₺{p.price.toLocaleString()}</td>
                <td className="p-5 text-right">
                   <button onClick={() => setProducts(products.filter((x:any)=>x.id !== p.id))} className="p-2 text-gray-400 hover:text-rose-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Stok Kartı Oluştur">
         <div className="space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase">Ürün Adı</label><input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, name: e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="text-xs font-bold text-gray-400 uppercase">Kategori</label><input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, category: e.target.value})}/></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase">Fiyat (₺)</label><input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, price: Number(e.target.value)})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="text-xs font-bold text-gray-400 uppercase">Mevcut Miktar</label><input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, quantity: Number(e.target.value)})}/></div>
               <div><label className="text-xs font-bold text-gray-400 uppercase">Kritik Seviye</label><input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, minLevel: Number(e.target.value)})}/></div>
            </div>
            <button onClick={save} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">Ürünü Kaydet</button>
         </div>
      </Modal>
    </div>
  );
};

const CustomersView = ({ customers, setCustomers, invoices, transactions, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'CUSTOMER', phone: '', city: '' });

  const save = () => {
    if(!form.name) return;
    setCustomers([...customers, { ...form, id: store.generateId('CARI') }]);
    setModal(false);
  };

  const calculateBalance = (name: string) => {
    const custInvoices = invoices.filter((i:any) => i.customerName === name);
    const custTxs = transactions.filter((t:any) => t.description.includes(name));
    const totalInvoiced = custInvoices.reduce((a:any, b:any) => a + b.amount, 0);
    const totalPaid = custTxs.filter((t:any)=>t.type === TransactionType.INCOME).reduce((a:any, b:any) => a + b.amount, 0);
    return totalInvoiced - totalPaid;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black dark:text-white">Cariler</h1>
          <button onClick={() => setModal(true)} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black"><Plus size={18}/></button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
           {customers.map((c: any) => (
             <div 
               key={c.id} 
               onClick={() => setSelected(c)}
               className={`p-5 border-b dark:border-slate-700 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-slate-700/50 ${selected?.id === c.id ? 'bg-blue-50 border-l-4 border-l-blue-600 dark:bg-blue-900/20' : ''}`}
             >
                <div className="flex justify-between items-start">
                   <div>
                      <div className="font-bold dark:text-white">{c.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{c.type === 'CUSTOMER' ? 'Müşteri' : 'Tedarikçi'}</div>
                   </div>
                   <div className={`font-black text-sm ${calculateBalance(c.name) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      ₺{Math.abs(calculateBalance(c.name)).toLocaleString()}
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
         {selected ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 p-8 shadow-sm h-full">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black dark:text-white">{selected.name}</h2>
                    <p className="text-slate-500">{selected.city} | {selected.phone}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-right">
                     <span className="text-[10px] font-bold text-blue-400 uppercase">Güncel Bakiye</span>
                     <div className={`text-2xl font-black ${calculateBalance(selected.name) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        ₺{calculateBalance(selected.name).toLocaleString()}
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="font-bold text-sm border-b pb-2 dark:border-slate-700 flex items-center gap-2"><Clock size={16}/> Hesap Özeti</h4>
                  <div className="space-y-2">
                     {invoices.filter((i:any)=>i.customerName === selected.name).map((inv:any) => (
                       <div key={inv.id} className="flex justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl text-sm">
                          <span>{inv.date} - Satış Faturası ({inv.id})</span>
                          <span className="font-bold text-red-500">+₺{inv.amount.toLocaleString()}</span>
                       </div>
                     ))}
                     {transactions.filter((t:any)=>t.description.includes(selected.name)).map((tx:any) => (
                       <div key={tx.id} className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-sm">
                          <span>{tx.date} - Tahsilat ({tx.description})</span>
                          <span className="font-bold text-emerald-600">-₺{tx.amount.toLocaleString()}</span>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <Users size={64} className="opacity-20 mb-4" />
               <p>Detayları görmek için listeden bir cari seçin.</p>
            </div>
         )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Cari Hesap">
         <div className="space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase">Ünvan / Ad Soyad</label><input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, name: e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Cari Tipi</label>
                  <select className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, type: e.target.value})}>
                     <option value="CUSTOMER">Müşteri</option>
                     <option value="SUPPLIER">Tedarikçi</option>
                  </select>
               </div>
               <div><label className="text-xs font-bold text-gray-400 uppercase">Telefon</label><input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, phone: e.target.value})}/></div>
            </div>
            <button onClick={save} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">Kaydı Tamamla</button>
         </div>
      </Modal>
    </div>
  );
};

const InvoicesView = ({ invoices, setInvoices, products, setTransactions, setProducts }: any) => {
  const [modal, setModal] = useState(false);
  const [cust, setCust] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selProd, setSelProd] = useState('');
  const [qty, setQty] = useState(1);

  const addItem = () => {
    const p = products.find((x:any)=>x.id === selProd);
    if(!p) return;
    setItems([...items, { ...p, qty, total: p.price * qty }]);
  };

  const complete = () => {
    const total = items.reduce((a,b)=>a+b.total, 0);
    const id = store.generateId('FAT');
    const inv = { id, customerName: cust, amount: total, date: new Date().toLocaleDateString('tr-TR'), status: InvoiceStatus.PAID, items };
    
    setInvoices([inv, ...invoices]);
    setTransactions((prev:any) => [{ id: 'TX-'+id, description: `Fatura: ${cust}`, amount: total, type: TransactionType.INCOME, date: new Date().toLocaleDateString('tr-TR'), method: PaymentMethod.CASH }, ...prev]);
    
    // Stok düş
    setProducts(products.map((p:any) => {
       const line = items.find(i=>i.id === p.id);
       return line ? { ...p, quantity: p.quantity - line.qty } : p;
    }));

    setModal(false);
    setItems([]); setCust('');
  };

  const exportXML = (inv: any) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${inv.id}</ID>
  <IssueDate>${inv.date}</IssueDate>
  <AccountingSupplierParty><PartyName><Name>MUSTAFA TICARET</Name></PartyName></AccountingSupplierParty>
  <AccountingCustomerParty><PartyName><Name>${inv.customerName}</Name></PartyName></AccountingCustomerParty>
  <LegalMonetaryTotal><PayableAmount currencyID="TRY">${inv.amount}</PayableAmount></LegalMonetaryTotal>
</Invoice>`;
    const blob = new Blob([xml], {type: 'application/xml'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.id}.xml`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black dark:text-white">Faturalar</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"><Plus size={20}/> Fatura Kes</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50 dark:text-white font-bold uppercase text-[10px] tracking-widest">
            <tr><th className="p-5">Fatura No</th><th className="p-5">Müşteri</th><th className="p-5 text-right">Tutar</th><th className="p-5 text-center">Durum</th><th className="p-5"></th></tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {invoices.map((i: any) => (
              <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-5 font-mono text-blue-600">{i.id}</td>
                <td className="p-5 font-bold dark:text-white">{i.customerName}</td>
                <td className="p-5 text-right font-black dark:text-white">₺{i.amount.toLocaleString()}</td>
                <td className="p-5 text-center"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Ödendi</span></td>
                <td className="p-5 text-right space-x-2">
                   <button onClick={()=>window.print()} className="p-2 text-gray-400 hover:text-blue-500"><Printer size={16}/></button>
                   <button onClick={()=>exportXML(i)} className="p-2 text-gray-400 hover:text-indigo-500"><FileCode size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Satış Faturası">
         <div className="space-y-6">
            <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Müşteri Adı" onChange={e=>setCust(e.target.value)}/>
            <div className="p-5 bg-blue-50 dark:bg-slate-700/50 rounded-2xl border border-blue-100 border-dashed">
               <div className="flex gap-2">
                  <select className="flex-1 p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm" onChange={e=>setSelProd(e.target.value)}>
                    <option value="">Ürün Seçin</option>
                    {products.map((p:any) => <option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>)}
                  </select>
                  <input type="number" className="w-20 p-3 bg-white dark:bg-slate-800 rounded-xl outline-none text-sm" value={qty} onChange={e=>setQty(Number(e.target.value))}/>
                  <button onClick={addItem} className="bg-blue-600 text-white p-3 rounded-xl"><Plus size={18}/></button>
               </div>
            </div>
            <div className="space-y-2">
               {items.map((it:any, idx:number)=>(
                 <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-xl text-sm border dark:border-slate-600">
                    <span>{it.name} (x{it.qty})</span>
                    <span className="font-bold">₺{it.total.toLocaleString()}</span>
                 </div>
               ))}
            </div>
            <div className="flex justify-between text-xl font-black pt-4 border-t dark:border-slate-700">
               <span>TOPLAM</span>
               <span className="text-blue-600">₺{items.reduce((a,b)=>a+b.total, 0).toLocaleString()}</span>
            </div>
            <button onClick={complete} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg">Faturayı Kes ve Onayla</button>
         </div>
      </Modal>
    </div>
  );
};

const PersonnelView = ({ employees, setEmployees, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', salary: 0, startDate: new Date().toLocaleDateString('tr-TR') });

  const save = () => {
    setEmployees([...employees, { ...form, id: store.generateId('EMP') }]);
    setModal(false);
  };

  const paySalary = (emp: any) => {
    if(!confirm(`${emp.name} için maaş ödemesi yapılsın mı?`)) return;
    setTransactions((prev:any) => [{ id: 'MAAS-'+Date.now(), description: `Maaş Ödemesi: ${emp.name}`, amount: emp.salary, type: TransactionType.EXPENSE, date: new Date().toLocaleDateString('tr-TR'), method: PaymentMethod.TRANSFER }, ...prev]);
    alert("Ödeme başarıyla kaydedildi.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black dark:text-white">Personel & Maaş</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg"><Plus size={20}/> Personel Ekle</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {employees.map((emp: any) => (
            <div key={emp.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm space-y-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-bold text-gray-400">{emp.name.substring(0,1)}</div>
                  <div>
                    <div className="font-bold dark:text-white">{emp.name}</div>
                    <div className="text-xs text-blue-500 font-bold">{emp.position}</div>
                  </div>
               </div>
               <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">Aylık Maaş</div>
                    <div className="font-black dark:text-white">₺{emp.salary.toLocaleString()}</div>
                  </div>
                  <button onClick={()=>paySalary(emp)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all">Maaş Öde</button>
               </div>
            </div>
         ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Personel Kaydı">
         <div className="space-y-4">
            <div><label className="text-xs font-bold text-gray-400 uppercase">Ad Soyad</label><input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, name: e.target.value})}/></div>
            <div><label className="text-xs font-bold text-gray-400 uppercase">Pozisyon / Görev</label><input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, position: e.target.value})}/></div>
            <div><label className="text-xs font-bold text-gray-400 uppercase">Maaş (₺)</label><input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, salary: Number(e.target.value)})}/></div>
            <button onClick={save} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">Kaydet</button>
         </div>
      </Modal>
    </div>
  );
};

const ProposalsView = ({ proposals, setProposals, products, setInvoices }: any) => {
  const [modal, setModal] = useState(false);
  const [cust, setCust] = useState('');
  const [selItems, setSelItems] = useState<any[]>([]);

  const accept = (p: any) => {
    if(!confirm("Bu teklifi onaylayıp faturaya dönüştürmek istiyor musunuz?")) return;
    setInvoices((prev:any) => [{ ...p, id: 'FAT-'+p.id.split('-')[1], status: InvoiceStatus.PAID }, ...prev]);
    setProposals(proposals.map((x:any)=>x.id === p.id ? { ...x, status: ProposalStatus.ACCEPTED } : x));
    alert("Teklif faturaya dönüştürüldü.");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black dark:text-white">Fiyat Teklifleri</h1>
        <button onClick={() => setModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg"><Plus size={20}/> Yeni Teklif</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {proposals.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border dark:border-slate-700 shadow-sm border-t-4 border-t-indigo-500">
               <div className="flex justify-between items-start mb-4">
                  <div className="font-black text-lg dark:text-white">{p.customerName}</div>
                  <span className={`px-2 py-1 rounded text-[10px] font-black ${p.status === ProposalStatus.ACCEPTED ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                     {p.status === ProposalStatus.ACCEPTED ? 'ONAYLANDI' : 'TASLAK'}
                  </span>
               </div>
               <div className="text-xs text-slate-400 mb-4">{p.date} | Teklif No: {p.id}</div>
               <div className="flex justify-between items-center">
                  <div className="text-xl font-black dark:text-white">₺{p.amount.toLocaleString()}</div>
                  {p.status !== ProposalStatus.ACCEPTED && (
                     <button onClick={()=>accept(p)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all">Onayla & Faturalandır</button>
                  )}
               </div>
            </div>
         ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Teklif Hazırla">
         <div className="space-y-4">
            <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Firma / Müşteri Adı" onChange={e=>setCust(e.target.value)}/>
            <p className="text-xs font-bold text-gray-400 uppercase">Teklif Kalemleri Seçin</p>
            <select className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e => {
               const prd = products.find((x:any)=>x.id === e.target.value);
               if(prd) setSelItems([...selItems, prd]);
            }}>
               <option value="">Ürün Ekle...</option>
               {products.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="space-y-2">
               {selItems.map((s, idx)=>(<div key={idx} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-xl text-sm border dark:border-slate-600">{s.name} - ₺{s.price}</div>))}
            </div>
            <button onClick={()=>{
               setProposals([{ id: store.generateId('TEK'), customerName: cust, amount: selItems.reduce((a,b)=>a+b.price, 0), date: new Date().toLocaleDateString('tr-TR'), status: ProposalStatus.DRAFT, items: selItems }, ...proposals]);
               setModal(false); setSelItems([]);
            }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">Teklifi Kaydet</button>
         </div>
      </Modal>
    </div>
  );
};

const TransactionsView = ({ transactions, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({ description: '', amount: 0, type: TransactionType.EXPENSE, date: new Date().toLocaleDateString('tr-TR'), method: PaymentMethod.CASH });

  const save = () => {
    setTransactions([{ ...form, id: store.generateId('TX') }, ...transactions]);
    setModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black dark:text-white">Kasa & Banka</h1>
        <button onClick={() => setModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg"><Plus size={20}/> Hareket Ekle</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50 dark:text-white font-bold uppercase text-[10px] tracking-widest">
            <tr><th className="p-5">Tarih</th><th className="p-5">Açıklama</th><th className="p-5">Yöntem</th><th className="p-5 text-right">Tutar</th></tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {transactions.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="p-5 text-gray-500">{t.date}</td>
                <td className="p-5 font-bold dark:text-white">{t.description}</td>
                <td className="p-5"><span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full">{t.method}</span></td>
                <td className={`p-5 text-right font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {t.type === 'INCOME' ? '+' : '-'}₺{t.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Kasa Hareketi">
         <div className="space-y-4">
            <input className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Açıklama" onChange={e=>setForm({...form, description: e.target.value})}/>
            <div className="grid grid-cols-2 gap-4">
               <input type="number" className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" placeholder="Tutar" onChange={e=>setForm({...form, amount: Number(e.target.value)})}/>
               <select className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, type: e.target.value})}>
                  <option value={TransactionType.EXPENSE}>Gider (-)</option>
                  <option value={TransactionType.INCOME}>Gelir (+)</option>
               </select>
            </div>
            <select className="w-full p-4 bg-gray-100 dark:bg-slate-700 rounded-2xl outline-none" onChange={e=>setForm({...form, method: e.target.value})}>
               <option value={PaymentMethod.CASH}>Nakit</option>
               <option value={PaymentMethod.CARD}>Kredi Kartı</option>
               <option value={PaymentMethod.TRANSFER}>Havale / EFT</option>
            </select>
            <button onClick={save} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg mt-4">Hareketi İşle</button>
         </div>
      </Modal>
    </div>
  );
};

const ReportsView = ({ products, transactions, invoices }: any) => {
  const inc = transactions.filter((x:any) => x.type === TransactionType.INCOME).reduce((a:any, b:any) => a + b.amount, 0);
  const exp = transactions.filter((x:any) => x.type === TransactionType.EXPENSE).reduce((a:any, b:any) => a + b.amount, 0);
  
  const categoryData = products.reduce((acc: any, p: any) => {
    const existing = acc.find((x: any) => x.name === p.category);
    if (existing) existing.value += p.quantity;
    else acc.push({ name: p.category, value: p.quantity });
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h1 className="text-3xl font-black dark:text-white">Analiz ve Raporlama</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border dark:border-slate-700">
           <h3 className="font-bold mb-8 flex items-center gap-2"><PieChart size={20} className="text-blue-500"/> Kategori Bazlı Stok Dağılımı</h3>
           <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                       {categoryData.map((_:any, index:number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                 </RePieChart>
              </ResponsiveContainer>
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border dark:border-slate-700">
           <h3 className="font-bold mb-8 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Mali Özet</h3>
           <div className="space-y-6">
              <div className="flex justify-between items-center p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl">
                 <span className="font-bold text-emerald-800 dark:text-emerald-200">Toplam Tahsilat</span>
                 <span className="text-2xl font-black text-emerald-600">₺{inc.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-rose-50 dark:bg-rose-900/10 rounded-2xl">
                 <span className="font-bold text-rose-800 dark:text-rose-200">Toplam Ödeme</span>
                 <span className="text-2xl font-black text-rose-600">₺{exp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                 <span className="font-bold text-blue-800 dark:text-blue-200">Net Kâr (Operasyonel)</span>
                 <span className="text-2xl font-black text-blue-600">₺{(inc - exp).toLocaleString()}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AIView = ({ products, transactions }: any) => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{r: 'ai', t: 'Merhaba Mustafa Bey, ben finansal danışmanınız. Şirketinizin tüm stok ve kasa verilerine hakimim. Bugün neyi analiz etmemi istersiniz?'}]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!msg.trim()) return;
    const txt = msg; setMsg("");
    setChat(c => [...c, {r: 'user', t: txt}]);
    setLoading(true);
    
    try {
      const context = `
        Şirket Verileri:
        - Toplam Ürün Sayısı: ${products.length}
        - Kritik Stoktaki Ürünler: ${products.filter((p:any)=>p.quantity<=p.minLevel).map((p:any)=>p.name).join(', ')}
        - Kasa Bakiyesi: ${transactions.reduce((a:any, b:any) => a + (b.type === TransactionType.INCOME ? b.amount : -b.amount), 0)} TL
      `;
      const resp = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: `Sen bir profesyonel muhasebe uzmanısın. ${context}. Soru: ${txt}` });
      setChat(c => [...c, {r: 'ai', t: resp.text || "Verileri şu an analiz edemiyorum."}]);
    } catch { setChat(c => [...c, {r: 'ai', t: "Bağlantı hatası oluştu."}]); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col space-y-4 animate-in fade-in">
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border dark:border-slate-700 overflow-y-auto p-8 space-y-6 custom-scrollbar">
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.r === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${c.r === 'user' ? 'bg-blue-600 text-white shadow-xl' : 'bg-gray-100 dark:bg-slate-700 dark:text-gray-200 border dark:border-slate-600 shadow-sm'}`}>{c.t}</div>
          </div>
        ))}
        {loading && <div className="text-xs text-blue-500 animate-pulse font-bold">Verileriniz analiz ediliyor...</div>}
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border dark:border-slate-700 flex gap-3">
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="AI Danışman'a bir soru sorun..." className="flex-1 bg-transparent outline-none dark:text-white px-4 text-sm" />
        <button onClick={ask} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"><ArrowRight size={20}/></button>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);