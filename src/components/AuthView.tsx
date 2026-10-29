import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  KeyRound,
  LogOut,
  RotateCw,
  BadgeCheck,
  X,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthViewProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
}

type AuthMode = 'login' | 'register' | 'phone_otp';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  otp?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  onCancel,
  embedded = false,
}) => {
  const {
    user,
    isAuthenticated,
    loginWithEmail,
    registerWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithSocial,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('45');
  const [rememberMe, setRememberMe] = useState(true);

  // Field Validation & Interaction State
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isShaking, setIsShaking] = useState(false);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  // Async Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setTouchedFields({});
  };

  // Switch mode and reset errors
  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    clearMessages();
  };

  // Mark field as touched for inline validation
  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  // Calculate Password Strength: 0 (empty), 1 (weak), 2 (medium), 3 (strong)
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8 && /[A-Z0-9]/i.test(pass)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass) && pass.length >= 8) score += 1;

    if (score === 1) return { score: 1, label: 'ضعيفة (أضف أرقاماً أو رموزاً)', color: 'bg-rose-500 text-rose-600' };
    if (score === 2) return { score: 2, label: 'متوسطة ومقبولة', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, label: 'قوية وممتازة', color: 'bg-emerald-500 text-emerald-600' };
  };

  // Validate individual field
  const validateField = (field: string): boolean => {
    const errors: FieldErrors = { ...fieldErrors };
    let isValid = true;

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        errors.email = 'يرجى إدخال البريد الإلكتروني';
        isValid = false;
      } else if (!emailRegex.test(email.trim())) {
        errors.email = 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@example.mr)';
        isValid = false;
      } else {
        delete errors.email;
      }
    }

    if (field === 'password') {
      if (!password) {
        errors.password = 'يرجى إدخال كلمة المرور';
        isValid = false;
      } else if (password.length < 6) {
        errors.password = `كلمة المرور قصيرة جداً (أدخلت ${password.length} خانات، المطلوب 6 كحد أدنى)`;
        isValid = false;
      } else {
        delete errors.password;
      }
    }

    if (field === 'confirmPassword' && mode === 'register') {
      if (!confirmPassword) {
        errors.confirmPassword = 'يرجى تأكيد كلمة المرور';
        isValid = false;
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'كلمتا المرور غير متطابقتين، يرجى إعادة التأكد';
        isValid = false;
      } else {
        delete errors.confirmPassword;
      }
    }

    if (field === 'name' && mode === 'register') {
      if (!name.trim()) {
        errors.name = 'يرجى كتابة اسمك الكريم';
        isValid = false;
      } else if (name.trim().length < 3) {
        errors.name = 'الاسم يجب أن يحتوي على 3 أحرف على الأقل';
        isValid = false;
      } else {
        delete errors.name;
      }
    }

    if (field === 'phone' && mode === 'phone_otp') {
      const cleaned = phone.replace(/\D/g, '');
      if (!cleaned) {
        errors.phone = 'يرجى إدخال رقم الهاتف';
        isValid = false;
      } else if (cleaned.length < 8) {
        errors.phone = 'رقم الهاتف الموريتاني يجب أن يتكون من 8 أرقام على الأقل';
        isValid = false;
      } else {
        delete errors.phone;
      }
    }

    if (field === 'otp' && otpSent) {
      if (!otpCode) {
        errors.otp = 'يرجى إدخال رمز التحقق';
        isValid = false;
      } else if (otpCode.length < 6) {
        errors.otp = `رمز التحقق يجب أن يتكون من 6 أرقام (أدخلت ${otpCode.length})`;
        isValid = false;
      } else {
        delete errors.otp;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Full form validator before submission
  const validateFullForm = (): boolean => {
    const errors: FieldErrors = {};
    let valid = true;

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 3) {
        errors.name = 'يرجى إدخال اسم كامل صحيح (3 أحرف على الأقل)';
        valid = false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'يرجى إدخال البريد الإلكتروني';
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'صيغة البريد غير صحيحة، تأكد من كتابته بالشكل: user@example.mr';
      valid = false;
    }

    if (!password) {
      errors.password = 'يرجى إدخال كلمة المرور';
      valid = false;
    } else if (password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 خانات على الأقل';
      valid = false;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        errors.confirmPassword = 'يرجى تأكيد كلمة المرور';
        valid = false;
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'كلمتا المرور غير متطابقتين، يرجى المطابقة';
        valid = false;
      }
    }

    setFieldErrors(errors);
    setTouchedFields({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!valid) {
      triggerShake();
    }
    return valid;
  };

  // Submit Handler for Email/Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const isValid = validateFullForm();
    if (!isValid) return;

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await registerWithEmail(name, email, password, phone || undefined);
        if (!res.success) {
          setErrorMessage(res.error || 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً');
          triggerShake();
        } else {
          setSuccessMessage('تم إنشاء حسابك بنجاح! مرحباً بك في لحاذگ AI.');
          if (onSuccess) setTimeout(onSuccess, 800);
        }
      } else {
        // Login
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          // Explicit and interactive feedback on login failure
          setErrorMessage(
            res.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات أو تسجيل الدخول برقم الهاتف.'
          );
          triggerShake();
        } else {
          setSuccessMessage('تم تسجيل الدخول بنجاح! أهلاً بك مجدداً.');
          if (onSuccess) setTimeout(onSuccess, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler for Phone OTP Request
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateField('phone')) {
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendPhoneOtp(phone);
      if (!res.success) {
        setErrorMessage(res.error || 'تعذر إرسال رمز التحقق إلى هذا الرقم');
        triggerShake();
      } else {
        setOtpSent(true);
        setOtpTimer(300); // 5 minutes TTL
        if (res.demoCode) {
          setDemoCodeHint(res.demoCode);
          setOtpCode(res.demoCode);
        }
        setSuccessMessage('تم إرسال رمز التحقق (OTP) إلى هاتفك بنجاح (صالح لمدة 5 دقائق)');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'خطأ في الاتصال بخدمة الرسائل النصية');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler for Phone OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateField('otp')) {
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyPhoneOtp(phone, otpCode, name || undefined);
      if (!res.success) {
        setErrorMessage(res.error || 'رمز التحقق غير صحيح أو انتهت صلاحيته (5 دقائق)');
        triggerShake();
      } else {
        setSuccessMessage('تم التحقق بنجاح والدخول إلى المنصة!');
        if (onSuccess) setTimeout(onSuccess, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر التحقق من الرمز، أعد المحاولة');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple' | 'facebook') => {
    clearMessages();
    setIsLoading(true);
    try {
      const mockName =
        provider === 'google'
          ? 'مستخدم Google'
          : provider === 'apple'
          ? 'مستخدم Apple'
          : 'مستخدم Facebook';
      const mockEmail = `user.${Date.now().toString().slice(-4)}@${provider}.auth`;
      const res = await loginWithSocial(provider, mockEmail, mockName);
      if (!res.success) {
        setErrorMessage(res.error || `فشل تسجيل الدخول عبر ${provider}`);
        triggerShake();
      } else {
        setSuccessMessage(`تم تسجيل الدخول عبر ${provider} بنجاح!`);
        if (onSuccess) setTimeout(onSuccess, 700);
      }
    } catch (err: any) {
      setErrorMessage(err.message || `خطأ في اتصال ${provider}`);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // IF ALREADY AUTHENTICATED: Display Sleek Executive Profile Card
  if (isAuthenticated && user) {
    return (
      <div className={`w-full max-w-lg mx-auto ${embedded ? '' : 'p-4 sm:p-6'}`} dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#E2D5BE] dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`
                }
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover bg-sky-100 dark:bg-sky-950 border-2 border-sky-400 dark:border-sky-600 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white truncate">
                  {user.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  نشط وموثق
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate" dir="ltr">
                {user.email || user.phone || 'حساب لحاذگ المستقل'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                طريقة التوثيق:{' '}
                {user.provider === 'phone_otp'
                  ? 'رقم الهاتف الموريتاني (+222)'
                  : user.provider === 'local'
                  ? 'البريد وكلمة السر'
                  : user.provider}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">تاريخ الانضمام</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {new Date(user.createdAt).toLocaleDateString('ar-MR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">نوع العضوية</p>
              <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                مستخدم ذكي (Pro)
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={logout}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                رجوع
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <div
      className={`w-full max-w-md mx-auto ${embedded ? '' : 'p-4 sm:p-6'} ${isShaking ? 'animate-shake' : ''}`}
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-[#E2D5BE] dark:border-slate-800 shadow-2xl space-y-6 transition-all duration-200">
        {/* Top Header & Brand Emblem */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 via-sky-700 to-emerald-700 text-white shadow-md shadow-sky-900/20 border border-sky-400/30">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' && 'تسجيل الدخول إلى لحاذگ'}
            {mode === 'register' && 'إنشاء حساب جديد في لحاذگ'}
            {mode === 'phone_otp' && 'الدخول السريع برقم الهاتف'}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            نظام مصادقة محلي مستقل ومشفّر لحفظ محادثاتك وسجل بحثك بأمان
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-[#FAF6EE] dark:bg-slate-800/80 rounded-2xl border border-[#E5DAC4] dark:border-slate-750 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleModeChange('login')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('register')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>حساب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('phone_otp')}
            className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'phone_otp'
                ? 'bg-white dark:bg-slate-700 text-sky-800 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>رمز الهاتف</span>
          </button>
        </div>

        {/* PROMINENT INTERACTIVE ERROR BANNER */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-xs space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-700 dark:hover:text-rose-200 p-0.5 cursor-pointer"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Contextual Smart Recovery Actions */}
            {mode === 'login' && (
              <div className="pt-1.5 border-t border-rose-200/60 dark:border-rose-900/50 flex items-center justify-between gap-2 flex-wrap text-[11px]">
                <button
                  type="button"
                  onClick={() => handleModeChange('phone_otp')}
                  className="text-sky-700 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3 h-3" />
                  <span>جرّب الدخول السريع برقم هاتفك الموريتاني (OTP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('register')}
                  className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  أو أنشئ حساباً جديداً
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUCCESS NOTIFICATION */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* 1. EMAIL & PASSWORD (LOGIN / REGISTER) */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleEmailAuth} noValidate className="space-y-4">
            {/* NAME FIELD (REGISTER ONLY) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الاسم الكامل:
                </label>
                <div className="relative flex items-center">
                  <User className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) validateField('name');
                    }}
                    onBlur={() => handleBlur('name')}
                    placeholder="محمد ولد أحمد"
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none ${
                      touchedFields.name && fieldErrors.name
                        ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 focus:ring-2 focus:ring-rose-400'
                        : touchedFields.name && name.trim().length >= 3
                        ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-2 focus:ring-emerald-400'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500'
                    }`}
                  />
                  {touchedFields.name && !fieldErrors.name && name.trim().length >= 3 && (
                    <CheckCircle2 className="absolute left-3 w-4 h-4 text-emerald-500" />
                  )}
                </div>

                {/* Inline Name Validation Error */}
                {touchedFields.name && fieldErrors.name && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>
            )}

            {/* EMAIL FIELD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                البريد الإلكتروني:
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) validateField('email');
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@example.mr"
                  className={`w-full pr-10 pl-4 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none font-sans ${
                    touchedFields.email && fieldErrors.email
                      ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 focus:ring-2 focus:ring-rose-400'
                      : touchedFields.email && !fieldErrors.email && email.includes('@')
                      ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-2 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500'
                  }`}
                  dir="ltr"
                />
                {touchedFields.email && !fieldErrors.email && email.includes('@') && (
                  <CheckCircle2 className="absolute left-3 w-4 h-4 text-emerald-500" />
                )}
              </div>

              {/* Inline Email Validation Error */}
              {touchedFields.email && fieldErrors.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور:
                </label>
                {mode === 'register' && password && (
                  <span className={`text-[10px] font-bold ${passwordStrength.color.split(' ')[1]}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) validateField('password');
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={`w-full pr-10 pl-11 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none font-mono ${
                    touchedFields.password && fieldErrors.password
                      ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 focus:ring-2 focus:ring-rose-400'
                      : touchedFields.password && !fieldErrors.password && password.length >= 6
                      ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-2 focus:ring-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500'
                  }`}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label="إظهار كلمة المرور"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter in Register Mode */}
              {mode === 'register' && password && (
                <div className="mt-2 space-y-1">
                  <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 1 ? passwordStrength.color.split(' ')[0] : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 2 ? passwordStrength.color.split(' ')[0] : 'bg-transparent'
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        passwordStrength.score >= 3 ? passwordStrength.color.split(' ')[0] : 'bg-transparent'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Inline Password Validation Error */}
              {touchedFields.password && fieldErrors.password && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD FIELD (REGISTER ONLY) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تأكيد كلمة المرور:
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute right-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) validateField('confirmPassword');
                    }}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="••••••••"
                    className={`w-full pr-10 pl-11 py-2.5 rounded-xl border text-xs sm:text-sm transition-all focus:outline-none font-mono ${
                      touchedFields.confirmPassword && fieldErrors.confirmPassword
                        ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 focus:ring-2 focus:ring-rose-400'
                        : touchedFields.confirmPassword && !fieldErrors.confirmPassword && confirmPassword === password && confirmPassword.length >= 6
                        ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 focus:ring-2 focus:ring-emerald-400'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500'
                    }`}
                    dir="ltr"
                  />
                  {confirmPassword && confirmPassword === password && confirmPassword.length >= 6 && (
                    <CheckCircle2 className="absolute left-3 w-4 h-4 text-emerald-500" />
                  )}
                </div>

                {/* Inline Confirm Password Validation Error */}
                {touchedFields.confirmPassword && fieldErrors.confirmPassword && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>
            )}

            {/* REMEMBER ME & FORGOT PASSWORD */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span>تذكرني على هذا الجهاز (30 يوماً)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleModeChange('phone_otp')}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[42px] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق والاتصال...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'دخول فوري' : 'إنشاء حساب جديد'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 2. MAURITANIAN PHONE NUMBER + 6-DIGIT OTP */}
        {mode === 'phone_otp' && (
          <div className="space-y-4">
            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-850/60 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2">
              <span className="text-base select-none shrink-0" role="img" aria-label="Mauritania">
                🇲🇷
              </span>
              <p className="leading-relaxed">
                رمز تحقق فوري (OTP) مدته 5 دقائق لأرقام موريتانيا (موريتل، شنقيتل، ماتل) وباقي الشبكات.
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} noValidate className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الهاتف:
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute right-3.5 text-slate-400 font-mono text-xs flex items-center gap-1 pointer-events-none">
                      <span>🇲🇷</span>
                      <span className="font-bold">+222</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) validateField('phone');
                      }}
                      onBlur={() => handleBlur('phone')}
                      placeholder="45 12 34 56"
                      className={`w-full pr-18 pl-4 py-2.5 rounded-xl border text-xs sm:text-sm font-mono transition-all focus:outline-none text-left ${
                        touchedFields.phone && fieldErrors.phone
                          ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 focus:ring-2 focus:ring-rose-400'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500'
                      }`}
                      dir="ltr"
                    />
                  </div>

                  {/* Inline Phone Error */}
                  {touchedFields.phone && fieldErrors.phone && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.phone}</span>
                    </p>
                  )}

                  <span className="text-[11px] text-slate-400 mt-1 block">
                    مثال: 45xxxxxx أو 36xxxxxx أو 22xxxxxx
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !phone}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[42px] active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الرمز...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>إرسال رمز التحقق (OTP)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      الرقم: <span className="font-mono font-bold" dir="ltr">{phone}</span>
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      الصلاحية المتبقية: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')} دقيقة
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold cursor-pointer"
                  >
                    تغيير الرقم
                  </button>
                </div>

                {demoCodeHint && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>
                      رمز الاختبار المباشر: <strong className="font-mono text-sm">{demoCodeHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpCode(demoCodeHint);
                        delete fieldErrors.otp;
                      }}
                      className="text-emerald-700 dark:text-emerald-400 underline font-bold cursor-pointer"
                    >
                      تعبئة فورية
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    أدخل رمز التحقق (6 أرقام):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                      if (val.length === 6) delete fieldErrors.otp;
                    }}
                    placeholder="123456"
                    autoFocus
                    className={`w-full text-center tracking-[0.5em] text-xl font-mono py-2.5 rounded-xl border transition-all focus:outline-none ${
                      fieldErrors.otp
                        ? 'border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 focus:ring-2 focus:ring-rose-400'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500'
                    }`}
                  />

                  {/* Inline OTP Validation Error */}
                  {fieldErrors.otp && (
                    <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.otp}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[42px] active:scale-[0.99]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد الرمز والدخول</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    disabled={otpTimer > 240 || isLoading}
                    onClick={handleSendOtp}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>إعادة إرسال رمز التحقق</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          <span className="absolute px-3 bg-white dark:bg-slate-900 text-[11px] text-slate-400">
            أو عبر بروتوكول OAuth 2.0
          </span>
        </div>

        {/* 3. SOCIAL OAUTH BUTTONS */}
        <div className="grid grid-cols-3 gap-2">
          {/* Google */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSocialAuth('google')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="تسجيل الدخول عبر حساب Google"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden sm:inline">Google</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSocialAuth('apple')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="تسجيل الدخول عبر Apple"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.66-.82 1.11-1.96.99-3.1-.95.04-2.12.64-2.8 1.44-.6.69-1.12 1.83-1 2.94 1.07.08 2.17-.55 2.81-1.28" />
            </svg>
            <span className="hidden sm:inline">Apple</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleSocialAuth('facebook')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="تسجيل الدخول عبر Facebook"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="hidden sm:inline">Facebook</span>
          </button>
        </div>

        {/* Security Assurance Footer */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
            تشفير قياسي PBKDF2/Bcrypt محلي • بدون منصات خارجية أو تتبع إعلاني
          </p>
        </div>
      </div>
    </div>
  );
};
