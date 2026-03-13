import React from 'react';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import MainLayout from '@/components/MainLayout';
import type { Viewport } from 'next';

export const metadata = {
  title: 'Marlima Chess',
  description: 'The ultimate chess platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8fafc',
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
      <body className="text-slate-900 font-sans selection:bg-brand-orange/30 bg-[url('/chess-bg-light.png')] bg-cover bg-center bg-fixed bg-no-repeat bg-slate-50 min-h-screen">
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster position="top-right" theme="light" richColors />
        </Providers>
      </body>
    </html>
  );
}
