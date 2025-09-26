// utils/stripeClient.ts
import Stripe from "stripe";
import env from "./validateEnv.js";

const stripe = new Stripe(env.STRIPE_SECRET, {
  apiVersion: "2024-06-20",
});

export default stripe;
