// controllers/subscriptionController.ts
import type { Request, Response } from "express";
import stripe from "../utils/stripeClient.js";
import env from "../utils/validateEnv.js";
import SubscriptionState from "../models/SubscriptionState.js";

/**
 * GET /api/subscription/plans
 * Gibt die öffentlich nutzbaren Plan-Infos zurück (aus ENV).
 */
export const listPublicPlans = async (_req: Request, res: Response) => {
  return res.json({
    ok: true,
    plans: {
      pro: {
        priceId: env.STRIPE_PRICE_PRO ?? null,
        type: "subscription",
      },
      daypass: {
        priceId: env.STRIPE_PRICE_DAYPASS ?? null,
        type: "one_time",
        hours: 24,
      },
    },
  });
};

/**
 * GET /api/subscription/me
 * Liefert den Abo-Status des eingeloggten Nutzers aus der lokalen DB.
 */
export const getMySubscription = async (req: Request, res: Response) => {
  const userId = String((req as any)?.user?.id || (req as any)?.user?._id || "");
  if (!userId) return res.status(401).json({ ok: false, error: "unauthenticated" });

  const doc = await SubscriptionState.findOne({ userId }).lean().exec();

  // Daten defensiv auslesen (lockere Typen – Schema kann je nach Migration variieren)
  const stripeState = (doc as any)?.stripe ?? null;
  const dayPass = (doc as any)?.dayPass ?? null;

  return res.json({
    ok: true,
    subscription: {
      tier: (doc as any)?.tier ?? "FREE", // "FREE" | "PRO"
      validUntil: (doc as any)?.validUntil ?? null,
      stripe: stripeState
        ? {
          customerId: stripeState.customerId ?? null,
          subscriptionId: stripeState.subscriptionId ?? null,
          status: stripeState.status ?? null,
          priceId: stripeState.priceId ?? null,
          cancelAtPeriodEnd: Boolean(stripeState.cancelAtPeriodEnd),
        }
        : null,
      dayPass: dayPass
        ? {
          active: Boolean(dayPass.active),
          validUntil: dayPass.validUntil ?? null,
          hours: dayPass.hours ?? null,
          source: dayPass.source ?? null,
        }
        : null,
    },
  });
};

/**
 * POST /api/subscription/cancel
 * Setzt ein laufendes Stripe-Abo auf "cancel_at_period_end".
 */
export const cancelMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = String((req as any)?.user?.id || (req as any)?.user?._id || "");
    if (!userId) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const doc = await SubscriptionState.findOne({ userId }).lean().exec();
    const subscriptionId: string | undefined = (doc as any)?.stripe?.subscriptionId;

    if (!subscriptionId) {
      return res.status(404).json({ ok: false, error: "no_active_subscription" });
    }

    const updated = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });

    return res.json({
      ok: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
        currentPeriodEnd: updated.current_period_end ? new Date(updated.current_period_end * 1000) : null,
      },
    });
  } catch (e: unknown) {
    console.error("[subscription:cancel] error:", e?.message || e);
    return res.status(500).json({ ok: false, error: "cancel_failed" });
  }
};

/**
 * POST /api/subscription/resume
 * Hebt ein geplantes Cancel am Periodenende wieder auf.
 */
export const resumeMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = String((req as any)?.user?.id || (req as any)?.user?._id || "");
    if (!userId) return res.status(401).json({ ok: false, error: "unauthenticated" });

    const doc = await SubscriptionState.findOne({ userId }).lean().exec();
    const subscriptionId: string | undefined = (doc as any)?.stripe?.subscriptionId;

    if (!subscriptionId) {
      return res.status(404).json({ ok: false, error: "no_active_subscription" });
    }

    const updated = await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });

    return res.json({
      ok: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
        currentPeriodEnd: updated.current_period_end ? new Date(updated.current_period_end * 1000) : null,
      },
    });
  } catch (e: unknown) {
    console.error("[subscription:resume] error:", e?.message || e);
    return res.status(500).json({ ok: false, error: "resume_failed" });
  }
};

export default {
  listPublicPlans,
  getMySubscription,
  cancelMySubscription,
  resumeMySubscription,
};
