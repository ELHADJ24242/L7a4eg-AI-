import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Transition from offline to online
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
        wasOfflineRef.current = false;
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div
        className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3.5 py-2 text-xs font-bold shadow-xl shadow-amber-950/30 border border-amber-400/40 animate-fadeIn"
        dir="rtl"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>وضع عدم الاتصال — يمكنك تصفح المحادثات والقاموس المحفوظ محلياً</span>
      </div>
    );
  }

  if (showRestoredNotice) {
    return (
      <div
        className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-xl shadow-emerald-950/30 border border-emerald-400/40 animate-fadeIn"
        dir="rtl"
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-3.5 h-3.5 shrink-0 text-emerald-200" />
        <span>تم استعادة الاتصال بالإنترنت ✨</span>
      </div>
    );
  }

  return null;
};
