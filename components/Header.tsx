"use client";

import React from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  isOpen: boolean;
}

export default function Header({ onMenuClick, isOpen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-4 md:px-8 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle - Only visible if sidebar is closed on mobile */}
        {!isOpen && (
          <button
            onClick={onMenuClick}
            className="p-2.5 bg-brand-orange text-white rounded-xl md:hidden shadow-lg shadow-brand-orange/20 active:scale-95 transition-all"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-none">
            MARLIMA<span className="text-brand-orange">CHESS</span>
          </h1>
          <div className="hidden sm:block h-4 w-px bg-slate-200 mx-2" />
          <p className="hidden sm:block text-[8px] font-black text-slate-400 pt-0.5">
            Elite Management
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Slot for profile or extra actions */}
      </div>
    </header>
  );
}
