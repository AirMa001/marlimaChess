"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User, Newspaper } from 'lucide-react';

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Tournaments", href: "/tournaments", icon: Trophy },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#f8fafc]/80 backdrop-blur-xl border-t border-slate-200 z-[60] pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center max-w-md mx-auto px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90 ${
                isActive ? 'text-brand-orange' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-brand-orange/10' : ''}`}>
                <Icon size={20} className={isActive ? "stroke-[3px]" : "stroke-[2px]"} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-60'}`}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
