import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Percent, 
  Image as ImageIcon, 
  Send, 
  Building2, 
  UserCheck, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Maximize2,
  HardHat,
  FileCheck
} from 'lucide-react';
import { Project, EngineerRequest, ProjectContract, ConstructionPhase } from '../types';

interface Props {
  project: Project;
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  onRequestToast: (msg: string) => void;
}

type TabType = 'contracts' | 'progress' | 'gallery' | 'engineer' | 'details';

export function ProjectCustomizationModal({ project, onClose, onUpdateProject, onRequestToast }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  
  // Gallery stage selector
  const [galleryStage, setGalleryStage] = useState<'before' | 'progress50' | 'after' | 'plans'>('progress50');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Contract viewer modal
  const [selectedContract, setSelectedContract] = useState<ProjectContract | null>(null);

  // New engineer request state
  const [requestType, setRequestType] = useState<EngineerRequest['type']>('طلب معاينة موقعية');
  const [requestDetails, setRequestDetails] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDetails.trim()) return;

    setIsSubmittingRequest(true);
    setTimeout(() => {
      const newReq: EngineerRequest = {
        id: `REQ-${Date.now().toString().slice(-4)}`,
        type: requestType,
        details: requestDetails.trim(),
        date: new Date().toLocaleDateString('ar-SA'),
        status: 'تم الاستلام',
        engineerName: project.supervisingEngineer.name,
        engineerReply: 'تم استلام طلبك وجاري مراجعته من قبل المهندس المشرف، وسيتم الرد عليك خلال 24 ساعة.'
      };

      const updatedProject: Project = {
        ...project,
        engineerRequests: [newReq, ...project.engineerRequests]
      };

      onUpdateProject(updatedProject);
      setIsSubmittingRequest(false);
      setRequestDetails('');
      onRequestToast('تم إرسال الطلب للمهندس المشرف بنجاح وسيتواصل معك قريباً');
    }, 400);
  };

  const stageLabels = {
    before: 'قبل البدء',
    progress50: 'مرحلة 50%',
    after: 'بعد الإنجاز',
    plans: 'المخططات الهندسية'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border-t sm:border border-[#C5B198]/40 max-h-[92vh] flex flex-col text-[#192A1D]"
        dir="rtl"
      >
        {/* Modal Handlebar & Header */}
        <div className="w-12 h-1.5 bg-[#E8E2D8] rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>

        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFE7DC] border border-[#C5B198]/40 flex items-center justify-center text-[#1C3022]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#A99379] block">تخصيص وإدارة المشروع</span>
              <h3 className="text-base font-black text-[#1C3022] truncate max-w-[230px]">{project.title}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-slate-500 hover:text-[#1C3022] hover:bg-[#EFE7DC] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Core Feature Navigation Tabs */}
        <div className="flex gap-1.5 p-1.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] my-3.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'progress', label: 'تقدم المشروع (%)', icon: Percent },
            { id: 'contracts', label: 'جميع العقود', icon: FileText },
            { id: 'gallery', label: 'صور المشروع', icon: ImageIcon },
            { id: 'engineer', label: 'طلب للمهندس', icon: Send },
            { id: 'details', label: 'تفاصيل المشروع', icon: Building2 },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex-1 justify-center ${
                  isActive 
                    ? 'bg-[#1C3022] text-[#F8F5F0] shadow-sm' 
                    : 'text-slate-500 hover:text-[#1C3022] hover:bg-[#EFE7DC]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C5B198]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs font-medium">

          {/* 1. PROGRESS PERCENTAGE TAB */}
          {activeTab === 'progress' && (
            <div className="space-y-4">
              {/* Overall Progress Banner */}
              <div className="bg-[#1C3022] text-[#F8F5F0] p-5 rounded-3xl border border-[#284430] flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[11px] font-black text-[#C5B198]">مستوى الإنجاز التراكمي الإجمالي</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black">{project.progress}%</span>
                    <span className="text-xs text-[#EFE7DC]/80 font-bold">من كامل بنود العقد</span>
                  </div>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-[#C5B198]/20 text-[#C5B198] text-[10px] font-black border border-[#C5B198]/30">
                    الحالة: {project.status}
                  </span>
                </div>
                
                {/* Circular indicator */}
                <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="#2A4532" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke="#C5B198" 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={163.3} 
                      strokeDashoffset={163.3 - (163.3 * project.progress) / 100}
                      strokeLinecap="round" 
                    />
                  </svg>
                  <Percent className="w-5 h-5 text-[#C5B198] absolute" />
                </div>
              </div>

              {/* Phases Breakdown List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-[#1C3022] px-1 flex items-center justify-between">
                  <span>تفاصيل نسب الإنجاز حسب المراحل الإنشائية</span>
                  <span className="text-[10px] text-slate-400 font-bold">{project.phases.length} مراحل</span>
                </h4>

                {project.phases.map((phase, idx) => (
                  <div 
                    key={phase.id} 
                    className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] hover:border-[#C5B198] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EFE7DC] text-[#1C3022] text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-black text-[#1C3022]">{phase.title}</h5>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        phase.status === 'مكتمل' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : phase.status === 'جاري العمل' 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {phase.status} ({phase.progress}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          phase.progress === 100 
                            ? 'bg-emerald-600' 
                            : 'bg-gradient-to-l from-[#C5B198] to-[#1C3022]'
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      ></div>
                    </div>

                    {(phase.startDate || phase.endDate) && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-0.5">
                        <span>البدء: {phase.startDate || '-'}</span>
                        <span>الانتهاء: {phase.endDate || '-'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. CONTRACTS TAB */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#A99379]" />
                  <div>
                    <h4 className="text-xs font-black text-[#1C3022]">العقود والمستندات المعتمدة</h4>
                    <p className="text-[10px] text-slate-500">موثقة وفق اشتراطات منصة بلدي والكود السعودي</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#1C3022] text-[#C5B198] text-[10px] font-black rounded-xl">
                  {project.contracts.length} عقود
                </span>
              </div>

              <div className="space-y-3">
                {project.contracts.map(contract => (
                  <div 
                    key={contract.id}
                    className="p-4 bg-white rounded-2xl border border-[#E8E2D8] hover:border-[#C5B198] shadow-sm transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-[#A99379] block">رقم العقد: {contract.contractNumber}</span>
                        <h4 className="text-xs font-black text-[#1C3022] mt-0.5">{contract.title}</h4>
                      </div>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {contract.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#FAF7F2] p-2.5 rounded-xl border border-[#F0EBE1]">
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">تاريخ التوقيع</span>
                        <span className="font-black text-[#1C3022]">{contract.signDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[10px]">القيمة الإجمالية</span>
                        <span className="font-black text-[#1C3022]">{contract.totalValue}</span>
                      </div>
                    </div>

                    {/* Key Terms Summary */}
                    <div className="space-y-1 text-[10px] text-slate-600">
                      <span className="font-black text-[#1C3022] block">أبرز بنود العقد والضمانات:</span>
                      {contract.termsSummary.map((term, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#A99379] shrink-0 mt-0.5" />
                          <span>{term}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#F5EFE6] flex gap-2">
                      <button 
                        onClick={() => setSelectedContract(contract)}
                        className="flex-1 bg-[#1C3022] text-[#F8F5F0] py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 hover:bg-[#122116] transition-all"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#C5B198]" />
                        <span>معاينة العقد الرقمي الكامل</span>
                      </button>
                      <button 
                        onClick={() => onRequestToast(`تم تنزيل نسخة PDF من ${contract.title}`)}
                        className="px-3 py-2 bg-[#EFE7DC] text-[#1C3022] rounded-xl text-xs font-black flex items-center gap-1 hover:bg-[#e4dacb] transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-3.5">
              {/* Category selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(Object.keys(stageLabels) as Array<keyof typeof stageLabels>).map(key => {
                  const isActive = galleryStage === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setGalleryStage(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                        isActive 
                          ? 'bg-[#1C3022] text-[#F8F5F0]' 
                          : 'bg-[#FAF7F2] text-slate-500 border border-[#E8E2D8] hover:bg-[#EFE7DC]'
                      }`}
                    >
                      {stageLabels[key]}
                    </button>
                  );
                })}
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 gap-3">
                {project.images[galleryStage] && project.images[galleryStage].length > 0 ? (
                  project.images[galleryStage].map((url, i) => (
                    <div 
                      key={i} 
                      onClick={() => setPreviewImage(url)}
                      className="h-36 rounded-2xl overflow-hidden border border-[#E8E2D8] relative group cursor-pointer shadow-sm"
                    >
                      <img 
                        src={url} 
                        alt={`${project.title} - ${stageLabels[galleryStage]}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                        صورة {i + 1}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-10 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8E2D8] text-slate-400 text-xs font-bold">
                    لا توجد صور لهذه المرحلة حالياً
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SUBMIT ENGINEER REQUEST TAB */}
          {activeTab === 'engineer' && (
            <div className="space-y-4">
              {/* Engineer Contact Info Card */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1C3022] text-[#C5B198] flex items-center justify-center font-black">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-[#A99379] block">{project.supervisingEngineer.title}</span>
                    <h4 className="text-xs font-black text-[#1C3022]">{project.supervisingEngineer.name}</h4>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <a 
                    href={`tel:${project.supervisingEngineer.phone}`}
                    className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D8] flex items-center justify-center text-[#1C3022] hover:bg-[#EFE7DC]"
                    title="اتصال هاتفي"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a 
                    href={`https://wa.me/966${project.supervisingEngineer.phone.slice(1)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                    title="محادثة واتساب"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Submit Request Form */}
              <form onSubmit={handleCreateRequest} className="bg-white p-4 rounded-2xl border border-[#E8E2D8] space-y-3 shadow-sm">
                <h4 className="text-xs font-black text-[#1C3022] flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#A99379]" />
                  <span>تقديم طلب جديد للمهندس المشرف</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1">نوع الطلب الإنشائي</label>
                  <select 
                    value={requestType} 
                    onChange={e => setRequestType(e.target.value as any)}
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198]"
                  >
                    <option value="طلب معاينة موقعية">طلب معاينة واستلام موقعي (حديد/صب)</option>
                    <option value="طلب تعديل مادة/تشطيب">طلب تعديل مادة / مواصفة تشطيب</option>
                    <option value="استفسار فني هندسي">استفسار فني أو مناقشة مخطط</option>
                    <option value="طلب فحص صب الخرسانة">طلب تقرير فحص واختبار تكسير الخرسانة</option>
                    <option value="أخرى">طلب أو ملاحظة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-600 mb-1">تفاصيل وملاحظات الطلب</label>
                  <textarea 
                    rows={3} 
                    value={requestDetails}
                    onChange={e => setRequestDetails(e.target.value)}
                    required
                    placeholder="اكتب ملاحظتك أو موعد المعاينة المطلوب وسيقوم المهندس بالتواصل معك..."
                    className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#1C3022] outline-none focus:ring-2 focus:ring-[#C5B198] resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmittingRequest || !requestDetails.trim()}
                  className="w-full bg-[#1C3022] text-[#F8F5F0] py-2.5 rounded-xl font-black text-xs hover:bg-[#122116] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#C5B198]" />
                  <span>{isSubmittingRequest ? 'جاري الإرسال...' : 'إرسال الطلب للمهندس'}</span>
                </button>
              </form>

              {/* Previous Requests List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-[#1C3022] px-1">سجل الطلبات السابقة ومتابعتها</h4>
                {project.engineerRequests.map(req => (
                  <div key={req.id} className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[#1C3022]">{req.type}</span>
                        <span className="text-[10px] text-slate-400">({req.date})</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        req.status === 'تمت الموافقة والرد' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : req.status === 'قيد المراجعة الفنية' 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-slate-600 bg-[#FAF7F2] p-2.5 rounded-xl text-[11px] leading-relaxed">
                      {req.details}
                    </p>

                    {req.engineerReply && (
                      <div className="border-r-2 border-[#1C3022] pr-2.5 py-0.5 space-y-0.5">
                        <span className="text-[10px] font-black text-[#1C3022]">رد المهندس ({req.engineerName}):</span>
                        <p className="text-[11px] text-slate-700">{req.engineerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. FULL DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-white rounded-2xl border border-[#E8E2D8] space-y-3 shadow-sm">
                <h4 className="text-xs font-black text-[#1C3022] pb-2 border-b border-[#F0EBE1]">بيانات ورخصة البناء</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">رقم رخصة البناء</span>
                    <span className="font-black text-[#1C3022]">{project.licenseNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">الموقع والحي</span>
                    <span className="font-black text-[#1C3022]">{project.location}</span>
                  </div>
                  {project.landArea && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">مساحة الأرض</span>
                      <span className="font-black text-[#1C3022]">{project.landArea}</span>
                    </div>
                  )}
                  {project.builtUpArea && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">إجمالي مسطحات البناء</span>
                      <span className="font-black text-[#1C3022]">{project.builtUpArea}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">تاريخ البدء الفعلي</span>
                    <span className="font-black text-[#1C3022]">{project.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">التسليم المتوقع</span>
                    <span className="font-black text-[#1C3022]">{project.estimatedEndDate}</span>
                  </div>
                </div>
              </div>

              {/* Supervising Entity */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-2">
                <h4 className="text-xs font-black text-[#1C3022]">جهة التنفيذ والإشراف</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  مؤسسة نماذج التميز للمقاولات العامة والتطوير العقاري - معتمدة لدى وزارة الشؤون البلدية والقروية والإسكان والهيئة السعودية للمقاولين.
                </p>
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-[#E8E2D8]">
                  <span>شهادة تصنيف مقاولين: سارية</span>
                  <span>تأمين العيوب الخفية: 10 سنوات</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Image Preview Modal (Lightbox) */}
        {previewImage && (
          <div 
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center">
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 left-2 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <img 
                src={previewImage} 
                alt="معاينة الصورة" 
                className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        {/* Digital Contract Viewer Full Modal */}
        {selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2rem] p-6 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 text-[#192A1D] border border-[#C5B198]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#1C3022]" />
                  <h3 className="text-sm font-black text-[#1C3022]">وثيقة العقد الرقمي المعتمد</h3>
                </div>
                <button onClick={() => setSelectedContract(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-500">
                  <span>رقم العقد: {selectedContract.contractNumber}</span>
                  <span className="text-emerald-700 font-black">{selectedContract.status}</span>
                </div>
                <h4 className="font-black text-[#1C3022] text-sm">{selectedContract.title}</h4>
                <div className="flex justify-between pt-2 border-t border-[#E8E2D8] text-[11px]">
                  <span>القيمة: {selectedContract.totalValue}</span>
                  <span>تاريخ التوقيع: {selectedContract.signDate}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                <p className="font-black text-[#1C3022]">بنود وأحكام العقد:</p>
                <p>1. يلتزم الطرف الأول (مؤسسة نماذج التميز) بتنفيذ كافة الأعمال الموضحة بالمخططات الهندسية المعتمدة وفق كود البناء السعودي.</p>
                <p>2. يلتزم الطرف الثاني بسداد الدفعات المالية المجدولة في مواعيد استحقاقها بعد اعتماد مراحل الإنجاز من المهندس المشرف.</p>
                <p>3. يشمل العقد ضماناً لمدة 10 سنوات على الهيكل الإنشائي وضمان سنتين على أعمال العوازل والسباكة والكهرباء.</p>
              </div>

              {/* Digital Seal & Signature */}
              <div className="p-3 bg-[#EFE7DC]/50 rounded-xl border border-[#C5B198] flex items-center justify-between text-[11px]">
                <div>
                  <span className="font-black text-[#1C3022] block">التوقيع والختم الرقمي:</span>
                  <span className="text-slate-500">تم التوثيق إلكترونياً عبر منصة نماذج التميز</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#1C3022] flex items-center justify-center text-[9px] font-black text-[#1C3022] rotate-[-12deg]">
                  معتمد وموثق
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    onRequestToast(`تم تنزيل العقد: ${selectedContract.contractNumber}`);
                    setSelectedContract(null);
                  }}
                  className="flex-1 bg-[#1C3022] text-white py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-[#C5B198]" />
                  <span>تنزيل نسخة PDF الرسمية</span>
                </button>
                <button 
                  onClick={() => setSelectedContract(null)}
                  className="px-4 bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
