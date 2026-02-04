'use client';

import React, { useState } from 'react';
import { updatePlayerStatsAction, getApprovedPlayersAction, recalculateStandingsAction } from '@/app/actions';
import { Player } from '@/types';
import { Trophy, Save, X, Edit3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';

interface AdminStandingsClientProps {
  initialPlayers: Player[];
}

export default function AdminStandingsClient({ initialPlayers }: AdminStandingsClientProps) {
  const [players, setPlayers] = useState<Player[]>(Array.isArray(initialPlayers) ? initialPlayers : []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRank, setTempRank] = useState('');
  const [tempScore, setTempScore] = useState('');

  const loadData = async () => {
    const p = await getApprovedPlayersAction();
    setPlayers(p);
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
      await recalculateStandingsAction();
      await loadData();
    };

    toast.promise(promise(), {
      loading: "Recalculating official positions...",
      success: "Leaderboard synced successfully",
      error: "Recalculation failed"
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-white">Tournament Standings</h2>
              <p className="text-slate-500 text-sm">Update player scores and official rankings.</p>
          </div>
        </div>
        <Button onClick={handleRecalculate} variant="outline" className="h-10 border-slate-800 text-slate-400 hover:text-white group">
          <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
          Recalculate Positions
        </Button>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950/50 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Player</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Position</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4 text-right">Edit</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {players.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="px-6 py-4">
                                <span className="text-white font-bold">{p.fullName}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-green-500 font-mono text-xs">{p.rating}</span>
                            </td>
                            <td className="px-6 py-4">
                                {editingId === p.id ? (
                                    <input 
                                        type="number" 
                                        value={tempRank} 
                                        onChange={e => setTempRank(e.target.value)}
                                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:border-green-500 outline-none"
                                    />
                                ) : (
                                    <span className="font-mono">{p.rank ? `#${p.rank}` : '--'}</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {editingId === p.id ? (
                                    <input 
                                        type="number" 
                                        step="0.5"
                                        value={tempScore} 
                                        onChange={e => setTempScore(e.target.value)}
                                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:border-green-500 outline-none"
                                    />
                                ) : (
                                    <span className="text-white font-bold">{p.score || 0}</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {editingId === p.id ? (
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => handleSave(p.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg"><Save className="h-4 w-4"/></button>
                                        <button onClick={() => setEditingId(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><X className="h-4 w-4"/></button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg"><Edit3 className="h-4 w-4"/></button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No approved players to show</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
