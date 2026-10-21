export type FishType = 'sardine' | 'sole' | 'calamari' | 'gambas' | 'merlan' | 'octopus';

export interface FishDefinition {
  id: FishType;
  nameAr: string;
  nameFr: string;
  latinName: string;
  image: string;
  defaultPrice: number; // in MAD per crate
  defaultCaution: number; // in MAD per crate
  defaultCrateType?: CrateType; // Pre-bound crate type for this fish
  unitKgApprox: number;
}

export type FishCrateMapping = Record<FishType, CrateType>;

// Strict Authentic Moroccan Port Crate Types (الصناديق المعمول بها بالموانئ المغربية)
// 1. بانيو بلاستيكي أبيض (حجم كبير): مسترجع + ضمانة
// 2. صندوق بلاستيكي أبيض (حجم متوسط): مسترجع + ضمانة
// 3. صندوق بلاستيكي أبيض (حجم صغير): مسترجع + ضمانة
// 4. صندوق البوليسترين / الفرشي (Styrofoam Box): غير مسترجع، بدون ضمانة (0 د.م)
export type CrateType = 'basin_large' | 'crate_medium' | 'crate_small' | 'styrofoam';
export type CrateMaterial = CrateType; // Alias for backward compatibility

export interface CrateGuaranteeRates {
  basin_large: number; // MAD per large basin (e.g. 30)
  crate_medium: number; // MAD per medium crate (e.g. 20)
  crate_small: number; // MAD per small crate (e.g. 15)
  styrofoam: number; // Always locked at 0 (non-returnable, zero guarantee)
  platformFeePerCrate: number; // Dynamic or current tier rate
}

export interface PlatformTier {
  tierKey: 'small' | 'medium' | 'large';
  nameAr: string;
  ratePerCrate: number; // MAD per crate (1.00, 0.80, or 0.70)
  descriptionAr: string;
  minCrates: number;
  maxCrates: number | null;
}

export interface SaleEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timestamp: number;
  sellerName: string; // "البائع"
  buyerName: string; // "البائع الآخر"
  fishId: FishType;
  fishNameAr: string;
  fishNameFr: string;
  crateType: CrateType;
  crateCount: number;
  pricePerCrate: number;
  cautionPerCrate: number;
  platformFee: number; // Platform fee for this transaction = crateCount * tierRate
  platformRateApplied: number; // e.g. 1.00, 0.80, or 0.70
  totalFishAmount: number;
  totalCautionAmount: number;
  totalTransactionAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paidAmount: number;
  notes?: string;
}

export interface TraderProfile {
  name: string;
  phone: string;
  port: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface BuyerCrateBalance {
  buyerName: string;
  phone: string;
  // Authentic Moroccan crate categories
  basinLargeOwed: number; // بانيو كبير في الذمة
  basinLargeDelivered?: number;
  basinLargeReturned?: number;

  crateMediumOwed: number; // صندوق متوسط في الذمة
  crateMediumDelivered?: number;
  crateMediumReturned?: number;

  crateSmallOwed: number; // صندوق صغير في الذمة
  crateSmallDelivered?: number;
  crateSmallReturned?: number;

  styrofoamDelivered: number; // صناديق فرشي شحنت للمشتري (غير مسترجعة 0 ضمانة)

  cautionDepositHeld: number; // إجمالي مبلغ الضمانة المحجوز في ذمة البائع الآخر (MAD)
  lastUpdated: string;

  // Backward compatibility fields
  plasticOwed?: number;
  woodOwed?: number;
}

export interface ColdStorageItem {
  id: string;
  batchNumber: string;
  fishId: FishType;
  fishNameAr: string;
  fishNameFr: string;
  crateCount: number;
  crateType: CrateType;
  roomName: string;
  temperatureCelsius: number;
  entryDate: string;
  daysStored: number;
  dailyStorageFeePerCrate: number;
  sellerName: string;
}

export interface DebtRecord {
  buyerName: string;
  phone: string;
  totalTransactionsAmount: number;
  totalPaidAmount: number;
  remainingDebt: number;
  lastTransactionDate: string;
}

export interface MarketPrice {
  id: string;
  port: string;
  portFr: string;
  fishNameAr: string;
  fishNameFr: string;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  trend: 'up' | 'down' | 'stable';
  supplyVolumeCrates: number;
  updatedTime: string;
}

export type TabId = 'fast_entry' | 'crates' | 'cold_storage' | 'debts' | 'market' | 'reports';

export type TradeListingType = 'offer' | 'request'; // 'عرض بيع' | 'طلب شراء'
export type LogisticsStatus = 'ready' | 'in_transit' | 'pre_order'; 

export interface CargoTradeListing {
  id: string;
  type: TradeListingType;
  sellerName: string; // "البائع"
  contactPhone: string;
  port: string;
  fishId: FishType;
  fishNameAr: string;
  fishNameFr: string;
  image: string;
  crateCount: number;
  crateType: CrateType;
  askingPricePerCrate: number;
  logisticsStatus: LogisticsStatus;
  transitDestination?: string;
  postedAt: string;
  notes?: string;
  isVerifiedMerchant?: boolean;
}

// -------------------------------------------------------------
// Inter-Merchant Logistics & Open Account Ledger Types
// نظام الشحن واللوجستيك والحساب المفتوح بين التجار
// -------------------------------------------------------------
export type ShipmentStatus = 'in_transit' | 'partially_returned' | 'settled';

export interface LogisticsShipment {
  id: string; // e.g. "SHP-7721"
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timestamp: number;
  sellerName: string; // "البائع" (المرسل)
  buyerName: string; // "البائع الآخر" (المستلم)
  buyerPhone?: string;
  originPort: string; // e.g. "ميناء أكادير"
  destinationCity: string; // e.g. "تطوان"
  destinationMarket: string; // e.g. "السوق المركزي بتطوان"
  driverName: string; // اسم السائق
  driverPhone?: string;
  truckPlate: string; // رقم الشاحنة (لوحة الترقيم)
  fishId: FishType;
  fishNameAr: string;
  fishNameFr: string;
  crateType: CrateType;
  shippedCrates: number; // عدد الصناديق المشحونة
  pricePerCrate: number; // ثمن الصندوق
  cautionPerCrate: number; // ضمانة الصندوق الواحد
  platformFee: number; // رسوم المنصة
  platformRateApplied: number; // رسم المنصة للصندوق
  totalFishValue: number; // قيمة السلعة = shippedCrates * pricePerCrate
  totalCautionAmount: number; // إجمالي الضمانة = shippedCrates * cautionPerCrate
  returnedCrates: number; // الصناديق الفارغة المسترجعة
  refundedCautionAmount: number; // الضمانة المسترجعة المخصومة
  unreturnedCrates: number; // الصناديق المتبقية بذمة البائع الآخر
  activeCautionDebt: number; // الضمانة المعلقة المتبقية بذمته
  cashPaidAmount: number; // المبالغ المسددة نقداً أو تحويلاً
  netBalanceOwed: number; // الرصيد الصافي المتبقي في الذمة = (totalFishValue - cashPaidAmount) + activeCautionDebt
  status: ShipmentStatus;
  notes?: string;
  lastUpdate?: string;
}

export interface OpenAccountLedger {
  buyerName: string;
  buyerPhone?: string;
  destinationCity: string;
  destinationMarket: string;
  shipments: LogisticsShipment[];
  totalShippedCrates: number;
  totalReturnedCrates: number;
  totalUnreturnedCrates: number;
  totalFishValue: number;
  totalCautionIssued: number;
  totalCautionRefunded: number;
  activeCautionDebt: number;
  totalCashPaid: number;
  totalPlatformFees: number;
  netFinancialBalance: number; // الرصيد الصافي المتبقي المطلوب
  lastShipmentDate: string;
}

