"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-200 bg-transparent relative">
        <Header onMenuClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
        <main className="flex-1 p-4 pt-20 sm:pt-24 md:p-8 md:pt-24 bg-transparent relative z-30">
          {children}
        </main>
        <footer className="border-t border-slate-200/50 py-8 text-center text-slate-500 text-sm bg-transparent backdrop-blur-sm">
          <p>© 2026 Marlima Chess.</p>
        </footer>
      </div>
    </div>
  );
}
