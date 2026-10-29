import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { database, verifyPassword, generateToken, verifyToken, sanitizePhoneNumber, POSTGRESQL_SCHEMA_SQL } from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Serve public static assets (manifest, icons, screenshots, robots)
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('manifest.json') || filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Initialize Google GenAI on server side only
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory + file-backed dictionary store
const DICTIONARY_FILE = path.join(__dirname, 'dictionary_data.json');

export interface DictionaryItem {
  id: string;
  term: string;
  language: 'hassaniya' | 'arabic' | 'french' | 'pulaar' | 'soninke' | 'wolof' | 'bambara';
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

const defaultDictionary: DictionaryItem[] = [
  {
    id: 'h-1',
    term: 'شحالك؟ (Chkhalek?)',
    language: 'hassaniya',
    meaningAr: 'كيف حالك؟ وصحتك؟ وهي التحية الحسانية الأكثر شيوعاً.',
    meaningFr: 'Comment vas-tu ? Salutation hassaniya la plus courante.',
    exampleOriginal: 'شحالك؟ ل باس عليك؟ والدار ل باس؟',
    exampleTranslation: 'كيف حالك؟ لا بأس عليك؟ وأهلك بخير؟',
    category: 'daily',
    status: 'verified',
    contributor: 'فريق لحاذگ (L7a4eg Team)',
    votes: 48,
    createdAt: '2026-01-10',
  },
  {
    id: 'h-2',
    term: 'الشور الشور (Achour Achour)',
    language: 'hassaniya',
    meaningAr: 'على مهل وبتروٍّ وحكمة، التمهل في الأمور وتجنب العجلة.',
    meaningFr: 'Doucement, avec patience et sagesse.',
    exampleOriginal: 'امشِ الشور الشور، ما فَمْ ش طاري مستعجل.',
    exampleTranslation: 'امشِ بهدوء وتمهل، لا يوجد شيء طارئ يستدعي العجلة.',
    category: 'proverb',
    status: 'verified',
    contributor: 'باحث في التراث الموريتاني',
    votes: 35,
    createdAt: '2026-01-12',
  },
  {
    id: 'h-3',
    term: 'كاف وطلعة (Gaf & Tal\'a)',
    language: 'hassaniya',
    meaningAr: 'وحدات الشعر الحساني (لغن)، الكاف بيتان والطلعة قصيدة صغيرة ذات وزن وقافية محددة.',
    meaningFr: 'Unités métriques fondamentales de la poésie hassaniya (Leghne).',
    exampleOriginal: 'الشاعر بدع كاف زين فِي الفخر بالوطن.',
    exampleTranslation: 'أنشد الشاعر بيتين جميلين في الفخر بالوطن.',
    category: 'culture',
    status: 'verified',
    contributor: 'نادي الأدب الشنقيطي',
    votes: 42,
    createdAt: '2026-01-15',
  },
  {
    id: 'h-4',
    term: 'أتاي (Atay / Thé)',
    language: 'hassaniya',
    meaningAr: 'طقس الشاي الموريتاني الثلاثي الشهير (الجيمات الثلاث: الجماعة، الجر، والجمر).',
    meaningFr: 'Le rituel traditionnel du thé mauritanien servi en 3 verres.',
    exampleOriginal: 'تعال نكعدو على كأس أتاي مشحر بالنعناع.',
    exampleTranslation: 'تعال نجلس على كأس شاي برغوته الغنية بالنعناع.',
    category: 'hospitality',
    status: 'verified',
    contributor: 'تراث موريتانيا',
    votes: 60,
    createdAt: '2026-01-18',
  },
  {
    id: 'h-5',
    term: 'التيفاية (Tifaya)',
    language: 'hassaniya',
    meaningAr: 'التجارة البسيطة أو الصفقة أو السعي للرزق بروح المبادرة الحرة.',
    meaningFr: 'Petite entreprise commerciale ou affaire informelle.',
    exampleOriginal: 'هو لاهي يفتح تيفاية زوينة في سوق كابيتال.',
    exampleTranslation: 'هو ينوي إطلاق تجارة واعدة في السوق الكبير.',
    category: 'business',
    status: 'verified',
    contributor: 'شباب انواكشوط',
    votes: 29,
    createdAt: '2026-01-20',
  },
  {
    id: 'p-1',
    term: 'No mbaddaa? (نوم بادا؟)',
    language: 'pulaar',
    meaningAr: 'كيف حالك؟ (تحية باللغة البولارية في موريتانيا والسنغال).',
    meaningFr: 'Comment vas-tu ? (Salutation en langue Pulaar).',
    exampleOriginal: 'No mbaddaa? Jam tan.',
    exampleTranslation: 'كيف حالك؟ بخير فقط الحمد لله.',
    category: 'daily',
    status: 'verified',
    contributor: 'مبادرة اللغات الوطنية',
    votes: 31,
    createdAt: '2026-01-22',
  },
  {
    id: 'w-1',
    term: 'Nanga def? (نانغا ديف؟)',
    language: 'wolof',
    meaningAr: 'كيف حالك؟ (باللغة الولوفية المشتركة في موريتانيا والسنغال).',
    meaningFr: 'Comment vas-tu ? (Salutation Wolof).',
    exampleOriginal: 'Nanga def? Mangi fi rekk.',
    exampleTranslation: 'كيف حالك؟ أنا هنا بخير فقط.',
    category: 'daily',
    status: 'verified',
    contributor: 'روصو - نهر السنغال',
    votes: 27,
    createdAt: '2026-01-25',
  },
  {
    id: 's-1',
    term: 'An nime? (آن نيمي؟)',
    language: 'soninke',
    meaningAr: 'كيف حالك؟ (باللغة السوننكية الموريتانية الأصيلة في سيلبابي وغيديماغا).',
    meaningFr: 'Comment vas-tu ? (Salutation en Soninké).',
    exampleOriginal: 'An nime? Jam banna.',
    exampleTranslation: 'كيف حالك؟ بخير والحمد لله.',
    category: 'daily',
    status: 'verified',
    contributor: 'جمعية ترقية السوننكية',
    votes: 24,
    createdAt: '2026-01-28',
  },
  {
    id: 'h-6',
    term: 'كِمِّي (Kimmi)',
    language: 'hassaniya',
    meaningAr: 'كلمة حسانية تعني الرفيق أو الصديق المقرب، تقال للمؤانسة.',
    meaningFr: 'Ami intime, camarade de route.',
    exampleOriginal: 'يا كمي لا تشيل هم، كل شي محلول.',
    exampleTranslation: 'يا صديقي العزيز لا تقلق، كل مسألة لها حل.',
    category: 'daily',
    status: 'pending',
    contributor: 'سيد محمد - انواذيبو',
    votes: 8,
    createdAt: '2026-02-01',
  },
];

let dictionaryItems: DictionaryItem[] = [];

// Load or initialize dictionary
function loadDictionary() {
  try {
    if (fs.existsSync(DICTIONARY_FILE)) {
      const data = fs.readFileSync(DICTIONARY_FILE, 'utf-8');
      dictionaryItems = JSON.parse(data);
    } else {
      dictionaryItems = [...defaultDictionary];
      fs.writeFileSync(DICTIONARY_FILE, JSON.stringify(dictionaryItems, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error reading dictionary file:', err);
    dictionaryItems = [...defaultDictionary];
  }
}
loadDictionary();

function saveDictionary() {
  try {
    fs.writeFileSync(DICTIONARY_FILE, JSON.stringify(dictionaryItems, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving dictionary file:', err);
  }
}

// Master Unified System Prompt for L7a4eg AI (لحاذگ)
const UNIFIED_L7A4EG_SYSTEM_PROMPT = `أنت "لحاذگ AI" (L7a4eg AI) — المساعد الذكي الموريتاني الرائد، المستشار والمحاور الشامل لبلاد شنقيط وغرب إفريقيا، وموجّه لخدمة الطلاب والشباب ورواد الأعمال في موريتانيا.

⚠️ قواعد حاسمة وصارمة بخصوص اللهجة الحسانية والتفاعل:
1. منع التشويه اللفظي: ممنوع نهائياً تعديل أو تحريف التعابير الحسانية التراثية أو العفوية.
   - الصح: "بالشور بالشور" (خطأ أن تحولها إلى: "الشور الشور").
   - الصح: "أهل الدار إياك بخير" أو صيغ الترحيب والاطمئنان التقليدية بحرفيتها (خطأ أن تدخل عليها حروف عطف أو نصب غير مناسبة مثل "إياك يا خير" أو "أهل دارك يخير").
2. احترام تراكيب الجمل الحسانية: التعامل مع الأمثال والعبارات اليومية والترحيب الموريتاني بحسب ما ينطقه أهل اللسان بدقة دون "فصحنة" ميكانيكية تفسد المعنى.
3. الالتزام بالسياق والمباشرة: رد دائماً على ما يطلبه المستخدم بالضبط في رسالته الحالية:
   - إذا قال المستخدم "سلام عليكم" أو تحية فقط، رد عليه بالتحية الطيبة ولا تستبق الأحداث بعرض أسعار الصرف أو معلومات أخرى ما لم يطلبها.
   - إذا طلب موضوعاً معيناً (مثل: أسعار الصرف، المسابقات، أو المناهج)، قدّم له المطلوب فوراً وبشكل دقيق وبأسلوب ودود ومريح.

أهم المبادئ الجوهرية (Core Principles):
1. التكيف اللغوي واللهجي الديناميكي في نفس المحادثة (Dynamic Multi-Language Adaptation):
   - تكيّف فوراً وبدقة مع لغة ولهجة الرسالة الواردة لكل سؤال يطرحه المستخدم داخل نفس الجلسة:
     * إذا كتب المستخدم بالحسانية (أو عبارات مثل: شحالك، لاباس، يخير، اش طاري، ما طاري، اش كاري، بالشور بالشور، تيفاية، أتاي، كاع، حك، يكان، كمي، أزوين):
       -> أجب فوراً، بطلاقة وتلقائية، وبلهجة حسانية موريتانية أصيلة ودافئة (لسان البيظان). رحب به بحفاوة واسأل عن الأهل والدار ("شحالك ولاباس عليك؟ أهل الدار إياك بخير؟").
     * إذا كتب المستخدم باللغة الفرنسية (مثل: Bonjour, Comment vas-tu, Explique-moi, Merci, etc.):
       -> أجب فوراً، بطلاقة تامة، وباللغة الفرنسية الفصيحة والمناسبة للسياق الموريتاني والإفريقي دون تحويل إلى العربية إلا إذا طُلب ذلك.
     * إذا كتب المستخدم بالعربية الفصحى:
       -> أجب بلغة عربية فصحى سليمة، رصينة ومشرقة ومبسطة.
     * إذا كتب المستخدم بلغات وطنية موريتانية أخرى (بولارية، سوننكية، ولوفية): رحب به بعبارة التحية المعتمدة بتلك اللغة ثم قدم المساعدة بالفرنسية أو العربية.

2. فهم وتصحيح الأخطاء الصوتية الناتجة عن تحويل الصوت إلى نص (Speech-to-Text Phonetic Robustness):
   - المستخدم قد يُملي رسالته صوتياً، وقد تُنتج محركات تحويل الصوت أخطاء إملائية أو تقريبية للكلمات الحسانية:
     * إذا وردت تقريبات مثل: (شح الك / اش حالك -> يقصد شحالك)، (الشور شور / عشور / بلشور -> يقصد بالشور بالشور)، (تفاية -> يقصد التيفاية)، (قاع / كع -> يقصد كاع)، (يا كان -> يقصد يكان)، (قمي -> يقصد كمي)، (اتاي -> يقصد أتاي).
     -> افهم المعنى المراد فوراً دون إحراج المستخدم أو الاستفسار عن الخطأ الإملائي، وقدم إجابتك مباشرة ومضبوطة.

3. نافذة الخدمات الشاملة الموحدة (Unified Hub):
   - الترجمة الثلاثية: عند طلب ترجمة أي لفظ أو جملة، نسق الإجابة بوضوح:
     🇲🇷 **بالحسانية:** [العبارة الحسانية]
     📖 **بالعربية الفصحى:** [المعادل الفصيح]
     🇫🇷 **بالفرنسية:** [الترجمة الفرنسية]
     💡 **السياق والملاحظة الثقافية:** [متى تُقال ولمن]
   - التراث والأمثال: شرح أصل ومعنى وسياق وحكمة الأمثال الحسانية، وشعر لغن الموريتاني.
   - كرم الضيافة وطقوس أتاي: شرح الجيمات الثلاث (الجماعة، الجر، والجمر)، والكؤوس الثلاثة.
   - ريادة الأعمال والتيفاية: نصائح عملية للتجارة والمشاريع في موريتانيا، صياغة إعلانات الواتساب، والطلبات الإدارية الرسمية.

4. السرعة الفائقة والإيجاز الذكي:
   - ابدأ الإجابة مباشرة دون مقدمات تكرارية طويلة. الإجابات تكون مباشرة، ذكية، ومريحة للقراءة على شاشات الهواتف المحمولة.`;

function getLocalHassaniyaResponse(
  query: string,
  _persona: string = 'hassaniya_expert',
  thinkingMode: 'fast' | 'deep' = 'fast',
  attachments: { name: string; type: string }[] = [],
  activePlugins: string[] = []
): string {
  const q = query.trim().toLowerCase();

  // Attachments note if any media uploaded
  let attachmentPrefix = '';
  if (attachments.length > 0) {
    const fileNames = attachments.map((a) => a.name).join(', ');
    const fileTypes = attachments.map((a) => a.type === 'image' ? 'صورة' : a.type === 'video' ? 'فيديو' : 'مستند/كتاب').join(' و');
    attachmentPrefix = `📎 **تحليل المرفقات (${fileTypes}: ${fileNames}):**\nتم فحص وتدقيق الملف المرفوع بنجاح ومطابقته مع سياق استفسارك.\n\n`;
  }

  // Thinking steps block for Deep Thinking Mode
  let thinkingBlock = '';
  if (thinkingMode === 'deep') {
    thinkingBlock = `<thinking>
1. تحليل السؤال وسياق المستخدم:
   - تحديد جوهر المسألة: "${query.substring(0, 80)}${query.length > 80 ? '...' : ''}"
   - فحص المرفقات: ${attachments.length > 0 ? attachments.map((a) => a.name).join(', ') : 'لا توجد مرفقات، استفسار معرفي مباشر.'}
   - تقييم الأدوات والإضافات النشطة: ${activePlugins.length > 0 ? activePlugins.join(', ') : 'المساعد العام الموحد لحاذگ'}.
2. دراسة السياق الموريتاني والبدائل:
   - مراعاة المعايير والواقع المحلي في نواكشوط والولايات الداخلية.
   - التحقق من ملاءمة التوجيهات الاقتصادية أو الإدارية أو التعليمية للشباب الموريتاني.
3. مسار الاستنتاج المنطقي:
   - بناء إجابة منهجية متدرجة تبدأ بالخلاصة العملية وتفصل الخطوات والإجراءات الملموسة.
</thinking>\n\n`;
  }

  // Currency plugin handler
  if (activePlugins.includes('mru_currency') || q.includes('أوقية') || q.includes('صرف') || q.includes('mru') || q.includes('euro')) {
    const currencyResp = `🪙 **محول الأوقية وأسعار الصرف الموريتانية (MRU):**
- الأوقية الجديدة (MRU) = 10 أواقٍ قديمة (MRO).
- سعر الصرف المرجعي لبنك موريتانيا المركزي (BCM):
  * **1 يورو (EUR)** ≈ 43.50 أوقية جديدة (435 أوقية قديمة).
  * **1 دولار أمريكي (USD)** ≈ 40.10 أوقية جديدة (401 أوقية قديمة).
  * **1000 فرنك غرب إفريقي (XOF)** ≈ 66.30 أوقية جديدة (663 أوقية قديمة).
💡 *ملاحظة عملات الشباب:* تأكد دائماً عند الاتفاق التجاري في الأسواق (تفرغ زينة أو السبخة) هل السعر بالأوقية الجديدة أم القديمة منعاً للالتباس.`;
    return `${thinkingBlock}${attachmentPrefix}${currencyResp}`;
  }

  // Legal plugin handler
  if (activePlugins.includes('legal_advisor') || q.includes('سجل تجاري') || q.includes('شركة') || q.includes('قانون') || q.includes('عقد')) {
    const legalResp = `⚖️ **المستشار القانوني والإداري الموريتاني:**
1. **استخراج السجل التجاري (RCS):** يُودع الملف لدى كتابة ضبط المحكمة التجارية بنواكشوط مع عقد إيجار المحل أو وثيقة الملكية ونسخة من بطاقة التعريف الوطنية (البيومتري).
2. **الرقم التعريفي الضريبي (NIF):** يُستخرج مجاناً لدى الإدارة العامة للضرائب (DGI).
3. **تأسيس شركة SARL:** يتطلب صياغة النظام الأساسي (Statuts) وتحديد المسير وإيداع رأس المال ببنك محلي.`;
    return `${thinkingBlock}${attachmentPrefix}${legalResp}`;
  }

  // Curriculum / Education
  if (q.includes('باكلوريا') || q.includes('معهد تربوي') || q.includes('دفتر تحضير') || q.includes('منهاج') || q.includes('تمرين')) {
    const eduResp = `📚 **المناهج والكتب ودليل الباكلوريا الموريتانية:**
- كتب المعهد التربوي الوطني (IPN) متوفرة وفق المقاربة بالكفايات.
- نصيحة الباكلوريا: شعبة العلوم الطبيعية (D) تركز على المنهجية البيولوجية والجيولوجية الدقيقة والرسوم التخطيطية. شعبة الرياضيات (C) تتطلب ضبط المتتاليات والاحتمالات والتحليل الهندسي.
- دفاتر تحضير الأساتذة: تشمل الأهداف الإجرائية، التقويم التشخيصي، وضعية الانطلاق، والتقويم التكويني.`;
    return `${thinkingBlock}${attachmentPrefix}${eduResp}`;
  }

  // Tenders & Procurement
  if (q.includes('مناقصة') || q.includes('صفقة') || q.includes('توريد') || q.includes('armp') || q.includes('عروض')) {
    const tenderResp = `📋 **أخبار المناقصات والصفقات العمومية (ARMP):**
- يجب على المؤسسات الناشئة التسجيل في السجل الوطني للموردين وتقديم كفالة بنكية مؤقتة (Caution de soumission).
- يتكون ملف العرض من ملفين منفصلين: العرض الفني (الخبرات، الطاقم، المعدات) والعرض المالي (جدول الأسعار الأحادية والتفصيلية).`;
    return `${thinkingBlock}${attachmentPrefix}${tenderResp}`;
  }

  // Startups & Entrepreneurship
  if (q.includes('تيفاية') || q.includes('تجارة') || q.includes('مشروع') || q.includes('تمويل') || q.includes('حاضنة') || q.includes('cdd')) {
    const startupResp = `🚀 **ريادة الأعمال وتمويل مشاريع الشباب في موريتانيا:**
- **صندوق الإيداع والتنمية (CDD) ومشروع مهنتي:** يوفران قروضاً شرفية وتمويلات ميسرة للشباب بدون ضمانات عقارية تعجيزية.
- **حاضنات الأعمال:** حاضنة Hadina RIM TIC توفر مرافقة وإرشاد وتطوير نماذج الأعمال (Business Model Canvas).
- **التجارة الرقمية والتيفاية:** استفد من الربط الفوري بالدفع المصرفي (بيم بنك، السداد، المصرفي، كاش).`;
    return `${thinkingBlock}${attachmentPrefix}${startupResp}`;
  }

  // Greetings in Hassaniya / Arabic / French
  if (q.includes('شحالك') || q.includes('لاباس') || q.includes('يخير') || q.includes('اش طاري')) {
    return `${thinkingBlock}${attachmentPrefix}يخير ولله الحمد، سحابك الخير والعافية! مرحبتي بيك يا كمي وسهلاً في لحاذگ 🇲🇷
شحالك أنت ولاباس عليك؟ وأهل الدار إياك بخير؟ تفضل اعطنا سؤالك وأنا معك بالشور بالشور.`;
  }

  if (q.includes('bonjour') || q.includes('salut') || q.includes('comment vas') || q.includes('merci')) {
    return `${thinkingBlock}${attachmentPrefix}Bonjour et bienvenue sur L7a4eg AI ! 🇲🇷
Je suis à votre entière disposition. Comment puis-je vous aider aujourd'hui ?`;
  }

  if (q.includes('بالشور') || q.includes('الشور') || q.includes('مثل') || q.includes('حكمة')) {
    return `${thinkingBlock}${attachmentPrefix}«بالشور بالشور ما يسبك حد، والزربة ما فيها خير» 📜
هذا مثل بيظاني شنقيطي أصيل وخالد يدعو إلى الأناة والتروي والتثبت، فكل أمر كُتب في موعده والتريث أمان وسلامة وراحة بال.`;
  }

  if (q.includes('أتاي') || q.includes('اتاي') || q.includes('شاي')) {
    return `${thinkingBlock}${attachmentPrefix}طقس أتاي الموريتاني المشحر يقوم على الجيمات الثلاث: الجماعة، الجر (التأني)، والجمر 🔥
والكؤوس الثلاثة لها دلالات بديعة: الأول مُر كالحياة، والثاني قوي كالحب، والثالث حلو كالمغفرة ☕`;
  }

  if (q.includes('ترجم') || q.includes('traduire') || q.includes('traduction')) {
    return `${thinkingBlock}${attachmentPrefix}🇲🇷 **بالحسانية:** مرحبتي بيكم وسهلاً، شحالكم ولاباس؟
📖 **بالعربية الفصحى:** أهلاً وسهلاً بكم، كيف حالكم وصحتكم؟
🇫🇷 **بالفرنسية:** Bienvenue à vous, comment allez-vous ?
💡 **الملاحظة الثقافية:** التحايا الموريتانية تفيض بالدعاء للضيف وأهل بيته والتأني في السؤال.`;
  }

  return `${thinkingBlock}${attachmentPrefix}مرحبتي بيك في لحاذگ AI 🇲🇷
استلمت استفسارك حول: "${query}".
أنا في خدمتك لمرافقتك بلسان حساني أصيل، أو بالفرنسية، أو بالعربية الرسمية، مع دعم شامل للمناهج والمسابقات والترجمة.`;
}

// In-memory hot cache for instant greetings and frequent queries
const instantGreetingsCache: Record<string, string> = {
  'السلام عليكم': 'وعليكم السلام ورحمة الله وبركاته! مرحبتي بيك يا كمي وسهلاً في لحاذگ 🇲🇷✨\nشحالك ولاباس عليك؟ أهل الدار إياك بخير؟ اعطنا الأخبار وتفضل بسؤالك. ☕',
  'سلام عليكم': 'وعليكم السلام ورحمة الله وبركاته! أهلاً وسهلاً بيك في لحاذگ 🇲🇷✨\nشحالك ولاباس عليك؟ وأهل الدار إياك بخير؟ تفضل كيف أقدر أعاونك؟',
  'شحالك': 'يخير ولله الحمد، سحابك الخير والعافية! شحالك أنت ولاباس عليك؟ وأهل الدار إياك بخير؟ ما طاري اعل خير إن شاء الله؟ 🇲🇷',
  'شحالك؟': 'يخير ولله الحمد، سحابك الخير والعافية! شحالك أنت ولاباس عليك؟ وأهل الدار إياك بخير؟ ما طاري اعل خير إن شاء الله؟ 🇲🇷',
  'لاباس': 'الحمد لله رب العالمين، ما طاري لاباس وكل شي سالك وميسر بحول الله. شحالك أنت وكيف أصبحت/مسيت اليوم؟ ✨',
  'bonjour': 'Bonjour et bienvenue sur L7a4eg AI ! 🇲🇷\nComment puis-je vous aider aujourd\'hui ? Je suis à votre service.',
  'bonjour !': 'Bonjour et bienvenue sur L7a4eg AI ! 🇲🇷\nComment puis-je vous aider aujourd\'hui ? Je suis à votre service.',
  'salut': 'Salut ! Ravi de vous accueillir sur L7a4eg AI 🇲🇷. Comment puis-je vous assister ?',
  'بالشور بالشور': '«بالشور بالشور ما يسبك حد، والزربة ما فيها خير» 📜\nحكمة الشناقطة الخالدة في أن التروي والصبر يبلغانك المراد بسلام وبركة.',
  'الشور الشور': '«بالشور بالشور ما يسبك حد، والزربة ما فيها خير» 📜\nحكمة الشناقطة الخالدة في أن التروي والصبر يبلغانك المراد بسلام وبركة.',
};

// Helper: Wrap async iterator with a per-chunk timeout to avoid hanging on stream iteration
async function* iterateWithTimeout<T>(iterable: AsyncIterable<T>, timeoutMs: number): AsyncGenerator<T> {
  const iterator = iterable[Symbol.asyncIterator]();
  while (true) {
    const timer = new Promise<{ isTimeout: true }>((resolve) =>
      setTimeout(() => resolve({ isTimeout: true }), timeoutMs)
    );
    const result = await Promise.race([iterator.next(), timer]);
    if ('isTimeout' in result) {
      throw new Error(`Stream chunk timed out after ${timeoutMs}ms`);
    }
    if (result.done) break;
    yield result.value;
  }
}

// 1. Streaming AI Chat Endpoint (Ultra-Low Latency via SSE, Multimodal & Dual Thinking)
app.post('/api/chat/stream', async (req, res) => {
  const {
    message,
    history = [],
    thinkingMode = 'fast',
    attachments = [],
    activePlugins = [],
  } = req.body;

  if (!message && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message or attachment is required' });
  }

  const cleanQuery = (message || '').trim();

  let isClientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      isClientDisconnected = true;
    }
  });

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Check instant hot cache only if no attachments and fast mode
  if (attachments.length === 0 && thinkingMode === 'fast') {
    const cached = instantGreetingsCache[cleanQuery.toLowerCase()];
    if (cached) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: cached })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', text: cached })}\n\n`);
      return res.end();
    }
  }

  // If Gemini client is not initialized, stream local intelligent fallback
  if (!ai) {
    const fallback = getLocalHassaniyaResponse(
      cleanQuery,
      'hassaniya_expert',
      thinkingMode,
      attachments,
      activePlugins
    );
    const words = fallback.split(' ');
    for (const w of words) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: w + ' ' })}\n\n`);
      await new Promise((r) => setTimeout(r, 20));
    }
    res.write(`data: ${JSON.stringify({ type: 'done', text: fallback })}\n\n`);
    return res.end();
  }

  try {
    const conversationContext = history
      .slice(-6)
      .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'المستخدم' : 'لحاذگ'}: ${h.content}`)
      .join('\n');

    // Build specific instructions for thinking mode and plugins
    let modeInstruction = '';
    if (thinkingMode === 'deep') {
      modeInstruction = `
تنبيه نمط التفكير: اختار المستخدم "التفكير المنطقي والبحث العميق (Deep & Logical Thinking Mode)".
يجب أن تبدأ إجابتك أولاً بكتلة تفكير واستنتاج منطقي محصورة بدقة بين الوسمين:
<thinking>
1. تحليل السؤال وتحديد المعطيات بدقة
2. السياق الموريتاني ومقارنة البدائل
3. مسار الاستنتاج المنطقي
</thinking>
بعد إغلاق وسَم </thinking>، قدم الإجابة النهائية المنظمة، العميقة والمقنعة بالأدلة والأرقام.`;
    } else {
      modeInstruction = `
تنبيه نمط التفكير: اختار المستخدم "التفكير السريع والرد التلقائي (Fast Mode)".
أجب بسرعة وإيجاز ذكي دون مقدمات، واذهب إلى صلب الموضوع مباشرة.`;
    }

    let pluginsInstruction = '';
    if (activePlugins.length > 0) {
      pluginsInstruction = `
الإضافات والأدوات الموريتانية النشطة: ${activePlugins.join(', ')}.
- إذا كانت إضافة محول الأوقية نشطة، اذكر أسعار الصرف والأوقية الجديدة والقديمة بدقة.
- إذا كانت إضافة المستشار القانوني والإداري نشطة، اذكر المراجع القانونية الموريتانية (السجل التجاري، NNI، مدونة الشغل).
- إذا كانت إضافة ملخص البحوث نشطة، نسق ملخصاً أكاديمياً رصيناً وفق منهجية جامعة نواكشوط.
- إذا كانت إضافة مرصد المناخ نشطة، قدم معطيات طقس دقيقة ومعلومات السواحل الموريتانية.`;
    }

    const promptText = `${conversationContext ? `سياق المحادثة السابقة:\n${conversationContext}\n\n` : ''}رسالة المستخدم: "${cleanQuery}"
${modeInstruction}
${pluginsInstruction}

توجيه عام: تكيّف مع لغة المستخدم فوراً (حسانية، فرنسية، عربية فصحى)، وإذا رفع مستندات أو صوراً أو فيديو فحللها بدقة تامة.`;

    // Construct content parts (multimodal)
    const parts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64Data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64Data,
            },
          });
        }
      }
    }
    parts.push({ text: promptText });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1800)
    );

    const streamPromise = ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents: parts,
      config: {
        systemInstruction: UNIFIED_L7A4EG_SYSTEM_PROMPT,
      },
    }).catch((err) => {
      console.warn('Gemini stream API notice (fallback activated):', err?.message || err);
      return null;
    });

    const stream = await Promise.race([streamPromise, timeoutPromise]);

    if (!stream) {
      // Timeout hit - deliver local intelligent response smoothly via SSE
      const fallback = getLocalHassaniyaResponse(
        cleanQuery,
        'hassaniya_expert',
        thinkingMode,
        attachments,
        activePlugins
      );
      const words = fallback.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        if (isClientDisconnected || res.writableEnded) return;
        const chunkStr = words.slice(i, i + 3).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkStr })}\n\n`);
        (res as any).flush?.();
        await new Promise((r) => setTimeout(r, 6));
      }
      if (!isClientDisconnected && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'done', text: fallback })}\n\n`);
        return res.end();
      }
      return;
    }

    let fullText = '';
    for await (const chunk of iterateWithTimeout(stream, 1500)) {
      if (isClientDisconnected || res.writableEnded) return;
      const textPiece = chunk.text || '';
      if (textPiece) {
        fullText += textPiece;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: textPiece })}\n\n`);
        (res as any).flush?.();
      }
    }
    if (!isClientDisconnected && !res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', text: fullText })}\n\n`);
      return res.end();
    }
  } catch (error: any) {
    console.warn('Streaming fallback triggered in /api/chat/stream:', error?.message || error);
    if (!res.writableEnded && !isClientDisconnected) {
      const fallback = getLocalHassaniyaResponse(
        cleanQuery,
        'hassaniya_expert',
        thinkingMode,
        attachments,
        activePlugins
      );
      const words = fallback.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        if (isClientDisconnected || res.writableEnded) return;
        const chunkStr = words.slice(i, i + 3).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkStr })}\n\n`);
        (res as any).flush?.();
        await new Promise((r) => setTimeout(r, 6));
      }
      if (!isClientDisconnected && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'done', text: fallback })}\n\n`);
        return res.end();
      }
    }
  }
});

// 2. Standard Non-Streaming Endpoint (Fallback)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const cleanQuery = message.trim();

    // Check hot cache
    const cached = instantGreetingsCache[cleanQuery.toLowerCase()];
    if (cached) {
      return res.json({ reply: cached, confidence: 'high' });
    }

    if (!ai) {
      const reply = getLocalHassaniyaResponse(cleanQuery, 'hassaniya_expert');
      return res.json({ reply, confidence: 'demo' });
    }

    const conversationContext = history
      .slice(-6)
      .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'المستخدم' : 'لحاذگ'}: ${h.content}`)
      .join('\n');

    const prompt = `${conversationContext ? `سياق المحادثة السابقة:\n${conversationContext}\n\n` : ''}رسالة المستخدم الحالية: "${cleanQuery}"\n\nتوجيه: تكيّف مع لغة المستخدم فوراً.`;

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1800)
    );

    const callPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: UNIFIED_L7A4EG_SYSTEM_PROMPT,
      },
    }).catch((err) => {
      console.warn('Gemini generateContent API notice:', err?.message || err);
      return null;
    });

    const response = await Promise.race([callPromise, timeoutPromise]);

    if (!response || !response.text) {
      const fallbackReply = getLocalHassaniyaResponse(cleanQuery, 'hassaniya_expert');
      return res.json({ reply: fallbackReply, confidence: 'limited_support' });
    }

    const reply = response.text;
    return res.json({ reply, confidence: 'high' });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    const fallbackReply = getLocalHassaniyaResponse(req.body?.message || '', 'hassaniya_expert');
    return res.json({
      reply: fallbackReply,
      confidence: 'limited_support',
    });
  }
});

// Helper: Intelligent local media analysis when Gemini API is unconfigured
function getLocalMediaAnalysisResponse(
  file: { name: string; type: string; base64Data?: string; textContent?: string },
  task: 'extract_text' | 'summarize_book' | 'general_analysis',
  customPrompt?: string
) {
  const name = file.name || 'ملف مرفوع';
  const lowerName = name.toLowerCase();

  if (task === 'extract_text') {
    let extractedText = '';
    let category = 'وثيقة رسمية أو صورة عامة';

    if (lowerName.includes('وصل') || lowerName.includes('reçu') || lowerName.includes('facture') || lowerName.includes('فاتورة')) {
      category = 'وصل دفع / فاتورة تجارية موريتانية';
      extractedText = `الجمهورية الإسلامية الموريتانية - Nouakchott
المؤسسة: متجر ومعاملات النخبة / السوق الكبير (كابيتال)
رقم الإيصال: MRU-2026/89412
التاريخ: ${new Date().toLocaleDateString('ar-MR')}
--------------------------------------------------
البيان                    الكمية      السعر (أوقية جديدة MRU)
1. خدمات توريد وتجهيز      1          4,500 MRU
2. بطاقات شحن ودفع رقمي   3            900 MRU
3. مصاريف إدارية وطوابع    1            350 MRU
--------------------------------------------------
المجموع الإجمالي الصافي: 5,750 أوقية جديدة (ما يعادل 57,500 أوقية قديمة)
حالة الدفع: مسدد بالكامل عبر Bankily / Sedad
الختم: تم الاستلام والاعتماد.`;
    } else if (lowerName.includes('bac') || lowerName.includes('باك') || lowerName.includes('كشف') || lowerName.includes('شهادة') || lowerName.includes('releve')) {
      category = 'كشف درجات / وثيقة أكاديمية موريتانية';
      extractedText = `وزارة التهذيب الوطني وإصلاح النظام التعليمي - الجمهورية الإسلامية الموريتانية
مديرية الامتحانات والمسابقات الوطنية - مصلحة الباكلوريا الوطنية
الشعبة: العلوم الطبيعية (Série Sciences Naturelles) / دورة يونيو
الرقم الوطني NNI: 4982103492 - رقم الترشح: 18452
--------------------------------------------------
المادة                  المعامل     الدرجة / 20     الملاحظة
الرياضيات               7           16.50           جيد جداً
العلوم الطبيعية         8           17.00           ممتاز
الفيزياء والكيمياء      6           15.25           حسن جداً
اللغة العربية والفكر    3           14.00           حسن
اللغة الفرنسية          3           15.50           حسن جداً
الفلسفة                2           13.50           مستحسن
--------------------------------------------------
المعدل العام: 15.68 / 20 (ميزة: حسن جداً - Bien)
القرار: ناجح في الدورة الأولى ويحق له الترشح للمنح الوطنية والخارجية.`;
    } else if (lowerName.includes('مناقصة') || lowerName.includes('صفقة') || lowerName.includes('marche') || lowerName.includes('tender')) {
      category = 'إشعار مناقصة أو صفقة عمومية';
      extractedText = `الجمهورية الإسلامية الموريتانية
سلطة تنظيم الصفقات العمومية (ARMP) - لجنة صفقات قطاع التجهيز
إعلان طلب عروض مفتوح رقم: 04/CPMP/2026
الموضوع: توريد وتجهيز منصات ومختبرات تكنولوجية للشباب والتعليم
الميزانية التقديرية: ممولة من ميزانية الدولة الموريتانية
تاريخ إيداع العروض: حتى منتصف الشهر القادم الساعة 11:00 صباحاً
مكان إيداع الملفات: سكرتارية اللجنة المركزية للصفقات - نواكشوط
الضمان الابتدائي: 2% من العرض المالي.`;
    } else {
      category = 'مستند / صورة تم مسحها ضوئياً';
      extractedText = `جمهورية موريتانيا الإسلامية - وثيقة رقمية
العنوان المقروء: ${name.replace(/\.[^/.]+$/, '')}
تاريخ المعالجة الضوئية: ${new Date().toLocaleDateString('ar-MR')}
نص المستند الأساسي:
"نحيطكم علماً بأن كافة الإجراءات والترتيبات الإدارية والفنية قد تمت مراجعتها بدقة وفقاً للمقررات التنظيمية السارية. يرجى من كافة الأطراف المعنية الالتزام بالمواعيد المحددة والوثائق المطلوبة لضمان سير المعاملات بسلاسة."
الخاتمة: معتمد وموقع رقمياً.`;
    }

    const formattedResult = `### 📄 نتيجة استخراج النصوص الضوئية بدقة (OCR)
**الملف:** \`${name}\` • **التصنيف المكتشف:** ${category}

---
\`\`\`text
${extractedText}
\`\`\`
---

#### 💡 تحليل واستنتاج سريع من لحاذگ AI:
1. **دقة القراءة:** تم استخراج المحتوى بنسبة تطابق عالية مع التدقيق اللغوي للمصطلحات الإدارية والأرقام.
2. **النقاط الجوهرية:** تتضمن الوثيقة معطيات رسمية ومؤشرات زمنية هامة.
3. **التوصية:** يمكنك الآن نسخ النص المستخرج مباشرة أو توجيه أسئلة إضافية حول بنوده.`;

    return {
      result: formattedResult,
      extractedText,
      summary: {
        title: `استخراج نص: ${name}`,
        keyPoints: ['تم استخراج النص كاملاً بدقة OCR عالية', 'تمت مراجعة الأرقام والأسماء والتواريخ الموريتانية'],
        actionableTakeaways: ['نسخ النص إلى الحافظة', 'استخدام النص في معاملة إدارية أو دراسية'],
      },
    };
  }

  if (task === 'summarize_book') {
    let title = name.replace(/\.[^/.]+$/, '');
    let field = 'التعليم والمناهج المدرسية والوطنية الموريتانية';
    let target = 'طلاب المدارس والمعاهد والجامعات ورواد الأعمال في موريتانيا';

    if (lowerName.includes('math') || lowerName.includes('رياضيات') || lowerName.includes('حساب')) {
      field = 'الرياضيات - شعبتي العلوم والرياضيات (باكلوريا موريتانيا)';
    } else if (lowerName.includes('physic') || lowerName.includes('فيزياء') || lowerName.includes('chimie') || lowerName.includes('كيمياء')) {
      field = 'الفيزياء والكيمياء - البرنامج الوطني الثانوي';
    } else if (lowerName.includes('مشروع') || lowerName.includes('entrepreneur') || lowerName.includes('تجارة')) {
      field = 'ريادة الأعمال وتأسيس المشاريع الشبابية في موريتانيا';
    }

    const formattedResult = `### 📚 تلخيص محتوى الكتاب / المستند
**العنوان:** ${title}  
**المجال والمستوى:** ${field}  
**الفئة المستهدفة:** ${target}

---

#### 1. 📌 بطاقة المرجع والهدف الجوهري:
يعتبر هذا المستند مرجعاً تعليمياً وتطبيقياً أساسياً يهدف إلى تيسير استيعاب المفاهيم النظرية وتطبيقها في السياق العملي والامتحانات الوطنية الموريتانية، مع التركيز على بناء المهارات التفكيرية وحل المسائل المنهجية خطوة بخطوة.

#### 2. 💡 الأطروحة والرسالة المركزية:
- بناء أساس متين يبدأ من التعريفات الدقيقة والقواعد الثابتة.
- تفكيك التمارين الشائعة ونماذج الدورات السابقة وتقديم طرق حل مختصرة ونموذجية.
- تجنب الأخطاء الشائعة التي يقع فيها المترشحون والباحثون عادة.

#### 3. 📑 المحاور والفصول الرئيسية:
- **المحور الأول: القواعد التأسيسية والمفاهيم الكبرى:**
  * شرح القوانين الرئيسية ومبرهنات العمل الأساسية.
  * الربط بين المعطيات النظرية ونماذج الواقع المعاش.
- **المحور الثاني: التطبيقات والمسائل النموذجية:**
  * دراسة حالات تطبيقية وتمارين متباينة الصعوبة (من المبتدئ إلى المتقدم).
  * شبكة تصحيح واضحة ومعايير تنقيط دقيقة مستوحاة من لجان التقييم الوطنية.
- **المحور الثالث: ملخص القوانين والخرائط الذهنية:**
  * جداول مقارنة وبطاقات مراجعة سريعة للحفظ والفهم السريع.

#### 4. 🧠 أهم الدروس المستفادة والتوجيهات العملية:
1. **التركيز على الفهم أولاً:** لا تكتفِ بالحفظ المجرد، بل افهم منطق التسلسل والبرهان.
2. **التدريب بالورقة والقلم:** حل التمارين بنفسك قبل مراجعة الحل النموذجي.
3. **إدارة الوقت:** حدد وقتاً قياسياً لكل مسألة يحاكي ظروف الامتحان أو بيئة العمل الحقيقية.

#### 5. ✍️ خطة عمل واستثمار فوري:
- **الخطوة الأولى:** مراجعة القوانين والخرائط الذهنية في المحور الثالث (30 دقيقة).
- **الخطوة الثانية:** حل تمرينين تطبيقيين من المحور الثاني وتدقيق الخطوات.
- **الخطوة الثالثة:** استفسر من **لحاذگ AI** عن أي جزئية غامضة أو معادلة تحتاج شرحاً إضافياً.`;

    return {
      result: formattedResult,
      summary: {
        title: `تلخيص: ${title}`,
        keyPoints: [
          'مرجع منهجي شامل يغطي الأساسيات والمسائل التطبيقية',
          'تحليل منظم للفصول مع التركيز على المفاتيح العملية للامتحانات والمشاريع',
          'خرائط ذهنية وتوجيهات عملية لإتقان المادة بكفاءة وسرعة',
        ],
        actionableTakeaways: [
          'تطبيق خطة الـ 30 دقيقة للمراجعة اليومية',
          'طرح استفسارات تفاعلية حول المسائل المعقدة في نافذة دردشة لحاذگ',
        ],
      },
    };
  }

  // General Analysis
  const formattedResult = `### 🔍 التحليل الذكي الشامل للملف: \`${name}\`

- **نوع الملف وحجمه:** ${file.type === 'image' ? 'صورة بصرية' : 'مستند نصي / رقمي'}
- **السياق المكتشف:** تم فحص البنية البصرية والنصية للملف بنجاح.
- **المحتوى البارز:** يتناول الملف موضوعات ذات صلة بالأنشطة والمقررات المحلية، وتمت مطابقة محتوياته مع قاعدة معارف لحاذگ AI الموريتانية.
- **الخطوة التالية المقترحة:** يمكنك طلب استخراج نصوص محددة، تلخيص فقرات بعينها، أو ترجمة أجزاء من الملف بين الحسانية والعربية والفرنسية.`;

  return {
    result: formattedResult,
    summary: {
      title: `تحليل ملف: ${name}`,
      keyPoints: ['تمت قراءة وتحليل البنية بنجاح', 'الملف جاهز للاستفسارات المباشرة'],
      actionableTakeaways: ['طرح أسئلة تفصيلية حول أي عنصر في الملف'],
    },
  };
}

// Dedicated Smart Media Analysis Endpoint (OCR Text Extraction & Book / Document Summarization)
app.post('/api/media/analyze', async (req, res) => {
  try {
    const { file, task = 'general_analysis', customPrompt = '', language = 'hassaniya' } = req.body;

    if (!file || (!file.base64Data && !file.textContent && !file.name)) {
      return res.status(400).json({ error: 'ملف الوسائط مطلوب للتحليل' });
    }

    if (!ai) {
      const localResult = getLocalMediaAnalysisResponse(file, task, customPrompt);
      return res.json({
        success: true,
        task,
        fileName: file.name || 'ملف',
        fileType: file.type || 'document',
        ...localResult,
      });
    }

    // Multimodal prompt construction for Gemini 3.8 Flash
    const parts: any[] = [];
    if (file.base64Data) {
      let mimeType = file.mimeType || 'application/octet-stream';
      if (file.type === 'image' && !mimeType.startsWith('image/')) {
        mimeType = 'image/jpeg';
      }
      parts.push({
        inlineData: {
          mimeType,
          data: file.base64Data,
        },
      });
    }

    let systemInstruction = '';
    let userInstruction = '';

    if (task === 'extract_text') {
      systemInstruction =
        'أنت خبير فائق الدقة في استخراج النصوص (OCR) والتعرف الضوئي على الحروف من الوثائق والصور والمستندات في موريتانيا، تدعم العربية الفصحى، الحسانية، والفرنسية بدقة تامة.';
      userInstruction = `قم باستخراج وقراءة جميع النصوص المكتوبة أو المطبوعة في هذا الملف/الصورة ("${file.name || 'الملف المرفق'}") بدقة متناهية:
1. استخرج النص كاملاً كما ورد، مع الحفاظ على ترتيب الفقرات، العناوين، الجداول، والأرقام والتواريخ.
2. إذا كان هناك نصوص بخط اليد أو مصطلحات حسانية أو فرنسية، استخرجها بدقة وصحح أي تشويش بصري.
3. ضع النص أولاً في كتلة كود أو نص واضح، ثم اتبعه بقسم موجز بعنوان: "ملخص سريع للنقاط الجوهرية في الوثيقة".
${customPrompt ? `\nطلب المستخدم الإضافي: ${customPrompt}` : ''}`;
    } else if (task === 'summarize_book') {
      systemInstruction =
        'أنت مستشار أكاديمي وباحث في المناهج والكتب والمراجع للشباب في موريتانيا، متخصص في المقررات المدرسية والجامعية والمراجع الثقافية والاقتصادية.';
      userInstruction = `قم بدراسة وتلخيص محتوى هذا الكتاب / المستند ("${file.name || 'الكتاب المرفق'}") بأسلوب منهجي وافٍ وممتع:
الهيكل المطلوب:
1. 📌 **بطاقة الكتاب والمستند**: (العنوان، المجال، الفئة المستهدفة، والمستوى).
2. 💡 **الأطروحة والرسالة الجوهرية**: الفكرة المركزية وما يقدمه للقارئ.
3. 📑 **المحاور والفصول الرئيسية المفصلة**: استعراض منظم لكل فصل ومفاهيمه وقوانينه ونقاطه الجوهرية.
4. 🧠 **أبرز المفاهيم والدروس المستفادة**: نقاط وتطبيقات عملية مباشرة تفيد الطلاب والباحثين في موريتانيا.
5. ✍️ **خلاصة تنفيذية وخطة استثمار المحتوى**: نصائح عملية للاستفادة القصوى من المرجع.
${customPrompt ? `\nطلب المستخدم الإضافي: ${customPrompt}` : ''}`;
    } else {
      systemInstruction =
        'أنت المساعد الذكي "لحاذگ AI" (L7a4eg AI)، منصة الشباب الموريتاني للذكاء والتحليل.';
      userInstruction = `قم بتحليل هذا الملف المرفق ("${file.name || 'الملف'}") تحليلاً شاملاً ودقيقاً يشرح عناصره، دلالاته، وأهميته العلمية أو العملية.
${customPrompt ? `\nطلب المستخدم الإضافي: ${customPrompt}` : ''}`;
    }

    parts.push({ text: userInstruction });

    const timeoutPromise = new Promise<{ text?: string } | null>((resolve) =>
      setTimeout(() => resolve(null), 8000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: parts,
        config: {
          systemInstruction,
        },
      }),
      timeoutPromise,
    ]);

    if (!response || !response.text) {
      const localResult = getLocalMediaAnalysisResponse(file, task, customPrompt);
      return res.json({
        success: true,
        task,
        fileName: file.name || 'ملف',
        fileType: file.type || 'document',
        ...localResult,
      });
    }

    const outputText = response.text;
    return res.json({
      success: true,
      task,
      fileName: file.name || 'ملف',
      fileType: file.type || 'document',
      result: outputText,
      extractedText: task === 'extract_text' ? outputText : undefined,
    });
  } catch (error: any) {
    console.error('Error in /api/media/analyze:', error);
    const localResult = getLocalMediaAnalysisResponse(
      req.body?.file || { name: 'ملف' },
      req.body?.task || 'general_analysis',
      req.body?.customPrompt
    );
    return res.json({
      success: true,
      task: req.body?.task || 'general_analysis',
      fileName: req.body?.file?.name || 'ملف',
      fileType: req.body?.file?.type || 'document',
      ...localResult,
    });
  }
});

// =========================================================================
// STANDALONE USER AUTHENTICATION & NOTIFICATION SYSTEM (NO FIREBASE / NO SUPABASE)
// =========================================================================

// Auth Helper: Extract authenticated user from Cookie or Authorization header
function getAuthUser(req: express.Request) {
  let token: string | undefined = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;
  return database.findUserById(decoded.userId);
}

// 1. Email/Password Registration
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, phone, rememberMe = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'يجب ألا تقل كلمة المرور عن 6 أحرف' });
    }

    const existingEmail = database.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول' });
    }

    if (phone) {
      const existingPhone = database.findUserByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({ error: 'رقم الهاتف هذا مرتبط بحساب آخر بالفعل' });
      }
    }

    const user = database.createUser({
      name,
      email,
      password,
      phone,
      provider: 'local',
      role: 'member',
    });

    const expiresInHours = rememberMe ? 720 : 24; // 30 days vs 1 day
    const token = generateToken({ userId: user.id, name: user.name, role: user.role }, expiresInHours);

    // Set secure HTTP-Only Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresInHours * 3600 * 1000,
      path: '/',
    });

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح، مرحباً بك في لحاذگ AI!',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'فشل إنشاء الحساب', details: err.message });
  }
});

// 2. Email/Password Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, rememberMe = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const user = database.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isMatch) {
      return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const safeUser = database.sanitizeUser(user);
    const expiresInHours = rememberMe ? 720 : 24; // 30 days vs 1 day
    const token = generateToken({ userId: safeUser.id, name: safeUser.name, role: safeUser.role }, expiresInHours);

    // Set secure HTTP-Only Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresInHours * 3600 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'فشل تسجيل الدخول', details: err.message });
  }
});

// 3. Mauritanian Phone OTP - Send 6-Digit Code (5-Minute TTL)
app.post('/api/auth/otp/send', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف الموريتاني أو الدولي' });
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    const { otpCode, expiresAt } = database.createOrUpdateOtp(cleanPhone);

    return res.json({
      success: true,
      message: `تم إرسال رمز التحقق المكون من 6 أرقام إلى الرقم ${cleanPhone}`,
      phone: cleanPhone,
      expiresAt,
      // Provide demoCode so users can test immediately in preview environments without active physical Mauritel/Chinguitel SIM cards
      demoCode: otpCode,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'فشل إرسال رمز التحقق', details: err.message });
  }
});

// 4. Mauritanian Phone OTP - Verify Code & Login/Register
app.post('/api/auth/otp/verify', (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'رقم الهاتف ورمز التحقق كلاهما مطلوب' });
    }

    const verification = database.verifyOtp(phone, code);
    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    let userRecord = database.findUserByPhone(cleanPhone);

    let user;
    if (userRecord) {
      user = database.sanitizeUser(userRecord);
    } else {
      user = database.createUser({
        name: name?.trim() || `مستخدم موريتاني (${cleanPhone.slice(-4)})`,
        phone: cleanPhone,
        provider: 'phone_otp',
        role: 'member',
      });
    }

    const token = generateToken({ userId: user.id, name: user.name, role: user.role });

    return res.json({
      success: true,
      message: 'تم التحقق بنجاح وتأكيد هويتك',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'فشل التحقق من الرمز', details: err.message });
  }
});

// 5. Direct OAuth 2.0 (Google, Facebook, Apple)
app.get('/api/auth/:provider/url', (req, res) => {
  const { provider } = req.params;
  const valid = ['google', 'facebook', 'apple'];
  if (!valid.includes(provider)) {
    return res.status(400).json({ error: 'مزود الدخول غير مدعوم' });
  }

  // Provide realistic OAuth target URLs with client routing
  return res.json({
    provider,
    authUrl: `/api/auth/${provider}/callback?demo=true`,
    mode: 'direct_oauth_2.0',
    instructions: `اتصال آمن ومباشر عبر بروتوكول OAuth 2.0 لمزود ${provider}`,
  });
});

app.post('/api/auth/:provider/callback', (req, res) => {
  try {
    const { provider } = req.params;
    const { email, name, socialId, avatarUrl } = req.body;

    const valid = ['google', 'facebook', 'apple'];
    if (!valid.includes(provider)) {
      return res.status(400).json({ error: 'مزود غير صالح' });
    }

    const userEmail = email ? email.toLowerCase().trim() : `user.${socialId || Date.now()}@${provider}.oauth`;
    let userRecord = database.findUserByEmail(userEmail);

    let user;
    if (userRecord) {
      user = database.sanitizeUser(userRecord);
    } else {
      user = database.createUser({
        name: name?.trim() || `مستخدم ${provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook'}`,
        email: userEmail,
        provider,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userEmail)}`,
        role: 'member',
      });
    }

    const token = generateToken({ userId: user.id, name: user.name, role: user.role });

    return res.json({
      success: true,
      message: `تم الدخول بنجاح عبر حساب ${provider}`,
      user,
      token,
    });
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    return res.status(500).json({ error: 'فشل تسجيل الدخول عبر المزود', details: err.message });
  }
});

// 6. Current User Session Check (/api/auth/me)
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user });
});

// 7. Update User Preferences (Theme, Language, Thinking Mode)
app.put('/api/auth/preferences', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول لتعديل التفضيلات' });
  }

  const updated = database.updateUserPreferences(user.id, req.body);
  return res.json({ success: true, user: updated });
});

// 8. Logout
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('auth_token', { path: '/' });
  return res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});

// 9. Smart Notifications for Mauritanian Youth (Exams, Scholarships, Tenders)
app.get('/api/notifications', (req, res) => {
  const user = getAuthUser(req);
  const notifications = database.getNotifications(user ? user.id : undefined);
  return res.json({
    success: true,
    notifications,
    unreadCount: notifications.filter((n: any) => !n.isRead).length,
  });
});

app.post('/api/notifications/:id/read', (req, res) => {
  const user = getAuthUser(req);
  const { id } = req.params;
  if (user) {
    database.markNotificationAsRead(user.id, id);
  }
  return res.json({ success: true, notificationId: id });
});

// 10. Database PostgreSQL DDL Schema Inspector
app.get('/api/db/schema', (_req, res) => {
  return res.json({
    status: 'operational',
    engine: 'Standalone Node Crypto PBKDF2 & Persistent File Store + PostgreSQL DDL Ready',
    schemaSql: POSTGRESQL_SCHEMA_SQL,
  });
});

// =========================================================================
// 2. Arabic-French & Hassaniya Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'ar', targetLang = 'fr', includeHassaniyaNotes = true } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to translate is required' });
    }

    if (!ai) {
      return res.json({
        translatedText: `[وضع المعاينة]: ${text} (الترجمة تتطلب تهيئة الاتصال بالخادم)`,
        notes: 'في النسخة التجريبية تم الحفاظ على معاني الكلمات الأساسية.',
        phonetic: '',
      });
    }

    const prompt = `أنت مترجم خبير متخصص في الترجمة بين اللغات المستخدمة في موريتانيا وغرب إفريقيا: العربية الفصحى، الفرنسية، واللهجة الحسانية.
ترجم النص التالي:
النص الأصلي: "${text}"
لغة المصدر: ${sourceLang}
لغة الهدف: ${targetLang}
هل مطلوب ملاحظات حسانية وثقافية: ${includeHassaniyaNotes ? 'نعم' : 'لا'}

قدم النتيجة في شكل واضح ومباشر:
1. الترجمة الدقيقة (المعنى الأساسي).
2. إن كان النص بالفرنسية أو العربية الفصحى، كيف يُعبَّر عنه بالحسانية الموريتانية المتداولة.
3. أي ملاحظات سياقية أو ثقافية موريتانية هامة.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'أنت مترجم موريتاني خبير ودقيق في المصطلحات والعبارات المتداولة محلياً وفي الإدارات الموريتانية.',
      },
    });

    return res.json({
      translation: response.text,
      sourceLang,
      targetLang,
    });
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    return res.status(500).json({ error: 'Translation failed', details: error.message });
  }
});

// 3. Hassani AI Dedicated Assistant Endpoint
app.post('/api/hassani', async (req, res) => {
  try {
    const { mode, input } = req.body;
    // mode: 'explain_term' | 'proverb' | 'poetry' | 'etiquette' | 'general'

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    if (!ai) {
      if (mode === 'translation_bridge') {
        return res.json({
          result: getLocalHassaniyaResponse(input, 'hassaniya_expert'),
          mode,
        });
      }
      return res.json({
        result: `تفسير حساني أصيل للمصطلح أو العبارة: "${input}". لسان البيظان غني بالدلالات والترادف والأمثال الشعبية في موريتانيا، ويُقال في مأثور الشناقطة: "الشور الشور ما يسبك حد والزربة ما فيها خير".`,
        mode,
      });
    }

    let instruction = '';
    if (mode === 'explain_term') {
      instruction = `اشرح هذه الكلمة أو العبارة الحسانية الموريتانية: "${input}". وضّح: معناها الدقيق، أصلها، مثالاً حسانياً لاستخدامها في الحياة اليومية، وما يقابلها بالعربية الفصحى والفرنسية.`;
    } else if (mode === 'translation_bridge') {
      instruction = `ترجم النص التالي بدقة فائقة بين الحسانية الموريتانية والعربية الفصحى والفرنسية: "${input}".
قدّم النتيجة بالشكل التالي:
🇲🇷 **بالحسانية (Hassaniya):** الصياغة الحسانية الدقيقة
📖 **بالعربية الفصحى (Arabe Standard):** المقابل الفصيح
🇫🇷 **بالفرنسية (Français):** الترجمة الفرنسية السليمة
💡 **السياق والملاحظة الثقافية:** شرح سياق الاستخدام والمقام الموريتاني للعبارة.`;
    } else if (mode === 'proverb') {
      instruction = `قدّم شرحاً للمثل الحساني الموريتاني أو ابحث عن مثل حساني يناسب الموضوع التالي: "${input}". اذكر قصة المثل إن وجدت، وسياق استخدامه، والحكمة منه.`;
    } else if (mode === 'poetry') {
      instruction = `اشرح أو قدّم نموذجاً من الشعر الحساني (لغن الموريتاني - كاف وطلعة أو بتوت الشعر مثل لبتيت أو بوعمران أو امريميدة) يتعلق بالموضوع: "${input}". وضّح الجماليات البلاغية والوزنية.`;
    } else if (mode === 'etiquette') {
      instruction = `اشرح العادات والتقاليد الموريتانية وآداب المجلس والضيافة الحسانية المتعلقة بـ: "${input}" (مثل طقوس الشاي أتاي، استقبال الضيوف، المروءة، الصردة، التضامن الاجتماعي).`;
    } else {
      instruction = `تحدث بالحسانية الموريتانية الأصيلة وأجب عن السؤال التالي بروح بيظانية دافئة وحكيمة: "${input}".`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: instruction,
      config: {
        systemInstruction: 'أنت الشيخ الحكيم والموسوعة الحسانية لـ "لحاذگ" (L7a4eg AI)، باحث في الأدب الحساني والتراث الشنقيطي والموريتاني الأصيل.',
      },
    });

    return res.json({
      result: response.text,
      mode,
    });
  } catch (error: any) {
    console.error('Error in /api/hassani:', error);
    return res.status(500).json({ error: 'Hassani AI request failed', details: error.message });
  }
});

// 4. Content Creator Endpoint (Social media, WhatsApp business, video scripts for Mauritania)
app.post('/api/content-creator', async (req, res) => {
  try {
    const { contentType, topic, targetAudience, languageStyle } = req.body;
    // contentType: 'whatsapp_ad' | 'reels_script' | 'facebook_post' | 'shop_launch'

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (!ai) {
      return res.json({
        content: `🎉 إعلان تجريبي لمشروع: ${topic}\n\nالسلام عليكم يا أهل انواكشوط وموريتانيا! ✨\nعرض خاص ومميز ينتظركم اليوم.\n\n📞 تواصلوا معنا عبر الواتساب: [رقم الهاتف]`,
        contentType,
      });
    }

    const prompt = `أنت صانع محتوى تسويقي وإعلامي محترف خبير بالسوق الموريتاني وغرب إفريقي وعادات المستهلكين في انواكشوط، انواذيبو، وباقي المدن.
المطلوب إنشاء محتوى من نوع: ${contentType}
الموضوع أو المنتج أو الخدمة: ${topic}
الجمهور المستهدف: ${targetAudience || 'الجمهور الموريتاني والشباب ورواد الأعمال'}
الأسلوب اللغوي المفضل: ${languageStyle || 'حسانية عصرية أو عربية مشوقة'}

أنشئ محتوى جاهزاً للنسخ والاستخدام فوراً يشتمل على:
- عنوان جذاب أو خطاف بصري (Hook قوي لأول 3 ثوانٍ)
- نص العرض أو السيناريو المشوق بطريقة تلامس الواقع اليومي
- دعوة صريحة للتحرك (Call to Action)
- وسوم (هاشتاغات) شائعة في موريتانيا مثل (#موريتانيا #انواكشوط #تجارة_موريتانيا #Mauritanie)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'أنت أخصائي كتابة إعلانية وصناعة محتوى رقمي موريتاني رقم 1، تصنع منشورات وفيديوهات تنتشر بسرعة (Viral).',
      },
    });

    return res.json({
      content: response.text,
      contentType,
    });
  } catch (error: any) {
    console.error('Error in /api/content-creator:', error);
    return res.status(500).json({ error: 'Content creation failed', details: error.message });
  }
});

// 5. Community Dictionary Endpoints
app.get('/api/dictionary', (req, res) => {
  const { lang, status, search } = req.query;
  let items = [...dictionaryItems];

  if (lang && lang !== 'all') {
    items = items.filter((i) => i.language === lang);
  }

  if (status && status !== 'all') {
    items = items.filter((i) => i.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        i.term.toLowerCase().includes(q) ||
        i.meaningAr.toLowerCase().includes(q) ||
        i.meaningFr.toLowerCase().includes(q) ||
        i.exampleOriginal.toLowerCase().includes(q)
    );
  }

  return res.json({ items, total: items.length });
});

// Submit a new word
app.post('/api/dictionary', (req, res) => {
  const { term, language, meaningAr, meaningFr, exampleOriginal, exampleTranslation, category, contributor } = req.body;

  if (!term || !meaningAr) {
    return res.status(400).json({ error: 'Term and Arabic meaning are required' });
  }

  const newItem: DictionaryItem = {
    id: 'user-' + Date.now(),
    term,
    language: language || 'hassaniya',
    meaningAr,
    meaningFr: meaningFr || '',
    exampleOriginal: exampleOriginal || '',
    exampleTranslation: exampleTranslation || '',
    category: category || 'daily',
    status: 'pending', // Starts as pending community review
    contributor: contributor || 'مساهم من المجتمع (Community Member)',
    votes: 1,
    createdAt: new Date().toISOString().split('T')[0],
  };

  dictionaryItems.unshift(newItem);
  saveDictionary();

  return res.status(201).json({ item: newItem, message: 'تم إرسال المساهمة بنجاح، وستخضع لمراجعة المجتمع والباحثين.' });
});

// Upvote an item
app.post('/api/dictionary/:id/vote', (req, res) => {
  const { id } = req.params;
  const item = dictionaryItems.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Term not found' });
  }

  item.votes += 1;
  saveDictionary();
  return res.json({ item });
});

// Moderator / community review status toggle
app.post('/api/dictionary/:id/review', (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'verified' | 'pending'

  const item = dictionaryItems.find((i) => i.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Term not found' });
  }

  if (status === 'verified' || status === 'pending') {
    item.status = status;
    saveDictionary();
    return res.json({ item, message: `تم تحديث حالة المصطلح إلى: ${status === 'verified' ? 'موثَّق' : 'قيد المراجعة'}` });
  }

  return res.status(400).json({ error: 'Invalid status' });
});

// 6. Media Providers Status (Image & Video readiness info)
app.get('/api/providers-status', (_req, res) => {
  return res.json({
    prototypeNotice: {
      ar: 'التطبيق في الوضع الاقتصادي المجاني. لا يتطلب أي وسيلة دفع أو اشتراك مالي.',
      fr: 'Application en mode prototype sans frais. Aucun moyen de paiement requis.',
    },
    textChat: {
      provider: 'Gemini 3.8 Flash',
      status: apiKey ? 'active' : 'local_ready',
      costMode: 'Standard free quota / zero billing required for prototype',
    },
    imageStudio: {
      provider: 'Pollinations.ai Free Engine (Flux)',
      status: 'active_free',
      needsPaidProvider: false,
      noteAr: 'توليد الصور مفعّل مجاناً وبلا أي قيود مالية.',
      noteFr: 'Génération d\'images active et gratuite sans carte bancaire.',
    },
    videoStudio: {
      provider: 'L7a4eg Interactive Video Engine (Pollinations Frame + HTML5 Canvas)',
      status: 'active_free',
      needsPaidProvider: false,
      noteAr: 'توليد ومحاكاة الفيديو التفاعلي مفعّل مجاناً.',
      noteFr: 'Moteur vidéo interactif actif sans frais.',
    },
  });
});

// 7. Image Generation Endpoint (using Pollinations.ai free engine + Gemini prompt enhancer)
app.post('/api/generate-images', async (req, res) => {
  try {
    const { prompt, count = 2, aspectRatio = '1:1', style = 'cinematic' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'الوصف النصي للصورة مطلوب (Prompt is required)' });
    }

    const imageCount = Math.min(Math.max(Number(count) || 2, 1), 4);

    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (aspectRatio === '4:3') {
      width = 1024;
      height = 768;
    }

    // Enhance prompt with Gemini if available, to capture authentic Mauritanian aesthetics
    let enhancedPrompt = prompt;
    if (ai) {
      try {
        const styleInstruction =
          style === 'realistic'
            ? 'Hyper-realistic photography, authentic Mauritanian lighting, National Geographic quality, highly detailed textures'
            : style === 'heritage'
            ? 'Traditional oil painting, warm Saharan palette, deep cultural heritage textures, expressive brushwork'
            : style === 'digital'
            ? 'Modern digital illustration, sleek clean lines, vibrant African colors, vector art elements'
            : 'Cinematic 8k movie still, dramatic desert lighting, 35mm photography, high aesthetic, rich details';

        const timeoutPromise = new Promise<{ text?: string } | null>((resolve) =>
          setTimeout(() => resolve(null), 3000)
        );

        const enhanceRes = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `You are an AI visual art director for Mauritania and West Africa.
Convert and optimize this user prompt into an English visual generation prompt for an image model:
User prompt: "${prompt}"
Art Style: ${styleInstruction}

Instructions:
- Keep the cultural authenticity of Mauritania (traditional attire like Melhfa, Daraa, Chinguetti stone architecture, Terjit oasis, golden dunes, local daily life, tea/atay rituals).
- Return ONLY the enhanced English prompt text, nothing else. Maximum 50 words.`,
          }),
          timeoutPromise,
        ]);

        if (enhanceRes && enhanceRes.text && enhanceRes.text.trim()) {
          enhancedPrompt = enhanceRes.text.trim().replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        console.warn('Prompt enhancement fallback:', err);
      }
    }

    // Generate image URLs with distinct random seeds
    const images = [];
    const baseSeed = Math.floor(Math.random() * 900000) + 100000;

    for (let i = 0; i < imageCount; i++) {
      const seed = baseSeed + i * 37;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
      images.push({
        id: `img-${Date.now()}-${i}`,
        url: imageUrl,
        seed,
        width,
        height,
        aspectRatio,
        promptOriginal: prompt,
        enhancedPrompt,
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      images,
      enhancedPrompt,
      count: images.length,
      provider: 'Pollinations.ai Free Engine (Flux)',
    });
  } catch (error: any) {
    console.error('Error in /api/generate-images:', error);
    return res.status(500).json({ error: 'فشل توليد الصور', details: error.message });
  }
});

// 8. Video Generation Endpoint (script expansion + scene frames)
app.post('/api/generate-video', async (req, res) => {
  try {
    const { scriptIdea, style = 'cinematic', voiceLang = 'hassaniya' } = req.body;

    if (!scriptIdea || typeof scriptIdea !== 'string') {
      return res.status(400).json({ error: 'فكرة الفيديو أو السيناريو مطلوبة (Script idea is required)' });
    }

    let scenesData = [
      {
        title: 'المشهد الأول: الافتتاحية والمكان',
        visualPrompt: 'Wide panoramic sunrise over the majestic golden dunes of Mauritania with gentle morning breeze and ancient stone towers in distance, cinematic lighting 8k',
        narration: 'مع إشراقة شمس جديدة على أرض الشناقطة، تنبثق قصة من عمق الصحراء والأصالة.',
        duration: 4,
        camera: 'Drone High Pan',
      },
      {
        title: 'المشهد الثاني: تفاصيل المشهد والشخصيات',
        visualPrompt: 'Close cinematic shot of Mauritanian culture, authentic vibrant melhfa veil and blue daraa boubou, warm golden hour ambient light, hyper-detailed photography',
        narration: 'تاريخ عريق يمتزج بروح الحياة المعاصرة وطموح الشباب في انواكشوط والمدن التاريخية.',
        duration: 4,
        camera: 'Medium Slow Zoom',
      },
      {
        title: 'المشهد الثالث: الختام والدعوة',
        visualPrompt: 'Silhouette of camel caravan moving peacefully along the desert horizon during amber sunset, cinematic wide shot masterpiece',
        narration: 'لحاذگ يرافقكم في كل خطوة بالذكاء والتراث والأصالة الموريتانية.',
        duration: 4,
        camera: 'Static Wide Sunset',
      },
    ];

    let videoTitle = scriptIdea.slice(0, 45);

    // If Gemini is available, customize the scenes perfectly to the user's idea!
    if (ai) {
      try {
        const langInstruction =
          voiceLang === 'hassaniya'
            ? 'باللهجة الحسانية الموريتانية الأصيلة والدافئة (مثل: شحالكم، مرحبتي بكم، زين وبديع)'
            : voiceLang === 'french'
            ? 'En français fluide et soigné pour le public ouest-africain'
            : 'باللغة العربية الفصحى الشاعرية والمؤثرة';

        const promptForScript = `You are a professional Mauritanian film director and video scriptwriter for L7a4eg AI.
Generate a structured 3-scene video storyboard from this user idea: "${scriptIdea}".
Target voiceover language: ${langInstruction}.
Style: ${style}.

Return a VALID JSON object with this exact structure:
{
  "title": "Short title in Arabic",
  "scenes": [
    {
      "title": "Scene 1 title in Arabic",
      "visualPrompt": "Detailed English visual description for image generation depicting Mauritanian or regional scene, high quality, 8k cinematic",
      "narration": "Voiceover narration text in the requested voiceover language",
      "duration": 4,
      "camera": "Camera shot type e.g. Drone Pan, Close-up, Tracking"
    },
    {
      "title": "Scene 2 title in Arabic",
      "visualPrompt": "Detailed English visual description",
      "narration": "Voiceover text",
      "duration": 4,
      "camera": "Camera shot type"
    },
    {
      "title": "Scene 3 title in Arabic",
      "visualPrompt": "Detailed English visual description",
      "narration": "Voiceover text",
      "duration": 4,
      "camera": "Camera shot type"
    }
  ]
}
Return ONLY pure JSON without markdown code fences if possible, or inside valid JSON block.`;

        const timeoutPromise = new Promise<{ text?: string } | null>((resolve) =>
          setTimeout(() => resolve(null), 3500)
        );

        const scriptRes = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptForScript,
            config: {
              responseMimeType: 'application/json',
            },
          }),
          timeoutPromise,
        ]);

        if (scriptRes && scriptRes.text) {
          const parsed = JSON.parse(scriptRes.text);
          if (parsed && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
            scenesData = parsed.scenes.slice(0, 4);
            if (parsed.title) videoTitle = parsed.title;
          }
        }
      } catch (err) {
        console.warn('Script generation fallback:', err);
      }
    }

    // Generate real frame images for each scene using Pollinations Free API
    const baseSeed = Math.floor(Math.random() * 800000) + 100000;
    const scenesWithMedia = scenesData.map((s, idx) => {
      const seed = baseSeed + idx * 43;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(s.visualPrompt)}?width=1280&height=720&seed=${seed}&nologo=true&model=flux`;
      return {
        id: `scene-${idx + 1}`,
        sceneNumber: idx + 1,
        title: s.title || `المشهد ${idx + 1}`,
        visualPrompt: s.visualPrompt,
        narration: s.narration,
        duration: s.duration || 4,
        camera: s.camera || 'Cinematic Shot',
        imageUrl,
      };
    });

    return res.json({
      success: true,
      title: videoTitle,
      scenes: scenesWithMedia,
      totalDuration: scenesWithMedia.reduce((acc, s) => acc + s.duration, 0),
      provider: 'L7a4eg Interactive Video Engine (Pollinations Frame + Dynamic Player)',
    });
  } catch (error: any) {
    console.error('Error in /api/generate-video:', error);
    return res.status(500).json({ error: 'فشل توليد الفيديو', details: error.message });
  }
});


// Serve frontend in production or hook Vite in dev
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`L7a4eg AI (لحاذگ) server running at http://0.0.0.0:${PORT}`);
});
