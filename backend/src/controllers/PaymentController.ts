/**
 * Payment Controller
 * Handles payment-related HTTP requests
 */

import { Request, Response } from 'express';
import { paymentService, orderService } from '../services';
import { PaymentMethod, UserRole } from '../interfaces';
import { asyncHandler } from '../middleware';

export class PaymentController {
  /**
   * Process payment for an order
   * POST /api/payments
   */
  processPayment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId, method, paymentDetails } = req.body;
    const userId = req.user!.userId;

    // Verify order belongs to user
    const orderResult = await orderService.getOrderById(orderId);
    if (!orderResult.success) {
      res.status(404).json(orderResult);
      return;
    }

    if (orderResult.data!.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You can only pay for your own orders',
        error: 'FORBIDDEN'
      });
      return;
    }

    const result = await paymentService.processPayment(
      orderId,
      method as PaymentMethod,
      paymentDetails || {}
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Get payment by ID
   * GET /api/payments/:id
   */
  getPaymentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const result = await paymentService.getPaymentById(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  /**
   * Get payment by order ID
   * GET /api/payments/order/:orderId
   */
  getPaymentByOrderId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === UserRole.ADMIN;

    // Verify order belongs to user (unless admin)
    if (!isAdmin) {
      const orderResult = await orderService.getOrderById(orderId);
      if (!orderResult.success) {
        res.status(404).json(orderResult);
        return;
      }

      if (orderResult.data!.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'FORBIDDEN'
        });
        return;
      }
    }

    const result = await paymentService.getPaymentByOrderId(orderId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  });

  /**
   * Process refund (admin only)
   * POST /api/admin/payments/:orderId/refund
   */
  processRefund = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    const result = await paymentService.processRefund(orderId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  });

  /**
   * Get all payments (admin only)
   * GET /api/admin/payments
   */
  getAllPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.getAllPayments();

    res.status(200).json(result);
  });

  /**
   * Get payment statistics (admin only)
   * GET /api/admin/payments/stats
   */
  getPaymentStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await paymentService.getPaymentStats();

    res.status(200).json(result);
  });

  /**
   * Get available payment methods
   * GET /api/payments/methods
   */
  getPaymentMethods = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const methods = paymentService.getAvailablePaymentMethods();

    res.status(200).json({
      success: true,
      message: 'Payment methods retrieved successfully',
      data: methods.map(method => ({
        id: method,
        name: method.toUpperCase(),
        description: getMethodDescription(method)
      }))
    });
  });
}

// Helper function for payment method descriptions
function getMethodDescription(method: PaymentMethod): string {
  const descriptions: Record<PaymentMethod, string> = {
    [PaymentMethod.UPI]: 'Pay using UPI ID (Google Pay, PhonePe, etc.)',
    [PaymentMethod.CARD]: 'Pay using Debit/Credit Card',
    [PaymentMethod.WALLET]: 'Pay using SmartCanteen Wallet'
  };
  return descriptions[method] || '';
}

// Export singleton instance
export const paymentController = new PaymentController();
