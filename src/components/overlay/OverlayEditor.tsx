// src/pages/OverlayEditorPage.tsx

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import OverlayTemplateManager from "@/components/media/OverlayTemplateManager";
import "@/styles/overlay/OverlayEditor.css";

const OverlayEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId?: string }>();

  return (
    <div className="overlay-editor-page" aria-label="Overlay Editor">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="overlay-back-btn"
            onClick={() => navigate("/overlay")}
            aria-label="Zurück zu Overlay-Übersicht"
            style={{ marginRight: 8 }}
          >
            ← Zurück
          </button>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Overlay Editor</h1>
          {templateId && (
            <span style={{ marginLeft: 12, fontSize: "0.9rem", opacity: 0.8 }}>
              Vorlage: {decodeURIComponent(templateId)}
            </span>
          )}
        </div>
      </div>

      <p style={{ marginTop: 0, marginBottom: 12, color: "#ccc" }}>
        Erstelle oder wähle eine Overlay-Vorlage, passe Widgets an und setze Standardwerte. Deine aktiven Widgets steuerst du im Editor der Vorlage.
      </p>

      <OverlayTemplateManager />
    </div>
  );
};

export default OverlayEditorPage;
