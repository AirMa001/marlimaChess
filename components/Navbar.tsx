'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChessKnight, Users, LayoutDashboard, Home, Crown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../constants';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => pathname === path 
    ? "text-green-400 bg-slate-900 shadow-inner shadow-green-900/20" 
    : "text-slate-400 hover:text-white hover:bg-slate-800/50";

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/register', label: 'Register', icon: Crown },
    { href: '/participants', label: 'Players', icon: Users },
    { href: '/admin', label: 'Admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-900 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="bg-green-500/10 p-1.5 sm:p-2 rounded-lg border border-green-500/20 group-hover:border-green-500/40 transition-colors">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
            <div className="flex flex-col sm:block">
                <span className="text-sm sm:text-xl font-bold text-white tracking-tight whitespace-nowrap">
                    <span className="sm:hidden">UNN Chess</span>
                    <span className="hidden sm:inline">{APP_NAME}</span>
                </span>
            </div>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200 ${isActive(link.href)}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-slate-950 border-b border-slate-900"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium flex items-center space-x-3 transition-colors ${isActive(link.href)}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
