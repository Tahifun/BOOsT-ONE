// src/pages/legal/Privacy.tsx
import React from "react";

export default function Privacy() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Datenschutzerklärung</h1>

      <h3>Verantwortlicher</h3>
      <p>
        CLiP BOOsT – Rene Quilitzsch, Langestraße 92, 19230 Hagenow, Deutschland<br />
        E-Mail: <a href="mailto:clip-boost@outlook.de">clip-boost@outlook.de</a> · Telefon: +49&nbsp;155&nbsp;60066603
      </p>

      <h3>Verarbeitete Daten</h3>
      <ul>
        <li><strong>Account-Daten:</strong> Name, E-Mail, Passwort (gehasht)</li>
        <li><strong>Zahlungsdaten:</strong> Abwicklung über Stripe; wir speichern keine Kartendaten</li>
        <li><strong>Nutzungsdaten:</strong> Logins, Livestream-Events, Overlay-/Media-Nutzung</li>
        <li><strong>Uploads:</strong> Mediendateien; Virenscan (ClamAV)</li>
        <li><strong>Kommunikation:</strong> Support/E-Mails (SendGrid)</li>
        <li>
          <strong>Consent-Nachweis (Audit-Log):</strong> Plan, consentText, consentVersion, IP-Adresse,
          User-Agent, Zeitstempel
        </li>
      </ul>

      <h3>Zwecke & Rechtsgrundlagen (DSGVO)</h3>
      <ul>
        <li><strong>Vertrag/Erbringung</strong> (Art. 6 Abs. 1 lit. b): Konto, Käufe, Bereitstellung der App.</li>
        <li>
          <strong>Consent-Audit-Log</strong> (Art. 6 Abs. 1 lit. f):
          Nachweis der Einwilligung/Verteidigung von Rechtsansprüchen (berechtigtes Interesse).
        </li>
        <li><strong>Rechtspflichten</strong> (Art. 6 Abs. 1 lit. c): z. B. handels-/steuerrechtliche Aufbewahrung.</li>
        <li><strong>Einwilligung</strong> (Art. 6 Abs. 1 lit. a): z. B. Newsletter/Tracking – nur mit Opt-in.</li>
      </ul>

      <h3>Drittanbieter & Übermittlungen</h3>
      <ul>
        <li>Stripe Payments Europe, Ltd. – Zahlungsabwicklung</li>
        <li>SendGrid (Twilio Inc.) – E-Mail-Versand</li>
        <li>MongoDB Atlas – Datenbank-Hosting</li>
        <li>Hosting/CDN – z. B. Vercel/AWS/Cloudflare</li>
      </ul>
      <p>Bei Übermittlungen in Drittländer kommen geeignete Garantien (z. B. Standardvertragsklauseln) zum Einsatz.</p>

      <h3>Speicherdauer</h3>
      <ul>
        <li>Account: bis zur Löschung</li>
        <li>Kauf-/Abrechnungsdaten: entsprechend gesetzlicher Fristen</li>
        <li>Consent-Logs: bis zum Ablauf einschlägiger Verjährungsfristen</li>
      </ul>

      <h3>Rechte der Betroffenen</h3>
      <ul>
        <li>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit</li>
        <li>Widerspruch gegen Verarbeitung aus berechtigtem Interesse</li>
        <li>Beschwerde bei einer Aufsichtsbehörde</li>
      </ul>

      <h3>Cookies & Tracking</h3>
      <ul>
        <li>Erforderliche Cookies (Login/Session)</li>
        <li>Analyse/Marketing nur mit Opt-in</li>
      </ul>

      <h3>Sicherheit</h3>
      <ul>
        <li>HTTPS/TLS</li>
        <li>Rate-Limiting & Tier-Gates</li>
        <li>Upload-Virenscan (ClamAV)</li>
      </ul>

      <p style={{ opacity: 0.7, marginTop: 24 }}>
        Diese Erklärung dient der Transparenz und ersetzt keine Rechtsberatung. – Aktualisiert am: 24.08.2025
      </p>
    </article>
  );
}
