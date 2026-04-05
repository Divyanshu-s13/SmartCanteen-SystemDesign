'use client';

/**
 * Menu Page - Tactile Cyber-Brutalism Design
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Navbar } from '@/components/layout';
import { MenuList } from '@/components/menu';
import { Spinner } from '@/components/ui';
import { formatPrice } from '@/lib/utils';

export default function MenuPage() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const { itemCount, totalPrice, items } = useCart();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', 'snacks', 'drinks', 'meals'];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-cyan-400 font-headline text-sm uppercase tracking-widest">
            Loading System...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Navbar />

      {/* Main Content with optional Cart Sidebar */}
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 pt-24 min-h-screen px-6 md:px-10 pb-32 xl:mr-96">
          {/* Header Section */}
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-2 block">
                System Status: Optimal
              </span>
              <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-on-surface">
                Daily Fuel <span className="text-cyan-400">Inventory</span>
              </h1>
            </div>
            <div className="flex gap-4">
              <div className="bg-surface-container-low px-6 py-3 rounded-2xl recessed-well border border-outline-variant/10">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-label mb-1">
                  Canteen Balance
                </p>
                <p className="text-xl font-headline font-bold text-tertiary">
                  ₹ 420.50
                </p>
              </div>
            </div>
          </header>

          {/* Category Pills */}
          <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full font-headline text-xs font-bold uppercase tracking-widest transition-all ${
                  activeCategory === category
                    ? 'bg-cyan-400 text-on-primary shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                    : 'bg-surface-container-high hover:bg-surface-variant text-slate-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <MenuList category={activeCategory === 'all' ? undefined : activeCategory} />
        </main>

        {/* Glassmorphic Cart Sidebar - Desktop Only */}
        <aside className="hidden xl:flex fixed right-0 top-0 h-screen w-96 bg-slate-900/40 backdrop-blur-2xl border-l border-white/5 z-40 flex-col pt-24">
          <div className="px-8 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-headline font-bold text-on-surface">Order Queue</h2>
              <span className="px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded-full text-[10px] font-label font-bold uppercase tracking-widest">
                {itemCount} Items
              </span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">
                    shopping_cart
                  </span>
                  <p className="text-slate-600 font-headline text-sm tracking-widest uppercase">
                    Queue Empty
                  </p>
                  <p className="text-slate-700 text-xs mt-2">
                    Add items from the menu
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface-container-low/50 p-4 rounded-2xl flex gap-4 items-center border border-white/5 transition-all hover:bg-surface-container-low"
                  >
                    <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-cyan-400">
                        fastfood
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-headline font-bold">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-cyan-400 font-headline font-bold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Price Breakdown */}
            {itemCount > 0 && (
              <>
                <div className="mt-8 pt-8 border-t border-white/5 space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-label uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 font-label uppercase tracking-widest">
                    <span>Tax (5%)</span>
                    <span>{formatPrice(totalPrice * 0.05)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-headline font-bold text-on-surface">Total Amount</span>
                    <span className="text-2xl font-headline font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                      {formatPrice(totalPrice * 1.05)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link href="/cart">
                  <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-2xl font-headline font-bold text-sm tracking-[0.2em] uppercase extruded-card active:scale-95 transition-all mb-8 flex items-center justify-center gap-3 relative overflow-hidden group">
                    <span className="relative z-10">Pay & Generate Token</span>
                    <span className="material-symbols-outlined relative z-10">qr_code_2</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </button>
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Floating Cart Button */}
      {itemCount > 0 && (
        <div className="xl:hidden fixed bottom-6 left-0 right-0 px-4 z-50">
          <div className="max-w-md mx-auto">
            <Link href="/cart">
              <button className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-4 rounded-2xl font-headline font-bold text-sm tracking-widest uppercase shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center justify-between px-6 active:scale-95 transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined">shopping_cart</span>
                  <span>{itemCount} items</span>
                </div>
                <span className="font-bold">{formatPrice(totalPrice)}</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
