import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Layers, Zap, Film, Type, Circle, Square, Triangle, Star,
  Play, Pause, RotateCcw, Save, Download, Upload, Copy, Trash2,
  Eye, EyeOff, Lock, Unlock, Sliders, Wand2, TrendingUp, Activity, Brain
} from 'lucide-react';

/* ===========================
   Types
   =========================== */

interface TransitionEffectsProps {
  duration: number;
  selectedRange: [number, number];
  onEffectApply: (effect: LayerEffect) => void;
  currentTime?: number;
  preview?: boolean;
  layers?: Layer[];
  onLayersChange?: (layers: Layer[]) => void;
  renderEngine?: 'webgl' | 'canvas' | 'svg';
  collaborators?: Collaborator[];
  aiSuggestions?: AISuggestion[];
}

interface Layer {
  id: string;
  type: LayerType;
  name: string;
  effect: LayerEffect;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  timeline: Timeline;
  keyframes: Keyframe[];
  masks: Mask[];
  filters: Filter[];
  parent?: string;
  children?: string[];
  metadata: LayerMetadata;
}

type LayerType =
  | 'transition'
  | 'fade'
  | 'speedramp'
  | 'text'
  | 'shape'
  | 'particle'
  | 'glitch'
  | 'morph'
  | 'warp'
  | 'fractal'
  | 'quantum'
  | 'neural'
  | 'hologram'
  | 'dimension'
  | 'portal';

interface LayerEffect {
  id: string;
  type: EffectType;
  parameters: EffectParameters;
  duration: number;
  easing: EasingFunction;
  preview?: string;
  gpu?: boolean;
}

type EffectType =
  | 'fade-in'
  | 'fade-out'
  | 'cross-fade'
  | 'dip-to-black'
  | 'dip-to-white'
  | 'speed-ramp'
  | 'time-freeze'
  | 'time-reverse'
  | 'motion-blur'
  | 'gaussian-blur'
  | 'chromatic-aberration'
  | 'glitch-digital'
  | 'glitch-analog'
  | 'warp-space'
  | 'warp-time'
  | 'morph-liquid'
  | 'morph-crystal'
  | 'particle-explosion'
  | 'particle-implosion'
  | 'quantum-tunnel'
  | 'neural-dream'
  | 'hologram-scan'
  | 'dimension-shift'
  | 'portal-open'
  | 'text-typewriter'
  | 'text-scramble'
  | 'text-matrix'
  | 'text-3d';

interface EffectParameters {
  intensity?: number;
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down' | 'center' | 'random';
  color?: string;
  gradient?: GradientStop[];
  curve?: BezierCurve;
  noise?: NoiseParameters;
  particles?: ParticleParameters;
  text?: TextParameters;
  custom?: unknown;
}

interface Timeline {
  start: number;
  end: number;
  offset: number;
  loop?: boolean;
  reverse?: boolean;
  pingPong?: boolean;
}

interface Keyframe {
  time: number;
  value: unknown;
  easing: EasingFunction;
  interpolation: 'linear' | 'bezier' | 'step' | 'quantum';
}

interface Mask {
  type: 'rectangle' | 'ellipse' | 'polygon' | 'path' | 'alpha';
  points?: Point[];
  invert?: boolean;
  feather?: number;
  expand?: number;
}

interface Filter {
  type: string;
  value: unknown;
  animated?: boolean;
}

interface LayerMetadata {
  created: Date;
  modified: Date;
  author: string;
  tags: string[];
  version: number;
  ai?: boolean;
}

type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier'
  | 'spring'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'quantum';

interface GradientStop {
  color: string;
  position: number;
}

interface BezierCurve {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

interface Point {
  x: number;
  y: number;
}

interface NoiseParameters {
  frequency: number;
  amplitude: number;
  octaves: number;
  seed: number;
}

interface ParticleParameters {
  count: number;
  size: number;
  speed: number;
  spread: number;
  gravity: number;
  turbulence: number;
  color: string[];
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'custom';
  emitter: 'point' | 'line' | 'circle' | 'rectangle';
}

interface TextParameters {
  content: string;
  font: string;
  size: number;
  weight: number;
  color: string;
  stroke?: string;
  shadow?: Shadow;
  animation?: TextAnimation;
}

interface Shadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

interface TextAnimation {
  type: 'typewriter' | 'scramble' | 'wave' | 'glitch' | 'matrix';
  speed: number;
  delay: number;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
  selectedLayer?: string;
}

interface AISuggestion {
  effect: EffectType;
  confidence: number;
  reason: string;
  preview?: string;
}

/* ===========================
   Engines / Systems (safe stubs)
   =========================== */

class QuantumRenderEngine {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  initialize(canvas: HTMLCanvasElement): boolean {
    this.canvas = canvas;
    this.gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      canvas.getContext('webgl');
    if (!this.gl) {
      console.warn('WebGL not supported, falling back to canvas');
      return false;
    }
    // shader/framebuffer setup would go here
    return true;
  }
}

class NeuralEffectPredictor {
  // Simple mock predictor
  predictEffect(): AISuggestion[] {
    const candidates: EffectType[] = [
      'fade-in',
      'fade-out',
      'glitch-digital',
      'quantum-tunnel',
      'morph-liquid',
    ];
    return candidates.map((c, i) => ({
      effect: c,
      confidence: 0.9 - i * 0.1,
      reason:
        c === 'fade-in'
          ? 'Smooth entrance for new scene'
          : c === 'fade-out'
          ? 'Clean exit from current scene'
          : c === 'glitch-digital'
          ? 'Adds energy to action sequence'
          : c === 'quantum-tunnel'
          ? 'Creates sci-fi atmosphere'
          : 'Organic transition between elements',
      preview: undefined,
    }));
  }
}

/* ===========================
   Particle System (canvas)
   =========================== */

class ParticleSystem {
  private particles: Particle[] = [];
  private forces: Force[] = [];
  private maxParticles = 10000;

  addForce(force: Force): void {
    this.forces.push(force);
  }

  update(deltaTime: number): void {
    // Update existing particles
    this.particles = this.particles
      .map((p) => {
        // Apply forces
        this.forces.forEach((f) => this.applyForce(p, f));
        // Integrate
        p.velocity.x += p.acceleration.x * deltaTime;
        p.velocity.y += p.acceleration.y * deltaTime;
        p.position.x += p.velocity.x * deltaTime;
        p.position.y += p.velocity.y * deltaTime;
        // Lifetime
        p.lifetime -= deltaTime;
        p.opacity = Math.max(0, p.lifetime / p.maxLifetime);
        // Reset accel
        p.acceleration = { x: 0, y: 0 };
        return p;
      })
      .filter((p) => p.lifetime > 0);
  }

  spawnBurst(center: Point, params: ParticleParameters): void {
    const n = Math.min(params.count, this.maxParticles - this.particles.length);
    for (let i = 0; i < n; i++) {
      const angle = (Math.random() * params.spread * Math.PI) / 180;
      const speed = params.speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        id: `p-${Date.now()}-${i}`,
        position: { ...center },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        acceleration: { x: 0, y: 0 },
        size: params.size * (0.5 + Math.random() * 0.5),
        color: params.color[Math.floor(Math.random() * params.color.length)],
        opacity: 1,
        lifetime: 1.5,
        maxLifetime: 1.5,
        shape: params.shape === 'custom' ? 'circle' : params.shape,
      });
    }
  }

  private applyForce(p: Particle, f: Force) {
    switch (f.type) {
      case 'gravity':
        p.acceleration.y += f.strength;
        break;
      case 'wind':
        p.acceleration.x += f.strength;
        break;
      case 'turbulence':
        p.acceleration.x += (Math.random() - 0.5) * f.strength;
        p.acceleration.y += (Math.random() - 0.5) * f.strength;
        break;
      case 'attraction':
        if (!f.position) break;
        const dx = f.position.x - p.position.x;
        const dy = f.position.y - p.position.y;
        const d = Math.hypot(dx, dy) || 1;
        p.acceleration.x += (dx / d) * f.strength;
        p.acceleration.y += (dy / d) * f.strength;
        break;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'square':
          ctx.fillRect(
            p.position.x - p.size / 2,
            p.position.y - p.size / 2,
            p.size,
            p.size
          );
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(p.position.x, p.position.y - p.size);
          ctx.lineTo(p.position.x - p.size, p.position.y + p.size);
          ctx.lineTo(p.position.x + p.size, p.position.y + p.size);
          ctx.closePath();
          ctx.fill();
          break;
        case 'star':
          // simple star as two triangles
          ctx.beginPath();
          ctx.moveTo(p.position.x, p.position.y - p.size);
          ctx.lineTo(p.position.x - p.size, p.position.y + p.size);
          ctx.lineTo(p.position.x + p.size, p.position.y + p.size);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.position.x, p.position.y + p.size);
          ctx.lineTo(p.position.x - p.size, p.position.y - p.size);
          ctx.lineTo(p.position.x + p.size, p.position.y - p.size);
          ctx.closePath();
          ctx.fill();
          break;
      }
      ctx.restore();
    });
  }
}

interface Particle {
  id: string;
  position: Point;
  velocity: Point;
  acceleration: Point;
  size: number;
  color: string;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
  shape: 'circle' | 'square' | 'triangle' | 'star';
}

interface Force {
  type: 'gravity' | 'wind' | 'turbulence' | 'attraction';
  strength: number;
  position?: Point;
}

/* ===========================
   Component
   =========================== */

const TransitionEffects: React.FC<TransitionEffectsProps> = ({
  duration,
  selectedRange,
  onEffectApply,
  currentTime = 0,
  preview = true,
  layers: initialLayers = [],
  onLayersChange,
  renderEngine = 'canvas',
  collaborators = [],
  aiSuggestions = [],
}) => {
  // State
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [soloLayer, setSoloLayer] = useState<string | null>(null);
  const [previewQuality, setPreviewQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Params
  const [fadeParams, setFadeParams] = useState({
    intensity: 1,
    curve: 'ease-in-out' as EasingFunction,
    color: '#000000',
  });

  const [speedRampParams, setSpeedRampParams] = useState({
    startSpeed: 1,
    endSpeed: 2,
    curve: 'cubic-bezier' as EasingFunction,
    smoothness: 0.5,
  });

  const [textParams, setTextParams] = useState<TextParameters>({
    content: 'TRANSITION',
    font: 'Arial',
    size: 48,
    weight: 700,
    color: '#ffffff',
    animation: {
      type: 'typewriter',
      speed: 100,
      delay: 0,
    },
  });

  const [particleParams, setParticleParams] = useState<ParticleParameters>({
    count: 300,
    size: 3,
    speed: 120,
    spread: 360,
    gravity: 98,
    turbulence: 0.5,
    color: ['#00ffcc', '#ff00ff', '#ffff00'],
    shape: 'circle',
    emitter: 'point',
  });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const quantumEngine = useRef(new QuantumRenderEngine());
  const predictor = useRef(new NeuralEffectPredictor());
  const particles = useRef(new ParticleSystem());
  const rafRef = useRef<number | null>(null);

  // Init
  useEffect(() => {
    if (canvasRef.current && renderEngine === 'webgl') {
      quantumEngine.current.initialize(canvasRef.current);
    }
  }, [renderEngine]);

  // Play loop
  useEffect(() => {
    if (!preview) return;
    if (isPlaying) {
      const loop = (t: number) => {
        drawPreview(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, preview, layers, soloLayer, particleParams]);

  // Simple AI suggestions demo (optional usage)
  const getAISuggestions = (): AISuggestion[] =>
    aiSuggestions.length ? aiSuggestions : predictor.current.predictEffect();

  /* ===========================
     Helpers
     =========================== */

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const applyEasing = (t: number, easing: EasingFunction): number => {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'bounce':
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) {
          t -= 1.5 / 2.75;
          return 7.5625 * t * t + 0.75;
        }
        if (t < 2.5 / 2.75) {
          t -= 2.25 / 2.75;
          return 7.5625 * t * t + 0.9375;
        }
        t -= 2.625 / 2.75;
        return 7.5625 * t * t + 0.984375;
      case 'elastic':
        return Math.sin((-13 * Math.PI) / 2 * (t + 1)) * Math.pow(2, -10 * t) + 1;
      case 'quantum': {
        const w1 = Math.sin(t * Math.PI * 2);
        const w2 = Math.sin(t * Math.PI * 4);
        return t + w1 * w2 * 0.1;
      }
      default:
        return t;
    }
  };

  const interpolateKeyframes = (keyframes: Keyframe[], time: number): unknown => {
    if (!keyframes.length) return null;
    if (keyframes.length === 1) return keyframes[0].value;

    let before = keyframes[0];
    let after = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        before = keyframes[i];
        after = keyframes[i + 1];
        break;
      }
    }

    const t = (time - before.time) / Math.max(1e-6, after.time - before.time);
    const e = applyEasing(Math.min(1, Math.max(0, t)), before.easing);

    return {
      x: lerp(before.value.x ?? 0, after.value.x ?? 0, e),
      y: lerp(before.value.y ?? 0, after.value.y ?? 0, e),
      rotation: lerp(before.value.rotation ?? 0, after.value.rotation ?? 0, e),
      scaleX: lerp(before.value.scaleX ?? 1, after.value.scaleX ?? 1, e),
      scaleY: lerp(before.value.scaleY ?? 1, after.value.scaleY ?? 1, e),
    };
  };

  /* ===========================
     Rendering
     =========================== */

  const drawPreview = (timestamp: number) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layers
    layers
      .filter((l) => l.visible && (!soloLayer || soloLayer === l.id))
      .forEach((layer) => renderLayer(ctx, layer, timestamp));

    // Particles
    particles.current.update(0.016);
    particles.current.render(ctx);
  };

  const renderLayer = (
    ctx: CanvasRenderingContext2D,
    layer: Layer,
    timestamp: number
  ) => {
    ctx.save();

    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = (layer.blendMode as GlobalCompositeOperation) || 'source-over';

    const transform = interpolateKeyframes(layer.keyframes, timestamp * 0.001);
    if (transform) {
      ctx.translate(transform.x || 0, transform.y || 0);
      ctx.rotate(((transform.rotation || 0) * Math.PI) / 180);
      ctx.scale(transform.scaleX || 1, transform.scaleY || 1);
    }

    switch (layer.type) {
      case 'fade':
        renderFadeEffect(ctx, layer);
        break;
      case 'text':
        renderTextEffect(ctx, layer);
        break;
      case 'particle':
        renderParticleEffect(layer);
        break;
      case 'glitch':
        renderGlitchEffect(ctx, layer);
        break;
      case 'quantum':
        renderQuantumEffect(ctx);
        break;
      default:
        break;
    }

    ctx.restore();
  };

  const renderFadeEffect = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    const params = layer.effect.parameters;
    ctx.fillStyle = params.color || '#000000';
    ctx.globalAlpha *= params.intensity ?? 1;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const renderTextEffect = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    const params = layer.effect.parameters.text;
    if (!params) return;

    ctx.font = `${params.weight} ${params.size}px ${params.font}`;
    ctx.fillStyle = params.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;

    if (params.animation?.type === 'typewriter') {
      const len = Math.max(1, Math.floor((Date.now() / (params.animation.speed || 100)) % (params.content.length + 1)));
      ctx.fillText(params.content.substring(0, len), centerX, centerY);
    } else if (params.animation?.type === 'scramble') {
      const scrambled = scrambleText(params.content, Date.now() / (params.animation.speed || 100));
      ctx.fillText(scrambled, centerX, centerY);
    } else {
      ctx.fillText(params.content, centerX, centerY);
    }
  };

  const scrambleText = (text: string, time: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    return text
      .split('')
      .map((ch, i) => (Math.random() < 0.1 * Math.sin(time + i) ? chars[Math.floor(Math.random() * chars.length)] : ch))
      .join('');
  };

  const renderParticleEffect = (layer: Layer) => {
    const p = layer.effect.parameters.particles;
    if (!p) return;
    // burst from center when playing
    if (Math.random() < 0.05) {
      particles.current.spawnBurst(
        { x: (previewCanvasRef.current?.width || 800) / 2, y: (previewCanvasRef.current?.height || 450) / 2 },
        p
      );
    }
  };

  const renderGlitchEffect = (ctx: CanvasRenderingContext2D, layer: Layer) => {
    const intensity = layer.effect.parameters.intensity ?? 0.5;

    for (let i = 0; i < 10; i++) {
      if (Math.random() < intensity) {
        const y = Math.random() * ctx.canvas.height;
        const h = Math.random() * 20 + 2;
        const offset = (Math.random() - 0.5) * 50 * intensity;

        ctx.save();
        ctx.translate(offset, 0);
        ctx.drawImage(
          ctx.canvas,
          0,
          y,
          ctx.canvas.width,
          h,
          0,
          y,
          ctx.canvas.width,
          h
        );
        ctx.restore();
      }
    }

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255,0,0,${intensity * 0.08})`;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const renderQuantumEffect = (ctx: CanvasRenderingContext2D) => {
    const t = Date.now() * 0.001;
    const grad = ctx.createRadialGradient(
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
      0,
      ctx.canvas.width / 2,
      ctx.canvas.height / 2,
      ctx.canvas.width / 2
    );
    const phase = Math.sin(t);
    grad.addColorStop(0, `rgba(0,255,255,${(phase * 0.5 + 0.5) * 0.5})`);
    grad.addColorStop(0.5, `rgba(255,0,255,${(1 - phase) * 0.5})`);
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  /* ===========================
     Layer mgmt
     =========================== */

  const createDefaultEffect = (type: LayerType): LayerEffect => {
    const id = `effect-${Date.now()}`;
    const defaults: Partial<Record<LayerType, LayerEffect>> = {
      fade: {
        id,
        type: 'fade-in',
        parameters: { intensity: fadeParams.intensity, color: fadeParams.color },
        duration: 1,
        easing: fadeParams.curve,
        gpu: true,
      },
      speedramp: {
        id,
        type: 'speed-ramp',
        parameters: { speed: speedRampParams.endSpeed, curve: undefined },
        duration: 2,
        easing: speedRampParams.curve,
        gpu: false,
      },
      text: {
        id,
        type: 'text-typewriter',
        parameters: { text: textParams },
        duration: 3,
        easing: 'linear',
        gpu: false,
      },
      particle: {
        id,
        type: 'particle-explosion',
        parameters: { particles: particleParams },
        duration: 2,
        easing: 'ease-out',
        gpu: true,
      },
      glitch: {
        id,
        type: 'glitch-digital',
        parameters: { intensity: 0.5 },
        duration: 1,
        easing: 'linear',
        gpu: false,
      },
      quantum: {
        id,
        type: 'quantum-tunnel',
        parameters: { intensity: 1, direction: 'center' },
        duration: 2,
        easing: 'quantum',
        gpu: true,
      },
    };
    return defaults[type] || (defaults.fade as LayerEffect);
  };

  const addLayer = (type: LayerType, effect?: LayerEffect) => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      type,
      name: `${type[0].toUpperCase() + type.slice(1)} Layer ${layers.length + 1}`,
      effect: effect || createDefaultEffect(type),
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      timeline: { start: selectedRange[0], end: selectedRange[1], offset: 0 },
      keyframes: [],
      masks: [],
      filters: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        author: 'Current User',
        tags: [],
        version: 1,
      },
    };
    const updated = [...layers, newLayer];
    setLayers(updated);
    onLayersChange?.(updated);
    setSelectedLayer(newLayer.id);
  };

  const updateLayer = (id: string, updates: Partial<Layer>) => {
    const updated = layers.map((l) =>
      l.id === id ? { ...l, ...updates, metadata: { ...l.metadata, modified: new Date() } } : l
    );
    setLayers(updated);
    onLayersChange?.(updated);
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const dupe: Layer = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} Copy`,
      metadata: { ...layer.metadata, created: new Date(), modified: new Date() },
    };
    const updated = [...layers, dupe];
    setLayers(updated);
    onLayersChange?.(updated);
  };

  const deleteLayer = (id: string) => {
    const updated = layers.filter((l) => l.id !== id);
    setLayers(updated);
    onLayersChange?.(updated);
    if (selectedLayer === id) setSelectedLayer(updated[0]?.id ?? null);
  };

  const applyEffect = () => {
    const layer = layers.find((l) => l.id === selectedLayer);
    if (layer) onEffectApply(layer.effect);
  };

  /* ===========================
     UI pieces
     =========================== */

  const renderLayerPanel = () => (
    <div
      style={{
        width: 300,
        background:
          'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.95) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        padding: 20,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#00ffcc',
            textTransform: 'uppercase',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Layers size={16} />
          Layers
        </h3>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdvanced((s) => !s)}
          style={{
            padding: 6,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          <Sliders size={14} />
        </motion.button>
      </div>

      <AnimatePresence>
        {layers.map((layer) => (
          <motion.div
            key={layer.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{
              padding: 12,
              background:
                selectedLayer === layer.id
                  ? 'linear-gradient(135deg, rgba(0,255,204,0.1) 0%, rgba(0,255,204,0.05) 100%)'
                  : 'rgba(255,255,255,0.03)',
              border: `1px solid ${
                selectedLayer === layer.id ? '#00ffcc' : 'rgba(255,255,255,0.1)'
              }`,
              borderRadius: 8,
              marginBottom: 8,
              cursor: 'pointer',
            }}
            onClick={() => setSelectedLayer(layer.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { visible: !layer.visible });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: layer.visible ? '#00ffcc' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </motion.button>

                <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{layer.name}</span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLayer(layer.id, { locked: !layer.locked });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: layer.locked ? '#ff4d4d' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateLayer(layer.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Copy size={14} />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,0,0,0.6)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <Trash2 size={14} />
                </motion.button>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
              <div>Type: {layer.type}</div>
              <div>Effect: {layer.effect.type}</div>
              <div>Blend: {layer.blendMode}</div>
              <div style={{ marginTop: 6 }}>
                <label>Opacity: {Math.round(layer.opacity * 100)}%</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={layer.opacity}
                  onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', height: 4, marginTop: 5 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        <AddBtn onClick={() => addLayer('fade')} icon={<Circle size={14} />} label="Fade" />
        <AddBtn onClick={() => addLayer('speedramp')} icon={<TrendingUp size={14} />} label="Speed" />
        <AddBtn onClick={() => addLayer('text')} icon={<Type size={14} />} label="Text" />
        <AddBtn onClick={() => addLayer('particle')} icon={<Sparkles size={14} />} label="Particle" />
        <AddBtn onClick={() => addLayer('glitch')} icon={<Activity size={14} />} label="Glitch" />
        <AddBtn onClick={() => addLayer('quantum')} icon={<Zap size={14} />} label="Quantum" />
      </div>
    </div>
  );

  const renderEffectControls = () => {
    const layer = layers.find((l) => l.id === selectedLayer);
    if (!layer) return null;

    return (
      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#00ffcc',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Wand2 size={20} /> {layer.name} Controls
        </h3>

        {layer.type === 'fade' && renderFadeControls()}
        {layer.type === 'speedramp' && renderSpeedRampControls()}
        {layer.type === 'text' && renderTextControls()}
        {layer.type === 'particle' && renderParticleControls()}

        <div
          style={{
            marginTop: 30,
            padding: 20,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h4 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Blend Mode</h4>
          <select
            value={layer.blendMode}
            onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as BlendMode })}
            style={{
              width: '100%',
              padding: 8,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'white',
              fontSize: 13,
            }}
          >
            {[
              'normal',
              'multiply',
              'screen',
              'overlay',
              'darken',
              'lighten',
              'color-dodge',
              'color-burn',
              'hard-light',
              'soft-light',
              'difference',
              'exclusion',
              'hue',
              'saturation',
              'color',
              'luminosity',
            ].map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={applyEffect}
          style={{
            width: '100%',
            padding: 15,
            marginTop: 30,
            background: 'linear-gradient(135deg, #00ffcc 0%, #00aaff 100%)',
            border: 'none',
            borderRadius: 8,
            color: 'black',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 10px 30px rgba(0,255,204,0.3)',
          }}
        >
          <Zap size={18} />
          APPLY EFFECT
        </motion.button>
      </div>
    );
  };

  const renderFadeControls = () => (
    <div
      style={{
        padding: 20,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h4 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Fade Parameters</h4>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Intensity: {fadeParams.intensity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={fadeParams.intensity}
          onChange={(e) => setFadeParams({ ...fadeParams, intensity: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Curve
        </label>
        <select
          value={fadeParams.curve}
          onChange={(e) => setFadeParams({ ...fadeParams, curve: e.target.value as EasingFunction })}
          style={{
            width: '100%',
            padding: 8,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: 'white',
            fontSize: 13,
          }}
        >
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
          <option value="bounce">Bounce</option>
          <option value="elastic">Elastic</option>
          <option value="quantum">Quantum</option>
        </select>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Color
        </label>
        <input
          type="color"
          value={fadeParams.color}
          onChange={(e) => setFadeParams({ ...fadeParams, color: e.target.value })}
          style={{
            width: '100%',
            height: 40,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );

  const renderSpeedRampControls = () => (
    <div
      style={{
        padding: 20,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h4 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Speed Ramp Parameters</h4>

      <RangeWithLabel
        label={`Start Speed: ${speedRampParams.startSpeed.toFixed(1)}x`}
        min={0.1}
        max={4}
        step={0.1}
        value={speedRampParams.startSpeed}
        onChange={(v) => setSpeedRampParams({ ...speedRampParams, startSpeed: v })}
      />

      <RangeWithLabel
        label={`End Speed: ${speedRampParams.endSpeed.toFixed(1)}x`}
        min={0.1}
        max={4}
        step={0.1}
        value={speedRampParams.endSpeed}
        onChange={(v) => setSpeedRampParams({ ...speedRampParams, endSpeed: v })}
      />

      <RangeWithLabel
        label={`Smoothness: ${Math.round(speedRampParams.smoothness * 100)}%`}
        min={0}
        max={1}
        step={0.01}
        value={speedRampParams.smoothness}
        onChange={(v) => setSpeedRampParams({ ...speedRampParams, smoothness: v })}
      />

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Curve Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {['linear', 'cubic-bezier', 'spring', 'bounce'].map((curve) => (
            <motion.button
              key={curve}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSpeedRampParams({ ...speedRampParams, curve: curve as EasingFunction })}
              style={{
                padding: 8,
                background:
                  speedRampParams.curve === curve
                    ? 'linear-gradient(135deg, rgba(255,0,255,0.3) 0%, rgba(255,0,255,0.1) 100%)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  speedRampParams.curve === curve ? '#ff00ff' : 'rgba(255,255,255,0.2)'
                }`,
                borderRadius: 4,
                color: speedRampParams.curve === curve ? '#ff00ff' : 'white',
                fontSize: 12,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {curve}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTextControls = () => (
    <div
      style={{
        padding: 20,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h4 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Text Overlay Parameters</h4>

      <LabeledInput
        label="Text Content"
        type="text"
        value={textParams.content}
        onChange={(v) => setTextParams({ ...textParams, content: v })}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        <LabeledInput
          label="Font Size"
          type="number"
          value={String(textParams.size)}
          onChange={(v) => setTextParams({ ...textParams, size: parseInt(v || '0', 10) || 0 })}
        />
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            Font Weight
          </label>
          <select
            value={textParams.weight}
            onChange={(e) => setTextParams({ ...textParams, weight: parseInt(e.target.value, 10) })}
            style={selectStyle}
          >
            {[100, 300, 400, 600, 700, 900].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 15 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Animation Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {['typewriter', 'scramble', 'wave', 'glitch', 'matrix'].map((anim) => (
            <motion.button
              key={anim}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setTextParams({
                  ...textParams,
                  animation: { ...(textParams.animation || { speed: 100, delay: 0, type: 'typewriter' }), type: anim as any },
                })
              }
              style={{
                padding: 8,
                background:
                  textParams.animation?.type === anim
                    ? 'linear-gradient(135deg, rgba(255,255,0,0.3) 0%, rgba(255,255,0,0.1) 100%)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${textParams.animation?.type === anim ? '#ffff00' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 4,
                color: textParams.animation?.type === anim ? '#ffff00' : 'white',
                fontSize: 11,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {anim}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 15 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            Text Color
          </label>
          <input
            type="color"
            value={textParams.color}
            onChange={(e) => setTextParams({ ...textParams, color: e.target.value })}
            style={{ width: '100%', height: 35, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4 }}
          />
        </div>

        <LabeledInput
          label="Animation Speed"
          type="number"
          value={String(textParams.animation?.speed || 100)}
          onChange={(v) =>
            setTextParams({
              ...textParams,
              animation: { ...(textParams.animation || { delay: 0, type: 'typewriter', speed: 100 }), speed: parseInt(v || '0', 10) || 0 },
            })
          }
        />
      </div>
    </div>
  );

  const renderParticleControls = () => (
    <div
      style={{
        padding: 20,
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <h4 style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Particle System Parameters</h4>

      <RangeWithLabel
        label={`Particle Count: ${particleParams.count}`}
        min={10}
        max={5000}
        step={10}
        value={particleParams.count}
        onChange={(v) => setParticleParams({ ...particleParams, count: Math.round(v) })}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        <RangeWithLabel
          label={`Size: ${particleParams.size}px`}
          min={1}
          max={20}
          step={1}
          value={particleParams.size}
          onChange={(v) => setParticleParams({ ...particleParams, size: Math.round(v) })}
        />
        <RangeWithLabel
          label={`Speed: ${particleParams.speed}`}
          min={10}
          max={500}
          step={1}
          value={particleParams.speed}
          onChange={(v) => setParticleParams({ ...particleParams, speed: Math.round(v) })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 15 }}>
        <RangeWithLabel
          label={`Gravity: ${particleParams.gravity}`}
          min={-200}
          max={200}
          step={1}
          value={particleParams.gravity}
          onChange={(v) => setParticleParams({ ...particleParams, gravity: Math.round(v) })}
        />
        <RangeWithLabel
          label={`Turbulence: ${particleParams.turbulence.toFixed(2)}`}
          min={0}
          max={2}
          step={0.01}
          value={particleParams.turbulence}
          onChange={(v) => setParticleParams({ ...particleParams, turbulence: parseFloat(v.toFixed(2)) })}
        />
      </div>

      <div style={{ marginTop: 15 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Particle Shape
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['circle', 'square', 'triangle', 'star'] as const).map((shape) => (
            <motion.button
              key={shape}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setParticleParams({ ...particleParams, shape })}
              style={{
                flex: 1,
                padding: 8,
                background:
                  particleParams.shape === shape
                    ? 'linear-gradient(135deg, rgba(0,255,204,0.3) 0%, rgba(0,255,204,0.1) 100%)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  particleParams.shape === shape ? '#00ffcc' : 'rgba(255,255,255,0.2)'
                }`,
                borderRadius: 4,
                color: particleParams.shape === shape ? '#00ffcc' : 'white',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                textTransform: 'capitalize',
              }}
            >
              {shape === 'circle' && <Circle size={14} />}
              {shape === 'square' && <Square size={14} />}
              {shape === 'triangle' && <Triangle size={14} />}
              {shape === 'star' && <Star size={14} />}
              {shape}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 15 }}>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
          Emitter Type
        </label>
        <select
          value={particleParams.emitter}
          onChange={(e) => setParticleParams({ ...particleParams, emitter: e.target.value as any })}
          style={selectStyle}
        >
          <option value="point">Point</option>
          <option value="line">Line</option>
          <option value="circle">Circle</option>
          <option value="rectangle">Rectangle</option>
        </select>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.95) 100%)',
        borderRadius: 12,
        padding: 20,
        margin: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#00ffcc',
            textTransform: 'uppercase',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Film size={16} /> Live Preview
        </h3>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              padding: 8,
              background: isPlaying ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)',
              border: `1px solid ${isPlaying ? '#ff0000' : '#00ff00'}`,
              borderRadius: 4,
              color: isPlaying ? '#ff0000' : '#00ff00',
              cursor: 'pointer',
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // simple "reset": clear particles
              particles.current = new ParticleSystem();
            }}
            style={{
              padding: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </motion.button>

          <select
            value={previewQuality}
            onChange={(e) => setPreviewQuality(e.target.value as any)}
            style={{
              padding: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'white',
              fontSize: 12,
            }}
          >
            <option value="low">Low Quality</option>
            <option value="medium">Medium Quality</option>
            <option value="high">High Quality</option>
          </select>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          background: 'black',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <canvas
          ref={previewCanvasRef}
          width={800}
          height={450}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />

        {renderEngine === 'webgl' && (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.5,
            }}
          />
        )}

        {/* HUD */}
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.8)',
              borderRadius: 4,
              fontSize: 12,
              color: '#00ffcc',
              fontFamily: 'monospace',
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {collaborators.map((c) => (
              <div
                key={c.id}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'white',
                  fontWeight: 'bold',
                  border: c.selectedLayer === selectedLayer ? '2px solid white' : 'none',
                }}
                title={c.name}
              >
                {c.name[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTimeline && (
        <div
          style={{
            marginTop: 20,
            height: 110,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: 10,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${(currentTime / duration) * 100}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: '#ffff00',
              boxShadow: '0 0 10px #ffff00',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          {layers.map((layer, i) => {
            const color =
              (layer.effect.parameters?.color as string) ||
              (layer.effect.parameters?.text?.color as string) ||
              '#00ffcc';
            return (
              <div
                key={layer.id}
                style={{
                  position: 'absolute',
                  top: i * 20,
                  left: `${(layer.timeline.start / duration) * 100}%`,
                  width: `${((layer.timeline.end - layer.timeline.start) / duration) * 100}%`,
                  height: 18,
                  background: `linear-gradient(90deg, ${color}33, ${color}66)`,
                  border: `1px solid ${color}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 6,
                  fontSize: 10,
                  color: 'white',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {layer.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ===========================
     Render
     =========================== */

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background:
          'linear-gradient(135deg, rgba(10,10,15,0.98) 0%, rgba(20,20,30,0.98) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background pulse */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(0,255,204,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'quantumPulse 10s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes quantumPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.06); }
        }
      `}</style>

      {renderLayerPanel()}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flex: 1 }}>
          {renderEffectControls()}
          {renderPreview()}
        </div>

        {/* AI Suggestions */}
        <div
          style={{
            padding: 16,
            background: 'rgba(0,0,0,0.5)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h4
            style={{
              fontSize: 14,
              color: '#00ffcc',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Brain size={16} />
            AI Suggestions
          </h4>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
            {getAISuggestions().map((s, i) => (
              <motion.div
                key={`${s.effect}-${i}`}
                whileHover={{ scale: 1.05 }}
                style={{
                  minWidth: 160,
                  padding: 10,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const eff = createDefaultEffect('transition');
                  eff.type = s.effect;
                  addLayer('transition', eff);
                }}
              >
                <div style={{ fontSize: 12, color: '#00ffcc', marginBottom: 4 }}>
                  {Math.round(s.confidence * 100)}% Match
                </div>
                <div style={{ fontSize: 13, color: 'white', marginBottom: 6 }}>{s.effect}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{s.reason}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===========================
   Small UI helpers
   =========================== */

const AddBtn: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string }> = ({
  onClick,
  icon,
  label,
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      padding: 10,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 6,
      color: 'white',
      fontSize: 12,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}
  >
    {icon} {label}
  </motion.button>
);

const RangeWithLabel: React.FC<{
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, min, max, step, value, onChange }) => (
  <div style={{ marginBottom: 15 }}>
    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
      {label}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
);

const LabeledInput: React.FC<{
  label: string;
  type: 'text' | 'number';
  value: string;
  onChange: (v: string) => void;
}> = ({ label, type, value, onChange }) => (
  <div style={{ marginBottom: 15 }}>
    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: 8,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 4,
        color: 'white',
        fontSize: 13,
      }}
    />
  </div>
);

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: 'white',
  fontSize: 13,
};

export default TransitionEffects;
