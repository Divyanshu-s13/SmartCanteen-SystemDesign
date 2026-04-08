'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { Spinner } from '@/components/ui';
import { formatDateTime, formatPrice, getStatusLabel } from '@/lib/utils';
import type { Order, QueueItem } from '@/types';

export default function OrdersPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);

  useEffect(() => {
    const syncNewOrderId = () => {
      const params = new URLSearchParams(window.location.search);
      setNewOrderId(params.get('new'));
    };

    syncNewOrderId();
    window.addEventListener('popstate', syncNewOrderId);

    return () => {
      window.removeEventListener('popstate', syncNewOrderId);
    };
  }, []);

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
      router.push('/');
      return;
    }

    if (!isAuthenticated) {
      return;
    }

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

    const cleanupOrderReady = socketService.onOrderReady(({ message }) => {
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

  const orderSteps = ['pending', 'preparing', 'ready', 'completed'];

  const getStepIndex = (status: Order['status']) => {
    if (status === 'paid') return 0;
    const index = orderSteps.indexOf(status);
    return index === -1 ? 0 : index;
  };

  const getStatusTone = (status: Order['status']) => {
    if (status === 'ready') return 'ordersv2-badge-ready';
    if (status === 'completed') return 'ordersv2-badge-done';
    if (status === 'cancelled') return 'ordersv2-badge-cancelled';
    return 'ordersv2-badge-live';
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ece9e3]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece9e3] text-[#2d312f]">
      <main className="ordersv2-shell pt-8">
        <header className="ordersv2-head">
          <h1>Track Your Orders</h1>
          <p>Live status updates, queue position, and token details.</p>
        </header>

        {newOrderId && (
          <div className="ordersv2-success">
            Order placed successfully. Live tracking is now active.
          </div>
        )}

        {isLoading && sortedOrders.length === 0 ? (
          <div className="ordersv2-loading">
            <Spinner size="lg" />
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="ordersv2-empty">
            <h2>No orders yet</h2>
            <p>Place your first order to see tracking details here.</p>
            <Link href="/menu" className="ordersv2-empty-btn">
              Browse Menu
            </Link>
          </div>
        ) : (
          <section className="ordersv2-list">
            {sortedOrders.map((order) => {
              const canCancel = ['pending', 'paid'].includes(order.status);
              const stepIndex = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled';
              const progressPercent = isCancelled ? 0 : Math.max(0, (stepIndex / 3) * 100);

              const progressStyle = {
                '--orders-progress': `${progressPercent}%`,
              } as CSSProperties;

              return (
                <article key={order.id} className="ordersv2-card">
                  <div className="ordersv2-card-top">
                    <div>
                      <p className="ordersv2-token">Token #{order.tokenNumber}</p>
                      <p className="ordersv2-meta">{formatDateTime(order.createdAt)}</p>
                    </div>

                    <span className={`ordersv2-badge ${getStatusTone(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="ordersv2-progress" style={progressStyle}>
                    <div className="ordersv2-progress-line" />
                    <div className="ordersv2-progress-fill" />
                    {!isCancelled && <div className="ordersv2-progress-orb" />}
                    <div className="ordersv2-steps">
                      {['Received', 'Preparing', 'Ready', 'Completed'].map((step, index) => (
                        <span key={step} className={`ordersv2-step ${stepIndex >= index ? 'ordersv2-step-active' : ''}`}>
                          <span
                            className={`ordersv2-step-circle ${
                              stepIndex >= index ? 'ordersv2-step-circle-active' : 'ordersv2-step-circle-pending'
                            }`}
                          >
                            {stepIndex >= index ? (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            ) : null}
                          </span>
                          <span className="ordersv2-step-label">{step}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="ordersv2-grid">
                    <div>
                      <h3>Items</h3>
                      <ul>
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <span>{item.menuItem?.name ?? 'Item'} x{item.quantity}</span>
                            <span>{formatPrice(item.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="ordersv2-side">
                      <p>Total</p>
                      <h4>{formatPrice(order.totalPrice)}</h4>
                      {typeof order.queuePosition === 'number' && order.queuePosition > 0 && (
                        <p className="ordersv2-queue">Queue #{order.queuePosition}</p>
                      )}

                      {canCancel && (
                        <button onClick={() => handleCancelOrder(order.id)} className="ordersv2-cancel">
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
