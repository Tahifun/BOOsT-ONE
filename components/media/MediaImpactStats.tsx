// src/components/media/MediaImpactStats.tsx

import React, { useContext } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import { MediaType } from '../../types/mediaTypes';
import "../../styles/media.css";

export const MediaImpactStats: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);

  // Demo: Zhle, wie oft jeder Medientyp genutzt wurde
  const stats: Record<MediaType, number> = {
    clip: 0,
    screenshot: 0,
    sound: 0,
    overlay: 0,
  };

  mediaItems.forEach(item => {
    stats[item.type] = (stats[item.type] || 0) + 1;
  });

  // Hier knnten spter noch mehr Analysen eingebaut werden (meistgeteilte Clips, beste Sounds etc.)

  return (
    <div className="media-impact-stats">
      <h2> Medien-Statistiken</h2>
      <div className="media-stat-row">
        <div>Clips: <strong>{stats.clip}</strong></div>
        <div>Screenshots: <strong>{stats.screenshot}</strong></div>
        <div>Sounds: <strong>{stats.sound}</strong></div>
        <div>Overlays: <strong>{stats.overlay}</strong></div>
      </div>
      <div style={{ marginTop: 24 }}>
        {/* Platzhalter fr: Top-Clips, Top-Sounds, Trends, "Medien-Impact-Analyse" */}
        <em>Weitere Auswertungen & Trends folgen hier ...</em>
      </div>
    </div>
  );
};

export default MediaImpactStats;

