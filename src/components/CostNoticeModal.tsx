import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, X, ExternalLink, HelpCircle } from 'lucide-react';

interface CostNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CostNoticeModal: React.FC<CostNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                تأكيد الوضع المجاني والأمان المالي
              </h3>
              <p className="text-xs text-emerald-300">
                الخطوة الثانية: لا تدفع أي شيء الآن (Zero-Cost Prototype)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-sm">
          {/* Main reassuring message */}
          <div className="p-3.5 rounded-xl bg-emerald-900/20 border border-emerald-700/40 text-emerald-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>لا توجد أي بطاقة بنكية مطلوبة أو فواتير مفعلة</span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              هذا النموذج الأولي من &quot;لحاذگ (L7a4eg AI)&quot; يعمل بشكل كامل عبر الحصة المجانية التطويرية المتاحة لـ Gemini API وأدوات الويب المفتوحة. لن يُطلب منك إدخال بطاقة دفع أو تفعيل أي اشتراك مالي في هذه المرحلة.
            </p>
          </div>

          {/* Bullet points on safety */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <h4 className="font-bold text-white text-sm">كيف يحميك هذا الإصدار؟</h4>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <p>
                <strong>المحادثة والترجمة والحسانية:</strong> تستخدم حصص التطوير القياسية المجانية لنموذج Gemini Flash السريع والمجاني.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <p>
                <strong>توليد الصور والفيديو:</strong> يعملان عبر محركات ذكاء اصطناعي مفتوحة ومجانية (مثل Pollinations ومحرك الفيديو التفاعلي) دون تشغيل أي استهلاك مدفوع ودون الحاجة لبطاقة بنكية.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <p>
                <strong>القاموس المجتمعي:</strong> يعمل محلياً وعلى خادم التطبيق لحفظ كلمات الحسانية واللغات الوطنية دون الاعتماد على قواعد بيانات خارجية مدفوعة.
              </p>
            </div>
          </div>

          {/* Official Google & Hosting Reminder */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>تنبيه الاستخدام الموسع العام مستقبلاً</span>
            </div>
            <p className="leading-relaxed">
              كما توضح الوثائق الرسمية، إنشاء ومعاينة التطبيق في بيئة التطوير الحالية مجانية تماماً. إذا رغبت مستقبلاً في إطلاق التطبيق لملايين المستخدمين في موريتانيا وغرب إفريقيا، قد تضع Google أو مزودي السحابة حدود استخدام مجانية، وستتحكم أنت دوماً في أي قرار للتوسعة دون أي اقتطاع آلي.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            فهمت، تابع الاستخدام المجاني
          </button>
        </div>
      </div>
    </div>
  );
};
