import React, { useState } from 'react';
import { 
  RotateCcw, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Send, 
  AlertTriangle, 
  Coins, 
  TrendingDown, 
  PackageCheck,
  Truck
} from 'lucide-react';
import { LogisticsShipment } from '../types';
import { getCrateCategoryInfo } from '../utils/storage';
import { soundEffects } from '../utils/audio';
import { openWhatsAppOpenAccountLedger } from '../utils/whatsapp';

interface CrateReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: LogisticsShipment | null;
  onConfirmReturn: (
    shipmentId: string,
    returnedCrates: number,
    cashPaid: number,
    notes?: string,
    sendWhatsApp?: boolean
  ) => void;
}

export const CrateReturnModal: React.FC<CrateReturnModalProps> = ({
  isOpen,
  onClose,
  shipment,
  onConfirmReturn
}) => {
  if (!isOpen || !shipment) return null;

  const crateInfo = getCrateCategoryInfo(shipment.crateType);
  
  // Default to returning most or all crates (e.g. 900 out of 1000 as in the brief)
  const defaultReturnSuggestion = shipment.returnedCrates > 0 
    ? shipment.returnedCrates 
    : Math.round(shipment.shippedCrates * 0.9);

  const [returnedCrates, setReturnedCrates] = useState<number>(defaultReturnSuggestion);
  const [cashPaidAmount, setCashPaidAmount] = useState<number>(shipment.cashPaidAmount || 0);
  const [returnNotes, setReturnNotes] = useState<string>(
    shipment.notes || `تفريغ الشحنة واسترجاع الصناديق الفارغة مع السائق.`
  );

  // Calculations
  const clampedReturned = Math.max(0, Math.min(shipment.shippedCrates, returnedCrates));
  const unreturnedCount = Math.max(0, shipment.shippedCrates - clampedReturned);
  const refundedCaution = clampedReturned * shipment.cautionPerCrate;
  const remainingCautionDebt = unreturnedCount * shipment.cautionPerCrate;

  // Net Balance = (Fish Value - Cash Paid) + Remaining Caution Debt
  const remainingFishDebt = Math.max(0, shipment.totalFishValue - cashPaidAmount);
  const netBalanceOwed = remainingFishDebt + remainingCautionDebt;

  const handleSetQuickPercentage = (percent: number) => {
    soundEffects.playClick();
    const count = Math.round((shipment.shippedCrates * percent) / 100);
    setReturnedCrates(count);
  };

  const handleConfirm = (sendWhatsApp: boolean) => {
    soundEffects.playSuccess();
    onConfirmReturn(
      shipment.id,
      clampedReturned,
      cashPaidAmount,
      returnNotes,
      sendWhatsApp
    );

    if (sendWhatsApp) {
      const updatedShipment: LogisticsShipment = {
        ...shipment,
        returnedCrates: clampedReturned,
        refundedCautionAmount: refundedCaution,
        unreturnedCrates: unreturnedCount,
        activeCautionDebt: remainingCautionDebt,
        cashPaidAmount: cashPaidAmount,
        netBalanceOwed: netBalanceOwed,
        status: unreturnedCount === 0 && netBalanceOwed === 0 ? 'settled' : 'partially_returned',
        notes: returnNotes
      };
      openWhatsAppOpenAccountLedger(updatedShipment);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>تفريغ الشحنة وتصفية الصناديق</span>
                <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                  #{shipment.id}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                خصم فوري لضمانة الصناديق المرجعة وتحديث الحساب المفتوح
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
          {/* Shipment Summary Context */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold text-white">{shipment.destinationMarket}</span>
                <span className="text-slate-500">·</span>
                <span className="text-cyan-300 font-mono">{shipment.destinationCity}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                <span>المستلم: </span>
                <strong className="text-slate-200">{shipment.buyerName}</strong>
                <span className="text-slate-500 mx-1">|</span>
                <span>السائق: </span>
                <span className="text-slate-300">{shipment.driverName}</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">إجمالي المشحون:</span>
              <span className="font-mono font-black text-cyan-300 text-sm">
                {shipment.shippedCrates.toLocaleString()} صندوق
              </span>
              <span className="text-[9px] text-slate-500 block">({crateInfo.shortLabel})</span>
            </div>
          </div>

          {/* Crate Return Stepper & Quick Chips */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-400" />
                <span>الصناديق الفارغة المسترجعة الآن:</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {clampedReturned} من أصل {shipment.shippedCrates}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                max={shipment.shippedCrates}
                value={returnedCrates}
                onChange={(e) => setReturnedCrates(Number(e.target.value))}
                className="w-full h-12 px-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xl font-black text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
              <span className="absolute left-3 top-3.5 text-xs text-slate-500 font-mono">
                صندوق فارغ
              </span>
            </div>

            {/* Quick Percent Chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 shrink-0">تحديد سريع:</span>
              {[
                { label: 'الكل (100%)', pct: 100 },
                { label: '90% (900 ص)', pct: 90 },
                { label: '80% (800 ص)', pct: 80 },
                { label: '50% (نصف)', pct: 50 }
              ].map((item) => (
                <button
                  key={item.pct}
                  type="button"
                  onClick={() => handleSetQuickPercentage(item.pct)}
                  className="flex-1 py-1 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 font-semibold border border-slate-800 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Payment Towards Fish */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                المبلغ المسدد نقداً / بنكياً للسمك (درهم):
              </label>
              <span className="text-[10px] text-slate-400">
                قيمة السمك: {shipment.totalFishValue.toLocaleString()} د.م
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="0"
                max={shipment.totalFishValue}
                value={cashPaidAmount || ''}
                onChange={(e) => setCashPaidAmount(Number(e.target.value))}
                placeholder="المبلغ المسدد..."
                className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-base font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute left-3 top-3 text-xs text-slate-500 font-mono">درهم</span>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCashPaidAmount(shipment.totalFishValue)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
              >
                تسديد قيمة السمك كاملة ({shipment.totalFishValue.toLocaleString()} د.م)
              </button>
              <button
                type="button"
                onClick={() => setCashPaidAmount(0)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
              >
                تسجيل بدون تسديد نقدي (على الحساب المفتوح)
              </button>
            </div>
          </div>

          {/* Automatic Financial Adjustment Ledger Breakdown */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-800/40 rounded-2xl p-3.5 space-y-2 text-xs shadow-lg">
            <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
              <span>إجمالي قيمة السمك المشحون:</span>
              <span className="font-mono text-white font-bold tabular-nums">
                {shipment.totalFishValue.toLocaleString()} د.م
              </span>
            </div>

            {/* Instant Caution Credit Deduction */}
            <div className="flex items-center justify-between text-emerald-400 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1 font-semibold">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>خصم ضمانة الصناديق المسترجعة ({clampedReturned} ص × {shipment.cautionPerCrate} د.م):</span>
              </span>
              <span className="font-mono text-emerald-400 font-black tabular-nums">
                -{refundedCaution = refundedCaution} {refundedCaution.toLocaleString()} د.م
              </span>
            </div>

            {/* Remaining Crate Debt */}
            <div className="flex items-center justify-between text-amber-300 pb-1.5 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>ذمة الصناديق المتبقية ({unreturnedCount} صندوق × {shipment.cautionPerCrate} د.م):</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                {remainingCautionDebt.toLocaleString()} د.م
              </span>
            </div>

            {cashPaidAmount > 0 && (
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
                <span>المسدد نقداً / بنكياً:</span>
                <span className="font-mono text-cyan-300 font-bold tabular-nums">
                  -{cashPaidAmount.toLocaleString()} د.م
                </span>
              </div>
            )}

            {/* Net Financial Balance */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-sm font-black text-white block">
                  الرصيد الصافي المتبقي في الحساب المفتوح:
                </span>
                <span className="text-[10px] text-slate-400">
                  (باقي ثمن السمك + ضمانة الصناديق غير المسترجعة)
                </span>
              </div>
              <span className="font-mono text-xl font-black text-cyan-400 tabular-nums">
                {netBalanceOwed.toLocaleString()} د.م
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleConfirm(true)}
              className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>تأكيد الاسترجاع وإرسال كشف الحساب المفتوح عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => handleConfirm(false)}
              className="w-full h-11 rounded-2xl bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>تأكيد الاسترجاع وتحديث الحساب بدون واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
