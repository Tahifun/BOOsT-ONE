// src/pages/legal/Licenses.tsx
import React from "react";

export default function Licenses() {
  return (
    <article style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Lizenz- und Urheberrechtshinweise</h1>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Open-Source-Komponenten</h2>
      <p>
        Diese Anwendung nutzt Open-Source-Bibliotheken unter ihren jeweiligen Lizenzen (Auszug):
      </p>
      <ul>
        <li>React (MIT)</li>
        <li>Vite (MIT)</li>
        <li>TypeScript (Apache-2.0)</li>
        <li>Express (MIT)</li>
        <li>Lucide Icons (ISC)</li>
      </ul>
      <p>
        Vollst�ndige Lizenztexte sind im Repository unter <code>/licenses</code> bzw. in den jeweiligen
        NPM-Packages enthalten.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Eigene Inhalte</h2>
      <p>
        S�mtliche von uns erstellten Inhalte (Code, Texte, Grafiken) sind urheberrechtlich gesch�tzt.
        Nutzung nur mit ausdr�cklicher Genehmigung, sofern nicht anders gekennzeichnet.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 16 }}>Uploads durch Nutzer</h2>
      <p>
        Medien und Overlays, die Nutzer hochladen, bleiben deren Eigentum. Nutzer versichern, die erforderlichen
        Rechte innezuhaben; bei Hinweisen auf Rechtsverletzungen entfernen wir Inhalte nach Pr�fung.
      </p>

      <p style={{ opacity: 0.7, marginTop: 24 }}>Aktualisiert am: 24.08.2025</p>
    </article>
  );
}
