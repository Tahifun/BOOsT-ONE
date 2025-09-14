// src/pages/OverlayEditorPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTheme } from "@/contexts/ThemeContext";
import OverlayEditor from "@/components/overlay/OverlayEditor";
import { streamAnalytics, type ViewerAction } from "@/utils/streamAnalytics";
import { featureFlags } from "@/utils/featureFlags";
import "@/styles/overlay/OverlayEditor.css";

type Params = { templateId?: string };

const OverlayEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<Params>();
  const { currentUser, isLoading: authLoading } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const { theme } = useTheme();

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Body-Kennzeichnung: Nur im Editor ist die Klasse gesetzt (für CSS-Scoping)
  useEffect(() => {
    document.body.classList.add("is-overlay-editor");
    return () => document.body.classList.remove("is-overlay-editor");
  }, []);

  // Analytics-Action (als Literal casten, falls ViewerAction ein Union-Typ ist)
  const OVERLAY_EDITOR_ACTION: ViewerAction =
    ("OverlayEditorView" as unknown as ViewerAction);

  // User-ID ableiten: bevorzugt id, sonst email, sonst undefined
  const derivedUserId = currentUser?.id ?? currentUser?.email ?? undefined;

  // Analytics-Event
  useEffect(() => {
    streamAnalytics.trackViewerInteraction({
      theme,
      action: OVERLAY_EDITOR_ACTION,
      timestamp: Date.now(),
      userId: derivedUserId,
    });

    const quantumEnabled = featureFlags.isFeatureEnabled("EPIC_MODE_ENABLED");
    const particlesEnabled = featureFlags.isFeatureEnabled("ADVANCED_PARTICLES");
    console.debug("Quantum Features:", { quantumEnabled, particlesEnabled });
  }, [theme, derivedUserId]);

  // Ready-Flag setzen, wenn Auth + Subscription fertig geladen sind
  useEffect(() => {
    if (!authLoading && !subLoading) setIsReady(true);
  }, [authLoading, subLoading]);

  // Template laden, wenn eine ID vorhanden ist und Seite bereit ist
  useEffect(() => {
    if (templateId && isReady) void loadTemplate(templateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, isReady]);

  const loadTemplate = async (id: string) => {
    try {
      const stored = localStorage.getItem("overlay_templates");
      if (!stored) return;

      const templates = JSON.parse(stored) as Array<unknown>;
      const template = templates.find((t) => t?.id === id);
      if (template) {
        console.debug("Template loaded:", template.name);
        // TODO: State/Context hier mit Template-Daten befüllen
      }
    } catch (err) {
      console.error("Failed to load template:", err);
      setError("Template konnte nicht geladen werden");
    }
  };

  if (!isReady) {
    return (
      <div className="quantum-overlay-editor loading-state">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Quantum Reality wird initialisiert...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quantum-overlay-editor error-state">
        <div className="error-container">
          <h2>Fehler</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/overlay")}>Zurück zur Übersicht</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-editor-page" data-theme={theme}>
      {/* Navigation */}
      <div className="page-navigation">
        <button
          className="nav-back-btn"
          onClick={() => navigate("/overlay")}
          aria-label="Zurück zu Overlay-Übersicht"
        >
          ← Zurück
        </button>

        <div className="nav-breadcrumbs">
          <span onClick={() => navigate("/dashboard")}>Dashboard</span>
          <span className="separator">/</span>
          <span onClick={() => navigate("/overlay")}>Overlay</span>
          <span className="separator">/</span>
          <span className="current">Editor</span>
        </div>

        <div className="nav-actions">
          {!isPro && (
            <button className="upgrade-btn" onClick={() => navigate("/upgrade")}>
              ⚡ UPGRADE TO PRO
            </button>
          )}
        </div>
      </div>

      {/* Haupt-Editor */}
      <OverlayEditor />

      {/* Alte Floating-Action-Buttons entfernt; CSS sperrt verbleibende Reste außerhalb des Editors */}
    </div>
  );
};

export default OverlayEditorPage;
