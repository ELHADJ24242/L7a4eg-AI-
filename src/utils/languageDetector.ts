/**
 * Language Detector for L7a4eg AI | لحاذگ
 * Detects whether an input prompt is written in French, Hassaniya Arabic, or Modern Standard Arabic.
 */

export interface LanguageDetectionResult {
  detectedLang: 'hassaniya' | 'arabic' | 'french' | null;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
  langNameArabic: string;
  langNameNative: string;
  isDifferentFromCurrent: boolean;
}

// Prominent Mauritanian Hassaniya words, terms, and conversational markers
export const HASSANIYA_KEYWORDS: string[] = [
  // Greetings and common interactions
  'شحالك', 'شحالكم', 'اشحالك', 'لاباس', 'لا باس', 'يخير', 'اش طاري', 'اشخبارك', 'شخبارك',
  'واش طاري', 'سحابه', 'اش كاري', 'أخباركم', 'اش حالك',
  // Colloquial Hassaniya particles and pronouns
  'كاع', 'كاعما', 'امنين', 'أمنين', 'يكان', 'ياه كان', 'حك', 'ذوك', 'هاذو', 'هاذوك',
  'ذيك', 'هاذي', 'ياللا', 'يالل', 'صالح', 'منين', 'لاه', 'ماني', 'ماك', 'مانا',
  'اشبه', 'اشبهلي', 'اشبهلك', 'ماكط', 'ما كط', 'كط', 'هون', 'هوني', 'ألا', 'إيلا',
  'أوكيتي', 'بلاهي', 'اتكشمر', 'سح', 'صيكان',
  // Cultural, social, and Mauritanian specific vocabulary
  'أزوين', 'ازوين', 'زوين', 'شين', 'كاف', 'طلعة', 'لغن', 'التبراع', 'تبراع',
  'أتاي', 'اتاي', 'مشحر', 'تيفاية', 'مارو', 'مارو وحوت', 'دراعة', 'دراريع', 'ملحفة',
  // Places & Mauritanian neighborhoods
  'لكصر', 'تفرغ زينة', 'تفرغ-زينة', 'عرفات', 'توجنين', 'السبخة', 'دار النعيم',
  'الترحيل', 'كابيتال', 'انواكشوط', 'نواكشوط', 'انواذيبو', 'نواذيبو', 'روصو', 'كيفة', 'أطار'
];

// Common French markers, stopwords, and patterns
export const FRENCH_KEYWORDS: string[] = [
  'bonjour', 'bonsoir', 'salut', 'merci', 'comment', 'pourquoi', 'quand',
  'est-ce', 'pouvez-vous', 'pouvez', 'peux-tu', 'veuillez', 'aidez-moi',
  'traduire', 'traduisez', 'écrire', 'écris', 'rédiger', 'lettre', 'demande',
  'projet', 'mauritanie', 'avec', 'pour', 'dans', 'cette', 'cette', 'nous', 'vous',
  'je suis', 'j\'ai', 'c\'est', 'qu\'est-ce', 'expliquer', 'résumé', 'bon', 'bien'
];

/**
 * Normalizes text for keyword matching: strips punctuation and standardizes spaces.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»،؟؛]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analyzes an input string to detect if it's French, Hassaniya, or Standard Arabic.
 */
export function detectInputLanguage(
  input: string,
  currentLangCode?: string
): LanguageDetectionResult | null {
  const trimmed = input.trim();
  if (trimmed.length < 3) {
    return null; // Too short to reliably detect
  }

  const normalized = normalizeText(trimmed);
  const words = normalized.split(/\s+/).filter(Boolean);

  // 1. Script character count
  let arabicCharCount = 0;
  let latinCharCount = 0;

  for (const char of trimmed) {
    if (/[\u0600-\u06FF]/.test(char)) {
      arabicCharCount++;
    } else if (/[a-zA-ZÀ-ÿ]/.test(char)) {
      latinCharCount++;
    }
  }

  const totalLetters = arabicCharCount + latinCharCount;
  if (totalLetters === 0) {
    return null;
  }

  // Ratio calculation
  const latinRatio = latinCharCount / totalLetters;
  const arabicRatio = arabicCharCount / totalLetters;

  // 2. French Detection Check (Strong Latin dominance)
  if (latinRatio >= 0.6) {
    const matchedFrenchWords = FRENCH_KEYWORDS.filter(
      (kw) => normalized.includes(kw) || words.includes(kw)
    );

    const hasFrenchAccents = /[éèêàâçùôîëï]/.test(trimmed);
    const confidence =
      matchedFrenchWords.length >= 2 || (matchedFrenchWords.length >= 1 && hasFrenchAccents) || latinRatio > 0.85
        ? 'high'
        : matchedFrenchWords.length === 1
        ? 'medium'
        : 'low';

    return {
      detectedLang: 'french',
      confidence,
      matchedKeywords: matchedFrenchWords,
      langNameArabic: 'الفرنسية',
      langNameNative: 'Français',
      isDifferentFromCurrent: currentLangCode !== 'french',
    };
  }

  // 3. Arabic Script Check (Arabic characters dominance)
  if (arabicRatio >= 0.5) {
    // Check for Hassaniya specific markers and vocabulary
    const matchedHassaniya: string[] = [];

    for (const keyword of HASSANIYA_KEYWORDS) {
      // Check full word match or exact substring in phrase
      const pattern = new RegExp(`(^|\\s)${keyword}(\\s|$)`, 'i');
      if (pattern.test(normalized) || normalized.includes(keyword)) {
        matchedHassaniya.push(keyword);
      }
    }

    if (matchedHassaniya.length > 0) {
      return {
        detectedLang: 'hassaniya',
        confidence: matchedHassaniya.length >= 2 ? 'high' : 'medium',
        matchedKeywords: matchedHassaniya,
        langNameArabic: 'اللهجة الحسانية',
        langNameNative: 'الحسانية الموريتانية',
        isDifferentFromCurrent: currentLangCode !== 'hassaniya',
      };
    }

    // Default Arabic script without Hassaniya markers -> Standard Arabic
    // Only flag change if current is not already arabic (or hassaniya, depending on context)
    return {
      detectedLang: 'arabic',
      confidence: arabicRatio > 0.8 && words.length >= 2 ? 'high' : 'medium',
      matchedKeywords: [],
      langNameArabic: 'العربية الفصحى',
      langNameNative: 'العربية الفصحى',
      isDifferentFromCurrent: currentLangCode !== 'arabic',
    };
  }

  return null;
}
