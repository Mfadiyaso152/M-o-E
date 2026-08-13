import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Building2, Plus, User, MapPin, HardHat, Loader2 } from 'lucide-react';
import { User as UserType, Project } from '../types';
import { ProjectService } from '../services/dbService';

interface Props {
  clients: UserType[];
  selectedClientId?: string;
  onClose: () => void;
  onProjectCreated: (project: Project) => void;
  onRequestToast: (msg: string) => void;
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
  const [landArea, setLandArea] = useState('450 م²');
  const [builtUpArea, setBuiltUpArea] = useState('650 م²');
  const [licenseNumber, setLicenseNumber] = useState(`BL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [initialProgress, setInitialProgress] = useState(0);
  const [totalCost, setTotalCost] = useState('480000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !clientId) {
      onRequestToast('يرجى تعبئة كافة الحقول المطلوبة واختيار العميل');
      return;
    }

    setIsSubmitting(true);
    const costNum = parseFloat(totalCost) || 480000;
    const inst1 = costNum * 0.25;
    const inst2 = costNum * 0.35;
    const inst3 = costNum * 0.25;
    const inst4 = costNum * 0.15;

    const newProjectData: any = {
      clientId,
      title: title.trim(),
      location: location.trim(),
      landArea: landArea.trim(),
      builtUpArea: builtUpArea.trim(),
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
            'إشراف هندسي مستمر وتوثيق مراحل الصب واختبارات الخرسانة المعتمدة.'
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
      installments: [
        {
          id: `INST-1`,
          title: 'الدفعة الأولى: توقيع العقد وأعمال الحفر والأساسات',
          amount: `${inst1.toLocaleString('ar-SA')} ر.س`,
          amountNumber: inst1,
          dueDate: new Date().toISOString().split('T')[0],
          status: initialProgress > 0 ? 'paid' : 'pending',
          paymentDate: initialProgress > 0 ? new Date().toISOString().split('T')[0] : undefined,
          transactionRef: initialProgress > 0 ? `TXN-ADM-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
          paymentMethod: 'بطاقة مدى'
        },
        {
          id: `INST-2`,
          title: 'الدفعة الثانية: صب الأعمدة والأسقف والميد',
          amount: `${inst2.toLocaleString('ar-SA')} ر.س`,
          amountNumber: inst2,
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        },
        {
          id: `INST-3`,
          title: 'الدفعة الثالثة: أعمال المباني والعوازل والتأسيسات',
          amount: `${inst3.toLocaleString('ar-SA')} ر.س`,
          amountNumber: inst3,
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        },
        {
          id: `INST-4`,
          title: 'الدفعة الرابعة: التشطيبات النهائية والاستلام الابتدائي',
          amount: `${inst4.toLocaleString('ar-SA')} ر.س`,
          amountNumber: inst4,
          dueDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        }
      ]
    };

    try {
      const created = await ProjectService.createNewProject(newProjectData);
      onProjectCreated(created);
      onRequestToast('تم إنشاء المشروع وإضافته للعميل في السحابة بنجاح!');
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
        className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl border border-[#E8E2D8] text-[#192A1D] space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center pb-3 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1C3022] text-[#C5B198] flex items-center justify-center font-black">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-[#1C3022]">إضافة مشروع جديد لعميل</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-black text-[#1C3022] mb-1">تعيين المشروع للعميل</label>
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

          <div>
            <label className="block text-xs font-black text-[#1C3022] mb-1">اسم المشروع / الفيلا</label>
            <input
              type="text"
              required
              placeholder="مثال: فيلا الياسمين الحديثة"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#1C3022] mb-1">الموقع والحي</label>
            <input
              type="text"
              required
              placeholder="مثال: الرياض - حي النرجس"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#1C3022] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">مساحة الأرض</label>
              <input
                type="text"
                value={landArea}
                onChange={e => setLandArea(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">المساحة المبنية</label>
              <input
                type="text"
                value={builtUpArea}
                onChange={e => setBuiltUpArea(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">إجمالي قيمة العقد (ر.س)</label>
              <input
                type="number"
                value={totalCost}
                onChange={e => setTotalCost(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">نسبة الإنجاز المبدئية (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={initialProgress}
                onChange={e => setInitialProgress(parseInt(e.target.value) || 0)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1C3022] text-[#F8F5F0] py-3 rounded-xl font-black text-xs hover:bg-[#122116] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5B198]" />
                <span>جاري إنشاء المشروع...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#C5B198]" />
                <span>تأكيد إنشاء المشروع وإدراجه للعميل</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
