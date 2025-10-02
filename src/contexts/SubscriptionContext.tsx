// src/contexts/SubscriptionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { useAuth } from './AuthContext';

export type Tier = "FREE" | "PRO" | "ENTERPRISE";
export type Role = "USER" | "SUPERUSER";

export interface Limits {
  templatesMax: number;
  uploadMaxMB?: number | null;
}

export interface SubscriptionState {
  tier: Tier;
  role: Role;
  active: boolean;
  validUntil: string | null;
  loading: boolean;
  isPro: boolean;
  isDayPass: boolean;
  msRemaining: number | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  limits: Limits;
  refresh: () => Promise<void>;
  getPortalUrl: () => Promise<string | null>;
  openPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionState | null>(null);

function getEnvNumber(key: string): number | null {
  const env: unknown = (import.meta as any)?.env ?? {};
  const raw = env[key];
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const defaultState: SubscriptionState = {
  tier: "FREE",
  role: "USER",
  active: false,
  validUntil: null,
  loading: true,
  isPro: false,
  isDayPass: false,
  msRemaining: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  limits: { templatesMax: 2 },
  refresh: async () => undefined,
  getPortalUrl: async () => null,
  openPortal: async () => undefined,
};

export const SubscriptionProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<SubscriptionState>(defaultState);
  const { token } = useAuth();

  const computeLimits = useCallback((tier: Tier, active: boolean): Limits => {
    const freeUpload = getEnvNumber("VITE_UPLOAD_LIMIT_FREE_MB");
    const proUpload = getEnvNumber("VITE_UPLOAD_LIMIT_PRO_MB");
    const entUpload = getEnvNumber("VITE_UPLOAD_LIMIT_ENTERPRISE_MB");

    const templatesMax =
      tier === "ENTERPRISE" && active ? 100 :
      tier !== "FREE" && active ? 20 :
      2;

    const uploadMaxMB =
      tier === "ENTERPRISE" && active ? (entUpload ?? proUpload ?? freeUpload) :
      tier !== "FREE" && active ? (proUpload ?? freeUpload) :
      (freeUpload ?? null);

    return { templatesMax, uploadMaxMB };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/subscription/status", {
        method: "GET",
        credentials: "include",
        headers,
      });

      if (res.status === 401 || !res.ok) {
        setState((s) => ({
          ...s,
          tier: "FREE",
          role: "USER",
          active: false,
          validUntil: null,
          isPro: false,
          isDayPass: false,
          msRemaining: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          limits: computeLimits("FREE", false),
          loading: false,
        }));
        return;
      }

      const data: {
        tier: Tier; role: Role; active: boolean; validUntil: string | null; isDayPass: boolean;
        stripeCustomerId?: string | null; stripeSubscriptionId?: string | null;
      } = await res.json();

      const { tier, role, active, validUntil, stripeCustomerId, stripeSubscriptionId } = data;
      const isPro = active && tier !== "FREE";
      const isDayPass =
        isPro &&
        !stripeSubscriptionId &&
        typeof validUntil === "string" &&
        validUntil.length > 0;

      const msRemaining =
        typeof validUntil === "string"
          ? Math.max(0, new Date(validUntil).getTime() - Date.now())
          : null;

      setState({
        tier,
        role,
        active,
        validUntil,
        isPro,
        isDayPass,
        msRemaining,
        stripeCustomerId: stripeCustomerId ?? null,
        stripeSubscriptionId: stripeSubscriptionId ?? null,
        limits: computeLimits(tier, active),
        loading: false,
        refresh: async () => undefined,
        getPortalUrl: async () => null,
        openPortal: async () => undefined,
      });
    } catch {
      setState((s) => ({
        ...s,
        tier: "FREE",
        role: "USER",
        active: false,
        validUntil: null,
        isPro: false,
        isDayPass: false,
        msRemaining: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        limits: computeLimits("FREE", false),
        loading: false,
      }));
    }
  }, [token, computeLimits]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();
      if (!mounted) return;
    })();
    return () => { mounted = false; };
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => { refresh().catch(() => void 0); }, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!state.validUntil) return;
    const tick = () => {
      setState((s) => {
        if (!s.validUntil) return s;
        const ms = Math.max(0, new Date(s.validUntil).getTime() - Date.now());
        return ms === s.msRemaining ? s : { ...s, msRemaining: ms };
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.validUntil]);

  const getPortalUrl = useCallback(async (): Promise<string | null> => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/billing/create-portal-session", {
        method: "POST",
        credentials: "include",
        headers,
      });
      if (res.status === 401 || res.status === 403 || !res.ok) return null;
      const data = await res.json();
      return data?.url ?? null;
    } catch {
      return null;
    }
  }, [token]);

  const openPortal = useCallback(async () => {
    const url = await getPortalUrl();
    if (url) window.location.href = url;
  }, [getPortalUrl]);

  const value = useMemo<SubscriptionState>(() => ({
    ...state,
    refresh,
    getPortalUrl,
    openPortal,
  }), [state, refresh, getPortalUrl, openPortal]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
};

export const useHasTier = (required: Tier | Tier[]) => {
  const { role, tier, active } = useSubscription();
  const allowed = Array.isArray(required) ? required : [required];

  if (role === "SUPERUSER") return true;
  if (!active && tier !== "FREE") return false;
  return allowed.includes(tier);
};

export default SubscriptionContext;

