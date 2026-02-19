'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Calendar, 
  FileText, 
  Hash, 
  ArrowLeft,
  Loader2,
  Zap,
  Globe,
  Clock,
  Image as ImageIcon,
  X,
  Upload,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';
import { uploadImageAction } from '@/app/actions';
import { useSession } from 'next-auth/react';

const TIME_PRESETS = [
  { label: 'Blitz', value: '3+2' },
  { label: 'Rapid', value: '10+5' },
  { label: 'Classic', value: '30+0' },
  { label: 'Bullet', value: '1+0' },
];

export default function NewTournamentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    totalRounds: 5,
    timeControl: '10+5',
    location: '',
    image: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error("Unauthorized", { description: "Please login to forge a tournament." });
      router.replace('/login?mode=signup');
    }
  }, [status, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", { description: "Maximum size is 5MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedImageUrl = '';
      if (imagePreview) {
        uploadedImageUrl = await uploadImageAction(imagePreview);
      }

      const res = await fetch('/api/tournaments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image: uploadedImageUrl
        }),
      });

      if (!res.ok) throw new Error('Creation failed');

      toast.success("Tournament Proclaimed!", { description: "The arena is now open for players." });
      router.push('/tournaments');
      router.refresh();
    } catch (error) {
      toast.error("Process Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoundsChange = (val: string) => {
    const num = parseInt(val);
    setFormData({ ...formData, totalRounds: isNaN(num) ? 0 : num });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-orange h-12 w-12" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen pb-20 max-w-3xl mx-auto space-y-10 px-4">
      {/* Navigation */}
      <Link href="/tournaments" className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors">
        <ArrowLeft size={14} /> Back to Hub
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Zap className="text-brand-orange h-6 w-6" />
          <span className="text-brand-orange font-black tracking-[0.3em] text-xs uppercase">Founder Mode</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">Forge Arena</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-orange/5 blur-3xl rounded-full" />
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-6">
            {/* Image Upload Field */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Tournament Flier (Optional)</label>
              <div 
                onClick={() => !imagePreview && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden min-h-[200px] cursor-pointer ${
                  imagePreview ? 'border-brand-orange/50 bg-slate-950/50' : 'border-white/5 bg-slate-950/30 hover:border-brand-orange/30 hover:bg-slate-950/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <AnimatePresence mode="wait">
                  {imagePreview ? (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full group/img"
                    >
                      <img src={imagePreview} alt="Flier Preview" className="w-full h-auto max-h-[400px] object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md"
                        >
                          <Upload size={20} />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); removeImage(); }}
                          className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-500 backdrop-blur-md"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center p-8"
                    >
                      <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-orange/20">
                        <ImageIcon className="text-brand-orange h-8 w-8" />
                      </div>
                      <p className="text-white font-bold text-sm">Upload Event Flier</p>
                      <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-black">Click or drag & drop</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Event Title</label>
              <div className="relative">
                <Trophy className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Grandmaster Blitz Championship"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/50 outline-none transition-all placeholder-slate-700 font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Event Overview</label>
              <div className="relative">
                <FileText className="absolute left-5 top-6 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                <textarea
                  placeholder="Rules, prizes, and specific terms..."
                  rows={3}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/50 outline-none transition-all placeholder-slate-700 font-medium resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Venue Location</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Physical address or online platform"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/50 outline-none transition-all placeholder-slate-700 font-bold"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            {/* Time Control Section */}
            <div className="group">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Time Control Strategy</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {TIME_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({...formData, timeControl: p.value})}
                    className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${
                      formData.timeControl === p.value 
                        ? 'bg-brand-orange/10 border-brand-orange text-brand-orange' 
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {p.label} ({p.value})
                  </button>
                ))}
              </div>
              <div className="relative">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Custom (e.g. 5+3)"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/50 outline-none transition-all placeholder-slate-700 font-bold"
                  value={formData.timeControl}
                  onChange={e => setFormData({...formData, timeControl: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Deployment Date (Start)</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/50 outline-none transition-all font-bold"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Planned Rounds</label>
                <div className="relative">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/50 outline-none transition-all font-bold"
                    value={formData.totalRounds || ''}
                    onChange={e => handleRoundsChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <Button type="submit" isLoading={loading} className="w-full h-16 text-sm font-black tracking-[0.2em] uppercase shadow-2xl shadow-brand-orange/10">
              {loading ? "Forging..." : "Launch Tournament"} <Globe className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}