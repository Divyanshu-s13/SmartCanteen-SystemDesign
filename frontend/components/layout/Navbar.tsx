'use client';

/**
 * Navbar Component - Tactile Cyber-Brutalism Design
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = user?.role === 'admin'
    ? [
        { href: '/admin', label: 'Dashboard', icon: 'grid_view' },
        { href: '/admin/menu', label: 'Menu', icon: 'restaurant_menu' },
        { href: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
        { href: '/queue', label: 'Queue', icon: 'queue' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
        { href: '/menu', label: 'Menu', icon: 'restaurant' },
        { href: '/orders', label: 'Orders', icon: 'receipt_long' },
      ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,229,255,0.1)] flex justify-between items-center px-6 h-20">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <Link 
          href={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/'} 
          className="flex items-center gap-2"
        >
          <span className="text-2xl font-bold tracking-tighter text-cyan-400 font-headline drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
            SmartCanteen
          </span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        {isAuthenticated && navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'font-headline tracking-tight transition-all duration-300 px-3 py-1 rounded text-sm uppercase',
              pathname === link.href || pathname.startsWith(link.href + '/')
                ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {/* Cart (for students) */}
            {user?.role === 'student' && (
              <Link
                href="/cart"
                className="relative text-slate-400 hover:bg-slate-800/80 transition-all duration-300 p-2 rounded-full"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full radial-glow-status"></span>
                )}
              </Link>
            )}

            {/* Notifications */}
            <button className="text-slate-400 hover:bg-slate-800/80 transition-all duration-300 p-2 rounded-full">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-slate-700/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-label uppercase tracking-widest text-slate-400">
                  {user?.role === 'admin' ? 'ADMIN' : 'S.ID-' + user?.id?.slice(0, 4).toUpperCase()}
                </p>
                <p className="text-sm font-headline font-bold text-cyan-400">
                  {user?.name}
                </p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-full ring-2 ring-cyan-400/30 bg-surface-container-high flex items-center justify-center">
                  <span className="text-cyan-400 font-headline font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div 
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-tertiary rounded-full border-2 border-background"
                  style={{ boxShadow: '0 0 10px #abffcb' }}
                ></div>
              </div>
              <button
                onClick={logout}
                className="text-slate-400 hover:bg-slate-800/80 transition-all duration-300 p-2 rounded-full ml-2"
                title="Logout"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-slate-400 font-headline text-sm uppercase tracking-widest hover:text-cyan-400 transition-colors">
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2 rounded-lg font-headline font-bold text-sm tracking-tight hover:brightness-110 active:scale-95 transition-all shadow-lg">
                Sign Up
              </button>
            </Link>
          </div>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-slate-400 hover:bg-slate-800/80 p-2 rounded-full transition-all"
        >
          <span className="material-symbols-outlined">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && isAuthenticated && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-900/20">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-lg font-headline text-sm uppercase tracking-widest transition-all',
                  pathname === link.href
                    ? 'bg-slate-800 text-cyan-400 border-l-4 border-cyan-400'
                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
