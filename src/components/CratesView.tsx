import React, { useState } from 'react';
import { 
  Package, 
  RotateCcw, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Search, 
  CheckCircle2, 
  Layers,
  Settings,
  Coins,
  Lock,
  Sparkles,
  Info,
  Truck,
  FileSpreadsheet,
  Send,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Receipt,
  UserCheck
} from 'lucide-react';
import { 
  BuyerCrateBalance, 
  CrateGuaranteeRates, 
  PlatformTier, 
  LogisticsShipment, 
  TraderProfile 
} from '../types';
import { getCrateCategoryInfo } from '../utils/storage';
import { soundEffects } from '../utils/audio';
import { openWhatsAppOpenAccountLedger, openWhatsAppLogisticsDispatch } from '../utils/whatsapp';
import { LogisticsDispatchModal } from './LogisticsDispatchModal';
import { CrateReturnModal } from './CrateReturnModal';

interface CratesViewProps {
  crates: BuyerCrateBalance[];
  onReturnCrates: (
    buyerName: string,
    basinReturned: number,
    mediumReturned: number,
    smallReturned: number,
    refundCaution: number
  ) => void;
  guaranteeRates: CrateGuaranteeRates;
  merchantTier: PlatformTier;
  totalSellerVolume: number;
  onOpenSettings: () => void;
  totalPlatformFees: number;

  // Inter-Merchant Logistics & Open Account Props
  shipments?: LogisticsShipment[];
  onAddShipment?: (newShipment: LogisticsShipment, sendWhatsApp: boolean) => void;
  onUpdateShipmentReturn?: (
    shipmentId: string, 
    returnedCrates: number, 
    cashPaid: number, 
    notes?: string,
    sendWhatsApp?: boolean
  ) => void;
  sellerName?: string;
  traders?: TraderProfile[];
  onAddTrader?: (name: string, phone?: string, port?: string) => TraderProfile;
  currentPort?: string;
}

export const CratesView: React.FC<CratesViewProps> = ({
  crates,
  onReturnCrates,
  guaranteeRates,
  merchantTier,
  totalSellerVolume,
  onOpenSettings,
  totalPlatformFees,
  shipments = [],
  onAddShipment,
  onUpdateShipmentReturn,
  sellerName = 'المعلم بوشعيب الصويري (البائع)',
  traders = [],
  onAddTrader = () => ({ name: '', phone: '', port: '' }),
  currentPort = 'ميناء أكادير'
}) => {
  // Navigation Sub-tabs inside Crates & Logistics Hub
  const [activeSubTab, setActiveSubTab] = useState<'balances' | 'logistics' | 'open_account'>('balances');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccountTraderFilter, setOpenAccountTraderFilter] = useState<string>('all');

  // Modals state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedShipmentForReturn, setSelectedShipmentForReturn] = useState<LogisticsShipment | null>(null);
  const [selectedBuyerForReturn, setSelectedBuyerForReturn] = useState<BuyerCrateBalance | null>(null);

  // Stepper states for direct crate return modal
  const [basinLargeToReturn, setBasinLargeToReturn] = useState(0);
  const [crateMediumToReturn, setCrateMediumToReturn] = useState(0);
  const [crateSmallToReturn, setCrateSmallToReturn] = useState(0);
  const [cautionToRefund, setCautionToRefund] = useState(0);

  // Aggregated totals across all buyers (Crate Balances)
  const totalBasinLargeOwed = crates.reduce((sum, c) => sum + (c.basinLargeOwed || 0), 0);
  const totalCrateMediumOwed = crates.reduce((sum, c) => sum + (c.crateMediumOwed || 0), 0);
  const totalCrateSmallOwed = crates.reduce((sum, c) => sum + (c.crateSmallOwed || 0), 0);
  const totalStyrofoamShipped = crates.reduce((sum, c) => sum + (c.styrofoamDelivered || 0), 0);
  const totalCautionHeld = crates.reduce((sum, c) => sum + (c.cautionDepositHeld || 0), 0);

  // Aggregated Logistics & Open Account calculations
  const totalLogisticsShippedCrates = shipments.reduce((sum, s) => sum + s.shippedCrates, 0);
  const totalLogisticsReturnedCrates = shipments.reduce((sum, s) => sum + s.returnedCrates, 0);
  const totalLogisticsUnreturnedCrates = shipments.reduce((sum, s) => sum + s.unreturnedCrates, 0);
  const totalLogisticsFishValue = shipments.reduce((sum, s) => sum + s.totalFishValue, 0);
  const totalLogisticsCautionIssued = shipments.reduce((sum, s) => sum + s.totalCautionAmount, 0);
  const totalLogisticsCautionRefunded = shipments.reduce((sum, s) => sum + s.refundedCautionAmount, 0);
  const totalLogisticsActiveCautionDebt = shipments.reduce((sum, s) => sum + s.activeCautionDebt, 0);
  const totalLogisticsCashPaid = shipments.reduce((sum, s) => sum + s.cashPaidAmount, 0);
  const totalLogisticsNetBalanceOwed = shipments.reduce((sum, s) => sum + s.netBalanceOwed, 0);
  const totalLogisticsPlatformFees = shipments.reduce((sum, s) => sum + s.platformFee, 0);

  const filteredCrates = crates.filter(c => 
    c.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.destinationMarket.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.destinationCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (openAccountTraderFilter === 'all') return true;
    return s.buyerName === openAccountTraderFilter;
  });

  // Extract unique receivers for dropdown filter
  const uniqueReceivers = Array.from(new Set(shipments.map(s => s.buyerName)));

  // Return modal handlers for Crate Balances
  const openDirectReturnModal = (buyer: BuyerCrateBalance) => {
    soundEffects.playClick();
    setSelectedBuyerForReturn(buyer);
    const initialBasin = buyer.basinLargeOwed > 0 ? Math.min(5, buyer.basinLargeOwed) : 0;
    const initialMed = buyer.crateMediumOwed > 0 ? Math.min(10, buyer.crateMediumOwed) : 0;
    const initialSmall = buyer.crateSmallOwed > 0 ? Math.min(5, buyer.crateSmallOwed) : 0;

    setBasinLargeToReturn(initialBasin);
    setCrateMediumToReturn(initialMed);
    setCrateSmallToReturn(initialSmall);

    const calculatedRefund = (initialBasin * guaranteeRates.basin_large) +
                             (initialMed * guaranteeRates.crate_medium) +
                             (initialSmall * guaranteeRates.crate_small);

    setCautionToRefund(Math.min(calculatedRefund, buyer.cautionDepositHeld));
  };

  const handleUpdateReturnAmounts = (
    basin: number,
    medium: number,
    small: number
  ) => {
    setBasinLargeToReturn(basin);
    setCrateMediumToReturn(medium);
    setCrateSmallToReturn(small);

    if (selectedBuyerForReturn) {
      const calculatedRefund = (basin * guaranteeRates.basin_large) +
                               (medium * guaranteeRates.crate_medium) +
                               (small * guaranteeRates.crate_small);
      setCautionToRefund(Math.min(calculatedRefund, selectedBuyerForReturn.cautionDepositHeld));
    }
  };

  const handleConfirmDirectReturn = () => {
    if (!selectedBuyerForReturn) return;
    soundEffects.playSuccess();
    onReturnCrates(
      selectedBuyerForReturn.buyerName,
      basinLargeToReturn,
      crateMediumToReturn,
      crateSmallToReturn,
      cautionToRefund
    );
    setSelectedBuyerForReturn(null);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-3xl mx-auto space-y-4">
      {/* Header Banner & Settings Trigger */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span>نظام الصناديق والشحن والحساب المفتوح</span>
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded px-1.5 py-0.2 font-mono">
              BahrBox Logistics
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            تتبع الصناديق البلاستيكية، شحن السلع بين المدن، وتصفية الحساب المفتوح بين التجار
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-cyan-300 text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">إعدادات الضمانة</span>
        </button>
      </div>

      {/* Segmented Top Switcher (3 Primary Sub-modules) */}
      <div className="grid grid-cols-3 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setActiveSubTab('balances');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'balances'
              ? 'bg-cyan-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span className="truncate">أرصدة الصناديق</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setActiveSubTab('logistics');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeSubTab === 'logistics'
              ? 'bg-cyan-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span className="truncate">تتبع الشحنات</span>
          {shipments.filter(s => s.status === 'in_transit').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 left-2 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setActiveSubTab('open_account');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeSubTab === 'open_account'
              ? 'bg-cyan-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          <span className="truncate">الحساب المفتوح</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: ARSEDAT AS-SANADIQ (CRATE BALANCES)                */}
      {/* ============================================================== */}
      {activeSubTab === 'balances' && (
        <div className="space-y-3">
          {/* Platform Monetization Tier Summary Card */}
          <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-blue-950/60 border border-cyan-800/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{merchantTier.nameAr}</span>
                  <span className="bg-cyan-900/80 text-cyan-200 border border-cyan-700/60 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                    {merchantTier.ratePerCrate.toFixed(2)} د.م / صندوق
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  إجمالي الحجم المتداول: <strong className="text-white font-mono">{totalSellerVolume}</strong> صندوق
                </p>
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className="text-[10px] text-slate-400 block">رسوم المنصة المستحقة</span>
              <span className="font-mono font-black text-amber-300 text-sm">
                {totalPlatformFees.toLocaleString()} د.م
              </span>
            </div>
          </div>

          {/* KPI Overview Cards for the 4 Authentic Moroccan Port Crate Types */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Large Tub */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">بانيو كبير بالسوق</span>
              <span className="text-xl font-mono font-black text-cyan-400 tabular-nums">
                {totalBasinLargeOwed}
              </span>
              <span className="text-[9px] text-slate-500 block">ضمانة {guaranteeRates.basin_large} د.م</span>
            </div>

            {/* 2. Medium Crate */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">صندوق متوسط</span>
              <span className="text-xl font-mono font-black text-blue-400 tabular-nums">
                {totalCrateMediumOwed}
              </span>
              <span className="text-[9px] text-slate-500 block">ضمانة {guaranteeRates.crate_medium} د.م</span>
            </div>

            {/* 3. Small Crate */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">صندوق صغير</span>
              <span className="text-xl font-mono font-black text-indigo-400 tabular-nums">
                {totalCrateSmallOwed}
              </span>
              <span className="text-[9px] text-slate-500 block">ضمانة {guaranteeRates.crate_small} د.م</span>
            </div>

            {/* 4. Styrofoam Box (Non-returnable) */}
            <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-amber-300 block font-bold">شحنات الفرشي</span>
              <span className="text-xl font-mono font-black text-amber-400 tabular-nums">
                {totalStyrofoamShipped}
              </span>
              <span className="text-[9px] text-slate-500 block">غير مسترجع (0 د.م)</span>
            </div>
          </div>

          {/* Caution Deposit Banner */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">إجمالي مبالغ الضمانة (الكاشيون) المحجوزة</span>
                <span className="text-[10px] text-slate-400">ودائع مالية قابلة للاسترجاع عند تسليم الصناديق البيضاء</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-lg font-mono font-black text-emerald-400 tabular-nums">
                {totalCautionHeld.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 mr-1">درهم</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث باسم البائع الآخر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-10 pl-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {/* Crate Balances List */}
          <div className="space-y-2.5">
            {filteredCrates.map((crate) => {
              const totalReturnableOwed = (crate.basinLargeOwed || 0) + (crate.crateMediumOwed || 0) + (crate.crateSmallOwed || 0);

              return (
                <div
                  key={crate.buyerName}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 hover:border-slate-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {crate.buyerName}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          البائع الآخر
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        {crate.phone} · {crate.lastUpdated}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDirectReturnModal(crate)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استرجاع صناديق</span>
                    </button>
                  </div>

                  {/* 4 Crate Types Badges */}
                  <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-950 p-2 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-400 block">بانيو كبير</span>
                      <span className="font-mono font-bold text-cyan-300 text-xs tabular-nums">
                        {crate.basinLargeOwed || 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">صندوق متوسط</span>
                      <span className="font-mono font-bold text-blue-300 text-xs tabular-nums">
                        {crate.crateMediumOwed || 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">صندوق صغير</span>
                      <span className="font-mono font-bold text-indigo-300 text-xs tabular-nums">
                        {crate.crateSmallOwed || 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-amber-400/80 block">فرشي مشحون</span>
                      <span className="font-mono font-bold text-amber-300 text-xs tabular-nums">
                        {crate.styrofoamDelivered || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">
                      مجموع الصناديق البيضاء العالقة: <strong className="text-white font-mono">{totalReturnableOwed}</strong>
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      ضمانة محجوزة: {crate.cautionDepositHeld.toLocaleString()} د.م
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: LOGISTICS & CARGO DISPATCH ("تتبع الشحنات واللوجستيك")*/}
      {/* ============================================================== */}
      {activeSubTab === 'logistics' && (
        <div className="space-y-3">
          {/* Action Header */}
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">
                تتبع شحنات السمك بين الموانئ والأسواق
              </span>
              <span className="text-[10px] text-slate-400">
                تسجيل حركة الشاحنات، وجهة التفريغ، ومتابعة إرجاع الصناديق
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setIsDispatchModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>تسجيل شحنة جديدة</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي الشحنات</span>
              <span className="text-xl font-mono font-black text-cyan-400 tabular-nums">
                {shipments.length}
              </span>
              <span className="text-[9px] text-slate-500 block">شحنة لوجستية</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">صناديق بالشحن</span>
              <span className="text-xl font-mono font-black text-amber-400 tabular-nums">
                {totalLogisticsShippedCrates.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">تم شحنها بالكامل</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">صناديق مسترجعة</span>
              <span className="text-xl font-mono font-black text-emerald-400 tabular-nums">
                {totalLogisticsReturnedCrates.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-500 block">خصمت ضمانتها فوراً</span>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث بالوجهة (مثال: تطوان)، اسم التاجر، أو السائق..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pr-10 pl-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>

          {/* Shipments List */}
          <div className="space-y-3">
            {filteredShipments.map((shipment) => {
              const crateInfo = getCrateCategoryInfo(shipment.crateType);
              const returnProgress = Math.round((shipment.returnedCrates / shipment.shippedCrates) * 100);

              const statusColor = 
                shipment.status === 'settled' ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60' :
                shipment.status === 'partially_returned' ? 'bg-amber-950 text-amber-300 border-amber-700/60' :
                'bg-cyan-950 text-cyan-300 border-cyan-700/60';

              const statusText = 
                shipment.status === 'settled' ? 'خالص ومصفى بالكامل' :
                shipment.status === 'partially_returned' ? 'تفريغ جزئي ومتبقي صناديق' :
                'في الطريق نحو السوق';

              return (
                <div
                  key={shipment.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 hover:border-slate-750 transition-colors shadow-lg"
                >
                  {/* Card Header: Route & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {shipment.originPort}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-cyan-300 text-sm">
                          {shipment.destinationMarket}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          {shipment.destinationCity}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>إذن الشحنة: <strong className="font-mono text-slate-300">#{shipment.id}</strong></span>
                        <span>·</span>
                        <span>{shipment.date} ({shipment.time})</span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Parties & Logistics Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-500 block">البائع الآخر (المستلم):</span>
                      <span className="font-bold text-white truncate block">{shipment.buyerName}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">السائق والشاحنة:</span>
                      <span className="text-slate-300 truncate block">{shipment.driverName}</span>
                      <span className="text-[9px] font-mono text-amber-300 block">{shipment.truckPlate}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">السلعة والصناديق:</span>
                      <span className="font-bold text-cyan-300 truncate block">{shipment.fishNameAr}</span>
                      <span className="text-[10px] font-mono text-slate-400">{shipment.shippedCrates} ص ({crateInfo.shortLabel})</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block">صافي الحساب المفتوح:</span>
                      <span className="font-mono font-black text-cyan-400 text-sm block">
                        {shipment.netBalanceOwed.toLocaleString()} د.م
                      </span>
                    </div>
                  </div>

                  {/* Crate Return Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        حركة الصناديق: استرجع <strong className="text-emerald-400 font-mono">{shipment.returnedCrates}</strong> من أصل <strong className="text-white font-mono">{shipment.shippedCrates}</strong>
                      </span>
                      <span className="text-slate-400 font-mono">
                        متبقي بالذمة: <strong className="text-amber-300">{shipment.unreturnedCrates}</strong> صندوق
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300" 
                        style={{ width: `${returnProgress}%` }}
                        title={`تم استرجاع ${shipment.returnedCrates} صندوق`}
                      />
                      <div 
                        className="bg-amber-500/60 h-full transition-all duration-300" 
                        style={{ width: `${100 - returnProgress}%` }}
                        title={`متبقي ${shipment.unreturnedCrates} صندوق بالذمة`}
                      />
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedShipmentForReturn(shipment);
                      }}
                      className="flex-1 h-9 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تفريغ واسترجاع الصناديق</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        openWhatsAppOpenAccountLedger(shipment);
                      }}
                      className="px-3 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="إرسال كشف الحساب المفتوح للشحنة عبر واتساب"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">كشف واتساب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: INTER-MERCHANT OPEN ACCOUNT LEDGER ("الحساب المفتوح") */}
      {/* ============================================================== */}
      {activeSubTab === 'open_account' && (
        <div className="space-y-3.5">
          {/* Trader Filter Dropdown */}
          <div className="flex items-center justify-between gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>كشف حساب التاجر (البائع الآخر):</span>
            </label>

            <select
              value={openAccountTraderFilter}
              onChange={(e) => {
                soundEffects.playClick();
                setOpenAccountTraderFilter(e.target.value);
              }}
              className="bg-slate-950 border border-slate-750 text-cyan-300 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer max-w-[200px]"
            >
              <option value="all">كافة الشحنات والتجار</option>
              {uniqueReceivers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Master Open Account Balance Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-800/50 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  كشف الحساب المفتوح الجاري · Inter-Merchant Open Ledger
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {openAccountTraderFilter === 'all' ? 'إجمالي الحسابات المفتوحة لكافة الموانئ والأسواق' : openAccountTraderFilter}
                </h3>
              </div>

              {/* Master WhatsApp Dispatch Button */}
              {shipments.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    const targetShipment = openAccountTraderFilter !== 'all' 
                      ? shipments.find(s => s.buyerName === openAccountTraderFilter) || shipments[0]
                      : shipments[0];
                    openWhatsAppOpenAccountLedger(targetShipment);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>إرسال كشف الحساب المفتوح عبر واتساب</span>
                </button>
              )}
            </div>

            {/* Dynamic Open Account Financial Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Item 1: Total Fish Value */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">1. إجمالي قيمة السلعة (السمك):</span>
                  <span className="text-[10px] text-slate-500">حسب أسعار بيع الجملة</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {totalLogisticsFishValue.toLocaleString()} د.م
                </span>
              </div>

              {/* Item 2: Total Crate Caution/Deposit */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">2. إجمالي ضمانة الصناديق (الكاشيون):</span>
                  <span className="text-[10px] text-slate-500">
                    {totalLogisticsShippedCrates.toLocaleString()} صندوق مشحون
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  +{totalLogisticsCautionIssued.toLocaleString()} د.م
                </span>
              </div>

              {/* Item 3: Returned Crates & Auto Caution Deduction */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold block text-[11px] flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>3. خصم ضمانة الصناديق المسترجعة:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    استرجاع {totalLogisticsReturnedCrates.toLocaleString()} صندوق فارغ
                  </span>
                </div>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  -{totalLogisticsCautionRefunded.toLocaleString()} د.م
                </span>
              </div>

              {/* Item 4: Platform Fee */}
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">4. رسوم المنصة المطبقة ({merchantTier.ratePerCrate.toFixed(2)} د.م/ص):</span>
                  <span className="text-[10px] text-slate-500">شريحة: {merchantTier.nameAr}</span>
                </div>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {totalLogisticsPlatformFees.toLocaleString()} د.م
                </span>
              </div>
            </div>

            {/* Item 5 & 6: Active Caution Debt & Cash Payments */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
              <div className="bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-xl">
                <span className="text-[10px] text-amber-300 block font-bold">
                  ذمة الصناديق المتبقية (غير مسترجعة):
                </span>
                <span className="font-mono font-black text-amber-300 text-base">
                  {totalLogisticsActiveCautionDebt.toLocaleString()} د.م
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ({totalLogisticsUnreturnedCrates} صندوق بالسوق)
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">
                  المسدد نقداً / بنكياً حتى الآن:
                </span>
                <span className="font-mono font-black text-cyan-300 text-base">
                  {totalLogisticsCashPaid.toLocaleString()} د.م
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">
                  دفعات مخصومة من ثمن السلعة
                </span>
              </div>
            </div>

            {/* Grand Total: NET FINANCIAL BALANCE OWED */}
            <div className="bg-slate-950 p-3 rounded-xl border border-cyan-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-white block">
                  الرصيد الصافي المتبقي في الحساب المفتوح:
                </span>
                <span className="text-[10px] text-slate-400">
                  (باقي ثمن السمك + ضمانات الصناديق المعلقة بذمة البائع الآخر)
                </span>
              </div>

              <div className="text-left">
                <span className="font-mono text-2xl font-black text-cyan-400 tabular-nums">
                  {totalLogisticsNetBalanceOwed.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 mr-1 font-bold">درهم</span>
              </div>
            </div>
          </div>

          {/* Detailed Ledger Transaction History */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              سجل الشحنات المفتوحة ({filteredShipments.length}):
            </span>

            {filteredShipments.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{s.destinationMarket}</span>
                    <span className="text-[10px] bg-slate-800 text-cyan-300 px-1 rounded font-mono">
                      #{s.id}
                    </span>
                    <span className="text-[10px] text-slate-400">{s.date}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    <span>{s.buyerName}</span>
                    <span className="mx-1">·</span>
                    <span>{s.shippedCrates} صندوق ({s.fishNameAr})</span>
                    <span className="mx-1">·</span>
                    <span className="text-emerald-400">رجع {s.returnedCrates} ص</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">الباقي بالذمة</span>
                    <span className="font-mono font-bold text-cyan-300 text-xs">
                      {s.netBalanceOwed.toLocaleString()} د.م
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedShipmentForReturn(s);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-cyan-400 transition-colors cursor-pointer"
                    title="تسجيل استرجاع الصناديق"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      openWhatsAppOpenAccountLedger(s);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 transition-colors cursor-pointer"
                    title="إرسال كشف الحساب المفتوح عبر واتساب"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS: LOGISTICS DISPATCH & CRATE RETURN                      */}
      {/* ============================================================== */}
      <LogisticsDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onDispatch={(newShipment, sendWhatsApp) => {
          if (onAddShipment) {
            onAddShipment(newShipment, sendWhatsApp);
          }
        }}
        sellerName={sellerName}
        traders={traders}
        onAddTrader={onAddTrader}
        guaranteeRates={guaranteeRates}
        merchantTier={merchantTier}
        currentPort={currentPort}
      />

      <CrateReturnModal
        isOpen={selectedShipmentForReturn !== null}
        onClose={() => setSelectedShipmentForReturn(null)}
        shipment={selectedShipmentForReturn}
        onConfirmReturn={(shipmentId, returnedCount, cashPaid, notes, sendWhatsApp) => {
          if (onUpdateShipmentReturn) {
            onUpdateShipmentReturn(shipmentId, returnedCount, cashPaid, notes, sendWhatsApp);
          }
        }}
      />

      {/* Direct Crate Balances Return Modal */}
      {selectedBuyerForReturn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-4 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>استرجاع صناديق وتصفية ضمانة</span>
                </h3>
                <span className="text-[11px] text-cyan-300">
                  البائع الآخر: {selectedBuyerForReturn.buyerName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBuyerForReturn(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Stepper 1: Large Basin */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">بانيو كبير أبيض:</span>
                  <span className="text-[10px] text-slate-400">
                    في الذمة: {selectedBuyerForReturn.basinLargeOwed} (ضمانة {guaranteeRates.basin_large} د.م)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateReturnAmounts(Math.max(0, basinLargeToReturn - 1), crateMediumToReturn, crateSmallToReturn)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-cyan-300 w-6 text-center">{basinLargeToReturn}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateReturnAmounts(Math.min(selectedBuyerForReturn.basinLargeOwed, basinLargeToReturn + 1), crateMediumToReturn, crateSmallToReturn)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stepper 2: Medium Crate */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">صندوق متوسط أبيض:</span>
                  <span className="text-[10px] text-slate-400">
                    في الذمة: {selectedBuyerForReturn.crateMediumOwed} (ضمانة {guaranteeRates.crate_medium} د.م)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateReturnAmounts(basinLargeToReturn, Math.max(0, crateMediumToReturn - 1), crateSmallToReturn)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-cyan-300 w-6 text-center">{crateMediumToReturn}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateReturnAmounts(basinLargeToReturn, Math.min(selectedBuyerForReturn.crateMediumOwed, crateMediumToReturn + 1), crateSmallToReturn)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stepper 3: Small Crate */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">صندوق صغير أبيض:</span>
                  <span className="text-[10px] text-slate-400">
                    في الذمة: {selectedBuyerForReturn.crateSmallOwed} (ضمانة {guaranteeRates.crate_small} د.م)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateReturnAmounts(basinLargeToReturn, crateMediumToReturn, Math.max(0, crateSmallToReturn - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-cyan-300 w-6 text-center">{crateSmallToReturn}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateReturnAmounts(basinLargeToReturn, crateMediumToReturn, Math.min(selectedBuyerForReturn.crateSmallOwed, crateSmallToReturn + 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Styrofoam Info */}
              <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[10px] text-amber-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>صناديق الفرشي غير مسترجعة وليس لها ضمانة كاشيون.</span>
              </div>

              {/* Refund calculation */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-900/40 flex items-center justify-between text-xs">
                <span className="text-slate-300">مبلغ الضمانة المسترد للمشتري:</span>
                <span className="font-mono font-black text-emerald-400 text-base">
                  {cautionToRefund.toLocaleString()} د.م
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmDirectReturn}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد استرجاع الصناديق ورد الضمانة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
