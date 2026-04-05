/**
 * Order Service
 * Handles order management and queue operations
 * Follows Single Responsibility Principle (SRP)
 */

import { orderRepository, OrderRepository, menuRepository, MenuRepository } from '../repositories';
import { queueManager } from '../patterns';
import {
  IOrder,
  ICreateOrderDTO,
  OrderStatus,
  IApiResponse,
  IDashboardStats
} from '../interfaces';

export class OrderService {
  private orderRepository: OrderRepository;
  private menuRepository: MenuRepository;

  constructor(orderRepo?: OrderRepository, menuRepo?: MenuRepository) {
    // Dependency Injection
    this.orderRepository = orderRepo || orderRepository;
    this.menuRepository = menuRepo || menuRepository;
  }

  /**
   * Create a new order
   */
  async createOrder(data: ICreateOrderDTO): Promise<IApiResponse<IOrder>> {
    try {
      // Validate items
      if (!data.items || data.items.length === 0) {
        return {
          success: false,
          message: 'Order must have at least one item',
          error: 'VALIDATION_ERROR'
        };
      }

      // Calculate total price and validate items
      let totalPrice = 0;
      for (const item of data.items) {
        if (item.quantity <= 0) {
          return {
            success: false,
            message: 'Item quantity must be greater than 0',
            error: 'VALIDATION_ERROR'
          };
        }

        const menuItem = await this.menuRepository.findById(item.menuItemId);
        if (!menuItem) {
          return {
            success: false,
            message: `Menu item not found: ${item.menuItemId}`,
            error: 'NOT_FOUND'
          };
        }

        if (!menuItem.isAvailable) {
          return {
            success: false,
            message: `Menu item is not available: ${menuItem.name}`,
            error: 'ITEM_UNAVAILABLE'
          };
        }

        totalPrice += menuItem.price * item.quantity;
      }

      // Get next token number
      const tokenNumber = await this.orderRepository.getNextTokenNumber();

      // Create order
      const order = await this.orderRepository.create(data, totalPrice, tokenNumber);

      // Add to queue (Observer pattern)
      queueManager.addToQueue(order);

      return {
        success: true,
        message: 'Order created successfully',
        data: order
      };
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        message: 'Failed to create order',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<IApiResponse<IOrder>> {
    try {
      const order = await this.orderRepository.findByIdWithItems(orderId);

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Order retrieved successfully',
        data: order
      };
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        message: 'Failed to retrieve order',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get orders by user ID
   */
  async getUserOrders(userId: string): Promise<IApiResponse<IOrder[]>> {
    try {
      const orders = await this.orderRepository.findByUserId(userId);

      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: orders
      };
    } catch (error) {
      console.error('Get user orders error:', error);
      return {
        success: false,
        message: 'Failed to retrieve orders',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(): Promise<IApiResponse<IOrder[]>> {
    try {
      const orders = await this.orderRepository.findAll();

      return {
        success: true,
        message: 'Orders retrieved successfully',
        data: orders
      };
    } catch (error) {
      console.error('Get all orders error:', error);
      return {
        success: false,
        message: 'Failed to retrieve orders',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get active orders (admin only)
   */
  async getActiveOrders(): Promise<IApiResponse<IOrder[]>> {
    try {
      const orders = await this.orderRepository.findActiveOrders();

      return {
        success: true,
        message: 'Active orders retrieved successfully',
        data: orders
      };
    } catch (error) {
      console.error('Get active orders error:', error);
      return {
        success: false,
        message: 'Failed to retrieve orders',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get orders by status (admin only)
   */
  async getOrdersByStatus(status: OrderStatus): Promise<IApiResponse<IOrder[]>> {
    try {
      if (!Object.values(OrderStatus).includes(status)) {
        return {
          success: false,
          message: 'Invalid order status',
          error: 'VALIDATION_ERROR'
        };
      }

      const orders = await this.orderRepository.findByStatus(status);

      return {
        success: true,
        message: `Orders with status '${status}' retrieved successfully`,
        data: orders
      };
    } catch (error) {
      console.error('Get orders by status error:', error);
      return {
        success: false,
        message: 'Failed to retrieve orders',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Update order status (admin only)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IApiResponse<IOrder>> {
    try {
      // Validate status
      if (!Object.values(OrderStatus).includes(status)) {
        return {
          success: false,
          message: 'Invalid order status',
          error: 'VALIDATION_ERROR'
        };
      }

      // Check if order exists
      const existingOrder = await this.orderRepository.findById(orderId);
      if (!existingOrder) {
        return {
          success: false,
          message: 'Order not found',
          error: 'NOT_FOUND'
        };
      }

      // Validate status transition
      if (!this.isValidStatusTransition(existingOrder.status, status)) {
        return {
          success: false,
          message: `Cannot transition from '${existingOrder.status}' to '${status}'`,
          error: 'INVALID_TRANSITION'
        };
      }

      // Update status
      const updatedOrder = await this.orderRepository.updateStatus(orderId, status);

      if (updatedOrder) {
        // Update queue (Observer pattern notifies all subscribers)
        queueManager.updateOrderStatus(orderId, status);
      }

      return {
        success: true,
        message: `Order status updated to '${status}'`,
        data: updatedOrder!
      };
    } catch (error) {
      console.error('Update order status error:', error);
      return {
        success: false,
        message: 'Failed to update order status',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string, isAdmin: boolean = false): Promise<IApiResponse<IOrder>> {
    try {
      const order = await this.orderRepository.findById(orderId);

      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'NOT_FOUND'
        };
      }

      // Check ownership (unless admin)
      if (!isAdmin && order.userId !== userId) {
        return {
          success: false,
          message: 'You can only cancel your own orders',
          error: 'UNAUTHORIZED'
        };
      }

      // Can only cancel pending or paid orders
      if (![OrderStatus.PENDING, OrderStatus.PAID].includes(order.status)) {
        return {
          success: false,
          message: 'Cannot cancel order that is being prepared or completed',
          error: 'INVALID_OPERATION'
        };
      }

      const updatedOrder = await this.orderRepository.updateStatus(orderId, OrderStatus.CANCELLED);

      if (updatedOrder) {
        // Update queue (Observer pattern)
        queueManager.updateOrderStatus(orderId, OrderStatus.CANCELLED);
      }

      return {
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder!
      };
    } catch (error) {
      console.error('Cancel order error:', error);
      return {
        success: false,
        message: 'Failed to cancel order',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get dashboard statistics (admin only)
   */
  async getDashboardStats(): Promise<IApiResponse<IDashboardStats>> {
    try {
      const stats = await this.orderRepository.getOrderStats();

      return {
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          totalOrders: stats.total,
          pendingOrders: stats.pending,
          completedOrders: stats.completed,
          totalRevenue: stats.totalRevenue,
          todayOrders: stats.todayOrders,
          todayRevenue: stats.todayRevenue
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: 'Failed to retrieve statistics',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get queue position for an order
   */
  getQueuePosition(orderId: string): number {
    return queueManager.getQueuePosition(orderId);
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  /**
   * Initialize queue from database (on server start)
   */
  async initializeQueue(): Promise<void> {
    try {
      const activeOrders = await this.orderRepository.findActiveOrders();
      queueManager.loadOrders(activeOrders);
      console.log(`Queue initialized with ${activeOrders.length} active orders`);
    } catch (error) {
      console.error('Failed to initialize queue:', error);
    }
  }
}

// Export singleton instance
export const orderService = new OrderService();
