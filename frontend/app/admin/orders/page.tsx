'use client';

/**
 * Admin Orders Management Page - Tactile Cyber-Brutalism Design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { orderApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { AdminWarmHeader } from '@/components/layout';
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
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'preparing':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'paid':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'cancelled':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
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
      <div className="min-h-screen flex items-center justify-center bg-[#ece9e3]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece9e3] text-[#2f3633]">
      <AdminWarmHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#313835]">
              All Orders
            </h1>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6f7571]">
              View and manage all orders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#ddd3c7] bg-white px-4 py-2.5 text-[#313835] focus:border-[#ee4a21] focus:outline-none"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={loadOrders}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-[#ddd3c7] bg-white px-4 py-2.5 text-[#4f5854] transition hover:border-[#ee4a21] hover:text-[#8a3c2d] disabled:opacity-50"
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
          <div className="overflow-hidden rounded-2xl border border-[#ddd3c7] bg-white">
            <table className="min-w-full">
              <thead className="bg-[#f7f4ee]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Time
                  </th>
                  <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.2em] text-[#6f7571]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee6db]">
                {orders.map((order) => {
                  const action = getActionButton(order.status);
                  return (
                    <tr key={order.id} className="transition-colors hover:bg-[#fbf8f3]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-bold text-[#ee4a21]">
                          #{order.tokenNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#313835]">
                          <span className="material-symbols-outlined text-lg text-[#7a817c]">receipt</span>
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-[#ee4a21]">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs uppercase tracking-[0.16em] text-[#6f7571]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {action && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, nextStatus[order.status])}
                            className="ml-auto flex items-center gap-2 rounded-xl bg-[#ee4a21] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#d9441d]"
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
          <div className="rounded-2xl border border-[#ddd3c7] bg-white p-12 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-[#7a817c]">inbox</span>
            <h3 className="mb-2 text-xl font-bold text-[#313835]">
              No orders found
            </h3>
            <p className="text-[#6f7571]">
              {statusFilter ? 'Try changing the status filter' : 'Orders will appear here when placed'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
