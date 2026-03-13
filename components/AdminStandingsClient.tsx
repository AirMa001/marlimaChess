'use client';

import React, { useState } from 'react';
import { updatePlayerStatsAction, getApprovedPlayersAction, recalculateStandingsAction, getMatchesAction, getTournamentAction } from '@/app/actions';
import { Player } from '@/types';
import { Trophy, Save, X, Edit3, RefreshCw, Hash, Zap } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminStandingsClientProps {
  initialPlayers: Player[];
  initialMatches?: any[];
  currentRound?: number;
  tournamentId: number;
}

export default function AdminStandingsClient({ initialPlayers, initialMatches = [], currentRound: initialRound = 0, tournamentId }: AdminStandingsClientProps) {
  const [players, setPlayers] = useState<Player[]>(Array.isArray(initialPlayers) ? initialPlayers : []);
  const [matches, setMatches] = useState<any[]>(initialMatches);
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [expandedPlayerMatches, setExpandedPlayerMatches] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRank, setTempRank] = useState('');
  const [tempScore, setTempScore] = useState('');

  const togglePlayerMatches = (playerId: string) => {
    setExpandedPlayerMatches(prev => prev === playerId ? null : playerId);
  };

  const loadData = async () => {
    const [p, m, t] = await Promise.all([
      getApprovedPlayersAction(tournamentId),
      getMatchesAction(tournamentId),
      getTournamentAction(tournamentId)
    ]);
    setPlayers(p as any);
    setMatches(m as any);
    if (t) setCurrentRound(t.currentRound);
  };

  const handleEdit = (p: Player) => {
    setEditingId(p.id);
    setTempRank(p.rank?.toString() || '');
    setTempScore(p.score?.toString() || '0');
  };

  const handleSave = async (id: string) => {
    const promise = async () => {
        await updatePlayerStatsAction(id, tempRank ? parseInt(tempRank) : null, parseFloat(tempScore) || 0);
        setEditingId(null);
        await loadData();
    };

    toast.promise(promise(), {
        loading: "Saving standings...",
        success: "Stats updated",
        error: "Save failed"
    });
  };

  const handleRecalculate = async () => {
    const promise = async () => {
      await recalculateStandingsAction(tournamentId);
      await loadData();
    };

    toast.promise(promise(), {
      loading: "Recalculating official positions...",
      success: "Leaderboard synced successfully",
      error: "Recalculation failed"
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="flex items-center space-x-5">
          <div className="p-4 bg-brand-orange/10 rounded-[1.5rem] border border-brand-orange/20 shadow-lg shadow-brand-orange/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Trophy className="h-8 w-8 text-brand-orange relative z-10" />
          </div>
          <div className="space-y-1">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Official Standings</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Audit rankings & score distribution</p>
          </div>
        </div>
        <Button onClick={handleRecalculate} className="bg-white text-slate-950 hover:bg-brand-orange hover:text-white h-14 px-8 font-black uppercase text-xs tracking-widest shadow-xl shadow-white/5 transition-all group rounded-2xl">
          <RefreshCw className="h-4 w-4 mr-3 group-hover:rotate-180 transition-transform duration-700" />
          Recalculate Table
        </Button>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange/20 to-transparent" />
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-black/20 text-[9px] uppercase font-black tracking-[0.2em] text-slate-500">
                    <tr>
                        <th className="px-8 py-6">Player Identity</th>
                        <th className="px-8 py-6">Current Rating</th>
                        <th className="px-8 py-6">Official Pos</th>
                        <th className="px-8 py-6">Combat Score</th>
                        <th className="px-8 py-6 text-right">Audit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {players.map((p, idx) => {
                        const isExpanded = expandedPlayerMatches === p.id;
                        const playerMatches = (matches || [])
                          .filter((m: any) => m.whitePlayerId === p.id || m.blackPlayerId === p.id)
                          .sort((a: any, b: any) => a.round - b.round);
                        
                        const roundsString = Array.from({ length: currentRound || 0 }, (_, idx) => {
                          const roundNum = idx + 1;
                          const m = playerMatches.find((match: any) => match.round === roundNum);
                          
                          if (!m || !m.result) return "·";
                          
                          const isWhite = m.whitePlayerId === p.id;
                          const color = isWhite ? 'W' : 'B';
                          
                          let prefix = '=';
                          if (m.result === '1-0') prefix = isWhite ? '+' : '-';
                          else if (m.result === '0-1') prefix = isWhite ? '-' : '+';
                          else if (m.result === '1/2-1/2') prefix = '=';
                          
                          if (!m.blackPlayerId) return `+BYE`;
                          
                          return `${prefix}${color}`;
                        });

                        return (
                          <React.Fragment key={p.id}>
                            <tr className={`hover:bg-white/[0.02] transition-colors group ${isExpanded ? 'bg-white/[0.03]' : ''}`}>
                                <td className="px-8 py-6 cursor-pointer" onClick={() => togglePlayerMatches(p.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-slate-500 text-[10px]">
                                            {p.fullName[0]}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-white font-black uppercase tracking-tight group-hover:text-brand-orange transition-colors">
                                            {p.fullName}
                                          </span>
                                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1">
                                            {roundsString.join(' ')}
                                          </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-2.5 py-1 bg-white/5 rounded-md text-emerald-500 font-mono text-[10px] font-black border border-white/5">
                                        {Math.round(p.rating)}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    {editingId === p.id ? (
                                        <div className="relative group">
                                            <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                                            <input 
                                                type="number" 
                                                value={tempRank} 
                                                onChange={e => setTempRank(e.target.value)}
                                                className="w-20 bg-slate-950 border border-white/10 rounded-xl pl-7 pr-2 py-2 text-white font-black text-xs outline-none focus:border-brand-orange/50 transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-black text-xs text-slate-500 tracking-tighter">{p.rank ? `#${p.rank}` : idx + 1}</span>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    {editingId === p.id ? (
                                        <div className="relative group">
                                            <Zap className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
                                            <input 
                                                type="number" 
                                                step="0.5"
                                                value={tempScore} 
                                                onChange={e => setTempScore(e.target.value)}
                                                className="w-20 bg-slate-950 border border-white/10 rounded-xl pl-7 pr-2 py-2 text-white font-black text-xs outline-none focus:border-brand-orange/50 transition-all"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-white font-black text-base tracking-tighter">{p.score || 0}</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    {editingId === p.id ? (
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => handleSave(p.id)} className="h-9 w-9 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><Save className="h-4 w-4"/></button>
                                            <button onClick={() => setEditingId(null)} className="h-9 w-9 flex items-center justify-center bg-white/5 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X className="h-4 w-4"/></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEdit(p)} className="h-10 w-10 flex items-center justify-center bg-white/5 text-slate-500 rounded-xl hover:bg-brand-orange hover:text-white transition-all shadow-lg shadow-black/20"><Edit3 className="h-4 w-4"/></button>
                                    )}
                                </td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={5} className="px-8 pb-6 pt-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-black/20 border border-white/5 rounded-2xl p-6 space-y-4"
                                    >
                                      <div className="flex flex-wrap gap-3">
                                        {roundsString.map((res, idx) => (
                                          <div key={idx} className="flex flex-col items-center min-w-[40px]">
                                            <span className="text-[8px] font-black text-slate-500 mb-1.5 uppercase">Round {idx + 1}</span>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tighter ${
                                              res.includes('+') ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' :
                                              res.includes('-') ? 'bg-red-500/20 text-red-500 border border-red-500/20' :
                                              res === '·' ? 'bg-white/5 text-slate-600' :
                                              'bg-slate-500/20 text-slate-400 border border-slate-500/20'
                                            }`}>
                                              {res}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="pt-4 space-y-2 border-t border-white/5">
                                        {playerMatches.map((m: any) => {
                                          const isWhite = m.whitePlayerId === p.id;
                                          const opponent = isWhite ? m.blackPlayer?.fullName : m.whitePlayer?.fullName;
                                          return (
                                            <div key={m.id} className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                                              <span className="flex items-center gap-2">
                                                <span className="w-12 text-slate-600">RD {m.round}</span>
                                                <span>vs {opponent || 'BYE'}</span>
                                                <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px]">{isWhite ? 'WHITE' : 'BLACK'}</span>
                                              </span>
                                              <span className={m.result ? 'text-white' : 'text-slate-700'}>{m.result || 'PENDING'}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                    })}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] italic opacity-50">Zero records found in standby</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}