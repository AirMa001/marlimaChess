'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Search, CreditCard, User } from 'lucide-react';
import { ChessPlatform, Player, RegistrationStatus } from '@/types';
import { fetchChessRating } from '@/services/chessService';
import { savePlayer } from '@/services/storageService';
import { uploadImageAction } from '@/app/actions';
import { Button } from '@/components/Button';
import { ManualPaymentModal } from '@/components/ManualPaymentModal';
import { REGISTRATION_FEE } from '@/constants';
import { toast } from 'sonner';

export default function Register() {
  const router = useRouter();
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
    rating: 0
  });

  const handleVerifyChess = async () => {
    setLoading(true);
    
    if (!formData.chessUsername) {
      toast.error("Username missing", { description: "Please enter your chess username." });
      setLoading(false);
      return;
    }

    const rating = await fetchChessRating(formData.platform, formData.chessUsername);
    
    if (rating === null) {
      toast.error("Profile not found", { description: `Could not find valid Blitz/Rapid stats for ${formData.chessUsername} on ${formData.platform}.` });
    } else {
      setFormData(prev => ({ ...prev, rating }));
      setStep(2);
      toast.success("Profile Verified", { description: `Found rating: ${rating}` });
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async (receiptImage: string) => {
    setIsProcessingPayment(true);
    setIsPaymentModalOpen(false);

    try {
        // 1. Upload to Cloudinary
        const imageUrl = await uploadImageAction(receiptImage);

        // 2. Save player with the Cloudinary URL
        const newPlayer: Player = {
          id: crypto.randomUUID(),
          fullName: formData.fullName,
          department: formData.department,
          phoneNumber: formData.phoneNumber,
          chessUsername: formData.chessUsername,
          platform: formData.platform,
          rating: formData.rating,
          status: RegistrationStatus.PENDING,
          paymentReference: "MANUAL-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
          paymentReceipt: imageUrl,
          registeredAt: new Date().toISOString()
        };

        await savePlayer(newPlayer);
        setStep(3);
        toast.success("Registration Submitted!");
    } catch (e) {
        console.error("Registration error:", e);
        toast.error("Submission failed. Please try again.");
    } finally {
        setIsProcessingPayment(false);
    }
  };

  // Check valid phone number (11 digits)
  const isPhoneValid = /^\d{11}$/.test(formData.phoneNumber.replace(/\D/g, ''));

  const steps = [
    { num: 1, title: "Identity", icon: User },
    { num: 2, title: "Details", icon: CreditCard },
    { num: 3, title: "Complete", icon: CheckCircle2 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        
        {/* Timeline */}
        <div className="flex justify-between items-center max-w-xs sm:max-w-sm mx-auto mb-8 sm:mb-12 relative">
           <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10" />
           {steps.map((s) => {
             const Icon = s.icon;
             const active = step >= s.num;
             const current = step === s.num;
             return (
               <div key={s.num} className="flex flex-col items-center bg-slate-950 px-2">
                 <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${active ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-900/50' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                 </div>
                 <span className={`mt-2 text-[10px] sm:text-xs font-medium uppercase tracking-wider ${current ? 'text-white' : 'text-slate-500'}`}>{s.title}</span>
               </div>
             )
           })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-800 shadow-2xl"
          >
            {step === 1 && (
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Verify Profile</h2>
                  <p className="text-sm sm:text-base text-slate-400">Connect your chess platform account.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Select Platform</label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.values(ChessPlatform).map((p) => (
                        <button
                          key={p}
                          onClick={() => setFormData({ ...formData, platform: p })}
                          className={`p-4 rounded-xl border transition-all duration-200 font-medium text-sm flex items-center justify-center ${
                            formData.platform === p 
                              ? 'border-green-500 bg-green-500/10 text-white ring-1 ring-green-500/50' 
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Username</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={formData.chessUsername}
                        onChange={(e) => setFormData({...formData, chessUsername: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all placeholder-slate-600"
                        placeholder="e.g. magnuscarlsen"
                      />
                      <Search className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                    </div>
                  </div>

                  <Button onClick={handleVerifyChess} isLoading={loading} className="w-full h-12 text-base shadow-lg shadow-green-900/20">
                    Verify & Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Registration Details</h2>
                  <p className="text-sm sm:text-base text-slate-400">Finalize your tournament entry.</p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 flex-shrink-0">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Account</p>
                      <p className="font-bold text-white text-base sm:text-lg truncate">@{formData.chessUsername}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rating</p>
                    <p className="text-xl sm:text-2xl font-black text-green-400 font-mono">{formData.rating}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {['Full Name', 'Department'].map((label) => (
                      <div key={label}>
                          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                          <input
                              type="text"
                              required
                              value={label === 'Full Name' ? formData.fullName : formData.department}
                              onChange={(e) => setFormData({...formData, [label === 'Full Name' ? 'fullName' : 'department']: e.target.value})}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-sm"
                          />
                      </div>
                    ))}
                  </div>
                  <div>
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Phone Number (11 digits)</label>
                        <input
                            type="tel"
                            required
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            className={`w-full bg-slate-950 border rounded-xl px-4 py-3.5 text-white outline-none transition-all text-sm ${
                                formData.phoneNumber && !isPhoneValid ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                            }`}
                            placeholder="080..."
                            maxLength={11}
                        />
                        {formData.phoneNumber && !isPhoneValid && <p className="text-[10px] text-red-500 mt-1">Must be 11 digits</p>}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-sm font-medium">Entry Fee</span>
                    <span className="text-xl sm:text-2xl font-bold text-white">₦{REGISTRATION_FEE.toLocaleString()}</span>
                  </div>
                  <Button 
                    onClick={() => setIsPaymentModalOpen(true)} 
                    className="w-full h-14 text-lg shadow-lg shadow-green-900/10"
                    disabled={!formData.fullName || !formData.department || !isPhoneValid}
                    isLoading={isProcessingPayment}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isProcessingPayment ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-8 py-8">
                <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="mx-auto h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/20"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-3">Registration Successful!</h2>
                  <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your proof of payment has been uploaded. You will receive an SMS confirmation once an admin verifies your entry.
                  </p>
                </div>
                <Button onClick={() => router.push('/')} variant="outline" className="h-12 px-8 border-slate-700 hover:bg-slate-800">
                  Back to Home
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
        email={'admin@marlima.com'} // Fallback for email as we removed it
      />
    </div>
  );
}
