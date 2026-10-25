import { DictionaryItem, LanguageCode, ProviderStatus } from '../types';

export async function sendChatMessage(
  message: string,
  language: LanguageCode,
  history: { role: string; content: string }[] = [],
  persona: 'hassaniya_expert' | 'general' = 'hassaniya_expert'
): Promise<{ reply: string; confidence: 'high' | 'limited_support' | 'demo'; detectedLanguage: string }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, history, persona }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Server error occurred');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    throw error;
  }
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  includeHassaniyaNotes: boolean = true
): Promise<{ translation: string; sourceLang: string; targetLang: string }> {
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang, targetLang, includeHassaniyaNotes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Translation request failed');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Translate API Error:', error);
    throw error;
  }
}

export async function consultHassaniAI(
  mode: 'explain_term' | 'proverb' | 'poetry' | 'etiquette' | 'general' | 'translation_bridge',
  input: string
): Promise<{ result: string; mode: string }> {
  try {
    const res = await fetch('/api/hassani', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, input }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Hassani AI request failed');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Hassani AI Error:', error);
    throw error;
  }
}

export async function generateMarketingContent(
  contentType: string,
  topic: string,
  targetAudience: string,
  languageStyle: string
): Promise<{ content: string }> {
  try {
    const res = await fetch('/api/content-creator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType, topic, targetAudience, languageStyle }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Content creation failed');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Content Creator Error:', error);
    throw error;
  }
}

export async function fetchDictionary(
  lang: string = 'all',
  status: string = 'all',
  search: string = ''
): Promise<{ items: DictionaryItem[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (lang && lang !== 'all') params.append('lang', lang);
    if (status && status !== 'all') params.append('status', status);
    if (search) params.append('search', search);

    const res = await fetch(`/api/dictionary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch dictionary');
    return await res.json();
  } catch (error: any) {
    console.error('Dictionary API Error:', error);
    throw error;
  }
}

export async function submitDictionaryItem(
  entry: Partial<DictionaryItem>
): Promise<{ item: DictionaryItem; message: string }> {
  try {
    const res = await fetch('/api/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit term');
    }

    return await res.json();
  } catch (error: any) {
    console.error('Submit Dictionary Error:', error);
    throw error;
  }
}

export async function voteDictionaryItem(id: string): Promise<{ item: DictionaryItem }> {
  const res = await fetch(`/api/dictionary/${id}/vote`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to vote');
  return await res.json();
}

export async function reviewDictionaryItem(id: string, status: 'verified' | 'pending'): Promise<{ item: DictionaryItem; message: string }> {
  const res = await fetch(`/api/dictionary/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return await res.json();
}

export async function fetchProvidersStatus(): Promise<ProviderStatus> {
  const res = await fetch('/api/providers-status');
  if (!res.ok) throw new Error('Failed to fetch provider status');
  return await res.json();
}

export interface GeneratedImageItem {
  id: string;
  url: string;
  seed: number;
  width: number;
  height: number;
  aspectRatio: string;
  promptOriginal: string;
  enhancedPrompt: string;
  createdAt: string;
}

export async function generateImagesAPI(
  prompt: string,
  count: number = 2,
  aspectRatio: string = '1:1',
  style: string = 'cinematic'
): Promise<{ success: boolean; images: GeneratedImageItem[]; enhancedPrompt: string; provider: string }> {
  try {
    const res = await fetch('/api/generate-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, count, aspectRatio, style }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate images');
    }

    return await res.json();
  } catch (error: any) {
    console.error('generateImagesAPI Error:', error);
    throw error;
  }
}

export interface VideoSceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  visualPrompt: string;
  narration: string;
  duration: number;
  camera: string;
  imageUrl: string;
}

export interface GeneratedVideoProject {
  success: boolean;
  title: string;
  scenes: VideoSceneItem[];
  totalDuration: number;
  provider: string;
}

export async function generateVideoAPI(
  scriptIdea: string,
  style: string = 'cinematic',
  voiceLang: string = 'hassaniya'
): Promise<GeneratedVideoProject> {
  try {
    const res = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptIdea, style, voiceLang }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate video');
    }

    return await res.json();
  } catch (error: any) {
    console.error('generateVideoAPI Error:', error);
    throw error;
  }
}

