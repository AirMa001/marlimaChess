'use client';

import React, { useState } from 'react';
import { updateMatchResultAction, advanceRoundAction, finishTournamentAction, resetTournamentAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import { Match } from '@/types';
import { Swords, Trophy, RotateCcw, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';

interface AdminMatchesClientProps {
  initialMatches: Match[];
  initialRound: number;
  initialStatus: string;
  totalRounds: number;
}

export default function AdminMatchesClient({ initialMatches, initialRound, initialStatus, totalRounds: initialTotalRounds }: AdminMatchesClientProps) {
  const [matches, setMatches] = useState<Match[]>(Array.isArray(initialMatches) ? initialMatches : []);
  const [currentRound, setCurrentRound] = useState(initialRound || 1);
  const [totalRounds, setTotalRounds] = useState(initialTotalRounds || 5);
  const [status, setStatus] = useState(initialStatus || 'IN_PROGRESS');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const loadData = async () => {
    const [m, t] = await Promise.all([getMatchesAction(), getTournamentAction()]);
    setMatches(m);
    setCurrentRound(t.currentRound);
    setTotalRounds(t.totalRounds || 5);
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
          const result = await advanceRoundAction();
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
          await finishTournamentAction();
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
                await resetTournamentAction();
                await loadData();
                toast.success("Tournament reset");
            }
        },
        cancel: { label: "Cancel", onClick: () => {} }
    });
  };

  const currentRoundMatches = matches.filter(m => m.round === currentRound);
  const isLastRound = currentRound >= totalRounds;
  const hasAnyMatches = matches.length > 0;

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
                <Swords className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  {!hasAnyMatches ? 'Tournament Arena' : `Round ${currentRound}`}
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    {status === 'FINISHED' 
                      ? 'Tournament Concluded' 
                      : !hasAnyMatches 
                        ? 'Waiting for pairings' 
                        : `${currentRoundMatches.length} pairings this round`}
                </p>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
                <button onClick={handleManualSync} className="p-2.5 sm:p-3 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all" title="Sync Matches">
                    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button onClick={handleReset} className="p-2.5 sm:p-3 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white rounded-xl transition-all" title="Reset Tournament">
                    <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </div>
            {status === 'IN_PROGRESS' && hasAnyMatches && (
                isLastRound ? (
                    <Button onClick={handleFinish} isLoading={isAdvancing} className="flex-1 sm:flex-none bg-yellow-600 hover:bg-yellow-700 px-4 sm:px-8 shadow-lg shadow-yellow-900/20 text-sm sm:text-base h-10 sm:h-12">
                        <Trophy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Finish
                    </Button>
                ) : (
                    <Button onClick={handleNextRound} isLoading={isAdvancing} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 px-4 sm:px-8 shadow-lg shadow-green-900/20 text-sm sm:text-base h-10 sm:h-12">
                        Next Round <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                )
            )}
        </div>
      </div>

      {status === 'FINISHED' ? (
        <div className="text-center py-16 sm:py-24 bg-slate-900/30 rounded-[32px] sm:rounded-[40px] border border-slate-800 border-dashed">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                <Swords className="h-8 w-8 sm:h-10 sm:w-10 text-slate-700" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 uppercase tracking-tighter">No ongoing tournaments</h3>
            <p className="text-slate-500 text-sm sm:text-base max-w-sm mx-auto px-4">The event has concluded. You can review the final standings in the next tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {currentRoundMatches.map(m => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-800 border-x border-b border-slate-700 rounded-b-xl text-[9px] font-black uppercase tracking-widest text-slate-500 z-20">
                      Board {m.table || '?'}
                    </div>
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${m.result ? 'bg-green-500' : 'bg-slate-800'}`} />
                    
                    <div className="flex flex-row justify-between items-center mb-6 sm:mb-8 relative z-10 gap-2">
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 sm:mb-2">White</p>
                            <p className="text-white font-black text-sm sm:text-lg truncate">{m.whitePlayer?.fullName}</p>
                        </div>
                        <div className="px-2 sm:px-4 flex-shrink-0">
                            <span className="text-slate-800 font-black italic text-lg sm:text-2xl">VS</span>
                        </div>
                        <div className="text-right flex-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 sm:mb-2">Black</p>
                            <p className="text-white font-black text-sm sm:text-lg truncate">{m.blackPlayer?.fullName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3 relative z-10">
                        {["1-0", "1/2-1/2", "0-1"].map(res => (
                            <button
                                key={res}
                                onClick={() => handleResult(m.id, res)}
                                className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black transition-all border-2 ${
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
                    {!hasAnyMatches 
                      ? "No matches have been generated yet. Please go to the Pairings tab to start." 
                      : `No matches found for Round ${currentRound}.`}
                </div>
            )}
        </div>
      )}
    </div>
  );
}
