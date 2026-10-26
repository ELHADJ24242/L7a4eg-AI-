import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Clock,
  Compass,
  AlertTriangle,
  Download,
  Upload,
} from 'lucide-react';
import { ChatSession } from '../types';
import {
  formatSessionTime,
  exportSessionsData,
  importSessionsData,
} from '../services/chatHistoryStorage';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  onImportSessions?: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onImportSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const data = exportSessionsData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `l7a4eg-chat-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setImportStatus('تم تصدير نسخة احتياطية بنجاح 📥');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importSessionsData(content);
        if (result.success) {
          setImportStatus(`تم استيراد ${result.count} محادثة بنجاح ✨`);
          if (onImportSessions) onImportSessions();
        } else {
          setImportStatus('فشل قراءة الملف، يرجى اختيار ملف JSON صالح');
        }
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(q);
    const messageMatch = s.messages.some((m) => m.content.toLowerCase().includes(q));
    return titleMatch || messageMatch;
  });

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(sessionId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(sessionId);
  };

  const handleConfirmDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(sessionId);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile / overlay screens */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        className="fixed top-0 bottom-0 right-0 z-50 w-80 sm:w-88 max-w-[85vw] bg-[#FAF7F0] dark:bg-slate-900 border-l border-[#E5DAC4] dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ease-out text-slate-800 dark:text-slate-100"
        role="dialog"
        aria-label="سجل المحادثات"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5DAC4] dark:border-slate-800 flex items-center justify-between bg-[#F4EDE0] dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/30 text-sky-700 dark:text-sky-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>سجل المحادثات</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 border border-[#E2D5BE] dark:border-slate-700">
                  {sessions.length}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">جلسات محفوظة محلياً في متصفحك</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-[#EAE0CF] dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق السجل"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Chat Button */}
        <div className="p-3 border-b border-[#E5DAC4] dark:border-slate-800/80 bg-[#FAF7F0] dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 640) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-emerald-700 hover:from-sky-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-900/20 transition-all active:scale-[0.99] group cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
            <span>+ محادثة جديدة</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الجلسات والمحادثات..."
              className="w-full bg-white dark:bg-slate-950 border border-[#E2D5BE] dark:border-slate-800 rounded-xl pr-9 pl-8 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare className="w-10 h-10 stroke-[1.5] text-slate-400 dark:text-slate-600 mb-3" />
              {searchQuery ? (
                <>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">لا توجد محادثات مطابقة للبحث</p>
                  <p className="text-[11px] text-slate-500 mt-1">جرب كلمات بحث أخرى</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">لا توجد محادثات محفوظة بعد</p>
                  <p className="text-[11px] text-slate-500 mt-1">ابدأ محادثتك الأولى مع لحاذگ الآن</p>
                </>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = editingId === session.id;
              const isConfirmingDelete = confirmDeleteId === session.id;

              const lastMsg = session.messages[session.messages.length - 1];
              const snippet = lastMsg ? lastMsg.content.substring(0, 60) : '';

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing && !isConfirmingDelete) {
                      onSelectSession(session.id);
                      if (window.innerWidth < 640) onClose();
                    }
                  }}
                  className={`group relative rounded-2xl p-3 border transition-all cursor-pointer text-right ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500/70 shadow-sm ring-1 ring-sky-400/30'
                      : 'bg-white dark:bg-slate-950/60 border-[#E5DAC4] dark:border-slate-800/80 hover:bg-[#F3EAD8] dark:hover:bg-slate-850 hover:border-sky-300'
                  }`}
                >
                  {/* Inline Delete Confirmation */}
                  {isConfirmingDelete ? (
                    <div className="p-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>حذف هذه المحادثة نهائياً؟</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleConfirmDelete(session.id, e)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          نعم، حذف
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelDelete}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : isEditing ? (
                    /* Inline Rename Form */
                    <div
                      className="flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        autoFocus
                        className="flex-1 bg-white dark:bg-slate-900 border border-sky-500 rounded-xl px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(session.id, e)}
                        className="p-1.5 rounded-xl bg-sky-600 text-white hover:bg-sky-500"
                        title="حفظ"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRename}
                        className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                        title="إلغاء"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Standard Card View */
                    <>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {session.personaMode === 'hassaniya_expert' ? (
                            <span className="text-xs" title="مستشار الحسانية">
                              🇲🇷
                            </span>
                          ) : (
                            <Compass className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <h3
                            className={`text-xs font-bold truncate ${
                              isActive ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                            }`}
                            title={session.title}
                          >
                            {session.title}
                          </h3>
                        </div>

                        {/* Actions (visible on hover or active) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleStartRename(session, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-[#EAE0CF] dark:hover:bg-slate-800 cursor-pointer"
                            title="تعديل العنوان"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(session.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#EAE0CF] dark:hover:bg-slate-800 cursor-pointer"
                            title="حذف المحادثة"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Snippet preview */}
                      {snippet && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2 font-normal">
                          {snippet}
                        </p>
                      )}

                      {/* Metadata Footer */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-[#EDE4D4] dark:border-slate-850">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatSessionTime(session.updatedAt)}</span>
                        </span>
                        <span className="bg-[#FAF7F0] dark:bg-slate-900 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 border border-[#E5DAC4] dark:border-slate-800">
                          {session.messages.length} رسالة
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Import/Export Status Toast */}
        {importStatus && (
          <div className="mx-3 my-1.5 p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200 text-xs font-bold text-center animate-fadeIn shrink-0">
            {importStatus}
          </div>
        )}

        {/* Footer: Backup actions & Clear All */}
        <div className="p-3 border-t border-[#E5DAC4] dark:border-slate-800 bg-[#F4EDE0] dark:bg-slate-950/70 shrink-0 space-y-2">
          {showClearAllConfirm ? (
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-center space-y-2">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                هل أنت متأكد من مسح جميع المحادثات السابقة؟
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllSessions();
                    setShowClearAllConfirm(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  نعم، مسح الكل
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Backup & Restore Bar */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E0D4BE] dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:text-sky-600 text-[11px] font-semibold transition-colors cursor-pointer"
                    title="استيراد محادثات سابقة من ملف JSON"
                  >
                    <Upload className="w-3 h-3 text-sky-600" />
                    <span>استيراد</span>
                  </button>

                  {sessions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExport}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-[#E0D4BE] dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="تصدير وحفظ نسخة احتياطية من المحادثات (JSON)"
                    >
                      <Download className="w-3 h-3 text-emerald-600" />
                      <span>تصدير</span>
                    </button>
                  )}
                </div>

                {sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearAllConfirm(true)}
                    className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                    title="مسح كل المحادثات السابقة"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>مسح الكل</span>
                  </button>
                )}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                حفظ محلي آمن في متصفحك 🇲🇷
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
