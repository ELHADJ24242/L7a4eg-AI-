import { ChatMessage, ChatSession } from '../types';

export interface ShareDataPayload {
  title: string;
  text: string;
  url?: string;
}

/**
 * Format an individual assistant message into a clean, Mauritanian-branded shareable snippet.
 */
export function formatMessageForSharing(
  content: string,
  userPrompt?: string,
  topicTitle?: string
): string {
  const parts: string[] = [];

  parts.push('🇲🇷 *لحاذگ AI | L7a4eg AI*');
  parts.push('المساعد الذكي لموريتانيا ولسان البيظان');
  parts.push('───────────────');

  if (topicTitle) {
    parts.push(`📌 *الموضوع:* ${topicTitle}`);
  }

  if (userPrompt) {
    parts.push(`💬 *السؤال:* "${userPrompt}"`);
    parts.push('');
  }

  parts.push(`✨ *الإجابة:*`);
  parts.push(content.trim());
  parts.push('');
  parts.push('───────────────');
  parts.push('تمت المشاركة من تطبيق "لحاذگ" (موريتانيا)');

  return parts.join('\n');
}

/**
 * Format a full chat session into an exportable / shareable text transcript.
 */
export function formatSessionForSharing(session: ChatSession): string {
  const parts: string[] = [];

  parts.push('🇲🇷 *ملخص محادثة - لحاذگ AI | L7a4eg AI*');
  parts.push(`📌 *عنوان الجلسة:* ${session.title}`);
  parts.push(`🗓️ *التاريخ:* ${new Date(session.updatedAt || session.createdAt).toLocaleDateString('ar-MR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`);
  parts.push(`🎭 *النمط:* ${session.personaMode === 'hassaniya_expert' ? 'مستشار الحسانية الموريتانية الأصيل' : 'المساعد العام'}`);
  parts.push('═══════════════════════════════');
  parts.push('');

  session.messages.forEach((m, idx) => {
    const isUser = m.role === 'user';
    const sender = isUser ? '👤 السائل' : '🤖 لحاذگ';
    parts.push(`[${m.timestamp}] ${sender}:`);
    parts.push(m.content.trim());
    if (idx < session.messages.length - 1) {
      parts.push('-------------------------------');
    }
  });

  parts.push('');
  parts.push('═══════════════════════════════');
  parts.push('🇲🇷 صُنع لأهل موريتانيا • لحاذگ AI');

  return parts.join('\n');
}

/**
 * Share via native Web Share API if supported.
 */
export async function shareNative(payload: ShareDataPayload): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url || window.location.href,
      });
      return true;
    } catch (err: any) {
      // AbortError is normal when user cancels the share sheet
      if (err.name !== 'AbortError') {
        console.warn('Native share failed:', err);
      }
      return false;
    }
  }
  return false;
}

/**
 * Generate direct WhatsApp share link (dominant channel in Mauritania).
 */
export function getWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

/**
 * Generate direct X (Twitter) share link.
 */
export function getTwitterShareUrl(text: string): string {
  // Twitter allows max ~280 chars in direct web intent, so take excerpt if long
  const excerpt = text.length > 270 ? text.slice(0, 260) + '... #موريتانيا #الحسانية #لحاذگ' : text;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(excerpt)}`;
}

/**
 * Generate direct Facebook share link.
 */
export function getFacebookShareUrl(url?: string): string {
  const target = url || (typeof window !== 'undefined' ? window.location.href : '');
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(target)}`;
}

/**
 * Generate Telegram share link.
 */
export function getTelegramShareUrl(text: string, url?: string): string {
  const target = url || (typeof window !== 'undefined' ? window.location.href : '');
  return `https://t.me/share/url?url=${encodeURIComponent(target)}&text=${encodeURIComponent(text)}`;
}

/**
 * Copy text to clipboard with fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API error, trying execCommand fallback:', err);
  }

  // Fallback for older browsers / iframes
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
}

/**
 * Trigger download of text content as a .txt file.
 */
export function downloadAsTextFile(content: string, filename: string): void {
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download text file failed:', err);
  }
}
