// src/components/media/ClipManager.tsx

import React, { useContext } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import { MediaItem } from '../../types/mediaTypes';
import "../../styles/media.css";

export const ClipManager: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);

  const clips = mediaItems.filter(item => item.type === "clip");

  return (
    <div className="clip-manager">
      <h2> Clips verwalten</h2>
      {clips.length === 0 && <div>Keine Clips vorhanden.</div>}
      <div className="clip-list">
        {clips.map(clip => (
          <div key={clip.id} className="clip-card">
            <video src={clip.url} controls width={240} poster={clip.thumbnailUrl} />
            <div className="clip-info">
              <div className="clip-title">{clip.name}</div>
              <div className="clip-desc">{clip.description}</div>
              <div className="clip-meta">
                {clip.duration ? `${clip.duration}s` : null}
                {"  "}
                {clip.createdAt.substring(0, 10)}
              </div>
            </div>
            <div className="clip-actions">
              <button>Exportieren</button>
              <button>Thumbnail erstellen</button>
              <button>Highlight setzen</button>
              <button>Lschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClipManager;

