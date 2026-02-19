'use client';

import React, { useState } from 'react';
import { updateMatchResultAction, advanceRoundAction, finishTournamentAction, resetTournamentAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import { Match } from '@/types';
import { Swords, Trophy, RotateCcw, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AdminMatchesClientProps {
  initialMatches: Match[];
  initialRound: number;
  initialStatus: string;
  totalRounds: number;
  tournamentId: number;
}

export default function AdminMatchesClient({ initialMatches, initialRound, initialStatus, totalRounds: initialTotalRounds, tournamentId }: AdminMatchesClientProps) {
  const [matches, setMatches] = useState<Match[]>(Array.isArray(initialMatches) ? initialMatches : []);
  const [currentRound, setCurrentRound] = useState(initialRound || 1);
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds || 5);
  const [status, setStatus] = useState(initialStatus || 'UPCOMING');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const loadData = async () => {
    const [m, t] = await Promise.all([getMatchesAction(tournamentId), getTournamentAction(tournamentId)]);
    setMatches(m as any);
    if (t) {
      setCurrentRound(t.currentRound);
      setTotalRounds(t.totalRounds || 5);
      setStatus(t.status);
    }
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
    const currentRoundMatches = matches.filter(m => m.round === currentRound);
    const unfinished = currentRoundMatches.some(m => !m.result);
    
    if (unfinished) {
      toast.error("Cannot advance round", {
        description: "Please record results for all matches in the current round before generating the next set of pairings.",
      });
      return;
    }

    executeAdvance();
  };

  const executeAdvance = async () => {
    const promise = async () => {
        setIsAdvancing(true);
        try {
          const result = await advanceRoundAction(tournamentId);
          if (!result) throw new Error("Could not advance round");
          await loadData();
        } finally {
          setIsAdvancing(false);
        }
    };

    toast.promise(promise(), {
        loading: "Generating next round pairings...",
        success: `Round Finalized!`,
        error: (err) => `Failed: ${err.message}`
    });
  };

  const handleManualSync = async () => {
    toast.promise(loadData(), {
      loading: "Fetching fresh data...",
      success: "Matches synced",
      error: "Sync failed"
    });
  };

  const handleFinish = async () => {
    toast("Finalize Tournament?", {
      description: "This will calculate final scores and officially conclude the event. This action cannot be undone.",
      action: {
        label: "Finish Now",
        onClick: () => executeFinish()
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const executeFinish = async () => {
    const promise = async () => {
        setIsAdvancing(true);
        try {
          await finishTournamentAction(tournamentId);
          await loadData();
        } finally {
          setIsAdvancing(false);
        }
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
                await resetTournamentAction(tournamentId);
                await loadData();
                toast.success("Tournament reset");
            }
        },
        cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  // --- ♟️ SORTING LOGIC FIXED HERE ♟️ ---
  const currentRoundMatchesUnsorted = matches.filter(m => m.round === currentRound);
  
  const currentRoundMatches = [...currentRoundMatchesUnsorted].sort((a, b) => {
    // The Swiss engine already calculated the perfect board order.
    // We just sort numerically by the assigned table number so it perfectly matches the player view!
    const tableA = a.table || 999; 
    const tableB = b.table || 999;
    
    return tableA - tableB;
  });
  // ----------------------------------------

  const isLastRound = currentRound >= totalRounds;
  const hasAnyMatches = matches.length > 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
        
        <div className="flex items-center space-x-5 relative z-10">
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <Swords className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  {!hasAnyMatches ? 'Battle Arena' : `Round ${currentRound}`}
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {status === 'FINISHED' 
                      ? 'Tournament Concluded' 
                      : !hasAnyMatches 
                        ? 'Awaiting pairing generation' 
                        : `${currentRoundMatches.length} Active Pairings`}
                </p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
            <div className="flex items-center gap-2">
                <button onClick={handleManualSync} className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 hover:text-white rounded-xl transition-all" title="Sync Matches">
                    <RefreshCw className="h-4 w-4" />
                </button>
                <button onClick={handleReset} className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 hover:text-red-400 rounded-xl transition-all" title="Reset Tournament">
                    <RotateCcw className="h-4 w-4" />
                </button>
            </div>
            {(status === 'ONGOING' || status === 'IN_PROGRESS' || status === 'UPCOMING') && hasAnyMatches && (
                isLastRound ? (
                    <Button onClick={handleFinish} isLoading={isAdvancing} className="flex-1 sm:flex-none bg-brand-orange hover:bg-white text-white hover:text-slate-950 font-black uppercase text-xs tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-brand-orange/20">
                        <Trophy className="mr-2 h-4 w-4" /> Finish Event
                    </Button>
                ) : (
                    <Button onClick={handleNextRound} isLoading={isAdvancing} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-white text-white hover:text-slate-950 font-black uppercase text-xs tracking-widest h-14 px-8 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all">
                        Next Round <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )
            )}
        </div>
      </div>

      {status === 'FINISHED' ? (
        <div className="text-center py-20 sm:py-32 bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-white/5 border-dashed">
            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/5">
                <Trophy className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Event Concluded</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto px-4 uppercase font-black tracking-widest opacity-60">The tournament has officially ended. Review final scores in the standings tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {currentRoundMatches.map(m => (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={m.id} 
                    className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-black/40 border-x border-b border-white/5 rounded-b-2xl text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 z-20">
                      Table {m.table || '?'}
                    </div>
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-500 ${m.result ? 'bg-brand-orange' : 'bg-white/5'}`} />
                    
                    <div className="flex flex-row justify-between items-center mb-8 relative z-10 gap-4">
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">White</p>
                            <p className="text-white font-black text-base sm:text-xl truncate tracking-tight uppercase">{m.whitePlayer?.fullName}</p>
                        </div>
                        <div className="px-2 flex-shrink-0">
                            <span className="text-slate-800 font-black italic text-xl sm:text-3xl opacity-40">VS</span>
                        </div>
                        <div className="text-right flex-1 min-w-0">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-2">Black</p>
                            <p className="text-white font-black text-base sm:text-xl truncate tracking-tight uppercase">
                                {m.blackPlayer?.fullName || 'BYE'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 relative z-10">
                        {["1-0", "1/2-1/2", "0-1"].map(res => (
                            <button
                                key={res}
                                onClick={() => handleResult(m.id, res)}
                                className={`py-4 rounded-xl sm:rounded-2xl text-[9px] font-black tracking-widest transition-all border ${
                                    m.result === res 
                                    ? 'bg-brand-orange border-brand-orange text-white shadow-xl shadow-brand-orange/30 translate-y-[-2px]' 
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {res === "1/2-1/2" ? "DRAW" : res}
                            </button>
                        ))}
                    </div>
                </motion.div>
            ))}

            {currentRoundMatches.length === 0 && (
                <div className="col-span-full text-center py-32 bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
                    <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] opacity-50">
                        {!hasAnyMatches 
                          ? "Deployment pending. Configure pairings to begin." 
                          : `No pairings available for Round ${currentRound}.`}
                    </p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}