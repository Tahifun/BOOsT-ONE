// src/components/billing/CheckoutButtons.tsx
import React from "react";
import { useCheckout } from '../../hooks/useCheckout';

type Props = {
  token?: string; // solange Cookies noch nicht final sind
  compact?: boolean;
};

export default function CheckoutButtons({ token, compact }: Props) {
  const { startPro, startDayPass, openBillingPortal, loading, error } = useCheckout(token);

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      {!compact && (
        <p style={{ opacity: 0.9 }}>
          Upgrade auf <strong>PRO</strong> (Monat) oder hol dir einen <strong>24h-DayPass</strong>.
        </p>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={startPro}
          disabled={loading !== null}
          style={btnStyle(loading === "pro")}
        >
          {loading === "pro" ? "Weiterleitung" : "Jetzt PRO kaufen"}
        </button>

        <button
          onClick={startDayPass}
          disabled={loading !== null}
          style={btnOutlineStyle(loading === "daypass")}
        >
          {loading === "daypass" ? "Weiterleitung" : "DayPass (24h)"}
        </button>

        <button
          onClick={openBillingPortal}
          disabled={loading !== null}
          style={btnGhostStyle()}
          title="Zahlungsmittel ändern / kündigen"
        >
          Abo verwalten
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255, 99, 71, 0.12)",
            border: "1px solid rgba(255, 99, 71, 0.4)",
            color: "tomato",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {!compact && (
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Nach dem Kauf kehrst du automatisch zurück. Dein Status wird unter{" "}
          <code>/api/subscription/status</code> aktualisiert.
        </p>
      )}
    </div>
  );
}

function btnStyle(loading: boolean) {
  return {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: loading ? "linear-gradient(90deg, #2d8cff44, #7c4dff44)" : "linear-gradient(90deg, #2d8cff, #7c4dff)",
    color: "#fff",
    cursor: loading ? "default" : "pointer",
    fontWeight: 600,
    boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
  } as React.CSSProperties;
}

function btnOutlineStyle(loading: boolean) {
  return {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.25)",
    background: loading ? "rgba(255,255,255,0.06)" : "transparent",
    color: "#fff",
    cursor: loading ? "default" : "pointer",
    fontWeight: 600,
    backdropFilter: "blur(4px)",
  } as React.CSSProperties;
}

function btnGhostStyle() {
  return {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px dashed rgba(255,255,255,0.25)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 500,
  } as React.CSSProperties;
}


