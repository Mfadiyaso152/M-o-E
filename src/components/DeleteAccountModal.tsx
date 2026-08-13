import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Mail,
  HardHat,
  Loader2
} from 'lucide-react';
import { User, Project } from '../types';

interface Props {
  user: User;
  projects: Project[];
  onClose: () => void;
  onConfirmDelete: () => void;
}

export function DeleteAccountModal({ user, projects, onClose, onConfirmDelete }: Props) {
  // Check if there are ongoing projects
  const activeProjects = projects.filter(p => p.status === 'قيد التنفيذ' || p.progress < 100);
  const hasActiveProjects = activeProjects.length > 0;

  const [step, setStep] = useState<'blocked' | 'confirm'>(hasActiveProjects ? 'blocked' : 'confirm');
  const [confirmationWord, setConfirmationWord] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationWord.trim() === 'حذف' || confirmationWord.trim() === 'delete') {
      setIsDeleting(true);
      setTimeout(() => {
        onConfirmDelete();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border-t sm:border border-red-200 text-[#192A1D] space-y-4"
      >
        <div className="w-12 h-1.5 bg-[#E8E2D8] rounded-full mx-auto mb-2 sm:hidden"></div>

        {/* 1. BLOCKED CASE: User has active ongoing projects */}
        {step === 'blocked' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2 text-red-700">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black">لا يمكن حذف الحساب حالياً</h3>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl text-xs text-red-950 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="font-bold leading-relaxed">
                  يوجد لديك <span className="font-black text-red-700">{activeProjects.length} مشروع قيد التنفيذ الإنشائي</span> مرتبط بهذا الحساب:
                </p>
              </div>

              {activeProjects.map(p => (
                <div key={p.id} className="p-2.5 bg-white rounded-xl border border-red-200 flex items-center justify-between text-[11px] font-black text-[#1C3022]">
                  <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <HardHat className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    {p.title}
                  </span>
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[10px]">
                    إنجاز {p.progress}%
                  </span>
                </div>
              ))}

              <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                حفاظاً على حقوقك التعاقدية ومتابعة تقارير استلام حديد التسليح والصب والضمانات الهندسية، لا يمكن حذف الحساب حتى يتم تسليم كافة المشاريع وسداد الالتزامات.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#1C3022] text-white py-3.5 rounded-2xl font-black text-xs hover:bg-[#122116] transition-all"
            >
              فهمت ذلك، والعودة للحساب
            </button>
          </div>
        )}

        {/* 2. CONFIRM CASE: No active projects, ask for intent */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-100">
              <div className="flex items-center gap-2 text-red-700">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-sm font-black">حذف الحساب والبيانات نهائياً</h3>
              </div>
              <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف حسابك بشكل نهائي؟ سيتم إلغاء وصولك لجميع العقود السابقة ومستندات الضمان الرقمية المرتبطة بالحساب:
            </p>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-900 font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-700 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                لتأكيد الحذف النهائي، اكتب كلمة <span className="text-red-600 font-black">"حذف"</span> في الحقل أدناه:
              </label>
              <input
                type="text"
                value={confirmationWord}
                onChange={e => setConfirmationWord(e.target.value)}
                placeholder="اكتب: حذف"
                required
                className="w-full bg-[#FAF7F2] border-2 border-red-300 focus:border-red-600 rounded-xl p-3 text-xs font-bold text-center text-red-700 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isDeleting || (confirmationWord.trim() !== 'حذف' && confirmationWord.trim() !== 'delete')}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-xl font-black text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>تأكيد الحذف النهائي</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 bg-slate-100 text-slate-700 py-3.5 rounded-xl font-bold text-xs hover:bg-slate-200"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

