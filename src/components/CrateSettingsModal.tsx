import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  ShieldCheck, 
  Layers, 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  Coins, 
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Package,
  PackageCheck,
  Fish
} from 'lucide-react';
import { CrateGuaranteeRates, PlatformTier, FishCrateMapping, CrateType, FishType } from '../types';
import { FISH_CATALOG, CRATE_CATEGORIES } from '../utils/storage';
import { soundEffects } from '../utils/audio';

interface CrateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: CrateGuaranteeRates;
  onSaveRates: (newRates: CrateGuaranteeRates) => void;
  fishCrateMapping: FishCrateMapping;
  onSaveFishCrateMapping: (mapping: FishCrateMapping) => void;
  sellerVolume: number;
  currentTier: PlatformTier;
}

export const CrateSettingsModal: React.FC<CrateSettingsModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSaveRates,
  fishCrateMapping,
  onSaveFishCrateMapping,
  sellerVolume,
  currentTier
}) => {
  const [activeTab, setActiveTab] = useState<'rates' | 'fish_binding'>('rates');

  // Rates states
  const [basinLarge, setBasinLarge] = useState<number>(rates.basin_large);
  const [crateMedium, setCrateMedium] = useState<number>(rates.crate_medium);
  const [crateSmall, setCrateSmall] = useState<number>(rates.crate_small);

  // Fish crate mapping state
  const [mapping, setMapping] = useState<FishCrateMapping>({ ...fishCrateMapping });

  const [isSavedToast, setIsSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playSuccess();
    
    // Save rates
    onSaveRates({
      basin_large: Math.max(0, Number(basinLarge) || 0),
      crate_medium: Math.max(0, Number(crateMedium) || 0),
      crate_small: Math.max(0, Number(crateSmall) || 0),
      styrofoam: 0, // Always locked at 0
      platformFeePerCrate: currentTier.ratePerCrate
    });

    // Save fish mapping
    onSaveFishCrateMapping(mapping);

    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 900);
  };

  const handleUpdateFishMapping = (fishId: FishType, crateId: CrateType) => {
    soundEffects.playClick();
    setMapping(prev => ({
      ...prev,
      [fishId]: crateId
    }));
  };

  // Progress to next tier calculation
  let nextTierThreshold: number | null = null;
  let nextTierName = '';
  let nextTierRate = 0;
  if (currentTier.tierKey === 'small') {
    nextTierThreshold = 500;
    nextTierName = 'البائع المتوسط';
    nextTierRate = 0.80;
  } else if (currentTier.tierKey === 'medium') {
    nextTierThreshold = 1000;
    nextTierName = 'البائع الكبير';
    nextTierRate = 0.70;
  }

  const cratesNeeded = nextTierThreshold ? Math.max(0, nextTierThreshold - sellerVolume) : 0;
  const progressPercent = nextTierThreshold 
    ? Math.min(100, Math.round((sellerVolume / nextTierThreshold) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        {/* Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>لوحة الإعدادات والربط المسبق</span>
              </h2>
              <p className="text-[10px] text-slate-400">
                تسعيرات الضمانة، أرباح المنصة، وربط نوع الصندوق التلقائي لكل صنف سمك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tabs inside Settings */}
        <div className="px-4 pt-3 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('rates');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
              activeTab === 'rates'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>تسعيرة الضمانة والعمولة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('fish_binding');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
              activeTab === 'fish_binding'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>ربط الصناديق بالأسماك تلقائياً</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          {/* TAB 1: GUARANTEE RATES & PLATFORM TIERS */}
          {activeTab === 'rates' && (
            <div className="space-y-4">
              {/* Platform Monetization Tiers Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>أرباح المنصة حسب حجم البائع (MAD/صندوق)</span>
                  </span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded px-2 py-0.5 font-bold">
                    حجمك: {sellerVolume} صندوق
                  </span>
                </div>

                {/* Tier Cards Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div 
                    className={`p-2 rounded-xl border text-center transition-all ${
                      currentTier.tierKey === 'small'
                        ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 opacity-70'
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 block font-bold">البائع الصغير</span>
                    <span className="text-[10px] text-slate-500 block">&lt; 500 صندوق</span>
                    <span className="text-base font-black font-mono text-cyan-300 block my-0.5">
                      1.00 <span className="text-[9px] font-sans">د.م</span>
                    </span>
                    {currentTier.tierKey === 'small' && (
                      <span className="inline-block text-[9px] bg-cyan-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                        فئتك
                      </span>
                    )}
                  </div>

                  <div 
                    className={`p-2 rounded-xl border text-center transition-all ${
                      currentTier.tierKey === 'medium'
                        ? 'bg-blue-950/60 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-slate-900 border-slate-800 opacity-70'
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 block font-bold">البائع المتوسط</span>
                    <span className="text-[10px] text-slate-500 block">500 - 999 صندوق</span>
                    <span className="text-base font-black font-mono text-blue-300 block my-0.5">
                      0.80 <span className="text-[9px] font-sans">د.م</span>
                    </span>
                    {currentTier.tierKey === 'medium' && (
                      <span className="inline-block text-[9px] bg-blue-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                        فئتك
                      </span>
                    )}
                  </div>

                  <div 
                    className={`p-2 rounded-xl border text-center transition-all ${
                      currentTier.tierKey === 'large'
                        ? 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-400'
                        : 'bg-slate-900 border-slate-800 opacity-70'
                    }`}
                  >
                    <span className="text-[9px] text-slate-400 block font-bold">البائع الكبير</span>
                    <span className="text-[10px] text-slate-500 block">1,000+ صندوق</span>
                    <span className="text-base font-black font-mono text-emerald-300 block my-0.5">
                      0.70 <span className="text-[9px] font-sans">د.م</span>
                    </span>
                    {currentTier.tierKey === 'large' && (
                      <span className="inline-block text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                        فئتك
                      </span>
                    )}
                  </div>
                </div>

                {nextTierThreshold && (
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[10px] space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>الترقية إلى <strong className="text-cyan-300">{nextTierName}</strong> ({nextTierRate.toFixed(2)} د.م/ص):</span>
                      <span className="font-mono text-cyan-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">
                      متبقي تداول <strong className="text-white font-mono">{cratesNeeded}</strong> صندوق لخفض عمولة المنصة تلقائياً.
                    </p>
                  </div>
                )}
              </div>

              {/* Deposit Rates */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>تسعيرة الضمانة (الكاشيون) للصناديق المينائية المسترجعة:</span>
                </span>

                {/* Large Basin */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">بانيو بلاستيكي أبيض (حجم كبير)</span>
                    <span className="text-[10px] text-slate-400">سعة 40-50 كغ · مسترجع مع ضمانة</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      value={basinLarge}
                      onChange={(e) => setBasinLarge(Number(e.target.value))}
                      className="w-16 h-10 px-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-mono font-bold text-base text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs text-slate-400 font-mono">د.م</span>
                  </div>
                </div>

                {/* Medium Crate */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">صندوق بلاستيكي أبيض (حجم متوسط)</span>
                    <span className="text-[10px] text-slate-400">سوق الجملة الموحد · مسترجع مع ضمانة</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      value={crateMedium}
                      onChange={(e) => setCrateMedium(Number(e.target.value))}
                      className="w-16 h-10 px-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-mono font-bold text-base text-blue-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs text-slate-400 font-mono">د.م</span>
                  </div>
                </div>

                {/* Small Crate */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">صندوق بلاستيكي أبيض (حجم صغير)</span>
                    <span className="text-[10px] text-slate-400">لأسماك السطح والميرلان · مسترجع مع ضمانة</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      value={crateSmall}
                      onChange={(e) => setCrateSmall(Number(e.target.value))}
                      className="w-16 h-10 px-2 rounded-xl bg-slate-900 border border-slate-700 text-center font-mono font-bold text-base text-indigo-300 focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-xs text-slate-400 font-mono">د.م</span>
                  </div>
                </div>

                {/* Styrofoam locked to 0 */}
                <div className="bg-slate-950/80 border border-amber-850/40 rounded-2xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-200">صندوق البوليسترين / الفرشي</span>
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-1 rounded">غير مسترجع</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">مغلق وثابت على 0 درهم ضمانة بحسب عرف الموانئ</span>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono font-bold text-sm text-slate-300">0.00</span>
                    <span className="text-[10px]">د.م</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATED BACKGROUND CRATE BINDING PER FISH SPECIES */}
          {activeTab === 'fish_binding' && (
            <div className="space-y-3">
              <div className="bg-cyan-950/40 border border-cyan-800/40 rounded-2xl p-3 text-xs text-cyan-200 flex items-start gap-2">
                <PackageCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  حدد نوع الصندوق المعتمد تلقائياً لكل صنف سمك. بمجرد اختيار الصنف في شاشة <strong>"الطيار"</strong>، سيتم ربط الصندوق والضمانة فوراً في الخلفية دون الحاجة لاختياره يدوياً.
                </span>
              </div>

              <div className="space-y-2">
                {FISH_CATALOG.map((fish) => {
                  const currentBinding = mapping[fish.id] || fish.defaultCrateType || 'crate_medium';

                  return (
                    <div 
                      key={fish.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={fish.image}
                          alt={fish.nameAr}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {fish.nameAr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {fish.nameFr} · {fish.defaultPrice} د.م
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <select
                          value={currentBinding}
                          onChange={(e) => handleUpdateFishMapping(fish.id, e.target.value as CrateType)}
                          className="h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                          {CRATE_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.shortLabel} {cat.id === 'styrofoam' ? '(0 د.م)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {isSavedToast && (
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 justify-center font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تم حفظ وتحديث الإعدادات بنجاح!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setBasinLarge(30);
                setCrateMedium(20);
                setCrateSmall(15);
                setMapping({
                  sardine: 'crate_medium',
                  sole: 'basin_large',
                  calamari: 'crate_medium',
                  gambas: 'crate_small',
                  merlan: 'crate_small',
                  octopus: 'basin_large'
                });
              }}
              className="px-3.5 h-11 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              استرجاع الافتراضي
            </button>

            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>تأكيد وحفظ الإعدادات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
