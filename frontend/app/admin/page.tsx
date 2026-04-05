'use client';

/**
 * Admin Dashboard Page - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, orderApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { Navbar } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { formatPrice, getStatusLabel } from '@/lib/utils';
import type { DashboardStats, Order } from '@/types';

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!authLoading && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (isAuthenticated && user?.role === 'admin') {
      loadDashboard();

      socketService.connect();
      socketService.joinAdmin();

      const cleanupNewOrder = socketService.onNewOrder((order) => {
        setActiveOrders((prev) => [order, ...prev]);
        loadDashboard();
      });

      const cleanupOrderUpdate = socketService.onAdminOrderUpdate((queueItem) => {
        setActiveOrders((prev) =>
          prev.map((order) =>
            order.id === queueItem.orderId
              ? { ...order, status: queueItem.status }
              : order
          )
        );
      });

      return () => {
        cleanupNewOrder();
        cleanupOrderUpdate();
      };
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadDashboard = async () => {
    setIsLoading(true);

    const [statsResponse, ordersResponse] = await Promise.all([
      adminApi.getDashboard(),
      orderApi.getActive(),
    ]);

    if (statsResponse.success && statsResponse.data) {
      setStats(statsResponse.data);
    }

    if (ordersResponse.success && ordersResponse.data) {
      setActiveOrders(ordersResponse.data);
    }

    setIsLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const response = await orderApi.updateStatus(orderId, newStatus);
    if (response.success) {
      setActiveOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      );
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'ready':
        return 'glow-ready';
      case 'preparing':
        return 'glow-prep';
      case 'paid':
        return 'glow-pending';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-tertiary bg-tertiary/10';
      case 'preparing':
        return 'text-primary bg-primary/10';
      case 'paid':
        return 'text-secondary bg-secondary/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-cyan-400 font-headline text-sm uppercase tracking-widest">
            Loading Command Center...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Navbar />

      <main className="pt-24 min-h-screen px-6 md:px-10 pb-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 h-16 rounded-xl px-6 bg-surface-container-low recessed-well">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">Station Alpha-1</h2>
            <p className="text-label text-xs text-outline tracking-widest uppercase">
              Admin: {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant/10">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" style={{ boxShadow: '0 0 8px #abffcb' }}></span>
              <span className="text-xs font-label font-bold text-tertiary uppercase tracking-widest">System Active</span>
            </div>
            <div className="flex gap-4">
              <Link href="/admin/menu">
                <button className="text-outline cursor-pointer hover:text-primary transition-colors p-2">
                  <span className="material-symbols-outlined">restaurant_menu</span>
                </button>
              </Link>
              <Link href="/admin/orders">
                <button className="text-outline cursor-pointer hover:text-primary transition-colors p-2">
                  <span className="material-symbols-outlined">receipt_long</span>
                </button>
              </Link>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            <span className="text-cyan-400 font-headline text-sm uppercase tracking-widest mt-4">
              Loading Analytics...
            </span>
          </div>
        ) : (
          <>
            {/* Metrics Row */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="recessed-well bg-surface-container-lowest p-6 rounded-xl border-t border-l border-white/5">
                <span className="text-label text-[0.6875rem] text-outline uppercase tracking-[0.2em]">Daily Gross</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-headline text-3xl font-bold text-primary">{formatPrice(stats?.todayRevenue || 0)}</h3>
                  <span className="text-tertiary text-xs font-bold">+14%</span>
                </div>
                <div className="mt-4 h-12 w-full overflow-hidden opacity-50">
                  <svg className="w-full h-full" viewBox="0 0 100 30">
                    <path d="M0,25 Q10,5 20,20 T40,10 T60,25 T80,5 T100,20" fill="none" stroke="#00e5ff" strokeWidth="2"></path>
                  </svg>
                </div>
              </div>

              <div className="recessed-well bg-surface-container-lowest p-6 rounded-xl border-t border-l border-white/5">
                <span className="text-label text-[0.6875rem] text-outline uppercase tracking-[0.2em]">Active Orders</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-headline text-3xl font-bold text-on-surface">{activeOrders.length}</h3>
                  <span className="text-outline text-xs">In Queue</span>
                </div>
                <div className="mt-4 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < activeOrders.length ? 'bg-tertiary' : 'bg-surface-variant'}`}></div>
                  ))}
                </div>
              </div>

              <div className="recessed-well bg-surface-container-lowest p-6 rounded-xl border-t border-l border-white/5">
                <span className="text-label text-[0.6875rem] text-outline uppercase tracking-[0.2em]">Today&apos;s Orders</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-headline text-3xl font-bold text-secondary">{stats?.todayOrders || 0}</h3>
                  <span className="text-tertiary text-xs font-bold">Processing</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-secondary uppercase tracking-widest font-bold">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Peak hour activity
                </div>
              </div>

              <div className="recessed-well bg-surface-container-lowest p-6 rounded-xl border-t border-l border-white/5">
                <span className="text-label text-[0.6875rem] text-outline uppercase tracking-[0.2em]">Total Revenue</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="font-headline text-3xl font-bold text-tertiary">{formatPrice(stats?.totalRevenue || 0)}</h3>
                </div>
                <div className="mt-4 h-1 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-tertiary" style={{ boxShadow: '0 0 8px #abffcb' }}></div>
                </div>
              </div>
            </section>

            {/* Active Orders Grid */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-headline font-bold text-on-surface">Live Order Feed</h2>
                <Link href="/admin/orders">
                  <button className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-slate-400 rounded-lg font-headline text-xs font-bold uppercase tracking-widest transition-colors">
                    View All
                  </button>
                </Link>
              </div>

              {activeOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`bg-surface-container-low rounded-2xl p-6 extruded-card border border-white/5 ${getStatusGlow(order.status)}`}
                    >
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-4xl font-headline font-bold text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                            #{order.tokenNumber}
                          </span>
                          <p className="text-[10px] font-label uppercase tracking-widest text-slate-500 mt-1">
                            Order #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-6">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-on-surface-variant">
                              {item.menuItem?.name || 'Item'}
                            </span>
                            <span className="text-slate-500">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer */}
                      <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                        <span className="text-xl font-headline font-bold text-cyan-400">
                          {formatPrice(order.totalPrice)}
                        </span>

                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="px-4 py-2 bg-gradient-to-br from-secondary to-secondary-container text-on-secondary rounded-lg font-headline font-bold text-xs uppercase tracking-widest push-switch transition-all"
                          >
                            Start Prep
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="px-4 py-2 bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary rounded-lg font-headline font-bold text-xs uppercase tracking-widest push-switch transition-all"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-headline font-bold text-xs uppercase tracking-widest push-switch transition-all"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface-container-low rounded-2xl p-12 text-center recessed-well">
                  <span className="material-symbols-outlined text-6xl text-tertiary mb-4">check_circle</span>
                  <p className="text-slate-500 font-headline text-lg uppercase tracking-widest">
                    All Orders Processed
                  </p>
                  <p className="text-slate-600 text-sm mt-2">
                    No active orders at the moment
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
