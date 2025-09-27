// src/pages/legal/Terms.tsx
import React from "react";

export default function Terms() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Allgemeine Gesch�ftsbedingungen (AGB)</h1>

      <h3>�1 Geltung & Anbieter</h3>
      <p>
        Diese AGB gelten f�r Vertr�ge zwischen <em>CLiP BOOsT</em> (Anbieter) und Nutzer:innen der Web-App.
      </p>

      <h3>�2 Leistungen</h3>
      <ul>
        <li><strong>FREE:</strong> Basisfunktionen</li>
        <li><strong>PRO:</strong> erweiterte Funktionen inkl. Overlays, Bot, Analytics, Integrationen</li>
        <li><strong>DAY-PASS:</strong> 24h Zugang zu PRO</li>
      </ul>

      <h3>�3 Vertragsschluss & Zahlung</h3>
      <ol>
        <li>Registrierung und Nutzung der App; kostenpflichtige Tarife via Stripe.</li>
        <li>PRO-Abos verl�ngern sich automatisch bis zur K�ndigung (jederzeit im Kundenportal).</li>
      </ol>

      <h3>�4 Widerrufsrecht bei digitalen Inhalten/Diensten</h3>
      <p>
        Verbraucher haben grunds�tzlich ein 14-t�giges Widerrufsrecht.
        Bei digitalen Inhalten/Diensten erlischt es vorzeitig, wenn du <strong>ausdr�cklich zustimmst</strong>,
        dass wir <strong>sofort</strong> mit der Leistung beginnen und du deine <strong>Kenntnis vom Verlust des
        Widerrufsrechts</strong> best�tigst. Diese Zustimmung erfolgt im Checkout �ber eine nicht vorausgew�hlte
        Checkbox; die Best�tigung senden wir dir per E-Mail (dauerhafter Datentr�ger).
      </p>

      <h3>�5 Pflichten der Nutzer</h3>
      <ul>
        <li>Keine rechtswidrigen oder fremdrechtsverletzenden Inhalte hochladen</li>
        <li>Kein Spam/Missbrauch der Dienste</li>
      </ul>

      <h3>�6 Haftung</h3>
      <p>Haftung f�r Vorsatz und grobe Fahrl�ssigkeit; im �brigen nach gesetzlichen Ma�st�ben.</p>

      <h3>�7 Recht & Gerichtsstand</h3>
      <p>Es gilt deutsches Recht. Zwingende Verbraucherrechte bleiben unber�hrt.</p>

      <p style={{ opacity: 0.7, marginTop: 24 }}>Aktualisiert am: 24.08.2025</p>
    </article>
  );
}
