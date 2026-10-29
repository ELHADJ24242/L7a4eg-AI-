import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Square,
  X,
  Languages,
  Check,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { correctSpeechTranscript, SpeechCorrectionResult } from '../utils/speechCorrection';

export type VoiceLanguage = 'hassaniya' | 'arabic' | 'french';

interface VoiceInputProps {
  onTranscriptChange: (text: string, isFinal: boolean) => void;
  onSendTranscript?: (text: string) => void;
  onClose?: () => void;
  className?: string;
  defaultLang?: VoiceLanguage;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptChange,
  onSendTranscript,
  onClose,
  className = '',
  defaultLang = 'hassaniya',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>(defaultLang);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 30, 60, 40, 20, 50, 35, 70, 45, 25]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCorrection, setLastCorrection] = useState<SpeechCorrectionResult | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Map selected language to Web Speech BCP-47 locale
  const getLocale = (lang: VoiceLanguage): string => {
    switch (lang) {
      case 'french':
        return 'fr-FR';
      case 'arabic':
        return 'ar-SA';
      case 'hassaniya':
      default:
        return 'ar-MR'; // Browser will fallback to ar-SA if ar-MR is not loaded
    }
  };

  // Setup Web Audio Analyser for live frequency visualization
  const setupAudioAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevels = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          // Downsample to 10 bars
          const levels: number[] = [];
          const step = Math.max(1, Math.floor(dataArray.length / 10));
          for (let i = 0; i < 10; i++) {
            const val = dataArray[i * step] || 0;
            // Scale between 15% and 100%
            const height = Math.min(100, Math.max(15, Math.round((val / 255) * 100)));
            levels.push(height);
          }
          setAudioLevels(levels);
          animFrameRef.current = requestAnimationFrame(updateLevels);
        };

        updateLevels();
      }
    } catch (err: any) {
      console.warn('Microphone audio stream visualizer warning:', err?.message || err);
    }
  };

  // Clean up audio analyser
  const cleanupAudioAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
  };

  // Start Speech Recognition
  const startRecording = (langToUse = selectedLang) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        'ميزة الإملاء الصوتي غير مدعومة في هذا المتصفح. يرجى استخدام متصفح Google Chrome أو Safari أو Microsoft Edge.'
      );
      return;
    }

    // Stop existing
    stopRecording(false);
    setErrorMessage(null);
    setTranscript('');
    setInterimText('');
    setDuration(0);
    setLastCorrection(null);

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = getLocale(langToUse);
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setupAudioAnalyser();
        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let newFinalSegments = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const textChunk = item[0]?.transcript || '';
          if (item.isFinal) {
            newFinalSegments += textChunk;
          } else {
            currentInterim += textChunk;
          }
        }

        if (newFinalSegments) {
          // Normalize phonetically if in Hassaniya or French mode
          const correction = correctSpeechTranscript(newFinalSegments);
          setLastCorrection(correction);
          const correctedText = correction.correctedText;

          setTranscript((prev) => {
            const updated = prev ? `${prev} ${correctedText}` : correctedText;
            onTranscriptChange(updated, false);
            return updated;
          });
        }

        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('تم رفض إذن الميكروفون. يرجى تفعيل إذن الوصول للميكروفون من شريط العنوان.');
          stopRecording(false);
        } else if (event.error === 'language-not-supported' && recognition.lang === 'ar-MR') {
          // Fallback to standard Arabic dialect engine
          recognition.lang = 'ar-SA';
        } else if (event.error === 'no-speech') {
          // Keep waiting for user voice
        } else {
          setErrorMessage(`تنبيه صوتي: ${event.error || 'تعذر التعرف على الصوت'}`);
        }
      };

      recognition.onend = () => {
        // Only if still recording (not manually stopped), restart to maintain continuous stream
        if (isRecording && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            setIsRecording(false);
            cleanupAudioAnalyser();
          }
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage('تعذر بدء التسجيل الصوتي. يرجى التحقق من إعدادات الميكروفون.');
    }
  };

  // Stop Recording
  const stopRecording = (applyText = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    cleanupAudioAnalyser();
    setIsRecording(false);

    let finalOutput = transcript;
    if (interimText && interimText.trim()) {
      const correction = correctSpeechTranscript(interimText);
      finalOutput = finalOutput ? `${finalOutput} ${correction.correctedText}` : correction.correctedText;
      setTranscript(finalOutput);
      setInterimText('');
    }

    if (applyText && finalOutput) {
      onTranscriptChange(finalOutput, true);
    }

    return finalOutput;
  };

  // Cancel and discard
  const handleCancel = () => {
    stopRecording(false);
    setTranscript('');
    setInterimText('');
    setDuration(0);
    if (onClose) onClose();
  };

  // Stop and finish
  const handleDone = () => {
    const finalResult = stopRecording(true);
    if (onTranscriptChange) {
      onTranscriptChange(finalResult, true);
    }
    if (onClose) onClose();
  };

  // Stop and send directly
  const handleSendNow = () => {
    const finalResult = stopRecording(true);
    if (onSendTranscript && finalResult.trim()) {
      onSendTranscript(finalResult.trim());
    }
    if (onClose) onClose();
  };

  // Switch voice language
  const handleLanguageSwitch = (newLang: VoiceLanguage) => {
    setSelectedLang(newLang);
    if (isRecording) {
      startRecording(newLang);
    }
  };

  // Auto-start recording on mount
  useEffect(() => {
    startRecording(defaultLang);
    return () => {
      stopRecording(false);
    };
  }, []);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      dir="rtl"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-emerald-950 text-white shadow-xl border border-sky-500/30 p-4 transition-all animate-fadeIn ${className}`}
    >
      {/* Top Header Bar: Status & Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          {/* Animated Pulsing Recording Indicator */}
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 relative flex items-center justify-center shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-200">تسجيل صوتي ذكي</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-xs font-bold text-amber-300">
                {formatTime(duration)}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              استشعار دقيق لمخارج الحروف واللهجة الحسانية والفرنسية
            </p>
          </div>
        </div>

        {/* Language Selection Buttons */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => handleLanguageSwitch('hassaniya')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedLang === 'hassaniya'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="لهجة حسانية موريتانية (تصحيح تلقائي للعبارات)"
          >
            <span>🇲🇷</span>
            <span>حسانية</span>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageSwitch('arabic')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedLang === 'arabic'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="اللغة العربية الفصحى"
          >
            <span>🇸🇦</span>
            <span>فصحى</span>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageSwitch('french')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedLang === 'french'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Langue Française (Bac & démarches)"
          >
            <span>🇫🇷</span>
            <span>Français</span>
          </button>
        </div>
      </div>

      {/* Middle Visualizer & Live Transcript */}
      <div className="py-3.5 space-y-3">
        {/* Real-time Dynamic Soundwave Visualizer */}
        <div className="flex items-center justify-center gap-1.5 h-10 px-4 bg-black/25 rounded-xl border border-white/5">
          {audioLevels.map((lvl, idx) => (
            <span
              key={idx}
              className="w-1.5 rounded-full bg-gradient-to-t from-sky-400 to-amber-300 transition-all duration-75"
              style={{
                height: `${lvl}%`,
                minHeight: '8px',
                opacity: 0.75 + (lvl / 400),
              }}
            />
          ))}
        </div>

        {/* Live Transcript Display Box */}
        <div className="min-h-[52px] max-h-24 overflow-y-auto px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-right font-medium text-sm leading-relaxed scrollbar-thin">
          {transcript || interimText ? (
            <p className="text-slate-100">
              <span>{transcript}</span>
              {interimText && (
                <span className="text-amber-300 italic opacity-90 mr-1.5 animate-pulse">
                  {interimText}
                </span>
              )}
            </p>
          ) : (
            <p className="text-slate-400 text-xs italic flex items-center gap-1.5 justify-start">
              <Volume2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>تحدث الآن بوضوح (بالحسانية، العربية، أو الفرنسية)... سيظهر كلامك هنا فوراً</span>
            </p>
          )}
        </div>

        {/* Phonetic correction note if applied */}
        {lastCorrection && lastCorrection.appliedCorrections.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>
              تم ضبط التعبير الحساني تلقائياً:{' '}
              {lastCorrection.appliedCorrections.map((c) => `"${c.corrected}"`).join('، ')}
            </span>
          </div>
        )}

        {/* Error message if any */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/70 p-2.5 rounded-xl border border-rose-500/40">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>إلغاء</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Pause / Resume button */}
          <button
            type="button"
            onClick={() => (isRecording ? stopRecording(true) : startRecording())}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isRecording
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف ومراجعة</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>متابعة التسجيل</span>
              </>
            )}
          </button>

          {/* Send directly */}
          <button
            type="button"
            onClick={handleSendNow}
            disabled={!transcript && !interimText}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-600 hover:from-sky-400 hover:to-emerald-500 text-white text-xs font-bold shadow-md shadow-sky-950/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5 rotate-180" />
            <span>إرسال فوراً</span>
          </button>
        </div>
      </div>
    </div>
  );
};
