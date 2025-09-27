// src/pages/SubscribePage.tsx
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
// ? entfernst: useAuth (isPro gibt es dort nicht)
// import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from "../contexts/SubscriptionContext";

import {
  startProSubscription,
  buyDayPass,
  createPortalSession,
  mapSubscriptionError,
  HttpError,
  CONSENT_DEFAULT_TEXT,
  CONSENT_VERSION,
} from "../services/subscriptionService";
import "./SubscribePage.css";

/**
 * Plans:
 *  - Pro (Monat) -> startProSubscription()
 *  - Day-Pass    -> buyDayPass()
 *  - (optional) Pro Jahr via VITE_ENABLE_YEARLY=true
 */

function getToken(): string | undefined {
  try {
    return localStorage.getItem("token") || undefined;
  } catch {
    return undefined;
  }
}

const YEARLY_ENABLED =
  String((import.meta as any).env?.VITE_ENABLE_YEARLY || "false") === "true";
const YEARLY_PRICE_LABEL =
  (import.meta as any).env?.VITE_YEARLY_PRICE_LABEL || "99,90 ?/Jahr";

export default function SubscribePage() {
  // ? korrekt: isPro aus SubscriptionContext
  const { isPro } = useSubscription();
  const navigate = useNavigate();

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // ? Consent-Gate
  const [consentChecked, setConsentChecked] = useState(false);

  const uspMonthly = useMemo(
    () => [
      "Alle PRO-Features: Recording, Moderation (KI optional), Bot-Commands",
      "Giveaways, Polls, Advanced Audio, Panic Button",
      "Pro-Analytics + CSV-Export",
      "Overlay-Vorlagen: 20 (FREE: 2)",
      "K�ndbar im Kundenportal jederzeit",
    ],
    []
  );

  const uspDayPass = useMemo(
    () => [
      "24 Stunden alle PRO-Features",
      "Ideal f�r einzelne Events/Streams",
      "Keine automatische Verl�ngerung",
    ],
    []
  );

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof HttpError && (e.status === 404 || e.status === 501)) {
        navigate("/upgrade");
        return;
      }
      setError(mapSubscriptionError(e));
    },
    [navigate]
  );

  const commonConsent = {
    consent: true as const,
    consentText: CONSENT_DEFAULT_TEXT,
    consentVersion: CONSENT_VERSION,
  };

  const onStartMonthly = useCallback(async () => {
    setError(null);
    setMsg(null);
    setPending(true);
    try {
      const { url } = await startProSubscription(commonConsent);
      if (url) window.location.href = url;
      else setError("Unerwartete Antwort (keine URL).");
    } catch (e) {
      handleError(e);
    } finally {
      setPending(false);
    }
  }, [handleError]);

  const onStartYearly = useCallback(
    async () => {
      if (!YEARLY_ENABLED) return;
      setError(null);
      setMsg(null);
      setPending(true);
      try {
        const res = await fetch("/api/billing/create-checkout-session", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          // ? Consent auch beim Jahresabo mitsenden
          body: JSON.stringify({
            mode: "subscription",
            product: "pro_yearly",
            ...commonConsent,
          }),
        });
        if (res.status === 404 || res.status === 501) {
          navigate("/upgrade");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json?.url) window.location.href = json.url;
        else setError("Unerwartete Antwort (keine URL).");
      } catch (e) {
        setError((e as any)?.message || "Fehler beim Starten des Jahresabos.");
      } finally {
        setPending(false);
      }
    },
    [navigate]
  );

  const onBuyDayPass = useCallback(
    async () => {
      setError(null);
      setMsg(null);
      setPending(true);
      try {
        const { url } = await buyDayPass(commonConsent);
        if (url) window.location.href = url;
        else setError("Unerwartete Antwort (keine URL).");
      } catch (e) {
        handleError(e);
      } finally {
        setPending(false);
      }
    },
    [handleError]
  );

  const onOpenPortal = useCallback(
    async () => {
      setError(null);
      setMsg(null);
      setPending(true);
      try {
        const { url } = await createPortalSession();
        if (url) window.location.href = url;
        else setError("Unerwartete Antwort (keine URL).");
      } catch (e) {
        handleError(e);
      } finally {
        setPending(false);
      }
    },
    [handleError]
  );

  return (
    <div className="subscribe-container">
      {isPro ? (
        <>
          <h1>
            Du bist bereits <span style={{ color: "#1fffc3" }}>PRO</span> ??
          </h1>
          <p>Danke f�rs Unterst�tzen! Verwalte dein Abo im Kundenportal.</p>
          <button className="btn-pro" onClick={onOpenPortal} disabled={pending}>
            ?? Abo verwalten
          </button>
        </>
      ) : (
        <>
          <h1>Pro freischalten</h1>
          <p>Alle Premium-Features und h�here Limits - jederzeit k�ndbar.</p>

          {/* ? Consent-Checkbox (nicht vorausgew�hlt) */}
          <div className="consent-box" style={{ margin: "12px 0 16px" }}>
            <label style={{ display: "flex", gap: 12, alignItems: "start" }}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
              <span>
                {CONSENT_DEFAULT_TEXT}
                <br />
                <small style={{ opacity: 0.7 }}>Version: {CONSENT_VERSION}</small>
              </span>
            </label>
            <p className="consent-help" style={{ opacity: 0.8, marginTop: 6 }}>
              Ohne aktive Zustimmung ist ein Kauf nicht m�glich (digitale
              Leistung, vorzeitiges Erl�schen des Widerrufsrechts).
            </p>
          </div>

          {error && (
            <div className="subscribe-error" role="alert">
              {error}
            </div>
          )}
          {msg && (
            <div className="subscribe-msg" role="status">
              {msg}
            </div>
          )}

          <div className="plans-grid">
            {/* Monat */}
            <section className="plan-card">
              <header className="plan-header">
                <div className="plan-name">Pro Monat</div>
                <div className="plan-price">
                  <strong>9,99 ?</strong>
                  <span>/Monat</span>
                </div>
              </header>
              <ul className="plan-list">
                {uspMonthly.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <button
                className="btn-pro"
                onClick={onStartMonthly}
                disabled={pending || !consentChecked}
                aria-disabled={pending || !consentChecked}
                title={
                  !consentChecked
                    ? "Bitte zuerst zustimmen"
                    : "Pro monatlich abonnieren"
                }
              >
                ? Jetzt Pro abonnieren
              </button>
            </section>

            {/* Jahr (optional aktiv) */}
            <section
              className={`plan-card ${YEARLY_ENABLED ? "" : "plan-disabled"}`}
            >
              <header className="plan-header">
                <div className="plan-name">Pro Jahr</div>
                <div className="plan-price">
                  <strong>{YEARLY_PRICE_LABEL}</strong>
                  <span>/Jahr</span>
                </div>
              </header>
              <ul className="plan-list">
                <li>Alles aus Pro Monat</li>
                <li>Jahresrabatt</li>
                <li>Ideal f�r Power-Streamer</li>
              </ul>
              <button
                className="btn-pro"
                onClick={onStartYearly}
                disabled={pending || !YEARLY_ENABLED || !consentChecked}
                aria-disabled={pending || !YEARLY_ENABLED || !consentChecked}
                title={
                  !consentChecked
                    ? "Bitte zuerst zustimmen"
                    : YEARLY_ENABLED
                    ? "Pro j�hrlich abonnieren"
                    : "Bald verf�gbar"
                }
              >
                {YEARLY_ENABLED ? "?? Jahresabo starten" : "?? Bald verf�gbar"}
              </button>
              {!YEARLY_ENABLED && (
                <div className="plan-note">
                  Hinweis: Jahresabo wird demn�chst freigeschaltet.
                </div>
              )}
            </section>

            {/* Day-Pass */}
            <section className="plan-card">
              <header className="plan-header">
                <div className="plan-name">Day-Pass</div>
                <div className="plan-price">
                  <strong>24 h</strong>
                  <span>PRO-Zugang</span>
                </div>
              </header>
              <ul className="plan-list">
                {uspDayPass.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <button
                className="btn-secondary"
                onClick={onBuyDayPass}
                disabled={pending || !consentChecked}
                aria-disabled={pending || !consentChecked}
                title={
                  !consentChecked
                    ? "Bitte zuerst zustimmen"
                    : "Pro Day-Pass (24h) kaufen"
                }
              >
                ? Day-Pass kaufen
              </button>
            </section>
          </div>

          <p className="small-text">
            Abrechnung �ber Stripe. Du erh�ltst eine Best�tigung per E-Mail
            (dauerhafter Datentr�ger).
          </p>
        </>
      )}
    </div>
  );
}
