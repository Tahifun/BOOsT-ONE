// backend/services/subscriptionStateService.ts
import SubscriptionStateModel, { ISubscriptionState } from "../models/SubscriptionState.js";

/** Create indexes once at startup (idempotent). */
export async function ensureSubscriptionIndexes() {
  await SubscriptionStateModel.collection.createIndex({ userId: 1 }, { unique: true });
  await SubscriptionStateModel.collection.createIndex({ updatedAt: -1 });
}

/** Liefert den Rohzustand; legt bei Bedarf FREE-Grundgerüst an. */
export async function getState(userId: string): Promise<ISubscriptionState> {
  const now = new Date();
  let doc = await SubscriptionStateModel.findOne({ userId }).lean<ISubscriptionState>().exec();

  if (!doc) {
    await SubscriptionStateModel.create({
      userId,
      tier: "FREE",
      active: false,
      dayPass: { active: false },
      stripe: {},
      createdAt: now,
      updatedAt: now,
    });
    doc = await SubscriptionStateModel.findOne({ userId }).lean<ISubscriptionState>().exec() as ISubscriptionState;
  }

  // Safety: normalize dayPass.validUntil logic on read
  if (doc.dayPass?.active && doc.dayPass.validUntil) {
    if (new Date(doc.dayPass.validUntil).getTime() <= now.getTime()) {
      // expired -> treat as inactive (lazy, not persisted here)
      doc = { ...doc, dayPass: { ...doc.dayPass, active: false } };
    }
  }
  return doc;
}

type SetProArgs = {
  customerId?: string | null;
  subscriptionId?: string | null;
  priceId?: string | null;
  status?: string | null; // 'active' | 'trialing' | 'past_due' | 'canceled' | ...
};

/** Setzt dauerhaften PRO-Status gemä Subscription. */
export async function setProFromSubscription(userId: string, args: SetProArgs) {
  const { customerId, subscriptionId, priceId, status } = args;
  await SubscriptionStateModel.updateOne(
    { userId },
    {
      $set: {
        userId,
        tier: "PRO",
        active: true,
        "stripe.customerId": customerId ?? null,
        "stripe.subscriptionId": subscriptionId ?? null,
        "stripe.priceId": priceId ?? null,
        "stripe.status": status ?? "active",
      },
      $unset: {
        // Day-Pass wird beim echten Abo zurückgesetzt
        "dayPass.active": "",
        "dayPass.validUntil": "",
        "dayPass.source": "",
        "dayPass.customerId": "",
        "dayPass.priceId": "",
        "dayPass.hours": "",
        "dayPass.grantedAt": "",
      },
      $setOnInsert: { createdAt: new Date() },
      $currentDate: { updatedAt: true }
    },
    { upsert: true }
  ).exec();
}

type SetDayPassArgs = {
  hours?: number;             // default 24
  source?: string;            // 'checkout' | 'gift' | ...
  customerId?: string | null; // optional for traceability
  priceId?: string | null;    // optional
};

/** Aktiviert einen zeitlich begrenzten Day-Pass (ohne tier = PRO zu setzen). */
export async function setDayPass(userId: string, args: SetDayPassArgs = {}) {
  const now = new Date();
  const hours = Math.max(1, Math.floor(args.hours ?? 24));
  const validUntil = new Date(now.getTime() + hours * 60 * 60 * 1000);

  await SubscriptionStateModel.updateOne(
    { userId },
    {
      $set: {
        userId,
        // tier bleibt, Access wird über effective Access berechnet
        dayPass: {
          active: true,
          grantedAt: now,
          hours,
          validUntil,
          source: args.source ?? "checkout",
          customerId: args.customerId ?? null,
          priceId: args.priceId ?? null,
        },
      },
      $setOnInsert: {
        tier: "FREE",
        active: false,
        stripe: {},
        createdAt: now,
      },
      $currentDate: { updatedAt: true }
    },
    { upsert: true }
  ).exec();
}

/** Setzt User hart auf FREE (z. B. wenn Subscription gelöscht). */
export async function clearToFree(userId: string) {
  await SubscriptionStateModel.updateOne(
    { userId },
    {
      $set: {
        tier: "FREE",
        active: false,
        "stripe.status": "canceled",
      },
      $currentDate: { updatedAt: true }
    }
  ).exec();
}


