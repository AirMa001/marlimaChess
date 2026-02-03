'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Match } from '@/types';
import { Search, User, Swords, ChevronRight, Trophy } from 'lucide-react';

interface ParticipantsClientProps {
  initialPlayers: Player[];
  initialMatches: Match[];
  tournamentStatus: string;
}

export default function ParticipantsClient({ initialPlayers, initialMatches, tournamentStatus }: ParticipantsClientProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'pairings'>('leaderboard');
  const [search, setSearch] = useState('');

  const filteredPlayers = initialPlayers.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) || 
    p.chessUsername.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByRound = initialMatches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">Tournament Arena</h1>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
                <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'leaderboard' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Leaderboard
                </button>
                <button 
                    onClick={() => setActiveTab('pairings')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'pairings' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Live Pairings
                </button>
            </div>
          </div>
          
          {activeTab === 'leaderboard' && (
            <div className="relative w-full md:w-80 group">
                <input
                type="text"
                placeholder="Search grandmasters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none placeholder-slate-500 transition-all shadow-lg text-sm"
                />
                <Search className="absolute left-4 top-2.5 h-5 w-5 text-slate-500 group-focus-within:text-green-500 transition-colors" />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50">
                            <tr className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500 border-b border-slate-800">
                                <th className="px-6 py-5 text-center w-24">Position</th>
                                <th className="px-6 py-5">Player</th>
                                <th className="px-6 py-5 hidden md:table-cell">Department</th>
                                <th className="px-6 py-5 text-center">Rating</th>
                                <th className="px-6 py-5 text-right pr-10">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredPlayers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <User className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No players found matching your search.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPlayers.map((player, index) => (
                                    <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-slate-500 font-mono text-sm">{player.rank || '--'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{player.fullName}</p>
                                                <p className="text-[10px] text-green-500 font-mono">@{player.chessUsername}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-xs text-slate-400 font-medium">{player.department}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono text-sm text-slate-300">{player.rating}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-10">
                                            <span className="text-lg font-black text-white">{player.score || 0}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
          ) : (
            <motion.div
                key="pairings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
            >
                {tournamentStatus === 'FINISHED' ? (
                    <div className="text-center py-24 bg-slate-900/30 rounded-[40px] border border-slate-800 border-dashed">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                            <Swords className="h-8 w-8 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">No ongoing tournaments</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium px-4">The championship has officially concluded. Final rankings are available in the Leaderboard tab.</p>
                    </div>
                ) : Object.keys(groupedByRound).length === 0 ? (
                    <div className="text-center py-24 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed text-slate-500">
                        <Swords className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        No matches have been generated yet.
                    </div>
                ) : (
                    Object.keys(groupedByRound).sort((a,b) => parseInt(b) - parseInt(a)).map(round => (
                        <div key={round} className="space-y-6">
                            <div className="flex items-center space-x-2 text-slate-400 uppercase tracking-[0.2em] text-[10px] font-bold px-2">
                                <ChevronRight className="h-3 w-3 text-green-500" />
                                <span>Round {round} Pairings</span>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {groupedByRound[parseInt(round)].map(m => (
                                    <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex justify-between items-center relative overflow-hidden group text-sm">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-widest">White</p>
                                            <p className="text-white font-bold truncate">{m.whitePlayer?.fullName}</p>
                                        </div>
                                        <div className="px-6">
                                            {m.result ? (
                                                <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                                    {m.result}
                                                </div>
                                            ) : (
                                                <div className="text-slate-700 font-black italic text-sm">VS</div>
                                            )}
                                        </div>
                                        <div className="text-right flex-1 min-w-0">
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Black</p>
                                            <p className="text-white font-bold truncate">{m.blackPlayer?.fullName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}