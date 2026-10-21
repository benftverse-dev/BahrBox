import React, { useState } from 'react';
import { 
  ThermometerSnowflake, 
  ArrowUpRight, 
  Plus, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  Boxes,
  Layers
} from 'lucide-react';
import { ColdStorageItem, FishType, CrateType } from '../types';
import { soundEffects } from '../utils/audio';
import { CRATE_CATEGORIES, getCrateCategoryInfo } from '../utils/storage';

interface ColdStorageViewProps {
  storageItems: ColdStorageItem[];
  onWithdrawItem: (id: string, cratesToWithdraw: number) => void;
  onAddNewBatch: (item: Omit<ColdStorageItem, 'id' | 'daysStored'>) => void;
}

export const ColdStorageView: React.FC<ColdStorageViewProps> = ({
  storageItems,
  onWithdrawItem,
  onAddNewBatch
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<ColdStorageItem | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState(1);

  // New item form state
  const [fishName, setFishName] = useState('ميرلان أبيض');
  const [fishId, setFishId] = useState<FishType>('merlan');
  const [crateCount, setCrateCount] = useState(25);
  const [crateType, setCrateType] = useState<CrateType>('crate_medium');
  const [roomName, setRoomName] = useState('غرفة التبريد رقم 1 (-2°C)');
  const [temp, setTemp] = useState(-1.8);
  const [dailyFee, setDailyFee] = useState(3.5);

  const totalCratesStored = storageItems.reduce((acc, item) => acc + item.crateCount, 0);
  const totalAccruedStorageFees = storageItems.reduce((acc, item) => 
    acc + (item.crateCount * item.dailyStorageFeePerCrate * Math.max(1, item.daysStored)), 0
  );

  const handleConfirmWithdraw = () => {
    if (!withdrawTarget) return;
    soundEffects.playSuccess();
    onWithdrawItem(withdrawTarget.id, withdrawAmount);
    setWithdrawTarget(null);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playSuccess();
    const batchNumber = `LOT-${fishId.slice(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    onAddNewBatch({
      batchNumber,
      fishId,
      fishNameAr: fishName,
      fishNameFr: fishId,
      crateCount,
      crateType,
      roomName,
      temperatureCelsius: temp,
      entryDate: new Date().toISOString().split('T')[0],
      dailyStorageFeePerCrate: dailyFee,
      sellerName: 'المعلم بوشعيب الصويري'
    });
    setShowAddModal(false);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
            <span>الثلاجة والتخزين المبرد بالميناء</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            إدارة دفعات السمك المخزنة، تتبع درجات الحرارة واحتساب رسوم التبريد
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setShowAddModal(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إيداع دفعة جديدة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>مجموع الصناديق بالثلاجات</span>
            <Boxes className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-black text-cyan-400 mt-1 tabular-nums">
            {totalCratesStored} <span className="text-xs font-normal text-slate-400">صندوق</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>رسوم التخزين المستحقة</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-black text-amber-400 mt-1 tabular-nums">
            {totalAccruedStorageFees.toLocaleString()} <span className="text-xs font-normal text-slate-400">د.م</span>
          </div>
        </div>
      </div>

      {/* Storage Lots List */}
      <div className="space-y-3">
        {storageItems.map((item) => {
          const lotFee = item.crateCount * item.dailyStorageFeePerCrate * Math.max(1, item.daysStored);
          const isFreezer = item.temperatureCelsius <= -5;
          const crateInfo = getCrateCategoryInfo(item.crateType);

          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {item.fishNameAr}
                    </h3>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      #{item.batchNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.roomName}
                  </p>
                </div>

                <div className={`px-2 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                  isFreezer ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}>
                  <ThermometerSnowflake className="w-3.5 h-3.5" />
                  <span>{item.temperatureCelsius > 0 ? `+${item.temperatureCelsius}` : item.temperatureCelsius}°C</span>
                </div>
              </div>

              {/* Grid specs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">الصناديق</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {item.crateCount} ({crateInfo.shortLabel})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">مدة الحفظ</span>
                  <span className="font-mono font-bold text-cyan-400 tabular-nums">
                    {item.daysStored} أيام
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">تكلفة التبريد</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {lotFee.toFixed(1)} د.م
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[10px] text-slate-500">
                  تاريخ الدخول: {item.entryDate} ({item.dailyStorageFeePerCrate} د.م/صندوق يومياً)
                </span>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setWithdrawTarget(item);
                    setWithdrawAmount(Math.min(10, item.crateCount));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>سحب من الثلاجة</span>
                </button>
              </div>
            </div>
          );
        })}

        {storageItems.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            لا توجد شحنات في غرف التبريد حالياً
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">إخراج صناديق للبيع أو المزاد</h3>
              <button
                type="button"
                onClick={() => setWithdrawTarget(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                إلغاء
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                الدفعة: <strong className="text-white">{withdrawTarget.fishNameAr}</strong> ({withdrawTarget.batchNumber})
              </p>

              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-bold">الكمية المراد سحبها:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max={withdrawTarget.crateCount}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Math.min(withdrawTarget.crateCount, Math.max(1, Number(e.target.value))))}
                    className="w-20 h-10 px-2 text-center rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold text-base"
                  />
                  <span className="text-xs text-slate-400">من أصل {withdrawTarget.crateCount}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmWithdraw}
              className="w-full h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>تأكيد الإخراج إلى رصيف المزاد</span>
            </button>
          </div>
        </div>
      )}

      {/* Add New Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-4 space-y-3.5 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">إيداع دفعة سمك جديدة بالثلاجة</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">نوع السمك:</label>
                <select
                  value={fishId}
                  onChange={(e) => {
                    const id = e.target.value as any;
                    setFishId(id);
                    if (id === 'sardine') setFishName('سردين الأطلسي');
                    if (id === 'sole') setFishName('صول رويال');
                    if (id === 'calamari') setFishName('كلمار / سيبيا');
                    if (id === 'gambas') setFishName('كروفيت رويال');
                    if (id === 'merlan') setFishName('ميرلان أبيض');
                    if (id === 'octopus') setFishName('أخطبوط الداخلة');
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                >
                  <option value="sardine">سردين الأطلسي</option>
                  <option value="sole">صول رويال</option>
                  <option value="calamari">كلمار / سيبيا</option>
                  <option value="gambas">كروفيت رويال</option>
                  <option value="merlan">ميرلان أبيض</option>
                  <option value="octopus">أخطبوط الداخلة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">عدد الصناديق:</label>
                  <input
                    type="number"
                    min="1"
                    value={crateCount}
                    onChange={(e) => setCrateCount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نوع الصندوق المينائي:</label>
                  <select
                    value={crateType}
                    onChange={(e) => setCrateType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                  >
                    {CRATE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">الغرفة / الحرارة:</label>
                  <select
                    value={roomName}
                    onChange={(e) => {
                      setRoomName(e.target.value);
                      if (e.target.value.includes('-18')) setTemp(-18);
                      else setTemp(-2);
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="غرفة التبريد رقم 1 (-2°C)">غرفة 1 (-2°C)</option>
                    <option value="غرفة التبريد رقم 2 (0°C)">غرفة 2 (0°C)</option>
                    <option value="غرفة التجميد العميق (-18°C)">تجميد عميق (-18°C)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">الرسم اليومي (د.م/صندوق):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dailyFee}
                    onChange={(e) => setDailyFee(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل وإيداع بالثلاجة</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
