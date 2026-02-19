import React from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'sonner';
import { Providers } from './providers';

export const metadata = {
  title: 'Marlima Chess',
  description: 'The ultimate chess platform',
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
      <body className="text-white font-sans selection:bg-blue-500/30">
        <Providers>
          <div className="flex min-h-screen bg-transparent">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-200 bg-transparent">
              <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8 bg-transparent">
                {children}
              </main>
              <footer className="border-t border-slate-900 py-8 text-center text-slate-500 text-sm bg-transparent">
                <p>© 2026 Marlima Chess.</p>
              </footer>
            </div>
          </div>
          <Toaster position="top-right" theme="dark" richColors />
        </Providers>
      </body>
    </html>
  );
}
