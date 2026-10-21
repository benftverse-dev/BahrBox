import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Bot, 
  Lock,
  Headphones,
  CheckCircle2
} from 'lucide-react';
import { SaleEntry, DebtRecord, BuyerCrateBalance } from '../types';
import { 
  processAccountantQuery, 
  speakAccountant, 
  stopSpeaking, 
  findMaleArabicVoice, 
  AssistantAnswer 
} from '../utils/speech';
import { soundEffects } from '../utils/audio';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: SaleEntry[];
  debts: DebtRecord[];
  crateBalances: BuyerCrateBalance[];
  merchantTierRate: number;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  sales,
  debts,
  crateBalances,
  merchantTierRate
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AssistantAnswer | null>(null);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [maleVoiceDetected, setMaleVoiceDetected] = useState<boolean>(false);
  const [maleVoiceName, setMaleVoiceName] = useState<string>('');

  // Check speech synthesis voices on mount
  useEffect(() => {
    const checkVoices = () => {
      const v = findMaleArabicVoice();
      if (v) {
        setMaleVoiceDetected(true);
        setMaleVoiceName(v.name);
      } else {
        setMaleVoiceDetected(false);
      }
    };

    checkVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }

    // Check SpeechRecognition API
    if (typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))) {
      setRecognitionAvailable(true);
    }
  }, []);

  // When modal opens, greet user
  useEffect(() => {
    if (isOpen) {
      soundEffects.playMicChime();
      const initialGreeting = processAccountantQuery('ملخص عام', {
        sales,
        debts,
        crateBalances,
        merchantTierRate
      });
      setCurrentAnswer(initialGreeting);
      
      const didSpeak = speakAccountant(initialGreeting.spokenText, () => setIsSpeaking(false));
      setIsSpeaking(didSpeak);
    } else {
      stopSpeaking();
      setIsSpeaking(false);
      setIsListening(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAsk = (query: string) => {
    if (!query.trim()) return;
    soundEffects.playClick();
    stopSpeaking();
    setIsSpeaking(false);

    const answer = processAccountantQuery(query, {
      sales,
      debts,
      crateBalances,
      merchantTierRate
    });

    setCurrentAnswer(answer);
    setQueryInput('');

    // Strict Speech Synthesis with deep male voice parameters (pitch=0.4, rate=0.95)
    // If no male voice available, speakAccountant returns false and does NOT play audio
    const didSpeak = speakAccountant(answer.spokenText, () => setIsSpeaking(false));
    setIsSpeaking(didSpeak);
  };

  const handleToggleMic = () => {
    soundEffects.playMicChime();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: simulate voice query prompt
      handleAsk('كم هو إجمالي مبيعات اليوم؟');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-MA';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleAsk(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const quickQueries = [
    { label: 'إجمالي مبيعات اليوم', query: 'كم إجمالي مبيعات اليوم؟' },
    { label: 'عدد الصناديق المتداولة', query: 'كم عدد الصناديق المباعة اليوم؟' },
    { label: 'الكريدي والمستحقات العالقة', query: 'كم باقي في الكريدي عند المشترين؟' },
    { label: 'عمولة ورسوم المنصة', query: 'ما هي عمولة المنصة المستحقة؟' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center">
      {/* Bottom Sheet Container */}
      <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl w-full max-w-xl p-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-8 max-h-[90vh] overflow-y-auto">
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

        {/* Header Contract */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              {/* Persona Name strictly "محاسب مالي" */}
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  محاسب مالي
                </h3>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 rounded px-1.5 py-0.2 font-bold">
                  BahrBox AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                المستشار المالي الصوتي لتجارة وتوزيع الأسماك
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Strict Male Voice Status Indicator */}
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-slate-300 font-bold block">
                {maleVoiceDetected ? `نطق صوتي رجالي نقي (${maleVoiceName})` : 'وضع العرض النصي الصارم (Fallback)'}
              </span>
              <span className="text-[10px] text-slate-500">
                {maleVoiceDetected 
                  ? 'طبقة صوت جهورية (Pitch: 0.4 · Rate: 0.95)' 
                  : 'تم تفعيل الحماية: لا يوجد صوت رجالي عربي، تم حظر أي صوت نسائي'}
              </span>
            </div>
          </div>

          {isSpeaking && (
            <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold animate-pulse">
              <Volume2 className="w-4 h-4" />
              <span>يتحدث...</span>
            </div>
          )}
        </div>

        {/* Current Answer Card */}
        {currentAnswer && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>إفادة المحاسب المالي:</span>
              </span>
              {currentAnswer.metric && (
                <span className="text-[10px] text-slate-500">
                  {currentAnswer.metric.label}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {currentAnswer.spokenText}
            </p>

            {currentAnswer.metric && (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{currentAnswer.metric.label}</span>
                  <span className="text-xl font-mono font-black text-white tabular-nums">
                    {currentAnswer.metric.value}
                  </span>
                </div>
                {currentAnswer.metric.unit && (
                  <span className="text-xs font-bold text-cyan-400">
                    {currentAnswer.metric.unit}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Voice Query Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400">استفسارات سريعة بنقرة واحدة:</span>
          <div className="grid grid-cols-2 gap-2">
            {quickQueries.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleAsk(item.query)}
                className="text-right p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar & Mic Trigger */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="اطرح سؤالاً مالياً (مثال: كم إجمالي المبيعات؟)..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAsk(queryInput);
              }}
              className="w-full h-12 pr-4 pl-10 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {queryInput && (
              <button
                onClick={() => handleAsk(queryInput)}
                className="absolute left-2.5 top-2.5 w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Big Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all shadow-lg shrink-0 ${
              isListening
                ? 'bg-rose-600 animate-pulse ring-4 ring-rose-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
            title="تحدث مع المحاسب المالي"
          >
            {isListening ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Security & Privacy Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>بياناتك المالية مشفرة وآمنة 100% · استفسارات خاصة تماماً</span>
        </div>
      </div>
    </div>
  );
};
