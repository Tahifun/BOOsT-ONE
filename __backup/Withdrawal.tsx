// src/pages/legal/Withdrawal.tsx
import React from "react";

export default function Withdrawal() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Widerrufsbelehrung</h1>

      <p>
        Du hast das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
        Die Frist beginnt ab Vertragsschluss.
      </p>

      <h3>Folgen des Widerrufs</h3>
      <p>
        Im Falle des Widerrufs erstatten wir alle Zahlungen innerhalb von 14 Tagen über dasselbe
        Zahlungsmittel zurück.
      </p>

      <h3>Ausschluss bzw. vorzeitiges Erlöschen des Widerrufsrechts</h3>
      <p>
        Bei Verträgen über digitale Inhalte/Dienstleistungen, die nicht auf einem körperlichen Datenträger
        geliefert werden, erlischt das Widerrufsrecht, wenn du <strong>ausdrücklich zugestimmt</strong> hast,
        dass wir vor Ablauf der Widerrufsfrist mit der Ausführung beginnen, und du deine <strong>Kenntnis vom
        Verlust des Widerrufsrechts</strong> bestätigt hast. Diese Zustimmung erfolgt im Checkout über eine
        nicht vorausgewählte Checkbox; die Bestätigung erhältst du per E-Mail (dauerhafter Datenträger).
      </p>

      <h3>Muster-Widerrufsformular</h3>
      <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
{`An: CLiP BOOsT – Rene Quilitzsch, Langestraße 92, 19230 Hagenow, Deutschland
E-Mail: clip-boost@outlook.de

Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über
den Kauf der folgenden digitalen Inhalte/Dienstleistungen:

Bestellt am: [Datum]
Name des/der Verbraucher(s): [Name]
Anschrift des/der Verbraucher(s): [Adresse]
Unterschrift (nur bei Mitteilung auf Papier)
Datum: [Datum]`}
      </pre>

      <p style={{ opacity: 0.7, marginTop: 24 }}>Aktualisiert am: 24.08.2025</p>
    </article>
  );
}
