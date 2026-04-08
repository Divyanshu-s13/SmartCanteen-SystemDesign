/**
 * Strategy Pattern - Payment Strategies
 * Allows switching between payment methods at runtime
 * Follows Open/Closed Principle - add new payment methods without modifying existing code
 */

import { PaymentMethod, PaymentStatus, IPayment } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

// Payment result interface
export interface IPaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  status: PaymentStatus;
}

// Payment strategy interface - Abstraction
export interface IPaymentStrategy {
  readonly methodType: PaymentMethod;
  processPayment(amount: number, paymentDetails: Record<string, any>): Promise<IPaymentResult>;
  validatePaymentDetails(details: Record<string, any>): boolean;
  refundPayment(transactionId: string, amount: number): Promise<IPaymentResult>;
}

/**
 * UPI Payment Strategy
 */
export class UPIPaymentStrategy implements IPaymentStrategy {
  readonly methodType = PaymentMethod.UPI;

  async processPayment(amount: number, paymentDetails: Record<string, any>): Promise<IPaymentResult> {
    // Validate UPI ID
    if (!this.validatePaymentDetails(paymentDetails)) {
      return {
        success: false,
        message: 'Invalid UPI ID format',
        status: PaymentStatus.FAILED
      };
    }

    // Mock payment processing - simulate API call
    await this.simulateProcessing();

    // Mock success (90% success rate for demo)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `UPI_${uuidv4().substring(0, 8).toUpperCase()}`,
        message: `Payment of Rs. ${amount} successful via UPI`,
        status: PaymentStatus.SUCCESS
      };
    }

    return {
      success: false,
      message: 'UPI payment failed. Please try again.',
      status: PaymentStatus.FAILED
    };
  }

  validatePaymentDetails(details: Record<string, any>): boolean {
    const upiId = details.upiId;
    if (!upiId || typeof upiId !== 'string') return false;
    // Basic UPI ID validation: name@bank format
    const upiRegex = /^[\w.-]+@[\w]+$/;
    return upiRegex.test(upiId);
  }

  async refundPayment(transactionId: string, amount: number): Promise<IPaymentResult> {
    await this.simulateProcessing();
    return {
      success: true,
      transactionId: `UPI_REF_${uuidv4().substring(0, 8).toUpperCase()}`,
      message: `Refund of Rs. ${amount} processed for transaction ${transactionId}`,
      status: PaymentStatus.REFUNDED
    };
  }

  private simulateProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * Card Payment Strategy
 */
export class CardPaymentStrategy implements IPaymentStrategy {
  readonly methodType = PaymentMethod.CARD;

  async processPayment(amount: number, paymentDetails: Record<string, any>): Promise<IPaymentResult> {
    // Validate card details
    if (!this.validatePaymentDetails(paymentDetails)) {
      return {
        success: false,
        message: 'Invalid card details',
        status: PaymentStatus.FAILED
      };
    }

    // Mock payment processing
    await this.simulateProcessing();

    // Mock success (95% success rate for demo)
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      const lastFour = paymentDetails.cardNumber.slice(-4);
      return {
        success: true,
        transactionId: `CARD_${uuidv4().substring(0, 8).toUpperCase()}`,
        message: `Payment of Rs. ${amount} successful via card ending in ${lastFour}`,
        status: PaymentStatus.SUCCESS
      };
    }

    return {
      success: false,
      message: 'Card payment declined. Please try again or use a different card.',
      status: PaymentStatus.FAILED
    };
  }

  validatePaymentDetails(details: Record<string, any>): boolean {
    const { cardNumber, expiryMonth, expiryYear, cvv } = details;

    // Basic card validation
    if (!cardNumber || typeof cardNumber !== 'string') return false;
    if (cardNumber.replace(/\s/g, '').length < 13) return false;

    if (!expiryMonth || !expiryYear) return false;
    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);
    if (month < 1 || month > 12) return false;
    if (year < new Date().getFullYear() % 100) return false;

    if (!cvv || cvv.length < 3 || cvv.length > 4) return false;

    return true;
  }

  async refundPayment(transactionId: string, amount: number): Promise<IPaymentResult> {
    await this.simulateProcessing();
    return {
      success: true,
      transactionId: `CARD_REF_${uuidv4().substring(0, 8).toUpperCase()}`,
      message: `Refund of Rs. ${amount} processed for transaction ${transactionId}`,
      status: PaymentStatus.REFUNDED
    };
  }

  private simulateProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 800));
  }
}

/**
 * Wallet Payment Strategy
 */
export class WalletPaymentStrategy implements IPaymentStrategy {
  readonly methodType = PaymentMethod.WALLET;

  async processPayment(amount: number, paymentDetails: Record<string, any>): Promise<IPaymentResult> {
    // Validate wallet details
    if (!this.validatePaymentDetails(paymentDetails)) {
      return {
        success: false,
        message: 'Invalid wallet details',
        status: PaymentStatus.FAILED
      };
    }

    // Mock payment processing
    await this.simulateProcessing();

    // Check mock balance
    const mockBalance = paymentDetails.mockBalance || 1000;
    if (amount > mockBalance) {
      return {
        success: false,
        message: 'Insufficient wallet balance',
        status: PaymentStatus.FAILED
      };
    }

    return {
      success: true,
      transactionId: `WAL_${uuidv4().substring(0, 8).toUpperCase()}`,
      message: `Payment of Rs. ${amount} successful via wallet`,
      status: PaymentStatus.SUCCESS
    };
  }

  validatePaymentDetails(details: Record<string, any>): boolean {
    const { walletId, pin } = details;
    if (!walletId || typeof walletId !== 'string') return false;
    if (!pin || pin.length !== 4) return false;
    return true;
  }

  async refundPayment(transactionId: string, amount: number): Promise<IPaymentResult> {
    await this.simulateProcessing();
    return {
      success: true,
      transactionId: `WAL_REF_${uuidv4().substring(0, 8).toUpperCase()}`,
      message: `Refund of Rs. ${amount} credited to wallet`,
      status: PaymentStatus.REFUNDED
    };
  }

  private simulateProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

/**
 * Payment Context - Uses strategy pattern
 * Allows switching payment strategies at runtime
 */
export class PaymentContext {
  private strategy: IPaymentStrategy;
  private strategies: Map<PaymentMethod, IPaymentStrategy>;

  constructor() {
    // Initialize all strategies
    const strategyEntries: Array<[PaymentMethod, IPaymentStrategy]> = [
      [PaymentMethod.UPI, new UPIPaymentStrategy()],
      [PaymentMethod.CARD, new CardPaymentStrategy()],
      [PaymentMethod.WALLET, new WalletPaymentStrategy()]
    ];
    this.strategies = new Map(strategyEntries);

    // Default strategy
    this.strategy = this.strategies.get(PaymentMethod.UPI)!;
  }

  /**
   * Set the payment strategy
   */
  setStrategy(method: PaymentMethod): void {
    const strategy = this.strategies.get(method);
    if (!strategy) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    this.strategy = strategy;
  }

  /**
   * Get current strategy type
   */
  getCurrentMethod(): PaymentMethod {
    return this.strategy.methodType;
  }

  /**
   * Process payment using current strategy
   */
  async processPayment(amount: number, paymentDetails: Record<string, any>): Promise<IPaymentResult> {
    return this.strategy.processPayment(amount, paymentDetails);
  }

  /**
   * Validate payment details using current strategy
   */
  validateDetails(details: Record<string, any>): boolean {
    return this.strategy.validatePaymentDetails(details);
  }

  /**
   * Process refund using current strategy
   */
  async processRefund(transactionId: string, amount: number): Promise<IPaymentResult> {
    return this.strategy.refundPayment(transactionId, amount);
  }

  /**
   * Get all available payment methods
   */
  getAvailableMethods(): PaymentMethod[] {
    return Array.from(this.strategies.keys());
  }
}

// Export singleton instance
export const paymentContext = new PaymentContext();
