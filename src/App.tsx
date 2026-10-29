import React, { useState, useEffect } from 'react';
import { LanguageInfo } from './types';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { AuthView } from './components/AuthView';
import { AuthModal } from './components/AuthModal';
import { SmartNotificationsModal } from './components/SmartNotificationsModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { CostNoticeModal } from './components/CostNoticeModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ThemeMode, getStoredTheme, applyTheme } from './services/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MessageSquare, ArrowRight } from 'lucide-react';

function MainAppContent() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageInfo>(SUPPORTED_LANGUAGES[0]); // Hassaniya first
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(2);
  const [injectedPrompt, setInjectedPrompt] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  // View state: 'chat' | 'auth'
  const [currentRoute, setCurrentRoute] = useState<'chat' | 'auth'>(() => {
    return window.location.pathname === '/auth' || window.location.search.includes('view=auth')
      ? 'auth'
      : 'chat';
  });

  const { isAuthModalOpen, closeAuthModal } = useAuth();

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isAuthPath = window.location.pathname === '/auth' || window.location.search.includes('view=auth');
      setCurrentRoute(isAuthPath ? 'auth' : 'chat');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: 'chat' | 'auth') => {
    setCurrentRoute(route);
    const newPath = route === 'auth' ? '/auth' : '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  // Initialize and apply theme
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync HTML dir and lang attributes
  useEffect(() => {
    document.documentElement.dir = currentLanguage.dir;
    document.documentElement.lang = currentLanguage.code === 'french' ? 'fr' : 'ar';
  }, [currentLanguage]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAF6EF] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-300 selection:text-slate-950 transition-colors duration-200">
      {/* Streamlined Minimalist Header */}
      <Header
        currentLanguage={currentLanguage}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onOpenCostModal={() => setIsCostModalOpen(true)}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Area: Chat Hub or /auth View */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {currentRoute === 'auth' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
            {/* Back to Chat Hub Button */}
            <div className="w-full max-w-md mb-3 flex items-center justify-between" dir="rtl">
              <button
                type="button"
                onClick={() => navigateTo('chat')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 bg-white dark:bg-slate-850 px-3 py-1.5 rounded-xl border border-[#E2D5BE] dark:border-slate-750 shadow-2xs transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة إلى نافذة الدردشة الرئيسية</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">/auth</span>
            </div>

            {/* Dedicated AuthView Component */}
            <AuthView
              onSuccess={() => navigateTo('chat')}
              onCancel={() => navigateTo('chat')}
            />
          </div>
        ) : (
          <ChatView
            currentLanguage={currentLanguage}
            onSelectLanguage={(code) => {
              const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
              if (found) setCurrentLanguage(found);
            }}
            injectedPrompt={injectedPrompt}
            onClearInjectedPrompt={() => setInjectedPrompt(null)}
          />
        )}
      </main>

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={(lang) => setCurrentLanguage(lang)}
      />

      {/* Cost & Zero Billing Notice Modal */}
      <CostNoticeModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
      />

      {/* Smart Notifications Modal (Exams, Scholarships, Tenders) */}
      <SmartNotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        onSelectPrompt={(prompt) => {
          setInjectedPrompt(prompt);
          navigateTo('chat');
        }}
        onNotificationsCountChange={(count) => setUnreadNotificationsCount(count)}
      />

      {/* Quick Auth Popup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      {/* Offline Connectivity Status Pill */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
