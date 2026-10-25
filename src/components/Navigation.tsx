import React from 'react';
import {
  MessageSquare,
  Sparkles,
  Languages,
  BookOpen,
  PenTool,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

interface NavItem {
  id: AppTab;
  labelAr: string;
  labelShort: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'chat',
    labelAr: 'المحادثة الذكية',
    labelShort: 'المحادثة',
    icon: MessageSquare,
  },
  {
    id: 'hassani',
    labelAr: 'لحاذگ الحساني',
    labelShort: 'لحاذگ',
    icon: Sparkles,
    badge: 'خاص',
  },
  {
    id: 'translate',
    labelAr: 'ترجمة عربية-فرنسية',
    labelShort: 'الترجمة',
    icon: Languages,
  },
  {
    id: 'dictionary',
    labelAr: 'القاموس المجتمعي',
    labelShort: 'القاموس',
    icon: BookOpen,
  },
  {
    id: 'content',
    labelAr: 'صانع المحتوى',
    labelShort: 'المحتوى',
    icon: PenTool,
  },
  {
    id: 'image_studio',
    labelAr: 'توليد الصور',
    labelShort: 'توليد الصور',
    icon: ImageIcon,
    badge: 'مجاني',
  },
  {
    id: 'video_studio',
    labelAr: 'توليد الفيديو',
    labelShort: 'توليد الفيديو',
    icon: Video,
    badge: 'تفاعلي',
  },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <div className="hidden md:block bg-[#F4EDE0] dark:bg-slate-900 border-b border-[#E2D5BE] dark:border-slate-800 px-4 py-2 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1.5 min-w-max">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  type="button"
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 dark:bg-sky-600 text-white shadow-md shadow-sky-900/20 font-black'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[#EAE0CF] dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.labelAr}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-2xs ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : item.badge === 'خاص'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE]/98 dark:bg-slate-900/98 backdrop-blur-lg border-t border-[#E2D5BE] dark:border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-pb transition-colors duration-200">
        <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                type="button"
                className={`relative flex flex-col items-center justify-center py-1.5 px-1.5 rounded-xl transition-all min-w-[48px] min-h-[44px] cursor-pointer ${
                  isActive
                    ? 'text-sky-700 dark:text-sky-400 font-extrabold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                  {item.labelShort}
                </span>

                {item.badge && !isActive && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
