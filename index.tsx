
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Package, FileText, Wallet, Bot, Users, User,
  TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowRight, Plus, 
  Trash2, Edit, X, Printer, LogOut, Clock, CheckCircle2, FileSignature,
  Briefcase, PieChart, Search, Filter, ArrowUpRight, ArrowDownLeft, FileCode,
  Calendar, CreditCard, Banknote, Scroll, Zap, HardDrive, Download, Settings,
  ShieldCheck, ChevronRight, Menu, Phone, MapPin, Lock, Save, RefreshCw, Upload, Image as ImageIcon, Building2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';

/** --- YARDIMCI SERVİSLER --- **/
const storage = {
  get: (key: string, def: any) => {
    try {
      const val = localStorage.getItem('mpro_' + key);
      return val ? JSON.parse(val) : def;
    } catch (e) { return def; }
  },
  set: (key: string, val: any) => localStorage.setItem('mpro_' + key, JSON.stringify(val)),
  id: (pre: string) => pre + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/** --- BİLEŞENLER --- **/
const Modal = ({ isOpen, onClose, title, children, size = "max-w-lg" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl w-full ${size} overflow-hidden animate-in zoom-in duration-300 border border-white/10`}>
        <div className="flex items-center justify-between p-8 border-b dark:border-slate-700">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"><X size={24}/></button>
        </div>
        <div className="p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, icon: Icon, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{label}</label>
    <div className="relative group">
      {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"><Icon size={18}/></div>}
      <input className={`w-full ${Icon ? 'pl-12' : 'px-6'} py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all dark:text-white font-medium`} {...props} />
    </div>
  </div>
);

/** --- ANA UYGULAMA --- **/
const App = () => {
  const [isAuth, setIsAuth] = useState(storage.get('auth_status', false));
  const [passInput, setPassInput] = useState("");
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [systemPass, setSystemPass] = useState(storage.get('system_pass', '123456'));
  const [products, setProducts] = useState(storage.get('products', []));
  const [customers, setCustomers] = useState(storage.get('customers', []));
  const [invoices, setInvoices] = useState(storage.get('invoices', []));
  const [transactions, setTransactions] = useState(storage.get('transactions', []));
  const [proposals, setProposals] = useState(storage.get('proposals', []));
  const [employees, setEmployees] = useState(storage.get('employees', []));
  const [settings, setSettings] = useState(storage.get('settings', { title: 'Mustafa Ticaret', vkn: '', address: '', city: '', logo: '' }));

  useEffect(() => {
    storage.set('products', products);
    storage.set('customers', customers);
    storage.set('invoices', invoices);
    storage.set('transactions', transactions);
    storage.set('proposals', proposals);
    storage.set('employees', employees);
    storage.set('settings', settings);
    storage.set('system_pass', systemPass);
  }, [products, customers, invoices, transactions, proposals, employees, settings, systemPass]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    if (passInput === systemPass) {
      setIsAuth(true);
      storage.set('auth_status', true);
    } else {
      alert("Hatalı Şifre!");
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="bg-white p-12 rounded-[50px] shadow-2xl w-full max-w-md text-center">
          <div className="w-28 h-28 mx-auto mb-8 overflow-hidden rounded-3xl bg-slate-100 flex items-center justify-center shadow-xl">
             {settings.logo ? (
               <img src={settings.logo} className="w-full h-full object-cover" />
             ) : (
               <div className="text-5xl font-black text-blue-600">M</div>
             )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">{settings.title}</h1>
          <p className="text-slate-400 mb-10 font-bold text-xs uppercase tracking-widest">Yönetici Girişi</p>
          <div className="space-y-6">
            <input type="password" placeholder="••••••" className="w-full bg-slate-100 p-6 rounded-3xl text-center text-3xl tracking-[0.5em] outline-none focus:ring-8 ring-blue-500/10 border-2 border-transparent focus:border-blue-500 transition-all font-black" autoFocus value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black text-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl">Sistemi Aç <ArrowRight size={24} /></button>
          </div>
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
    { id: 'ai', label: 'AI Asistan', icon: Bot },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <aside className="w-80 bg-slate-950 text-white hidden lg:flex flex-col border-r border-slate-800 shadow-2xl">
        <div className="p-10 border-b border-slate-900 flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
             {settings.logo ? <img src={settings.logo} className="w-full h-full object-cover" /> : <div className="text-2xl font-black text-blue-600">M</div>}
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight uppercase tracking-tighter truncate w-40">{settings.title}</h2>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black mt-1 uppercase tracking-widest"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> Aktif</div>
          </div>
        </div>
        <nav className="flex-1 p-8 space-y-2 overflow-y-auto custom-scrollbar">
          {menu.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 px-8 py-5 rounded-[25px] transition-all font-black text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-white'}`}>
              <item.icon size={22}/> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-10 border-t border-slate-900">
           <button onClick={() => { storage.set('auth_status', false); window.location.reload(); }} className="w-full flex items-center justify-center gap-3 py-5 bg-red-500/10 text-red-400 rounded-[25px] hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase"><LogOut size={18}/> Çıkış</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-16">
        <div className="max-w-7xl mx-auto space-y-12">
          {activeTab === 'dashboard' && <DashboardView products={products} transactions={transactions} invoices={invoices} />}
          {activeTab === 'inventory' && <InventoryView products={products} setProducts={setProducts} />}
          {activeTab === 'customers' && <CustomersView customers={customers} setCustomers={setCustomers} invoices={invoices} transactions={transactions} setTransactions={setTransactions} />}
          {activeTab === 'invoices' && <InvoicesView invoices={invoices} setInvoices={setInvoices} products={products} setProducts={setProducts} setTransactions={setTransactions} settings={settings} />}
          {activeTab === 'proposals' && <ProposalsView proposals={proposals} setProposals={setProposals} products={products} setProducts={setProducts} setInvoices={setInvoices} setTransactions={setTransactions} />}
          {activeTab === 'transactions' && <TransactionsView transactions={transactions} setTransactions={setTransactions} />}
          {activeTab === 'personnel' && <PersonnelView employees={employees} setEmployees={setEmployees} setTransactions={setTransactions} />}
          {activeTab === 'reports' && <ReportsView products={products} transactions={transactions} invoices={invoices} />}
          {activeTab === 'ai' && <AIView products={products} transactions={transactions} settings={settings} />}
          {activeTab === 'settings' && <SettingsView settings={settings} setSettings={setSettings} systemPass={systemPass} setSystemPass={setSystemPass} products={products} customers={customers} invoices={invoices} transactions={transactions} employees={employees} proposals={proposals} />}
        </div>
      </main>
    </div>
  );
};

/** --- GÖRÜNÜMLER --- **/

const DashboardView = ({ products, transactions, invoices }: any) => {
  const inc = transactions.filter((t:any) => t.type === 'GELİR').reduce((a:any, b:any) => a + b.amount, 0);
  const exp = transactions.filter((t:any) => t.type === 'GİDER').reduce((a:any, b:any) => a + b.amount, 0);
  const crit = products.filter((p:any) => p.stock <= (p.min || 5)).length;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end">
        <div><h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">Mustafa Bey, Hoşgeldiniz 👋</h1></div>
        <div className="bg-white dark:bg-slate-800 px-10 py-6 rounded-[40px] shadow-2xl border dark:border-slate-700">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Kasa Mevcudu</p>
           <div className="text-4xl font-black text-blue-600">₺{(inc - exp).toLocaleString()}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatItem title="Satışlar" value={`₺${inc.toLocaleString()}`} color="bg-emerald-500" icon={TrendingUp} />
        <StatItem title="Giderler" value={`₺${exp.toLocaleString()}`} color="bg-rose-500" icon={TrendingDown} />
        <StatItem title="Kritik Stok" value={crit} color="bg-orange-500" icon={AlertTriangle} />
        <StatItem title="Bekleyen Tahsilat" value={invoices.filter((i:any)=>i.status === 'BEKLİYOR').length} color="bg-indigo-500" icon={Clock} />
      </div>
    </div>
  );
};

const StatItem = ({ title, value, color, icon: Icon }: any) => (
  <div className="bg-white dark:bg-slate-800 p-10 rounded-[45px] shadow-sm border dark:border-slate-700 flex items-center justify-between group">
    <div><p className="text-[10px] font-black text-slate-400 uppercase mb-2">{title}</p><h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3></div>
    <div className={`p-6 rounded-[30px] ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}><Icon className={color.replace('bg-', 'text-')} size={32} /></div>
  </div>
);

/** --- STOK --- **/
const InventoryView = ({ products, setProducts }: any) => {
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', cat: 'Genel', stock: 0, price: 0, min: 5 });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  const categories = useMemo(() => ["ALL", ...Array.from(new Set(products.map((p:any) => p.cat)))], [products]);

  const filtered = products.filter((p:any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === "ALL" || p.cat === catFilter;
    return matchesSearch && matchesCat;
  });

  const save = () => {
    if(!form.name) return;
    if(editingId) {
      setProducts(products.map((p:any) => p.id === editingId ? { ...form, id: editingId } : p));
    } else {
      setProducts([{ ...form, id: storage.id('STK') }, ...products]);
    }
    setModal(false);
    setEditingId(null);
    setForm({ name: '', sku: '', cat: 'Genel', stock: 0, price: 0, min: 5 });
  };

  const edit = (p: any) => {
    setEditingId(p.id);
    setForm({ name: p.name, sku: p.sku, cat: p.cat, stock: p.stock, price: p.price, min: p.min });
    setModal(true);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black uppercase tracking-tighter dark:text-white">Stok Takibi</h1>
        <button onClick={() => { setEditingId(null); setForm({ name: '', sku: '', cat: 'Genel', stock: 0, price: 0, min: 5 }); setModal(true); }} className="bg-blue-600 text-white px-10 py-5 rounded-[30px] flex items-center gap-3 font-black text-sm uppercase shadow-2xl hover:bg-blue-700"><Plus size={24}/> Ürün Ekle</button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-800 border rounded-[25px] outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="Ürün veya kod ara..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="px-8 py-5 bg-white dark:bg-slate-800 border rounded-[25px] font-black text-xs uppercase outline-none" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          {categories.map((c:any) => <option key={c} value={c}>{c === 'ALL' ? 'TÜM KATEGORİLER' : c}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[50px] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-[0.3em] border-b">
            <tr><th className="p-10">Ürün Bilgisi</th><th className="p-10 text-center">Kategori</th><th className="p-10 text-center">Mevcut</th><th className="p-10 text-right">Fiyat</th><th className="p-10 text-right">İşlem</th></tr>
          </thead>
          <tbody className="divide-y font-medium">
            {filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                <td className="p-10"><div className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">{p.name}</div><div className="text-[10px] text-slate-400 font-bold mt-1">KOD: {p.sku || p.id}</div></td>
                <td className="p-10 text-center"><span className="bg-slate-100 dark:bg-slate-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase">{p.cat}</span></td>
                <td className="p-10 text-center"><div className={`text-xl font-black ${p.stock <= (p.min || 5) ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{p.stock} Adet</div></td>
                <td className="p-10 text-right font-black text-2xl tracking-tighter">₺{Number(p.price).toLocaleString()}</td>
                <td className="p-10 text-right flex justify-end gap-2">
                  <button onClick={() => edit(p)} className="p-4 text-slate-300 hover:text-blue-500 transition-colors"><Edit size={22}/></button>
                  <button onClick={() => { if(confirm('Silsin mi?')) setProducts(products.filter((x:any)=>x.id !== p.id)) }} className="p-4 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={22}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editingId ? "Stok Kartı Düzenle" : "Yeni Stok Kartı"}>
         <div className="space-y-8">
            <Input label="Ürün Adı" icon={Package} value={form.name} onChange={(e:any)=>setForm({...form, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-6"><Input label="Kategori" icon={Filter} value={form.cat} onChange={(e:any)=>setForm({...form, cat: e.target.value})} /><Input label="Stok Kodu" icon={FileCode} value={form.sku} onChange={(e:any)=>setForm({...form, sku: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-6"><Input label="Mevcut Stok" type="number" value={form.stock} onChange={(e:any)=>setForm({...form, stock: Number(e.target.value)})} /><Input label="Birim Fiyat" type="number" value={form.price} onChange={(e:any)=>setForm({...form, price: Number(e.target.value)})} /><Input label="Kritik Limit" type="number" value={form.min} onChange={(e:any)=>setForm({...form, min: Number(e.target.value)})} /></div>
            <button onClick={save} className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-700 mt-4 active:scale-95">{editingId ? 'Güncelle' : 'Kaydet'}</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- CARİ HESAPLAR --- **/
const CustomersView = ({ customers, setCustomers, invoices, transactions, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', city: '', type: 'MÜŞTERİ' });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const getBalance = (name: string) => {
    const inv = invoices.filter((i:any) => i.customer === name).reduce((a:any, b:any) => a + b.amount, 0);
    const pay = transactions.filter((t:any) => t.desc.includes(name)).reduce((a:any, t:any) => a + (t.type === 'GELİR' ? t.amount : -t.amount), 0);
    return inv - pay;
  };

  const filtered = customers.filter((c:any) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || c.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const save = () => {
    if(!form.name) return;
    if(editingId) {
      setCustomers(customers.map((c:any) => c.id === editingId ? { ...form, id: editingId } : c));
      if(selected?.id === editingId) setSelected({ ...form, id: editingId });
    } else {
      setCustomers([{ ...form, id: storage.id('CARI') }, ...customers]);
    }
    setModal(false);
    setEditingId(null);
  };

  const edit = () => {
    if(!selected) return;
    setEditingId(selected.id);
    setForm({ name: selected.name, phone: selected.phone, city: selected.city, type: selected.type });
    setModal(true);
  };

  const handleQuickPayment = () => {
     if(!selected) return;
     const amount = prompt(`${selected.name} için alınacak tahsilat tutarını girin:`);
     if(!amount || isNaN(Number(amount))) return;
     const val = Number(amount);
     setTransactions([{ id: 'TX-'+Date.now(), desc: `Tahsilat: ${selected.name}`, amount: val, type: 'GELİR', date: new Date().toLocaleDateString('tr-TR'), method: 'NAKİT' }, ...transactions]);
     alert('Tahsilat başarıyla işlendi.');
  };

  const confirmDelete = () => {
    if(!selected) return;
    const newList = customers.filter((c:any) => c.id !== selected.id);
    setCustomers(newList);
    setSelected(null);
    setDeleteConfirmModal(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-1 space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white">Cariler</h1>
          <button onClick={() => { setEditingId(null); setForm({ name: '', phone: '', city: '', type: 'MÜŞTERİ' }); setModal(true); }} className="bg-slate-900 text-white p-5 rounded-[25px] hover:bg-black"><Plus size={28}/></button>
        </div>
        
        <div className="space-y-4">
           <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl overflow-hidden">
              <button onClick={()=>setTypeFilter("ALL")} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${typeFilter==="ALL"?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>Tümü</button>
              <button onClick={()=>setTypeFilter("MÜŞTERİ")} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${typeFilter==="MÜŞTERİ"?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>Müşteri</button>
              <button onClick={()=>setTypeFilter("TEDARİKÇİ")} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${typeFilter==="TEDARİKÇİ"?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>Tedarikçi</button>
           </div>
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl outline-none font-bold text-sm" placeholder="İsim ara..." value={search} onChange={e=>setSearch(e.target.value)} />
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[50px] shadow-sm border h-[calc(100vh-420px)] overflow-y-auto custom-scrollbar">
           {filtered.map((c: any) => {
             const b = getBalance(c.name);
             return (
               <div key={c.id} onClick={() => setSelected(c)} className={`p-8 border-b cursor-pointer transition-all hover:bg-slate-50 ${selected?.id === c.id ? 'bg-blue-50 border-l-[10px] border-l-blue-600' : ''}`}>
                  <div className="flex justify-between items-center">
                    <div><div className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-base">{c.name}</div><div className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{c.type}</div></div>
                    <div className={`font-black text-right ${b > 0 ? 'text-rose-500' : 'text-emerald-500'}`}><div className="text-lg tracking-tighter">₺{Math.abs(b).toLocaleString()}</div></div>
                  </div>
               </div>
             );
           })}
        </div>
      </div>
      <div className="lg:col-span-2">
         {selected ? (
           <div className="bg-white dark:bg-slate-800 rounded-[60px] shadow-2xl border p-12 h-full flex flex-col">
              <div className="flex justify-between items-start mb-16">
                 <div>
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-4">{selected.name}</h2>
                    <div className="flex gap-6 text-sm font-black text-slate-400 uppercase">
                       <span className="flex items-center gap-2"><Phone size={18} className="text-blue-500"/> {selected.phone || 'RWE'}</span>
                       <span className="flex items-center gap-2"><MapPin size={18} className="text-rose-500"/> {selected.city || 'RWE'}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-4">
                    <div className={`p-10 rounded-[40px] text-center shadow-xl ${getBalance(selected.name) > 0 ? 'bg-rose-50 border-rose-100 border' : 'bg-emerald-50 border-emerald-100 border'}`}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Bakiye</p>
                        <div className={`text-4xl font-black tracking-tighter ${getBalance(selected.name) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₺{Math.abs(getBalance(selected.name)).toLocaleString()}</div>
                    </div>
                    <button onClick={edit} className="flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/> Cariyi Düzenle</button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                 <h4 className="font-black text-xs uppercase text-slate-300 border-b pb-6 mb-8 tracking-[0.3em]">Hesap Ekstresi</h4>
                 <div className="space-y-4">
                    {invoices.filter((i:any)=>i.customer === selected.name).map((inv:any)=>(
                       <div key={inv.id} className="flex justify-between items-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[35px]">
                          <div><div className="text-base font-black dark:text-white uppercase tracking-tight">Satış Faturası <span className="text-blue-500">#{inv.id}</span></div><div className="text-[11px] font-bold text-slate-400 mt-1 uppercase">{inv.date}</div></div>
                          <div className="font-black text-2xl text-rose-500 tracking-tighter">+₺{inv.amount.toLocaleString()}</div>
                       </div>
                    ))}
                    {transactions.filter((t:any)=>t.desc.includes(selected.name)).map((tx:any)=>(
                       <div key={tx.id} className="flex justify-between items-center p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-[35px]">
                          <div><div className="text-base font-black text-emerald-800 uppercase tracking-tight">Tahsilat / Ödeme</div><div className="text-[11px] font-bold text-emerald-600 mt-1 uppercase">{tx.date}</div></div>
                          <div className="font-black text-2xl text-emerald-600 tracking-tighter">-₺{tx.amount.toLocaleString()}</div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-6">
                 <button onClick={handleQuickPayment} className="bg-emerald-500 text-white py-8 rounded-[35px] font-black uppercase shadow-2xl hover:bg-emerald-600 flex items-center justify-center gap-4 text-sm active:scale-95 transition-transform"><ArrowDownLeft size={24}/> Tahsilat Al</button>
                 <button onClick={() => setDeleteConfirmModal(true)} className="bg-red-500 text-white py-8 rounded-[35px] font-black uppercase shadow-2xl hover:bg-red-600 flex items-center justify-center gap-4 text-sm active:scale-95 transition-transform"><Trash2 size={24}/> Kaydı Sil</button>
              </div>
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center text-slate-300 text-center"><Users size={80} className="mb-8 opacity-20" /><p className="font-black uppercase tracking-[0.3em] text-sm animate-pulse">Lütfen Bir Cari Seçin</p></div>
         )}
      </div>

      {/* Kayıt Silme Onay Modalı */}
      <Modal isOpen={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} title="Kaydı Kalıcı Olarak Sil">
         <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <AlertTriangle size={48} />
            </div>
            <p className="text-lg font-bold text-slate-600">
               <strong>{selected?.name}</strong> carisini ve tüm hesap hareketlerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-4">
               <button onClick={() => setDeleteConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-[20px] font-black uppercase text-xs">Vazgeç</button>
               <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-[20px] font-black uppercase text-xs shadow-lg shadow-rose-600/20">Evet, Sil</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editingId ? "Cari Hesabı Düzenle" : "Yeni Cari Hesabı"}>
         <div className="space-y-8">
            <Input label="Ünvan / İsim" icon={Users} value={form.name} onChange={(e:any)=>setForm({...form, name: e.target.value})} />
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cari Tipi</label><select value={form.type} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none appearance-none font-bold" onChange={(e:any)=>setForm({...form, type: e.target.value})}><option value="MÜŞTERİ">Müşteri (Alıcı)</option><option value="TEDARİKÇİ">Tedarikçi (Satıcı)</option></select></div>
            <div className="grid grid-cols-2 gap-6"><Input label="Telefon" icon={Phone} value={form.phone} onChange={(e:any)=>setForm({...form, phone: e.target.value})} /><Input label="Şehir" icon={MapPin} value={form.city} onChange={(e:any)=>setForm({...form, city: e.target.value})} /></div>
            <button onClick={save} className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95">{editingId ? 'Güncelle' : 'Cariyi Kaydet'}</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- FATURALAR --- **/
const InvoicesView = ({ invoices, setInvoices, products, setProducts, setTransactions, settings }: any) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR'), method: 'NAKİT' });
  const [selItem, setSelItem] = useState({ pid: '', qty: 1 });
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((i:any) => i.customer.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if(!form.customer || form.items.length === 0) return;
    const total = form.items.reduce((a:any,b:any)=>a+b.total, 0);
    const id = storage.id('FAT');
    setInvoices([{ ...form, id, amount: total, status: 'ÖDENDİ' }, ...invoices]);
    setTransactions((prev:any) => [{ id: 'TX-'+id, desc: `Fatura: ${form.customer}`, amount: total, type: 'GELİR', date: form.date, method: form.method }, ...prev]);
    setProducts(products.map((p:any) => { const line = form.items.find((i:any)=>i.id === p.id); return line ? { ...p, stock: p.stock - line.qty } : p; }));
    setModal(false);
    setForm({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR'), method: 'NAKİT' });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Faturalar</h1>
        <button onClick={() => setModal(true)} className="bg-indigo-600 text-white px-10 py-5 rounded-[30px] flex items-center gap-3 font-black text-sm uppercase shadow-2xl"><Plus size={24}/> Fatura Kes</button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-800 border rounded-[25px] outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="Müşteri adına göre ara..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[50px] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase border-b">
            <tr><th className="p-10">Fatura No</th><th className="p-10">Müşteri</th><th className="p-10 text-center">Ödeme</th><th className="p-10 text-right">Toplam</th><th className="p-10 text-right">İşlem</th></tr>
          </thead>
          <tbody className="divide-y font-medium">
            {filtered.map((i: any) => (
              <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                <td className="p-10 font-black text-indigo-600 text-lg">{i.id}</td>
                <td className="p-10 font-black text-slate-900 dark:text-white uppercase tracking-tight text-lg">{i.customer}</td>
                <td className="p-10 text-center"><span className="bg-indigo-50 text-indigo-600 px-5 py-2 rounded-2xl text-[10px] font-black uppercase">{i.method}</span></td>
                <td className="p-10 text-right font-black text-2xl tracking-tighter">₺{i.amount.toLocaleString()}</td>
                <td className="p-10 text-right flex justify-end gap-2">
                   <button onClick={()=>window.print()} className="p-4 text-slate-300 hover:text-blue-500"><Printer size={22}/></button>
                   <button onClick={() => { if(confirm('Silsin mi?')) setInvoices(invoices.filter((x:any)=>x.id !== i.id)) }} className="p-4 text-slate-300 hover:text-red-500"><Trash2 size={22}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni Fatura Oluştur" size="max-w-2xl">
         <div className="space-y-8">
            <Input label="Müşteri Seçin" icon={Search} onChange={(e:any)=>setForm({...form, customer: e.target.value})} />
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed">
               <div className="flex gap-4">
                  <select className="flex-1 p-5 bg-white rounded-[25px] outline-none font-black text-sm" onChange={(e:any)=>setSelItem({...selItem, pid: e.target.value})}>
                     <option value="">Ürün Seçin...</option>
                     {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} (₺{p.price})</option>)}
                  </select>
                  <input type="number" className="w-24 p-5 bg-white rounded-[25px] font-black text-center" value={selItem.qty} onChange={(e:any)=>setSelItem({...selItem, qty: Number(e.target.value)})} />
                  <button onClick={()=>{
                    const p = products.find((x:any)=>x.id === selItem.pid);
                    if(p) setForm({...form, items: [...form.items, {...p, qty: selItem.qty, total: p.price * selItem.qty}]});
                  }} className="bg-slate-900 text-white p-5 rounded-[25px]"><Plus size={28}/></button>
               </div>
            </div>
            <div className="space-y-3">{form.items.map((it:any, idx:number)=>(<div key={idx} className="flex justify-between items-center p-6 bg-white border rounded-[30px] font-black uppercase text-sm"><span>{it.name} x{it.qty}</span><span>₺{it.total.toLocaleString()}</span></div>))}</div>
            <div className="flex justify-between items-center pt-10 border-t-2"><span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">Genel Toplam</span><span className="text-5xl font-black text-indigo-600 tracking-tighter">₺{form.items.reduce((a:any,b:any)=>a+b.total, 0).toLocaleString()}</span></div>
            <button onClick={save} className="w-full bg-indigo-600 text-white py-7 rounded-[40px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-700 active:scale-95">Faturayı Kes</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- TEKLİFLER --- **/
const ProposalsView = ({ proposals, setProposals, products, setProducts, setInvoices, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR') });
  const [selItem, setSelItem] = useState({ pid: '', qty: 1 });

  const save = () => {
    if(!form.customer || form.items.length === 0) return;
    const total = form.items.reduce((a:any,b:any)=>a+b.total, 0);
    if(editingId) {
      setProposals(proposals.map((p:any) => p.id === editingId ? { ...form, id: editingId, amount: total } : p));
    } else {
      setProposals([{ ...form, id: storage.id('TEK'), amount: total }, ...proposals]);
    }
    setModal(false);
    setEditingId(null);
    setForm({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR') });
  };

  const edit = (p: any) => {
    setEditingId(p.id);
    setForm({ customer: p.customer, items: p.items, date: p.date });
    setModal(true);
  };

  const convertToInvoice = (p: any) => {
    if(!confirm('Bu teklifi faturaya dönüştürmek istediğinize emin misiniz?')) return;
    const invId = storage.id('FAT');
    setInvoices((prev: any) => [{ ...p, id: invId, status: 'ÖDENDİ' }, ...prev]);
    setTransactions((prev: any) => [{ id: 'TX-'+invId, desc: `Teklif: ${p.customer}`, amount: p.amount, type: 'GELİR', date: new Date().toLocaleDateString('tr-TR'), method: 'NAKİT' }, ...prev]);
    setProducts((prev: any) => prev.map((prod: any) => {
       const line = p.items.find((item: any) => item.id === prod.id);
       return line ? { ...prod, stock: prod.stock - line.qty } : prod;
    }));
    setProposals((prev: any) => prev.filter((x: any) => x.id !== p.id));
    alert('Faturaya Dönüştürüldü!');
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Fiyat Teklifleri</h1>
        <button onClick={() => { setEditingId(null); setForm({ customer: '', items: [], date: new Date().toLocaleDateString('tr-TR') }); setModal(true); }} className="bg-indigo-600 text-white px-10 py-5 rounded-[30px] flex items-center gap-3 font-black text-sm uppercase shadow-2xl active:scale-95"><Plus size={24}/> Teklif Oluştur</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {proposals.map((p: any) => (
           <div key={p.id} className="bg-white dark:bg-slate-800 p-10 rounded-[45px] shadow-sm border-t-8 border-t-indigo-500">
              <div className="flex justify-between mb-6">
                 <div><h4 className="font-black text-2xl dark:text-white uppercase tracking-tight">{p.customer}</h4><p className="text-xs text-slate-400 font-bold">{p.date}</p></div>
                 <div className="flex flex-col items-end gap-2">
                   <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full">{p.id}</span>
                   <button onClick={() => edit(p)} className="p-2 text-slate-400 hover:text-blue-500"><Edit size={18}/></button>
                 </div>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">₺{Number(p.amount).toLocaleString()}</div>
              <div className="flex gap-4">
                 <button onClick={() => convertToInvoice(p)} className="flex-1 bg-indigo-600 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 active:scale-95">Faturaya Dönüştür</button>
                 <button onClick={() => { if(confirm('Silsin mi?')) setProposals(proposals.filter((x:any)=>x.id !== p.id)) }} className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-[20px] hover:text-red-500"><Trash2 size={20}/></button>
              </div>
           </div>
        ))}
      </div>
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editingId ? "Fiyat Teklifi Düzenle" : "Yeni Fiyat Teklifi"}>
         <div className="space-y-8">
            <Input label="Müşteri / Cari" icon={Users} value={form.customer} onChange={(e:any)=>setForm({...form, customer: e.target.value})} />
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed">
               <div className="flex gap-4">
                  <select className="flex-1 p-5 bg-white rounded-[25px] outline-none font-black text-sm" onChange={(e:any)=>setSelItem({...selItem, pid: e.target.value})}>
                     <option value="">Ürün Seçin...</option>
                     {products.map((p:any)=><option key={p.id} value={p.id}>{p.name} (₺{p.price})</option>)}
                  </select>
                  <input type="number" className="w-24 p-5 bg-white rounded-[25px] font-black text-center" value={selItem.qty} onChange={(e:any)=>setSelItem({...selItem, qty: Number(e.target.value)})} />
                  <button onClick={()=>{
                    const p = products.find((x:any)=>x.id === selItem.pid);
                    if(p) setForm({...form, items: [...form.items, {...p, qty: selItem.qty, total: p.price * selItem.qty}]});
                  }} className="bg-slate-900 text-white p-5 rounded-[25px]"><Plus size={28}/></button>
               </div>
            </div>
            <div className="space-y-3">{form.items.map((it:any, idx:number)=>(<div key={idx} className="flex justify-between items-center p-6 bg-white border rounded-[30px] font-black uppercase text-sm"><span>{it.name} x{it.qty}</span><span>₺{it.total.toLocaleString()}</span><button onClick={() => setForm({...form, items: form.items.filter((_:any,i:number)=>i!==idx)})} className="text-red-500"><X size={14}/></button></div>))}</div>
            <button onClick={save} className="w-full bg-indigo-600 text-white py-6 rounded-[30px] font-black uppercase shadow-2xl active:scale-95">{editingId ? 'Güncelle' : 'Teklifi Kaydet'}</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- PERSONEL --- **/
const PersonnelView = ({ employees, setEmployees, setTransactions }: any) => {
  const [modal, setModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [form, setForm] = useState({ name: '', pos: '', sal: 0 });
  const [search, setSearch] = useState("");

  const filtered = employees.filter((e:any) => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.pos.toLowerCase().includes(search.toLowerCase())
  );

  const save = () => {
    if(!form.name || !form.sal) return;
    if(editingId) {
      setEmployees(employees.map((e:any) => e.id === editingId ? { ...form, id: editingId } : e));
    } else {
      setEmployees([{ ...form, id: storage.id('EMP') }, ...employees]);
    }
    setModal(false);
    setEditingId(null);
    setForm({ name: '', pos: '', sal: 0 });
  };

  const edit = (e: any) => {
    setEditingId(e.id);
    setForm({ name: e.name, pos: e.pos, sal: e.sal });
    setModal(true);
  };

  const paySalary = (e: any) => {
    if(!confirm(`${e.name} için maaş ödemesini onaylıyor musunuz?`)) return;
    setTransactions((prev:any) => [{ id: 'MAAS-'+Date.now(), desc: `Maaş Ödemesi: ${e.name}`, amount: Number(e.sal), type: 'GİDER', date: new Date().toLocaleDateString('tr-TR'), method: 'HAVALE' }, ...prev]);
    alert('Maaş başarıyla ödendi ve kasa hareketlerine işlendi.');
  };

  const confirmDelete = () => {
    if(!selectedEmp) return;
    setEmployees(employees.filter((x:any) => x.id !== selectedEmp.id));
    setDeleteConfirmModal(false);
    setSelectedEmp(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-black uppercase tracking-tighter dark:text-white">Personel</h1>
        <button onClick={() => { setEditingId(null); setForm({ name: '', pos: '', sal: 0 }); setModal(true); }} className="bg-blue-600 text-white px-10 py-5 rounded-[30px] flex items-center gap-3 font-black text-sm uppercase shadow-2xl active:scale-95"><Plus size={24}/> Personel Ekle</button>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-800 border rounded-[25px] outline-none focus:ring-4 ring-blue-500/10 font-bold" placeholder="İsim veya pozisyona göre ara..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
         {filtered.map((e: any) => (
            <div key={e.id} className="bg-white dark:bg-slate-800 p-10 rounded-[50px] shadow-sm border group text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
               <button onClick={() => edit(e)} className="absolute top-8 right-8 p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit size={22}/></button>
               <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700 rounded-3xl flex items-center justify-center font-black text-4xl text-slate-300 mx-auto mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">{e.name[0]}</div>
               <h4 className="font-black text-3xl dark:text-white uppercase tracking-tight mb-2 tracking-tighter">{e.name}</h4>
               <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{e.pos}</p>
               <div className="mt-8 pt-8 border-t dark:border-slate-700"><p className="text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">Aylık Maaş</p><p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₺{Number(e.sal).toLocaleString()}</p></div>
               <button onClick={() => paySalary(e)} className="w-full mt-10 bg-emerald-50 text-emerald-600 py-6 rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">Maaş Öde</button>
               <button onClick={() => { setSelectedEmp(e); setDeleteConfirmModal(true); }} className="mt-6 text-[11px] text-slate-300 font-black uppercase tracking-[0.2em] hover:text-red-500 transition-colors cursor-pointer">Personeli Çıkar</button>
            </div>
         ))}
      </div>

      {/* Personel Silme Onay Modalı */}
      <Modal isOpen={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} title="Personel Kaydını Sil">
         <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
               <AlertTriangle size={48} />
            </div>
            <p className="text-lg font-bold text-slate-600">
               <strong>{selectedEmp?.name}</strong> isimli personeli sistemden çıkarmak istediğinize emin misiniz?
            </p>
            <div className="flex gap-4">
               <button onClick={() => setDeleteConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-[20px] font-black uppercase text-xs">Vazgeç</button>
               <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-[20px] font-black uppercase text-xs">Evet, Çıkar</button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editingId ? "Personel Bilgilerini Düzenle" : "Personel Kaydı"}>
         <div className="space-y-8">
            <Input label="Ad Soyad" icon={Users} value={form.name} onChange={(e:any)=>setForm({...form, name: e.target.value})} />
            <Input label="Pozisyon" icon={Briefcase} value={form.pos} onChange={(e:any)=>setForm({...form, pos: e.target.value})} />
            <Input label="Maaş (₺)" type="number" icon={DollarSign} value={form.sal} onChange={(e:any)=>setForm({...form, sal: Number(e.target.value)})} />
            <button onClick={save} className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95">{editingId ? 'Güncelle' : 'Personeli Kaydet'}</button>
         </div>
      </Modal>
    </div>
  );
};

/** --- AYARLAR --- **/
const SettingsView = ({ settings, setSettings, systemPass, setSystemPass, products, customers, invoices, transactions, employees, proposals }: any) => {
  const [form, setForm] = useState(settings);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: any) => {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onloadend = () => { setForm({...form, logo: reader.result as string}); };
      reader.readAsDataURL(file);
    }
  };

  const save = () => {
    if(newPass.trim().length > 0) {
      if(oldPass !== systemPass) {
        alert("Hata: Mevcut şifreniz yanlış!");
        return;
      }
      if(newPass.trim().length < 6) {
        alert("Hata: Yeni şifre en az 6 karakter olmalıdır!");
        return;
      }
      setSystemPass(newPass);
    }
    
    setSettings(form);
    alert('Ayarlar Başarıyla Kaydedildi.');
    setOldPass("");
    setNewPass("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
       <div className="flex items-center gap-8 mb-16">
          <div className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl shadow-blue-500/20"><Settings size={48}/></div>
          <div><h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Ayarlar</h1><p className="text-slate-400 font-bold text-lg">Kurumsal Kimlik ve Güvenlik</p></div>
       </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[60px] shadow-sm border space-y-10">
             <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] border-b pb-6 flex items-center gap-2"><Building2 size={16}/> Kurumsal Bilgiler</h4>
             <div className="flex flex-col items-center gap-6 p-8 bg-slate-50 dark:bg-slate-900 rounded-[35px] border border-dashed">
                <div className="w-24 h-24 bg-white rounded-3xl overflow-hidden shadow-xl flex items-center justify-center">
                   {form.logo ? <img src={form.logo} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-slate-300"/>}
                </div>
                <input type="file" ref={fileRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600"><Upload size={14}/> Firma Logosunu Değiştir</button>
             </div>
             <Input label="Firma Ünvanı" icon={Briefcase} value={form.title} onChange={(e:any)=>setForm({...form, title: e.target.value})} />
             <Input label="VKN / TCKN" icon={FileCode} value={form.vkn} onChange={(e:any)=>setForm({...form, vkn: e.target.value})} />
          </div>
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[60px] shadow-sm border space-y-10">
             <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.4em] border-b pb-6 flex items-center gap-2"><ShieldCheck size={16}/> Güvenlik Ayarları</h4>
             <div className="p-8 bg-orange-50 dark:bg-orange-900/10 rounded-[35px] border border-orange-100">
                <p className="text-xs text-orange-700 font-bold mb-6">Şifrenizi güncellemek için önce mevcut şifreyi girin.</p>
                <div className="space-y-4">
                  <Input label="MEVCUT ŞİFRE" type="password" icon={Lock} value={oldPass} onChange={(e:any)=>setOldPass(e.target.value)} />
                  <Input label="YENİ GİRİŞ ŞİFRESİ" type="password" icon={Lock} value={newPass} placeholder="En az 6 hane" onChange={(e:any)=>setNewPass(e.target.value)} />
                </div>
             </div>
             <div className="pt-10 border-t grid grid-cols-2 gap-6">
                <button onClick={()=>{
                  const blob = new Blob([JSON.stringify({products, customers, invoices, transactions, employees, proposals, settings}, null, 2)], {type:'application/json'});
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'yedek.json'; a.click();
                }} className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-900 text-white rounded-[40px] hover:bg-black active:scale-95"><HardDrive size={24}/><span className="text-[10px] font-black uppercase">Veri Yedekle</span></button>
                <button onClick={()=>{ if(confirm('Tüm veriler silinecek! Onaylıyor musunuz?')) { localStorage.clear(); window.location.reload(); }}} className="flex flex-col items-center justify-center gap-3 p-8 bg-rose-500 text-white rounded-[40px] hover:bg-rose-600 active:scale-95"><RefreshCw size={24}/><span className="text-[10px] font-black uppercase">Sistemi Sıfırla</span></button>
             </div>
          </div>
       </div>
       <button onClick={save} className="w-full bg-blue-600 text-white py-8 rounded-[45px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-700 active:scale-95 text-xl flex items-center justify-center gap-4"><Save size={28}/> Ayarları Kaydet</button>
    </div>
  );
};

/** --- DİĞER MODÜLLER --- **/
const TransactionsView = ({ transactions, setTransactions }: any) => {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t:any) => {
    const matchesSearch = t.desc.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-10">
      <h1 className="text-5xl font-black uppercase tracking-tighter dark:text-white">Kasa Hareketleri</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
         <div className="relative flex-1">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-800 border rounded-[25px] outline-none font-bold" placeholder="İşlem veya açıklama ara..." value={search} onChange={e=>setSearch(e.target.value)} />
         </div>
         <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-[25px] overflow-hidden">
            <button onClick={()=>setTypeFilter("ALL")} className={`px-8 py-4 text-[10px] font-black uppercase rounded-[22px] transition-all ${typeFilter==="ALL"?'bg-white text-blue-600 shadow-sm':'text-slate-500'}`}>Tümü</button>
            <button onClick={()=>setTypeFilter("GELİR")} className={`px-8 py-4 text-[10px] font-black uppercase rounded-[22px] transition-all ${typeFilter==="GELİR"?'bg-white text-emerald-600 shadow-sm':'text-slate-500'}`}>Gelir</button>
            <button onClick={()=>setTypeFilter("GİDER")} className={`px-8 py-4 text-[10px] font-black uppercase rounded-[22px] transition-all ${typeFilter==="GİDER"?'bg-white text-rose-600 shadow-sm':'text-slate-500'}`}>Gider</button>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[50px] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase border-b">
            <tr><th className="p-10">Tarih</th><th className="p-10">Açıklama</th><th className="p-10 text-center">Yöntem</th><th className="p-10 text-right">Tutar</th></tr>
          </thead>
          <tbody className="divide-y font-medium">
            {filtered.map((t:any) => (
              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                <td className="p-10 text-slate-400 font-bold">{t.date}</td>
                <td className="p-10 font-black dark:text-white uppercase text-base">{t.desc}</td>
                <td className="p-10 text-center"><span className="text-[10px] font-black px-5 py-2.5 bg-slate-100 rounded-2xl uppercase text-slate-500">{t.method || 'NAKİT'}</span></td>
                <td className={`p-10 text-right font-black text-2xl tracking-tighter ${t.type === 'GELİR' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'GELİR' ? '+' : '-'}₺{t.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsView = ({ products, transactions, invoices }: any) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];
  const catData = products.reduce((acc:any, p:any)=>{
    const ex = acc.find((x:any)=>x.name === p.cat);
    if(ex) ex.value += p.stock; else acc.push({name:p.cat, value:p.stock});
    return acc;
  }, []);
  return (
    <div className="space-y-16">
       <h1 className="text-5xl font-black uppercase tracking-tighter dark:text-white">Analiz & Rapor</h1>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[60px] shadow-sm border h-[550px]">
             <h3 className="font-black text-xs uppercase text-slate-300 mb-12">Kategori Dağılımı</h3>
             <ResponsiveContainer width="100%" height="80%"><RePieChart><Pie data={catData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value">{catData.map((_:any, i:number)=><Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}</Pie><Tooltip /><Legend /></RePieChart></ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[60px] shadow-sm border space-y-8">
             <h3 className="font-black text-xs uppercase text-slate-300 mb-12">Ticari Performans</h3>
             <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[40px] flex justify-between items-center"><span className="font-black text-slate-400 uppercase text-xs">Toplam Stok Değeri</span><span className="font-black text-slate-800 dark:text-white text-2xl tracking-tighter">₺{products.reduce((a:any,b:any)=>a+(b.price*b.stock), 0).toLocaleString()}</span></div>
          </div>
       </div>
    </div>
  );
};

const AIView = ({ products, transactions, settings }: any) => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{r:'ai', t:`Merhaba Mustafa Bey, ${settings.title} verileri anlık olarak sistemimde yüklü. Neyi analiz etmemi istersiniz?`}]);
  const [load, setLoad] = useState(false);
  const ask = async () => {
    if(!msg.trim()) return;
    const ut = msg; setMsg(""); setChat(c => [...c, {r:'user', t:ut}]); setLoad(true);
    try {
      const context = `Şirket: ${settings.title}, Stok: ${products.length} kalem, Kasa: ${transactions.reduce((a:any, b:any)=>a+(b.type==='GELİR'?b.amount:-b.amount), 0)} TL`;
      const resp = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Sen uzman bir CFO'sun. Mustafa Ticaret için şu veriler ışığında profesyonel, kısa ve net yanıt ver: ${context}. Kullanıcı sorusu: ${ut}` });
      setChat(c => [...c, {r:'ai', t:resp.text || "Hata oluştu."}]);
    } catch { setChat(c => [...c, {r:'ai', t: "Bağlantı hatası."}]); }
    finally { setLoad(false); }
  };
  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-200px)] animate-in fade-in">
       <div className="flex-1 bg-white dark:bg-slate-800 rounded-[60px] shadow-2xl border overflow-y-auto p-12 space-y-10 custom-scrollbar relative">
          {chat.map((c, i)=>(<div key={i} className={`flex ${c.r==='user'?'justify-end':'justify-start'}`}><div className={`p-8 rounded-[40px] max-w-[85%] text-base font-bold shadow-sm ${c.r==='user'?'bg-blue-600 text-white shadow-blue-500/20':'bg-slate-50 dark:bg-slate-700 dark:text-white border'}`}>{c.t}</div></div>))}
          {load && <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] animate-pulse flex items-center gap-3"><Zap size={14}/> Veri İşleniyor...</div>}
       </div>
       <div className="mt-10 p-5 bg-white dark:bg-slate-800 rounded-[45px] shadow-2xl border flex gap-6"><input className="flex-1 bg-transparent outline-none px-10 font-black text-lg dark:text-white placeholder-slate-300" placeholder="AI Finans Direktörü'ne bir soru sorun..." value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()}/><button onClick={ask} className="bg-blue-600 text-white p-6 rounded-[35px] shadow-2xl hover:bg-blue-700 active:scale-90 transition-all"><ArrowRight size={32}/></button></div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
