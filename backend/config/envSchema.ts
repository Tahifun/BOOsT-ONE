// backend/config/envSchema.ts
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // MongoDB
  MONGODB_URI: z.string().optional(),
  MONGO_URI: z.string().optional(),

  // Server
  PORT: z.string().regex(/^\d+$/).default("4001"),
  BACKEND_URL: z.string().url().optional(),
  CLIENT_ORIGIN: z.string().url(),

  // Security
  JWT_SECRET: z.string().min(32),  // Mindestens 32 Zeichen!
  JWT_ISSUER: z.string().default("clipboost"),
  JWT_AUDIENCE: z.string().default("clipboost-users"),
  COOKIE_SECRET: z.string().min(32),  // Mindestens 32 Zeichen!

  // Stripe
  STRIPE_SECRET: z.string().startsWith("sk_"),  // Muss mit sk_ beginnen
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  STRIPE_PRICE_PRO: z.string().startsWith("price_"),
  STRIPE_PRICE_DAYPASS: z.string().startsWith("price_"),

  // Optional Services
  SENDGRID_API_KEY: z.string().startsWith("SG.").optional(),
  REDIS_URL: z.string().url().optional(),
  
  // Admin
  SUPERUSER_EMAIL: z.string().email().optional(),
  ADMIN_EMAILS: z.string().optional(),  // Comma-separated list
  
  // Session
  SESSION_ENABLED: z.enum(["0", "1"]).default("0"),
  
  // OAuth
  TIKTOK_CLIENT_ID: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),

}).refine(v => !!(v.MONGODB_URI || v.MONGO_URI), {
  message: "MONGODB_URI oder MONGO_URI wird bentigt."
}).transform(data => {
  // Normalize MongoDB URI
  if (!data.MONGODB_URI && data.MONGO_URI) {
    data.MONGODB_URI = data.MONGO_URI;
  }
  return data;
});

// Type Export
export type Env = z.infer<typeof envSchema>;

