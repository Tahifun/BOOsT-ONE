import { MediaType } from '../types/mediaTypes';

/** API-Basis aus .env (z. B. http://localhost:4000/api) */
const API_BASE = (import.meta.env.VITE_API_URL || "")
  .toString()
  .replace(/\/+$/, ""); // Tail-Slash entfernen

/** Upload-Metadaten, die das Frontend sendet */
export interface MediaUploadMeta {
  type: MediaType; // "clip" | "screenshot" | "sound" | "overlay"
  name: string;
  description?: string;
}

/** Response-Struktur vom Backend */
export interface MediaUploadResponse {
  ok: true;
  item: {
    type: MediaType;
    name: string;
    description: string;
    size: number;
    mimetype: string;
    url: string;
  };
}

/** Fehlerobjekt (axios-Ã¤hnlich) */
export class HttpError extends Error {
  status: number;
  data: unknown;
  code?: string;
  constructor(status: number, data: unknown, message?: string, code?: string) {
    super(message || (data?.message ?? `HTTP ${status}`));
    this.status = status;
    this.data = data;
    this.code = code || data?.error;
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function getAuthToken(): string | undefined {
  try {
    return localStorage.getItem("token") || undefined;
  } catch {
    return undefined;
  }
}

async function refreshAuthSilently(): Promise<void> {
  try {
   await fetch(`${API_BASE}/api/tiktok/refresh`, {
  method: "POST",
  credentials: "include",
});

  } catch {
    // ignore
  }
}

type FetchOpts = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: BodyInit | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retry401?: boolean;
};

async function doRequest(path: string, opts: FetchOpts = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    signal,
    retry401 = true,
  } = opts;

  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    body,
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && retry401) {
    await refreshAuthSilently();
    return doRequest(path, { ...opts, retry401: false });
  }

  return res;
}

/**
 * Datei-Upload
 */
export async function uploadMediaFile(
  file: File,
  meta: MediaUploadMeta,
  signal?: AbortSignal
): Promise<MediaUploadResponse> {
  if (!API_BASE) throw new Error("VITE_API_URL ist nicht gesetzt.");

  const form = new FormData();
  form.append("file", file);
  form.append("type", meta.type);
  form.append("name", meta.name);
  if (meta.description != null) form.append("description", meta.description);

  const res = await doRequest(`/media/upload`, {
    method: "POST",
    body: form,
    headers: {}, // FormData setzt Header selbst
    signal,
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new HttpError(res.status, data, data?.message || data?.error, data?.error);
  }
  return data as MediaUploadResponse;
}

/**
 * Liste laden
 */
export async function fetchMedia(params?: { type?: MediaType; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.q) qs.set("q", params.q);

  const res = await doRequest(`/media?${qs.toString()}`, { method: "GET" });
  const data = await safeJson(res);
  if (!res.ok) throw new HttpError(res.status, data, data?.message || "Fehler beim Laden.");
  return data as MediaUploadResponse["item"][];
}

/**
 * LÃ¶schen
 */
export async function deleteMedia(id: string) {
  const res = await doRequest(`/media/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new HttpError(res.status, data, data?.message || "LÃ¶schen fehlgeschlagen.");
  }
  return data;
}

/**
 * Optional: Metadaten ohne Datei anlegen
 */
export async function createMedia(media: Partial<MediaUploadResponse["item"]>) {
  const res = await doRequest(`/media`, {
    method: "POST",
    body: JSON.stringify(media),
  });
  const data = await safeJson(res);
  if (!res.ok) {
    throw new HttpError(res.status, data, data?.message || data?.error, data?.error);
  }
  return data as MediaUploadResponse["item"];
}

/**
 * Fehler-Mapping fÃ¼r UI
 */
export function mapUploadError(err: unknown): string {
  if (!(err instanceof HttpError)) return "Unbekannter Fehler beim Upload.";

  const { status, data, code } = err;

  if (status === 402 || code === "UPGRADE_REQUIRED") {
    return "Dieses Feature erfordert PRO. Bitte upgrade deinen Account.";
  }
  if (status === 413 || code === "PAYLOAD_TOO_LARGE") {
    const limit = data?.limitMB ?? data?.maxMB;
    return limit
      ? `Datei zu groÃŸ (Limit ${limit} MB).`
      : "Datei zu groÃŸ fÃ¼r den Server.";
  }
  if (status === 415 || code === "unsupported_type") {
    const allowed = Array.isArray(data?.allowed) ? data.allowed.join(", ") : "dieses Format";
    return `Der Dateityp wird nicht unterstÃ¼tzt (${allowed}).`;
  }
  if (status === 400) {
    return data?.message || "UngÃ¼ltige Eingaben fÃ¼r den Upload.";
  }
  if (status === 429) {
    return "Zu viele Anfragen. Bitte spÃ¤ter erneut versuchen.";
  }
  if (status === 401) return "Nicht angemeldet. Bitte erneut einloggen.";
  if (status === 403) return "Keine Berechtigung fÃ¼r diese Aktion.";
  if (status >= 500) return "Serverfehler beim Upload. Bitte spÃ¤ter erneut versuchen.";

  return (err as any)?.message || "Unbekannter Fehler beim Upload.";
}

