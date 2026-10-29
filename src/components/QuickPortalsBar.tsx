import React from 'react';
import {
  Sparkles,
  Rocket,
  Briefcase,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import { QuickPortalId } from '../types';
import { PORTAL_CATEGORIES } from '../data/portalsData';

interface QuickPortalsBarProps {
  onOpenPortal: (portalId: QuickPortalId) => void;
}

export const QuickPortalsBar: React.FC<QuickPortalsBarProps> = ({
  onOpenPortal,
}) => {
  const getIcon = (id: QuickPortalId) => {
    switch (id) {
      case 'celebrity':
        return <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'startups':
        return <Rocket className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'tenders':
        return <Briefcase className="w-4 h-4 text-sky-500 shrink-0" />;
      case 'curriculum':
        return <BookOpen className="w-4 h-4 text-purple-500 shrink-0" />;
    }
  };

  return (
    <div className="w-full border-b border-[#E2D5BE]/70 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs py-2 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:inline">
            بوابات سريعة:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap">
          {PORTAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onOpenPortal(cat.id)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 hover:bg-[#FAF4E6] dark:hover:bg-slate-800 border border-[#E2D5BE] dark:border-slate-750 text-slate-750 dark:text-slate-200 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              title={cat.subtitleAr}
            >
              {getIcon(cat.id)}
              <span className="group-hover:text-sky-700 dark:group-hover:text-amber-400 transition-colors">
                {cat.titleAr}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-sky-500 dark:group-hover:bg-amber-400 transition-colors"></span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onOpenPortal('celebrity')}
          className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 font-medium flex items-center gap-0.5 shrink-0 hover:underline cursor-pointer"
        >
          <span>استكشاف الكل</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
