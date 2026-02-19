'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Search, CreditCard, User, Trophy, Zap, Shield, ChevronRight } from 'lucide-react';
import { ChessPlatform, Player, RegistrationStatus } from '@/types';
import { fetchChessRating } from '@/services/chessService';
import { savePlayer } from '@/services/storageService';
import { uploadImageAction } from '@/app/actions';
import { Button } from '@/components/Button';
import { ManualPaymentModal } from '@/components/ManualPaymentModal';
import { REGISTRATION_FEE } from '@/constants';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  const { data: session } = useSession();
  
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    department: '',
    phoneNumber: '',
    platform: ChessPlatform.CHESS_COM,
    chessUsername: '',
    rating: 1500, 
    externalRating: 0
  });

  // Prefill from session
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        fullName: session.user.name || prev.fullName,
        phoneNumber: session.user.phoneNumber || prev.phoneNumber,
        chessUsername: session.user.chessUsername || prev.chessUsername,
        platform: session.user.platform || prev.platform,
        rating: session.user.siteRating || 1500,
        externalRating: session.user.externalRating || 0
      }));
      
      if (session.user.chessUsername) {
        setStep(2);
      }
    }
  }, [session]);

  const handleVerifyChess = async () => {
    setLoading(true);
    if (!formData.chessUsername) {
      toast.error("Username Required");
      setLoading(false);
      return;
    }

    const rating = await fetchChessRating(formData.platform, formData.chessUsername);
    if (rating === null) {
      toast.error("Profile Not Found", { description: "Verify your username and platform." });
    } else {
      setFormData(prev => ({ ...prev, externalRating: rating }));
      setStep(2);
      toast.success("Identity Verified");
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async (receiptImage: string) => {
    if (!tournamentId) {
      toast.error("Tournament ID missing. Please select a tournament from the directory.");
      return;
    }

    setIsProcessingPayment(true);
    setIsPaymentModalOpen(false);

    try {
        const imageUrl = await uploadImageAction(receiptImage);

        const newPlayer: Player = {
          id: crypto.randomUUID(),
          fullName: formData.fullName,
          department: formData.department,
          phoneNumber: formData.phoneNumber,
          chessUsername: formData.chessUsername,
          platform: formData.platform,
          rating: formData.rating, 
          externalRating: formData.externalRating,
          status: RegistrationStatus.PENDING,
          paymentReference: "MANUAL-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
          paymentReceipt: imageUrl,
          registeredAt: new Date().toISOString(),
          userId: session?.user?.id,
          // @ts-ignore
          tournamentId: parseInt(tournamentId)
        };

        await savePlayer(newPlayer);
        setStep(3);
        toast.success("Application Submitted!");
    } catch (e: any) {
        toast.error(e.message || "Submission Failed.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const isPhoneValid = /^\d{11}$/.test(formData.phoneNumber.replace(/\D/g, ''));

  const steps = [
    { num: 1, title: "Identity", icon: User },
    { num: 2, title: "Logistics", icon: CreditCard },
    { num: 3, title: "Complete", icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen pb-10 flex items-center justify-center relative overflow-hidden px-4 sm:px-6">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-brand-orange/5 rounded-full blur-[80px] sm:blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      <div className="max-w-xl w-full space-y-8 sm:space-y-10 relative z-10">
        {/* Stepper */}
        <div className="flex justify-between items-center max-w-[280px] sm:max-w-sm mx-auto mb-10 sm:mb-16 relative">
           <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10" />
           {steps.map((s) => {
             const Icon = s.icon;
             const active = step >= s.num;
             const isCurrent = step === s.num;
             return (
               <div key={s.num} className="flex flex-col items-center bg-[#020617] px-2 sm:px-4">
                 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border transition-all duration-500 ${active ? 'bg-brand-orange border-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-110' : 'bg-white/5 border-white/10 text-slate-600 scale-100'}`}>
                    <Icon size={18} className="sm:size-5" />
                 </div>
                 <span className={`mt-2.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors duration-500 ${isCurrent ? 'text-white' : 'text-slate-600'}`}>{s.title}</span>
               </div>
             )
           })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white/[0.02] backdrop-blur-3xl p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 sm:w-40 h-32 sm:h-40 bg-brand-orange/5 blur-3xl rounded-full" />

            {step === 1 && (
              <div className="space-y-8 sm:space-y-10 relative z-10">
                <div className="text-center space-y-1 sm:space-y-2">
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">Identity Check</h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Connect official chess credentials</p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1 opacity-60">Select Platform</label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {Object.values(ChessPlatform).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFormData({ ...formData, platform: p })}
                          className={`py-4 sm:py-5 rounded-xl sm:rounded-2xl border transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest ${
                            formData.platform === p 
                              ? 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange shadow-lg shadow-brand-orange/5' 
                              : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.08]'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-1 opacity-60">Account ID</label>
                    <div className="relative group">
                      <User className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                      <input
                        type="text"
                        value={formData.chessUsername}
                        onChange={(e) => setFormData({...formData, chessUsername: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl pl-11 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 text-white focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700 font-bold text-sm"
                        placeholder="Username"
                      />
                    </div>
                  </div>

                  <Button onClick={handleVerifyChess} isLoading={loading} className="w-full h-14 sm:h-16 bg-brand-orange hover:bg-white hover:text-slate-950 text-white font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl shadow-brand-orange/20 rounded-xl sm:rounded-2xl transition-all">
                    Verify Identity <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 sm:space-y-10 relative z-10">
                <div className="text-center space-y-1 sm:space-y-2">
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">Logistics</h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Finalize entry documentation</p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] flex items-center justify-between gap-4 sm:gap-6 shadow-inner">
                  <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 bg-brand-orange/10 rounded-lg sm:rounded-2xl flex items-center justify-center text-brand-orange border border-brand-orange/20 shadow-lg shrink-0">
                        <Shield className="h-5 w-5 sm:h-7 sm:w-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black opacity-60 truncate">Verified Player</p>
                      <p className="font-black text-white text-sm sm:text-xl uppercase tracking-tight truncate leading-tight mt-0.5 sm:mt-1">@{formData.chessUsername}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black opacity-60">Global ELO</p>
                    <p className="text-xl sm:text-3xl font-black text-emerald-500 font-mono tracking-tighter mt-0.5 sm:mt-1">
                      {Math.round(formData.rating)}
                      {/* @ts-ignore */}
                      {(session?.user?.gamesPlayed || 0) < 8 && <span className="text-slate-700 ml-0.5 sm:ml-1 text-base sm:text-xl">?</span>}
                    </p>
                  </div>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    {['Full Name', 'Department'].map((label) => (
                      <div key={label} className="group space-y-2 sm:space-y-3">
                          <label className="block text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">{label}</label>
                          <input
                              type="text"
                              required
                              value={label === 'Full Name' ? formData.fullName : formData.department}
                              onChange={(e) => setFormData({...formData, [label === 'Full Name' ? 'fullName' : 'department']: e.target.value})}
                              className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 text-white focus:border-brand-orange/30 outline-none transition-all text-xs sm:text-sm font-bold placeholder-slate-700"
                              placeholder={label}
                          />
                      </div>
                    ))}
                  </div>
                  <div className="group space-y-2 sm:space-y-3">
                        <label className="block text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 opacity-60">Secure Line (Phone)</label>
                        <input
                            type="tel"
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className={`w-full bg-white/5 border rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3.5 sm:py-5 text-white outline-none transition-all text-xs sm:text-sm font-bold ${
                                formData.phoneNumber && !isPhoneValid ? 'border-red-500/30' : 'border-white/5 focus:border-brand-orange/30'
                            }`}
                            placeholder="080..."
                            maxLength={11}
                        />
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 border-t border-white/5 space-y-5 sm:space-y-6">
                  <div className="flex justify-between items-center bg-black/20 p-4 sm:p-6 rounded-xl sm:rounded-[1.5rem] border border-white/5 shadow-inner">
                    <span className="text-slate-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-60">Entry Fee</span>
                    <span className="text-xl sm:text-3xl font-black text-white tracking-tighter">₦{REGISTRATION_FEE.toLocaleString()}</span>
                  </div>
                  <Button 
                    onClick={() => setIsPaymentModalOpen(true)} 
                    className="w-full h-14 sm:h-20 bg-brand-orange hover:bg-white hover:text-slate-950 text-white font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl shadow-brand-orange/20 rounded-xl sm:rounded-[2rem] transition-all group"
                    disabled={!formData.fullName || !formData.department || !isPhoneValid}
                    isLoading={isProcessingPayment}
                  >
                    <CreditCard className="mr-3 sm:mr-4 h-5 sm:h-6 w-5 sm:w-6 transition-transform group-hover:rotate-6" />
                    Secure Registration
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-8 sm:space-y-10 py-8 sm:py-12 relative z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto h-20 w-20 sm:h-28 sm:w-28 bg-emerald-500/10 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/5">
                  <CheckCircle2 className="h-10 w-10 sm:h-14 sm:w-14 text-emerald-500" />
                </motion.div>
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">Entry Secured</h2>
                  <p className="text-slate-500 max-w-xs sm:max-w-sm mx-auto leading-relaxed text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-80">
                    Verification documents are under review. Confirmation will be dispatched via SMS upon audit completion.
                  </p>
                </div>
                <Button onClick={() => router.push('/')} className="h-14 sm:h-16 px-8 sm:px-12 bg-white/5 hover:bg-white hover:text-slate-950 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest rounded-xl sm:rounded-2xl transition-all border border-white/10">
                  Return to Home
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <ManualPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        onSuccess={handlePaymentSuccess}
        email={session?.user?.email || 'guest@marlima.com'}
      />
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-brand-orange h-12 w-12" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}