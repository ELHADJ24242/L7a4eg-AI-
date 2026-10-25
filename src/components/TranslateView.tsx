import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Languages,
  Copy,
  Check,
  Volume2,
  Sparkles,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { translateText } from '../services/api';

const MAURITANIAN_COMMON_PHRASES = [
  {
    ar: 'شهادة السكنى والإقامة الرسمية',
    fr: 'Certificat de résidence officiel',
  },
  {
    ar: 'عقد بيع قطعة أرضية موثق في تفرغ زينة',
    fr: 'Contrat de vente d\'un terrain notarié à Tevragh-Zeina',
  },
  {
    ar: 'طلب خطي موجه إلى السيد والي ولاية نواكشوط الغربية',
    fr: 'Demande manuscrite adressée à Monsieur le Wali de Nouakchott Ouest',
  },
  {
    ar: 'وصل إيداع ملف السجل الوطني للسكان وتطبيق هويتي',
    fr: 'Récépissé de dépôt de dossier au Registre National des Populations et application Howiyati',
  },
];

export const TranslateView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<'ar' | 'fr'>('ar');
  const [targetLang, setTargetLang] = useState<'ar' | 'fr'>('fr');
  const [includeHassaniyaNotes, setIncludeHassaniyaNotes] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleTranslate = async (textToUse?: string) => {
    const q = textToUse || inputText;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await translateText(q.trim(), sourceLang, targetLang, includeHassaniyaNotes);
      setTranslatedText(res.translation);
    } catch (err: any) {
      setTranslatedText('حدث خطأ أثناء الترجمة. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string, lang: 'ar' | 'fr') => {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'fr-FR';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-3 sm:p-6 space-y-5 pb-24 md:pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Languages className="w-6 h-6 text-emerald-400" />
            <span>الترجمة الذكية: العربية &bull; الفرنسية 🇲🇷</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ترجمة دقيقة تراعي السياق الإداري والقانوني والثقافي الموريتاني واللهجة الحسانية
          </p>
        </div>

        {/* Hassaniya Context Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 px-3 rounded-xl shrink-0">
          <input
            type="checkbox"
            id="hassaniNotes"
            checked={includeHassaniyaNotes}
            onChange={(e) => setIncludeHassaniyaNotes(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-slate-950 border-slate-700 cursor-pointer"
          />
          <label htmlFor="hassaniNotes" className="text-xs text-slate-300 font-medium cursor-pointer">
            تضمين الشرح والتعابير الحسانية
          </label>
        </div>
      </div>

      {/* Language Switch Controls */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-sm font-bold text-white">
          <span>{sourceLang === 'ar' ? 'العربية' : 'Français (الفرنسية)'}</span>
          <span className="text-[10px] text-emerald-400 font-mono">
            {sourceLang === 'ar' ? 'RTL' : 'LTR'}
          </span>
        </div>

        <button
          onClick={handleSwap}
          type="button"
          className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-colors"
          title="تبديل لغة المصدر والهدف"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-sm font-bold text-white">
          <span>{targetLang === 'ar' ? 'العربية' : 'Français (الفرنسية)'}</span>
          <span className="text-[10px] text-emerald-400 font-mono">
            {targetLang === 'ar' ? 'RTL' : 'LTR'}
          </span>
        </div>
      </div>

      {/* Translation Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Text Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[220px] shadow-md focus-within:border-emerald-600/60 transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              sourceLang === 'ar'
                ? 'اكتب أو الصق النص العربي المراد ترجمته هنا...'
                : 'Saisissez ou collez le texte en français à traduire ici...'
            }
            rows={6}
            dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}
            className="w-full bg-transparent border-0 text-white text-sm placeholder:text-slate-500 resize-none outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
            <span className="text-xs text-slate-500 font-mono">{inputText.length} حرف</span>
            <div className="flex items-center gap-1.5">
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
                >
                  مسح
                </button>
              )}
              <button
                type="button"
                onClick={() => handleTranslate()}
                disabled={!inputText.trim() || isLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  inputText.trim() && !isLoading
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري الترجمة...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ترجم الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Target Result Area */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[220px] shadow-md relative">
          {translatedText ? (
            <div
              dir={targetLang === 'ar' ? 'rtl' : 'ltr'}
              className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto max-h-72"
            >
              {translatedText}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-8">
              <Languages className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
              <span>ستظهر الترجمة الدقيقة هنا فور الضغط على &quot;ترجم الآن&quot;</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
            <span className="text-[11px] text-emerald-400 font-medium">
              ترجمة متوافقة مع مصطلحات موريتانيا
            </span>
            {translatedText && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="نسخ الترجمة"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                {'speechSynthesis' in window && (
                  <button
                    onClick={() => handleSpeak(translatedText, targetLang)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="استماع صوتي"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mauritanian Administrative & Common Examples */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>نماذج إدارية وتجارية متداولة في موريتانيا:</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MAURITANIAN_COMMON_PHRASES.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setInputText(sourceLang === 'ar' ? item.ar : item.fr);
                handleTranslate(sourceLang === 'ar' ? item.ar : item.fr);
              }}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-700/60 hover:bg-slate-850 cursor-pointer transition-all"
            >
              <p className="text-xs font-bold text-white" dir="rtl">{item.ar}</p>
              <p className="text-[11px] text-slate-400 mt-1" dir="ltr">{item.fr}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
