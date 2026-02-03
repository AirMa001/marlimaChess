'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { Trophy, ArrowRight, BrainCircuit, Activity, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';

interface HomeClientProps {}

export default function HomeClient({}: HomeClientProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-green-500/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden min-h-[90vh] flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop"
            alt="Chess Background"
            fill
            priority
            className="object-cover opacity-10 blur-[2px] scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
        <div className="absolute inset-0 bg-radial-gradient from-green-500/5 via-transparent to-transparent opacity-40" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-full px-4 py-1.5 mb-8 shadow-xl shadow-green-900/5">
            <Trophy className="w-4 h-4 text-green-500" />
            <span className="text-slate-300 text-sm font-medium tracking-wide">Marlima Tournament, February 2026</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tight mb-6 md:mb-8 leading-tight">
            UNN <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-600 animate-gradient">
              Rapid Tournament
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-2xl text-slate-400 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2">
            The official departmental championship. Verify your rating, represent your faculty, and claim the title of Campus Grandmaster.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col gap-4 w-full max-w-xs mx-auto sm:max-w-none sm:flex-row sm:justify-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full h-14 px-10 text-lg shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-shadow">
                Register Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/participants" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-14 px-10 text-lg border-slate-700 hover:bg-slate-800 bg-slate-950/50 backdrop-blur-sm">
                <Users className="mr-2 w-5 h-5" />
                View Players
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-slate-950 relative border-t border-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: ShieldCheck, title: "Verified Ratings", desc: "Rigorous verification to ensure fair play." },
              { icon: Trophy, title: "Cash Prizes", desc: "Significant prize pool for top 3 finishers." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-green-500/30 transition-colors group">
                <div className="w-12 h-12 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
