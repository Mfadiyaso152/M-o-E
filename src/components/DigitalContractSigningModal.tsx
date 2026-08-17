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
  Loader2,
  Paperclip,
  UploadCloud
} from 'lucide-react';
import { Project, QuoteRequest, User, ProjectDocument } from '../types';
import { downloadFile } from '../utils/fileDownloader';

interface DigitalContractSigningModalProps {
  project?: Project | null;
  quote?: QuoteRequest | null;
  user: User;
  isSupervisor?: boolean;
  onClose: () => void;
  onSigned: (signatureData: {
    contractNumber: string;
    signDate: string;
    signerName: string;
    signatureImgUrl?: string;
    contractDocument?: ProjectDocument;
  }) => Promise<void>;
}

export function DigitalContractSigningModal({
  project,
  quote,
  user,
  isSupervisor = false,
  onClose,
  onSigned
}: DigitalContractSigningModalProps) {
  // Lock body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(user.name || '');
  const [nationalId, setNationalId] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');

  // Contract attachment state
  const [contractDoc, setContractDoc] = useState<ProjectDocument | null>(() => {
    if (project?.documents && project.documents.length > 0) {
      const existing = project.documents.find(d => d.category === 'عقد معتمد');
      if (existing) return existing;
    }
    if (quote?.fileUrl) {
      return {
        id: `DOC-CNT-${Date.now().toString().slice(-4)}`,
        name: quote.fileName || 'عقد المقاولة المعتمد',
        category: 'عقد معتمد',
        fileUrl: quote.fileUrl,
        fileName: quote.fileName || 'contract.pdf',
        fileSize: quote.fileSize || '1.5 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: 'المشرف العام'
      };
    }
    return null;
  });

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setContractDoc({
          id: `DOC-CNT-${Date.now().toString().slice(-4)}`,
          name: file.name,
          category: 'عقد معتمد',
          fileUrl: event.target.result as string,
          fileName: file.name,
          fileSize: sizeFormatted,
          uploadedAt: new Date().toISOString().split('T')[0],
          uploadedBy: isSupervisor ? 'المشرف العام' : user.name
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('يرجى الموافقة على بنود العقد والمصادقة على صحة البيانات.');
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
        signatureImgUrl: sigUrl || undefined,
        contractDocument: contractDoc || undefined
      });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توثيق العقد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm touch-none" dir="rtl">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[#122119] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col text-[#F8F5F0] border border-[#C5B198] shadow-2xl overflow-hidden touch-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C3022] text-[#F8F5F0] p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#C5B198] text-[#F8F5F0] flex items-center justify-center font-black">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">توقيع وتوثيق عقد المقاولة إلكترونياً</h3>
              <p className="text-[10px] text-[#D0A97E]">رقم العقد: {contractNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#122119]/10 hover:bg-[#122119]/20 flex items-center justify-center text-[#1C3022]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleConfirmSign} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
          {/* Summary Box */}
          <div className="bg-[#0B1510] p-3.5 rounded-2xl border border-[#2A3A2F] space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#F8F5F0]/50 block">طرف العقد الأول (المقاول):</span>
                <span className="font-black text-[#F8F5F0]">شركة نماذج التميز للمقاولات</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#F8F5F0]/50 block">طرف العقد الثاني:</span>
                <span className="font-black text-[#F8F5F0]">{quote?.clientName || user.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#F8F5F0]/50 block">المشروع:</span>
                <span className="font-black text-[#F8F5F0] truncate block">{projectTitle}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#F8F5F0]/50 block">إجمالي القيمة:</span>
                <span className="font-black text-emerald-800">{totalValue}</span>
              </div>
            </div>
          </div>

          {/* Attached Contract File Section */}
          <div className="bg-[#0B1510] p-3 rounded-2xl border border-[#2A3A2F] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#F8F5F0] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#D0A97E]" />
                <span>مستند وملف العقد المعتمد</span>
              </span>
              {contractDoc && (
                <button
                  type="button"
                  onClick={() => downloadFile(contractDoc.fileUrl, contractDoc.fileName || 'عقد_المقاولة.pdf')}
                  className="text-[10px] font-black text-[#F8F5F0] bg-[#122119] px-2 py-1 rounded-lg border border-[#2A3A2F] hover:bg-slate-50 flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-[#D0A97E]" />
                  <span>تحميل العقد</span>
                </button>
              )}
            </div>

            {contractDoc ? (
              <div className="p-2 bg-[#122119] rounded-xl border border-[#2A3A2F] flex items-center justify-between text-xs">
                <span className="font-bold text-[#F8F5F0] truncate max-w-[200px]">{contractDoc.fileName || contractDoc.name}</span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">مرفق وجاهز</span>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#C5B198] bg-[#122119] p-3 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-center">
                <UploadCloud className="w-5 h-5 text-[#D0A97E] mb-1" />
                <span className="text-xs font-black text-[#F8F5F0]">إرفاق ملف العقد من جهازك (PDF / صور)</span>
                <span className="text-[10px] text-[#F8F5F0]/50">انقر هنا لاختيار الملف من الهاتف أو الكمبيوتر</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            )}
          </div>

          {/* Signer Information & Mode */}
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-black text-[#F8F5F0] block mb-1">الاسم الكامل للموقع *</label>
              <input
                type="text"
                required
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="w-full bg-[#0B1510] border border-[#2A3A2F] rounded-xl px-3 py-2 text-xs font-bold text-[#F8F5F0] outline-none"
              />
            </div>

            {/* Signature Pad Mode Switch */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignatureMode('draw')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
                  signatureMode === 'draw'
                    ? 'bg-[#1C3022] text-[#F8F5F0]'
                    : 'bg-[#0B1510] text-[#F8F5F0]/70 border border-[#2A3A2F]'
                }`}
              >
                توقيع يدوي (رسم)
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode('type')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
                  signatureMode === 'type'
                    ? 'bg-[#1C3022] text-[#F8F5F0]'
                    : 'bg-[#0B1510] text-[#F8F5F0]/70 border border-[#2A3A2F]'
                }`}
              >
                ختم إلكتروني موثق
              </button>
            </div>

            {/* Interactive Canvas Drawing Pad */}
            {signatureMode === 'draw' ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-[#F8F5F0]/60 font-bold">
                  <span>ارسم توقيعك في المربع أدناه:</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 font-black"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مسح</span>
                  </button>
                </div>
                <div className="border border-[#C5B198] rounded-2xl bg-[#0B1510] overflow-hidden relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 cursor-crosshair block"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-bold">
                      مكان التوقيع اليدوي...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#0B1510] rounded-2xl border border-[#C5B198] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#F8F5F0]/60 font-bold block">التوقيع الرقمي المعتمد:</span>
                  <span className="text-xs font-black text-[#F8F5F0]">{signerName || user.name}</span>
                  <span className="text-[9px] text-emerald-800 font-bold block mt-0.5">موثق ومسجل إلكترونياً</span>
                </div>
              </div>
            )}
          </div>

          {/* Terms Agreement Checkbox */}
          <div>
            <label className="flex items-start gap-2 cursor-pointer select-none bg-[#0B1510] p-2.5 rounded-2xl border border-[#2A3A2F]">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#F8F5F0] accent-[#1C3022]"
              />
              <span className="text-xs font-bold text-slate-700 leading-relaxed">
                أوافق على توقيع واعتماد العقد وجدول الدفعات ونقل المشروع للتنفيذ.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !agreedToTerms}
              className="flex-1 bg-[#1C3022] text-[#F8F5F0] hover:bg-[#122116] py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D0A97E]" />
                  <span>جاري الاعتماد...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-[#D0A97E]" />
                  <span>توقيع واعتماد العقد</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200 py-3 px-4 rounded-2xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
