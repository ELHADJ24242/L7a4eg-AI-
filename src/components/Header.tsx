import React, { useState } from 'react';
import { Languages, ShieldCheck, Sun, Moon, Bell, User, LogOut, Sparkles } from 'lucide-react';
import { LanguageInfo } from '../types';
import { ThemeMode } from '../services/theme';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentLanguage: LanguageInfo;
  onOpenLanguageModal: () => void;
  onOpenCostModal: () => void;
  onOpenNotificationsModal: () => void;
  unreadNotificationsCount?: number;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onOpenLanguageModal,
  onOpenCostModal,
  onOpenNotificationsModal,
  unreadNotificationsCount = 0,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === 'dark';
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
          {/* In-App PWA Install Prompt Button */}
          <PWAInstallButton />

          {/* Smart Mauritanian Notifications Bell */}
          <button
            onClick={onOpenNotificationsModal}
            type="button"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F3EAD8] dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-[#E2D5BE] dark:border-slate-750 transition-all shadow-xs cursor-pointer"
            title="التنبيهات الموريتانية الذكية (الباك، المنح، المناقصات)"
            aria-label="التنبيهات"
          >
            <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Account / Profile Button */}
          <div className="relative">
            {isAuthenticated && user ? (
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-[#F3EAD8] dark:hover:bg-slate-750 border border-[#E2D5BE] dark:border-slate-750 shadow-xs cursor-pointer min-h-[40px]"
                aria-label="قائمة المستخدم"
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-lg object-cover bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-700"
                />
                <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[80px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openAuthModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white text-xs font-bold shadow-xs cursor-pointer min-h-[40px] transition-all"
                title="تسجيل الدخول أو إنشاء حساب"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">حسابي</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {isUserMenuOpen && isAuthenticated && user && (
              <div
                className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 rounded-2xl bg-white dark:bg-slate-850 shadow-xl border border-[#E2D5BE] dark:border-slate-750 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                dir="rtl"
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-750">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono" dir="ltr">
                    {user.email || user.phone || 'مستخدم لحاذگ'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                    {user.provider === 'phone_otp' ? 'موثق برقم هاتف 🇲🇷' : user.provider === 'google' ? 'Google OAuth' : 'عضوية لحاذگ الذكية'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenNotificationsModal();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-right"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>التنبيهات الموريتانية</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer text-right"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
                <span className="hidden sm:inline">الرمال</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">الليل</span>
              </>
            )}
          </button>

          {/* Zero Cost & Safety Info Button */}
          <button
            onClick={onOpenCostModal}
            type="button"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/90 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-700/40 transition-colors shadow-xs min-h-[40px] cursor-pointer"
            title="معلومات الاستخدام المجاني وبدون دفع"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-[11px]">مجاني</span>
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
