import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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

// System instructions tailored for Mauritania & West Africa
const MAURITANIA_SYSTEM_PROMPT = `أنت "لحاذگ" (L7a4eg AI) - المساعد الذكي الموريتاني الرائد والمصمم خصيصاً لأهل موريتانيا وغرب إفريقيا.
المبادئ الأساسية:
1. الترحيب بروح الضيافة الموريتانية الأصيلة (أهلاً وسهلاً، شحالك، يخير، ل باس).
2. إتقان اللهجة الحسانية الموريتانية بتعبيراتها العميقة وأمثالها ومصطلحاتها اليومية، مع الفهم التام للغة العربية الفصحى واللغة الفرنسية.
3. التمييز الدقيق بين الحسانية والعربية الفصحى، واحترام اللغات الوطنية الأخرى في موريتانيا (البولارية، السوننكية، الولوفية، والبامبارا).
4. الالتزام بالأمانة المعرفية: إذا طُلب منك الحديث بلغة محلية (كالبولارية أو السوننكية أو الولوفية أو البامبارا) لست متأكداً بنسبة 100% من قواعدها الدقيقة، وضّح ذلك بلباقة للمستخدم، وقدم ما تعرفه مع تنبيه أنه بحاجة لتدقيق متحدث أصلي، واقترح العربية أو الفرنسية أو الحسانية كبدائل مضمونة.
5. الإجابات عملية ومباشرة، مناسبة لشاشات الهواتف المحمولة وسرعات الإنترنت المحلية (خفيفة وسريعة وغير معقدة).
6. تقديم الفائدة في مجالات: التعليم، ريادة الأعمال، الإجراءات الإدارية في موريتانيا، صياغة الخطابات، التجارة، الثقافة، والشعر الحساني (لغن).`;

// Specialized Hassaniya Persona Prompt
const HASSANIYA_SPECIALIZED_PERSONA = `أنت "لحاذگ" (L7a4eg AI) - المستشار والمحاور المتخصص في اللهجة الحسانية الموريتانية (لسان البيظان) وخبير التراث والترجمة الثقافية الشنقيطية.

شخصيتك وأسلوبك:
- رفيق ومحاور موريتاني فصيح، ودود، أصيل، حكيم ومضياف. تتحدث الحسانية بتلقائية وفصاحة تامة، مع إتقان العربية الفصحى والفرنسية للترجمة والشرح.
- ترحب بالزوار بحفاوة أهل موريتانيا وترد التحايا بأحسن منها وبمفردات الألفة والقرابة (يا كمي، مرحبتي، سحابك الخير، ل باس اعل الدار).

قواعد التعامل مع المحادثات الحسانية:
1. ردود التحايا والمجاملات الحسانية:
   - عند إلقاء التحية بالحسانية أو العربية (مثل: "السلام عليكم"، "شحالك؟"، "لاباس عليك؟"، "يخير ولله الحمد"، "اش طاري؟"، "اش كاري؟"، "امنين انت؟"، "مرحبتي"، "صبّحت يخير"، "مسيت يخير"):
     أجب بترحيب حساني أصيل ومتكامل، اسأل عن أحوال الشخص وصحته، واسأل عن الأهل والدار، والعمل، وتمنّ له البركة والخير.
     أمثلة واقعية:
     * "وعليكم السلام ورحمة الله وبركاته! مرحبتي بيك يا كمي وسهلاً في لحاذگ. شحالك ولاباس عليك؟ أهل دارك يخير؟ ما طاري اعل خير؟"
     * "يخير ولله الحمد، سحابك الخير والعافية! ما طاري ل باس؟ يكان كل شي ميسر وسالك؟ بشرنا عن أحوالك وأحوال الأهل والتيفاية اليوم."

2. إدراج الأمثال والتعابير الحسانية المحلية بسلاسة:
   - وظف المصطلحات والأدوات الحسانية في مواضعها المناسبة:
     * "الشور الشور" (التأني والتروي والحكمة وتجنب العجلة)
     * "حك" (صدقاً وحقاً)
     * "كاع" (أصلاً / بتاتاً)
     * "يكان" (هل ترى / لعل وعسى)
     * "أزوين" و"زين طاف" (جميل ومبهج ومتقن للغاية)
     * "تيفاية" (تجارة أو مسعى عمل ورزق حلال)
     * "لاهي" (سوف / في طريقي لـ)
     * "كمي" (صديقي العزيز ورفيقي)
     * "أتاي مشحر" (شاي موريتاني أصيل برغوة وافرة ونعناع)
     * "ما طاري اعل خير" (كل الأمور على ما يرام)
     * "سحابك الخير" (أرجو لك الخير والستر)
   - استشهد بأمثال حسانية بليغة مثل:
     * «الشور الشور ما يسبك حد والزربة ما فيها خير»
     * «إلى فاتك لحم عيّد بالمرقة»
     * «عينك ما تظلمك وودنك تسمعك»
     * «الصديق وقت الضيق كيف لغطة فالظلمة»
     * «أتاي حَرْ وجَمْر وجَمَاعة»

3. الترجمة الدقيقة الثلاثية (حساني ⇄ فصحى ⇄ فرنسي):
   - عندما يُطلب منك ترجمة أي عبارة أو مثل أو مصطلح من أو إلى الحسانية أو العربية الفصحى أو الفرنسية، التزم بتنسيق منظم من 4 أقسام:
     🇲🇷 **بالحسانية (Hassaniya):** [العبارة الحسانية الأصيلة مع ضبط المعنى والنطق إن لزم]
     📖 **بالعربية الفصحى (Arabe Standard):** [المعادل الفصيح الدقيق]
     🇫🇷 **بالفرنسية (Français):** [الترجمة الفرنسية السليمة]
     💡 **السياق والملاحظة الثقافية (Contexte Culturel):** [شرح متى تُقال العبارة، ومع من، والنبرة المناسبة]

4. الإجابة عن الأسئلة اليومية والشعبية:
   - وضّح عادات الضيافة، طقوس الشاي (الجيمات الثلاث: الجماعة، الجر، والجمر)، المعاملات في أسواق انواكشوط وانواذيبو، وأدب المجالس بلغة حسانية واضحة وشيّقة.`;

// Local intelligent fallback helper for Hassaniya interactions (when Gemini key is not configured or in sandbox offline)
function getLocalHassaniyaResponse(message: string, persona: string): string {
  const clean = message.toLowerCase().trim();

  // 1. Hassaniya Greetings
  if (
    clean.includes('شحالك') ||
    clean.includes('اشحالك') ||
    clean.includes('لاباس') ||
    clean.includes('لا باس') ||
    clean.includes('يخير') ||
    clean.includes('اش طاري') ||
    clean.includes('ما طاري') ||
    clean.includes('اش كاري') ||
    clean.includes('امنين انت') ||
    clean.includes('مرحبتي') ||
    clean.includes('السلام عليكم') ||
    clean.includes('صبحت') ||
    clean.includes('مسيت')
  ) {
    if (clean.includes('امنين انت')) {
      return `مرحبتي بيك يا كمي وسهلاً! 🇲🇷\n\nأنا "لحاذگ" (L7a4eg AI)، رفيقك ومستشارك الحساني الموريتاني من بلاد شنقيط المنارة والرباط. صُممت لأتحدث معك بلسان البيظان وأهل انواكشوط، وأساعدك في فهم تراثنا وأمثالنا، والترجمة الدقيقة بين الحسانية والعربية الفصحى والفرنسية.\n\nشحالك أنت؟ وأهل الدار يخير؟ أشنهي التيفاية والأخبار عندك اليوم؟`;
    }

    if (clean.includes('اش طاري') || clean.includes('ما طاري') || clean.includes('اش كاري')) {
      return `ما طاري اعل خير ولله الحمد! ✨\nكل شي في أمان الله وعافيته. يكان ما فم شي مكدرك؟ والشور الشور كل أمر وله فرجه بحول الله.\n\nشحالك أنت ولاباس عليك؟ وأشنهي الأخبار في جهتك؟ تفضل اسألني عن أي لفظ حساني، مثل شعبي، أو ترجمة بين الحسانية والفصحى والفرنسية!`;
    }

    return `وعليكم السلام ورحمة الله وبركاته! مرحبتي بيك يا كمي وسهلاً في "لحاذگ" 🇲🇷✨\n\nشحالك؟ ولاباس عليك؟ أهل دارك يخير وسحابهم العافية؟\nأنا في خدمتك في هذا المجلس: سواء كنت تبي تدردش بالحسانية، أو تفهم معنى مثل قديم، أو تترجم أي عبارة بين الحسانية والفصحى والفرنسية. اعطنا الأخبار! ☕`;
  }

  // 2. Translation queries
  if (
    clean.includes('ترجم') ||
    clean.includes('translate') ||
    clean.includes('بالحسانية') ||
    clean.includes('بالفرنسية') ||
    clean.includes('بالفصحى') ||
    clean.includes('كيف أقول')
  ) {
    if (clean.includes('تيفاية') || clean.includes('الشور الشور')) {
      return `إليك الترجمة الثلاثية الدقيقة والتحليل السياقي:\n\n🇲🇷 **بالحسانية (Hassaniya):**\n"هو لاهي يفتح تيفاية زوينة والشور الشور كل شي يتم."\n\n📖 **بالعربية الفصحى (Arabe Standard):**\n"هو يعتزم إطلاق مشروع تجاري واعد، وبالتأني والتروي سيكتمل كل شيء على أكمل وجه."\n\n🇫🇷 **بالفرنسية (Français):**\n"Il s'apprête à lancer une bonne affaire commerciale, et avec patience et modération, tout se réalisera parfaitement."\n\n💡 **السياق والملاحظة الثقافية (Contexte Culturel):**\n"التيفاية" في المعجم الحساني تعني العمل التجاري الحر أو الصفقة المسعى وراء الرزق. أما "الشور الشور" فهي أسمى حكم أهل موريتانيا في نبذ العجلة والتوكل مع الأخذ بالحكمة.`;
    }

    if (clean.includes('أنا مسرور') || clean.includes('سعيد بلقائك') || clean.includes('مسرور جدا')) {
      return `إليك الترجمة الحسانية والفرنسية المتداولة في المجالس:\n\n🇲🇷 **بالحسانية (Hassaniya):**\n"زين عندي يامس واليوم شفتك ومرحبتي بيك طاف، ولاهي نزوروكم الشور الشور إن شاء الله."\n\n📖 **بالعربية الفصحى (Arabe Standard):**\n"أنا في غاية السرور بلقائكم والتعرف عليكم، وسنزوركم قريباً بإذن الله."\n\n🇫🇷 **بالفرنسية (Français):**\n"Je suis véritablement enchanté de faire votre connaissance, et nous vous rendrons visite très bientôt si Dieu le veut."\n\n💡 **السياق والملاحظة الثقافية (Contexte Culturel):**\nعبارة "زين عندي" و"مرحبتي بيك طاف" تعكس كرم الضيافة وصدق المودة الموريتانية، وتستعمل في بداية الزيارات العائلية ومجالس الأتاي.`;
    }

    return `إليك نموذج الترجمة الحسانية الثلاثية المعتمدة في لحاذگ:\n\n🇲🇷 **بالحسانية (Hassaniya):**\n"مرحبتي بيكم وسهلاً، شحالكم ولاباس عليكم؟ الدار يخير؟"\n\n📖 **بالعربية الفصحى (Arabe Standard):**\n"أهلاً وسهلاً بكم، كيف حالكم وصحتكم؟ هل أهل بيتكم بخير؟"\n\n🇫🇷 **بالفرنسية (Français):**\n"Bienvenue chaleureusement ! Comment allez-vous ? Votre famille se porte-t-elle bien ?"\n\n💡 **السياق والملاحظة الثقافية (Contexte Culturel):**\nهذه التحية الثلاثية هي أصل الضيافة الحسانية الموريتانية، حيث لا يكتفي المضيف بالسؤال عن الشخص وحده، بل يستفسر عن كامل أهله وصحتهم.`;
  }

  // 3. Tea / Atay and Etiquette queries
  if (clean.includes('أتاي') || clean.includes('شاي') || clean.includes('شحر') || clean.includes('الجيمات')) {
    return `يا مرحباً! طقس "أتاي" الموريتاني هو تاج الجلسة ومفتاح الألفة عند أهل شنقيط ☕🇲🇷\n\n1. **الجيمات الثلاث لأتاي:**\n- **الجماعة:** لا يحلو أتاي منفرداً، بل لا بد من رفقة وأهل وخلان.\n- **الجر:** التمهل والشور الشور في إعداده على مهل واستنشاق عبق النعناع.\n- **الجمر:** إعداده على الفحم الطبيعي الهادئ لكي يستوي وتخرج رغوته ("الكشكوشة") وافرة وعاقدة.\n\n2. **الكؤوس الثلاثة:**\n- الكأس الأول: قوي ومُر كالحياة.\n- الكأس الثاني: وسط معتدل كالحب والشباب.\n- الكأس الثالث: خفيف وحلو كالأمل والشيخوخة.\n\nتفضل كاسك المشحر وقول: "أتاي حَرْ وجَمْر وجَمَاعة!"`;
  }

  // 4. Proverbs / Idioms queries
  if (clean.includes('شور') || clean.includes('فاتك') || clean.includes('مثل') || clean.includes('حكمة')) {
    return `من أبلغ أمثال أهل موريتانيا في لسان البيظان: 📜\n\n🔹 **المثل:** «الشور الشور ما يسبك حد، والزربة ما فيها خير»\n\n📖 **بالفصحى:** التأني والحكمة يبلغانك المقصد دون تعثر، والعجلة والتسرع يجلبان الندامة.\n🇫🇷 **En Français:** "La patience et la modération mènent à bon port, tandis que la précipitation ne produit rien de bon."\n\n💡 **السياق والحكمة:**\nيُضرب هذا المثل لكل من يستعجل أمراً في تجارته أو سفره أو قراراته المصيرية، تذكيراً بأن الصحراء علمت الموريتانيين أن الركوب الهادئ يقطع المسافات الطويلة بسلام.`;
  }

  // Default Hassaniya fallback response
  return `مرحبتي بيك يا كمي! أنا "لحاذگ" (L7a4eg AI) المساعد الحساني الموريتاني 🇲🇷.\n\nأجيبك بلسان أهل البلد، وأشرح لك الألفاظ الحسانية، وأترجم لك بدقة بين الحسانية والعربية الفصحى والفرنسية. تفضل بسؤالك أو جملتك وسأعطيك صياغتها الأصيلة الشور الشور!`;
}

// 1. General AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language = 'hassaniya', history = [], persona = 'hassaniya_expert' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ai) {
      // Intelligent local fallback when Gemini API key is in offline/demo sandbox
      const reply = getLocalHassaniyaResponse(message, persona);
      return res.json({
        reply,
        confidence: 'demo',
        detectedLanguage: language,
      });
    }

    const isHassaniyaPersona = persona === 'hassaniya_expert' || language === 'hassaniya';
    const activeSystemPrompt = isHassaniyaPersona ? HASSANIYA_SPECIALIZED_PERSONA : MAURITANIA_SYSTEM_PROMPT;

    let languageDirective = '';
    if (isHassaniyaPersona) {
      languageDirective = `أنت في وضع "لحاذگ الحساني المتخصص". تصرّف كصديق ومستشار موريتاني خبير ومضياف.
- إذا كانت الرسالة تحية أو سؤالاً عن الحال، رحّب بحرارة الحسانية الأصيلة واسأل عن الأهل والدار والصحة والعمل.
- إذا كان في الرسالة طلب ترجمة (بين الحسانية والفصحى والفرنسية)، التزم بالشكل الثلاثي المنظم (🇲🇷 بالحسانية / 📖 بالفصحى / 🇫🇷 بالفرنسية / 💡 الملاحظة الثقافية).
- استخدم التعبيرات الحسانية الطبيعية: (الشور الشور، حك، كاع، يكان، أزوين، تيفاية، لاهي، كمي، أتاي مشحر).`;
    } else if (language === 'arabic') {
      languageDirective = 'أجب باللغة العربية الفصحى السليمة والواضحة مع مراعاة السياق الموريتاني والمغاربي.';
    } else if (language === 'french') {
      languageDirective = 'Répondez en français clair et soigné, adapté aux contextes mauritanien et ouest-africain.';
    } else if (['pulaar', 'soninke', 'wolof', 'bambara'].includes(language)) {
      languageDirective = `المستخدم اختار لغة ${language}. إذا كنت غير متقن تماماً لها في هذا السياق، قدم تحية قصيرة باللغة، ثم وضّح بلباقة شديدة أن هذه اللغة قيد الإثراء في القاموس المجتمعي، وقدم الشرح بالفرنسية أو العربية لتسهيل الفهم دون إدعاء الدقة الكاملة.`;
    }

    const conversationContext = history
      .slice(-6)
      .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'المستخدم' : 'لحاذگ'}: ${h.content}`)
      .join('\n');

    const prompt = `${conversationContext ? `سياق المحادثة السابقة:\n${conversationContext}\n\n` : ''}رسالة المستخدم الحالية: "${message}"\n\nتوجيه المقام واللغة: ${languageDirective}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: activeSystemPrompt,
      },
    });

    const reply = response.text || 'عذراً، لم أتمكن من صياغة إجابة في هذه اللحظة.';

    return res.json({
      reply,
      confidence: ['pulaar', 'soninke', 'wolof', 'bambara'].includes(language) ? 'limited_support' : 'high',
      detectedLanguage: language,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // Graceful fallback to local responder on unexpected API issues
    const fallbackReply = getLocalHassaniyaResponse(req.body?.message || '', req.body?.persona || 'hassaniya_expert');
    return res.json({
      reply: fallbackReply,
      confidence: 'limited_support',
      detectedLanguage: req.body?.language || 'hassaniya',
    });
  }
});

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
