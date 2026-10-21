import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Send, 
  UserCheck, 
  Check, 
  AlertCircle, 
  ChevronDown, 
  UserPlus, 
  X,
  Search,
  Coins,
  PackageCheck,
  Settings
} from 'lucide-react';
import { 
  FishType, 
  CrateType, 
  SaleEntry, 
  TraderProfile, 
  CrateGuaranteeRates, 
  PlatformTier,
  FishCrateMapping 
} from '../types';
import { FISH_CATALOG, getCrateCategoryInfo } from '../utils/storage';
import { soundEffects } from '../utils/audio';
import { openWhatsAppReceipt } from '../utils/whatsapp';

interface FastSalesViewProps {
  onSaveSale: (sale: SaleEntry, andSendWhatsApp: boolean) => void;
  sellerName?: string;
  traders: TraderProfile[];
  onAddTrader: (name: string, phone?: string, port?: string) => TraderProfile;
  guaranteeRates: CrateGuaranteeRates;
  fishCrateMapping: FishCrateMapping;
  merchantTier: PlatformTier;
  onOpenSettings: () => void;
}

export const FastSalesView: React.FC<FastSalesViewProps> = ({
  onSaveSale,
  sellerName = 'المعلم بوشعيب الصويري (البائع)',
  traders,
  onAddTrader,
  guaranteeRates,
  fishCrateMapping,
  merchantTier,
  onOpenSettings
}) => {
  // 1. Flexible Buyer State ("البائع الآخر")
  const [buyerInput, setBuyerInput] = useState<string>(traders[0]?.name || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2. Fish Selection State
  const [selectedFish, setSelectedFish] = useState<FishType>('sardine');
  const currentFishDef = FISH_CATALOG.find(f => f.id === selectedFish) || FISH_CATALOG[0];

  // 3. Automated Background Crate Binding:
  // Derived automatically from pre-configured Fish Setup / Settings mapping
  const boundCrateType: CrateType = fishCrateMapping[selectedFish] || currentFishDef.defaultCrateType || 'crate_medium';
  const boundCrateInfo = getCrateCategoryInfo(boundCrateType);

  // Caution deposit is automatically resolved in background based on the bound crate type
  const cautionPerCrate = boundCrateType === 'styrofoam' ? 0 : (
    boundCrateType === 'basin_large' ? guaranteeRates.basin_large :
    boundCrateType === 'crate_medium' ? guaranteeRates.crate_medium :
    guaranteeRates.crate_small
  );

  // 4. Crate Quantity Counter State
  const [crateCount, setCrateCount] = useState<number>(20);

  // 5. Pricing & Payment States
  const [pricePerCrate, setPricePerCrate] = useState<number>(currentFishDef.defaultPrice);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Toast / Feedback state
  const [feedbackToast, setFeedbackToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  // When fish selection changes, update default price
  const handleSelectFish = (fishId: FishType) => {
    soundEffects.playClick();
    setSelectedFish(fishId);
    const def = FISH_CATALOG.find(f => f.id === fishId);
    if (def) {
      setPricePerCrate(def.defaultPrice);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered traders based on current input
  const query = buyerInput.trim().toLowerCase();
  const matchingTraders = traders.filter(t => 
    t.name.toLowerCase().includes(query) || (t.port && t.port.toLowerCase().includes(query))
  );

  const exactMatch = traders.find(
    t => t.name.trim().toLowerCase() === query
  );

  const isBrandNewTrader = query.length > 0 && !exactMatch;

  // Live Calculations
  const totalFishAmount = Math.max(0, crateCount * (pricePerCrate || 0));
  const totalCautionAmount = Math.max(0, crateCount * cautionPerCrate);
  const totalTransactionAmount = totalFishAmount + totalCautionAmount;
  const platformFee = Math.round(crateCount * merchantTier.ratePerCrate * 100) / 100;

  const handleCrateCountChange = (delta: number) => {
    soundEffects.playClick();
    setCrateCount(prev => Math.max(1, prev + delta));
  };

  const handleQuickAddCrates = (amount: number) => {
    soundEffects.playClick();
    setCrateCount(prev => Math.max(1, prev + amount));
  };

  const handleSelectTrader = (trader: TraderProfile) => {
    soundEffects.playClick();
    setBuyerInput(trader.name);
    setIsDropdownOpen(false);
  };

  const handleSelectNewCustomName = (name: string) => {
    soundEffects.playClick();
    setBuyerInput(name);
    setIsDropdownOpen(false);
  };

  const resetFormForNextTrader = () => {
    setCrateCount(20);
    setNotes('');
    setPaymentStatus('paid');
    setPaidAmount(0);
    // Switch to next trader in list or keep empty for new trader entry
    const currentIndex = traders.findIndex(b => b.name === buyerInput);
    if (currentIndex >= 0 && currentIndex < traders.length - 1) {
      setBuyerInput(traders[currentIndex + 1].name);
    } else if (traders.length > 0) {
      setBuyerInput(traders[0].name);
    }
    setIsDropdownOpen(false);
  };

  const handleSave = (andSendWhatsApp: boolean) => {
    const finalBuyerName = buyerInput.trim();

    if (!finalBuyerName) {
      soundEffects.playWarning();
      setFeedbackToast({
        show: true,
        message: 'يرجى كتابة أو اختيار اسم البائع الآخر (المستلم)',
        type: 'info'
      });
      setTimeout(() => setFeedbackToast({ show: false, message: '', type: 'info' }), 3000);
      return;
    }

    if (crateCount <= 0 || pricePerCrate <= 0) {
      soundEffects.playWarning();
      setFeedbackToast({
        show: true,
        message: 'يرجى التأكد من عدد الصناديق وسعر البيع',
        type: 'info'
      });
      setTimeout(() => setFeedbackToast({ show: false, message: '', type: 'info' }), 3000);
      return;
    }

    // Auto-save new trader if not already registered in list
    const registered = onAddTrader(finalBuyerName);

    const now = new Date();
    const saleId = `BB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSale: SaleEntry = {
      id: saleId,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: Date.now(),
      sellerName: sellerName,
      buyerName: finalBuyerName,
      fishId: selectedFish,
      fishNameAr: currentFishDef.nameAr,
      fishNameFr: currentFishDef.nameFr,
      crateType: boundCrateType,
      crateCount: crateCount,
      pricePerCrate: pricePerCrate,
      cautionPerCrate: cautionPerCrate,
      platformFee: platformFee,
      platformRateApplied: merchantTier.ratePerCrate,
      totalFishAmount: totalFishAmount,
      totalCautionAmount: totalCautionAmount,
      totalTransactionAmount: totalTransactionAmount,
      paymentStatus: paymentStatus,
      paidAmount: paymentStatus === 'paid' ? totalTransactionAmount : (paymentStatus === 'unpaid' ? 0 : paidAmount),
      notes: notes.trim() || undefined
    };

    // Trigger parent save
    onSaveSale(newSale, andSendWhatsApp);

    // Audio & Visual feedback
    soundEffects.playSuccess();

    const isNew = isBrandNewTrader;

    if (andSendWhatsApp) {
      openWhatsAppReceipt(newSale, registered?.phone);
      setFeedbackToast({
        show: true,
        message: isNew 
          ? `تم قيد العملية #${saleId}، وحفظ التاجر الجديد "${finalBuyerName}"، وفتح وصل واتساب`
          : `تم قيد العملية #${saleId} وفتح وصل واتساب للبائع الآخر`,
        type: 'success'
      });
    } else {
      setFeedbackToast({
        show: true,
        message: isNew 
          ? `تم حفظ العملية #${saleId}، وإضافة التاجر الجديد "${finalBuyerName}" للقائمة، وضبط النموذج`
          : `تم حفظ العملية #${saleId} وإعادة ضبط النموذج للتاجر التالي`,
        type: 'success'
      });
    }

    setTimeout(() => {
      setFeedbackToast({ show: false, message: '', type: 'success' });
    }, 4000);

    resetFormForNextTrader();
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-xl mx-auto space-y-4">
      {/* Toast Feedback */}
      {feedbackToast.show && (
        <div 
          className={`p-3 rounded-xl border flex items-center gap-2.5 shadow-lg text-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
              : 'bg-amber-950/90 border-amber-600 text-amber-200'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="font-semibold">{feedbackToast.message}</span>
        </div>
      )}

      {/* Module Title Banner & Monetization Tier Indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              الطيار: تسجيل بيع فوري
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            نموذج مبيعات الميناء السريعة · ترحيل فوري إلى السجل العام
          </p>
        </div>

        {/* Dynamic Tier Pill */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-left bg-slate-900 border border-slate-800 hover:border-cyan-700/60 p-1.5 px-2.5 rounded-xl transition-colors cursor-pointer"
          title="تعديل إعدادات الربط المسبق والعمولة"
        >
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>عمولة المنصة:</span>
          </div>
          <span className="text-xs font-bold text-cyan-300 font-mono block">
            {merchantTier.ratePerCrate.toFixed(2)} د.م/ص
          </span>
        </button>
      </div>

      {/* 1. FLEXIBLE BUYER PICKER ("البائع الآخر") */}
      <div className="space-y-1.5" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>البائع الآخر (المستلم / المشتري):</span>
          </label>
          <span className="text-[10px] text-slate-400">
            اختر تاجر مسجل أو اكتب اسماً جديداً
          </span>
        </div>

        <div className="relative">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={buyerInput}
              onChange={(e) => {
                setBuyerInput(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="اكتب اسم البائع الآخر الجديد أو ابحث..."
              className="w-full h-12 pr-10 pl-10 rounded-2xl bg-slate-900 border border-slate-800 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 pointer-events-none" />

            {buyerInput ? (
              <button
                type="button"
                onClick={() => {
                  setBuyerInput('');
                  inputRef.current?.focus();
                  setIsDropdownOpen(true);
                }}
                className="absolute left-3 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            )}
          </div>

          {/* Autocomplete / Trader Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full mt-1.5 right-0 left-0 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-30 overflow-hidden max-h-60 overflow-y-auto">
              {isBrandNewTrader && (
                <div
                  onClick={() => handleSelectNewCustomName(buyerInput.trim())}
                  className="p-3 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border-b border-cyan-800/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        إضافة تاجر جديد: "{buyerInput.trim()}"
                      </span>
                      <span className="text-[10px] text-cyan-300">
                        سيتم حفظه تلقائياً وتثبيته في سجل التجار
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                    جديد
                  </span>
                </div>
              )}

              {matchingTraders.length > 0 ? (
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    التجار المسجلون ({matchingTraders.length}):
                  </div>
                  {matchingTraders.map((trader) => {
                    const isSelected = trader.name.toLowerCase() === buyerInput.trim().toLowerCase();
                    return (
                      <div
                        key={trader.name}
                        onClick={() => handleSelectTrader(trader)}
                        className={`px-3 py-2.5 flex items-center justify-between hover:bg-slate-800/80 cursor-pointer transition-colors text-xs ${
                          isSelected ? 'bg-cyan-950/50 text-cyan-300 font-bold' : 'text-slate-200'
                        }`}
                      >
                        <div>
                          <span className="block font-medium">{trader.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {trader.port} · {trader.phone}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                !isBrandNewTrader && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    لا يوجد تاجر مطابق. اكتب الاسم كاملاً لحفظه.
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Quick Trader Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
          <span className="text-[10px] text-slate-500 shrink-0">شائع:</span>
          {traders.slice(0, 4).map((b) => {
            const isSelected = buyerInput.trim().toLowerCase() === b.name.trim().toLowerCase();
            return (
              <button
                key={b.name}
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setBuyerInput(b.name);
                  setIsDropdownOpen(false);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg shrink-0 transition-colors border ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {b.name.split(' ')[0]} {b.name.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FISH CARD SELECTION GRID (Authentic Moroccan wholesale port photography) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
          <span>نوع السمك (المنتج البحري):</span>
          <span className="text-[11px] text-cyan-400 font-semibold">{currentFishDef.nameAr} ({currentFishDef.nameFr})</span>
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FISH_CATALOG.map((fish) => {
            const isSelected = selectedFish === fish.id;
            return (
              <button
                key={fish.id}
                type="button"
                onClick={() => handleSelectFish(fish.id)}
                className={`relative text-right rounded-2xl overflow-hidden border p-2 transition-all duration-150 flex flex-col justify-between min-h-[110px] cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400 shadow-md shadow-cyan-900/20'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <div className="relative w-full h-16 sm:h-20 rounded-xl overflow-hidden bg-slate-950 mb-1.5 shadow-inner">
                  <img
                    src={fish.image}
                    alt={fish.nameAr}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                  />
                  {isSelected && (
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-white truncate leading-tight">
                    {fish.nameAr}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{fish.nameFr}</span>
                    <span className="font-mono text-cyan-300 font-bold tabular-nums">
                      {fish.defaultPrice} د.م
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CRATE QUANTITY COUNTER (Zero Crate Selection Cards - Clean Layout) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            عدد الصناديق المطلوبة:
          </span>

          {/* Automated background crate binding subtle info pill */}
          <div 
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:border-cyan-800 transition-colors cursor-pointer"
            title="الصندوق المعتمد مسبقاً لهذا الصنف في الإعدادات"
          >
            <PackageCheck className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-300 font-medium">المرتبط تلقائياً:</span>
            <span className="font-bold text-cyan-300">{boundCrateInfo.shortLabel}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono text-emerald-400">{cautionPerCrate} د.م كاشيون</span>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium px-2">
            الكمية الإجمالية:
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCrateCountChange(-1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-white flex items-center justify-center font-bold text-lg transition-transform cursor-pointer"
            >
              <Minus className="w-5 h-5" />
            </button>

            <span className="font-mono text-2xl font-black text-cyan-300 min-w-[50px] text-center tabular-nums">
              {crateCount}
            </span>

            <button
              type="button"
              onClick={() => handleCrateCountChange(1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-95 text-white flex items-center justify-center font-bold text-lg transition-transform cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Count Adders */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">إضافة سريعة:</span>
          {[+5, +10, +20, +50].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAddCrates(amt)}
              className="flex-1 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-300 font-semibold border border-slate-700 active:scale-95 transition-all tabular-nums cursor-pointer"
            >
              +{amt}
            </button>
          ))}
        </div>
      </div>

      {/* 4. PRICING & PAYMENT TERMS (Clean Form Fields) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              سعر بيع الصندوق (د.م)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={pricePerCrate || ''}
                onChange={(e) => setPricePerCrate(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-lg font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-500 font-mono">درهم</span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              طريقة التسوية المالية:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'paid', label: 'خالص' },
                { id: 'partial', label: 'دفعة' },
                { id: 'unpaid', label: 'كريدي' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setPaymentStatus(mode.id as any);
                  }}
                  className={`h-11 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    paymentStatus === mode.id
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {paymentStatus === 'partial' && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="text-xs text-slate-400 shrink-0">المبلغ المدفوع الآن:</span>
            <input
              type="number"
              value={paidAmount || ''}
              onChange={(e) => setPaidAmount(Number(e.target.value))}
              placeholder="المبلغ المسدد..."
              className="flex-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
            <span className="text-xs text-slate-500 font-mono">درهم</span>
          </div>
        )}
      </div>

      {/* 5. LIVE INVOICE BREAKDOWN WITH PLATFORM MONETIZATION */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-800/40 rounded-2xl p-3.5 space-y-2 text-xs shadow-lg">
        <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
          <span>ثمن السمك ({crateCount} صندوق × {pricePerCrate} د.م):</span>
          <span className="font-mono text-white font-bold tabular-nums">
            {totalFishAmount.toLocaleString()} د.م
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
          <span className="flex items-center gap-1">
            <span>ضمانة الصناديق ({boundCrateInfo.shortLabel}):</span>
            {boundCrateType === 'styrofoam' && (
              <span className="text-[10px] text-amber-400">(غير مسترجع)</span>
            )}
          </span>
          <span className="font-mono text-emerald-400 font-bold tabular-nums">
            {totalCautionAmount.toLocaleString()} د.م
          </span>
        </div>

        {/* Dynamic Platform Monetization Fee Row */}
        <div className="flex items-center justify-between text-cyan-300/80 pb-1.5 border-b border-slate-800">
          <span className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>رسوم خدمة المنصة ({merchantTier.ratePerCrate.toFixed(2)} د.م/ص):</span>
            <span className="text-[10px] text-slate-400">[{merchantTier.nameAr.split(' ')[0]} {merchantTier.nameAr.split(' ')[1]}]</span>
          </span>
          <span className="font-mono text-cyan-300 font-bold tabular-nums">
            {platformFee.toLocaleString()} د.م
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-white">المجموع الإجمالي المطلوب:</span>
          <span className="font-mono text-xl font-black text-cyan-400 tabular-nums">
            {totalTransactionAmount.toLocaleString()} د.م
          </span>
        </div>
      </div>

      {/* 6. PRIMARY ACTION BUTTONS */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => handleSave(true)}
          className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>حفظ وإرسال وصل واتساب للبائع الآخر</span>
        </button>

        <button
          type="button"
          onClick={() => handleSave(false)}
          className="w-full h-11 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 text-cyan-400" />
          <span>حفظ وإضافة تاجر آخر (قيد بالسجل فقط)</span>
        </button>
      </div>
    </div>
  );
};
