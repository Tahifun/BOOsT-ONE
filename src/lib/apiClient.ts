// src/lib/apiClient.ts
import { API_BASE_URL, BACKEND_URL, SOCKET_URL } from '@/env';

/**
 * Ermittelt die Basis-URL für die API:
 * - Wenn eine Origin in Env gesetzt ist, nehmen wir sie und hängen "/api" an.
 * - Wenn nichts gesetzt ist (z. B. lokal via Vite-Proxy), nutzen wir einfach "/api".
 *
 * Beispiele:
 *   VITE_API_BASE_URL = "https://api.clip-boost.online"  -> "https://api.clip-boost.online/api"
 *   BACKEND_URL       = "https://backend.example.com"    -> "https://backend.example.com/api"
 *   (leer)                                                -> "/api"
 */
function resolveApiBase(): string {
  const origin = (API_BASE_URL || BACKEND_URL || "").trim().replace(/\/+$/, "");
  if (!origin) return "/api";
  return `${origin}/api`;
}

const API_BASE = resolveApiBase();

/** Prüft, ob der Pfad schon eine absolute URL ist (dann nicht präfixen) */
function isAbsoluteUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

/** Baut die finale URL für den Request */
function buildUrl(path: string): string {
  if (isAbsoluteUrl(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/** Optional: kleines Timeout-Feature via AbortController */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 0
): Promise<T> {
  if (!timeoutMs) return promise;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  // @ts-expect-error – wir hängen signal gleich unten an
  (promise as any).__signal = controller.signal;
  return Promise.race([
    promise,
    new Promise<T>((_, rej) => rej(new Error("Request timed out")))
  ]).finally(() => clearTimeout(t));
}

/**
 * Fetch-Helper
 *
 * @param path   API-Pfad (z. B. "/auth/login" oder "auth/login") ODER absolute URL
 * @param opts   Fetch-Optionen (credentials ist standardmäßig 'include')
 * @param token  optionales Bearer-Token
 * @returns      T (JSON)
 */
export async function api<T = any>(
  path: string,
  opts: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(opts.headers || {});
  // Content-Type nur setzen, wenn ein Body übergeben wurde und Header noch fehlt
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = buildUrl(path);

  // credentials immer einschalten (für Cookies/Sessions)
  const finalOpts: RequestInit = {
    credentials: "include",
    ...opts,
    headers,
  };

  // Optional: Timeout unterstützen, falls in opts als (custom) "timeout" übergeben (z. B. finalOpts as any).timeout
  const timeoutMs = (opts as any)?.timeout ? Number((opts as any).timeout) : 0;

  const fetchPromise = fetch(url, finalOpts);
  const res = await (timeoutMs ? withTimeout(fetchPromise, timeoutMs) : fetchPromise);

  // Leer-Body sauber behandeln
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** Export der berechneten Basis (nützlich für Debug oder externe Aufrufe) */
export const API = API_BASE;
