'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { 
  Calendar, 
  Trophy, 
  ExternalLink, 
  ArrowRight, 
  Swords, 
  Newspaper, 
  ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/Button";

interface HomeClientProps {
  initialTournaments: any[];
  initialNews: any[];
  isLoggedIn: boolean;
}

export default function HomeClient({ initialTournaments, initialNews, isLoggedIn }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'news'>('tournaments');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const tabVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 500 : -500,
      opacity: 0
    })
  };

  const direction = activeTab === 'tournaments' ? -1 : 1;

  return (
    <div className="space-y-10 sm:space-y-16 pb-20 overflow-hidden">
      {/* 3D Hero Section */}
      <section className="relative perspective-1000 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3.5rem] border border-white/10 p-8 md:p-20 shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-brand-orange/20 blur-[100px] rounded-full animate-pulse" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10 max-w-3xl text-center md:text-left">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-8xl font-black text-white leading-none mb-6 tracking-tighter"
            >
              MARLIMA<span className="text-brand-orange">CHESS</span>
            </motion.h1>
            <p className="text-slate-400 font-black uppercase text-[10px] sm:text-xs tracking-[0.4em] opacity-60">Elite Tournament Management System</p>
          </div>
        </motion.div>
      </section>

      {/* Tab Switcher */}
      <div className="flex justify-center px-4">
        <div className="bg-white/[0.03] backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 flex relative overflow-hidden shadow-2xl w-full max-w-sm sm:w-80">
          <motion.div
            className="absolute inset-y-1.5 rounded-xl bg-brand-orange shadow-lg shadow-brand-orange/30"
            initial={false}
            animate={{ x: activeTab === 'tournaments' ? 0 : '100%' }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            style={{ width: 'calc(50% - 6px)', left: '3px' }}
          />
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`relative z-10 flex-1 py-3 text-[10px] font-black tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'tournaments' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Swords size={14} /> TOURNAMENTS
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`relative z-10 flex-1 py-3 text-[10px] font-black tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'news' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Newspaper size={14} /> NEWS
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[600px] px-4">
        <AnimatePresence mode="wait" custom={direction}>
          {activeTab === 'tournaments' ? (
            <motion.section 
              key="tournaments"
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-10"
            >
              <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="text-brand-orange h-5 w-5" />
                    <span className="text-brand-orange font-black tracking-[0.3em] text-[10px] uppercase">Upcoming</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">Active Events</h2>
                </div>
                <Link href="/tournaments" className="group text-slate-500 hover:text-white transition-colors font-black text-[10px] tracking-widest flex items-center gap-2 mb-1">
                  VIEW ALL <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {initialTournaments.length === 0 ? (
                <div className="p-16 text-center border border-white/5 bg-white/[0.02] rounded-[3rem] shadow-2xl">
                  <Trophy className="h-12 w-12 text-slate-800 mx-auto mb-4 opacity-20" />
                  <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">No active tournaments scheduled</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {initialTournaments.map((t) => (
                    <motion.div
                      key={t.id}
                      whileHover={{ y: -8 }}
                      className="group relative bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 p-8 hover:border-brand-orange/30 transition-all duration-500 overflow-hidden shadow-2xl"
                    >
                      <Link href={`/tournaments/${t.id}`} className="absolute inset-0 z-30" />
                      
                      {t.image && (
                        <div className="absolute top-0 left-0 w-full h-32 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
                          <img src={t.image} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617]" />
                        </div>
                      )}

                      <div className="flex justify-between items-start mb-8 relative z-20">
                        <span className="px-4 py-1.5 rounded-full border border-brand-orange/20 bg-brand-orange/10 text-brand-orange text-[9px] font-black tracking-[0.2em] uppercase">
                          {t.status}
                        </span>
                        <Trophy size={20} className="text-brand-orange/40 group-hover:text-brand-orange transition-colors" />
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-3 group-hover:text-brand-orange transition-colors line-clamp-2 uppercase tracking-tight relative z-20 leading-none">
                        {t.name}
                      </h3>

                      {t.organizer?.name && (
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-8 relative z-20">
                          Authorized By <span className="text-slate-400">{t.organizer.name}</span>
                        </p>
                      )}
                      
                      <div className="space-y-4 mb-10 relative z-20">
                        <div className="flex items-center gap-3 text-slate-400 font-bold text-xs">
                          <Calendar size={16} className="text-brand-orange" />
                          {new Date(t.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="relative z-20">
                        <Button className="w-full py-4 bg-brand-orange text-white rounded-2xl transition-all duration-300 font-black text-[10px] tracking-[0.2em] uppercase shadow-lg shadow-brand-orange/10 border-none">
                          View Details
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            <motion.section 
              key="news"
              custom={direction}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-10"
            >
              <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Newspaper className="text-blue-500 h-5 w-5" />
                    <span className="text-blue-500 font-black tracking-[0.3em] text-[10px] uppercase">Intelligence</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">Chess Updates</h2>
                </div>
                <Link href="/news" className="group text-slate-500 hover:text-white transition-colors font-black text-[10px] tracking-widest flex items-center gap-2 mb-1">
                  VIEW ALL <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {initialNews.map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -8 }}
                    className="group flex flex-col p-10 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden shadow-2xl"
                  >
              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                {item.imageUrl && (
                  <div className="w-full sm:w-48 h-32 shrink-0 rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-black/20">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="font-black text-xl text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 text-blue-400 transition-all shrink-0 border border-white/5 shadow-inner">
                      <ExternalLink size={20} />
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm line-clamp-3 leading-relaxed font-medium opacity-80">
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
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
