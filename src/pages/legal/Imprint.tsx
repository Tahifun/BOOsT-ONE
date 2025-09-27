// src/pages/legal/Imprint.tsx
import React from "react";

export default function Imprint() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Impressum</h1>

      <p>
        <strong>CLiP BOOsT - Rene Quilitzsch</strong><br />
        Langestra�e 92<br />
        19230 Hagenow<br />
        Deutschland
      </p>

      <p>
        E-Mail: <a href="mailto:clip-boost@outlook.de">clip-boost@outlook.de</a><br />
        Telefon: +49&nbsp;155&nbsp;60066603
      </p>

      <p>
        Vertretungsberechtigt: Rene Quilitzsch<br />
        USt-ID: wird nachgereicht
      </p>

      <h3>Haftung f�r Inhalte</h3>
      <p>
        Wir sind gem�� �&nbsp;7 Abs.&nbsp;1 TMG f�r eigene Inhalte nach den allgemeinen Gesetzen verantwortlich.
        Nach ��&nbsp;8 bis 10 TMG sind wir jedoch nicht verpflichtet, �bermittelte oder gespeicherte fremde
        Informationen zu �berwachen oder nach Umst�nden zu forschen, die auf eine rechtswidrige T�tigkeit hinweisen.
      </p>

      <h3>Urheberrecht</h3>
      <p>
        Eigene Inhalte, Designs und Werke unterliegen dem deutschen Urheberrecht.
        Vervielf�ltigung, Bearbeitung und Verwertung au�erhalb der Grenzen des Urheberrechts bed�rfen unserer
        schriftlichen Zustimmung.
      </p>

      <p style={{ opacity: 0.7, marginTop: 24 }}>
        Dieses Impressum ist f�r Deutschland ausgelegt. - Aktualisiert am: 24.08.2025
      </p>
    </article>
  );
}
