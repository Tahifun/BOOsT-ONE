// src/types/overlayTypes.ts

export interface QuantumState {
  realityLevel: number;
  consciousnessDepth: number;
  dimensionalPhase: 'stable' | 'flux' | 'transcendent' | 'impossible';
  temporalPosition: 'past' | 'present' | 'future' | 'all-time';
  emotionalResonance: EmotionalState;
  quantumEntanglement: Map<string, string[]>;
  realityDistortionField: number;
  dreamMode: boolean;
  userIntent: PredictedAction[];
  multiversalSync: boolean;
}

export interface EmotionalState {
  energy: number;
  focus: number;
  stress: number;
  satisfaction: number;
  creativity: number;
}

export interface PredictedAction {
  action: string;
  probability: number;
  timeframe: number;
}

export interface ConsciousWidget {
  id: string;
  key: string;
  name: string;
  icon: string;
  description: string;
  category: 'stats' | 'social' | 'analytics' | 'engagement';
  consciousness: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation: number;
  opacity: number;
  temporalPhase: 'past' | 'present' | 'future' | 'all-time';
  quantumEntangled: boolean;
  realityDistortion: number;
  emotionalResponse: EmotionalState;
  predictiveValue: number;
  settings: Record<string, any>;
  isActive: boolean;
  isPro: boolean;
}

export interface OverlayTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ConsciousWidget[];
  quantumState: QuantumState;
  created: Date;
  lastModified: Date;
  consciousness: number;
  author?: string;
  thumbnail?: string;
  tags: string[];
}

export interface DragState {
  isDragging: boolean;
  draggedWidget: ConsciousWidget | null;
  startPos: {
    x: number;
    y: number;
  };
  offset: {
    x: number;
    y: number;
  };
}

export interface WidgetTransition {
  type: 'realityShatter' | 'dimensionalFold' | 'timeReversal' | 'quantumLeap' | 
        'consciousnessMerge' | 'voidWalk' | 'memoryPalace';
  duration: number;
  intensity: number;
}

export interface QuantumEvent {
  id: string;
  timestamp: Date;
  type: 'consciousness_evolution' | 'reality_shift' | 'quantum_entanglement' | 
        'temporal_displacement' | 'emotional_resonance';
  source: string;
  target?: string;
  data: Record<string, any>;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  particleCount: number;
  widgetCount: number;
  consciousnessLevel: number;
}

export interface OverlayEditorState {
  widgets: ConsciousWidget[];
  selectedWidget: ConsciousWidget | null;
  quantumState: QuantumState;
  templates: OverlayTemplate[];
  currentTemplate: OverlayTemplate | null;
  viewMode: 'editor' | 'preview' | 'gallery';
  theme: 'epic' | 'classic';
  performance: PerformanceMetrics;
  events: QuantumEvent[];
}