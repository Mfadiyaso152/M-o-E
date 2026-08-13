import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  HardHat,
  Wallet,
  Plus,
  Search,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  Percent,
  Check,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CreditCard,
  BellRing,
  Send,
  AlertTriangle
} from 'lucide-react';
import { User, Project, QuoteRequest, ProjectStatus, Installment, getInstallmentOverdueStatus } from '../types';
import { ProjectService } from '../services/dbService';

// -------------------------------------------------------------
// 1. SUPERVISOR HOME VIEW: "العملاء" (Clients & Overview)
// -------------------------------------------------------------
interface SupervisorClientsViewProps {
  user: User;
  clients: User[];
  projects: Project[];
  quotes: QuoteRequest[];
  onSelectClientForProjects: (clientId: string) => void;
  onCreateProjectForClient: (clientId: string) => void;
  onRefreshQuotes: () => void;
  onRequestToast: (msg: string) => void;
}

export function SupervisorClientsView({
  user,
  clients,
  projects,
  quotes,
  onSelectClientForProjects,
  onCreateProjectForClient,
  onRefreshQuotes,
  onRequestToast
}: SupervisorClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'quotes'>('clients');

  // Filter clients
  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleUpdateQuoteStatus = async (quote: QuoteRequest, newStatus: any) => {
    const updated: QuoteRequest = { ...quote, status: newStatus };
    try {
      await ProjectService.saveQuoteRequest(updated);
      onRefreshQuotes();
      onRequestToast(`تم تحديث حالة طلب دراسة المشروع إلى: ${newStatus}`);
    } catch (err) {
      console.error(err);
      onRequestToast('حدث خطأ أثناء تحديث الطلب');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-[#1C3022]">دليل العملاء والطلبات</h3>
          <p className="text-xs text-slate-500 font-bold">إدارة حسابات العملاء ومتابعة طلبات عروض الأسعار</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[#E8E2D8] px-3.5 py-2 rounded-2xl text-xs font-black text-[#1C3022] shadow-sm">
          <Users className="w-4 h-4 text-[#A99379]" />
          <span>{clients.length} عملاء</span>
        </div>
      </div>

      {/* View Selector Tabs: Clients vs Quotes */}
      <div className="flex gap-1.5 p-1 bg-white rounded-2xl border border-[#E8E2D8] shadow-sm">
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'clients'
              ? 'bg-[#1C3022] text-[#F8F5F0] shadow-sm'
              : 'text-slate-500 hover:text-[#1C3022]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>دليل العملاء ({clients.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'quotes'
              ? 'bg-[#1C3022] text-[#F8F5F0] shadow-sm'
              : 'text-slate-500 hover:text-[#1C3022]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>طلبات العروض والدراسات ({quotes.length})</span>
        </button>
      </div>

      {/* CLIENTS DIRECTORY */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              placeholder="بحث عن عميل بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E8E2D8] rounded-2xl pr-10 pl-4 py-3 text-xs font-bold text-[#1C3022] outline-none shadow-sm focus:ring-2 focus:ring-[#C5B198]"
            />
          </div>

          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-black text-[#1C3022]">لم يتم العثور على عملاء</h4>
              <p className="text-[11px] text-slate-400">سيظهر العملاء هنا تلقائياً عند تسجيلهم بحسابات Google</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map(client => {
                const clientProjects = projects.filter(p => p.clientId === client.id);
                const hasOverduePayment = clientProjects.some(p => 
                  p.installments?.some(i => getInstallmentOverdueStatus(i).isOverdue7Days)
                );

                return (
                  <div
                    key={client.id}
                    className={`bg-white rounded-3xl p-4 border shadow-sm hover:shadow-md transition-all space-y-3 ${
                      hasOverduePayment ? 'border-red-300 ring-1 ring-red-100' : 'border-[#E8E2D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#EFE7DC] border border-[#C5B198]/40 flex items-center justify-center text-[#1C3022] overflow-hidden shrink-0">
                          {client.photoURL ? (
                            <img src={client.photoURL} alt={client.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="font-black text-sm text-[#1C3022]">{client.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-[#1C3022]">{client.name}</h4>
                            {client.email?.toLowerCase() === 'mfb.15.f@gmail.com' && (
                              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-black">
                                المشرف العام
                              </span>
                            )}
                            {hasOverduePayment && (
                              <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                <span>دفعة متأخرة +7 أيام</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold" dir="ltr">
                            {client.email || client.phone || 'حساب Google'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-black bg-[#FAF7F2] border border-[#E8E2D8] text-[#1C3022] px-2.5 py-1 rounded-xl">
                        {clientProjects.length} مشاريع
                      </span>
                    </div>

                    {/* Action buttons for this client */}
                    <div className="pt-2 border-t border-[#F0EBE1] flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectClientForProjects(client.id)}
                        className="flex-1 bg-[#FAF7F2] hover:bg-[#EFE7DC] text-[#1C3022] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-[#E8E2D8] transition-all"
                      >
                        <HardHat className="w-3.5 h-3.5 text-[#A99379]" />
                        <span>مشاريع العميل ({clientProjects.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onCreateProjectForClient(client.id)}
                        className="bg-[#1C3022] text-[#F8F5F0] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1 hover:bg-[#122116] transition-all"
                        title="إضافة مشروع للعميل"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C5B198]" />
                        <span>+ مشروع</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUOTE REQUESTS MANAGEMENT */}
      {activeTab === 'quotes' && (
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-black text-[#1C3022]">لا توجد طلبات عروض أسعار جديدة</h4>
              <p className="text-[11px] text-slate-400">أي طلب يقدمه العميل لدراسة مشروع جديد سيظهر هنا للمشرف</p>
            </div>
          ) : (
            quotes.map(quote => (
              <div key={quote.id} className="bg-white rounded-3xl p-4 border border-[#E8E2D8] shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-[#A99379]">طلب رقم: {quote.id}</span>
                    <h4 className="text-xs font-black text-[#1C3022] mt-0.5">{quote.projectName}</h4>
                    <p className="text-[11px] text-slate-600 mt-1">{quote.description}</p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">العميل: {quote.clientName} | {quote.date}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                    quote.status === 'طلب جديد' ? 'bg-amber-100 text-amber-900' :
                    quote.status === 'تم إرسال العرض' ? 'bg-blue-100 text-blue-900' :
                    quote.status === 'مقبول' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {quote.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-500">تحديث الحالة:</span>
                    <select
                      value={quote.status}
                      onChange={e => handleUpdateQuoteStatus(quote, e.target.value)}
                      className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-2 py-1 text-[11px] font-bold text-[#1C3022] outline-none"
                    >
                      <option value="طلب جديد">طلب جديد</option>
                      <option value="تم إرسال العرض">تم إرسال العرض</option>
                      <option value="مقبول">مقبول</option>
                      <option value="تم توقيع العقد">تم توقيع العقد</option>
                      <option value="مرفوض">مرفوض</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateProjectForClient(quote.clientId)}
                    className="bg-[#1C3022] text-[#F8F5F0] px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-[#122116] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-[#C5B198]" />
                    <span>تحويل لمشروع</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 2. SUPERVISOR PROJECTS VIEW: "المشاريع" (All Projects & Manage Buttons)
// -------------------------------------------------------------
interface SupervisorProjectsViewProps {
  projects: Project[];
  clients: User[];
  onManageProject: (project: Project) => void;
  onPreviewProject: (project: Project) => void;
  onCreateNewProject: () => void;
  selectedClientFilter?: string;
  onClearClientFilter?: () => void;
}

export function SupervisorProjectsView({
  projects,
  clients,
  onManageProject,
  onPreviewProject,
  onCreateNewProject,
  selectedClientFilter,
  onClearClientFilter
}: SupervisorProjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects ONLY by search query and optional client filter (No status filter pills)
  const filteredProjects = projects.filter(p => {
    if (selectedClientFilter && p.clientId !== selectedClientFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const client = clients.find(c => c.id === p.clientId);
      return (
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        (client && client.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredClientObj = selectedClientFilter ? clients.find(c => c.id === selectedClientFilter) : null;

  return (
    <div className="space-y-5">
      {/* Header & Add Project Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-[#1C3022]">إدارة المشاريع العامة</h3>
          <p className="text-xs text-slate-500">تحديث نسب الإنجاز والمراحل لجميع العملاء</p>
        </div>
        <button
          onClick={onCreateNewProject}
          className="bg-[#1C3022] text-[#F8F5F0] px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 hover:bg-[#122116] shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 text-[#C5B198]" />
          <span>إضافة مشروع</span>
        </button>
      </div>

      {/* Active Client Filter Banner */}
      {filteredClientObj && (
        <div className="bg-[#EFE7DC] p-3 rounded-2xl border border-[#C5B198]/50 flex items-center justify-between text-xs font-bold text-[#1C3022]">
          <span>تصفية حسب العميل: {filteredClientObj.name}</span>
          <button
            onClick={onClearClientFilter}
            className="text-[11px] text-red-700 underline font-black"
          >
            عرض كافة المشاريع
          </button>
        </div>
      )}

      {/* Search Bar Only (Filter pills removed per user instruction) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        <input
          type="text"
          placeholder="بحث باسم المشروع، الموقع أو العميل..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[#E8E2D8] rounded-2xl pr-10 pl-4 py-3 text-xs font-bold text-[#1C3022] outline-none shadow-sm focus:ring-2 focus:ring-[#C5B198]"
        />
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] space-y-3">
          <HardHat className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-black text-sm text-[#1C3022]">لا توجد مشاريع مسجلة</h4>
          <p className="text-xs text-slate-500">يمكنك إنشاء مشروع جديد وتعيينه لأي عميل من زر الإضافة أعلاه.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map(project => {
            const client = clients.find(c => c.id === project.clientId);
            const totalInst = project.installments?.length || 0;
            const paidInst = project.installments?.filter(i => i.status === 'paid').length || 0;
            const payPercent = totalInst > 0 ? Math.round((paidInst / totalInst) * 100) : 0;
            const hasOverdue7Days = project.installments?.some(i => getInstallmentOverdueStatus(i).isOverdue7Days);

            return (
              <div
                key={project.id}
                className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                  hasOverdue7Days ? 'border-red-300 ring-1 ring-red-100' : 'border-[#E8E2D8]'
                }`}
              >
                {/* Top Info Banner */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-[#EFE7DC] text-[#1C3022] px-2 py-0.5 rounded-md">
                          كود: {project.id}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          العميل: {client?.name || 'عميل مسجل'}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-[#1C3022] mt-1">{project.title}</h4>
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#A99379]" /> {project.location}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                        project.status === 'مكتمل' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        project.status === 'قيد التنفيذ' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {project.status}
                      </span>
                      {hasOverdue7Days && (
                        <span className="text-[9px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                          تأخر سداد &gt; 7 أيام
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Metric Cards: Progress % & Payment % */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Project Progress */}
                    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500">نسبة اكتمال المشروع</span>
                        <span className="text-[#1C3022] font-black text-xs">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-l from-[#C5B198] to-[#1C3022] rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Payments Status */}
                    <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-slate-500">سداد الدفعات</span>
                        <span className="text-emerald-800 font-black text-xs">{payPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${payPercent}%` }}
                        ></div>
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold text-left">
                        {paidInst}/{totalInst} دفعات مسددة
                      </div>
                    </div>
                  </div>

                  {/* Primary Supervisor Action Button: إدارة وتعديل المشروع */}
                  <div className="pt-2 border-t border-[#F0EBE1] flex gap-2">
                    <button
                      type="button"
                      onClick={() => onManageProject(project)}
                      className="flex-1 bg-[#1C3022] text-[#F8F5F0] py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-[#122116] shadow-sm active:scale-[0.98] transition-all"
                    >
                      <Sliders className="w-4 h-4 text-[#C5B198]" />
                      <span>إدارة وتعديل المشروع</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPreviewProject(project)}
                      className="px-3.5 py-3 bg-[#FAF7F2] text-[#1C3022] rounded-xl text-xs font-black flex items-center justify-center gap-1 border border-[#E8E2D8] hover:bg-[#EFE7DC] transition-all"
                    >
                      <span>التفاصيل</span>
                      <ChevronLeft className="w-3.5 h-3.5 text-[#A99379]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3. SUPERVISOR PAYMENTS VIEW: "الدفعات" (Financial Overview & 7-Day Overdue Reminders)
// -------------------------------------------------------------
interface SupervisorPaymentsViewProps {
  projects: Project[];
  clients: User[];
  onManageProject: (project: Project) => void;
  onRequestToast: (msg: string) => void;
}

export function SupervisorPaymentsView({
  projects,
  clients,
  onManageProject,
  onRequestToast
}: SupervisorPaymentsViewProps) {
  const [selectedReminderTarget, setSelectedReminderTarget] = useState<{
    project: Project;
    installment: Installment;
    client?: User;
  } | null>(null);

  const allInstallments = projects.flatMap(p => 
    (p.installments || []).map(inst => ({
      project: p,
      installment: inst,
      client: clients.find(c => c.id === p.clientId)
    }))
  );

  const totalFinancial = allInstallments.reduce((sum, item) => sum + (item.installment.amountNumber || 0), 0);
  const paidFinancial = allInstallments.filter(item => item.installment.status === 'paid').reduce((sum, item) => sum + (item.installment.amountNumber || 0), 0);
  const pendingFinancial = totalFinancial - paidFinancial;
  const overdue7DaysList = allInstallments.filter(item => getInstallmentOverdueStatus(item.installment).isOverdue7Days);

  const handleSendReminder = (item: { project: Project; installment: Installment; client?: User }) => {
    const overdue = getInstallmentOverdueStatus(item.installment);
    const clientName = item.client?.name || 'العميل الكريم';
    const message = `السلام عليكم ورحمة الله وبركاته، ${clientName}، نود تذكيركم بسداد دفعة (${item.installment.title}) بمبلغ ${item.installment.amount} لمشروع (${item.project.title}) لدى شركة نماذج التميز، المستحقة في ${item.installment.dueDate} (تأخرت منذ ${overdue.daysOverdue} يوم). نرجو التكرم بالسداد عبر التطبيق لتجنب تعليق أعمال التنفيذ. شاكرين تعاونكم.`;

    if (item.client?.phone) {
      const cleanPhone = item.client.phone.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    } else {
      navigator.clipboard?.writeText(message);
    }

    onRequestToast(`تم إرسال تنبيه عدم السداد للعميل (${clientName}) بنجاح!`);
    setSelectedReminderTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-[#1C3022]">التحصيل والتدفقات المالية</h3>
          <p className="text-xs text-slate-500">إجمالي مستحقات ومسددات عقود المقاولات</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#EFE7DC] flex items-center justify-center text-[#1C3022]">
          <Wallet className="w-5 h-5 text-[#A99379]" />
        </div>
      </div>

      {/* 7-Day Overdue Warning Banner if any exist */}
      {overdue7DaysList.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-900 font-black text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>تنبيه: يوجد {overdue7DaysList.length} دفعات تجاوزت مهلة السداد (أكثر من 7 أيام)</span>
          </div>
          <p className="text-[11px] text-red-800 leading-relaxed font-medium">
            يُنصح بإرسال تنبيهات السداد الفورية للعملاء لضمان استمرار التدفقات المالية واستمرارية الجدول الزمني.
          </p>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#1C3022] text-[#F8F5F0] p-4 rounded-3xl border border-[#284430] space-y-1">
          <span className="text-[10px] font-black text-[#C5B198]">إجمالي المبالغ المحصلة</span>
          <h4 className="text-lg font-black">{paidFinancial.toLocaleString('ar-SA')} ر.س</h4>
          <span className="text-[9px] text-[#EFE7DC]/80 font-bold block">من أصل {totalFinancial.toLocaleString('ar-SA')} ر.س</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-[#E8E2D8] space-y-1 shadow-sm">
          <span className="text-[10px] font-black text-amber-700">المبالغ المتبقية</span>
          <h4 className="text-lg font-black text-[#1C3022]">{pendingFinancial.toLocaleString('ar-SA')} ر.س</h4>
          <span className="text-[9px] text-slate-400 font-bold block">{allInstallments.filter(i => i.installment.status === 'pending').length} دفعات بانتظار السداد</span>
        </div>
      </div>

      {/* Installments Table/List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#1C3022]">كافة الدفعات حسب المشاريع ({allInstallments.length})</h4>

        {allInstallments.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] text-xs text-slate-400 font-bold">
            لا توجد دفعات مسجلة في النظام
          </div>
        ) : (
          allInstallments.map((item, idx) => {
            const overdueInfo = getInstallmentOverdueStatus(item.installment);

            return (
              <div
                key={item.installment.id || idx}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  item.installment.status === 'paid'
                    ? 'bg-white border-[#E8E2D8]'
                    : overdueInfo.isOverdue7Days
                    ? 'bg-red-50/70 border-red-300 ring-1 ring-red-100'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#A99379]">
                      <span>مشروع: {item.project.title}</span>
                      <span>•</span>
                      <span>العميل: {item.client?.name || 'عميل'}</span>
                    </div>
                    <h5 className="text-xs font-black text-[#1C3022] mt-1">{item.installment.title}</h5>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                      الاستحقاق: {item.installment.dueDate}
                    </span>
                    {item.installment.transactionRef && (
                      <span className="text-[9px] font-mono text-emerald-800 block">
                        سند: {item.installment.transactionRef}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black text-[#1C3022] block">{item.installment.amount}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block mt-1 ${
                      item.installment.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : overdueInfo.isOverdue7Days
                        ? 'bg-red-100 text-red-900 border border-red-200'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {item.installment.status === 'paid'
                        ? 'مسددة'
                        : overdueInfo.isOverdue7Days
                        ? `متأخرة (${overdueInfo.daysOverdue} يوم)`
                        : 'مستحقة'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-bold">
                    {item.installment.paymentDate ? `تاريخ السداد: ${item.installment.paymentDate}` : 'لم يتم السداد بعد'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* 7-Day Overdue Reminder Trigger Button */}
                    {item.installment.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleSendReminder(item)}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all ${
                          overdueInfo.isOverdue7Days
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                        title="إرسال تنبيه بعدم السداد"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>{overdueInfo.isOverdue7Days ? 'إرسال تنبيه سداد (+7 أيام)' : 'تذكير بالدفعة'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onManageProject(item.project)}
                      className="text-xs font-black text-[#1C3022] bg-[#FAF7F2] border border-[#E8E2D8] px-2.5 py-1.5 rounded-xl hover:bg-[#EFE7DC]"
                    >
                      إدارة
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
