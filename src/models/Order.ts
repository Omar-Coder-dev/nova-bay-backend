import mongoose, { Document, Schema } from "mongoose";
import { OrderStatus } from "../constants/enums";

// Describes a single line item inside an order (one product + how many + price paid)
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number; // price AT THE TIME OF PURCHASE - not the live product price
}

// Describes the whole order
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  estimatedDelivery: Date;
  stripePaymentId?: string; // optional - only exists once payment is linked
  paidAt?: Date; // when payment actually cleared - separate from updatedAt, which changes on ANY edit
  deliveredAt?: Date; // when the order was actually marked completed
  stripeSessionId?: string;
}

// A separate small schema just for one item inside the order's item list.
// We need this because each item has multiple fields (not just one ID like wishlist did).
const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1, // can't order zero or negative quantity
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false, // don't generate an extra ID for each item - we never need to address one individually
  },
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    items: {
      type: [orderItemSchema], // an array where each entry follows the item schema above
      required: [true, "Order items are required"],
      validate: [
        (val: IOrderItem[]) => val.length > 0, // blocks creating an order with zero items
        "Order must contain at least one item",
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.pending,
    },
    shippingAddress: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
    },
    estimatedDelivery: {
      type: Date,
      // using a FUNCTION here, not a fixed value - otherwise every order would get
      // frozen to the same date (whatever time the server first started up)
      default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    stripePaymentId: {
      type: String,
      trim: true,
    },
    stripeSessionId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
      // no default - stays unset until the controller explicitly sets it
      // at the moment status actually flips to "paid"
    },
    deliveredAt: {
      type: Date,
      // same idea - set explicitly when status flips to "completed"
    },
  },
  { timestamps: true },
);

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
