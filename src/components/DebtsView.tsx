import React, { useState } from 'react';
import { 
  Wallet, 
  Send, 
  Search, 
  CheckCircle2, 
  ArrowDownLeft, 
  ShieldCheck, 
  PhoneCall,
  Clock
} from 'lucide-react';
import { DebtRecord } from '../types';
import { soundEffects } from '../utils/audio';
import { openWhatsAppDebtReminder } from '../utils/whatsapp';

interface DebtsViewProps {
  debts: DebtRecord[];
  onRecordPayment: (buyerName: string, amount: number) => void;
  sellerName?: string;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  onRecordPayment,
  sellerName = 'المعلم بوشعيب الصويري (البائع)'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalBuyer, setPaymentModalBuyer] = useState<DebtRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const totalOutstandingDebt = debts.reduce((sum, d) => sum + d.remainingDebt, 0);
  const totalCollected = debts.reduce((sum, d) => sum + d.totalPaidAmount, 0);

  const filteredDebts = debts.filter(d =>
    d.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPaymentModal = (buyer: DebtRecord) => {
    soundEffects.playClick();
    setPaymentModalBuyer(buyer);
    setPaymentAmount(buyer.remainingDebt);
  };

  const handleConfirmPayment = () => {
    if (!paymentModalBuyer || paymentAmount <= 0) return;
    soundEffects.playSuccess();
    onRecordPayment(paymentModalBuyer.buyerName, paymentAmount);
    setPaymentModalBuyer(null);
  };

  const handleTriggerWhatsAppReminder = (debt: DebtRecord) => {
    soundEffects.playClick();
    openWhatsAppDebtReminder(debt, sellerName);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-2xl mx-auto space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <span>الكريدي والمستحقات العالقة</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            سجل الديون والمبالغ المؤجلة بذمة البائعين الآخرين مع تذكيرات واتساب بنقرة واحدة
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-3">
          <span className="text-[10px] text-slate-400 block">إجمالي الكريدي المعلق بالسوق</span>
          <div className="text-2xl font-mono font-black text-rose-400 mt-1 tabular-nums">
            {totalOutstandingDebt.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
          </div>
          <span className="text-[10px] text-rose-300/80 block mt-0.5">
            على {debts.filter(d => d.remainingDebt > 0).length} بائع آخر
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <span className="text-[10px] text-slate-400 block">المبالغ المستخلصة</span>
          <div className="text-2xl font-mono font-black text-emerald-400 mt-1 tabular-nums">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">
            تحصيلات مؤكدة
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث عن بائع آخر..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pr-10 pl-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.map((debt) => {
          const hasDebt = debt.remainingDebt > 0;

          return (
            <div
              key={debt.buyerName}
              className={`bg-slate-900 border rounded-2xl p-3.5 space-y-3 transition-colors ${
                hasDebt ? 'border-slate-800 hover:border-slate-700' : 'border-slate-850 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {debt.buyerName}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span dir="ltr">{debt.phone}</span>
                    <span aria-hidden="true">·</span>
                    <span>آخر حركة: {debt.lastTransactionDate}</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] text-slate-500 block">المتبقي في الذمة</span>
                  <span className={`text-base font-mono font-black tabular-nums ${
                    hasDebt ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {debt.remainingDebt.toLocaleString()} د.م
                  </span>
                </div>
              </div>

              {/* Progress Bar of Payments */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>تم سداد: {debt.totalPaidAmount.toLocaleString()} د.م</span>
                  <span>المعاملات: {debt.totalTransactionsAmount.toLocaleString()} د.م</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${Math.min(100, (debt.totalPaidAmount / (debt.totalTransactionsAmount || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons: 1-Tap WhatsApp Reminder & Record Payment */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => handleTriggerWhatsAppReminder(debt)}
                  disabled={!hasDebt}
                  className="h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>تذكير واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal(debt)}
                  disabled={!hasDebt}
                  className="h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/80 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>تسجيل دفعة تسوية</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Recording Modal */}
      {paymentModalBuyer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white">تسجيل تسوية مالية</h3>
                <p className="text-xs text-cyan-400">{paymentModalBuyer.buyerName}</p>
              </div>
              <button
                onClick={() => setPaymentModalBuyer(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                إلغاء
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">إجمالي الكريدي الحالي:</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {paymentModalBuyer.remainingDebt.toLocaleString()} د.م
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">المبلغ المستلم كاش أو شيك:</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={paymentModalBuyer.remainingDebt}
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-lg font-bold focus:outline-none focus:border-cyan-400"
                  />
                  <span className="absolute left-3 top-3 text-xs text-slate-400 font-mono">درهم</span>
                </div>
              </div>

              {/* Quick settlement chips */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(paymentModalBuyer.remainingDebt)}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-medium"
                >
                  تسديد كامل المبلغ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(Math.round(paymentModalBuyer.remainingDebt / 2))}
                  className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                >
                  تسديد النصف (50%)
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-transform"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد استلام المبلغ وخصمه من الكريدي</span>
            </button>
          </div>
        </div>
      )}

      {/* Security standard badge */}
      <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>بياناتك المالية مشفرة وآمنة 100%</span>
      </div>
    </div>
  );
};
