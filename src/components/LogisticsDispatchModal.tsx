import React, { useState } from 'react';
import { 
  Truck, 
  X, 
  MapPin, 
  Send, 
  User, 
  UserCheck, 
  Package, 
  ShieldCheck, 
  Coins, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  LogisticsShipment, 
  FishType, 
  CrateType, 
  TraderProfile, 
  PlatformTier, 
  CrateGuaranteeRates 
} from '../types';
import { 
  FISH_CATALOG, 
  CRATE_CATEGORIES, 
  MOROCCAN_TARGET_MARKETS, 
  getCrateCategoryInfo 
} from '../utils/storage';
import { soundEffects } from '../utils/audio';
import { openWhatsAppLogisticsDispatch } from '../utils/whatsapp';

interface LogisticsDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (newShipment: LogisticsShipment, sendWhatsApp: boolean) => void;
  sellerName: string;
  traders: TraderProfile[];
  onAddTrader: (name: string, phone?: string, port?: string) => TraderProfile;
  guaranteeRates: CrateGuaranteeRates;
  merchantTier: PlatformTier;
  currentPort: string;
}

export const LogisticsDispatchModal: React.FC<LogisticsDispatchModalProps> = ({
  isOpen,
  onClose,
  onDispatch,
  sellerName,
  traders,
  onAddTrader,
  guaranteeRates,
  merchantTier,
  currentPort
}) => {
  // Destination
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number>(0);
  const [customDestinationMarket, setCustomDestinationMarket] = useState<string>('');
  const [customDestinationCity, setCustomDestinationCity] = useState<string>('');
  const [isCustomDestination, setIsCustomDestination] = useState<boolean>(false);

  // Receiver ("البائع الآخر")
  const [buyerName, setBuyerName] = useState<string>(traders[0]?.name || 'المعلم رشيد التطواني (البائع الآخر)');
  const [buyerPhone, setBuyerPhone] = useState<string>(traders[0]?.phone || '+212661223344');

  // Origin Port
  const [originPort, setOriginPort] = useState<string>(currentPort || 'ميناء أكادير');

  // Trucker / Driver info
  const [driverName, setDriverName] = useState<string>('عبد الرحيم السطاتي');
  const [driverPhone, setDriverPhone] = useState<string>('+212668112233');
  const [truckPlate, setTruckPlate] = useState<string>('40-ب-55120');

  // Cargo details
  const [fishId, setFishId] = useState<FishType>('sardine');
  const [crateType, setCrateType] = useState<CrateType>('basin_large');
  const [shippedCrates, setShippedCrates] = useState<number>(1000);
  const [pricePerCrate, setPricePerCrate] = useState<number>(180);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentFishDef = FISH_CATALOG.find(f => f.id === fishId) || FISH_CATALOG[0];
  const crateInfo = getCrateCategoryInfo(crateType);

  // Caution per crate resolution
  const cautionPerCrate = crateType === 'styrofoam' ? 0 : (
    crateType === 'basin_large' ? guaranteeRates.basin_large :
    crateType === 'crate_medium' ? guaranteeRates.crate_medium :
    guaranteeRates.crate_small
  );

  // Financial calculations
  const totalFishValue = Math.max(0, shippedCrates * pricePerCrate);
  const totalCautionAmount = Math.max(0, shippedCrates * cautionPerCrate);
  const platformFee = Math.round(shippedCrates * merchantTier.ratePerCrate * 100) / 100;
  const initialOpenAccountTotal = totalFishValue + totalCautionAmount;

  const handleSelectMarket = (idx: number) => {
    soundEffects.playClick();
    setSelectedMarketIndex(idx);
    setIsCustomDestination(false);
  };

  const handleSelectFish = (id: FishType) => {
    soundEffects.playClick();
    setFishId(id);
    const fish = FISH_CATALOG.find(f => f.id === id);
    if (fish) {
      setPricePerCrate(fish.defaultPrice);
    }
  };

  const handleSelectCrateType = (type: CrateType) => {
    soundEffects.playClick();
    setCrateType(type);
  };

  const handleSubmit = (andSendWhatsApp: boolean) => {
    const finalBuyer = buyerName.trim();
    if (!finalBuyer) {
      soundEffects.playWarning();
      return;
    }

    if (shippedCrates <= 0 || pricePerCrate <= 0) {
      soundEffects.playWarning();
      return;
    }

    // Auto-save trader
    onAddTrader(finalBuyer, buyerPhone);

    const now = new Date();
    const targetCity = isCustomDestination ? (customDestinationCity || 'تطوان') : MOROCCAN_TARGET_MARKETS[selectedMarketIndex].city;
    const targetMarket = isCustomDestination ? (customDestinationMarket || 'السوق المركزي بتطوان') : MOROCCAN_TARGET_MARKETS[selectedMarketIndex].market;

    const shipmentId = `SHP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newShipment: LogisticsShipment = {
      id: shipmentId,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: Date.now(),
      sellerName: sellerName,
      buyerName: finalBuyer,
      buyerPhone: buyerPhone.trim() || undefined,
      originPort: originPort,
      destinationCity: targetCity,
      destinationMarket: targetMarket,
      driverName: driverName.trim() || 'سائق معتمد',
      driverPhone: driverPhone.trim() || undefined,
      truckPlate: truckPlate.trim() || 'شاحنة مبردة',
      fishId: fishId,
      fishNameAr: currentFishDef.nameAr,
      fishNameFr: currentFishDef.nameFr,
      crateType: crateType,
      shippedCrates: shippedCrates,
      pricePerCrate: pricePerCrate,
      cautionPerCrate: cautionPerCrate,
      platformFee: platformFee,
      platformRateApplied: merchantTier.ratePerCrate,
      totalFishValue: totalFishValue,
      totalCautionAmount: totalCautionAmount,
      returnedCrates: 0,
      refundedCautionAmount: 0,
      unreturnedCrates: shippedCrates,
      activeCautionDebt: totalCautionAmount,
      cashPaidAmount: 0,
      netBalanceOwed: initialOpenAccountTotal,
      status: 'in_transit',
      notes: notes.trim() || `شحنة سمك جملة من ${originPort} إلى ${targetMarket}.`,
      lastUpdate: 'انطلاق الشاحنة للتو'
    };

    soundEffects.playSuccess();
    onDispatch(newShipment, andSendWhatsApp);

    if (andSendWhatsApp) {
      openWhatsAppLogisticsDispatch(newShipment, buyerPhone);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        {/* Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>تسجيل شحنة لوجستية وحساب مفتوح</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded px-1.5 py-0.2 font-mono">
                  B2B Cargo
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                شحن بين الموانئ والأسواق المركزية (مثال: ميناء الانطلاق ⬅️ السوق المركزي بتطوان)
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

        <div className="p-4 space-y-4">
          {/* 1. Origin & Destination Market Routing */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>مسار الشحنة والسوق المستهدف:</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold font-mono">
                {originPort} ⬅️ {isCustomDestination ? customDestinationCity : MOROCCAN_TARGET_MARKETS[selectedMarketIndex].city}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  ميناء الانطلاق (المصدر):
                </label>
                <select
                  value={originPort}
                  onChange={(e) => setOriginPort(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white focus:outline-none focus:border-cyan-400"
                >
                  {['ميناء أكادير', 'ميناء الداخلة', 'ميناء العيون', 'ميناء طانطان', 'ميناء الدار البيضاء', 'ميناء طنجة', 'ميناء الصويرة'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  وجهة السوق المركزي:
                </label>
                <select
                  value={isCustomDestination ? 'custom' : selectedMarketIndex}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomDestination(true);
                    } else {
                      setIsCustomDestination(false);
                      setSelectedMarketIndex(Number(e.target.value));
                    }
                  }}
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  {MOROCCAN_TARGET_MARKETS.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m.market} ({m.city})
                    </option>
                  ))}
                  <option value="custom">وجهة مخصصة أخرى...</option>
                </select>
              </div>
            </div>

            {isCustomDestination && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-850">
                <input
                  type="text"
                  placeholder="المدينة (مثال: تطوان)"
                  value={customDestinationCity}
                  onChange={(e) => setCustomDestinationCity(e.target.value)}
                  className="h-9 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="اسم السوق (مثال: السوق المركزي بتطوان)"
                  value={customDestinationMarket}
                  onChange={(e) => setCustomDestinationMarket(e.target.value)}
                  className="h-9 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* 2. Receiver & Driver Details */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>أطراف الشحنة (المستلم وسائق الشاحنة):</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Receiver ("البائع الآخر") */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">
                  البائع الآخر (المستلم / تاجر الوجهة):
                </label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="مثال: المعلم رشيد التطواني (البائع الآخر)"
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Receiver Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">
                  هاتف المستلم (لإرسال كشف الواتساب):
                </label>
                <input
                  type="text"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+212661223344"
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Driver */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">
                  اسم سائق الشاحنة:
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="مثال: عبد الرحيم السطاتي"
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Truck Plate */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">
                  رقم الشاحنة (الترقيم):
                </label>
                <input
                  type="text"
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  placeholder="مثال: 40-ب-55120"
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 3. Fish Commodity & Crate Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 block">
              صنف السمك المشحون:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {FISH_CATALOG.map((f) => {
                const isSelected = fishId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectFish(f.id)}
                    className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/60 shadow-md ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-full h-10 rounded-lg overflow-hidden bg-slate-950 mb-1">
                      <img src={f.image} alt={f.nameAr} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold text-white block truncate leading-tight">
                      {f.nameAr}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Moroccan Port Crate Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                نوع الصناديق المشحونة:
              </label>
              <span className="text-[10px] text-cyan-400 font-medium">
                {crateInfo.nameAr}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CRATE_CATEGORIES.map((cat) => {
                const isSelected = crateType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCrateType(cat.id)}
                    className={`p-2 rounded-xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/50 ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">
                      {cat.shortLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {cat.isReturnable ? `ضمانة ${cat.defaultCaution} د.م` : 'بدون ضمانة (0 د.م)'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Crate Volume & Pricing Form */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                عدد الصناديق المشحونة:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={shippedCrates || ''}
                  onChange={(e) => setShippedCrates(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-base font-black text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
                <span className="absolute left-3 top-3 text-xs text-slate-500 font-mono">صندوق</span>
              </div>
              <div className="flex gap-1 pt-1">
                {[500, 1000, 1200].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setShippedCrates(num)}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                سعر الصندوق الواحد (د.م):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={pricePerCrate || ''}
                  onChange={(e) => setPricePerCrate(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-base font-black text-emerald-400 focus:outline-none focus:border-cyan-400"
                />
                <span className="absolute left-3 top-3 text-xs text-slate-500 font-mono">درهم</span>
              </div>
            </div>
          </div>

          {/* 6. Live Financial Ledger Breakdown */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-800/40 rounded-2xl p-3.5 space-y-2 text-xs shadow-lg">
            <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
              <span>1. قيمة السلعة المشحونة ({shippedCrates} ص × {pricePerCrate} د.م):</span>
              <span className="font-mono text-white font-bold tabular-nums">
                {totalFishValue.toLocaleString()} د.م
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
              <span>2. إجمالي ضمانة الصناديق ({crateInfo.shortLabel} × {cautionPerCrate} د.م):</span>
              <span className="font-mono text-emerald-400 font-bold tabular-nums">
                {totalCautionAmount.toLocaleString()} د.م
              </span>
            </div>

            <div className="flex items-center justify-between text-cyan-300/80 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>3. رسوم خدمة المنصة ({merchantTier.ratePerCrate.toFixed(2)} د.م/صندوق):</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold tabular-nums">
                {platformFee.toLocaleString()} د.م
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-sm font-black text-white block">
                  إجمالي فاتورة الحساب المفتوح:
                </span>
                <span className="text-[10px] text-slate-400">
                  (قيمة السمك + إجمالي الضمانة، تخصم الصناديق المسترجعة تلقائياً عند الوصول)
                </span>
              </div>
              <span className="font-mono text-xl font-black text-cyan-400 tabular-nums">
                {initialOpenAccountTotal.toLocaleString()} د.م
              </span>
            </div>
          </div>

          {/* 7. Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>تسجيل الشحنة وإشعار البائع الآخر عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full h-11 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>تسجيل الشحنة وفتح الحساب المفتوح فقط</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
