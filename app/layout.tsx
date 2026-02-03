import React from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Checkmate Events',
  description: 'UNN Departmental Rapid Tournament',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.log = function() {};
                console.info = function() {};
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-white font-sans selection:bg-green-500/30">
        <Navbar />
        <Toaster position="top-right" theme="dark" richColors />
        <main className="pt-16">
          {children}
        </main>
        <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-slate-500 text-sm">
          <p>© UNN Chess Club.</p>
        </footer>
      </body>
    </html>
  );
}
