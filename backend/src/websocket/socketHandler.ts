/**
 * WebSocket Handler
 * Manages real-time connections for queue updates
 * Implements Observer pattern for client notifications
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { queueManager, IQueueObserver } from '../patterns';
import { IQueueItem, OrderStatus } from '../interfaces';
import { authService } from '../services';

// Socket observer implementing IQueueObserver
class SocketObserver implements IQueueObserver {
  id: string;
  private socket: Socket;

  constructor(socket: Socket) {
    this.id = socket.id;
    this.socket = socket;
  }

  update(queueItem: IQueueItem): void {
    this.socket.emit('queue:update', queueItem);
  }

  updateQueue(queue: IQueueItem[]): void {
    this.socket.emit('queue:full', queue);
  }
}

export class WebSocketHandler {
  private io: Server;
  private connectedClients: Map<string, SocketObserver>;

  constructor(httpServer: HttpServer) {
    const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
    const configuredOrigins = (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

    const isLocalDevOrigin = (origin: string): boolean => {
      try {
        const parsed = new URL(origin);
        return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      } catch {
        return false;
      }
    };

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (
            !origin
            || allowedOrigins.includes(origin)
            || (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin))
          ) {
            callback(null, true);
            return;
          }

          callback(new Error('Not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.connectedClients = new Map();
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Create observer for this socket
      const observer = new SocketObserver(socket);
      this.connectedClients.set(socket.id, observer);

      // Register observer with queue manager
      queueManager.attach(observer);

      // Handle authentication (optional, for user-specific updates)
      socket.on('authenticate', async (token: string) => {
        try {
          const payload = authService.verifyToken(token);
          if (payload) {
            socket.data.userId = payload.userId;
            socket.data.role = payload.role;
            socket.join(`user:${payload.userId}`);

            if (payload.role === 'admin') {
              socket.join('admins');
            }

            socket.emit('authenticated', { userId: payload.userId, role: payload.role });
          }
        } catch (error) {
          socket.emit('auth_error', { message: 'Invalid token' });
        }
      });

      // Handle join queue room (for display screens)
      socket.on('join:queue', () => {
        socket.join('queue-display');
        // Send current queue state
        socket.emit('queue:full', queueManager.getQueue());
      });

      // Handle admin joining for order management
      socket.on('join:admin', () => {
        if (socket.data.role === 'admin') {
          socket.join('admins');
          socket.emit('admin:joined');
        }
      });

      // Handle subscribing to specific order updates
      socket.on('subscribe:order', (orderId: string) => {
        socket.join(`order:${orderId}`);
        const queueItem = queueManager.getQueueItem(orderId);
        if (queueItem) {
          socket.emit('order:status', queueItem);
        }
      });

      // Handle unsubscribing from order updates
      socket.on('unsubscribe:order', (orderId: string) => {
        socket.leave(`order:${orderId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        queueManager.detach(socket.id);
        this.connectedClients.delete(socket.id);
      });
    });
  }

  /**
   * Emit order status update to specific order room and all queue displays
   */
  emitOrderUpdate(orderId: string, queueItem: IQueueItem): void {
    // Emit to specific order subscribers
    this.io.to(`order:${orderId}`).emit('order:status', queueItem);

    // Emit to all queue displays
    this.io.to('queue-display').emit('queue:update', queueItem);

    // Emit to admins
    this.io.to('admins').emit('admin:order-update', queueItem);

    // If order is ready, emit special notification
    if (queueItem.status === OrderStatus.READY) {
      this.io.to(`order:${orderId}`).emit('order:ready', {
        tokenNumber: queueItem.tokenNumber,
        message: `Order #${queueItem.tokenNumber} is ready for pickup!`
      });
    }
  }

  /**
   * Emit full queue update to all queue displays
   */
  emitQueueUpdate(): void {
    const queue = queueManager.getQueue();
    this.io.to('queue-display').emit('queue:full', queue);
  }

  /**
   * Emit new order notification to admins
   */
  emitNewOrder(order: any): void {
    this.io.to('admins').emit('admin:new-order', order);
  }

  /**
   * Get connected client count
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get Socket.io server instance
   */
  getIO(): Server {
    return this.io;
  }
}

// Export factory function
export const createWebSocketHandler = (httpServer: HttpServer): WebSocketHandler => {
  return new WebSocketHandler(httpServer);
};
