import { Request, Response } from "express";
import Stripe from "stripe";
import Product from "../models/Product";
import Cart from "../models/Cart";
import sendEmail from "../utils/sendEmail";
import Order from "../models/Order";
import { OrderStatus } from "../constants/enums";
import { getOrderEmailTemplate } from "../utils/emailTemplates/orderEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-07-29.dahlia",
});

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const order = await Order.findOne({ stripeSessionId: session.id });

    if (order && order.status === OrderStatus.pending) {
      order.status = OrderStatus.paid;
      order.paidAt = new Date();
      order.stripePaymentId = session.payment_intent as string;
      await order.save();

      // Clear the user's cart in the database now that payment succeeded
      await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

      const populatedOrder = await Order.findById(order._id)
        .populate("user", "name email")
        .populate("items.product", "name");

      if (populatedOrder && populatedOrder.user) {
        const user = populatedOrder.user as any;
        const items = populatedOrder.items.map((item: any) => ({
          name: item.product ? item.product.name : "Product",
          quantity: item.quantity,
          price: item.price,
        }));

        const html = getOrderEmailTemplate({
          userName: user.name,
          orderId: populatedOrder._id.toString(),
          items,
          totalAmount: populatedOrder.totalAmount,
          shippingAddress: populatedOrder.shippingAddress,
          estimatedDelivery: populatedOrder.estimatedDelivery,
        });

        // CRITICAL FOR VERCEL SERVERLESS:
        // Must await sendEmail so Vercel doesn't kill the function before SMTP completes
        try {
          await sendEmail({
            to: user.email,
            subject: `Order Confirmation #${populatedOrder._id}`,
            html,
          });
        } catch (err) {
          console.error("Failed to send order email:", err);
        }
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;

    const order = await Order.findOne({ stripeSessionId: session.id });

    if (order && order.status === OrderStatus.pending) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }

      order.status = OrderStatus.cancelled;
      await order.save();
    }
  }

  return res.status(200).json({ received: true });
};