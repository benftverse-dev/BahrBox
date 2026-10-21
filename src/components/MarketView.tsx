import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Waves, 
  Clock, 
  Radio, 
  Plus, 
  Truck, 
  Package, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Search, 
  Building2, 
  MapPin, 
  Layers, 
  Anchor, 
  ArrowLeftRight, 
  Sparkles,
  Phone,
  X
} from 'lucide-react';
import { CargoTradeListing, FishType, CrateMaterial, LogisticsStatus, TradeListingType } from '../types';
import { INITIAL_MARKET_PRICES, FISH_CATALOG, CRATE_CATEGORIES, getCrateCategoryInfo } from '../utils/storage';
import { soundEffects } from '../utils/audio';
import { openWhatsAppTradeNegotiation } from '../utils/whatsapp';

interface MarketViewProps {
  currentMerchantName?: string;
  cargoListings?: CargoTradeListing[];
  onAddCargoListing?: (listing: CargoTradeListing) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  currentMerchantName = 'المعلم بوشعيب الصويري (البائع)',
  cargoListings = [],
  onAddCargoListing
}) => {
  // Main sub-tab switcher: 'trading' | 'prices'
  const [subTab, setSubTab] = useState<'trading' | 'prices'>('trading');

  // Trading Filters
  const [tradeTypeFilter, setTradeTypeFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [selectedPortFilter, setSelectedPortFilter] = useState<string>('الكل');
  const [selectedFishFilter, setSelectedFishFilter] = useState<string>('الكل');
  const [tradeSearch, setTradeSearch] = useState<string>('');

  // Post Cargo Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postType, setPostType] = useState<TradeListingType>('offer');
  const [postFishId, setPostFishId] = useState<FishType>('sardine');
  const [postCrateCount, setPostCrateCount] = useState<number>(50);
  const [postCrateType, setPostCrateType] = useState<CrateMaterial>('crate_medium');
  const [postPrice, setPostPrice] = useState<number>(185);
  const [postPort, setPostPort] = useState<string>('الداخلة');
  const [postLogistics, setPostLogistics] = useState<LogisticsStatus>('ready');
  const [postTransitDest, setPostTransitDest] = useState<string>('الدار البيضاء');
  const [postPhone, setPostPhone] = useState<string>('+212661234567');
  const [postNotes, setPostNotes] = useState<string>('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ show: boolean; text: string; type: 'success' | 'info' }>({
    show: false,
    text: '',
    type: 'success'
  });

  const portsList = ['الكل', 'الداخلة', 'العيون', 'أكادير', 'طانطان', 'الدار البيضاء', 'طنجة', 'الناظور'];

  // Filter cargo listings
  const filteredListings = cargoListings.filter(item => {
    const matchesType = tradeTypeFilter === 'all' || item.type === tradeTypeFilter;
    const matchesPort = selectedPortFilter === 'الكل' || item.port === selectedPortFilter;
    const matchesFish = selectedFishFilter === 'الكل' || item.fishId === selectedFishFilter;
    const matchesSearch = !tradeSearch || 
      item.sellerName.toLowerCase().includes(tradeSearch.toLowerCase()) ||
      item.fishNameAr.toLowerCase().includes(tradeSearch.toLowerCase()) ||
      item.port.toLowerCase().includes(tradeSearch.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(tradeSearch.toLowerCase()));
    
    return matchesType && matchesPort && matchesFish && matchesSearch;
  });

  // Filter official auction prices
  const filteredPrices = selectedPortFilter === 'الكل'
    ? INITIAL_MARKET_PRICES
    : INITIAL_MARKET_PRICES.filter(p => p.port === selectedPortFilter);

  // Trigger WhatsApp trade negotiation
  const handleNegotiateWhatsApp = (listing: CargoTradeListing) => {
    soundEffects.playSuccess();
    openWhatsAppTradeNegotiation(listing, currentMerchantName);
    setToastMessage({
      show: true,
      text: `تم فتح واتساب للتفاوض مع البائع: ${listing.sellerName}`,
      type: 'success'
    });
    setTimeout(() => setToastMessage({ show: false, text: '', type: 'success' }), 3500);
  };

  // Submit new cargo posting
  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (postCrateCount <= 0 || postPrice <= 0) {
      soundEffects.playWarning();
      return;
    }

    const fishDef = FISH_CATALOG.find(f => f.id === postFishId) || FISH_CATALOG[0];
    const newListing: CargoTradeListing = {
      id: `TR-${Math.floor(100 + Math.random() * 900)}`,
      type: postType,
      sellerName: currentMerchantName,
      contactPhone: postPhone.trim() || '+212661000000',
      port: postPort,
      fishId: postFishId,
      fishNameAr: fishDef.nameAr,
      fishNameFr: fishDef.nameFr,
      image: fishDef.image,
      crateCount: postCrateCount,
      crateType: postCrateType,
      askingPricePerCrate: postPrice,
      logisticsStatus: postLogistics,
      transitDestination: postLogistics === 'in_transit' ? postTransitDest : undefined,
      postedAt: 'الآن',
      notes: postNotes.trim() || undefined,
      isVerifiedMerchant: true
    };

    if (onAddCargoListing) {
      onAddCargoListing(newListing);
    }

    soundEffects.playSuccess();
    setIsPostModalOpen(false);
    setToastMessage({
      show: true,
      text: `تم نشر ${postType === 'offer' ? 'عرض الحمولة' : 'طلب الشحنة'} بنجاح في بورصة الموانئ`,
      type: 'success'
    });
    setTimeout(() => setToastMessage({ show: false, text: '', type: 'success' }), 4000);

    // Reset notes
    setPostNotes('');
  };

  return (
    <div className="pb-28 pt-2 px-3 max-w-3xl mx-auto space-y-4">
      {/* Toast Notification */}
      {toastMessage.show && (
        <div 
          className={`p-3 rounded-xl border flex items-center gap-2.5 shadow-lg text-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
              : 'bg-cyan-950/90 border-cyan-600 text-cyan-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Module Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>سوق الأسماك وتداول الحمولات</span>
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded px-1.5 py-0.5 font-bold">
              B2B Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            تداول ومشاركة السلع بين الموانئ وأسعار المزادات اليومية (ONP)
          </p>
        </div>

        {/* Action Button: Post Cargo */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setIsPostModalOpen(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-950/40 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة عرض / طلب</span>
        </button>
      </div>

      {/* Top Segmented Sub-Tab Switcher */}
      <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setSubTab('trading');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            subTab === 'trading'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>تداول السلع بين الموانئ ({filteredListings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setSubTab('prices');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            subTab === 'prices'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>بورصة الأسعار اليومية والملاحة</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. LIVE TRADER GOODS FEED SUB-TAB (تداول ومشاركة السلع بين التجار)       */}
      {/* ========================================================================= */}
      {subTab === 'trading' && (
        <div className="space-y-3.5 animate-in fade-in">
          {/* Quick Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
            {/* Offer vs Request Selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setTradeTypeFilter('all');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    tradeTypeFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setTradeTypeFilter('offer');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    tradeTypeFilter === 'offer'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  عروض البيع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setTradeTypeFilter('request');
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    tradeTypeFilter === 'request'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  طلبات الشراء
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-[200px]">
                <input
                  type="text"
                  placeholder="بحث عن سلعة أو ميناء..."
                  value={tradeSearch}
                  onChange={(e) => setTradeSearch(e.target.value)}
                  className="w-full h-9 pr-7 pl-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Ports Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <span className="text-[10px] text-slate-500 shrink-0">الميناء:</span>
              {portsList.map((port) => (
                <button
                  key={port}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedPortFilter(port);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors border ${
                    selectedPortFilter === port
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {port}
                </button>
              ))}
            </div>
          </div>

          {/* Active Listings Feed */}
          <div className="space-y-3">
            {filteredListings.map((listing) => {
              const isOffer = listing.type === 'offer';
              const totalCargoValue = listing.crateCount * listing.askingPricePerCrate;

              return (
                <div
                  key={listing.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 space-y-3 transition-colors shadow-sm"
                >
                  {/* Top Row: Seller Tag + Logistics Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {listing.sellerName}
                          </span>
                          {listing.isVerifiedMerchant && (
                            <span title="تاجر بحر موثق" className="text-cyan-400">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-cyan-400/20" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>{listing.port}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{listing.postedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Listing Type & Logistics Status Tag */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-tight ${
                        isOffer 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {isOffer ? 'عرض بيع حمولة' : 'طلب شراء حمولة'}
                      </span>

                      {/* Logistics Status */}
                      {listing.logisticsStatus === 'ready' && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>جاهز بالرصيف</span>
                        </span>
                      )}
                      {listing.logisticsStatus === 'in_transit' && (
                        <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          <span>في الطريق (شاحنة تبريد)</span>
                        </span>
                      )}
                      {listing.logisticsStatus === 'pre_order' && (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                          <Anchor className="w-3 h-3" />
                          <span>حجز قبل الرسو</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commodity Spotlight: Photo + Details */}
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-700/80 shadow-md">
                      <img
                        src={listing.image}
                        alt={listing.fishNameAr}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-xs text-[9px] text-cyan-300 text-center py-0.5 font-bold">
                        صندوق الميناء
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white truncate">
                          {listing.fishNameAr}
                        </h4>
                        <span className="text-[11px] font-mono font-black text-cyan-300 tabular-nums">
                          {listing.askingPricePerCrate} د.م <span className="text-[9px] font-normal text-slate-400">/صندوق</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                        <span className="font-bold text-white font-mono tabular-nums">
                          {listing.crateCount} صندوق
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({getCrateCategoryInfo(listing.crateType).shortLabel})
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-[11px] text-slate-400">
                          الإجمالي: <span className="font-mono font-bold text-white tabular-nums">{totalCargoValue.toLocaleString()} د.م</span>
                        </span>
                      </div>

                      {listing.transitDestination && (
                        <div className="text-[10px] text-cyan-400 font-medium truncate mt-0.5">
                          الوجهة: {listing.transitDestination}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes / Logistics Specifications */}
                  {listing.notes && (
                    <p className="text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-850 leading-relaxed">
                      {listing.notes}
                    </p>
                  )}

                  {/* Action Dispatch: 1-Tap Direct WhatsApp Negotiation */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                    <span className="text-[10px] text-slate-500 font-mono">
                      كود الحمولة: #{listing.id}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleNegotiateWhatsApp(listing)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/30 active:scale-95 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>طلب الشحنة والتفاوض عبر واتساب</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredListings.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Package className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  لا توجد عروض أو طلبات مطابقة للفلتر المحدد حالياً.
                </p>
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>كن أول من ينشر حمولة سمك</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OFFICIAL AUCTION PRICES & MARITIME BULLETIN SUB-TAB                   */}
      {/* ========================================================================= */}
      {subTab === 'prices' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Maritime & Port Weather Bulletin */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span>نشرة الصيد والملاحة البحرية اليوم:</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">تحديث الصباح</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              حالة البحر بالأطلسي الوسط والجنوب: أمواج معتدلة (1.2م)، رياح شمالية شرقية ملائمة لخروج مراكب السردين والجر بالداخلة والعيون وأكادير. دخول حمولات وفيرة متوقعة في مزاد بعد الظهيرة.
            </p>
          </div>

          {/* Port Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {portsList.map((port) => (
              <button
                key={port}
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedPortFilter(port);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                  selectedPortFilter === port
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {port}
              </button>
            ))}
          </div>

          {/* Market Ticker Cards */}
          <div className="space-y-2.5">
            {filteredPrices.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {item.fishNameAr}
                      </h3>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">
                        {item.port}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.fishNameFr} · {item.portFr}
                    </p>
                  </div>

                  <div className="text-left flex items-center gap-1.5">
                    {item.trend === 'up' && (
                      <div className="flex items-center text-xs font-bold text-emerald-400 gap-0.5 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>مرتفع</span>
                      </div>
                    )}
                    {item.trend === 'down' && (
                      <div className="flex items-center text-xs font-bold text-rose-400 gap-0.5 bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-800">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>نازل</span>
                      </div>
                    )}
                    {item.trend === 'stable' && (
                      <div className="flex items-center text-xs font-bold text-slate-300 gap-0.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <Minus className="w-3.5 h-3.5" />
                        <span>مستقر</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">السعر الوسطي</span>
                    <span className="font-mono font-black text-cyan-400 text-sm tabular-nums">
                      {item.avgPrice} د.م
                    </span>
                    <span className="text-[9px] text-slate-500 block">للصندوق</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">أدنى / أقصى ثمن</span>
                    <span className="font-mono font-bold text-slate-200 tabular-nums">
                      {item.minPrice} - {item.maxPrice}
                    </span>
                    <span className="text-[9px] text-slate-500 block">درهم</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">حجم العرض بالميناء</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {item.supplyVolumeCrates.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 block">صندوق</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>آخر افتتاح مزاد: {item.updatedTime} صباحاً</span>
                  </span>
                  <span>سوق السمك بالجملة (ONP)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. POST NEW CARGO OFFER / REQUEST MODAL                                  */}
      {/* ========================================================================= */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-4 sm:p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  <span>إضافة عرض أو طلب سلعة سمك</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  مشاركة حمولات الصناديق مباشرة مع تجار وموزعي الموانئ الأخرى
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3.5">
              {/* Step 1: Listing Type (Offer vs Request) */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  نوع الإعلان في البورصة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setPostType('offer');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      postType === 'offer'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    عرض بيع حمولة متوفرة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setPostType('request');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      postType === 'request'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    طلب شراء حمولة محددة
                  </button>
                </div>
              </div>

              {/* Step 2: Fish Selection & Crate Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  صنف السمك:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FISH_CATALOG.map((f) => {
                    const isSelected = postFishId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setPostFishId(f.id);
                          setPostPrice(f.defaultPrice);
                        }}
                        className={`p-2 rounded-xl border text-right transition-all flex flex-col items-center justify-between text-center ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={f.image}
                          alt={f.nameAr}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover mb-1"
                        />
                        <span className="text-[11px] font-bold block truncate max-w-full">
                          {f.nameAr}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity & Crate Material */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    عدد الصناديق:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={postCrateCount}
                    onChange={(e) => setPostCrateCount(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    نوع الصناديق:
                  </label>
                  <select
                    value={postCrateType}
                    onChange={(e) => setPostCrateType(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {CRATE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Origin Port & Price per Crate */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    ميناء الانطلاق / التواجد:
                  </label>
                  <select
                    value={postPort}
                    onChange={(e) => setPostPort(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                  >
                    {portsList.filter(p => p !== 'الكل').map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    السعر المطلوب (د.م/صندوق):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={postPrice}
                      onChange={(e) => setPostPrice(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-cyan-400"
                    />
                    <span className="absolute left-3 top-3 text-xs text-slate-500 font-mono">د.م</span>
                  </div>
                </div>
              </div>

              {/* Logistics Status */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  الحالة اللوجستية للشحنة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setPostLogistics('ready');
                    }}
                    className={`p-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                      postLogistics === 'ready'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    جاهز بالرصيف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setPostLogistics('in_transit');
                    }}
                    className={`p-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                      postLogistics === 'in_transit'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    في الطريق
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setPostLogistics('pre_order');
                    }}
                    className={`p-2 rounded-xl border text-center text-xs font-medium transition-colors ${
                      postLogistics === 'pre_order'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    حجز قبل الرسو
                  </button>
                </div>
              </div>

              {/* Transit Destination if In Transit */}
              {postLogistics === 'in_transit' && (
                <div className="animate-in fade-in">
                  <label className="text-xs font-bold text-cyan-300 block mb-1">
                    وجهة شاحنة التبريد:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: متجهة لسوق الجملة الدار البيضاء (الهراويين)..."
                    value={postTransitDest}
                    onChange={(e) => setPostTransitDest(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              )}

              {/* Phone for WhatsApp trade negotiations */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  رقم الواتساب للتواصل والتفاوض:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={postPhone}
                    onChange={(e) => setPostPhone(e.target.value)}
                    className="w-full h-11 px-3 text-left rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  ملاحظات أو مواصفات إضافية (اختياري):
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: صيد الصباح ممتاز، أحجام كبيرة، إمكانية شحن فوري..."
                  value={postNotes}
                  onChange={(e) => setPostNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>نشر الشحنة في بورصة الموانئ</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security standard badge */}
      <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>بياناتك المالية مشفرة وآمنة 100% · صفقات مباشرة عبر واتساب</span>
      </div>
    </div>
  );
};
