/**
 * Payment Repository
 * Data access layer for Payment entity
 * Implements IPaymentRepository interface
 */

import { Types } from 'mongoose';
import { PaymentDocumentModel, PaymentDoc } from '../db/models';
import { IPayment, ICreatePaymentDTO, PaymentStatus, PaymentMethod } from '../interfaces';
import { IPaymentRepository } from '../interfaces/repositories';

export class PaymentRepository implements IPaymentRepository {
  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<IPayment | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const payment = await PaymentDocumentModel.findById(id).lean<PaymentDoc | null>();
    return payment ? this.mapToPayment(payment) : null;
  }

  /**
   * Find payment by order ID
   */
  async findByOrderId(orderId: string): Promise<IPayment | null> {
    if (!Types.ObjectId.isValid(orderId)) {
      return null;
    }

    const payment = await PaymentDocumentModel.findOne({ orderId })
      .sort({ createdAt: -1 })
      .lean<PaymentDoc | null>();

    return payment ? this.mapToPayment(payment) : null;
  }

  /**
   * Find all payments
   */
  async findAll(): Promise<IPayment[]> {
    const payments = await PaymentDocumentModel.find().sort({ createdAt: -1 }).lean<PaymentDoc[]>();
    return payments.map((payment) => this.mapToPayment(payment));
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: PaymentStatus): Promise<IPayment[]> {
    const payments = await PaymentDocumentModel.find({ status }).sort({ createdAt: -1 }).lean<PaymentDoc[]>();
    return payments.map((payment) => this.mapToPayment(payment));
  }

  /**
   * Create new payment
   */
  async create(data: ICreatePaymentDTO): Promise<IPayment> {
    const payment = await PaymentDocumentModel.create({
      orderId: new Types.ObjectId(data.orderId),
      amount: data.amount,
      status: PaymentStatus.PENDING,
      method: data.method
    });

    return this.mapToPayment(payment.toObject() as PaymentDoc);
  }

  /**
   * Update payment status
   */
  async updateStatus(id: string, status: string, transactionId?: string): Promise<IPayment | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const updatePayload: { status: string; transactionId?: string } = { status };
    if (transactionId) {
      updatePayload.transactionId = transactionId;
    }

    const payment = await PaymentDocumentModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true
    }).lean<PaymentDoc | null>();

    return payment ? this.mapToPayment(payment) : null;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(): Promise<{
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    totalAmount: number;
    byMethod: Record<string, number>;
  }> {
    const [
      total,
      successful,
      failed,
      totalAmountResult,
      byMethodResult
    ] = await Promise.all([
      PaymentDocumentModel.countDocuments(),
      PaymentDocumentModel.countDocuments({ status: PaymentStatus.SUCCESS }),
      PaymentDocumentModel.countDocuments({ status: PaymentStatus.FAILED }),
      PaymentDocumentModel.aggregate<{ totalAmount: number }>([
        { $match: { status: PaymentStatus.SUCCESS } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
      ]),
      PaymentDocumentModel.aggregate<{ _id: string; amount: number }>([
        { $match: { status: PaymentStatus.SUCCESS } },
        { $group: { _id: '$method', amount: { $sum: '$amount' } } }
      ])
    ]);

    const byMethod: Record<string, number> = {};
    byMethodResult.forEach((row) => {
      byMethod[row._id] = Number(row.amount);
    });

    return {
      totalPayments: total,
      successfulPayments: successful,
      failedPayments: failed,
      totalAmount: totalAmountResult[0]?.totalAmount || 0,
      byMethod
    };
  }

  /**
   * Map database row to IPayment interface
   */
  private mapToPayment(row: PaymentDoc): IPayment {
    return {
      id: row._id.toString(),
      orderId: row.orderId.toString(),
      amount: Number(row.amount),
      status: row.status as PaymentStatus,
      method: row.method as PaymentMethod,
      transactionId: row.transactionId || undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
