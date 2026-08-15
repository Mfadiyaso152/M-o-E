import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Building2, Plus, Trash2, Loader2, Wallet } from 'lucide-react';
import { User as UserType, Project, Installment } from '../types';
import { ProjectService } from '../services/dbService';

interface Props {
  clients: UserType[];
  selectedClientId?: string;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  onRequestToast: (msg: string) => void;
}

interface CustomInstallmentInput {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
}

export function CreateProjectModal({
  clients,
  selectedClientId,
  onClose,
  onProjectCreated,
  onRequestToast
}: Props) {
  // Prevent background scrolling
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [clientId, setClientId] = useState(selectedClientId || (clients[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [licenseNumber] = useState(`BL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [initialProgress, setInitialProgress] = useState(0);
  const [totalCost, setTotalCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single clean empty installment by default without predefined bloated installments
  const [installments, setInstallments] = useState<CustomInstallmentInput[]>([
    {
      id: `INST-1`,
      title: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0]
    }
  ]);

  // Helper to add a new installment row
  const handleAddInstallmentRow = () => {
    const nextIdx = installments.length + 1;
    setInstallments([
      ...installments,
      {
        id: `INST-${Date.now().toString().slice(-4)}`,
        title: '',
        amount: '',
        dueDate: new Date(Date.now() + (installments.length * 30 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);
  };

  // Helper to delete an installment row
  const handleDeleteInstallmentRow = (index: number) => {
    if (installments.length <= 1) {
      onRequestToast('يجب إبقاء دفعة واحدة على الأقل في المشروع');
      return;
    }
    setInstallments(installments.filter((_, i) => i !== index));
  };

  // Update specific installment row
  const handleUpdateInstallmentRow = (index: number, field: keyof CustomInstallmentInput, value: string) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], [field]: value };
    setInstallments(updated);
  };

  // Sum of installments
  const totalInstallmentsSum = installments.reduce((sum, inst) => {
    const num = parseFloat(inst.amount.replace(/[^0-9.]/g, '')) || 0;
    return sum + num;
  }, 0);

  // Auto distribute total cost evenly among installments
  const handleDistributeEvenly = () => {
    const totalNum = parseFloat(totalCost.replace(/[^0-9.]/g, '')) || 0;
    if (totalNum <= 0 || installments.length === 0) return;
    const splitAmount = Math.round(totalNum / installments.length);
    const updated = installments.map(inst => ({
      ...inst,
      amount: splitAmount.toString()
    }));
    setInstallments(updated);
    onRequestToast('تم توزيع المبلغ بالتساوي');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !clientId) {
      onRequestToast('يرجى تعبئة كافة الحقول');
      return;
    }

    if (!totalCost.trim()) {
      onRequestToast('يرجى إدخال قيمة العقد');
      return;
    }

    // Verify installments are entered
    const hasEmptyInstallment = installments.some(i => !i.title.trim() || !i.amount.toString().trim());
    if (hasEmptyInstallment) {
      onRequestToast('يرجى تعبئة بيانات الدفعات');
      return;
    }

    setIsSubmitting(true);
    const costNum = parseFloat(totalCost.replace(/[^0-9.]/g, '')) || 0;

    const finalInstallments: Installment[] = installments.map((inst, index) => {
      const num = parseFloat(inst.amount.replace(/[^0-9.]/g, '')) || 0;
      return {
        id: inst.id || `INST-${index + 1}`,
        title: inst.title.trim(),
        amount: `${num.toLocaleString('ar-SA')} ر.س`,
        amountNumber: num,
        dueDate: inst.dueDate || new Date(Date.now() + (index * 30 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        clientApprovalStatus: 'pending'
      };
    });

    const newProjectData: any = {
      clientId,
      title: title.trim(),
      location: location.trim(),
      landArea: '',
      builtUpArea: '',
      licenseNumber: licenseNumber.trim(),
      progress: initialProgress,
      status: initialProgress === 0 ? 'بانتظار العقد' : 'قيد التنفيذ',
      startDate: new Date().toISOString().split('T')[0],
      estimatedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supervisingEngineer: {
        name: 'م. فهد بن عبد العزيز السالم',
        phone: '0551239874',
        title: 'مهندس إنشائي ومشرف موقع معتمد'
      },
      phases: [
        { id: 'PH-1', title: 'أعمال الحفر والإحلال وصب النظافة', progress: initialProgress > 15 ? 100 : 0, status: initialProgress > 15 ? 'مكتمل' : 'قيد الانتظار' },
        { id: 'PH-2', title: 'القواعد والرقاب والميد الأرضية', progress: initialProgress > 30 ? 100 : 0, status: initialProgress > 30 ? 'مكتمل' : 'قيد الانتظار' },
        { id: 'PH-3', title: 'أعمدة وأسقف الدور الأرضي والأول', progress: initialProgress > 60 ? 100 : 0, status: initialProgress > 60 ? 'مكتمل' : 'قيد الانتظار' },
        { id: 'PH-4', title: 'أعمال المباني والعوازل المائية والحرارية', progress: initialProgress > 80 ? 100 : 0, status: initialProgress > 80 ? 'مكتمل' : 'قيد الانتظار' },
        { id: 'PH-5', title: 'التأسيسات الكهروميكانيكية', progress: initialProgress > 90 ? 100 : 0, status: initialProgress > 90 ? 'مكتمل' : 'قيد الانتظار' },
        { id: 'PH-6', title: 'التشطيبات النهائية والتسليم', progress: initialProgress === 100 ? 100 : 0, status: initialProgress === 100 ? 'مكتمل' : 'قيد الانتظار' }
      ],
      contracts: [
        {
          id: `CNT-${Date.now().toString().slice(-4)}`,
          title: 'عقد تنفيذ وإنشاء الهيكل الإنشائي والتشطيب',
          contractNumber: `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          signDate: new Date().toLocaleDateString('ar-SA'),
          totalValue: `${costNum.toLocaleString('ar-SA')} ر.س`,
          status: 'ساري وموثق',
          termsSummary: [
            'الالتزام بكود البناء السعودي.',
            'ضمان هيكل إنشائي وعوازل لمدة 10 سنوات.',
            'إشراف هندسي مستمر وتوثيق مراحل الإنجاز.'
          ]
        }
      ],
      engineerRequests: [],
      images: {
        before: ['https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?q=80&w=1200&auto=format&fit=crop'],
        progress50: ['https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?q=80&w=1200&auto=format&fit=crop'],
        after: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop'],
        plans: ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop']
      },
      installments: finalInstallments
    };

    try {
      const created = await ProjectService.createNewProject(newProjectData);
      onProjectCreated(created);
      onRequestToast('تم إنشاء المشروع بنجاح');
      onClose();
    } catch (err) {
      console.error(err);
      onRequestToast('حدث خطأ أثناء إنشاء المشروع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm touch-none" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#E8E2D8] text-[#192A1D] space-y-4 max-h-[88vh] overflow-y-auto overscroll-contain touch-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1C3022] text-[#C5B198] flex items-center justify-center font-black">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1C3022]">إضافة مشروع جديد</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Client Select */}
          <div>
            <label className="block text-xs font-black text-[#1C3022] mb-1">العميل</label>
            <select
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              required
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email || c.phone || c.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Project Title & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">اسم المشروع</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">الموقع</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
              />
            </div>
          </div>

          {/* 3. Total Cost & Initial Progress */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">قيمة العقد (ر.س)</label>
              <input
                type="number"
                required
                value={totalCost}
                onChange={e => setTotalCost(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">نسبة الإنجاز (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={initialProgress}
                onChange={e => setInitialProgress(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                dir="ltr"
              />
            </div>
          </div>

          {/* 4. SIMPLIFIED INSTALLMENTS INPUT */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#A99379]" />
                <span className="text-xs font-black text-[#1C3022]">الدفعات ({installments.length})</span>
              </div>

              <div className="flex items-center gap-1.5">
                {totalCost && parseFloat(totalCost) > 0 && (
                  <button
                    type="button"
                    onClick={handleDistributeEvenly}
                    className="text-[10px] bg-white hover:bg-[#EFE7DC] text-[#1C3022] font-black py-1 px-2 rounded-lg border border-[#E8E2D8] transition-all active:scale-95"
                  >
                    توزيع بالتساوي
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddInstallmentRow}
                  className="text-[10px] bg-[#1C3022] text-[#F8F5F0] font-black py-1 px-2 rounded-lg flex items-center gap-1 hover:bg-[#122116] transition-all active:scale-95"
                >
                  <Plus className="w-2.5 h-2.5 text-[#C5B198]" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>

            {/* Installments Rows */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
              {installments.map((inst, index) => (
                <div 
                  key={inst.id || index}
                  className="bg-white p-2.5 rounded-xl border border-[#E8E2D8] shadow-xs space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-[#FAF7F2] text-[#1C3022] px-1.5 py-0.5 rounded shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={inst.title}
                      onChange={e => handleUpdateInstallmentRow(index, 'title', e.target.value)}
                      className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2 py-1 text-xs font-bold text-[#1C3022] outline-none"
                    />
                    {installments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteInstallmentRow(index)}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        required
                        value={inst.amount}
                        onChange={e => handleUpdateInstallmentRow(index, 'amount', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2 py-1 text-xs font-bold text-[#1C3022] outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        required
                        value={inst.dueDate}
                        onChange={e => handleUpdateInstallmentRow(index, 'dueDate', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2 py-1 text-xs font-bold text-[#1C3022] outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total check */}
            <div className="pt-1 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>المجموع:</span>
              <span className="text-[#1C3022] font-black">
                {totalInstallmentsSum.toLocaleString('ar-SA')} ر.س
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1C3022] text-[#F8F5F0] py-3 rounded-xl font-black text-xs hover:bg-[#122116] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5B198]" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>إنشاء المشروع</span>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
