import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Copy,
  Check,
  Film,
  Camera,
  Mic,
  Volume2,
  VolumeX,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Layers,
} from 'lucide-react';
import { generateVideoAPI, GeneratedVideoProject, VideoSceneItem } from '../services/api';

const MAURITANIAN_VIDEO_IDEAS = [
  {
    title: 'وثائقي: شنقيط وواحات آدرار 🐪',
    prompt: 'وثائقي سينمائي عن مدينة شنقيط التاريخية ومكتباتها الأثرية وقوافل الإبل التي تعبر رمال آدرار وقت الغروب الذهبي',
  },
  {
    title: 'إعلان تجاري: تطبيق بنكيلي في ثانية 💳',
    prompt: 'إعلان ترويجي سريع لخدمة الدفع عبر الهاتف في مقاهي ومتاجر انواكشوط بأسلوب شبابي ممتع وسريع',
  },
  {
    title: 'ريلز: أتاي والشاي الموريتاني ☕',
    prompt: 'مقطع ريلز وتيك توك فكاهي ومحبب عن طقوس تحضير الشاي وأهمية الكأس الأول والرغوة البيضاء مع الأصدقاء',
  },
  {
    title: 'قطار الصحراء الأطول في العالم 🚂',
    prompt: 'مشاهد سينمائية مهيبة لقطار خامات الحديد في تيرس زمور يشق رمال الصحراء تحت سماء الليل والنجوم',
  },
];

export const VideoStudioView: React.FC = () => {
  const [scriptIdea, setScriptIdea] = useState('');
  const [voiceLang, setVoiceLang] = useState<'hassaniya' | 'arabic' | 'french'>('hassaniya');
  const [style, setStyle] = useState('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoProject, setVideoProject] = useState<GeneratedVideoProject | null>(null);

  // Player state
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Preload scene images when project changes
  useEffect(() => {
    if (!videoProject || videoProject.scenes.length === 0) return;

    videoProject.scenes.forEach((scene) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = scene.imageUrl;
      img.onload = () => {
        loadedImagesRef.current.set(scene.id, img);
        drawScene(currentSceneIndex, 0);
      };
    });

    setCurrentSceneIndex(0);
    setIsPlaying(false);
  }, [videoProject]);

  // Draw scene onto canvas with smooth Ken Burns camera pan and subtitle overlay
  const drawScene = (sceneIdx: number, progressRatio: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || !videoProject) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scene = videoProject.scenes[sceneIdx];
    if (!scene) return;

    const img = loadedImagesRef.current.get(scene.id);
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (img && img.complete) {
      // Ken Burns subtle zoom and pan
      const scale = 1.0 + progressRatio * 0.08;
      const offsetX = (progressRatio * 20) - 10;
      const offsetY = (progressRatio * 15) - 7.5;

      ctx.save();
      ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      // Fallback gradient while loading
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#451a03');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(scene.title, w / 2, h / 2);
    }

    // Cinematic Vignette and Bottom Gradient
    const bottomGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
    bottomGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
    bottomGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);

    // Watermark Top Right
    ctx.font = 'bold 16px Cairo, sans-serif';
    ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
    ctx.textAlign = 'right';
    ctx.fillText('L7a4eg AI | لحاذگ 🇲🇷', w - 24, 32);

    // Camera Shot Tag Top Left
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(`[${scene.camera}]`, 24, 32);

    // Subtitle Narration Box Bottom
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // Wrap text nicely
    const maxTextWidth = w - 80;
    const words = scene.narration.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = h - 65 - (lines.length - 1) * 26;
    for (let k = 0; k < lines.length; k++) {
      // Subtitle shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(lines[k], w / 2 + 1, startY + k * 26 + 1);
      // Subtitle text
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(lines[k], w / 2, startY + k * 26);
    }
  };

  // Speak scene narration via SpeechSynthesis
  const speakScene = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceLang === 'french') {
      utterance.lang = 'fr-FR';
    } else {
      utterance.lang = 'ar-SA';
    }
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Playback Loop
  useEffect(() => {
    if (!isPlaying || !videoProject || videoProject.scenes.length === 0) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    const currentScene = videoProject.scenes[currentSceneIndex];
    if (!currentScene) return;

    speakScene(currentScene.narration);

    const durationMs = (currentScene.duration || 4) * 1000;
    const startTime = performance.now();

    const renderLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      drawScene(currentSceneIndex, progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    playbackTimerRef.current = setTimeout(() => {
      if (currentSceneIndex < videoProject.scenes.length - 1) {
        setCurrentSceneIndex((prev) => prev + 1);
      } else {
        // Reached end of video
        setIsPlaying(false);
        setCurrentSceneIndex(0);
        drawScene(0, 0);
      }
    }, durationMs);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, [isPlaying, currentSceneIndex, videoProject]);

  const handleTogglePlay = () => {
    if (!videoProject) return;
    setIsPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    if (!videoProject) return;
    setIsPlaying(false);
    setCurrentSceneIndex(0);
    drawScene(0, 0);
  };

  const handleGenerate = async (presetText?: string) => {
    const textToUse = (presetText || scriptIdea).trim();
    if (!textToUse || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    setIsPlaying(false);

    try {
      const project = await generateVideoAPI(textToUse, style, voiceLang);
      if (project.success && project.scenes.length > 0) {
        setVideoProject(project);
      } else {
        throw new Error('لم نتلقَ مشاهد فيديو صالحة');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إعداد سيناريو ومشاهد الفيديو.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export video file directly from browser canvas using MediaRecorder
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !videoProject || isExporting) return;

    try {
      setIsExporting(true);
      setIsPlaying(false);

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `L7a4eg-Video-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };

      recorder.start();

      // Render each scene smoothly for recording
      for (let sIdx = 0; sIdx < videoProject.scenes.length; sIdx++) {
        const frames = 30 * (videoProject.scenes[sIdx].duration || 4);
        for (let f = 0; f <= frames; f++) {
          drawScene(sIdx, f / frames);
          await new Promise((r) => setTimeout(r, 1000 / 30));
        }
      }

      recorder.stop();
    } catch (err) {
      console.error('Export error:', err);
      alert('تم تجهيز المشاهد، يمكنك حفظ الإطارات والسيناريو مباشرة.');
      setIsExporting(false);
    }
  };

  const handleCopyScript = () => {
    if (!videoProject) return;
    const fullText = `=== سيناريو فيديو لحاذگ AI ===
العنوان: ${videoProject.title}
المدة الكلية: ${videoProject.totalDuration} ثانية

${videoProject.scenes
  .map(
    (s) =>
      `[المشهد ${s.sceneNumber}: ${s.title} (${s.duration}ث) - ${s.camera}]
الوصف البصري: ${s.visualPrompt}
التعليق الصوتي: "${s.narration}"`
  )
  .join('\n\n')}
`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-6 pb-24 md:pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-emerald-600/30 p-4 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>توليد فيديو تفاعلي حي (Interactive Video Engine)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              توليد الفيديو بالذكاء الاصطناعي 🎬
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              اكتب فكرة الفيديو أو الإعلان، وسيقوم &quot;لحاذگ&quot; بتركيب مشاهد بصرية سينمائية، كتابة التعليق الصوتي بالحسانية، وتشغيل المشغل التفاعلي فوراً.
            </p>
          </div>
        </div>
      </div>

      {/* Script Idea Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
            فكرة الفيديو، السيناريو، أو الإعلان المطلوب (Prompt / Story Idea) *
          </label>
          <textarea
            rows={3}
            value={scriptIdea}
            onChange={(e) => setScriptIdea(e.target.value)}
            placeholder="مثال: وثائقي سينمائي قصير عن تاريخ واحة ترجيت والمياه العذبة في صحراء آدرار، مع تعليق صوتي حساني هادئ..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500 resize-none leading-relaxed"
            dir="rtl"
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>لغة وأسلوب التعليق الصوتي (Voiceover)</span>
            </label>
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="hassaniya">لهجة حسانية موريتانية أصيلة 🇲🇷 (أولوية)</option>
              <option value="arabic">عربية فصحى وثائقية وشاعرية</option>
              <option value="french">Français soigné et direct</option>
            </select>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>الأسلوب الإخراجي (Directing Style)</span>
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="cinematic">سينمائي 8K مع حركة كاميرا درامية</option>
              <option value="documentary">وثائقي هادئ على طريقة ناشيونال جيوغرافيك</option>
              <option value="commercial">إعلان ترويجي سريع وجذاب للشباب</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400">
            🎬 محرك تفاعلي يركب المشاهد والصوت ويتيح المعاينة والتصدير المباشر
          </p>
          <button
            onClick={() => handleGenerate()}
            disabled={!scriptIdea.trim() || isGenerating}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              scriptIdea.trim() && !isGenerating
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>جاري إخراج وتوليد مشاهد الفيديو...</span>
              </>
            ) : (
              <>
                <Clapperboard className="w-4 h-4 text-amber-300" />
                <span>توليد الفيديو الآن</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>جاري صياغة القصة ورسم المشاهد السينمائية بالحسانية (3 - 7 ثوانٍ)...</span>
          </div>
          <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center animate-pulse">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 mb-3 shadow">
              <Clapperboard className="w-7 h-7 animate-bounce" />
            </div>
            <p className="font-bold text-sm text-slate-200">المخرج الذكي لـ &quot;لحاذگ&quot; يجهّز الكاميرات والإضاءة</p>
            <p className="text-xs text-slate-500 mt-1">تركيب المشاهد الأولى، الثانية، والثالثة وتجهيز التعليق الصوتي...</p>
          </div>
        </div>
      )}

      {/* Interactive Video Player & Project */}
      {videoProject && !isGenerating && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <h3 className="font-bold text-base text-white">{videoProject.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="نسخ السيناريو كاملاً"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              <button
                onClick={handleExportVideo}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition-colors"
              >
                {isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isExporting ? 'جاري التحميل...' : 'تحميل مقطع الفيديو'}</span>
              </button>
            </div>
          </div>

          {/* Video Player Canvas Card */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
            {/* HTML5 Canvas with fixed aspect ratio */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="w-full aspect-video block object-cover bg-slate-950"
            />

            {/* Video Controls Bar */}
            <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
                  title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الفيديو'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="إعادة التشغيل من البداية"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Scene Indicator Tabs in Player */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                {videoProject.scenes.map((scene, idx) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentSceneIndex(idx);
                      drawScene(idx, 0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      currentSceneIndex === idx
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    مشهد {scene.sceneNumber}
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                المدة: {videoProject.totalDuration}ث
              </span>
            </div>
          </div>

          {/* Scene Breakdown Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>مشاهد الفيديو المنتجة ({videoProject.scenes.length} مشاهد):</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {videoProject.scenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentSceneIndex(idx);
                    drawScene(idx, 0);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    currentSceneIndex === idx
                      ? 'bg-slate-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 mb-2.5 border border-slate-800">
                    <img
                      src={scene.imageUrl}
                      alt={scene.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute top-1.5 right-1.5 bg-slate-950/80 text-amber-300 text-[10px] px-2 py-0.5 rounded font-bold font-mono">
                      مشهد {scene.sceneNumber} ({scene.duration}ث)
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-white line-clamp-1">{scene.title}</h5>
                  <p className="text-[11px] text-slate-300 mt-1 line-clamp-2" dir="rtl">
                    &quot;{scene.narration}&quot;
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-emerald-400 font-mono">{scene.camera}</span>
                    <a
                      href={scene.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white underline"
                    >
                      عرض الإطار
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mauritanian Quick Inspirations */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          أفكار سيناريوهات موريتانية جاهزة للتوليد بنقرة واحدة:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MAURITANIAN_VIDEO_IDEAS.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setScriptIdea(item.prompt);
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
                <Clapperboard className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
