import { 
  FishDefinition, 
  SaleEntry, 
  BuyerCrateBalance, 
  ColdStorageItem, 
  DebtRecord, 
  MarketPrice, 
  PlatformTier,
  CargoTradeListing,
  TraderProfile,
  CrateType,
  CrateGuaranteeRates,
  FishCrateMapping,
  LogisticsShipment
} from '../types';

export interface CrateCategoryInfo {
  id: CrateType;
  nameAr: string;
  nameFr: string;
  shortLabel: string;
  isReturnable: boolean;
  defaultCaution: number;
  description: string;
  badgeClass: string;
}

export const CRATE_CATEGORIES: CrateCategoryInfo[] = [
  {
    id: 'basin_large',
    nameAr: 'بانيو بلاستيكي أبيض (حجم كبير)',
    nameFr: 'Grande Bassine Blanche',
    shortLabel: 'بانيو كبير',
    isReturnable: true,
    defaultCaution: 30,
    description: 'بانيو مينائي كبير سعة 40-50 كغ - مسترجع مع ضمانة كاشيون',
    badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-700/60'
  },
  {
    id: 'crate_medium',
    nameAr: 'صندوق بلاستيكي أبيض (حجم متوسط)',
    nameFr: 'Caisse Blanche Moyenne',
    shortLabel: 'صندوق متوسط',
    isReturnable: true,
    defaultCaution: 20,
    description: 'صندوق سوق الجملة القياسي سعة 20-25 كغ - مسترجع مع ضمانة',
    badgeClass: 'bg-blue-950 text-blue-300 border-blue-700/60'
  },
  {
    id: 'crate_small',
    nameAr: 'صندوق بلاستيكي أبيض (حجم صغير)',
    nameFr: 'Petite Caisse Blanche',
    shortLabel: 'صندوق صغير',
    isReturnable: true,
    defaultCaution: 15,
    description: 'صندوق أسماك السطح والميرلان سعة 10-15 كغ - مسترجع مع ضمانة',
    badgeClass: 'bg-indigo-950 text-indigo-300 border-indigo-700/60'
  },
  {
    id: 'styrofoam',
    nameAr: 'صندوق البوليسترين / الفرشي',
    nameFr: 'Caisse Polystyrène (Frichi)',
    shortLabel: 'فرشي (بوليسترين)',
    isReturnable: false,
    defaultCaution: 0,
    description: 'صندوق عازل أحادي الاستعمال للشحن - غير مسترجع وبدون ضمانة (0 د.م)',
    badgeClass: 'bg-slate-850 text-amber-300 border-amber-700/50'
  }
];

export const DEFAULT_GUARANTEE_RATES: CrateGuaranteeRates = {
  basin_large: 30,
  crate_medium: 20,
  crate_small: 15,
  styrofoam: 0, // Strictly 0 MAD
  platformFeePerCrate: 1.00
};

export function getCrateCategoryInfo(type: CrateType): CrateCategoryInfo {
  const found = CRATE_CATEGORIES.find(c => c.id === type);
  return found || CRATE_CATEGORIES[1];
}

export function getCrateShortLabel(type: CrateType): string {
  return getCrateCategoryInfo(type).shortLabel;
}

export function getCrateNameAr(type: CrateType): string {
  return getCrateCategoryInfo(type).nameAr;
}

/**
 * DYNAMIC PLATFORM MONETIZATION TIERS (أرباح المنصة حسب حجم البائع):
 * - Small Merchant (البائع الصغير - < 500 crates): 1.00 MAD / crate
 * - Medium Merchant (البائع المتوسط - 500 to 999 crates): 0.80 MAD / crate
 * - Large Merchant (البائع الكبير - 1,000+ crates): 0.70 MAD / crate
 * Commission applies across ALL crate types (including Styrofoam/الفرشي) per transaction.
 */
export function calculateMerchantTier(totalCrateVolume: number): PlatformTier {
  if (totalCrateVolume >= 1000) {
    return {
      tierKey: 'large',
      nameAr: 'البائع الكبير (Exportateur / Grand)',
      ratePerCrate: 0.70,
      descriptionAr: 'حجم مبيعات يفوق 1,000 صندوق — عمولة تفضيلية 0.70 د.م / صندوق',
      minCrates: 1000,
      maxCrates: null
    };
  } else if (totalCrateVolume >= 500) {
    return {
      tierKey: 'medium',
      nameAr: 'البائع المتوسط (Mareyeur Moyen)',
      ratePerCrate: 0.80,
      descriptionAr: 'حجم مبيعات بين 500 و 999 صندوق — عمولة 0.80 د.م / صندوق',
      minCrates: 500,
      maxCrates: 999
    };
  } else {
    return {
      tierKey: 'small',
      nameAr: 'البائع الصغير (Détaillant)',
      ratePerCrate: 1.00,
      descriptionAr: 'حجم مبيعات أقل من 500 صندوق — عمولة 1.00 د.م / صندوق',
      minCrates: 0,
      maxCrates: 499
    };
  }
}

export const FISH_CATALOG: FishDefinition[] = [
  {
    id: 'sardine',
    nameAr: 'سردين الأطلسي',
    nameFr: 'Sardine',
    latinName: 'Sardina pilchardus',
    image: '/src/assets/images/crate_sardines_morocco_1792432880991.jpg',
    defaultPrice: 180,
    defaultCaution: 20,
    defaultCrateType: 'crate_medium',
    unitKgApprox: 20
  },
  {
    id: 'sole',
    nameAr: 'صول رويال',
    nameFr: 'Sole',
    latinName: 'Solea solea',
    image: '/src/assets/images/crate_sole_morocco_1792432881186.jpg',
    defaultPrice: 950,
    defaultCaution: 30,
    defaultCrateType: 'basin_large',
    unitKgApprox: 12
  },
  {
    id: 'calamari',
    nameAr: 'كلمار / سيبيا',
    nameFr: 'Calamari',
    latinName: 'Loligo vulgaris',
    image: '/src/assets/images/crate_calamari_morocco_1792432882053.jpg',
    defaultPrice: 850,
    defaultCaution: 20,
    defaultCrateType: 'crate_medium',
    unitKgApprox: 14
  },
  {
    id: 'gambas',
    nameAr: 'كروفيت رويال (جمبري)',
    nameFr: 'Gambas Royale',
    latinName: 'Penaeus kerathurus',
    image: '/src/assets/images/crate_gambas_morocco_1792432882556.jpg',
    defaultPrice: 1200,
    defaultCaution: 15,
    defaultCrateType: 'crate_small',
    unitKgApprox: 10
  },
  {
    id: 'merlan',
    nameAr: 'ميرلان أبيض',
    nameFr: 'Merlan',
    latinName: 'Merlangius merlangus',
    image: '/src/assets/images/crate_merlan_morocco_1792432883027.jpg',
    defaultPrice: 620,
    defaultCaution: 15,
    defaultCrateType: 'crate_small',
    unitKgApprox: 15
  },
  {
    id: 'octopus',
    nameAr: 'أخطبوط الداخلة (بولب)',
    nameFr: 'Poulpe de Dakhla',
    latinName: 'Octopus vulgaris',
    image: '/src/assets/images/crate_octopus_morocco_1792432882846.jpg',
    defaultPrice: 890,
    defaultCaution: 30,
    defaultCrateType: 'basin_large',
    unitKgApprox: 16
  }
];

export const INITIAL_BUYERS: TraderProfile[] = [
  { name: 'عبد الله السوسي (موزع درب غلف)', phone: '+212661234567', port: 'الدار البيضاء' },
  { name: 'حسن بناني (مطاعم مارينا)', phone: '+212662987654', port: 'أكادير' },
  { name: 'رشيد المرنيسي (سوق الجملة فاس)', phone: '+212663112233', port: 'الدار البيضاء' },
  { name: 'محمد بوعنان (تجار طنجة المتوسط)', phone: '+212664556677', port: 'طنجة' },
  { name: 'يوسف الصحراوي (توزيع العيون)', phone: '+212665998800', port: 'العيون' },
  { name: 'إبراهيم أيت الطالب (مارشي سيدي إفني)', phone: '+212667334455', port: 'سيدي إفني' }
];

export const RECENT_BUYERS = INITIAL_BUYERS;

export const INITIAL_SALES: SaleEntry[] = [
  {
    id: 'BB-9801',
    date: new Date().toISOString().split('T')[0],
    time: '05:30',
    timestamp: Date.now() - 3600000 * 3,
    sellerName: 'المعلم بوشعيب الصويري (البائع)',
    buyerName: 'عبد الله السوسي (موزع درب غلف)',
    fishId: 'sardine',
    fishNameAr: 'سردين الأطلسي',
    fishNameFr: 'Sardine',
    crateType: 'crate_medium',
    crateCount: 45,
    pricePerCrate: 185,
    cautionPerCrate: 20,
    platformFee: 45 * 1.00,
    platformRateApplied: 1.00,
    totalFishAmount: 8325,
    totalCautionAmount: 900,
    totalTransactionAmount: 9225,
    paymentStatus: 'paid',
    paidAmount: 9225,
    notes: 'تم التسليم رصيف 4 ميناء الصيد'
  },
  {
    id: 'BB-9802',
    date: new Date().toISOString().split('T')[0],
    time: '06:15',
    timestamp: Date.now() - 3600000 * 2,
    sellerName: 'المعلم بوشعيب الصويري (البائع)',
    buyerName: 'حسن بناني (مطاعم مارينا)',
    fishId: 'sole',
    fishNameAr: 'صول رويال',
    fishNameFr: 'Sole',
    crateType: 'basin_large',
    crateCount: 12,
    pricePerCrate: 960,
    cautionPerCrate: 30,
    platformFee: 12 * 1.00,
    platformRateApplied: 1.00,
    totalFishAmount: 11520,
    totalCautionAmount: 360,
    totalTransactionAmount: 11880,
    paymentStatus: 'partial',
    paidAmount: 7000,
    notes: 'متبقي في الذمة يدفع مساء اليوم'
  },
  {
    id: 'BB-9803',
    date: new Date().toISOString().split('T')[0],
    time: '07:00',
    timestamp: Date.now() - 3600000 * 1,
    sellerName: 'المعلم بوشعيب الصويري (البائع)',
    buyerName: 'محمد بوعنان (تجار طنجة المتوسط)',
    fishId: 'calamari',
    fishNameAr: 'كلمار / سيبيا',
    fishNameFr: 'Calamari',
    crateType: 'styrofoam',
    crateCount: 20,
    pricePerCrate: 840,
    cautionPerCrate: 0,
    platformFee: 20 * 1.00,
    platformRateApplied: 1.00,
    totalFishAmount: 16800,
    totalCautionAmount: 0,
    totalTransactionAmount: 16800,
    paymentStatus: 'unpaid',
    paidAmount: 0,
    notes: 'شحنة فرشي غير مسترجعة متجهة للشمال عبر الطريق السيار'
  }
];

export const INITIAL_CRATE_BALANCES: BuyerCrateBalance[] = [
  {
    buyerName: 'عبد الله السوسي (موزع درب غلف)',
    phone: '+212661234567',
    basinLargeOwed: 15,
    basinLargeDelivered: 25,
    basinLargeReturned: 10,
    crateMediumOwed: 50,
    crateMediumDelivered: 80,
    crateMediumReturned: 30,
    crateSmallOwed: 10,
    crateSmallDelivered: 20,
    crateSmallReturned: 10,
    styrofoamDelivered: 35,
    cautionDepositHeld: 1600,
    lastUpdated: 'اليوم 05:30'
  },
  {
    buyerName: 'حسن بناني (مطاعم مارينا)',
    phone: '+212662987654',
    basinLargeOwed: 12,
    basinLargeDelivered: 16,
    basinLargeReturned: 4,
    crateMediumOwed: 18,
    crateMediumDelivered: 30,
    crateMediumReturned: 12,
    crateSmallOwed: 8,
    crateSmallDelivered: 12,
    crateSmallReturned: 4,
    styrofoamDelivered: 15,
    cautionDepositHeld: 840,
    lastUpdated: 'اليوم 06:15'
  },
  {
    buyerName: 'محمد بوعنان (تجار طنجة المتوسط)',
    phone: '+212664556677',
    basinLargeOwed: 5,
    basinLargeDelivered: 10,
    basinLargeReturned: 5,
    crateMediumOwed: 35,
    crateMediumDelivered: 45,
    crateMediumReturned: 10,
    crateSmallOwed: 0,
    crateSmallDelivered: 5,
    crateSmallReturned: 5,
    styrofoamDelivered: 40,
    cautionDepositHeld: 850,
    lastUpdated: 'اليوم 07:00'
  },
  {
    buyerName: 'رشيد المرنيسي (سوق الجملة فاس)',
    phone: '+212663112233',
    basinLargeOwed: 8,
    basinLargeDelivered: 15,
    basinLargeReturned: 7,
    crateMediumOwed: 42,
    crateMediumDelivered: 60,
    crateMediumReturned: 18,
    crateSmallOwed: 5,
    crateSmallDelivered: 10,
    crateSmallReturned: 5,
    styrofoamDelivered: 25,
    cautionDepositHeld: 1155,
    lastUpdated: 'أمس 18:20'
  }
];

export const INITIAL_COLD_STORAGE: ColdStorageItem[] = [
  {
    id: 'CS-01',
    batchNumber: 'LOT-MR-881',
    fishId: 'merlan',
    fishNameAr: 'ميرلان أبيض',
    fishNameFr: 'Merlan',
    crateCount: 35,
    crateType: 'crate_medium',
    roomName: 'غرفة التبريد رقم 1 (-2°C)',
    temperatureCelsius: -1.8,
    entryDate: '2026-10-12',
    daysStored: 2,
    dailyStorageFeePerCrate: 3.5,
    sellerName: 'المعلم بوشعيب الصويري'
  },
  {
    id: 'CS-02',
    batchNumber: 'LOT-GM-442',
    fishId: 'gambas',
    fishNameAr: 'كروفيت رويال',
    fishNameFr: 'Gambas Royale',
    crateCount: 22,
    crateType: 'basin_large',
    roomName: 'غرفة التجميد العميق (-18°C)',
    temperatureCelsius: -18.2,
    entryDate: '2026-10-10',
    daysStored: 4,
    dailyStorageFeePerCrate: 5.0,
    sellerName: 'المعلم بوشعيب الصويري'
  },
  {
    id: 'CS-03',
    batchNumber: 'LOT-SL-309',
    fishId: 'sole',
    fishNameAr: 'صول رويال',
    fishNameFr: 'Sole',
    crateCount: 16,
    crateType: 'crate_small',
    roomName: 'غرفة التبريد رقم 2 (0°C)',
    temperatureCelsius: 0.2,
    entryDate: '2026-10-13',
    daysStored: 1,
    dailyStorageFeePerCrate: 3.5,
    sellerName: 'المعلم بوشعيب الصويري'
  }
];

export const INITIAL_DEBTS: DebtRecord[] = [
  {
    buyerName: 'محمد بوعنان (تجار طنجة المتوسط)',
    phone: '+212664556677',
    totalTransactionsAmount: 48500,
    totalPaidAmount: 31300,
    remainingDebt: 17200,
    lastTransactionDate: 'اليوم 07:00'
  },
  {
    buyerName: 'حسن بناني (مطاعم مارينا)',
    phone: '+212662987654',
    totalTransactionsAmount: 35400,
    totalPaidAmount: 30520,
    remainingDebt: 4880,
    lastTransactionDate: 'اليوم 06:15'
  },
  {
    buyerName: 'يوسف الصحراوي (توزيع العيون)',
    phone: '+212665998800',
    totalTransactionsAmount: 62000,
    totalPaidAmount: 53500,
    remainingDebt: 8500,
    lastTransactionDate: 'أمس 16:45'
  },
  {
    buyerName: 'إبراهيم أيت الطالب (مارشي سيدي إفني)',
    phone: '+212667334455',
    totalTransactionsAmount: 22000,
    totalPaidAmount: 19000,
    remainingDebt: 3000,
    lastTransactionDate: '2026-10-11'
  }
];

export const INITIAL_MARKET_PRICES: MarketPrice[] = [
  {
    id: 'MP-01',
    port: 'الدار البيضاء',
    portFr: 'Casablanca Port',
    fishNameAr: 'سردين',
    fishNameFr: 'Sardine',
    minPrice: 170,
    maxPrice: 200,
    avgPrice: 185,
    trend: 'up',
    supplyVolumeCrates: 1250,
    updatedTime: '06:00'
  },
  {
    id: 'MP-02',
    port: 'أكادير',
    portFr: 'Port d\'Agadir',
    fishNameAr: 'صول رويال',
    fishNameFr: 'Sole',
    minPrice: 900,
    maxPrice: 1050,
    avgPrice: 960,
    trend: 'stable',
    supplyVolumeCrates: 180,
    updatedTime: '06:30'
  },
  {
    id: 'MP-03',
    port: 'طانطان',
    portFr: 'Port Tan-Tan',
    fishNameAr: 'كلمار / سيبيا',
    fishNameFr: 'Calamari',
    minPrice: 800,
    maxPrice: 890,
    avgPrice: 840,
    trend: 'down',
    supplyVolumeCrates: 420,
    updatedTime: '05:45'
  },
  {
    id: 'MP-04',
    port: 'الداخلة',
    portFr: 'Port de Dakhla',
    fishNameAr: 'كروفيت رويال',
    fishNameFr: 'Gambas',
    minPrice: 1100,
    maxPrice: 1300,
    avgPrice: 1200,
    trend: 'up',
    supplyVolumeCrates: 290,
    updatedTime: '07:15'
  },
  {
    id: 'MP-05',
    port: 'الناظور',
    portFr: 'Port Nador',
    fishNameAr: 'ميرلان أبيض',
    fishNameFr: 'Merlan',
    minPrice: 580,
    maxPrice: 660,
    avgPrice: 620,
    trend: 'stable',
    supplyVolumeCrates: 310,
    updatedTime: '06:10'
  },
  {
    id: 'MP-06',
    port: 'العيون',
    portFr: 'Port Laâyoune',
    fishNameAr: 'سردين',
    fishNameFr: 'Sardine',
    minPrice: 140,
    maxPrice: 175,
    avgPrice: 160,
    trend: 'down',
    supplyVolumeCrates: 3400,
    updatedTime: '05:00'
  }
];

export const INITIAL_CARGO_LISTINGS: CargoTradeListing[] = [
  {
    id: 'TR-101',
    type: 'offer',
    sellerName: 'المعلم الداودي (تجار الداخلة)',
    contactPhone: '+212661889900',
    port: 'الداخلة',
    fishId: 'gambas',
    fishNameAr: 'كروفيت رويال (جمبري)',
    fishNameFr: 'Gambas Royale',
    image: '/src/assets/images/crate_gambas_morocco_1792432882556.jpg',
    crateCount: 80,
    crateType: 'basin_large',
    askingPricePerCrate: 1150,
    logisticsStatus: 'ready',
    postedAt: 'منذ 25 دقيقة',
    notes: 'صيد مراكب الجر بأعالي البحار، طازج ومجمد على لوح الثلج برصيف ميناء الداخلة.',
    isVerifiedMerchant: true
  },
  {
    id: 'TR-102',
    type: 'offer',
    sellerName: 'الحاج سيدي عمار (شركة أطلس فيش)',
    contactPhone: '+212662113344',
    port: 'العيون',
    fishId: 'sardine',
    fishNameAr: 'سردين الأطلسي الممتاز',
    fishNameFr: 'Sardine',
    image: '/src/assets/images/crate_sardines_morocco_1792432880991.jpg',
    crateCount: 220,
    crateType: 'crate_medium',
    askingPricePerCrate: 160,
    logisticsStatus: 'in_transit',
    transitDestination: 'شاحنة تبريد متجهة إلى الدار البيضاء (الهراويين)',
    postedAt: 'منذ 45 دقيقة',
    notes: 'شاحنة تبريد تنطلق الساعة 14:00، التسليم في سوق الجملة للسمك فجر الغد.',
    isVerifiedMerchant: true
  },
  {
    id: 'TR-103',
    type: 'offer',
    sellerName: 'رشيد إيد بيهي (ماركوبيش أكادير)',
    contactPhone: '+212665447788',
    port: 'أكادير',
    fishId: 'sole',
    fishNameAr: 'صول رويال (Sole)',
    fishNameFr: 'Sole',
    image: '/src/assets/images/crate_sole_morocco_1792432881186.jpg',
    crateCount: 40,
    crateType: 'styrofoam',
    askingPricePerCrate: 940,
    logisticsStatus: 'ready',
    postedAt: 'منذ ساعة',
    notes: 'معبأ في صناديق فرشي بوليسترين عازلة مع طبقات ثلج قشوري، جاهز للتحميل والشحن السريع.',
    isVerifiedMerchant: true
  }
];

// LocalStorage keys
const SALES_STORAGE_KEY = 'bahrbox_sales_v2';
const CRATES_STORAGE_KEY = 'bahrbox_crates_v2';
const COLD_STORAGE_KEY = 'bahrbox_cold_storage_v2';
const DEBTS_STORAGE_KEY = 'bahrbox_debts_v2';
const TRADERS_STORAGE_KEY = 'bahrbox_traders_v2';
const CARGO_STORAGE_KEY = 'bahrbox_cargo_listings_v2';
const SETTINGS_GUARANTEE_KEY = 'bahrbox_crate_guarantee_rates_v2';

export function loadGuaranteeRates(): CrateGuaranteeRates {
  try {
    const data = localStorage.getItem(SETTINGS_GUARANTEE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        basin_large: Number(parsed.basin_large) || DEFAULT_GUARANTEE_RATES.basin_large,
        crate_medium: Number(parsed.crate_medium) || DEFAULT_GUARANTEE_RATES.crate_medium,
        crate_small: Number(parsed.crate_small) || DEFAULT_GUARANTEE_RATES.crate_small,
        styrofoam: 0, // Strictly locked at 0 MAD
        platformFeePerCrate: 1.00
      };
    }
  } catch (e) {
    console.error('Failed loading guarantee rates:', e);
  }
  return DEFAULT_GUARANTEE_RATES;
}

export function saveGuaranteeRates(rates: CrateGuaranteeRates) {
  try {
    const cleanRates: CrateGuaranteeRates = {
      ...rates,
      styrofoam: 0 // Always 0
    };
    localStorage.setItem(SETTINGS_GUARANTEE_KEY, JSON.stringify(cleanRates));
  } catch (e) {
    console.error('Failed saving guarantee rates:', e);
  }
}

export function loadSales(): SaleEntry[] {
  try {
    const data = localStorage.getItem(SALES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed loading sales:', e);
  }
  return INITIAL_SALES;
}

export function saveSales(sales: SaleEntry[]) {
  try {
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  } catch (e) {
    console.error('Failed saving sales:', e);
  }
}

export function loadCrates(): BuyerCrateBalance[] {
  try {
    const data = localStorage.getItem(CRATES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          buyerName: item.buyerName,
          phone: item.phone || '+212600000000',
          basinLargeOwed: item.basinLargeOwed ?? (item.woodOwed ? Math.round(item.woodOwed * 0.4) : 0),
          basinLargeDelivered: item.basinLargeDelivered ?? (item.basinLargeOwed ?? 0),
          basinLargeReturned: item.basinLargeReturned ?? 0,

          crateMediumOwed: item.crateMediumOwed ?? (item.plasticOwed ?? 0),
          crateMediumDelivered: item.crateMediumDelivered ?? (item.crateMediumOwed ?? 0),
          crateMediumReturned: item.crateMediumReturned ?? 0,

          crateSmallOwed: item.crateSmallOwed ?? (item.woodOwed ? Math.round(item.woodOwed * 0.6) : 0),
          crateSmallDelivered: item.crateSmallDelivered ?? (item.crateSmallOwed ?? 0),
          crateSmallReturned: item.crateSmallReturned ?? 0,

          styrofoamDelivered: item.styrofoamDelivered ?? 0,
          cautionDepositHeld: item.cautionDepositHeld ?? 0,
          lastUpdated: item.lastUpdated || 'محدث مؤخراً'
        }));
      }
    }
  } catch (e) {
    console.error('Failed loading crates:', e);
  }
  return INITIAL_CRATE_BALANCES;
}

export function saveCrates(crates: BuyerCrateBalance[]) {
  try {
    localStorage.setItem(CRATES_STORAGE_KEY, JSON.stringify(crates));
  } catch (e) {
    console.error('Failed saving crates:', e);
  }
}

export function loadColdStorage(): ColdStorageItem[] {
  try {
    const data = localStorage.getItem(COLD_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed loading cold storage:', e);
  }
  return INITIAL_COLD_STORAGE;
}

export function saveColdStorage(items: ColdStorageItem[]) {
  try {
    localStorage.setItem(COLD_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed saving cold storage:', e);
  }
}

export function loadDebts(): DebtRecord[] {
  try {
    const data = localStorage.getItem(DEBTS_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed loading debts:', e);
  }
  return INITIAL_DEBTS;
}

export function saveDebts(debts: DebtRecord[]) {
  try {
    localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(debts));
  } catch (e) {
    console.error('Failed saving debts:', e);
  }
}

export function loadTraders(): TraderProfile[] {
  try {
    const data = localStorage.getItem(TRADERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed loading traders:', e);
  }
  return INITIAL_BUYERS;
}

export function saveTraders(traders: TraderProfile[]) {
  try {
    localStorage.setItem(TRADERS_STORAGE_KEY, JSON.stringify(traders));
  } catch (e) {
    console.error('Failed saving traders:', e);
  }
}

export function registerTraderIfNew(
  existingTraders: TraderProfile[], 
  name: string, 
  phone?: string, 
  port?: string
): { updatedTraders: TraderProfile[]; isNew: boolean; registeredTrader: TraderProfile } {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return {
      updatedTraders: existingTraders,
      isNew: false,
      registeredTrader: existingTraders[0] || INITIAL_BUYERS[0]
    };
  }

  const existing = existingTraders.find(
    t => t.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  if (existing) {
    return {
      updatedTraders: existingTraders,
      isNew: false,
      registeredTrader: existing
    };
  }

  // Create new profile
  const newTrader: TraderProfile = {
    name: trimmedName,
    phone: phone?.trim() || '+212600000000',
    port: port?.trim() || 'سوق الجملة للسمك',
    isCustom: true,
    createdAt: new Date().toISOString()
  };

  const updatedTraders = [newTrader, ...existingTraders];
  saveTraders(updatedTraders);

  return {
    updatedTraders,
    isNew: true,
    registeredTrader: newTrader
  };
}

export function loadCargoListings(): CargoTradeListing[] {
  try {
    const data = localStorage.getItem(CARGO_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => {
          const fishDef = FISH_CATALOG.find(f => f.id === item.fishId);
          let safeCrateType: CrateType = 'crate_medium';
          if (item.crateType === 'basin_large' || item.crateType === 'crate_medium' || item.crateType === 'crate_small' || item.crateType === 'styrofoam') {
            safeCrateType = item.crateType;
          } else if (item.crateType === 'wood') {
            safeCrateType = 'basin_large';
          }
          return {
            ...item,
            crateType: safeCrateType,
            image: fishDef ? fishDef.image : item.image
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed loading cargo listings:', e);
  }
  return INITIAL_CARGO_LISTINGS;
}

export function saveCargoListings(listings: CargoTradeListing[]) {
  try {
    localStorage.setItem(CARGO_STORAGE_KEY, JSON.stringify(listings));
  } catch (e) {
    console.error('Failed saving cargo listings:', e);
  }
}

// Pre-configured Fish to Crate Mapping (إعدادات الربط المسبق لأنواع الصناديق مع الأسماك)
export const DEFAULT_FISH_CRATE_MAPPING: FishCrateMapping = {
  sardine: 'crate_medium',
  sole: 'basin_large',
  calamari: 'crate_medium',
  gambas: 'crate_small',
  merlan: 'crate_small',
  octopus: 'basin_large'
};

const FISH_CRATE_MAPPING_KEY = 'bahrbox_fish_crate_mapping_v2';

export function loadFishCrateMapping(): FishCrateMapping {
  try {
    const data = localStorage.getItem(FISH_CRATE_MAPPING_KEY);
    if (data) {
      return { ...DEFAULT_FISH_CRATE_MAPPING, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed loading fish crate mapping:', e);
  }
  return DEFAULT_FISH_CRATE_MAPPING;
}

export function saveFishCrateMapping(mapping: FishCrateMapping) {
  try {
    localStorage.setItem(FISH_CRATE_MAPPING_KEY, JSON.stringify(mapping));
  } catch (e) {
    console.error('Failed saving fish crate mapping:', e);
  }
}

// -------------------------------------------------------------
// Inter-Merchant Logistics & Open Account Initial Data & Handlers
// -------------------------------------------------------------
export const INITIAL_LOGISTICS_SHIPMENTS: LogisticsShipment[] = [
  {
    id: 'SHP-2024-884',
    date: new Date().toISOString().split('T')[0],
    time: '04:30',
    timestamp: Date.now() - 1000 * 60 * 60 * 6,
    sellerName: 'المعلم بوشعيب الصويري (البائع)',
    buyerName: 'المعلم رشيد التطواني (البائع الآخر)',
    buyerPhone: '+212661223344',
    originPort: 'ميناء أكادير',
    destinationCity: 'تطوان',
    destinationMarket: 'السوق المركزي بتطوان',
    driverName: 'عبد الرحيم السطاتي',
    driverPhone: '+212668112233',
    truckPlate: '40-ب-55120',
    fishId: 'sardine',
    fishNameAr: 'سردين طري (Sardine)',
    fishNameFr: 'Sardine',
    crateType: 'basin_large',
    shippedCrates: 1000,
    pricePerCrate: 180,
    cautionPerCrate: 30,
    platformFee: 800,
    platformRateApplied: 0.80,
    totalFishValue: 180000,
    totalCautionAmount: 30000,
    returnedCrates: 900,
    refundedCautionAmount: 27000,
    unreturnedCrates: 100,
    activeCautionDebt: 3000,
    cashPaidAmount: 150000,
    netBalanceOwed: 33000, // (180,000 - 150,000) + 3,000
    status: 'partially_returned',
    notes: 'تم تفريغ الشحنة بالسوق المركزي بتطوان واسترجاع 900 بانيو فارغ فوراً مع السائق، متبقي 100 بانيو بذمته.',
    lastUpdate: 'اليوم 10:15'
  },
  {
    id: 'SHP-2024-892',
    date: new Date().toISOString().split('T')[0],
    time: '06:00',
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    sellerName: 'المعلم بوشعيب الصويري (البائع)',
    buyerName: 'الحاج مصطفى السلاوي (البائع الآخر)',
    buyerPhone: '+212662998877',
    originPort: 'ميناء الداخلة',
    destinationCity: 'سلا / الرباط',
    destinationMarket: 'سوق الجملة للسمك بسلا',
    driverName: 'محمد العوني',
    driverPhone: '+212664778899',
    truckPlate: '12-أ-87410',
    fishId: 'calamari',
    fishNameAr: 'كلمار طري (Calamar)',
    fishNameFr: 'Calamar',
    crateType: 'crate_medium',
    shippedCrates: 450,
    pricePerCrate: 420,
    cautionPerCrate: 20,
    platformFee: 360,
    platformRateApplied: 0.80,
    totalFishValue: 189000,
    totalCautionAmount: 9000,
    returnedCrates: 0,
    refundedCautionAmount: 0,
    unreturnedCrates: 450,
    activeCautionDebt: 9000,
    cashPaidAmount: 0,
    netBalanceOwed: 198000,
    status: 'in_transit',
    notes: 'الشاحنة في الطريق السيار، الوصول المرتقب فجر الغد لسوق الجملة بسلا.',
    lastUpdate: 'اليوم 06:00'
  },
  {
    id: 'SHP-2024-870',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().split('T')[0],
    time: '03:15',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    sellerName: 'المعلم بوشعيب الصويري (البائع)',
    buyerName: 'المعلم العربي البيضاوي (البائع الآخر)',
    buyerPhone: '+212663445566',
    originPort: 'ميناء العيون',
    destinationCity: 'الدار البيضاء',
    destinationMarket: 'سوق الجملة الهراويين بالدار البيضاء',
    driverName: 'عمر التادلي',
    driverPhone: '+212661556677',
    truckPlate: '06-د-11984',
    fishId: 'sole',
    fishNameAr: 'صول رويال (Sole)',
    fishNameFr: 'Sole',
    crateType: 'basin_large',
    shippedCrates: 600,
    pricePerCrate: 350,
    cautionPerCrate: 30,
    platformFee: 480,
    platformRateApplied: 0.80,
    totalFishValue: 210000,
    totalCautionAmount: 18000,
    returnedCrates: 600,
    refundedCautionAmount: 18000,
    unreturnedCrates: 0,
    activeCautionDebt: 0,
    cashPaidAmount: 210000,
    netBalanceOwed: 0,
    status: 'settled',
    notes: 'تمت تصفية الشحنة واسترجاع 600 بانيو كبير بالكامل وتسديد صافي الفاتورة.',
    lastUpdate: 'منذ يومين'
  }
];

const LOGISTICS_STORAGE_KEY = 'bahrbox_logistics_shipments_v2';

export function loadLogisticsShipments(): LogisticsShipment[] {
  try {
    const data = localStorage.getItem(LOGISTICS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed loading shipments:', e);
  }
  return INITIAL_LOGISTICS_SHIPMENTS;
}

export function saveLogisticsShipments(shipments: LogisticsShipment[]) {
  try {
    localStorage.setItem(LOGISTICS_STORAGE_KEY, JSON.stringify(shipments));
  } catch (e) {
    console.error('Failed saving shipments:', e);
  }
}

/**
 * Common Moroccan seafood target markets by destination city
 */
export const MOROCCAN_TARGET_MARKETS: { city: string; market: string }[] = [
  { city: 'تطوان', market: 'السوق المركزي بتطوان' },
  { city: 'الدار البيضاء', market: 'سوق الجملة للسمك الهراويين' },
  { city: 'الدار البيضاء', market: 'السوق المركزي مارشي سنطرال' },
  { city: 'طنجة', market: 'سوق الجملة للسمك بطنجة' },
  { city: 'سلا / الرباط', market: 'سوق الجملة للسمك بسلا' },
  { city: 'فاس', market: 'سوق الجملة للسمك عين قادوس بفاس' },
  { city: 'مراكش', market: 'سوق الجملة للسمك المحاميد بمراكش' },
  { city: 'مكناس', market: 'سوق الجملة للسمك بسيدي بوزكري مكناس' },
  { city: 'وجدة', market: 'سوق الجملة للسمك بوجدة' },
  { city: 'أكادير', market: 'سوق الجملة للسمك أنزا أكادير' }
];


