import React, { useState } from 'react';
import {
  Sparkles,
  Coffee,
  BookMarked,
  Scroll,
  MessageCircle,
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { consultHassaniAI } from '../services/api';

type HassaniMode = 'explain_term' | 'proverb' | 'poetry' | 'etiquette' | 'translation_bridge' | 'general';

interface ModeOption {
  id: HassaniMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  samplePlaceholder: string;
}

const MODES: ModeOption[] = [
  {
    id: 'explain_term',
    label: 'قاموس وتفسير الألفاظ',
    icon: BookMarked,
    description: 'شرح معاني الكلمات الحسانية وأصولها واستعمالاتها اليومية',
    samplePlaceholder: 'اكتب كلمة حسانية مثل: كِمِّي، التيفاية، ازوان، لمسيميس، النكعة...',
  },
  {
    id: 'translation_bridge',
    label: 'ترجمة ثلاثية (حساني/فصحى/فرنسي)',
    icon: ArrowRightLeft,
    description: 'ترجمة فورية متطابقة بين الحسانية والعربية الفصحى والفرنسية مع شرح الاستخدام',
    samplePlaceholder: 'اكتب جملة بالحسانية أو الفصحى أو الفرنسية لترجمتها فورياً...',
  },
  {
    id: 'proverb',
    label: 'أمثال وحِكَم البيظان',
    icon: Scroll,
    description: 'شرح الأمثال الموريتانية الشعبية وسياقاتها وحكمتها',
    samplePlaceholder: 'اكتب مثلاً أو موضوعاً مثل: الصبر، الصداقة، الكرم، الشور الشور...',
  },
  {
    id: 'poetry',
    label: 'لغن والشعر الحساني',
    icon: Sparkles,
    description: 'أوزان وبحور الشعر الحساني (الكاف، الطلعة، لبتيت، لبير)',
    samplePlaceholder: 'اطلب كاف أو طلعة أو شرح بحر من بحور لغن (الفخر، الوطن، الحنين)...',
  },
  {
    id: 'etiquette',
    label: 'طقوس الأتاي والضيافة',
    icon: Coffee,
    description: 'آداب المجالس الموريتانية، الجيمات الثلاث للشاي، والتقاليد الأصيلة',
    samplePlaceholder: 'اسأل عن طقس أتاي، استقبال الضيف، الصردة، عادات الأعراس...',
  },
  {
    id: 'general',
    label: 'محادثة حسانية مباشرة',
    icon: MessageCircle,
    description: 'تحدث مع "لحاذگ" باللهجة الحسانية الحية كما يتحدث أهل انواكشوط والداخل',
    samplePlaceholder: 'شحالك اليوم؟ شنهي أخبار لكوارب والمطر في الداخل؟...',
  },
];

const PRESET_QUICK_CARDS = [
  {
    title: 'أتاي موريتاني أصيل ☕',
    mode: 'etiquette' as HassaniMode,
    query: 'طقوس الشاي الموريتاني (أتاي) والكؤوس الثلاثة والجيمات الثلاث',
    snippet: 'الجماعة، الجر، والجمر.. طقس الضيافة الموريتاني الخالد.',
  },
  {
    title: 'ترجمة ثلاثية متطابقة 🔄',
    mode: 'translation_bridge' as HassaniMode,
    query: 'ترجم لي للحسانية والفرنسية: "أنا مسرور جداً بلقائكم وسنزوركم قريباً إن شاء الله"',
    snippet: 'صياغة حسانية وفصحى وفرنسية مع شرح الاستخدام والسياق.',
  },
  {
    title: 'الشور الشور ⏳',
    mode: 'proverb' as HassaniMode,
    query: 'مثل: الشور الشور ما يسبك حد والزربة ما فيها خير',
    snippet: 'حكمة التروي الموريتانية في القرارات والسفر والحياة.',
  },
  {
    title: 'لغن: الكاف والطلعة 📜',
    mode: 'poetry' as HassaniMode,
    query: 'ما هو الفرق بين الكاف والطلعة في الشعر الحساني مع مثال جميل؟',
    snippet: 'وحدات البلاغة الشعرية الحسانية الفريدة.',
  },
  {
    title: 'كلمات الترحيب اليومية 🤝',
    mode: 'explain_term' as HassaniMode,
    query: 'عبارات الترحيب والسؤال عن الحال بالحسانية: شحالك، ل باس، يخير، مرحبتي',
    snippet: 'الدفء والود في اللقاءات اليومية بين الموريتانيين.',
  },
];

export const HassaniView: React.FC = () => {
  const [activeMode, setActiveMode] = useState<HassaniMode>('explain_term');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedModeConfig = MODES.find((m) => m.id === activeMode)!;

  const handleConsult = async (overrideInput?: string, overrideMode?: HassaniMode) => {
    const query = overrideInput || input;
    const mode = overrideMode || activeMode;

    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResult(null);

    try {
      const res = await consultHassaniAI(mode, query.trim());
      setResult(res.result);
    } catch (err: any) {
      setResult(
        'عذراً، لم نتمكن من الحصول على الإجابة في هذه اللحظة. يرجى التأكد من اتصال الخادم والمحاولة مجدداً.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!result || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-3 sm:p-6 space-y-5 pb-24 md:pb-12">
      {/* Hero Badge Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-amber-600/30 p-4 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>جناح لسان البيظان والتراث الموريتاني</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              لحاذگ الحساني &bull; مَعين اللهجة والثقافة 🇲🇷
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              تصفح معاني الألفاظ، أمثال الشناقطة، أوزان لغن، وطقوس الشاي والضيافة الموريتانية الأصيلة بلغة أهل الأرض.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setActiveMode(mode.id);
                setResult(null);
              }}
              type="button"
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 ${
                isActive
                  ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`p-2 rounded-lg ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </div>
              <div>
                <p className={`font-bold text-xs sm:text-sm ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                  {mode.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Input Consultation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>{selectedModeConfig.description}</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
            placeholder={selectedModeConfig.samplePlaceholder}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            dir="rtl"
          />
          <button
            onClick={() => handleConsult()}
            disabled={!input.trim() || isLoading}
            className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              input.trim() && !isLoading
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>جاري البحث في التراث...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 rotate-180" />
                <span>استشر لحاذگ الحساني</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Heritage Cards */}
      {!result && !isLoading && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            مواضيع حسانية نموذجية سريعة:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_QUICK_CARDS.map((card, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveMode(card.mode);
                  setInput(card.query);
                  handleConsult(card.query, card.mode);
                }}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-amber-600/50 hover:bg-slate-850 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">{card.snippet}</p>
                </div>
                <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-300 flex items-center justify-center shrink-0 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-slate-900 border border-amber-600/40 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">إفادة لحاذگ الحساني</h3>
                <p className="text-[11px] text-slate-400">توثيق موريتاني أصيل</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="نسخ الإفادة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              {'speechSynthesis' in window && (
                <button
                  onClick={handleSpeak}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="استماع صوتي"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};
