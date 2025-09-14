import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Orbit,
  Atom,
  Zap,
  Heart,
  Brain,
  Globe,
  Radio,
  Clock,
  Shield,
} from "lucide-react";
import "../styles/analyticspage.css";
import ProFeatureWrapper from "@/components/common/ProFeatureWrapper";

/** ─────────────────────────────────────────────────────────
 *  Analytics Page
 *  - Enthält drei Canvas-Visualisierungen:
 *    1) Quantum Particle Field (Hintergrund)
 *    2) DNA-Helix (Canvas im Card)
 *    3) Neural Network (Canvas im Card)
 *  - Recharts-Radar (Emotional Spectrum)
 *  - „Audio Spectrum“, „Sentiment Shield“, „Timeline“, „Interstellar Map“
 *  - Komplett ohne Tailwind; alle Styles in analytics.css
 *  - Sauberes Cleanup + Resize-Handling
 *  ──────────────────────────────────────────────────────── */

// Typen
type EmotionalSpectrum = Record<
  "joy" | "excitement" | "surprise" | "engagement" | "satisfaction" | "loyalty",
  number
>;

type TimelineEvent = {
  time: string;
  type: "peak" | "achievement" | "viral" | "raid" | "donation";
  value: number;
  description: string;
};

type Connection = {
  source: string;
  target: string;
  strength: number; // 0..1
  type: "follow" | "raid" | "host" | "collab";
};

/** ─────────────────────────────────────────────────────────
 *  Klassen für Canvas-Animationen
 *  ──────────────────────────────────────────────────────── */

// DNA Helix
class DNAHelix {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time = 0;
  private strands: Array<{
    x: number;
    amplitude: number;
    frequency: number;
    phase: number;
    color1: string;
    color2: string;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this.ctx = ctx;
    this.generateStrands();
  }

  private generateStrands() {
    this.strands = [];
    const cols = Math.floor(this.canvas.width / 15);
    for (let i = 0; i < cols; i++) {
      this.strands.push({
        x: i * 15,
        amplitude: 50,
        frequency: 0.02,
        phase: i * 0.1,
        color1: `hsl(${280 + i * 2}, 70%, 60%)`,
        color2: `hsl(${200 + i * 2}, 70%, 60%)`,
      });
    }
  }

  resize(width: number, height: number) {
    this.canvas.width = Math.max(300, Math.floor(width));
    this.canvas.height = Math.max(150, Math.floor(height));
    this.generateStrands();
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.strands.forEach((strand) => {
      const y1 =
        canvas.height / 2 +
        Math.sin(this.time * strand.frequency + strand.phase) * strand.amplitude;
      const y2 =
        canvas.height / 2 -
        Math.sin(this.time * strand.frequency + strand.phase) * strand.amplitude;

      // Verbindung
      ctx.beginPath();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
      ctx.lineWidth = 1;
      ctx.moveTo(strand.x, y1);
      ctx.lineTo(strand.x, y2);
      ctx.stroke();

      // Nodes
      ctx.fillStyle = strand.color1;
      ctx.beginPath();
      ctx.arc(strand.x, y1, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = strand.color2;
      ctx.beginPath();
      ctx.arc(strand.x, y2, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.time += 0.5;
  }
}

// Quantum Particle
class QuantumParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
  hue: number;
  entangled: QuantumParticle | null = null;
  quantumState: 1 | -1;
  trail: Array<{ x: number; y: number; alpha: number }> = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.6;
    this.vy = (Math.random() - 0.5) * 1.6;
    this.life = 1;
    this.radius = Math.random() * 3 + 1;
    this.hue = Math.random() * 360;
    this.quantumState = Math.random() > 0.5 ? 1 : -1;
  }

  update(particles: QuantumParticle[], w: number, h: number) {
    if (this.entangled && particles.includes(this.entangled)) {
      const dx = this.entangled.x - this.x;
      const dy = this.entangled.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 100) {
        this.vx += dx * 0.0001;
        this.vy += dy * 0.0001;
        this.quantumState = this.quantumState === 1 ? -1 : 1;
      }
    }

    // trail
    this.trail.push({ x: this.x, y: this.y, alpha: this.life });
    if (this.trail.length > 10) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.01;

    // Tunneling / Wrap
    if (this.x < 0 || this.x > w) {
      this.x = (this.x + w) % w;
      this.quantumState = this.quantumState === 1 ? -1 : 1;
    }
    if (this.y < 0 || this.y > h) {
      this.y = (this.y + h) % h;
      this.quantumState = this.quantumState === 1 ? -1 : 1;
    }

    if (this.life <= 0) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.life = 1;
      this.trail = [];
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // trail
    this.trail.forEach((p, idx) => {
      ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${p.alpha * 0.1 * (idx / this.trail.length)})`;
      ctx.fillRect(p.x, p.y, 1, 1);
    });

    // core glow
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 3);
    gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${this.life})`);
    gradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 50%, ${this.life * 0.5})`);
    gradient.addColorStop(1, `hsla(${this.hue}, 100%, 30%, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (1 + Math.sin(Date.now() * 0.01) * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }
}

// Neural Network
class NeuralNetwork {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layers = [5, 8, 6, 4, 1];
  private nodes: Array<
    Array<{ x: number; y: number; activation: number; bias: number; pulse: number }>
  > = [];
  private connections: Array<{
    from: { x: number; y: number; activation: number; bias: number; pulse: number };
    to: { x: number; y: number; activation: number; bias: number; pulse: number };
    weight: number;
    signal: number;
  }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this.ctx = ctx;
    this.initNetwork();
  }

  private initNetwork() {
    const layerSpacing = this.canvas.width / (this.layers.length + 1);
    this.nodes = [];
    this.connections = [];

    this.layers.forEach((count, layerIdx) => {
      const layer: Array<{ x: number; y: number; activation: number; bias: number; pulse: number }> = [];
      const nodeSpacing = this.canvas.height / (count + 1);

      for (let i = 0; i < count; i++) {
        layer.push({
          x: Math.round(layerSpacing * (layerIdx + 1)),
          y: Math.round(nodeSpacing * (i + 1)),
          activation: Math.random(),
          bias: Math.random() - 0.5,
          pulse: 0,
        });
      }
      this.nodes.push(layer);
    });

    for (let i = 0; i < this.nodes.length - 1; i++) {
      for (let j = 0; j < this.nodes[i].length; j++) {
        for (let k = 0; k < this.nodes[i + 1].length; k++) {
          this.connections.push({
            from: this.nodes[i][j],
            to: this.nodes[i + 1][k],
            weight: Math.random() - 0.5,
            signal: 0,
          });
        }
      }
    }
  }

  resize(width: number, height: number) {
    this.canvas.width = Math.max(300, Math.floor(width));
    this.canvas.height = Math.max(200, Math.floor(height));
    this.initNetwork();
  }

  propagate() {
    this.connections.forEach((c) => {
      c.signal = c.from.activation * c.weight;
      c.to.pulse = Math.min(1, c.to.pulse + c.signal * 0.1);
    });

    this.nodes.forEach((layer) => {
      layer.forEach((n) => {
        n.activation = Math.tanh(n.activation + n.bias + n.pulse);
        n.pulse *= 0.95;
      });
    });
  }

  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // connections
    this.connections.forEach((c) => {
      const grad = ctx.createLinearGradient(c.from.x, c.from.y, c.to.x, c.to.y);
      const intensity = Math.min(1, Math.abs(c.signal));
      grad.addColorStop(0, `hsla(280, 70%, 60%, ${intensity})`);
      grad.addColorStop(1, `hsla(200, 70%, 60%, ${intensity})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.5, intensity * 2);
      ctx.beginPath();
      ctx.moveTo(c.from.x, c.from.y);
      ctx.lineTo(c.to.x, c.to.y);
      ctx.stroke();
    });

    // nodes
    this.nodes.forEach((layer, layerIdx) => {
      layer.forEach((n) => {
        const r = 8 + n.pulse * 10;
        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2);
        glow.addColorStop(0, `hsla(${280 + layerIdx * 30}, 100%, 70%, ${n.activation})`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsl(${280 + layerIdx * 30}, 70%, 50%)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }
}

/** ─────────────────────────────────────────────────────────
 *  Component
 *  ──────────────────────────────────────────────────────── */

const AnalyticsPage: React.FC = () => {
  // Core states
  const [quantumState, setQuantumState] = useState<"superposition" | "entangled" | "collapsed" | "tunneling">("entangled");
  const [dimensionalShift, setDimensionalShift] = useState(0);
  const [realityDistortion, setRealityDistortion] = useState(0);
  const [streamDNA, setStreamDNA] = useState("");
  const [neuralActivity, setNeuralActivity] = useState<
    Array<{ timestamp: number; alpha: number; beta: number; gamma: number; delta: number; theta: number }>
  >([]);
  const [emotionalSpectrum, setEmotionalSpectrum] = useState<EmotionalSpectrum>({
    joy: 0, excitement: 0, surprise: 0, engagement: 0, satisfaction: 0, loyalty: 0,
  });
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [audioVisualizerData, setAudioVisualizerData] = useState<number[]>([]);
  const [viewerSentiment, setViewerSentiment] = useState(75);
  const [interstellarConnections, setInterstellarConnections] = useState<Connection[]>([]);
  const [isLiveMode] = useState(true);

  // Refs
  const quantumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dnaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const neuralCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation frame IDs
  const rafQuantum = useRef<number | null>(null);
  const rafDNA = useRef<number | null>(null);
  const rafNeural = useRef<number | null>(null);

  // Orbs (Hintergrund-Deko, statisch generiert)
  const orbs = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        size: 300 + i * 100,
        hue: 280 + i * 30,
        top: Math.random() * 100,
        left: Math.random() * 100,
        dur: 20 + i * 5,
        delay: i * 2,
      })),
    []
  );

  /** Data Generator */
  useEffect(() => {
    // Stream DNA
    const genDNA = () => {
      const bases = ["A", "T", "G", "C"];
      let s = "";
      for (let i = 0; i < 50; i++) s += bases[Math.floor(Math.random() * 4)];
      setStreamDNA(s);
    };

    // Neural Activity
    const genNeural = () => {
      const a: Array<{ timestamp: number; alpha: number; beta: number; gamma: number; delta: number; theta: number }> = [];
      for (let i = 0; i < 20; i++) {
        a.push({
          timestamp: Date.now() - i * 60000,
          alpha: Math.random() * 100,
          beta: Math.random() * 100,
          gamma: Math.random() * 100,
          delta: Math.random() * 100,
          theta: Math.random() * 100,
        });
      }
      setNeuralActivity(a);
    };

    // Emotional Spectrum
    const genEmotion = () => {
      setEmotionalSpectrum({
        joy: Math.random() * 100,
        excitement: Math.random() * 100,
        surprise: Math.random() * 100,
        engagement: Math.random() * 100,
        satisfaction: Math.random() * 100,
        loyalty: Math.random() * 100,
      });
    };

    // Timeline Events
    const genTimeline = () => {
      setTimelineEvents([
        { time: "14:23", type: "peak", value: 15234, description: "Viewer-Explosion" },
        { time: "15:45", type: "achievement", value: 100000, description: "Milestone erreicht" },
        { time: "16:12", type: "viral", value: 50000, description: "Clip ging viral" },
        { time: "17:30", type: "raid", value: 8000, description: "Raid erhalten" },
        { time: "18:45", type: "donation", value: 500, description: "Top-Donation" },
      ]);
    };

    // Galaxy / Interstellar Connections
    const genConnections = () => {
      const conns: Connection[] = [];
      for (let i = 0; i < 10; i++) {
        conns.push({
          source: `Node${i}`,
          target: `Node${Math.floor(Math.random() * 10)}`,
          strength: Math.random(),
          type: ["follow", "raid", "host", "collab"][Math.floor(Math.random() * 4)] as Connection["type"],
        });
      }
      setInterstellarConnections(conns);
    };

    // Audio
    const genAudio = () => {
      const arr = Array.from({ length: 32 }, () => Math.random() * 100);
      setAudioVisualizerData(arr);
    };

    genDNA();
    genNeural();
    genEmotion();
    genTimeline();
    genConnections();
    genAudio();

    const timer = setInterval(() => {
      if (!isLiveMode) return;
      genAudio();
      setViewerSentiment(60 + Math.random() * 40);
      setDimensionalShift((p) => (p + 1) % 360);
      setRealityDistortion(Math.sin(Date.now() * 0.001) * 50 + 50);
      setQuantumState(["superposition", "entangled", "collapsed", "tunneling"][Math.floor(Math.random() * 4)] as typeof quantumState);
      genEmotion();
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveMode]);

  /** Canvas: Quantum Particles (Background) */
  useEffect(() => {
    const canvas = quantumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fit = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    fit();

    const particles: QuantumParticle[] = [];
    const COUNT = Math.min(140, Math.floor((canvas.width * canvas.height) / 40000)); // dynamisch
    for (let i = 0; i < COUNT; i++) {
      const p = new QuantumParticle(Math.random() * canvas.width, Math.random() * canvas.height);
      if (i > 0 && Math.random() > 0.7) p.entangled = particles[Math.floor(Math.random() * particles.length)];
      particles.push(p);
    }

    const draw = () => {
      // leichte „motion blur“-Fläche
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(particles, canvas.width, canvas.height);
        p.draw(ctx);
      });

      rafQuantum.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", fit);

    return () => {
      if (rafQuantum.current) cancelAnimationFrame(rafQuantum.current);
      window.removeEventListener("resize", fit);
    };
  }, []);

  /** Canvas: DNA Helix + Neural Network (in Cards) */
  useEffect(() => {
    // DNA
    let dna: DNAHelix | null = null;
    const dnaCanvas = dnaCanvasRef.current;
    if (dnaCanvas) {
      const resizeDNA = () => {
        const rect = dnaCanvas.getBoundingClientRect();
        dna?.resize(rect.width, 180);
      };
      dna = new DNAHelix(dnaCanvas);
      const step = () => {
        dna!.draw();
        rafDNA.current = requestAnimationFrame(step);
      };
      resizeDNA();
      step();
      window.addEventListener("resize", resizeDNA);
    }

    // Neural
    let nn: NeuralNetwork | null = null;
    const neuralCanvas = neuralCanvasRef.current;
    if (neuralCanvas) {
      const resizeNN = () => {
        const rect = neuralCanvas.getBoundingClientRect();
        nn?.resize(rect.width, 220);
      };
      nn = new NeuralNetwork(neuralCanvas);
      const tick = () => {
        nn!.propagate();
        nn!.draw();
        rafNeural.current = requestAnimationFrame(tick);
      };
      resizeNN();
      tick();
      window.addEventListener("resize", resizeNN);
    }

    return () => {
      if (rafDNA.current) cancelAnimationFrame(rafDNA.current);
      if (rafNeural.current) cancelAnimationFrame(rafNeural.current);
      window.removeEventListener("resize", () => {});
    };
  }, []);

  /** UI-Subkomponenten (render-only) */

  const RealityDistortionField: React.FC = () => (
    <div className="qa-card qa-card--black qa-card--padded qa-rdf">
      <div
        className="qa-rdf-core"
        style={{
          transform: `rotate(${dimensionalShift}deg) scale(${1 + realityDistortion * 0.01})`,
          filter: `blur(${realityDistortion * 0.5}px)`,
          background: `conic-gradient(from ${dimensionalShift}deg, #8b5cf6, #ec4899, #06b6d4, #10b981, #f59e0b, #ef4444, #8b5cf6)`,
        }}
      />
      <div className="qa-rdf-center">
        <div className="qa-rdf-value">{Math.round(realityDistortion)}%</div>
        <div className="qa-rdf-label">Reality Distortion</div>
        <div className="qa-rdf-sub">{quantumState}</div>
      </div>

      <svg className="qa-rdf-grid" preserveAspectRatio="none">
        <defs>
          <pattern id="qa-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#qa-grid)" />
      </svg>
    </div>
  );

  const EmotionalRadar: React.FC = () => {
    const radarData = Object.entries(emotionalSpectrum).map(([key, value]) => ({
      emotion: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fullMark: 100,
    }));

    return (
      <div className="qa-card qa-card--purple qa-card--padded">
        <h3 className="qa-card-title">
          <Heart className="qa-icon qa-icon--accent" />
          Emotional Spectrum Analysis
        </h3>
        <div className="qa-chart-area">
          <ProFeatureWrapper featureName="analytics_deep" showUpgradePrompt message="Emotions-Radar ist Teil von PRO."><ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(139, 92, 246, 0.2)" />
              <PolarAngleAxis dataKey="emotion" stroke="#9ca3af" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(139, 92, 246, 0.3)" />
              <Radar name="Emotions" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer></ProFeatureWrapper>
        </div>
        <div className="qa-emote-summary">
          {Object.entries(emotionalSpectrum)
            .slice(0, 3)
            .map(([emotion, value]) => (
              <div key={emotion} className="qa-emote-item">
                <div className="qa-emote-emoji">{value > 80 ? "🔥" : value > 60 ? "⚡" : value > 40 ? "✨" : "💫"}</div>
                <div className="qa-emote-label">{emotion}</div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const StreamDNAVisualizer: React.FC = () => {
    const counts = useMemo(
      () => ({
        A: streamDNA.split("A").length - 1,
        T: streamDNA.split("T").length - 1,
        G: streamDNA.split("G").length - 1,
        C: streamDNA.split("C").length - 1,
      }),
      [streamDNA]
    );

    return (
      <div className="qa-card qa-card--cyan qa-card--padded">
        <h3 className="qa-card-title">
          <Atom className="qa-icon qa-icon--accent" />
          Stream DNA Sequence
        </h3>

        <canvas ref={dnaCanvasRef} className="qa-canvas qa-canvas--dna" />

        <div className="qa-dna-seq">
          {streamDNA.split("").map((base, i) => (
            <span key={`${base}-${i}`} className={`qa-dna-base qa-dna-base--${base}`}>
              {base}
            </span>
          ))}
        </div>

        <div className="qa-dna-stats">
          <div className="qa-dna-stat qa-dna-stat--A">
            <div className="qa-dna-stat-label">Adenin</div>
            <div className="qa-dna-stat-value">{counts.A}</div>
          </div>
          <div className="qa-dna-stat qa-dna-stat--T">
            <div className="qa-dna-stat-label">Thymin</div>
            <div className="qa-dna-stat-value">{counts.T}</div>
          </div>
          <div className="qa-dna-stat qa-dna-stat--G">
            <div className="qa-dna-stat-label">Guanin</div>
            <div className="qa-dna-stat-value">{counts.G}</div>
          </div>
          <div className="qa-dna-stat qa-dna-stat--C">
            <div className="qa-dna-stat-label">Cytosin</div>
            <div className="qa-dna-stat-value">{counts.C}</div>
          </div>
        </div>
      </div>
    );
  };

  const NeuralActivityMonitor: React.FC = () => (
    <div className="qa-card qa-card--indigo qa-card--padded">
      <h3 className="qa-card-title">
        <Brain className="qa-icon qa-icon--accent" />
        Neural Stream Activity
      </h3>

      <canvas ref={neuralCanvasRef} className="qa-canvas qa-canvas--neural" />

      <div className="qa-neural-bars">
        {["Alpha", "Beta", "Gamma", "Delta", "Theta"].map((wave) => {
          const key = wave.toLowerCase() as keyof (typeof neuralActivity)[number];
          const val = neuralActivity[0]?.[key] ?? Math.random() * 100;
          return (
            <div key={wave} className="qa-neural-col">
              <div className="qa-neural-label">{wave}</div>
              <div className="qa-neural-bar">
                <div className="qa-neural-fill" style={{ height: `${val}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const TimelineVisualizer: React.FC = () => (
    <div className="qa-card qa-card--gray qa-card--padded">
      <h3 className="qa-card-title">
        <Clock className="qa-icon qa-icon--accent qa-icon--green" />
        Stream Timeline Events
      </h3>

      <div className="qa-timeline">
        <div className="qa-timeline-axis" />
        {timelineEvents.map((ev, idx) => (
          <div key={`${ev.type}-${idx}`} className="qa-timeline-item">
            <div className="qa-timeline-dot" />
            <div className={`qa-timeline-card qa-timeline-card--${ev.type}`}>
              <div className="qa-timeline-meta">
                <span className="qa-timeline-time">{ev.time}</span>
                <span className="qa-timeline-badge">{ev.type.toUpperCase()}</span>
              </div>
              <p className="qa-timeline-desc">{ev.description}</p>
              <p className="qa-timeline-value">{ev.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AudioSpectrumVisualizer: React.FC = () => (
    <div className="qa-card qa-card--pink qa-card--padded">
      <h3 className="qa-card-title">
        <Radio className="qa-icon qa-icon--accent qa-icon--pulse" />
        Live Audio Spectrum
      </h3>

      <div className="qa-audio-bars">
        {audioVisualizerData.map((v, i) => (
          <div key={i} className="qa-audio-bar" style={{ height: `${v}%`, boxShadow: `0 0 ${v / 5}px rgba(236,72,153,0.5)` }} />
        ))}
      </div>

      <div className="qa-audio-scale">
        <span>20Hz</span>
        <span>1kHz</span>
        <span>5kHz</span>
        <span>10kHz</span>
        <span>20kHz</span>
      </div>
    </div>
  );

  const ViewerSentimentAnalyzer: React.FC = () => (
    <div className="qa-card qa-card--emerald qa-card--padded">
      <h3 className="qa-card-title">
        <Shield className="qa-icon qa-icon--accent qa-icon--emerald" />
        Viewer Sentiment Shield
      </h3>

      <div className="qa-shield">
        <div className="qa-shield-rings" />
        <div className="qa-shield-core">
          <span className="qa-shield-value">{Math.round(viewerSentiment)}%</span>
        </div>

        <div className="qa-shield-legend">
          <div className="qa-shield-item">
            <div className="qa-emoji">😍</div>
            <div className="qa-legend-label">Begeistert</div>
            <div className="qa-legend-val">{Math.round(viewerSentiment * 0.4)}%</div>
          </div>
          <div className="qa-shield-item">
            <div className="qa-emoji">😊</div>
            <div className="qa-legend-label">Zufrieden</div>
            <div className="qa-legend-val">{Math.round(viewerSentiment * 0.35)}%</div>
          </div>
          <div className="qa-shield-item">
            <div className="qa-emoji">😐</div>
            <div className="qa-legend-label">Neutral</div>
            <div className="qa-legend-val">{Math.round(viewerSentiment * 0.25)}%</div>
          </div>
        </div>
      </div>
    </div>
  );

  const InterstellarMap: React.FC = () => (
    <div className="qa-card qa-card--blue qa-card--padded">
      <h3 className="qa-card-title">
        <Globe className="qa-icon qa-icon--accent qa-icon--blue" />
        Interstellar Network
      </h3>

      <div className="qa-map">
        <svg className="qa-map-svg">
          {interstellarConnections.map((conn, idx) => {
            const x1 = 50 + Math.cos(idx * 0.6) * 30;
            const y1 = 50 + Math.sin(idx * 0.6) * 30;
            const x2 = 50 + Math.cos((idx + 3) * 0.6) * 30;
            const y2 = 50 + Math.sin((idx + 3) * 0.6) * 30;
            const hue = 200 + idx * 20;

            return (
              <g key={idx}>
                <line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={`hsla(${hue}, 70%, 60%, ${conn.strength})`}
                  strokeWidth={Math.max(1, conn.strength * 3)}
                  className="qa-pulse"
                />
                <circle cx={`${x1}%`} cy={`${y1}%`} r="4" fill={`hsl(${hue}, 70%, 60%)`} className="qa-pulse" />
              </g>
            );
          })}

          <defs>
            <radialGradient id="qa-central">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </radialGradient>
          </defs>
          <circle cx="50%" cy="50%" r="8" fill="url(#qa-central)" />
        </svg>

        <div className="qa-map-label qa-map-label--tl">Collab Network</div>
        <div className="qa-map-label qa-map-label--br">Raid Chains</div>
        <div className="qa-map-label qa-map-label--tr">Host Links</div>
      </div>
    </div>
  );

  return (
    <div className="qa-root">
      {/* Hintergrund-Canvas */}
      <canvas ref={quantumCanvasRef} className="qa-quantum-canvas" />

      {/* Multi-D Background */}
      <div className="qa-bg">
        <div className="qa-bg-gradient" />
        <div className="qa-orbs">
          {orbs.map((o, i) => (
            <div
              key={i}
              className="qa-orb"
              style={{
                width: `${o.size}px`,
                height: `${o.size}px`,
                top: `${o.top}%`,
                left: `${o.left}%`,
                background: `radial-gradient(circle, hsla(${o.hue}, 70%, 50%, 0.1) 0%, transparent 70%)`,
                animationDuration: `${o.dur}s`,
                animationDelay: `${o.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="qa-content">
        <header className="qa-header">
          <h1 className="qa-title">
            <span className="qa-title-gradient">QUANTUM ANALYTICS</span>
          </h1>
          <p className="qa-subtitle">Welcome to the 5th Dimension of Streaming</p>

          <div className="qa-indicators">
            <div className="qa-ind-item">
              <Orbit className="qa-icon qa-icon--spin qa-icon--purple" />
              <span className="qa-ind-text">Quantum State: {quantumState}</span>
            </div>
            <div className="qa-ind-item">
              <Atom className="qa-icon qa-icon--pulse qa-icon--cyan" />
              <span className="qa-ind-text">Dimension: {Math.floor(dimensionalShift / 72) + 1}/5</span>
            </div>
            <div className="qa-ind-item">
              <Zap className="qa-icon qa-icon--yellow" />
              <span className="qa-ind-text">Reality: {Math.round(realityDistortion)}%</span>
            </div>
          </div>
        </header>

        {/* Grid */}
        <div className="qa-grid qa-grid--top">
          <div className="qa-col">
            <StreamDNAVisualizer />
            <AudioSpectrumVisualizer />
          </div>
          <div className="qa-col">
            <RealityDistortionField />
            <NeuralActivityMonitor />
          </div>
          <div className="qa-col">
            <EmotionalRadar />
            <ProFeatureWrapper featureName="analytics_deep" showUpgradePrompt message="Deep Analytics (Stimmung/Heatmaps/Trends) sind Teil von PRO. Hol dir Abo oder Tageskarte (24h) für vollen Zugriff.">
            <ViewerSentimentAnalyzer />
          </ProFeatureWrapper>
          </div>
        </div>

        <ProFeatureWrapper featureName="analytics_deep" showUpgradePrompt message="Deep Analytics (Timeline & Geo) sind Teil von PRO.">
          <div className="qa-grid qa-grid--bottom">
            <TimelineVisualizer />
            <InterstellarMap />
          </div>
        </ProFeatureWrapper>
      </div>
    </div>
  );
};

export default AnalyticsPage;