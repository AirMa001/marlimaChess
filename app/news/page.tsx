'use client';

import React, { useEffect, useState } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  ArrowLeft, 
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import Link from 'next/link';

const ITEMS_PER_PAGE = 10;

export default function NewsPage() {
  const [allNews, setAllNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) setAllNews(await res.json());
      } catch (e) {
        console.error("News load error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  const filtered = allNews.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedNews = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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
            <Newspaper className="text-blue-500 h-6 w-6" />
            <span className="text-blue-500 font-black tracking-[0.3em] text-xs uppercase">Press Release</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">Tournament News</h1>
        </div>

        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search Publications..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-blue-500/50 outline-none transition-all w-full font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/[0.02] rounded-[2.5rem] animate-pulse border border-white/5" />)}
        </div>
      ) : paginatedNews.length === 0 ? (
        <div className="py-32 text-center bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5">
          <Newspaper className="h-16 w-16 text-slate-800 mx-auto mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">No Articles Found</h3>
          <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] max-w-xs mx-auto leading-relaxed">No official reports match your current query.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {paginatedNews.map((item, i) => (
                <motion.a
                  key={item.link}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col p-8 bg-white/[0.02] backdrop-blur-md rounded-[2.5rem] border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden shadow-2xl"
                >
                  <div className="flex flex-col sm:flex-row gap-6 mb-8">
                    {item.imageUrl && (
                      <div className="w-full sm:w-48 h-32 shrink-0 rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-black/20">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h3 className="font-black text-xl text-white group-hover:text-blue-400 transition-colors line-clamp-2 uppercase tracking-tight leading-snug">
                          {item.title}
                        </h3>
                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all shrink-0 border border-white/5 shadow-inner">
                          <ExternalLink size={20} />
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm line-clamp-4 leading-relaxed font-medium opacity-80">
                        {item.content}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-black tracking-widest uppercase mt-auto pt-6 border-t border-white/5">
                    <span className="text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-lg border border-brand-orange/20 shadow-lg shadow-brand-orange/5">{item.source}</span>
                    <span className="text-slate-600">{new Date(item.pubDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-10">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-black text-xs tracking-widest transition-all border ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40 scale-110' 
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}