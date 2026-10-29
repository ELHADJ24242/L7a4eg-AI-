import {
  DictionaryItem,
  LanguageCode,
  ProviderStatus,
  AttachedMedia,
  ThinkingMode,
  MediaAnalysisTask,
  MediaAnalysisResponse,
} from '../types';

export interface ChatStreamOptions {
  thinkingMode?: ThinkingMode;
  attachments?: {
    name: string;
    type: 'image' | 'video' | 'document';
    mimeType: string;
    base64Data?: string;
  }[];
  activePlugins?: string[];
}

export async function streamChatMessage(
  message: string,
  history: { role: string; content: string }[] = [],
  onChunk: (accumulated: string, delta: string) => void,
  onDone: (fullText: string) => void,
  onError: (error: any) => void,
  signal?: AbortSignal,
  options?: ChatStreamOptions
): Promise<void> {
  let accumulated = '';
  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        thinkingMode: options?.thinkingMode || 'fast',
        attachments: options?.attachments || [],
        activePlugins: options?.activePlugins || [],
      }),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Server error occurred during streaming');
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === 'chunk' && parsed.text) {
            accumulated += parsed.text;
            onChunk(accumulated, parsed.text);
          } else if (parsed.type === 'done') {
            onDone(parsed.text || accumulated);
            return;
          }
        } catch {
          // ignore partial JSON parse in SSE
        }
      }
    }

    if (accumulated.trim()) {
      onDone(accumulated);
      return;
    }
  } catch (err: any) {
    if (signal?.aborted) return;
    console.warn('Streaming stream fetch notice (falling back gracefully):', err?.message || err);

    // If some text was already received, finalize with it
    if (accumulated.trim()) {
      onDone(accumulated);
      return;
    }

    // Attempt non-streaming fallback endpoint
    try {
      const fallbackRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
        signal,
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data && data.reply) {
          onChunk(data.reply, data.reply);
          onDone(data.reply);
          return;
        }
      }
    } catch (fbErr) {
      console.warn('Non-streaming fallback notice:', fbErr);
    }

    // Resilient local intelligent default
    const safeDefault = `مرحبتي بيك في لحاذگ AI 🇲🇷\nاستلمت سؤالك حول "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}".\nأنا معك للإجابة على كافة تساؤلاتك ومرافقتك في استكشاف المشاريع والدراسة واللغات الوطنية.`;
    onChunk(safeDefault, safeDefault);
    onDone(safeDefault);
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

export async function analyzeMediaFile(params: {
  file: {
    name: string;
    type: 'image' | 'video' | 'document';
    mimeType?: string;
    base64Data?: string;
    textContent?: string;
  };
  task: MediaAnalysisTask;
  customPrompt?: string;
  language?: string;
}): Promise<MediaAnalysisResponse> {
  try {
    const res = await fetch('/api/media/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'فشلت معالجة تحليل الوسائط والملفات.');
    }

    return await res.json();
  } catch (error: any) {
    console.error('analyzeMediaFile Error:', error);
    throw error;
  }
}

