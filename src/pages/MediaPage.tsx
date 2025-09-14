// src/pages/MediaPage.tsx

import React, { useState } from "react";
import { MediaGallery } from "../components/media/MediaGallery";
import { ClipManager } from "../components/media/ClipManager";
import { ScreenshotManager } from "../components/media/ScreenshotManager";
import { SoundboardManager } from "../components/media/SoundboardManager";
// ⬇️ Wichtig: Adapter statt der echten Komponente importieren
import OverlayTemplateManager from "../components/media/OverlayTemplateManager.adapter";
import { MediaExportTools } from "../components/media/MediaExportTools";
import { MediaImpactStats } from "../components/media/MediaImpactStats";
import { LiveClipRequests } from "../components/media/LiveClipRequests";
import { AIHighlightSuggestions } from "../components/media/AIHighlightSuggestions";
import { MediaUpload } from "../components/media/MediaUpload";
import "../styles/media.css";

const tabs = [
  { key: "gallery", label: "Alle Medien" },
  { key: "clips", label: "Clips" },
  { key: "screenshots", label: "Screenshots" },
  { key: "sounds", label: "Sounds" },
  { key: "overlays", label: "Overlays" },
  { key: "export", label: "Export/Teilen" },
  { key: "impact", label: "Statistiken" },
  { key: "requests", label: "Clip-Requests" },
  { key: "ai", label: "KI-Highlights" },
];

export const MediaPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("gallery");
  const [reloadKey, setReloadKey] = useState<number>(0);

  const handleUploadDone = () => setReloadKey((key) => key + 1);

  return (
    <div className="media-page">
      <h1 className="media-title">🎬 Media Center</h1>

      <div className="media-upload-wrapper">
        <MediaUpload onUpload={handleUploadDone} />
      </div>

      <div className="media-tabs-grid">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`media-tab-glow ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="media-content">
        {activeTab === "gallery" && <MediaGallery key={reloadKey} />}
        {activeTab === "clips" && <ClipManager key={reloadKey} />}
        {activeTab === "screenshots" && <ScreenshotManager key={reloadKey} />}
        {activeTab === "sounds" && <SoundboardManager key={reloadKey} />}

        {/* ⬇️ Adapter-Komponente: keine Pflicht-Props nötig */}
        {activeTab === "overlays" && <OverlayTemplateManager key={reloadKey} />}

        {activeTab === "export" && <MediaExportTools key={reloadKey} />}
        {activeTab === "impact" && <MediaImpactStats key={reloadKey} />}
        {activeTab === "requests" && <LiveClipRequests key={reloadKey} />}
        {activeTab === "ai" && <AIHighlightSuggestions key={reloadKey} />}
      </div>
    </div>
  );
};

export default MediaPage;
