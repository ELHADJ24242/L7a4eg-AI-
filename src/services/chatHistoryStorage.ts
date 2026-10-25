import { ChatMessage, ChatSession, LanguageCode } from '../types';

const STORAGE_KEY_SESSIONS = 'l7a4eg_chat_sessions_v1';
const STORAGE_KEY_ACTIVE_ID = 'l7a4eg_active_session_id_v1';

export function createWelcomeMessage(
  personaMode: 'hassaniya_expert' | 'general' = 'hassaniya_expert',
  langCode: string = 'hassaniya'
): ChatMessage {
  const content =
    personaMode === 'hassaniya_expert'
      ? 'مرحباً بك في "لحاذگ" (L7a4eg AI) 🇲🇷! مستشارك ومحاورك الحساني الموريتاني الأول.\n\nشحالك؟ ولاباس عليك؟ أهل دارك يخير؟\nأنا معك في هذا المجلس للدردشة بلسان البيظان الأصيل، شرح الأمثال وتراث الشناقطة، وتقديم الترجمة الثلاثية الدقيقة بين الحسانية والعربية الفصحى والفرنسية الشور الشور. اعطنا الأخبار! ☕'
      : 'أهلاً وسهلاً بك في "لحاذگ"! المساعد الذكي الموريتاني العام. كيف يمكنني مساعدتك اليوم في أفكارك، كتابة نصوصك، أو استفساراتك العامة؟';

  return {
    id: 'welcome-' + Date.now(),
    role: 'assistant',
    content,
    timestamp: 'الآن',
    confidence: 'high',
    language: langCode as LanguageCode,
  };
}

export function generateSessionTitle(firstPrompt: string): string {
  const cleaned = firstPrompt
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .replace(/^["'«]/, '')
    .replace(/["'»]$/, '');

  if (!cleaned) return 'محادثة جديدة';

  // Limit to ~35 characters without breaking words
  if (cleaned.length <= 35) return cleaned;
  const cut = cleaned.substring(0, 35);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 15 ? cut.substring(0, lastSpace) : cut) + '...';
}

export function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Sort sessions by updatedAt descending
      return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return [];
  } catch (err) {
    console.error('Failed to load chat sessions from localStorage:', err);
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    return true;
  } catch (err) {
    console.warn('LocalStorage save error (possibly quota exceeded):', err);
    // If quota exceeded, attempt to prune old sessions keeping the most recent 25
    if (sessions.length > 15) {
      try {
        const pruned = sessions.slice(0, 15);
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(pruned));
        return true;
      } catch (e) {
        console.error('Failed even after pruning sessions:', e);
      }
    }
    return false;
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
}

export function setActiveSessionId(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (err) {
    console.error('Failed to set active session id in localStorage:', err);
  }
}

export function createNewSession(
  personaMode: 'hassaniya_expert' | 'general' = 'hassaniya_expert',
  langCode: string = 'hassaniya',
  customTitle?: string
): ChatSession {
  const now = Date.now();
  const session: ChatSession = {
    id: 'session-' + now + '-' + Math.random().toString(36).substring(2, 7),
    title: customTitle || (personaMode === 'hassaniya_expert' ? 'جلسة حسانية جديدة' : 'محادثة عامة جديدة'),
    createdAt: now,
    updatedAt: now,
    languageCode: langCode,
    personaMode,
    messages: [createWelcomeMessage(personaMode, langCode)],
  };

  const existing = loadSessions();
  const updated = [session, ...existing];
  saveSessions(updated);
  setActiveSessionId(session.id);
  return session;
}

export function updateSessionMessages(
  sessionId: string,
  messages: ChatMessage[],
  targetLang?: string
): ChatSession[] {
  const sessions = loadSessions();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

  if (sessionIndex === -1) {
    // If not found, create new session with these messages
    const now = Date.now();
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const autoTitle = firstUserMsg ? generateSessionTitle(firstUserMsg.content) : 'محادثة محفوظة';
    const newSession: ChatSession = {
      id: sessionId,
      title: autoTitle,
      createdAt: now,
      updatedAt: now,
      languageCode: targetLang || 'hassaniya',
      personaMode: 'hassaniya_expert',
      messages,
    };
    const updatedList = [newSession, ...sessions];
    saveSessions(updatedList);
    return updatedList;
  }

  const existing = sessions[sessionIndex];
  const now = Date.now();

  // If session still has default title, update it with the first user message
  let title = existing.title;
  const isDefaultTitle =
    title === 'جلسة حسانية جديدة' ||
    title === 'محادثة عامة جديدة' ||
    title === 'محادثة جديدة' ||
    title === 'جلسة جديدة';

  if (isDefaultTitle) {
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg) {
      title = generateSessionTitle(firstUserMsg.content);
    }
  }

  const updatedSession: ChatSession = {
    ...existing,
    title,
    messages,
    updatedAt: now,
    languageCode: targetLang || existing.languageCode,
  };

  const updatedList = [
    updatedSession,
    ...sessions.filter((s) => s.id !== sessionId),
  ];

  saveSessions(updatedList);
  return updatedList;
}

export function renameSession(sessionId: string, newTitle: string): ChatSession[] {
  const sessions = loadSessions();
  const trimmed = newTitle.trim();
  if (!trimmed) return sessions;

  const updatedList = sessions.map((s) => {
    if (s.id === sessionId) {
      return { ...s, title: trimmed, updatedAt: Date.now() };
    }
    return s;
  });

  saveSessions(updatedList);
  return updatedList;
}

export function deleteSession(sessionId: string): {
  remaining: ChatSession[];
  nextActiveId: string | null;
} {
  const sessions = loadSessions();
  const remaining = sessions.filter((s) => s.id !== sessionId);
  saveSessions(remaining);

  const activeId = getActiveSessionId();
  let nextActiveId = activeId;

  if (activeId === sessionId) {
    nextActiveId = remaining.length > 0 ? remaining[0].id : null;
    if (nextActiveId) {
      setActiveSessionId(nextActiveId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    }
  }

  return { remaining, nextActiveId };
}

export function clearAllSessions(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(STORAGE_KEY_SESSIONS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
  } catch (err) {
    console.error('Failed to clear all chat sessions:', err);
  }
}

export function formatSessionTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'الآن';
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `منذ ${mins} د`;
  }

  const date = new Date(timestamp);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'أمس ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Date format
  return `${date.getDate()}/${date.getMonth() + 1}`;
}
