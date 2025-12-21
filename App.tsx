import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Proposals from './pages/Proposals';
import Personnel from './pages/Personnel';
import AIAdvisor from './pages/AIAdvisor';
import Login from './components/Login';
import Modal from './components/Modal';
import { Menu, X, Download, LogOut, HardDrive, Palette, Sun, Moon, Image as ImageIcon, Database, Server, Zap, Loader2 } from 'lucide-react';
import { storageService, DEFAULT_SETTINGS } from './services/storageService';
import { CompanyInfo, AppSettings } from './types';
import { Logo } from './components/Logo';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    title: '', vkn: '', address: '', city: ''
  });
  
  const [storageUsage, setStorageUsage] = useState({ used: '0', percent: 0 });

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log("Uygulama başlatılıyor...");
        const auth = localStorage.getItem('muhasebe_auth');
        if (auth === 'true') setIsAuthenticated(true);
        
        // Veritabanını başlat
        await storageService.init(); 
        
        // Ayarları yükle
        setSettings(storageService.getAppSettings());
        const loadedInfo = storageService.getCompanyInfo();
        if (loadedInfo) setCompanyInfo(loadedInfo);
        
        console.log("Sistem hazır.");
      } catch (error) {
        console.error("Başlatma hatası:", error);
      } finally {
        // Hata olsa bile en azından login ekranını göster
        setIsAppLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (isSettingsOpen) {
      const usedKB = parseFloat(storageService.getStorageUsage());
      const limitKB = 1048576; // 1GB
      const percent = Math.min(100, (usedKB / limitKB) * 100);
      setStorageUsage({ used: usedKB.toFixed(2), percent });
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const handleLogout = () => {
    localStorage.removeItem('muhasebe_auth');
    setIsAuthenticated(false);
  };

  const handleSaveSettings = () => {
    storageService.saveAppSettings(settings);
    alert('Uygulama ayarları başarıyla kaydedildi.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isAppLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
         <Loader2 className="animate-spin text-blue-500" size={48} />
         <p className="font-bold tracking-widest text-sm animate-pulse">VERİ MOTORU BAŞLATILIYOR...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLogin={setIsAuthenticated} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard settings={settings} />;
      case 'customers': return <Customers />;
      case 'inventory': return <Inventory />;
      case 'personnel': return <Personnel />;
      case 'proposals': return <Proposals />;
      case 'invoices': return <Invoices />;
      case 'transactions': return <Transactions />;
      case 'reports': return <Reports />;
      case 'ai-advisor': return <AIAdvisor />;
      default: return <Dashboard settings={settings} />;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${settings.isDarkMode ? 'dark bg-slate-900' : 'bg-gray-50'}`}>
      <style>{`
        :root { --primary-color: ${settings.primaryColor}; }
        .bg-primary { background-color: var(--primary-color); }
        .text-primary { color: var(--primary-color); }
        .border-primary { border-color: var(--primary-color); }
        .ring-primary { --tw-ring-color: var(--primary-color); }
      `}</style>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
      />

      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
           <div className="flex items-center gap-2">
             {settings.logoUrl ? <img src={settings.logoUrl} className="h-8 w-8 object-contain" /> : <Logo size={32} />}
             <span className="font-bold text-gray-800 dark:text-white">{settings.appName}</span>
           </div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 dark:text-gray-300">
             {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Ayarlar ve Kişiselleştirme">
         <div className="space-y-8 pb-4">
           <div className="space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b dark:border-slate-700 pb-2 text-sm">
                <Palette size={16} className="text-primary" /> Görünüm ve Kimlik
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Uygulama İsmi</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 text-sm border dark:bg-slate-800 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 ring-primary"
                    value={settings.appName}
                    onChange={e => setSettings({...settings, appName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Logo</label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                    <ImageIcon size={14} />
                    <span>Seç</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Tema Modu</label>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setSettings({...settings, isDarkMode: false})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-all ${!settings.isDarkMode ? 'bg-primary text-white border-primary' : 'dark:text-gray-400 dark:border-slate-600'}`}
                   >
                     <Sun size={14} /> Gündüz
                   </button>
                   <button 
                    onClick={() => setSettings({...settings, isDarkMode: true})}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs transition-all ${settings.isDarkMode ? 'bg-primary text-white border-primary' : 'text-gray-500 border-gray-200'}`}
                   >
                     <Moon size={14} /> Gece
                   </button>
                </div>
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b dark:border-slate-700 pb-2 text-sm">
                <Database size={16} className="text-primary" /> Yüksek Kapasiteli Depolama
              </h4>
              
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                       <Server size={12} /> IndexedDB (Modern Dosya Sistemi)
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{storageUsage.used} KB</span>
                 </div>
                 <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                       className="h-full bg-emerald-500 transition-all duration-500"
                       style={{ width: `${Math.max(2, storageUsage.percent)}%` }}
                    />
                 </div>
                 <p className="text-[10px] text-gray-500 mt-2">
                    <span className="font-bold text-emerald-600 uppercase">Limit Yok:</span> Bilgisayarınızın gücü sayesinde artık disk kapasiteniz kadar veri saklayabilirsiniz. Milyonlarca kayıt için uygundur.
                 </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                 <Zap className="text-blue-600 shrink-0" size={18} />
                 <div>
                    <h5 className="text-xs font-bold text-blue-900 dark:text-blue-200">Performans Kilidi Açıldı</h5>
                    <p className="text-[10px] text-blue-800 dark:text-blue-300 mt-1">
                       Verileriniz artık bellekte (RAM) önbelleğe alınarak işleniyor. Donanımınızın gücünü kullanarak büyük tablolarda bile takılma olmadan çalışabilirsiniz.
                    </p>
                 </div>
              </div>
           </div>

           <form onSubmit={(e) => { e.preventDefault(); storageService.saveCompanyInfo(companyInfo); alert('Kaydedildi.'); }} className="space-y-4">
             <h4 className="font-semibold text-gray-800 dark:text-white border-b dark:border-slate-700 pb-2 text-sm">Firma Resmi Bilgileri</h4>
             <div>
               <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Firma Unvanı</label>
               <input type="text" className="w-full px-3 py-2 text-sm border dark:bg-slate-800 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 ring-primary" value={companyInfo.title} onChange={e => setCompanyInfo({...companyInfo, title: e.target.value})} />
             </div>
             <button type="submit" className="w-full py-2 bg-gray-800 dark:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all hover:bg-gray-900">Bilgileri Kaydet</button>
           </form>

           <div className="pt-4 border-t dark:border-slate-700 flex gap-2">
              <button onClick={handleSaveSettings} className="flex-[2] py-2.5 bg-primary text-white font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity text-sm">Uygula ve Kapat</button>
              <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 p-2 border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold">
                 <LogOut size={14} /> Çıkış
              </button>
              <button onClick={storageService.createBackup} className="flex-1 flex items-center justify-center gap-2 p-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold">
                 <Download size={14} /> Yedekle
              </button>
           </div>
         </div>
      </Modal>
    </div>
  );
};

export default App;