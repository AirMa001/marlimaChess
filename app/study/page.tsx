'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File as FilePdf,
  Search,
  ExternalLink,
  Loader2,
  Link as LinkIcon,
  Maximize2,
  ChevronRight,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import MediaViewer from '@/components/MediaViewer';

export default function StudyHub() {
  const { data: session } = useSession();
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  
  // Media Viewer State
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  useEffect(() => {
    async function fetchStudies() {
      try {
        const res = await fetch('/api/study');
        if (res.ok) setStudies(await res.json());
      } catch (e) {
        toast.error("Library load failed");
      } finally {
        setLoading(false);
      }
    }
    fetchStudies();
  }, []);

  const filtered = studies.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                         s.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || s.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getIconData = (type: string) => {
    switch (type) {
      case 'IMAGE': return { icon: ImageIcon, color: "text-emerald-500" };
      case 'VIDEO': return { icon: Video, color: "text-red-500" };
      case 'PDF': return { icon: FilePdf, color: "text-blue-500" };
      case 'LINK': return { icon: LinkIcon, color: "text-orange-500" };
      default: return { icon: FileText, color: "text-slate-400" };
    }
  };

  return (
    <div className="min-h-screen pb-20 space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand-orange h-6 w-6" />
            <span className="text-brand-orange font-black tracking-[0.3em] text-xs uppercase">Academy</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">Resource Library</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text"
              placeholder="Search Repository..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all w-full font-medium"
            />
          </div>
          
          <Link href="/study/new">
            <Button className="h-12 px-6 bg-brand-orange text-white hover:bg-white hover:text-slate-950 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-orange/20 transition-all rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Add Material
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5 w-fit overflow-x-auto max-w-full shadow-inner">
        {['ALL', 'TEXT', 'IMAGE', 'VIDEO', 'PDF', 'LINK'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white/[0.02] rounded-[2.5rem] animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5">
          <FileText className="h-16 w-16 text-slate-800 mx-auto mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Library Empty</h3>
          <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] max-w-xs mx-auto">No instructional materials found matching the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((s, i) => {
            const { icon: Icon, color } = getIconData(s.type);
            return (
              <motion.div
                layout
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                className="group bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-brand-orange/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl shadow-black/40"
              >
                {/* Media Preview */}
                <div 
                  onClick={() => (s.type === 'IMAGE' || s.type === 'VIDEO' || s.type === 'PDF') && setSelectedMedia(s)}
                  className={`relative aspect-video bg-black/40 flex items-center justify-center overflow-hidden ${(s.type === 'IMAGE' || s.type === 'VIDEO' || s.type === 'PDF') ? 'cursor-zoom-in' : ''}`}
                >
                  {s.type === 'IMAGE' && s.mediaUrl ? (
                    <img src={s.mediaUrl} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className={`text-slate-800 group-hover:text-brand-orange/20 transition-colors duration-500`}>
                      <Icon size={80} strokeWidth={1} />
                    </div>
                  )}
                  
                  {/* Hover Overlay for Viewer */}
                  {(s.type === 'IMAGE' || s.type === 'VIDEO' || s.type === 'PDF') && (
                    <div className="absolute inset-0 bg-brand-orange/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="p-4 bg-brand-orange text-white rounded-2xl shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <Maximize2 size={24} />
                      </div>
                    </div>
                  )}

                  <div className="absolute top-6 left-6 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Icon size={12} className={color} /> {s.type}
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1 space-y-4">
                  <h3 className="text-xl font-black text-white group-hover:text-brand-orange transition-colors uppercase tracking-tight line-clamp-1 leading-tight">
                    {s.title}
                  </h3>
                  
                  <p className="text-slate-500 text-sm line-clamp-2 font-medium leading-relaxed opacity-80">
                    {s.description || s.content}
                  </p>

                  <div className="pt-6 mt-auto border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-slate-600 text-[10px] border border-white/5">
                        {s.author?.name?.[0]}
                      </div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{s.author?.name}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {(s.type === 'IMAGE' || s.type === 'VIDEO' || s.type === 'PDF') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedMedia(s); }}
                          className="bg-white/5 hover:bg-brand-orange text-white h-10 px-5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-lg"
                        >
                          {s.type === 'PDF' ? 'Download' : 'Review'}
                        </button>
                      )}
                      <Link href={s.mediaUrl || '#'} target="_blank">
                        <Button variant="ghost" className="bg-white/5 hover:bg-brand-orange text-white h-10 w-10 p-0 rounded-xl transition-all border border-white/5">
                          <ExternalLink size={14} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Unified Media Viewer */}
      {selectedMedia && (
        <MediaViewer 
          isOpen={!!selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          type={selectedMedia.type} 
          url={selectedMedia.mediaUrl} 
          title={selectedMedia.title || ''} 
        />
      )}
    </div>
  );
}