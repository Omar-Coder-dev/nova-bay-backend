export interface OrderEmailData {
  userName: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  shippingAddress: string;
  estimatedDelivery: Date;
}

export const getOrderEmailTemplate = (data: OrderEmailData): string => {
  const formattedDeliveryDate = new Date(data.estimatedDelivery).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const itemsList = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #374151; font-size: 14px;">${item.name}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #9ca3af; font-size: 14px; text-align: center;">×${item.quantity}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="background-color: #f4f4f7; padding: 40px 20px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

      <!-- Header -->
      <div style="background-color: #6366f1; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px 40px; text-align: center;">
        <div style="width: 56px; height: 56px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 56px; color: #ffffff; font-size: 28px; font-weight: bold;">✓</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">
          Order Confirmed
        </h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
          Order #${data.orderId}
        </p>
      </div>

      <!-- Content Body -->
      <div style="padding: 40px;">
        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
          Hi <strong style="color: #1f2937;">${data.userName}</strong>, thanks for your purchase — we're getting your order ready.
        </p>

        <!-- Order Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
          <thead>
            <tr>
              <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Item</th>
              <th style="text-align: center; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Qty</th>
              <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <!-- Total Paid -->
        <table style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="color: #6b7280; font-size: 14px;">Total Paid</td>
            <td style="color: #6366f1; font-size: 24px; font-weight: 700; text-align: right;">$${data.totalAmount.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Details Box (Estimated Delivery & Shipping Address) -->
        <div style="background-color: #f5f3ff; border-radius: 12px; padding: 20px; margin-top: 28px;">
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 4px; color: #6366f1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Estimated Delivery</p>
            <p style="margin: 0; color: #1f2937; font-size: 15px; font-weight: 600;">${formattedDeliveryDate}</p>
          </div>
          <div>
            <p style="margin: 0 0 4px; color: #6366f1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Shipping To</p>
            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${data.shippingAddress}</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #fafafa; padding: 20px 40px; text-align: center; border-top: 1px solid #f0f0f0;">
        <p style="color: #b0b0b0; font-size: 12px; margin: 0;">
          Questions? Reply directly to this email.<br/>
          &copy; ${new Date().getFullYear()} Nova Bay. All rights reserved.
        </p>
      </div>

    </div>
  </div>
  `;
};