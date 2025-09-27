// src/components/media/MediaGallery.tsx

import React, { useContext, useState } from "react";
import { MediaContext } from '../../contexts/MediaContext';
import { MediaType, MediaItem } from '../../types/mediaTypes';
import { getMediaIcon } from '../../utils/mediaUtils';
import "../../styles/media.css";

const mediaTypeOptions: { label: string; value: MediaType | "all" }[] = [
  { label: "Alle", value: "all" },
  { label: "Clip", value: "clip" },
  { label: "Screenshot", value: "screenshot" },
  { label: "Sound", value: "sound" },
  { label: "Overlay", value: "overlay" },
];

export const MediaGallery: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);
  const [filter, setFilter] = useState<MediaType | "all">("all");
  const [search, setSearch] = useState<string>("");

  const filteredMedia = mediaItems.filter((item: MediaItem) => {
    const typeMatch = filter === "all" || item.type === filter;
    const searchMatch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    return typeMatch && searchMatch;
  });

  return (
    <div className="media-gallery">
      <div className="media-gallery-controls">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as MediaType | "all")}
          className="media-gallery-filter"
        >
          {mediaTypeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          className="media-gallery-search"
          type="text"
          placeholder="Suche nach Name oder Beschreibung..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="media-grid">
        {filteredMedia.length === 0 && (
          <div className="media-empty">Keine Medien gefunden.</div>
        )}
        {filteredMedia.map(item => (
          <div key={item.id} className={`media-card media-type-${item.type}`}>
            <div className="media-icon">{getMediaIcon(item.type)}</div>
            <div className="media-card-info">
              <div className="media-card-title">{item.name}</div>
              <div className="media-card-desc">{item.description}</div>
            </div>
            <div className="media-card-actions">
              <button className="media-card-btn">Vorschau</button>
              <button className="media-card-btn">Teilen</button>
              <button className="media-card-btn">Löschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaGallery;

