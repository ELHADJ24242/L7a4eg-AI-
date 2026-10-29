import React, { useRef } from 'react';
import {
  Image,
  Video,
  FileText,
  BookOpen,
  X,
  Paperclip,
  Upload,
  Sparkles,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { AttachedMedia, MediaAnalysisTask } from '../types';

interface MediaUploadBarProps {
  attachments: AttachedMedia[];
  onAddAttachment: (media: AttachedMedia) => void;
  onRemoveAttachment: (id: string) => void;
  onTriggerAnalysis?: (media: AttachedMedia, task: MediaAnalysisTask) => void;
  analyzingMediaId?: string | null;
  maxFiles?: number;
}

export const MediaUploadBar: React.FC<MediaUploadBarProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onTriggerAnalysis,
  analyzingMediaId,
  maxFiles = 4,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      if (attachments.length >= maxFiles) break;
      const file = files[i];

      // Determine type
      let type: 'image' | 'video' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (
        file.type === 'application/pdf' ||
        file.type.includes('document') ||
        file.type.includes('text') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.docx')
      ) {
        type = 'document';
      }

      // Read as base64
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        const base64Data = resultStr.includes(',')
          ? resultStr.split(',')[1]
          : resultStr;

        const newMedia: AttachedMedia = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type,
          mimeType: file.type || (type === 'document' ? 'application/pdf' : 'application/octet-stream'),
          size: file.size,
          previewUrl: type === 'image' ? resultStr : '',
          base64Data,
        };

        onAddAttachment(newMedia);
      };

      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/mp4,video/webm,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Render attached files row if any */}
      {attachments.length > 0 && (
        <div className="flex flex-col gap-2 py-1.5 px-1 animate-fadeIn">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
            <span className="font-semibold flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>الملفات المرفقة ({attachments.length}):</span>
            </span>
            <span className="text-[11px] text-slate-500">اختر إجراءً ذكياً فورياً أو أرسل مع رسالتك</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {attachments.map((item) => {
              const isAnalyzing = analyzingMediaId === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-2xs text-xs shrink-0 transition-all ${
                    isAnalyzing
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-700 animate-pulse'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-6 h-6 rounded object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    getMediaIcon(item.type)
                  )}

                  <div className="flex flex-col text-[11px] leading-tight max-w-[120px] truncate">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatSize(item.size)}
                    </span>
                  </div>

                  {/* Quick Smart Analysis Buttons */}
                  {onTriggerAnalysis && (
                    <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-1 mr-1">
                      {item.type === 'image' && (
                        <button
                          type="button"
                          disabled={isAnalyzing}
                          onClick={() => onTriggerAnalysis(item, 'extract_text')}
                          className="px-2 py-0.5 rounded-lg bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/60 dark:hover:bg-sky-800 text-sky-800 dark:text-sky-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="استخراج النص الضوئي من الصورة (OCR)"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <FileSearch className="w-2.5 h-2.5" />
                          )}
                          <span>استخراج النص</span>
                        </button>
                      )}

                      {(item.type === 'document' || item.name.toLowerCase().endsWith('.pdf')) && (
                        <button
                          type="button"
                          disabled={isAnalyzing}
                          onClick={() => onTriggerAnalysis(item, 'summarize_book')}
                          className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="تلخيص محتوى الكتاب أو المستند وتحليل فصوله"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <BookOpen className="w-2.5 h-2.5" />
                          )}
                          <span>تلخيص الكتاب</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isAnalyzing}
                        onClick={() =>
                          onTriggerAnalysis(
                            item,
                            item.type === 'image' ? 'extract_text' : 'summarize_book'
                          )
                        }
                        className="px-1.5 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                        title="تحليل شامل للملف"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => onRemoveAttachment(item.id)}
                    className="w-4 h-4 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="إزالة الملف"
                    aria-label={`إزالة ملف ${item.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {attachments.length < maxFiles && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-600 hover:border-sky-400 text-xs transition-colors shrink-0 cursor-pointer"
              >
                <Paperclip className="w-3 h-3" />
                <span>إضافة ملف آخر</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

