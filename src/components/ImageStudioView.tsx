import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Ratio,
  Layers,
  AlertCircle,
  Eye,
  Maximize2,
  X,
  Palette,
  ImageDown,
} from 'lucide-react';
import { generateImagesAPI, GeneratedImageItem } from '../services/api';

const MAURITANIAN_INSPIRATIONS = [
  {
    title: 'واحة ترجيت وقت الغروب 🌴',
    prompt: 'واحة ترجيت الطبيعية في آدرار بموريتانيا مع تدفق المياه العذبة بين النخيل الباسقة وكثبان الرمال الذهبية وقت الغروب مع إضاءة سينمائية دافئة',
  },
  {
    title: 'سوق العاصمة وأصالة الملحفة 👘',
    prompt: 'سيدة موريتانية ترتدي ملحفة نيلية زرقاء فاخرة تتسوق في شوارع انواكشوط القديمة، تصوير واقعي فوتوغرافي فائق الدقة',
  },
  {
    title: 'قطار خامات الحديد في تيرس زمور 🚂',
    prompt: 'أطول قطار في العالم يحمل خامات الحديد عبر صحراء موريتانيا تحت سماء ليلية صافية مرصعة بالنجوم ومجرة درب التبانة',
  },
  {
    title: 'مكتبة ومخطوطات شنقيط الأثرية 📜',
    prompt: 'مكتبة تقليدية مبنية من حجارة وطين شنقيط القديمة، مع مخطوطات أثرية ومصاحف مذهبة وشعاع شمس يخترق النافذة الخشبية',
  },
  {
    title: 'مجلس أتاي والشاي في الخيمة ☕',
    prompt: 'مجلس شاي موريتاني تقليدي أصيل داخل خيمة بيظانية مفروشة، إبريق شاي فضي مشحر، كؤوس برغوة غنية وجمر وهاج',
  },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'مربع (1:1)', desc: 'إنستغرام والرمزيات' },
  { id: '16:9', label: 'عريض (16:9)', desc: 'يوتيوب وخلفيات الشاشة' },
  { id: '9:16', label: 'طولي (9:16)', desc: 'ريلز، تيك توك، ستوري' },
  { id: '4:3', label: 'كلاسيكي (4:3)', desc: 'أفلام وصور تقليدية' },
];

export const ImageStudioView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageCount, setImageCount] = useState<number>(2);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [stylePreset, setStylePreset] = useState<string>('cinematic');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>([]);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalImage, setActiveModalImage] = useState<GeneratedImageItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = (customPrompt || prompt).trim();
    if (!textToUse || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await generateImagesAPI(textToUse, imageCount, aspectRatio, stylePreset);
      if (res.success && res.images.length > 0) {
        setGeneratedImages(res.images);
        setEnhancedPrompt(res.enhancedPrompt);
      } else {
        throw new Error('لم نتلقَ استجابة صور صالحة من المحرك');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال بمحرك توليد الصور المجاني.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (img: GeneratedImageItem) => {
    try {
      setDownloadingId(img.id);
      const response = await fetch(img.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `L7a4eg-AI-${img.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: direct window open for download
      window.open(img.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 pb-24 md:pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-emerald-600/30 p-4 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>توليد فوري ومجاني 100% (Free AI Generation)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              توليد الصور بالذكاء الاصطناعي 🎨
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              صف فكرتك بالحسانية، العربية، أو الفرنسية، وسيقوم محرك &quot;لحاذگ&quot; بتوليد صور عالية الدقة فوراً مع إمكانية التحميل المباشر.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
            صف الصورة التي تريد توليدها (Prompt) *
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="مثال: جمل في صحراء موريتانيا الذهبية وقت الغروب، مع رداء أزرق أصيل وإضاءة سينمائية..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none leading-relaxed"
            dir="rtl"
          />
        </div>

        {/* Controls Grid: Count, Aspect Ratio, Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Number of Images (Requested by user: e.g. 2 images) */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>عدد الصور المطلوبة</span>
              </span>
              <span className="text-amber-400 font-mono text-xs font-bold">{imageCount} صور</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { val: 1, label: 'صورة 1' },
                { val: 2, label: 'صورتين 2' },
                { val: 3, label: '3 صور' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setImageCount(opt.val)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    imageCount === opt.val
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-amber-400" />
              <span>نسبة الأبعاد (Aspect Ratio)</span>
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {ASPECT_RATIOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} - {r.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Art Style */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>النمط الفني (Art Style)</span>
            </label>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="cinematic">سينمائي واقعي (Cinematic 8K)</option>
              <option value="realistic">فوتوغرافي وثائقي (Realistic Photo)</option>
              <option value="heritage">لوحة زيتية وتراثية (Heritage Painting)</option>
              <option value="digital">رسم رقمي عصري (Modern Digital Art)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400">
            ⚡ توليد مدعوم بمحرك ذكاء اصطناعي مفتوح ومجاني دون أي استهلاك للرصيد
          </p>
          <button
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              prompt.trim() && !isGenerating
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>جاري توليد الصور بالذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>توليد {imageCount} {imageCount === 1 ? 'صورة' : 'صور'} الآن</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message if any */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Skeleton during generation */}
      {isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>جاري رسم الصور ومعالجتها فائقة الدقة (قد يستغرق 3 - 6 ثوانٍ)...</span>
          </div>
          <div className={`grid gap-4 ${imageCount === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {Array.from({ length: imageCount }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative animate-pulse flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 mb-3 shadow">
                  <Sparkles className="w-6 h-6 animate-spin" />
                </div>
                <p className="font-bold text-sm text-slate-300">جاري رسم الصورة رقم {idx + 1}</p>
                <p className="text-xs text-slate-500 mt-1">تطبيق الألوان والظلال والنمط الموريتاني...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Images Results */}
      {generatedImages.length > 0 && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>الصور الناتجة ({generatedImages.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">جاهزة للتحميل بجودة كاملة</span>
          </div>

          <div className={`grid gap-4 ${generatedImages.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {generatedImages.map((img, idx) => (
              <div
                key={img.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl transition-all hover:border-emerald-500/50"
              >
                {/* Image Element */}
                <div className="relative overflow-hidden bg-slate-950 aspect-square">
                  <img
                    src={img.url}
                    alt={img.promptOriginal}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle Top Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  {/* Quick Expand Button */}
                  <button
                    onClick={() => setActiveModalImage(img)}
                    className="absolute top-2.5 left-2.5 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="تكبير الصورة"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Footer Toolbar */}
                <div className="p-3.5 bg-slate-900 border-t border-slate-800/80 space-y-2">
                  <p className="text-xs text-slate-300 font-medium line-clamp-1" dir="rtl">
                    &quot;{img.promptOriginal}&quot;
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      بذرة: #{img.seed} • {img.aspectRatio}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyPrompt(img.enhancedPrompt || img.promptOriginal, img.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="نسخ أمر التوليد"
                      >
                        {copiedId === img.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDownload(img)}
                        disabled={downloadingId === img.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
                        title="تحميل الصورة بجودة كاملة"
                      >
                        {downloadingId === img.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImageDown className="w-3.5 h-3.5" />
                        )}
                        <span>تحميل الصورة</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt details box */}
          {enhancedPrompt && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
              <span className="text-slate-400 font-bold block">الوصف البصري الإنجليزي المعزز تلقائياً:</span>
              <p className="text-emerald-300/90 font-mono text-[11px] leading-relaxed" dir="ltr">
                {enhancedPrompt}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mauritanian Quick Inspirations */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          أفكار وصور موريتانية جاهزة للتوليد بنقرة واحدة:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MAURITANIAN_INSPIRATIONS.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setPrompt(item.prompt);
                handleGenerate(item.prompt);
              }}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-600/50 hover:bg-slate-850 cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.prompt}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-300 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for Full View */}
      {activeModalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/70">
              <span className="text-xs font-bold text-white line-clamp-1 max-w-[80%]" dir="rtl">
                {activeModalImage.promptOriginal}
              </span>
              <button
                onClick={() => setActiveModalImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 overflow-auto flex items-center justify-center bg-slate-950">
              <img
                src={activeModalImage.url}
                alt={activeModalImage.promptOriginal}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-mono">
                #{activeModalImage.seed} • {activeModalImage.aspectRatio}
              </span>
              <button
                onClick={() => handleDownload(activeModalImage)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الصورة بجودة كاملة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
