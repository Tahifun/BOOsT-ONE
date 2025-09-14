// src/hooks/useCheckout.ts
import { useCallback, useState } from "react";
import { api } from '../lib/apiClient';

type Plan = "pro" | "daypass";

type UseCheckoutReturn = {
  start: (plan: Plan) => Promise<void>;
  startPro: () => Promise<void>;
  startDayPass: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
  loading: Plan | null;
  error: string | null;
};

/**
 * useCheckout â€“ kapselt Checkout (PRO/DayPass) + Billing-Portal-Redirect
 * - Nutzt /api/subscription/checkout (POST { plan })
 * - Nutzt /api/billing/create-portal-session (POST)
 * - Optionaler Bearer-Token fÃ¼r Header (bis Cookie-Flow final ist)
 */
export function useCheckout(token?: string): UseCheckoutReturn {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (plan: Plan) => {
      setError(null);
      setLoading(plan);
      try {
        const data = await api<{ url: string }>(
          "/subscription/checkout",
          {
            method: "POST",
            body: JSON.stringify({ plan }),
          },
          token
        );
        if (data?.url) {
          // harter Redirect zu Stripe
          window.location.href = data.url;
        } else {
          throw new Error("Keine Checkout-URL erhalten.");
        }
      } catch (e: unknown) {
        setError(e?.message || "Checkout fehlgeschlagen");
      } finally {
        setLoading(null);
      }
    },
    [token]
  );

  const startPro = useCallback(() => start("pro"), [start]);
  const startDayPass = useCallback(() => start("daypass"), [start]);

  const openBillingPortal = useCallback(async () => {
    setError(null);
    try {
      const data = await api<{ url: string }>(
        "/billing/create-portal-session",
        { method: "POST" },
        token
      );
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Keine Portal-URL erhalten.");
      }
    } catch (e: unknown) {
      setError(e?.message || "Billing-Portal nicht erreichbar");
    }
  }, [token]);

  return { start, startPro, startDayPass, openBillingPortal, loading, error };
}

