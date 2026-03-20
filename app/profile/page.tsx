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
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10 pb-20 px-4">
      {/* Profile Header */}
      <motion.div 
        layout
        className="bg-white/70 backdrop-blur-3xl border border-white rounded-[2rem] sm:rounded-[3.5rem] p-5 sm:p-16 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-orange/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10 relative z-10">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-slate-50 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center text-5xl sm:text-7xl font-black border border-slate-100 text-brand-orange overflow-hidden shadow-inner">
              {editData.image || user.image ? (
                <img src={editData.image || user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.[0] || "U"
              )}
            </div>
            {isEditing && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/40 rounded-[2.5rem] sm:rounded-[3rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
              >
                <Camera className="text-white h-8 w-8 sm:h-10 sm:w-10" />
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
              {isEditing ? (
                <input 
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="bg-white/70 border border-brand-orange/30 rounded-xl px-4 py-2 sm:px-6 sm:py-3 text-2xl sm:text-3xl font-black text-slate-900 focus:outline-none focus:border-brand-orange w-full sm:w-auto shadow-sm"
                />
              ) : (
                <div className="flex items-center gap-3 sm:gap-4">
                  <h1 className="text-2xl sm:text-5xl font-black text-slate-900 uppercase tracking-tight leading-none">{user.name}</h1>
                  <ShieldCheck className="text-brand-orange h-6 w-6 sm:h-8 sm:w-8" />
                </div>
              )}
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 sm:p-3 bg-slate-50 hover:bg-brand-orange hover:text-white rounded-xl text-slate-400 transition-all shadow-sm border border-slate-100"
                >
                  <Edit3 size={16} />
                </button>
              ) : (
                <div className="flex gap-2 sm:gap-3">
                  <button onClick={handleSave} disabled={saving} className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100">
                    {saving ? <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" /> : <Check size={18} />}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100">
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {isEditing ? (
                <textarea 
                  placeholder="Describe your professional chess approach..."
                  value={editData.bio}
                  onChange={e => setEditData({...editData, bio: e.target.value})}
                  className="w-full bg-white/70 border border-slate-200 rounded-2xl p-4 sm:p-6 text-slate-600 text-sm focus:outline-none focus:border-brand-orange resize-none h-28 sm:h-32 leading-relaxed shadow-sm"
                />
              ) : (
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
                  {user.bio || "This player has not yet defined their professional profile."}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6 pt-2 sm:pt-4">
              <div className="px-4 py-2 sm:px-8 sm:py-4 bg-white/70 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 shadow-sm flex-1 sm:flex-none">
                <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-black tracking-[0.15em] sm:tracking-[0.2em] block mb-0.5 sm:mb-1.5">Official ELO</span>
                <span className="font-mono font-black text-brand-orange text-xl sm:text-3xl tracking-tighter">
                  {Math.round(siteRating)}
                  {isProvisional && <span className="text-slate-300 ml-0.5 sm:ml-1 text-sm sm:text-xl">?</span>}
                </span>
              </div>
              <div className="px-4 py-2 sm:px-8 sm:py-4 bg-white/70 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 shadow-sm flex-1 sm:flex-none">
                <span className="text-[8px] sm:text-[10px] text-slate-400 uppercase font-black tracking-[0.15em] sm:tracking-[0.2em] block mb-0.5 sm:mb-1.5">Peak Rank</span>
                <span className="font-mono font-black text-blue-600 text-xl sm:text-3xl tracking-tighter">
                  {bestRank ? `#${bestRank}` : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ExternalStats platform={user.platform || 'Global'} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
            <Award className="text-brand-orange h-5 w-5 sm:h-6 sm:w-6" />
            Achievements
          </h2>
          {user.awards?.length > 0 ? (
            <ul className="space-y-4 sm:space-y-5">
              {user.awards.map((award: any) => (
                <li key={award.id} className="flex items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl group hover:border-brand-orange/30 transition-all shadow-sm">
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{award.icon || "🏆"}</span>
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 uppercase text-xs sm:text-sm tracking-widest truncate">{award.title}</div>
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 sm:mt-1.5">
                      Awarded {new Date(award.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-12 sm:py-16 text-center space-y-2 sm:space-y-3">
              <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">Registry record empty</p>
            </div>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
            <History className="text-blue-600 h-5 w-5 sm:h-6 sm:w-6" />
            Match Performance
          </h2>
          {user.registrations?.length > 0 ? (
            <div className="space-y-4 sm:space-y-5">
              {user.registrations.map((reg: any) => (
                <div key={reg.id} className="flex justify-between items-center p-4 sm:p-5 bg-white border border-slate-100 rounded-2xl group hover:border-brand-orange/30 transition-all shadow-sm">
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 uppercase text-xs sm:text-sm tracking-tight truncate group-hover:text-brand-orange transition-colors">{reg.tournament.name}</div>
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 sm:mt-1.5">
                      {new Date(reg.tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3 sm:ml-4">
                    <div className="font-black text-brand-orange text-lg sm:text-xl tracking-tighter">{reg.score} PTS</div>
                    <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank #{reg.rank || "--"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 sm:py-16 text-center space-y-2 sm:space-y-3">
              <BarChart2 className="h-10 w-10 sm:h-12 sm:w-12 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em]">No official data recorded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}