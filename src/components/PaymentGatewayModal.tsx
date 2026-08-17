import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Smartphone, 
  CreditCard, 
  Building2, 
  Copy, 
  Check, 
  Upload, 
  FileCheck, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  Loader2, 
  Send,
  AlertCircle,
  Receipt,
  FileText
} from 'lucide-react';
import { Project, Installment } from '../types';

interface Props {
  project: Project;
  installment: Installment;
  onClose: () => void;
  onSuccess: (updatedProject: Project, receiptRef: string, method: 'Apple Pay' | 'بطاقة مدى' | 'بطاقة ائتمانية' | 'تحويل بنكي') => void;
}

// Enterprise Official Banking Info
const INSTITUTION_BANK_INFO = {
  accountName: 'مؤسسة نماذج التميز للمقاولات العامة',
  bankName: 'الأهلي السعودي',
  iban: 'SA4410000001400028475203',
  accountNumber: '1000001400028475203',
  branch: 'الفرع الرئيسي'
};

export function PaymentGatewayModal({ project, installment, onClose, onSuccess }: Props) {
  // Only bank transfer as requested
  const [method, setMethod] = useState<'bank_transfer'>('bank_transfer');
  
  // Bank Transfer Form State
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [receiptFileUrl, setReceiptFileUrl] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBrand, setCardBrand] = useState<'mada' | 'visa' | 'mastercard'>('mada');

  // Checkout flow state
  const [flowState, setFlowState] = useState<'select' | 'processing' | 'apple_pay_prompt' | 'otp' | 'success' | 'transfer_submitted'>('select');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentTimestamp, setPaymentTimestamp] = useState('');

  // Copy to clipboard helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  // Handle receipt upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى المسموح 10 ميجابايت.');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setReceiptFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Bank Transfer Notification
  const handleBankTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderBank.trim()) {
      alert('يرجى كتابة اسم صاحب الحساب المحول منه واسم البنك.');
      return;
    }

    setFlowState('processing');
    setTimeout(() => {
      const generatedRef = transferRef.trim() || `TRF-${Math.floor(100000 + Math.random() * 900000)}`;
      const nowStr = new Date().toISOString().split('T')[0];

      const updatedInstallments = (project.installments || []).map(i => {
        if (i.id === installment.id) {
          return {
            ...i,
            status: 'under_review' as const,
            paymentMethod: 'تحويل بنكي' as const,
            transferSenderName: senderName.trim(),
            transferBankName: senderBank.trim(),
            transferRef: generatedRef,
            transferReceiptUrl: receiptFileUrl || undefined,
            transferDate: nowStr,
            transferNote: transferNotes.trim() || undefined,
            supervisorPaymentConfirmed: false
          };
        }
        return i;
      });

      const updatedProject: Project = {
        ...project,
        installments: updatedInstallments
      };

      setTransactionRef(generatedRef);
      setPaymentTimestamp(nowStr);
      setFlowState('transfer_submitted');
      onSuccess(updatedProject, generatedRef, 'تحويل بنكي');
    }, 1000);
  };

  // Card formatting
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);

    if (cleaned.startsWith('4')) {
      setCardBrand('visa');
    } else if (cleaned.startsWith('51') || cleaned.startsWith('52') || cleaned.startsWith('53') || cleaned.startsWith('54') || cleaned.startsWith('55')) {
      setCardBrand('mastercard');
    } else {
      setCardBrand('mada');
    }
  };

  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setCardExpiry(cleaned);
    }
  };

  const handleApplePaySubmit = () => {
    setFlowState('apple_pay_prompt');
  };

  const handleConfirmApplePayPrompt = () => {
    setFlowState('processing');
    setTimeout(() => {
      completeDirectPayment('تحويل بنكي');
    }, 1200);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16 || !cardHolder || cardExpiry.length < 5 || cardCvv.length < 3) {
      return;
    }
    setFlowState('processing');
    setTimeout(() => {
      setFlowState('otp');
    }, 1000);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length >= 4) {
      setFlowState('processing');
      setTimeout(() => {
        completeDirectPayment('تحويل بنكي');
      }, 1000);
    } else {
      setOtpError('يرجى إدخال رمز التحقق المكون من 4 أرقام');
    }
  };

  const completeDirectPayment = (paymentMethod: 'تحويل بنكي' = 'تحويل بنكي') => {
    const ref = `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const nowStr = new Date().toLocaleDateString('ar-SA') + ' - ' + new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    setTransactionRef(ref);
    setPaymentTimestamp(nowStr);

    const updatedInstallments = (project.installments || []).map(i => {
      if (i.id === installment.id) {
        return {
          ...i,
          status: 'paid' as const,
          paymentDate: new Date().toISOString().split('T')[0],
          transactionRef: ref,
          paymentMethod,
          supervisorPaymentConfirmed: true
        };
      }
      return i;
    });

    const updatedProject: Project = {
      ...project,
      installments: updatedInstallments
    };

    setFlowState('success');
    onSuccess(updatedProject, ref, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border-t sm:border border-[#E8E2D8] text-[#192A1D] space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-[#E8E2D8] rounded-full mx-auto mb-2 sm:hidden"></div>

        {/* 1. SELECTION & FORM STATE */}
        {flowState === 'select' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#EFE7DC] flex items-center justify-center text-[#1C3022]">
                  <CreditCard className="w-5 h-5 text-[#1C3022]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#F8F5F0]">سداد دفعة المشروع الإنشائي</h3>
                  <p className="text-[10px] text-slate-400 font-bold">مؤسسة نماذج التميز للمقاولات العامة</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bill Summary Card */}
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">المشروع الإنشائي:</span>
                <span className="font-black text-[#1C3022] truncate max-w-[200px]">{project.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold">الدفعة المستحقة:</span>
                <span className="font-black text-[#1C3022]">{installment.title}</span>
              </div>
              <div className="pt-2 border-t border-[#E8E2D8] flex justify-between items-center">
                <span className="text-xs font-black text-slate-700">المبلغ المطلوب سداده:</span>
                <span className="text-lg font-black text-[#1C3022]">{installment.amount}</span>
              </div>
            </div>

            {/* Method Tabs (Bank Transfer IBAN is 1st & Prominent) */}
            <div className="grid grid-cols-3 gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E2D8]">
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`py-2.5 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                  method === 'bank_transfer' 
                    ? 'bg-[#1C3022] text-[#F8F5F0] shadow-sm' 
                    : 'text-slate-600 hover:text-[#1C3022]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>تحويل بنكي (IBAN)</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('apple_pay')}
                className={`py-2.5 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                  method === 'apple_pay' 
                    ? 'bg-black text-white shadow-sm' 
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Apple Pay</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2.5 px-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 transition-all ${
                  method === 'card' 
                    ? 'bg-[#1C3022] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-[#1C3022]'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>مدى / بطاقة</span>
              </button>
            </div>

            {/* 1. BANK TRANSFER (IBAN) SECTION */}
            {method === 'bank_transfer' && (
              <div className="space-y-4 pt-1">
                {/* Official Institution Bank Account Card */}
                <div className="bg-[#1C3022] text-[#F8F5F0] p-4 sm:p-5 rounded-2xl border border-[#284430] space-y-3 shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#C5B198] text-[#1C3022] flex items-center justify-center font-black">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#D0A97E] font-bold block">الحساب البنكي المعتمد للمؤسسة</span>
                        <h4 className="text-xs font-black">{INSTITUTION_BANK_INFO.bankName}</h4>
                      </div>
                    </div>
                    <span className="text-[9px] bg-[#C5B198]/20 text-[#D0A97E] border border-[#C5B198]/30 px-2 py-0.5 rounded-md font-bold">
                      حساب تجاري رسمي
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Account Name */}
                    <div className="bg-black/25 p-2.5 rounded-xl text-xs space-y-0.5">
                      <span className="text-[10px] text-[#EFE7DC]/70 block font-medium">اسم المستفيد / المؤسسة:</span>
                      <span className="font-black text-[#F8F5F0] block">{INSTITUTION_BANK_INFO.accountName}</span>
                    </div>

                    {/* IBAN */}
                    <div className="bg-black/25 p-2.5 rounded-xl flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-[#EFE7DC]/70 block font-medium">رقم الآيبان (IBAN):</span>
                        <span className="font-mono font-black text-xs sm:text-sm text-[#D0A97E] block tracking-wider" dir="ltr">
                          {INSTITUTION_BANK_INFO.iban}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(INSTITUTION_BANK_INFO.iban, 'iban')}
                        className="bg-[#C5B198] hover:bg-[#BAA386] text-[#1C3022] px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 shrink-0 transition-all active:scale-95"
                      >
                        {copiedField === 'iban' ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الآيبان</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Number */}
                    <div className="bg-black/25 p-2.5 rounded-xl flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#EFE7DC]/70 block font-medium">رقم الحساب:</span>
                        <span className="font-mono font-bold text-xs text-[#F8F5F0]" dir="ltr">
                          {INSTITUTION_BANK_INFO.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(INSTITUTION_BANK_INFO.accountNumber, 'acc')}
                        className="bg-white/10 hover:bg-white/20 text-[#F8F5F0] px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        {copiedField === 'acc' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#D0A97E]" />
                        )}
                        <span>نسخ الحساب</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer Submission Form */}
                <form onSubmit={handleBankTransferSubmit} className="space-y-3 pt-1">
                  <div className="border-b border-[#E8E2D8] pb-2">
                    <h4 className="text-xs font-black text-[#1C3022]">توثيق بيانات الحوالة بعد إتمام التحويل:</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      بعد التحويل من تطبيقك البنكي، أدخل بيانات الحوالة ليتسنى للمشرف مراجعتها وتأكيد السداد.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-[#192A1D] mb-1">اسم صاحب الحساب المحول منه *</label>
                      <input
                        type="text"
                        required
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="الاسم الثلاثي للمحول"
                        className="w-full bg-[#FAF7F2] border border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C3022] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-[#192A1D] mb-1">اسم البنك المحول منه *</label>
                      <input
                        type="text"
                        required
                        value={senderBank}
                        onChange={e => setSenderBank(e.target.value)}
                        placeholder="مثال: مصرف الراجحي، الأهلي..."
                        className="w-full bg-[#FAF7F2] border border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C3022] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-[#192A1D] mb-1">الرقم المرجعي للحوالة (اختياري)</label>
                    <input
                      type="text"
                      value={transferRef}
                      onChange={e => setTransferRef(e.target.value)}
                      placeholder="رقم مرجع التحويل من الإشعار البنكي"
                      className="w-full bg-[#FAF7F2] border border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#1C3022] outline-none"
                      dir="ltr"
                    />
                  </div>

                  {/* Receipt Upload */}
                  <div>
                    <label className="block text-[11px] font-black text-[#192A1D] mb-1">إرفاق صورة إشعار التحويل البنكي (اختياري)</label>
                    <div className="relative border-2 border-dashed border-[#E8E2D8] hover:border-[#C5B198] bg-[#FAF7F2] rounded-2xl p-3 text-center transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                        <Upload className="w-4 h-4 text-[#A99379]" />
                        <span>{receiptFileName ? receiptFileName : 'انقر لاختيار صورة إشعار التحويل من جهازك'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                    <Send className="w-4 h-4 text-[#D0A97E]" />
                    <span>تأكيد إرسال التحويل وإشعار المشرف للمراجعة</span>
                  </button>
                </form>
              </div>
            )}

            {/* 2. APPLE PAY SECTION */}
            {method === 'apple_pay' && (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-black text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white text-black rounded-lg flex items-center justify-center font-bold text-xs">
                        
                      </div>
                      <span className="font-bold text-xs tracking-wider">Pay with Apple Pay</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      سداد مباشر
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    ادفع فوراً وبأمان بلمسة واحدة باستخدام Face ID أو Touch ID المربوط ببطاقتك البنكية.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleApplePaySubmit}
                  className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-neutral-900 transition-all shadow-lg active:scale-[0.98]"
                >
                  <span className="text-lg leading-none"></span>
                  <span>Pay {installment.amount}</span>
                </button>
              </div>
            )}

            {/* 3. CARD SECTION */}
            {method === 'card' && (
              <form onSubmit={handleCardSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-black text-[#192A1D] mb-1">
                    رقم البطاقة (مدى / فيزا / ماستركارد)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="5888 XXXX XXXX XXXX"
                      maxLength={19}
                      required
                      className="w-full bg-[#FAF7F2] border-2 border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-[#1C3022] outline-none"
                      dir="ltr"
                    />
                    <span className="absolute left-3 text-[10px] font-black bg-[#EFE7DC] px-2 py-0.5 rounded text-[#1C3022]">
                      {cardBrand === 'mada' ? 'مدى 🇸🇦' : cardBrand.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-[#192A1D] mb-1">اسم حامل البطاقة</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="الاسم كما هو مدون على البطاقة"
                    required
                    className="w-full bg-[#FAF7F2] border-2 border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C3022] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-[#192A1D] mb-1">تاريخ الانتهاء</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                      required
                      className="w-full bg-[#FAF7F2] border-2 border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-[#1C3022] outline-none text-center"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-[#192A1D] mb-1">رمز الأمان (CVV)</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      maxLength={4}
                      required
                      className="w-full bg-[#FAF7F2] border-2 border-[#E8E2D8] focus:border-[#C5B198] rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-[#1C3022] outline-none text-center"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="w-4 h-4 text-[#D0A97E]" />
                  <span>دفع {installment.amount} بأمان</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. PROCESSING STATE */}
        {flowState === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#C5B198] border-t-[#1C3022] rounded-full animate-spin mx-auto"></div>
            <h3 className="text-base font-black text-[#1C3022]">جاري توثيق المعاملة وتسجيل الدفعة...</h3>
            <p className="text-xs text-slate-500 font-medium">يرجى الانتظار دون إغلاق الصفحة لتوثيق البيانات بالسحابة</p>
          </div>
        )}

        {/* 3. APPLE PAY CONFIRMATION PROMPT */}
        {flowState === 'apple_pay_prompt' && (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-xl">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1C3022]">تأكيد الدفع عبر Apple Pay</h3>
              <p className="text-xs text-slate-500 mt-1">انقر للتأكيد وتفويض السداد البنكي المباشر</p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] text-right space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">المستفيد:</span>
                <span className="font-black text-[#1C3022]">نماذج التميز للمقاولات</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الدفعة:</span>
                <span className="font-black text-[#1C3022]">{installment.title}</span>
              </div>
              <div className="flex justify-between border-t border-[#E8E2D8] pt-2 font-black text-sm text-[#1C3022]">
                <span>الإجمالي:</span>
                <span>{installment.amount}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmApplePayPrompt}
                className="flex-1 bg-black text-white py-3.5 rounded-2xl font-black text-xs hover:bg-neutral-900 flex items-center justify-center gap-2"
              >
                <span>تأكيد العملية الآن</span>
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setFlowState('select')}
                className="px-4 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* 4. 3D SECURE OTP STATE */}
        {flowState === 'otp' && (
          <form onSubmit={handleOtpVerify} className="space-y-4 py-2">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EFE7DC] text-[#1C3022] flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-[#F8F5F0]">التحقق الآمن (3D Secure)</h3>
              <p className="text-xs text-slate-500 mt-1">
                أدخل رمز الأمان المرسل من البنك إلى هاتفك الجوال المسجل
              </p>
            </div>

            {otpError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-xl text-center">
                {otpError}
              </div>
            )}

            <div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setOtpError('');
                }}
                placeholder="1234"
                maxLength={4}
                autoFocus
                required
                className="w-40 mx-auto block bg-[#FAF7F2] border-2 border-[#1C3022] rounded-2xl py-3 text-center text-xl font-mono font-black tracking-widest text-[#1C3022] outline-none"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] transition-all shadow-md active:scale-[0.98]"
            >
              تأكيد السداد والخصم
            </button>
          </form>
        )}

        {/* 5. BANK TRANSFER SUBMITTED NOTIFICATION SCREEN */}
        {flowState === 'transfer_submitted' && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-base font-black text-[#1C3022]">تم إرسال إشعار التحويل البنكي للمشرف</h3>
              <p className="text-xs text-slate-500 mt-0.5">طلبك قيد المراجعة للتحقق من وصول المبلغ إلى حساب المؤسسة</p>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-2 border-[#E8E2D8] rounded-2xl space-y-2.5 text-xs text-[#192A1D]">
              <div className="flex justify-between items-center pb-2 border-b border-[#E8E2D8]">
                <span className="text-[10px] font-black text-slate-400">الرقم المرجعي:</span>
                <span className="font-mono font-black text-[#1C3022]">{transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">الدفعة:</span>
                <span className="font-black text-[#1C3022]">{installment.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">المبلغ المحول:</span>
                <span className="font-black text-emerald-800">{installment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">اسم المحول:</span>
                <span className="font-black text-[#1C3022]">{senderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">حالة الدفعة:</span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-black text-[10px]">
                  بانتظار تأكيد واعتماد المشرف
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] transition-all shadow-md"
            >
              حسناً، العودة للتطبيق
            </button>
          </div>
        )}

        {/* 6. SUCCESS RECEIPT STATE (For Direct Card & Apple Pay) */}
        {flowState === 'success' && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="text-base font-black text-[#1C3022]">تم سداد الدفعة بنجاح</h3>
              <p className="text-xs text-slate-500 mt-0.5">تم إصدار وتوثيق سند القبض الإلكتروني المعتمد</p>
            </div>

            <div className="p-4 bg-[#FAF7F2] border-2 border-[#E8E2D8] rounded-2xl space-y-2.5 text-xs text-[#192A1D]">
              <div className="flex justify-between items-center pb-2 border-b border-[#E8E2D8]">
                <span className="text-[10px] font-black text-slate-400">سند قبض رقم:</span>
                <span className="font-mono font-black text-[#1C3022]">{transactionRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">المشروع:</span>
                <span className="font-black text-[#1C3022]">{project.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">الدفعة:</span>
                <span className="font-black text-[#1C3022]">{installment.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">طريقة الدفع:</span>
                <span className="font-black text-[#1C3022]">
                  {method === 'apple_pay' ? 'Apple Pay' : cardBrand === 'mada' ? 'بطاقة مدى 🇸🇦' : 'بطاقة ائتمانية'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E8E2D8] flex justify-between items-center">
                <span className="font-black text-slate-700">المبلغ المسدد:</span>
                <span className="text-base font-black text-emerald-700">{installment.amount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] transition-all shadow-md"
            >
              إغلاق والعودة للتطبيق
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
