import { logger } from '@/lib/logger';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { 
  Flag, MessageCircle, Sparkles, Music, Heart,
  Zap, Activity, TrendingUp, Star, Award, Target, Flame,
  Brain, Eye, Mic, Camera, Film, Hash, ChevronDown,
  Edit3, Trash2, Copy, Lock, Unlock, Palette, Volume2
} from 'lucide-react';
import './MarkerSystem.css';

// Revolutionary Marker Types with Advanced Properties
interface MarkerSystemProps {
  markers: Marker[];
  currentTime: number;
  duration: number;
  onMarkersChange: (markers: Marker[]) => void;
  onTimeChange: (time: number) => void;
  audioWaveform?: Float32Array;
  videoFrames?: VideoFrame[];
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
  | 'highlight' 
  | 'chapter' 
  | 'comment' 
  | 'ai' 
  | 'beat' 
  | 'emotion' 
  | 'action'
  | 'peak'
  | 'transition'
  | 'speech'
  | 'silence'
  | 'applause'
  | 'laughter'
  | 'music-start'
  | 'music-end'
  | 'scene-change'
  | 'face-detected'
  | 'object-detected'
  | 'text-overlay'
  | 'color-shift'
  | 'motion-peak'
  | 'custom';

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

interface EmotionScores {
  joy: number;
  surprise: number;
  anger: number;
  sadness: number;
  fear: number;
  disgust: number;
  neutral: number;
}

interface MarkerAnimation {
  type: 'pulse' | 'glow' | 'bounce' | 'ripple' | 'spiral';
  duration: number;
  intensity: number;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isActive: boolean;
}

interface AIAnalysisData {
  peaks: TimePoint[];
  emotions: EmotionPoint[];
  scenes: ScenePoint[];
  audio: AudioPoint[];
}

interface TimePoint {
  time: number;
  value: number;
  type: string;
}

interface EmotionPoint {
  time: number;
  emotion: string;
  confidence: number;
}

interface ScenePoint {
  start: number;
  end: number;
  type: string;
  confidence: number;
}

interface AudioPoint {
  time: number;
  type: 'speech' | 'music' | 'silence' | 'applause';
  confidence: number;
}

interface VideoFrame {
  time: number;
  thumbnail: string;
  motion: number;
  brightness: number;
}

// Quantum Marker Physics Engine
class MarkerPhysicsEngine {
  private markers: Map<string, PhysicsMarker> = new Map();
  private forces: Force[] = [];
  
  addMarker(marker: Marker) {
    this.markers.set(marker.id, {
      ...marker,
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      mass: 1,
      charge: marker.intensity || 1
    });
  }
  
  applyMagneticField(center: number, strength: number) {
    this.forces.push({
      type: 'magnetic',
      center,
      strength,
      falloff: 2
    });
  }
  
  simulate(deltaTime: number) {
    this.markers.forEach(marker => {
      // Apply forces
      this.forces.forEach(force => {
        const distance = Math.abs(marker.time - force.center);
        const magnitude = force.strength / Math.pow(distance + 1, force.falloff);
        marker.acceleration.x += magnitude * Math.sign(force.center - marker.time);
      });
      
      // Update physics
      marker.velocity.x += marker.acceleration.x * deltaTime;
      marker.velocity.x *= 0.95; // Damping
      marker.time += marker.velocity.x * deltaTime;
      
      // Reset acceleration
      marker.acceleration.x = 0;
    });
  }
}

interface PhysicsMarker extends Marker {
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  mass: number;
  charge: number;
}

interface Force {
  type: 'magnetic' | 'gravity' | 'spring';
  center: number;
  strength: number;
  falloff: number;
}

// Neural Pattern Recognition for Markers
class MarkerPatternRecognizer {
  private patterns: Map<string, Pattern> = new Map();
  private neuralWeights: Float32Array;
  
  constructor() {
    this.neuralWeights = new Float32Array(1024);
    this.initializePatterns();
  }
  
  private initializePatterns() {
    this.patterns.set('rhythm', {
      id: 'rhythm',
      signature: [1, 0, 1, 0, 1, 0, 1, 0],
      confidence: 0.8
    });
    
    this.patterns.set('crescendo', {
      id: 'crescendo',
      signature: [0.2, 0.4, 0.6, 0.8, 1.0],
      confidence: 0.75
    });
    
    this.patterns.set('dialogue', {
      id: 'dialogue',
      signature: [0.8, 0.2, 0.9, 0.1, 0.7, 0.3],
      confidence: 0.85
    });
  }
  
  recognizePattern(markers: Marker[]): RecognizedPattern | null {
    const intensitySignature = markers.map(m => m.intensity || 0);
    
    let bestMatch: RecognizedPattern | null = null;
    let highestScore = 0;
    
    this.patterns.forEach(pattern => {
      const score = this.calculateSimilarity(intensitySignature, pattern.signature);
      if (score > highestScore && score > pattern.confidence) {
        highestScore = score;
        bestMatch = {
          patternId: pattern.id,
          score,
          markers: markers.map(m => m.id),
          suggestion: this.generateSuggestion(pattern.id)
        };
      }
    });
    
    return bestMatch;
  }
  
  private calculateSimilarity(sig1: number[], sig2: number[]): number {
    // Simplified cosine similarity
    const minLength = Math.min(sig1.length, sig2.length);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < minLength; i++) {
      dotProduct += sig1[i] * sig2[i];
      norm1 += sig1[i] * sig1[i];
      norm2 += sig2[i] * sig2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  private generateSuggestion(patternId: string): string {
    const suggestions: Record<string, string> = {
      rhythm: 'Consider adding beat markers for perfect sync',
      crescendo: 'This build-up could benefit from a climax marker',
      dialogue: 'Add chapter markers to separate conversation segments'
    };
    return suggestions[patternId] || 'Pattern detected';
  }
}

interface Pattern {
  id: string;
  signature: number[];
  confidence: number;
}

interface RecognizedPattern {
  patternId: string;
  score: number;
  markers: string[];
  suggestion: string;
}

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
  // Advanced State Management
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [editingMarker, setEditingMarker] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MarkerType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'graph' | '3d'>('timeline');
  const [magneticMode, setMagneticMode] = useState(true);
  const [autoDetect, setAutoDetect] = useState(false);
  const [showGhostMarkers, setShowGhostMarkers] = useState(true);
  const [markerGroups, setMarkerGroups] = useState<Map<string, string[]>>(new Map());
  const [patternDetected, setPatternDetected] = useState<RecognizedPattern | null>(null);
  
  // Revolutionary Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const physicsEngine = useRef(new MarkerPhysicsEngine());
  const patternRecognizer = useRef(new MarkerPatternRecognizer());
  const audioAnalyzer = useRef<AnalyserNode | null>(null);
  const collaborationChannel = useRef<BroadcastChannel | null>(null);
  
  // Motion Values for Smooth Animations
  const timelineScroll = useMotionValue(0);
  const zoomLevel = useMotionValue(1);
  const markerScale = useTransform(zoomLevel, [0.5, 2], [0.8, 1.2]);
  
  // Spring Physics for Natural Motion
  const springConfig = { stiffness: 300, damping: 30 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);
  
  // Initialize Advanced Systems
  useEffect(() => {
    initializePhysicsEngine();
    initializeAudioAnalyzer();
    initializeCollaboration();
    return () => cleanupSystems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Real-time Pattern Detection
  useEffect(() => {
    if (markers.length > 2) {
      const pattern = patternRecognizer.current.recognizePattern(markers);
      setPatternDetected(pattern);
    }
  }, [markers]);
  
  // Auto-Detection System
  useEffect(() => {
    if (autoDetect && aiAnalysis) {
      const detectedMarkers = generateAutoMarkers(aiAnalysis);
      const newMarkers = [...markers, ...detectedMarkers];
      onMarkersChange(newMarkers);
    }
  }, [autoDetect, aiAnalysis, markers, onMarkersChange]);
  
  const initializePhysicsEngine = () => {
    markers.forEach(marker => {
      physicsEngine.current.addMarker(marker);
    });
    
    if (magneticMode) {
      physicsEngine.current.applyMagneticField(currentTime, 0.5);
    }
  };
  
  const initializeAudioAnalyzer = () => {
    if ('AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioAnalyzer.current = audioContext.createAnalyser();
      audioAnalyzer.current.fftSize = 2048;
    }
  };
  
  const initializeCollaboration = () => {
    if ('BroadcastChannel' in window) {
      collaborationChannel.current = new BroadcastChannel('marker-collaboration');
      collaborationChannel.current.onmessage = handleCollaborationMessage;
    }
  };
  
  const cleanupSystems = () => {
    collaborationChannel.current?.close();
  };
  
  const handleCollaborationMessage = (event: MessageEvent) => {
    const { type, data } = (event as any).data || {};
    if (type === 'marker-added') {
      onMarkersChange([...markers, data]);
    } else if (type === 'marker-updated') {
      const updated = markers.map(m => m.id === data.id ? { ...m, ...data } : m);
      onMarkersChange(updated);
    }
  };
  
  // Generate AI-Powered Auto Markers
  const generateAutoMarkers = (analysis: AIAnalysisData): Marker[] => {
    const autoMarkers: Marker[] = [];
    
    // Peak Detection Markers
    analysis.peaks.forEach((peak, i) => {
      autoMarkers.push({
        id: `auto-peak-${i}`,
        time: peak.time,
        type: 'peak',
        label: `Peak ${i + 1}`,
        color: '#ff6b6b',
        intensity: peak.value,
        confidence: 0.9,
        metadata: {
          audioLevel: peak.value,
          priority: Math.round(peak.value * 10)
        }
      });
    });
    
    // Emotion Markers
    analysis.emotions.forEach((emotion, i) => {
      autoMarkers.push({
        id: `auto-emotion-${i}`,
        time: emotion.time,
        type: 'emotion',
        label: emotion.emotion,
        color: getEmotionColor(emotion.emotion),
        confidence: emotion.confidence,
        metadata: {
          description: `${emotion.emotion} detected`,
          priority: 5
        }
      });
    });
    
    // Scene Change Markers
    analysis.scenes.forEach((scene, i) => {
      autoMarkers.push({
        id: `auto-scene-${i}`,
        time: scene.start,
        type: 'scene-change',
        label: `Scene ${i + 1}`,
        color: '#4ecdc4',
        duration: scene.end - scene.start,
        confidence: scene.confidence,
        metadata: {
          description: scene.type,
          priority: 7
        }
      });
    });
    
    return autoMarkers;
  };
  
  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      joy: '#ffd93d',
      surprise: '#ff6bcb',
      anger: '#ff4757',
      sadness: '#5f7cff',
      fear: '#747d8c',
      disgust: '#7bed9f',
      neutral: '#a4b0be'
    };
    return colors[emotion] || '#ffffff';
  };
  
  // Advanced Marker Operations
  const addMarker = useCallback((time: number, type: MarkerType) => {
    const newMarker: Marker = {
      id: `marker-${Date.now()}-${Math.random()}`,
      time: magneticMode ? snapToNearestFrame(time) : time,
      type,
      label: `${type} marker`,
      color: getMarkerColor(type),
      intensity: 0.5,
      created: new Date(),
      author: 'Current User',
      animation: {
        type: 'ripple',
        duration: 1000,
        intensity: 0.8
      }
    };
    
    onMarkersChange([...markers, newMarker]);
    
    // Broadcast to collaborators
    collaborationChannel.current?.postMessage({
      type: 'marker-added',
      data: newMarker
    });
    
    // Trigger haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [markers, magneticMode, onMarkersChange]);
  
  const updateMarker = useCallback((id: string, updates: Partial<Marker>) => {
    const updated = markers.map(m => 
      m.id === id ? { ...m, ...updates, modified: new Date() } : m
    );
    onMarkersChange(updated);
    
    collaborationChannel.current?.postMessage({
      type: 'marker-updated',
      data: { id, ...updates }
    });
  }, [markers, onMarkersChange]);
  
  const deleteMarker = useCallback((id: string) => {
    const marker = markers.find(m => m.id === id);
    if (marker?.locked) {
      showLockedWarning();
      return;
    }
    
    onMarkersChange(markers.filter(m => m.id !== id));
    
    collaborationChannel.current?.postMessage({
      type: 'marker-deleted',
      data: { id }
    });
  }, [markers, onMarkersChange]);
  
  const groupMarkers = useCallback((markerIds: string[], groupName: string) => {
    const newGroups = new Map(markerGroups);
    newGroups.set(groupName, markerIds);
    setMarkerGroups(newGroups);
  }, [markerGroups]);
  
  const snapToNearestFrame = (time: number): number => {
    const frameRate = 30; // Assuming 30fps
    const frameDuration = 1 / frameRate;
    return Math.round(time / frameDuration) * frameDuration;
  };
  
  const showLockedWarning = () => {
    // Show warning animation
    logger.debug('This marker is locked and cannot be deleted');
  };
  
  const getMarkerColor = (type: MarkerType): string => {
    const colorMap: Record<MarkerType, string> = {
      highlight: '#ffd93d',
      chapter: '#6c5ce7',
      comment: '#00b894',
      ai: '#00cec9',
      beat: '#ff6348',
      emotion: '#fd79a8',
      action: '#fdcb6e',
      peak: '#e17055',
      transition: '#74b9ff',
      speech: '#a29bfe',
      silence: '#636e72',
      applause: '#fab1a0',
      laughter: '#ffeaa7',
      'music-start': '#ff7675',
      'music-end': '#d63031',
      'scene-change': '#00d2d3',
      'face-detected': '#54a0ff',
      'object-detected': '#48dbfb',
      'text-overlay': '#f39c12',
      'color-shift': '#e74c3c',
      'motion-peak': '#9b59b6',
      custom: '#95a5a6'
    };
    return colorMap[type] || '#ffffff';
  };
  
  const getMarkerIcon = (type: MarkerType) => {
    const iconMap: Record<MarkerType, JSX.Element> = {
      highlight: <Star />,
      chapter: <Flag />,
      comment: <MessageCircle />,
      ai: <Brain />,
      beat: <Music />,
      emotion: <Heart />,
      action: <Zap />,
      peak: <TrendingUp />,
      transition: <Activity />,
      speech: <Mic />,
      silence: <Volume2 />,
      applause: <Award />,
      laughter: <Target />,
      'music-start': <Music />,
      'music-end': <Music />,
      'scene-change': <Camera />,
      'face-detected': <Eye />,
      'object-detected': <Film />,
      'text-overlay': <Hash />,
      'color-shift': <Palette />,
      'motion-peak': <Flame />,
      custom: <Sparkles />
    };
    return iconMap[type] || <Flag />;
  };
  
  // Render Methods for Different View Modes
  const renderTimelineView = () => (
    <div className="marker-timeline-view">
      <div className="timeline-ruler">
        {renderTimeRuler()}
      </div>
      <div className="marker-tracks">
        {renderMarkerTracks()}
      </div>
      <div className="marker-lane">
        {markers
          .filter(m => filterType === 'all' || m.type === filterType)
          .map(marker => renderTimelineMarker(marker))}
      </div>
      {showGhostMarkers && renderGhostMarkers()}
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
      animate={{ 
        scale: hoveredMarker === marker.id ? 1.2 : 1,
        opacity: 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setHoveredMarker(marker.id)}
      onMouseLeave={() => setHoveredMarker(null)}
      onClick={() => setSelectedMarker(marker)}
      onDoubleClick={() => onTimeChange(marker.time)}
    >
      <div 
        className="marker-flag"
        style={{ backgroundColor: marker.color }}
      >
        {getMarkerIcon(marker.type)}
      </div>
      {marker.duration && (
        <div 
          className="marker-duration"
          style={{ width: `${(marker.duration / duration) * 100}%` }}
        />
      )}
      {hoveredMarker === marker.id && (
        <motion.div 
          className="marker-tooltip"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="tooltip-header">
            <span className="tooltip-type">{marker.type}</span>
            <span className="tooltip-time">{formatTime(marker.time)}</span>
          </div>
          <div className="tooltip-label">{marker.label}</div>
          {marker.metadata?.description && (
            <div className="tooltip-description">{marker.metadata.description}</div>
          )}
          {typeof marker.confidence === 'number' && (
            <div className="tooltip-confidence">
              Confidence: {Math.round(marker.confidence * 100)}%
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
  
  const renderTimeRuler = () => {
    const ticks = [];
    const tickInterval = duration / 20; // 20 major ticks
    
    for (let i = 0; i <= 20; i++) {
      const time = i * tickInterval;
      ticks.push(
        <div key={i} className="ruler-tick" style={{ left: `${(i / 20) * 100}%` }}>
          <div className="tick-mark" />
          <div className="tick-label">{formatTime(time)}</div>
        </div>
      );
    }
    
    return ticks;
  };
  
  const renderMarkerTracks = () => {
    const tracks: MarkerType[] = ['highlight', 'chapter', 'ai', 'beat', 'emotion'];
    return tracks.map(track => (
      <div key={track} className={`marker-track track-${track}`}>
        <div className="track-label">{track}</div>
        <div className="track-line" />
      </div>
    ));
  };
  
  const renderGhostMarkers = () => {
    if (!aiAnalysis) return null;
    
    return aiAnalysis.peaks.map((peak, i) => (
      <motion.div
        key={`ghost-${i}`}
        className="ghost-marker"
        style={{ left: `${(peak.time / duration) * 100}%` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        whileHover={{ opacity: 0.6 }}
        onClick={() => addMarker(peak.time, 'peak')}
      >
        <div className="ghost-indicator" />
      </motion.div>
    ));
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
          .map(marker => renderListItem(marker))}
      </div>
    </div>
  );
  
  const renderListItem = (marker: Marker) => (
    <motion.div
      key={marker.id}
      className={`list-item ${selectedMarker?.id === marker.id ? 'selected' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      onClick={() => setSelectedMarker(marker)}
    >
      <div className="list-cell time-cell">
        <button onClick={() => onTimeChange(marker.time)}>
          {formatTime(marker.time)}
        </button>
      </div>
      <div className="list-cell type-cell">
        <span className="type-badge" style={{ backgroundColor: marker.color }}>
          {getMarkerIcon(marker.type)}
          {marker.type}
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
      <div className="list-cell author-cell">
        {marker.author || 'Unknown'}
      </div>
      <div className="list-cell actions-cell">
        <button 
          className="action-btn"
          onClick={() => setEditingMarker(marker.id)}
        >
          <Edit3 />
        </button>
        <button 
          className="action-btn"
          onClick={() => duplicateMarker(marker)}
        >
          <Copy />
        </button>
        <button 
          className="action-btn"
          onClick={() => updateMarker(marker.id, { locked: !marker.locked })}
        >
          {marker.locked ? <Lock /> : <Unlock />}
        </button>
        <button 
          className="action-btn delete"
          onClick={() => deleteMarker(marker.id)}
        >
          <Trash2 />
        </button>
      </div>
    </motion.div>
  );
  
  const renderGraphView = () => (
    <div className="marker-graph-view">
      <canvas ref={canvasRef} className="graph-canvas" />
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
      <div className="three-d-container">
        {/* 3D visualization would be implemented here with Three.js */}
        <div className="three-d-placeholder">
          <Sparkles className="icon-3d" />
          <p>3D Visualization Mode</p>
          <p className="subtitle">Experience markers in spatial dimension</p>
        </div>
      </div>
    </div>
  );
  
  // Helper Functions
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  const duplicateMarker = (marker: Marker) => {
    const duplicate = {
      ...marker,
      id: `marker-${Date.now()}-copy`,
      time: marker.time + 0.5,
      label: `${marker.label} (copy)`,
      created: new Date()
    };
    onMarkersChange([...markers, duplicate]);
  };
  
  const getMarkerStats = () => {
    const stats: Record<string, number> = {};
    markers.forEach(marker => {
      stats[marker.type] = (stats[marker.type] || 0) + 1;
    });
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
              <span className="pattern-score">{Math.round(patternDetected.score * 100)}%</span>
            </motion.div>
          )}
        </div>
        
        <div className="header-center">
          <div className="view-mode-switcher">
            {(['timeline', 'list', 'graph', '3d'] as const).map(mode => (
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
              {Array.from(new Set(markers.map(m => m.type))).map(type => (
                <option key={type} value={type}>{type}</option>
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
                onChange={(e) => updateMarker(selectedMarker.id, { label: e.target.value })}
              />
            </div>
            <div className="detail-row">
              <label>Color:</label>
              <input 
                type="color"
                value={selectedMarker.color}
                onChange={(e) => updateMarker(selectedMarker.id, { color: e.target.value })}
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
            {selectedMarker.metadata?.description !== undefined ? (
              <div className="detail-row">
                <label>Description:</label>
                <textarea
                  value={selectedMarker.metadata.description}
                  onChange={(e) => updateMarker(selectedMarker.id, {
                    metadata: { ...selectedMarker.metadata, description: e.target.value }
                  })}
                />
              </div>
            ) : (
              <div className="detail-row">
                <label>Description:</label>
                <textarea
                  placeholder="Add a description."
                  onChange={(e) => updateMarker(selectedMarker.id, {
                    metadata: { ...(selectedMarker.metadata || {}), description: e.target.value }
                  })}
                />
              </div>
            )}
            <div className="detail-row">
              <label>Locked:</label>
              <button
                className="toggle-lock"
                onClick={() => updateMarker(selectedMarker.id, { locked: !selectedMarker.locked })}
              >
                {selectedMarker.locked ? <Lock /> : <Unlock />}
              </button>
            </div>
            <div className="detail-actions">
              <button className="btn-duplicate" onClick={() => duplicateMarker(selectedMarker)}>
                <Copy /> Duplicate
              </button>
              <button className="btn-delete" onClick={() => deleteMarker(selectedMarker.id)}>
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
