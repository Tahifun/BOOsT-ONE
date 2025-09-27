// src/components/shared/Footer.tsx
import { Link } from "react-router-dom";
import React from "react";

export default function Footer() {
  return (
    <footer
      className="app-footer"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 16px",
        fontSize: 12,
        opacity: 0.9,
        backdropFilter: "saturate(120%) blur(4px)",
      }}
    >
      <div
        className="app-footer-inner"
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Link to="/imprint" className="footer-link" style={{ textDecoration: "underline" }}>
          Impressum
        </Link>
        <span aria-hidden="true">.</span>
        <Link to="/terms" className="footer-link" style={{ textDecoration: "underline" }}>
          AGB
        </Link>
        <span aria-hidden="true">.</span>
        <Link to="/privacy" className="footer-link" style={{ textDecoration: "underline" }}>
          Datenschutz
        </Link>
        <span aria-hidden="true">.</span>
        <Link to="/withdrawal" className="footer-link" style={{ textDecoration: "underline" }}>
          Widerruf
        </Link>
        <span aria-hidden="true">.</span>
        <Link to="/guidelines" className="footer-link" style={{ textDecoration: "underline" }}>
          Richtlinien
        </Link>
        <span aria-hidden="true">.</span>
        <Link to="/licenses" className="footer-link" style={{ textDecoration: "underline" }}>
          Lizenzen
        </Link>
      </div>
    </footer>
  );
}
