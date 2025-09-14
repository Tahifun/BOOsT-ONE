// src/pages/legal/Terms.tsx
import React from "react";

export default function Terms() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Allgemeine Geschäftsbedingungen (AGB)</h1>

      <h3>§1 Geltung & Anbieter</h3>
      <p>
        Diese AGB gelten für Verträge zwischen <em>CLiP BOOsT</em> (Anbieter) und Nutzer:innen der Web-App.
      </p>

      <h3>§2 Leistungen</h3>
      <ul>
        <li><strong>FREE:</strong> Basisfunktionen</li>
        <li><strong>PRO:</strong> erweiterte Funktionen inkl. Overlays, Bot, Analytics, Integrationen</li>
        <li><strong>DAY-PASS:</strong> 24h Zugang zu PRO</li>
      </ul>

      <h3>§3 Vertragsschluss & Zahlung</h3>
      <ol>
        <li>Registrierung und Nutzung der App; kostenpflichtige Tarife via Stripe.</li>
        <li>PRO-Abos verlängern sich automatisch bis zur Kündigung (jederzeit im Kundenportal).</li>
      </ol>

      <h3>§4 Widerrufsrecht bei digitalen Inhalten/Diensten</h3>
      <p>
        Verbraucher haben grundsätzlich ein 14-tägiges Widerrufsrecht.
        Bei digitalen Inhalten/Diensten erlischt es vorzeitig, wenn du <strong>ausdrücklich zustimmst</strong>,
        dass wir <strong>sofort</strong> mit der Leistung beginnen und du deine <strong>Kenntnis vom Verlust des
        Widerrufsrechts</strong> bestätigst. Diese Zustimmung erfolgt im Checkout über eine nicht vorausgewählte
        Checkbox; die Bestätigung senden wir dir per E-Mail (dauerhafter Datenträger).
      </p>

      <h3>§5 Pflichten der Nutzer</h3>
      <ul>
        <li>Keine rechtswidrigen oder fremdrechtsverletzenden Inhalte hochladen</li>
        <li>Kein Spam/Missbrauch der Dienste</li>
      </ul>

      <h3>§6 Haftung</h3>
      <p>Haftung für Vorsatz und grobe Fahrlässigkeit; im Übrigen nach gesetzlichen Maßstäben.</p>

      <h3>§7 Recht & Gerichtsstand</h3>
      <p>Es gilt deutsches Recht. Zwingende Verbraucherrechte bleiben unberührt.</p>

      <p style={{ opacity: 0.7, marginTop: 24 }}>Aktualisiert am: 24.08.2025</p>
    </article>
  );
}
