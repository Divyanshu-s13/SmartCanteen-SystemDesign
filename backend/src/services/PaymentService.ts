/**
 * Payment Service
 * Handles payment processing using Strategy Pattern
 * Follows Open/Closed Principle - extensible for new payment methods
 */

import { paymentRepository, PaymentRepository, orderRepository, OrderRepository } from '../repositories';
import { paymentContext, queueManager } from '../patterns';
import {
  IPayment,
  ICreatePaymentDTO,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  IApiResponse
} from '../interfaces';

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private orderRepository: OrderRepository;

  constructor(paymentRepo?: PaymentRepository, orderRepo?: OrderRepository) {
    // Dependency Injection
    this.paymentRepository = paymentRepo || paymentRepository;
    this.orderRepository = orderRepo || orderRepository;
  }

  /**
   * Process payment for an order
   */
  async processPayment(
    orderId: string,
    method: PaymentMethod,
    paymentDetails: Record<string, any>
  ): Promise<IApiResponse<IPayment>> {
    try {
      // Validate payment method
      if (!Object.values(PaymentMethod).includes(method)) {
        return {
          success: false,
          message: 'Invalid payment method',
          error: 'VALIDATION_ERROR'
        };
      }

      // Get order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'NOT_FOUND'
        };
      }

      // Check if order is in pending status
      if (order.status !== OrderStatus.PENDING) {
        return {
          success: false,
          message: 'Order has already been paid or processed',
          error: 'INVALID_OPERATION'
        };
      }

      // Check if payment already exists
      const existingPayment = await this.paymentRepository.findByOrderId(orderId);
      if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
        return {
          success: false,
          message: 'Payment has already been processed',
          error: 'ALREADY_PAID'
        };
      }

      // Set payment strategy
      paymentContext.setStrategy(method);

      // Validate payment details
      if (!paymentContext.validateDetails(paymentDetails)) {
        return {
          success: false,
          message: 'Invalid payment details',
          error: 'VALIDATION_ERROR'
        };
      }

      // Create payment record
      const createPaymentDTO: ICreatePaymentDTO = {
        orderId,
        amount: order.totalPrice,
        method
      };

      const payment = await this.paymentRepository.create(createPaymentDTO);

      // Process payment using strategy
      const result = await paymentContext.processPayment(order.totalPrice, paymentDetails);

      // Update payment status
      const updatedPayment = await this.paymentRepository.updateStatus(
        payment.id,
        result.status,
        result.transactionId
      );

      // If payment successful, update order status
      if (result.success) {
        await this.orderRepository.updateStatus(orderId, OrderStatus.PAID);

        // Update queue (Observer pattern)
        queueManager.updateOrderStatus(orderId, OrderStatus.PAID);
      }

      return {
        success: result.success,
        message: result.message,
        data: updatedPayment!
      };
    } catch (error) {
      console.error('Process payment error:', error);
      return {
        success: false,
        message: 'Payment processing failed',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<IApiResponse<IPayment>> {
    try {
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        return {
          success: false,
          message: 'Payment not found',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment
      };
    } catch (error) {
      console.error('Get payment error:', error);
      return {
        success: false,
        message: 'Failed to retrieve payment',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<IApiResponse<IPayment>> {
    try {
      const payment = await this.paymentRepository.findByOrderId(orderId);

      if (!payment) {
        return {
          success: false,
          message: 'Payment not found for this order',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Payment retrieved successfully',
        data: payment
      };
    } catch (error) {
      console.error('Get payment by order error:', error);
      return {
        success: false,
        message: 'Failed to retrieve payment',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Process refund for a cancelled order
   */
  async processRefund(orderId: string): Promise<IApiResponse<IPayment>> {
    try {
      // Get order
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return {
          success: false,
          message: 'Order not found',
          error: 'NOT_FOUND'
        };
      }

      // Check if order is cancelled or can be refunded
      if (order.status !== OrderStatus.CANCELLED) {
        return {
          success: false,
          message: 'Refunds can only be processed for cancelled orders',
          error: 'INVALID_OPERATION'
        };
      }

      // Get payment
      const payment = await this.paymentRepository.findByOrderId(orderId);
      if (!payment) {
        return {
          success: false,
          message: 'No payment found for this order',
          error: 'NOT_FOUND'
        };
      }

      if (payment.status !== PaymentStatus.SUCCESS) {
        return {
          success: false,
          message: 'Payment was not successful, no refund needed',
          error: 'INVALID_OPERATION'
        };
      }

      // Set payment strategy based on original payment method
      paymentContext.setStrategy(payment.method);

      // Process refund
      const result = await paymentContext.processRefund(
        payment.transactionId || payment.id,
        payment.amount
      );

      // Update payment status
      const updatedPayment = await this.paymentRepository.updateStatus(
        payment.id,
        result.status,
        result.transactionId
      );

      return {
        success: result.success,
        message: result.message,
        data: updatedPayment!
      };
    } catch (error) {
      console.error('Process refund error:', error);
      return {
        success: false,
        message: 'Refund processing failed',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get all payments (admin only)
   */
  async getAllPayments(): Promise<IApiResponse<IPayment[]>> {
    try {
      const payments = await this.paymentRepository.findAll();

      return {
        success: true,
        message: 'Payments retrieved successfully',
        data: payments
      };
    } catch (error) {
      console.error('Get all payments error:', error);
      return {
        success: false,
        message: 'Failed to retrieve payments',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get payment statistics (admin only)
   */
  async getPaymentStats(): Promise<IApiResponse<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    byMethod: Record<string, number>;
  }>> {
    try {
      const stats = await this.paymentRepository.getPaymentStats();

      return {
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats
      };
    } catch (error) {
      console.error('Get payment stats error:', error);
      return {
        success: false,
        message: 'Failed to retrieve statistics',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): PaymentMethod[] {
    return paymentContext.getAvailableMethods();
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
