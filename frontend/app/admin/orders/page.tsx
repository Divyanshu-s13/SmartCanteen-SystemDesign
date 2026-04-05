'use client';

/**
 * Admin Orders Management Page - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { Navbar } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { formatPrice, formatDateTime, getStatusLabel } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const nextStatus: Record<string, string> = {
  paid: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

export default function AdminOrdersPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

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
      loadOrders();

      socketService.connect();
      socketService.joinAdmin();

      const cleanupNewOrder = socketService.onNewOrder((order) => {
        setOrders((prev) => [order, ...prev]);
      });

      const cleanupOrderUpdate = socketService.onAdminOrderUpdate((queueItem) => {
        setOrders((prev) =>
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

  const loadOrders = async () => {
    setIsLoading(true);
    const response = await orderApi.getAll(statusFilter || undefined);
    if (response.success && response.data) {
      setOrders(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const response = await orderApi.updateStatus(orderId, newStatus);
    if (response.success) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as OrderStatus } : order
        )
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-tertiary bg-tertiary/10 border-tertiary/30';
      case 'preparing':
        return 'text-primary bg-primary/10 border-primary/30';
      case 'paid':
        return 'text-secondary bg-secondary/10 border-secondary/30';
      case 'completed':
        return 'text-tertiary bg-tertiary/10 border-tertiary/30';
      case 'cancelled':
        return 'text-error bg-error/10 border-error/30';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  const getActionButton = (status: string) => {
    switch (nextStatus[status]) {
      case 'preparing':
        return { icon: 'skillet', label: 'Start Preparing' };
      case 'ready':
        return { icon: 'check_circle', label: 'Mark Ready' };
      case 'completed':
        return { icon: 'task_alt', label: 'Complete' };
      default:
        return null;
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">
              All Orders
            </h1>
            <p className="text-sm text-on-surface-variant font-label uppercase tracking-widest">
              View and manage all orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-on-surface font-label focus:outline-none focus:border-cyan-400/50"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 rounded-xl push-switch flex items-center gap-2 text-on-surface-variant disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : orders.length > 0 ? (
          <div className="bg-surface-container-low rounded-2xl overflow-hidden extruded-card border border-white/5">
            <table className="min-w-full">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Time
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-label uppercase tracking-widest text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {orders.map((order) => {
                  const action = getActionButton(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-headline font-bold text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                          #{order.tokenNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg text-slate-600">receipt</span>
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-headline font-bold text-cyan-400">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-on-surface-variant font-label uppercase tracking-widest">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {action && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, nextStatus[order.status])}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-background font-headline font-bold text-xs rounded-xl push-switch hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all flex items-center gap-2 ml-auto"
                          >
                            <span className="material-symbols-outlined text-sm">{action.icon}</span>
                            {action.label}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-12 text-center extruded-card border border-white/5">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">inbox</span>
            <h3 className="text-xl font-headline font-bold text-on-surface mb-2">
              No orders found
            </h3>
            <p className="text-on-surface-variant">
              {statusFilter ? 'Try changing the status filter' : 'Orders will appear here when placed'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
