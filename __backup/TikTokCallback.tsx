// src/pages/TikTokCallback.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:4001`;

export default function TikTokCallback() {
  const nav = useNavigate();
  const loc = useLocation();
  const [status, setStatus] = useState<string>("Verarbeite TikTok-Callback …");

  const { code, state, redirectUri } = useMemo(() => {
    const q = new URLSearchParams(loc.search);
    const current = `${window.location.origin}/auth/tiktok`;
    return {
      code: q.get("code") || "",
      state: q.get("state") || "",
      redirectUri: current,
    };
  }, [loc.search]);

  useEffect(() => {
    let aborted = false;

    (async () => {
      if (!code) {
        setStatus("Kein Code im Callback – Abbruch.");
        return;
      }
      try {
        const r = await fetch(`${API_BASE}/api/tiktok/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
        });

        if (!r.ok) {
          let errTxt = r.statusText;
          try {
            const err = await r.json();
            errTxt = err?.error || errTxt;
          } catch {}
          if (!aborted) setStatus(`Fehler beim Token-Tausch: ${errTxt}`);
          return;
        }

        if (!aborted) {
          setStatus("TikTok verbunden. Weiterleitung …");
          // 👉 nach erfolgreichem Login direkt zur Home-Seite
          nav("/", { replace: true });
        }
      } catch (e: unknown) {
        if (!aborted) setStatus(`Unerwarteter Fehler: ${e?.message || String(e)}`);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [code, state, redirectUri, nav]);

  return (
    <div style={{ padding: 24 }}>
      <h2>TikTok</h2>
      <p>{status}</p>
    </div>
  );
}
