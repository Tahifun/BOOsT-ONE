// src/components/overlay/OverlayTemplateManager.tsx
import React, { useMemo, useRef, useState } from "react";
import ProFeatureWrapper from '../common/ProFeatureWrapper';
import UpgradePrompt from '../common/UpgradePrompt';
import { useSubscription } from "@/contexts/SubscriptionContext";
import { OverlayTemplate } from "@/types/overlayTypes";
import { safeParse } from "@/utils/json";
import "@/styles/overlay/OverlayPage.css";

type Props = {
  templates: OverlayTemplate[];
  currentTemplate: OverlayTemplate | null;
  onSaveTemplate: () => void;
  onLoadTemplate: (tpl: OverlayTemplate) => void;
  onImportTemplate: (file: File) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (id: string) => void;
  onExportTemplate: (tpl?: OverlayTemplate) => void;
  storageKey?: string;
};

const OverlayTemplateManager: React.FC<Props> = ({
  templates,
  currentTemplate,
  onSaveTemplate,
  onLoadTemplate,
  onImportTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onExportTemplate,
  storageKey = "overlay_templates",
}) => {
  const { isPro } = useSubscription();
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return templates;
    const q = query.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      (t.tags || []).join(" ").toLowerCase().includes(q)
    );
  }, [templates, query]);

  const count = templates.length;

  const handleImportClick = () => fileInput.current?.click();
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onImportTemplate(f);
    e.target.value = "";
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storageKey}-backup.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="template-manager">
      <div className="template-toolbar reality-anchor">
        <div className="title-wrap">
          <h2 className="panel-title">TEMPLATE GALLERY</h2>
          <div className="template-counter">{count} gespeichert</div>
        </div>

        <div className="actions">
          <input
            className="search-input"
            placeholder="Suchen nach Name, Tag, Beschreibung�?�"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn primary" onClick={onSaveTemplate}>Neu speichern</button>
          <button className="btn" onClick={handleImportClick}>Importieren</button>
          <button className="btn" onClick={exportAll}>Alle exportieren</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="template-grid">
        {filtered.map(tpl => {
          const isActive = currentTemplate?.id === tpl.id;
          return (
            <div key={tpl.id} className={`template-card ${isActive ? "active" : ""}`}>
              <div className="template-card-header">
                <div className="template-name">{tpl.name}</div>
                <div className="template-meta">
                  <span className="template-date">
                    {tpl.lastModified ? new Date(tpl.lastModified as any).toLocaleString() : "�?""}
                  </span>
                  {tpl.author && <span className="template-author">�?� {tpl.author}</span>}
                </div>
              </div>

              <div className="template-preview">
                <div className="consciousness-meter">
                  <div className="consciousness-fill" style={{ width: `${tpl.consciousness ?? 0}%` }} />
                </div>
                <div className="template-stats">
                  <span>Widgets: {tpl.widgets?.length ?? 0}</span>
                  <span>Phase: {tpl.quantumState?.dimensionalPhase ?? "stable"}</span>
                </div>
              </div>

              <div className="template-actions">
                <button className="btn" onClick={() => onLoadTemplate(tpl)}>Laden</button>
                <button className="btn" onClick={() => onDuplicateTemplate(tpl.id)}>Duplizieren</button>
                <button className="btn" onClick={() => onExportTemplate(tpl)}>Export</button>
                <button className="btn danger" onClick={() => onDeleteTemplate(tpl.id)}>Löschen</button>
              </div>
            </div>
          );
        })}

        {!filtered.length && (
          <div className="template-empty">
            <p>Keine Templates gefunden.</p>
            <div className="empty-actions">
              <button className="btn primary" onClick={onSaveTemplate}>Aktuelle Konfiguration speichern</button>
              <button className="btn" onClick={handleImportClick}>JSON importieren</button>
            </div>
          </div>
        )}
      </div>

      {!isPro && (
        <div className="template-upsell">
          <ProFeatureWrapper featureName="pro_analytics" showUpgradePrompt={false}>
            <UpgradePrompt
              featureName="pro_analytics"
              variant="banner"
              message="Synchronisation & Cloud-Backup sind Teil von PRO."
            />
          </ProFeatureWrapper>
        </div>
      )}
    </div>
  );
};

export default OverlayTemplateManager;

