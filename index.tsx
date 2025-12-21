
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Package, FileText, Wallet, Bot, Users, 
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowRight, Plus, 
  Trash2, Edit, X, Printer, LogOut, Clock, CheckCircle2, FileSignature,
  Briefcase, PieChart, Search, Filter, ArrowUpRight, ArrowDownLeft, FileCode,
  Calendar, CreditCard, Banknote, Scroll, Zap, HardDrive, Download, Settings,
  ShieldCheck, ChevronRight, Menu, Phone, MapPin
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

/** --- MODELLER --- **/
enum PaymentMethod { CASH = 'NAKİT', CARD = 'KART', TRANSFER = 'HAVALE', CHECK = 'ÇEK', PROMISSORY = 'SENET' }
enum TransactionType { INCOME = 'GELİR', EXPENSE = 'GİDER' }
enum InvoiceStatus { PAID = 'ÖDENDİ', PENDING = 'BEKLİYOR' }

/** --- YARDIMCI SERVİSLER --- **/
const storage = {
  get: (key: string, def: any) => JSON.parse(localStorage.getItem('mpro_' + key) || JSON.stringify(def)),
  set: (key: string, val: any) => localStorage.setItem('mpro_' + key, JSON.stringify(val)),
  id: (pre: string) => pre + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
};

// Initializing GoogleGenAI using process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/** --- BİLEŞENLER --- **/
const Modal = ({ isOpen, onClose, title, children, size = "max-w-lg" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full ${size} overflow-hidden animate-in zoom-in duration-300`}>
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white" {...props} />
  </div>
);

const Select = ({ label, children, ...props }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <select className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white appearance-none" {...props}>{children}</select>
  </div>
);

/** --- ANA UYGULAMA --- **/
const App = () => {
  const [isAuth, setIsAuth] = useState(storage.get('auth', false));
  const [pass, setPass] = useState("");
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // States
  const [products, setProducts] = useState(storage.get('products', []));
  const [customers, setCustomers] = useState(storage.get('customers', []));
  const [invoices, setInvoices] = useState(storage.get('invoices', []));
  const [transactions, setTransactions] = useState(storage.get('transactions', []));
  const [proposals, setProposals] = useState(storage.get('proposals', []));
  const [employees, setEmployees] = useState(storage.get('employees', []));
  const [settings, setSettings] = useState(storage.get('settings', { title: 'Mustafa Ticaret', vkn: '', address: '', city: '' }));

  useEffect(() => {
    storage.set('products', products);
    storage.set('customers', customers);
    storage.set('invoices', invoices);
    storage.set('transactions', transactions);
    storage.set('proposals', proposals);
    storage.set('employees', employees);
    storage.set('settings', settings);
  }, [products, customers, invoices, transactions, proposals, employees, settings]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (pass === "123456") {
      setIsAuth(true);
      storage.set('auth', true);
    } else {
      alert("Şifre Hatalı! (Varsayılan: 123456)");
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border border-white/10 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-5xl font-black mx-auto mb-8 shadow-2xl shadow-blue-500/40">M</div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Mustafa Ticaret</h1>
          <p className="text-slate-400 mb-10 font-medium text-sm">Devam etmek için yönetici şifresini girin.</p>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="••••••" 
              className="w-full bg-slate-100 p-5 rounded-3xl text-center text-2xl tracking-[1em] outline-none focus:ring-4 ring-blue-500/20 border-2 border-transparent focus:border-blue-500 transition-all"
              autoFocus
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
            <button className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl">
              Giriş Yap <ArrowRight size={20} />
            </button>
          </div>
          <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-widest">Powered by Gemini AI v3</p>
        </form>
      </div>
    );
  }

  const menu = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stok Takibi', icon: Package },
    { id: 'customers', label: 'Cari Hesaplar', icon: Users },
    { id: 'invoices', label: 'Faturalar', icon: FileText },
    { id: 'proposals', label: 'Teklifler', icon: FileSignature },
    { id: 'transactions', label: 'Kasa & Banka', icon: Wallet },
    { id: 'personnel', label: 'Personel', icon: Briefcase },
    { id: 'reports', label: 'Raporlar', icon: PieChart },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
    { id: 'ai', label: 'AI Asistan', icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-white hidden lg:flex flex-col border-r border-slate-800 shadow-2xl">
        <div className="p-10 border-b border-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/30">M</div>
          <div>
            <h2 className="font-black text-lg leading-tight uppercase tracking-tighter">{settings.title}</h2>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Sistem Aktif
            </div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menu.map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}
            >
              <item.icon size={20}/> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-slate-900">
           <button onClick={() => { storage.set('auth', false); window.location.reload(); }} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-900 text-slate-400 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all font-black text-xs uppercase tracking-widest"><LogOut size={16}/> Güvenli Çıkış</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative">
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          {activeTab === 'dashboard' && <DashboardView products={products} transactions={transactions} invoices={invoices} />}
          {activeTab === 'inventory' && <InventoryView products={products} setProducts={setProducts} />}
          {activeTab === 'customers' && <CustomersView customers={customers} setCustomers={setCustomers} invoices={invoices} transactions={transactions} setTransactions={setTransactions} />}
          {activeTab === 'invoices' && <InvoicesView invoices={invoices} setInvoices={setInvoices} products={products} setProducts={setProducts} setTransactions={setTransactions} settings={settings} />}
          {activeTab === 'transactions' && <TransactionsView transactions={transactions} setTransactions={setTransactions} />}
          {activeTab === 'proposals' && <ProposalsView proposals={proposals} setProposals={setProposals} products={products} setInvoices={setInvoices} settings={settings} />}
          {activeTab === 'personnel' && <PersonnelView employees={employees} setEmployees={setEmployees} setTransactions={setTransactions} />}
          {activeTab === 'reports' && <ReportsView products={products} transactions={transactions} invoices={invoices} />}
          {activeTab === 'settings' && <SettingsView settings={settings} setSettings={setSettings} />}
          {activeTab === 'ai' && <AIView products={products} transactions={transactions} settings={settings} />}
        </div>
      </main>
    </div>
  );
};

/** --- GÖRÜNÜMLER --- **/

const DashboardView = ({ products, transactions, invoices }: any) => {
  const income = transactions.filter((t:any) => t.type === 'GELİR').reduce((a:any, b:any) => a + b.amount, 0);
  const expense = transactions.filter((t:any) => t.type === 'GİDER').reduce((a:any, b:any) => a + b.amount, 0);
  const critical = products.filter((p:any) => p.stock <= p.min).length;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-end">
        <div>
           <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">Genel Özet</p>
           <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Hoş Geldiniz <span className="text-slate-300">👋</span></h1>
        </div>
        <div className="text-right bg-white dark:bg-slate-800 px-8 py-5 rounded-[30px] border dark:border-slate-700 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kasa Mevcudu</p>
           <div className="text-3xl font-black text-blue-600">₺{(income - expense).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem title="Toplam Satış" value={`₺${income.toLocaleString()}`} color="bg-emerald-500" icon={TrendingUp} />
        <StatItem title="Toplam Ödeme" value={`₺${expense.toLocaleString()}`} color="bg-rose-500" icon={TrendingDown} />
        <StatItem title="Kritik Ürün" value={critical} color="bg-orange-500" icon={AlertTriangle} />
        <StatItem title="Aktif Cari" value={storage.get('customers', []).length} color="bg-blue-500" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-sm border dark:border-slate-700 h-[450px]">
           <h3 className="font-black text-xl mb-10 flex items-center gap-3 text-slate-800 dark:text-white"><PieChart className="text-blue-600"/> MALİ ANALİZ</h3>
           <ResponsiveContainer width="100%" height="80%">
              <BarChart data={[{n: 'Gelir', v: income}, {n: 'Gider', v: expense}]}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                 <XAxis dataKey="n" axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: 'transparent'}} />
                 <Bar dataKey="v" radius={[15,15,0,0]} barSize={100}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                 </Bar>
              </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-sm border dark:border-slate-700">
           <h3 className="font-black text-xl mb-10 flex items-center gap-3 text-slate-800 dark:text-white"><Clock className="text-orange-500"/> SON İŞLEMLER</h3>
           <div className="space-y-4">
              {transactions.slice(-5).reverse().map((t:any) => (
                <div key={t.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl hover:scale-[1.02] transition-transform">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${t.type === 'GELİR' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                         {t.type === 'GELİR' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                      </div>
                      <div>
                         <p className="font-black text-sm dark:text-white uppercase tracking-tight">{t.desc}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{t.date}</p>
                      </div>
                   </div>
                   <div className={`font-black text-lg ${t.type === 'GELİR' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'GELİR' ? '+' : '-'}₺{t.amount.toLocaleString()}
                   </div>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs">Henüz işlem yok</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ title, value, color, icon: Icon }: any) => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-[35px] shadow-sm border dark:border-slate-700 flex items-center justify-between hover:shadow-xl transition-all">
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
    </div>
    <div className={`p-5 rounded-3xl ${color} bg-opacity-10`}><Icon className={color.replace('bg-', 'text-')} size={28} /></div>
  </div>
);

/** --- STOK --- **/
const InventoryView = ({ products, setProducts }: any) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', cat: 'Genel', stock: 0, price: 0, min: 5 });

  const save = () => {
    if(!form.name) return;
    setProducts([...products, { ...form, id: storage.id('STK') }]);
    setModal(false);
    setForm({ name: '', sku: '', cat: 'Genel', stock: 0, price: 0, min: 5 });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Stok Yönetimi</h1>
        <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-3xl flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl active:scale-95"><Plus size={20}/> Yeni Ürün</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b dark:border-slate-700">
            <tr>
              <th className="p-8">Ürün Bilgisi</th>
              <th className="p-8 text-center">Kategori</th>
              <th className="p-8 text-center">Mevcut Stok</th>
              <th className="p-8 text-right">Birim Fiyat</th>
              <th className="p-8 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {products.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all group">
                <td className="p-8">
                   <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base">{p.name}</div>
                   <div className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest">SKU: {p.sku || p.id}</div>
                </td>
                <td className="p-8 text-center"><span className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.cat}</span></td>
                <td className="p-8 text-center">
                  <div className={`text-lg font-black ${p.stock <= p.min ? 'text-rose-500' : 'text-emerald-500'}`}>{p.stock} Adet</div>
                  {p.stock <= p.min && <div className="text-[9px] font-black text-rose-400 uppercase mt-1">Kritik Seviye!</div>}
                </td>
                <td className="p-8 text-right font-black text-slate-900 dark:text-white text-lg">₺{p.price.toLocaleString()}</td>
                <td className="p-8 text-right">
                   <button onClick={() => setProducts(products.filter((x:any)=>x.id !== p.id))} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Stok Kartı Oluştur">
         <div className="space-y-6">
            <Input label="Ürün Adı" placeholder="Örn: Laptop Pro X1" onChange={e=>setForm({...form, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="SKU / Kod" placeholder="Opsiyonel" onChange={e=>setForm({...form, sku: e.target.value})} />
              <Input label="Kategori" placeholder="Elektronik, Mobilya vb." onChange={e=>setForm({...form, cat: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Mevcut Stok" type="number" onChange={e=>setForm({...form, stock: Number(e.target.value)})} />
              <Input label="Birim Fiyat (₺)" type="number" onChange={e=>setForm({...form, price: Number(e.target.value)})} />
              <Input label="Kritik Sınır" type="number" onChange={e=>setForm({...form, min: Number(e.target.value)})} />
            </div>
            <button onClick={save} className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all mt-4">Kartı Kaydet</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- CARİ HESAPLAR --- **/
const CustomersView = ({ customers, setCustomers, invoices, transactions, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', city: '', type: 'MÜŞTERİ' });

  const getBalance = (name: string) => {
    const inv = invoices.filter((i:any) => i.customer === name).reduce((a:any, b:any) => a + b.amount, 0);
    // Fixed error where 't' was used inside reduce instead of the current element 'b'
    const pay = transactions.filter((t:any) => t.desc.includes(name)).reduce((a:any, b:any) => a + (b.type === 'GELİR' ? b.amount : -b.amount), 0);
    return inv - pay;
  };

  const save = () => {
    if(!form.name) return;
    setCustomers([...customers, { ...form, id: storage.id('CARI') }]);
    setModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-6 duration-500">
      <div className="lg:col-span-1 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase tracking-tight dark:text-white">Cariler</h1>
          <button onClick={() => setModal(true)} className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all shadow-lg"><Plus size={24}/></button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border dark:border-slate-700 overflow-hidden h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
           {customers.map((c: any) => {
             const b = getBalance(c.name);
             return (
               <div 
                 key={c.id} 
                 onClick={() => setSelected(c)}
                 className={`p-6 border-b dark:border-slate-700 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 flex items-center justify-between group ${selected?.id === c.id ? 'bg-blue-50 border-l-8 border-l-blue-600 dark:bg-blue-900/20' : ''}`}
               >
                  <div>
                    <div className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{c.name}</div>
                    <div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{c.type} • {c.city || 'Şehir Belirtilmemiş'}</div>
                  </div>
                  <div className={`font-black text-right ${b > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    <div className="text-[9px] uppercase tracking-widest mb-0.5 opacity-50">{b > 0 ? 'Borçlu' : 'Alacaklı'}</div>
                    <div className="text-lg">₺{Math.abs(b).toLocaleString()}</div>
                  </div>
               </div>
             );
           })}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
         {selected ? (
           <div className="bg-white dark:bg-slate-800 rounded-[50px] shadow-xl border dark:border-slate-700 p-12 h-full flex flex-col animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">{selected.name}</h2>
                    <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                       {/* Phone and MapPin icons added to lucide-react imports */}
                       <span className="flex items-center gap-1.5"><Phone size={14}/> {selected.phone || 'Telefon Yok'}</span>
                       <span className="flex items-center gap-1.5"><MapPin size={14}/> {selected.city || 'Adres Yok'}</span>
                    </div>
                 </div>
                 <div className={`p-8 rounded-[35px] text-right shadow-2xl ${getBalance(selected.name) > 0 ? 'bg-rose-50 border border-rose-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GÜNCEL HESAP BAKİYESİ</p>
                    <div className={`text-4xl font-black ${getBalance(selected.name) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                       ₺{Math.abs(getBalance(selected.name)).toLocaleString()}
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-300 border-b dark:border-slate-700 pb-4 mb-6">Hesap Ekstresi</h4>
                 <div className="space-y-3">
                    {invoices.filter((i:any)=>i.customer === selected.name).map((inv:any)=>(
                       <div key={inv.id} className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl group">
                          <div>
                            <div className="text-xs font-black dark:text-white uppercase tracking-tight">Satış Faturası #{inv.id}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1">{inv.date}</div>
                          </div>
                          <div className="font-black text-rose-500">+₺{inv.amount.toLocaleString()}</div>
                       </div>
                    ))}
                    {transactions.filter((t:any)=>t.desc.includes(selected.name)).map((tx:any)=>(
                       <div key={tx.id} className="flex justify-between items-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl">
                          <div>
                            <div className="text-xs font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-tight">Tahsilat / Ödeme</div>
                            <div className="text-[10px] font-bold text-emerald-600 mt-1">{tx.date}</div>
                          </div>
                          <div className="font-black text-emerald-600">-₺{tx.amount.toLocaleString()}</div>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                 <button className="bg-emerald-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-3"><ArrowDownLeft size={20}/> Tahsilat Al</button>
                 <button className="bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-3"><Edit size={20}/> Kartı Düzenle</button>
              </div>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6">
              <Users size={120} className="opacity-10" />
              <p className="font-black uppercase tracking-[0.2em] text-sm animate-pulse">Cari Seçimi Bekleniyor</p>
           </div>
         )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Cari Hesap">
         <div className="space-y-6">
            <Input label="Ünvan / Ad Soyad" placeholder="Örn: Mustafa Yılmaz Ltd." onChange={e=>setForm({...form, name: e.target.value})} />
            <Select label="Cari Tipi" onChange={e=>setForm({...form, type: e.target.value})}>
               <option value="MÜŞTERİ">Müşteri (Alıcı)</option>
               <option value="TEDARİKÇİ">Tedarikçi (Satıcı)</option>
            </Select>
            <div className="grid grid-cols-2 gap-4">
               <Input label="Telefon" placeholder="05XX XXX XX XX" onChange={e=>setForm({...form, phone: e.target.value})} />
               <Input label="Şehir" placeholder="Ankara, İstanbul vb." onChange={e=>setForm({...form, city: e.target.value})} />
            </div>
            <button onClick={save} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all mt-4">Cariyi Kaydet</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- FATURALAR (VADE & ÇEK DESTEKLİ) --- **/
const InvoicesView = ({ invoices, setInvoices, products, setProducts, setTransactions, settings }: any) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR'), method: PaymentMethod.CASH, maturity: '' });
  const [selItem, setSelItem] = useState({ pid: '', qty: 1 });

  const addItem = () => {
    const p = products.find((x:any)=>x.id === selItem.pid);
    if(!p) return;
    setForm({...form, items: [...form.items, { ...p, qty: selItem.qty, total: p.price * selItem.qty }]});
  };

  const save = () => {
    const total = form.items.reduce((a:any,b:any)=>a+b.total, 0);
    const id = storage.id('FAT');
    const inv = { ...form, id, amount: total, status: InvoiceStatus.PAID };
    
    setInvoices([inv, ...invoices]);
    setTransactions((prev:any) => [{ id: 'TX-'+id, desc: `Fatura: ${form.customer}`, amount: total, type: 'GELİR', date: form.date, method: form.method }, ...prev]);
    
    // Stok düş
    setProducts(products.map((p:any) => {
       const line = form.items.find((i:any)=>i.id === p.id);
       return line ? { ...p, stock: p.stock - line.qty } : p;
    }));

    setModal(false);
    setForm({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR'), method: PaymentMethod.CASH, maturity: '' });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Faturalar</h1>
        <button onClick={() => setModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-3xl flex items-center gap-3 font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95"><Plus size={20}/> Fatura Kes</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b dark:border-slate-700">
            <tr>
              <th className="p-8">Fatura No</th>
              <th className="p-8">Müşteri</th>
              <th className="p-8 text-center">Ödeme Yöntemi</th>
              <th className="p-8 text-center">Vade</th>
              <th className="p-8 text-right">Toplam Tutar</th>
              <th className="p-8 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {invoices.map((i: any) => (
              <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all">
                <td className="p-8 font-black text-indigo-600 tracking-widest text-base">{i.id}</td>
                <td className="p-8 font-black text-slate-900 dark:text-white uppercase tracking-tight">{i.customer}</td>
                <td className="p-8 text-center">
                   <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">{i.method}</span>
                </td>
                <td className="p-8 text-center">
                   {i.maturity ? (
                     <div className="text-[11px] font-black text-rose-500 uppercase flex items-center justify-center gap-2"><Clock size={14}/> {i.maturity}</div>
                   ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="p-8 text-right font-black text-slate-900 dark:text-white text-xl">₺{i.amount.toLocaleString()}</td>
                <td className="p-8 text-right space-x-2">
                   <button className="p-3 text-slate-300 hover:text-blue-500 transition-all"><Printer size={20}/></button>
                   <button className="p-3 text-slate-300 hover:text-indigo-500 transition-all"><FileCode size={20}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Fatura Oluştur" size="max-w-2xl">
         <div className="space-y-6">
            <Input label="Müşteri / Cari Seçimi" placeholder="İsim Yazın..." value={form.customer} onChange={e=>setForm({...form, customer: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
               <Select label="Ödeme Şekli" value={form.method} onChange={e=>setForm({...form, method: e.target.value})}>
                  <option value={PaymentMethod.CASH}>Nakit</option>
                  <option value={PaymentMethod.CARD}>Kredi Kartı</option>
                  <option value={PaymentMethod.TRANSFER}>Banka Havalesi</option>
                  <option value={PaymentMethod.CHECK}>Çek (Vade Gerekir)</option>
                  <option value={PaymentMethod.PROMISSORY}>Senet (Vade Gerekir)</option>
               </Select>
               {(form.method === PaymentMethod.CHECK || form.method === PaymentMethod.PROMISSORY) ? (
                 <Input label="Vade Tarihi" type="date" onChange={e=>setForm({...form, maturity: e.target.value})} />
               ) : (
                 <Input label="Fatura Tarihi" type="date" value={new Date().toISOString().split('T')[0]} />
               )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[30px] border border-dashed border-slate-200 dark:border-slate-700">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ürün Ekleme</h4>
               <div className="flex gap-4">
                  <select className="flex-1 p-4 bg-white dark:bg-slate-800 rounded-2xl outline-none border dark:border-slate-700 text-sm font-bold dark:text-white" onChange={e=>setSelItem({...selItem, pid: e.target.value})}>
                     <option value="">Ürün Seçin...</option>
                     {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>)}
                  </select>
                  <input type="number" className="w-24 p-4 bg-white dark:bg-slate-800 rounded-2xl outline-none border dark:border-slate-700 text-sm font-bold text-center dark:text-white" value={selItem.qty} onChange={e=>setSelItem({...selItem, qty: Number(e.target.value)})} />
                  <button onClick={addItem} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={24}/></button>
               </div>
            </div>

            <div className="space-y-2">
               {form.items.map((it:any, idx:number)=>(
                 <div key={idx} className="flex justify-between items-center p-5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-[25px] group">
                    <span className="font-bold text-sm dark:text-white uppercase tracking-tight">{it.name} <span className="text-slate-400 font-medium">x{it.qty}</span></span>
                    <span className="font-black text-slate-900 dark:text-white tracking-tight">₺{it.total.toLocaleString()}</span>
                 </div>
               ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t dark:border-slate-700">
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GENEL TOPLAM</span>
               <span className="text-4xl font-black text-indigo-600 tracking-tighter">₺{form.items.reduce((a:any,b:any)=>a+b.total, 0).toLocaleString()}</span>
            </div>

            <button onClick={save} className="w-full bg-indigo-600 text-white py-6 rounded-[30px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition-all mt-4">Faturayı Onayla & Kes</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- AYARLAR --- **/
const SettingsView = ({ settings, setSettings }: any) => {
  const [form, setForm] = useState(settings);

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
       <div className="flex items-center gap-6 mb-12">
          <div className="p-5 bg-slate-900 text-white rounded-[30px] shadow-2xl"><Settings size={40}/></div>
          <div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Sistem Ayarları</h1>
             <p className="text-slate-400 font-bold text-sm">Firma bilgilerini ve tema tercihlerini yönetin.</p>
          </div>
       </div>

       <div className="bg-white dark:bg-slate-800 p-12 rounded-[50px] shadow-sm border dark:border-slate-700 space-y-10">
          <div className="space-y-6">
             <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] border-b dark:border-slate-700 pb-4">Firma Resmi Bilgileri</h4>
             <Input label="Resmi Firma Ünvanı" value={form.title} onChange={(e:any)=>setForm({...form, title: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <Input label="Vergi Kimlik No (VKN)" value={form.vkn} onChange={(e:any)=>setForm({...form, vkn: e.target.value})} />
                <Input label="Şehir" value={form.city} onChange={(e:any)=>setForm({...form, city: e.target.value})} />
             </div>
             <Input label="Açık Adres" value={form.address} onChange={(e:any)=>setForm({...form, address: e.target.value})} />
          </div>

          <div className="pt-6">
             <button onClick={() => { setSettings(form); alert('Ayarlar Kaydedildi!'); }} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">Değişiklikleri Uygula</button>
          </div>
          
          <div className="pt-10 border-t dark:border-slate-700 grid grid-cols-2 gap-6">
             <button onClick={()=>{
               const blob = new Blob([localStorage.getItem('mpro_products') || '[]'], {type:'application/json'});
               const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'yedek.json'; a.click();
             }} className="flex items-center justify-center gap-3 p-6 bg-slate-900 text-white rounded-[30px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"><HardDrive size={20}/> Verileri Yedekle</button>
             <button onClick={()=>{ if(confirm('Tüm veriler silinecek! Onaylıyor musunuz?')) { localStorage.clear(); window.location.reload(); }}} className="flex items-center justify-center gap-3 p-6 bg-rose-500 text-white rounded-[30px] font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl"><Trash2 size={20}/> Sistemi Sıfırla</button>
          </div>
       </div>
    </div>
  );
};

/** --- DİĞER MODÜLLER --- **/
const TransactionsView = ({ transactions, setTransactions }: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
    <h1 className="text-4xl font-black uppercase tracking-tight dark:text-white">Kasa Hareketleri</h1>
    <div className="bg-white dark:bg-slate-800 rounded-[40px] shadow-sm border dark:border-slate-700 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b dark:border-slate-700">
          <tr><th className="p-8">Tarih</th><th className="p-8">Açıklama</th><th className="p-8 text-center">Yöntem</th><th className="p-8 text-right">Tutar</th></tr>
        </thead>
        <tbody className="divide-y dark:divide-slate-700">
          {transactions.map((t:any) => (
            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all">
              <td className="p-8 text-slate-400 font-bold">{t.date}</td>
              <td className="p-8 font-black dark:text-white uppercase tracking-tight">{t.desc}</td>
              <td className="p-8 text-center"><span className="text-[10px] font-black px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full uppercase">{t.method || 'NAKİT'}</span></td>
              <td className={`p-8 text-right font-black text-xl ${t.type === 'GELİR' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'GELİR' ? '+' : '-'}₺{t.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ProposalsView = ({ proposals, setProposals, products, setInvoices, settings }: any) => (
  <div className="space-y-8">
     <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black uppercase tracking-tight dark:text-white">Fiyat Teklifleri</h1>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest"><Plus size={20}/></button>
     </div>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {proposals.map((p:any) => (
           <div key={p.id} className="bg-white dark:bg-slate-800 p-10 rounded-[40px] shadow-sm border-t-8 border-t-indigo-500">
              <div className="flex justify-between mb-4">
                 <h4 className="font-black text-xl dark:text-white uppercase tracking-tight">{p.customer}</h4>
                 <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{p.id}</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">₺{p.amount.toLocaleString()}</p>
              <div className="mt-8 flex gap-3">
                 <button className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Faturaya Dönüştür</button>
                 <button className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-400"><Printer size={18}/></button>
              </div>
           </div>
        ))}
     </div>
  </div>
);

const PersonnelView = ({ employees, setEmployees, setTransactions }: any) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black uppercase tracking-tight dark:text-white">Personel & Maaş</h1>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest"><Plus size={20}/></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       {employees.map((e:any) => (
          <div key={e.id} className="bg-white dark:bg-slate-800 p-8 rounded-[35px] border dark:border-slate-700 shadow-sm text-center group">
             <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center font-black text-2xl text-slate-300 mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">{e.name[0]}</div>
             <h4 className="font-black text-lg dark:text-white uppercase tracking-tight">{e.name}</h4>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{e.pos}</p>
             <div className="mt-6 pt-6 border-t dark:border-slate-700">
                <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Aylık Maaş</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">₺{e.sal.toLocaleString()}</p>
             </div>
             <button onClick={()=>{
               if(confirm('Maaş ödemesi yapılsın mı?')) {
                 setTransactions((prev:any)=>[{id:'MAAS-'+Date.now(), desc:'Maaş: '+e.name, amount:e.sal, type:'GİDER', date:new Date().toLocaleDateString('tr-TR'), method:'HAVALE'}, ...prev]);
                 alert('Maaş Gider Olarak İşlendi.');
               }
             }} className="w-full mt-6 bg-emerald-500/10 text-emerald-600 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Maaş Öde</button>
          </div>
       ))}
    </div>
  </div>
);

const ReportsView = ({ products, transactions, invoices }: any) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
  const catData = products.reduce((acc:any, p:any)=>{
    const ex = acc.find((x:any)=>x.name === p.cat);
    if(ex) ex.value += p.stock; else acc.push({name:p.cat, value:p.stock});
    return acc;
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
       <h1 className="text-4xl font-black uppercase tracking-tight dark:text-white">Raporlar & Analiz</h1>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[45px] shadow-sm border dark:border-slate-700 h-[450px]">
             <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-300 mb-8">Kategori Bazlı Stok Dağılımı</h3>
             <ResponsiveContainer width="100%" height="80%">
                <RePieChart>
                   <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {catData.map((_:any, i:number)=><Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                   </Pie>
                   <Tooltip />
                   <Legend />
                </RePieChart>
             </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[45px] shadow-sm border dark:border-slate-700">
             <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-300 mb-8">Performans Özeti</h3>
             <div className="space-y-6">
                <div className="flex justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[35px] border dark:border-slate-700 hover:scale-[1.03] transition-transform">
                   <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">En Çok Satan Ürün</span>
                   <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Laptop Pro X1</span>
                </div>
                <div className="flex justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[35px] border dark:border-slate-700 hover:scale-[1.03] transition-transform">
                   <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Yıllık Büyüme</span>
                   <span className="font-black text-emerald-500 uppercase tracking-tight">+24.5%</span>
                </div>
                <div className="flex justify-between p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[35px] border dark:border-slate-700 hover:scale-[1.03] transition-transform">
                   <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Fatura Tahsilat Oranı</span>
                   <span className="font-black text-blue-500 uppercase tracking-tight">89%</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const AIView = ({ products, transactions, settings }: any) => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{r:'ai', t:`Merhaba Mustafa Bey, ${settings.title} verileri önümde açık. Bugün neyi analiz etmemi istersiniz?`}]);
  const [load, setLoad] = useState(false);

  const ask = async () => {
    if(!msg.trim()) return;
    const ut = msg; setMsg("");
    setChat(c => [...c, {r:'user', t:ut}]);
    setLoad(true);
    try {
      const context = `Şirket: ${settings.title}, Stok: ${products.length} ürün, Kasa: ${transactions.reduce((a:any, b:any)=>a+(b.type==='GELİR'?b.amount:-b.amount), 0)} TL`;
      // Call ai.models.generateContent with model and contents directly
      const resp = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Sen bir profesyonel finans danışmanısın. ${context}. Kullanıcı: ${ut}` });
      setChat(c => [...c, {r:'ai', t:resp.text || "Şu an yanıt veremiyorum."}]);
    } catch { setChat(c => [...c, {r:'ai', t: "Bağlantı hatası oluştu."}]); }
    finally { setLoad(false); }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-160px)] animate-in fade-in duration-700">
       <div className="flex-1 bg-white dark:bg-slate-800 rounded-[50px] shadow-sm border dark:border-slate-700 overflow-y-auto p-12 space-y-8 custom-scrollbar">
          {chat.map((c, i)=>(
             <div key={i} className={`flex ${c.r==='user'?'justify-end':'justify-start'}`}>
                <div className={`p-6 rounded-[35px] max-w-[80%] text-sm font-medium leading-relaxed shadow-sm ${c.r==='user'?'bg-blue-600 text-white shadow-blue-500/20':'bg-slate-100 dark:bg-slate-700 dark:text-white'}`}>{c.t}</div>
             </div>
          ))}
          {load && <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Analiz yapılıyor...</div>}
       </div>
       <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl border dark:border-slate-700 flex gap-4">
          <input className="flex-1 bg-transparent outline-none px-6 font-bold dark:text-white" placeholder="AI Danışman'a bir soru sorun..." value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()}/>
          <button onClick={ask} className="bg-blue-600 text-white p-5 rounded-[28px] shadow-xl hover:bg-blue-700 active:scale-95 transition-all"><ArrowRight size={24}/></button>
       </div>
    </div>
  );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
