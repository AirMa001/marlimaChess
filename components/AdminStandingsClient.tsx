'use client';

import React, { useState } from 'react';
import { updatePlayerStatsAction, getApprovedPlayersAction, recalculateStandingsAction } from '@/app/actions';
import { Player } from '@/types';
import { Trophy, Save, X, Edit3, RefreshCw, Hash, Zap } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminStandingsClientProps {
  initialPlayers: Player[];
  tournamentId: number;
}

export default function AdminStandingsClient({ initialPlayers, tournamentId }: AdminStandingsClientProps) {
  const [players, setPlayers] = useState<Player[]>(Array.isArray(initialPlayers) ? initialPlayers : []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRank, setTempRank] = useState('');
  const [tempScore, setTempScore] = useState('');

  const loadData = async () => {
    const p = await getApprovedPlayersAction(tournamentId);
    setPlayers(p as any);
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
                    {players.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-slate-500 text-[10px]">
                                        {p.fullName[0]}
                                    </div>
                                    <span className="text-white font-black uppercase tracking-tight group-hover:text-brand-orange transition-colors">{p.fullName}</span>
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
                                    <span className="font-black text-xs text-slate-500 tracking-tighter">{p.rank ? `#${p.rank}` : '--'}</span>
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
                    ))}
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