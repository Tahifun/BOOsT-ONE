// src/pages/DayPassPage.tsx
import React, { useState, useCallback } from "react";
import { buyDayPass, mapSubscriptionError, CONSENT_DEFAULT_TEXT, CONSENT_VERSION } from '../services/subscriptionService';

const DayPassPage: React.FC = () => {
  //  Kein Auto-Redirect mehr  Consent-Gate zuerst
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onBuy = useCallback(async () => {
    if (!consent) return;
    setErr(null); setMsg(null); setPending(true);
    try {
      const { url } = await buyDayPass({
        consent: true,
        consentText: CONSENT_DEFAULT_TEXT,
        consentVersion: CONSENT_VERSION,
      });
      if (url) window.location.href = url;
      else setErr("Unerwartete Antwort (keine URL).");
    } catch (e) {
      setErr(mapSubscriptionError(e));
    } finally {
      setPending(false);
    }
  }, [consent]);

  return (
    <div className="p-6" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h1 className="text-xl font-semibold">Pro Day-Pass (24h)</h1>

      <label className="flex gap-2 mt-4 items-start" style={{ display: "flex", gap: 12, alignItems: "start" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {CONSENT_DEFAULT_TEXT}
          <br />
          <small style={{ opacity: 0.7 }}>Version: {CONSENT_VERSION}</small>
        </span>
      </label>

      {err && <p className="text-red-600 mt-3" style={{ color: "#e5484d", marginTop: 12 }}>{err}</p>}
      {msg && <p className="opacity-70 mt-3" style={{ opacity: 0.7, marginTop: 12 }}>{msg}</p>}

      <button
        className="btn btn-primary mt-6"
        onClick={onBuy}
        disabled={!consent || pending}
        aria-disabled={!consent || pending}
        title={!consent ? "Bitte zuerst zustimmen" : "Day-Pass kaufen"}
        style={{ marginTop: 16 }}
      >
        {pending ? "Lädt" : "Day-Pass kaufen"}
      </button>
    </div>
  );
};

export default DayPassPage;

