import type { Request, Response } from "express";
import stripe from "../utils/stripeClient.js";
import env from "../utils/validateEnv.js";

/**
 * Erstellt eine Stripe Billing-Portal-Session.
 * - Sucht/erstellt Customer anhand der User-Email (falls vorhanden)
 * - Kein DB-Zwang ? weniger Kopplung, schneller lauffhig
 */
export default async function createPortalSession(req: Request, res: Response) {
  try {
    const user = (req as any).user || null;
    if (!user?.id && !user?._id) {
      return res.status(401).json({ ok: false, message: "Nicht eingeloggt." });
    }

    const email = String(user.email || "");
    let customerId = (req.body?.stripeCustomerId as string | undefined) || undefined;

    // Falls keine customerId vorhanden ? per Email suchen/erstellen
    if (!customerId && email) {
      const list = await stripe.customers.list({ email, limit: 1 });
      if (list.data.length) {
        customerId = list.data[0].id;
      } else {
        const created = await stripe.customers.create({ email, metadata: { userId: String(user.id || user._id) } });
        customerId = created.id;
      }
    }

    if (!customerId) {
      return res.status(400).json({ ok: false, message: "Kein Stripe-Kunde gefunden." });
    }

    const returnUrl = env.CLIENT_ORIGIN || "http://127.0.0.1:5173";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return res.json({ ok: true, url: session.url });
  } catch (err: unknown) {
    console.error("[billing portal] error:", err?.message || err);
    return res.status(500).json({ ok: false, message: "Portal konnte nicht erstellt werden." });
  }
}



