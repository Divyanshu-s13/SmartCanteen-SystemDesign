/**
 * Order Repository
 * Data access layer for Order entity
 * Implements IOrderRepository interface
 */

import { Types } from 'mongoose';
import { MenuItemDocumentModel, MenuItemDoc, OrderDocumentModel, OrderDoc } from '../db/models';
import { IOrder, IOrderItem, ICreateOrderDTO, OrderStatus } from '../interfaces';
import { IOrderRepository } from '../interfaces/repositories';

export class OrderRepository implements IOrderRepository {
  /**
   * Find order by ID
   */
  async findById(id: string): Promise<IOrder | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const order = await OrderDocumentModel.findById(id).lean<OrderDoc | null>();
    return order ? this.mapToOrder(order) : null;
  }

  /**
   * Find order by ID with items
   */
  async findByIdWithItems(id: string): Promise<IOrder | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const order = await OrderDocumentModel.findById(id)
      .populate('items.menuItemId')
      .lean<OrderDoc | null>();

    return order ? this.mapToOrder(order, true) : null;
  }

  /**
   * Find all orders
   */
  async findAll(): Promise<IOrder[]> {
    const orders = await OrderDocumentModel.find().sort({ createdAt: -1 }).lean<OrderDoc[]>();
    return orders.map((order) => this.mapToOrder(order));
  }

  /**
   * Find orders by user ID
   */
  async findByUserId(userId: string): Promise<IOrder[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    const orders = await OrderDocumentModel.find({ userId })
      .sort({ createdAt: -1 })
      .populate('items.menuItemId')
      .lean<OrderDoc[]>();

    return orders.map((order) => this.mapToOrder(order, true));
  }

  /**
   * Find orders by status
   */
  async findByStatus(status: OrderStatus): Promise<IOrder[]> {
    const orders = await OrderDocumentModel.find({ status })
      .sort({ tokenNumber: 1 })
      .lean<OrderDoc[]>();

    return orders.map((order) => this.mapToOrder(order));
  }

  /**
   * Find active orders (not completed or cancelled)
   */
  async findActiveOrders(): Promise<IOrder[]> {
    const orders = await OrderDocumentModel.find({
      status: { $nin: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] }
    })
      .sort({ tokenNumber: 1 })
      .populate('items.menuItemId')
      .lean<OrderDoc[]>();

    return orders.map((order) => this.mapToOrder(order, true));
  }

  /**
   * Create new order with items
   */
  async create(data: ICreateOrderDTO, totalPrice: number, tokenNumber: number): Promise<IOrder> {
    if (!Types.ObjectId.isValid(data.userId)) {
      throw new Error('Invalid user ID');
    }

    const orderItems: Array<{ menuItemId: Types.ObjectId; quantity: number; price: number }> = [];

    for (const item of data.items) {
      if (!Types.ObjectId.isValid(item.menuItemId)) {
        throw new Error(`Invalid menu item ID: ${item.menuItemId}`);
      }

      const menuItem = await MenuItemDocumentModel.findById(item.menuItemId).lean<MenuItemDoc | null>();
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }

      orderItems.push({
        menuItemId: new Types.ObjectId(item.menuItemId),
        quantity: item.quantity,
        price: Number(menuItem.price) * item.quantity
      });
    }

    const orderDoc = await OrderDocumentModel.create({
      userId: new Types.ObjectId(data.userId),
      totalPrice,
      status: OrderStatus.PENDING,
      tokenNumber,
      items: orderItems
    });

    const populated = await OrderDocumentModel.findById(orderDoc._id)
      .populate('items.menuItemId')
      .lean<OrderDoc | null>();

    if (!populated) {
      throw new Error('Failed to create order');
    }

    return this.mapToOrder(populated, true);
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: OrderStatus): Promise<IOrder | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const order = await OrderDocumentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('items.menuItemId').lean<OrderDoc | null>();

    return order ? this.mapToOrder(order, true) : null;
  }

  /**
   * Get next token number
   */
  async getNextTokenNumber(): Promise<number> {
    const lastOrder = await OrderDocumentModel.findOne().sort({ createdAt: -1 }).lean<OrderDoc | null>();
    if (!lastOrder) {
      return 1;
    }

    return lastOrder.tokenNumber >= 999 ? 1 : lastOrder.tokenNumber + 1;
  }

  /**
   * Get today's orders
   */
  async getTodayOrders(): Promise<IOrder[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await OrderDocumentModel.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 }).lean<OrderDoc[]>();

    return orders.map((order) => this.mapToOrder(order));
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
    const [
      total,
      pending,
      completed,
      totalRevenueAgg,
      todayOrders,
      todayRevenueAgg
    ] = await Promise.all([
      OrderDocumentModel.countDocuments(),
      OrderDocumentModel.countDocuments({
        status: { $in: [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.READY] }
      }),
      OrderDocumentModel.countDocuments({ status: OrderStatus.COMPLETED }),
      OrderDocumentModel.aggregate<{ totalRevenue: number }>([
        { $match: { status: OrderStatus.COMPLETED } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } }
      ]),
      OrderDocumentModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      OrderDocumentModel.aggregate<{ todayRevenue: number }>([
        {
          $match: {
            status: OrderStatus.COMPLETED,
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        },
        { $group: { _id: null, todayRevenue: { $sum: '$totalPrice' } } }
      ])
    ]);

    return {
      total,
      pending,
      completed,
      totalRevenue: totalRevenueAgg[0]?.totalRevenue || 0,
      todayOrders,
      todayRevenue: todayRevenueAgg[0]?.todayRevenue || 0
    };
  }

  /**
   * Map database row to IOrder interface
   */
  private mapToOrder(row: OrderDoc, includeMenuItems: boolean = false): IOrder {
    return {
      id: row._id.toString(),
      userId: row.userId.toString(),
      totalPrice: Number(row.totalPrice),
      status: row.status as OrderStatus,
      tokenNumber: Number(row.tokenNumber),
      items: (row.items || []).map((item: any) => this.mapToOrderItem(item, row._id.toString(), includeMenuItems)),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  /**
   * Map database row to IOrderItem interface
   */
  private mapToOrderItem(row: any, orderId: string, includeMenuItem: boolean): IOrderItem {
    const menuItem = includeMenuItem && row.menuItemId && row.menuItemId._id
      ? {
        id: row.menuItemId._id.toString(),
        name: row.menuItemId.name,
        description: row.menuItemId.description || '',
        price: Number(row.menuItemId.price),
        category: row.menuItemId.category,
        imageUrl: row.menuItemId.imageUrl || undefined,
        isAvailable: row.menuItemId.isAvailable,
        createdAt: new Date(row.menuItemId.createdAt || new Date()),
        updatedAt: new Date(row.menuItemId.updatedAt || new Date())
      }
      : undefined;

    const menuItemId = row.menuItemId?._id
      ? row.menuItemId._id.toString()
      : row.menuItemId?.toString();

    return {
      id: row._id?.toString() || new Types.ObjectId().toString(),
      orderId,
      menuItemId: menuItemId || '',
      quantity: Number(row.quantity),
      price: Number(row.price),
      menuItem
    };
  }
}

// Export singleton instance
export const orderRepository = new OrderRepository();
