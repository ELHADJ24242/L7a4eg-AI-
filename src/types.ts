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

export type ThinkingMode = 'fast' | 'deep';

export interface AttachedMedia {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  mimeType: string;
  size: number;
  previewUrl: string;
  base64Data?: string;
  textContent?: string;
}

export type MediaAnalysisTask = 'extract_text' | 'summarize_book' | 'general_analysis';

export interface MediaAnalysisResponse {
  success: boolean;
  task: MediaAnalysisTask;
  fileName: string;
  fileType: string;
  result: string;
  extractedText?: string;
  summary?: {
    title: string;
    keyPoints: string[];
    actionableTakeaways: string[];
  };
}

export type QuickPortalId = 'celebrity' | 'startups' | 'tenders' | 'curriculum';

export interface PortalItem {
  id: string;
  portalId: QuickPortalId;
  title: string;
  summary: string;
  categoryTag: string;
  date: string;
  badge?: string;
  promptToAsk: string;
}

export interface PluginItem {
  id: string;
  titleAr: string;
  titleFr: string;
  descriptionAr: string;
  category: 'business' | 'legal' | 'academic' | 'climate' | 'culture';
  icon: string;
  enabled: boolean;
  samplePrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: 'high' | 'limited_support' | 'demo';
  language?: LanguageCode | string;
  smartSuggestions?: string[];
  isVoiceInput?: boolean;
  originalVoiceTranscription?: string;
  thinkingMode?: ThinkingMode;
  thinkingSteps?: string;
  attachments?: AttachedMedia[];
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
