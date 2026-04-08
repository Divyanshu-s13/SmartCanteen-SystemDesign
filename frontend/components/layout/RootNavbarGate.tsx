'use client';

import { usePathname } from 'next/navigation';
import { UnifiedNavbar } from './UnifiedNavbar';

export function RootNavbarGate() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="global-nav-wrap">
      <div className="global-nav-inner">
        <UnifiedNavbar />
      </div>
    </header>
  );
}
