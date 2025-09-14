import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Timeline.css';

export interface Marker {
  id: string;
  time: number;
  type: 'highlight' | 'comment' | 'chapter' | 'cut' | 'ai';
  label?: string;
  color?: string;
  data?: unknown;
}

export interface Selection {
  start: number;
  end: number;
}

interface TimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  markers?: Marker[];
  onMarkerAdd?: (time: number, type: Marker['type']) => void;
  onMarkerRemove?: (markerId: string) => void;
  onMarkerUpdate?: (markerId: string, marker: Partial<Marker>) => void;
  selection?: Selection | null;
  onSelectionChange?: (selection: Selection | null) => void;
  waveform?: number[];
  thumbnails?: { time: number; url: string }[];
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  snapToGrid?: boolean;
  gridSize?: number;
  showRuler?: boolean;
  showWaveform?: boolean;
  showThumbnails?: boolean;
  /** Optional: control toggles from outside. If not provided, component manages them internally. */
  onToggleRuler?: (next: boolean) => void;
  onToggleWaveform?: (next: boolean) => void;
  onToggleThumbnails?: (next: boolean) => void;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  markers = [],
  onMarkerAdd,
  onMarkerRemove,
  onMarkerUpdate,
  selection,
  onSelectionChange,
  waveform = [],
  thumbnails = [],
  zoom = 1,
  onZoomChange,
  snapToGrid = false,
  gridSize = 1,
  showRuler = true,
  showWaveform = true,
  showThumbnails = true,
  onToggleRuler,
  onToggleWaveform,
  onToggleThumbnails,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [resizingHandle, setResizingHandle] = useState<'left' | 'right' | null>(null);
  const [draggedMarker, setDraggedMarker] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; marker?: Marker } | null>(null);
  const [playheadAutoScroll, setPlayheadAutoScroll] = useState(true);

  // Internal fallback for view toggles if no external controller is provided
  const [localShowRuler, setLocalShowRuler] = useState(showRuler);
  const [localShowWaveform, setLocalShowWaveform] = useState(showWaveform);
  const [localShowThumbnails, setLocalShowThumbnails] = useState(showThumbnails);

  useEffect(() => setLocalShowRuler(showRuler), [showRuler]);
  useEffect(() => setLocalShowWaveform(showWaveform), [showWaveform]);
  useEffect(() => setLocalShowThumbnails(showThumbnails), [showThumbnails]);

  const effectiveShowRuler = onToggleRuler ? showRuler : localShowRuler;
  const effectiveShowWaveform = onToggleWaveform ? showWaveform : localShowWaveform;
  const effectiveShowThumbnails = onToggleThumbnails ? showThumbnails : localShowThumbnails;
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectionStartRef = useRef<number>(0);

  // Calculate timeline width based on zoom
  const timelineWidth = Math.max(1, duration * zoom * 10); // 10px per second at zoom 1

  // Format time display
  const formatTime = (seconds: number): string => {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const mins = Math.floor((safe % 3600) / 60);
    const secs = Math.floor(safe % 60);
    const frames = Math.floor((safe % 1) * 30); // Assuming 30fps
    
    if (duration >= 3600) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // Snap to grid if enabled
  const snapTime = useCallback((time: number): number => {
    if (!snapToGrid) return time;
    const gs = gridSize || 1;
    return Math.round(time / gs) * gs;
  }, [snapToGrid, gridSize]);

  // Convert position to time
  const positionToTime = useCallback((x: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const scrollLeft = scrollRef.current?.scrollLeft || 0;
    const relativeX = x - rect.left + scrollLeft;
    const time = (relativeX / timelineWidth) * duration;
    return snapTime(Math.max(0, Math.min(duration, time)));
  }, [duration, timelineWidth, snapTime]);

  // Convert time to position
  const timeToPosition = useCallback((time: number): number => {
    const clamped = Math.max(0, Math.min(duration, time));
    return (clamped / duration) * timelineWidth;
  }, [duration, timelineWidth]);

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (isDragging || isSelecting || draggedMarker) return;
    const time = positionToTime(e.clientX);
    onSeek(time);
  };

  // Handle selection
  const handleSelectionStart = (e: React.MouseEvent) => {
    if (!onSelectionChange) return;
    e.preventDefault();
    e.stopPropagation();
    
    const time = positionToTime(e.clientX);
    selectionStartRef.current = time;
    setIsSelecting(true);
    setResizingHandle(null);
    onSelectionChange({ start: time, end: time });
  };

  const handleSelectionMove = useCallback((e: MouseEvent) => {
    if (!isSelecting || !onSelectionChange) return;
    const time = positionToTime(e.clientX);

    if (resizingHandle && selection) {
      // Resize existing selection from the grabbed handle
      if (resizingHandle === 'left') {
        const start = Math.min(time, selection.end);
        const end = Math.max(time, selection.end);
        onSelectionChange({ start, end });
      } else {
        const start = Math.min(selection.start, time);
        const end = Math.max(selection.start, time);
        onSelectionChange({ start, end });
      }
      return;
    }

    const start = Math.min(selectionStartRef.current, time);
    const end = Math.max(selectionStartRef.current, time);
    onSelectionChange({ start, end });
  }, [isSelecting, onSelectionChange, positionToTime, resizingHandle, selection]);

  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false);
    setResizingHandle(null);
  }, []);

  // Handle playhead drag
  const handlePlayheadDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePlayheadMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const time = positionToTime(e.clientX);
    onSeek(time);
  }, [isDragging, positionToTime, onSeek]);

  const handlePlayheadEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle marker drag
  const handleMarkerDrag = (e: React.MouseEvent, markerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedMarker(markerId);
  };

  const handleMarkerMove = useCallback((e: MouseEvent) => {
    if (!draggedMarker || !onMarkerUpdate) return;
    const time = positionToTime(e.clientX);
    onMarkerUpdate(draggedMarker, { time });
  }, [draggedMarker, onMarkerUpdate, positionToTime]);

  const handleMarkerEnd = useCallback(() => {
    setDraggedMarker(null);
  }, []);

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, marker?: Marker) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, marker });
  };

  // Handle zoom
  const handleZoom = (delta: number) => {
    if (!onZoomChange) return;
    const newZoom = Math.max(0.1, Math.min(10, (zoom || 1) + delta));
    onZoomChange(newZoom);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleZoom(-e.deltaY * 0.001);
    }
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePlayheadMove);
      document.addEventListener('mouseup', handlePlayheadEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handlePlayheadMove);
      document.removeEventListener('mouseup', handlePlayheadEnd);
    };
  }, [isDragging, handlePlayheadMove, handlePlayheadEnd]);

  useEffect(() => {
    if (isSelecting || resizingHandle) {
      document.addEventListener('mousemove', handleSelectionMove);
      document.addEventListener('mouseup', handleSelectionEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleSelectionMove);
      document.removeEventListener('mouseup', handleSelectionEnd);
    };
  }, [isSelecting, resizingHandle, handleSelectionMove, handleSelectionEnd]);

  useEffect(() => {
    if (draggedMarker) {
      document.addEventListener('mousemove', handleMarkerMove);
      document.addEventListener('mouseup', handleMarkerEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMarkerMove);
      document.removeEventListener('mouseup', handleMarkerEnd);
    };
  }, [draggedMarker, handleMarkerMove, handleMarkerEnd]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside, { once: true });
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  // Auto-scroll to keep playhead in view
  useEffect(() => {
    if (!scrollRef.current || !playheadAutoScroll) return;
    const scrollContainer = scrollRef.current;
    const playheadPosition = timeToPosition(currentTime);
    const scrollLeft = scrollContainer.scrollLeft;
    const viewport = scrollContainer.clientWidth;
    if (playheadPosition < scrollLeft + 50) {
      scrollContainer.scrollLeft = Math.max(0, playheadPosition - 50);
    } else if (playheadPosition > scrollLeft + viewport - 50) {
      scrollContainer.scrollLeft = Math.max(0, playheadPosition - viewport + 50);
    }
  }, [currentTime, timeToPosition, playheadAutoScroll]);

  // Generate ruler marks
  const generateRulerMarks = () => {
    const marks = [];
    const interval = zoom && zoom < 0.5 ? 10 : (zoom && zoom < 2 ? 5 : 1);
    const ceil = Math.ceil(duration);
    for (let i = 0; i <= ceil; i += interval) {
      marks.push(
        <div
          key={i}
          className="ruler-mark"
          style={{ left: timeToPosition(i) }}
        >
          <span className="ruler-time">{formatTime(i)}</span>
        </div>
      );
    }
    return marks;
  };

  // Get marker icon
  const getMarkerIcon = (type: Marker['type']): string => {
    switch (type) {
      case 'highlight': return '⭐';
      case 'comment': return '💬';
      case 'chapter': return '📑';
      case 'cut': return '✂️';
      case 'ai': return '🤖';
      default: return '📍';
    }
  };

  const handleToggleRuler = () => {
    if (onToggleRuler) onToggleRuler(!showRuler);
    else setLocalShowRuler((s) => !s);
  };
  const handleToggleWaveform = () => {
    if (onToggleWaveform) onToggleWaveform(!showWaveform);
    else setLocalShowWaveform((s) => !s);
  };
  const handleToggleThumbnails = () => {
    if (onToggleThumbnails) onToggleThumbnails(!showThumbnails);
    else setLocalShowThumbnails((s) => !s);
  };

  return (
    <div 
      ref={timelineRef}
      className={`timeline ${className} ${isDragging ? 'dragging' : ''}`}
      onWheel={handleWheel}
    >
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-info">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="separator">/</span>
          <span className="total-time">{formatTime(duration)}</span>
        </div>
        
        <div className="timeline-controls">
          {/* Zoom Controls */}
          {onZoomChange && (
            <div className="zoom-controls">
              <button
                className="zoom-btn"
                onClick={() => handleZoom(-0.2)}
                aria-label="Zoom out"
                type="button"
              >
                −
              </button>
              <span className="zoom-level">{Math.round((zoom || 1) * 100)}%</span>
              <button
                className="zoom-btn"
                onClick={() => handleZoom(0.2)}
                aria-label="Zoom in"
                type="button"
              >
                +
              </button>
              <button
                className="zoom-btn"
                onClick={() => onZoomChange?.(1)}
                aria-label="Reset zoom"
                type="button"
              >
                ⟲
              </button>
            </div>
          )}
          
          {/* View Options */}
          <div className="view-options">
            <button
              className={`view-btn ${effectiveShowRuler ? 'active' : ''}`}
              onClick={handleToggleRuler}
              aria-label="Toggle ruler"
              type="button"
              title="Lineal umschalten"
            >
              📏
            </button>
            <button
              className={`view-btn ${effectiveShowWaveform ? 'active' : ''}`}
              onClick={handleToggleWaveform}
              aria-label="Toggle waveform"
              type="button"
              title="Waveform umschalten"
            >
              〰️
            </button>
            <button
              className={`view-btn ${effectiveShowThumbnails ? 'active' : ''}`}
              onClick={handleToggleThumbnails}
              aria-label="Toggle thumbnails"
              type="button"
              title="Thumbnails umschalten"
            >
              🖼️
            </button>
            <button
              className={`view-btn ${playheadAutoScroll ? 'active' : ''}`}
              onClick={() => setPlayheadAutoScroll((s) => !s)}
              aria-label="Autoscroll Playhead"
              type="button"
              title="Playhead-Autoscroll umschalten"
            >
              🧭
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Scroll Container */}
      <div ref={scrollRef} className="timeline-scroll">
        <div className="timeline-content" style={{ width: timelineWidth }}>
          {/* Ruler */}
          {effectiveShowRuler && (
            <div className="timeline-ruler" aria-hidden="true">
              {generateRulerMarks()}
            </div>
          )}

          {/* Thumbnails Track */}
          {effectiveShowThumbnails && thumbnails.length > 0 && (
            <div className="timeline-thumbnails">
              {thumbnails.map((thumb, index) => (
                <img
                  key={index}
                  src={thumb.url}
                  alt={`Frame at ${formatTime(thumb.time)}`}
                  className="thumbnail"
                  style={{
                    left: timeToPosition(thumb.time),
                    width: timelineWidth / thumbnails.length
                  }}
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {/* Waveform */}
          {effectiveShowWaveform && waveform.length > 0 && (
            <div className="timeline-waveform">
              <svg width={timelineWidth} height="60" aria-hidden="true">
                {waveform.map((amplitude, index) => {
                  const x = (index / waveform.length) * timelineWidth;
                  const height = Math.max(0, Math.min(1, amplitude)) * 30;
                  return (
                    <rect
                      key={index}
                      x={x}
                      y={30 - height / 2}
                      width={timelineWidth / waveform.length}
                      height={height}
                      fill="url(#waveformGradient)"
                      opacity={0.7}
                    />
                  );
                })}
                <defs>
                  <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}

          {/* Main Track */}
          <div 
            ref={trackRef}
            className="timeline-track"
            onClick={handleTimelineClick}
            onMouseDown={handleSelectionStart}
            onMouseMove={(e) => setHoveredTime(positionToTime(e.clientX))}
            onMouseLeave={() => setHoveredTime(null)}
            onContextMenu={(e) => handleContextMenu(e)}
            role="application"
            aria-label="Zeitachse"
          >
            {/* Grid Lines */}
            {snapToGrid && (
              <div className="timeline-grid" aria-hidden="true">
                {Array.from({ length: Math.floor(duration / (gridSize || 1)) }).map((_, i) => (
                  <div
                    key={i}
                    className="grid-line"
                    style={{ left: timeToPosition(i * (gridSize || 1)) }}
                  />
                ))}
              </div>
            )}

            {/* Selection */}
            {selection && (
              <div
                className="timeline-selection"
                style={{
                  left: timeToPosition(selection.start),
                  width: timeToPosition(selection.end - selection.start)
                }}
              >
                <div
                  className="selection-handle left"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsSelecting(true);
                    setResizingHandle('left');
                  }}
                  title="Bereich vergrößern/verkleinern"
                />
                <div
                  className="selection-handle right"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsSelecting(true);
                    setResizingHandle('right');
                  }}
                  title="Bereich vergrößern/verkleinern"
                />
              </div>
            )}

            {/* Markers */}
            {markers.map(marker => (
              <div
                key={marker.id}
                className={`timeline-marker ${marker.type} ${hoveredMarker === marker.id ? 'hovered' : ''}`}
                style={{
                  left: timeToPosition(marker.time),
                  color: marker.color || undefined
                }}
                data-marker-id={marker.id}
                onMouseDown={(e) => handleMarkerDrag(e, marker.id)}
                onMouseEnter={() => setHoveredMarker(marker.id)}
                onMouseLeave={() => setHoveredMarker(null)}
                onContextMenu={(e) => handleContextMenu(e, marker)}
                role="button"
                aria-label={marker.label || marker.type}
                title={marker.label || `${marker.type} @ ${formatTime(marker.time)}`}
              >
                <span className="marker-icon">{getMarkerIcon(marker.type)}</span>
                {marker.label && (
                  <span className="marker-label">{marker.label}</span>
                )}
              </div>
            ))}

            {/* Hover Indicator */}
            {hoveredTime !== null && (
              <div
                className="timeline-hover"
                style={{ left: timeToPosition(hoveredTime) }}
              >
                <span className="hover-time">{formatTime(hoveredTime)}</span>
              </div>
            )}

            {/* Playhead */}
            <div
              className="timeline-playhead"
              style={{ left: timeToPosition(currentTime) }}
              onMouseDown={handlePlayheadDrag}
              role="slider"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-label="Abspielposition"
            >
              <div className="playhead-line" />
              <div className="playhead-handle" />
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="timeline-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          {contextMenu.marker ? (
            <>
              <button type="button" onClick={() => {
                // Placeholder for edit UI
                setContextMenu(null);
              }}>
                ✏️ Bearbeiten
              </button>
              <button type="button" onClick={() => {
                onMarkerRemove?.(contextMenu.marker!.id);
                setContextMenu(null);
              }}>
                🗑️ Löschen
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => {
                const time = positionToTime(contextMenu.x);
                onMarkerAdd?.(time, 'highlight');
                setContextMenu(null);
              }}>
                ⭐ Highlight hinzufügen
              </button>
              <button type="button" onClick={() => {
                const time = positionToTime(contextMenu.x);
                onMarkerAdd?.(time, 'comment');
                setContextMenu(null);
              }}>
                💬 Kommentar hinzufügen
              </button>
              <button type="button" onClick={() => {
                const time = positionToTime(contextMenu.x);
                onMarkerAdd?.(time, 'chapter');
                setContextMenu(null);
              }}>
                📑 Kapitel hinzufügen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
