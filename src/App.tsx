import React, { useState, useEffect } from 'react';
import { AppTab, LanguageInfo } from './types';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ChatView } from './components/ChatView';
import { HassaniView } from './components/HassaniView';
import { TranslateView } from './components/TranslateView';
import { DictionaryView } from './components/DictionaryView';
import { ContentCreatorView } from './components/ContentCreatorView';
import { ImageStudioView } from './components/ImageStudioView';
import { VideoStudioView } from './components/VideoStudioView';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { CostNoticeModal } from './components/CostNoticeModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ThemeMode, getStoredTheme, applyTheme } from './services/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageInfo>(SUPPORTED_LANGUAGES[0]); // Hassaniya first
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

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
    <div className="min-h-screen bg-[#FAF6EF] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-300 selection:text-slate-950 transition-colors duration-200">
      {/* Header with Mauritanian palette & Theme toggle */}
      <Header
        currentLanguage={currentLanguage}
        onOpenLanguageModal={() => setIsLanguageModalOpen(true)}
        onOpenCostModal={() => setIsCostModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Navigation Bars */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        {activeTab === 'chat' && (
          <ChatView
            currentLanguage={currentLanguage}
            onSelectLanguage={(code) => {
              const found = SUPPORTED_LANGUAGES.find((l) => l.code === code);
              if (found) setCurrentLanguage(found);
            }}
          />
        )}

        {activeTab === 'hassani' && <HassaniView />}

        {activeTab === 'translate' && <TranslateView />}

        {activeTab === 'dictionary' && <DictionaryView />}

        {activeTab === 'content' && <ContentCreatorView />}

        {activeTab === 'image_studio' && <ImageStudioView />}

        {activeTab === 'video_studio' && <VideoStudioView />}
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

      {/* Offline Connectivity Status Pill */}
      <OfflineIndicator />
    </div>
  );
}
