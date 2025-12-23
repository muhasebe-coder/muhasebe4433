
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, TrendingUp, AlertTriangle, Briefcase, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { chatWithAIAdvisor } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { TransactionType, Employee, Product } from '../types';

const AIAdvisor: React.FC = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, isAction?: boolean}[]>([
    { role: 'ai', text: 'Merhaba! Ben finansal danışmanınız. Bugün size nasıl yardımcı olabilirim? (Örn: "Stok durumumuz nasıl?", "Ahmet Yılmaz\'ı personelden çıkar.")' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const products = storageService.getProducts();
    const transactions = storageService.getTransactions();
    const employees = storageService.getEmployees();
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a,b) => a+b.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a,b) => a+b.amount, 0);
    
    const context = {
        stats: { totalIncome: income, totalExpense: expense, netProfit: income - expense },
        lowStock: products.filter(p => p.quantity <= p.minLevel).map(p => p.name),
        employees: employees.map(e => ({ name: e.fullName, pos: e.position, id: e.id })),
        companyName: storageService.getAppSettings().appName
    };

    const response = await chatWithAIAdvisor(userMsg, context);
    
    if (response) {
      // Fonksiyon çağrısı var mı kontrol et
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'delete_employee') {
            const nameToFind = fc.args.fullName.toLowerCase();
            const target = employees.find(e => e.fullName.toLowerCase().includes(nameToFind));
            if (target) {
              storageService.deleteEmployee(target.id);
              setMessages(prev => [...prev, { role: 'ai', text: `⚠️ İşlem Tamamlandı: **${target.fullName}** isimli personeli sistemden çıkardım.`, isAction: true }]);
            } else {
              setMessages(prev => [...prev, { role: 'ai', text: `Üzgünüm, "${fc.args.fullName}" isimli bir personel bulamadım.` }]);
            }
          }
          if (fc.name === 'update_stock_quantity') {
            const prod = products.find(p => p.name.toLowerCase().includes(fc.args.productName.toLowerCase()));
            if (prod) {
              storageService.updateProduct({ ...prod, quantity: fc.args.newQuantity });
              setMessages(prev => [...prev, { role: 'ai', text: `📦 Stok Güncellendi: **${prod.name}** yeni miktarı: ${fc.args.newQuantity}`, isAction: true }]);
            }
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: response.text || "Anlayamadım, lütfen tekrar eder misiniz?" }]);
      }
    } else {
      setMessages(prev => [...prev, { role: 'ai', text: "Yapay zeka servisine ulaşılamıyor." }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in">
       <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
             <Bot size={28} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Finansal Danışman</h1>
             <p className="text-sm text-gray-500 dark:text-gray-400">Komutlarınızı anlayan ve uygulayan akıllı asistan.</p>
          </div>
       </div>

       <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-primary text-white shadow-md' 
                        : m.isAction ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200'
                   }`}>
                      {m.isAction && <CheckCircle2 size={14} className="inline mr-2 mb-0.5" />}
                      {m.text}
                   </div>
                </div>
             ))}
             {loading && (
                <div className="flex justify-start">
                   <div className="bg-gray-100 dark:bg-slate-700 p-4 rounded-2xl flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin text-primary" />
                      <span className="text-sm text-gray-500">İşlem yapılıyor...</span>
                   </div>
                </div>
             )}
             <div ref={scrollRef} />
          </div>

          <div className="p-4 border-t dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
             <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-xl focus:ring-2 ring-primary outline-none dark:text-white"
                  placeholder="Komut verin: 'Personeli sil', 'Stok durumunu sor'..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  className="p-3 bg-primary text-white rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                   <Send size={20} />
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default AIAdvisor;
