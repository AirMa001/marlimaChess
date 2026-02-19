'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  ArrowLeft,
  Search,
  User,
  Calendar,
  Loader2,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AwardsPage() {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchAwards() {
      try {
        const res = await fetch('/api/awards');
        if (res.ok) setAwards(await res.json());
      } catch (e) {
        console.error("Awards load error");
      } finally {
        setLoading(false);
      }
    }
    fetchAwards();
  }, []);

  const filtered = awards.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20 space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-[0.2em] transition-colors mb-4">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Award className="text-brand-orange h-6 w-6" />
            <span className="text-brand-orange font-black tracking-[0.3em] text-xs uppercase">Excellence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">Achievement Registry</h1>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-orange transition-colors" />
          <input 
            type="text"
            placeholder="Search Recipients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/[0.02] rounded-[2.5rem] animate-pulse border border-white/5" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5">
          <Trophy className="h-16 w-16 text-slate-800 mx-auto mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Registry Silent</h3>
          <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] max-w-xs mx-auto">No official awards have been issued in this record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filtered.map((award, i) => (
            <motion.div
              key={award.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -8 }}
              className="group bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-brand-orange/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex items-center gap-6 transition-all duration-500"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center text-4xl border border-white/5 relative z-10 shadow-inner group-hover:bg-brand-orange/10 group-hover:border-brand-orange/20 transition-all duration-500">
                {award.icon || "🏆"}
              </div>

              <div className="flex-1 space-y-2 relative z-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-brand-orange transition-colors">
                  {award.title}
                </h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                    <User size={12} className="text-slate-700" />
                    <span className="text-slate-400 group-hover:text-white transition-colors">{award.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest">
                    <Calendar size={12} className="text-slate-800" />
                    {new Date(award.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}