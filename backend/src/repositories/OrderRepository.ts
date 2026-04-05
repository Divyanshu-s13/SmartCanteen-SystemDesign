/**
 * Order Repository
 * Data access layer for Order entity
 * Implements IOrderRepository interface
 */

import { query, transaction } from '../config/database';
import { IOrder, IOrderItem, ICreateOrderDTO, OrderStatus } from '../interfaces';
import { IOrderRepository } from '../interfaces/repositories';

export class OrderRepository implements IOrderRepository {
  /**
   * Find order by ID
   */
  async findById(id: string): Promise<IOrder | null> {
    const result = await query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToOrder(result.rows[0]);
  }

  /**
   * Find order by ID with items
   */
  async findByIdWithItems(id: string): Promise<IOrder | null> {
    const orderResult = await query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const itemsResult = await query(
      `SELECT oi.*, mi.name, mi.description, mi.category, mi.image_url, mi.is_available
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
      [id]
    );

    const order = this.mapToOrder(orderResult.rows[0]);
    order.items = itemsResult.rows.map(this.mapToOrderItem);

    return order;
  }

  /**
   * Find all orders
   */
  async findAll(): Promise<IOrder[]> {
    const result = await query(
      'SELECT * FROM orders ORDER BY created_at DESC'
    );

    return result.rows.map(this.mapToOrder);
  }

  /**
   * Find orders by user ID
   */
  async findByUserId(userId: string): Promise<IOrder[]> {
    const result = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Get items for each order
    const orders = await Promise.all(
      result.rows.map(async (row) => {
        const order = this.mapToOrder(row);
        const itemsResult = await query(
          `SELECT oi.*, mi.name, mi.description, mi.category, mi.image_url
           FROM order_items oi
           JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = $1`,
          [order.id]
        );
        order.items = itemsResult.rows.map(this.mapToOrderItem);
        return order;
      })
    );

    return orders;
  }

  /**
   * Find orders by status
   */
  async findByStatus(status: OrderStatus): Promise<IOrder[]> {
    const result = await query(
      'SELECT * FROM orders WHERE status = $1 ORDER BY token_number ASC',
      [status]
    );

    return result.rows.map(this.mapToOrder);
  }

  /**
   * Find active orders (not completed or cancelled)
   */
  async findActiveOrders(): Promise<IOrder[]> {
    const result = await query(
      `SELECT * FROM orders
       WHERE status NOT IN ('completed', 'cancelled')
       ORDER BY token_number ASC`
    );

    // Get items for each order
    const orders = await Promise.all(
      result.rows.map(async (row) => {
        const order = this.mapToOrder(row);
        const itemsResult = await query(
          `SELECT oi.*, mi.name, mi.description, mi.category, mi.image_url
           FROM order_items oi
           JOIN menu_items mi ON oi.menu_item_id = mi.id
           WHERE oi.order_id = $1`,
          [order.id]
        );
        order.items = itemsResult.rows.map(this.mapToOrderItem);
        return order;
      })
    );

    return orders;
  }

  /**
   * Create new order with items
   */
  async create(data: ICreateOrderDTO, totalPrice: number, tokenNumber: number): Promise<IOrder> {
    return transaction(async (client) => {
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_price, status, token_number)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.userId, totalPrice, OrderStatus.PENDING, tokenNumber]
      );

      const order = this.mapToOrder(orderResult.rows[0]);

      // Create order items
      const items: IOrderItem[] = [];
      for (const item of data.items) {
        // Get menu item price
        const menuResult = await client.query(
          'SELECT price FROM menu_items WHERE id = $1',
          [item.menuItemId]
        );

        if (menuResult.rows.length === 0) {
          throw new Error(`Menu item not found: ${item.menuItemId}`);
        }

        const price = parseFloat(menuResult.rows[0].price);

        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, quantity, price)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [order.id, item.menuItemId, item.quantity, price * item.quantity]
        );

        items.push(this.mapToOrderItem(itemResult.rows[0]));
      }

      order.items = items;
      return order;
    });
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: OrderStatus): Promise<IOrder | null> {
    const result = await query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.findByIdWithItems(id);
  }

  /**
   * Get next token number
   */
  async getNextTokenNumber(): Promise<number> {
    const result = await query(
      "SELECT nextval('token_number_seq') as token"
    );

    return parseInt(result.rows[0].token);
  }

  /**
   * Get today's orders
   */
  async getTodayOrders(): Promise<IOrder[]> {
    const result = await query(
      `SELECT * FROM orders
       WHERE DATE(created_at) = CURRENT_DATE
       ORDER BY created_at DESC`
    );

    return result.rows.map(this.mapToOrder);
  }

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    const statsResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('pending', 'paid', 'preparing', 'ready')) as pending,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as total_revenue
      FROM orders
    `);

    const todayResult = await query(`
      SELECT
        COUNT(*) as today_orders,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as today_revenue
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    return {
      total: parseInt(statsResult.rows[0].total),
      pending: parseInt(statsResult.rows[0].pending),
      completed: parseInt(statsResult.rows[0].completed),
      totalRevenue: parseFloat(statsResult.rows[0].total_revenue),
      todayOrders: parseInt(todayResult.rows[0].today_orders),
      todayRevenue: parseFloat(todayResult.rows[0].today_revenue)
    };
  }

  /**
   * Map database row to IOrder interface
   */
  private mapToOrder(row: any): IOrder {
    return {
      id: row.id,
      userId: row.user_id,
      totalPrice: parseFloat(row.total_price),
      status: row.status as OrderStatus,
      tokenNumber: parseInt(row.token_number),
      items: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Map database row to IOrderItem interface
   */
  private mapToOrderItem(row: any): IOrderItem {
    return {
      id: row.id,
      orderId: row.order_id,
      menuItemId: row.menu_item_id,
      quantity: parseInt(row.quantity),
      price: parseFloat(row.price),
      menuItem: row.name ? {
        id: row.menu_item_id,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price) / parseInt(row.quantity),
        category: row.category,
        imageUrl: row.image_url,
        isAvailable: row.is_available,
        createdAt: new Date(),
        updatedAt: new Date()
      } : undefined
    };
  }
}

// Export singleton instance
export const orderRepository = new OrderRepository();
