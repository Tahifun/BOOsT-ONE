// src/env.ts

// Helper liest ENV mit und ohne Bindestrich
const read = (k: string) => (import.meta.env as any)?.[k] as string | undefined;

export const API_BASE =
  read("VITE_API_BASE_URL") ??
  read("VITE-API-BASE-URL") ??
  "https://api.clip-boost.online/api";

// Kompatibilitt: alter Name weiter exportiert
export const API_BASE_URL = API_BASE;

export const BACKEND_URL =
  read("VITE_BACKEND_URL") ??
  read("VITE-BACKEND-URL") ??
  "https://api.clip-boost.online";

export const SOCKET_URL =
  read("VITE_SOCKET_URL") ??
  read("VITE-SOCKET-URL");

export const SPOTIFY_REDIRECT_URI =
  read("VITE_SPOTIFY_REDIRECT_URI") ??
  read("VITE-SPOTIFREDIRECT-URI");

export const SPOTIFY_CLIENT_ID =
  read("VITE_SPOTIFY_CLIENT_ID") ??
  read("VITE-SPOTIFCLIENT-ID");

export const TIKTOK_REDIRECT_URI =
  read("VITE_TIKTOK_REDIRECT_URI") ??
  read("VITE-TIKTOK-REDIRECT-URI");

// Warnungen nur in Prod, damit du Misskonfiguration siehst
if (import.meta.env.PROD) {
  if (!API_BASE)   console.warn("VITE_API_BASE_URL / VITE-API-BASE-URL fehlt. Fallback wird genutzt.");
  if (!BACKEND_URL) console.warn("VITE_BACKEND_URL / VITE-BACKEND-URL fehlt. Fallback wird genutzt.");
}
