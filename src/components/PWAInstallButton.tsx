import React, { useState } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, Monitor, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Suppress if already running in standalone / installed PWA mode
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={async () => {
          setIsInstalling(true);
          try {
            await install();
          } finally {
            setIsInstalling(false);
          }
        }}
        disabled={isInstalling}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-sky-700 hover:from-emerald-500 hover:to-sky-600 text-white text-xs font-bold shadow-md shadow-sky-950/20 active:scale-95 transition-all cursor-pointer group"
        title="تثبيت تطبيق لحاذگ على هاتفك أو حاسوبك للعمل دون إنترنت"
      >
        <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-400/40 hover:border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer"
          title="تثبيت التطبيق على iPhone أو iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>تثبيت في iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
            dir="rtl"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[#FAF7F0] dark:bg-slate-900 border border-[#E5DAC4] dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      تثبيت "لحاذگ" على الآيفون
                    </h3>
                    <p className="text-[11px] text-slate-500">إضافة التطبيق للشاشة الرئيسية</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-[#E8DFC8] dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">الخطوة 1:</span> اضغط على زر <strong>مشاركة (Share)</strong> في شريط Safari السفلي.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-[#E8DFC8] dark:border-slate-800">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">الخطوة 2:</span> مرر للأسفل واختر <strong>"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                فهمت، حسناً
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop or Ambient state with informative instructions modal (No window.alert)
  return (
    <>
      <button
        type="button"
        onClick={() => setShowDesktopGuide(true)}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E0D4BE] dark:border-slate-800 hover:border-sky-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
        title="تثبيت التطبيق على جهازك"
      >
        <Download className="w-3 h-3 text-sky-600 dark:text-sky-400" />
        <span>تثبيت PWA</span>
      </button>

      {showDesktopGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          dir="rtl"
          onClick={() => setShowDesktopGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#FAF7F0] dark:bg-slate-900 border border-[#E5DAC4] dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    تثبيت تطبيق لحاذگ
                  </h3>
                  <p className="text-[11px] text-slate-500">تجربة تطبيق أصيل وسريع دون إنترنت</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-[#E8DFC8] dark:border-slate-800 flex items-start gap-2">
                <span className="text-sky-600 font-bold shrink-0">1.</span>
                <span>اضغط على أيقونة التثبيت ⊕ في شريط عنوان المتصفح أعلى الشاشة (أو القائمة ⋮).</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-[#E8DFC8] dark:border-slate-800 flex items-start gap-2">
                <span className="text-emerald-600 font-bold shrink-0">2.</span>
                <span>اختر <strong>"تثبيت L7a4eg AI | لحاذگ"</strong> ليعمل بنافذة مستقلة وسرعة فائقة.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
