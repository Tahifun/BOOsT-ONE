// src/pages/OverlayGalleryPage.tsx
import React from "react";
import OverlayGallery from '../components/overlay/OverlayGallery';

// Behalte das Stylesheet, falls dort Basis-Layout/Farben gesetzt werden.
import "@/styles/overlay/OverlayGalleryPage.css";

const OverlayGalleryPage: React.FC = () => {
  return (
    <div className="overlay-gallery-page no-legacy-header">
      {/* Die Quantum-Gallery hat einen eigenen modernen Header,
          daher hier nur noch die Galerie selbst rendern. */}
      <OverlayGallery />
    </div>
  );
};

export default OverlayGalleryPage;

