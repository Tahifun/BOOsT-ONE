// backend/models/StripeCustomer.ts
import mongoose, { Schema, type Model } from "mongoose";

/**
 * Persistentes Mapping userId <-> stripeCustomerId
 * - verhindert E-Mail-Verwechslungen
 * - macht Webhook-Auflsung stabil
 */
export interface IStripeCustomer {
  userId: string;               // App-User-ID (unique)
  customerId: string;           // Stripe Customer ID (unique)
  email?: string | null;        // optional (nur Info)
  createdAt?: Date;
  updatedAt?: Date;
}

const StripeCustomerSchema = new Schema<IStripeCustomer>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

const StripeCustomer: Model<IStripeCustomer> =
  mongoose.models.StripeCustomer ||
  mongoose.model<IStripeCustomer>("StripeCustomer", StripeCustomerSchema);

export default StripeCustomer;


