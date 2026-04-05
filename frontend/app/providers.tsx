'use client';

/**
 * Providers Component
 * Wraps the app with context providers
 */

import { ReactNode } from 'react';
import { AuthProvider, CartProvider } from '@/contexts';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}
