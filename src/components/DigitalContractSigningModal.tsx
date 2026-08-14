import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  FileCheck,
  X,
  PenTool,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Download,
  Calendar,
  Building2,
  Wallet,
  FileText,
  Loader2
} from 'lucide-react';
import { Project, QuoteRequest, User, ProjectContract } from '../types';

interface DigitalContractSigningModalProps {
  project?: Project | null;
  quote?: QuoteRequest | null;
  user: User;
  onClose: () => void;
  onSigned: (signatureData: {
    contractNumber: string;
    signDate: string;
    signerName: string;
    signatureImgUrl?: string;
  }) => Promise<void>;
}

export function DigitalContractSigningModal({
  project,
  quote,
  user,
  onClose,
  onSigned
}: DigitalContractSigningModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(user.name || '');
  const [nationalId, setNationalId] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');

  const contractNumber = `CNT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const signDate = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const projectTitle = project?.title || quote?.projectName || 'مشروع إنشائي جديد';
  const totalValue = quote?.quoteAmount || quote?.amount || (project?.installments?.reduce((sum, i) => sum + (i.amountNumber || 0), 0) ? `${project.installments.reduce((sum, i) => sum + (i.amountNumber || 0), 0).toLocaleString('ar-SA')} ر.س` : 'حسب جدول الدفعات');
  const installments = quote?.installments || project?.installments || [];

  // Canvas drawing handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1C3022';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('يرجى الموافقة على بنود العقد والشروط الإنشائية.');
      return;
    }
    if (!signerName.trim()) {
      alert('يرجى كتابة الاسم الكامل للموقع.');
      return;
    }

    let sigUrl = '';
    if (signatureMode === 'draw' && canvasRef.current && hasDrawn) {
      sigUrl = canvasRef.current.toDataURL('image/png');
    }

    setIsSubmitting(true);
    try {
      await onSigned({
        contractNumber,
        signDate,
        signerName: signerName.trim(),
        signatureImgUrl: sigUrl || undefined
      });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توثيق العقد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        className="bg-white rounded-[2rem] max-w-lg w-full max-h-[92vh] flex flex-col text-[#192A1D] border border-[#C5B198] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#1C3022] text-[#F8F5F0] p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C5B198] text-[#1C3022] flex items-center justify-center font-black">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black">توقيع وتوثيق عقد المقاولة إلكترونياً</h3>
              <p className="text-[10px] text-[#C5B198]">رقم الوثيقة: {contractNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleConfirmSign} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Summary Box */}
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">طرف العقد الأول (المقاول):</span>
                <span className="font-black text-[#1C3022]">شركة نماذج التميز للمقاولات العامة</span>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                معتمد بلدياً
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">طرف العقد الثاني (العميل):</span>
                <span className="font-black text-[#1C3022]">{user.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">اسم المشروع:</span>
                <span className="font-black text-[#1C3022] truncate block">{projectTitle}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">إجمالي قيمة العقد:</span>
                <span className="font-black text-emerald-800">{totalValue}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">تاريخ التوثيق:</span>
                <span className="font-black text-[#1C3022]">{signDate}</span>
              </div>
            </div>
          </div>

          {/* Installment Breakdown preview in contract */}
          {installments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#1C3022] flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-[#A99379]" />
                  <span>جدول الدفعات المعتمد في العقد ({installments.length} دفعات):</span>
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {installments.map((inst, idx) => (
                  <div
                    key={inst.id || idx}
                    className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-[#1C3022] text-[#C5B198] text-[9px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-black text-[#1C3022]">{inst.title}</span>
                    </div>
                    <div className="text-left">
                      <span className="font-black text-emerald-800 block">{inst.amount}</span>
                      <span className="text-[9px] text-slate-400 block">الاستحقاق: {inst.dueDate || 'حسب المرحلة'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Terms & Warranties */}
          <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] space-y-2 text-[11px] text-slate-600 leading-relaxed font-medium">
            <h5 className="font-black text-[#1C3022] text-xs flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>الشروط والأحكام والضمانات الرسمية:</span>
            </h5>
            <p>1. يلتزم المقاول بتنفيذ المشروع وفقاً للمواصفات الهندسية والمخططات المعتمدة وتطبيق كود البناء السعودي.</p>
            <p>2. يلتزم العميل بسداد الدفعات المالية فور إنجاز كل مرحلة هندسية واعتمادها في التطبيق.</p>
            <p>3. يشمل العقد ضمان هيكل إنشائي لمدة 10 سنوات وضمان أعمال العزل والسباكة والكهرباء لمدة عامين.</p>
            <p>4. يعد هذا التوقيع الإلكتروني ملزماً ومعتمداً وله الحجية القانونية الكاملة في المملكة العربية السعودية.</p>
          </div>

          {/* Signer Identification */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-[#1C3022] flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-[#A99379]" />
              <span>بيانات الموقع والتوقيع الإلكتروني</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">الاسم الكامل للموقع *</label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="الاسم الرباعي كما في الهوية"
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-700 block mb-1">رقم الهوية الوطنية / الإقامة (اختياري)</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="10XXXXXXXX"
                  maxLength={10}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Signature Pad Mode Switch */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all ${
                  signatureMode === 'draw'
                    ? 'bg-[#1C3022] text-[#F8F5F0] border-[#1C3022]'
                    : 'bg-[#FAF7F2] text-slate-600 border-[#E8E2D8]'
                }`}
              >
                رسم التوقيع اليدوي
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('type')}
                className={`py-1.5 px-3 rounded-xl text-xs font-black border transition-all ${
                  signatureMode === 'type'
                    ? 'bg-[#1C3022] text-[#F8F5F0] border-[#1C3022]'
                    : 'bg-[#FAF7F2] text-slate-600 border-[#E8E2D8]'
                }`}
              >
                ختم إلكتروني معتمد بالاسم
              </button>
            </div>

            {/* Interactive Canvas Drawing Pad */}
            {signatureMode === 'draw' ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                  <span>ارسم توقيعك في المربع أدناه (بالإصبع أو الماوس):</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 font-black"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مسح التوقيع</span>
                  </button>
                </div>
                <div className="border-2 border-dashed border-[#C5B198] rounded-2xl bg-[#FAF7F2] overflow-hidden relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 cursor-crosshair block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-bold">
                      مكان التوقيع اليدوي...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Verified Name Stamp Box */
              <div className="p-4 bg-[#EFE7DC]/50 rounded-2xl border border-[#C5B198] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">الختم الرقمي المعتمد:</span>
                  <span className="text-sm font-black text-[#1C3022]">{signerName || user.name}</span>
                  <span className="text-[9px] text-emerald-800 font-bold block mt-0.5">موثق ومطابق لحساب {user.email || user.name}</span>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#1C3022] flex flex-col items-center justify-center text-[8px] font-black text-[#1C3022] rotate-[-8deg] bg-white/70">
                  <span>معتمد رقمياً</span>
                  <span>{new Date().getFullYear()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#1C3022] focus:ring-[#C5B198] accent-[#1C3022]"
              />
              <span className="text-xs font-bold text-slate-700 leading-relaxed">
                أقر بموافقتي التامة والملزمة على كافة بنود هذا العقد وجدول الدفعات المذكور، وتعتبر هذه الوثيقة عقداً إلكترونياً نافذاً وسارياً.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !agreedToTerms}
              className="flex-1 bg-[#1C3022] text-[#F8F5F0] hover:bg-[#122116] py-3.5 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5B198]" />
                  <span>جاري توثيق واعتماد العقد...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-[#C5B198]" />
                  <span>توقيع وتوثيق العقد رسمياً</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 py-3.5 px-4 rounded-2xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
