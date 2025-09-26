// backend/models/SubscriptionState.ts
import mongoose, { Schema, Model, InferSchemaType } from "mongoose";

const SubscriptionStateSchema = new Schema(
  {
    userId: { type: String, index: true, unique: true, required: true },

    // Abo-/Tier-Status
    tier: { type: String, enum: ["FREE", "PRO"], default: "FREE" },
    active: { type: Boolean, default: false },

    // Day-Pass (One-time Käufe)
    dayPass: {
      active: { type: Boolean, default: false },
      validUntil: { type: Date, default: null },
      source: { type: String, default: null }, // z.B. "stripe:PRICE_ID_DAY_PASS"
    },

    // Stripe-Verknüpfung (kundenseitig)
    stripe: {
      customerId: { type: String, index: true, unique: true, sparse: true, default: null },
      subscriptionId: { type: String, default: null },
      status: { type: String, default: null }, // z.B. 'active', 'trialing', ...
      latestInvoiceId: { type: String, default: null },
    },
  },
  { timestamps: true, collection: "subscription_state" }
);

export type ISubscriptionState = InferSchemaType<typeof SubscriptionStateSchema>;

export const SubscriptionState: Model<ISubscriptionState> =
  (mongoose.models.SubscriptionState as Model<ISubscriptionState>) ||
  mongoose.model<ISubscriptionState>("SubscriptionState", SubscriptionStateSchema);

export default SubscriptionState;


