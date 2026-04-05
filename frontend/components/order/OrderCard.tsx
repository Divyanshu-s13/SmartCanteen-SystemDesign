'use client';

/**
 * Order Card Component - Tactile Cyber-Brutalism Design
 */

import { formatPrice, formatDateTime, getStatusLabel } from '@/lib/utils';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onCancel?: (orderId: string) => void;
  showDetails?: boolean;
}

export function OrderCard({ order, onCancel, showDetails = true }: OrderCardProps) {
  const canCancel = ['pending', 'paid'].includes(order.status);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return 'check_circle';
      case 'preparing':
        return 'skillet';
      case 'paid':
        return 'payment';
      case 'completed':
        return 'task_alt';
      case 'cancelled':
        return 'cancel';
      default:
        return 'schedule';
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'ready':
        return 'glow-ready';
      case 'preparing':
        return 'glow-prep';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-surface-container-low rounded-2xl p-6 extruded-card border border-white/5 ${getStatusGlow(order.status)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl font-headline font-bold text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
              #{order.tokenNumber}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-widest border ${getStatusColor(order.status)} flex items-center gap-1`}>
              <span className="material-symbols-outlined text-xs">{getStatusIcon(order.status)}</span>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-label uppercase tracking-widest">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-headline font-bold text-cyan-400">
            {formatPrice(order.totalPrice)}
          </p>
          {order.queuePosition && order.queuePosition > 0 && (
            <p className="text-[10px] text-slate-500 font-label uppercase tracking-widest">
              Queue: #{order.queuePosition}
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      {showDetails && order.items && order.items.length > 0 && (
        <div className="border-t border-outline-variant/20 pt-4 mb-4">
          <h4 className="text-[10px] font-label uppercase tracking-widest text-slate-500 mb-3">
            Items
          </h4>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-600">fastfood</span>
                  {item.menuItem?.name || 'Item'} 
                  <span className="text-slate-600">×{item.quantity}</span>
                </span>
                <span className="text-on-surface font-headline">
                  {formatPrice(item.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {canCancel && onCancel && (
        <div className="flex justify-end pt-4 border-t border-outline-variant/20">
          <button
            onClick={() => onCancel(order.id)}
            className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-lg font-headline font-bold text-xs uppercase tracking-widest transition-all push-switch"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">cancel</span>
              Cancel Order
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
