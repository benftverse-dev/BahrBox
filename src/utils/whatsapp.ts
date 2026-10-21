import { SaleEntry, DebtRecord, CargoTradeListing, CrateType, LogisticsShipment } from '../types';
import { getCrateCategoryInfo } from './storage';

/**
 * Builds formatted 1-tap WhatsApp invoice message for fish buyers ("البائع الآخر")
 */
export function generateSaleWhatsAppMessage(sale: SaleEntry): string {
  const crateInfo = getCrateCategoryInfo(sale.crateType);
  const paymentStatusText = 
    sale.paymentStatus === 'paid' ? 'خالص بالكامل (Payé)' : 
    sale.paymentStatus === 'partial' ? `دفعة مسبقة: ${sale.paidAmount} درهم (Acompte)` : 
    'كريدي / في الذمة (À crédit)';

  const lines = [
    `🐟 *وصل تسليم سمك رسمي — BahrBox*`,
    `_Commerce & Logistique Numérique du Poisson_`,
    `───────────────────────`,
    `📋 *رقم العملية:* #${sale.id}`,
    `📅 *التاريخ:* ${sale.date} (${sale.time})`,
    `👨‍💼 *البائع:* ${sale.sellerName}`,
    `🤝 *البائع الآخر (المستلم):* ${sale.buyerName}`,
    `───────────────────────`,
    `📦 *الصنف:* ${sale.fishNameAr} (${sale.fishNameFr})`,
    `🏷 *نوع الصناديق:* ${crateInfo.nameAr}`,
    `🔢 *عدد الصناديق:* ${sale.crateCount} صندوق`,
    `💵 *ثمن الصندوق:* ${sale.pricePerCrate} درهم`,
    `💰 *مجموع ثمن السمك:* ${sale.totalFishAmount.toLocaleString()} درهم`,
    sale.crateType === 'styrofoam'
      ? `🛡 *ضمانة الصناديق:* 0 درهم (صناديق الفرشي غير مسترجعة وبدون ضمانة)`
      : `🛡 *ضمانة الصناديق (الكاشيون):* ${sale.totalCautionAmount.toLocaleString()} درهم (${sale.cautionPerCrate} د/صندوق مسترجع)`,
    `───────────────────────`,
    `✨ *المجموع الإجمالي المطلوب:* *${sale.totalTransactionAmount.toLocaleString()} درهم*`,
    `💳 *حالة الدفع:* ${paymentStatusText}`,
    sale.paymentStatus !== 'paid' ? `⏳ *المبلغ المتبقي بذمتكم:* *${(sale.totalTransactionAmount - sale.paidAmount).toLocaleString()} درهم*` : `✅ *تم استلام المبلغ بالكامل*`,
    `───────────────────────`,
    `🔒 *بياناتك المالية مشفرة وآمنة 100%*`,
    `_تم الإصدار آلياً عبر منصة BahrBox الرقمية للأسماك_`
  ];

  return lines.join('\n');
}

/**
 * Open WhatsApp directly with encoded message
 */
export function openWhatsAppReceipt(sale: SaleEntry, phoneNumber?: string) {
  const message = generateSaleWhatsAppMessage(sale);
  const encodedText = encodeURIComponent(message);
  
  let targetUrl = `https://wa.me/?text=${encodedText}`;
  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      targetUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Builds formatted WhatsApp reminder for pending debt ("الكريدي")
 */
export function generateDebtReminderWhatsAppMessage(debt: DebtRecord, sellerName: string): string {
  const lines = [
    `🔔 *تذكير مالي ودي — منصة BahrBox*`,
    `_Commerce & Logistique Numérique du Poisson_`,
    `───────────────────────`,
    `أخي الكريم: *${debt.buyerName}*`,
    `تحية طيبة من أخيكم: *${sellerName}*`,
    ``,
    `نود تذكيركم بكشف الحساب الجاري المتعلق بتعاملات سوق السمك:`,
    `📊 *إجمالي المسحوبات السابقة:* ${debt.totalTransactionsAmount.toLocaleString()} درهم`,
    `💵 *المبالغ المسددة:* ${debt.totalPaidAmount.toLocaleString()} درهم`,
    `⚠️ *الرصيد المتبقي في الذمة (الكريدي):* *${debt.remainingDebt.toLocaleString()} درهم*`,
    `📅 *تاريخ آخر حركة:* ${debt.lastTransactionDate}`,
    ``,
    `شاكرين لكم حسن تعاونكم الدائم وسرعة التسوية.`,
    `───────────────────────`,
    `🔒 *بياناتك المالية مشفرة وآمنة 100%*`
  ];

  return lines.join('\n');
}

export function openWhatsAppDebtReminder(debt: DebtRecord, sellerName: string) {
  const message = generateDebtReminderWhatsAppMessage(debt, sellerName);
  const encodedText = encodeURIComponent(message);
  const cleanPhone = debt.phone.replace(/[^0-9]/g, '');
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Builds formatted WhatsApp Statement of Account for a specific trader ("البائع الآخر")
 */
export function generateTraderStatementWhatsAppMessage(
  traderName: string,
  sellerName: string,
  sales: SaleEntry[],
  dateFilterText: string,
  totalSalesAmount: number,
  totalPaidAmount: number,
  remainingDebt: number,
  totalCrates: number,
  totalCaution: number
): string {
  const lines = [
    `📑 *كشف حساب تاجر مفصل — BahrBox*`,
    `_Commerce & Logistique Numérique du Poisson_`,
    `───────────────────────`,
    `👨‍💼 *البائع:* ${sellerName}`,
    `🤝 *البائع الآخر:* *${traderName}*`,
    `📅 *الفترة / التاريخ:* ${dateFilterText}`,
    `───────────────────────`,
    `📊 *ملخص الحساب الإجمالي:*`,
    `📦 *مجموع الصناديق المسحوبة:* ${totalCrates} صندوق`,
    `💰 *إجمالي قيمة الأسماك:* ${totalSalesAmount.toLocaleString()} درهم`,
    `🛡 *ضمانات الصناديق (الكاشيون):* ${totalCaution.toLocaleString()} درهم`,
    `💵 *المبالغ المسددة:* ${totalPaidAmount.toLocaleString()} درهم`,
    remainingDebt > 0 
      ? `⚠️ *الكريدي العالق في الذمة:* *${remainingDebt.toLocaleString()} درهم*`
      : `✅ *الحساب خالص ولا توجد ديون معلقة*`,
    `───────────────────────`,
    `📋 *تفاصيل العمليات المسجلة (${sales.length}):*`
  ];

  sales.slice(0, 10).forEach((s, idx) => {
    const status = s.paymentStatus === 'paid' ? 'خالص' : (s.paymentStatus === 'partial' ? 'دفعة' : 'كريدي');
    const crateInfo = getCrateCategoryInfo(s.crateType);
    lines.push(`${idx + 1}. #${s.id} (${s.date}) — ${s.fishNameAr} × ${s.crateCount} (${crateInfo.shortLabel}) [${status}]`);
  });

  if (sales.length > 10) {
    lines.push(`... بالإضافة إلى ${sales.length - 10} عملية سابقة بالسجل.`);
  }

  lines.push(`───────────────────────`);
  lines.push(`🔒 *بياناتك المالية مشفرة وآمنة 100%*`);
  lines.push(`_تم إصدار هذا الكشف آلياً عبر منصة BahrBox الرقمية_`);

  return lines.join('\n');
}

export function openWhatsAppTraderStatement(
  traderName: string,
  sellerName: string,
  phoneNumber: string,
  sales: SaleEntry[],
  dateFilterText: string,
  totalSalesAmount: number,
  totalPaidAmount: number,
  remainingDebt: number,
  totalCrates: number,
  totalCaution: number
) {
  const message = generateTraderStatementWhatsAppMessage(
    traderName,
    sellerName,
    sales,
    dateFilterText,
    totalSalesAmount,
    totalPaidAmount,
    remainingDebt,
    totalCrates,
    totalCaution
  );
  const encodedText = encodeURIComponent(message);
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Builds formatted 1-tap WhatsApp message for B2B Cargo Trading & Negotiation between merchants
 */
export function generateTradeNegotiationWhatsAppMessage(
  listing: CargoTradeListing,
  requesterName: string
): string {
  const isOffer = listing.type === 'offer';
  const crateInfo = getCrateCategoryInfo(listing.crateType);
  const statusLabel = 
    listing.logisticsStatus === 'ready' ? 'جاهز للشحن الفوري بالرصيف' :
    listing.logisticsStatus === 'in_transit' ? `في الطريق (${listing.transitDestination || 'شاحنة تبريد'})` :
    'حجز مسبق قبل الرسو';

  const lines = [
    `🐟 *طلب تفاوض على شحنة سمك — BahrBox*`,
    `_Commerce & Logistique Numérique du Poisson_`,
    `───────────────────────`,
    `السلام عليكم ورحمة الله، أخي ${isOffer ? 'البائع' : 'المشتري'}: *${listing.sellerName}*`,
    `معكم أخوكم البائع الآخر: *${requesterName}*`,
    ``,
    `أتواصل معكم بخصوص إعلانكم في منصة *BahrBox* للسلع البحرية:`,
    `📋 *رقم الإعلان:* #${listing.id}`,
    `🏷 *نوع العملية:* ${isOffer ? 'عرض بيع حمولة سمك' : 'طلب شراء حمولة سمك'}`,
    `📦 *الصنف:* *${listing.fishNameAr}* (${listing.fishNameFr})`,
    `🔢 *الكمية:* *${listing.crateCount} صندوق* (${crateInfo.nameAr})`,
    `💵 *السعر المعروض:* *${listing.askingPricePerCrate} درهم / صندوق*`,
    `💰 *المبلغ التقديري:* ${(listing.crateCount * listing.askingPricePerCrate).toLocaleString()} درهم`,
    `📍 *الميناء / الانطلاق:* *${listing.port}*`,
    `🚚 *اللوجستيك:* ${statusLabel}`,
    listing.notes ? `📝 *ملاحظات الإعلان:* ${listing.notes}` : '',
    `───────────────────────`,
    `أرغب في حجز هذه الشحنة والتفاوض معكم على تفاصيل النقل والاستلام والتسوية المالية.`,
    `───────────────────────`,
    `🔒 *بياناتك المالية مشفرة وآمنة 100%*`,
    `_تم الإرسال عبر منصة BahrBox الرقمية لتداول الأسماك بالموانئ_`
  ].filter(Boolean);

  return lines.join('\n');
}

export function openWhatsAppTradeNegotiation(
  listing: CargoTradeListing,
  requesterName: string
) {
  const message = generateTradeNegotiationWhatsAppMessage(listing, requesterName);
  const encodedText = encodeURIComponent(message);
  const cleanPhone = listing.contactPhone ? listing.contactPhone.replace(/[^0-9]/g, '') : '';
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Builds formatted WhatsApp message for Inter-Merchant Open Account Ledger
 * كشف الحساب المفتوح بين البائع والبائع الآخر
 */
export function generateOpenAccountLedgerWhatsAppMessage(
  shipment: LogisticsShipment
): string {
  const crateInfo = getCrateCategoryInfo(shipment.crateType);
  const statusLabel = 
    shipment.status === 'settled' ? '✅ خالص ومصفى بالكامل' :
    shipment.status === 'partially_returned' ? '⚠️ تفريغ جزئي ومتبقي صناديق بالذمة' :
    '🚚 الشحنة في الطريق نحو السوق المستهدف';

  const lines = [
    `🚚 *كشف الحساب المفتوح وشحن الأسماك — BahrBox*`,
    `_Commerce & Logistique Numérique du Poisson_`,
    `───────────────────────`,
    `📋 *رقم الشحنة:* #${shipment.id}`,
    `📅 *التاريخ:* ${shipment.date} (${shipment.time})`,
    `👨‍💼 *البائع (المرسل):* ${shipment.sellerName}`,
    `🤝 *البائع الآخر (المستلم):* *${shipment.buyerName}*`,
    `📍 *مسار اللوجستيك:* ${shipment.originPort} ⬅️ ${shipment.destinationMarket} (${shipment.destinationCity})`,
    `🚛 *السائق والشاحنة:* ${shipment.driverName} (لوحة: ${shipment.truckPlate})`,
    `───────────────────────`,
    `📦 *السلعة المشحونة:* *${shipment.fishNameAr}*`,
    `🏷 *نوع الصناديق:* ${crateInfo.nameAr}`,
    `🔢 *إجمالي الصناديق المشحونة:* *${shipment.shippedCrates.toLocaleString()} صندوق*`,
    `💵 *سعر الصندوق:* ${shipment.pricePerCrate} درهم`,
    `💰 *1. قيمة السلعة (السمك):* *${shipment.totalFishValue.toLocaleString()} درهم*`,
    `🛡 *2. ضمانة الصناديق (الكاشيون):* ${shipment.totalCautionAmount.toLocaleString()} درهم (${shipment.cautionPerCrate} د.م/صندوق)`,
    `🪙 *3. رسوم خدمة المنصة:* ${shipment.platformFee.toLocaleString()} درهم (${shipment.platformRateApplied.toFixed(2)} د.م/ص)`,
    `───────────────────────`,
    `↩️ *حركة استرجاع وتصفية الصناديق:*`,
    `✅ *الصناديق الفارغة المسترجعة:* *${shipment.returnedCrates.toLocaleString()} صندوق*`,
    `💳 *الضمانة المستردة المخصومة فوراً:* *-${shipment.refundedCautionAmount.toLocaleString()} درهم*`,
    `⚠️ *الصناديق المتبقية بذمة البائع الآخر:* *${shipment.unreturnedCrates.toLocaleString()} صندوق* (ضمانة معلقة: ${shipment.activeCautionDebt.toLocaleString()} د.م)`,
    `───────────────────────`,
    `💵 *المسدد نقداً / بنكياً:* ${shipment.cashPaidAmount.toLocaleString()} درهم`,
    `🚨 *الرصيد الصافي المتبقي في الحساب المفتوح:* *${shipment.netBalanceOwed.toLocaleString()} درهم*`,
    `📊 *حالة التسوية:* ${statusLabel}`,
    shipment.notes ? `📝 *ملاحظات الشحن والتفريغ:* ${shipment.notes}` : '',
    `───────────────────────`,
    `🔒 *بياناتك المالية مشفرة وآمنة 100%*`,
    `_تم إصدار هذا الكشف آلياً عبر منصة BahrBox للخدمات اللوجستية البحرية_`
  ].filter(Boolean);

  return lines.join('\n');
}

export function openWhatsAppOpenAccountLedger(
  shipment: LogisticsShipment,
  targetPhone?: string
) {
  const message = generateOpenAccountLedgerWhatsAppMessage(shipment);
  const encodedText = encodeURIComponent(message);
  const phone = targetPhone || shipment.buyerPhone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

export function generateLogisticsDispatchWhatsAppMessage(
  shipment: LogisticsShipment
): string {
  const crateInfo = getCrateCategoryInfo(shipment.crateType);
  const lines = [
    `🚛 *إشعار انطلاق شحنة سمك لوجستية — BahrBox*`,
    `_Commerce & Logistique Numérique du Poisson_`,
    `───────────────────────`,
    `📋 *إذن الشحنة رقم:* #${shipment.id}`,
    `📅 *تاريخ الانطلاق:* ${shipment.date} ${shipment.time}`,
    `👨‍💼 *البائع:* ${shipment.sellerName}`,
    `🤝 *البائع الآخر:* ${shipment.buyerName}`,
    `🏁 *الوجهة:* ${shipment.destinationMarket} — ${shipment.destinationCity}`,
    `🚚 *سائق الشاحنة:* ${shipment.driverName} (${shipment.truckPlate})`,
    `───────────────────────`,
    `📦 *حمولة السمك:* ${shipment.fishNameAr} × ${shipment.shippedCrates} صندوق (${crateInfo.shortLabel})`,
    `💰 *إجمالي الفاتورة المفتوحة:* ${(shipment.totalFishValue + shipment.totalCautionAmount).toLocaleString()} درهم`,
    `🛡 *ضمانة الصناديق المسجلة:* ${shipment.totalCautionAmount.toLocaleString()} درهم`,
    `───────────────────────`,
    `⚠️ يُرجى تسجيل الصناديق الفارغة المسترجعة فور تفريغ الشاحنة ليتم خصم ضمانتها آلياً من الحساب المفتوح.`,
    `🔒 *بياناتك المالية مشفرة وآمنة 100%*`
  ];

  return lines.join('\n');
}

export function openWhatsAppLogisticsDispatch(
  shipment: LogisticsShipment,
  targetPhone?: string
) {
  const message = generateLogisticsDispatchWhatsAppMessage(shipment);
  const encodedText = encodeURIComponent(message);
  const phone = targetPhone || shipment.buyerPhone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

