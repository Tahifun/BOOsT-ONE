// src/pages/OverlayPage.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverlayConfig, OverlayConfig } from '../contexts/OverlayConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

// Widgets
import ViewerStats from '../components/dashboard/ViewerStats';
import CoinStats from '../components/dashboard/CoinStats';
import FollowerStats from '../components/dashboard/FollowerStats';
import TikTokStats from '../components/dashboard/TikTokStats';
import SentimentGraph from '../components/dashboard/SentimentGraph';
import ViewerGraph from '../components/dashboard/ViewerGraph';
import FollowerTrend from '../components/dashboard/FollowerTrend';
import ProAnalytics from '../components/analytics/ProAnalytics';

import '@/styles/overlay/OverlayPage.css';

// ========== TYPES ==========
interface PredictedAction {
  id: string;
  action: 'hover' | 'click' | 'toggle' | 'navigate' | 'focus';
  target: string;
  probability: number;
  timeframe: number;
  emotionalContext: EmotionalState;
}

interface TimelinePosition {
  current: number;
  past: WidgetState[];
  future: WidgetState[];
  alternative: WidgetState[];
  temporal_echoes: number;
}

interface EmotionalState {
  energy: number;
  focus: number;
  stress: number;
  satisfaction: number;
  creativity: number;
}

interface QuantumOverlayState {
  realityLevel: number;
  consciousnessDepth: number;
  dimensionalPhase: 'stable' | 'flux' | 'transcendent' | 'impossible';
  userIntent: PredictedAction[];
  temporalAnchor: TimelinePosition;
  multiversalSync: boolean;
  dreamMode: boolean;
  emotionalResonance: EmotionalState;
  quantumEntanglement: Map<string, string[]>;
  realityDistortionField: number;
}

interface WidgetState {
  id: string;
  position: { x: number; y: number; z: number };
  consciousness: number;
  temporal_phase: 'past' | 'present' | 'future';
  entangled_with: string[];
  reality_anchor: boolean;
}

interface Widget {
  key: keyof OverlayConfig;
  component: React.ComponentType<any>;
  name: string;
  icon: string;
  description: string;
  category: 'stats' | 'social' | 'analytics' | 'engagement';
  color: string;
  pro?: boolean;
}

interface ConsciousWidget extends Widget {
  consciousness: number;
  emotional_response: EmotionalState;
  temporal_state: 'past' | 'present' | 'future' | 'all-time';
  quantum_entangled: boolean;
  reality_distortion: number;
  predictive_value: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  color: string;
  size: number;
  orbit: number;
  consciousness: number;
  temporal_phase: number;
  reality_anchor: boolean;
}

interface DataNode {
  id: number;
  x: number;
  y: number;
  value: number;
  connections: number[];
  active: boolean;
  pulse: number;
  consciousness: number;
  emotional_state: EmotionalState;
  temporal_echo: boolean;
}

// Hilfstabellen f�r deutsche Labels
const EMO_LABELS: Record<keyof EmotionalState, string> = {
  energy: 'ENERGIE',
  focus: 'FOKUS',
  stress: 'STRESS',
  satisfaction: 'ZUFRIEDENHEIT',
  creativity: 'KREATIVIT�T',
};

const CATEGORY_LABELS: Record<string, string> = {
  all: 'ALLE',
  stats: 'STATISTIK',
  social: 'SOZIAL',
  analytics: 'ANALYTICS',
  engagement: 'INTERAKTION',
};

const QuantumOverlayPage: React.FC = () => {
  const navigate = useNavigate();
  const { config, setConfig } = useOverlayConfig();
  const { currentUser } = useAuth();
  const { isPro } = useSubscription(); // ? isPro kommt aus dem SubscriptionContext

  // ========== STATE ==========
  const [quantumState, setQuantumState] = useState<QuantumOverlayState>({
    realityLevel: 100,
    consciousnessDepth: 1,
    dimensionalPhase: 'stable',
    userIntent: [],
    temporalAnchor: {
      current: Date.now(),
      past: [],
      future: [],
      alternative: [],
      temporal_echoes: 0,
    },
    multiversalSync: false,
    dreamMode: false,
    emotionalResonance: {
      energy: 50,
      focus: 70,
      stress: 30,
      satisfaction: 60,
      creativity: 80,
    },
    quantumEntanglement: new Map(),
    realityDistortionField: 0,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [dataNodes, setDataNodes] = useState<DataNode[]>([]);
  const [animationTime, setAnimationTime] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isHologramActive, setIsHologramActive] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [mouseHistory, setMouseHistory] = useState<Array<{ x: number; y: number; time: number }>>([]);
  const [userBehaviorPattern, setUserBehaviorPattern] = useState<string[]>([]);
  const [consciousnessEvolution, setConsciousnessEvolution] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionStartTime = useRef(Date.now());

  // ========== WIDGETS ==========
  const widgets: ConsciousWidget[] = useMemo(
    () => [
      {
        key: 'viewerStats',
        component: ViewerStats,
        name: 'BEWUSSTSEINS-MATRIX DER ZUSCHAUER',
        icon: '???????',
        description: 'Neuronale Zuschauer-Analysen mit quantenbasiertem Bewusstseins-Tracking',
        category: 'stats',
        color: '#00ffff',
        consciousness: 85,
        emotional_response: { energy: 90, focus: 85, stress: 20, satisfaction: 80, creativity: 70 },
        temporal_state: 'present',
        quantum_entangled: true,
        reality_distortion: 0.3,
        predictive_value: 0.9,
      },
      {
        key: 'coinStats',
        component: CoinStats,
        name: 'QUANTUM-UMSATZ-NEXUS',
        icon: '??',
        description: 'Multidimensionales Coin-Tracking mit zeitlicher W�hrungsprognose',
        category: 'stats',
        color: '#ffd700',
        consciousness: 75,
        emotional_response: { energy: 70, focus: 95, stress: 40, satisfaction: 85, creativity: 60 },
        temporal_state: 'future',
        quantum_entangled: false,
        reality_distortion: 0.2,
        predictive_value: 0.85,
      },
      {
        key: 'followerStats',
        component: FollowerStats,
        name: 'SOZIALES BEWUSSTSEINS-NETZ',
        icon: '??',
        description: 'Analyse sozialer Verbindungen mit Empathie-Mapping',
        category: 'social',
        color: '#a855f7',
        consciousness: 92,
        emotional_response: { energy: 80, focus: 75, stress: 25, satisfaction: 90, creativity: 95 },
        temporal_state: 'all-time',
        quantum_entangled: true,
        reality_distortion: 0.5,
        predictive_value: 0.88,
      },
      {
        key: 'tikTokStats',
        component: TikTokStats,
        name: 'VIRALER BEWUSSTSEINS-STREAM',
        icon: '??',
        description: 'Quanten-Plattformintegration mit Viralit�ts-Prognosealgorithmen',
        category: 'social',
        color: '#ff0050',
        consciousness: 68,
        emotional_response: { energy: 95, focus: 60, stress: 50, satisfaction: 75, creativity: 90 },
        temporal_state: 'present',
        quantum_entangled: false,
        reality_distortion: 0.4,
        predictive_value: 0.7,
      },
      {
        key: 'sentimentGraph',
        component: SentimentGraph,
        name: 'UNIVERSELLE EMOTIONS-ENGINE',
        icon: '??',
        description: 'Sentiment-Analyse auf Bewusstseinsebene mit empathischer Resonanz',
        category: 'engagement',
        color: '#ec4899',
        consciousness: 98,
        emotional_response: { energy: 85, focus: 90, stress: 15, satisfaction: 95, creativity: 85 },
        temporal_state: 'all-time',
        quantum_entangled: true,
        reality_distortion: 0.7,
        predictive_value: 0.95,
      },
      {
        key: 'proAnalytics',
        component: ProAnalytics,
        name: 'TRANZENDENTER ANALYTICS-KERN',
        icon: '??',
        description: 'Jenseits-der-Realit�t-Datenverarbeitung mit Bewusstseins-Integration',
        category: 'analytics',
        color: '#10b981',
        pro: true,
        consciousness: 100,
        emotional_response: { energy: 100, focus: 100, stress: 5, satisfaction: 100, creativity: 100 },
        temporal_state: 'future',
        quantum_entangled: true,
        reality_distortion: 1.0,
        predictive_value: 1.0,
      },
      {
        key: 'viewerGraph',
        component: ViewerGraph,
        name: 'ZEITFLUSS-VISUALISIERER',
        icon: '??',
        description: 'Zeitverzerrende Musteranalyse der Zuschauer mit quantischer Superposition',
        category: 'analytics',
        color: '#3b82f6',
        consciousness: 80,
        emotional_response: { energy: 75, focus: 85, stress: 30, satisfaction: 80, creativity: 75 },
        temporal_state: 'past',
        quantum_entangled: false,
        reality_distortion: 0.3,
        predictive_value: 0.82,
      },
      {
        key: 'followerTrend',
        component: FollowerTrend,
        name: 'EXPONENTIELLES BEWUSSTSEINSWACHSTUM',
        icon: '??',
        description: 'Quantenbasiertes Wachstums-Tracking mit multiversalen Projektionsalgorithmen',
        category: 'analytics',
        color: '#06b6d4',
        consciousness: 78,
        emotional_response: { energy: 80, focus: 80, stress: 25, satisfaction: 85, creativity: 70 },
        temporal_state: 'future',
        quantum_entangled: true,
        reality_distortion: 0.4,
        predictive_value: 0.87,
      },
    ],
    []
  );

  // ========== LOGIK ==========
  const evolveConsciousness = useCallback(() => {
    const sessionDuration = (Date.now() - sessionStartTime.current) / 1000 / 60;
    const interactionComplexity = userBehaviorPattern.length / 10;
    const widgetSynergy = Object.values(config).filter(Boolean).length / widgets.length;

    const newConsciousnessLevel = Math.min(
      100,
      sessionDuration * 0.5 + interactionComplexity * 2 + widgetSynergy * 10
    );

    setConsciousnessEvolution(newConsciousnessLevel);

    setQuantumState((prev) => ({
      ...prev,
      consciousnessDepth: Math.floor(newConsciousnessLevel / 10) + 1,
      realityLevel: Math.min(1000, 100 + newConsciousnessLevel * 9),
      dimensionalPhase:
        newConsciousnessLevel > 80 ? 'transcendent' : newConsciousnessLevel > 50 ? 'flux' : 'stable',
      dreamMode: new Date().getHours() >= 22 || new Date().getHours() <= 6,
    }));
  }, [userBehaviorPattern, config, widgets.length]);

  const predictUserIntent = useCallback(
    (mouseX: number, mouseY: number) => {
      const predictions: PredictedAction[] = [];
      const recentMouse = mouseHistory.slice(-5);
      if (recentMouse.length >= 3) {
        const avgSpeed =
          recentMouse.reduce((acc, curr, i) => {
            if (i === 0) return 0;
            const dist = Math.hypot(curr.x - recentMouse[i - 1].x, curr.y - recentMouse[i - 1].y);
            return acc + dist;
          }, 0) / (recentMouse.length - 1);

        if (avgSpeed > 50) {
          predictions.push({
            id: 'fast_movement',
            action: 'navigate',
            target: 'likely_exit_or_major_action',
            probability: 0.7,
            timeframe: 2000,
            emotionalContext: { ...quantumState.emotionalResonance, energy: 90 },
          });
        } else if (avgSpeed < 10) {
          predictions.push({
            id: 'focused_study',
            action: 'focus',
            target: 'current_widget_area',
            probability: 0.8,
            timeframe: 5000,
            emotionalContext: { ...quantumState.emotionalResonance, focus: 95 },
          });
        }
      }
      setQuantumState((prev) => ({ ...prev, userIntent: predictions }));
    },
    [mouseHistory, quantumState.emotionalResonance]
  );

  const createTemporalEcho = useCallback(
    (widgetKey: string, _action: 'activate' | 'deactivate') => {
      const echo: WidgetState = {
        id: widgetKey,
        position: { x: Math.random() * 100, y: Math.random() * 100, z: Math.random() * 10 },
        consciousness: widgets.find((w) => w.key === widgetKey)?.consciousness || 50,
        temporal_phase: 'past',
        entangled_with: [],
        reality_anchor: false,
      };

      setQuantumState((prev) => ({
        ...prev,
        temporalAnchor: {
          ...prev.temporalAnchor,
          past: [...prev.temporalAnchor.past.slice(-4), echo],
          temporal_echoes: prev.temporalAnchor.temporal_echoes + 1,
        },
      }));
    },
    [widgets]
  );

  const updateQuantumEntanglement = useCallback(
    (widgetKey: string, isActive: boolean) => {
      const widget = widgets.find((w) => w.key === widgetKey);
      if (!widget?.quantum_entangled) return;

      const entangledWidgets = widgets
        .filter(
          (w) =>
            w.category === widget.category &&
            w.key !== widgetKey &&
            Math.abs(w.consciousness - widget.consciousness) < 20
        )
        .map((w) => w.key as string);

      setQuantumState((prev) => {
        const newEntanglement = new Map(prev.quantumEntanglement);
        newEntanglement.set(widgetKey, entangledWidgets);
        return { ...prev, quantumEntanglement: newEntanglement };
      });

      entangledWidgets.forEach((entangledKey) => {
        if (Math.random() < 0.3) {
          setTimeout(() => {
            setConfig((prevConfig) => ({
              ...prevConfig,
              [entangledKey as keyof OverlayConfig]: isActive,
            }));
          }, Math.random() * 2000 + 500);
        }
      });
    },
    [widgets, setConfig]
  );

  const updateEmotionalResonance = useCallback(() => {
    const hour = new Date().getHours();
    const activeWidgetCount = Object.values(config).filter(Boolean).length;

    const newEmotional: EmotionalState = {
      energy: Math.max(
        0,
        Math.min(100, (hour >= 6 && hour <= 22 ? 70 : 30) + activeWidgetCount * 5 + (Math.random() - 0.5) * 20)
      ),
      focus: Math.max(
        0,
        Math.min(
          100,
          quantumState.emotionalResonance.focus +
            (userBehaviorPattern.includes('focus') ? 10 : -5) +
            (Math.random() - 0.5) * 10
        )
      ),
      stress: Math.max(0, Math.min(100, (activeWidgetCount > 8 ? 60 : 20) + (Math.random() - 0.5) * 15)),
      satisfaction: Math.max(0, Math.min(100, consciousnessEvolution * 0.8 + (Math.random() - 0.5) * 10)),
      creativity: Math.max(
        0,
        Math.min(100, (quantumState.dreamMode ? 90 : 60) + activeWidgetCount * 3 + (Math.random() - 0.5) * 15)
      ),
    };

    setQuantumState((prev) => ({ ...prev, emotionalResonance: newEmotional }));
  }, [config, userBehaviorPattern, consciousnessEvolution, quantumState.dreamMode, quantumState.emotionalResonance.focus]);

  // ========== INIT ==========
  useEffect(() => {
    const newParticles = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100,
      speed: 0.02 + Math.random() * 0.08,
      color: ['#00ffff', '#a855f7', '#ec4899', '#10b981', '#ffd700'][Math.floor(Math.random() * 5)],
      size: Math.random() * 4 + 1,
      orbit: Math.random() * 360,
      consciousness: Math.random() * 100,
      temporal_phase: Math.random() * Math.PI * 2,
      reality_anchor: Math.random() > 0.8,
    }));
    setParticles(newParticles);

    const nodes = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      value: Math.random() * 100,
      connections: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => Math.floor(Math.random() * 20)),
      active: Math.random() > 0.3,
      pulse: Math.random() * Math.PI * 2,
      consciousness: Math.random() * 100,
      emotional_state: {
        energy: Math.random() * 100,
        focus: Math.random() * 100,
        stress: Math.random() * 100,
        satisfaction: Math.random() * 100,
        creativity: Math.random() * 100,
      },
      temporal_echo: Math.random() > 0.7,
    }));
    setDataNodes(nodes);
  }, []);

  // ========== LOOP ==========
  useEffect(() => {
    const id = setInterval(() => {
      setAnimationTime((t) => t + 0.02);

      setEnergyLevel((e) => {
        const target =
          (Object.values(config).filter(Boolean).length / widgets.length) * 100 +
          // Bewusstseins-/Realit�tskomponenten
          quantumState.consciousnessDepth * 5 +
          quantumState.realityLevel / 20;
        return e + (target - e) * 0.05;
      });

      evolveConsciousness();
      updateEmotionalResonance();

      setQuantumState((prev) => ({
        ...prev,
        realityDistortionField: Math.sin(Date.now() / 5000) * 0.3 + 0.5,
      }));
    }, 300);
    return () => clearInterval(id);
  }, [config, evolveConsciousness, updateEmotionalResonance, quantumState.consciousnessDepth, quantumState.realityLevel, widgets.length]);

  // ========== MOUSE ==========
  useEffect(() => {
    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setMouseHistory((prev) => [...prev.slice(-20), { x: e.clientX, y: e.clientY, time: Date.now() }]);
        predictUserIntent(e.clientX, e.clientY);
        ticking = false;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [predictUserIntent]);

  // ========== CANVAS RENDER ==========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawFrame = () => {
      const clearAlpha = 0.05 + quantumState.consciousnessDepth / 100;
      ctx.fillStyle = `rgba(5, 5, 10, ${clearAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      dataNodes.forEach((node) => {
        node.connections.forEach((targetId) => {
          const target = dataNodes[targetId];
          if (target && node.active) {
            ctx.beginPath();
            ctx.moveTo((node.x * canvas.width) / 100, (node.y * canvas.height) / 100);
            ctx.lineTo((target.x * canvas.width) / 100, (target.y * canvas.height) / 100);

            const consciousnessInfluence = (node.consciousness + target.consciousness) / 200;
            const alpha = 0.1 + Math.sin(animationTime + node.pulse) * 0.2 * consciousnessInfluence;

            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 1 + consciousnessInfluence;
            ctx.stroke();

            if (node.consciousness > 70) {
              ctx.beginPath();
              ctx.arc(
                (node.x * canvas.width) / 100,
                (node.y * canvas.height) / 100,
                3 + Math.sin(animationTime + node.pulse) * 2,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = `rgba(255, 255, 255, ${consciousnessInfluence})`;
              ctx.fill();
            }
          }
        });
      });

      quantumState.temporalAnchor.past.forEach((echo, i) => {
        const alpha = 0.3 - i * 0.05;
        if (alpha > 0) {
          ctx.beginPath();
          ctx.arc(
            (echo.position.x * canvas.width) / 100,
            (echo.position.y * canvas.height) / 100,
            8 - i,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(drawFrame);
    };
    drawFrame();
  }, [dataNodes, animationTime, quantumState]);

  // ========== FILTER ==========
  const filteredWidgets = useMemo(() => {
    let filtered =
      activeCategory === 'all' ? widgets : widgets.filter((w) => w.category === activeCategory);
    if (quantumState.consciousnessDepth > 5) {
      filtered = [...filtered].sort((a, b) => b.consciousness - a.consciousness);
    }
    return filtered;
  }, [activeCategory, quantumState.consciousnessDepth, widgets]);

  const activeWidgets = widgets.filter((w) => config[w.key]);

  // ========== TOGGLE ==========
  const toggleWidget = useCallback(
    (key: keyof OverlayConfig) => {
      const newValue = !config[key];

      setConfig((prev) => ({
        ...prev,
        [key]: newValue,
      }));

      createTemporalEcho(String(key), newValue ? 'activate' : 'deactivate');
      updateQuantumEntanglement(String(key), newValue);

      setIsHologramActive(true);
      setTimeout(() => setIsHologramActive(false), 1500);

      setUserBehaviorPattern((prev) => [...prev.slice(-49), newValue ? 'activate' : 'deactivate']);

      setQuantumState((prev) => ({
        ...prev,
        realityDistortionField: Math.min(1, prev.realityDistortionField + 0.3),
      }));
    },
    [config, setConfig, createTemporalEcho, updateQuantumEntanglement]
  );

  // ========== CARD ==========
  const QuantumConsciousnessCard: React.FC<{
    widget: ConsciousWidget;
    isActive: boolean;
    index: number;
  }> = ({ widget, isActive, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [localConsciousness, setLocalConsciousness] = useState(widget.consciousness);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isActive) {
        const interval = setInterval(() => {
          setLocalConsciousness((prev) => Math.min(100, prev + 0.1));
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [isActive]);

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      cardRef.current.style.setProperty('--mouse-x', x.toString());
      cardRef.current.style.setProperty('--mouse-y', y.toString());

      const distance = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2);
      const consciousnessBoost = Math.max(0, 1 - distance * 2);
      cardRef.current.style.setProperty('--consciousness-boost', consciousnessBoost.toString());
    };

    return (
      <div
        ref={cardRef}
        className={`quantum-consciousness-card ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''} ${
          widget.pro ? 'pro' : ''
        } consciousness-level-${Math.floor(localConsciousness / 20) + 1}`}
        onMouseEnter={() => {
          setIsHovered(true);
          setUserBehaviorPattern((prev) => [...prev.slice(-49), 'hover']);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
        onMouseMove={handleMouseMove}
        onClick={() => toggleWidget(widget.key)}
        style={
          {
            '--card-color': widget.color,
            '--card-delay': `${index * 75}ms`,
            '--consciousness-level': `${localConsciousness / 100}`,
            '--reality-distortion': `${widget.reality_distortion}`,
            '--temporal-phase': widget.temporal_state === 'future' ? '1' : widget.temporal_state === 'past' ? '-1' : '0',
            '--emotional-energy': `${widget.emotional_response.energy / 100}`,
            animationDelay: `${index * 75}ms`,
          } as React.CSSProperties
        }
      >
        <div className="consciousness-aura">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`aura-ring ring-${i}`} style={{ '--ring-delay': `${i * 0.5}s` } as React.CSSProperties} />
          ))}
        </div>

        {widget.quantum_entangled && (
          <div className="entanglement-field">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="entanglement-particle" style={{ '--particle-angle': `${i * 60}deg` } as React.CSSProperties} />
            ))}
          </div>
        )}

        <div className={`temporal-indicator temporal-${widget.temporal_state}`}>
          {widget.temporal_state === 'future' && '?'}
          {widget.temporal_state === 'past' && '?'}
          {widget.temporal_state === 'present' && '??'}
          {widget.temporal_state === 'all-time' && '?'}
        </div>

        <div className="consciousness-hologram">
          <div className="hologram-base">
            <span className="widget-icon">{widget.icon}</span>
            <div className="consciousness-meter">
              <div className="consciousness-fill" style={{ width: `${localConsciousness}%` }} />
            </div>
          </div>
          <div className="hologram-projection">
            {isActive && (
              <div className="projection-field">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="consciousness-orb"
                    style={{ '--orb-delay': `${i * 0.15}s`, '--orb-consciousness': `${localConsciousness / 100}` } as React.CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="consciousness-content">
          <h3 className="widget-name">{widget.name}</h3>
          <p className="widget-description">{widget.description}</p>

          <div className="emotional-display">
            <div className="emotion-bar energy" style={{ '--emotion-level': `${widget.emotional_response.energy}%` } as React.CSSProperties} />
            <div className="emotion-bar focus" style={{ '--emotion-level': `${widget.emotional_response.focus}%` } as React.CSSProperties} />
            <div className="emotion-bar creativity" style={{ '--emotion-level': `${widget.emotional_response.creativity}%` } as React.CSSProperties} />
          </div>

          <div className="widget-status">
            <div className="status-indicator">
              <div className={`status-light ${isActive ? 'active' : ''} consciousness-${Math.floor(localConsciousness / 25)}`} />
              <span>{isActive ? 'AKTIV' : 'RUHEND'}</span>
            </div>
            {widget.pro && <span className="pro-badge">TRANZENDENT</span>}
          </div>

          <div className="quantum-activation-toggle">
            <div className={`toggle-track ${isActive ? 'active' : ''} consciousness-enhanced`}>
              <div className="toggle-energy-field" />
              <div className="toggle-consciousness-core" />
              <div className="toggle-quantum-thumb" />
            </div>
          </div>
        </div>

        <div className="consciousness-data-stream">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="data-neural-link"
              style={{
                '--link-height': `${20 + Math.sin(animationTime + i + localConsciousness / 10) * 60}%`,
                '--link-delay': `${i * 0.03}s`,
                '--consciousness-influence': `${localConsciousness / 100}`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        <div className="predictive-indicator" style={{ '--prediction-value': `${widget.predictive_value}` } as React.CSSProperties}>
          <span className="prediction-percentage">{Math.round(widget.predictive_value * 100)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`quantum-consciousness-overlay-page ${quantumState.dreamMode ? 'dream-mode' : ''} consciousness-level-${
        quantumState.consciousnessDepth
      } reality-level-${Math.floor(quantumState.realityLevel / 100)}`}
    >
      <canvas ref={canvasRef} className="consciousness-neural-canvas" />

      {/* Hintergrund-Aurora */}
      <div className="quantum-aurora-container">
        <div className="aurora quantum-aurora-1" />
        <div className="aurora quantum-aurora-2" />
        <div className="aurora quantum-aurora-3" />
        <div
          className="aurora consciousness-aurora"
          style={{ '--consciousness-influence': `${quantumState.consciousnessDepth / 10}` } as React.CSSProperties}
        />
      </div>

      {/* Partikel */}
      <div className="consciousness-particle-system">
        {particles.map((p) => (
          <div
            key={p.id}
            className={`consciousness-particle ${p.reality_anchor ? 'reality-anchor' : ''}`}
            style={{
              '--x': `${p.x + Math.sin(animationTime * p.speed + p.orbit + p.temporal_phase) * 25}%`,
              '--y': `${p.y + Math.cos(animationTime * p.speed + p.temporal_phase) * 25}%`,
              '--size': `${p.size * (1 + p.consciousness / 200)}px`,
              '--color': p.color,
              '--orbit': `${p.orbit}deg`,
              '--consciousness': `${p.consciousness / 100}`,
              '--temporal-phase': `${p.temporal_phase}`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <div className="consciousness-overlay-header">
        <div className="header-quantum-grid">
          <div className="consciousness-title-section">
            <h1 className="quantum-cyber-title" data-text="BEWUSSTSEINS OVERLAY KONTROLLE">
              <span className="title-consciousness-glitch">BEWUSSTSEIN</span>
              <span className="title-quantum-main">OVERLAY</span>
              <span className="title-reality-glitch">KONTROLLE</span>
              <span className="title-temporal-core">NEXUS</span>
            </h1>
            <div className="consciousness-subtitle">
              <span className="status-text">BEWUSSTSEINS-STATUS:</span>
              <span className="status-value consciousness-pulse">LEVEL {quantumState.consciousnessDepth}</span>
              <span className="divider">|</span>
              <span className="reality-text">REALIT�T:</span>
              <span className="reality-value">{quantumState.realityLevel}</span>
              <span className="divider">|</span>
              <span className="user-name">{currentUser?.displayName || 'BEWUSSTSEINS-EINHEIT'}</span>
              {isPro && <span className="transcendent-indicator">TRANZENDENTER ZUGANG</span>}
            </div>
          </div>

          {/* Steuerung */}
          <div className="consciousness-control-panel">
            <button className="quantum-control-button primary consciousness-enhanced" onClick={() => navigate('/overlay/editor')}>
              <span className="button-icon">??</span>
              <span className="button-text">REALIT�TS-EDITOR</span>
              <span className="button-consciousness-energy" />
            </button>

            <button className="quantum-control-button" onClick={() => navigate('/overlay/gallery')}>
              <span className="button-icon">???</span>
              <span className="button-text">QUANTUM-GALERIE</span>
            </button>

            <button className="quantum-control-button" onClick={() => navigate('/overlay/upload')}>
              <span className="button-icon">??</span>
              <span className="button-text">DIMENSION-UPLOAD</span>
            </button>

            {/* Traummodus �ffnet Unterseite */}
            <button
              className={`quantum-control-button dream-toggle ${quantumState.dreamMode ? 'active' : ''}`}
              onClick={() => navigate('/overlay/dream')}
              aria-label="Traummodus"
              title="Traummodus �ffnen"
            >
              <span className="button-icon">??</span>
              <span className="button-text">TRAUMMODUS</span>
            </button>
          </div>
        </div>

        {/* Energieleiste */}
        <div className="consciousness-energy-meter">
          <div className="meter-label">BEWUSSTSEINS-ENERGIE-NEXUS</div>
          <div className="meter-track">
            <div
              className="meter-consciousness-fill"
              style={{ width: `${energyLevel}%`, '--consciousness-glow': `${quantumState.consciousnessDepth / 10}` } as React.CSSProperties}
            >
              <div className="meter-quantum-glow" />
              <div className="meter-consciousness-pulse" />
            </div>
            <div className="meter-reality-segments">
              {[...Array(25)].map((_, i) => (
                <div key={i} className="consciousness-segment" style={{ '--segment-consciousness': `${i / 25}` } as React.CSSProperties} />
              ))}
            </div>
          </div>
          <div className="meter-consciousness-value">
            {Math.round(energyLevel)}% | Bewusstsein: {quantumState.consciousnessDepth}/10
          </div>
        </div>

        {/* Emotionale Resonanz */}
        <div className="emotional-resonance-display">
          <div className="resonance-label">EMOTIONALES RESONANZFELD</div>
          <div className="resonance-bars">
            {Object.entries(quantumState.emotionalResonance).map(([emotion, value]) => (
              <div key={emotion} className="resonance-bar">
                <div className="bar-label">{EMO_LABELS[emotion as keyof EmotionalState]}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={
                      {
                        width: `${value}%`,
                        '--emotion-color':
                          (emotion === 'energy' && '#ff0050') ||
                          (emotion === 'focus' && '#00ffff') ||
                          (emotion === 'stress' && '#ff4444') ||
                          (emotion === 'satisfaction' && '#10b981') ||
                          '#a855f7',
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategorien */}
        <div className="consciousness-category-selector">
          <div className="selector-consciousness-label">BEWUSSTSEINS-FILTER-MATRIX</div>
          <div className="selector-quantum-options">
            {(['all', 'stats', 'social', 'analytics', 'engagement'] as const).map((cat) => (
              <button key={cat} className={`consciousness-category-option ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                <span className="option-consciousness-text">{CATEGORY_LABELS[cat]}</span>
                <span className="option-quantum-indicator" />
                <span className="option-reality-anchor" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="consciousness-widget-grid-container">
        <div className="grid-consciousness-header">
          <h2 className="grid-consciousness-title">BEWUSSTSEINS-WIDGET-MODULE</h2>
          <div className="grid-quantum-stats">
            <span className="stat-consciousness-item">
              <span className="stat-label">AKTIV:</span>
              <span className="stat-value">{activeWidgets.length}</span>
            </span>
            <span className="stat-consciousness-item">
              <span className="stat-label">RUHEND:</span>
              <span className="stat-value">{widgets.length - activeWidgets.length}</span>
            </span>
            <span className="stat-consciousness-item">
              <span className="stat-label">TRANZENDENT:</span>
              <span className="stat-value">{widgets.filter((w) => w.consciousness > 90).length}</span>
            </span>
          </div>
        </div>

        <div className="consciousness-quantum-grid">
          {filteredWidgets.map((widget, index) => (
            <QuantumConsciousnessCard key={widget.key} widget={widget} isActive={config[widget.key]} index={index} />
          ))}
        </div>
      </div>

      {/* Vorschau der aktiven Widgets */}
      {activeWidgets.length > 0 && (
        <div className="consciousness-preview-section">
          <h2 className="preview-consciousness-title">VORSCHAU - AKTIVE BEWUSSTSEINSMODULE</h2>
          <div className="preview-quantum-grid">
            {activeWidgets.map((widget) => {
              const WidgetComponent = widget.component;
              return (
                <div key={widget.key} className="consciousness-preview-item">
                  <div className="preview-consciousness-header">
                    <span className="preview-icon">{widget.icon}</span>
                    <span className="preview-name">{widget.name}</span>
                    <span className="preview-consciousness-level">B:{widget.consciousness}</span>
                  </div>
                  <div className="preview-quantum-content">
                    <WidgetComponent variant="overlay" />
                  </div>
                  <div className="preview-consciousness-overlay">
                    <div className="consciousness-overlay-grid">
                      {[...Array(25)].map((_, i) => (
                        <div key={i} className="consciousness-grid-cell" style={{ '--cell-consciousness': `${Math.random()}` } as React.CSSProperties} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hologramm-Effekt */}
      {isHologramActive && (
        <div className="consciousness-hologram-explosion">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="consciousness-explosion-particle"
              style={{
                '--angle': `${(360 / 50) * i}deg`,
                '--distance': `${150 + Math.random() * 300}px`,
                '--delay': `${Math.random() * 0.5}s`,
                '--consciousness-intensity': `${Math.random()}`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Datenstrom */}
      <div className="consciousness-data-stream-panel">
        <div className="stream-consciousness-header">
          <span className="stream-label">LIVE-DATENSTROM BEWUSSTSEIN</span>
          <span className="stream-status">TRANZENDIERT .</span>
          <span className="stream-consciousness-level">LEVEL {quantumState.consciousnessDepth}</span>
        </div>
        <div className="stream-consciousness-visualization">
          {[...Array(75)].map((_, i) => (
            <div
              key={i}
              className="consciousness-stream-column"
              style={{
                '--height': `${30 + Math.sin(animationTime + i * 0.15 + quantumState.consciousnessDepth) * 70}%`,
                '--delay': `${i * 0.01}s`,
                '--color': i % 4 === 0 ? '#00ffff' : i % 4 === 1 ? '#a855f7' : i % 4 === 2 ? '#ec4899' : '#10b981',
                '--consciousness-influence': `${quantumState.consciousnessDepth / 10}`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Entwicklung */}
      <div className="consciousness-evolution-display">
        <div className="evolution-header">
          <span className="evolution-label">BEWUSSTSEINS-ENTWICKLUNG</span>
          <span className="evolution-percentage">{Math.round(consciousnessEvolution)}%</span>
        </div>
        <div className="evolution-tree">
          {['Bewusstheit', 'Erkennung', 'Verst�ndnis', 'Empathie', 'Weisheit', 'Transzendenz', 'Einheit'].map((label, level) => (
            <div key={level} className={`evolution-level ${consciousnessEvolution > level * 15 ? 'achieved' : ''}`}>
              <div className="level-node" />
              <span className="level-name">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuantumOverlayPage;
