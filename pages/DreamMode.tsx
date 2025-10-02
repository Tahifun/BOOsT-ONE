// src/pages/DreamMode.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "@/styles/overlay/DreamMode.css";

interface EmotionData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface ModuleData {
  id: "reality" | "gallery" | "upload" | "dream";
  name: string;
  icon: string;
  energy: number;
}

interface ConsciousnessEntity {
  id: number;
  x: number;
  y: number;
  velocity: { x: number; y: number };
  size: number;
  opacity: number;
}

interface WidgetStatus {
  conscious: number;
  dormant: number;
  transcendent: number;
}

const ROUTES: Record<ModuleData["id"], string> = {
  reality: "/overlay",
  gallery: "/overlay/gallery",
  upload: "/overlay/upload",
  dream: "/overlay/dream",
};

const DreamMode: React.FC = () => {
  const navigate = useNavigate();

  // Core States
  const [level, setLevel] = useState<number>(2);
  const [realityIndex, setRealityIndex] = useState<string>("236.857675");
  const [dimension, setDimension] = useState<string>("5D");
  const [consciousnessPercent, setConsciousnessPercent] = useState<number>(164);
  const [activeModule, setActiveModule] = useState<ModuleData["id"]>("dream");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isQuantumMode, setIsQuantumMode] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);

  // Neural Network
  const [neuralNodes, setNeuralNodes] = useState<ConsciousnessEntity[]>([]);
  const [neuralConnections, setNeuralConnections] = useState<Array<[number, number]>>([]);

  // Emotions
  const [emotions, setEmotions] = useState<EmotionData[]>([
    { name: "Energy",       value: 75, color: "#78dbff", icon: "?" },
    { name: "Focus",        value: 88, color: "#ff77c6", icon: "??" },
    { name: "Stress",       value: 32, color: "#ff6b6b", icon: "??" },
    { name: "Satisfaction", value: 91, color: "#4ecdc4", icon: "?" },
    { name: "Creativity",   value: 95, color: "#a855f7", icon: "??" },
  ]);

  // Widget Status
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>({
    conscious: 7,
    dormant: 1,
    transcendent: 3,
  });

  // Quantum Particles
  const [particles, setParticles] = useState<ConsciousnessEntity[]>([]);
  const animationRef = useRef<number | null>(null);

  // Stream + Matrix
  const [streamData, setStreamData] = useState<number[]>(new Array(50).fill(0));
  const [matrixRain, setMatrixRain] = useState<string[][]>([]);

  // Init network
  useEffect(() => {
    const nodes: ConsciousnessEntity[] = [];
    const connections: Array<[number, number]> = [];

    for (let i = 0; i < 20; i++) {
      nodes.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        velocity: { x: (Math.random() - 0.5) * 0.5, y: (Math.random() - 0.5) * 0.5 },
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
    for (let i = 0; i < 15; i++) {
      const from = Math.floor(Math.random() * 20);
      const to = Math.floor(Math.random() * 20);
      if (from !== to) connections.push([from, to]);
    }
    setNeuralNodes(nodes);
    setNeuralConnections(connections);
  }, []);

  // Reality index + glitch
  useEffect(() => {
    const i = window.setInterval(() => {
      setRealityIndex((Math.random() * 500).toFixed(6));
      if (Math.random() > 0.9) {
        setGlitchActive(true);
        window.setTimeout(() => setGlitchActive(false), 200);
      }
    }, 2000);
    return () => window.clearInterval(i);
  }, []);

  // Consciousness energy
  useEffect(() => {
    const i = window.setInterval(() => {
      setConsciousnessPercent(prev =>
        Math.max(0, Math.min(200, prev + (Math.random() * 20 - 10))),
      );
    }, 3000);
    return () => window.clearInterval(i);
  }, []);

  // Emotions
  useEffect(() => {
    const i = window.setInterval(() => {
      setEmotions(prev =>
        prev.map(e => ({
          ...e,
          value: Math.max(10, Math.min(100, e.value + (Math.random() * 10 - 5))),
        })),
      );
    }, 2000);
    return () => window.clearInterval(i);
  }, []);

  // Widget status
  useEffect(() => {
    const i = window.setInterval(() => {
      setWidgetStatus({
        conscious: Math.floor(Math.random() * 10 + 5),
        dormant: Math.floor(Math.random() * 3),
        transcendent: Math.floor(Math.random() * 5 + 1),
      });
    }, 5000);
    return () => window.clearInterval(i);
  }, []);

  // Dimension shifter
  useEffect(() => {
    const dims = ["3D", "4D", "5D", "7D", "11D", "?D"];
    const i = window.setInterval(
      () => setDimension(dims[Math.floor(Math.random() * dims.length)]),
      8000,
    );
    return () => window.clearInterval(i);
  }, []);

  // Level up
  useEffect(() => {
    const i = window.setInterval(() => {
      if (Math.random() > 0.7) {
        setLevel(prev => prev + 1);
        const el = document.getElementById("level-display");
        if (el) {
          el.classList.add("level-up");
          window.setTimeout(() => el.classList.remove("level-up"), 1000);
        }
      }
    }, 10000);
    return () => window.clearInterval(i);
  }, []);

  // Stream data
  useEffect(() => {
    const i = window.setInterval(() => {
      setStreamData(prev => {
        const next = prev.slice(1);
        next.push(Math.random() * 100);
        return next;
      });
    }, 100);
    return () => window.clearInterval(i);
  }, []);

  // Matrix rain
  useEffect(() => {
    const chars = "01*#@<>[]{}()|/\_+-=~!?";
    const cols = 20;
    const rows = 10;
    const i = window.setInterval(() => {
      const matrix: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) row.push(chars[Math.floor(Math.random() * chars.length)]);
        matrix.push(row);
      }
      setMatrixRain(matrix);
    }, 150);
    return () => window.clearInterval(i);
  }, []);

  // Particle loop (requestAnimationFrame)
  useEffect(() => {
    const tick = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.velocity.x,
            y: p.y + p.velocity.y,
            opacity: p.opacity * 0.98,
          }))
          .filter(p => p.opacity > 0.01),
      );

      if (Math.random() > 0.7) {
        const p: ConsciousnessEntity = {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: window.innerHeight,
          velocity: { x: (Math.random() - 0.5) * 2, y: -Math.random() * 3 - 1 },
          size: Math.random() * 3 + 1,
          opacity: 1,
        };
        setParticles(prev => [...prev.slice(-50), p]);
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  // Module activation (with navigation)
  const handleModuleActivation = useCallback(
    (moduleId: ModuleData["id"]) => {
      setActiveModule(moduleId);
      setIsQuantumMode(true);
      window.setTimeout(() => setIsQuantumMode(false), 500);

      // Ripple effect
      const ripple = document.createElement("div");
      ripple.className = "quantum-ripple";
      document.body.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 1000);

      // Navigate to the corresponding route
      if (moduleId !== "dream") navigate(ROUTES[moduleId]);
    },
    [navigate],
  );

  // Filter handler
  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "4") {
        const ids: ModuleData["id"][] = ["reality", "gallery", "upload", "dream"];
        handleModuleActivation(ids[parseInt(e.key, 10) - 1]);
      }
      if (e.key === "q" && e.ctrlKey) setIsQuantumMode(prev => !prev);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [handleModuleActivation]);

  // Tiny mouse trail
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (Math.random() > 0.95) {
        const t = document.createElement("div");
        t.className = "mouse-trail";
        t.style.left = `${e.clientX}px`;
        t.style.top = `${e.clientY}px`;
        document.body.appendChild(t);
        window.setTimeout(() => t.remove(), 1000);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className={`dream-mode-container ${isQuantumMode ? "quantum-active" : ""} ${glitchActive ? "glitch-active" : ""}`}>
      {/* Background */}
      <div className="quantum-field" />
      <div className="consciousness-grid" />

      {/* Neural network */}
      <svg className="neural-network-svg">
        {neuralConnections.map(([from, to], i) => (
          <line
            key={i}
            x1={neuralNodes[from]?.x || 0}
            y1={neuralNodes[from]?.y || 0}
            x2={neuralNodes[to]?.x || 0}
            y2={neuralNodes[to]?.y || 0}
            className="neural-connection"
          />
        ))}
        {neuralNodes.map(n => (
          <circle key={n.id} cx={n.x} cy={n.y} r={n.size} className="neural-node" style={{ opacity: n.opacity }} />
        ))}
      </svg>

      {/* Particles */}
      <div className="particle-system">
        {particles.map(p => (
          <div
            key={p.id}
            className="consciousness-particle"
            style={{ left: `${p.x}px`, top: `${p.y}px`, width: `${p.size}px`, height: `${p.size}px`, opacity: p.opacity }}
          />
        ))}
      </div>

      {/* Matrix */}
      <div className="matrix-rain">
        {matrixRain.map((row, i) => (
          <div key={i} className="matrix-row">
            {row.map((ch, j) => (
              <span key={j} className="matrix-char">
                {ch}
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* UI */}
      <div className="dream-interface">
        <header className="consciousness-header">
          <div className="status-grid">
            <div className="status-item">
              <div className="status-label">LEVEL</div>
              <div className="status-value" id="level-display">
                <span className="holographic">{level}</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">REALITY INDEX</div>
              <div className="status-value glitch-text">{realityIndex}</div>
            </div>
            <div className="status-item">
              <div className="status-label">ENTITIES</div>
              <div className="status-value infinity-symbol">?</div>
            </div>
            <div className="status-item">
              <div className="status-label">DIMENSION</div>
              <div className="status-value dimension-display">{dimension}</div>
            </div>
          </div>

          <div className="stream-visualizer">
            {streamData.map((v, i) => (
              <div key={i} className="stream-bar" style={{ height: `${v}%` }} />
            ))}
          </div>
        </header>

        <section className="module-grid">
          {(
            [
              { id: "reality", name: "Reality Editor", icon: "??", energy: 87 },
              { id: "gallery", name: "Quantum Gallery", icon: "??", energy: 92 },
              { id: "upload", name: "Dimension Upload", icon: "??", energy: 76 },
              { id: "dream", name: "Dream Mode", icon: "??", energy: 100 },
            ] as ModuleData[]
          ).map(m => (
            <div
              key={m.id}
              className={`module-card ${activeModule === m.id ? "active" : ""}`}
              onClick={() => handleModuleActivation(m.id)}
            >
              <div className="module-icon">{m.icon}</div>
              <div className="module-name">{m.name}</div>
              <div className="module-energy">
                <div className="energy-bar" style={{ width: `${m.energy}%` }} />
              </div>
              <div className="module-status">{activeModule === m.id ? "ONLINE" : "STANDB}</div>
            </div>
          ))}
        </section>

        <section className="energy-nexus">
          <h3 className="nexus-title">CONSCIOUSNESS ENERGY NEXUS</h3>
          <div className="energy-container">
            <div className="energy-background">
              <div className="energy-fill" style={{ width: `${consciousnessPercent}%` }}>
                <div className="energy-particles">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="energy-particle" />
                  ))}
                </div>
                <span className="energy-text">{consciousnessPercent}% CONSCIOUSNESS (2/10)</span>
              </div>
            </div>
            <div className="energy-overflow">
              {consciousnessPercent > 100 && <div className="overflow-indicator">OVERLOAD</div>}
            </div>
          </div>
        </section>

        <section className="emotional-field">
          <h3 className="field-title">EMOTIONAL RESONANCE FIELD</h3>
          <div className="emotion-grid">
            {emotions.map(e => (
              <div key={e.name} className="emotion-item">
                <div className="emotion-header">
                  <span className="emotion-icon">{e.icon}</span>
                  <span className="emotion-name">{e.name}</span>
                </div>
                <div className="emotion-meter">
                  <div className="emotion-background">
                    <div
                      className="emotion-fill"
                      style={{ height: `${e.value}%`, background: `linear-gradient(180deg, ${e.color}, transparent)` }}
                    >
                      <span className="emotion-value">{Math.round(e.value)}%</span>
                    </div>
                  </div>
                  <div className="emotion-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="filter-matrix">
          <h3 className="matrix-title">CONSCIOUSNESS FILTER MATRIX</h3>
          <div className="filter-controls">
            {["ALL", "STATS", "SOCIAL", "ANALYTICS", "ENGAGEMENT", "QUANTUM"].map(f => {
              const key = f.toLowerCase();
              return (
                <button
                  key={f}
                  className={`filter-btn ${activeFilter === key ? "active" : ""}`}
                  onClick={() => handleFilterChange(key)}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </section>

        <section className="widget-dashboard">
          <div className="widget-grid">
            <div className="widget-card conscious">
              <div className="widget-value">{widgetStatus.conscious}</div>
              <div className="widget-label">CONSCIOUS</div>
              <div className="widget-indicator active" />
            </div>
            <div className="widget-card dormant">
              <div className="widget-value">{widgetStatus.dormant}</div>
              <div className="widget-label">DORMANT</div>
              <div className="widget-indicator inactive" />
            </div>
            <div className="widget-card transcendent">
              <div className="widget-value">{widgetStatus.transcendent}</div>
              <div className="widget-label">TRANSCENDENT</div>
              <div className="widget-indicator transcendent-glow" />
            </div>
          </div>
        </section>

        <section className="quantum-control">
          <button className="quantum-toggle on" onClick={() => setIsQuantumMode(prev => !prev)}>
            {isQuantumMode ? "?? QUANTUM MODE ACTIVE" : "? ACTIVATE QUANTUM MODE"}
          </button>
        </section>
      </div>

      <div className="consciousness-overlay" />
      <div className="dream-vignette" />
    </div>
  );
};

export default DreamMode;
