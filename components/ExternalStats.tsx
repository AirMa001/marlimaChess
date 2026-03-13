'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, Swords, Shield, Loader2 } from 'lucide-react';

interface Stats {
  bullet?: number;
  blitz?: number;
  rapid?: number;
  classical?: number;
}

interface ExternalStatsProps {
  platform: string;
}

export default function ExternalStats({ platform }: ExternalStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/user/external-stats');
        if (res.ok) setStats(await res.json());
      } catch (e) {
        console.error("External stats fetch error");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-xl">
        <Loader2 className="animate-spin text-brand-orange h-8 w-8" />
      </div>
    );
  }

  const statItems = [
    { label: 'Bullet', value: stats?.bullet, icon: Zap, color: 'text-yellow-600' },
    { label: 'Blitz', value: stats?.blitz, icon: Swords, color: 'text-orange-600' },
    { label: 'Rapid', value: stats?.rapid, icon: Clock, color: 'text-green-600' },
    { label: 'Classical', value: stats?.classical, icon: Shield, color: 'text-blue-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-1 w-8 bg-brand-orange rounded-full" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{platform} Standings</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-xl relative overflow-hidden text-center"
          >
            <div className={`absolute top-0 left-0 w-1 h-full opacity-50 ${item.color.replace('text', 'bg')}`} />
            
            <item.icon className={`mx-auto h-6 w-6 mb-4 ${item.color} group-hover:scale-110 transition-transform`} />
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
              {item.value || '----'}
            </p>
            
            {!item.value && (
              <div className="mt-2 text-[8px] font-bold text-slate-300 uppercase tracking-tighter">No History</div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}