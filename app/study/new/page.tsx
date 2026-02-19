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
  Video,
  File as FilePdf,
  Link as LinkIcon,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';
import { uploadImageAction } from '@/app/actions';
import { useSession } from 'next-auth/react';

const MEDIA_TYPES = [
  { id: 'TEXT', label: 'Analysis', icon: FileText },
  { id: 'IMAGE', label: 'Diagram', icon: ImageIcon },
  { id: 'VIDEO', label: 'Lecture', icon: Video },
  { id: 'PDF', label: 'Document', icon: FilePdf },
  { id: 'LINK', label: 'Web Link', icon: LinkIcon },
];

export default function NewStudyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TEXT',
    content: '',
    mediaUrl: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?mode=signup');
    }
  }, [status, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum size is 10MB" });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalMediaUrl = formData.mediaUrl;
      
      // Upload if it's a file (Image or PDF)
      if (preview && (formData.type === 'IMAGE' || formData.type === 'PDF')) {
        finalMediaUrl = await uploadImageAction(preview);
      }

      const res = await fetch('/api/study/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          mediaUrl: finalMediaUrl
        }),
      });

      if (!res.ok) throw new Error('Creation failed');

      toast.success("Resource Published", { description: "Your material is now available in the library." });
      router.push('/study');
      router.refresh();
    } catch (error) {
      toast.error("Process Failed");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-orange h-12 w-12" /></div>;
  if (!session) return null;

  return (
    <div className="min-h-screen pb-20 max-w-3xl mx-auto space-y-10 px-4">
      {/* Navigation */}
      <Link href="/study" className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-[0.2em] transition-colors mb-4">
        <ArrowLeft size={14} /> Back to Library
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-orange h-6 w-6" />
          <span className="text-brand-orange font-black tracking-[0.3em] text-xs uppercase">Academy Contributor</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">Publish Resource</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-6 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-brand-orange/5 blur-3xl rounded-full" />
        
        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
          {/* Media Type Picker */}
          <div className="space-y-4">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 opacity-60">Resource Classification</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {MEDIA_TYPES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setFormData({...formData, type: m.id}); setPreview(null); }}
                  className={`py-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                    formData.type === m.id 
                      ? 'bg-brand-orange/10 border-brand-orange/40 text-brand-orange shadow-lg shadow-brand-orange/5' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  <m.icon size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 opacity-60">Resource Title</label>
              <div className="relative">
                <FileText className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Fundamental Endgame Principles"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700 font-bold"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
            </div>

            {/* Conditional Content/Media Fields */}
            {formData.type === 'TEXT' ? (
              <div className="group">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 opacity-60">Analysis Content</label>
                <textarea
                  required
                  placeholder="Provide detailed instruction or analysis..."
                  rows={8}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700 font-medium resize-none leading-relaxed"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>
            ) : (formData.type === 'VIDEO' || formData.type === 'LINK') ? (
              <div className="group">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 opacity-60">
                  {formData.type === 'VIDEO' ? 'Source URL (YouTube/Vimeo)' : 'Web Reference URL'}
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:border-brand-orange/30 outline-none transition-all font-bold"
                    value={formData.mediaUrl}
                    onChange={e => setFormData({...formData, mediaUrl: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div className="group">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 opacity-60">File Upload ({formData.type})</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-[2rem] transition-all duration-300 flex flex-col items-center justify-center min-h-[180px] cursor-pointer ${
                    preview ? 'border-brand-orange/40 bg-brand-orange/5' : 'border-white/5 bg-white/[0.02] hover:border-brand-orange/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept={formData.type === 'PDF' ? '.pdf' : 'image/*'} />
                  {preview ? (
                    <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-orange/20">
                        <CheckCircle2 className="text-brand-orange" />
                      </div>
                      <p className="text-white font-black uppercase text-[10px] tracking-widest">Document Staged</p>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(null); }} className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-3 hover:text-red-400 transition-colors">Replace Selection</button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Upload className="text-slate-600" />
                      </div>
                      <p className="text-white font-black uppercase text-[10px] tracking-widest opacity-60">Select tactical resource</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-1 opacity-60">Resource Overview (Brief)</label>
              <input
                type="text"
                placeholder="A concise summary of the content..."
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white focus:border-brand-orange/30 outline-none transition-all placeholder-slate-700 font-bold"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <Button type="submit" isLoading={loading} className="w-full h-16 text-xs font-black tracking-[0.3em] uppercase shadow-2xl shadow-brand-orange/10 bg-brand-orange hover:bg-white text-white hover:text-slate-950 transition-all rounded-[1.5rem]">
              {loading ? "Publishing..." : "Finalize Publication"} <Globe className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}