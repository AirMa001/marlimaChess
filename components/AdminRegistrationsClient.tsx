'use client';

import React, { useState } from 'react';
import { updatePlayerStatusAction, deletePlayerAction, savePlayerAction } from '@/app/actions';
import { Player, RegistrationStatus, ChessPlatform } from '@/types';
import { Button } from '@/components/Button';
import { Check, X, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { sendApprovalSMS } from '@/services/smsService';

interface AdminRegistrationsClientProps {
  initialPlayers: Player[];
}

export default function AdminRegistrationsClient({ initialPlayers }: AdminRegistrationsClientProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [showRegModal, setShowRegModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regForm, setRegForm] = useState({
    fullName: '',
    department: '',
    phoneNumber: '',
    chessUsername: '',
    platform: ChessPlatform.CHESS_COM,
    rating: ''
  });

  const handleStatusChange = async (player: Player, newStatus: RegistrationStatus) => {
    const promise = async () => {
        const updatedList = await updatePlayerStatusAction(player.id, newStatus);
        setPlayers(updatedList);
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
                setPlayers(updatedList);
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
            rating: regForm.rating ? parseInt(regForm.rating) : 1200,
            status: RegistrationStatus.APPROVED,
            registeredAt: new Date().toISOString()
        } as Player;
        
        await savePlayerAction(newPlayer);
        setPlayers(prev => [newPlayer, ...prev]);
        toast.success("Player Added");
        setShowRegModal(false);
    } catch (e) { toast.error("Failed"); } finally { setIsRegistering(false); }
  };

  const handleViewReceipt = (url?: string) => {
    if (!url) return toast.error("No receipt");
    const win = window.open();
    win?.document.write(`<img src="${url}" style="max-width:100%;" />`);
  };

  const pending = players.filter(p => p.status === RegistrationStatus.PENDING);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Player Registrations</h2>
        <Button onClick={() => setShowRegModal(true)} className="bg-green-600 h-10">
            <UserPlus className="h-4 w-4 mr-2" />
        </Button>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-bold text-white flex items-center">
                Pending
                <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px]">{pending.length}</span>
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950/50 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Contender</th>
                        <th className="px-6 py-4">Rating</th>
                        <th className="px-6 py-4">Proof</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {pending.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="px-6 py-4">
                                <p className="text-white font-bold">{p.fullName}</p>
                                <p className="text-[10px] text-slate-500">@{p.chessUsername}</p>
                            </td>
                            <td className="px-6 py-4 font-mono text-green-400 font-bold">{p.rating}</td>
                            <td className="px-6 py-4">
                                <button onClick={() => handleViewReceipt(p.paymentReceipt)} className="text-[10px] text-slate-400 hover:text-white underline">View</button>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 flex justify-end">
                                <button onClick={() => handleStatusChange(p, RegistrationStatus.APPROVED)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20" title="Approve"><Check className="h-4 w-4"/></button>
                                <button onClick={() => handleStatusChange(p, RegistrationStatus.REJECTED)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20" title="Reject"><X className="h-4 w-4"/></button>
                                <button onClick={() => handleDelete(p.id)} className="p-2 bg-slate-800 text-slate-500 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-colors" title="Delete Permanent"><Trash2 className="h-4 w-4"/></button>
                            </td>
                        </tr>
                    ))}
                    {pending.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No pending registrations</td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800"><h3 className="font-bold text-white">Registry</h3></div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-950/50 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Player</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {players.filter(p => p.status !== RegistrationStatus.PENDING).map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 text-white font-medium">{p.fullName}</td>
                            <td className="px-6 py-4 font-mono text-xs">{p.phoneNumber}</td>
                            <td className="px-6 py-4 text-[10px] uppercase font-bold">
                              <span className={p.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}>{p.status}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDelete(p.id)} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Manual Add</h2><button onClick={() => setShowRegModal(false)}><X className="h-5 w-5" /></button></div>
                <div className="space-y-4">
                    <input placeholder="Full Name" value={regForm.fullName} onChange={e => setRegForm({...regForm, fullName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500" />
                    <input placeholder="Phone Number" value={regForm.phoneNumber} onChange={e => setRegForm({...regForm, phoneNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500" />
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Rating" type="number" value={regForm.rating} onChange={e => setRegForm({...regForm, rating: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500" />
                        <input placeholder="Username" value={regForm.chessUsername} onChange={e => setRegForm({...regForm, chessUsername: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500" />
                    </div>
                    <Button onClick={handleManualRegister} isLoading={isRegistering} className="w-full mt-4 h-12">Register Player</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
