// routes/stripe.webhook.routes.ts
import { Router, type Request, type Response } from "express";
import WebhookEvent from "../models/WebhookEvent.js";
import SubscriptionStateModel from "../models/SubscriptionState.js";
import type Stripe from "stripe";
import stripe from "../utils/stripeClient.js";
import env from "../utils/validateEnv.js";
import { setProFromSubscription, setDayPass, clearToFree } from "../services/subscriptionStateService.js";

const router = Router();

router.get("/_health", (_req, res) => res.status(204).end());

async function recordEventId(eventId: string): Promise<boolean> {
  try {
    await WebhookEvent.create({ eventId });
    return true;
  } catch (err: unknown) {
    if (err && (err.code === 11000 || /duplicate key/i.test(String(err.message)))) return false;
    throw err;
  }
}

function userIdFromCheckout(session: unknown): string | null {
  if (session?.client_reference_id) return String(session.client_reference_id);
  if (session?.metadata?.userId) return String(session.metadata.userId);
  if (session?.metadata?.uid) return String(session.metadata.uid);
  if (session?.metadata?.user_id) return String(session.metadata.user_id);
  return null;
}

async function userIdFromCustomerId(customerId?: string | null): Promise<string | null> {
  if (!customerId) return null;
  const doc = await SubscriptionStateModel.findOne({ "stripe.customerId": customerId })
    .select({ userId: 1 })
    .lean<{ userId: string }>()
    .exec();
  return doc?.userId ?? null;
}

router.post("/", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") return res.status(400).json({ error: "missing_signature" });
  if (!env.STRIPE_WEBHOOK_SECRET) return res.status(500).json({ error: "server_misconfigured" });

  let event: Stripe.Event;
  try {
    // @ts-ignore raw body (siehe index.ts)
    const buf: Buffer = req.body;
    event = stripe.webhooks.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    console.error("[stripe:webhook] signature verify failed:", err?.message || err);
    return res.status(400).json({ error: "invalid_signature" });
  }

  try {
    const firstTime = await recordEventId(event.id);
    if (!firstTime) return res.status(200).json({ ok: true, duplicate: true });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const mode = session.mode as string | undefined;

        let userId = userIdFromCheckout(session);
        if (!userId) userId = await userIdFromCustomerId(session.customer as string | undefined);
        if (!userId) return res.status(200).json({ ok: true, warning: "user_unresolved" });

        const customerId = (session.customer as string) ?? null;
        const priceId =
          session?.line_items?.data?.[0]?.price?.id ??
          session?.subscription?.items?.data?.[0]?.price?.id ??
          session?.metadata?.priceId ??
          null;

        const wantsDayPass =
          String(session?.metadata?.day_pass ?? session?.metadata?.dayPass ?? "").toLowerCase() === "1" ||
          mode === "payment";

        if (wantsDayPass) {
          await setDayPass(userId, {
            hours: session?.metadata?.hours ? Number(session.metadata.hours) : 24,
            source: "checkout",
            customerId,
            priceId,
          });
        } else {
          const subscriptionId =
            (typeof session.subscription === "string" ? session.subscription : session.subscription?.id) ?? null;
          await setProFromSubscription(userId, {
            customerId,
            subscriptionId,
            priceId,
            status: "active",
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const customerId = String(sub.customer);
        const userId = await userIdFromCustomerId(customerId);
        if (!userId) return res.status(200).json({ ok: true, warning: "user_unresolved" });
        const priceId = sub.items?.data?.[0]?.price?.id ?? null;
        await setProFromSubscription(userId, {
          customerId,
          subscriptionId: String(sub.id),
          priceId,
          status: String(sub.status || "active"),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const customerId = String(sub.customer);
        const userId = await userIdFromCustomerId(customerId);
        if (!userId) return res.status(200).json({ ok: true, warning: "user_unresolved" });
        await clearToFree(userId);
        break;
      }

      default:
        // invoice.* / payment_intent.* usw. ? acknowledge
        break;
    }

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    console.error("[stripe:webhook] handler error", { message: err?.message, stack: err?.stack });
    return res.status(500).json({ error: "handler_failed" });
  }
});

export default router;
