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
    <div className="space-y-10">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Player Registrations</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Manage access & verification</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 hover:text-white rounded-xl transition-all" title="Sync Registry">
              <RefreshCw className="h-4 w-4" />
          </button>
          <Button onClick={() => setShowRegModal(true)} className="bg-brand-orange h-12 w-12 p-0 rounded-2xl shadow-lg shadow-brand-orange/20">
              <UserPlus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                Pending Requests
                <span className="ml-3 px-3 py-1 rounded-full bg-brand-orange text-white text-[10px] shadow-lg shadow-brand-orange/20">{pending.length}</span>
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-black/20 text-[9px] uppercase font-black tracking-[0.2em] text-slate-500">
                    <tr>
                        <th className="px-8 py-5">Contender</th>
                        <th className="px-8 py-5">Rating</th>
                        <th className="px-8 py-5">Proof</th>
                        <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {pending.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-6">
                                <p className="text-white font-black uppercase tracking-tight group-hover:text-brand-orange transition-colors">{p.fullName}</p>
                                <p className="text-[9px] font-black text-slate-600 tracking-widest mt-0.5">@{p.chessUsername}</p>
                            </td>
                            <td className="px-8 py-6 font-mono text-brand-orange font-black">{p.rating}</td>
                            <td className="px-8 py-6">
                                <button onClick={() => handleViewPlayerReceipt(p.id)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest underline underline-offset-4 decoration-slate-800">View File</button>
                            </td>
                            <td className="px-8 py-6 text-right flex justify-end gap-3">
                                <button onClick={() => handleStatusChange(p, RegistrationStatus.APPROVED)} className="h-10 w-10 flex items-center justify-center bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5" title="Approve"><Check className="h-4 w-4"/></button>
                                <button onClick={() => handleStatusChange(p, RegistrationStatus.REJECTED)} className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5" title="Reject"><X className="h-4 w-4"/></button>
                                <button onClick={() => handleDelete(p.id)} className="h-10 w-10 flex items-center justify-center bg-white/5 text-slate-500 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all" title="Delete Permanent"><Trash2 className="h-4 w-4"/></button>
                            </td>
                        </tr>
                    ))}
                    {pending.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-16 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest opacity-50 italic">No pending registrations found</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5"><h3 className="text-sm font-black text-white uppercase tracking-widest">Active Registry</h3></div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-black/20 text-[9px] uppercase font-black tracking-[0.2em] text-slate-500">
                    <tr>
                        <th className="px-8 py-5">Player</th>
                        <th className="px-8 py-5">Contact</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {players.filter(p => p.status !== RegistrationStatus.PENDING).map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-8 py-6 text-white font-black uppercase tracking-tight">{p.fullName}</td>
                            <td className="px-8 py-6 font-mono text-[10px] text-slate-500">{p.phoneNumber}</td>
                            <td className="px-8 py-6 text-[9px] font-black uppercase tracking-widest">
                              <span className={p.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}>{p.status}</span>
                            </td>
                            <td className="px-8 py-6 text-right">
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
                className="bg-slate-900 border border-white/10 p-8 w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-brand-orange/10 blur-3xl rounded-full" />
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Manual Add</h2>
                    <button onClick={() => setShowRegModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-5 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
                        <input placeholder="Full Name" value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Contact</label>
                        <input placeholder="Phone Number" value={regForm.phoneNumber} onChange={e => setRegForm({...regForm, phoneNumber: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">ELO Rating</label>
                            <input placeholder="1500" type="number" value={regForm.rating} onChange={e => setRegForm({...regForm, rating: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Chess ID</label>
                            <input placeholder="Username" value={regForm.chessUsername} onChange={e => setRegForm({...regForm, chessUsername: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-brand-orange/50 transition-all placeholder-slate-700" />
                        </div>
                    </div>
                    <Button onClick={handleManualRegister} isLoading={isRegistering} className="w-full mt-4 h-14 bg-brand-orange hover:bg-white hover:text-slate-950 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-brand-orange/20 rounded-2xl">Forge Identity</Button>
                </div>
            </motion.div>
        </div>
      )}

      {/* Sophisticated Receipt Viewer Modal */}
      <AnimatePresence>
        {activeReceiptUrl && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
              className="relative bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-brand-orange/10 rounded-2xl">
                    <ImageIcon className="h-6 w-6 text-brand-orange" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">System Audit: Proof</h3>
                </div>
                <button 
                  onClick={() => setActiveReceiptUrl(null)}
                  className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex items-center justify-center bg-black/40">
                <img 
                  src={activeReceiptUrl} 
                  alt="Payment Receipt" 
                  className="max-w-full h-auto rounded-[2rem] shadow-2xl ring-1 ring-white/10"
                />
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] text-center">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">Verification Protocol Active</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}