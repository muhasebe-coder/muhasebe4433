import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Filter, DollarSign, TrendingUp, TrendingDown, Package, CreditCard, ShoppingBag } from 'lucide-react';
import { Transaction, Invoice, Product, TransactionType, InvoiceStatus } from '../types';
import { storageService } from '../services/storageService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financial' | 'sales'>('financial');
  
  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Filters
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of month
    end: new Date().toISOString().split('T')[0] // Today
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setTransactions(storageService.getTransactions());
    setInvoices(storageService.getInvoices());
    setProducts(storageService.getProducts());
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // --- Financial Analysis Logic ---
  const filteredTransactions = transactions.filter(t => 
    t.date >= dateRange.start && t.date <= dateRange.end
  );

  const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  // Chart Data: Income vs Expense
  const financialChartData = [
    { name: 'Gelir', value: totalIncome, fill: '#10b981' },
    { name: 'Gider', value: totalExpense, fill: '#f43f5e' },
  ];

  // --- Sales Analysis Logic ---
  // Get all items from PAID invoices within date range
  const salesItems = invoices
    .filter(i => i.status === InvoiceStatus.PAID && i.date >= dateRange.start && i.date <= dateRange.end)
    .flatMap(i => i.items);

  // Aggregate Sales by Product
  const salesByProduct = salesItems.reduce((acc, item) => {
    if (!acc[item.productId]) {
      // Find product details to get category
      const productInfo = products.find(p => p.id === item.productId);
      acc[item.productId] = {
        name: item.productName,
        category: productInfo?.category || 'Diğer',
        quantity: 0,
        revenue: 0
      };
    }
    acc[item.productId].quantity += item.quantity;
    acc[item.productId].revenue += item.total;
    return acc;
  }, {} as Record<string, { name: string, category: string, quantity: number, revenue: number }>);

  let productSalesArray: { name: string, category: string, quantity: number, revenue: number }[] = Object.values(salesByProduct);

  // Filter Sales by Category
  if (selectedCategory !== 'all') {
    productSalesArray = productSalesArray.filter(p => p.category === selectedCategory);
  }

  // Sort by Revenue desc
  productSalesArray.sort((a, b) => b.revenue - a.revenue);

  // Category Distribution for Pie Chart
  const salesByCategory = productSalesArray.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = 0;
    acc[item.category] += item.revenue;
    return acc;
  }, {} as Record<string, number>);
  
  const categoryChartData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Raporlar & Analiz</h1>
        <p className="text-gray-500">Finansal durumunuzu ve ürün performansını detaylı inceleyin.</p>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="space-y-1">
               <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                 <Calendar size={12} /> Başlangıç Tarihi
               </label>
               <input 
                 type="date" 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 value={dateRange.start}
                 onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
               />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                 <Calendar size={12} /> Bitiş Tarihi
               </label>
               <input 
                 type="date" 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 value={dateRange.end}
                 onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
               />
            </div>
         </div>

         {/* Tab Switcher */}
         <div className="bg-gray-100 p-1 rounded-lg flex w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('financial')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'financial' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Gelir/Gider
            </button>
            <button 
              onClick={() => setActiveTab('sales')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'sales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Ürün Satışları
            </button>
         </div>
      </div>

      {activeTab === 'financial' && (
        <div className="space-y-6 animate-scale-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp size={24}/></div>
                   <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Gelir</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">₺{totalIncome.toLocaleString('tr-TR')}</h3>
                <p className="text-xs text-gray-500 mt-1">Seçili tarih aralığında</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><TrendingDown size={24}/></div>
                   <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Gider</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">₺{totalExpense.toLocaleString('tr-TR')}</h3>
                <p className="text-xs text-gray-500 mt-1">Seçili tarih aralığında</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign size={24}/></div>
                   <span className={`text-xs font-medium px-2 py-1 rounded-full ${netProfit >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>Net Kâr</span>
                </div>
                <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>₺{netProfit.toLocaleString('tr-TR')}</h3>
                <p className="text-xs text-gray-500 mt-1">Seçili tarih aralığında</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Chart */}
             <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="font-bold text-gray-800 mb-6">Gelir vs Gider Dağılımı</h3>
               <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={80} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
             </div>

             {/* Recent List */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
               <h3 className="font-bold text-gray-800 mb-4">Son Hareketler</h3>
               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="space-y-3">
                    {filteredTransactions.slice(0, 8).map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                               {t.type === TransactionType.INCOME ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            </div>
                            <div>
                               <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{t.description}</p>
                               <p className="text-xs text-gray-500">{t.date}</p>
                            </div>
                         </div>
                         <span className={`text-sm font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}₺{t.amount.toLocaleString()}
                         </span>
                      </div>
                    ))}
                    {filteredTransactions.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Kayıt bulunamadı.</p>}
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6 animate-scale-in">
           
           <div className="flex items-center justify-end">
             <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-500" />
                <select 
                  className="text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Tüm Kategoriler</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Table */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">En Çok Satan Ürünler</h3>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">Toplam: ₺{productSalesArray.reduce((a,b)=>a+b.revenue, 0).toLocaleString()}</span>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 text-gray-600">
                          <tr>
                             <th className="px-6 py-3">Ürün Adı</th>
                             <th className="px-6 py-3">Kategori</th>
                             <th className="px-6 py-3 text-center">Satılan Adet</th>
                             <th className="px-6 py-3 text-right">Ciro (TL)</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {productSalesArray.map((item, idx) => (
                             <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-3 text-gray-500">{item.category}</td>
                                <td className="px-6 py-3 text-center font-bold text-blue-600">{item.quantity}</td>
                                <td className="px-6 py-3 text-right font-bold text-gray-900">₺{item.revenue.toLocaleString()}</td>
                             </tr>
                          ))}
                          {productSalesArray.length === 0 && (
                             <tr><td colSpan={4} className="text-center py-8 text-gray-500">Seçili kriterlere uygun satış bulunamadı.</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* Category Pie Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                 <h3 className="font-bold text-gray-800 mb-2 w-full text-left">Kategori Dağılımı</h3>
                 {categoryChartData.length > 0 ? (
                   <div className="w-full h-72">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={categoryChartData}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="value"
                         >
                           {categoryChartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip formatter={(value: number) => `₺${value.toLocaleString()}`} />
                         <Legend />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 ) : (
                    <div className="flex flex-col items-center text-gray-400 py-10">
                       <ShoppingBag size={48} className="mb-2 opacity-20" />
                       <p className="text-sm">Veri yok</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;