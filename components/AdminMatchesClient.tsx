'use client';

import React, { useState } from 'react';
import { updateMatchResultAction, advanceRoundAction, finishTournamentAction, resetTournamentAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import { Match } from '@/types';
import { Swords, Trophy, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';

interface AdminMatchesClientProps {
  initialMatches: Match[];
  initialRound: number;
  initialStatus: string;
}

export default function AdminMatchesClient({ initialMatches, initialRound, initialStatus }: AdminMatchesClientProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [status, setStatus] = useState(initialStatus);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const loadData = async () => {
    const [m, t] = await Promise.all([getMatchesAction(), getTournamentAction()]);
    setMatches(m);
    setCurrentRound(t.currentRound);
    setStatus(t.status);
  };

  const handleResult = async (matchId: string, res: string) => {
    // Optimistic Update
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, result: res } : m));

    const promise = async () => {
        await updateMatchResultAction(matchId, res);
    };

    toast.promise(promise(), {
        loading: "Saving result...",
        success: `Match updated: ${res}`,
        error: "Sync failed"
    });
  };

  const handleNextRound = async () => {
    const unfinished = currentRoundMatches.some(m => !m.result);
    if (unfinished && !confirm("Some matches have no results. Advance anyway?")) return;

    const promise = async () => {
        setIsAdvancing(true);
        await advanceRoundAction();
        await loadData();
        setIsAdvancing(false);
    };

    toast.promise(promise(), {
        loading: "Generating next round pairings...",
        success: `Round Finalized!`,
        error: "Failed to advance"
    });
  };

  const handleFinish = async () => {
    if (!confirm("Are you sure? This will finalize all standings.")) return;

    const promise = async () => {
        setIsAdvancing(true);
        await finishTournamentAction();
        await loadData();
        setIsAdvancing(false);
    };

    toast.promise(promise(), {
        loading: "Calculating final scores...",
        success: "Tournament officially concluded!",
        error: "Failed to finish"
    });
  };

  const handleReset = async () => {
    toast("Reset Tournament?", {
        description: "This will delete ALL matches and reset scores to zero.",
        action: {
            label: "Reset All",
            onClick: async () => {
                await resetTournamentAction();
                await loadData();
                toast.success("Tournament reset");
            }
        },
        cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  const currentRoundMatches = matches.filter(m => m.round === currentRound);
  const isLastRound = !matches.some(m => m.round > currentRound);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
                <Swords className="h-8 w-8 text-green-500" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Round {currentRound}</h2>
                <p className="text-slate-500 text-sm font-medium">
                    {status === 'FINISHED' ? 'Tournament Concluded' : `${currentRoundMatches.length} pairings this round`}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <button onClick={handleReset} className="p-3 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all" title="Reset Tournament">
                <RotateCcw className="h-5 w-5" />
            </button>
            {status === 'IN_PROGRESS' && (
                isLastRound ? (
                    <Button onClick={handleFinish} isLoading={isAdvancing} className="bg-yellow-600 hover:bg-yellow-700 px-8 shadow-lg shadow-yellow-900/20">
                        <Trophy className="mr-2 h-5 w-5" /> Finish Tournament
                    </Button>
                ) : (
                    <Button onClick={handleNextRound} isLoading={isAdvancing} className="bg-green-600 hover:bg-green-700 px-8 shadow-lg shadow-green-900/20">
                        Next Round <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                )
            )}
        </div>
      </div>

      {status === 'FINISHED' ? (
        <div className="text-center py-24 bg-slate-900/30 rounded-[40px] border border-slate-800 border-dashed">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                <Swords className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">No ongoing tournaments</h3>
            <p className="text-slate-500 max-w-sm mx-auto">The event has concluded. You can review the final standings in the next tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentRoundMatches.map(m => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${m.result ? 'bg-green-500' : 'bg-slate-800'}`} />
                    
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">White</p>
                            <p className="text-white font-black text-lg truncate">{m.whitePlayer?.fullName}</p>
                        </div>
                        <div className="px-6">
                            <span className="text-slate-800 font-black italic text-2xl">VS</span>
                        </div>
                        <div className="text-right flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Black</p>
                            <p className="text-white font-black text-lg truncate">{m.blackPlayer?.fullName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 relative z-10">
                        {["1-0", "1/2-1/2", "0-1"].map(res => (
                            <button
                                key={res}
                                onClick={() => handleResult(m.id, res)}
                                className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                                    m.result === res 
                                    ? 'bg-green-600 border-green-600 text-white shadow-xl shadow-green-900/40 translate-y-[-2px]' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white hover:border-slate-700'
                                }`}
                            >
                                {res === "1/2-1/2" ? "DRAW" : res}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {currentRoundMatches.length === 0 && (
                <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed text-slate-500">
                    No matches found for Round {currentRound}.
                </div>
            )}
        </div>
      )}
    </div>
  );
}
