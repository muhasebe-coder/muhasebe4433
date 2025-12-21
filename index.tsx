import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, Package, FileText, Settings, Wallet, Bot, PieChart, Users, 
  FileSignature, Briefcase, TrendingUp, TrendingDown, DollarSign, AlertTriangle, 
  Sparkles, Bell, CalendarClock, ArrowRight, CheckCircle2, Download, HardDrive,
  Search, Plus, Filter, ArrowUpDown, Trash2, Edit, X, ChevronDown, Minus, 
  Image as ImageIcon, Wand2, Loader2, Upload, Printer, PlusCircle, Clock, 
  AlertCircle, FileCode, HelpCircle, RefreshCw, CreditCard, Banknote, Scroll,
  ArrowUpCircle, ArrowDownCircle, Camera, Menu, LogOut, Palette, Sun, Moon,
  Database, Server, Zap, ArrowUpRight, Building2, Send, XCircle, FileInput
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RePieChart, Pie, Legend
} from 'recharts';

/** --- MODELLER VE TIPLER --- **/

enum TransactionType { INCOME = 'INCOME', EXPENSE = 'EXPENSE' }
enum InvoiceStatus { PAID = 'PAID', PENDING = 'PENDING', OVERDUE = 'OVERDUE' }
enum ProposalStatus { DRAFT = 'DRAFT', SENT = 'SENT', ACCEPTED = 'ACCEPTED', REJECTED = 'REJECTED' }
enum PaymentMethod { CASH = 'CASH', CREDIT_CARD = 'CREDIT_CARD', BANK_TRANSFER = 'BANK_TRANSFER', CHECK = 'CHECK', PROMISSORY_NOTE = 'PROMISSORY_NOTE' }

interface AppSettings {
  appName: string; primaryColor: string; isDarkMode: boolean; logoUrl?: string;
  visibleStats: { income: boolean; expense: boolean; profit: boolean; stock: boolean; };
}

interface CompanyInfo { title: string; vkn: string; address: string; city: string; }
interface Customer { id: string; name: string; type: 'CUSTOMER' | 'SUPPLIER'; taxNumber?: string; phone?: string; city?: string; }
interface Product { id: string; name: string; sku: string; quantity: number; price: number; category: string; minLevel: number; taxRate: number; imageUrl?: string; }
interface Employee { id: string; fullName: string; position: string; salary: number; phone?: string; startDate: string; status: 'ACTIVE' | 'INACTIVE'; }
interface InvoiceItem { productId: string; productName: string; quantity: number; unitPrice: number; taxRate: number; total: number; }
interface Invoice { id: string; customerName: string; date: string; amount: number; status: InvoiceStatus; items: InvoiceItem[]; paymentMethod?: PaymentMethod; maturityDate?: string; }
interface Proposal { id: string; customerName: string; date: string; validUntil: string; amount: number; status: ProposalStatus; items: InvoiceItem[]; notes?: string; }
interface Transaction { id: string; description: string; amount: number; type: TransactionType; date: string; paymentMethod?: PaymentMethod; maturityDate?: string; }
interface DashboardStats { totalIncome: number; totalExpense: number; netProfit: number; lowStockCount: number; pendingInvoicesCount: number; }

/** --- SABITLER VE MOCK VERILER --- **/

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Laptop Pro X1', sku: 'TEK-001', quantity: 15, price: 25000, category: 'Elektronik', minLevel: 5, taxRate: 20 },
  { id: '2', name: 'Ofis Sandalyesi', sku: 'MOB-023', quantity: 4, price: 3500, category: 'Mobilya', minLevel: 10, taxRate: 10 }
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'ABC Teknoloji A.Ş.', type: 'CUSTOMER', phone: '0212 555 10 20', city: 'İstanbul' }
];

/** --- SERVISLER --- **/

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const generateId = (prefix: string = '') => `${prefix}${Date.now().toString(36).toUpperCase()}`;

const storageService = {
  getProducts: () => JSON.parse(localStorage.getItem('products') || JSON.stringify(MOCK_PRODUCTS)),
  setProducts: (data: Product[]) => localStorage.setItem('products', JSON.stringify(data)),
  getInvoices: () => JSON.parse(localStorage.getItem('invoices') || '[]'),
  setInvoices: (data: Invoice[]) => localStorage.setItem('invoices', JSON.stringify(data)),
  getTransactions: () => JSON.parse(localStorage.getItem('transactions') || '[]'),
  setTransactions: (data: Transaction[]) => localStorage.setItem('transactions', JSON.stringify(data)),
  getCustomers: () => JSON.parse(localStorage.getItem('customers') || JSON.stringify(MOCK_CUSTOMERS)),
  setCustomers: (data: Customer[]) => localStorage.setItem('customers', JSON.stringify(data)),
  getAppSettings: () => JSON.parse(localStorage.getItem('settings') || JSON.stringify({
    appName: 'Mustafa Ticaret', primaryColor: '#2563eb', isDarkMode: false,
    visibleStats: { income: true, expense: true, profit: true, stock: true }
  })),
  setAppSettings: (s: AppSettings) => localStorage.setItem('settings', JSON.stringify(s)),
  getCompanyInfo: () => JSON.parse(localStorage.getItem('company_info') || '{"title":"","vkn":"","address":"","city":""}')
};

/** --- BILEŞENLER --- **/

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border dark:border-slate-700 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold dark:text-white">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}><Icon className={color.replace('bg-', 'text-')} /></div>
  </div>
);

/** --- ANA UYGULAMA (APP) --- **/

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settings, setSettings] = useState(storageService.getAppSettings());
  const [isAuth, setIsAuth] = useState(localStorage.getItem('auth') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.isDarkMode);
  }, [settings.isDarkMode]);

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold mb-6">Mustafa Ticaret Giriş</h1>
          <button 
            onClick={() => { localStorage.setItem('auth', 'true'); setIsAuth(true); }}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
          >
            Sisteme Giriş Yap
          </button>
          <p className="mt-4 text-xs text-gray-400">Yönetici Paneli v1.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">M</div>
          <span className="font-bold">{settings.appName}</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
            { id: 'inventory', label: 'Stok Takibi', icon: Package },
            { id: 'customers', label: 'Cari Hesaplar', icon: Users },
            { id: 'invoices', label: 'Faturalar', icon: FileText },
            { id: 'transactions', label: 'Kasa & Gider', icon: Wallet },
            { id: 'ai-advisor', label: 'AI Asistan', icon: Bot },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg ${activeTab === item.id ? 'bg-blue-600' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <item.icon size={18}/> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-6 text-slate-500 hover:text-white flex items-center gap-2 text-sm"><LogOut size={16}/> Çıkış Yap</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {activeTab === 'dashboard' && <DashboardView settings={settings} />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'invoices' && <div className="p-8 text-center text-gray-500">Fatura Modülü Yükleniyor...</div>}
        {activeTab === 'ai-advisor' && <AIAdvisorView />}
      </main>
    </div>
  );
};

/** --- GÖNÜNÜMLER (VIEWS) --- **/

const DashboardView = ({ settings }) => {
  const products = storageService.getProducts();
  const transactions = storageService.getTransactions();
  const income = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Hoş Geldiniz</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Toplam Gelir" value={`₺${income.toLocaleString()}`} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Toplam Gider" value={`₺${expense.toLocaleString()}`} icon={TrendingDown} color="bg-rose-500" />
        <StatCard title="Net Kar" value={`₺${(income - expense).toLocaleString()}`} icon={DollarSign} color="bg-blue-500" />
        <StatCard title="Kritik Stok" value={products.filter(p => p.quantity <= p.minLevel).length} icon={AlertTriangle} color="bg-orange-500" />
      </div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700 h-80">
        <h3 className="font-bold mb-4 dark:text-white">Aylık Özet</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[{name: 'Gelir', val: income}, {name: 'Gider', val: expense}]}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="val" fill="#3b82f6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const InventoryView = () => {
  const [prods, setProds] = useState(storageService.getProducts());
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Stok Yönetimi</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18}/> Ürün Ekle</button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 dark:text-white">
            <tr>
              <th className="p-4">Ürün Adı</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Stok</th>
              <th className="p-4">Fiyat</th>
              <th className="p-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-700">
            {prods.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 dark:text-gray-300">
                <td className="p-4 font-bold">{p.name}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${p.quantity <= p.minLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.quantity} Adet
                  </span>
                </td>
                <td className="p-4">₺{p.price.toLocaleString()}</td>
                <td className="p-4 text-right"><button className="text-gray-400 hover:text-blue-600"><Edit size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AIAdvisorView = () => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState([{role: 'ai', text: 'Merhaba Mustafa Bey, bugün finansal verilerinizde yardımcı olabilirim. Ne sormak istersiniz?'}]);

  const askAI = async () => {
    if (!msg.trim()) return;
    const userText = msg;
    setMsg("");
    setChat(c => [...c, {role: 'user', text: userText}]);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Finansal Danışmansın. Şirket verilerine göre cevap ver. Soru: ${userText}`
      });
      setChat(c => [...c, {role: 'ai', text: response.text || "Şu an cevap veremiyorum."}]);
    } catch {
      setChat(c => [...c, {role: 'ai', text: "Yapay zeka bağlantı hatası."}]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {chat.map((c, i) => (
          <div key={i} className={`flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${c.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:text-gray-200 shadow-sm'}`}>
              {c.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex gap-2">
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && askAI()}
          placeholder="AI'ya sor..." 
          className="flex-1 bg-transparent outline-none dark:text-white"
        />
        <button onClick={askAI} className="bg-blue-600 text-white p-2 rounded-lg"><ArrowRight size={20}/></button>
      </div>
    </div>
  );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);