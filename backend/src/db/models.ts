import { Schema, model, models, Types, InferSchemaType } from 'mongoose';
import { MenuCategory, OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../interfaces';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true, default: UserRole.STUDENT }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: Object.values(MenuCategory), required: true },
    imageUrl: { type: String, default: null },
    isAvailable: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const orderItemSchema = new Schema(
  {
    menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  {
    _id: true,
    versionKey: false
  }
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(OrderStatus), required: true, default: OrderStatus.PENDING },
    tokenNumber: { type: Number, required: true, min: 1, max: 999 },
    items: { type: [orderItemSchema], default: [] }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(PaymentStatus), required: true, default: PaymentStatus.PENDING },
    method: { type: String, enum: Object.values(PaymentMethod), required: true },
    transactionId: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

menuItemSchema.index({ category: 1, isAvailable: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, tokenNumber: 1 });
orderSchema.index({ createdAt: -1 });
paymentSchema.index({ orderId: 1, createdAt: -1 });

export const UserDocumentModel = models.User || model('User', userSchema);
export const MenuItemDocumentModel = models.MenuItem || model('MenuItem', menuItemSchema);
export const OrderDocumentModel = models.Order || model('Order', orderSchema);
export const PaymentDocumentModel = models.Payment || model('Payment', paymentSchema);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type MenuItemDoc = InferSchemaType<typeof menuItemSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type OrderDoc = InferSchemaType<typeof orderSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
