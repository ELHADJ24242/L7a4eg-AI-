import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface ThinkingBlockProps {
  thinkingText: string;
  isStreaming?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  thinkingText,
  isStreaming = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!thinkingText.trim()) return null;

  return (
    <div className="mb-3 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/30 overflow-hidden text-xs transition-all shadow-xs">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-sky-100/70 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-900 dark:text-sky-200 font-bold transition-colors cursor-pointer text-start select-none"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
            <Brain className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-wide">
            خطوات التفكير المنطقي والبحث العميق
          </span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-100 font-mono animate-pulse">
              <Sparkles className="w-2.5 h-2.5" />
              جارٍ التحليل...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? 'إخفاء التفاصيل' : 'عرض خطوات التحليل'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-sky-700 dark:text-sky-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-sky-700 dark:text-sky-300" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3.5 space-y-2 border-t border-sky-200/60 dark:border-sky-900/40 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-line animate-fadeIn">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800 dark:text-sky-300 pb-1 border-b border-slate-200/60 dark:border-slate-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>منهجية المعالجة المتدرجة (Deep Reasoning):</span>
          </div>
          <div className="text-[11px] font-mono leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
            {thinkingText}
          </div>
        </div>
      )}
    </div>
  );
};
