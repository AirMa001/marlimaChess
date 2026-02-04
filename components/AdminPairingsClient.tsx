'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSwissPairingsAction, generateRoundRobinAction, updateTournamentSettingsAction } from '@/app/actions';
import { Button } from '@/components/Button';
import { Repeat, Swords, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPairingsClientProps {
  initialPlayerCount: number;
  initialRound: number;
  initialTotalRounds: number;
}

export default function AdminPairingsClient({ initialPlayerCount, initialRound, initialTotalRounds }: AdminPairingsClientProps) {
  const router = useRouter();
  const [round, setRound] = useState(initialRound || 1);
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds || 5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  const handleUpdateTotalRounds = async () => {
    setIsUpdatingSettings(true);
    try {
      await updateTournamentSettingsAction(totalRounds);
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
                        await generateRoundRobinAction();
                    } else {
                        await generateSwissPairingsAction(round);
                    }
                    toast.success("Matches generated");
                    router.refresh();
                    setTimeout(() => router.push('/admin/matches'), 500);
                } catch (e) {
                    toast.error("Failed to generate");
                } finally {
                    setIsGenerating(false);
                }
            }
        }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-8">
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">Match Pairings</h2>
        <p className="text-xs sm:text-sm text-slate-500">Configure the tournament structure.</p>
      </div>

      <div className="bg-slate-900 rounded-[20px] sm:rounded-[32px] border border-slate-800 p-4 sm:p-8 shadow-2xl">
        <div className="space-y-4 sm:space-y-8">
            <div className="flex items-center justify-between p-3 sm:p-6 bg-slate-950 rounded-xl sm:rounded-2xl border border-slate-800 ring-1 ring-white/5">
                <span className="text-slate-500 font-bold uppercase text-[9px] sm:text-xs tracking-widest">Contenders</span>
                <span className="text-xl sm:text-3xl font-black text-green-500 font-mono">{initialPlayerCount}</span>
            </div>

            <div className="space-y-2 sm:space-y-4 bg-slate-950/50 p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800/50">
                <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                    <Settings2 className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                    <label className="block text-[9px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Tournament Length</label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input 
                        type="number" 
                        value={totalRounds} 
                        onChange={e => setTotalRounds(parseInt(e.target.value) || 1)}
                        className="w-full sm:flex-1 bg-slate-950 border border-slate-800 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg text-white font-black focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        placeholder="Rounds"
                    />
                    <Button 
                        onClick={handleUpdateTotalRounds}
                        isLoading={isUpdatingSettings}
                        variant="outline"
                        className="w-full sm:w-auto px-4 sm:px-6 border-slate-800 text-[9px] sm:text-xs font-bold uppercase tracking-wider h-10 sm:h-12"
                    >
                        Save
                    </Button>
                </div>
                <p className="text-[8px] sm:text-[9px] text-slate-600 font-medium ml-1">Set how many rounds will be played in total.</p>
            </div>

            <div className="space-y-2 sm:space-y-4">
                <label className="block text-[9px] sm:text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Generation Target</label>
                <div className="w-full bg-slate-950 border border-slate-800 rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-between shadow-inner">
                    <span className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Generating For</span>
                    <span className="text-lg sm:text-3xl font-black text-white font-mono">Round {round}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:gap-4 pt-2">
                <Button 
                    onClick={() => handleAutoPair('swiss')} 
                    variant="secondary"
                    className="h-14 sm:h-20 text-sm sm:text-lg justify-start px-3 sm:px-8 bg-slate-950 border-2 border-slate-800 hover:border-green-500 transition-all group rounded-xl sm:rounded-2xl"
                    isLoading={isGenerating}
                >
                    <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl mr-3 sm:mr-5 group-hover:bg-green-500/20 transition-colors">
                        <Swords className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-white uppercase tracking-tight text-xs sm:text-base">Swiss System</p>
                    </div>
                </Button>

                <Button 
                    onClick={() => handleAutoPair('round_robin')} 
                    variant="outline"
                    className="h-14 sm:h-20 text-sm sm:text-lg justify-start px-3 sm:px-8 border-2 border-slate-800 hover:bg-slate-900 transition-all group rounded-xl sm:rounded-2xl"
                    isLoading={isGenerating}
                >
                    <div className="p-2 sm:p-3 bg-slate-800 rounded-lg sm:rounded-xl mr-3 sm:mr-5 group-hover:bg-slate-700 transition-colors">
                        <Repeat className="h-4 w-4 sm:h-6 sm:w-6 text-slate-400" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-slate-300 uppercase tracking-tight text-xs sm:text-base">Round Robin</p>
                    </div>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
