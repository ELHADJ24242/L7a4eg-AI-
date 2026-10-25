import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Send,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  copyTextToClipboard,
  downloadAsTextFile,
  getFacebookShareUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  shareNative,
} from '../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareText: string;
  subtitle?: string;
  categoryTag?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  shareText,
  subtitle,
  categoryTag = 'موريتانيا | الحسانية',
}) => {
  const [copied, setCopied] = useState(false);
  const [nativeShared, setNativeShared] = useState(false);

  if (!isOpen) return null;

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    const success = await copyTextToClipboard(shareText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const success = await shareNative({
      title,
      text: shareText,
    });
    if (success) {
      setNativeShared(true);
      setTimeout(() => setNativeShared(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = getWhatsAppShareUrl(shareText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTwitter = () => {
    const url = getTwitterShareUrl(shareText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebook = () => {
    const url = getFacebookShareUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    const url = getTelegramShareUrl(shareText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
    downloadAsTextFile(shareText, `لحاذگ_${safeTitle}_${Date.now()}.txt`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div
        className="w-full max-w-lg bg-[#FAF7F0] dark:bg-slate-900 border border-[#E5DAC4] dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
      >
        {/* Header with Mauritanian Accent Gradient */}
        <div className="relative p-4 sm:p-5 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-700 dark:from-sky-950 dark:via-slate-900 dark:to-emerald-950 text-white shrink-0 border-b border-sky-600/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 dark:bg-sky-500/20 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="share-modal-title" className="text-base sm:text-lg font-bold tracking-tight">
                    مشاركة المحتوى
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-slate-950 shadow-xs">
                    {categoryTag}
                  </span>
                </div>
                <p className="text-xs text-sky-100/90 dark:text-slate-300 line-clamp-1 mt-0.5">
                  {subtitle || title}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Main Action Channels */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
              اختر منصة المشاركة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp (Mauritania's #1 channel) */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="text-base">💬</span>
                <span>واتساب (WhatsApp)</span>
              </button>

              {/* Native Mobile Share */}
              {hasNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{nativeShared ? 'تمت المشاركة' : 'تطبيقات الهاتف'}</span>
                </button>
              )}

              {/* Copy Full Text */}
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer shadow-xs border ${
                  copied
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white dark:bg-slate-800 hover:bg-[#F3EAD8] dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 border-[#E2D5BE] dark:border-slate-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              {/* X (Twitter) */}
              <button
                type="button"
                onClick={handleTwitter}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-black hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span className="font-mono font-black text-sm">𝕏</span>
                <span>منصة X</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 rotate-180" />
                <span>تيليغرام</span>
              </button>

              {/* Download .txt */}
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-[#F3EAD8] dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm shadow-xs border border-[#E2D5BE] dark:border-slate-700 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>تحميل ملف (.txt)</span>
              </button>
            </div>
          </div>

          {/* Text Preview Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span>معاينة النص المُشارك:</span>
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                  (مع وسم الهوية الموريتانية)
                </span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ' : 'نسخ سريع'}</span>
              </button>
            </div>

            <div className="relative rounded-2xl bg-white dark:bg-slate-950 border border-[#E2D5BE] dark:border-slate-800 p-3.5 shadow-inner">
              <pre className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto selection:bg-amber-300/40 selection:text-slate-900">
                {shareText}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#F3ECE0] dark:bg-slate-950/80 border-t border-[#E5DAC4] dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span>🇲🇷</span>
            <span>شارك المعرفة ولسان البيظان الموريتاني</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#EAE0CF] dark:hover:bg-slate-700 font-bold border border-[#E0D3BC] dark:border-slate-700 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
