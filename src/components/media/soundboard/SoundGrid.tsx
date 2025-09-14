import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  Play, Square, Repeat, Mic, Radio, Music, Disc, Waves, Activity,
  Zap, Sparkles, Star, Lock, Volume2, VolumeX, Layers, Grid, List,
  ChevronRight, Film, Package
} from 'lucide-react';

/* ========================= Types ========================= */

export interface SoundItem {
  id: string;
  name: string;
  url: string;
  duration: number;
  category: SoundCategory;
  color: string;
  hotkey?: string;
  volume: number;     // 0..1
  fadeIn: number;     // seconds
  fadeOut: number;    // seconds
  loop: boolean;
  muted: boolean;
  playing: boolean;   // controlled by parent
  playCount: number;
  lastPlayed?: Date;
  tags: string[];
  waveform?: Float32Array;
  metadata: SoundMetadata;
  effects: SoundEffect[];
  gridPosition?: GridPosition;
  locked?: boolean;
  favorite?: boolean;
}

type SoundCategory =
  | 'music'
  | 'sfx'
  | 'voice'
  | 'ambient'
  | 'notification'
  | 'meme'
  | 'transition'
  | 'intro'
  | 'outro'
  | 'custom';

interface SoundMetadata {
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  format?: string;
  size?: number;
  bpm?: number;
  key?: string;
  energy?: number;
  mood?: string;
}

interface SoundEffect {
  type: 'reverb' | 'delay' | 'distortion' | 'filter' | 'pitch' | 'tempo';
  enabled: boolean;
  parameters: Record<string, number | string>;
}

interface GridPosition {
  x: number; y: number; width: number; height: number;
}

interface SoundGridProps {
  sounds: SoundItem[];
  onSoundUpdate: (sound: SoundItem) => void;
  onSoundPlay: (soundId: string) => void;
  onSoundStop: (soundId: string) => void;
  onSoundDelete: (soundId: string) => void;
  gridSize?: number;
  viewMode?: 'grid' | 'list' | 'compact';
  enableDragDrop?: boolean;
  showWaveforms?: boolean;        // initial
  quantumMode?: boolean;
  onHotkeyAssign?: (soundId: string, hotkey: string) => void;
}

/* ====================== Audio Engine ====================== */

interface AudioEvent {
  type: 'loaded' | 'play' | 'stop' | 'ended' | 'error';
  soundId: string;
  duration?: number;
  error?: string;
}

class QuantumAudioEngine {
  private audioContext: AudioContext;
  private sounds = new Map<string, AudioBuffer>();
  private sources = new Map<string, AudioBufferSourceNode>();
  private gains = new Map<string, GainNode>();
  private analyzers = new Map<string, AnalyserNode>();
  private masterGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private convolver: ConvolverNode | null = null;
  private listeners = new Set<(event: AudioEvent) => void>();

  constructor() {
    const AC = (typeof window !== 'undefined' && ((window as any).AudioContext || (window as any).webkitAudioContext)) as typeof AudioContext | undefined;
    if (!AC) throw new Error('Web Audio API not available');
    this.audioContext = new AC();

    this.masterGain = this.audioContext.createGain();
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
  }

  resume() {
    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
    }
  }

  async loadSound(id: string, url: string): Promise<void> {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(buf);
      this.sounds.set(id, audioBuffer);

      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      this.analyzers.set(id, analyzer);

      this.emit({ type: 'loaded', soundId: id, duration: audioBuffer.duration });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emit({ type: 'error', soundId: id, error: msg });
    }
  }

  playSound(
    id: string,
    options: {
      volume?: number;
      loop?: boolean;
      fadeIn?: number;
      fadeOut?: number;
      startTime?: number;
      effects?: SoundEffect[];
      muted?: boolean;
    } = {}
  ) {
    const buffer = this.sounds.get(id);
    if (!buffer) return;

    this.stopSound(id); // stop previous

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = !!options.loop;

    const gainNode = this.audioContext.createGain();
    const targetVol = options.muted ? 0 : (options.volume ?? 1);
    gainNode.gain.value = targetVol;

    // fade in
    if (options.fadeIn && options.fadeIn > 0) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetVol, this.audioContext.currentTime + options.fadeIn);
    }

    // chain
    source.connect(gainNode);
    let last: AudioNode = gainNode;
    if (options.effects && options.effects.length) {
      last = this.applyEffects(last, options.effects);
    }

    const analyzer = this.analyzers.get(id);
    if (analyzer) {
      last.connect(analyzer);
      analyzer.connect(this.compressor);
    } else {
      last.connect(this.compressor);
    }

    this.sources.set(id, source);
    this.gains.set(id, gainNode);

    source.onended = () => {
      this.emit({ type: 'ended', soundId: id });
      this.sources.delete(id);
      this.gains.delete(id);
    };

    const start = Math.max(0, Math.min(options.startTime ?? 0, buffer.duration - 0.05));
    source.start(this.audioContext.currentTime, start);

    // schedule fade out if not looping
    if (options.fadeOut && !source.loop) {
      const t = this.audioContext.currentTime + buffer.duration - start - options.fadeOut;
      if (t > this.audioContext.currentTime) {
        gainNode.gain.setValueAtTime(targetVol, t);
        gainNode.gain.linearRampToValueAtTime(0, t + options.fadeOut);
      }
    }

    this.emit({ type: 'play', soundId: id });
  }

  stopSound(id: string, fadeOut = 0) {
    const source = this.sources.get(id);
    const gain = this.gains.get(id);
    if (!source) return;

    if (fadeOut > 0 && gain) {
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeOut);
      setTimeout(() => { try { source.stop(); } catch {} }, fadeOut * 1000);
    } else {
      try { source.stop(); } catch {}
    }
    this.emit({ type: 'stop', soundId: id });
  }

  setVolume(id: string, vol: number) {
    const g = this.gains.get(id);
    if (g) g.gain.linearRampToValueAtTime(vol, this.audioContext.currentTime + 0.1);
  }

  setMasterVolume(vol: number) {
    this.masterGain.gain.linearRampToValueAtTime(vol, this.audioContext.currentTime + 0.1);
  }

  private applyEffects(node: AudioNode, effects: SoundEffect[]): AudioNode {
    let current = node;
    for (const fx of effects) {
      if (!fx.enabled) continue;
      switch (fx.type) {
        case 'delay': {
          const delay = this.audioContext.createDelay(5);
          delay.delayTime.value = Number(fx.parameters.time ?? 0.35);
          const feedback = this.audioContext.createGain();
          feedback.gain.value = Number(fx.parameters.feedback ?? 0.3);
          current.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          const mix = this.audioContext.createGain();
          current.connect(mix);
          delay.connect(mix);
          current = mix;
          break;
        }
        case 'filter': {
          const filter = this.audioContext.createBiquadFilter();
          const t = String(fx.parameters.type ?? 'lowpass') as BiquadFilterType;
          filter.type = t;
          filter.frequency.value = Number(fx.parameters.frequency ?? 1000);
          filter.Q.value = Number(fx.parameters.q ?? 1);
          current.connect(filter);
          current = filter;
          break;
        }
        case 'distortion': {
          const ws = this.audioContext.createWaveShaper();
          ws.curve = this.makeDistortionCurve(Number(fx.parameters.amount ?? 50));
          ws.oversample = '4x';
          current.connect(ws);
          current = ws;
          break;
        }
        case 'reverb': {
          if (this.convolver) {
            current.connect(this.convolver);
            current = this.convolver;
          }
          break;
        }
        default:
          break;
      }
    }
    return current;
  }

  private makeDistortionCurve(amount: number) {
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  getAnalyzerData(id: string): Uint8Array | null {
    const a = this.analyzers.get(id);
    if (!a) return null;
    const arr = new Uint8Array(a.frequencyBinCount);
    a.getByteFrequencyData(arr);
    return arr;
  }

  getWaveformData(id: string): Uint8Array | null {
    const a = this.analyzers.get(id);
    if (!a) return null;
    const arr = new Uint8Array(a.fftSize);
    a.getByteTimeDomainData(arr);
    return arr;
  }

  subscribe(l: (e: AudioEvent) => void) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit(e: AudioEvent) { this.listeners.forEach(f => f(e)); }

  dispose() {
    try { this.sources.forEach(s => s.stop()); } catch {}
    void this.audioContext.close();
    this.sounds.clear();
    this.sources.clear();
    this.gains.clear();
    this.analyzers.clear();
    this.listeners.clear();
  }
}

/* ================== Visual Effects Engine ================= */

class VisualEffectsEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf: number | null = null;
  private particles: Particle[] = [];

  initialize(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.loop();
  }

  resize(w: number, h: number) {
    if (!this.canvas) return;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  triggerEffect(type: 'play' | 'stop' | 'loop', x: number, y: number, color: string) {
    const count = type === 'play' ? 22 : type === 'stop' ? 12 : 16;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count;
      const vel = type === 'play' ? 3 : 2;
      this.particles.push(new Particle(x, y, Math.cos(ang) * vel, Math.sin(ang) * vel, color, type === 'loop' ? 2 : 1));
    }
  }

  private loop = () => {
    if (!this.ctx || !this.canvas) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.particles = this.particles.filter(p => {
      p.update(); p.draw(ctx); return p.life > 0;
    });
    this.raf = requestAnimationFrame(this.loop);
  };

  dispose() { if (this.raf) cancelAnimationFrame(this.raf); }
}

class Particle {
  life = 1;
  constructor(public x: number, public y: number, public vx: number, public vy: number, public color: string, public size: number) {}
  update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.985; this.vy *= 0.985; this.life -= 0.02; this.size *= 0.985; }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save(); ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

/* ========================= Component ========================= */

const SoundGrid: React.FC<SoundGridProps> = ({
  sounds,
  onSoundUpdate,
  onSoundPlay,
  onSoundStop,
  onSoundDelete,
  gridSize = 4,
  viewMode = 'grid',
  enableDragDrop = true,
  showWaveforms = true,
  quantumMode = false,
  onHotkeyAssign
}) => {
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [hoveredSound, setHoveredSound] = useState<string | null>(null);
  const [localShowWaveforms, setLocalShowWaveforms] = useState(showWaveforms);
  const [filterCategory, setFilterCategory] = useState<SoundCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playStats, setPlayStats] = useState<Map<string, number>>(new Map());
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'compact'>(viewMode);

  // engines & DOM
  const audioEngine = useRef<QuantumAudioEngine | null>(null);
  const visualEffects = useRef(new VisualEffectsEngine());
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // perf
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const animFrame = useRef<number | null>(null);
  const loadedUrlById = useRef<Map<string, string>>(new Map());

  // init audio engine once
  useEffect(() => {
    if (typeof window === 'undefined' || audioEngine.current) return;
    try {
      audioEngine.current = new QuantumAudioEngine();
    } catch (e) {
      // no WebAudio (SSR/older browsers)
      console.warn('Audio engine unavailable:', e);
      return;
    }

    const unsub = audioEngine.current.subscribe((ev) => {
      if (ev.type === 'play') {
        setPlayStats((prev) => {
          const n = new Map(prev);
          n.set(ev.soundId, (n.get(ev.soundId) || 0) + 1);
          return n;
        });
      }
    });

    return () => { unsub(); audioEngine.current?.dispose(); audioEngine.current = null; };
  }, []);

  // (re)load sounds when url or id changes
  useEffect(() => {
    if (!audioEngine.current) return;
    const engine = audioEngine.current;
    const map = loadedUrlById.current;

    (async () => {
      for (const s of sounds) {
        const prevUrl = map.get(s.id);
        if (!prevUrl || prevUrl !== s.url) {
          await engine.loadSound(s.id, s.url);
          map.set(s.id, s.url);
        }
      }
    })();
  }, [sounds]);

  // init visual effects + responsive canvas
  useEffect(() => {
    if (!quantumMode) return;
    const canvas = canvasRef.current;
    if (canvas) {
      visualEffects.current.initialize(canvas);
      // size with ResizeObserver
      const el = gridRef.current;
      if (el) {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const cr = entry.contentRect;
            visualEffects.current.resize(Math.floor(cr.width), Math.floor(cr.height));
          }
        });
        ro.observe(el);
        return () => { ro.disconnect(); visualEffects.current.dispose(); };
      }
      return () => { visualEffects.current.dispose(); };
    }
  }, [quantumMode]);

  // visualizer loop
  const [visualizerData, setVisualizerData] = useState<Map<string, Uint8Array>>(new Map());
  useEffect(() => {
    if (!(localShowWaveforms || quantumMode)) return;

    const tick = () => {
      const m = new Map<string, Uint8Array>();
      if (audioEngine.current) {
        for (const s of sounds) {
          if (s.playing) {
            const data = localShowWaveforms
              ? audioEngine.current.getWaveformData(s.id)
              : audioEngine.current.getAnalyzerData(s.id);
            if (data) m.set(s.id, data);
          }
        }
      }
      setVisualizerData(m);
      animFrame.current = requestAnimationFrame(tick);
    };
    tick();

    return () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); };
  }, [sounds, localShowWaveforms, quantumMode]);

  // filtered sounds
  const filteredSounds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sounds.filter((s) => {
      const matchCat = filterCategory === 'all' || s.category === filterCategory;
      const matchText =
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchText;
    });
  }, [sounds, filterCategory, searchQuery]);

  // handlers
  const handleSoundPlay = useCallback((sound: SoundItem) => {
    const engine = audioEngine.current;
    if (!engine) return;
    engine.resume();

    if (sound.playing) {
      engine.stopSound(sound.id, sound.fadeOut);
      onSoundStop(sound.id);
    } else {
      engine.playSound(sound.id, {
        volume: sound.volume,
        loop: sound.loop,
        fadeIn: sound.fadeIn,
        fadeOut: sound.fadeOut,
        effects: sound.effects,
        muted: sound.muted,
        startTime: 0
      });
      onSoundPlay(sound.id);

      if (quantumMode && gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        visualEffects.current.triggerEffect(
          sound.loop ? 'loop' : 'play',
          mouseX.get() - rect.left,
          mouseY.get() - rect.top,
          sound.color
        );
      }
    }
  }, [onSoundPlay, onSoundStop, quantumMode, mouseX, mouseY]);

  const handleVolumeChange = useCallback((sound: SoundItem, volume: number) => {
    audioEngine.current?.setVolume(sound.id, volume);
    onSoundUpdate({ ...sound, volume });
  }, [onSoundUpdate]);

  const handleToggleMute = useCallback((sound: SoundItem) => {
    const muted = !sound.muted;
    audioEngine.current?.setVolume(sound.id, muted ? 0 : sound.volume);
    onSoundUpdate({ ...sound, muted });
  }, [onSoundUpdate]);

  const handleToggleLoop = useCallback((sound: SoundItem) => {
    onSoundUpdate({ ...sound, loop: !sound.loop });
  }, [onSoundUpdate]);

  const handleToggleFavorite = useCallback((sound: SoundItem) => {
    onSoundUpdate({ ...sound, favorite: !sound.favorite });
  }, [onSoundUpdate]);

  // drag & drop swap
  const draggedId = useRef<string | null>(null);
  const handleDragStart = (id: string) => { if (enableDragDrop) draggedId.current = id; };
  const handleDragEnd = () => { draggedId.current = null; };
  const handleDrop = (targetId: string) => {
    const src = draggedId.current;
    if (!src || src === targetId) return;
    const srcIdx = sounds.findIndex(s => s.id === src);
    const dstIdx = sounds.findIndex(s => s.id === targetId);
    if (srcIdx < 0 || dstIdx < 0) return;
    // update grid positions (parent keeps array order)
    [...sounds].forEach((s, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      onSoundUpdate({ ...s, gridPosition: { x: col, y: row, width: 1, height: 1 } });
    });
  };

  // hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const match = sounds.find(s => s.hotkey?.toLowerCase() === key);
      if (match) {
        e.preventDefault();
        handleSoundPlay(match);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sounds, handleSoundPlay]);

  const getCategoryIcon = (category: SoundCategory) => {
    const icons: Record<SoundCategory, JSX.Element> = {
      music: <Music />,
      sfx: <Zap />,
      voice: <Mic />,
      ambient: <Waves />,
      notification: <Radio />,
      meme: <Sparkles />,
      transition: <Activity />,
      intro: <ChevronRight />,
      outro: <Square />,
      custom: <Layers />
    };
    return icons[category] ?? <Music />;
  };

  const getHeatmapColor = (count: number) => {
    const max = Math.max(1, ...Array.from(playStats.values()));
    const t = count / max;
    if (t < 0.2) return 'rgba(0, 255, 204, 0.1)';
    if (t < 0.4) return 'rgba(0, 255, 204, 0.3)';
    if (t < 0.6) return 'rgba(255, 170, 0, 0.3)';
    if (t < 0.8) return 'rgba(255, 102, 0, 0.3)';
    return 'rgba(255, 0, 0, 0.3)';
  };

  const renderSoundTile = (sound: SoundItem) => {
    const isPlaying = sound.playing;
    const visualData = visualizerData.get(sound.id);
    const playCount = playStats.get(sound.id) || 0;

    return (
      <motion.div
        key={sound.id}
        style={{
          position: 'relative',
          aspectRatio: '1',
          background: isPlaying
            ? `linear-gradient(135deg, ${sound.color}33, ${sound.color}11)`
            : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: `1px solid ${
            isPlaying ? sound.color :
            selectedSound === sound.id ? '#00ffcc' : 'rgba(255,255,255,0.1)'
          }`,
          borderRadius: 12,
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: isPlaying ? `0 0 30px ${sound.color}66` : 'none'
        }}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onMouseEnter={() => setHoveredSound(sound.id)}
        onMouseLeave={() => setHoveredSound(null)}
        onClick={() => handleSoundPlay(sound)}
        onContextMenu={(e) => { e.preventDefault(); setSelectedSound(sound.id); }}
        draggable={enableDragDrop}
        onDragStart={() => handleDragStart(sound.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(sound.id)}
      >
        {/* Quantum glow */}
        {quantumMode && isPlaying && (
          <motion.div
            style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle at 50% 50%, ${sound.color}44, transparent)`,
              filter: 'blur(20px)'
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Heatmap */}
        {playCount > 0 && (
          <div style={{ position: 'absolute', inset: 0, background: getHeatmapColor(playCount), pointerEvents: 'none' }} />
        )}

        {/* Status icons */}
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10 }}>
          {sound.locked && (
            <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,0,0,0.2)', display: 'grid', placeItems: 'center' }}>
              <Lock size={12} color="#ff4444" />
            </div>
          )}
          {sound.loop && (
            <motion.div
              style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,170,0,0.2)', display: 'grid', placeItems: 'center' }}
              animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Repeat size={12} color="#ffaa00" />
            </motion.div>
          )}
          {sound.muted && (
            <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center' }}>
              <VolumeX size={12} color="rgba(255,255,255,0.7)" />
            </div>
          )}
          {sound.favorite && (
            <motion.div
              style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,0,0.2)', display: 'grid', placeItems: 'center' }}
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
            >
              <Star size={12} color="#ffff00" fill="#ffff00" />
            </motion.div>
          )}
        </div>

        {/* Waveform */}
        {localShowWaveforms && visualData && isPlaying && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2, padding: 4
          }}>
            {Array.from({ length: 16 }).map((_, i) => {
              const idx = Math.max(0, Math.min(visualData.length - 1, Math.floor(i * (visualData.length / 16))));
              const value = visualData[idx] / 255;
              return (
                <motion.div
                  key={i}
                  style={{ flex: 1, background: sound.color, borderRadius: 2, opacity: 0.85 }}
                  animate={{ height: `${value * 100}%` }}
                  transition={{ duration: 0.06, ease: 'linear' }}
                />
              );
            })}
          </div>
        )}

        {/* Content */}
        <div style={{
          position: 'relative', height: '100%', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 12, zIndex: 1
        }}>
          <motion.div
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: isPlaying ? `linear-gradient(135deg, ${sound.color}, ${sound.color}88)` : 'rgba(255,255,255,0.1)',
              display: 'grid', placeItems: 'center', marginBottom: 8,
              boxShadow: isPlaying ? `0 0 20px ${sound.color}` : 'none'
            }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Square size={20} color="white" fill="white" /> : <Play size={20} color="white" style={{ marginLeft: 2 }} />}
          </motion.div>

          <div style={{ color: sound.color, marginBottom: 4, opacity: 0.9 }}>{getCategoryIcon(sound.category)}</div>

          <div style={{
            fontSize: 12, fontWeight: 600, color: 'white', textAlign: 'center',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%'
          }}>
            {sound.name}
          </div>

          {sound.hotkey && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8, padding: '2px 6px',
              background: 'rgba(138,43,226,0.3)', border: '1px solid #8a2be2', borderRadius: 4,
              fontSize: 10, fontWeight: 600, color: '#8a2be2', fontFamily: 'monospace'
            }}>
              {sound.hotkey}
            </div>
          )}

          {(playCount > 0) && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              {playCount}x
            </div>
          )}
        </div>

        {/* Hover quick actions */}
        <AnimatePresence>
          {hoveredSound === sound.id && !sound.locked && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 4, background: 'rgba(0,0,0,0.8)', padding: 4, borderRadius: 8, zIndex: 20
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <IconBtn onClick={() => handleToggleMute(sound)}
                active={sound.muted} activeBg="rgba(255,0,0,0.2)" activeColor="#ff4444" icon={sound.muted ? <VolumeX size={14} /> : <Volume2 size={14} />} />
              <IconBtn onClick={() => handleToggleLoop(sound)}
                active={sound.loop} activeBg="rgba(255,170,0,0.2)" activeColor="#ffaa00" icon={<Repeat size={14} />} />
              <IconBtn onClick={() => handleToggleFavorite(sound)}
                active={!!sound.favorite} activeBg="rgba(255,255,0,0.2)" activeColor="#ffff00" icon={<Star size={14} fill={sound.favorite ? '#ffff00' : 'none'} />} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div
      ref={gridRef}
      style={{
        position: 'relative', width: '100%', height: '100%', padding: 20,
        background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(20,20,30,0.95) 100%)',
        borderRadius: 12, overflow: 'auto'
      }}
      onMouseMove={(e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); }}
    >
      {/* Quantum Canvas */}
      {quantumMode && (
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}
          width={Math.floor(gridRef.current?.clientWidth || 800)}
          height={Math.floor(gridRef.current?.clientHeight || 600)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <h3 style={{
            fontSize: 18, fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #00ffcc, #8a2be2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'flex', alignItems: 'center'
          }}>
            <Disc size={20} style={{ marginRight: 8 }} />
            Sound Grid
          </h3>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            style={{
              padding: '6px 10px', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', fontSize: 12
            }}
          >
            <option value="all">All Categories</option>
            <option value="music">Music</option>
            <option value="sfx">SFX</option>
            <option value="voice">Voice</option>
            <option value="ambient">Ambient</option>
            <option value="notification">Notification</option>
            <option value="meme">Meme</option>
            <option value="transition">Transition</option>
            <option value="intro">Intro</option>
            <option value="outro">Outro</option>
            <option value="custom">Custom</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', fontSize: 12, width: 200
            }}
          />
        </div>

        {/* View & Waveform */}
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setLocalShowWaveforms((v) => !v)}
            style={{
              padding: 8,
              background: localShowWaveforms ? 'rgba(0,255,204,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${localShowWaveforms ? '#00ffcc' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 6, color: localShowWaveforms ? '#00ffcc' : 'white', cursor: 'pointer'
            }}
            title="Toggle waveforms"
          >
            <Waves size={14} />
          </motion.button>

          <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
            <button onClick={() => setCurrentView('grid')}
              style={viewBtnStyle(currentView === 'grid')} title="Grid view"><Grid size={14} /></button>
            <button onClick={() => setCurrentView('list')}
              style={viewBtnStyle(currentView === 'list')} title="List view"><List size={14} /></button>
          </div>
        </div>
      </div>

      {/* Grid/List */}
      {currentView === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: 15, position: 'relative' }}>
          {filteredSounds.map(renderSoundTile)}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filteredSounds.map((s) => (
            <div key={s.id} style={{
              display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12,
              alignItems: 'center', padding: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 8, display: 'grid', placeItems: 'center',
                background: s.playing ? `linear-gradient(135deg, ${s.color}, ${s.color}88)` : 'rgba(255,255,255,0.1)'
              }}>
                {s.playing ? <Square size={18} color="white" /> : <Play size={18} color="white" />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.category} • {s.tags.join(', ')}</div>
              </div>
              <button
                onClick={() => handleSoundPlay(s)}
                style={{
                  padding: '6px 10px', background: 'rgba(0,255,204,0.1)',
                  border: '1px solid rgba(0,255,204,0.3)', borderRadius: 6, color: '#00ffcc', cursor: 'pointer'
                }}
              >
                {s.playing ? 'Stop' : 'Play'}
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredSounds.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.6)' }}>
          <Music size={48} style={{ marginBottom: 15, opacity: 0.3 }} />
          <div>No sounds found</div>
        </div>
      )}
    </div>
  );
};

/* ========================= UI helpers ========================= */

const IconBtn: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  activeBg?: string;
  activeColor?: string;
}> = ({ onClick, icon, active, activeBg = 'rgba(255,255,255,0.1)', activeColor = 'white' }) => (
  <motion.button
    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
    onClick={onClick}
    style={{
      width: 24, height: 24, borderRadius: 4, border: 'none', cursor: 'pointer',
      display: 'grid', placeItems: 'center',
      background: active ? activeBg : 'rgba(255,255,255,0.1)',
      color: active ? activeColor : 'white'
    }}
  >
    {icon}
  </motion.button>
);

const viewBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: 6,
  background: active ? 'rgba(0,255,204,0.2)' : 'transparent',
  border: 'none',
  borderRadius: 4,
  color: active ? '#00ffcc' : 'white',
  cursor: 'pointer'
});

export default SoundGrid;
