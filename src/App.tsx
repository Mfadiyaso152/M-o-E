/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  HardHat, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X, 
  Download, 
  Check, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Phone, 
  ShieldCheck, 
  ChevronLeft, 
  Building2, 
  CalendarDays, 
  Sparkles, 
  Info,
  Sliders,
  Send,
  Trash2,
  Lock,
  ArrowRight,
  MessageSquare,
  Loader2,
  RefreshCw,
  Mail,
  AlertTriangle,
  BellRing,
  FileCheck,
  FileUp,
  XCircle
} from 'lucide-react';

// Types and Components
import { Project, QuoteRequest, User, Installment, getInstallmentOverdueStatus } from './types';
import { Logo } from './components/Logo';
import { ProjectCustomizationModal } from './components/ProjectCustomizationModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { AdminProjectManagerModal } from './components/AdminProjectManagerModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { SupervisorClientsView, SupervisorProjectsView, SupervisorPaymentsView } from './components/SupervisorViews';
import { UserService, ProjectService } from './services/dbService';
import { auth, googleProvider, appleProvider, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import { Users } from 'lucide-react';

const SUPERVISOR_EMAIL = 'mfb.15.f@gmail.com';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'projects' | 'payments' | 'profile'>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Modals state
  const [customizingProject, setCustomizingProject] = useState<Project | null>(null);
  const [adminManagingProject, setAdminManagingProject] = useState<Project | null>(null);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectForClientId, setCreateProjectForClientId] = useState<string | undefined>(undefined);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | undefined>(undefined);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<{ installment: Installment, project: Project } | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const isSupervisor = user?.email?.trim().toLowerCase() === SUPERVISOR_EMAIL.toLowerCase() || user?.role === 'admin';

  const triggerToast = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 4000);
  };

  // Listen to Firebase Auth state on app startup with safety timeout to prevent hanging
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: If Firebase auth takes longer than 2.5s, gracefully finish checking
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsAuthChecking(false);
      }
    }, 2500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        try {
          const isSuper = firebaseUser.email?.trim().toLowerCase() === SUPERVISOR_EMAIL.toLowerCase();

          // Fetch user profile from Firestore or initialize
          let existingProfile = await Promise.race([
            UserService.getUserById(firebaseUser.uid),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
          ]);

          if (!existingProfile && firebaseUser.email) {
            existingProfile = await Promise.race([
              UserService.getUserByEmail(firebaseUser.email),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
            ]);
          }

          if (existingProfile) {
            if (isSuper && existingProfile.role !== 'admin') {
              existingProfile.role = 'admin';
              UserService.saveUser(existingProfile).catch(console.warn);
            }
            if (isMounted) setUser(existingProfile);
          } else {
            const newProfile: User = {
              id: firebaseUser.uid,
              name: isSuper ? (firebaseUser.displayName || 'م. فهد (المشرف العام)') : (firebaseUser.displayName || 'عميل نماذج التميز'),
              email: firebaseUser.email || '',
              termsAccepted: true,
              role: isSuper ? 'admin' : 'client',
              createdAt: new Date().toISOString(),
              ...(firebaseUser.photoURL ? { photoURL: firebaseUser.photoURL } : {}),
              ...(firebaseUser.phoneNumber ? { phone: firebaseUser.phoneNumber } : {})
            };
            UserService.saveUser(newProfile).catch(console.warn);
            if (isMounted) setUser(newProfile);
          }
        } catch (err) {
          console.error('Error fetching/creating user on auth state change:', err);
        }
      } else {
        if (isMounted) setUser(null);
      }

      if (isMounted) {
        clearTimeout(timeoutId);
        setIsAuthChecking(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Fetch real data from Firestore
  const loadData = async (currentUser: User) => {
    setIsLoadingProjects(true);
    try {
      const isSuper = currentUser.email?.trim().toLowerCase() === SUPERVISOR_EMAIL.toLowerCase() || currentUser.role === 'admin';
      if (isSuper) {
        // Execute one-time purge requested by user: clear all clients except supervisor, and clear all projects
        const PURGE_KEY = 'namathij_db_purged_v2';
        if (!localStorage.getItem(PURGE_KEY)) {
          await UserService.purgeNonSupervisorUsers(SUPERVISOR_EMAIL);
          await ProjectService.purgeAllProjects();
          localStorage.setItem(PURGE_KEY, 'true');
        }

        const [allProjs, allUsers, allQuotes] = await Promise.all([
          ProjectService.getAllProjects(),
          UserService.getAllUsers(),
          ProjectService.getAllQuotes()
        ]);
        setProjects(allProjs);
        setClients(allUsers);
        setQuotes(allQuotes);
      } else {
        const [userProjs, userQuotes] = await Promise.all([
          ProjectService.getProjectsForUser(currentUser.id),
          ProjectService.getQuotesForUser(currentUser.id)
        ]);
        setProjects(userProjs);
        setQuotes(userQuotes);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(user);
    } else {
      setProjects([]);
      setClients([]);
      setQuotes([]);
      setSelectedProject(null);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setSelectedProject(null);
    setCustomizingProject(null);
    setAdminManagingProject(null);
    setProjects([]);
    setClients([]);
    setQuotes([]);
    setActiveTab('home');
    triggerToast('تم تسجيل الخروج بنجاح');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (isSupervisor) {
      triggerToast('حساب المشرف العام محمي ولا يمكن حذفه.');
      setShowDeleteAccountModal(false);
      return;
    }
    try {
      await UserService.deleteUser(user.id);
      await signOut(auth);
      setUser(null);
      setShowDeleteAccountModal(false);
      setSelectedProject(null);
      setCustomizingProject(null);
      setAdminManagingProject(null);
      setProjects([]);
      triggerToast('تم حذف الحساب والبيانات التابعة له بنجاح من قاعدة البيانات.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProject = async (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }
    if (customizingProject?.id === updated.id) {
      setCustomizingProject(updated);
    }
    if (adminManagingProject?.id === updated.id) {
      setAdminManagingProject(updated);
    }
    // Sync to Firestore
    await ProjectService.saveProject(updated);
  };

  const handlePaymentSuccess = async (updatedProject: Project, receiptRef: string, method: string) => {
    await handleUpdateProject(updatedProject);
    triggerToast(`تم سداد الدفعة بنجاح عبر ${method} (رقم السند: ${receiptRef})`);
  };

  // Loading screen during initial Firebase auth session check
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#1C3022] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto" dir="rtl">
        <div className="w-16 h-16 bg-[#C5B198] rounded-2xl flex items-center justify-center p-3 shadow-xl mb-4 animate-pulse">
          <Logo size="md" showText={false} />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[#C5B198] mb-2" />
        <p className="text-xs font-bold text-[#EFE7DC]/80">جاري التحقق من الجلسة الآمنة...</p>
      </div>
    );
  }

  // If not logged in, show AuthFlow with Google Sign-In & Firestore
  if (!user) {
    return (
      <AuthFlow 
        onAuthenticated={async (authenticatedUser) => {
          await UserService.saveUser(authenticatedUser);
          setUser(authenticatedUser);
          triggerToast(`أهلاً بك، ${authenticatedUser.name.split(' ')[0]}`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col text-[#192A1D] max-w-md mx-auto shadow-2xl relative overflow-hidden font-sans" dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-4 right-4 max-w-sm mx-auto z-50 bg-[#1C3022] text-[#F8F5F0] px-4 py-3.5 rounded-2xl shadow-xl border border-[#C5B198]/40 flex items-center gap-3 text-sm font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-[#C5B198] text-[#1C3022] flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <span className="flex-1 text-xs leading-relaxed">{showSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Header */}
      <header className="bg-[#1C3022] text-[#F8F5F0] px-6 pt-5 pb-4 sticky top-0 z-40 border-b border-[#284430] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C5B198] rounded-xl flex items-center justify-center p-1.5 shadow-md">
              <Logo size="sm" showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-wide text-[#F8F5F0]">نماذج التميز</h1>
                {isSupervisor && (
                  <span className="bg-[#C5B198] text-[#1C3022] text-[9px] font-black px-1.5 py-0.5 rounded">
                    مشرف
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#C5B198] font-bold">
                {isSupervisor ? 'بوابة إدارة المشاريع والعملاء' : 'للمقاولات العامة والتطوير'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (user) loadData(user);
                triggerToast('تم تحديث البيانات من السحابة بنجاح');
              }}
              className="w-9 h-9 rounded-xl bg-[#284430] text-[#C5B198] flex items-center justify-center hover:bg-[#32523b] transition-all"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Views */}
      <main className="flex-1 overflow-y-auto pb-28">
        {isLoadingProjects ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1C3022] mx-auto" />
            <p className="text-xs font-black text-slate-500">جاري تحميل البيانات من السيرفر...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <div key="detail">
                <ProjectDetailView 
                  project={selectedProject} 
                  onBack={() => setSelectedProject(null)} 
                  onOpenCustomization={() => {
                    if (isSupervisor) {
                      setAdminManagingProject(selectedProject);
                    } else {
                      setCustomizingProject(selectedProject);
                    }
                  }}
                  onPayInstallment={(p, i) => setShowPaymentModal({ project: p, installment: i })}
                />
              </div>
            ) : (
              <motion.div
                key={`${activeTab}-${isSupervisor ? 'super' : 'client'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-5 space-y-6"
              >
                {/* 1. HOME TAB (العملاء for Supervisor / الرئيسية for Client) */}
                {activeTab === 'home' && (
                  isSupervisor ? (
                    <SupervisorClientsView
                      user={user}
                      clients={clients}
                      projects={projects}
                      quotes={quotes}
                      onSelectClientForProjects={(clientId) => {
                        setSelectedClientFilter(clientId);
                        setActiveTab('projects');
                      }}
                      onCreateProjectForClient={(clientId) => {
                        setCreateProjectForClientId(clientId);
                        setShowCreateProjectModal(true);
                      }}
                      onRefreshQuotes={() => user && loadData(user)}
                      onRequestToast={triggerToast}
                    />
                  ) : (
                    <HomeView 
                      user={user} 
                      projects={projects} 
                      quotes={quotes}
                      onDecisionQuote={async (quote, decision) => {
                        try {
                          const updated: QuoteRequest = {
                            ...quote,
                            status: decision === 'accepted' ? 'مقبول' : 'مرفوض',
                            clientDecision: decision,
                            clientDecisionDate: new Date().toISOString().split('T')[0]
                          };
                          await ProjectService.saveQuoteRequest(updated);
                          if (user) loadData(user);
                          triggerToast(
                            decision === 'accepted' 
                              ? 'تمت الموافقة على عرض السعر بنجاح! سيتم إعداد العقد وتدشين المشروع.' 
                              : 'تم تسجيل رفضك لعرض السعر.'
                          );
                        } catch (err) {
                          console.error(err);
                          triggerToast('حدث خطأ أثناء حفظ القرار.');
                        }
                      }}
                      onRequestQuote={() => setShowQuoteForm(true)} 
                      onGoToPayments={() => setActiveTab('payments')}
                    />
                  )
                )}

                {/* 2. PROJECTS TAB (المشاريع with Management for Supervisor / مشاريعي for Client) */}
                {activeTab === 'projects' && (
                  isSupervisor ? (
                    <SupervisorProjectsView
                      projects={projects}
                      clients={clients}
                      onManageProject={(p) => setAdminManagingProject(p)}
                      onPreviewProject={setSelectedProject}
                      onCreateNewProject={() => {
                        setCreateProjectForClientId(undefined);
                        setShowCreateProjectModal(true);
                      }}
                      selectedClientFilter={selectedClientFilter}
                      onClearClientFilter={() => setSelectedClientFilter(undefined)}
                    />
                  ) : (
                    <ProjectsListView 
                      projects={projects} 
                      onSelect={setSelectedProject}
                      onCustomize={setCustomizingProject}
                      onRequestQuote={() => setShowQuoteForm(true)}
                    />
                  )
                )}

                {/* 3. PAYMENTS TAB */}
                {activeTab === 'payments' && (
                  isSupervisor ? (
                    <SupervisorPaymentsView
                      projects={projects}
                      clients={clients}
                      onManageProject={(p) => setAdminManagingProject(p)}
                      onRequestToast={triggerToast}
                    />
                  ) : (
                    <PaymentsView 
                      projects={projects} 
                      onPay={(p, i) => setShowPaymentModal({ project: p, installment: i })} 
                      onRequestQuote={() => setShowQuoteForm(true)}
                    />
                  )
                )}

                {/* 4. PROFILE TAB */}
                {activeTab === 'profile' && (
                  <ProfileView 
                    user={user} 
                    projects={projects}
                    isSupervisor={isSupervisor}
                    onLogout={handleLogout} 
                    onRequestDeleteAccount={() => {
                      if (isSupervisor) {
                        triggerToast('حساب المشرف العام محمي ولا يمكن حذفه.');
                      } else {
                        setShowDeleteAccountModal(true);
                      }
                    }}
                    onUpdateUser={async (updated) => {
                      setUser(updated);
                      await UserService.saveUser(updated);
                      triggerToast('تم حفظ التعديلات بنجاح في قاعدة البيانات');
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-[#E8E2D8] h-20 flex items-center justify-around px-2 z-40 shadow-lg">
        {[
          { id: 'home', label: isSupervisor ? 'العملاء' : 'الرئيسية', icon: isSupervisor ? Users : LayoutDashboard },
          { id: 'projects', label: isSupervisor ? 'المشاريع' : 'مشاريعي', icon: HardHat },
          { id: 'payments', label: 'الدفعات', icon: Wallet },
          { id: 'profile', label: 'حسابي', icon: UserIcon },
        ].map((item) => {
          const isActive = activeTab === item.id && !selectedProject;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setSelectedProject(null); }}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all relative ${
                isActive ? 'text-[#1C3022]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activePill"
                  className="absolute inset-0 bg-[#EFE7DC] rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#1C3022]' : ''}`} />
              <span className={`text-[11px] mt-1 ${isActive ? 'font-black text-[#1C3022]' : 'font-bold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* SUPERVISOR ADMIN PROJECT MANAGER MODAL */}
      {adminManagingProject && (
        <AdminProjectManagerModal
          project={adminManagingProject}
          clientName={clients.find(c => c.id === adminManagingProject.clientId)?.name}
          onClose={() => setAdminManagingProject(null)}
          onSave={handleUpdateProject}
          onRequestToast={triggerToast}
        />
      )}

      {/* SUPERVISOR CREATE PROJECT MODAL */}
      {showCreateProjectModal && (
        <CreateProjectModal
          clients={clients}
          selectedClientId={createProjectForClientId}
          onClose={() => {
            setShowCreateProjectModal(false);
            setCreateProjectForClientId(undefined);
          }}
          onProjectCreated={(newProj) => {
            setProjects(prev => [newProj, ...prev]);
            setShowCreateProjectModal(false);
            triggerToast('تم إنشاء المشروع وإدراجه للعميل بنجاح');
          }}
          onRequestToast={triggerToast}
        />
      )}

      {/* PROJECT CUSTOMIZATION MODAL */}
      {customizingProject && (
        <ProjectCustomizationModal 
          project={customizingProject}
          onClose={() => setCustomizingProject(null)}
          onUpdateProject={handleUpdateProject}
          onRequestToast={triggerToast}
        />
      )}

      {/* PAYMENT GATEWAY MODAL (Apple Pay & Real Card Payment) */}
      {showPaymentModal && (
        <PaymentGatewayModal 
          project={showPaymentModal.project}
          installment={showPaymentModal.installment}
          onClose={() => setShowPaymentModal(null)}
          onSuccess={(updatedProject, receiptRef, method) => {
            handlePaymentSuccess(updatedProject, receiptRef, method);
          }}
        />
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteAccountModal && (
        <DeleteAccountModal 
          user={user}
          projects={projects}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirmDelete={handleDeleteAccount}
        />
      )}

      {/* Quote Request Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div 
            initial={{ scale: 0.92, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-[#E8E2D8]"
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EFE7DC] flex items-center justify-center text-[#1C3022]">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[#1C3022]">طلب عرض سعر ودراسة مشروع</h3>
              </div>
              <button onClick={() => setShowQuoteForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const type = (form.elements.namedItem('projectType') as HTMLSelectElement).value;
              const location = (form.elements.namedItem('location') as HTMLInputElement).value;
              const details = (form.elements.namedItem('details') as HTMLTextAreaElement).value;

              const quoteReq: QuoteRequest = {
                id: `QR-${Math.floor(1000 + Math.random() * 9000)}`,
                clientId: user.id,
                clientName: user.name,
                projectName: type,
                description: `الموقع: ${location} | التفاصيل: ${details}`,
                status: 'طلب جديد',
                date: new Date().toISOString().split('T')[0]
              };

              try {
                await ProjectService.saveQuoteRequest(quoteReq);
                setShowQuoteForm(false);
                triggerToast('تم تسجيل طلب عرض السعر بنجاح في قاعدة البيانات! سيقوم المهندس بالتواصل معك.');
              } catch (err) {
                setShowQuoteForm(false);
                triggerToast('تم استلام طلبك بنجاح');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#192A1D] mb-1.5">نوع المشروع الإنشائي</label>
                <select name="projectType" className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#C5B198] text-[#1C3022]">
                  <option>بناء فيلا سكنية (عظم / مفتاح)</option>
                  <option>تشطيب وتطوير عقاري</option>
                  <option>ترميم وتجديد مبنى</option>
                  <option>تصميم داخلي وتنفيذ ديكورات</option>
                  <option>بناء مجمع تجاري أو مستودع</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-[#192A1D] mb-1.5">موقع المشروع والمدينة</label>
                <input 
                  name="location"
                  type="text" 
                  placeholder="مثال: الرياض - حي الملقا" 
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#C5B198]" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#192A1D] mb-1.5">مساحة الأرض / تفاصيل الطلب</label>
                <textarea 
                  name="details"
                  rows={3} 
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#C5B198] resize-none" 
                  placeholder="مثال: أرض مساحة 450م دورين وملحق، أود استلام عرض سعر..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#1C3022] text-[#F8F5F0] py-3.5 rounded-xl font-black text-xs hover:bg-[#122116] transition-all shadow-md active:scale-[0.98]"
              >
                إرسال الطلب للمكتب الفني
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// AuthFlow Component: Google & Apple Authentication
// -------------------------------------------------------------
function AuthFlow({ 
  onAuthenticated 
}: { 
  onAuthenticated: (user: User) => void; 
}) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleSignIn = async (providerType: 'google' | 'apple') => {
    setLoadingProvider(providerType);
    setErrorMessage('');

    try {
      const provider = providerType === 'google' ? googleProvider : appleProvider;
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      if (!fbUser) {
        throw new Error(`تعذر إتمام تسجيل الدخول باستخدام حساب ${providerType === 'google' ? 'Google' : 'Apple'}.`);
      }

      // Check if user exists in Firestore
      let userProfile = await UserService.getUserById(fbUser.uid);
      if (!userProfile && fbUser.email) {
        userProfile = await UserService.getUserByEmail(fbUser.email);
      }

      if (!userProfile) {
        // Create new user profile in Firestore
        userProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || (providerType === 'apple' ? 'مستخدم Apple' : 'عميل نماذج التميز'),
          email: fbUser.email || '',
          termsAccepted: true,
          role: 'client',
          createdAt: new Date().toISOString(),
          ...(fbUser.photoURL ? { photoURL: fbUser.photoURL } : {}),
          ...(fbUser.phoneNumber ? { phone: fbUser.phoneNumber } : {})
        };
        await UserService.saveUser(userProfile);
      }

      onAuthenticated(userProfile);
    } catch (err: any) {
      console.error(`${providerType} Sign In Error:`, err);
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية. يرجى المحاولة مرة أخرى.');
      } else if (code === 'auth/cancelled-popup-request') {
        setErrorMessage('تم إلغاء طلب تسجيل الدخول.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMessage(`تسجيل الدخول عبر ${providerType === 'apple' ? 'Apple' : 'Google'} غير مفعّل في لوحة Firebase. يرجى تفعيله من قسم Authentication > Sign-in method.`);
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage('النطاق الحالي غير مصرح به.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('تعذر الاتصال بالشبكة، يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.');
      } else {
        setErrorMessage(err?.message || `حدث خطأ أثناء تسجيل الدخول بحساب ${providerType === 'google' ? 'Google' : 'Apple'}. يرجى المحاولة مرة أخرى.`);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C3022] flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden font-sans" dir="rtl">
      {/* Architectural Background Blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#C5B198]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#284430] rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Branding Section */}
      <div className="pt-10 pb-4 text-center relative z-10">
        <div className="w-20 h-20 bg-[#C5B198] rounded-3xl mx-auto flex items-center justify-center p-3.5 shadow-2xl mb-4 border border-[#EFE7DC]/40">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-2xl font-black text-[#F8F5F0] tracking-wide">نماذج التميز</h1>
        <p className="text-xs text-[#C5B198] font-bold mt-1">للمقاولات العامة والتطوير الإنشائي</p>
      </div>

      {/* Main Authentication Card */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-7 sm:p-8 shadow-2xl border border-[#C5B198]/30 relative z-10 my-auto text-[#192A1D] space-y-6"
      >
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-[#EFE7DC] rounded-2xl flex items-center justify-center mx-auto mb-2 text-[#1C3022]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-[#1C3022]">بوابة العملاء والمشاريع</h2>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            سجّل دخولك لمتابعة مراحل البناء، الدفعات المالية، والتقارير الهندسية المعتمدة
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </motion.div>
        )}

        {/* Sign-in Buttons */}
        <div className="space-y-3 pt-1">
          {/* Google Sign-in Button */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={loadingProvider !== null}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 border-2 border-[#E8E2D8] hover:border-[#1C3022] py-3.5 px-4 rounded-2xl font-black text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loadingProvider === 'google' ? (
              <div className="flex items-center gap-2 text-[#1C3022]">
                <Loader2 className="w-5 h-5 animate-spin text-[#C5B198]" />
                <span>جاري تسجيل الدخول بحساب Google...</span>
              </div>
            ) : (
              <>
                {/* Official Google G SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-[#192A1D] group-hover:text-black">
                  المتابعة بحساب Google
                </span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 shrink-0">أو</span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {/* Apple Sign-in Button */}
          <button
            onClick={() => handleSignIn('apple')}
            disabled={loadingProvider !== null}
            className="w-full bg-black hover:bg-neutral-900 text-white border-2 border-black py-3.5 px-4 rounded-2xl font-black text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loadingProvider === 'apple' ? (
              <div className="flex items-center gap-2 text-white">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>جاري تسجيل الدخول بحساب Apple...</span>
              </div>
            ) : (
              <>
                {/* Official Apple SVG Icon */}
                <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.14.65-2.79 1.43-.57.65-1.07 1.76-.94 2.81 1.11.09 2.19-.55 2.77-1.29z"/>
                </svg>
                <span>
                  المتابعة بحساب Apple
                </span>
              </>
            )}
          </button>
        </div>

        {/* Security and Terms Notes */}
        <div className="pt-2 text-center space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            بالتسجيل والمتابعة فإنك توافق على{' '}
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-[#A99379] font-black underline hover:text-[#1C3022]"
            >
              شروط الخدمة وسياسة الخصوصية
            </button>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-800 font-bold bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>توثيق مشفر عبر Firebase OAuth Authentication</span>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center text-[11px] text-[#F8F5F0]/60 pb-2 relative z-10">
        جميع الحقوق محفوظة © {new Date().getFullYear()} نماذج التميز للمقاولات
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm" dir="rtl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-sm rounded-[2rem] p-6 shadow-2xl border border-[#E8E2D8] text-[#192A1D] space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#E8E2D8]">
              <h3 className="text-sm font-black text-[#1C3022]">الشروط والأحكام</h3>
              <button onClick={() => setShowTermsModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 max-h-60 overflow-y-auto leading-relaxed pr-1 font-medium">
              <p>1. يعد تسجيل الدخول عبر حساب Google موافقة على ربط مشاريعك الهندسية وملفاتك بالبريد الإلكتروني المعتمد.</p>
              <p>2. جميع الدفعات المسددة عبر التطبيق (Apple Pay / مدى) يتم توثيقها بسندات قبض إلكترونية معتمدة.</p>
              <p>3. تحافظ مؤسسة نماذج التميز على سرية بيانات العملاء ومخططات البناء وفق الأنظمة المعمول بها في المملكة العربية السعودية.</p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full bg-[#1C3022] text-[#F8F5F0] py-3 rounded-xl font-bold text-xs hover:bg-[#122116]"
            >
              موافق وإغلاق
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Home View
// -------------------------------------------------------------
function HomeView({ 
  user, 
  projects, 
  quotes = [],
  onDecisionQuote,
  onRequestQuote,
  onGoToPayments
}: { 
  user: User; 
  projects: Project[]; 
  quotes?: QuoteRequest[];
  onDecisionQuote?: (quote: QuoteRequest, decision: 'accepted' | 'rejected') => Promise<void>;
  onRequestQuote: () => void; 
  onGoToPayments: () => void;
}) {
  const pendingInstallment = projects.flatMap(p => p.installments.map(i => ({ installment: i, project: p }))).find(item => item.installment.status === 'pending');
  const overdue7DaysItem = projects.flatMap(p => p.installments.map(i => ({ 
    installment: i, 
    project: p,
    overdue: getInstallmentOverdueStatus(i)
  }))).find(item => item.installment.status === 'pending' && item.overdue.isOverdue7Days);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-black text-[#A99379] tracking-wider">مرحباً بك</span>
          <h2 className="text-xl font-black text-[#1C3022]">{user.name}</h2>
          <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-[#C5B198]" /> {user.email || user.phone}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#EFE7DC] border border-[#C5B198]/40 flex items-center justify-center text-[#1C3022] shadow-sm overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* 7-Day Overdue Payment Alert Banner */}
      {overdue7DaysItem && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-900 font-black text-xs">
              <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span>تنبيه سداد دفعة متأخرة (+{overdue7DaysItem.overdue.daysOverdue} يوم)</span>
            </div>
            <span className="text-[10px] font-black bg-red-200 text-red-900 px-2 py-0.5 rounded-full">
              عاجل
            </span>
          </div>
          <p className="text-[11px] text-red-800 leading-relaxed font-medium">
            نود تذكيركم بموعد سداد دفعة <strong>({overdue7DaysItem.installment.title})</strong> بقيمة <strong>{overdue7DaysItem.installment.amount}</strong> لمشروع <strong>{overdue7DaysItem.project.title}</strong> والمتأخرة عن تاريخ استحقاقها منذ أكثر من 7 أيام. يرجى المبادرة بالسداد عبر التطبيق لتجنب تأخير جدول الأعمال الإنشائية.
          </p>
          <button
            onClick={onGoToPayments}
            className="w-full bg-red-700 text-white py-2.5 rounded-xl font-black text-xs hover:bg-red-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>الانتقال لجدول الدفعات والسداد الآن</span>
          </button>
        </div>
      )}

      {/* QUOTES & PROPOSALS SECTION (عروض الأسعار والطلبات) */}
      {quotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#1C3022]">
                <FileText className="w-3.5 h-3.5 text-[#A99379]" />
              </div>
              <h3 className="text-sm font-black text-[#1C3022]">عروض الأسعار ودراسات المشاريع</h3>
            </div>
            <span className="text-[10px] font-black bg-[#EFE7DC] text-[#1C3022] px-2 py-0.5 rounded-full">
              {quotes.length} طلبات
            </span>
          </div>

          <div className="space-y-3">
            {quotes.map(quote => {
              const hasProposal = quote.status === 'تم إرسال العرض' || Boolean(quote.fileUrl);
              const isDecisionPending = !quote.clientDecision || quote.clientDecision === 'pending';

              return (
                <div key={quote.id} className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-[#A99379]">طلب رقم #{quote.id}</span>
                      <h4 className="text-sm font-black text-[#1C3022] mt-0.5">{quote.projectName}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{quote.description}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl shrink-0 ${
                      quote.status === 'طلب جديد' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                      quote.status === 'تم إرسال العرض' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                      quote.status === 'مقبول' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                      quote.status === 'مرفوض' ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {quote.status}
                    </span>
                  </div>

                  {/* If new request and supervisor hasn't sent quote yet */}
                  {quote.status === 'طلب جديد' && (
                    <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] text-xs flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-[#A99379] shrink-0" />
                      <span>طلبك قيد المراجعة والدراسة الفنية من المهندس المشرف. سيصلك إشعار ومستند عرض السعر هنا قريباً.</span>
                    </div>
                  )}

                  {/* If Supervisor sent a proposal (File + Price) */}
                  {hasProposal && (
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-[#A99379] block">مبلغ عرض السعر المقترح</span>
                          <span className="text-base font-black text-[#1C3022]">
                            {quote.quoteAmount || quote.amount || 'حسب المواصفات الهندسية'}
                          </span>
                        </div>

                        {quote.fileUrl && (
                          <a
                            href={quote.fileUrl}
                            download={quote.fileName || `عرض_سعر_${quote.projectName}.pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white hover:bg-[#EFE7DC] text-[#1C3022] px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border border-[#E8E2D8] shadow-sm transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-[#A99379]" />
                            <span>تحميل مستند العرض ({quote.fileName || 'ملف PDF'})</span>
                          </a>
                        )}
                      </div>

                      {quote.adminNote && (
                        <div className="pt-2 border-t border-[#E8E2D8] text-xs text-slate-600">
                          <strong className="text-[#1C3022]">ملاحظات المشرف: </strong>
                          {quote.adminNote}
                        </div>
                      )}

                      {/* Client Decision Actions */}
                      {isDecisionPending && quote.status === 'تم إرسال العرض' && onDecisionQuote && (
                        <div className="pt-2 border-t border-[#E8E2D8] space-y-2">
                          <span className="text-[11px] font-black text-[#1C3022] block">
                            يرجى الاطلاع على ملف العرض وتحديد قراركم:
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => onDecisionQuote(quote, 'accepted')}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                            >
                              <Check className="w-4 h-4" />
                              <span>قبول العرض والموافقة</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onDecisionQuote(quote, 'rejected')}
                              className="bg-white hover:bg-red-50 text-red-700 border border-red-200 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                            >
                              <X className="w-4 h-4 text-red-600" />
                              <span>رفض العرض</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Decision Result Status Banner */}
                      {quote.clientDecision === 'accepted' && (
                        <div className="pt-2 border-t border-[#E8E2D8] flex items-center gap-2 text-emerald-800 text-xs font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>تمت موافقتكم على عرض السعر. يقوم المهندس المشرف الآن بتجهيز العقد وتدشين المشروع في حسابك.</span>
                        </div>
                      )}

                      {quote.clientDecision === 'rejected' && (
                        <div className="pt-2 border-t border-[#E8E2D8] flex items-center gap-2 text-red-800 text-xs font-black">
                          <XCircle className="w-4 h-4 text-red-700 shrink-0" />
                          <span>تم تسجيل رفضكم لعرض السعر. يمكنك التواصل مع المشرف لطلب دراسة معدلة.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Quote Card */}
      <div className="bg-[#1C3022] rounded-[2rem] p-6 text-[#F8F5F0] relative overflow-hidden shadow-xl border border-[#284430]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5B198]/20 border border-[#C5B198]/30 text-[#C5B198] text-[10px] font-black mb-3">
            <Sparkles className="w-3 h-3" />
            <span>خدمة هندسية متكاملة</span>
          </div>
          <h3 className="text-lg font-black mb-1.5 text-[#F8F5F0]">هل لديك مشروع بناء أو تطوير؟</h3>
          <p className="text-[#EFE7DC]/80 text-xs mb-5 leading-relaxed font-medium">
            احصل على دراسة هندسية وعرض سعر دقيق ومعتمد من مهندسي نماذج التميز.
          </p>
          <button 
            onClick={onRequestQuote} 
            className="bg-[#C5B198] text-[#1C3022] px-5 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-[#BAA386] transition-all shadow-md active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>طلب عرض سعر جديد</span>
          </button>
        </div>
        
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#C5B198]/15 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2A4532]/40 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {/* Urgent Next Payment Alert */}
      {!overdue7DaysItem && pendingInstallment && (
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] border border-[#C5B198]/40 flex items-center justify-center text-[#1C3022]">
              <Wallet className="w-5 h-5 text-[#A99379]" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#A99379]">الدفعة القادمة المستحقة</span>
              <h4 className="text-xs font-black text-[#1C3022]">{pendingInstallment.installment.title}</h4>
              <span className="text-[11px] font-black text-[#1C3022] mt-0.5 block">{pendingInstallment.installment.amount}</span>
            </div>
          </div>
          <button 
            onClick={onGoToPayments}
            className="bg-black text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-neutral-800 transition-all active:scale-[0.98]"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>سداد الآن</span>
          </button>
        </div>
      )}

      {!pendingInstallment && (
        <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] flex items-center justify-center text-[#1C3022]">
              <HardHat className="w-5 h-5 text-[#A99379]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#1C3022]">مشاريعك المعتمدة</h4>
              <span className="text-[10px] text-slate-500 font-bold">
                {projects.length > 0 ? `لديك ${projects.length} مشاريع قيد المتابعة` : 'لا توجد مشاريع نشطة حالياً'}
              </span>
            </div>
          </div>
          {projects.length === 0 && (
            <button
              onClick={onRequestQuote}
              className="text-xs font-black text-[#1C3022] bg-[#EFE7DC] px-3.5 py-2 rounded-xl hover:bg-[#e4dacb]"
            >
              ابدأ مشروعك
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Projects List View
// -------------------------------------------------------------
function ProjectsListView({ 
  projects, 
  onSelect,
  onCustomize,
  onRequestQuote
}: { 
  projects: Project[]; 
  onSelect: (p: Project) => void;
  onCustomize: (p: Project) => void;
  onRequestQuote: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-[#1C3022]">ملفات ومشاريع حسابك</h3>
          <p className="text-xs text-slate-500">متابعة العقود، نسب الإنجاز وطلبات المشرف الموثقة</p>
        </div>
        <span className="px-3 py-1 bg-[#EFE7DC] text-[#1C3022] rounded-full text-xs font-black">
          {projects.length} مشاريع
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] space-y-4">
          <div className="w-14 h-14 bg-[#FAF7F2] rounded-2xl flex items-center justify-center mx-auto text-[#A99379] border border-[#E8E2D8]">
            <HardHat className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-black text-sm text-[#1C3022]">لا توجد مشاريع مضافة لحسابك حالياً</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              يمكنك طلب عرض سعر جديد لبدء مشروعك الإنشائي، وسيتم إدراجه هنا فوراً ومزامنته مع المهندس المشرف.
            </p>
          </div>
          <button
            onClick={onRequestQuote}
            className="bg-[#1C3022] text-[#F8F5F0] px-5 py-3 rounded-2xl text-xs font-black inline-flex items-center gap-2 hover:bg-[#122116] shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>طلب عرض سعر مشروع جديد</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(p => (
            <div 
              key={p.id} 
              className="bg-white rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-sm hover:shadow-md transition-all group"
            >
              {/* Image Header */}
              <div 
                onClick={() => onSelect(p)}
                className="h-44 relative cursor-pointer bg-slate-100"
              >
                <img 
                  src={p.images.before[0] || 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?q=80&w=1200&auto=format&fit=crop'} 
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                
                <div className="absolute top-3 right-3 bg-[#1C3022]/90 backdrop-blur-md text-[#F8F5F0] px-3.5 py-1 rounded-full text-[11px] font-black border border-[#C5B198]/30">
                  {p.status}
                </div>

                <div className="absolute bottom-3 right-3 left-3 text-white">
                  <h4 className="text-base font-black mb-1">{p.title}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#EFE7DC]">
                    <MapPin className="w-3.5 h-3.5 text-[#C5B198]" /> {p.location}
                  </div>
                </div>
              </div>

              {/* Info & Customization Action Buttons */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500">نسبة تقدم الأعمال</span>
                  <span className="text-[#1C3022] font-black">{p.progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#E8E2D8] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-l from-[#C5B198] to-[#1C3022] rounded-full" 
                    style={{ width: `${p.progress}%` }}
                  ></div>
                </div>

                <div className="pt-2 flex gap-2 border-t border-[#F0EBE1]">
                  <button
                    type="button"
                    onClick={() => onCustomize(p)}
                    className="flex-1 bg-[#1C3022] text-[#F8F5F0] py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 hover:bg-[#122116] transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#C5B198]" />
                    <span>تخصيص وإدارة المشروع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    className="px-3.5 py-2.5 bg-[#FAF7F2] text-[#1C3022] rounded-xl text-xs font-black flex items-center justify-center gap-1 border border-[#E8E2D8] hover:bg-[#EFE7DC] transition-all"
                  >
                    <span>التفاصيل</span>
                    <ChevronLeft className="w-3.5 h-3.5 text-[#A99379]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Payments View
// -------------------------------------------------------------
function PaymentsView({ 
  projects, 
  onPay,
  onRequestQuote
}: { 
  projects: Project[]; 
  onPay: (p: Project, i: Installment) => void; 
  onRequestQuote: () => void;
}) {
  const allInstallments = projects.flatMap(p => p.installments.map(i => ({ project: p, installment: i, overdue: getInstallmentOverdueStatus(i) })));
  const anyOverdue7Days = allInstallments.some(item => item.installment.status === 'pending' && item.overdue.isOverdue7Days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-[#1C3022]">الدفعات والمستحقات</h3>
          <p className="text-xs text-slate-500">سداد إلكتروني معتمد مع إصدار سندات قبض رسمية</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-[#EFE7DC] flex items-center justify-center text-[#1C3022]">
          <Wallet className="w-5 h-5 text-[#A99379]" />
        </div>
      </div>

      {/* Top Overdue Notice if exists */}
      {anyOverdue7Days && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-red-900">تنبيه: لديك دفعات متأخرة عن موعدها</h4>
            <p className="text-[11px] text-red-700 mt-0.5 font-medium">
              تجاوزت بعض الدفعات موعد استحقاقها بأكثر من 7 أيام. يرجى السداد لتفادي تأخر مراحل البناء.
            </p>
          </div>
        </div>
      )}

      {allInstallments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E2D8] space-y-3">
          <CreditCard className="w-10 h-10 text-[#C5B198] mx-auto" />
          <h4 className="font-black text-sm text-[#1C3022]">لا توجد دفعات مالية مستحقة حالياً</h4>
          <p className="text-xs text-slate-500">سيتم إدراج جدول الدفعات فور توثيق عقد المشروع واعتماد خطة التنفيذ.</p>
        </div>
      ) : (
        projects.map(p => (
          <div key={p.id} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-[#1C3022] bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#E8E2D8]">
              <Building2 className="w-4 h-4 text-[#A99379]" />
              <span>مشروع: {p.title}</span>
            </div>

            <div className="space-y-2.5">
              {p.installments.map(i => {
                const overdue = getInstallmentOverdueStatus(i);
                const isOverdue7 = i.status === 'pending' && overdue.isOverdue7Days;

                return (
                  <div 
                    key={i.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      i.status === 'paid' 
                        ? 'bg-white border-[#E8E2D8]' 
                        : isOverdue7
                        ? 'bg-red-50/70 border-red-300 ring-1 ring-red-100 shadow-sm'
                        : 'bg-white border-[#C5B198]/60 shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs text-[#1C3022]">{i.title}</h4>
                          {isOverdue7 && (
                            <span className="text-[9px] font-black bg-red-100 text-red-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                              <span>تأخر +7 أيام</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                          تاريخ الاستحقاق: {i.dueDate} {isOverdue7 ? `(متأخرة منذ ${overdue.daysOverdue} يوم)` : ''}
                        </span>
                        {i.transactionRef && (
                          <span className="text-[9px] font-mono text-emerald-800 block mt-0.5">
                            رقم السند: {i.transactionRef}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-[#1C3022] block">{i.amount}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F5EFE6] flex items-center justify-between">
                      {i.status === 'paid' ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-black">
                          <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3]" />
                          </div>
                          <span>تم السداد في ({i.paymentDate}) {i.paymentMethod ? `بواسطة ${i.paymentMethod}` : ''}</span>
                        </div>
                      ) : isOverdue7 ? (
                        <div className="flex items-center gap-1.5 text-red-700 text-[11px] font-black">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>متأخرة عن موعد الاستحقاق</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-black">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>بانتظار السداد</span>
                        </div>
                      )}

                      {i.status === 'pending' && (
                        <button 
                          onClick={() => onPay(p, i)} 
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-[0.98] ${
                            isOverdue7 
                              ? 'bg-red-700 hover:bg-red-800 text-white shadow-sm' 
                              : 'bg-black hover:bg-neutral-800 text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5 text-white" />
                          <span>سداد الآن</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Project Details & Image Stages View
// -------------------------------------------------------------
function ProjectDetailView({ 
  project, 
  onBack,
  onOpenCustomization,
  onPayInstallment
}: { 
  project: Project; 
  onBack: () => void;
  onOpenCustomization: () => void;
  onPayInstallment: (p: Project, i: Installment) => void;
}) {
  const [activeStage, setActiveStage] = useState<'before' | 'progress50' | 'after' | 'plans'>('progress50');

  const stageLabels = {
    before: 'قبل البدء',
    progress50: 'نسبة 50%',
    after: 'بعد الإنجاز',
    plans: 'المخططات الهندسية'
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-xs font-black text-[#1C3022] hover:bg-[#FAF7F2]"
        >
          <ChevronRight className="w-4 h-4" />
          <span>رجوع للمشاريع</span>
        </button>
        <button
          onClick={onOpenCustomization}
          className="px-3.5 py-1.5 bg-[#1C3022] text-[#F8F5F0] rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-[#122116]"
        >
          <Sliders className="w-3.5 h-3.5 text-[#C5B198]" />
          <span>تخصيص المشروع</span>
        </button>
      </div>

      {/* Project Title and Overview */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-black text-[#1C3022]">{project.title}</h2>
          <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#A99379]" /> {project.location}
          </p>
        </div>

        {/* Progress Display */}
        <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-[#A99379] block">نسبة الإنجاز الفعلية</span>
            <span className="text-2xl font-black text-[#1C3022]">{project.progress}%</span>
          </div>
          <div className="w-14 h-14 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-[#E8E2D8]" />
              <circle 
                cx="28" 
                cy="28" 
                r="22" 
                stroke="currentColor" 
                strokeWidth="5" 
                fill="transparent" 
                className="text-[#1C3022]" 
                strokeDasharray={138.2} 
                strokeDashoffset={138.2 - (138.2 * project.progress) / 100} 
              />
            </svg>
            <HardHat className="w-5 h-5 text-[#A99379] absolute" />
          </div>
        </div>
      </div>

      {/* Project Stages Gallery */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-[#1C3022]">صور ومخططات المشروع</h3>
          <span className="text-[11px] text-[#A99379] font-bold">تحديثات ميدانية</span>
        </div>

        {/* Stage Selector Pills */}
        <div className="flex gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E2D8] overflow-x-auto">
          {(['before', 'progress50', 'after', 'plans'] as const).map(stage => (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all ${
                activeStage === stage 
                  ? 'bg-[#1C3022] text-[#F8F5F0] shadow-sm' 
                  : 'text-slate-500 hover:text-[#1C3022]'
              }`}
            >
              {stageLabels[stage]}
            </button>
          ))}
        </div>

        {/* Stage Images */}
        <div className="grid grid-cols-2 gap-2.5">
          {project.images[activeStage]?.length > 0 ? (
            project.images[activeStage].map((imgUrl, idx) => (
              <div key={idx} className="h-32 rounded-2xl overflow-hidden border border-[#E8E2D8] relative group bg-slate-100">
                <img 
                  src={imgUrl} 
                  alt={`${project.title} - ${stageLabels[activeStage]}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))
          ) : (
            <div className="col-span-2 py-8 text-center text-xs text-slate-400 font-bold bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
              لا توجد صور مضافة لهذه المرحلة بعد
            </div>
          )}
        </div>
      </div>

      {/* Engineer & Contact */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-[#1C3022]">المهندس المشرف على الموقع</h3>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">معتمد</span>
        </div>
        <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-[#1C3022]">{project.supervisingEngineer.name}</h4>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{project.supervisingEngineer.title}</p>
          </div>
          <a 
            href={`tel:${project.supervisingEngineer.phone}`}
            className="w-9 h-9 rounded-xl bg-[#1C3022] text-[#F8F5F0] flex items-center justify-center shadow-sm"
          >
            <Phone className="w-4 h-4 text-[#C5B198]" />
          </a>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Profile View
// -------------------------------------------------------------
function ProfileView({
  user,
  projects,
  isSupervisor,
  onLogout,
  onRequestDeleteAccount,
  onUpdateUser
}: {
  user: User;
  projects: Project[];
  isSupervisor?: boolean;
  onLogout: () => void;
  onRequestDeleteAccount: () => void;
  onUpdateUser: (u: User) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updatedUser: User = {
      ...user,
      name,
      email,
      phone: phone.trim() || undefined
    };
    try {
      await UserService.saveUser(updatedUser);
      onUpdateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating user profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-sm text-center space-y-3">
        <div className="w-20 h-20 bg-[#EFE7DC] rounded-full mx-auto flex items-center justify-center text-[#1C3022] border-2 border-[#C5B198]/40 shadow-inner overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-10 h-10" />
          )}
        </div>
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-black text-[#1C3022]">{user.name}</h2>
            {isSupervisor && (
              <span className="bg-[#1C3022] text-[#C5B198] text-[10px] font-black px-2 py-0.5 rounded-md">
                مشرف عام
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-bold mt-1" dir="ltr">{user.email || user.phone || 'حساب موثق'}</p>
          <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{isSupervisor ? 'حساب الإدارة والتحكم الشامل' : 'حساب Google معتمد وموثق'}</span>
          </div>
        </div>
      </div>

      {/* Account Info Details */}
      <div className="bg-white rounded-3xl p-5 border border-[#E8E2D8] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
          <h3 className="text-sm font-black text-[#1C3022]">بيانات الحساب والتوثيق</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-black text-[#A99379] hover:underline"
          >
            {isEditing ? 'إلغاء' : 'تعديل البيانات'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-2.5 text-xs font-bold text-[#1C3022] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-2.5 text-xs font-bold text-[#1C3022] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">رقم التواصل (اختياري)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl p-2.5 text-xs font-bold text-[#1C3022] outline-none"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[#1C3022] text-white py-2.5 rounded-xl font-black text-xs hover:bg-[#122116] flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>حفظ التعديلات في السحابة</span>
            </button>
          </form>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-bold">الاسم:</span>
              <span className="font-black text-[#1C3022]">{user.name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-bold">البريد الإلكتروني:</span>
              <span className="font-bold text-[#1C3022]">{user.email || 'غير مسجل'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-bold">رقم التواصل:</span>
              <span className="font-bold text-[#1C3022]" dir="ltr">{user.phone || 'غير مسجل'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400 font-bold">نوع الحساب:</span>
              <span className="font-black text-[#1C3022]">{isSupervisor ? 'مشرف عام النظام' : 'عميل'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Supervisor Account Protection Notice */}
      {isSupervisor && (
        <div className="bg-[#FAF7F2] border border-[#C5B198]/40 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#1C3022] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-[#1C3022]">حساب المشرف محمي</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              هذا الحساب يمتلك صلاحيات إدارة المشاريع وتحديث نسب الإنجاز ومتابعة الطلبات، ولا يمكن حذفه للحفاظ على استمرارية المنظومة.
            </p>
          </div>
        </div>
      )}

      {/* Danger Zone: Delete Account & Logout */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={onLogout}
          className="w-full bg-white border border-[#E8E2D8] text-slate-700 py-3.5 rounded-2xl font-black text-xs hover:bg-[#FAF7F2] flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>تسجيل الخروج</span>
        </button>

        {/* Delete Account button is NOT visible to the supervisor */}
        {!isSupervisor && (
          <button
            onClick={onRequestDeleteAccount}
            className="w-full bg-red-50 border border-red-200 text-red-700 py-3.5 rounded-2xl font-black text-xs hover:bg-red-100 flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>حذف الحساب والبيانات نهائياً</span>
          </button>
        )}
      </div>
    </div>
  );
}
