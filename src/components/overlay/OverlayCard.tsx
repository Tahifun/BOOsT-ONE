import React from "react";

export interface OverlayCardProps {
  overlay: {
    _id: string;
    name: string;
    imageUrl: string;
    category: string;
    uploader?: string;
    createdAt?: string;
  };
  onPreview: (overlay: OverlayCardProps["overlay"]) => void;
}

const OverlayCard: React.FC<OverlayCardProps> = ({ overlay, onPreview }) => (
  <div className={`overlay-card category-${overlay.category}`}>
    <img
      src={overlay.imageUrl}
      alt={overlay.name}
      className="overlay-card-image"
      onClick={() => onPreview(overlay)}
    />
    <div className="overlay-card-info">
      <h3>{overlay.name}</h3>
      <span className="overlay-card-category">{overlay.category}</span>
      {overlay.uploader && <span className="overlay-card-uploader">von {overlay.uploader}</span>}
      {overlay.createdAt && (
        <span className="overlay-card-date">
          {new Date(overlay.createdAt).toLocaleDateString()}
        </span>
      )}
    </div>
    <button className="preview-btn" onClick={() => onPreview(overlay)}>
      Vorschau
    </button>
  </div>
);

export default OverlayCard;
