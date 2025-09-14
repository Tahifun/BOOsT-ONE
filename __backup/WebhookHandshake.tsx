// src/pages/WebhookHandshake.tsx
import React, { useEffect, useState } from "react";

type HandshakePayload = {
  ok: boolean;
  ready: boolean;
  details?: {
    hasSecretKey?: boolean;
    hasWebhookSecret?: boolean;
    hasWebhookRoute?: boolean;
  };
  mode?: "test" | "live" | "unknown";
  message?: string;
};

function getToken(): string | undefined {
  try { return localStorage.getItem("token") || undefined; } catch { return undefined; }
}

const WebhookHandshake: React.FC = () => {
  const [data, setData] = useState<HandshakePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = getToken();
        const res = await fetch("/api/subscription/handshake", {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.status === 403) {
          setErr("Kein Zugriff (nur SUPERUSER).");
          return;
        }
        if (res.status === 404 || res.status === 501) {
          setErr("Handshake-Endpoint nicht verfügbar. Bitte Backend ergänzen.");
          return;
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }

        const json = (await res.json()) as HandshakePayload;
        if (mounted) setData(json);
      } catch (e: unknown) {
        if (mounted) setErr(e?.message ?? "Fehler beim Handshake.");
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Webhook-Handshake</h1>

      {err && <p className="text-red-600 mt-2">{err}</p>}

      {!err && !data && <p className="opacity-70 mt-2">Prüfe Konfiguration…</p>}

      {!err && data && (
        <div className="mt-3 text-sm">
          <div>OK: <strong>{String(data.ok)}</strong></div>
          <div>Bereit (ready): <strong>{String(data.ready)}</strong></div>
          {typeof data.mode === "string" && (
            <div>Modus: <strong>{data.mode}</strong></div>
          )}
          {data.details && (
            <ul className="mt-2 list-disc ml-5">
              <li>Secret Key vorhanden: <strong>{String(!!data.details.hasSecretKey)}</strong></li>
              <li>Webhook Secret vorhanden: <strong>{String(!!data.details.hasWebhookSecret)}</strong></li>
              <li>Webhook-Route gemountet: <strong>{String(!!data.details.hasWebhookRoute)}</strong></li>
            </ul>
          )}
          {data.message && <div className="opacity-80 mt-2">{data.message}</div>}
        </div>
      )}
    </div>
  );
};

export default WebhookHandshake;
