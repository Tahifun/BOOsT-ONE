// controllers/subscriptionCheckoutController.ts
import type { Request, Response } from "express";
import stripe from "../utils/stripeClient.js";
import env from "../utils/validateEnv.js";
import StripeCustomer from "../models/StripeCustomer.js";
import SubscriptionState from "../models/SubscriptionState.js";

async function getCustomerForCheckout(userId: string, email?: string | null): Promise<{ customerId?: string; customerEmail?: string }> {
  const map = await StripeCustomer.findOne({ userId }).lean().exec();
  if (map?.customerId) return { customerId: map.customerId };

  const sub = await SubscriptionState.findOne({ userId }).lean().exec();
  if (sub?.stripe?.customerId) return { customerId: sub.stripe.customerId };

  if (email) return { customerEmail: email };
  return {};
}

export const startCheckout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = String(user.id || user._id);
    const email: string | undefined =
      (user.email as string | undefined) ?? (user?.profile?.email as string | undefined) ?? undefined;

    const plan = String(req.body?.plan || "pro").toLowerCase();
    if (!["pro", "daypass"].includes(plan)) {
      return res.status(400).json({ ok: false, error: "Ungltiger Plan (erwartet 'pro' oder 'daypass')." });
    }

    const successUrl =
      (req.body?.successUrl as string | undefined) ||
      (env.CLIENT_ORIGIN
        ? `${env.CLIENT_ORIGIN}/billing/success?session_id={CHECKOUT_SESSION_ID}`
        : "http://localhost:5173/billing/success?session_id={CHECKOUT_SESSION_ID}");

    const cancelUrl =
      (req.body?.cancelUrl as string | undefined) ||
      (env.CLIENT_ORIGIN ? `${env.CLIENT_ORIGIN}/billing/cancel` : "http://localhost:5173/billing/cancel");

    const { customerId, customerEmail } = await getCustomerForCheckout(userId, email ?? null);

    if (plan === "pro") {
      if (!env.STRIPE_PRICE_PRO) return res.status(500).json({ ok: false, error: "STRIPE_PRICE_PRO fehlt." });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: env.STRIPE_PRICE_PRO, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: { userId, day_pass: "0", priceId: env.STRIPE_PRICE_PRO },
        allow_promotion_codes: true,
        ...(customerId ? { customer: customerId } : {}),
        ...(customerEmail ? { customer_email: customerEmail } : {}),
      });
      return res.json({ ok: true, url: session.url });
    }

    if (!env.STRIPE_PRICE_DAYPASS) return res.status(500).json({ ok: false, error: "STRIPE_PRICE_DAYPASS fehlt." });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: env.STRIPE_PRICE_DAYPASS, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: { userId, day_pass: "1", priceId: env.STRIPE_PRICE_DAYPASS },
      allow_promotion_codes: false,
      ...(customerId ? { customer: customerId } : {}),
      ...(customerEmail ? { customer_email: customerEmail } : {}),
    });
    return res.json({ ok: true, url: session.url });
  } catch (e: unknown) {
    console.error("[checkout:start] error:", e?.message || e);
    return res.status(500).json({ ok: false, error: "Checkout konnte nicht gestartet werden." });
  }
};
