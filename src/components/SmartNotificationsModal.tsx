import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  GraduationCap,
  Briefcase,
  Award,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Search,
} from 'lucide-react';
import { SmartNotification } from '../db/database';
import { useAuth } from '../contexts/AuthContext';

interface SmartNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
  onNotificationsCountChange?: (unreadCount: number) => void;
}

export const SmartNotificationsModal: React.FC<SmartNotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  onNotificationsCountChange,
}) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'exams' | 'scholarships' | 'tenders'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/notifications', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          if (onNotificationsCountChange) {
            onNotificationsCountChange(data.unreadCount || 0);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionClick = async (notif: SmartNotification) => {
    // Mark as read in backend
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`/api/notifications/${notif.id}/read`, { method: 'POST', headers });
    } catch {}

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );

    onClose();
    onSelectPrompt(notif.actionPrompt);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exams':
        return <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'scholarships':
        return <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'tenders':
        return <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
  };

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#E2D5BE] dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#F9F5EC] to-white dark:from-slate-850 dark:to-slate-900 border-b border-[#EADFCB] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>التنبيهات الموريتانية الذكية</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  محدثة لحظياً
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة مواعيد الامتحانات الوطنية، المنح الجامعية، ومناقصات الصفقات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'كافة التنبيهات' },
            { id: 'exams', label: 'الباكالوريا والامتحانات' },
            { id: 'scholarships', label: 'المنح والدراسات' },
            { id: 'tenders', label: 'المناقصات والصفقات' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد تنبيهات جديدة في هذا التصنيف حالياً</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group relative p-4 rounded-2xl bg-[#FAF7F2] dark:bg-slate-850/80 hover:bg-[#F3EDE2] dark:hover:bg-slate-800 border border-[#E8DEC9] dark:border-slate-750 transition-all shadow-xs hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2.5 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-750 flex items-center justify-center shadow-xs">
                      {getCategoryIcon(item.category)}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-650">
                      {item.badgeLabel}
                    </span>
                    {item.isUrgent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        عاجل
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString('ar-MR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 leading-snug">
                  {item.titleAr}
                </h4>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {item.bodyAr}
                </p>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleActionClick(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>اسأل لحاذگ عن هذا الإشعار</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-center text-slate-500 dark:text-slate-400">
          يتم فحص وتحديث الإعلانات الرسمية باستمرار بالتعاون مع المنظومة الوطنية
        </div>
      </div>
    </div>
  );
};
