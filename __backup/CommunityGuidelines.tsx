// src/pages/legal/CommunityGuidelines.tsx
import React from "react";

export default function CommunityGuidelines() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Community-Richtlinien</h1>
      <p>
        Diese Plattform lebt von Respekt und Fairness. Bitte halte dich an folgende
        Grundsätze, wenn du Overlays hochlädst, Bots nutzt oder Streams startest.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Erlaubte Inhalte</h2>
      <ul>
        <li>Kreative Overlays und Widgets</li>
        <li>Eigene oder lizenzfreie Medien</li>
        <li>Inhalte, die nicht gegen geltendes Recht verstoßen</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Verbotene Inhalte</h2>
      <ul>
        <li>Hassrede, Gewalt, Diskriminierung</li>
        <li>Unerlaubte Werbung oder Spam</li>
        <li>Malware oder schädliche Dateien</li>
        <li>Verletzung von Urheberrechten Dritter</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Durchsetzung</h2>
      <p>
        Bei Verstößen behalten wir uns Maßnahmen vor: Verwarnungen, Takedowns,
        temporäre oder dauerhafte Sperrungen sowie rechtliche Schritte bei schweren Verstößen.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Melden</h2>
      <p>
        Wenn dir ein Verstoß auffällt, melde ihn bitte an{" "}
        <a href="mailto:abuse@example.com">abuse@example.com</a>.
      </p>

      <p style={{ opacity: 0.7, marginTop: 24 }}>Aktualisiert am: 24.08.2025</p>
    </article>
  );
}
