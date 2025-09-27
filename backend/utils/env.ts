// backend/utils/env.ts
// L�dt .env und exportiert getypte Umgebungswerte f�r das Backend.

import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',

  // Stripe
  STRIPE_SECRET: process.env.STRIPE_SECRET ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',

  // Allgemein - falls sp�ter gebraucht, hier erg�nzen
  APP_NAME: process.env.APP_NAME ?? 'clip-boost',
} as const;

/** Wirft eine klare Fehlermeldung, wenn ein Pflicht-ENV fehlt. */
export function assertEnv<K extends keyof typeof env>(key: K): asserts key is K {
  if (!env[key] || String(env[key]).trim() === '') {
    throw new Error(`Missing required env var: ${String(key)}`);
  }
}
