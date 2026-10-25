import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  CheckCircle2,
  Clock,
  Filter,
  Sparkles,
  ShieldCheck,
  User,
  Volume2,
  X,
  AlertCircle,
} from 'lucide-react';
import { DictionaryItem, LanguageCode } from '../types';
import { fetchDictionary, submitDictionaryItem, voteDictionaryItem, reviewDictionaryItem } from '../services/api';

export const DictionaryView: React.FC = () => {
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Submit Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newLang, setNewLang] = useState<LanguageCode>('hassaniya');
  const [newMeaningAr, setNewMeaningAr] = useState('');
  const [newMeaningFr, setNewMeaningFr] = useState('');
  const [newExampleOrig, setNewExampleOrig] = useState('');
  const [newExampleTrans, setNewExampleTrans] = useState('');
  const [newCategory, setNewCategory] = useState<'daily' | 'proverb' | 'culture' | 'business' | 'hospitality'>('daily');
  const [newContributor, setNewContributor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await fetchDictionary(selectedLang, selectedStatus, search);
      setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedLang, selectedStatus, search]);

  const handleVote = async (id: string) => {
    try {
      const res = await voteDictionaryItem(id);
      setItems((prev) => prev.map((item) => (item.id === id ? res.item : item)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleReviewStatus = async (item: DictionaryItem) => {
    const targetStatus = item.status === 'verified' ? 'pending' : 'verified';
    try {
      const res = await reviewDictionaryItem(item.id, targetStatus);
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.item : i)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitNewTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newMeaningAr.trim()) return;

    setIsSubmitting(true);
    setSubmitFeedback(null);
    try {
      const res = await submitDictionaryItem({
        term: newTerm.trim(),
        language: newLang,
        meaningAr: newMeaningAr.trim(),
        meaningFr: newMeaningFr.trim(),
        exampleOriginal: newExampleOrig.trim(),
        exampleTranslation: newExampleTrans.trim(),
        category: newCategory,
        contributor: newContributor.trim() || 'فاعل خير (مساهم)',
      });

      setSubmitFeedback('تمت إضافة الكلمة بنجاح! وضعت قيد المراجعة المجتمعية لتوثيقها.');
      setItems((prev) => [res.item, ...prev]);

      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setNewTerm('');
        setNewMeaningAr('');
        setNewMeaningFr('');
        setNewExampleOrig('');
        setNewExampleTrans('');
        setNewContributor('');
        setSubmitFeedback(null);
      }, 1500);
    } catch (err: any) {
      setSubmitFeedback(err.message || 'حدث خطأ أثناء الإرسال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-3 sm:p-6 space-y-5 pb-24 md:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">
              القاموس المجتمعي التشاركي 🇲🇷
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            موسوعة حية تجمع ألفاظ الحسانية واللغات الوطنية (البولارية، السوننكية، الولوفية، والبامبارا) مع نظام مراجعة يفصل المساهمات الموثقة عن التي تحت التدقيق.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>أضف كلمة أو مصطلحاً</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الكلمات، المعاني، أو الأمثلة (حسانية، بولار، ولوف، سوننكي)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            dir="rtl"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          {/* Language filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'hassaniya', label: 'الحسانية 🇲🇷' },
              { id: 'pulaar', label: 'Pulaar (بولار)' },
              { id: 'soninke', label: 'Soninké (سوننكي)' },
              { id: 'wolof', label: 'Wolof (ولوف)' },
              { id: 'bambara', label: 'Bambara (بامبارا)' },
            ].map((lang) => (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedLang === lang.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 hidden xs:inline">الحالة:</span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'verified', label: 'موثَّق ✅' },
              { id: 'pending', label: 'قيد المراجعة ⏳' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedStatus === st.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dictionary Items List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>جاري تحميل كلمات القاموس المجتمعي...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-sm space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-bold text-white">لم يتم العثور على كلمات مطابقة</p>
            <p className="text-xs text-slate-500">
              كن أول من يضيف هذه الكلمة لتخليدها في القاموس الوطني!
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              إضافة كلمة جديدة الآن
            </button>
          </div>
        ) : (
          items.map((item) => {
            const isVerified = item.status === 'verified';
            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isVerified
                    ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-700/60 shadow-md'
                    : 'bg-slate-900/60 border-amber-700/30 hover:border-amber-600/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-white">{item.term}</h3>

                      {/* Language badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                        {item.language.toUpperCase()}
                      </span>

                      {/* Verification status badge */}
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>موثّق رسمياً</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/40">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>قيد مراجعة المجتمع</span>
                        </span>
                      )}
                    </div>

                    {/* Arabic Meaning */}
                    <p className="text-sm text-slate-100 font-medium leading-relaxed">
                      {item.meaningAr}
                    </p>

                    {/* French Meaning if available */}
                    {item.meaningFr && (
                      <p className="text-xs text-slate-400 italic" dir="ltr">
                        {item.meaningFr}
                      </p>
                    )}
                  </div>

                  {/* Actions & Upvote */}
                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <button
                      onClick={() => handleVote(item.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 text-xs font-bold border border-slate-700/60 transition-colors"
                      title="تصويت وتأييد المصطلح"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{item.votes}</span>
                    </button>

                    {'speechSynthesis' in window && (
                      <button
                        onClick={() => handleSpeak(item.term)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="استماع صوتي"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Review Toggle Action */}
                    <button
                      onClick={() => handleToggleReviewStatus(item)}
                      className="text-[10px] text-slate-400 hover:text-amber-400 underline decoration-dotted transition-colors"
                      title="تبديل حالة التوثيق"
                    >
                      {isVerified ? 'إعادة للمراجعة' : 'توثيق هذا المصطلح'}
                    </button>
                  </div>
                </div>

                {/* Example sentence if provided */}
                {item.exampleOriginal && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 bg-slate-950/50 rounded-xl p-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                      <span>مثال الاستخدام في السياق:</span>
                    </div>
                    <p className="text-slate-200 font-medium">&quot;{item.exampleOriginal}&quot;</p>
                    {item.exampleTranslation && (
                      <p className="text-slate-400 text-[11px]">{item.exampleTranslation}</p>
                    )}
                  </div>
                )}

                {/* Contributor Footer */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>المساهم: {item.contributor}</span>
                  </span>
                  <span>{item.createdAt}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">إضافة مصطلح أو تعبير للقاموس</h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewTerm} className="p-4 overflow-y-auto space-y-3.5 text-sm">
              {submitFeedback && (
                <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{submitFeedback}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الكلمة أو المصطلح أو العبارة *
                </label>
                <input
                  type="text"
                  required
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="مثال: التيفاية، ازوان، No mbaddaa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اللغة أو اللهجة</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value as LanguageCode)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="hassaniya">الحسانية (موريتانيا)</option>
                    <option value="pulaar">Pulaar (بولار)</option>
                    <option value="soninke">Soninké (سوننكي)</option>
                    <option value="wolof">Wolof (ولوف)</option>
                    <option value="bambara">Bambara (بامبارا)</option>
                    <option value="arabic">العربية الفصحى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">التصنيف</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="daily">استخدام يومي</option>
                    <option value="proverb">مثل شعبي / حكمة</option>
                    <option value="culture">تراث وشعر</option>
                    <option value="business">تجارة وأعمال</option>
                    <option value="hospitality">ضيافة وشاي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المعنى باللغة العربية *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newMeaningAr}
                  onChange={(e) => setNewMeaningAr(e.target.value)}
                  placeholder="اشرح المعنى المقصود بوضوح..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المعنى بالفرنسية (اختياري)
                </label>
                <input
                  type="text"
                  value={newMeaningFr}
                  onChange={(e) => setNewMeaningFr(e.target.value)}
                  placeholder="Signification en français..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  مثال في جملة مفيدة
                </label>
                <input
                  type="text"
                  value={newExampleOrig}
                  onChange={(e) => setNewExampleOrig(e.target.value)}
                  placeholder="جملة توضح كيف تقال في الحديث الموريتاني..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المساهم أو اللقب</label>
                <input
                  type="text"
                  value={newContributor}
                  onChange={(e) => setNewContributor(e.target.value)}
                  placeholder="مثال: باحث من انواكشوط / أطار / كيفة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إرسال للمراجعة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
