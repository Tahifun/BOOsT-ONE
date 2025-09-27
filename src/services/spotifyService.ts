// src/services/spotifyService.ts

/**
 * Service f�r Spotify:
 * - OAuth-Start (PKCE+state via Backend)
 * - Code-Exchange im Callback
 * - Optional: Refresh/Disconnect
 * - Status/Basic-Stats: Now Playing (�ber Backend)
 */

export type NowPlaying =
  | { isPlaying: false }
  | {
      isPlaying: true;
      track: {
        title: string;
        artist: string;
        album?: string;
        albumArtUrl?: string;
        trackUrl?: string;
        durationMs?: number;
        progressMs?: number;
      };
    };

function getEnv(key: string, fallback?: string) {
  const v = (import.meta as any).env?.[key];
  return (v ?? fallback) as string | undefined;
}

function getToken(): string | undefined {
  try {
    return localStorage.getItem("token") || undefined;
  } catch {
    return undefined;
  }
}

function isJsonResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function safeJson<T = any>(res: Response): Promise<T | null> {
  if (!isJsonResponse(res)) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** 401-Silent-Refresh (falls Session ausgelaufen ist) */
async function refreshAuthSilently(): Promise<void> {
  try {
    await fetch("/api/oauth/tiktok/refresh", { method: "POST", credentials: "include" });
  } catch {
    // silent
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

  const token = getToken();
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
    const res = await fetch(path, {
      method,
      credentials: "include",
      headers: h,
      body: hasJsonBody ? JSON.stringify(body) : isFormData ? (body as FormData) : undefined,
      signal: ac.signal,
    });

    if (res.status === 401 && retry401) {
      await refreshAuthSilently();
      return request<T>(path, { ...opts, retry401: false });
    }

    if (res.status === 204) return undefined as T;

    const data = await safeJson<T>(res);

    if (!res.ok) {
      const msg =
        (data as any)?.message ||
        ({
          400: "Ung�ltige Anfrage.",
          401: "Nicht angemeldet.",
          403: "Keine Berechtigung.",
          404: "Nicht gefunden.",
          429: "Zu viele Anfragen.",
          500: "Serverfehler.",
          501: "Nicht konfiguriert.",
        } as Record<number, string>)[res.status] ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }

    // Wenn kein JSON zur�ckkam, gib leeres Objekt statt zu crashen
    return (data as T) ?? ({} as T);
  } finally {
    clearTimeout(to);
  }
}

/** ---------- OAuth: Start ---------- */
export async function startSpotifyOAuth(): Promise<void> {
  const token = getToken();
  const stateRes = await fetch("/api/oauth/spotify/state", {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!stateRes.ok) {
    const t = await stateRes.text().catch(() => "");
    throw new Error(`Spotify /state fehlgeschlagen (HTTP ${stateRes.status}) ${t}`);
  }
  const { state, code_challenge, code_challenge_method } = await stateRes.json();

  const SPOTIFY_CLIENT_ID = getEnv("VITE_SPOTIFY_CLIENT_ID") as string;
  const REDIRECT_URI = getEnv("VITE_SPOTIFY_REDIRECT_URI") || `${window.location.origin}/auth/spotify`;

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: "user-read-currently-playing user-read-playback-state",
    state,
    code_challenge,
    code_challenge_method,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/** ---------- OAuth: Exchange ---------- */
export async function exchangeSpotifyCode(code: string, state?: string): Promise<void> {
  const token = getToken();
  const REDIRECT_URI = getEnv("VITE_SPOTIFY_REDIRECT_URI") || `${window.location.origin}/auth/spotify`;

  const res = await fetch("/api/oauth/spotify/exchange", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code, state, redirect_uri: REDIRECT_URI }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Spotify /exchange fehlgeschlagen (HTTP ${res.status}): ${txt}`);
  }
}

/** Optional: Refresh */
export async function refreshSpotifyTokens(): Promise<void> {
  await request<void>("/api/oauth/spotify/refresh", { method: "POST" });
}

/** Optional: Disconnect */
export async function disconnectSpotify(): Promise<void> {
  await request<void>("/api/oauth/spotify/disconnect", { method: "POST" });
}

/** ---------- Now Playing ---------- */
/**
 * - 200 + { isPlaying: false } ? nichts l�uft
 * - 200 + { isPlaying: true, track: {...} } ? Track-Infos
 * - 204 ? kein verkn�pftes Konto / keine Daten
 * - 404 ? Endpunkt nicht vorhanden ? null
 * - 501 ? Backend/ENV nicht konfiguriert
 */
export async function getNowPlaying(): Promise<NowPlaying | null> {
  try {
    const res = await fetch("/api/spotify/now-playing", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    });

    if (res.status === 204 || res.status === 404) return null;
    if (res.status === 501) throw new Error("Spotify ist nicht konfiguriert (501).");
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ""}`);
    }

    const data = await safeJson<NowPlaying>(res);
    return data ?? null;
  } catch (e) {
    console.debug("[spotify] getNowPlaying error:", e);
    return null; // Widgets sollen nicht crashen
  }
}

/** ---------- Optional: Profil ---------- */
export type SpotifyProfile = {
  id: string;
  displayName?: string;
  followers?: number;
  url?: string;
  imageUrl?: string;
};

export async function getSpotifyProfile(): Promise<SpotifyProfile | null> {
  try {
    const res = await fetch("/api/spotify/profile", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    });
    if (!res.ok) return null;
    const data = await safeJson<SpotifyProfile>(res);
    return data ?? null;
  } catch {
    return null; // ? fehlte vorher: sorgt f�r vollst�ndige R�ckgabe-Pfade
  }
}
