'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock, 
  Hash, 
  ArrowLeft, 
  Swords, 
  ChevronRight, 
  ChevronDown,
  Info,
  Settings,
  Shield,
  MapPin,
  Timer,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'pairings' | 'standings'>('info');
  const [expandedRounds, setExpandedRounds] = useState<number[]>([]);
  const [expandedPlayerMatches, setExpandedPlayerMatches] = useState<string | null>(null);

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => 
      prev.includes(round) ? prev.filter(r => r !== round) : [...prev, round]
    );
  };

  const togglePlayerMatches = (playerId: string) => {
    setExpandedPlayerMatches(prev => prev === playerId ? null : playerId);
  };

  // @ts-ignore
  const isOrganizer = session?.user?.id === tournament?.organizerId;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function fetchDetails(silent = false) {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/tournaments/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setTournament(data);
        
        if (!silent) {
          if (data.status === 'ONGOING' || data.status === 'FINISHED') {
            setActiveTab('standings');
          }
          if (data.matches && data.matches.length > 0) {
            const rounds = data.matches.map((m: any) => m.round);
            const latestRound = Math.max(...rounds);
            setExpandedRounds([latestRound]);
          }
        }
      } catch (e) {
        if (!silent) {
          toast.error("Tournament not found");
          router.push('/tournaments');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    }

    if (id) {
      fetchDetails();
      interval = setInterval(() => fetchDetails(true), 10000);
    }

    return () => { if (interval) clearInterval(interval); };
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) return null;

  const DetailItem = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex items-center gap-4 group">
      <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${color} transition-all group-hover:scale-110 shadow-lg`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-white uppercase tracking-tight leading-tight truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 space-y-10 max-w-6xl mx-auto px-4 pt-6">
      {/* Top Header */}
      <div className="flex flex-col gap-6">
        <Link href="/tournaments" className="inline-flex items-center gap-2 text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-[0.2em] transition-colors w-fit">
          <ArrowLeft size={14} /> Back to Hub
        </Link>

        <div className="space-y-4">
          <div className={`inline-flex px-4 py-1.5 rounded-full border text-[10px] font-black tracking-[0.2em] uppercase ${
            tournament.status === 'ONGOING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
            tournament.status === 'FINISHED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-brand-orange/10 text-brand-orange border-brand-orange/20'
          }`}>
            {tournament.status}
          </div>
          <h1 className="text-4xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] max-w-4xl">
            {tournament.name}
          </h1>
          {tournament.organizer?.name && (
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Officially Organized By <span className="text-brand-orange">{tournament.organizer.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
        
        {/* Left Column - Poster & Overview */}
        <div className="lg:col-span-7 space-y-12">
          {tournament.image && (
            <motion.div 
              initial={{ rotateX: 10, rotateY: -10, opacity: 0 }}
              animate={{ rotateX: 0, rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative group perspective-[2000px]"
            >
              <div className="relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-slate-950 transform-gpu transition-all duration-700 group-hover:scale-[1.02] group-hover:rotate-1 group-hover:shadow-brand-orange/10">
                <img 
                  src={tournament.image} 
                  alt={tournament.name} 
                  className="w-full h-auto block"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              </div>
              
              <div className="absolute -inset-4 bg-brand-orange/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </motion.div>
          )}

          <div className="space-y-6 px-2">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-brand-orange" />
              <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">Engagement Protocol</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Info size={24} className="text-brand-orange" />
                Tournament Overview
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                {tournament.description || "No overview provided. Standard tournament rules apply. Please contact the organizer for specific details regarding pairings and play clock."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Info Card & Tabs */}
        <div className="lg:col-span-5 space-y-8">
          {/* Navigation Tabs (Professional Inline Style) */}
          <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md">
            {[
              { id: 'info', label: 'Info', icon: Shield },
              { id: 'pairings', label: 'Matches', icon: Swords },
              { id: 'standings', label: 'Ranks', icon: Trophy },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-brand-orange text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div 
                key="info-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Special Info Card */}
                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full transition-all group-hover:bg-brand-orange/10" />
                  
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                    <Trophy size={14} className="text-brand-orange" /> 
                    Core Event Info
                  </h3>

                  <div className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 gap-8">
                      <DetailItem 
                        icon={Calendar} 
                        label="Event Date" 
                        value={new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
                        color="text-brand-orange"
                      />
                      <DetailItem 
                        icon={Clock} 
                        label="Start Time" 
                        value={new Date(tournament.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} 
                        color="text-emerald-500"
                      />
                      <DetailItem 
                        icon={MapPin} 
                        label="Location" 
                        value={tournament.location || "Physical Venue"} 
                        color="text-blue-500"
                      />
                      <DetailItem 
                        icon={Timer} 
                        label="Time Control" 
                        value={tournament.timeControl || "10+5"} 
                        color="text-purple-500"
                      />
                      <DetailItem 
                        icon={Hash} 
                        label="Rounds" 
                        value={`${tournament.totalRounds} Rounds`} 
                        color="text-yellow-500"
                      />
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Organizer Identity</h4>
                      <div className="space-y-4">
                        <DetailItem 
                          icon={Phone} 
                          label="Phone Number" 
                          value={tournament.contactPhone || "Not provided"} 
                          color="text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Independent Join Button */}
                <div className="space-y-4">
                  {tournament.status === 'UPCOMING' ? (
                    <Link href={session ? `/register?tournamentId=${tournament.id}` : "/login?mode=signup"}>
                      <Button className="w-full h-20 bg-brand-orange hover:bg-white hover:text-slate-950 text-white font-black uppercase text-sm tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(255,107,1,0.3)] transition-all rounded-[2rem] group relative overflow-hidden">
                        <span className="relative z-10 flex items-center justify-center gap-4">
                          JOIN TOURNAMENT <Swords className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="w-full p-6 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-white/5 text-center shadow-xl">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic opacity-60">Registration Protocol Offline</p>
                    </div>
                  )}

                  {isOrganizer && (
                    <Link href={`/admin?tournamentId=${tournament.id}`} className="block">
                      <Button variant="ghost" className="w-full h-16 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-widest rounded-[1.5rem] border border-white/5 shadow-xl transition-all">
                        <Settings className="mr-3 h-5 w-5" /> Administrator Dashboard
                      </Button>
                    </Link>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'pairings' && (
              <motion.div 
                key="pairings-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {(!tournament.matches || tournament.matches.length === 0) ? (
                  <div className="py-20 text-center bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-white/5">
                    <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] opacity-60">Pairings Not Generated</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(
                      tournament.matches.reduce((acc: any, m: any) => {
                        if (!acc[m.round]) acc[m.round] = [];
                        acc[m.round].push(m);
                        return acc;
                      }, {})
                    ).sort((a: any, b: any) => b[0] - a[0]).map(([round, matches]: [string, any]) => (
                      <div key={round} className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden shadow-lg">
                        <button 
                          onClick={() => toggleRound(parseInt(round))}
                          className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-black text-white uppercase tracking-widest">Round {round}</span>
                          <ChevronDown className={`text-slate-500 transition-transform ${expandedRounds.includes(parseInt(round)) ? 'rotate-180' : ''}`} size={16} />
                        </button>
                        <AnimatePresence>
                          {expandedRounds.includes(parseInt(round)) && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-4 pb-4">
                              <div className="space-y-2">
                                {/* --- ♟️ TABLE SORTING ADDED HERE ♟️ --- */}
                                {[...matches].sort((a: any, b: any) => {
                                  const aPoints = (a.whitePlayer?.tournamentPoints || a.whitePlayer?.score || 0) + (a.blackPlayer?.tournamentPoints || a.blackPlayer?.score || 0);
                                  const bPoints = (b.whitePlayer?.tournamentPoints || b.whitePlayer?.score || 0) + (b.blackPlayer?.tournamentPoints || b.blackPlayer?.score || 0);
                                  return bPoints - aPoints; // Highest points at the top
                                }).map((m: any, index: number) => (
                                  <div key={m.id} className="bg-black/20 p-4 rounded-xl flex justify-between items-center text-[10px] font-black uppercase border border-white/5">
                                    <div className="flex items-center w-28">
                                      {/* Visual index correctly labels top match as T1 */}
                                      <span className="text-[8px] text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-md mr-2 font-bold whitespace-nowrap">T{index + 1}</span>
                                      <span className="text-slate-400 truncate">{m.whitePlayer?.fullName}</span>
                                    </div>
                                    <span className="text-brand-orange px-2">{m.result || 'VS'}</span>
                                    <span className="text-slate-400 w-28 text-right truncate">{m.blackPlayer?.fullName || 'BYE'}</span>
                                  </div>
                                ))}
                                {/* ---------------------------------------- */}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'standings' && (
              <motion.div 
                key="standings-table"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl"
              >
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black/40 border-b border-white/5">
                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-4">Pos</th>
                      <th className="px-6 py-4">Player</th>
                      <th className="px-6 py-4 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tournament.players?.sort((a: any, b: any) => {
                      if (a.rank && b.rank) return a.rank - b.rank;
                      if (a.rank) return -1;
                      if (b.rank) return 1;
                      if (b.score !== a.score) return b.score - a.score;
                      return b.rating - a.rating;
                    }).map((p: any, i: number) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 text-[10px] font-black text-slate-500">#{p.rank || i + 1}</td>
                        <td className="px-6 py-4 text-[10px] font-black text-white uppercase tracking-tight truncate max-w-[120px]">{p.fullName}</td>
                        <td className="px-6 py-4 text-right text-brand-orange font-black">{p.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}