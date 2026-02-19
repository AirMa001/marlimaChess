'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Trophy, 
  Search, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { ChessPlatform } from '@/types';
import { fetchChessRating } from '@/services/chessService';

export default function CompleteProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    platform: ChessPlatform.CHESS_COM,
    chessUsername: '',
    rating: null as number | null
  });

  // Redirect if already complete
  useEffect(() => {
    // @ts-ignore
    if (session?.user?.chessUsername && session?.user?.phoneNumber) {
      router.push('/');
    }
  }, [session, router]);

  const handleVerifyChess = async () => {
    if (!formData.chessUsername) {
      toast.error("Username Required");
      return;
    }
    setVerifying(true);
    try {
      const rating = await fetchChessRating(formData.platform, formData.chessUsername);
      if (rating !== null) {
        setFormData(prev => ({ ...prev, rating }));
        toast.success(`Verified: ${rating}`);
      } else {
        toast.error("User Not Found");
      }
    } catch (e) {
      toast.error("Connection Failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rating || !formData.phoneNumber) {
      toast.error("Profile Incomplete");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Update failed');

      await update(); // Refresh session
      toast.success("Profile Finalized!");
      router.push('/');
    } catch (error) {
      toast.error("Save Error");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#ea580c10_0%,transparent_50%)]" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-orange/20">
              <User className="text-brand-orange h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Complete Profile</h2>
            <p className="text-slate-500 text-sm mt-1">Verify your chess credentials to enter the arena.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                    <input
                      type="tel"
                      required
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-orange/50 outline-none transition-all"
                      placeholder="080..."
                      value={formData.phoneNumber}
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                </div>
                <Button type="button" onClick={() => setStep(2)} className="w-full h-14 mt-2 uppercase font-black">
                  Next <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Platform</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(ChessPlatform).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, platform: p, rating: null})}
                        className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${
                          formData.platform === p 
                            ? 'bg-brand-orange/10 border-brand-orange text-brand-orange' 
                            : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                      <input
                        type="text"
                        className="w-full bg-slate-950/40 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-orange/50 outline-none transition-all"
                        placeholder="Chess Username"
                        value={formData.chessUsername}
                        onChange={e => setFormData({...formData, chessUsername: e.target.value, rating: null})}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyChess}
                      disabled={verifying || !formData.chessUsername}
                      className="bg-brand-orange text-white px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[64px]"
                    >
                      {verifying ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {formData.rating !== null && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3"
                  >
                    <Trophy className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">Verified Rating</p>
                      <p className="text-xl font-black text-white">{formData.rating}</p>
                    </div>
                    <Zap className="h-5 w-5 text-green-500 animate-pulse" />
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-1/3 h-14 rounded-xl border border-white/5 bg-white/5 text-slate-500 font-black uppercase text-[10px]"
                  >
                    Back
                  </button>
                  <Button type="submit" isLoading={loading} disabled={!formData.rating} className="flex-1 h-14 uppercase font-black text-sm">
                    Finalize Profile
                  </Button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
