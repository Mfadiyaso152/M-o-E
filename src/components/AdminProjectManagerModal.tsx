import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sliders,
  CheckCircle2,
  Percent,
  Wallet,
  HardHat,
  Calendar,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Check,
  Clock,
  Building2,
  MapPin,
  FileText,
  User,
  Phone,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Project, ConstructionPhase, Installment, EngineerRequest, ProjectStatus, getInstallmentOverdueStatus } from '../types';

interface Props {
  project: Project;
  clientName?: string;
  onClose: () => void;
  onSave: (updatedProject: Project) => Promise<void>;
  onRequestToast: (msg: string) => void;
}

type TabType = 'progress' | 'phases' | 'installments' | 'images' | 'requests' | 'info';

export function AdminProjectManagerModal({
  project,
  clientName,
  onClose,
  onSave,
  onRequestToast
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [isSaving, setIsSaving] = useState(false);

  // Editable Project State
  const [title, setTitle] = useState(project.title);
  const [location, setLocation] = useState(project.location);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [progress, setProgress] = useState<number>(project.progress);
  const [phases, setPhases] = useState<ConstructionPhase[]>(project.phases || []);
  const [installments, setInstallments] = useState<Installment[]>(project.installments || []);
  const [engineerRequests, setEngineerRequests] = useState<EngineerRequest[]>(project.engineerRequests || []);
  const [images, setImages] = useState(project.images || { before: [], progress50: [], after: [], plans: [] });

  // New Installment Form
  const [newInstallmentTitle, setNewInstallmentTitle] = useState('');
  const [newInstallmentAmount, setNewInstallmentAmount] = useState('');
  const [newInstallmentDueDate, setNewInstallmentDueDate] = useState('');

  // New Phase Form
  const [newPhaseTitle, setNewPhaseTitle] = useState('');

  // New Image Form
  const [imageCategory, setImageCategory] = useState<'before' | 'progress50' | 'after' | 'plans'>('progress50');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Engineer Reply
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Calculate Payment Stats
  const totalAmountNumber = installments.reduce((sum, inst) => sum + (inst.amountNumber || 0), 0);
  const paidAmountNumber = installments.filter(i => i.status === 'paid').reduce((sum, inst) => sum + (inst.amountNumber || 0), 0);
  const paidCount = installments.filter(i => i.status === 'paid').length;
  const paymentPercentage = installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0;

  // Auto calculate total progress based on phases if requested
  const calculateProgressFromPhases = () => {
    if (phases.length === 0) return;
    const avg = Math.round(phases.reduce((sum, p) => sum + p.progress, 0) / phases.length);
    setProgress(avg);
    onRequestToast(`تم حساب متوسط نسبة الإنجاز تلقائياً: ${avg}%`);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const updated: Project = {
      ...project,
      title,
      location,
      status,
      progress,
      phases,
      installments,
      engineerRequests,
      images
    };

    try {
      await onSave(updated);
      onRequestToast('تم حفظ تحديثات المشروع في السحابة بنجاح!');
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      onRequestToast('حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePhase = (index: number, updatedFields: Partial<ConstructionPhase>) => {
    const updatedPhases = [...phases];
    updatedPhases[index] = { ...updatedPhases[index], ...updatedFields };
    // Auto update status if 100%
    if (updatedFields.progress !== undefined) {
      if (updatedFields.progress === 100) {
        updatedPhases[index].status = 'مكتمل';
      } else if (updatedFields.progress > 0) {
        updatedPhases[index].status = 'جاري العمل';
      }
    }
    setPhases(updatedPhases);
  };

  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseTitle.trim()) return;
    const newPhase: ConstructionPhase = {
      id: `PH-${Date.now().toString().slice(-4)}`,
      title: newPhaseTitle.trim(),
      progress: 0,
      status: 'قيد الانتظار'
    };
    setPhases([...phases, newPhase]);
    setNewPhaseTitle('');
  };

  const handleDeletePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  const handleToggleInstallmentStatus = (index: number) => {
    const updated = [...installments];
    const current = updated[index];
    if (current.status === 'paid') {
      current.status = 'pending';
      current.paymentDate = undefined;
      current.transactionRef = undefined;
    } else {
      current.status = 'paid';
      current.paymentDate = new Date().toISOString().split('T')[0];
      current.transactionRef = `TXN-ADM-${Date.now().toString().slice(-6)}`;
      current.paymentMethod = 'بطاقة مدى';
    }
    setInstallments(updated);
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstallmentTitle.trim() || !newInstallmentAmount.trim()) return;
    const num = parseFloat(newInstallmentAmount.replace(/[^0-9.]/g, '')) || 0;
    const newInst: Installment = {
      id: `INST-${Date.now().toString().slice(-4)}`,
      title: newInstallmentTitle.trim(),
      amount: `${Number(num).toLocaleString('ar-SA')} ر.س`,
      amountNumber: num,
      dueDate: newInstallmentDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending'
    };
    setInstallments([...installments, newInst]);
    setNewInstallmentTitle('');
    setNewInstallmentAmount('');
    setNewInstallmentDueDate('');
  };

  const handleDeleteInstallment = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setImages({
      ...images,
      [imageCategory]: [...(images[imageCategory] || []), newImageUrl.trim()]
    });
    setNewImageUrl('');
  };

  const handleDeleteImage = (category: keyof typeof images, imgIndex: number) => {
    setImages({
      ...images,
      [category]: images[category].filter((_, idx) => idx !== imgIndex)
    });
  };

  const handleSendReply = (requestId: string) => {
    if (!replyText.trim()) return;
    setEngineerRequests(engineerRequests.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'تمت الموافقة والرد',
          engineerReply: replyText.trim()
        };
      }
      return r;
    }));
    setActiveReplyId(null);
    setReplyText('');
    onRequestToast('تم تسجيل رد المهندس المشرف بنجاح');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border-t sm:border border-[#C5B198]/40 max-h-[94vh] flex flex-col text-[#192A1D]"
      >
        {/* Handlebar for mobile */}
        <div className="w-12 h-1.5 bg-[#E8E2D8] rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#1C3022] text-[#C5B198] flex items-center justify-center font-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                  لوحة تحكم المشرف
                </span>
                {clientName && (
                  <span className="text-[10px] font-bold text-slate-500">
                    العميل: {clientName}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-[#1C3022] truncate max-w-[240px] sm:max-w-xs">{title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-slate-500 hover:text-[#1C3022] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 p-1 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] my-3 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'progress', label: 'نسبة الإنجاز', icon: Percent },
            { id: 'phases', label: 'المراحل الإنشائية', icon: HardHat },
            { id: 'installments', label: 'الدفعات المالية', icon: Wallet },
            { id: 'images', label: 'صور الموقع', icon: ImageIcon },
            { id: 'requests', label: 'طلبات العميل', icon: MessageSquare },
            { id: 'info', label: 'البيانات', icon: Building2 },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex-1 justify-center ${
                  isActive
                    ? 'bg-[#1C3022] text-[#F8F5F0] shadow-sm'
                    : 'text-slate-500 hover:text-[#1C3022] hover:bg-[#EFE7DC]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C5B198]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs font-medium">

          {/* 1. OVERALL PROGRESS & STATUS TAB */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {/* Progress Slider Box */}
              <div className="bg-[#1C3022] text-[#F8F5F0] p-5 rounded-3xl border border-[#284430] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black text-[#C5B198]">نسبة إنجاز المشروع الإجمالية</span>
                    <h4 className="text-2xl font-black">{progress}%</h4>
                  </div>
                  <div className="px-3 py-1 bg-[#C5B198]/20 border border-[#C5B198]/30 rounded-xl text-[#C5B198] text-xs font-black">
                    {status}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#EFE7DC]/80 font-bold mb-1.5">
                    <span>اسحب لتعديل النسبة مباشرة:</span>
                    <span>{progress}% من 100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(parseInt(e.target.value))}
                    className="w-full h-2.5 bg-[#284430] rounded-lg appearance-none cursor-pointer accent-[#C5B198]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setProgress(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                        progress === val
                          ? 'bg-[#C5B198] text-[#1C3022]'
                          : 'bg-[#284430] text-[#EFE7DC] hover:bg-[#34573e]'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selector */}
              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] space-y-2">
                <label className="block text-xs font-black text-[#1C3022]">حالة المشروع الحالية</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['قيد الانتظار', 'بانتظار العقد', 'قيد التنفيذ', 'مكتمل'] as ProjectStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`p-2.5 rounded-xl text-xs font-black border transition-all text-center ${
                        status === st
                          ? 'bg-[#1C3022] text-[#F8F5F0] border-[#1C3022] shadow-sm'
                          : 'bg-white text-slate-700 border-[#E8E2D8] hover:bg-[#EFE7DC]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Calculate Button */}
              <button
                type="button"
                onClick={calculateProgressFromPhases}
                className="w-full bg-[#EFE7DC] hover:bg-[#e2d6c6] text-[#1C3022] py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 border border-[#C5B198]/50 transition-all"
              >
                <HardHat className="w-4 h-4 text-[#A99379]" />
                <span>حساب النسبة الإجمالية تلقائياً من متوسط المراحل</span>
              </button>
            </div>
          )}

          {/* 2. CONSTRUCTION PHASES TAB */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#1C3022]">مراحل البناء والتشييد ({phases.length})</h4>
                <button
                  type="button"
                  onClick={calculateProgressFromPhases}
                  className="text-[11px] font-black text-[#A99379] hover:underline"
                >
                  تحديث النسبة العامة
                </button>
              </div>

              {/* Add New Phase */}
              <form onSubmit={handleAddPhase} className="flex gap-2">
                <input
                  type="text"
                  placeholder="عنوان المرحلة الجديدة (مثال: صب أسقف الملحق)..."
                  value={newPhaseTitle}
                  onChange={e => setNewPhaseTitle(e.target.value)}
                  className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#1C3022] text-[#F8F5F0] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-[#122116]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Phases List */}
              <div className="space-y-3">
                {phases.map((phase, idx) => (
                  <div
                    key={phase.id || idx}
                    className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1C3022] text-[#C5B198] text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-black text-[#1C3022]">{phase.title}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={phase.status}
                          onChange={e => handleUpdatePhase(idx, { status: e.target.value as any })}
                          className="bg-white border border-[#E8E2D8] rounded-lg px-2 py-1 text-[10px] font-black text-[#1C3022] outline-none"
                        >
                          <option value="قيد الانتظار">قيد الانتظار</option>
                          <option value="جاري العمل">جاري العمل</option>
                          <option value="مكتمل">مكتمل</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeletePhase(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="حذف المرحلة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Phase Progress Slider */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>نسبة إنجاز المرحلة:</span>
                        <span className="text-[#1C3022] font-black">{phase.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={phase.progress}
                        onChange={e => handleUpdatePhase(idx, { progress: parseInt(e.target.value) })}
                        className="w-full h-2 bg-[#E8E2D8] rounded-lg appearance-none cursor-pointer accent-[#1C3022]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. INSTALLMENTS & PAYMENTS TAB */}
          {activeTab === 'installments' && (
            <div className="space-y-4">
              {/* Payment Summary Box */}
              <div className="bg-[#1C3022] text-[#F8F5F0] p-4 rounded-2xl border border-[#284430] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-[#C5B198] block">نسبة سداد الدفعات</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black">{paymentPercentage}%</span>
                    <span className="text-[10px] text-[#EFE7DC]/80 font-bold">({paidCount} من {installments.length} دفعات)</span>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-300 font-bold block">المسدد / الإجمالي:</span>
                  <span className="text-xs font-black text-[#C5B198]">
                    {paidAmountNumber.toLocaleString('ar-SA')} / {totalAmountNumber.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              {/* Add New Installment Form */}
              <form onSubmit={handleAddInstallment} className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D8] space-y-2.5">
                <h5 className="text-xs font-black text-[#1C3022] flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-[#A99379]" />
                  <span>إضافة دفعة مالية جديدة</span>
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="مسمى الدفعة (مثل: دفعة القواعد)..."
                    value={newInstallmentTitle}
                    onChange={e => setNewInstallmentTitle(e.target.value)}
                    className="col-span-2 bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                  />
                  <input
                    type="text"
                    placeholder="المبلغ (مثل: 50000)..."
                    value={newInstallmentAmount}
                    onChange={e => setNewInstallmentAmount(e.target.value)}
                    className="bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                    dir="ltr"
                  />
                  <input
                    type="date"
                    value={newInstallmentDueDate}
                    onChange={e => setNewInstallmentDueDate(e.target.value)}
                    className="bg-white border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#1C3022] text-[#F8F5F0] py-2 rounded-xl text-xs font-black hover:bg-[#122116]"
                >
                  إضافة الدفعة لجدول المشروع
                </button>
              </form>

              {/* Installments List */}
              <div className="space-y-2.5">
                {installments.map((inst, idx) => {
                  const overdue = getInstallmentOverdueStatus(inst);
                  return (
                    <div
                      key={inst.id || idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        inst.status === 'paid'
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : overdue.isOverdue7Days
                          ? 'bg-red-50/70 border-red-300 ring-1 ring-red-100'
                          : 'bg-white border-[#E8E2D8]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-black text-[#1C3022]">{inst.title}</h5>
                            {overdue.isOverdue7Days && (
                              <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                <span>تأخر +7 أيام</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                            تاريخ الاستحقاق: {inst.dueDate}
                          </span>
                          {inst.transactionRef && (
                            <span className="text-[9px] font-mono text-emerald-800 font-bold block">
                              سند: {inst.transactionRef}
                            </span>
                          )}
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black text-[#1C3022] block">{inst.amount}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-1 ${
                            inst.status === 'paid'
                              ? 'bg-emerald-200 text-emerald-900'
                              : overdue.isOverdue7Days
                              ? 'bg-red-100 text-red-900 border border-red-200'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {inst.status === 'paid' ? 'تم السداد' : overdue.isOverdue7Days ? `متأخرة (${overdue.daysOverdue} يوم)` : 'مستحقة'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleInstallmentStatus(idx)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all ${
                            inst.status === 'paid'
                              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              : 'bg-emerald-700 text-white hover:bg-emerald-800'
                          }`}
                        >
                          {inst.status === 'paid' ? (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>تغيير إلى بانتظار السداد</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>تسجيل كدفعة مسددة</span>
                            </>
                          )}
                        </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteInstallment(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف الدفعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

          {/* 4. IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {/* Category Selector */}
              <div className="flex gap-1.5 p-1 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
                {[
                  { id: 'before', label: 'قبل البدء' },
                  { id: 'progress50', label: 'مرحلة 50%' },
                  { id: 'after', label: 'بعد الإنجاز' },
                  { id: 'plans', label: 'المخططات' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setImageCategory(cat.id as any)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                      imageCategory === cat.id
                        ? 'bg-[#1C3022] text-[#F8F5F0]'
                        : 'text-slate-500 hover:text-[#1C3022]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Add Image URL */}
              <form onSubmit={handleAddImage} className="flex gap-2">
                <input
                  type="url"
                  placeholder="رابط الصورة الميدانية (URL)..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="bg-[#1C3022] text-[#F8F5F0] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 hover:bg-[#122116]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Images Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {images[imageCategory]?.length > 0 ? (
                  images[imageCategory].map((url, idx) => (
                    <div key={idx} className="h-32 rounded-2xl overflow-hidden border border-[#E8E2D8] relative group bg-slate-100">
                      <img src={url} alt="موقع المشروع" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(imageCategory, idx)}
                        className="absolute top-2 left-2 bg-red-600/90 text-white p-1.5 rounded-xl hover:bg-red-700 shadow-md"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400 font-bold bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8E2D8]">
                    لا توجد صور مضافة لهذا القسم بعد
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. ENGINEER REQUESTS & REPLIES TAB */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#1C3022]">طلبات المعاينة والاستفسارات من العميل ({engineerRequests.length})</h4>

              {engineerRequests.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
                  لا توجد طلبات واردة من العميل لهذا المشروع
                </div>
              ) : (
                engineerRequests.map(req => (
                  <div key={req.id} className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-[#A99379]">{req.type}</span>
                        <p className="text-xs font-bold text-[#1C3022] mt-0.5">{req.details}</p>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">بتاريخ: {req.date}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        req.status === 'تمت الموافقة والرد' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {req.engineerReply && (
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-[11px] text-slate-700">
                        <span className="font-black text-emerald-800 block text-[10px]">رد المهندس المشرف:</span>
                        {req.engineerReply}
                      </div>
                    )}

                    {activeReplyId === req.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          placeholder="اكتب ردك المعتمد كمهندس مشرف..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          className="w-full bg-white border border-[#E8E2D8] rounded-xl p-2 text-xs font-bold text-[#1C3022] outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendReply(req.id)}
                            className="bg-[#1C3022] text-[#F8F5F0] px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1"
                          >
                            <Send className="w-3 h-3 text-[#C5B198]" />
                            <span>إرسال الرد</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveReplyId(null)}
                            className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setActiveReplyId(req.id); setReplyText(req.engineerReply || ''); }}
                        className="text-[11px] font-black text-[#A99379] hover:underline block pt-1"
                      >
                        {req.engineerReply ? 'تعديل الرد' : '+ كتابة رد المهندس المشرف'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 6. GENERAL INFO TAB */}
          {activeTab === 'info' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">اسم المشروع</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-2.5 text-xs font-bold text-[#1C3022] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">الموقع والمدينة</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-2.5 text-xs font-bold text-[#1C3022] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8]">
                <div>
                  <span className="text-slate-400 font-bold block">رقم الترخيص</span>
                  <span className="font-black text-[#1C3022]">{project.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">المساحة المبنية</span>
                  <span className="font-black text-[#1C3022]">{project.builtUpArea}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Save to Cloud */}
        <div className="pt-3.5 border-t border-[#F0EBE1] flex gap-2 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="flex-1 bg-[#1C3022] text-[#F8F5F0] py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-[#122116] shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5B198]" />
                <span>جاري الحفظ في السحابة...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#C5B198]" />
                <span>حفظ التعديلات واعتمادها فوراً للعميل</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-[#FAF7F2] text-slate-700 border border-[#E8E2D8] rounded-2xl text-xs font-black hover:bg-[#EFE7DC] transition-all"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
