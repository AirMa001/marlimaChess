'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LogOut, Users, Swords, Trophy, LayoutDashboard, Settings, RefreshCw, ShieldAlert, Trash2, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import { purgeRedisAction } from '@/app/actions';
import { useSession } from 'next-auth/react';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tournamentId');
  const tid = tournamentId || '1';

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const checkAuthorization = async () => {
      try {
        const res = await fetch(`/api/tournaments/${tid}`);
        if (!res.ok) {
          setIsAuthorized(false);
          return;
        }
        const tournament = await res.json();
        
        // Check if current user is the organizer
        if (session?.user && (session.user as any).id === tournament.organizerId) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [status, tid, session]);

  const handlePurgeCache = async () => {
    const promise = async () => {
      await purgeRedisAction();
      router.refresh();
    };

    toast.promise(promise(), {
      loading: "Purging Redis cache...",
      success: "Cache cleared & site synced",
      error: "Failed to purge cache"
    });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      toast.success("Syncing data...", { duration: 1000 });
    });
  };

  const navLinks = [
    { href: `/admin?tournamentId=${tid}`, label: 'Registrations', icon: Users },
    { href: `/admin/pairings?tournamentId=${tid}`, label: 'Pairings', icon: Settings },
    { href: `/admin/matches?tournamentId=${tid}`, label: 'Matches', icon: Swords },
    { href: `/admin/standings?tournamentId=${tid}`, label: 'Standings', icon: Trophy },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl max-w-sm w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/10 rounded-[1.5rem]">
              <Lock className="h-10 w-10 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed">
            Only the creator of this tournament can access the administrative controls.
          </p>
          <Link href={`/tournaments/${tid}`} className="block">
            <Button className="w-full py-4 bg-white text-slate-950 hover:bg-brand-orange hover:text-white font-black uppercase text-xs tracking-widest transition-all rounded-2xl">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arena
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617]">
      <div className="border-b border-white/5 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col py-3 sm:py-4 gap-3 sm:gap-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                  <Link href={`/tournaments/${tid}`} className="p-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl transition-all" title="Return to Arena">
                      <ArrowLeft size={18} />
                  </Link>
                  <div className="flex flex-col">
                    <h1 className="text-base sm:text-xl font-black text-white flex items-center tracking-tight uppercase leading-none">
                        Admin Portal
                    </h1>
                    <p className="text-[8px] sm:text-[9px] font-black text-brand-orange uppercase tracking-widest mt-1 opacity-80">Tournament Control</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2">
                  <button 
                      onClick={handlePurgeCache}
                      className="p-2 sm:p-2.5 rounded-xl border border-white/10 text-red-400 hover:text-white hover:bg-red-500/20 transition-all bg-white/5"
                      title="Purge Redis Cache"
                  >
                      <Trash2 className="h-4 w-4" />
                  </button>
                  <button 
                      onClick={handleRefresh}
                      disabled={isPending}
                      className={`p-2 sm:p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all bg-white/5 ${isPending ? 'bg-brand-orange/20 border-brand-orange/50' : ''}`}
                      title="Sync Data"
                  >
                      <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin text-brand-orange' : ''}`} />
                  </button>
                  <Button variant="ghost" onClick={() => router.push('/api/auth/signout')} className="px-2.5 sm:px-3 border-white/10 text-slate-400 h-9 sm:h-10 rounded-xl hover:bg-red-500/10 hover:text-red-400">
                      <LogOut className="h-4 w-4" />
                  </Button>
              </div>
            </div>

            <nav className="flex bg-white/5 p-1 rounded-xl sm:rounded-2xl border border-white/10 overflow-x-auto no-scrollbar gap-1">
                {navLinks.map(link => (
                    <Link 
                        key={link.href} 
                        href={link.href}
                        className={`flex-1 min-w-[90px] sm:min-w-[120px] text-center px-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${pathname === link.href.split('?')[0] ? 'bg-brand-orange text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        {link.label}
                    </Link>
                ))}
            </nav>
          </div>
        </div>
      </div>

      <main className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}