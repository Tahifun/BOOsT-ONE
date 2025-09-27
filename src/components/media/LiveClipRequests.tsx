// src/components/media/LiveClipRequests.tsx

import React, { useContext } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import { MediaItem } from '../../types/mediaTypes';
import "../../styles/media.css";

// In einer echten App würden die Clip-Requests live über ein Backend oder Websocket kommen.
// Hier als Demo: nutze vorhandene Clips als "Requests".

export const LiveClipRequests: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);

  // Simuliere "neue Clip-Requests" als Liste aller neuen Clips
  const clipRequests: MediaItem[] = mediaItems
    .filter(item => item.type === "clip")
    .slice(0, 3); // Demo: nur die 3 neuesten

  return (
    <div className="live-clip-requests">
      <h2>�Y'� Live Clip-Requests</h2>
      {clipRequests.length === 0 && (
        <div>Keine Clip-Requests vorhanden.</div>
      )}
      <div className="clip-request-list">
        {clipRequests.map(req => (
          <div key={req.id} className="clip-request-card">
            <div className="clip-request-title">{req.name}</div>
            <div className="clip-request-desc">{req.description}</div>
            <video src={req.url} controls width={200} />
            <div className="clip-request-actions">
              <button>Clip freigeben</button>
              <button>Bearbeiten</button>
              <button>Löschen</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <em>
          Hier erscheinen Clips, die Zuschauer während des Streams markiert oder vorgeschlagen haben.
        </em>
      </div>
    </div>
  );
};

export default LiveClipRequests;

