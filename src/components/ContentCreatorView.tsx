import React, { useState } from 'react';
import {
  PenTool,
  Share2,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  Video,
  ShoppingBag,
  Send,
  RefreshCw,
} from 'lucide-react';
import { generateMarketingContent } from '../services/api';

const CONTENT_TYPES = [
  {
    id: 'whatsapp_ad',
    label: 'رسالة واتساب ترويجية',
    icon: MessageCircle,
    desc: 'رسالة تسويقية قصيرة وجذابة مع روابط وأرقام للتواصل السريع',
  },
  {
    id: 'reels_script',
    label: 'سيناريو ريلز وتيك توك',
    icon: Video,
    desc: 'خطاف بصري في أول 3 ثوانٍ + نص سريع + دعوة للتحرك',
  },
  {
    id: 'facebook_post',
    label: 'منشور فيسبوك وإعلانات',
    icon: Share2,
    desc: 'منشور تفاعلي غني بالهاشتاغات المتداولة في موريتانيا',
  },
  {
    id: 'shop_launch',
    label: 'إعلان افتتاح أو تخفيضات',
    icon: ShoppingBag,
    desc: 'إعلان حماسي لمتجر ملابس، مطعم، أو خدمة في انواكشوط والداخل',
  },
];

const PRESET_MAURITANIAN_IDEAS = [
  {
    title: 'متجر ملاحف ودراعات فاخرة 👘',
    type: 'whatsapp_ad',
    topic: 'تخفيضات 20% على أجود الملاحف الموريتانية ودراعات أزبي وكونتي بمناسبة العيد في تفرغ زينة مع خدمة التوصيل السريع لجميع المقاطعات والدفع عبر بنكيلي وسداد.',
    style: 'حسانية محببة وراقية',
  },
  {
    title: 'تطبيق أو خدمة تحويل مالي / بنكيلي 💳',
    type: 'reels_script',
    topic: 'فيديو تيك توك فكاهي عن شخص يبحث عن صرافة أو فكة في كابيتال قبل أن يكتشف سهولة الدفع الإلكتروني عبر الهاتف في ثانية واحدة.',
    style: 'حسانية عصرية شبابية',
  },
  {
    title: 'افتتاح مطعم شواء ومأكولات بحرية في نواذيبو 🐟',
    type: 'facebook_post',
    topic: 'افتتاح فرع جديد لأشهى الأسماك الطازجة والمشاوي على شاطئ كانصادو مع جلسات عائلية مريحة وأسعار مناسبة.',
    style: 'عربية تسويقية ممزوجة بالحسانية',
  },
  {
    title: 'خدمات تصليح وبرمجة هواتف وحواسيب 📱',
    type: 'shop_launch',
    topic: 'ورشة صيانة هواتف ذكية وحواسيب في لكصر مع قطع غيار أصلية وضمان 3 أشهر وسرعة في الإنجاز.',
    style: 'فرنسية وعربية تسويقية',
  },
];

export const ContentCreatorView: React.FC = () => {
  const [contentType, setContentType] = useState('whatsapp_ad');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('الشباب ورواد الأعمال والزبائن في موريتانيا');
  const [languageStyle, setLanguageStyle] = useState('حسانية عصرية قريبة من القلب');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (presetTopic?: string, presetType?: string, presetStyle?: string) => {
    const finalTopic = presetTopic || topic;
    const finalType = presetType || contentType;
    const finalStyle = presetStyle || languageStyle;

    if (!finalTopic.trim() || isLoading) return;

    setIsLoading(true);
    setGeneratedContent('');

    try {
      const res = await generateMarketingContent(finalType, finalTopic, targetAudience, finalStyle);
      setGeneratedContent(res.content);
    } catch (err: any) {
      setGeneratedContent('عذراً، حدث خطأ أثناء صياغة المحتوى. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsApp = () => {
    if (!generatedContent) return;
    const url = `https://wa.me/?text=${encodeURIComponent(generatedContent)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-3 sm:p-6 space-y-5 pb-24 md:pb-12">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <PenTool className="w-6 h-6 text-emerald-400" />
          <span>صانع المحتوى والتسويق الموريتاني 🇲🇷</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          صياغة إعلانات واتساب، منشورات فيسبوك، وسيناريوهات ريلز مخصصة للجمهور الموريتاني والغرب إفريقي
        </p>
      </div>

      {/* Content Type Picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CONTENT_TYPES.map((t) => {
          const Icon = t.icon;
          const isActive = contentType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setContentType(t.id)}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-emerald-950/70 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
              </div>
              <h4 className={`font-bold text-xs sm:text-sm ${isActive ? 'text-emerald-300' : 'text-white'}`}>
                {t.label}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Generator Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            وصف المنتج، الخدمة، أو فكرة الإعلان *
          </label>
          <textarea
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="مثال: تخفيضات في متجر ملابس وملاحف نسائية بمناسبة موسم الأعراس في انواكشوط، متوفر التوصيل السريع والدفع عند الاستلام أو عبر بنكيلي وسداد..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">الأسلوب اللغوي</label>
            <select
              value={languageStyle}
              onChange={(e) => setLanguageStyle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="حسانية عصرية قريبة من القلب">حسانية عصرية محببة (شعبية راقية)</option>
              <option value="عربية تسويقية فصحى مشوقة">عربية فصحى مشوقة واحترافية</option>
              <option value="فرنسية أنيقة ومباشرة">Français commercial direct</option>
              <option value="مزيج حساني وفرنسي معاصر">مزيج حساني وفرنسي (مثل حديث شباب انواكشوط)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">الجمهور المستهدف</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="مثال: رواد الأعمال، النساء، الشباب، أهالي انواكشوط..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => handleGenerate()}
            disabled={!topic.trim() || isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              topic.trim() && !isLoading
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري صياغة المحتوى الموريتاني...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>أنشئ المحتوى فوراً</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Ideas Inspiration */}
      {!generatedContent && !isLoading && (
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            أفكار إعلانية موريتانية جاهزة للتجربة بنقرة واحدة:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_MAURITANIAN_IDEAS.map((idea, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setTopic(idea.topic);
                  setContentType(idea.type);
                  setLanguageStyle(idea.style);
                  handleGenerate(idea.topic, idea.type, idea.style);
                }}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-700/60 hover:bg-slate-850 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{idea.topic}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Content Card */}
      {generatedContent && (
        <div className="bg-slate-900 border border-emerald-600/50 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">المحتوى المقترح الجاهز للنشر</h3>
                <p className="text-[11px] text-slate-400">يمكنك تعديله أو نسخه أو مشاركته عبر واتساب</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={shareToWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors"
                title="مشاركة للواتساب"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">واتساب</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          <div className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            {generatedContent}
          </div>
        </div>
      )}
    </div>
  );
};
