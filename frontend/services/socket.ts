/**
 * Socket Service
 * Manages WebSocket connection for real-time updates
 */

import { io, Socket } from 'socket.io-client';
import type { QueueItem, Order, UserRole } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Authenticate with token
  authenticate(token: string): void {
    this.socket?.emit('authenticate', token);
  }

  // Join queue display room
  joinQueue(): void {
    this.socket?.emit('join:queue');
  }

  // Join admin room
  joinAdmin(): void {
    this.socket?.emit('join:admin');
  }

  // Subscribe to specific order updates
  subscribeToOrder(orderId: string): void {
    this.socket?.emit('subscribe:order', orderId);
  }

  // Unsubscribe from order updates
  unsubscribeFromOrder(orderId: string): void {
    this.socket?.emit('unsubscribe:order', orderId);
  }

  // Event listeners
  onQueueUpdate(callback: (queueItem: QueueItem) => void): () => void {
    return this.on('queue:update', callback);
  }

  onQueueFull(callback: (queue: QueueItem[]) => void): () => void {
    return this.on('queue:full', callback);
  }

  onOrderStatus(callback: (queueItem: QueueItem) => void): () => void {
    return this.on('order:status', callback);
  }

  onOrderReady(callback: (data: { tokenNumber: number; message: string }) => void): () => void {
    return this.on('order:ready', callback);
  }

  onAuthenticated(callback: (data: { userId: string; role: UserRole }) => void): () => void {
    return this.on('authenticated', callback);
  }

  onAuthError(callback: (data: { message: string }) => void): () => void {
    return this.on('auth_error', callback);
  }

  onNewOrder(callback: (order: Order) => void): () => void {
    return this.on('admin:new-order', callback);
  }

  onAdminOrderUpdate(callback: (queueItem: QueueItem) => void): () => void {
    return this.on('admin:order-update', callback);
  }

  // Generic event listener
  private on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);

    // Return cleanup function
    return () => {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    };
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
