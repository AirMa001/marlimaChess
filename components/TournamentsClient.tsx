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
    <div className="min-h-screen space-y-10 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Trophy className="text-brand-orange h-6 w-6" />
            <span className="text-brand-orange font-black tracking-[0.3em] text-xs uppercase">Events</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight">Tournament Center</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all w-full"
            />
          </div>
          
          <Link href={session ? "/tournaments/new" : "/login?mode=signup"}>
            <Button className="h-12 px-6 bg-brand-orange text-white hover:bg-white hover:text-slate-950 font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-orange/20 transition-all">
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-2xl border border-white/5 w-fit overflow-x-auto max-w-full">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStatus(tab.id)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeStatus === tab.id ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-32 text-center bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-white/5">
          <Clock className="h-16 w-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">No Tournaments</h3>
          <p className="text-slate-500 max-w-xs mx-auto">No {activeStatus.toLowerCase()} tournaments found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <motion.div
                layout
                key={t.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -8 }}
                className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-brand-orange/30 transition-all duration-500 overflow-hidden relative p-8 rounded-[2.5rem]"
              >
                <Link href={`/tournaments/${t.id}`} className="absolute inset-0 z-30" />
                
                {t.image && (
                  <div className="absolute top-0 left-0 w-full h-32 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                    <img src={t.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex justify-between items-start relative z-20">
                    <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black tracking-widest uppercase ${
                      t.status === 'ONGOING' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      t.status === 'FINISHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
                    }`}>
                      {t.status}
                    </div>
                    <Trophy size={24} className="text-brand-orange/40 group-hover:text-brand-orange transition-colors" />
                  </div>

                  <div className="flex-1 relative z-20">
                    <h3 className="text-2xl font-black text-white group-hover:text-brand-orange transition-colors uppercase tracking-tight line-clamp-1">
                      {t.name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-2">
                      {t.description && <p className="text-slate-500 text-sm line-clamp-1 font-medium">{t.description}</p>}
                      {t.organizer?.name && (
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          Organized By <span className="text-slate-400">{t.organizer.name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 relative z-20 pt-4">
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-wider">
                      <Calendar size={16} className="text-brand-orange" />
                      {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-wider">
                      <Users size={16} className="text-blue-500" />
                      {t.players?.length || 0} Registered
                    </div>
                  </div>
                </div>

                <div className="mt-8 relative z-20">
                  <Button variant="ghost" className="bg-brand-orange/10 hover:bg-brand-orange text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-300 w-full py-4 rounded-2xl">
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
