
import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Sparkles, Bell, CalendarClock, ArrowRight, CheckCircle2, Package, Download, HardDrive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { TransactionType, DashboardStats, Product, Transaction, Invoice, InvoiceStatus, AppSettings } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface DashboardProps {
  settings: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ settings }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [backupNeeded, setBackupNeeded] = useState(false);

  useEffect(() => {
    setTransactions(storageService.getTransactions());
    setProducts(storageService.getProducts());
    setInvoices(storageService.getInvoices());
    setBackupNeeded(storageService.needsBackup());
  }, []);

  const handleQuickBackup = () => {
     storageService.createBackup();
     setBackupNeeded(false);
  };

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const lowStockItems = products.filter(p => p.quantity <= p.minLevel);
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING').length;

  const stats: DashboardStats = {
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    lowStockCount: lowStockItems.length,
    pendingInvoicesCount: pendingInvoices
  };

  const chartData = [
    { name: 'Gelir', amount: totalIncome, color: '#10b981' },
    { name: 'Gider', amount: totalExpense, color: '#ef4444' },
    { name: 'Kâr', amount: totalIncome - totalExpense, color: settings.primaryColor },
  ];

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const result = await getFinancialAdvice(stats, lowStockItems, transactions);
    setAdvice(result);
    setLoadingAdvice(false);
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-8 animate-fade-in ${settings.isDarkMode ? 'text-white' : ''}`}>
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{settings.appName} Paneli</h1>
        <p className="text-gray-500 dark:text-gray-400">Şirketinizin anlık finansal durumu ve stok özetleri.</p>
      </header>
      
      {backupNeeded && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-full text-orange-600 shadow-sm mt-1 md:mt-0">
                 <HardDrive size={24} />
              </div>
              <div>
                 <h4 className="font-bold text-orange-900 dark:text-orange-200">Yedekleme Zamanı!</h4>
                 <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">Verileriniz sadece bu cihazda saklanıyor.</p>
              </div>
           </div>
           <button onClick={handleQuickBackup} className="bg-orange-600 text-white px-5 py-2.5 rounded-lg hover:bg-orange-700 shadow-sm transition-colors font-medium whitespace-nowrap w-full md:w-auto">Hemen Yedek İndir</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {settings.visibleStats.income && <StatCard title="Toplam Gelir" value={`₺${stats.totalIncome.toLocaleString('tr-TR')}`} icon={TrendingUp} color="bg-green-500" />}
        {settings.visibleStats.expense && <StatCard title="Toplam Gider" value={`₺${stats.totalExpense.toLocaleString('tr-TR')}`} icon={TrendingDown} color="bg-red-500" />}
        {settings.visibleStats.profit && <StatCard title="Net Kâr" value={`₺${stats.netProfit.toLocaleString('tr-TR')}`} icon={DollarSign} color="bg-primary" />}
        {settings.visibleStats.stock && <StatCard title="Kritik Stok" value={stats.lowStockCount.toString()} icon={AlertTriangle} color="bg-orange-500" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Finansal Özet</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.isDarkMode ? "#334155" : "#f3f4f6"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: settings.isDarkMode ? '#94a3b8' : '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: settings.isDarkMode ? '#94a3b8' : '#64748b'}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: settings.isDarkMode ? '#1e293b' : '#fff', color: settings.isDarkMode ? '#fff' : '#000'}} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={100} /></div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Sparkles size={20} /> AI Asistan</h3>
            <div className="min-h-[100px] text-sm text-indigo-100 mb-4 whitespace-pre-line leading-relaxed">
              {loadingAdvice ? "Analiz yapılıyor..." : advice || "Finansal verilerinizi analiz etmemi ister misiniz?"}
            </div>
            <button onClick={handleGetAdvice} disabled={loadingAdvice} className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all">
              {advice ? 'Yeniden Analiz Et' : 'Tavsiye Al'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
