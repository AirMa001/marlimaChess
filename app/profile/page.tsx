'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Trophy, 
  BarChart2, 
  ShieldCheck, 
  Edit3, 
  Camera, 
  Check, 
  X,
  FileText,
  Loader2,
  Trash2,
  Award,
  History
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import ExternalStats from "@/components/ExternalStats";
import { uploadImageAction } from '@/app/actions';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit States
  const [editData, setEditData] = useState({
    name: '',
    bio: '',
    image: ''
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setEditData({
            name: data.name || '',
            bio: data.bio || '',
            image: data.image || ''
          });
        } else {
          router.push('/login');
        }
      } catch (e) {
        toast.error("Profile load failed");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setEditData({ ...editData, image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = editData.image;
      
      if (editData.image.startsWith('data:image')) {
        finalImageUrl = await uploadImageAction(editData.image);
      }

      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          image: finalImageUrl
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const result = await res.json();
      setUser({ ...user, ...result.user });
      await update(); 
      setIsEditing(false);
      toast.success("Identity Updated!");
    } catch (e) {
      toast.error("Update Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-orange h-12 w-12" />
    </div>
  );

  if (!user) return null;

  const siteRating = user.siteRating || 1500;
  const isProvisional = (user.gamesPlayed || 0) < 8;
  const bestRank = user.registrations?.length > 0
    ? user.registrations.reduce((min: any, r: any) => (r.rank && (!min || r.rank < min) ? r.rank : min), null)
    : null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4">
      {/* Profile Header */}
      <motion.div 
        layout
        className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-16 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-orange/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-40 h-40 sm:w-48 sm:h-48 bg-white/5 rounded-[3rem] flex items-center justify-center text-7xl font-black border border-white/10 text-brand-orange overflow-hidden shadow-inner">
              {editData.image || user.image ? (
                <img src={editData.image || user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0] || "U"
              )}
            </div>
            {isEditing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 rounded-[3rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
              >
                <Camera className="text-white h-10 w-10" />
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {isEditing ? (
                <input 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="bg-slate-950/50 border border-brand-orange/30 rounded-xl px-6 py-3 text-3xl font-black text-white focus:outline-none focus:border-brand-orange w-full sm:w-auto"
                />
              ) : (
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">{user.name}</h1>
                  <ShieldCheck className="text-brand-orange h-8 w-8" />
                </div>
              )}
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-3 bg-white/5 hover:bg-brand-orange hover:text-white rounded-xl text-slate-500 transition-all shadow-lg"
                >
                  <Edit3 size={18} />
                </button>
              ) : (
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={saving} className="h-12 w-12 flex items-center justify-center bg-emerald-500/20 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all">
                    {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Check size={20} />}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="h-12 w-12 flex items-center justify-center bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <textarea 
                  placeholder="Describe your professional chess approach..."
                  value={editData.bio}
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-6 text-slate-300 text-sm focus:outline-none focus:border-brand-orange resize-none h-32 leading-relaxed"
                />
              ) : (
                <p className="text-slate-400 text-base leading-relaxed max-w-2xl font-medium opacity-80">
                  {user.bio || "This player has not yet defined their professional profile."}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
              <div className="px-8 py-4 bg-slate-950/50 rounded-[1.5rem] border border-white/5 shadow-inner">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-1.5 opacity-60">Official ELO</span>
                <span className="font-mono font-black text-brand-orange text-3xl tracking-tighter">
                  {Math.round(siteRating)}
                  {isProvisional && <span className="text-slate-700 ml-1 text-xl">?</span>}
                </span>
              </div>
              <div className="px-8 py-4 bg-slate-950/50 rounded-[1.5rem] border border-white/5 shadow-inner">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mb-1.5 opacity-60">Peak Rank</span>
                <span className="font-mono font-black text-blue-500 text-3xl tracking-tighter">
                  {bestRank ? `#${bestRank}` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ExternalStats platform={user.platform || 'Global'} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
            <Award className="text-brand-orange h-6 w-6" />
            Achievements
          </h2>
          {user.awards?.length > 0 ? (
            <ul className="space-y-5">
              {user.awards.map((award: any) => (
                <li key={award.id} className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                  <span className="text-4xl group-hover:scale-110 transition-transform">{award.icon || "🏆"}</span>
                  <div>
                    <div className="font-black text-white uppercase text-sm tracking-widest">{award.title}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">
                      Awarded {new Date(award.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-16 text-center space-y-3">
              <Trophy className="h-12 w-12 text-slate-800 mx-auto opacity-20" />
              <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">Registry record empty</p>
            </div>
          )}
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-4">
            <History className="text-blue-500 h-6 w-6" />
            Match Performance
          </h2>
          {user.registrations?.length > 0 ? (
            <div className="space-y-5">
              {user.registrations.map((reg: any) => (
                <div key={reg.id} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                  <div className="min-w-0">
                    <div className="font-black text-white uppercase text-sm tracking-tight truncate group-hover:text-brand-orange transition-colors">{reg.tournament.name}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">
                      {new Date(reg.tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-black text-brand-orange text-xl tracking-tighter">{reg.score} PTS</div>
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Rank #{reg.rank || "--"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <BarChart2 className="h-12 w-12 text-slate-800 mx-auto opacity-20" />
              <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">No official data recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}