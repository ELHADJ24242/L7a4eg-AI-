/**
 * Phonetic Normalizer & Error Corrector for Speech-to-Text in L7a4eg AI | لحاذگ
 * Corrects typical transcription anomalies and phonetic discrepancies when speaking
 * Mauritanian Hassaniya, French, or Maghrebi Arabic into browser speech recognition engines.
 */

export interface SpeechCorrectionResult {
  originalText: string;
  correctedText: string;
  appliedCorrections: { original: string; corrected: string; reason: string }[];
  detectedDialectHint: 'hassaniya' | 'french' | 'arabic';
}

// Common speech-to-text phonetic mishearings in Mauritanian Arabic / Hassaniya
const HASSANIYA_PHONETIC_REPLACEMENTS: [RegExp, string, string][] = [
  // Greetings & state
  [/\b(شح\s*الك|اش\s*حالك|شحارك|شو\s*حالك)\b/gi, 'شحالك', 'تصحيح التحية الحسانية (شحالك)'],
  [/\b(شح\s*الكم|اش\s*حالكم|شو\s*حالكم)\b/gi, 'شحالكم', 'تصحيح التحية الحسانية للجماعة (شحالكم)'],
  [/\b(لا\s*باس|لباس\s*عليك|لا\s*باس\s*عليك)\b/gi, 'لاباس عليك', 'تصحيح عبارة السؤال عن الحال (لاباس عليك)'],
  [/\b(يا\s*خير|يخر)\b/gi, 'يخير', 'تصحيح الرد الحساني (يخير)'],
  [/\b(واش\s*طاري|اش\s*طاري|اشطاري)\b/gi, 'اش طاري', 'تصحيح السؤال عن المستجدات (اش طاري)'],
  [/\b(اش\s*كاري|اشكاري)\b/gi, 'اش كاري', 'تصحيح العبارة الحسانية (اش كاري)'],
  [/\b(ما\s*طاري\s*ل\s*باس|ما\s*طاري\s*لباس)\b/gi, 'ما طاري لاباس', 'تصحيح عبارة الاطمئنان الحسانية'],
  [/\b(سحابه\s*الخير|سحابك\s*الخير)\b/gi, 'سحابك الخير', 'تصحيح الدعاء الحساني بالخير'],
  [/\b(أهل\s*دارك\s*يخير|اهل\s*الدار\s*اياك\s*يا\s*خير|اهل\s*الدار\s*يا\s*خير|اهل\s*دارك\s*يخير)\b/gi, 'أهل الدار إياك بخير', 'تصحيح عبارة الاطمئنان الحسانية الأصيلة (أهل الدار إياك بخير)'],

  // Core Hassaniya particles & pronouns
  [/\b(الشور\s*الشور|الشور\s*شور|عشور\s*عشور|الشر\s*الشر|اشور\s*اشور|بالشور\s*شور|بلشور\s*بلشور)\b/gi, 'بالشور بالشور', 'تصحيح العبارة والحكمة الحسانية الأصيلة (بالشور بالشور)'],
  [/\b(قاع|كع|جاع)\b/gi, 'كاع', 'تصحيح أداة النفي والتأكيد الحسانية (كاع)'],
  [/\b(يا\s*كان|اي\s*كان)\b/gi, 'يكان', 'تصحيح أداة الاستفهام الحسانية (يكان)'],
  [/\b(قمي|كلمي)\b/gi, 'كمي', 'تصحيح مناداة الرفيق المقرب بالحسانية (يا كمي)'],
  [/\b(تفاية|تفاحية|التفاية)\b/gi, 'التيفاية', 'تصحيح مصطلح التجارة الحرة الموريتانية (التيفاية)'],
  [/\b(ازوين|ازوينة|زوين|زوينة)\b/gi, 'أزوين', 'تصحيح صفة الجمال والمدح بالحسانية (أزوين)'],
  [/\b(زين\s*طاف|زينطاف)\b/gi, 'زين طاف', 'تصحيح المبالغة في الاستحسان (زين طاف)'],
  [/\b(اتاي|التاي|آتاني)\b/gi, 'أتاي', 'تصحيح طقس الشاي الموريتاني (أتاي)'],
  [/\b(مشخر)\b/gi, 'مشحر', 'تصحيح صفة الشاي المحكم الإعداد (مشحر)'],
  [/\b(بيضان|بيزان|البضان)\b/gi, 'البيظان', 'تصحيح لسان وتراث البيظان'],
  [/\b(مار\s*والحوت|مر\s*والحوت|مرو\s*والحوت)\b/gi, 'مارو والحوت', 'تصحيح الأكلة الموريتانية الشهيرة (مارو والحوت)'],
  [/\b(دراعه|دراريع)\b/gi, 'دراعة', 'تصحيح الزي الموريتاني التقليدي للرجال'],
  [/\b(ملحفه)\b/gi, 'ملحفة', 'تصحيح الزي الموريتاني التقليدي للنساء'],

  // Locations in Mauritania
  [/\b(نواكشوط|انوكشوط)\b/gi, 'انواكشوط', 'ضبط رسم العاصمة الموريتانية (انواكشوط)'],
  [/\b(نواذيبو|نواديبو)\b/gi, 'انواذيبو', 'ضبط رسم العاصمة الاقتصادية (انواذيبو)'],
  [/\b(لكصر|القصر)\b/gi, 'لكصر', 'ضبط اسم مقاطعة لكصر التاريخية'],
  [/\b(تفرغ\s*زينة|تفرغزينة)\b/gi, 'تفرغ زينة', 'ضبط اسم حي تفرغ زينة'],
  [/\b(شنقيط|شنقيطي)\b/gi, 'شنقيط', 'ضبط اسم مدينة شنقيط التاريخية'],
];

// French common speech recognition mishearings in Mauritanian / Francophone context
const FRENCH_PHONETIC_REPLACEMENTS: [RegExp, string, string][] = [
  [/\b(coment|coman)\b/gi, 'comment', 'Correction orthographe française (comment)'],
  [/\b(bon jur|bonjourr)\b/gi, 'bonjour', 'Correction salutation (bonjour)'],
  [/\b(merci bcp|merci boukou)\b/gi, 'merci beaucoup', 'Correction remerciement'],
  [/\b(c est quoi|ses quoi|c quoi)\b/gi, "qu'est-ce que", 'Clarification syntaxique française'],
  [/\b(nouakchot|nouakchotte)\b/gi, 'Nouakchott', 'Orthographe correcte Nouakchott'],
  [/\b(nouadibu|nouadibou)\b/gi, 'Nouadhibou', 'Orthographe correcte Nouadhibou'],
];

/**
 * Corrects speech-to-text transcription by applying phonetic and dialect rules.
 */
export function correctSpeechTranscript(rawTranscript: string): SpeechCorrectionResult {
  if (!rawTranscript || !rawTranscript.trim()) {
    return {
      originalText: '',
      correctedText: '',
      appliedCorrections: [],
      detectedDialectHint: 'hassaniya',
    };
  }

  let text = rawTranscript.trim();
  const appliedCorrections: { original: string; corrected: string; reason: string }[] = [];

  // 1. Detect if primarily French or Arabic/Hassaniya
  const hasLatinLetters = /[a-zA-ZÀ-ÿ]/.test(text);
  const hasArabicLetters = /[\u0600-\u06FF]/.test(text);

  let detectedDialectHint: 'hassaniya' | 'french' | 'arabic' = 'hassaniya';

  if (hasLatinLetters && !hasArabicLetters) {
    detectedDialectHint = 'french';
    // Apply French corrections
    for (const [pattern, replacement, reason] of FRENCH_PHONETIC_REPLACEMENTS) {
      if (pattern.test(text)) {
        const matched = text.match(pattern)?.[0] || '';
        text = text.replace(pattern, replacement);
        appliedCorrections.push({
          original: matched,
          corrected: replacement,
          reason,
        });
      }
    }
  } else {
    // Apply Hassaniya and Mauritanian Arabic phonetic corrections
    for (const [pattern, replacement, reason] of HASSANIYA_PHONETIC_REPLACEMENTS) {
      if (pattern.test(text)) {
        const matched = text.match(pattern)?.[0] || '';
        text = text.replace(pattern, replacement);
        appliedCorrections.push({
          original: matched,
          corrected: replacement,
          reason,
        });
      }
    }

    // Distinguish if Hassaniya keywords matched
    if (appliedCorrections.length > 0) {
      detectedDialectHint = 'hassaniya';
    } else {
      detectedDialectHint = 'arabic';
    }
  }

  // Normalize duplicate spaces
  text = text.replace(/\s+/g, ' ').trim();

  return {
    originalText: rawTranscript,
    correctedText: text,
    appliedCorrections,
    detectedDialectHint,
  };
}
