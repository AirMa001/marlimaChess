'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, Match } from '@/types';
import { Search, User, Swords, ChevronRight, Trophy, Users, Shield } from 'lucide-react';

interface ParticipantsClientProps {
  initialPlayers: Player[];
  initialMatches: Match[];
  tournamentStatus: string;
}

export default function ParticipantsClient({ initialPlayers, initialMatches, tournamentStatus }: ParticipantsClientProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'pairings'>('leaderboard');
  const [search, setSearch] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Helper to format match results: e.g. +W8, -B2, =W4
  const getPerformanceString = (playerId: string, match: Match) => {
    if (!match.result) return '??';
    
    const isWhite = match.whitePlayerId === playerId;
    const opponent = isWhite ? match.blackPlayer : match.whitePlayer;
    
    // Find the opponent's position (rank) for the display
    const opponentRank = initialPlayers.find(p => p.id === (isWhite ? match.blackPlayerId : match.whitePlayerId))?.rank || '?';
    
    let outcome = '';
    if (match.result === '1/2-1/2') outcome = '=';
    else if (match.result === '1-0') outcome = isWhite ? '+' : '-';
    else if (match.result === '0-1') outcome = isWhite ? '-' : '+';

    return `${outcome}${isWhite ? 'W' : 'B'}${opponentRank}`;
  };

  // Get available rounds and default to the latest one
  const availableRounds = Object.keys(initialMatches.reduce((acc, m) => {
    acc[m.round] = true;
    return acc;
  }, {} as Record<number, boolean>)).map(Number).sort((a, b) => b - a);

  const [selectedRound, setSelectedRound] = useState<number | null>(availableRounds[0] || null);

  const playersArray = Array.isArray(initialPlayers) ? initialPlayers : [];
  const sortedPlayers = [...playersArray].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    return scoreB - scoreA;
  });
  const filteredPlayers = sortedPlayers.filter(p => 
    p.fullName.toLowerCase().includes(search.toLowerCase()) || 
    p.chessUsername.toLowerCase().includes(search.toLowerCase())
  );

  const groupedByRound = initialMatches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <div className="min-h-screen pb-20 space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="text-brand-orange h-6 w-6" />
            <span className="text-brand-orange font-black tracking-[0.3em] text-xs uppercase">Community</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none">Player Registry</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-orange transition-colors" />
            <input 
              type="text"
              placeholder="Search Players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-brand-orange/50 outline-none transition-all w-full"
            />
          </div>
          
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 shadow-inner">
            {[
              { id: 'leaderboard', label: 'Standings', icon: Trophy },
              { id: 'pairings', label: 'Matches', icon: Swords },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' ? (
          <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
          >
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-black/20">
                          <tr className="text-[10px] font-black uppercase font-bold tracking-[0.2em] text-slate-500 border-b border-white/5">
                              <th className="px-8 py-6 text-center w-24">Pos</th>
                              <th className="px-8 py-6">Player Identity</th>
                              <th className="px-8 py-6 hidden md:table-cell">Affiliation</th>
                              <th className="px-8 py-6 text-center">ELO</th>
                              <th className="px-8 py-6 text-right pr-12">Points</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredPlayers.length === 0 ? (
                              <tr>
                                  <td colSpan={5} className="px-8 py-32 text-center">
                                      <User className="h-12 w-12 text-slate-800 mx-auto mb-4 opacity-50" />
                                      <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">No players registered matching criteria</p>
                                  </td>
                              </tr>
                          ) : (
                              filteredPlayers.map((player, index) => (
                                  <React.Fragment key={player.id}>
                                      <tr 
                                          onClick={() => setExpandedPlayerId(expandedPlayerId === player.id ? null : player.id)}
                                          className="hover:bg-white/[0.03] cursor-pointer transition-all group border-b border-white/5"
                                      >
                                          <td className="px-8 py-6 text-center">
                                              {tournamentStatus === 'FINISHED' && player.rank && player.rank <= 3 ? (
                                                  <span className="text-2xl">{player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : '🥉'}</span>
                                              ) : (
                                                  <span className="text-slate-500 font-mono text-sm font-bold">{player.rank || '--'}</span>
                                              )}
                                          </td>
                                          <td className="px-8 py-6">
                                              <div className="flex items-center space-x-4">
                                                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-slate-500 text-xs shadow-inner">
                                                      {player.fullName[0]}
                                                  </div>
                                                  <div className="min-w-0">
                                                      <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-brand-orange transition-colors">{player.fullName}</p>
                                                      <p className="text-[9px] text-green-500 font-black tracking-widest uppercase opacity-60">@{player.chessUsername}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-8 py-6 hidden md:table-cell">
                                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{player.department}</span>
                                          </td>
                                          <td className="px-8 py-6 text-center">
                                              <span className="font-mono text-sm text-slate-400 font-bold bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                                                {Math.round(player.rating)}
                                                {/* @ts-ignore */}
                                                {(player.gamesPlayed || 0) < 8 && <span className="text-slate-600 ml-0.5">?</span>}
                                              </span>
                                          </td>
                                          <td className="px-8 py-6 text-right pr-12">
                                              <div className="flex items-center justify-end space-x-4">
                                                  <span className="text-xl font-black text-white tracking-tighter">{player.score || 0}</span>
                                                  <ChevronRight className={`w-4 h-4 text-slate-700 transition-all duration-300 ${expandedPlayerId === player.id ? 'rotate-90 text-brand-orange' : ''}`} />
                                              </div>
                                          </td>
                                      </tr>
                                      <AnimatePresence>
                                          {expandedPlayerId === player.id && (
                                              <tr>
                                                  <td colSpan={5} className="px-0 border-none">
                                                      <motion.div 
                                                          initial={{ height: 0, opacity: 0 }}
                                                          animate={{ height: 'auto', opacity: 1 }}
                                                          exit={{ height: 0, opacity: 0 }}
                                                          className="overflow-hidden bg-black/20"
                                                      >
                                                          <div className="p-8 border-b border-white/5">
                                                              <div className="space-y-6">
                                                                  <p className="text-[9px] uppercase font-black text-slate-600 tracking-[0.3em] mb-4 flex items-center gap-2">
                                                                      <Shield size={12} className="text-brand-orange" /> Round Performance Matrix
                                                                  </p>
                                                                  <div className="flex flex-wrap gap-3">
                                                                      {[...availableRounds].sort((a,b) => a - b).map(r => {
                                                                          const match = initialMatches.find(m => m.round === r && (m.whitePlayerId === player.id || m.blackPlayerId === player.id));
                                                                          if (!match) return <div key={r} className="w-14 h-14 rounded-2xl border border-white/5 flex flex-col items-center justify-center bg-white/5 opacity-20"><span className="text-[8px] text-slate-600 font-black">R{r}</span><span className="text-xs font-black">--</span></div>;
                                                                          
                                                                          const perf = getPerformanceString(player.id, match);
                                                                          const isWin = perf.startsWith('+');
                                                                          const isLoss = perf.startsWith('-');
                                                                          
                                                                          return (
                                                                              <div key={r} className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all shadow-xl
                                                                                  ${isWin ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                                                                                    isLoss ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                                                                                    'bg-white/5 border-white/10 text-slate-400'}`}
                                                                              >
                                                                                  <span className="text-[8px] font-black uppercase opacity-40">Round {r}</span>
                                                                                  <span className="text-sm font-black tracking-tighter">{perf}</span>
                                                                              </div>
                                                                          )
                                                                      })}
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      </motion.div>
                                                  </td>
                                              </tr>
                                          )}
                                      </AnimatePresence>
                                  </React.Fragment>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </motion.div>
        ) : (
          <motion.div
              key="pairings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
          >
              {Object.keys(groupedByRound).length === 0 ? (
                  <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
                      <Swords className="h-16 w-16 mx-auto mb-6 opacity-10 text-white" />
                      <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">Official pairings sequence pending</p>
                  </div>
              ) : (
                  <div className="space-y-10">
                      {/* Round Selector Dropdown */}
                      <div className="flex items-center justify-center sm:justify-start space-x-5 bg-white/[0.02] p-5 rounded-[2rem] border border-white/5 w-fit mx-auto sm:mx-0 shadow-2xl backdrop-blur-md">
                          <label className="text-[9px] uppercase font-black text-slate-500 tracking-[0.3em]">Operational Round</label>
                          <select 
                              value={selectedRound || ''} 
                              onChange={(e) => setSelectedRound(Number(e.target.value))}
                              className="bg-slate-950 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2.5 px-6 rounded-xl outline-none focus:ring-1 focus:ring-brand-orange/50 transition-all min-w-[160px] appearance-none cursor-pointer"
                          >
                              {availableRounds.map(r => (
                                  <option key={r} value={r}>Phase {r}</option>
                              ))}
                          </select>
                      </div>

                      {selectedRound && groupedByRound[selectedRound] && (
                          <div className="space-y-8">
                              <div className="flex items-center space-x-3 text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black px-4">
                                  <ChevronRight className="h-4 w-4 text-brand-orange" />
                                  <span>Round {selectedRound} Official Log</span>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                  {groupedByRound[selectedRound].map(m => (
                                      <div key={m.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl flex justify-between items-center relative overflow-hidden group">
                                          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-black/40 border-x border-b border-white/5 rounded-b-2xl text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 z-20 transition-colors group-hover:text-brand-orange">
                                            Board {m.table || '?'}
                                          </div>
                                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                                          
                                          <div className="text-left flex-1 min-w-0 relative z-10">
                                              <p className="text-[8px] text-slate-600 uppercase font-black mb-2 tracking-widest">White</p>
                                              <p className="text-white font-black uppercase text-base sm:text-xl truncate tracking-tight group-hover:text-brand-orange transition-colors">{m.whitePlayer?.fullName}</p>
                                          </div>
                                          
                                          <div className="px-8 relative z-10">
                                              {m.result ? (
                                                  <div className="bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-orange/5">
                                                      {m.result}
                                                  </div>
                                              ) : (
                                                  <div className="text-slate-800 font-black italic text-2xl opacity-40">VS</div>
                                              )}
                                          </div>
                                          
                                          <div className="text-right flex-1 min-w-0 relative z-10">
                                              <p className="text-[8px] text-slate-600 uppercase font-black mb-2 tracking-widest">Black</p>
                                              <p className="text-white font-black uppercase text-base sm:text-xl truncate tracking-tight group-hover:text-brand-orange transition-colors">{m.blackPlayer?.fullName || 'BYE'}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}