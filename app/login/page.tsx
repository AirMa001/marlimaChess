'use client';

import React, { useState, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Lock, 
  LogIn, 
  User, 
  Phone, 
  Trophy, 
  Search, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { ChessPlatform } from '@/types';
import { fetchChessRating } from '@/services/chessService';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Memoize search params to avoid re-calculating on every small state change
  const { callbackUrl, initialMode } = useMemo(() => ({
    callbackUrl: searchParams.get('callbackUrl') || '/',
    initialMode: searchParams.get('mode') === 'login' ? 'login' : 'signup'
  }), [searchParams]);

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode as 'login' | 'signup');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Visibility States
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Form States
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    platform: ChessPlatform.CHESS_COM,
    chessUsername: '',
    rating: null as number | null
  });

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
        callbackUrl,
      });

      if (res?.error) {
        toast.error("Access Denied", { description: "Invalid email or password." });
      } else {
        toast.success("Welcome back!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast.error("System Error");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!signupData.name || !signupData.email || !signupData.password || !signupData.phoneNumber) {
      toast.error("Information Required", { description: "Please fill in all fields." });
      return;
    }
    if (signupData.password.length < 6) {
      toast.error("Password Too Short", { description: "Minimum 6 characters required." });
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Password Mismatch", { description: "Your passwords do not match." });
      return;
    }
    setSignupStep(2);
  };

  const handleTriggerOTP = async () => {
    if (!signupData.rating) {
      toast.error("Verification Required", { description: "Please verify your chess profile." });
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("OTP Sent", { description: "Check your email for the verification code." });
      setSignupStep(3);
    } catch (error: any) {
      toast.error("OTP Error", { description: error.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Signup Final Step
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...signupData, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      toast.success("Account Created!", { description: "Welcome to Marlima Chess." });
      
      const signInRes = await signIn('credentials', {
        redirect: false,
        email: signupData.email,
        password: signupData.password,
        callbackUrl,
      });

      if (!signInRes?.error) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setMode('login');
        setSignupStep(1);
      }
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChess = async () => {
    if (!signupData.chessUsername) {
      toast.error("Username Required");
      return;
    }
    setVerifying(true);
    try {
      const rating = await fetchChessRating(signupData.platform, signupData.chessUsername);
      if (rating !== null) {
        setSignupData(prev => ({ ...prev, rating }));
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

  const isPasswordMatch = signupData.confirmPassword && signupData.password === signupData.confirmPassword;
  const isPasswordMismatch = signupData.confirmPassword && signupData.password !== signupData.confirmPassword;
  const isPasswordValid = signupData.password.length >= 6;

  return (
    <div className="min-h-[100dvh] bg-[#020617] flex items-center justify-center p-4 overflow-hidden relative selection:bg-brand-orange/30 font-sans">
      {/* Optimized Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Using CSS-only or simpler motion for better perf */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-brand-orange/10 blur-[120px] rounded-full animate-pulse-slow will-change-transform"
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse-slow-delay will-change-transform"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617]" />
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.1; }
          50% { transform: scale(1.1) translate(20px, -10px); opacity: 0.15; }
        }
        @keyframes pulse-slow-delay {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.05; }
          50% { transform: scale(1.05) translate(-20px, 20px); opacity: 0.1; }
        }
        .animate-pulse-slow { animation: pulse-slow 15s infinite ease-in-out; }
        .animate-pulse-slow-delay { animation: pulse-slow-delay 20s infinite ease-in-out; }
      `}</style>

      <div className="w-full max-w-md sm:max-w-lg relative z-10 py-6">
        <div className="flex justify-center mb-8">
          <div className="bg-white/[0.03] backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex relative overflow-hidden shadow-2xl w-60 sm:w-64">
            <motion.div
              className="absolute inset-y-1.5 rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/30"
              initial={false}
              animate={{ x: mode === 'login' ? 0 : '100%' }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              style={{ width: 'calc(50% - 6px)', left: '3px' }}
            />
            <button
              onClick={() => setMode('login')}
              className={`relative z-10 flex-1 py-2.5 text-[10px] font-black tracking-widest transition-colors ${mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              LOGIN
            </button>
            <button
              onClick={() => { setMode('signup'); setSignupStep(1); }}
              className={`relative z-10 flex-1 py-2.5 text-[10px] font-black tracking-widest transition-colors ${mode === 'signup' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              SIGN UP
            </button>
          </div>
        </div>

        <div className="relative transform-gpu" style={{ perspective: '2000px' }}>
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative will-change-transform"
              >
                {/* Subtle internal glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />
                
                <div className="text-center mb-10 relative z-10">
                  <Link href="/" className="inline-flex items-center gap-2 mb-6 text-slate-500 hover:text-white transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back to Home</span>
                  </Link>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase leading-none">Welcome Back</h2>
                  <p className="text-slate-500 text-xs mt-3 font-medium uppercase tracking-widest opacity-60">Tournament Management Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                        <input
                          type="email"
                          required
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-brand-orange/30 focus:bg-white/[0.05] outline-none transition-all placeholder-slate-700"
                          placeholder="Email Address"
                          value={loginData.email}
                          onChange={e => setLoginData({...loginData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                        <input
                          type={showLoginPass ? "text" : "password"}
                          required
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-white text-sm focus:border-brand-orange/30 focus:bg-white/[0.05] outline-none transition-all placeholder-slate-700"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={e => setLoginData({...loginData, password: e.target.value})}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                        >
                          {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" isLoading={loading} className="w-full h-14 bg-brand-orange hover:bg-white hover:text-slate-950 text-white font-black tracking-[0.2em] uppercase text-xs rounded-2xl shadow-xl shadow-brand-orange/10 transition-all active:scale-[0.98]">
                    Authorize Access
                  </Button>

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Or Secure Entry</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/profile/complete' })}
                    className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all group"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all" />
                    Continue with Google
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative will-change-transform"
              >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 blur-3xl rounded-full" />
                
                <div className="text-center mb-8 relative z-10">
                  <div className="flex justify-center space-x-2 mb-8">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className={`h-1 rounded-full transition-all duration-500 ${signupStep === s ? 'bg-brand-orange w-12' : 'bg-white/10 w-6'}`} />
                    ))}
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                    {signupStep === 1 ? 'Join Platform' : signupStep === 2 ? 'Chess Identity' : 'Account Audit'}
                  </h2>
                  <p className="text-slate-500 text-[10px] mt-3 font-black uppercase tracking-[0.2em] opacity-60">Step {signupStep} of 3</p>
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-6 relative z-10">
                  {signupStep === 1 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                          <input
                            type="text"
                            required
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700"
                            placeholder="Full Legal Name"
                            value={signupData.name}
                            onChange={e => setSignupData({...signupData, name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Contact</label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                          <input
                            type="tel"
                            required
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700"
                            placeholder="Phone Number"
                            value={signupData.phoneNumber}
                            onChange={e => setSignupData({...signupData, phoneNumber: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                          <input
                            type="email"
                            required
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700"
                            placeholder="active@email.com"
                            value={signupData.email}
                            onChange={e => setSignupData({...signupData, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                          <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${signupData.password && !isPasswordValid ? 'text-red-500' : 'text-slate-600 group-focus-within:text-brand-orange'}`} />
                          <input
                            type={showSignupPass ? "text" : "password"}
                            required
                            className={`w-full bg-white/[0.03] border rounded-2xl pl-12 pr-12 py-4 text-white text-sm outline-none transition-all placeholder-slate-700 ${
                                signupData.password && !isPasswordValid 
                                ? 'border-red-500/30' 
                                : 'border-white/5 focus:border-brand-orange/30'
                            }`}
                            placeholder="Min. 6 characters"
                            value={signupData.password}
                            onChange={e => setSignupData({...signupData, password: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPass(!showSignupPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            {showSignupPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Security Key</label>
                        <div className="relative group">
                          <ShieldCheck className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isPasswordMismatch ? 'text-red-500' : isPasswordMatch && isPasswordValid ? 'text-green-500' : 'text-slate-600 group-focus-within:text-brand-orange'}`} />
                          <input
                            type={showConfirmPass ? "text" : "password"}
                            required
                            className={`w-full bg-white/[0.03] border rounded-2xl pl-12 pr-12 py-4 text-white text-sm outline-none transition-all placeholder-slate-700 ${
                                isPasswordMismatch 
                                ? 'border-red-500/30' 
                                : isPasswordMatch && isPasswordValid
                                ? 'border-green-500/20'
                                : 'border-white/5 focus:border-brand-orange/30'
                            }`}
                            placeholder="Repeat password"
                            value={signupData.confirmPassword}
                            onChange={e => setSignupData({...signupData, confirmPassword: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <Button type="button" onClick={handleNextStep} className="w-full h-14 bg-brand-orange text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-2">
                        Profile Setup <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Or Secure Entry</span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>

                      <button
                        type="button"
                        onClick={() => signIn('google', { callbackUrl: '/profile/complete' })}
                        className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] transition-all group"
                      >
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all" />
                        Google Sign-up
                      </button>
                    </motion.div>
                  )}

                  {signupStep === 2 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Chess Platform</label>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.values(ChessPlatform).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setSignupData({...signupData, platform: p, rating: null})}
                              className={`py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${
                                signupData.platform === p 
                                  ? 'bg-brand-orange/10 border-brand-orange/40 text-brand-orange shadow-lg shadow-brand-orange/5' 
                                  : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/10'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">In-Game Username</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1 group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                            <input
                              type="text"
                              className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700"
                              placeholder="Platform ID"
                              value={signupData.chessUsername}
                              onChange={e => setSignupData({...signupData, chessUsername: e.target.value, rating: null})}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyChess}
                            disabled={verifying || !signupData.chessUsername}
                            className="bg-brand-orange text-white px-6 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center min-w-[64px] active:scale-95"
                          >
                            {verifying ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {signupData.rating !== null && (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4"
                          >
                            <Trophy className="h-6 w-6 text-emerald-500 shrink-0" />
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Account Verified</p>
                              <p className="text-2xl font-black text-white">{signupData.rating} <span className="text-xs text-slate-500 font-bold tracking-normal">ELO</span></p>
                            </div>
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-3 pt-4">
                        <button 
                          type="button" 
                          onClick={() => setSignupStep(1)} 
                          className="w-1/3 h-14 rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/[0.08] transition-all"
                        >
                          Back
                        </button>
                        <Button 
                          type="button" 
                          onClick={handleTriggerOTP}
                          isLoading={isSendingOtp}
                          disabled={!signupData.rating} 
                          className="flex-1 h-14 bg-brand-orange text-white rounded-2xl uppercase font-black text-xs tracking-widest active:scale-95"
                        >
                          Final Audit <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {signupStep === 3 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8 text-center"
                    >
                      <div className="w-20 h-20 bg-brand-orange/10 rounded-[2rem] flex items-center justify-center mx-auto mb-2 border border-brand-orange/20 shadow-lg shadow-brand-orange/5">
                        <KeyRound className="text-brand-orange h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Identity Check</h3>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">System sent a code to <br/><span className="text-white">{signupData.email}</span></p>
                      </div>

                      <div className="space-y-3 text-left">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">OTP Access Code</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-white focus:border-brand-orange/30 outline-none transition-all placeholder-slate-800"
                          placeholder="000000"
                          value={otp}
                          onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          type="button" 
                          onClick={() => setSignupStep(2)} 
                          className="w-1/3 h-14 rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/[0.08] transition-all"
                        >
                          Change
                        </button>
                        <Button 
                          type="submit" 
                          isLoading={loading}
                          disabled={otp.length !== 6} 
                          className="flex-1 h-14 bg-brand-orange text-white rounded-2xl uppercase font-black text-xs tracking-widest shadow-xl shadow-brand-orange/20"
                        >
                          Forge Profile
                        </Button>
                      </div>

                      <button 
                        type="button" 
                        onClick={handleTriggerOTP}
                        disabled={isSendingOtp}
                        className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] hover:text-brand-orange transition-colors disabled:opacity-50"
                      >
                        {isSendingOtp ? 'SENDING...' : "Request new code"}
                      </button>
                    </motion.div>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-brand-orange h-12 w-12" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
