import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Plus, Trash2, Loader2, DollarSign, Calendar, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [clientId, setClientId] = useState(selectedClientId || (clients[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [licenseNumber, setLicenseNumber] = useState(`BL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [initialProgress, setInitialProgress] = useState(0);
  const [totalCost, setTotalCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic installments list configured by the supervisor
  const [installments, setInstallments] = useState<CustomInstallmentInput[]>([
    {
      id: `INST-1`,
      title: 'الدفعة الأولى: توقيع العقد وأعمال الحفر والأساسات',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0]
    },
    {
      id: `INST-2`,
      title: 'الدفعة الثانية: صب الأعمدة والأسقف والميد',
      amount: '',
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: `INST-3`,
      title: 'الدفعة الثالثة: أعمال المباني والعوازل والتأسيسات',
      amount: '',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
      id: `INST-4`,
      title: 'الدفعة الرابعة: التشطيبات النهائية والاستلام الابتدائي',
      amount: '',
      dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ]);

  // Helper to add a new installment row
  const handleAddInstallmentRow = () => {
    const nextIdx = installments.length + 1;
    setInstallments([
      ...installments,
      {
        id: `INST-${Date.now().toString().slice(-4)}`,
        title: `الدفعة ${nextIdx}: مرحلة جديدة`,
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

  // Auto distribute total cost evenly among installments if supervisor wants
  const handleDistributeEvenly = () => {
    const totalNum = parseFloat(totalCost.replace(/[^0-9.]/g, '')) || 0;
    if (totalNum <= 0 || installments.length === 0) return;
    const splitAmount = Math.round(totalNum / installments.length);
    const updated = installments.map(inst => ({
      ...inst,
      amount: splitAmount.toString()
    }));
    setInstallments(updated);
    onRequestToast('تم توزيع إجمالي قيمة العقد بالتساوي على الدفعات');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !clientId) {
      onRequestToast('يرجى تعبئة كافة الحقول المطلوبة واختيار العميل');
      return;
    }

    if (!totalCost.trim()) {
      onRequestToast('يرجى إدخال إجمالي قيمة العقد');
      return;
    }

    // Verify installments are entered
    const hasEmptyInstallment = installments.some(i => !i.title.trim() || !i.amount.toString().trim());
    if (hasEmptyInstallment) {
      onRequestToast('يرجى كتابة عنوان وسعر كل دفعة من الدفعات المحددة');
      return;
    }

    setIsSubmitting(true);
    const costNum = parseFloat(totalCost.replace(/[^0-9.]/g, '')) || 0;

    // Convert custom inputs into structured installments with mandatory client approval requirement
    const finalInstallments: Installment[] = installments.map((inst, index) => {
      const num = parseFloat(inst.amount.replace(/[^0-9.]/g, '')) || 0;
      return {
        id: inst.id || `INST-${index + 1}`,
        title: inst.title.trim(),
        amount: `${num.toLocaleString('ar-SA')} ر.س`,
        amountNumber: num,
        dueDate: inst.dueDate || new Date(Date.now() + (index * 30 + 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        clientApprovalStatus: 'pending' // Requires client approval before or during payment
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
        { id: 'PH-5', title: 'التأسيسات الكهروميكانيكية (سباكة وكهرباء)', progress: initialProgress > 90 ? 100 : 0, status: initialProgress > 90 ? 'مكتمل' : 'قيد الانتظار' },
        { id: 'PH-6', title: 'اللياسة والدهانات والتشطيبات النهائية', progress: initialProgress === 100 ? 100 : 0, status: initialProgress === 100 ? 'مكتمل' : 'قيد الانتظار' }
      ],
      contracts: [
        {
          id: `CNT-${Date.now().toString().slice(-4)}`,
          title: 'عقد تنفيذ وإنشاء الهيكل الإنشائي والتشطيب المعتمد',
          contractNumber: `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          signDate: new Date().toLocaleDateString('ar-SA'),
          totalValue: `${costNum.toLocaleString('ar-SA')} ر.س`,
          status: 'ساري وموثق',
          termsSummary: [
            'الالتزام التام بكود البناء السعودي الصادر عن وزارة الشؤون البلدية والقروية والإسكان.',
            'ضمان هيكل إنشائي لمدة 10 سنوات وضمان عوازل مائية وحرارية لمدة 10 سنوات.',
            'إشراف هندسي مستمر وتوثيق مراحل الصب واختبارات الخرسانة المعتمدة.',
            'تخضع كافة الدفعات المالية لموافقة واعتماد العميل المسبقة في حسابه.'
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
      onRequestToast('تم إنشاء المشروع وتحديد جدول الدفعات مع طلب موافقة العميل بنجاح!');
      onClose();
    } catch (err) {
      console.error(err);
      onRequestToast('حدث خطأ أثناء إنشاء المشروع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-[#E8E2D8] text-[#192A1D] space-y-4 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1C3022] text-[#C5B198] flex items-center justify-center font-black">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#1C3022]">إضافة مشروع جديد لعميل</h3>
              <p className="text-[10px] text-slate-500 font-bold">تحديد بنود المشروع وجدول الدفعات المخصصة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Client Select */}
          <div>
            <label className="block text-xs font-black text-[#1C3022] mb-1">تعيين المشروع للعميل *</label>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">اسم المشروع *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="اسم المشروع"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">الموقع والحي *</label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="الموقع والمدينة"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
              />
            </div>
          </div>

          {/* 3. Total Cost & Initial Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">إجمالي قيمة العقد (ر.س) *</label>
              <input
                type="number"
                required
                placeholder="0"
                value={totalCost}
                onChange={e => setTotalCost(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#1C3022] mb-1">نسبة الإنجاز المبدئية (%)</label>
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

          {/* 4. CUSTOM INSTALLMENTS CONFIGURATION SECTION */}
          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-[#1C3022] flex items-center gap-1.5">
                  <span>جدول الدفعات وموافقة العميل</span>
                  <span className="text-[10px] bg-[#EFE7DC] text-[#1C3022] px-2 py-0.5 rounded-md font-bold">
                    {installments.length} دفعات
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  حدد عدد الدفعات وسعر وتاريخ كل دفعة (تتطلب موافقة العميل)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {totalCost && parseFloat(totalCost) > 0 && (
                  <button
                    type="button"
                    onClick={handleDistributeEvenly}
                    className="text-[10px] bg-white hover:bg-[#EFE7DC] text-[#1C3022] font-black py-1.5 px-2.5 rounded-lg border border-[#E8E2D8] transition-all"
                  >
                    توزيع بالتساوي
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddInstallmentRow}
                  className="text-[10px] bg-[#1C3022] text-[#F8F5F0] font-black py-1.5 px-2.5 rounded-lg flex items-center gap-1 hover:bg-[#122116] transition-all"
                >
                  <Plus className="w-3 h-3 text-[#C5B198]" />
                  <span>إضافة دفعة</span>
                </button>
              </div>
            </div>

            {/* Installments Table / List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {installments.map((inst, index) => (
                <div 
                  key={inst.id || index}
                  className="bg-white p-3 rounded-xl border border-[#E8E2D8] shadow-sm space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black bg-[#FAF7F2] text-[#1C3022] px-2 py-0.5 rounded-md shrink-0">
                      الدفعة {index + 1}
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="عنوان ووصف الدفعة"
                      value={inst.title}
                      onChange={e => handleUpdateInstallmentRow(index, 'title', e.target.value)}
                      className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2 py-1 text-xs font-bold text-[#1C3022] outline-none"
                    />
                    {installments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteInstallmentRow(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف هذه الدفعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">مبلغ الدفعة (ر.س) *</label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={inst.amount}
                        onChange={e => handleUpdateInstallmentRow(index, 'amount', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2.5 py-1.5 text-xs font-black text-[#1C3022] outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">تاريخ الاستحقاق</label>
                      <input
                        type="date"
                        required
                        value={inst.dueDate}
                        onChange={e => handleUpdateInstallmentRow(index, 'dueDate', e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1C3022] outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sum comparison & Client Approval Note */}
            <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">مجموع مبالغ الدفعات:</span>
              <span className="text-[#1C3022] font-black">
                {totalInstallmentsSum.toLocaleString('ar-SA')} ر.س
              </span>
            </div>

            <div className="p-2.5 bg-[#EFE7DC]/60 rounded-xl border border-[#C5B198]/40 flex items-center gap-2 text-[11px] text-[#1C3022] font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>يتم إرسال هذا الجدول لحساب العميل ليقوم بمراجعة واعتماد كل دفعة رسمياً.</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5B198]" />
                <span>جاري إنشاء المشروع وتثبيت الدفعات...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#C5B198]" />
                <span>تأكيد إنشاء المشروع وإرسال جدول الدفعات للعميل</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
