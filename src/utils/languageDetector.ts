/**
 * Intelligent Language & Dialect Detector for L7a4eg AI | لحاذگ
 * Detects dynamically whether an input prompt is written in Hassaniya, French, or Standard Arabic,
 * determines text direction, and provides contextual smart exploration suggestions ("هل تبحث عن...؟").
 */

export type DetectedLanguageType = 'hassaniya' | 'french' | 'arabic';

export interface LanguageDetectionResult {
  detectedLang: DetectedLanguageType;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
  langNameArabic: string;
  langNameNative: string;
  flag: string;
  dir: 'rtl' | 'ltr';
  isDifferentFromCurrent: boolean;
}

// Prominent Mauritanian Hassaniya words, terms, and conversational markers
export const HASSANIYA_KEYWORDS: string[] = [
  // Greetings and common interactions
  'شحالك', 'شحالكم', 'اشحالك', 'لاباس', 'لا باس', 'يخير', 'اش طاري', 'اشخبارك', 'شخبارك',
  'واش طاري', 'سحابه', 'اش كاري', 'أخباركم', 'اش حالك', 'مسيت', 'صبحت', 'مرحبتي',
  // Colloquial Hassaniya particles and pronouns
  'كاع', 'كاعما', 'امنين', 'أمنين', 'يكان', 'ياه كان', 'حك', 'ذوك', 'هاذو', 'هاذوك',
  'ذيك', 'هاذي', 'ياللا', 'يالل', 'صالح', 'منين', 'لاه', 'ماني', 'ماك', 'مانا',
  'اشبه', 'اشبهلي', 'اشبهلك', 'ماكط', 'ما كط', 'كط', 'هون', 'هوني', 'ألا', 'إيلا',
  'أوكيتي', 'بلاهي', 'اتكشمر', 'سح', 'صيكان', 'كمي', 'يا كمي',
  // Cultural, social, and Mauritanian specific vocabulary
  'أزوين', 'ازوين', 'زوين', 'شين', 'كاف', 'طلعة', 'لغن', 'التبراع', 'تبراع',
  'أتاي', 'اتاي', 'مشحر', 'تيفاية', 'التيفاية', 'مارو', 'مارو وحوت', 'مارو والحوت',
  'دراعة', 'دراريع', 'ملحفة', 'البيظان', 'بيظان', 'الشنقيطي', 'شنقيط', 'الشور الشور', 'شور شور',
  // Places & Mauritanian neighborhoods
  'لكصر', 'تفرغ زينة', 'تفرغ-زينة', 'عرفات', 'توجنين', 'السبخة', 'دار النعيم',
  'الترحيل', 'كابيتال', 'انواكشوط', 'نواكشوط', 'انواذيبو', 'نواذيبو', 'روصو', 'كيفة', 'أطار', 'شنقيط'
];

// Common French markers, stopwords, and patterns
export const FRENCH_KEYWORDS: string[] = [
  'bonjour', 'bonsoir', 'salut', 'merci', 'comment', 'pourquoi', 'quand',
  'est-ce', 'pouvez-vous', 'pouvez', 'peux-tu', 'veuillez', 'aidez-moi',
  'traduire', 'traduisez', 'écrire', 'écris', 'rédiger', 'lettre', 'demande',
  'projet', 'mauritanie', 'avec', 'pour', 'dans', 'cette', 'nous', 'vous',
  'je suis', 'j\'ai', 'c\'est', 'qu\'est-ce', 'expliquer', 'résumé', 'bon', 'bien',
  'salut', 's\'il vous plaît', 'bonne', 'travail', 'entreprise', 'prix', 'combien'
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
 * Analyzes an input string to dynamically detect whether it is Hassaniya, French, or Standard Arabic.
 */
export function detectInputLanguage(
  input: string,
  currentLangCode?: string
): LanguageDetectionResult {
  const trimmed = input.trim();
  const normalized = normalizeText(trimmed);
  const words = normalized.split(/\s+/).filter(Boolean);

  // Character count check
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
  const latinRatio = totalLetters > 0 ? latinCharCount / totalLetters : 0;

  // 1. French Detection (Latin script dominance or French trigger words)
  if (latinRatio >= 0.55) {
    const matchedFrenchWords = FRENCH_KEYWORDS.filter(
      (kw) => normalized.includes(kw) || words.includes(kw)
    );

    return {
      detectedLang: 'french',
      confidence: matchedFrenchWords.length > 0 || latinRatio > 0.8 ? 'high' : 'medium',
      matchedKeywords: matchedFrenchWords,
      langNameArabic: 'الفرنسية',
      langNameNative: 'Français',
      flag: '🇫🇷',
      dir: 'ltr',
      isDifferentFromCurrent: currentLangCode !== 'french',
    };
  }

  // 2. Hassaniya Detection (Presence of Mauritanian dialect keywords or idioms)
  const matchedHassaniyaWords = HASSANIYA_KEYWORDS.filter(
    (kw) => normalized.includes(kw) || words.includes(kw)
  );

  if (matchedHassaniyaWords.length > 0) {
    return {
      detectedLang: 'hassaniya',
      confidence: matchedHassaniyaWords.length >= 2 ? 'high' : 'medium',
      matchedKeywords: matchedHassaniyaWords,
      langNameArabic: 'الحسانية الموريتانية',
      langNameNative: 'الحسانية 🇲🇷',
      flag: '🇲🇷',
      dir: 'rtl',
      isDifferentFromCurrent: currentLangCode !== 'hassaniya',
    };
  }

  // 3. Modern Standard Arabic (Fallback for Arabic text)
  return {
    detectedLang: 'arabic',
    confidence: 'high',
    matchedKeywords: [],
    langNameArabic: 'العربية الفصحى',
    langNameNative: 'العربية الفصحى',
    flag: '🇸🇦',
    dir: 'rtl',
    isDifferentFromCurrent: currentLangCode !== 'arabic',
  };
}

export interface SmartSuggestionItem {
  id: string;
  label: string;
  query: string;
  category: 'hassaniya' | 'translation' | 'proverbs' | 'culture' | 'business' | 'admin' | 'dictionary';
  icon: string;
}

/**
 * Intelligent context-aware suggestions generator ("هل تبحث عن...؟")
 * Dynamically presents relevant next-step prompts based on the current context or query.
 */
export function getSmartExplorations(lastMessageText?: string): SmartSuggestionItem[] {
  if (!lastMessageText || !lastMessageText.trim()) {
    // Default smart discovery exploration pills
    return [
      {
        id: 'trans-3way',
        label: 'ترجمة ثلاثية فورية',
        query: 'ترجم للحسانية والفرنسية والفصحى: "مرحباً بكم، سعدت بلقائكم وسنزوركم قريباً"',
        category: 'translation',
        icon: '🔄',
      },
      {
        id: 'proverb-chour',
        label: 'أمثال وحِكَم حسانية',
        query: 'ما معنى المثل الحساني: "الشور الشور ما يسبك حد والزربة ما فيها خير"؟ وما سياقه؟',
        category: 'proverbs',
        icon: '📜',
      },
      {
        id: 'atay-ritual',
        label: 'طقس أتاي والجيمات الثلاث',
        query: 'اشرح لي طقوس الشاي الموريتاني (أتاي مشحر) والجيمات الثلاث لطلب كأس شاي بآداب المجلس',
        category: 'culture',
        icon: '☕',
      },
      {
        id: 'tifaya-startup',
        label: 'ريادة الأعمال والتيفاية',
        query: 'كيف أبدأ "تيفاية" (مشروع تجاري حر) ناجحة في انواكشوط برأس مال بسيط؟',
        category: 'business',
        icon: '💼',
      },
      {
        id: 'official-letter',
        label: 'صياغة طلب خطي إداري',
        query: 'اكتب لي نموذج طلب خطي رسمي موريتاني موجه إلى الوالي أو الوزارة بصيغة إدارية رصينة',
        category: 'admin',
        icon: '📄',
      },
      {
        id: 'dictionary-search',
        label: 'شرح كلمات البيظان',
        query: 'اشرح لي بالتفصيل معاني هذه الكلمات الحسانية: (كاع، حك، يكان، كمي، أزوين)',
        category: 'dictionary',
        icon: '📖',
      },
    ];
  }

  const lower = lastMessageText.toLowerCase();

  // If discussing greetings
  if (lower.includes('شحالك') || lower.includes('لاباس') || lower.includes('bonjour') || lower.includes('salut')) {
    return [
      {
        id: 'greet-reply',
        label: 'رد التحية بلسان البيظان',
        query: 'كيف أرد على التحية الحسانية بأفصح عبارات الترحيب والدعاء لأهل الدار؟',
        category: 'hassaniya',
        icon: '🇲🇷',
      },
      {
        id: 'greet-trans',
        label: 'ترجمة التحايا بالفرنسية',
        query: 'Comment traduire les salutations chaleureuses hassaniyas en français poli ?',
        category: 'translation',
        icon: '🇫🇷',
      },
      {
        id: 'greet-proverb',
        label: 'مثل في الصداقة والمودة',
        query: 'أعطني مثلاً حسانياً بليغاً عن الصديق والرفيق والوفاء',
        category: 'proverbs',
        icon: '📜',
      },
    ];
  }

  // If discussing tea or culture
  if (lower.includes('أتاي') || lower.includes('اتاي') || lower.includes('شاي') || lower.includes('كأس')) {
    return [
      {
        id: 'atay-cups',
        label: 'دلالة الكؤوس الثلاثة',
        query: 'ما هي حكمة ودلالة كل كأس من الكؤوس الثلاثة في طقس الشاي الموريتاني؟',
        category: 'culture',
        icon: '☕',
      },
      {
        id: 'atay-trans',
        label: 'وصف طقس الشاي بالفرنسية',
        query: 'Décris en français le rituel traditionnel du thé mauritanien pour un touriste étranger',
        category: 'translation',
        icon: '🇫🇷',
      },
    ];
  }

  // If discussing translation
  if (lower.includes('ترجم') || lower.includes('فرنسي') || lower.includes('traduire') || lower.includes('français')) {
    return [
      {
        id: 'trans-commercial',
        label: 'ترجمة عقد أو صفقة تجارية',
        query: 'ترجم للحسانية والفصحى والفرنسية: "تم الاتفاق على السعر النهائي والتسليم غداً صباحاً"',
        category: 'translation',
        icon: '🔄',
      },
      {
        id: 'trans-cultural',
        label: 'ترجمة التعبيرات المجازية',
        query: 'كيف نترجم العبارة الحسانية "هو لاهي يفتح تيفاية زوينة والشور الشور كل شي يتم"؟',
        category: 'translation',
        icon: '🇲🇷',
      },
    ];
  }

  // If discussing business or administration
  if (lower.includes('مشروع') || lower.includes('تجارة') || lower.includes('طلب') || lower.includes('عمل') || lower.includes('تيفاية')) {
    return [
      {
        id: 'biz-whatsapp',
        label: 'صياغة إعلان واتساب تجاري',
        query: 'اكتب لي إعلاناً تسويقياً جذاباً للواتساب يستهدف الزبائن في انواكشوط بحسانية عصرية',
        category: 'business',
        icon: '📱',
      },
      {
        id: 'admin-request',
        label: 'طلب تدريب أو توظيف',
        query: 'صغ لي رسالة دافع رسمية (Lettre de motivation) بالفرنسية لتقديمها لشركة في موريتانيا',
        category: 'admin',
        icon: '📄',
      },
    ];
  }

  // General contextual suggestions
  return [
    {
      id: 'gen-more',
      label: 'تفصيل أكثر وشرح سياقي',
      query: 'هل يمكنك التوسع في هذا الشرح مع إعطاء أمثلة واقعية من الحياة اليومية في موريتانيا؟',
      category: 'culture',
      icon: '💡',
    },
    {
      id: 'gen-trans',
      label: 'ترجمة الرد إلى الفرنسية',
      query: 'Traduisez la réponse précédente en français clair et élégant',
      category: 'translation',
      icon: '🇫🇷',
    },
    {
      id: 'gen-proverb',
      label: 'مثل حساني يناسب الموضوع',
      query: 'هل يوجد مثل حساني بليغ أو حكمة من لسان البيظان ترتبط بهذا الموضوع؟',
      category: 'proverbs',
      icon: '📜',
    },
  ];
}
