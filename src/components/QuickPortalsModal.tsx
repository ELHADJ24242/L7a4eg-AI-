import React, { useState } from 'react';
import {
  X,
  Search,
  Sparkles,
  Rocket,
  Briefcase,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Calendar,
  Tag,
} from 'lucide-react';
import { QuickPortalId } from '../types';
import {
  PORTAL_CATEGORIES,
  PORTAL_ITEMS,
  SMART_SEARCH_ALTERNATIVES,
} from '../data/portalsData';

interface QuickPortalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPortalId?: QuickPortalId;
  onSelectPrompt: (prompt: string) => void;
}

export const QuickPortalsModal: React.FC<QuickPortalsModalProps> = ({
  isOpen,
  onClose,
  initialPortalId = 'celebrity',
  onSelectPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<QuickPortalId>(initialPortalId);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentCategory = PORTAL_CATEGORIES.find((c) => c.id === activeTab) || PORTAL_CATEGORIES[0];

  const filteredItems = PORTAL_ITEMS.filter((item) => {
    const matchesCategory = item.portalId === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryTag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const alternatives = SMART_SEARCH_ALTERNATIVES[activeTab] || SMART_SEARCH_ALTERNATIVES.general;

  const getPortalIcon = (id: QuickPortalId) => {
    switch (id) {
      case 'celebrity':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'startups':
        return <Rocket className="w-4 h-4 text-emerald-500" />;
      case 'tenders':
        return <Briefcase className="w-4 h-4 text-sky-500" />;
      case 'curriculum':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF6EE] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-850/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                بوابات الشباب والفرص في موريتانيا
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                منصة معرفية وإخبارية سريعة لخدمة الشباب الموريتاني
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

        {/* Portal Categories Tabs */}
        <div className="p-3 bg-white/40 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {PORTAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === cat.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {getPortalIcon(cat.id)}
              <span>{cat.titleAr}</span>
            </button>
          ))}
        </div>

        {/* Search & Alternative Indicator */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ابحث في ${currentCategory.titleAr}...`}
              className="w-full pr-10 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Smart Alternative Index ("هل تبحث عن...؟") */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>هل تبحث عن:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectPrompt(alt.prompt);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/40 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                >
                  {alt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Portal Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">لم يتم العثور على نتائج مطابقة في هذا القسم.</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
              >
                مسح البحث
              </button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700/60 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {item.categoryTag}
                    </span>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {item.summary}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {item.portalId === 'tenders' ? 'صفقة رسمية ARMP' : item.portalId === 'curriculum' ? 'المعهد التربوي الوطني' : 'فرص الشباب'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPrompt(item.promptToAsk);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                  >
                    <span>استفسر في المحادثة</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-850/50 flex items-center justify-between text-xs text-slate-500">
          <span>يتم تحديث البوابات بالتنسيق مع الجهات الأكاديمية والمهنية الموريتانية.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
