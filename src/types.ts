export type LanguageCode =
  | 'hassaniya'
  | 'arabic'
  | 'french'
  | 'pulaar'
  | 'soninke'
  | 'wolof'
  | 'bambara';

export interface LanguageInfo {
  code: LanguageCode;
  nameNative: string;
  nameArabic: string;
  nameFrench: string;
  dir: 'rtl' | 'ltr';
  supportLevel: 'primary' | 'fluent' | 'supported' | 'community_curated';
  testedStatus: string;
  notes: string;
}

export type AppTab =
  | 'chat'
  | 'hassani'
  | 'translate'
  | 'dictionary'
  | 'content'
  | 'image_studio'
  | 'video_studio';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: 'high' | 'limited_support' | 'demo';
  language?: LanguageCode;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  languageCode: LanguageCode | string;
  personaMode: 'hassaniya_expert' | 'general';
  messages: ChatMessage[];
}

export interface DictionaryItem {
  id: string;
  term: string;
  language: LanguageCode;
  meaningAr: string;
  meaningFr: string;
  exampleOriginal: string;
  exampleTranslation: string;
  category: 'daily' | 'proverb' | 'culture' | 'business' | 'hospitality';
  status: 'verified' | 'pending';
  contributor: string;
  votes: number;
  createdAt: string;
}

export interface ProviderStatus {
  prototypeNotice: {
    ar: string;
    fr: string;
  };
  textChat: {
    provider: string;
    status: string;
    costMode: string;
  };
  imageStudio: {
    provider: string;
    status: string;
    needsPaidProvider: boolean;
    noteAr: string;
    noteFr: string;
  };
  videoStudio: {
    provider: string;
    status: string;
    needsPaidProvider: boolean;
    noteAr: string;
    noteFr: string;
  };
}
