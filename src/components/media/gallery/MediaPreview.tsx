import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from './MediaGrid';
import './MediaPreview.css';

interface MediaPreviewProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEdit?: (item: MediaItem) => void;
  onDownload?: (item: MediaItem) => void;
  onShare?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  className?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  item,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onEdit,
  onDownload,
  onShare,
  onDelete,
  hasNext = false,
  hasPrevious = false,
  className = ''
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when item changes
  useEffect(() => {
    if (item) {
      setIsZoomed(false);
      setZoomLevel(1);
      setIsPlaying(false);
    }
  }, [item]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (hasPrevious) onPrevious?.();
          break;
        case 'ArrowRight':
          if (hasNext) onNext?.();
          break;
        case ' ':
          e.preventDefault();
          if (item?.type === 'video' || item?.type === 'audio') {
            togglePlayPause();
          }
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'i':
        case 'I':
          setShowInfo(prev => !prev);
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasPrevious, hasNext, isFullscreen, item]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !item) return null;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format duration
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (item.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (item.type === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      exitFullscreen();
    }
  };

  // Exit fullscreen
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
    setIsZoomed(true);
  };

  const handleZoomOut = () => {
    const newLevel = Math.max(zoomLevel - 0.25, 1);
    setZoomLevel(newLevel);
    if (newLevel === 1) {
      setIsZoomed(false);
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
  };

  // Render media content
  const renderMediaContent = () => {
    switch (item.type) {
      case 'video':
        return (
          <video
            ref={videoRef}
            src={item.url}
            className="preview-video"
            controls={showInfo}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            style={{ transform: `scale(${zoomLevel})` }}
          />
        );
      
      case 'image':
        return (
          <img
            src={item.url}
            alt={item.name}
            className="preview-image"
            style={{ transform: `scale(${zoomLevel})` }}
            onDoubleClick={() => (isZoomed ? resetZoom() : handleZoomIn())}
          />
        );
      
      case 'audio':
        return (
          <div className="preview-audio">
            <div className="audio-visualization">
              <span className="audio-icon"></span>
              {isPlaying && (
                <div className="audio-waves">
                  <span className="wave wave-1" />
                  <span className="wave wave-2" />
                  <span className="wave wave-3" />
                  <span className="wave wave-4" />
                  <span className="wave wave-5" />
                </div>
              )}
            </div>
            <audio
              ref={audioRef}
              src={item.url}
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
        );
      
      default:
        return (
          <div className="preview-placeholder">
            <span className="placeholder-icon"></span>
            <p>{item.name}</p>
          </div>
        );
    }
  };

  return (
    <div className={`media-preview-overlay ${className}`} onClick={onClose}>
      <div
        ref={containerRef}
        className={`media-preview-container ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Vorschau fr ${item.name}`}
      >
        {/* Header */}
        <div className={`preview-header ${!showInfo ? 'hidden' : ''}`}>
          <h3 className="preview-title">{item.name}</h3>
          <div className="preview-header-actions">
            <button
              className="header-action"
              onClick={() => setShowActions(!showActions)}
              aria-label="Aktionen"
              type="button"
            >
              
            </button>
            <button
              className="header-action close"
              onClick={onClose}
              aria-label="Schlieen"
              type="button"
            >
              ?
            </button>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="preview-actions-menu">
            {onEdit && (
              <button onClick={() => onEdit(item)} type="button">
                <span>?</span> Bearbeiten
              </button>
            )}
            {onDownload && (
              <button onClick={() => onDownload(item)} type="button">
                <span>?</span> Download
              </button>
            )}
            {onShare && (
              <button onClick={() => onShare(item)} type="button">
                <span></span> Teilen
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(item)} className="danger" type="button">
                <span>?</span> Lschen
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="preview-content">
          {renderMediaContent()}
        </div>

        {/* Navigation */}
        {(hasPrevious || hasNext) && (
          <>
            {hasPrevious && (
              <button
                className="preview-nav prev"
                onClick={onPrevious}
                aria-label="Vorheriges"
                type="button"
              >
                <span></span>
              </button>
            )}
            {hasNext && (
              <button
                className="preview-nav next"
                onClick={onNext}
                aria-label="Nchstes"
                type="button"
              >
                <span></span>
              </button>
            )}
          </>
        )}

        {/* Controls */}
        <div className={`preview-controls ${!showInfo ? 'hidden' : ''}`}>
          {/* Media Controls */}
          {(item.type === 'video' || item.type === 'audio') && (
            <div className="media-controls">
              <button
                className="control-btn"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                type="button"
              >
                {isPlaying ? '??' : '?'}
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          {item.type === 'image' && (
            <div className="zoom-controls">
              <button
                className="control-btn"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                aria-label="Verkleinern"
                type="button"
              >
                <span></span>
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button
                className="control-btn"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                aria-label="Vergrern"
                type="button"
              >
                <span>+</span>
              </button>
              <button
                className="control-btn"
                onClick={resetZoom}
                disabled={zoomLevel === 1}
                aria-label="Zurcksetzen"
                type="button"
              >
                <span></span>
              </button>
            </div>
          )}

          {/* View Controls */}
          <div className="view-controls">
            <button
              className="control-btn"
              onClick={() => setShowInfo(!showInfo)}
              aria-label={showInfo ? 'Info ausblenden' : 'Info anzeigen'}
              type="button"
            >
              <span>?</span>
            </button>
            <button
              className="control-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Vollbild verlassen' : 'Vollbild'}
              type="button"
            >
              <span>{isFullscreen ? '' : ''}</span>
            </button>
          </div>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="preview-info">
            <div className="info-section">
              <h4>Details</h4>
              <dl className="info-list">
                <dt>Name:</dt>
                <dd>{item.name}</dd>
                
                <dt>Typ:</dt>
                <dd>{item.type}</dd>
                
                <dt>Gre:</dt>
                <dd>{formatFileSize(item.size)}</dd>
                
                {item.dimensions && (
                  <>
                    <dt>Abmessungen:</dt>
                    <dd>{item.dimensions.width}  {item.dimensions.height}</dd>
                  </>
                )}
                
                {item.duration && (
                  <>
                    <dt>Dauer:</dt>
                    <dd>{formatDuration(item.duration)}</dd>
                  </>
                )}
                
                <dt>Erstellt:</dt>
                <dd>{formatDate(item.createdAt)}</dd>
                
                <dt>Gendert:</dt>
                <dd>{formatDate(item.updatedAt)}</dd>
              </dl>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="info-section">
                <h4>Tags</h4>
                <div className="info-tags">
                  {item.tags.map(tag => (
                    <span key={tag} className="info-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            {(item.views !== undefined || item.likes !== undefined) && (
              <div className="info-section">
                <h4>Statistiken</h4>
                <div className="info-stats">
                  {item.views !== undefined && (
                    <div className="stat">
                      <span className="stat-icon">?</span>
                      <span className="stat-value">{item.views.toLocaleString()}</span>
                      <span className="stat-label">Aufrufe</span>
                    </div>
                  )}
                  {item.likes !== undefined && (
                    <div className="stat">
                      <span className="stat-icon">??</span>
                      <span className="stat-value">{item.likes.toLocaleString()}</span>
                      <span className="stat-label">Likes</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <div className="info-section">
                <h4>Metadaten</h4>
                <dl className="info-list">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <dt>{key}:</dt>
                      <dd>{String(value)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="preview-shortcuts" aria-hidden="true">
          <span>ESC: Schlieen</span>
          <span>/: Navigation</span>
          <span>F: Vollbild</span>
          <span>I: Info</span>
          {item.type === 'image' && <span>+/-: Zoom</span>}
          {(item.type === 'video' || item.type === 'audio') && <span>Space: Play/Pause</span>}
        </div>
      </div>
    </div>
  );
};

