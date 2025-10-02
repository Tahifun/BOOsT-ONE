import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MediaItem } from './MediaGrid';
import './MediaCard.css';

interface MediaCardProps {
  item: MediaItem;
  selected?: boolean;
  onSelect?: (event: React.MouseEvent) => void;
  onClick?: () => void;
  onAction?: (action: string, item: MediaItem) => void;
  showStats?: boolean;
  showActions?: boolean;
  viewMode?: 'grid' | 'list' | 'masonry';
  loaded?: boolean;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  selected = false,
  onSelect,
  onClick,
  onAction,
  showStats = true,
  showActions = true,
  viewMode = 'grid',
  loaded = false,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(loaded);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Preload image
  useEffect(() => {
    if (item.thumbnailUrl && !imageLoaded) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = item.thumbnailUrl;
    }
  }, [item.thumbnailUrl, imageLoaded]);

  // Close context menu on outside click / escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!cardRef.current) return;
      if (!cardRef.current.contains(e.target as Node)) setShowContextMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowContextMenu(false);
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === cardRef.current) {
        e.preventDefault();
        onClick?.();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClick]);

  // Helpers
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Heute';
    if (days === 1) return 'Gestern';
    if (days < 7) return `vor ${days} Tagen`;
    if (days < 30) return `vor ${Math.floor(days / 7)} Wochen`;
    if (days < 365) return `vor ${Math.floor(days / 30)} Monaten`;
    return `vor ${Math.floor(days / 365)} Jahren`;
  };

  const getTypeIcon = (type: MediaItem['type']): string => {
    switch (type) {
      case 'video': return '';
      case 'image': return '?';
      case 'audio': return '';
      case 'overlay': return '';
      default: return '';
    }
  };

  const getStatusColor = (status: MediaItem['status']): string => {
    switch (status) {
      case 'ready': return 'success';
      case 'processing': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // Video hover preview
  const handleMouseEnter = () => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (item.type === 'video' && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setShowContextMenu(false);
  };

  // Context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = Math.min(e.clientX - rect.left, rect.width - 190);
      const y = Math.min(e.clientY - rect.top, rect.height - 220);
      setContextMenuPosition({ x, y });
      setShowContextMenu(true);
    }
  };

  const handleAction = (action: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowContextMenu(false);
    onAction?.(action, item);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(e);
  };

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      // prevent accidental select-all propagation in grid context
      e.stopPropagation();
    }
  }, [onClick]);

  return (
    <div
      ref={cardRef}
      className={`media-card ${className} ${viewMode} ${selected ? 'selected' : ''} ${item.status}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={`${item.name} - ${getTypeIcon(item.type)}`}
      aria-selected={selected}
    >
      {/* Selection Checkbox */}
      {showActions && (
        <div className="card-selection">
          <input
            type="checkbox"
            className="selection-checkbox"
            checked={selected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${item.name} auswhlen`}
          />
        </div>
      )}

      {/* Media Preview */}
      <div className="card-preview">
        {!imageLoaded && (
          <div className="preview-skeleton">
            <div className="skeleton-shimmer" />
          </div>
        )}

        {item.thumbnailUrl && (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className={`preview-image ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy"
          />
        )}

        {item.type === 'video' && item.url && (
          <video
            ref={videoRef}
            src={item.url}
            className={`preview-video ${isPlaying ? 'playing' : ''}`}
            muted
            loop
            playsInline
          />
        )}

        {!item.thumbnailUrl && !item.url && (
          <div className="preview-placeholder">
            <span className="type-icon">{getTypeIcon(item.type)}</span>
          </div>
        )}

        {/* Overlay Elements */}
        <div className="card-overlay">
          {item.duration && <span className="duration-badge">{formatDuration(item.duration)}</span>}
          <span className="type-badge">{getTypeIcon(item.type)}</span>
          {item.status !== 'ready' && (
            <span className={`status-indicator ${getStatusColor(item.status)}`}>
              {item.status === 'processing' ? '?' : '?'}
            </span>
          )}
          {item.type === 'video' && !isPlaying && (
            <div className="play-button"><span>?</span></div>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="card-info">
        <h4 className="card-title" title={item.name}>{item.name}</h4>
        <div className="card-meta">
          <span className="meta-size">{formatFileSize(item.size)}</span>
          {item.dimensions && (
            <span className="meta-dimensions">
              {item.dimensions.width}{item.dimensions.height}
            </span>
          )}
          <span className="meta-date">{formatDate(item.createdAt)}</span>
        </div>

        {showStats && (item.views !== undefined || item.likes !== undefined) && (
          <div className="card-stats">
            {item.views !== undefined && (
              <span className="stat-item">
                <span className="stat-icon">?</span>
                <span className="stat-value">{item.views.toLocaleString()}</span>
              </span>
            )}
            {item.likes !== undefined && (
              <span className="stat-item">
                <span className="stat-icon">??</span>
                <span className="stat-value">{item.likes.toLocaleString()}</span>
              </span>
            )}
          </div>
        )}

        {item.tags.length > 0 && viewMode !== 'list' && (
          <div className="card-tags">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
            {item.tags.length > 3 && <span className="tag-more">+{item.tags.length - 3}</span>}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showActions && viewMode !== 'list' && (
        <div className="card-actions">
          <button className="action-btn" onClick={(e) => handleAction('share', e)} aria-label="Teilen" title="Teilen"></button>
          <button className="action-btn" onClick={(e) => handleAction('download', e)} aria-label="Download" title="Download">?</button>
          <button className="action-btn" onClick={(e) => handleAction('edit', e)} aria-label="Bearbeiten" title="Bearbeiten">?</button>
          <button className="action-btn danger" onClick={(e) => handleAction('delete', e)} aria-label="Lschen" title="Lschen">?</button>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="card-context-menu"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          role="menu"
        >
          <button onClick={(e) => handleAction('open', e)}><span></span> ffnen</button>
          <button onClick={(e) => handleAction('share', e)}><span></span> Teilen</button>
          <button onClick={(e) => handleAction('download', e)}><span>?</span> Download</button>
          <button onClick={(e) => handleAction('duplicate', e)}><span></span> Duplizieren</button>
          <div className="context-menu-divider" />
          <button onClick={(e) => handleAction('edit', e)}><span>?</span> Bearbeiten</button>
          <button onClick={(e) => handleAction('rename', e)}><span></span> Umbenennen</button>
          <button onClick={(e) => handleAction('tags', e)}><span>?</span> Tags bearbeiten</button>
          <div className="context-menu-divider" />
          <button onClick={(e) => handleAction('delete', e)} className="danger"><span>?</span> Lschen</button>
        </div>
      )}
    </div>
  );
};

