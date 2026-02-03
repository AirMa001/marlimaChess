'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSwissPairingsAction, generateRoundRobinAction } from '@/app/actions';
import { Button } from '@/components/Button';
import { Repeat, Swords, Info } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPairingsClientProps {
  initialPlayerCount: number;
  initialRound: number;
}

export default function AdminPairingsClient({ initialPlayerCount, initialRound }: AdminPairingsClientProps) {
  const router = useRouter();
  const [round, setRound] = useState(initialRound);
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Match Pairings</h2>
        <p className="text-slate-500">Configure the tournament structure.</p>
      </div>

      <div className="bg-slate-900 rounded-[32px] border border-slate-800 p-8 shadow-2xl">
        <div className="space-y-8">
            <div className="flex items-center justify-between p-6 bg-slate-950 rounded-2xl border border-slate-800 ring-1 ring-white/5">
                <span className="text-slate-400 font-bold uppercase text-xs tracking-widest">Contenders</span>
                <span className="text-3xl font-black text-green-500 font-mono">{initialPlayerCount}</span>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Active Round</label>
                <input 
                    type="number" 
                    value={round} 
                    onChange={e => setRound(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-2xl text-white font-black focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Button 
                    onClick={() => handleAutoPair('swiss')} 
                    variant="secondary"
                    className="h-20 text-lg justify-start px-8 bg-slate-950 border-2 border-slate-800 hover:border-green-500 transition-all group rounded-2xl"
                    isLoading={isGenerating}
                >
                    <div className="p-3 bg-green-500/10 rounded-xl mr-5 group-hover:bg-green-500/20 transition-colors">
                        <Swords className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-white uppercase tracking-tight">Swiss System</p>
                        <p className="text-[10px] text-slate-500 font-bold">SCORE-BASED PAIRING</p>
                    </div>
                </Button>

                <Button 
                    onClick={() => handleAutoPair('round_robin')} 
                    variant="outline"
                    className="h-20 text-lg justify-start px-8 border-2 border-slate-800 hover:bg-slate-900 transition-all group rounded-2xl"
                    isLoading={isGenerating}
                >
                    <div className="p-3 bg-slate-800 rounded-xl mr-5 group-hover:bg-slate-700 transition-colors">
                        <Repeat className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-slate-300 uppercase tracking-tight">Round Robin</p>
                        <p className="text-[10px] text-slate-600 font-bold">ALL-PLAY-ALL SCHEDULE</p>
                    </div>
                </Button>
            </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex items-start space-x-4">
        <Info className="h-5 w-5 text-slate-500 mt-1" />
        <div className="text-xs text-slate-500 leading-relaxed font-medium">
            <p className="text-slate-300 font-bold mb-1 uppercase tracking-wider">Swiss Pairing logic</p>
            The algorithm groups players by score and rating, ensures no two players meet twice, and attempts to balance color assignments (White/Black) based on tournament history.
        </div>
      </div>
    </div>
  );
}
