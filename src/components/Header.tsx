import React from 'react';
import { Languages, ShieldCheck, Sun, Moon } from 'lucide-react';
import { LanguageInfo } from '../types';
import { ThemeMode } from '../services/theme';

interface HeaderProps {
  currentLanguage: LanguageInfo;
  onOpenLanguageModal: () => void;
  onOpenCostModal: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onOpenLanguageModal,
  onOpenCostModal,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6EE]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E5DAC4] dark:border-slate-800 shadow-xs px-3 py-2 sm:px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Mauritanian Cultural Emblem */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-sky-600 via-sky-700 to-emerald-700 text-white shadow-md shadow-sky-900/20 border border-sky-400/30 shrink-0">
            <span className="text-xl sm:text-2xl select-none" role="img" aria-label="Mauritania">🇲🇷</span>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-[#FAF6EE] dark:border-slate-900 flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 bg-emerald-800 rounded-full"></span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="font-mono tracking-tight text-sky-700 dark:text-sky-400">L7a4eg AI</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-amber-600 dark:text-amber-400 font-black tracking-wide">لحاذگ</span>
              </h1>
              <span className="hidden xs:inline-flex px-2 py-0.5 text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 rounded-full border border-sky-300 dark:border-sky-800/60 shadow-xs">
                موريتانيا 🇲🇷
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none truncate max-w-[170px] sm:max-w-none">
              المساعد الذكي لموريتانيا • لسان البيظان
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Light / Dark Mode Toggle (الرمال الذهبية vs الليل الصحراوي) */}
          <button
            onClick={onToggleTheme}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F3EAD8] dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold border border-[#E2D5BE] dark:border-slate-750 transition-all shadow-xs cursor-pointer min-h-[40px]"
            title={isDark ? 'التبديل إلى وضع الرمال الذهبية (فاتح)' : 'التبديل إلى وضع ليل الصحراء (داكن)'}
            aria-label="تبديل المظهر"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span className="hidden sm:inline">وضع الرمال</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">وضع الليل</span>
              </>
            )}
          </button>

          {/* Zero Cost & Safety Info Button */}
          <button
            onClick={onOpenCostModal}
            type="button"
            className="hidden xs:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/90 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-700/40 transition-colors shadow-xs min-h-[40px] cursor-pointer"
            title="معلومات الاستخدام المجاني وبدون دفع"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden md:inline">مجاني بالكامل</span>
            <span className="md:hidden text-[11px]">مجاني</span>
          </button>

          {/* Language Selector Button */}
          <button
            onClick={onOpenLanguageModal}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F3EAD8] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-[#E2D5BE] dark:border-slate-700 transition-colors shadow-xs min-h-[40px] cursor-pointer"
            aria-label="اختيار اللغة أو اللهجة"
          >
            <Languages className="w-4 h-4 text-sky-600 dark:text-amber-400 shrink-0" />
            <span className="max-w-[70px] sm:max-w-[120px] truncate">
              {currentLanguage.code === 'hassaniya' ? 'الحسانية' : currentLanguage.nameNative}
            </span>
            <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded font-mono">
              {currentLanguage.dir.toUpperCase()}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
