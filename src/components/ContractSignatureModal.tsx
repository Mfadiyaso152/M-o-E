import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FileText, CheckCircle2, ShieldCheck, Download, PenTool, Loader2, Calendar, FileCheck } from 'lucide-react';
import { Project, ProjectContract } from '../types';
import { ProjectService } from '../services/dbService';

interface Props {
  project: Project;
  onClose: () => void;
  onSigned: (updatedProject: Project) => void;
  onRequestToast: (msg: string) => void;
}

export function ContractSignatureModal({
  project,
  onClose,
  onSigned,
  onRequestToast
}: Props) {
  const contract = project.contracts?.[0];
  const [signerName, setSignerName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAlreadySigned = contract?.status === 'ساري وموثق' && contract?.signDate && contract.signDate !== 'بانتظار التوقيع الإلكتروني';

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      onRequestToast('يرجى كتابة الاسم الثلاثي لصاحب العقد');
      return;
    }
    if (!agreeToTerms) {
      onRequestToast('يرجى الموافقة على بنود وشروط العقد الإنشائي');
      return;
    }

    setIsSubmitting(true);
    const signDateStr = new Date().toLocaleDateString('ar-SA');

    const updatedContracts: ProjectContract[] = project.contracts && project.contracts.length > 0 ? project.contracts.map((c, idx) => {
      if (idx === 0) {
        return {
          ...c,
          signDate: signDateStr,
          status: 'ساري وموثق',
          termsSummary: [
            ...(c.termsSummary || []),
            `تم التوقيع والمصادقة إلكترونياً بواسطة: ${signerName.trim()}`,
            `الهوية الوطنية: ${nationalId || 'مسجلة بالحساب'}`,
            `تاريخ التوثيق: ${new Date().toISOString().split('T')[0]}`
          ]
        };
      }
      return c;
    }) : [
      {
        id: `CNT-${Date.now().toString().slice(-4)}`,
        contractNumber: `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `عقد تنفيذ وإنشاء ${project.title}`,
        signDate: signDateStr,
        totalValue: project.installments?.reduce((sum, i) => sum + (i.amountNumber || 0), 0)?.toLocaleString('ar-SA') + ' ر.س' || 'معتمد',
        status: 'ساري وموثق',
        termsSummary: [
          'الالتزام التام بكود البناء السعودي الصادر عن وزارة الشؤون البلدية والقروية والإسكان.',
          'ضمان هيكل إنشائي لمدة 10 سنوات وضمان عوازل مائية وحرارية لمدة 10 سنوات.',
          'إشراف هندسي مستمر وتوثيق مراحل الصب واختبارات الخرسانة المعتمدة.',
          `تم التوقيع والمصادقة إلكترونياً بواسطة: ${signerName.trim()}`
        ]
      }
    ];

    const updatedProject: Project = {
      ...project,
      status: project.status === 'بانتظار العقد' ? 'قيد التنفيذ' : project.status,
      contracts: updatedContracts
    };

    try {
      await ProjectService.saveProject(updatedProject);
      onSigned(updatedProject);
      onRequestToast('تم توقيع العقد والمصادقة عليه إلكترونياً بنجاح! المشروع الآن ساري وقيد التنفيذ.');
      onClose();
    } catch (err) {
      console.error(err);
      onRequestToast('حدث خطأ أثناء حفظ التوقيع الإلكتروني.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-[#E8E2D8] text-[#192A1D] space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1C3022] text-[#C5B198] flex items-center justify-center font-black">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1C3022]">العقد الإلكتروني للمشروع</h3>
              <p className="text-[10px] text-slate-500 font-bold">{project.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contract Document Preview Card */}
        <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#A99379] block">
                رقم العقد: {contract?.contractNumber || `DOC-${new Date().getFullYear()}-001`}
              </span>
              <h4 className="text-xs font-black text-[#1C3022]">
                {contract?.title || `عقد تنفيذ وأعمال ${project.title}`}
              </h4>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              isAlreadySigned ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {isAlreadySigned ? 'موقّع ومعتمد ✓' : 'بانتظار توقيع العميل'}
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-[#E8E2D8]">
            <span className="font-black text-[#1C3022] block text-[11px]">ملخص البنود والضمانات المعتمدة:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              {(contract?.termsSummary || [
                'الالتزام التام بكود البناء السعودي الصادر عن وزارة الشؤون البلدية والقروية والإسكان.',
                'ضمان هيكل إنشائي لمدة 10 سنوات وضمان عوازل مائية وحرارية لمدة 10 سنوات.',
                'إشراف هندسي مستمر وتوثيق مراحل الصب واختبارات الخرسانة المعتمدة.',
                'التزام الطرفين بجدول الدفعات المالي المحدد في المنصة.'
              ]).map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* SIGNATURE FORM OR SIGNED BADGE */}
        {isAlreadySigned ? (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
            <h4 className="text-xs font-black text-emerald-950">تم توقيع وتوثيق هذا العقد إلكترونياً</h4>
            <p className="text-[11px] text-emerald-800 font-bold">
              تاريخ التوقيع: {contract?.signDate}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-emerald-800 text-white py-2.5 rounded-xl font-black text-xs hover:bg-emerald-900 transition-all mt-2"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignContract} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">
                الاسم الثلاثي لصاحب العقد (الموقّع) *
              </label>
              <input
                type="text"
                required
                placeholder="اكتب اسمك الثلاثي كما هو بالهوية الوطنية"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">
                رقم الهوية الوطنية / الإقامة (اختياري)
              </label>
              <input
                type="text"
                placeholder="10xxxxxxxx"
                value={nationalId}
                onChange={e => setNationalId(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">
                التوقيع الإلكتروني (كتابة الاسم المعتمد) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="اكتب توقيعك هنا"
                  value={signatureText}
                  onChange={e => setSignatureText(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-sm font-black text-[#1C3022] italic outline-none focus:ring-2 focus:ring-[#C5B198]"
                />
                <PenTool className="w-4 h-4 text-[#A99379] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8] text-xs font-bold text-[#1C3022]">
              <input
                type="checkbox"
                required
                checked={agreeToTerms}
                onChange={e => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700"
              />
              <span>
                أقر وأوافق على كافة بنود ومواصفات العقد الإلكتروني وجدول الدفعات المعتمد، وأعتبر هذا التوقيع ملزماً نظامياً.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-xl font-black text-xs hover:bg-[#122116] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C5B198]" />
                  <span>جاري توثيق العقد والمصادقة...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-[#C5B198]" />
                  <span>توقيع العقد وتدشين المشروع رسمياً</span>
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
