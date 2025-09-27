import React from 'react';
import { useContext } from 'react';
import { MediaContext } from '../../contexts/MediaContext';
import { MediaItem } from '../../types/mediaTypes';
import ProFeatureWrapper from '../common/ProFeatureWrapper';
import '../../styles/media.css';

/** Hilfsfunktion: absolute URL fÃ¼r ein Item bauen */
function buildPublicUrl(url: string) {
  try {
    // Wenn bereits absolut, beibehalten
    const u = new URL(url);
    return u.toString();
  } catch {
    // Relativ -> an Origin anhÃ¤ngen
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}

export const MediaExportTools: React.FC = () => {
  const { mediaItems } = useContext(MediaContext);

  // Nur Clips & Screenshots sind export-relevant
  const exportables: MediaItem[] = (mediaItems || []).filter(
    (item) => item.type === 'clip' || item.type === 'screenshot',
  );

  const handleCopyLink = async (item: MediaItem) => {
    const link = buildPublicUrl(item.url);
    try {
      await navigator.clipboard.writeText(link);
      alert('u{1F517} Link kopiert!');
    } catch {
      // Fallback fÃ¼r Browser ohne Clipboard-API
      const ok = window.confirm(`Kopieren nicht mÃ¶glich.\nLink anzeigen?\n\n${link}`);
      if (ok) window.prompt('Link manuell kopieren:', link);
    }
  };

  // Platzhalter-Actions ï¿½?" hier spÃ¤ter Backend/Worker-Export einhÃ¤ngen
  const handleExportShort = (item: MediaItem) => {
    // z. B. POST /api/export/short { url, aspect: 9:16, trim, watermark, ... }
    alert(`ï¿½YZï¿½ TikTok-Short Export gestartet fÃ¼r: ${item.name}`);
  };
  const handleExportStory = (item: MediaItem) => {
    alert(`ï¿½Y"ï¿½ Story Export gestartet fÃ¼r: ${item.name}`);
  };
  const handleAddBranding = (item: MediaItem) => {
    // z. B. Editor Ã¶ffnen / Overlay aus Galerie wÃ¤hlen
    alert(`ï¿½oï¿½ Branding-Overlay fÃ¼r: ${item.name}`);
  };

  return (
    <div className="media-export-tools">
      <h2>ï¿½Ys? Export & Teilen</h2>

      {exportables.length === 0 && (
        <div className="export-empty">
          Keine Clips oder Screenshots vorhanden. Lade ein Medium hoch oder erstelle einen Clip.
        </div>
      )}

      <div className="export-list">
        {exportables.map((item) => (
          <div key={item.id ?? item.url} className="export-card">
            <div className="export-title">{item.name}</div>

            <div className="export-actions">
              {/* PRO: Transcoding fÃ¼r Export-Short */}
              <ProFeatureWrapper
                featureName="transcoding"
                message="Export in vertikales Short-Format (9:16) ist ein PRO-Feature."
              >
                <button type="button" onClick={() => handleExportShort(item)}>
                  Als TikTok-Short exportieren
                </button>
              </ProFeatureWrapper>

              {/* PRO: Transcoding fÃ¼r Story */}
              <ProFeatureWrapper
                featureName="transcoding"
                message="Story-Export (1080ï¿½-1920) ist ein PRO-Feature."
              >
                <button type="button" onClick={() => handleExportStory(item)}>
                  Als Story exportieren
                </button>
              </ProFeatureWrapper>

              {/* FREE: Link kopieren */}
              <button type="button" onClick={() => handleCopyLink(item)}>
                Link kopieren
              </button>

              {/* PRO: Branding (Overlay-Assets hochladen/nutzen) */}
              <ProFeatureWrapper
                featureName="overlay_upload"
                message="Eigene Branding-Overlays sind im PRO-Paket enthalten."
              >
                <button type="button" onClick={() => handleAddBranding(item)}>
                  Branding hinzufÃ¼gen
                </button>
              </ProFeatureWrapper>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaExportTools;
