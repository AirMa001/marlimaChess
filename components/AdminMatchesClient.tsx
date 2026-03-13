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
    <div className="space-y-6 sm:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
        
        <div className="flex items-center space-x-4 sm:space-x-5 relative z-10">
            <div className="p-3 sm:p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                <Swords className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
                <h2 className="text-xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  {!hasAnyMatches ? 'Battle Arena' : `Round ${currentRound}`}
                </h2>
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {status === 'FINISHED' 
                      ? 'Tournament Concluded' 
                      : !hasAnyMatches 
                        ? 'Awaiting pairing generation' 
                        : `${currentRoundMatches.length} Active Pairings`}
                </p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10">
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={handleManualSync} className="h-12 flex-1 sm:w-12 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm" title="Sync Matches">
                    <RefreshCw className="h-4 w-4 mr-2 sm:mr-0" /><span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Sync</span>
                </button>
                <button onClick={handleReset} className="h-12 flex-1 sm:w-12 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-all shadow-sm" title="Reset Tournament">
                    <RotateCcw className="h-4 w-4 mr-2 sm:mr-0" /><span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Reset</span>
                </button>
            </div>
            {(status === 'ONGOING' || status === 'IN_PROGRESS' || status === 'UPCOMING') && hasAnyMatches && (
                isLastRound ? (
                    <Button onClick={handleFinish} isLoading={isAdvancing} className="w-full sm:w-auto bg-brand-orange hover:bg-slate-900 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest h-12 sm:h-14 px-6 sm:px-8 rounded-2xl shadow-xl shadow-brand-orange/20">
                        <Trophy className="mr-2 h-4 w-4" /> Finish Event
                    </Button>
                ) : (
                    <Button onClick={handleNextRound} isLoading={isAdvancing} className="w-full sm:w-auto bg-emerald-600 hover:bg-slate-900 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest h-12 sm:h-14 px-6 sm:px-8 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all">
                        Next Round <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )
            )}
        </div>
      </div>

      {status === 'FINISHED' ? (
        <div className="text-center py-16 sm:py-32 bg-white/70 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3rem] border border-slate-200 border-dashed shadow-xl px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-slate-100">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-slate-200" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter leading-none">Event Concluded</h3>
            <p className="text-slate-500 text-[10px] sm:text-sm max-w-sm mx-auto uppercase font-black tracking-widest opacity-60 leading-relaxed">The tournament has officially ended. Review final scores in the standings tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {currentRoundMatches.map(m => (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={m.id} 
                    className="bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 shadow-xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-50 border-x border-b border-slate-100 rounded-b-2xl text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 z-20">
                      Table {m.table || '?'}
                    </div>
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-500 ${m.result ? 'bg-brand-orange' : 'bg-slate-100'}`} />
                    
                    <div className="flex flex-row justify-between items-center mb-6 sm:mb-8 relative z-10 gap-2 sm:gap-4">
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">White</p>
                            <p className="text-slate-900 font-black text-sm sm:text-xl truncate tracking-tight uppercase leading-none">{m.whitePlayer?.fullName}</p>
                        </div>
                        <div className="px-1 sm:px-2 flex-shrink-0">
                            <span className="text-slate-200 font-black italic text-lg sm:text-3xl opacity-50">VS</span>
                        </div>
                        <div className="text-right flex-1 min-w-0">
                            <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">Black</p>
                            <p className="text-slate-900 font-black text-sm sm:text-xl truncate tracking-tight uppercase leading-none">
                                {m.blackPlayer?.fullName || 'BYE'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 relative z-10">
                        {["1-0", "1/2-1/2", "0-1"].map(res => (
                            <button
                                key={res}
                                onClick={() => handleResult(m.id, res)}
                                className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black tracking-widest transition-all border ${
                                    m.result === res 
                                    ? 'bg-brand-orange border-brand-orange text-white shadow-xl shadow-brand-orange/30 sm:translate-y-[-2px]' 
                                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-100 shadow-sm'
                                }`}
                            >
                                {res === "1/2-1/2" ? "DRAW" : res}
                            </button>
                        ))}
                    </div>
                </motion.div>
            ))}

            {currentRoundMatches.length === 0 && (
                <div className="col-span-full text-center py-20 sm:py-32 bg-white/70 backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3rem] border border-slate-200 border-dashed shadow-xl px-6">
                    <p className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] opacity-50">
                        {!hasAnyMatches 
                          ? "Deployment pending. Configure pairings to begin." 
                          : `No pairings available for Round ${currentRound}.`}
                    </p>
                </div>
            )}
        </div>
      )    }
    </div>
  );
}