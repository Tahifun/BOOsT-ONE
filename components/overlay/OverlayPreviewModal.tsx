import React from "react";
import { OverlayCardProps } from './OverlayCard';

interface OverlayPreviewModalProps {
  overlay: OverlayCardProps["overlay"] | null;
  onClose: () => void;
}

const OverlayPreviewModal: React.FC<OverlayPreviewModalProps> = ({ overlay, onClose }) => {
  if (!overlay) return null;
  return (
    <div className="overlay-preview-modal" onClick={onClose}>
      <div className="overlay-preview-content" onClick={e => e.stopPropagation()}>
        <img src={overlay.imageUrl} alt={overlay.name} />
        <h3>{overlay.name}</h3>
        <span>Kategorie: {overlay.category}</span>
        <button onClick={onClose}>Schlieen</button>
      </div>
    </div>
  );
};

export default OverlayPreviewModal;

