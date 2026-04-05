'use client';

/**
 * Orders Page - Live Tracking Command Center
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { Spinner } from '@/components/ui';
import type { Order, QueueItem } from '@/types';

export default function OrdersPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const newOrderId = searchParams.get('new');

  const upsertOrder = (incoming: Order) => {
    setOrders((prevOrders) => {
      const existingIndex = prevOrders.findIndex((order) => order.id === incoming.id);
      if (existingIndex === -1) {
        return [incoming, ...prevOrders];
      }

      const next = [...prevOrders];
      next[existingIndex] = { ...prevOrders[existingIndex], ...incoming };
      return next;
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadOrders();

      if (newOrderId) {
        syncOrderById(newOrderId);
      }

      socketService.connect();

      const cleanupOrderStatus = socketService.onOrderStatus((queueItem: QueueItem) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === queueItem.orderId
              ? { ...order, status: queueItem.status }
              : order
          )
        );
      });

      const cleanupQueueUpdate = socketService.onQueueUpdate((queueItem: QueueItem) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === queueItem.orderId
              ? {
                  ...order,
                  status: queueItem.status,
                }
              : order
          )
        );
      });

      const cleanupOrderReady = socketService.onOrderReady(({ tokenNumber, message }) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Order Ready!', { body: message });
        } else {
          alert(message);
        }
      });

      return () => {
        cleanupOrderStatus();
        cleanupQueueUpdate();
        cleanupOrderReady();
      };
    }
  }, [authLoading, isAuthenticated, router, newOrderId]);

  const loadOrders = async () => {
    setIsLoading(true);
    const response = await orderApi.getMyOrders();
    if (response.success && response.data) {
      setOrders(response.data);

      response.data.forEach((order) => {
        if (!['completed', 'cancelled'].includes(order.status)) {
          socketService.subscribeToOrder(order.id);
        }
      });
    }
    setIsLoading(false);
  };

  const syncOrderById = async (orderId: string) => {
    const response = await orderApi.getById(orderId);
    if (response.success && response.data) {
      upsertOrder(response.data);
      socketService.subscribeToOrder(orderId);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    const response = await orderApi.cancel(orderId);
    if (response.success) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
    }
  };

  useEffect(() => {
    if (!newOrderId || !isAuthenticated) return;

    syncOrderById(newOrderId);

    const interval = window.setInterval(() => {
      syncOrderById(newOrderId);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [newOrderId, isAuthenticated]);

  const focusOrder = useMemo(() => {
    if (!orders.length) return null;

    if (newOrderId) {
      const tracked = orders.find((order) => order.id === newOrderId);
      if (tracked) return tracked;
    }

    const active = orders.find((order) => !['completed', 'cancelled'].includes(order.status));
    return active ?? orders[0];
  }, [orders, newOrderId]);

  useEffect(() => {
    if (!focusOrder || !isAuthenticated) return;

    const loadQueuePosition = async () => {
      const response = await orderApi.getQueuePosition(focusOrder.id);
      if (response.success && response.data) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === focusOrder.id
              ? {
                  ...order,
                  queuePosition: response.data?.position,
                  status: response.data?.status ?? order.status,
                }
              : order
          )
        );
      }
    };

    loadQueuePosition();
    const interval = window.setInterval(loadQueuePosition, 5000);

    return () => window.clearInterval(interval);
  }, [focusOrder?.id, isAuthenticated]);

  const queueSteps = [
    { label: 'RECEIVED', icon: 'receipt_long' },
    { label: 'COOKING', icon: 'skillet' },
    { label: 'QUALITY CHECK', icon: 'fact_check' },
    { label: 'READY', icon: 'check_circle' },
  ];

  const getStepIndex = (status?: Order['status']) => {
    if (!status) return 0;

    if (status === 'cancelled') return -1;
    if (status === 'completed') return 3;
    if (status === 'ready') return 3;
    if (status === 'preparing') return 1;
    return 0;
  };

  const currentStep = getStepIndex(focusOrder?.status);

  const subtotal = focusOrder?.totalPrice ?? 0;
  const serviceFee = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + serviceFee).toFixed(2));

  const nutrientTotals = useMemo(() => {
    if (!focusOrder) {
      return { calories: 0, protein: 0, carbs: 0 };
    }

    return focusOrder.items.reduce(
      (acc, item) => {
        const quantity = item.quantity ?? 1;
        acc.calories += 320 * quantity;
        acc.protein += 16 * quantity;
        acc.carbs += 24 * quantity;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0 }
    );
  }, [focusOrder]);

  const statusLabel = useMemo(() => {
    if (!focusOrder) return 'NO ACTIVE ORDER';

    if (focusOrder.status === 'pending' || focusOrder.status === 'paid') return 'IN PREPARATION';
    if (focusOrder.status === 'preparing') return 'IN PREPARATION';
    if (focusOrder.status === 'ready') return 'READY FOR PICKUP';
    if (focusOrder.status === 'completed') return 'PICKED UP';
    if (focusOrder.status === 'cancelled') return 'CANCELLED';
    return 'IN PREPARATION';
  }, [focusOrder]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen order-scene px-3 py-3 sm:px-6 sm:py-6">
      <main className="mx-auto max-w-7xl rounded-2xl border border-cyan-400/20 bg-[#050d12]/85 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-6">
        <header className="mb-4 flex items-center justify-between rounded-xl border border-cyan-500/15 bg-[#0c1324]/90 px-3 py-3 sm:mb-6 sm:px-6">
          <div className="text-2xl font-extrabold tracking-tight text-cyan-400">SmartCanteen</div>
          <nav className="hidden items-center gap-9 text-sm font-medium text-slate-400 lg:flex">
            <a className="transition-colors hover:text-cyan-300" href="/dashboard">Dashboard</a>
            <a className="transition-colors hover:text-cyan-300" href="/menu">Menu</a>
            <a className="text-cyan-400">Orders</a>
            <a className="transition-colors hover:text-cyan-300" href="/dashboard">Nutritional Analytics</a>
          </nav>
          <div className="flex items-center gap-3 text-slate-300">
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="rounded-full p-2 transition hover:bg-white/5 disabled:opacity-50"
              title="Refresh"
            >
              <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="material-symbols-outlined">notifications</span>
            <div className="h-8 w-8 rounded-full border-2 border-cyan-300/40 bg-slate-700/70 p-[2px]">
              <div className="h-full w-full rounded-full bg-[linear-gradient(145deg,#4b6b7e,#20303a)]" />
            </div>
          </div>
        </header>

        {newOrderId && (
          <div className="mb-4 rounded-xl border border-emerald-300/30 bg-emerald-200/10 px-4 py-3 text-sm text-emerald-100 sm:mb-6">
            Order placed successfully. Live tracking is now active.
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : !focusOrder ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b141b]/80 p-10 text-center">
            <span className="material-symbols-outlined mb-3 text-5xl text-slate-500">receipt_long</span>
            <h2 className="text-2xl font-bold text-slate-100">No orders yet</h2>
            <p className="mt-2 text-slate-400">Your active order experience will appear here once you place one.</p>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-400/10 bg-[linear-gradient(145deg,rgba(19,31,39,0.95),rgba(14,24,31,0.95))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-6">
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[30px] font-bold leading-none text-cyan-50">Live Queue</h2>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                      Order #{focusOrder.id.slice(0, 8).toUpperCase()}-X
                    </p>
                    {typeof focusOrder.queuePosition === 'number' && focusOrder.queuePosition > 0 && (
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                        Queue Position #{focusOrder.queuePosition}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-emerald-200/10 px-4 py-1 text-xs font-semibold tracking-wider text-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                    {statusLabel}
                  </span>
                </div>

                <div className="relative mt-6 pb-2">
                  <div className="absolute left-[7%] right-[7%] top-5 h-[3px] rounded-full bg-slate-600/60" />
                  {currentStep >= 0 && (
                    <div
                      className="absolute left-[7%] top-5 h-[3px] rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]"
                      style={{ width: `${Math.max(0, (currentStep / 3) * 86)}%` }}
                    />
                  )}

                  <div className="relative grid grid-cols-4 gap-2">
                    {queueSteps.map((step, index) => {
                      const isReached = currentStep >= index;
                      const isCurrent = currentStep === index;
                      const isCancelled = currentStep < 0;

                      return (
                        <div key={step.label} className="flex flex-col items-center text-center">
                          <div
                            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
                              isCancelled && index === 3
                                ? 'border-slate-600 bg-slate-700/70 text-slate-400'
                                : isCurrent
                                ? 'border-cyan-300 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.85)]'
                                : isReached
                                ? 'border-cyan-100/60 bg-cyan-50/80 text-slate-900'
                                : 'border-slate-600 bg-slate-700/60 text-slate-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                          </div>
                          <p className={`text-[10px] font-semibold tracking-wider ${isCurrent ? 'text-cyan-300' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/10 bg-[#071118]/90 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(52,211,238,0.18),rgba(5,12,16,0.94)_65%)] px-4 py-8">
                  <div className="token-card w-full max-w-[270px] rounded-[26px] border border-white/10 p-5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
                    <div className="mb-3 flex items-center justify-between text-cyan-300">
                      <span className="text-xs font-bold tracking-[0.16em]">TOKEN</span>
                      <span className="material-symbols-outlined text-sm">volume_up</span>
                    </div>
                    <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-2xl border border-slate-300/20 bg-white/95 text-black">
                      <div className="h-24 w-24 rounded-md bg-[repeating-linear-gradient(0deg,#0c0c0c_0px,#0c0c0c_2px,transparent_2px,transparent_4px),repeating-linear-gradient(90deg,#0c0c0c_0px,#0c0c0c_2px,transparent_2px,transparent_4px)] opacity-70" />
                    </div>
                    <div className="text-5xl font-black tracking-tight text-cyan-50">#T-{focusOrder.tokenNumber}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button className="rounded-xl border border-cyan-200/20 bg-[linear-gradient(90deg,#79ecff,#2dd4f7)] px-4 py-3 font-semibold text-[#0c2732] transition hover:brightness-105">
                    <span className="material-symbols-outlined mr-2 align-[-5px] text-[18px]">download</span>
                    Save Token
                  </button>
                  <button className="rounded-xl border border-slate-500/20 bg-slate-800/70 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-700/80">
                    <span className="material-symbols-outlined mr-2 align-[-5px] text-[18px]">share</span>
                    Share Order
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,37,43,0.9),rgba(19,25,31,0.92))] p-4 sm:p-5">
                <h3 className="mb-3 text-2xl font-bold text-cyan-50">Order Details</h3>
                <div className="space-y-3">
                  {focusOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-800/45 p-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-200/15 bg-cyan-400/15 text-xl">
                        {item.menuItem?.category === 'drinks' ? '🥤' : item.menuItem?.category === 'snacks' ? '🍟' : '🥗'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-100">{item.menuItem?.name ?? 'Menu Item'}</p>
                        <p className="truncate text-sm text-slate-400">Qty {item.quantity}</p>
                      </div>
                      <p className="text-lg font-bold text-cyan-100">{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-slate-300">
                  <div className="flex items-center justify-between text-sm uppercase tracking-widest text-slate-400">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm uppercase tracking-widest text-slate-400">
                    <span>Service Fee</span>
                    <span>{serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between pt-2 text-3xl font-black">
                    <span className="text-slate-100">Total</span>
                    <span className="text-cyan-300">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,37,43,0.9),rgba(19,25,31,0.92))] p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-emerald-200">
                  <span className="material-symbols-outlined text-[18px]">monitoring</span>
                  <h4 className="text-xl font-bold">Order Nutrients</h4>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-center">
                    <p className="text-[10px] tracking-widest text-slate-400">CALS</p>
                    <p className="text-xl font-bold text-emerald-200">{nutrientTotals.calories}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-center">
                    <p className="text-[10px] tracking-widest text-slate-400">PROTEIN</p>
                    <p className="text-xl font-bold text-violet-200">{nutrientTotals.protein}g</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-800/60 p-2 text-center">
                    <p className="text-[10px] tracking-widest text-slate-400">CARBS</p>
                    <p className="text-xl font-bold text-cyan-200">{nutrientTotals.carbs}g</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,37,43,0.9),rgba(19,25,31,0.92))] p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2 text-cyan-100">
                  <span className="material-symbols-outlined">location_on</span>
                  <h4 className="text-xl font-bold">Pick-up Location</h4>
                </div>
                <p className="text-sm leading-relaxed text-slate-300">
                  SmartCanteen Pod Alpha-1, Level 2, Central Hub. Your order will be held in heated locker
                  <span className="font-semibold text-cyan-200"> #{focusOrder.tokenNumber}</span>.
                </p>
              </div>
            </aside>
          </section>
        )}

        {focusOrder && focusOrder.status !== 'cancelled' && (
          <div className="pt-6 text-center text-cyan-100/90">
            <button
              onClick={() => handleCancelOrder(focusOrder.id)}
              className="text-sm font-semibold tracking-wide underline decoration-cyan-300/50 underline-offset-4 transition hover:text-cyan-300"
            >
              Need assistance with this order?
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
