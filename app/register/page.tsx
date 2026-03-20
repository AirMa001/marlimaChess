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
    <div className="min-h-screen pb-20 flex items-center justify-center relative overflow-hidden px-4 sm:px-6 bg-[#020617]">
      {/* Refined Background Architecture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="max-w-xl w-full space-y-12 relative z-10">
        {/* Simplified Pro Stepper */}
        <div className="flex justify-center items-center gap-6 sm:gap-10 mx-auto">
           {steps.map((s) => {
             const Icon = s.icon;
             const active = step >= s.num;
             const isCurrent = step === s.num;
             return (
               <div key={s.num} className="relative flex flex-col items-center">
                 <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 ${
                   isCurrent ? 'bg-brand-orange border-brand-orange text-white shadow-[0_0_30px_rgba(255,107,1,0.3)] scale-110' : 
                   active ? 'bg-emerald-500 border-emerald-500 text-white' : 
                   'bg-white/5 border-white/10 text-slate-600'
                 }`}>
                    {active && !isCurrent ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                 </div>
                 {s.num < 3 && (
                   <div className={`absolute left-full top-1/2 -translate-y-1/2 w-6 sm:w-10 h-0.5 mx-0 sm:mx-0 transition-colors duration-700 ${active && step > s.num ? 'bg-emerald-500' : 'bg-white/10'}`} />
                 )}
               </div>
             )
           })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#0a1125]/80 backdrop-blur-2xl p-5 sm:p-14 rounded-[2rem] sm:rounded-[4rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden w-full"
          >
            {/* Step 1: Identity Extraction */}
            {step === 1 && (
              <div className="space-y-8 sm:space-y-10 relative z-10">
                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-[0.9]">Player<br/><span className="text-brand-orange">Verification</span></h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-500">Secure your spot in the rapid bracket</p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 ml-1">Transmission Channel</label>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {Object.values(ChessPlatform).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFormData({ ...formData, platform: p })}
                          className={`group p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all flex items-center justify-between ${
                            formData.platform === p 
                              ? 'border-brand-orange bg-brand-orange/10 text-brand-orange' 
                              : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/10'
                          }`}
                        >
                          <span className="font-black text-xs sm:text-sm">{p}</span>
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.platform === p ? 'border-brand-orange bg-brand-orange' : 'border-white/10'}`}>
                            {formData.platform === p && <CheckCircle2 size={12} className="text-white sm:size-14" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 ml-1">Global ID (Username)</label>
                    <div className="relative group">
                      <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-orange transition-colors">
                        <User size={18} className="sm:size-20" />
                      </div>
                      <input
                        type="text"
                        value={formData.chessUsername}
                        onChange={(e) => setFormData({...formData, chessUsername: e.target.value})}
                        className="w-full bg-white/5 border-2 border-white/5 rounded-xl sm:rounded-2xl pl-14 sm:pl-16 pr-5 sm:pr-6 py-4 sm:py-5 text-white focus:border-brand-orange outline-none transition-all placeholder-slate-700 font-bold text-base sm:text-lg"
                        placeholder="Platform ID"
                      />
                    </div>
                  </div>

                  <Button onClick={handleVerifyChess} isLoading={loading} className="w-full h-16 sm:h-20 bg-brand-orange hover:bg-white hover:text-[#020617] text-white font-black text-xs sm:text-sm shadow-2xl shadow-brand-orange/20 rounded-xl sm:rounded-2xl transition-all transform active:scale-95">
                    Establish Identity <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Protocol Finalization */}
            {step === 2 && (
              <div className="space-y-8 sm:space-y-10 relative z-10">
                <div className="space-y-2 sm:space-y-3">
                  <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter leading-[0.9]">Player<br/><span className="text-brand-orange">Protocol</span></h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-500">Finalize your tournament dossier</p>
                </div>

                {/* Player Pass Identity Card - More Mobile Friendly */}
                <div className="bg-brand-orange p-px rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-brand-orange/10 overflow-hidden">
                  <div className="bg-[#020617] p-4 sm:p-8 rounded-[0.95rem] sm:rounded-[1.95rem] flex flex-row items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                      <div className="h-12 w-12 sm:h-20 sm:w-20 bg-brand-orange/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-orange border border-brand-orange/20 shrink-0">
                          <Trophy className="h-6 w-6 sm:h-10 sm:w-10" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-brand-orange font-black mb-0.5 sm:mb-1">Verified</p>
                        <p className="font-black text-white text-base sm:text-3xl tracking-tighter truncate leading-none">@{formData.chessUsername}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500 font-black mb-0.5 sm:mb-1">ELO</p>
                      <p className="text-2xl sm:text-5xl font-black text-emerald-500 tracking-tighter leading-none">
                        {Math.round(formData.rating)}
                        {/* @ts-ignore */}
                        {(session?.user?.gamesPlayed || 0) < 8 && <span className="text-slate-700 ml-0.5 sm:ml-1">?</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {['Full Name', 'Department'].map((label) => (
                      <div key={label} className="space-y-2 sm:space-y-3">
                          <label className="block text-[10px] sm:text-xs font-black text-slate-400 ml-1">{label}</label>
                          <input
                              type="text"
                              required
                              value={label === 'Full Name' ? formData.fullName : formData.department}
                              onChange={(e) => setFormData({...formData, [label === 'Full Name' ? 'fullName' : 'department']: e.target.value})}
                              className="w-full bg-white/5 border-2 border-white/5 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white focus:border-brand-orange outline-none transition-all text-sm sm:text-base font-bold placeholder-slate-700"
                              placeholder={label}
                          />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                        <label className="block text-[10px] sm:text-xs font-black text-slate-400 ml-1">Secure Line (Phone)</label>
                        <input
                            type="tel"
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className={`w-full bg-white/5 border-2 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-white outline-none transition-all text-sm sm:text-base font-bold ${
                                formData.phoneNumber && !isPhoneValid ? 'border-red-500/50' : 'border-white/5 focus:border-brand-orange'
                            }`}
                            placeholder="08012345678"
                            maxLength={11}
                        />
                  </div>
                </div>

                <div className="pt-6 sm:pt-8 border-t border-white/10 space-y-6">
                  <div className="flex justify-between items-center bg-white/5 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 shadow-inner">
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="text-slate-500 text-[10px] sm:text-xs font-black">Entry Fee</span>
                      <p className="text-[10px] font-bold text-slate-600">UNN RAPID SERIES</p>
                    </div>
                    <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">₦{REGISTRATION_FEE.toLocaleString()}</span>
                  </div>
                  <Button 
                    onClick={() => setIsPaymentModalOpen(true)} 
                    className="w-full h-16 sm:h-20 bg-brand-orange hover:bg-white hover:text-[#020617] text-white font-black text-xs sm:text-sm shadow-2xl shadow-brand-orange/20 rounded-xl sm:rounded-2xl transition-all group"
                    disabled={!formData.fullName || !formData.department || !isPhoneValid}
                    isLoading={isProcessingPayment}
                  >
                    <CreditCard className="mr-3 h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:rotate-12" />
                    Secure Entry
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Deployment Success */}
            {step === 3 && (
              <div className="text-center space-y-10 py-10 relative z-10">
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }} 
                  animate={{ scale: 1, rotate: 0 }} 
                  className="mx-auto h-24 w-24 sm:h-32 sm:w-32 bg-emerald-500/10 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center border-2 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                >
                  <CheckCircle2 size={64} className="text-emerald-500" />
                </motion.div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none">Access<br/><span className="text-emerald-500">Granted</span></h2>
                  <p className="text-slate-400 max-w-sm mx-auto leading-relaxed text-xs sm:text-sm font-bold opacity-80">
                    Your transmission has been received. Our auditors will finalize your placement shortly.
                  </p>
                </div>

                <div className="pt-10">
                  <Button onClick={() => router.push('/')} className="h-16 px-12 bg-white/5 hover:bg-white hover:text-[#020617] text-white font-black text-sm rounded-2xl transition-all border-2 border-white/10">
                    Return to Mission Hub
                  </Button>
                </div>
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