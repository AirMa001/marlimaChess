'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Users, Swords, Trophy, LayoutDashboard, Settings, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { ADMIN_PASSWORD } from '@/constants';
import { toast } from 'sonner';
import { purgeRedisAction } from '@/app/actions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    setIsAuthenticated(auth === 'true');
  }, []);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ADMIN_PASSWORD;
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      toast.success("Welcome back, Administrator");
    } else {
      toast.error("Access Denied", { description: "Incorrect password." });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
    toast.info("Logged out");
  };

  const navLinks = [
    { href: '/admin', label: 'Registrations', icon: Users },
    { href: '/admin/pairings', label: 'Pairings', icon: Settings },
    { href: '/admin/matches', label: 'Matches', icon: Swords },
    { href: '/admin/standings', label: 'Standings', icon: Trophy },
  ];

  // Prevent flicker by not rendering anything until we know the auth status
  if (isAuthenticated === null) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen bg-slate-950">
      {!isAuthenticated ? (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[99999]">
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-sm w-full">
             <div className="flex justify-center mb-6">
                <div className="p-3 bg-green-600/10 rounded-full">
                  <ShieldAlert className="h-8 w-8 text-green-500" />
                </div>
              </div>
            <h2 className="text-2xl font-bold text-center text-white mb-6">Admin Access</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Admin Password"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
              <Button type="submit" className="w-full">Login</Button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-500"></p>
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <LayoutDashboard className="mr-2 h-5 w-5 text-green-500" />
                        Admin Portal
                    </h1>
                    <nav className="hidden lg:flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {navLinks.map(link => (
                            <Link 
                                key={link.href} 
                                href={link.href}
                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${pathname === link.href ? 'bg-slate-800 text-white shadow ring-1 ring-white/5' : 'text-slate-400 hover:text-white'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center justify-between md:justify-end space-x-4">
                    <div className="lg:hidden flex bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-[200px]">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href} className={`px-3 py-1 rounded-md text-[10px] whitespace-nowrap ${pathname === link.href ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    
                                    <div className="flex items-center space-x-2">
                    
                                        <button 
                    
                                            onClick={handlePurgeCache}
                    
                                            className="p-2 rounded-lg border border-slate-800 text-red-400 hover:text-red-300 transition-all bg-slate-950 hover:bg-red-500/10"
                    
                                            title="Purge Redis Cache (Fix Stale Data)"
                    
                                        >
                    
                                            <Trash2 className="h-4 w-4" />
                    
                                        </button>
                    
                                        <button 
                    
                                            onClick={handleRefresh}
                    
                    
                            disabled={isPending}
                            className={`p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white transition-all bg-slate-950 ${isPending ? 'bg-green-500/10 border-green-500/50' : ''}`}
                            title="Sync Data"
                        >
                            <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin text-green-500' : ''}`} />
                        </button>
                        <Button variant="outline" onClick={handleLogout} className="px-3 border-slate-800 text-slate-400 h-9">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {children}
          </main>
        </>
      )}
    </div>
  );
}
