'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSwissPairingsAction, generateRoundRobinAction, updateTournamentSettingsAction } from '@/app/actions';
import { Button } from '@/components/Button';
import { Repeat, Swords, Settings2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AdminPairingsClientProps {
  initialPlayerCount: number;
  initialRound: number;
  initialTotalRounds: number;
  tournamentId: number;
}

export default function AdminPairingsClient({ initialPlayerCount, initialRound, initialTotalRounds, tournamentId }: AdminPairingsClientProps) {
  const router = useRouter();
  const [round, setRound] = useState(initialRound || 1);
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds || 5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const handleUpdateTotalRounds = async () => {
    setIsUpdatingSettings(true);
    try {
      await updateTournamentSettingsAction(tournamentId, totalRounds);
      toast.success("Tournament settings updated");
    } catch (e) {
      toast.error("Failed to update settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAutoPair = async (type: 'swiss' | 'round_robin') => {
    if (initialPlayerCount < 2) return toast.error("Not enough players", { description: "Need at least 2 approved players." });
    
    toast(`Generate ${type === 'round_robin' ? 'Round Robin Schedule' : 'Swiss Pairings'}?`, {
        description: `This will create matches for Round ${round}.`,
        action: {
            label: "Generate",
            onClick: async () => {
                setIsGenerating(true);
                try {
                    if (type === 'round_robin') {
                        await generateRoundRobinAction(tournamentId);
                    } else {
                        await generateSwissPairingsAction(round, tournamentId);
                    }
                    toast.success("Matches generated successfully");
                    router.refresh();
                    setTimeout(() => router.push(`/admin/matches?tournamentId=${tournamentId}`), 500);
                } catch (e) {
                    toast.error("Failed to generate pairings");
                } finally {
                    setIsGenerating(false);
                }
            }
        }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-10">
      <div className="text-center space-y-1 sm:space-y-2 px-4">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-none uppercase">Pairing Control</h2>
        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Engine configuration & generation</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] sm:rounded-[3.5rem] border border-white/5 p-4 sm:p-12 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-orange/5 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/5 blur-3xl rounded-full" />

        <div className="space-y-6 sm:space-y-10 relative z-10">
            <div className="flex items-center justify-between p-4 sm:p-8 bg-white/[0.02] rounded-2xl sm:rounded-[2rem] border border-white/5 shadow-inner group transition-all hover:bg-white/[0.04]">
                <div className="space-y-0.5">
                    <span className="text-slate-500 font-black uppercase text-[8px] sm:text-xs tracking-widest">Approved Players</span>
                    <p className="text-[10px] sm:text-xs text-slate-600 font-bold uppercase tracking-tight">Ready for deployment</p>
                </div>
                <span className="text-3xl sm:text-5xl font-black text-brand-orange font-mono group-hover:scale-110 transition-transform tracking-tighter">{initialPlayerCount}</span>
            </div>

            <div className="space-y-4 sm:space-y-6 bg-black/20 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-white/5">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-1">
                    <div className="p-1.5 sm:p-2 bg-brand-orange/10 rounded-lg">
                        <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-orange" />
                    </div>
                    <label className="block text-[9px] sm:text-xs font-black text-white uppercase tracking-widest leading-none">Tournament Length</label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="relative flex-1 group">
                        <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-orange transition-colors" />
                        <input 
                            type="number" 
                            value={totalRounds} 
                            onChange={e => setTotalRounds(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg text-white font-black focus:ring-2 focus:ring-brand-orange/30 outline-none transition-all"
                            placeholder="Rounds"
                        />
                    </div>
                    <Button 
                        onClick={handleUpdateTotalRounds}
                        isLoading={isUpdatingSettings}
                        className="w-full sm:w-auto px-6 sm:px-8 bg-white text-slate-950 hover:bg-brand-orange hover:text-white font-black uppercase text-[10px] sm:text-xs tracking-widest h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-xl shadow-white/5 transition-all"
                    >
                        Save Settings
                    </Button>
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-600 font-black uppercase tracking-wider ml-1 opacity-60">Define official round count</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-1 ml-1">
                    <div className="p-1.5 sm:p-2 bg-white/5 rounded-lg">
                        <Swords className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                    </div>
                    <label className="block text-[9px] sm:text-xs font-black text-white uppercase tracking-widest leading-none">Target Execution</label>
                </div>
                <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-[2rem] px-5 sm:px-10 py-4 sm:py-8 flex items-center justify-between shadow-inner group transition-all hover:bg-white/[0.04]">
                    <span className="text-slate-500 font-black uppercase text-[9px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em]">Current Round</span>
                    <span className="text-3xl sm:text-5xl font-black text-white font-mono group-hover:text-brand-orange transition-colors tracking-tighter">{round}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-5 pt-2 sm:pt-4">
                <Button 
                    onClick={() => handleAutoPair('swiss')} 
                    className="h-16 sm:h-24 text-sm sm:text-xl justify-start px-4 sm:px-10 bg-brand-orange hover:bg-white text-white hover:text-slate-950 transition-all group rounded-2xl sm:rounded-[2.5rem] shadow-xl shadow-brand-orange/10 border-none relative overflow-hidden"
                    isLoading={isGenerating}
                >
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 blur-3xl rounded-full" />
                    <div className="p-2.5 sm:p-4 bg-white/20 rounded-xl sm:rounded-2xl mr-4 sm:mr-8 group-hover:bg-slate-950 group-hover:text-white transition-all shadow-lg">
                        <Swords className="h-4 w-4 sm:h-8 sm:w-8" />
                    </div>
                    <div className="text-left relative z-10 min-w-0">
                        <p className="font-black uppercase tracking-widest text-[8px] sm:text-sm mb-0.5 sm:mb-1 opacity-80">Methodology</p>
                        <p className="font-black uppercase tracking-tight text-base sm:text-2xl truncate">Swiss System</p>
                    </div>
                </Button>

                <Button 
                    onClick={() => handleAutoPair('round_robin')} 
                    variant="ghost"
                    className="h-16 sm:h-24 text-sm sm:text-xl justify-start px-4 sm:px-10 bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:border-brand-orange transition-all group rounded-2xl sm:rounded-[2.5rem]"
                    isLoading={isGenerating}
                >
                    <div className="p-2.5 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl mr-4 sm:mr-8 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-all shadow-inner">
                        <Repeat className="h-4 w-4 sm:h-8 sm:w-8 text-slate-500 group-hover:text-brand-orange" />
                    </div>
                    <div className="text-left min-w-0">
                        <p className="font-black text-slate-500 uppercase tracking-widest text-[8px] sm:text-xs mb-0.5 sm:mb-1 group-hover:text-brand-orange transition-colors">Alternative</p>
                        <p className="font-black text-slate-300 uppercase tracking-tight text-base sm:text-2xl group-hover:text-white transition-colors truncate">Round Robin</p>
                    </div>
                </Button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}