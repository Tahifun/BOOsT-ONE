// backend/controllers/subscriptionStatusController.ts
import type { Request, Response } from "express";
import { getState } from "../services/subscriptionStateService.js";

// => Named export (und unten zustzlich ein default-Export-Wrapper)
export const getMySubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.id && !user?._id) {
      return res.status(401).json({ error: "Nicht eingeloggt." });
    }
    const userId = String(user.id || user._id);
    const now = new Date();

    const doc = await getState(userId);

    const dayPassActive = Boolean(doc.dayPass?.active) &&
      !!doc.dayPass?.validUntil &&
      new Date(doc.dayPass.validUntil).getTime() > now.getTime();

    const hasProAccess = (doc.tier === "PRO") || dayPassActive;

    return res.json({
      ok: true,
      userId,
      tier: doc.tier,
      active: doc.active,
      effective: { pro: hasProAccess, dayPassActive },
      dayPass: {
        active: dayPassActive,
        validUntil: doc.dayPass?.validUntil ?? null,
        hours: (doc as any)?.dayPass?.hours ?? null,
        source: doc.dayPass?.source ?? null,
      },
      stripe: {
        status: doc.stripe?.status || null,
        customerId: doc.stripe?.customerId || null,
        subscriptionId: doc.stripe?.subscriptionId || null,
        priceId: (doc as any)?.stripe?.priceId ?? null,
      },
      updatedAt: doc.updatedAt,
      now: now.toISOString()
    });
  } catch (e: unknown) {
    console.error("[status] error:", e?.message || e);
    return res.status(500).json({ ok: false, error: "Status konnte nicht ermittelt werden." });
  }
};

// Optional: default-Export, falls irgendwo versehentlich default import verwendet wurde
export default { getMySubscriptionStatus };


