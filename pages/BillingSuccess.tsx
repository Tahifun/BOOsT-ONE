// src/pages/BillingSuccess.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from '../lib/apiClient';

type Status = {
  tier: "FREE" | "PRO";
  active: boolean;
  source?: string;
  dayPass?: { active: boolean; validUntil?: string | null };
};

export default function BillingSuccess() {
  const [status, setStatus] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => new URLSearchParams(window.location.search), []);
  const sessionId = qs.get("session_id") || "";

  useEffect(() => {
    // optional: Session-ID an dein Backend posten, falls du dafr einen Endpunkt hast.
    // Wir zeigen hier einfach den aktuellen Status.
    const run = async () => {
      try {
        const s = await api<Status>("/subscription/status", { method: "GET" });
        setStatus(s);
      } catch (e: unknown) {
        setErr(e?.message || "Status konnte nicht geladen werden");
      }
    };
    run();
  }, []);

  return (
    <div style={{ maxWidth: 680, margin: "48px auto", padding: "24px" }}>
      <h1>Danke! Zahlung abgeschlossen.</h1>
      {sessionId && <p>Session-ID: <code>{sessionId}</code></p>}

      {err && <p style={{ color: "tomato" }}>{err}</p>}

      {status ? (
        <div style={{ marginTop: 16 }}>
          <p>
            Status: <strong>{status.tier}</strong>{" "}
            {status.active ? " aktiv" : " inaktiv"}
            {status.source ? ` (Quelle: ${status.source})` : null}
          </p>
          {status.dayPass?.active && status.dayPass.validUntil && (
            <p>DayPass gltig bis: {new Date(status.dayPass.validUntil).toLocaleString()}</p>
          )}
        </div>
      ) : (
        <p>Lade Status</p>
      )}

      <a href="/">Zurck zur Startseite</a>
    </div>
  );
}

