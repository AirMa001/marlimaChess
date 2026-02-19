'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Download } from 'lucide-react';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'IMAGE' | 'VIDEO' | 'PDF' | 'LINK' | 'TEXT';
  url?: string;
  title: string;
}

export default function MediaViewer({ isOpen, onClose, type, url, title }: MediaViewerProps) {
  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.${type === 'PDF' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank'); // Fallback
    }
  };

  const renderContent = () => {
    if (type === 'IMAGE') {
      return (
        <img src={url} alt={title} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
      );
    }

    if (type === 'VIDEO') {
      // Handle YouTube links specifically
      const youtubeId = url?.includes('youtube.com') 
        ? url.split('v=')[1]?.split('&')[0] 
        : url?.includes('youtu.be') 
          ? url.split('/').pop() 
          : null;

      if (youtubeId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            className="w-full aspect-video rounded-2xl shadow-2xl"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        );
      }
      return <div className="p-8 text-white font-bold">Video format not supported for inline view.</div>;
    }

    if (type === 'PDF') {
      return (
        <div className="text-center py-20">
          <Download size={64} className="text-blue-500 mx-auto mb-4 animate-bounce" />
          <h4 className="text-white text-xl font-black mb-6 uppercase">Ready for Deployment</h4>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-500">
            Download PDF Tactical Manual
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-white font-black uppercase tracking-tight truncate mr-4">{title}</h3>
            <div className="flex items-center gap-2">
              {(type === 'IMAGE' || type === 'PDF') && (
                <button 
                  onClick={handleDownload}
                  className="p-2 bg-white/5 hover:bg-green-500/20 rounded-xl text-slate-400 hover:text-green-500 transition-all"
                  title="Download Resource"
                >
                  <Download size={18} />
                </button>
              )}
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                title="Enlarge / Open Original"
              >
                <Maximize2 size={18} />
              </a>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8 bg-slate-950/50 flex items-center justify-center min-h-[300px]">
            {renderContent()}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Internal Button component for PDF view
function Button({ children, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all text-white ${className}`}
    >
      {children}
    </button>
  );
}