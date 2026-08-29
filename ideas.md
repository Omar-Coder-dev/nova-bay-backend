Here is the clear, structured blueprint of everything we just designed and agreed upon for the **Order & Payment System**:

---

### 1. Order Status Lifecycle (Option 3 Architecture)

We are using **Pure Stripe Checkout (Option 3)** to keep MongoDB completely clean and prevent stock lockups from abandoned carts.

* **`paid`** $\rightarrow$ Created automatically in MongoDB *only* after Stripe confirms successful payment via webhook.
* **`completed`** $\rightarrow$ Updated manually by Admin when the order is packaged/fulfilled.
* **`cancelled`** $\rightarrow$ Triggered by Admin override or Customer self-service (if applicable).

---

### 2. The Core Order & Payment Controllers

* **`createCheckoutSession` (`paymentController.ts`)**
* Reads items from the cart payload.
* Validates current inventory stock in MongoDB.
* Constructs a Stripe Checkout Session using real DB prices (price snapshotting).
* Enables built-in Stripe promotion codes (`allow_promotion_codes: true`).
* Returns the Stripe payment URL to the frontend.


* **`handleStripeWebhook` (`webhookController.ts`)**
* Listens for Stripe's `checkout.session.completed` event.
* Creates the actual `Order` document in MongoDB marked directly as **`paid`**.
* Decrements product inventory stock (`stock - quantity`).


* **`cancelOrder` (`orderController.ts`)**
* Allows customers to self-service cancel non-completed orders.
* Enforces ownership checks so users can't cancel someone else's order.


* **`updateOrderStatus` (`orderController.ts`)**
* Allows Admins to transition orders from **`paid` $\rightarrow$ `completed**`.



---

### 3. Future Expansion: Creator Promo Codes (Affiliate System)

* **The Business Model:** Customer gets **10% OFF**, Creator gets **10% Commission**, Store Owner gets **80% Net Revenue + Free Marketing**.
* **Automation:** Admins trigger a route that calls Stripe’s API (`stripe.promotionCodes.create`) to dynamically generate codes like `OMAR10` without touching the Stripe Dashboard.
* **Attribution:** The Stripe webhook reads the promo code used at checkout and credits commission directly to the creator's earnings in MongoDB.

---

### Ready to Build Next Steps:

1. Lock in the **`Order` Schema** updates.
2. Build **`createCheckoutSession`** in `paymentController.ts`.
3. Set up the **Stripe Webhook** route.