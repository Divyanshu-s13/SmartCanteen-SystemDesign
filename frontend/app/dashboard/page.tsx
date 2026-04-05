'use client';

/**
 * Student Dashboard Page - Tactile Cyber-Brutalism Design
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/services/api';
import { Navbar } from '@/components/layout';
import { OrderCard } from '@/components/order';
import { Spinner } from '@/components/ui';
import type { Order } from '@/types';

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!authLoading && user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    if (isAuthenticated) {
      loadOrders();
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadOrders = async () => {
    setIsLoading(true);
    const response = await orderApi.getMyOrders();
    if (response.success && response.data) {
      const active = response.data.filter(
        (order) => !['completed', 'cancelled'].includes(order.status)
      );
      setActiveOrders(active);
    }
    setIsLoading(false);
  };

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

      <main className="pt-24 min-h-screen px-6 md:px-10 pb-12 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <header className="mb-10">
          <span className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-2 block">
            System Status: Online
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-on-surface">
            Welcome back, <span className="text-cyan-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-body">
            What would you like to fuel up with today?
          </p>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <Link href="/menu" className="group">
            <div className="bg-surface-container-low rounded-2xl p-6 extruded-card border border-white/5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary-container/20 rounded-xl flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all">
                    <span className="material-symbols-outlined text-2xl text-cyan-400">restaurant</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      Browse Menu
                    </h3>
                    <p className="text-sm text-slate-500">
                      Order your favorite food
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </div>
            </div>
          </Link>

          <Link href="/orders" className="group">
            <div className="bg-surface-container-low rounded-2xl p-6 extruded-card border border-white/5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-400">history</span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-lg text-on-surface">
                      Order History
                    </h3>
                    <p className="text-sm text-slate-500">
                      View past orders
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Active Orders */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-headline font-bold text-on-surface">
              Active Orders
            </h2>
            {activeOrders.length > 0 && (
              <Link
                href="/orders"
                className="text-cyan-400 hover:text-cyan-300 text-sm font-headline font-bold uppercase tracking-widest flex items-center gap-2"
              >
                View All
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner size="lg" />
              <span className="text-cyan-400 font-headline text-sm uppercase tracking-widest mt-4">
                Loading Orders...
              </span>
            </div>
          ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center recessed-well border border-outline-variant/10">
              <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">
                shopping_cart
              </span>
              <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
                No Active Orders
              </h3>
              <p className="text-slate-500 mb-6">
                Place an order from the menu to get started
              </p>
              <Link href="/menu">
                <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-xl font-headline font-bold text-sm tracking-widest uppercase extruded-card hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-95 transition-all">
                  Browse Menu
                </button>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
