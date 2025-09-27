// src/hooks/useSpotifyPlayer.ts
import { useEffect, useRef, useState } from "react";

const API =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4001`;

declare global {
  interface Window {
    Spotify: unknown;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

type TokenResponse = {
  access_token?: string | null;
  token?: string | null;
  error?: string;
};

async function fetchAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API}/api/spotify/token`, { credentials: "include" });
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;

    const j = (await res.json()) as TokenResponse;
    const t = j.access_token ?? j.token ?? null;
    if (!res.ok) return null;
    if (!t || typeof t !== "string" || t.length < 10) return null;
    return t;
  } catch {
    return null;
  }
}

export function useSpotifyPlayer() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const playerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (initializedRef.current) return;

      // 1) Nur starten, wenn wir ein valides Token haben
      const firstToken = await fetchAccessToken();
      if (!firstToken || cancelled) {
        // Kein Token ? kein SDK-Init (verhindert 401-Spam)
        return;
      }

      // 2) SDK-Script laden (falls noch nicht vorhanden)
      const scriptId = "spotify-sdk";
      const alreadyLoaded = Boolean(document.getElementById(scriptId));
      if (!alreadyLoaded) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
      }

      // 3) Init-Funktion definieren
      const startPlayer = () => {
        if (cancelled || initializedRef.current) return;

        // @ts-ignore
        const player = new window.Spotify.Player({
          name: "CLiP BOOsT Player",
          getOAuthToken: async (cb: (t: string) => void) => {
            const t = (await fetchAccessToken()) ?? firstToken; // fallback auf erstes Token
            if (t) cb(t);
          },
          volume: 0.5,
        });

        player.addListener("ready", ({ device_id }: unknown) => {
          if (cancelled) return;
          setDeviceId(device_id);
          setReady(true);
          // Optional: an Backend melden/transferieren
          fetch(`${API}/api/spotify/player/transfer`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id, play: false }),
          }).catch(() => {});
        });

        player.addListener("initialization_error", ({ message }: unknown) =>
          console.warn("[spotify] initialization_error:", message)
        );
        player.addListener("authentication_error", ({ message }: unknown) =>
          console.warn("[spotify] authentication_error:", message)
        );
        player.addListener("account_error", ({ message }: unknown) =>
          console.warn("[spotify] account_error:", message)
        );
        player.addListener("playback_error", ({ message }: unknown) =>
          console.warn("[spotify] playback_error:", message)
        );

        playerRef.current = player;
        initializedRef.current = true;
        player.connect();
      };

      // 4) Wenn SDK schon da ? direkt starten, sonst Callback setzen
      if (alreadyLoaded && (window as any).Spotify) {
        startPlayer();
      } else {
        window.onSpotifyWebPlaybackSDKReady = startPlayer;
      }
    }

    init();

    return () => {
      cancelled = true;
      try {
        playerRef.current?.disconnect();
      } catch {}
    };
  }, []);

  return { deviceId, ready, player: playerRef.current };
}
