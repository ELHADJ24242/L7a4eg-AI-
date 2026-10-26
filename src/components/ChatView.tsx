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
  Languages,
  RotateCcw,
  X,
  Coffee,
  Scroll,
  ArrowRightLeft,
  HeartHandshake,
  Compass,
  Info,
  History,
  Plus,
  Share2,
} from 'lucide-react';
import { ChatMessage, ChatSession, LanguageInfo, LanguageCode } from '../types';
import { sendChatMessage } from '../services/api';
import { detectInputLanguage } from '../utils/languageDetector';
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

interface ChatViewProps {
  currentLanguage: LanguageInfo;
  onSelectLanguage: (langCode: string) => void;
}

type HassaniyaFlowCategory = 'greetings' | 'translation' | 'proverbs' | 'hospitality';

interface FlowCategoryOption {
  id: HassaniyaFlowCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  prompts: {
    title: string;
    text: string;
    tag: string;
  }[];
}

const HASSANIYA_FLOW_CATEGORIES: FlowCategoryOption[] = [
  {
    id: 'greetings',
    label: 'تحايا ومجاملات',
    icon: HeartHandshake,
    description: 'أصول التحية الحسانية، السؤال عن الأهل والدار، ومجاملات اللقاء',
    prompts: [
      {
        title: 'سؤال عن الحال والأهل',
        text: 'شحالك؟ ولاباس عليك؟ وأهل الدار يخير؟ واش طاري اليوم؟',
        tag: 'تحية أصيلة',
      },
      {
        title: 'ترحيب بالصديق والرفيق',
        text: 'مرحبتي بيك يا كمي وسهلاً! امنين انت واشنهي أحوالك والعمل؟',
        tag: 'أخوة ومودة',
      },
      {
        title: 'تحية الصباح والدعاء بالخير',
        text: 'صبّحت يخير وسحابك العافية، يكان فم شي جديد وميسر؟',
        tag: 'صباح الخير',
      },
      {
        title: 'تحية المساء والأتاي',
        text: 'مسيت يخير! كيف حالك مع كاس أتاي مشحر بالرغوة والنعناع؟',
        tag: 'مساء الخير',
      },
    ],
  },
  {
    id: 'translation',
    label: 'ترجمة ثلاثية (حساني ⇄ فصحى ⇄ فرنسي)',
    icon: ArrowRightLeft,
    description: 'ترجمة فورية متطابقة بين الحسانية الموريتانية والعربية الفصحى والفرنسية',
    prompts: [
      {
        title: 'مودة وزيارة قريبة',
        text: 'ترجم للحسانية والفرنسية والفصحى: "أنا مسرور جداً بلقائكم وسنزوركم قريباً إن شاء الله"',
        tag: 'ترجمة ثلاثية',
      },
      {
        title: 'تعبير تجاري (التيفاية والشور)',
        text: 'كيف نترجم بالفرنسية والفصحى العبارة الحسانية: "هو لاهي يفتح تيفاية زوينة والشور الشور كل شي يتم"؟',
        tag: 'حساني ➔ فرنسي/فصحى',
      },
      {
        title: 'شكر وامتنان بالفرنسية',
        text: 'ترجم للحسانية الموريتانية والفصحى الجملة الفرنسية: "Merci beaucoup pour votre accueil chaleureux et ce délicieux thé"',
        tag: 'فرنسي ➔ حساني/فصحى',
      },
      {
        title: 'سؤال عن مكان وتسوق',
        text: 'كيف نسأل بالحسانية والفصحى والفرنسية: "أين يقع سوق كابيتال وكم سعر هذه البضاعة؟"',
        tag: 'تسوق وسياحة',
      },
    ],
  },
  {
    id: 'proverbs',
    label: 'أمثال وتعبيرات شعبية',
    icon: Scroll,
    description: 'حِكَم أهل موريتانيا، أصول الكلمات، وتعبيرات لسان البيظان',
    prompts: [
      {
        title: 'مثل الشور الشور والتروي',
        text: 'أعطني مثلاً حسانياً عن الصبر والتروي مع شرح حكمته وترجمته بالفرنسية والفصحى',
        tag: 'حكمة الصبر',
      },
      {
        title: 'مثل الرضا والبدائل',
        text: 'ما معنى المثل الحساني: "إلى فاتك لحم عيّد بالمرقة"؟ وما سياق استخدامه وقصته؟',
        tag: 'أمثال شعبية',
      },
      {
        title: 'معاني أدوات اللهجة',
        text: 'اشرح لي معاني هذه الأدوات الحسانية الشائعة: "الشور الشور"، "كاع"، "حك"، و"يكان" مع أمثلة',
        tag: 'قاموس الحسانية',
      },
      {
        title: 'أصل كلمة التيفاية',
        text: 'ما هو أصل ومعنى كلمة "التيفاية" في الحسانية وكيف يستخدمها الشباب في التجارة الحرة؟',
        tag: 'ريادة وتجارة',
      },
    ],
  },
  {
    id: 'hospitality',
    label: 'مجالس وأتاي وضيافة',
    icon: Coffee,
    description: 'طقوس الشاي الموريتاني الثلاثية، آداب المجالس، والأكلات التقليدية',
    prompts: [
      {
        title: 'طلب كاس أتاي مشحر',
        text: 'كيف أطلب كأساً من الشاي الموريتاني (أتاي مشحر) بلهجة أهل البلد وآداب المجلس؟',
        tag: 'طقس أتاي',
      },
      {
        title: 'الجيمات الثلاث للشاي',
        text: 'ما هي الجيمات الثلاث في طقس أتاي الموريتاني وما دلالة كل كأس من الكؤوس الثلاثة؟',
        tag: 'تراث الضيافة',
      },
      {
        title: 'الأكلات الشعبية الموريتانية',
        text: 'ما هي أشهر الأكلات التقليدية في موريتانيا (مارو والحوت، الكسكس، تيكيت) وكيف نصفها بالحسانية؟',
        tag: 'مطبخ موريتاني',
      },
      {
        title: 'آداب استقبال الضيف',
        text: 'ما هي عادات وقواعد استقبال الضيف وإكرامه في المجتمع الموريتاني الأصيل؟',
        tag: 'كرم الضيافة',
      },
    ],
  },
];

const GENERAL_PROMPTS = [
  {
    label: '🇲🇷 ريادة الأعمال',
    text: 'كيف أبدأ مشروعاً تجارياً صغيراً في انواكشوط برأس مال متواضع؟',
  },
  {
    label: '📄 طلب خطي إداري',
    text: 'اكتب لي نموذج طلب خطي رسمي موجه للوالي أو الحاكم في موريتانيا',
  },
  {
    label: '📚 نصائح الباكلوريا',
    text: 'ما هي أهم النصائح لتنظيم الوقت والاستعداد لمسابقة الباكلوريا في موريتانيا؟',
  },
  {
    label: '🏜️ أمثال حسانية',
    text: 'اذكر لي ثلاثة أمثال حسانية موريتانية بليغة مع شرح سياقها وحكمتها',
  },
];

interface ParsedTranslation {
  isTranslation: boolean;
  intro?: string;
  hassaniya?: string;
  arabic?: string;
  french?: string;
  culturalNote?: string;
  outro?: string;
}

function parseTranslationContent(content: string): ParsedTranslation {
  // Check if content has the 3-way translation pattern
  const hasHassaniya = content.includes('🇲🇷') || content.includes('بالحسانية');
  const hasArabic = content.includes('📖') || content.includes('بالعربية الفصحى');
  const hasFrench = content.includes('🇫🇷') || content.includes('بالفرنسية');

  if (!hasHassaniya || (!hasArabic && !hasFrench)) {
    return { isTranslation: false };
  }

  try {
    const lines = content.split('\n');
    let introLines: string[] = [];
    let hassaniyaLines: string[] = [];
    let arabicLines: string[] = [];
    let frenchLines: string[] = [];
    let culturalLines: string[] = [];
    let outroLines: string[] = [];

    let currentSection: 'intro' | 'hassaniya' | 'arabic' | 'french' | 'cultural' | 'outro' = 'intro';

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.includes('🇲🇷') || line.includes('**بالحسانية')) {
        currentSection = 'hassaniya';
        continue;
      } else if (line.includes('📖') || line.includes('**بالعربية الفصحى') || line.includes('**بالفصحى')) {
        currentSection = 'arabic';
        continue;
      } else if (line.includes('🇫🇷') || line.includes('**بالفرنسية') || line.includes('**En Français')) {
        currentSection = 'french';
        continue;
      } else if (
        line.includes('💡') ||
        line.includes('**السياق والملاحظة الثقافية') ||
        line.includes('**السياق الثقافي') ||
        line.includes('**السياق والحكمة')
      ) {
        currentSection = 'cultural';
        continue;
      }

      if (currentSection === 'intro') {
        if (line) introLines.push(line);
      } else if (currentSection === 'hassaniya') {
        if (line) hassaniyaLines.push(line);
      } else if (currentSection === 'arabic') {
        if (line) arabicLines.push(line);
      } else if (currentSection === 'french') {
        if (line) frenchLines.push(line);
      } else if (currentSection === 'cultural') {
        if (line) culturalLines.push(line);
      }
    }

    if (hassaniyaLines.length > 0 || arabicLines.length > 0 || frenchLines.length > 0) {
      return {
        isTranslation: true,
        intro: introLines.join('\n'),
        hassaniya: hassaniyaLines.join('\n'),
        arabic: arabicLines.join('\n'),
        french: frenchLines.join('\n'),
        culturalNote: culturalLines.join('\n'),
        outro: outroLines.join('\n'),
      };
    }
  } catch (e) {
    // Return standard fallback on parsing error
  }

  return { isTranslation: false };
}

export const ChatView: React.FC<ChatViewProps> = ({ currentLanguage, onSelectLanguage }) => {
  // Chat History & Persistence State
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const initialList = loadSessions();
    const activeId = getActiveSessionId();
    if (activeId && initialList.some((s) => s.id === activeId)) {
      return activeId;
    }
    return initialList.length > 0 ? initialList[0].id : null;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [personaMode, setPersonaMode] = useState<'hassaniya_expert' | 'general'>('hassaniya_expert');
  const [activeFlowCategory, setActiveFlowCategory] = useState<HassaniyaFlowCategory>('greetings');
  const [showFlowMenu, setShowFlowMenu] = useState(true);

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

  // Web Speech API Voice-to-Text states
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechDialect, setSpeechDialect] = useState<'ar-MR' | 'ar-SA' | 'fr-FR' | 'wo-SN'>(() => {
    if (currentLanguage.code === 'arabic') return 'ar-SA';
    if (currentLanguage.code === 'french') return 'fr-FR';
    if (currentLanguage.code === 'wolof') return 'wo-SN';
    return 'ar-MR'; // Default to Mauritanian Hassaniya
  });
  const [speechError, setSpeechError] = useState<{
    type: 'unsupported' | 'permission' | 'error';
    message: string;
  } | null>(null);
  const [speechFallbackNotice, setSpeechFallbackNotice] = useState<string | null>(null);
  const isListeningIntentRef = useRef(false);

  const [langSwitchToast, setLangSwitchToast] = useState<{
    show: boolean;
    detectedLangCode: string;
    detectedLangName: string;
    previousLangCode: string;
    previousLangName: string;
    matchedKeywords?: string[];
  } | null>(null);

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const toastTimerRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize or restore active session on mount
  useEffect(() => {
    const existing = loadSessions();
    if (existing.length === 0) {
      const newSession = createNewSession(personaMode, currentLanguage.code);
      setSessions([newSession]);
      setCurrentSessionId(newSession.id);
      setMessages(newSession.messages);
    } else {
      const activeId = getActiveSessionId();
      const current = (activeId && existing.find((s) => s.id === activeId)) || existing[0];
      if (current) {
        setCurrentSessionId(current.id);
        setActiveSessionId(current.id);
        setMessages(current.messages);
        if (current.personaMode) {
          setPersonaMode(current.personaMode);
        }
      }
    }
  }, []);

  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (target) {
      setCurrentSessionId(sessionId);
      setActiveSessionId(sessionId);
      setMessages(target.messages);
      if (target.personaMode) {
        setPersonaMode(target.personaMode);
      }
      if (target.languageCode && onSelectLanguage) {
        onSelectLanguage(target.languageCode);
      }
    }
  };

  const handleReloadSessions = () => {
    const loaded = loadSessions();
    setSessions(loaded);
    const active = getActiveSessionId();
    const curr = (active && loaded.find((s) => s.id === active)) || (loaded.length > 0 ? loaded[0] : null);
    if (curr) {
      setCurrentSessionId(curr.id);
      setActiveSessionId(curr.id);
      setMessages(curr.messages);
      if (curr.personaMode) setPersonaMode(curr.personaMode);
      if (curr.languageCode && onSelectLanguage) onSelectLanguage(curr.languageCode);
    }
  };

  const handleStartNewSession = () => {
    const newSession = createNewSession(personaMode, currentLanguage.code);
    const updated = loadSessions();
    setSessions(updated);
    setCurrentSessionId(newSession.id);
    setMessages(newSession.messages);
    setInput('');
  };

  const handleDeleteSession = (sessionId: string) => {
    const { remaining, nextActiveId } = deleteSession(sessionId);
    setSessions(remaining);
    if (remaining.length === 0) {
      const fresh = createNewSession(personaMode, currentLanguage.code);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
      setMessages(fresh.messages);
    } else if (currentSessionId === sessionId) {
      const nextSession = remaining.find((s) => s.id === nextActiveId) || remaining[0];
      setCurrentSessionId(nextSession.id);
      setMessages(nextSession.messages);
      if (nextSession.personaMode) {
        setPersonaMode(nextSession.personaMode);
      }
    }
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    const updated = renameSession(sessionId, newTitle);
    setSessions(updated);
  };

  const handleClearAllSessions = () => {
    clearAllSessions();
    const fresh = createNewSession(personaMode, currentLanguage.code);
    setSessions([fresh]);
    setCurrentSessionId(fresh.id);
    setMessages(fresh.messages);
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    // Automatic Language Detection & Switching
    const detection = detectInputLanguage(query, currentLanguage.code);
    let targetLanguageCode = currentLanguage.code;

    if (detection && detection.isDifferentFromCurrent && detection.detectedLang) {
      const prevCode = currentLanguage.code;
      const prevName = currentLanguage.nameArabic || currentLanguage.nameNative;
      targetLanguageCode = detection.detectedLang;

      // Switch language immediately
      if (onSelectLanguage) {
        onSelectLanguage(detection.detectedLang);
      }

      // Display immediate toast alert
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setLangSwitchToast({
        show: true,
        detectedLangCode: detection.detectedLang,
        detectedLangName: detection.langNameArabic,
        previousLangCode: prevCode,
        previousLangName: prevName,
        matchedKeywords: detection.matchedKeywords,
      });

      // Auto dismiss toast after 4.5 seconds
      toastTimerRef.current = setTimeout(() => {
        setLangSwitchToast(null);
      }, 4500);
    }

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: targetLanguageCode as LanguageCode,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    let activeId = currentSessionId;
    if (!activeId) {
      const newSess = createNewSession(personaMode, targetLanguageCode);
      activeId = newSess.id;
      setCurrentSessionId(activeId);
    }

    // Persist immediately to localStorage
    const sessionsWithUser = updateSessionMessages(activeId, nextMessages, targetLanguageCode);
    setSessions(sessionsWithUser);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage(
        query,
        targetLanguageCode,
        history,
        personaMode
      );

      const assistantMessage: ChatMessage = {
        id: 'res-' + Date.now(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: response.confidence,
        language: targetLanguageCode as LanguageCode,
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      const updated = updateSessionMessages(activeId, finalMessages, targetLanguageCode);
      setSessions(updated);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          'عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى.\n(' +
          (error.message || 'خطأ غير معروف') +
          ')',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: 'limited_support',
      };
      const finalMessages = [...nextMessages, errorMessage];
      setMessages(finalMessages);
      const updated = updateSessionMessages(activeId, finalMessages, targetLanguageCode);
      setSessions(updated);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndoLangSwitch = () => {
    if (langSwitchToast && onSelectLanguage) {
      onSelectLanguage(langSwitchToast.previousLangCode);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setLangSwitchToast(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenShareMessage = (content: string, userPrompt?: string) => {
    const formatted = formatMessageForSharing(
      content,
      userPrompt,
      personaMode === 'hassaniya_expert' ? 'الحسانية الموريتانية الأصيلة' : 'المساعد الموريتاني العام'
    );
    setShareModalState({
      isOpen: true,
      title: 'مشاركة إجابة لحاذگ',
      shareText: formatted,
      subtitle: userPrompt || 'إجابة من لحاذگ AI',
      categoryTag: personaMode === 'hassaniya_expert' ? 'الحسانية 🇲🇷' : 'لحاذگ AI',
    });
  };

  const handleOpenShareSession = () => {
    const active = (currentSessionId && sessions.find((s) => s.id === currentSessionId)) || sessions[0];
    if (!active) return;
    const formatted = formatSessionForSharing(active);
    setShareModalState({
      isOpen: true,
      title: active.title,
      shareText: formatted,
      subtitle: `محادثة كاملة (${active.messages.length} رسالة)`,
      categoryTag: 'ملخص محادثة 🇲🇷',
    });
  };

  const handleSpeak = (text: string, customLang?: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (customLang) {
        utterance.lang = customLang;
      } else if (currentLanguage.dir === 'rtl') {
        utterance.lang = 'ar-SA';
      } else if (currentLanguage.code === 'french') {
        utterance.lang = 'fr-FR';
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop any active speech recognition and timers on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // Keep speech dialect synchronized with active app language
  useEffect(() => {
    if (currentLanguage.code === 'arabic') {
      setSpeechDialect('ar-SA');
    } else if (currentLanguage.code === 'french') {
      setSpeechDialect('fr-FR');
    } else if (currentLanguage.code === 'wolof') {
      setSpeechDialect('wo-SN');
    } else if (currentLanguage.code === 'hassaniya') {
      setSpeechDialect('ar-MR');
    }
  }, [currentLanguage.code]);

  const SPEECH_DIALECT_OPTIONS = [
    { code: 'ar-MR', label: 'حسانية موريتانية', flag: '🇲🇷', sub: 'اللهجة الحسانية المحلية' },
    { code: 'ar-SA', label: 'عربية فصحى', flag: '🇸🇦', sub: 'العربية القياسية الشاملة' },
    { code: 'fr-FR', label: 'الفرنسية', flag: '🇫🇷', sub: 'Français' },
    { code: 'wo-SN', label: 'الولوفية', flag: '🇸🇳', sub: 'Wolof' },
  ] as const;

  const stopVoiceInput = () => {
    isListeningIntentRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Flush any pending interim speech directly into the input so no words are lost
    if (interimTranscript && interimTranscript.trim()) {
      setInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${interimTranscript.trim()}` : interimTranscript.trim();
      });
    }

    setIsListening(false);
    setInterimTranscript('');
  };

  const startVoiceInput = (targetDialect?: 'ar-MR' | 'ar-SA' | 'fr-FR' | 'wo-SN') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError({
        type: 'unsupported',
        message:
          'ميزة الإملاء الصوتي المباشر (Web Speech API) غير مدعومة في متصفحك الحالي. نوصي باستخدام متصفح Google Chrome أو Microsoft Edge أو Safari للحصول على أفضل تجربة إملاء صوتي بالحسانية والعربية.',
      });
      return;
    }

    // Abort previous session if exists
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const activeDialect = targetDialect || speechDialect;
    setSpeechError(null);
    setInterimTranscript('');
    isListeningIntentRef.current = true;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = activeDialect;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
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
          setInput((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalSegment.trim()}` : finalSegment.trim();
          });
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          isListeningIntentRef.current = false;
          setIsListening(false);
          setSpeechError({
            type: 'permission',
            message:
              'تم حظر إذن الميكروفون. يرجى النقر على أيقونة القفل أو إعدادات الموقع في شريط عنوان المتصفح، والسماح للميكروفون، ثم إعادة المحاولة.',
          });
        } else if (event.error === 'language-not-supported' && activeDialect === 'ar-MR') {
          // If browser dictionary does not have explicit ar-MR acoustic model, fallback to ar-SA seamlessly
          console.info('ar-MR speech engine unsupported on this browser, auto-falling back to ar-SA');
          setSpeechDialect('ar-SA');
          setSpeechFallbackNotice('تم التبديل تلقائياً إلى محرك العربية الفصحى (ar-SA) المتوافق مع متصفحك، مع استمرار فهم الكلمات الحسانية.');
          try {
            recognition.abort();
          } catch (e) {}
          setTimeout(() => {
            if (isListeningIntentRef.current) {
              startVoiceInput('ar-SA');
            }
          }, 200);
        } else if (event.error === 'no-speech') {
          // Normal silence timeout in some browsers, do not abort listening intent
        } else if (event.error === 'audio-capture') {
          isListeningIntentRef.current = false;
          setIsListening(false);
          setSpeechError({
            type: 'error',
            message: 'تعذر التقاط الصوت. يرجى التأكد من توصيل الميكروفون وسلامته.',
          });
        }
      };

      recognition.onend = () => {
        if (isListeningIntentRef.current) {
          // Browser closed stream due to silence pause; restart if user still intends to dictate
          try {
            recognition.start();
            return;
          } catch (e) {}
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      isListeningIntentRef.current = false;
      setSpeechError({
        type: 'error',
        message: 'حدث خطأ أثناء بدء التعرف الصوتي: ' + (err.message || 'خطأ غير معروف'),
      });
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const switchSpeechDialect = (newDialect: 'ar-MR' | 'ar-SA' | 'fr-FR' | 'wo-SN') => {
    setSpeechDialect(newDialect);
    setSpeechFallbackNotice(null);
    if (isListening) {
      stopVoiceInput();
      setTimeout(() => {
        startVoiceInput(newDialect);
      }, 150);
    }
  };

  const handleFinishVoiceAndSend = () => {
    stopVoiceInput();
    setTimeout(() => {
      handleSend();
    }, 150);
  };

  const clearChat = () => {
    if (window.confirm('هل تود مسح رسائل هذه المحادثة والبدء من جديد مع لحاذگ؟')) {
      const welcomeMsg = createWelcomeMessage(personaMode, currentLanguage.code);
      const newMessages = [welcomeMsg];
      setMessages(newMessages);
      if (currentSessionId) {
        const updated = updateSessionMessages(currentSessionId, newMessages, currentLanguage.code);
        setSessions(updated);
      }
    }
  };

  const isLimitedLanguage = ['pulaar', 'soninke', 'wolof', 'bambara'].includes(currentLanguage.code);
  const currentCategory = HASSANIYA_FLOW_CATEGORIES.find((c) => c.id === activeFlowCategory)!;
  const currentSession = sessions.find((s) => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-[calc(100vh-60px-58px)] md:h-[calc(100vh-60px-48px)] max-w-4xl mx-auto w-full relative">
      {/* Top Header: Session History & Persona Controls */}
      <div className="bg-slate-900 border-b border-slate-800 p-2 sm:px-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* History Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="فتح سجل المحادثات السابقة"
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span className="inline">السجل</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/30 font-bold">
              {sessions.length}
            </span>
          </button>

          {/* New Chat Quick Button */}
          <button
            type="button"
            onClick={handleStartNewSession}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title="بدء محادثة جديدة"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">محادثة جديدة</span>
          </button>

          {/* Active Session Title Preview Pill */}
          {currentSession && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 cursor-pointer max-w-[160px] truncate transition-colors"
              title={`المحادثة الحالية: ${currentSession.title} (اضغط لفتح السجل)`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">{currentSession.title}</span>
            </button>
          )}

          {/* Persona Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setPersonaMode('hassaniya_expert');
                if (currentSessionId) {
                  const updated = sessions.map((s) =>
                    s.id === currentSessionId ? { ...s, personaMode: 'hassaniya_expert' as const } : s
                  );
                  setSessions(updated);
                  saveSessions(updated);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                personaMode === 'hassaniya_expert'
                  ? 'bg-gradient-to-r from-emerald-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇲🇷</span>
              <span>مستشار الحسانية</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded-full border border-amber-400/30 hidden xs:inline">
                أصيل
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPersonaMode('general');
                if (currentSessionId) {
                  const updated = sessions.map((s) =>
                    s.id === currentSessionId ? { ...s, personaMode: 'general' as const } : s
                  );
                  setSessions(updated);
                  saveSessions(updated);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                personaMode === 'general'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>المساعد العام</span>
            </button>
          </div>
        </div>

        {personaMode === 'hassaniya_expert' && (
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <span className="text-slate-400 text-[11px] hidden xl:inline">
              لسان البيظان • تحايا • أمثال • ترجمة ثلاثية
            </span>
            <button
              type="button"
              onClick={() => setShowFlowMenu(!showFlowMenu)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                showFlowMenu
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{showFlowMenu ? 'إخفاء مسارات الحسانية' : 'استعراض مواضيع الحسانية'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Hassaniya Specialized Conversation Flow Navigator Banner */}
      {personaMode === 'hassaniya_expert' && showFlowMenu && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-amber-600/20 p-2.5 sm:p-3 shrink-0 space-y-2 animate-fadeIn">
          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {HASSANIYA_FLOW_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeFlowCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveFlowCategory(category.id)}
                  className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-amber-950/60 border-amber-500/80 text-amber-200 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{category.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Flow Prompt Chips for Active Category */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {currentCategory.prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p.text)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-200 hover:text-amber-200 transition-all shadow-sm shrink-0 group text-right"
                title={p.text}
              >
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {p.tag}
                </span>
                <span className="font-medium group-hover:underline underline-offset-2">
                  {p.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top Language Notice if community language */}
      {isLimitedLanguage && (
        <div className="bg-blue-950/70 border-b border-blue-800/60 p-2.5 px-4 text-xs text-blue-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              لغة <strong>{currentLanguage.nameNative}</strong> مدعومة بمستوى أساسي ومستمرة في التطور عبر القاموس المجتمعي.
            </span>
          </div>
          <span className="text-[10px] bg-blue-800/60 text-blue-200 px-2 py-0.5 rounded shrink-0">
            أمانة معرفية
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const parsed = !isUser ? parseTranslationContent(message.content) : { isTranslation: false };

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-700 text-white border border-emerald-500/30'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 shadow-md relative group ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-tl-none'
                }`}
              >
                {/* Content: Either Structured Translation or Regular Chat Message */}
                {parsed.isTranslation ? (
                  <div className="space-y-3 font-sans" dir="rtl">
                    {parsed.intro && (
                      <p className="text-xs sm:text-sm text-slate-300 font-medium pb-1 border-b border-slate-800">
                        {parsed.intro}
                      </p>
                    )}

                    {/* Hassaniya Block */}
                    {parsed.hassaniya && (
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 space-y-1 relative group/block">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <span>🇲🇷</span>
                            <span>باللهجة الحسانية (Hassaniya):</span>
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover/block:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleCopy(`has-${message.id}`, parsed.hassaniya!)}
                              className="p-1 hover:text-white rounded"
                              title="نسخ العبارة الحسانية"
                            >
                              {copiedId === `has-${message.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpeak(parsed.hassaniya!, 'ar-SA')}
                              className="p-1 hover:text-white rounded"
                              title="نطق بالحسانية"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-emerald-100 leading-relaxed pt-0.5">
                          {parsed.hassaniya}
                        </p>
                      </div>
                    )}

                    {/* Standard Arabic Block */}
                    {parsed.arabic && (
                      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 space-y-1 relative group/block">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                          <span className="flex items-center gap-1.5">
                            <span>📖</span>
                            <span>بالعربية الفصحى (Arabe Standard):</span>
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover/block:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleCopy(`ar-${message.id}`, parsed.arabic!)}
                              className="p-1 hover:text-white rounded"
                              title="نسخ العبارة العربية"
                            >
                              {copiedId === `ar-${message.id}` ? (
                                <Check className="w-3.5 h-3.5 text-amber-300" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpeak(parsed.arabic!, 'ar-SA')}
                              className="p-1 hover:text-white rounded"
                              title="نطق بالعربية"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-amber-100 leading-relaxed pt-0.5">
                          {parsed.arabic}
                        </p>
                      </div>
                    )}

                    {/* French Block */}
                    {parsed.french && (
                      <div
                        className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 space-y-1 relative group/block"
                        dir="ltr"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                          <span className="flex items-center gap-1.5">
                            <span>🇫🇷</span>
                            <span>En Français:</span>
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover/block:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleCopy(`fr-${message.id}`, parsed.french!)}
                              className="p-1 hover:text-white rounded"
                              title="Copier le texte français"
                            >
                              {copiedId === `fr-${message.id}` ? (
                                <Check className="w-3.5 h-3.5 text-indigo-300" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSpeak(parsed.french!, 'fr-FR')}
                              className="p-1 hover:text-white rounded"
                              title="Écouter en français"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-indigo-100 leading-relaxed font-sans pt-0.5">
                          {parsed.french}
                        </p>
                      </div>
                    )}

                    {/* Cultural / Idiomatic Note Block */}
                    {parsed.culturalNote && (
                      <div className="bg-slate-950/80 border border-slate-700/60 rounded-xl p-3 space-y-1">
                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <span>💡</span>
                          <span>السياق والملاحظة الثقافية الموريتانية:</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                          {parsed.culturalNote}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {message.content}
                  </div>
                )}

                {/* Footer info & quick actions */}
                <div
                  className={`flex items-center gap-2 mt-2 pt-1 border-t text-[11px] ${
                    isUser
                      ? 'border-emerald-500/40 text-emerald-200 justify-end'
                      : 'border-slate-800 text-slate-400 justify-between'
                  }`}
                >
                  <span className="text-[10px]">{message.timestamp}</span>

                  {!isUser && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        className="p-1 hover:text-white rounded transition-colors"
                        title="نسخ الرد كاملاً"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {'speechSynthesis' in window && (
                        <button
                          onClick={() => handleSpeak(message.content)}
                          className="p-1 hover:text-white rounded transition-colors"
                          title="قراءة صوتية"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>
                  {personaMode === 'hassaniya_expert'
                    ? '"لحاذگ الحساني" يفكّر ويصيغ الرد الموريتاني الأصيل الشور الشور...'
                    : '"لحاذگ" يعالج إجابتك الآن...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (when few messages and flow menu hidden) */}
      {messages.length <= 3 && !isLoading && !showFlowMenu && (
        <div className="px-3 sm:px-4 py-1.5 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {GENERAL_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-emerald-950/70 border border-slate-700/70 hover:border-emerald-600/50 text-slate-300 hover:text-emerald-300 text-xs transition-colors shadow-sm"
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-2 sm:p-3 bg-slate-900/95 border-t border-slate-800 shrink-0">
        {/* Automatic Language Detection & Switch Toast Alert */}
        {langSwitchToast && langSwitchToast.show && (
          <div
            className="mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-slate-900 to-teal-950/95 border border-emerald-500/50 shadow-xl flex items-center justify-between gap-3 animate-fadeIn backdrop-blur-sm"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
                <Languages className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-xs space-y-0.5 truncate">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white">
                    تم التبديل تلقائياً إلى:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-400/40 text-[11px]">
                    {langSwitchToast.detectedLangName}
                  </span>
                  {langSwitchToast.matchedKeywords && langSwitchToast.matchedKeywords.length > 0 && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      (رُصدت: {langSwitchToast.matchedKeywords.slice(0, 3).join('، ')})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  تم تكييف اتجاه الشاشة والمساعد ليتناسب مع لغة رسالتك.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleUndoLangSwitch}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer shadow-sm"
                title={`الرجوع إلى ${langSwitchToast.previousLangName}`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>تراجع</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                  setLangSwitchToast(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Speech Fallback Notification */}
        {speechFallbackNotice && (
          <div
            className="mb-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2 animate-fadeIn"
            dir="rtl"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{speechFallbackNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSpeechFallbackNotice(null)}
              className="text-amber-400 hover:text-white p-1 rounded hover:bg-amber-900/50 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div
            className="mb-2 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs shadow-lg flex items-start justify-between gap-2 animate-fadeIn"
            dir="rtl"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-100">{speechError.message}</p>
                {speechError.type === 'permission' && (
                  <p className="text-[11px] text-rose-300">
                    تلميح: اضغط على رمز القفل 🔒 في يسار أو يمين شريط العنوان ثم اختر "السماح بالميكروفون" ثم حدّث الصفحة.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Speech Recognition Dictation Banner */}
        {isListening && (
          <div
            className="mb-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/95 via-slate-900 to-amber-950/95 border-2 border-rose-500/60 shadow-2xl flex flex-col gap-2.5 animate-fadeIn"
            dir="rtl"
          >
            {/* Top row: Status, Dialect selector, and Equalizer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                {/* Animated Equalizer soundwave */}
                <div className="flex items-end gap-1 h-6 shrink-0 px-2 py-1 rounded-lg bg-rose-600/30 border border-rose-500/40">
                  <span className="w-1 h-3 bg-rose-400 rounded-full animate-pulse"></span>
                  <span className="w-1 h-5 bg-amber-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="w-1 h-6 bg-rose-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    جاري الاستماع لصوتك
                  </span>
                </div>
              </div>

              {/* Dialect selector pills */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 px-1.5 hidden sm:inline">اللهجة:</span>
                {SPEECH_DIALECT_OPTIONS.map((d) => {
                  const isSelected = speechDialect === d.code;
                  return (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => switchSpeechDialect(d.code as any)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={d.sub}
                    >
                      <span>{d.flag}</span>
                      <span>{d.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Middle row: Live Transcription Box */}
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 min-h-[46px] flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {interimTranscript ? (
                  <p className="text-sm text-amber-300 font-semibold italic animate-pulse">
                    "{interimTranscript}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>تحدث الآن بوضوح بالحسانية أو العربية، وسيتم تدوين كلامك فوراً في حقل الرسالة...</span>
                  </p>
                )}
              </div>

              {input.trim() && (
                <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 shrink-0">
                  {input.trim().split(/\s+/).length} كلمة مدوّنة
                </span>
              )}
            </div>

            {/* Bottom row: Control Actions */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                {input.trim() && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-xs transition-colors flex items-center gap-1 cursor-pointer border border-slate-700/50"
                    title="تفريغ النص لبدء الإملاء من جديد"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح النص</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={stopVoiceInput}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
                >
                  إيقاف وحفظ في المربع
                </button>
                <button
                  type="button"
                  onClick={handleFinishVoiceAndSend}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>إنهاء وإرسال</span>
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-1.5 sm:gap-2 bg-slate-950 border border-slate-800 focus-within:border-amber-500/80 rounded-2xl p-1.5 shadow-inner transition-colors"
        >
          {/* Clear Chat Button */}
          {messages.length > 2 && (
            <button
              type="button"
              onClick={clearChat}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors shrink-0"
              title="مسح المحادثة وبدء جلسة جديدة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Voice Input Button & Dialect Tag */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isListening
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-900/60 ring-2 ring-rose-400 animate-pulse'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
              }`}
              title={
                isListening
                  ? 'إيقاف الإملاء الصوتي'
                  : `إملاء صوتي (${
                      SPEECH_DIALECT_OPTIONS.find((d) => d.code === speechDialect)?.label || 'حسانية'
                    })`
              }
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
            </button>

            {!isListening && (
              <button
                type="button"
                onClick={() => {
                  const nextDialect = speechDialect === 'ar-MR' ? 'ar-SA' : 'ar-MR';
                  setSpeechDialect(nextDialect);
                }}
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
                title="اضغط للتبديل السريع بين الحسانية والعربية الفصحى"
              >
                <span>{speechDialect === 'ar-MR' ? '🇲🇷' : '🇸🇦'}</span>
              </button>
            )}
          </div>

          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              personaMode === 'hassaniya_expert'
                ? 'تحدث بالحسانية، اسأل عن معنى أو مثل، أو اطلب ترجمة (مثال: شحالك، أو ترجم للحسانية...)'
                : currentLanguage.code === 'french'
                ? 'Posez votre question en français...'
                : 'اكتب رسالتك لـ "لحاذگ"...'
            }
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 text-white text-sm placeholder:text-slate-500 resize-none py-2 px-2 max-h-32 min-h-[40px] outline-none"
            dir={currentLanguage.dir}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white shadow-md shadow-amber-950'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="إرسال"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>

      {/* Persistent Chat History Sidebar Drawer */}
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
        onImportSessions={handleReloadSessions}
      />
    </div>
  );
};
