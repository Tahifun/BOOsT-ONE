// src/components/media/AIHighlightSuggestions.tsx

import React, { useContext } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import { MediaItem } from '../../types/mediaTypes';
import "../../styles/media.css";

// Hier wird KI nur simuliert! In Zukunft mit AI-Analyse erweitern.
function getFakeHighlightClips(mediaItems: MediaItem[]) {
  // Einfach: nehme die letzten beiden Clips als "empfohlene Highlights"
  return mediaItems
    .filter(item => item.type === "clip")
    .slice(-2)
    .reverse();
}

export const AIHighlightSuggestions: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);
  const suggestions = getFakeHighlightClips(mediaItems);

  return (
    <div className="ai-highlight-suggestions">
      <h2> KI-Highlight-Vorschläge</h2>
      {suggestions.length === 0 && (
        <div>Keine Highlights erkannt.</div>
      )}
      <div className="ai-highlight-list">
        {suggestions.map(highlight => (
          <div key={highlight.id} className="ai-highlight-card">
            <video src={highlight.url} controls width={200} />
            <div className="highlight-title">{highlight.name}</div>
            <div className="highlight-desc">{highlight.description}</div>
            <button>Clip als Highlight übernehmen</button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <em>
          Die App schlägt dir automatisch die besten Stream-Momente als Highlights vor.
        </em>
      </div>
    </div>
  );
};

export default AIHighlightSuggestions;

