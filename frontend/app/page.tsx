'use client';

/**
 * Landing Page - Tactile Cyber-Brutalism Design
 */

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  const features = [
    {
      icon: 'smartphone',
      title: 'Easy Ordering',
      description: 'Browse menu and place orders from your phone',
    },
    {
      icon: 'credit_card',
      title: 'Digital Payments',
      description: 'Pay securely with UPI, Card, or Wallet',
    },
    {
      icon: 'schedule',
      title: 'Real-time Queue',
      description: 'Track your order status in real-time',
    },
    {
      icon: 'notifications_active',
      title: 'Token System',
      description: 'Get notified when your order is ready',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 px-4 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              <span className="material-symbols-outlined text-2xl text-background">restaurant</span>
            </div>
            <span className="font-headline font-bold text-2xl text-on-surface">
              Smart<span className="text-cyan-400">Canteen</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2.5 text-on-surface-variant hover:text-on-surface font-headline font-bold transition-colors">
              Login
            </Link>
            <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold rounded-xl push-switch hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-20 sm:py-28">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-headline font-bold text-on-surface leading-tight">
            Skip the Queue,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-tertiary drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">
              Not Your Meal
            </span>
          </h1>
          <p className="mt-8 text-xl text-on-surface-variant max-w-2xl mx-auto">
            Order food from your college canteen, pay digitally, and get notified
            when your order is ready. No more waiting in long queues!
          </p>
          <div className="mt-12 flex justify-center gap-4">
            <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold text-lg rounded-xl push-switch hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">rocket_launch</span>
              Get Started
            </Link>
            <Link href="/queue" className="px-8 py-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 text-on-surface font-headline font-bold text-lg rounded-xl push-switch transition-all flex items-center gap-2">
              <span className="material-symbols-outlined">monitor</span>
              View Queue
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-surface-container-low rounded-2xl p-6 extruded-card border border-white/5 hover:border-cyan-400/30 transition-all group"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-2xl text-primary">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-headline font-bold text-on-surface mb-2">
                {feature.title}
              </h3>
              <p className="text-on-surface-variant text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-on-surface-variant border-t border-outline-variant/20">
        <p className="text-sm font-label">&copy; 2026 SmartCanteen. Built for college canteens.</p>
      </footer>
    </div>
  );
}
