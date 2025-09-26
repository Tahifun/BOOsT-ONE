// src/components/media/ScreenshotManager.tsx

import React, { useContext } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import { MediaItem } from '../../types/mediaTypes';
import "../../styles/media.css";

export const ScreenshotManager: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);

  const screenshots = mediaItems.filter(item => item.type === "screenshot");

  return (
    <div className="screenshot-manager">
      <h2>️ Screenshots</h2>
      {screenshots.length === 0 && <div>Keine Screenshots vorhanden.</div>}
      <div className="screenshot-list">
        {screenshots.map(ss => (
          <div key={ss.id} className="screenshot-card">
            <img src={ss.url} alt={ss.name} width={200} />
            <div className="screenshot-title">{ss.name}</div>
            <div className="screenshot-desc">{ss.description}</div>
            <div className="screenshot-actions">
              <button>Als Thumbnail nutzen</button>
              <button>Teilen</button>
              <button>Löschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreenshotManager;

