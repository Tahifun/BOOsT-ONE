// controllers/billingController.ts
import type { Request, Response } from "express";
import stripe from "../utils/stripeClient.js";
import env from "../utils/validateEnv.js";
import StripeCustomer from "../models/StripeCustomer.js";
import SubscriptionState from "../models/SubscriptionState.js";

async function getCustomerForPortal(userId: string): Promise<{ customerId?: string }> {
  const map = await StripeCustomer.findOne({ userId }).lean().exec();
  if (map?.customerId) return { customerId: map.customerId };
  const sub = await SubscriptionState.findOne({ userId }).lean().exec();
  if (sub?.stripe?.customerId) return { customerId: sub.stripe.customerId };
  return {};
}

/** POST /api/billing/create-portal-session */
export const createPortalSession = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userId = String(user?.id || user?._id || "");
    if (!userId) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const { customerId } = await getCustomerForPortal(userId);
    if (!customerId) return res.status(404).json({ ok: false, error: "no_customer" });

    const returnUrl = env.CLIENT_ORIGIN ? `${env.CLIENT_ORIGIN}/billing` : "http://localhost:5173/billing";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.json({ ok: true, url: session.url });
  } catch (e: unknown) {
    console.error("[billing:create-portal-session] error:", e?.message || e);
    return res.status(500).json({ ok: false, error: "portal_error" });
  }
};
