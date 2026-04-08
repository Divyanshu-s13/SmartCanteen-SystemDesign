import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { RootNavbarGate } from '@/components/layout/RootNavbarGate';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'SmartCanteen | Kinetic Command Center',
  description: 'College canteen food ordering, digital payments, and queue management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-body bg-background text-on-surface min-h-screen`}>
        <Providers>
          <RootNavbarGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
