'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/queue', label: 'Queue' },
];

export function AdminWarmHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#d6cec2] bg-[#ece9e3]/95 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-4xl font-bold tracking-tight text-[#ee4a21]">
          Deque
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Admin navigation">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative text-sm font-medium text-[#3f4744] transition-colors hover:text-[#8a3c2d]',
                  isActive && 'text-[#8a3c2d]'
                )}
              >
                {link.label}
                {isActive && <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-[#8a3c2d]" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-[#f4f0ea] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#6f7571] sm:inline">
            Admin: {user?.name}
          </span>
          <button
            onClick={logout}
            className="rounded-md border border-[#cfc6b9] px-4 py-2 text-sm font-semibold text-[#313835] transition-colors hover:border-[#ee4a21] hover:text-[#8a3c2d]"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
