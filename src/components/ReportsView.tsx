import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Printer, 
  Share2, 
  ShieldCheck, 
  Coins, 
  Sparkles, 
  Receipt, 
  Search, 
  User, 
  Wallet, 
  Package, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Phone,
  Lock,
  Filter
} from 'lucide-react';
import { SaleEntry, TraderProfile, DebtRecord, BuyerCrateBalance, PlatformTier } from '../types';
import { calculateMerchantTier, getCrateCategoryInfo, getCrateShortLabel } from '../utils/storage';
import { soundEffects } from '../utils/audio';
import { openWhatsAppTraderStatement } from '../utils/whatsapp';

interface ReportsViewProps {
  sales: SaleEntry[];
  sellerName?: string;
  trialDaysLeft?: number;
  traders: TraderProfile[];
  debts?: DebtRecord[];
  crates?: BuyerCrateBalance[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  sellerName = 'المعلم بوشعيب الصويري (البائع)',
  trialDaysLeft = 28,
  traders,
  debts = [],
  crates = []
}) => {
  // Main sub-view: 'general_ledger' | 'trader_archive'
  const [subView, setSubView] = useState<'general_ledger' | 'trader_archive'>('trader_archive');

  // --- GENERAL LEDGER STATES ---
  const [generalDate, setGeneralDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [generalBuyerFilter, setGeneralBuyerFilter] = useState<string>('الكل');
  const [generalSearch, setGeneralSearch] = useState<string>('');

  // --- TRADER ARCHIVE STATES ---
  const [selectedTraderName, setSelectedTraderName] = useState<string>(
    traders[0]?.name || (sales[0]?.buyerName || '')
  );
  const [traderDateMode, setTraderDateMode] = useState<'all' | 'specific'>('all');
  const [traderSpecificDate, setTraderSpecificDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [traderSearchTerm, setTraderSearchTerm] = useState<string>('');

  // Unique list of all traders present
  const allKnownTraders = Array.from(
    new Set([
      ...traders.map(t => t.name),
      ...sales.map(s => s.buyerName)
    ])
  );

  // ----------------------------------------------------
  // TRADER ARCHIVE CALCULATIONS
  // ----------------------------------------------------
  const currentTraderProfile = traders.find(t => t.name === selectedTraderName);
  const currentTraderDebt = debts.find(d => d.buyerName === selectedTraderName);
  const currentTraderCrates = crates.find(c => c.buyerName === selectedTraderName);

  // Filter sales for the selected trader
  const traderAllSales = sales.filter(s => s.buyerName === selectedTraderName);

  const traderFilteredSales = traderAllSales.filter(s => {
    if (traderDateMode === 'specific' && traderSpecificDate) {
      return s.date === traderSpecificDate;
    }
    return true;
  });

  const traderTotalFish = traderFilteredSales.reduce((acc, s) => acc + s.totalFishAmount, 0);
  const traderTotalCaution = traderFilteredSales.reduce((acc, s) => acc + s.totalCautionAmount, 0);
  const traderTotalAmount = traderFilteredSales.reduce((acc, s) => acc + s.totalTransactionAmount, 0);
  const traderTotalCrates = traderFilteredSales.reduce((acc, s) => acc + s.crateCount, 0);
  const traderPaidCash = traderFilteredSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const traderPendingDebtInPeriod = traderTotalAmount - traderPaidCash;

  // ----------------------------------------------------
  // GENERAL LEDGER CALCULATIONS
  // ----------------------------------------------------
  const generalFilteredSales = sales.filter(s => {
    const matchesDate = !generalDate || s.date === generalDate;
    const matchesBuyer = generalBuyerFilter === 'الكل' || s.buyerName === generalBuyerFilter;
    const matchesSearch = !generalSearch || 
      s.buyerName.toLowerCase().includes(generalSearch.toLowerCase()) ||
      s.fishNameAr.toLowerCase().includes(generalSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(generalSearch.toLowerCase());
    return matchesDate && matchesBuyer && matchesSearch;
  });

  const generalTotalRevenue = generalFilteredSales.reduce((acc, s) => acc + s.totalFishAmount, 0);
  const generalTotalCaution = generalFilteredSales.reduce((acc, s) => acc + s.totalCautionAmount, 0);
  const generalTotalCrates = generalFilteredSales.reduce((acc, s) => acc + s.crateCount, 0);
  const generalTotalPaid = generalFilteredSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const generalRemainingDebt = generalFilteredSales.reduce((acc, s) => acc + (s.totalTransactionAmount - s.paidAmount), 0);

  // Total seller volume for tiering
  const totalLifetimeCrates = sales.reduce((acc, s) => acc + s.crateCount, 0);
  const currentTier = calculateMerchantTier(totalLifetimeCrates);

  // Platform fees across general ledger
  const generalPlatformFees = generalFilteredSales.reduce(
    (acc, s) => acc + (s.platformFee || s.crateCount * currentTier.ratePerCrate),
    0
  );

  // ----------------------------------------------------
  // EXPORT HANDLERS
  // ----------------------------------------------------
  const handleExportGeneralCSV = () => {
    soundEffects.playClick();
    const headers = ['رقم العملية', 'التاريخ', 'الوقت', 'البائع', 'البائع الآخر', 'الصنف', 'نوع الصندوق', 'عدد الصناديق', 'سعر الصندوق', 'مجموع السمك', 'الضمانة (كاشيون)', 'عمولة المنصة', 'الإجمالي المطلوب', 'المدفوع', 'الحالة'];
    const rows = generalFilteredSales.map(s => {
      const cInfo = getCrateCategoryInfo(s.crateType);
      return [
        s.id, s.date, s.time, `"${s.sellerName}"`, `"${s.buyerName}"`, s.fishNameAr,
        `"${cInfo.nameAr}"`, s.crateCount, s.pricePerCrate,
        s.totalFishAmount, s.totalCautionAmount, s.platformFee || (s.crateCount * currentTier.ratePerCrate),
        s.totalTransactionAmount, s.paidAmount,
        s.paymentStatus === 'paid' ? 'خالص' : (s.paymentStatus === 'partial' ? 'دفعة' : 'كريدي')
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BahrBox_GeneralLedger_${generalDate || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportTraderCSV = () => {
    soundEffects.playClick();
    const headers = ['رقم العملية', 'التاريخ', 'الوقت', 'البائع الآخر', 'الصنف', 'نوع الصندوق', 'عدد الصناديق', 'سعر الصندوق', 'مجموع السمك', 'الضمانة (كاشيون)', 'عمولة المنصة', 'الإجمالي', 'المدفوع', 'المتبقي'];
    const rows = traderFilteredSales.map(s => {
      const cInfo = getCrateCategoryInfo(s.crateType);
      return [
        s.id, s.date, s.time, `"${s.buyerName}"`, s.fishNameAr,
        `"${cInfo.nameAr}"`, s.crateCount, s.pricePerCrate,
        s.totalFishAmount, s.totalCautionAmount, s.platformFee || (s.crateCount * currentTier.ratePerCrate),
        s.totalTransactionAmount, s.paidAmount,
        s.totalTransactionAmount - s.paidAmount
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BahrBox_Statement_${selectedTraderName.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareTraderWhatsApp = () => {
    soundEffects.playClick();
    const dateText = traderDateMode === 'specific' 
      ? `يوم ${traderSpecificDate}` 
      : 'كافة المعاملات المسجلة';

    openWhatsAppTraderStatement(
      selectedTraderName,
      sellerName,
      currentTraderProfile?.phone || '+212600000000',
      traderFilteredSales,
      dateText,
      traderTotalFish,
      traderPaidCash,
      currentTraderDebt ? currentTraderDebt.remainingDebt : traderPendingDebtInPeriod,
      traderTotalCrates,
      traderTotalCaution
    );
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-4xl mx-auto space-y-4">
      {/* Header & Sub-view Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>السجلات المحاسبية وأرشيف كشوفات الحساب</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            دفتر المعاملات اليومي، أرشيف كل تاجر على حدة، وتفاصيل أرباح المنصة
          </p>
        </div>

        {/* Sub-view Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSubView('trader_archive');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subView === 'trader_archive'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>أرشيف كشف حساب التاجر</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setSubView('general_ledger');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              subView === 'general_ledger'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>السجل اليومي العام</span>
          </button>
        </div>
      </div>

      {/* Platform Monetization Tier Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">
            فئة البائع الحالية: <strong className="text-white">{currentTier.nameAr}</strong>
          </span>
          <span className="font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-md font-bold text-[10px]">
            {currentTier.ratePerCrate.toFixed(2)} د.م / صندوق
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          إجمالي حجم التداول: <span className="font-mono text-cyan-300 font-bold">{totalLifetimeCrates}</span> صندوق
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-VIEW 1: TRADER ARCHIVE (أرشيف كشف حساب لكل تاجر)     */}
      {/* ======================================================== */}
      {subView === 'trader_archive' && (
        <div className="space-y-4">
          {/* Trader & Date Filter Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span>تحديد البائع الآخر وتاريخ المعاملات:</span>
              <span className="text-[10px] text-slate-500 font-normal">
                فلترة دقيقة لمعاملات التاجر اليومية أو الشاملة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Trader Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  البائع الآخر (المستلم):
                </label>
                <div className="relative">
                  <select
                    value={selectedTraderName}
                    onChange={(e) => {
                      soundEffects.playClick();
                      setSelectedTraderName(e.target.value);
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {allKnownTraders.map((name) => (
                      <option key={name} value={name} className="bg-slate-900 text-white">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Date Filter Mode */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  تصفية التاريخ:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setTraderDateMode('all');
                    }}
                    className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-colors ${
                      traderDateMode === 'all'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    كافة التواريخ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setTraderDateMode('specific');
                    }}
                    className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-colors ${
                      traderDateMode === 'specific'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    يوم محدد
                  </button>

                  {traderDateMode === 'specific' && (
                    <input
                      type="date"
                      value={traderSpecificDate}
                      onChange={(e) => setTraderSpecificDate(e.target.value)}
                      className="h-11 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trader Financial Profile Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-xl">
            {/* Header with quick details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400 font-bold text-lg shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedTraderName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="font-mono" dir="ltr">{currentTraderProfile?.phone || '+212600000000'}</span>
                    <span>·</span>
                    <span>{currentTraderProfile?.port || 'سوق الجملة'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Statement */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareTraderWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>إرسال كشف واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportTraderCSV}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير CSV</span>
                </button>
              </div>
            </div>

            {/* Trader KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">إجمالي المسحوبات</span>
                <span className="text-lg font-mono font-black text-cyan-300 tabular-nums">
                  {traderTotalAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">درهم مغربي</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">المبالغ المسددة</span>
                <span className="text-lg font-mono font-black text-emerald-400 tabular-nums">
                  {traderPaidCash.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">درهم خالص</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">الكريدي في الذمة</span>
                <span className={`text-lg font-mono font-black tabular-nums ${
                  (currentTraderDebt?.remainingDebt || traderPendingDebtInPeriod) > 0 
                    ? 'text-rose-400' 
                    : 'text-emerald-400'
                }`}>
                  {(currentTraderDebt ? currentTraderDebt.remainingDebt : traderPendingDebtInPeriod).toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">درهم متبقي</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">صناديق مسحوبة</span>
                <span className="text-lg font-mono font-black text-blue-400 tabular-nums">
                  {traderTotalCrates}
                </span>
                <span className="text-[10px] text-slate-500 block">صندوق بالفترة</span>
              </div>
            </div>

            {/* Trader Crates Breakdown */}
            {currentTraderCrates && (
              <div className="bg-slate-950/90 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                    <span>موقف الصناديق المعمول بها مع هذا التاجر:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    كاشيون محجوز: {currentTraderCrates.cautionDepositHeld.toLocaleString()} د.م
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">بانيو كبير</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {currentTraderCrates.basinLargeOwed || 0}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">صندوق متوسط</span>
                    <span className="font-mono font-bold text-blue-300 text-sm">
                      {currentTraderCrates.crateMediumOwed || 0}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">صندوق صغير</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm">
                      {currentTraderCrates.crateSmallOwed || 0}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl border border-amber-900/40">
                    <span className="text-[10px] text-amber-300 block">شحنات فرشي</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {currentTraderCrates.styrofoamDelivered || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trader Transactions Ledger Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>سجل العمليات التفصيلي ({traderFilteredSales.length} عملية):</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {traderDateMode === 'specific' ? `ليوم ${traderSpecificDate}` : 'كافة العمليات'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">رقم العملية</th>
                    <th className="py-2.5 px-3">التاريخ والوقت</th>
                    <th className="py-2.5 px-3">الصنف البحري</th>
                    <th className="py-2.5 px-3">نوع الصندوق</th>
                    <th className="py-2.5 px-3 text-center">العدد</th>
                    <th className="py-2.5 px-3">سعر الصندوق</th>
                    <th className="py-2.5 px-3">ثمن السمك</th>
                    <th className="py-2.5 px-3">الضمانة</th>
                    <th className="py-2.5 px-3">المجموع</th>
                    <th className="py-2.5 px-3">المدفوع</th>
                    <th className="py-2.5 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {traderFilteredSales.map((sale) => {
                    const cInfo = getCrateCategoryInfo(sale.crateType);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{sale.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {sale.date} <span className="text-slate-600">{sale.time}</span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">{sale.fishNameAr}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            sale.crateType === 'styrofoam'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-200'
                          }`}>
                            {cInfo.shortLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300">
                          {sale.crateCount}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{sale.pricePerCrate} د.م</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          {sale.totalFishAmount.toLocaleString()} د.م
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          {sale.totalCautionAmount} د.م
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                          {sale.totalTransactionAmount.toLocaleString()} د.م
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {sale.paidAmount.toLocaleString()} د.م
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : sale.paymentStatus === 'partial'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {sale.paymentStatus === 'paid' ? 'خالص' : (sale.paymentStatus === 'partial' ? 'دفعة' : 'كريدي')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {traderFilteredSales.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500 text-xs">
                        لا توجد عمليات مسجلة لهذا التاجر في التاريخ المحدد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-VIEW 2: GENERAL LEDGER (السجل اليومي العام)         */}
      {/* ======================================================== */}
      {subView === 'general_ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <input
                type="date"
                value={generalDate}
                onChange={(e) => setGeneralDate(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              />

              <select
                value={generalBuyerFilter}
                onChange={(e) => setGeneralBuyerFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="الكل">كافة التجار</option>
                {allKnownTraders.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportGeneralCSV}
              className="px-3.5 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير السجل اليومي CSV</span>
            </button>
          </div>

          {/* General KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي مبيعات السمك</span>
              <span className="text-lg font-mono font-black text-cyan-400 tabular-nums">
                {generalTotalRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">درهم</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي ضمانات الصناديق</span>
              <span className="text-lg font-mono font-black text-emerald-400 tabular-nums">
                {generalTotalCaution.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">درهم كاشيون</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">رسوم المنصة ({currentTier.ratePerCrate.toFixed(2)} د.م/ص)</span>
              <span className="text-lg font-mono font-black text-amber-300 tabular-nums">
                {generalPlatformFees.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">درهم مستحق</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 block font-bold">مجموع الصناديق</span>
              <span className="text-lg font-mono font-black text-blue-400 tabular-nums">
                {generalTotalCrates}
              </span>
              <span className="text-[10px] text-slate-500 block">صندوق</span>
            </div>
          </div>

          {/* General Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">رقم العملية</th>
                    <th className="py-2.5 px-3">الوقت</th>
                    <th className="py-2.5 px-3">البائع الآخر</th>
                    <th className="py-2.5 px-3">الصنف</th>
                    <th className="py-2.5 px-3">نوع الصندوق</th>
                    <th className="py-2.5 px-3 text-center">العدد</th>
                    <th className="py-2.5 px-3">السعر</th>
                    <th className="py-2.5 px-3">مجموع السمك</th>
                    <th className="py-2.5 px-3">الضمانة</th>
                    <th className="py-2.5 px-3">رسوم المنصة</th>
                    <th className="py-2.5 px-3">الإجمالي</th>
                    <th className="py-2.5 px-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {generalFilteredSales.map((sale) => {
                    const cInfo = getCrateCategoryInfo(sale.crateType);
                    const fee = sale.platformFee || (sale.crateCount * currentTier.ratePerCrate);
                    return (
                      <tr key={sale.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{sale.id}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{sale.time}</td>
                        <td className="py-2.5 px-3 font-bold text-white truncate max-w-[140px]">{sale.buyerName}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{sale.fishNameAr}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            sale.crateType === 'styrofoam'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-200'
                          }`}>
                            {cInfo.shortLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300">{sale.crateCount}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{sale.pricePerCrate} د.م</td>
                        <td className="py-2.5 px-3 font-mono text-white">{sale.totalFishAmount.toLocaleString()} د.م</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{sale.totalCautionAmount} د.م</td>
                        <td className="py-2.5 px-3 font-mono text-amber-300">{fee} د.م</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{sale.totalTransactionAmount.toLocaleString()} د.م</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : sale.paymentStatus === 'partial'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {sale.paymentStatus === 'paid' ? 'خالص' : (sale.paymentStatus === 'partial' ? 'دفعة' : 'كريدي')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>🔒 بياناتك المالية مشفرة وآمنة 100%</span>
      </div>
    </div>
  );
};
