import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { 
  Flag, MessageCircle, Sparkles, Music, Heart,
  Zap, Activity, TrendingUp, Star, Award, Target,
  Brain, Eye, Mic, Camera, Film, Hash, ChevronDown,
  Edit3, Trash2, Copy, Lock, Unlock, Palette, Volume2
} from 'lucide-react';

// ---------- Props & Types ----------
interface MarkerSystemProps {
  markers: Marker[];
  currentTime: number;
  duration: number;
  onMarkersChange: (markers: Marker[]) => void;
  onTimeChange: (time: number) => void;
  audioWaveform?: Float32Array;
  videoFrames?: AnalyzedFrame[];
  collaborators?: Collaborator[];
  aiAnalysis?: AIAnalysisData;
}

interface Marker {
  id: string;
  time: number;
  type: MarkerType;
  label: string;
  color: string;
  intensity?: number;
  confidence?: number;
  metadata?: MarkerMetadata;
  locked?: boolean;
  author?: string;
  created?: Date;
  modified?: Date;
  tags?: string[];
  duration?: number;
  linkedMarkers?: string[];
  animation?: MarkerAnimation;
}

type MarkerType = 
  | 'highlight' | 'chapter' | 'comment' | 'ai' | 'beat' | 'emotion' | 'action'
  | 'peak' | 'transition' | 'speech' | 'silence' | 'applause' | 'laughter'
  | 'music-start' | 'music-end' | 'scene-change' | 'face-detected' | 'object-detected'
  | 'text-overlay' | 'color-shift' | 'motion-peak' | 'custom';

interface MarkerMetadata {
  description?: string;
  priority?: number;
  visibility?: 'public' | 'private' | 'team';
  exportable?: boolean;
  audioLevel?: number;
  motionIntensity?: number;
  emotionScores?: EmotionScores;
  objectsDetected?: string[];
  transcript?: string;
  customData?: unknown;
}

interface EmotionScores { joy: number; surprise: number; anger: number; sadness: number; fear: number; disgust: number; neutral: number; }

interface MarkerAnimation { type: 'pulse' | 'glow' | 'bounce' | 'ripple' | 'spiral'; duration: number; intensity: number; }

interface Collaborator { id: string; name: string; avatar: string; color: string; isActive: boolean; }

interface AIAnalysisData { peaks: TimePoint[]; emotions: EmotionPoint[]; scenes: ScenePoint[]; audio: AudioPoint[]; }
interface TimePoint { time: number; value: number; type: string; }
interface EmotionPoint { time: number; emotion: string; confidence: number; }
interface ScenePoint { start: number; end: number; type: string; confidence: number; }
interface AudioPoint { time: number; type: 'speech' | 'music' | 'silence' | 'applause'; confidence: number; }

interface AnalyzedFrame { time: number; thumbnail: string; motion: number; brightness: number; } // renamed from VideoFrame to avoid DOM collision

// ---------- Utils (physics stubs, pattern rec.) ----------
class MarkerPhysicsEngine {
  addMarker(_: Marker) {}
  applyMagneticField(_: number, __: number) {}
}
class MarkerPatternRecognizer {
  recognizePattern(_: Marker[]): { patternId: string; score: number } | null {
    return null;
  }
}

// ---------- Component ----------
const MarkerSystem: React.FC<MarkerSystemProps> = ({
  markers,
  currentTime,
  duration,
  onMarkersChange,
  onTimeChange,
  audioWaveform,
  videoFrames,
  collaborators = [],
  aiAnalysis
}) => {
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [editingMarker, setEditingMarker] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MarkerType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'graph' | '3d'>('timeline');
  const [magneticMode, setMagneticMode] = useState(true);
  const [autoDetect, setAutoDetect] = useState(false);
  const [showGhostMarkers, setShowGhostMarkers] = useState(true);
  const [patternDetected, setPatternDetected] = useState<{ patternId: string; score: number } | null>(null);

  const physicsEngine = useRef(new MarkerPhysicsEngine());
  const patternRecognizer = useRef(new MarkerPatternRecognizer());
  const collaborationChannel = useRef<BroadcastChannel | null>(null);

  // Motion values (placeholders for future UI polish)
  const timelineScroll = useMotionValue(0);
  const zoomLevel = useMotionValue(1);
  const markerScale = useTransform(zoomLevel, [0.5, 2], [0.8, 1.2]);
  const cursorX = useSpring(0, { stiffness: 300, damping: 30 });
  const cursorY = useSpring(0, { stiffness: 300, damping: 30 });

  useEffect(() => {
    if ('BroadcastChannel' in window) {
      collaborationChannel.current = new BroadcastChannel('marker-collaboration');
      collaborationChannel.current.onmessage = handleCollaborationMessage;
    }
    return () => collaborationChannel.current?.close();
  }, []);

  useEffect(() => {
    if (markers.length > 2) {
      const p = patternRecognizer.current.recognizePattern(markers);
      if (p) setPatternDetected(p);
      else setPatternDetected(null);
    } else {
      setPatternDetected(null);
    }
  }, [markers]);

  // Auto markers (optional)
  useEffect(() => {
    if (!autoDetect || !aiAnalysis) return;
    const detected = generateAutoMarkers(aiAnalysis);
    if (detected.length) onMarkersChange([...markers, ...detected]);
  }, [autoDetect, aiAnalysis]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCollaborationMessage = (event: MessageEvent) => {
    const { type, data } = event.data || {};
    if (type === 'marker-added') onMarkersChange([...markers, data]);
    if (type === 'marker-updated') onMarkersChange(markers.map(m => (m.id === data.id ? { ...m, ...data } : m)));
    if (type === 'marker-deleted') onMarkersChange(markers.filter(m => m.id !== data.id));
  };

  // ----- Generate AI markers from analysis -----
  const generateAutoMarkers = (analysis: AIAnalysisData): Marker[] => {
    const autos: Marker[] = [];
    analysis.peaks?.forEach((p, i) => autos.push({
      id: `auto-peak-${i}`, time: p.time, type: 'peak', label: `Peak ${i+1}`,
      color: '#ff6b6b', intensity: p.value, confidence: 0.9,
      metadata: { audioLevel: p.value, priority: Math.round(p.value * 10) }
    }));
    analysis.emotions?.forEach((e, i) => autos.push({
      id: `auto-emotion-${i}`, time: e.time, type: 'emotion', label: e.emotion,
      color: getEmotionColor(e.emotion), confidence: e.confidence,
      metadata: { description: `${e.emotion} detected`, priority: 5 }
    }));
    analysis.scenes?.forEach((s, i) => autos.push({
      id: `auto-scene-${i}`, time: s.start, type: 'scene-change', label: `Scene ${i+1}`,
      color: '#4ecdc4', duration: s.end - s.start, confidence: s.confidence,
      metadata: { description: s.type, priority: 7 }
    }));
    return autos;
  };

  const getEmotionColor = (emotion: string) => ({
    joy: '#ffd93d', surprise: '#ff6bcb', anger: '#ff4757', sadness: '#5f7cff',
    fear: '#747d8c', disgust: '#7bed9f', neutral: '#a4b0be'
  } as Record<string,string>)[emotion] || '#ffffff';

  // ----- CRUD -----
  const addMarker = useCallback((time: number, type: MarkerType) => {
    const m: Marker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      time,
      type,
      label: `${type} marker`,
      color: getMarkerColor(type),
      intensity: 0.5,
      created: new Date(),
      author: 'Current User',
      animation: { type: 'ripple', duration: 1000, intensity: 0.8 }
    };
    onMarkersChange([...markers, m]);
    collaborationChannel.current?.postMessage({ type: 'marker-added', data: m });
    (navigator as any).vibrate?.(50);
  }, [markers, onMarkersChange]);

  const updateMarker = useCallback((id: string, updates: Partial<Marker>) => {
    const updated = markers.map(m => (m.id === id ? { ...m, ...updates, modified: new Date() } : m));
    onMarkersChange(updated);
    collaborationChannel.current?.postMessage({ type: 'marker-updated', data: { id, ...updates } });
  }, [markers, onMarkersChange]);

  const deleteMarker = useCallback((id: string) => {
    const marker = markers.find(m => m.id === id);
    if (marker?.locked) {
      console.warn('Marker locked - cannot delete');
      return;
    }
    onMarkersChange(markers.filter(m => m.id !== id));
    collaborationChannel.current?.postMessage({ type: 'marker-deleted', data: { id } });
  }, [markers, onMarkersChange]);

  const duplicateMarker = (marker: Marker) => {
    const copy: Marker = { ...marker, id: `marker-${Date.now()}-copy`, time: marker.time + 0.5, label: `${marker.label} (copy)`, created: new Date() };
    onMarkersChange([...markers, copy]);
  };

  // ----- UI helpers -----
  const getMarkerColor = (type: MarkerType): string => ({
    highlight: '#ffd93d', chapter: '#6c5ce7', comment: '#00b894', ai: '#00cec9', beat: '#ff6348',
    emotion: '#fd79a8', action: '#fdcb6e', peak: '#e17055', transition: '#74b9ff', speech: '#a29bfe',
    silence: '#636e72', applause: '#fab1a0', laughter: '#ffeaa7', 'music-start': '#ff7675', 'music-end': '#d63031',
    'scene-change': '#00d2d3', 'face-detected': '#54a0ff', 'object-detected': '#48dbfb', 'text-overlay': '#f39c12',
    'color-shift': '#e74c3c', 'motion-peak': '#9b59b6', custom: '#95a5a6'
  } as Record<MarkerType, string>)[type];

  const getMarkerIcon = (type: MarkerType) => {
    const map: Record<MarkerType, JSX.Element> = {
      highlight: <Star/>, chapter: <Flag/>, comment: <MessageCircle/>, ai: <Brain/>, beat: <Music/>, emotion: <Heart/>,
      action: <Zap/>, peak: <TrendingUp/>, transition: <Activity/>, speech: <Mic/>, silence: <Volume2/>, applause: <Award/>,
      laughter: <Target/>, 'music-start': <Music/>, 'music-end': <Music/>, 'scene-change': <Camera/>, 'face-detected': <Eye/>,
      'object-detected': <Film/>, 'text-overlay': <Hash/>, 'color-shift': <Palette/>, 'motion-peak': <Zap/>, custom: <Sparkles/>
    };
    return map[type] ?? <Flag/>;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
  };

  // ----- Renders -----
  const renderTimelineView = () => (
    <div className="marker-timeline-view">
      <div className="timeline-ruler">{renderTimeRuler()}</div>
      <div className="marker-lane">
        {markers
          .filter(m => filterType === 'all' || m.type === filterType)
          .map(marker => renderTimelineMarker(marker))}
      </div>
      <div className="playhead-indicator" style={{ left: `${(currentTime / duration) * 100}%` }}>
        <div className="playhead-line" />
        <div className="playhead-time">{formatTime(currentTime)}</div>
      </div>
    </div>
  );

  const renderTimelineMarker = (marker: Marker) => (
    <motion.div
      key={marker.id}
      className={`timeline-marker ${marker.type} ${selectedMarker?.id === marker.id ? 'selected' : ''}`}
      style={{ left: `${(marker.time / duration) * 100}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: hoveredMarker === marker.id ? 1.2 : 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setHoveredMarker(marker.id)}
      onMouseLeave={() => setHoveredMarker(null)}
      onClick={() => setSelectedMarker(marker)}
      onDoubleClick={() => onTimeChange(marker.time)}
    >
      <div className="marker-flag" style={{ backgroundColor: marker.color }}>
        {getMarkerIcon(marker.type)}
      </div>
      {marker.duration && (
        <div className="marker-duration" style={{ width: `${(marker.duration / duration) * 100}%` }} />
      )}
      {hoveredMarker === marker.id && (
        <motion.div className="marker-tooltip" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="tooltip-header">
            <span className="tooltip-type">{marker.type}</span>
            <span className="tooltip-time">{formatTime(marker.time)}</span>
          </div>
          <div className="tooltip-label">{marker.label}</div>
          {marker.metadata?.description && <div className="tooltip-description">{marker.metadata.description}</div>}
          {marker.confidence && (
            <div className="tooltip-confidence">Confidence: {Math.round(marker.confidence * 100)}%</div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  const renderTimeRuler = () => {
    const ticks = 20;
    return Array.from({ length: ticks + 1 }).map((_, i) => {
      const time = (i / ticks) * duration;
      return (
        <div key={i} className="ruler-tick" style={{ left: `${(i / ticks) * 100}%` }}>
          <div className="tick-mark" />
          <div className="tick-label">{formatTime(time)}</div>
        </div>
      );
    });
  };

  const renderListView = () => (
    <div className="marker-list-view">
      <div className="list-header">
        <div className="header-cell">Time</div>
        <div className="header-cell">Type</div>
        <div className="header-cell">Label</div>
        <div className="header-cell">Author</div>
        <div className="header-cell">Actions</div>
      </div>
      <div className="list-body">
        {markers
          .filter(m => filterType === 'all' || m.type === filterType)
          .sort((a, b) => a.time - b.time)
          .map(marker => (
            <motion.div
              key={marker.id}
              className={`list-item ${selectedMarker?.id === marker.id ? 'selected' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => setSelectedMarker(marker)}
            >
              <div className="list-cell time-cell">
                <button onClick={() => onTimeChange(marker.time)}>{formatTime(marker.time)}</button>
              </div>
              <div className="list-cell type-cell">
                <span className="type-badge" style={{ backgroundColor: marker.color }}>
                  {getMarkerIcon(marker.type)}{marker.type}
                </span>
              </div>
              <div className="list-cell label-cell">
                {editingMarker === marker.id ? (
                  <input
                    type="text"
                    value={marker.label}
                    onChange={(e) => updateMarker(marker.id, { label: e.target.value })}
                    onBlur={() => setEditingMarker(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingMarker(null)}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => setEditingMarker(marker.id)}>{marker.label}</span>
                )}
              </div>
              <div className="list-cell author-cell">{marker.author || 'Unknown'}</div>
              <div className="list-cell actions-cell">
                <button className="action-btn" onClick={() => setEditingMarker(marker.id)}><Edit3/></button>
                <button className="action-btn" onClick={() => duplicateMarker(marker)}><Copy/></button>
                <button className="action-btn" onClick={() => updateMarker(marker.id, { locked: !marker.locked })}>
                  {marker.locked ? <Lock/> : <Unlock/>}
                </button>
                <button className="action-btn delete" onClick={() => deleteMarker(marker.id)}><Trash2/></button>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );

  const renderGraphView = () => (
    <div className="marker-graph-view">
      {/* Platzhalter f�r k�nftige Canvas/Charts */}
      <div className="graph-legend">
        {Object.entries(getMarkerStats()).map(([type, count]) => (
          <div key={type} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: getMarkerColor(type as MarkerType) }} />
            <span className="legend-label">{type}: {count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const render3DView = () => (
    <div className="marker-3d-view">
      <div className="three-d-placeholder">
        <Sparkles className="icon-3d" />
        <p>3D Visualization Mode</p>
        <p className="subtitle">Experience markers in spatial dimension</p>
      </div>
    </div>
  );

  const getMarkerStats = () => {
    const stats: Record<string, number> = {};
    markers.forEach(m => { stats[m.type] = (stats[m.type] || 0) + 1; });
    return stats;
  };

  // ----- Render -----
return (
  <div className="marker-system-container">
    <div className="marker-system-header">
      <div className="header-left">
        <h3>Advanced Marker System</h3>
        {patternDetected && (
          <motion.div
            className="pattern-detected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Brain className="pattern-icon" />
            <span>Pattern: {patternDetected.patternId}</span>
            <span className="pattern-score">
              {Math.round(patternDetected.score * 100)}%
            </span>
          </motion.div>
        )}
      </div>

      <div className="header-center">
        <div className="view-mode-switcher">
          {(['timeline', 'list', 'graph', '3d'] as const).map((mode) => (
            <button
              key={mode}
              className={`view-mode-btn ${viewMode === mode ? 'active' : ''}`}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="header-right">
        <div className="filter-dropdown">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            {Array.from(new Set(markers.map((m) => m.type))).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown className="dropdown-icon" />
        </div>

        <button
          className={`toggle-btn ${magneticMode ? 'active' : ''}`}
          onClick={() => setMagneticMode(!magneticMode)}
        >
          <Zap /> Magnetic
        </button>

        <button
          className={`toggle-btn ${autoDetect ? 'active' : ''}`}
          onClick={() => setAutoDetect(!autoDetect)}
        >
          <Brain /> Auto-Detect
        </button>

        <button
          className={`toggle-btn ${showGhostMarkers ? 'active' : ''}`}
          onClick={() => setShowGhostMarkers(!showGhostMarkers)}
        >
          <Eye /> Ghosts
        </button>
      </div>
    </div>

    <div className="marker-system-body">
      <AnimatePresence mode="wait">
        {viewMode === 'timeline' && renderTimelineView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'graph' && renderGraphView()}
        {viewMode === '3d' && render3DView()}
      </AnimatePresence>
    </div>

    {selectedMarker && (
      <motion.div
        className="marker-details-panel"
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
      >
        <div className="details-header">
          <h4>Marker Details</h4>
          <button onClick={() => setSelectedMarker(null)}>�</button>
        </div>

        <div className="details-content">
          <div className="detail-row">
            <label>Type:</label>
            <span>{selectedMarker.type}</span>
          </div>

          <div className="detail-row">
            <label>Time:</label>
            <span>{formatTime(selectedMarker.time)}</span>
          </div>

          <div className="detail-row">
            <label>Label:</label>
            <input
              value={selectedMarker.label}
              onChange={(e) =>
                updateMarker(selectedMarker.id, { label: e.target.value })
              }
            />
          </div>

          <div className="detail-row">
            <label>Color:</label>
            <input
              type="color"
              value={selectedMarker.color}
              onChange={(e) =>
                updateMarker(selectedMarker.id, { color: e.target.value })
              }
            />
          </div>

          {typeof selectedMarker.confidence === 'number' && (
            <div className="detail-row">
              <label>Confidence:</label>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: `${selectedMarker.confidence * 100}%` }}
                />
                <span>{Math.round(selectedMarker.confidence * 100)}%</span>
              </div>
            </div>
          )}

          <div className="detail-row">
            <label>Locked:</label>
            <button
              className="toggle-lock"
              onClick={() =>
                updateMarker(selectedMarker.id, {
                  locked: !selectedMarker.locked,
                })
              }
            >
              {selectedMarker.locked ? <Lock /> : <Unlock />}
            </button>
          </div>

          {selectedMarker.metadata?.description !== undefined ? (
            <div className="detail-row">
              <label>Description:</label>
              <textarea
                value={selectedMarker.metadata.description}
                onChange={(e) =>
                  updateMarker(selectedMarker.id, {
                    metadata: {
                      ...selectedMarker.metadata,
                      description: e.target.value,
                    },
                  })
                }
              />
            </div>
          ) : (
            <div className="detail-row">
              <label>Description:</label>
              <textarea
                placeholder="Add a description."
                onChange={(e) =>
                  updateMarker(selectedMarker.id, {
                    metadata: { ...(selectedMarker.metadata || {}), description: e.target.value },
                  })
                }
              />
            </div>
          )}

          <div className="detail-actions">
            <button
              className="btn-duplicate"
              onClick={() => duplicateMarker(selectedMarker)}
            >
              <Copy /> Duplicate
            </button>
            <button
              className="btn-delete"
              onClick={() => deleteMarker(selectedMarker.id)}
            >
              <Trash2 /> Delete
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </div>
);

};

export default MarkerSystem;
