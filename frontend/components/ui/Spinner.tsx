'use client';

/**
 * Loading Spinner Component - Tactile Cyber-Brutalism Design
 */

import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('relative', sizes[size])}>
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-cyan-400/20',
          sizes[size]
        )}></div>
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin',
          sizes[size]
        )} style={{ boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)' }}></div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-cyan-400 font-headline text-sm uppercase tracking-widest">
          Loading System...
        </p>
      </div>
    </div>
  );
}

export { Spinner, LoadingScreen };
