
import React from 'react';
import { LayoutDashboard, Package, FileText, Settings, Wallet, Bot, PieChart, Users, FileSignature, Briefcase } from 'lucide-react';
import { Logo } from './Logo';
import { AppSettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onOpenSettings?: () => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onOpenSettings, settings }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'customers', label: 'Cari Hesaplar', icon: Users },
    { id: 'inventory', label: 'Stok Takibi', icon: Package },
    { id: 'personnel', label: 'Personel & Maaş', icon: Briefcase },
    { id: 'proposals', label: 'Teklifler', icon: FileSignature },
    { id: 'invoices', label: 'Faturalar', icon: FileText },
    { id: 'transactions', label: 'Kasa & Giderler', icon: Wallet },
    { id: 'reports', label: 'Raporlar', icon: PieChart },
    { id: 'ai-advisor', label: 'Yapay Zeka Asistanı', icon: Bot },
  ];

  return (
    <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-20 w-64 h-full bg-slate-900 dark:bg-black text-white transition-transform duration-300 ease-in-out flex flex-col`}>
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        {settings.logoUrl ? (
          <img src={settings.logoUrl} className="w-8 h-8 object-contain" />
        ) : (
          <Logo size={32} />
        )}
        <span className="text-xl font-bold tracking-tight truncate" title={settings.appName}>{settings.appName}</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors"
        >
          <Settings size={20} />
          <span className="font-medium">Ayarlar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
