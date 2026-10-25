import React from 'react';
import { X, Check, AlertCircle, Info, Sparkles } from 'lucide-react';
import { LanguageCode, LanguageInfo } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: LanguageInfo;
  onSelectLanguage: (lang: LanguageInfo) => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>اختر لغة الواجهة والمحادثة</span>
              <span className="text-xs font-normal text-slate-400">(Choix de langue)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تطبيق &quot;لحاذگ (L7a4eg AI)&quot; صُمم خصيصاً لموريتانيا مع احترام جميع اللغات الوطنية
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {/* Transparency note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold mb-0.5">مبدأ الشفافية اللغوية والأمانة المعرفية:</p>
              <p className="text-amber-200/90">
                الحسانية والعربية والفرنسية مختبرة ومدعومة تماماً. اللغات الوطنية (البولارية، السوننكية، الولوفية، والبامبارا) يدعمها القاموس المجتمعي التشاركي، وفي حال عدم توفر إجابة واثقة باللغة سيتم توضيح ذلك واقتراح بدائل مناسبة.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage.code === lang.code;
              const isHassaniya = lang.code === 'hassaniya';

              return (
                <div
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                      : isHassaniya
                      ? 'bg-amber-950/20 border-amber-700/40 hover:border-amber-500/50'
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isHassaniya
                            ? 'bg-amber-500 text-slate-950'
                            : isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isHassaniya ? '🇲🇷' : lang.dir === 'rtl' ? 'ض' : 'Aa'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-white">
                            {lang.nameNative}
                          </span>
                          {isHassaniya && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-amber-400 text-slate-950 rounded font-black tracking-wide flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              أولوية موريتانيا
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lang.dir.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {lang.nameFrench} &bull; {lang.nameArabic}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">تفعيل</span>
                      )}
                    </div>
                  </div>

                  {/* Status & notes */}
                  <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[280px] sm:max-w-md">
                      {lang.notes}
                    </span>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${
                        lang.supportLevel === 'primary' || lang.supportLevel === 'fluent'
                          ? 'bg-emerald-900/60 text-emerald-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {lang.supportLevel === 'primary'
                        ? 'مختبر بالكامل'
                        : lang.supportLevel === 'fluent'
                        ? 'دعم متقدم'
                        : 'إثراء مجتمعي'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            يمكنك دائماً تغيير لغتك أو التبديل بين الحسانية والعربية والفرنسية في أي لحظة.
          </p>
        </div>
      </div>
    </div>
  );
};
