// src/env.ts
export const API_BASE_URL   = import.meta.env.VITE_API_BASE_URL   as string | undefined;
export const BACKEND_URL    = import.meta.env.VITE_BACKEND_URL    as string | undefined;
export const SOCKET_URL     = import.meta.env.VITE_SOCKET_URL     as string | undefined;

export const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined;
export const SPOTIFY_CLIENT_ID    = import.meta.env.VITE_SPOTIFY_CLIENT_ID    as string | undefined;

export const TIKTOK_REDIRECT_URI  = import.meta.env.VITE_TIKTOK_REDIRECT_URI  as string | undefined;

// Fallbacks/Validierung für lokale Devs (optional)
if (import.meta.env.PROD) {
  // In PROD lieber failen, wenn etwas Wichtiges fehlt:
  if (!API_BASE_URL)   console.warn("VITE_API_BASE_URL ist nicht gesetzt");
  if (!BACKEND_URL)    console.warn("VITE_BACKEND_URL ist nicht gesetzt");
  if (!SOCKET_URL)     console.warn("VITE_SOCKET_URL ist nicht gesetzt");
}
