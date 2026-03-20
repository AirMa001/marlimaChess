'use client';

import React, { useState } from 'react';
import { updatePlayerStatusAction, deletePlayerAction, savePlayerAction, getPaymentReceiptAction, getPlayersAction } from '@/app/actions';
import { Player, RegistrationStatus, ChessPlatform } from '@/types';
import { Button } from '@/components/Button';
import { Check, X, Trash2, UserPlus, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { sendApprovalSMS } from '@/services/smsService';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminRegistrationsClientProps {
  initialPlayers: Player[];
  tournamentId: number;
}

export default function AdminRegistrationsClient({ initialPlayers, tournamentId }: AdminRegistrationsClientProps) {
  const [players, setPlayers] = useState<Player[]>(Array.isArray(initialPlayers) ? initialPlayers : []);
  const [showRegModal, setShowRegModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({
    fullName: '',
    department: '',
    phoneNumber: '',
    chessUsername: '',
    platform: ChessPlatform.CHESS_COM,
    rating: ''
  });

  const loadData = async () => {
    const updated = await getPlayersAction(tournamentId);
    setPlayers(updated as any);
  };

  const handleRefresh = () => {
    toast.promise(loadData(), {
      loading: "Fetching fresh records...",
      success: "Registry synced",
      error: "Sync failed"
    });
  };

  const handleStatusChange = async (player: Player, newStatus: RegistrationStatus) => {
    const promise = async () => {
        const updatedList = await updatePlayerStatusAction(player.id, newStatus);
        setPlayers(updatedList as any);
        if (newStatus === RegistrationStatus.APPROVED) {
            sendApprovalSMS(player).catch(err => console.error(err));
        }
    };
    toast.promise(promise(), {
        loading: `Updating ${player.fullName}...`,
        success: `Player ${newStatus.toLowerCase()}`,
        error: "Update failed"
    });
  };

  const handleDelete = async (id: string) => {
    toast("Delete Player?", {
        description: "This action is permanent.",
        action: {
            label: "Delete",
            onClick: async () => {
                const updatedList = await deletePlayerAction(id);
                setPlayers(updatedList as any);
                toast.success("Deleted");
            }
        }
    });
  };

  const handleManualRegister = async () => {
    if (!regForm.fullName || !regForm.phoneNumber) return toast.error("Name/Phone required");
    setIsRegistering(true);
    try {
        const newPlayer = {
            id: crypto.randomUUID(),
            ...regForm,
            rating: regForm.rating ? parseInt(regForm.rating) : 1500,
            status: RegistrationStatus.APPROVED,
            registeredAt: new Date().toISOString(),
            tournamentId: tournamentId
        } as any;
        
        await savePlayerAction(newPlayer);
        setPlayers(prev => [newPlayer, ...prev]);
        toast.success("Player Added");
        setShowRegModal(false);
    } catch (e: any) { 
      toast.error(e.message || "Failed"); 
    } finally { 
      setIsRegistering(false); 
    }
  };

  const handleViewPlayerReceipt = async (playerId: string) => {
    const promise = async () => {
        const url = await getPaymentReceiptAction(playerId);
        if (!url) throw new Error("No receipt found");
        setActiveReceiptUrl(url);
    };

    toast.promise(promise(), {
        loading: "Fetching receipt...",
        success: "Receipt loaded",
        error: (err) => err.message
    });
  };

  const pending = players.filter(p => p.status === RegistrationStatus.PENDING);

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 sm:px-2">
        <div className="space-y-0.5">
            <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight leading-none">Registrations</h2>
            <p className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Manage access & verification</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button onClick={handleRefresh} className="h-11 sm:h-12 flex-1 sm:w-12 flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 hover:text-white rounded-xl transition-all" title="Sync Registry">
              <RefreshCw className="h-4 w-4" />
          </button>
          <Button onClick={() => setShowRegModal(true)} className="bg-brand-orange h-11 sm:h-12 flex-[3] sm:w-12 p-0 rounded-xl sm:rounded-2xl shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Manual Add</span>
          </Button>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-5 sm:p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest flex items-center">
                Pending
                <span className="ml-3 px-2 py-0.5 rounded-full bg-brand-orange text-white text-[10px] shadow-lg shadow-brand-orange/20">{pending.length}</span>
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-black/20 text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-slate-500">
                    <tr>
                        <th className="px-4 sm:px-8 py-4 sm:py-5">Contender</th>
                        <th className="px-4 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">Rating</th>
                        <th className="px-4 sm:px-8 py-4 sm:py-5">Proof</th>
                        <th className="px-4 sm:px-8 py-4 sm:py-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {pending.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                                <p className="text-white font-black uppercase tracking-tight group-hover:text-brand-orange transition-colors text-xs sm:text-base truncate max-w-[120px] sm:max-w-none">{p.fullName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[8px] sm:text-[9px] font-black text-slate-600 tracking-widest">@{p.chessUsername}</p>
                                  <span className="sm:hidden text-[8px] font-bold text-brand-orange font-mono">{p.rating}</span>
                                </div>
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6 font-mono text-brand-orange font-black hidden sm:table-cell">{p.rating}</td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                                <button onClick={() => handleViewPlayerReceipt(p.id)} className="text-[9px] sm:text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest underline underline-offset-4 decoration-slate-800">View</button>
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                                <div className="flex justify-end gap-1.5 sm:gap-3">
                                  <button onClick={() => handleStatusChange(p, RegistrationStatus.APPROVED)} className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-lg sm:rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5" title="Approve"><Check className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></button>
                                  <button onClick={() => handleStatusChange(p, RegistrationStatus.REJECTED)} className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-lg sm:rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5" title="Reject"><X className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></button>
                                  <button onClick={() => handleDelete(p.id)} className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center bg-white/5 text-slate-500 rounded-lg sm:rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all" title="Delete"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {pending.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 sm:px-8 py-12 sm:py-16 text-center text-slate-600 font-black uppercase text-[9px] sm:text-[10px] tracking-widest opacity-50 italic">No pending requests</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-5 sm:p-8 border-b border-white/5"><h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Active Registry</h3></div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-black/20 text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-slate-500">
                    <tr>
                        <th className="px-4 sm:px-8 py-4 sm:py-5">Player</th>
                        <th className="px-4 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">Contact</th>
                        <th className="px-4 sm:px-8 py-4 sm:py-5">Status</th>
                        <th className="px-4 sm:px-8 py-4 sm:py-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {players.filter(p => p.status !== RegistrationStatus.PENDING).map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-4 sm:px-8 py-4 sm:py-6">
                              <p className="text-white font-black uppercase tracking-tight text-xs sm:text-base truncate max-w-[140px] sm:max-w-none">{p.fullName}</p>
                              <p className="sm:hidden font-mono text-[8px] text-slate-500 mt-0.5">{p.phoneNumber}</p>
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6 font-mono text-[10px] text-slate-500 hidden sm:table-cell">{p.phoneNumber}</td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                              <span className={p.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}>{p.status}</span>
                            </td>
                            <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                                <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-white/10 p-6 sm:p-8 w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-brand-orange/10 blur-3xl rounded-full" />
                <div className="flex justify-between items-center mb-6 sm:mb-8 relative z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-none">Manual Add</h2>
                    <button onClick={() => setShowRegModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-4 sm:space-y-5 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                        <input placeholder="Full Name" value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Contact</label>
                        <input placeholder="Phone Number" value={regForm.phoneNumber} onChange={e => setRegForm({...regForm, phoneNumber: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">ELO Rating</label>
                            <input placeholder="1500" type="number" value={regForm.rating} onChange={e => setRegForm({...regForm, rating: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chess ID</label>
                            <input placeholder="Username" value={regForm.chessUsername} onChange={e => setRegForm({...regForm, chessUsername: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                        </div>
                    </div>
                    <Button onClick={handleManualRegister} isLoading={isRegistering} className="w-full mt-2 sm:mt-4 h-12 sm:h-14 bg-brand-orange hover:bg-white hover:text-slate-950 text-white font-black uppercase text-[10px] sm:text-xs tracking-widest shadow-xl shadow-brand-orange/20 rounded-xl sm:rounded-2xl">Forge Identity</Button>
                </div>
            </motion.div>
        </div>
      )}

      {/* Sophisticated Receipt Viewer Modal */}
      <AnimatePresence>
        {activeReceiptUrl && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReceiptUrl(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-slate-900 border border-white/10 rounded-[2rem] sm:rounded-[3rem] overflow-hidden max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] shadow-2xl flex flex-col"
            >
              <div className="p-5 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="p-2 sm:p-3 bg-brand-orange/10 rounded-xl sm:rounded-2xl">
                    <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-brand-orange" />
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight">System Audit</h3>
                </div>
                <button 
                  onClick={() => setActiveReceiptUrl(null)}
                  className="p-2 sm:p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl sm:rounded-2xl transition-all"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex items-center justify-center bg-black/40">
                <img 
                  src={activeReceiptUrl} 
                  alt="Payment Receipt" 
                  className="max-w-full h-auto rounded-xl sm:rounded-[2rem] shadow-2xl ring-1 ring-white/10"
                />
              </div>

              <div className="p-5 sm:p-8 border-t border-white/5 bg-white/[0.02] text-center">
                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] sm:tracking-[0.3em]">Verification Protocol Active</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}