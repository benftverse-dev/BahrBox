import React from 'react';
import { ShieldCheck, Anchor, Sparkles, Settings, Coins } from 'lucide-react';
import { PlatformTier } from '../types';
import { soundEffects } from '../utils/audio';

interface HeaderProps {
  currentPort: string;
  onPortChange: (port: string) => void;
  dailyCrates: number;
  totalSellerVolume: number;
  merchantTier: PlatformTier;
  trialDaysLeft: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPort,
  onPortChange,
  dailyCrates,
  totalSellerVolume,
  merchantTier,
  trialDaysLeft,
  onOpenSettings
}) => {
  const ports = ['الدار البيضاء', 'أكادير', 'طانطان', 'الداخلة', 'العيون', 'طنجة'];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      {/* 30-Day Free Trial Notice Banner & Dynamic Merchant Tier */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 px-3 py-1.5 border-b border-cyan-800/40 text-[11px] text-cyan-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-medium">
            فترة تجريبية مجانية لتاجر البحر: متبقي <span className="font-bold text-white tabular-nums">{trialDaysLeft} يوماً</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Tier indicator pill */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-1 bg-slate-800/90 hover:bg-slate-750 text-cyan-300 border border-cyan-700/60 rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
            title="انقر لفتح إعدادات الضمانة ورسوم المنصة"
          >
            <Coins className="w-3 h-3 text-amber-400 shrink-0" />
            <span>{merchantTier.nameAr.split(' ')[0]} {merchantTier.nameAr.split(' ')[1]}:</span>
            <span className="font-mono text-white">{merchantTier.ratePerCrate.toFixed(2)} د.م/ص</span>
          </button>

          <span className="hidden sm:inline-block tabular-nums font-mono text-slate-400 text-[10px]">
            {dailyCrates} صندوق اليوم
          </span>
        </div>
      </div>

      {/* Main Top Bar */}
      <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 max-w-4xl mx-auto">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white leading-tight">
                BahrBox
              </h1>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded px-1.5 py-0.5 font-bold">
                بحر بوكس
              </span>
            </div>
            {/* Standard Subtitle strictly under logo */}
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
              Commerce & Logistique Numérique du Poisson
            </p>
          </div>
        </div>

        {/* Port Selector, Settings Button & Security Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Port Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200">
            <span className="text-slate-400 text-[10px] hidden xs:inline">الميناء:</span>
            <select
              value={currentPort}
              onChange={(e) => onPortChange(e.target.value)}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {ports.map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onOpenSettings();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
            title="الإعدادات: أسعار الضمانة وعمولة المنصة"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Security Badge */}
          <div 
            title="بياناتك المالية مشفرة وآمنة 100%" 
            className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};
