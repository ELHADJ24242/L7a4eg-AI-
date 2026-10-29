import React from 'react';
import {
  X,
  Puzzle,
  Coins,
  Scale,
  GraduationCap,
  Compass,
  TrendingUp,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PluginItem } from '../types';

interface PluginsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: PluginItem[];
  onTogglePlugin: (pluginId: string) => void;
  onSelectSamplePrompt: (prompt: string) => void;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({
  isOpen,
  onClose,
  plugins,
  onTogglePlugin,
  onSelectSamplePrompt,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins':
        return <Coins className="w-5 h-5 text-amber-500" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-sky-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-teal-500" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      default:
        return <Puzzle className="w-5 h-5 text-sky-500" />;
    }
  };

  const activeCount = plugins.filter((p) => p.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF6EF] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-850/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>مركز الإضافات والبلجنز</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono">
                  {activeCount} نشط
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أدوات ذكية متخصصة لرواد الأعمال، الطلاب، والباحثين في موريتانيا
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className={`p-4 rounded-2xl border transition-all ${
                plugin.enabled
                  ? 'bg-white dark:bg-slate-850 border-sky-300 dark:border-sky-800/80 shadow-xs'
                  : 'bg-white/40 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {getIcon(plugin.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {plugin.titleAr}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {plugin.titleFr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {plugin.descriptionAr}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle Button */}
                <button
                  type="button"
                  onClick={() => onTogglePlugin(plugin.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    plugin.enabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={plugin.enabled}
                  aria-label={`تفعيل أو تعطيل إضافة ${plugin.titleAr}`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform absolute top-0.5 ${
                      plugin.enabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sample Action Prompt */}
              {plugin.enabled && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate max-w-[320px]">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    مثال: {plugin.samplePrompt}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSamplePrompt(plugin.samplePrompt);
                      onClose();
                    }}
                    className="text-xs text-sky-700 dark:text-sky-300 hover:text-sky-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>جرّب الآن</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-850/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            يتم تطبيق الإضافات النشطة تلقائياً على كل المحادثات.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            تم وحفظ
          </button>
        </div>
      </div>
    </div>
  );
};
