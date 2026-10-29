import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  Trash2,
  Mic,
  MicOff,
  AlertCircle,
  RotateCcw,
  History,
  Plus,
  Share2,
  Square,
  Wand2,
  ArrowRight,
  HelpCircle,
  Radio,
  Paperclip,
  Brain,
  Zap,
  Puzzle,
  Image,
  Video,
  FileText,
  BookOpen,
  FileSearch,
  Loader2,
  Upload,
} from 'lucide-react';
import {
  ChatMessage,
  ChatSession,
  LanguageInfo,
  LanguageCode,
  ThinkingMode,
  AttachedMedia,
  MediaAnalysisTask,
  PluginItem,
  QuickPortalId,
} from '../types';
import { streamChatMessage, analyzeMediaFile } from '../services/api';
import {
  detectInputLanguage,
  getSmartExplorations,
  SmartSuggestionItem,
  DetectedLanguageType,
} from '../utils/languageDetector';
import {
  correctSpeechTranscript,
  SpeechCorrectionResult,
} from '../utils/speechCorrection';
import {
  loadSessions,
  saveSessions,
  getActiveSessionId,
  setActiveSessionId,
  createNewSession,
  updateSessionMessages,
  deleteSession,
  renameSession,
  clearAllSessions,
  createWelcomeMessage,
} from '../services/chatHistoryStorage';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ShareModal } from './ShareModal';
import {
  formatMessageForSharing,
  formatSessionForSharing,
} from '../utils/shareUtils';
import { QuickPortalsBar } from './QuickPortalsBar';
import { QuickPortalsModal } from './QuickPortalsModal';
import { PluginsModal } from './PluginsModal';
import { ThinkingBlock } from './ThinkingBlock';
import { MediaUploadBar } from './MediaUploadBar';
import { AVAILABLE_PLUGINS } from '../data/pluginsData';

interface ChatViewProps {
  currentLanguage: LanguageInfo;
  onSelectLanguage?: (langCode: string) => void;
  injectedPrompt?: string | null;
  onClearInjectedPrompt?: () => void;
}

// Helper to parse <thinking>...</thinking> tags from assistant messages
function parseMessageContent(raw: string): { thinkingText?: string; mainContent: string } {
  if (!raw) return { mainContent: '' };
  const match = raw.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  if (match) {
    const thinkingText = match[1].trim();
    const mainContent = raw.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
    return { thinkingText, mainContent };
  }
  // While streaming inside an open <thinking> tag
  if (raw.includes('<thinking>') && !raw.includes('</thinking>')) {
    const thinkingText = raw.replace('<thinking>', '').trim();
    return { thinkingText, mainContent: '' };
  }
  return { mainContent: raw };
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentLanguage,
  onSelectLanguage,
  injectedPrompt,
  onClearInjectedPrompt,
}) => {
  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(getActiveSessionId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const loaded = loadSessions();
    const active = getActiveSessionId();
    const current = (active && loaded.find((s) => s.id === active)) || (loaded.length > 0 ? loaded[0] : null);
    if (current && current.messages.length > 0) {
      return current.messages;
    }
    return [createWelcomeMessage('hassaniya_expert', currentLanguage.code)];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dual Thinking Mode state: 'fast' (⚡ الرد السريع) vs 'deep' (🧠 التفكير والبحث العميق)
  const [thinkingMode, setThinkingMode] = useState<ThinkingMode>('fast');

  // Multimodal File Attachments (Images, Videos, Books/Documents)
  const [attachments, setAttachments] = useState<AttachedMedia[]>([]);

  // Plugins & Extensions Hub state
  const [plugins, setPlugins] = useState<PluginItem[]>(() => {
    try {
      const stored = localStorage.getItem('l7a4eg_plugins_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return AVAILABLE_PLUGINS;
  });
  const [isPluginsModalOpen, setIsPluginsModalOpen] = useState(false);

  // Quick Navigation Portals state
  const [isPortalsModalOpen, setIsPortalsModalOpen] = useState(false);
  const [activePortalId, setActivePortalId] = useState<QuickPortalId>('celebrity');

  // Dynamic conversation language tracking
  const [activeLang, setActiveLang] = useState<DetectedLanguageType>('hassaniya');
  const [languageFeedbackToast, setLanguageFeedbackToast] = useState<{
    show: boolean;
    langName: string;
    flag: string;
  } | null>(null);

  // Web Speech & Audio Transcription states
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSeconds, setSpeechSeconds] = useState(0);
  const [lastCorrection, setLastCorrection] = useState<SpeechCorrectionResult | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Streaming Abort Controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Share functionality modal state
  const [shareModalState, setShareModalState] = useState<{
    isOpen: boolean;
    title: string;
    shareText: string;
    subtitle?: string;
    categoryTag?: string;
  }>({
    isOpen: false,
    title: '',
    shareText: '',
  });

  // Media analysis & attachment menu states
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [analyzingMediaId, setAnalyzingMediaId] = useState<string | null>(null);
  const [mediaAnalysisBanner, setMediaAnalysisBanner] = useState<{
    task: MediaAnalysisTask;
    fileName: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const speechTimerRef = useRef<any>(null);
  const toastTimerRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputHiddenRef = useRef<HTMLInputElement>(null);
  const ocrFileInputRef = useRef<HTMLInputElement>(null);
  const bookFileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close attach menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachMenuOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save plugins state on changes
  useEffect(() => {
    try {
      localStorage.setItem('l7a4eg_plugins_v1', JSON.stringify(plugins));
    } catch {}
  }, [plugins]);

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  // Initialize or restore active session on mount
  useEffect(() => {
    const existing = loadSessions();
    if (existing.length === 0) {
      const newSession = createNewSession('hassaniya_expert', currentLanguage.code);
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      setActiveSessionId(newSession.id);
      setMessages(newSession.messages);
    } else {
      const activeId = getActiveSessionId();
      const current = (activeId && existing.find((s) => s.id === activeId)) || existing[0];
      if (current) {
        setCurrentSessionId(current.id);
        setActiveSessionId(current.id);
        setMessages(current.messages);
      }
    }
  }, []);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentSessionId(sessionId);
      setActiveSessionId(sessionId);
      setMessages(target.messages);
      setIsSidebarOpen(false);
    }
  };

  const handleStartNewSession = () => {
    const newSession = createNewSession('hassaniya_expert', currentLanguage.code);
    const updated = [newSession, ...sessions];
    setSessions(updated);
    saveSessions(updated);
    setCurrentSessionId(newSession.id);
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
    setIsSidebarOpen(false);
    setInput('');
    setAttachments([]);
    setLastCorrection(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    const { remaining, nextActiveId } = deleteSession(sessionId);
    setSessions(remaining);
    if (currentSessionId === sessionId) {
      if (nextActiveId) {
        const next = remaining.find((s) => s.id === nextActiveId) || remaining[0];
        if (next) {
          setCurrentSessionId(next.id);
          setActiveSessionId(next.id);
          setMessages(next.messages);
        } else {
          handleStartNewSession();
        }
      } else {
        handleStartNewSession();
      }
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const updated = renameSession(sessionId, newTitle);
    setSessions(updated);
  };

  const handleClearAllSessions = () => {
    clearAllSessions();
    const fresh = createNewSession('hassaniya_expert', currentLanguage.code);
    setSessions([fresh]);
    setCurrentSessionId(fresh.id);
    setActiveSessionId(fresh.id);
    setMessages(fresh.messages);
    setIsSidebarOpen(false);
  };

  // Dynamic language notification toast
  const triggerLanguageSwitchToast = (lang: DetectedLanguageType) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    let langName = 'اللهجة الحسانية الموريتانية';
    let flag = '🇲🇷';
    if (lang === 'french') {
      langName = 'Langue Française';
      flag = '🇫🇷';
    } else if (lang === 'arabic') {
      langName = 'العربية الفصحى';
      flag = '🇸🇦';
    }

    setLanguageFeedbackToast({ show: true, langName, flag });
    toastTimerRef.current = setTimeout(() => {
      setLanguageFeedbackToast(null);
    }, 2800);
  };

  // Main Send Message Handler
  const handleSend = async (manualQuery?: string) => {
    const query = (manualQuery || input).trim();
    if (!query && attachments.length === 0) return;
    if (isLoading) return;

    // Detect input language dynamically
    const detection = detectInputLanguage(query);
    if (detection.detectedLang !== activeLang && query.length > 2) {
      setActiveLang(detection.detectedLang);
      triggerLanguageSwitchToast(detection.detectedLang);
    }

    if (onSelectLanguage && detection.detectedLang) {
      onSelectLanguage(detection.detectedLang);
    }

    const currentAttachments = [...attachments];

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: detection.detectedLang,
      thinkingMode,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    let activeId = currentSessionId;
    if (!activeId) {
      const newSess = createNewSession('hassaniya_expert', detection.detectedLang);
      activeId = newSess.id;
      setCurrentSessionId(activeId);
      setActiveSessionId(activeId);
    }

    // Persist immediately to localStorage
    const sessionsWithUser = updateSessionMessages(activeId, nextMessages, detection.detectedLang);
    setSessions(sessionsWithUser);

    // Placeholder assistant message for streaming
    const assistantMsgId = 'res-' + Date.now();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: 'high',
      language: detection.detectedLang,
      thinkingMode,
    };
    setMessages([...nextMessages, assistantMessage]);

    // Setup AbortController for streaming cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const activePluginIds = plugins.filter((p) => p.enabled).map((p) => p.id);

      await streamChatMessage(
        query,
        history,
        (accumulatedText) => {
          // Live chunk callback
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedText } : m))
          );
        },
        (finalText) => {
          // Done callback
          const finalizedMessages = nextMessages.concat({
            ...assistantMessage,
            content: finalText,
          });
          setMessages(finalizedMessages);
          const updated = updateSessionMessages(activeId!, finalizedMessages, detection.detectedLang);
          setSessions(updated);
          setIsLoading(false);
          abortControllerRef.current = null;
        },
        (error) => {
          console.warn('Streaming notice (fallback engaged):', error?.message || error);
          const fallbackText =
            'عذراً، حدث انقطاع في الاتصال السريع. يمكنك المحاولة مجدداً أو إعادة صياغة السؤال.';
          const finalizedMessages = nextMessages.concat({
            ...assistantMessage,
            content: fallbackText,
            confidence: 'limited_support',
          });
          setMessages(finalizedMessages);
          const updated = updateSessionMessages(activeId!, finalizedMessages, detection.detectedLang);
          setSessions(updated);
          setIsLoading(false);
          abortControllerRef.current = null;
        },
        controller.signal,
        {
          thinkingMode,
          attachments: currentAttachments.map((a) => ({
            name: a.name,
            type: a.type,
            mimeType: a.mimeType,
            base64Data: a.base64Data,
          })),
          activePlugins: activePluginIds,
        }
      );
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setIsLoading(false);
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Handle externally injected prompts (e.g. from Smart Notifications or Portals)
  useEffect(() => {
    if (injectedPrompt && injectedPrompt.trim()) {
      handleSend(injectedPrompt.trim());
      if (onClearInjectedPrompt) {
        onClearInjectedPrompt();
      }
    }
  }, [injectedPrompt]);

  // Web Speech API Voice-to-Text with Hassaniya & French Phonetic Error Correction
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        'ميزة الإملاء الصوتي غير مدعومة في متصفحك الحالي. يرجى استخدام متصفح Chrome أو Safari.'
      );
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    setSpeechError(null);
    setInterimTranscript('');
    setSpeechSeconds(0);
    setLastCorrection(null);

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = activeLang === 'french' ? 'fr-FR' : 'ar-MR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        speechTimerRef.current = setInterval(() => {
          setSpeechSeconds((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalSegment += transcriptChunk;
          } else {
            currentInterim += transcriptChunk;
          }
        }

        if (finalSegment) {
          const correction = correctSpeechTranscript(finalSegment);
          setLastCorrection(correction);
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${correction.correctedText}` : correction.correctedText;
          });
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('تم حظر إذن الميكروفون. يرجى السماح به في إعدادات المتصفح.');
        } else if (event.error === 'language-not-supported' && recognition.lang === 'ar-MR') {
          recognition.lang = 'ar-SA';
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (speechTimerRef.current) clearInterval(speechTimerRef.current);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechError('تعذر بدء التسجيل الصوتي.');
    }
  };

  const stopVoiceInput = (autoSend: boolean = false) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (speechTimerRef.current) clearInterval(speechTimerRef.current);

    let finalTextToFlush = '';
    if (interimTranscript && interimTranscript.trim()) {
      const correction = correctSpeechTranscript(interimTranscript);
      setLastCorrection(correction);
      finalTextToFlush = correction.correctedText;
      setInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${finalTextToFlush}` : finalTextToFlush;
      });
    }

    setIsListening(false);
    setInterimTranscript('');
    setSpeechSeconds(0);

    if (autoSend) {
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, lang?: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang === 'french') {
        utterance.lang = 'fr-FR';
      } else {
        utterance.lang = 'ar-XA';
      }
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenShareMessage = (msg: ChatMessage) => {
    const shareText = formatMessageForSharing(msg.content);
    setShareModalState({
      isOpen: true,
      title: 'مشاركة إجابة من لحاذگ AI',
      shareText,
      subtitle: `رد بلسان ${msg.language || 'الحسانية'} • ${msg.timestamp}`,
      categoryTag: 'محادثة ذكية',
    });
  };

  const handleOpenShareSession = () => {
    if (!currentSession) return;
    const shareText = formatSessionForSharing(currentSession);
    setShareModalState({
      isOpen: true,
      title: 'مشاركة جلسة المحادثة',
      shareText,
      subtitle: `${currentSession.title} (${currentSession.messages.length} رسالة)`,
      categoryTag: 'جلسة لحاذگ',
    });
  };

  // Multimodal File Handlers
  const handleAddAttachment = (item: AttachedMedia) => {
    setAttachments((prev) => [...prev, item]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const readFileAsAttachedMedia = (file: File): Promise<AttachedMedia> => {
    return new Promise((resolve) => {
      let type: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (
        file.type === 'application/pdf' ||
        file.type.includes('document') ||
        file.type.includes('text') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.docx')
      ) {
        type = 'document';
      }

      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.includes(',')
          ? resultStr.split(',')[1]
          : resultStr;

        const media: AttachedMedia = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type,
          mimeType: file.type || (type === 'document' ? 'application/pdf' : 'application/octet-stream'),
          size: file.size,
          previewUrl: type === 'image' ? resultStr : '',
          base64Data,
        };
        resolve(media);
      };
      reader.readAsDataURL(file);
    });
  };

  // Trigger Dedicated Media Analysis (OCR Text Extraction or Book / Document Summarization)
  const handleTriggerMediaAnalysis = async (
    media: AttachedMedia,
    task: MediaAnalysisTask,
    customPrompt?: string
  ) => {
    if (analyzingMediaId) return;
    setAnalyzingMediaId(media.id);
    setMediaAnalysisBanner({ task, fileName: media.name });

    let activeId = currentSessionId;
    if (!activeId) {
      const newSess = createNewSession('hassaniya_expert', activeLang);
      activeId = newSess.id;
      setCurrentSessionId(activeId);
      setActiveSessionId(activeId);
    }

    const taskTitle =
      task === 'extract_text'
        ? `📄 طلب استخراج النصوص الضوئية (OCR) من: ${media.name}`
        : task === 'summarize_book'
        ? `📚 طلب تلخيص وتحليل محتوى الكتاب / المستند: ${media.name}`
        : `🔍 طلب تحليل شامل ومناقشة حول الملف: ${media.name}`;

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: taskTitle,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [media],
      thinkingMode,
    };

    const assistantMsgId = 'res-' + Date.now();
    const assistantLoadingMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content:
        task === 'extract_text'
          ? '⏳ جاري استخراج النصوص وقراءة محتوى الصورة بدقة عبر محرك لحاذگ OCR...'
          : '⏳ جاري دراسة فصول الكتاب والمناهج وإعداد التلخيص الأكاديمي الشامل...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: 'high',
      thinkingMode,
    };

    const nextMessages = [...messages, userMessage, assistantLoadingMessage];
    setMessages(nextMessages);

    try {
      const response = await analyzeMediaFile({
        file: {
          name: media.name,
          type: media.type,
          mimeType: media.mimeType,
          base64Data: media.base64Data,
        },
        task,
        customPrompt,
        language: activeLang,
      });

      const finalizedAssistantMessage: ChatMessage = {
        ...assistantLoadingMessage,
        content: response.result || 'تم فحص الملف واستخراج نتائجه بنجاح.',
        confidence: 'high',
      };

      const finalMessages: ChatMessage[] = [...messages, userMessage, finalizedAssistantMessage];
      setMessages(finalMessages);
      const updatedSessions = updateSessionMessages(activeId, finalMessages, activeLang);
      setSessions(updatedSessions);

      // Clean analyzed attachment from input tray
      setAttachments((prev) => prev.filter((a) => a.id !== media.id));
    } catch (err: any) {
      console.error('Media analysis error:', err);
      const errorMessage = `عذراً، تعذر إتمام تحليل الملف: ${err.message || 'حدث خطأ غير متوقع'}`;
      const finalErrorAssistant: ChatMessage = {
        ...assistantLoadingMessage,
        content: errorMessage,
        confidence: 'limited_support',
      };
      const finalErrorMessages: ChatMessage[] = [
        ...messages,
        userMessage,
        finalErrorAssistant,
      ];
      setMessages(finalErrorMessages);
      const updatedSessions = updateSessionMessages(activeId, finalErrorMessages, activeLang);
      setSessions(updatedSessions);
    } finally {
      setAnalyzingMediaId(null);
      setMediaAnalysisBanner(null);
    }
  };

  const handleOcrFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const media = await readFileAsAttachedMedia(file);
    handleAddAttachment(media);
    await handleTriggerMediaAnalysis(media, 'extract_text');
    e.target.value = '';
  };

  const handleBookFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const media = await readFileAsAttachedMedia(file);
    handleAddAttachment(media);
    await handleTriggerMediaAnalysis(media, 'summarize_book');
    e.target.value = '';
  };

  const activePluginsCount = plugins.filter((p) => p.enabled).length;

  const smartSuggestions: SmartSuggestionItem[] = getSmartExplorations(activeLang);
  const isInitialWelcome = messages.length <= 1 && messages[0]?.role === 'assistant';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF6EE] dark:bg-slate-950 overflow-hidden relative">
      {/* 1. Executive Minimalist Control Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[#E2D5BE] dark:border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* History Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 hover:bg-[#F3EAD8] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-[#E2D5BE] dark:border-slate-750 transition-all shadow-2xs cursor-pointer min-h-[36px]"
            title="سجل الجلسات السابقة والمحفوظات"
            aria-label="سجل المحادثات"
          >
            <History className="w-4 h-4 text-sky-600 dark:text-amber-400" />
            <span className="hidden sm:inline">السجل</span>
            {sessions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                {sessions.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleStartNewSession}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-500 hover:to-sky-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer min-h-[36px]"
            title="بدء محادثة جديدة"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>

          {/* Plugins Hub Button (🧩 الإضافات) */}
          <button
            type="button"
            onClick={() => setIsPluginsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-850 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-200 text-xs font-bold border border-[#E2D5BE] dark:border-slate-750 transition-all shadow-2xs cursor-pointer min-h-[36px]"
            title="مركز الإضافات والبلجنز الذكية"
          >
            <Puzzle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden md:inline">الإضافات</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono font-bold">
              {activePluginsCount}
            </span>
          </button>
        </div>

        {/* Center / Right Controls: Dual Thinking Mode Switcher + Dynamic Language */}
        <div className="flex items-center gap-2">
          {/* Dual Thinking Mode Switcher (⚡ سريع vs 🧠 عميق) */}
          <div className="flex items-center bg-[#F3EAD8] dark:bg-slate-850 p-0.5 rounded-xl border border-[#E2D5BE] dark:border-slate-750 text-xs">
            <button
              type="button"
              onClick={() => setThinkingMode('fast')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                thinkingMode === 'fast'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="التفكير السريع والرد التلقائي الفوري"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="hidden sm:inline">سريع</span>
            </button>
            <button
              type="button"
              onClick={() => setThinkingMode('deep')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                thinkingMode === 'deep'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="التفكير المنطقي والبحث العميق مع خطوات التحليل"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تفكير عميق</span>
            </button>
          </div>

          {/* Dynamic Real-Time Language Adaptation Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-slate-800/90 border border-amber-300/80 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-2xs transition-all min-h-[34px]"
            title="يتكيف لحاذگ تلقائياً مع لغة رسالتك فورياً دون الحاجة لتغيير الإعدادات"
          >
            <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">
              {activeLang === 'hassaniya' && 'حسانية 🇲🇷'}
              {activeLang === 'french' && 'Français 🇫🇷'}
              {activeLang === 'arabic' && 'عربية 🇸🇦'}
            </span>
          </div>

          {/* Share Full Session Button */}
          <button
            type="button"
            onClick={handleOpenShareSession}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-[#F4ECDD] dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            title="مشاركة هذه المحادثة"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Navigation Portals Bar */}
      <QuickPortalsBar
        onOpenPortal={(portalId) => {
          setActivePortalId(portalId);
          setIsPortalsModalOpen(true);
        }}
      />

      {/* Dynamic Language Switch Toast Notice */}
      {languageFeedbackToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-amber-500/40 flex items-center gap-2 animate-bounce">
          <span className="text-base">{languageFeedbackToast.flag}</span>
          <span>تم التكيف الذكي فوراً مع: <strong>{languageFeedbackToast.langName}</strong></span>
        </div>
      )}

      {/* Phonetic Speech Correction Notification Banner */}
      {lastCorrection && lastCorrection.appliedCorrections.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-300 dark:border-emerald-800/60 px-4 py-1.5 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 shrink-0 animate-fadeIn">
          <div className="flex items-center gap-2 truncate">
            <Wand2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">تصحيح صوتي ذكي للفظ الحساني:</span>
            <span className="truncate">
              {lastCorrection.appliedCorrections.map((c) => `"${c.original}" ➔ "${c.corrected}"`).join(' ، ')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastCorrection(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 text-[11px] cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 space-y-4">
        {/* Welcome & Smart Exploration Hub (Rendered on empty/initial state) */}
        {isInitialWelcome && (
          <div className="max-w-2xl mx-auto my-6 space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-white via-amber-50/50 to-emerald-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 rounded-3xl p-6 sm:p-8 border border-[#E5DAC4] dark:border-slate-800 shadow-xs text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-600 text-white flex items-center justify-center text-3xl shadow-md shadow-sky-900/10">
                🇲🇷
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                مرحبتي بيك في <span className="text-sky-700 dark:text-sky-400 font-mono">لحاذگ AI</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                منصة الذكاء الاصطناعي الشاملة للشباب الموريتاني. محادثة ذكية، استفسار عن الصفقات والتمويلات، فحص الكتب والمستندات، وتفكير تحليلي متقدم.
              </p>
            </div>

            {/* "هل تبحث عن...؟" Smart Suggestions & Quick Alternatives */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  هل تبحث عن...؟ (اقتراحات استكشاف ذكية)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {smartSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSend(item.query)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-amber-50/80 dark:hover:bg-slate-850 border border-[#E5DAC4] dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 text-right transition-all group shadow-2xs cursor-pointer flex items-start gap-2.5"
                  >
                    <span className="text-lg p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 shrink-0">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                          {item.label}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 transform -scale-x-100 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.query}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((message, idx) => {
          const isUser = message.role === 'user';
          const isFrench = message.language === 'french';
          const textDir = isFrench ? 'ltr' : 'rtl';
          const isLastMessage = idx === messages.length - 1;

          // Parse thinking content for assistant message
          const { thinkingText, mainContent } = !isUser
            ? parseMessageContent(message.content)
            : { thinkingText: undefined, mainContent: message.content };

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-3xl mx-auto`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-xs font-bold ${
                  isUser
                    ? 'bg-sky-600 text-white'
                    : 'bg-gradient-to-br from-emerald-600 to-sky-700 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 min-w-0 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs transition-colors ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-[#E5DAC4] dark:border-slate-800 rounded-tl-none'
                }`}
                dir={textDir}
              >
                {/* Bubble Header / Tag */}
                <div className="flex items-center justify-between gap-2 mb-2 text-[10px] opacity-80">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span>{isUser ? 'أنت' : 'لحاذگ AI'}</span>
                    {message.thinkingMode === 'deep' && (
                      <span className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold flex items-center gap-1">
                        <Brain className="w-2.5 h-2.5" />
                        بحث عميق
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {message.language && (
                      <span className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-bold">
                        {message.language === 'hassaniya' && '🇲🇷 حسانية'}
                        {message.language === 'french' && '🇫🇷 Français'}
                        {message.language === 'arabic' && '🇸🇦 عربية'}
                      </span>
                    )}
                    <span>{message.timestamp}</span>
                  </div>
                </div>

                {/* Render Attached Media in User Message */}
                {isUser && message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    {message.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/20 text-white text-[11px] border border-white/30 backdrop-blur-xs"
                      >
                        {att.previewUrl ? (
                          <img
                            src={att.previewUrl}
                            alt={att.name}
                            className="w-4 h-4 rounded object-cover"
                          />
                        ) : att.type === 'video' ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span className="max-w-[120px] truncate font-medium">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Thinking Block (Deep Reasoning Steps) */}
                {!isUser && thinkingText && (
                  <ThinkingBlock
                    thinkingText={thinkingText}
                    isStreaming={isLoading && isLastMessage}
                  />
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap break-words leading-relaxed">
                  {mainContent || (
                    <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500 italic">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      جاري صياغة الرد المباشر...
                    </span>
                  )}
                </div>

                {/* Assistant Message Actions */}
                {!isUser && message.content && (
                  <div className="mt-3 pt-2.5 border-t border-[#EAE0CD] dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, mainContent || message.content)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-[#F4ECDD] dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                        title="نسخ النص"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Text to Speech */}
                      <button
                        type="button"
                        onClick={() => handleSpeak(mainContent || message.content, message.language)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-[#F4ECDD] dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                        title="قراءة صوتية"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Share Single Message */}
                      <button
                        type="button"
                        onClick={() => handleOpenShareMessage(message)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-[#F4ECDD] dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                        title="مشاركة هذا الرد"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {message.confidence === 'high' ? 'مضبوط وموثوق' : 'إجابة مباشرة'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Contextual Exploration Bar ("هل تبحث عن...؟") below thread */}
        {!isInitialWelcome && !isLoading && smartSuggestions.length > 0 && (
          <div className="max-w-3xl mx-auto pt-2 space-y-1.5 animate-fadeIn">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
              <HelpCircle className="w-3 h-3 text-amber-500" />
              <span>هل تبحث عن...؟</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {smartSuggestions.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSend(item.query)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-slate-800 border border-[#E5DAC4] dark:border-slate-800 hover:border-amber-400 text-xs text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <span>{item.icon}</span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Voice Recording Active Overlay Bar */}
      {isListening && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-4 py-3 shrink-0 shadow-lg animate-fadeIn flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>
            {/* Animated Sound Waveform Bars */}
            <div className="flex items-center gap-0.5 h-5">
              <span className="w-1 bg-white rounded-full animate-bounce h-3"></span>
              <span className="w-1 bg-white rounded-full animate-bounce h-5" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1 bg-white rounded-full animate-bounce h-4" style={{ animationDelay: '0.3s' }}></span>
              <span className="w-1 bg-white rounded-full animate-bounce h-5" style={{ animationDelay: '0.15s' }}></span>
            </div>
            <div className="text-xs">
              <p className="font-bold">استماع مباشر ({speechSeconds}ث) — تحدث بالحسانية أو الفرنسية</p>
              <p className="text-[11px] opacity-90 truncate max-w-[260px] sm:max-w-md">
                {interimTranscript || 'استشعار الصوت بدقة عالية...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => stopVoiceInput(false)}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
            >
              إيقاف ومراجعة
            </button>
            <button
              type="button"
              onClick={() => stopVoiceInput(true)}
              className="px-3 py-1.5 rounded-xl bg-white text-red-600 hover:bg-white/90 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3 h-3 rotate-180" />
              <span>إرسال فوراً</span>
            </button>
          </div>
        </div>
      )}

      {/* Speech error toast */}
      {speechError && (
        <div className="bg-red-50 dark:bg-red-950/80 border-t border-red-300 dark:border-red-800 p-2 text-xs text-red-700 dark:text-red-300 flex items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="text-red-800 dark:text-red-200 font-bold hover:underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 4. Streamlined & Minimalist Unified Input Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-[#E8DEC8] dark:border-slate-800 p-2.5 sm:p-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Analysis in Progress Notification Banner */}
          {mediaAnalysisBanner && (
            <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                <span className="font-bold">
                  {mediaAnalysisBanner.task === 'extract_text'
                    ? `جاري استخراج وقراءة النصوص الضوئية من: "${mediaAnalysisBanner.fileName}"...`
                    : mediaAnalysisBanner.task === 'summarize_book'
                    ? `جاري دراسة وتلخيص محتوى الكتاب / المستند: "${mediaAnalysisBanner.fileName}"...`
                    : `جاري فحص وتحليل محتوى الملف: "${mediaAnalysisBanner.fileName}"...`}
                </span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono shrink-0">
                لحاذگ AI Vision
              </span>
            </div>
          )}

          {/* Media Attachments Preview Bar */}
          <MediaUploadBar
            attachments={attachments}
            onAddAttachment={handleAddAttachment}
            onRemoveAttachment={handleRemoveAttachment}
            onTriggerAnalysis={handleTriggerMediaAnalysis}
            analyzingMediaId={analyzingMediaId}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            {/* Dedicated 'إرفاق' Button & Smart Media Dropdown Popover */}
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setIsAttachMenuOpen((prev) => !prev)}
                className="px-3 sm:px-3.5 py-2.5 rounded-2xl bg-[#F4ECDD] dark:bg-slate-800 hover:bg-[#EBE0CD] dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-[#E0D3BC] dark:border-slate-700 transition-all shadow-2xs cursor-pointer shrink-0 min-h-[46px] flex items-center gap-1.5 font-bold text-xs sm:text-sm group"
                title="إرفاق وتحليل الصور، الكتب، والمستندات (OCR / تلخيص كتب)"
                aria-label="إرفاق ملف أو صورة"
              >
                <Paperclip className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:rotate-45 transition-transform" />
                <span>إرفاق</span>
                {attachments.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </button>

              {/* Attach Dropdown Menu */}
              {isAttachMenuOpen && (
                <div className="absolute bottom-full mb-2 right-0 sm:right-auto sm:left-0 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-[#E2D5BE] dark:border-slate-800 shadow-xl p-2 z-50 animate-scaleIn text-right space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span>مركز إرفاق وتحليل الوسائط</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>

                  {/* Option 1: OCR Text Extraction from Image */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      ocrFileInputRef.current?.click();
                    }}
                    className="w-full p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/50 text-right flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 shrink-0 group-hover:scale-105 transition-transform">
                      <Image className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-700 dark:group-hover:text-sky-400">
                        استخراج نصوص الصور (OCR)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        رفع صورة وثيقة، إيصال، شهادة، أو لافتة واستخراج نصوصها فوراً
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Summarize Book / Document / PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      bookFileInputRef.current?.click();
                    }}
                    className="w-full p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-right flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        تلخيص محتوى كتاب أو مستند
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        رفع كتاب مدرسي، مقرر، أو ملف PDF لتلخيص فصوله ومفاهيمه
                      </div>
                    </div>
                  </button>

                  {/* Option 3: General File Attachment */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(false);
                      fileInputHiddenRef.current?.click();
                    }}
                    className="w-full p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/50 text-right flex items-start gap-2.5 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        إرفاق ملف عام للمناقشة
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        إرفاق ملفات متعددة ومحادثة المساعد الذكي حولها
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden Input for Direct OCR Image Upload */}
            <input
              ref={ocrFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleOcrFileSelect}
            />

            {/* Hidden Input for Direct Book / Document Upload */}
            <input
              ref={bookFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf"
              className="hidden"
              onChange={handleBookFileSelect}
            />

            {/* Hidden Input for General Attachment */}
            <input
              ref={fileInputHiddenRef}
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                for (let i = 0; i < files.length; i++) {
                  const media = await readFileAsAttachedMedia(files[i]);
                  handleAddAttachment(media);
                }
                e.target.value = '';
              }}
            />

            {/* Voice to Text Button */}
            <button
              type="button"
              onClick={isListening ? () => stopVoiceInput(false) : startVoiceInput}
              className={`p-3 rounded-2xl transition-all shadow-2xs cursor-pointer shrink-0 min-h-[46px] min-w-[46px] flex items-center justify-center ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-[#F4ECDD] dark:bg-slate-800 hover:bg-[#EBE0CD] dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-[#E0D3BC] dark:border-slate-700'
              }`}
              title={isListening ? 'إيقاف التسجيل الصوتي' : 'تسجيل رسالة صوتية (فهم حساني وفرنكوفوني فائق الدقة)'}
              aria-label="تسجيل صوتي"
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </button>

            {/* Text Area Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                dir="auto"
                placeholder="اكتب بالحسانية، الفرنسية، أو العربية... أو أرفق كتباً وملفات للتحليل"
                className="w-full resize-none rounded-2xl bg-[#FAF6EE] dark:bg-slate-950 border border-[#E2D5BE] dark:border-slate-800 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-600/40 focus:border-sky-600 transition-all min-h-[46px] max-h-32"
              />
            </div>

            {/* Send / Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="p-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xs cursor-pointer shrink-0 min-h-[46px] min-w-[46px] flex items-center justify-center"
                title="إيقاف التوليد"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() && attachments.length === 0}
                className="p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-xs active:scale-95 cursor-pointer shrink-0 min-h-[46px] min-w-[46px] flex items-center justify-center"
                title="إرسال"
                aria-label="إرسال"
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 5. Chat History Drawer / Sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleStartNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onClearAllSessions={handleClearAllSessions}
      />

      {/* 6. Quick Portals Modal */}
      <QuickPortalsModal
        isOpen={isPortalsModalOpen}
        onClose={() => setIsPortalsModalOpen(false)}
        initialPortalId={activePortalId}
        onSelectPrompt={(prompt) => {
          setInput(prompt);
          inputRef.current?.focus();
        }}
      />

      {/* 7. Plugins & Extension Hub Modal */}
      <PluginsModal
        isOpen={isPluginsModalOpen}
        onClose={() => setIsPluginsModalOpen(false)}
        plugins={plugins}
        onTogglePlugin={handleTogglePlugin}
        onSelectSamplePrompt={(prompt) => {
          setInput(prompt);
          inputRef.current?.focus();
        }}
      />

      {/* 8. Share Modal */}
      <ShareModal
        isOpen={shareModalState.isOpen}
        onClose={() => setShareModalState((prev) => ({ ...prev, isOpen: false }))}
        title={shareModalState.title}
        shareText={shareModalState.shareText}
        subtitle={shareModalState.subtitle}
        categoryTag={shareModalState.categoryTag}
      />
    </div>
  );
};
