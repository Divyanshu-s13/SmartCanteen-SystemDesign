/**
 * Order Controller
 * Handles order-related HTTP requests
 */

import { Request, Response } from 'express';
import { orderService } from '../services';
import { OrderStatus, UserRole } from '../interfaces';
import { asyncHandler } from '../middleware';
import { queueManager } from '../patterns';

export class OrderController {
  /**
   * Create a new order
   * POST /api/orders
   */
  createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { items } = req.body;

    const result = await orderService.createOrder({
      userId,
      items
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === UserRole.ADMIN;

    const result = await orderService.getOrderById(id);

    if (!result.success) {
      res.status(404).json(result);
      return;
    }

    // Check if user owns the order (unless admin)
    if (!isAdmin && result.data!.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
      return;
    }

    // Add queue position
    const queuePosition = orderService.getQueuePosition(id);
    const responseData = {
      ...result,
      data: {
        ...result.data,
        queuePosition
      }
    };

    res.status(200).json(responseData);
  });

  /**
   * Get current user's orders
   * GET /api/orders
   */
  getUserOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const result = await orderService.getUserOrders(userId);

    res.status(200).json(result);
  });

  /**
   * Get all orders (admin only)
   * GET /api/admin/orders
   */
  getAllOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query;

    let result;
    if (status) {
      result = await orderService.getOrdersByStatus(status as OrderStatus);
    } else {
      result = await orderService.getAllOrders();
    }

    res.status(200).json(result);
  });

  /**
   * Get active orders (admin only)
   * GET /api/admin/orders/active
   */
  getActiveOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await orderService.getActiveOrders();

    res.status(200).json(result);
  });

  /**
   * Update order status (admin only)
   * PATCH /api/admin/orders/:id/status
   */
  updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await orderService.updateOrderStatus(id, status as OrderStatus);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(result.error === 'NOT_FOUND' ? 404 : 400).json(result);
    }
  });

  /**
   * Cancel order
   * DELETE /api/orders/:id
   */
  cancelOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === UserRole.ADMIN;

    const result = await orderService.cancelOrder(id, userId, isAdmin);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(result.error === 'NOT_FOUND' ? 404 : 400).json(result);
    }
  });

  /**
   * Get dashboard statistics (admin only)
   * GET /api/admin/dashboard
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await orderService.getDashboardStats();

    res.status(200).json(result);
  });

  /**
   * Get current queue
   * GET /api/queue
   */
  getCurrentQueue = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const queue = queueManager.getQueue();
    const readyOrders = queueManager.getReadyOrders();
    const preparingOrders = queueManager.getPreparingOrders();

    res.status(200).json({
      success: true,
      message: 'Queue retrieved successfully',
      data: {
        queue,
        readyOrders,
        preparingOrders,
        totalInQueue: queue.length
      }
    });
  });

  /**
   * Get queue position for specific order
   * GET /api/orders/:id/queue-position
   */
  getQueuePosition = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const position = orderService.getQueuePosition(id);
    const queueItem = queueManager.getQueueItem(id);

    if (position === -1) {
      res.status(404).json({
        success: false,
        message: 'Order not found in queue',
        error: 'NOT_FOUND'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Queue position retrieved successfully',
      data: {
        position,
        ...queueItem
      }
    });
  });
}

// Export singleton instance
export const orderController = new OrderController();
