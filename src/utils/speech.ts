/**
 * Speech synthesis & query engine for Voice Assistant "محاسب مالي"
 * Enforces strict male Arabic voice selection (pitch = 0.4, rate = 0.95)
 * Fallback: If no male voice is available, display text responses ONLY (DO NOT fallback to female voice).
 */

import { SaleEntry, DebtRecord, BuyerCrateBalance } from '../types';

export interface AssistantAnswer {
  spokenText: string;
  displayMarkdown: string;
  hasAudioVoice: boolean;
  maleVoiceName?: string;
  metric?: {
    label: string;
    value: string;
    unit?: string;
  };
}

/**
 * Identify strictly male Arabic voice profiles.
 * Common male Arabic voice indicators: Tarik, Tariq, Maged, Naayf, Male, Jamal, Omar, Youssef, etc.
 * Explicitly filter out known female names (Laila, Hoda, Salma, Zeina, Mariam, Noor, Fatimah, etc.)
 */
export function findMaleArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));

  const maleKeywords = ['tarik', 'tariq', 'maged', 'naayf', 'male', 'jamal', 'omar', 'youssef', 'mehdi', 'khalid'];
  const femaleKeywords = ['laila', 'layla', 'hoda', 'salma', 'zeina', 'mariam', 'noor', 'fatimah', 'female', 'amira'];

  // Check arabic voices with male keyword
  for (const voice of arabicVoices) {
    const nameLower = voice.name.toLowerCase();
    const isMale = maleKeywords.some(keyword => nameLower.includes(keyword));
    const isFemale = femaleKeywords.some(keyword => nameLower.includes(keyword));

    if (isMale && !isFemale) {
      return voice;
    }
  }

  // Look for any voice with arabic lang and male token
  const fallbackMaleAr = arabicVoices.find(v => {
    const nameLower = v.name.toLowerCase();
    return !femaleKeywords.some(k => nameLower.includes(k)) && (nameLower.includes('male') || nameLower.includes('man'));
  });

  if (fallbackMaleAr) {
    return fallbackMaleAr;
  }

  // Strict Rule: DO NOT fallback to any female voice! Return null so only text is shown.
  return null;
}

/**
 * Speak text with strict deep male parameters: pitch = 0.4, rate = 0.95
 * Returns true if audio speech was initiated, false if text-only fallback was enforced.
 */
export function speakAccountant(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  const maleVoice = findMaleArabicVoice();
  if (!maleVoice) {
    // Strictly NO female voice fallback as per specification!
    return false;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = maleVoice;
  utterance.lang = maleVoice.lang || 'ar-SA';
  utterance.pitch = 0.4; // Enforce deep male tone parameters
  utterance.rate = 0.95;  // Deliberate authoritative accountant pace

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Intelligent Accountant Query Processor for "محاسب مالي"
 */
export function processAccountantQuery(
  rawQuery: string,
  context: {
    sales: SaleEntry[];
    debts: DebtRecord[];
    crateBalances: BuyerCrateBalance[];
    merchantTierRate: number;
  }
): AssistantAnswer {
  const query = rawQuery.trim().toLowerCase();
  const maleVoice = findMaleArabicVoice();
  const hasVoice = maleVoice !== null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = context.sales.filter(s => s.date === todayStr);

  const totalTodayRevenue = todaySales.reduce((acc, s) => acc + s.totalFishAmount, 0);
  const totalTodayCaution = todaySales.reduce((acc, s) => acc + s.totalCautionAmount, 0);
  const totalTodayCrates = todaySales.reduce((acc, s) => acc + s.crateCount, 0);
  const totalPlatformFee = totalTodayCrates * context.merchantTierRate;
  const totalOutstandingDebt = context.debts.reduce((acc, d) => acc + d.remainingDebt, 0);

  const totalBasinLargeOut = context.crateBalances.reduce((acc, c) => acc + (c.basinLargeOwed || 0), 0);
  const totalCrateMediumOut = context.crateBalances.reduce((acc, c) => acc + (c.crateMediumOwed || 0), 0);
  const totalCrateSmallOut = context.crateBalances.reduce((acc, c) => acc + (c.crateSmallOwed || 0), 0);
  const totalStyrofoamOut = context.crateBalances.reduce((acc, c) => acc + (c.styrofoamDelivered || 0), 0);
  const totalReturnableCratesOut = totalBasinLargeOut + totalCrateMediumOut + totalCrateSmallOut;

  // Revenue query
  if (query.includes('مبيعات') || query.includes('فلوس') || query.includes('دخل') || query.includes('إجمالي') || query.includes('المدخول')) {
    const text = `أهلاً بك. إجمالي مبيعات اليوم بلغ ${totalTodayRevenue.toLocaleString('ar-MA')} درهم، بعدد ${todaySales.length} عملية بيع، مع ضمانات صناديق قدرها ${totalTodayCaution.toLocaleString('ar-MA')} درهم.`;
    return {
      spokenText: text,
      displayMarkdown: `إجمالي مبيعات اليوم الصافية: **${totalTodayRevenue.toLocaleString()} درهم** (${todaySales.length} عملية بيع)`,
      hasAudioVoice: hasVoice,
      maleVoiceName: maleVoice?.name,
      metric: {
        label: 'مبيعات اليوم الصافية',
        value: totalTodayRevenue.toLocaleString(),
        unit: 'درهم مغربي'
      }
    };
  }

  // Crate volume query
  if (query.includes('صندوق') || query.includes('صناديق') || query.includes('بانيو') || query.includes('فرشي') || query.includes('حجم')) {
    const text = `تم تداول وإخراج ${totalTodayCrates} صندوقاً اليوم. وفي السوق لا يزال لدى المشترين ${totalReturnableCratesOut} صندوق بلاستيكي أبيض مسترجع، تشمل ${totalBasinLargeOut} بانيو كبير، ${totalCrateMediumOut} صندوق متوسط، و ${totalCrateSmallOut} صندوق صغير. بالإضافة إلى ${totalStyrofoamOut} شحنة فرشي غير مسترجعة.`;
    return {
      spokenText: text,
      displayMarkdown: `الصناديق البيضاء العالقة بالسوق: **${totalReturnableCratesOut} صندوق** (${totalBasinLargeOut} بانيو كبير + ${totalCrateMediumOut} متوسط + ${totalCrateSmallOut} صغير). شحنات الفرشي: **${totalStyrofoamOut} صندوق** (غير مسترجع).`,
      hasAudioVoice: hasVoice,
      maleVoiceName: maleVoice?.name,
      metric: {
        label: 'الصناديق البيضاء العالقة بالسوق',
        value: `${totalReturnableCratesOut}`,
        unit: 'صندوق مسترجع'
      }
    };
  }

  // Debt query
  if (query.includes('كريدي') || query.includes('ديون') || query.includes('سلف') || query.includes('مستحقات') || query.includes('باقي')) {
    const text = `مجموع الكريدي والمستحقات العالقة لدى المشترين هو ${totalOutstandingDebt.toLocaleString('ar-MA')} درهم موزعة على ${context.debts.filter(d => d.remainingDebt > 0).length} بائع آخر.`;
    return {
      spokenText: text,
      displayMarkdown: `إجمالي الكريدي المستحق بذمة المشترين: **${totalOutstandingDebt.toLocaleString()} درهم**. يمكنك إرسال تذكيرات واتساب فورية من تبويب الكريدي.`,
      hasAudioVoice: hasVoice,
      maleVoiceName: maleVoice?.name,
      metric: {
        label: 'إجمالي الكريدي المعلق',
        value: totalOutstandingDebt.toLocaleString(),
        unit: 'درهم مغربي'
      }
    };
  }

  // Commission & Fees query
  if (query.includes('عمولة') || query.includes('مصاريف') || query.includes('منصة') || query.includes('الرسوم') || query.includes('أرباح')) {
    const text = `عمولة منصة بحر بوكس المطبقة على حسابك هي ${context.merchantTierRate.toFixed(2)} درهم لكل صندوق مشحون. رسوم اليوم الإجمالية هي ${totalPlatformFee.toFixed(2)} درهم عن ${totalTodayCrates} صندوق.`;
    return {
      spokenText: text,
      displayMarkdown: `تسعيرة المنصة: **${context.merchantTierRate.toFixed(2)} درهم/صندوق**. مستحقات المنصة عن اليوم: **${totalPlatformFee.toFixed(2)} درهم**.`,
      hasAudioVoice: hasVoice,
      maleVoiceName: maleVoice?.name,
      metric: {
        label: 'تسعيرة عمولة المنصة',
        value: `${context.merchantTierRate.toFixed(2)} د.م`,
        unit: 'لكل صندوق'
      }
    };
  }

  // Fallback financial advice
  const text = `أهلاً بك. أنا محاسبك المالي في بحر بوكس. يمكنك سؤالي عن مبيعات اليوم، الصناديق البيضاء المسترجعة، شحنات الفرشي، الكريدي العالق، أو عمولة المنصة.`;
  return {
    spokenText: text,
    displayMarkdown: `أهلاً بك يا معلم. أنا **محاسبك المالي** المباشر. يمكنك الاستفسار عن: مبيعات اليوم، حركة الصناديق والكاشيون، ديون المشترين (الكريدي)، أو رسوم المنصة.`,
    hasAudioVoice: hasVoice,
    maleVoiceName: maleVoice?.name
  };
}
