import React from 'react';
import { 
  Zap, 
  Package, 
  ThermometerSnowflake, 
  Wallet, 
  TrendingUp, 
  FileText 
} from 'lucide-react';
import { TabId } from '../types';
import { soundEffects } from '../utils/audio';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  pendingDebtsCount?: number;
  unreturnedCratesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingDebtsCount = 0,
  unreturnedCratesCount = 0
}) => {
  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    {
      id: 'fast_entry',
      label: 'الطيار',
      icon: Zap
    },
    {
      id: 'crates',
      label: 'الصناديق',
      icon: Package,
      badge: unreturnedCratesCount > 0 ? unreturnedCratesCount : undefined
    },
    {
      id: 'cold_storage',
      label: 'الثلاجة',
      icon: ThermometerSnowflake
    },
    {
      id: 'debts',
      label: 'الكريدي',
      icon: Wallet,
      badge: pendingDebtsCount > 0 ? pendingDebtsCount : undefined
    },
    {
      id: 'market',
      label: 'السوق',
      icon: TrendingUp
    },
    {
      id: 'reports',
      label: 'التقارير',
      icon: FileText
    }
  ];

  const handleTabClick = (tabId: TabId) => {
    soundEffects.playClick();
    onTabChange(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe">
      <div className="max-w-4xl mx-auto grid grid-cols-6 items-stretch h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all duration-150 select-none ${
                isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110 text-cyan-400' : 'text-slate-400'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-full px-0.5 ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>

              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
