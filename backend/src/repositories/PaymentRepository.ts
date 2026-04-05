/**
 * Payment Repository
 * Data access layer for Payment entity
 * Implements IPaymentRepository interface
 */

import { query } from '../config/database';
import { IPayment, ICreatePaymentDTO, PaymentStatus, PaymentMethod } from '../interfaces';
import { IPaymentRepository } from '../interfaces/repositories';

export class PaymentRepository implements IPaymentRepository {
  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<IPayment | null> {
    const result = await query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToPayment(result.rows[0]);
  }

  /**
   * Find payment by order ID
   */
  async findByOrderId(orderId: string): Promise<IPayment | null> {
    const result = await query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToPayment(result.rows[0]);
  }

  /**
   * Find all payments
   */
  async findAll(): Promise<IPayment[]> {
    const result = await query(
      'SELECT * FROM payments ORDER BY created_at DESC'
    );

    return result.rows.map(this.mapToPayment);
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: PaymentStatus): Promise<IPayment[]> {
    const result = await query(
      'SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );

    return result.rows.map(this.mapToPayment);
  }

  /**
   * Create new payment
   */
  async create(data: ICreatePaymentDTO): Promise<IPayment> {
    const result = await query(
      `INSERT INTO payments (order_id, amount, status, method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.orderId, data.amount, PaymentStatus.PENDING, data.method]
    );

    return this.mapToPayment(result.rows[0]);
  }

  /**
   * Update payment status
   */
  async updateStatus(id: string, status: string, transactionId?: string): Promise<IPayment | null> {
    let queryStr: string;
    let params: any[];

    if (transactionId) {
      queryStr = `UPDATE payments SET status = $1, transaction_id = $2 WHERE id = $3 RETURNING *`;
      params = [status, transactionId, id];
    } else {
      queryStr = `UPDATE payments SET status = $1 WHERE id = $2 RETURNING *`;
      params = [status, id];
    }

    const result = await query(queryStr, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToPayment(result.rows[0]);
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
    const statsResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COALESCE(SUM(amount) FILTER (WHERE status = 'success'), 0) as total_amount
      FROM payments
    `);

    const methodResult = await query(`
      SELECT method, COALESCE(SUM(amount), 0) as amount
      FROM payments
      WHERE status = 'success'
      GROUP BY method
    `);

    const byMethod: Record<string, number> = {};
    methodResult.rows.forEach((row: any) => {
      byMethod[row.method] = parseFloat(row.amount);
    });

    return {
      totalPayments: parseInt(statsResult.rows[0].total),
      successfulPayments: parseInt(statsResult.rows[0].successful),
      failedPayments: parseInt(statsResult.rows[0].failed),
      totalAmount: parseFloat(statsResult.rows[0].total_amount),
      byMethod
    };
  }

  /**
   * Map database row to IPayment interface
   */
  private mapToPayment(row: any): IPayment {
    return {
      id: row.id,
      orderId: row.order_id,
      amount: parseFloat(row.amount),
      status: row.status as PaymentStatus,
      method: row.method as PaymentMethod,
      transactionId: row.transaction_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
