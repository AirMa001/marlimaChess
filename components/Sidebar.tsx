"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Trophy, 
  BookOpen, 
  HeartHandshake, 
  LogOut, 
  Menu,
  X,
  Newspaper
} from "lucide-react";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Tournaments", href: "/tournaments", icon: Trophy },
  { name: "Awards", href: "/awards", icon: HeartHandshake },
  { name: "Study", href: "/study", icon: BookOpen },
  { name: "News", href: "/news", icon: Newspaper },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] p-3 bg-brand-orange/90 backdrop-blur-md text-white rounded-2xl md:hidden shadow-lg shadow-brand-orange/20 border border-white/10 active:scale-95 transition-transform"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/80 backdrop-blur-2xl border-r border-white/5 text-white transform transition-all duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl shadow-black" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="mb-10 px-2 py-4">
            {session?.user ? (
              <Link 
                href="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-5 group transition-all p-4 rounded-3xl hover:bg-white/[0.03] border border-white/5 hover:border-brand-orange/20 shadow-xl shadow-black/20"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20 text-brand-orange font-black text-2xl group-hover:bg-brand-orange group-hover:text-white transition-all shadow-[inset_0_0_20px_rgba(255,102,0,0.1)] group-hover:shadow-brand-orange/40 shrink-0">
                  {session.user.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black text-white truncate uppercase tracking-tight leading-none group-hover:text-brand-orange transition-colors">
                    {session.user.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* @ts-ignore */}
                    {session.user.siteRating !== undefined && (
                      <span className="px-2 py-0.5 bg-brand-orange/10 rounded-md text-[9px] font-black text-brand-orange uppercase tracking-widest border border-brand-orange/20">
                        ELO {(session.user as any).siteRating ? Math.round((session.user as any).siteRating) : 1500}
                        {(session.user as any).gamesPlayed < 8 && '?'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/" onClick={() => setIsOpen(false)} className="block px-2">
                <span className="text-2xl font-black tracking-tighter text-white">
                  MARLIMA<span className="text-brand-orange">CHESS</span>
                </span>
              </Link>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Command Center</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-white" : "group-hover:text-brand-orange transition-colors"} />
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute left-0 w-1 h-6 bg-white rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-4">
            {session ? (
              <button
                onClick={() => signOut()}
                className="flex items-center w-full gap-4 px-4 py-4 text-slate-500 rounded-2xl hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-sm"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full gap-2 px-4 py-4 bg-white text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-brand-orange hover:text-white transition-all duration-300 shadow-xl shadow-white/5"
              >
                <span>Initialize Profile</span>
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}