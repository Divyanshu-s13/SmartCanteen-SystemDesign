/**
 * Observer Pattern - Queue Observer
 * Notifies subscribers (students) when order status changes
 * Used for real-time queue updates via WebSocket
 */

import { IOrder, OrderStatus, IQueueItem } from '../interfaces';

// Observer interface - receives updates
export interface IQueueObserver {
  id: string;
  update(queueItem: IQueueItem): void;
  updateQueue(queue: IQueueItem[]): void;
}

// Subject interface - manages observers
export interface IQueueSubject {
  attach(observer: IQueueObserver): void;
  detach(observerId: string): void;
  notify(queueItem: IQueueItem): void;
  notifyAll(): void;
}

/**
 * Queue Manager - Subject in Observer Pattern
 * Manages the order queue and notifies observers of changes
 */
export class QueueManager implements IQueueSubject {
  private static instance: QueueManager;
  private observers: Map<string, IQueueObserver>;
  private queue: Map<string, IQueueItem>;
  private tokenToOrderId: Map<number, string>;

  private constructor() {
    this.observers = new Map();
    this.queue = new Map();
    this.tokenToOrderId = new Map();
  }

  /**
   * Singleton pattern for queue manager
   */
  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Attach an observer to receive queue updates
   */
  attach(observer: IQueueObserver): void {
    this.observers.set(observer.id, observer);
    // Send current queue state to new observer
    observer.updateQueue(this.getQueue());
  }

  /**
   * Detach an observer
   */
  detach(observerId: string): void {
    this.observers.delete(observerId);
  }

  /**
   * Notify all observers about a specific queue item update
   */
  notify(queueItem: IQueueItem): void {
    this.observers.forEach(observer => {
      observer.update(queueItem);
    });
  }

  /**
   * Notify all observers about the complete queue
   */
  notifyAll(): void {
    const currentQueue = this.getQueue();
    this.observers.forEach(observer => {
      observer.updateQueue(currentQueue);
    });
  }

  /**
   * Add order to queue
   */
  addToQueue(order: IOrder): void {
    const queueItem: IQueueItem = {
      tokenNumber: order.tokenNumber,
      orderId: order.id,
      status: order.status,
      estimatedTime: this.calculateEstimatedTime(order.status)
    };

    this.queue.set(order.id, queueItem);
    this.tokenToOrderId.set(order.tokenNumber, order.id);

    // Notify all observers about the new item
    this.notify(queueItem);
    this.notifyAll();
  }

  /**
   * Update order status in queue
   */
  updateOrderStatus(orderId: string, status: OrderStatus): void {
    const queueItem = this.queue.get(orderId);

    if (queueItem) {
      queueItem.status = status;
      queueItem.estimatedTime = this.calculateEstimatedTime(status);

      // Remove from queue if completed or cancelled
      if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
        this.removeFromQueue(orderId, status);
      } else {
        this.queue.set(orderId, queueItem);
        // Notify all observers about the update
        this.notify(queueItem);
        this.notifyAll();
      }
    }
  }

  /**
   * Remove order from queue
   */
  removeFromQueue(orderId: string, terminalStatus: OrderStatus = OrderStatus.COMPLETED): void {
    const queueItem = this.queue.get(orderId);
    if (queueItem) {
      this.tokenToOrderId.delete(queueItem.tokenNumber);
      this.queue.delete(orderId);

      // Notify listeners with the actual terminal status.
      queueItem.status = terminalStatus;
      queueItem.estimatedTime = 0;
      this.notify(queueItem);
      this.notifyAll();
    }
  }

  /**
   * Get queue item by order ID
   */
  getQueueItem(orderId: string): IQueueItem | undefined {
    return this.queue.get(orderId);
  }

  /**
   * Get queue item by token number
   */
  getQueueItemByToken(tokenNumber: number): IQueueItem | undefined {
    const orderId = this.tokenToOrderId.get(tokenNumber);
    return orderId ? this.queue.get(orderId) : undefined;
  }

  /**
   * Get current queue as array (sorted by token number)
   */
  getQueue(): IQueueItem[] {
    return Array.from(this.queue.values())
      .filter(item =>
        item.status !== OrderStatus.COMPLETED &&
        item.status !== OrderStatus.CANCELLED
      )
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
  }

  /**
   * Get queue position for an order
   */
  getQueuePosition(orderId: string): number {
    const queue = this.getQueue();
    const index = queue.findIndex(item => item.orderId === orderId);
    return index >= 0 ? index + 1 : -1;
  }

  /**
   * Get orders ready for pickup
   */
  getReadyOrders(): IQueueItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === OrderStatus.READY)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
  }

  /**
   * Get preparing orders
   */
  getPreparingOrders(): IQueueItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.status === OrderStatus.PREPARING)
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
  }

  /**
   * Calculate estimated time based on status
   */
  private calculateEstimatedTime(status: OrderStatus): number {
    switch (status) {
      case OrderStatus.PENDING:
        return 0;
      case OrderStatus.PAID:
        return 15; // 15 minutes estimate
      case OrderStatus.PREPARING:
        return 10; // 10 minutes remaining
      case OrderStatus.READY:
        return 0; // Ready for pickup
      default:
        return 0;
    }
  }

  /**
   * Clear the queue (for testing or reset)
   */
  clearQueue(): void {
    this.queue.clear();
    this.tokenToOrderId.clear();
    this.notifyAll();
  }

  /**
   * Get observer count
   */
  getObserverCount(): number {
    return this.observers.size;
  }

  /**
   * Load existing orders into queue (for server restart)
   */
  loadOrders(orders: IOrder[]): void {
    orders.forEach(order => {
      if (order.status !== OrderStatus.COMPLETED &&
          order.status !== OrderStatus.CANCELLED) {
        const queueItem: IQueueItem = {
          tokenNumber: order.tokenNumber,
          orderId: order.id,
          status: order.status,
          estimatedTime: this.calculateEstimatedTime(order.status)
        };
        this.queue.set(order.id, queueItem);
        this.tokenToOrderId.set(order.tokenNumber, order.id);
      }
    });
    this.notifyAll();
  }
}

// Export singleton instance
export const queueManager = QueueManager.getInstance();
