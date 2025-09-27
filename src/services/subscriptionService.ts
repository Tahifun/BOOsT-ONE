// src/services/subscriptionService.ts

export type Tier = "FREE" | "PRO" | "ENTERPRISE";
export type Role = "USER" | "SUPERUSER";

export interface SubscriptionStatus {
  tier: Tier;
  role: Role;
  active: boolean;
  validUntil: string | null; // ISO, kann null sein
  source?: "superuser" | "db" | "none";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export class HttpError extends Error {
  status: number;
  data: unknown;
  code?: string;
  constructor(status: number, data?: unknown, message?: string, code?: string) {
    super(message || data?.message || `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.data = data;
    this.code = code || data?.error;
  }
}

/** ===== Consent-Konstanten ===== */
export const CONSENT_DEFAULT_TEXT =
  "Ich stimme ausdr�cklich zu, dass CLiP BOOsT unmittelbar nach Kauf mit der Leistungserbringung beginnt. Mir ist bekannt, dass damit mein Widerrufsrecht erlischt.";
export const CONSENT_VERSION = "2025-08-24"; // YYYY-MM-DD

export interface ConsentPayload {
  consent: true;
  consentText: string;
  consentVersion: string; // z. B. YYYY-MM-DD
}

/** ===== Basis-Konfiguration =====
 * Wenn VITE_API_URL gesetzt ist, nutzen wir sie.
 * Sonst nutzen wir relative Pfade (laufen durch den Vite-Proxy auf dein Backend).
 */
const API_BASE = (import.meta.env.VITE_API_URL || "").toString().replace(/\/+$/, "");

function toUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;     // absolute URL
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;                         // '' + '/api/...' ? geht �ber Proxy
}

function getAuthToken(): string | undefined {
  try {
    return localStorage.getItem("token") || undefined;
  } catch {
    return undefined;
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** 401-Silent-Refresh (TikTok) - optional */
async function refreshAuthSilently(): Promise<void> {
  try {
    await fetch("/api/oauth/tiktok/refresh", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* ignore */
  }
}

type ReqOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  retry401?: boolean;
};

const DEFAULT_TIMEOUT = 15_000;

async function request<T = any>(path: string, opts: ReqOpts = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
    timeoutMs = DEFAULT_TIMEOUT,
    retry401 = true,
  } = opts;

  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasJsonBody = body !== undefined && !isFormData && method !== "GET";

  const h: Record<string, string> = {
    Accept: "application/json",
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const ac = new AbortController();
  if (signal) signal.addEventListener("abort", () => ac.abort());
  const to = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(toUrl(path), {
      method,
      credentials: "include", // ?? wichtig: Cookies immer mitsenden
      headers: h,
      body: hasJsonBody ? JSON.stringify(body) : isFormData ? (body as FormData) : undefined,
      signal: ac.signal,
    });

    if (res.status === 401 && retry401) {
      await refreshAuthSilently();
      return request<T>(path, { ...opts, retry401: false });
    }

    if (res.status === 204) return undefined as T;

    const data = await safeJson(res);

    if (!res.ok) {
      const msg =
        data?.message ||
        ({
          400: "Ung�ltige Anfrage.",
          401: "Nicht angemeldet.",
          402: "Upgrade erforderlich.",
          403: "Keine Berechtigung.",
          404: "Nicht gefunden.",
          429: "Zu viele Anfragen.",
          500: "Serverfehler.",
          501: "Feature nicht konfiguriert.",
        } as Record<number, string>)[res.status] ||
        `HTTP ${res.status}`;
      throw new HttpError(res.status, data, msg, data?.error);
    }

    return data as T;
  } catch (e: unknown) {
    if (e?.name === "AbortError") {
      throw new HttpError(0, null, "Zeit�berschreitung (Timeout).", "TIMEOUT");
    }
    if (e instanceof HttpError) throw e;
    throw new HttpError(0, null, e?.message || "Netzwerkfehler.");
  } finally {
    clearTimeout(to);
  }
}

/* ===================== Mapping Backend ? Frontend-Modell ===================== */
/** Backend liefert aktuell:
 *  {
 *    success: true,
 *    authenticated: boolean,
 *    plan: "FREE" | "PRO" | "DAYPASS",
 *    isPro: boolean,
 *    isDayPass: boolean,
 *    expiresAt: string | null
 *  }
 *  Wir mappen das auf dein Frontend-Interface SubscriptionStatus.
 */
function mapBackendToSubscriptionStatus(b: unknown): SubscriptionStatus {
  const plan: string = (b?.plan || "FREE").toString().toUpperCase();
  const tier: Tier =
    plan === "PRO" ? "PRO" :
    plan === "ENTERPRISE" ? "ENTERPRISE" :
    "FREE";

  const active = !!(b?.isPro || b?.isDayPass);
  const validUntil = b?.expiresAt ?? null;

  // Du hast aktuell keine Rollen aus dem Backend ? USER als Standard
  const role: Role = "USER";

  // Quelle nur grob markieren: eingeloggt ? 'db', sonst 'none'
  const source: "superuser" | "db" | "none" = b?.authenticated ? "db" : "none";

  return {
    tier,
    role,
    active,
    validUntil,
    source,
    // Stripe-IDs kommen sp�ter aus echter Logik:
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
  };
}

/* =========================== �ffentliche Funktionen ========================== */

export async function getSubscriptionStatus(signal?: AbortSignal): Promise<SubscriptionStatus> {
  const raw = await request<any>("/api/subscription/status", { method: "GET", signal });
  return mapBackendToSubscriptionStatus(raw);
}

/** Stripe Checkout: Pro-Abo (Monat) starten (mit Consent) */
export async function startProSubscription(consent: ConsentPayload): Promise<{ url: string }> {
  return request<{ url: string }>("/api/billing/create-checkout-session", {
    method: "POST",
    body: { mode: "subscription", product: "pro_monthly", ...consent },
  });
}

/** Stripe Checkout: Day-Pass (24h) kaufen (mit Consent) */
export async function buyDayPass(consent: ConsentPayload): Promise<{ url: string }> {
  return request<{ url: string }>("/api/billing/create-checkout-session", {
    method: "POST",
    body: { mode: "payment", product: "day_pass", ...consent },
  });
}

/** Stripe Customer Portal �ffnen */
export async function createPortalSession(): Promise<{ url: string }> {
  return request<{ url: string }>("/api/billing/create-portal-session", {
    method: "POST",
  });
}

/** Utility: Fehler in nutzerfreundlichen Text wandeln */
export function mapSubscriptionError(err: unknown): string {
  if (!(err instanceof HttpError)) return "Unbekannter Fehler.";
  const { status, code, data, message } = err;

  if (status === 501) return "Abrechnung ist noch nicht konfiguriert.";
  if (status === 402 || code === "UPGRADE_REQUIRED") return "Dieses Feature erfordert PRO.";
  if (status === 401) return "Bitte einloggen.";
  if (status === 403) return "Keine Berechtigung.";
  if (status === 429) return "Zu viele Anfragen. Bitte sp�ter erneut versuchen.";
  if (status >= 500 || status === 0) return "Serverfehler/Netzwerkfehler.";
  return data?.message || message || "Ein Fehler ist aufgetreten.";
}
