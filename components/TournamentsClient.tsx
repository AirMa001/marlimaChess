  'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight, 
  Swords, 
  Search,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface TournamentsClientProps {
  initialTournaments: any[];
}

export default function TournamentsClient({ initialTournaments }: TournamentsClientProps) {
  const { data: session } = useSession();
  const [tournaments, setTournaments] = useState<any[]>(initialTournaments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('UPCOMING');

  const filtered = tournaments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = t.status === activeStatus;
    return matchesSearch && matchesStatus;
  });

  const statusTabs = [
    { id: 'UPCOMING', label: 'Upcoming', icon: Calendar },
    { id: 'ONGOING', label: 'Ongoing', icon: Swords },
    { id: 'FINISHED', label: 'Finished', icon: Trophy },
  ];

  return (
    <div className="min-h-screen space-y-6 sm:space-y-10 pb-20">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-orange h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-brand-orange font-black text-[10px] sm:text-xs">Events</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">Tournament Center</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 focus:border-brand-orange/50 outline-none transition-all w-full shadow-sm"
            />
          </div>
          
          <Link href={session ? "/tournaments/new" : "/login?mode=signup"} className="w-full sm:w-auto">
            <Button className="h-12 w-full px-6 bg-brand-orange text-white hover:bg-slate-900 font-black text-[10px] sm:text-xs shadow-xl shadow-brand-orange/20 transition-all">
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 bg-white/80 backdrop-blur-xl p-1 rounded-2xl border border-slate-200/50 w-full lg:w-fit overflow-x-auto shadow-sm no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStatus(tab.id)}
            className={`flex-1 lg:flex-none px-4 lg:px-8 py-3.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeStatus === tab.id ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 sm:py-32 text-center bg-white/70 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3rem] border-2 border-dashed border-slate-200 shadow-xl px-6">
          <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">No Tournaments</h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm sm:text-base">No {activeStatus.toLowerCase()} tournaments found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <motion.div
                layout
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -8 }}
                className="group bg-white/70 backdrop-blur-xl border border-white hover:border-brand-orange/30 transition-all duration-500 overflow-hidden relative p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl"
              >
                <Link href={`/tournaments/${t.id}`} className="absolute inset-0 z-30" />
                
                {t.image && (
                  <div className="absolute top-0 left-0 w-full h-32 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <img src={t.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                  </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-between items-start relative z-20">
                    <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border text-[9px] sm:text-[10px] font-black ${
                      t.status === 'ONGOING' ? 'bg-green-50 text-white border-green-600 shadow-lg shadow-green-500/20' : 
                      t.status === 'FINISHED' ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/20' :
                      'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20'
                    }`}>
                      {t.status}
                    </div>
                    <Trophy size={20} className="text-brand-orange/30 group-hover:text-brand-orange transition-colors sm:size-6" />
                  </div>

                  <div className="flex-1 relative z-20">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-brand-orange transition-colors tracking-tight line-clamp-1 leading-none">
                      {t.name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-2">
                      {t.description && <p className="text-slate-500 text-[13px] sm:text-sm line-clamp-1 font-medium">{t.description}</p>}
                      {t.organizer?.name && (
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-400">
                          Organized By <span className="text-slate-600">{t.organizer.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 sm:gap-6 relative z-20 pt-2 sm:pt-4">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] sm:text-sm tracking-wider">
                      <Calendar size={14} className="text-brand-orange sm:size-4" />
                      {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[11px] sm:text-sm tracking-wider">
                      <Users size={14} className="text-blue-500 sm:size-4" />
                      {t.players?.length || 0} Registered
                    </div>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8 relative z-20">
                  <Button variant="ghost" className="bg-slate-50 hover:bg-brand-orange hover:text-white font-black text-[9px] sm:text-[10px] transition-all duration-300 w-full py-3 sm:py-4 rounded-2xl border-slate-100 shadow-sm">
                    {t.status === 'UPCOMING' ? 'Join Tournament' : 'View Details'} <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
