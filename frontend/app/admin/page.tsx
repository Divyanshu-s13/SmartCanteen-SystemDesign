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
import { AdminWarmHeader } from '@/components/layout';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'preparing':
        return 'border border-orange-200 bg-orange-50 text-orange-700';
      case 'paid':
        return 'border border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border border-slate-200 bg-slate-50 text-slate-600';
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#ece9e3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a3c2d]">
            Loading Admin Dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece9e3] text-[#2f3633]">
      <AdminWarmHeader />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-[#ddd3c7] bg-[#f7f4ee] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-[#313835]">Admin Dashboard</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-[#6f7571]">
              Admin: {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-[#d8cebf] bg-white px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#ee4a21]" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3c2d]">Live</span>
            </div>
            <Link href="/admin/menu" className="rounded-md border border-[#d4cabd] px-4 py-2 text-sm font-semibold text-[#4f5854] hover:border-[#ee4a21] hover:text-[#8a3c2d]">Manage Menu</Link>
            <Link href="/admin/orders" className="rounded-md border border-[#d4cabd] px-4 py-2 text-sm font-semibold text-[#4f5854] hover:border-[#ee4a21] hover:text-[#8a3c2d]">Manage Orders</Link>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            <span className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8a3c2d]">
              Loading Analytics...
            </span>
          </div>
        ) : (
          <>
            <section className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#dfd5c9] bg-white p-5">
                <span className="text-xs uppercase tracking-[0.2em] text-[#7a817c]">Daily Gross</span>
                <h3 className="mt-2 text-3xl font-bold text-[#ee4a21]">{formatPrice(stats?.todayRevenue || 0)}</h3>
              </div>

              <div className="rounded-2xl border border-[#dfd5c9] bg-white p-5">
                <span className="text-xs uppercase tracking-[0.2em] text-[#7a817c]">Active Orders</span>
                <h3 className="mt-2 text-3xl font-bold text-[#313835]">{activeOrders.length}</h3>
                <div className="mt-3 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < activeOrders.length ? 'bg-[#ee4a21]' : 'bg-[#ebe4d9]'}`} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dfd5c9] bg-white p-5">
                <span className="text-xs uppercase tracking-[0.2em] text-[#7a817c]">Today&apos;s Orders</span>
                <h3 className="mt-2 text-3xl font-bold text-[#313835]">{stats?.todayOrders || 0}</h3>
              </div>

              <div className="rounded-2xl border border-[#dfd5c9] bg-white p-5">
                <span className="text-xs uppercase tracking-[0.2em] text-[#7a817c]">Total Revenue</span>
                <h3 className="mt-2 text-3xl font-bold text-[#ee4a21]">{formatPrice(stats?.totalRevenue || 0)}</h3>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#ebe4d9]">
                  <div className="h-full w-[85%] bg-[#ee4a21]" />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#313835]">Live Order Feed</h2>
                <Link href="/admin/orders">
                  <button className="rounded-md border border-[#d4cabd] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#4f5854] hover:border-[#ee4a21] hover:text-[#8a3c2d]">
                    View All
                  </button>
                </Link>
              </div>

              {activeOrders.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#dfd5c9] bg-white p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-4xl font-bold text-[#ee4a21]">
                            #{order.tokenNumber}
                          </span>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#7a817c]">
                            Order #{order.id.slice(0, 8)}
                          </p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-[#3f4744]">
                              {item.menuItem?.name || 'Item'}
                            </span>
                            <span className="text-[#7a817c]">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-[#eee6db] pt-4">
                        <span className="text-xl font-bold text-[#313835]">
                          {formatPrice(order.totalPrice)}
                        </span>

                        {order.status === 'paid' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="rounded-md bg-[#ee4a21] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d9441d]"
                          >
                            Start Prep
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            className="rounded-md bg-[#ee4a21] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d9441d]"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="rounded-md bg-[#ee4a21] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#d9441d]"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#dfd5c9] bg-white p-12 text-center">
                  <span className="material-symbols-outlined mb-4 text-6xl text-[#ee4a21]">check_circle</span>
                  <p className="text-lg font-semibold uppercase tracking-[0.2em] text-[#3f4744]">
                    All Orders Processed
                  </p>
                  <p className="mt-2 text-sm text-[#7a817c]">
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
