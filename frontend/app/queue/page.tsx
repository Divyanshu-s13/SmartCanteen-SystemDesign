'use client';

/**
 * Queue Display Page - Tactile Cyber-Brutalism Design
 * Public page for display screens showing real-time queue
 */

import { QueueDisplay } from '@/components/queue';

export default function QueuePage() {
  return (
    <div className="min-h-screen bg-background text-on-surface p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-4xl text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]">restaurant</span>
            <h1 className="text-5xl font-headline font-bold text-on-surface">
              Smart<span className="text-cyan-400">Canteen</span>
            </h1>
          </div>
          <p className="text-sm font-label uppercase tracking-[0.3em] text-on-surface-variant">
            Live Order Status Display
          </p>
        </div>

        <QueueDisplay />
      </div>
    </div>
  );
}
