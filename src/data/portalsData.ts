import { PortalItem, QuickPortalId } from '../types';

export interface PortalCategoryMeta {
  id: QuickPortalId;
  titleAr: string;
  titleFr: string;
  subtitleAr: string;
  iconName: string;
  colorClass: string;
  badgeCount: number;
}

export const PORTAL_CATEGORIES: PortalCategoryMeta[] = [
  {
    id: 'celebrity',
    titleAr: 'أخبار المشاهير والمجتمع',
    titleFr: 'Célébrités & Société',
    subtitleAr: 'نشاطات الشباب، الثقافة، الرياضة، ومبادرات المجتمع',
    iconName: 'Sparkles',
    colorClass: 'from-amber-500/20 to-orange-500/10 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-700/50',
    badgeCount: 6,
  },
  {
    id: 'startups',
    titleAr: 'أخبار المشاريع وريادة الأعمال',
    titleFr: 'Startups & Entrepreneuriat',
    subtitleAr: 'تمويلات، حاضنات، مسرعات، وفرص عمل للشباب الموريتاني',
    iconName: 'Rocket',
    colorClass: 'from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/50',
    badgeCount: 8,
  },
  {
    id: 'tenders',
    titleAr: 'أخبار المناقصات والصفقات',
    titleFr: 'Marchés Publics & Appels d\'Offres',
    subtitleAr: 'مناقصات الوزارات، البلديات، كراسات الشروط، وفرص التوريد',
    iconName: 'Briefcase',
    colorClass: 'from-sky-500/20 to-blue-500/10 text-sky-700 dark:text-sky-300 border-sky-300/60 dark:border-sky-700/50',
    badgeCount: 5,
  },
  {
    id: 'curriculum',
    titleAr: 'المناهج والكتب ودفاتر الأساتذة',
    titleFr: 'Programmes, Manuels & Fiches',
    subtitleAr: 'كتب المعهد التربوي IPN، مواضيع الباكلوريا، وجذاذات التحضير',
    iconName: 'BookOpen',
    colorClass: 'from-purple-500/20 to-indigo-500/10 text-purple-700 dark:text-purple-300 border-purple-300/60 dark:border-purple-700/50',
    badgeCount: 12,
  },
];

export const PORTAL_ITEMS: PortalItem[] = [
  // 1. Celebrity & Society
  {
    id: 'cel-1',
    portalId: 'celebrity',
    title: 'تألق المرابطون في تصفيات الشباب والناشئين بأكاديمية الفاف',
    summary: 'بروز مواهب موريتانية واعدة في ملاعب شيخا بيديا وانتقال لاعبين شباب إلى أندية إفريقية وأوروبية بارزة.',
    categoryTag: 'رياضة وشباب',
    date: 'أكتوبر 2026',
    badge: 'ترند محلي',
    promptToAsk: 'حدثني عن أحدث أخبار منتخب المرابطون وتألق الشباب الموريتاني في البطولات الإقليمية.',
  },
  {
    id: 'cel-2',
    portalId: 'celebrity',
    title: 'استعدادات الدورة القادمة لمهرجان مدائن التراث التاريخية',
    summary: 'إطلاق مسابقات المخطوطات والشعر الفصيح والحساني، ومشاركة واسعة لنوادي الشباب المتطوعين في وادان وشنقيط.',
    categoryTag: 'ثقافة ومجتمع',
    date: 'موسم 2026',
    badge: 'ثقافة',
    promptToAsk: 'ما هي فعاليات مهرجان مدائن التراث ومشاركات الشباب في صون التراث الشنقيطي والمسابقات؟',
  },
  {
    id: 'cel-3',
    portalId: 'celebrity',
    title: 'مبادرات التشجير وتثبيت الرمال حول العاصمة نواكشوط',
    summary: 'حملات تطوعية شبابية مكثفة بمشاركة عشرات الجمعيات الأهلية لتشجير الحزام الأخضر وحماية الأحياء من الرمال.',
    categoryTag: 'عمل تطوعي',
    date: 'مبادرة مستمرة',
    badge: 'تطوع',
    promptToAsk: 'كيف أشارك في مبادرات التشجير والعمل التطوعي للشباب في نواكشوط وما الجمعيات الفاعلة؟',
  },

  // 2. Startups & Entrepreneurship
  {
    id: 'sta-1',
    portalId: 'startups',
    title: 'فتح باب التقديم لتمويلات المشاريع الصغرى لدى صندوق الإيداع والتنمية CDD',
    summary: 'قروض شرفية ميسرة بدون فوائد ربوية موجهة لخريجي الجامعات وحملة الشهادات الراغبين في إنشاء مشاريعهم الخاصة.',
    categoryTag: 'تمويل شبابي',
    date: 'متاح الآن',
    badge: 'فرصة تمويل',
    promptToAsk: 'ما هي شروط وإجراءات التقديم على تمويل المشاريع من صندوق الإيداع والتنمية CDD أو مشروع مهنتي؟',
  },
  {
    id: 'sta-2',
    portalId: 'startups',
    title: 'إطلاق الدفعة الجديدة من برنامج احتضان الشركات الناشئة في Hadina RIM TIC',
    summary: 'مرافقة تقنية وقانونية لمدة 6 أشهر مع مساحة عمل مجانية وفرص لقاء مستثمرين ملائكيين في نواكشوط.',
    categoryTag: 'حاضنات تقنية',
    date: 'الدفعة الجديدة',
    badge: 'احتضان',
    promptToAsk: 'كيف أقدم فكرة مشروعي التقني إلى حاضنة ريم تيك Hadina RIM TIC وما الخدمات المقدمة؟',
  },
  {
    id: 'sta-3',
    portalId: 'startups',
    title: 'ازدهار التجارة الرقمية والدفع عبر تطبيقات البنوك الموريتانية',
    summary: 'نمو متسارع لمتاجر التوصيل والخدمات بالاعتماد على حلول الدفع (بيم بنك، السداد، المصرفي، كاش، كليك).',
    categoryTag: 'تكنولوجيا مالية',
    date: 'تحليل اقتصادي',
    badge: 'تيفاية رقمية',
    promptToAsk: 'كيف أبدأ مشروع تجارة إلكترونية في موريتانيا وأربطه بوسائل الدفع الإلكتروني المعتمدة؟',
  },

  // 3. Government Tenders & Procurement
  {
    id: 'ten-1',
    portalId: 'tenders',
    title: 'طلب عروض مفتوح: تجهيز شبكات الألياف البصرية ومراكز بيانات بالداخل',
    summary: 'مناقصة صادرة عن وزارة التحول الرقمي والابتكار وعصرنة الإدارة، مفتوحة للشركات والمؤسسات التقنية المحلية.',
    categoryTag: 'صفقة عمومية',
    date: 'آخر أجل: قريباً',
    badge: 'مناقصة رسمية',
    promptToAsk: 'ما هي خطوات وإجراءات المشاركة في مناقصات قطاع التحول الرقمي والتقنيات في موريتانيا؟',
  },
  {
    id: 'ten-2',
    portalId: 'tenders',
    title: 'مناقصة بلدية تفرغ زينة وعرفات: تأهيل الساحات والإنارة الذكية بالطاقة الشمسية',
    summary: 'مشروع موجه لمقاولي الأشغال العامة وتوريد أنظمة الطاقة النظيفة المسجلين في لائحة الموردين المعتمدين.',
    categoryTag: 'صفقات بلديات',
    date: 'جارية',
    badge: 'أشغال وتوريد',
    promptToAsk: 'كيف تسجل شركة جديدة في بوابة الصفقات العمومية ARMP وما الوثائق المطلوبة؟',
  },
  {
    id: 'ten-3',
    portalId: 'tenders',
    title: 'دليل الحصول على كراسة الشروط (DAO) ونموذج الضمان البنكي الأولي',
    summary: 'شرح مفصل لطريقة إعداد العرض الفني والمالي والتأكد من مطابقة شروط سلطة تنظيم الصفقات العمومية.',
    categoryTag: 'إرشادات المناقصات',
    date: 'دليل إرشادي',
    badge: 'دليل قانوني',
    promptToAsk: 'اشرح لي كيفية إعداد ملف مناقصة عمومية في موريتانيا والفرق بين العرض الفني والمالي.',
  },

  // 4. Curriculum, Textbooks & Teachers' Notebooks
  {
    id: 'cur-1',
    portalId: 'curriculum',
    title: 'كتب ومناهج المعهد التربوي الوطني (IPN) المحدثة للمرحلة الثانوية',
    summary: 'الكتب الرسمية لمواد العلوم الطبيعية، الرياضيات، الفيزياء، واللغة العربية وفق الإصلاح التعليمي الأخير.',
    categoryTag: 'كتب رسمية',
    date: 'العام الدراسي الحالي',
    badge: 'IPN معتمد',
    promptToAsk: 'أريد روابط وتفاصيل كتب المعهد التربوي الوطني IPN للسنوات الختامية من الثانوية العامة.',
  },
  {
    id: 'cur-2',
    portalId: 'curriculum',
    title: 'بنك مواضيع الباكلوريا الوطنية وحلولها النموذجية (شعبة العلوم والرياضيات)',
    summary: 'أرشيف امتحانات الباكلوريا الموريتانية مع عناصر الإجابة الرسمية وسلم التنقيط المعتمد من وزارة التهذيب.',
    categoryTag: 'امتحانات وباكلوريا',
    date: '2018 - 2025',
    badge: 'باكلوريا RIM',
    promptToAsk: 'أعطني استراتيجية مراجعة مادة العلوم الطبيعية أو الرياضيات للباكلوريا الموريتانية مع نماذج أسئلة وحلول.',
  },
  {
    id: 'cur-3',
    portalId: 'curriculum',
    title: 'دفاتر تحضير الدروس النموذجية وجذاذات التقييم للأساتذة والمعلمين',
    summary: 'جذاذات بيداغوجية مكتملة تحترم التوزيع السنوي لمفتشية التعليم الثانوي والأساسي لجميع المواد الدراسية.',
    categoryTag: 'دفاتر الأساتذة',
    date: 'جذاذات جاهزة',
    badge: 'بيداغوجيا',
    promptToAsk: 'صمم لي جذاذة تحضير درس نموذجية وفق منهج المقاربة بالكفايات المعتمد في التعليم الموريتاني.',
  },
];

// Smart alternative exploration indices ("هل تبحث عن...؟")
export const SMART_SEARCH_ALTERNATIVES: { [key: string]: { label: string; prompt: string; icon: string }[] } = {
  general: [
    { label: 'فرص تمويل المشاريع للشباب', prompt: 'ما هي أهم برامج تمويل مشاريع الشباب الحالية في موريتانيا وشروط الاستفادة؟', icon: 'Rocket' },
    { label: 'تحويل الأوقية والعملات الأجنبية', prompt: 'كم سعر صرف الأوقية الموريتانية اليوم مقابل اليورو والدولار في البنك المركزي؟', icon: 'Coins' },
    { label: 'سلاسل تمارين وحلول الباكلوريا', prompt: 'قدم لي مسائل محلولة في العلوم الطبيعية أو الرياضيات للباكلوريا الموريتانية.', icon: 'BookOpen' },
    { label: 'شرح أمثال وحكم حسانية أصيلة', prompt: 'اشرح لي مثل حساني موريتاني شهير وسياقه وحكمته الشعبية.', icon: 'Sparkles' },
  ],
  startups: [
    { label: 'كيف أؤسس شركة SARL في نواكشوط؟', prompt: 'ما هي خطوات تأسيس شركة ذات مسؤولية محدودة SARL في موريتانيا من السجل التجاري إلى الضرائب؟', icon: 'FileText' },
    { label: 'نموذج دراسة جدوى تجارة في تفرغ زينة', prompt: 'أريد نموذج دراسة جدوى مبسطة لمشروع شبابي صغير برأس مال 50 ألف أوقية جديدة.', icon: 'TrendingUp' },
  ],
  curriculum: [
    { label: 'منهجية الفلسفة للباكلوريا الموريتانية', prompt: 'اشرح لي منهجية تحليل نص فلسفي أو معالجة سؤال إشكالي في الباكلوريا الوطنية.', icon: 'GraduationCap' },
    { label: 'دفتر تحضير مادة اللغة العربية', prompt: 'أعطني نموذج جذاذة تحضير درس نصوص وقواعد لأساتذة التعليم الثانوي.', icon: 'BookOpen' },
  ],
};
