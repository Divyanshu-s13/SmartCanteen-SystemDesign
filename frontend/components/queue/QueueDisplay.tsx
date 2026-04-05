'use client';

/**
 * Queue Display Component - Tactile Cyber-Brutalism Design
 * Shows real-time queue status for display screens
 */

import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket';
import { queueApi } from '@/services/api';
import { Spinner } from '@/components/ui';
import type { QueueItem } from '@/types';

export function QueueDisplay() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [readyOrders, setReadyOrders] = useState<QueueItem[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadQueue();

    const socket = socketService.connect();
    setIsConnected(socket.connected);

    socketService.joinQueue();

    const cleanupQueueUpdate = socketService.onQueueUpdate((queueItem) => {
      setQueue((prev) => {
        const index = prev.findIndex((item) => item.orderId === queueItem.orderId);
        if (index >= 0) {
          const newQueue = [...prev];
          newQueue[index] = queueItem;
          return newQueue;
        }
        return [...prev, queueItem];
      });
    });

    const cleanupQueueFull = socketService.onQueueFull((fullQueue) => {
      const ready = fullQueue.filter((item) => item.status === 'ready');
      const preparing = fullQueue.filter((item) => item.status === 'preparing');
      const pending = fullQueue.filter((item) => ['pending', 'paid'].includes(item.status));

      setReadyOrders(ready);
      setPreparingOrders(preparing);
      setQueue(pending);
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      cleanupQueueUpdate();
      cleanupQueueFull();
    };
  }, []);

  const loadQueue = async () => {
    setIsLoading(true);
    const response = await queueApi.get();
    if (response.success && response.data) {
      setQueue(response.data.queue);
      setReadyOrders(response.data.readyOrders);
      setPreparingOrders(response.data.preparingOrders);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Connection Status */}
      <div className="flex justify-end">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
          isConnected 
            ? 'bg-tertiary/10 border border-tertiary/30 text-tertiary' 
            : 'bg-error/10 border border-error/30 text-error'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></span>
          <span className="text-xs font-label uppercase tracking-widest font-bold">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Ready for Pickup - Most Prominent */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-3xl text-tertiary drop-shadow-[0_0_10px_rgba(171,255,203,0.6)]">
            check_circle
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            Ready for Pickup
          </h2>
          {readyOrders.length > 0 && (
            <span className="px-3 py-1 bg-tertiary text-background text-xs font-headline font-bold rounded-full">
              {readyOrders.length}
            </span>
          )}
        </div>
        
        {readyOrders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {readyOrders.map((item) => (
              <div
                key={item.orderId}
                className="bg-tertiary/10 border-2 border-tertiary rounded-2xl p-6 text-center glow-ready animate-pulse"
              >
                <p className="text-5xl font-headline font-bold text-tertiary drop-shadow-[0_0_15px_rgba(171,255,203,0.6)]">
                  #{item.tokenNumber}
                </p>
                <p className="text-xs font-label uppercase tracking-widest text-tertiary mt-2">
                  Ready!
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-8 text-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">hourglass_empty</span>
            <p className="text-on-surface-variant">No orders ready for pickup</p>
          </div>
        )}
      </section>

      {/* Being Prepared */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-3xl text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.6)]">
            skillet
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            Being Prepared
          </h2>
          {preparingOrders.length > 0 && (
            <span className="px-3 py-1 bg-primary text-background text-xs font-headline font-bold rounded-full">
              {preparingOrders.length}
            </span>
          )}
        </div>
        
        {preparingOrders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {preparingOrders.map((item) => (
              <div
                key={item.orderId}
                className="bg-primary/10 border border-primary/30 rounded-2xl p-5 text-center glow-prep"
              >
                <p className="text-4xl font-headline font-bold text-primary drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]">
                  #{item.tokenNumber}
                </p>
                {item.estimatedTime && (
                  <p className="text-xs font-label text-primary mt-2 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    ~{item.estimatedTime} min
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-8 text-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">restaurant</span>
            <p className="text-on-surface-variant">No orders being prepared</p>
          </div>
        )}
      </section>

      {/* In Queue */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-3xl text-secondary drop-shadow-[0_0_10px_rgba(220,184,255,0.6)]">
            schedule
          </span>
          <h2 className="text-2xl font-headline font-bold text-on-surface">
            In Queue
          </h2>
          {queue.length > 0 && (
            <span className="px-3 py-1 bg-secondary text-background text-xs font-headline font-bold rounded-full">
              {queue.length}
            </span>
          )}
        </div>
        
        {queue.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {queue.map((item, index) => (
              <div
                key={item.orderId}
                className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-center extruded-card"
              >
                <p className="text-xl font-headline font-bold text-on-surface-variant">
                  #{item.tokenNumber}
                </p>
                <p className="text-[10px] font-label text-slate-600">
                  #{index + 1}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-8 text-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">inbox</span>
            <p className="text-on-surface-variant">No orders in queue</p>
          </div>
        )}
      </section>
    </div>
  );
}
