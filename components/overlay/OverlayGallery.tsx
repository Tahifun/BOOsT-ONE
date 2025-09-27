import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import OverlayCard from './OverlayCard';
import OverlayPreviewModal from './OverlayPreviewModal';
import OverlayCategoryFilter from './OverlayCategoryFilter';

import "@/styles/overlay/OverlayGalleryPage.css";

// ========== QUANTUM GALLERY INTERFACES ==========

export interface OverlayData {
  _id: string;
  name: string;
  imageUrl: string;
  category: string;
  uploader?: string;
  createdAt?: string;
  // Quantum Properties
  consciousness?: number;
  realityLevel?: number;
  temporalPhase?: 'past' | 'present' | 'future';
  quantumSignature?: string;
  dimensionalStability?: number;
  creativityIndex?: number;
  emotionalResonance?: EmotionalSignature;
}

interface EmotionalSignature {
  energy: number;
  inspiration: number;
  tranquility: number;
  power: number;
  mystery: number;
}

interface QuantumGalleryState {
  viewMode: 'matrix' | 'neural' | 'dimensional' | 'consciousness';
  realityFilter: number; // 0-1000
  temporalView: 'all' | 'past' | 'present' | 'future';
  consciousnessThreshold: number;
  dimensionalPhase: number;
  quantumCoherence: number;
  creativityBoost: boolean;
  emotionalFilter: keyof EmotionalSignature | 'all';
}

interface GalleryParticle {
  id: number;
  x: number;
  y: number;
  z: number;
  velocity: { x: number; y: number; z: number };
  size: number;
  color: string;
  consciousness: number;
  lifespan: number;
  age: number;
  connectedTo: number[];
  quantumState: 'stable' | 'superposition' | 'entangled';
}

interface QuantumPortal {
  id: string;
  x: number;
  y: number;
  radius: number;
  destination: string;
  activeLevel: number;
  particles: GalleryParticle[];
  consciousness: number;
}

const QuantumOverlayGallery: React.FC = () => {
  const [overlays, setOverlays] = useState<OverlayData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [previewOverlay, setPreviewOverlay] = useState<OverlayData | null>(null);
  const [quantumState, setQuantumState] = useState<QuantumGalleryState>({
    viewMode: 'matrix',
    realityFilter: 500,
    temporalView: 'all',
    consciousnessThreshold: 30,
    dimensionalPhase: 0,
    quantumCoherence: 100,
    creativityBoost: false,
    emotionalFilter: 'all'
  });

  const [galleryParticles, setGalleryParticles] = useState<GalleryParticle[]>([]);
  const [quantumPortals, setQuantumPortals] = useState<QuantumPortal[]>([]);
  const [animationTime, setAnimationTime] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [galleryConsciousness, setGalleryConsciousness] = useState(50);
  const [dimensionalRift, setDimensionalRift] = useState(false);
  const [creativityField, setCreativityField] = useState(false);

  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ========== QUANTUM CONSCIOUSNESS OVERLAYS ==========
  const enhanceOverlaysWithQuantumProperties = useCallback((rawOverlays: OverlayData[]): OverlayData[] => {
    return rawOverlays.map(overlay => ({
      ...overlay,
      consciousness: Math.floor(Math.random() * 100) + 1,
      realityLevel: Math.floor(Math.random() * 1000) + 100,
      temporalPhase: ['past', 'present', 'future'][Math.floor(Math.random() * 3)] as 'past' | 'present' | 'future',
      quantumSignature: `QS-${overlay._id.slice(0, 8)}-${Math.random().toString(36).substr(2, 6)}`,
      dimensionalStability: Math.random() * 100,
      creativityIndex: Math.random() * 100,
      emotionalResonance: {
        energy: Math.random() * 100,
        inspiration: Math.random() * 100,
        tranquility: Math.random() * 100,
        power: Math.random() * 100,
        mystery: Math.random() * 100
      }
    }));
  }, []);

  // ========== QUANTUM PARTICLE SYSTEM ==========
  useEffect(() => {
    const initializeQuantumParticles = () => {
      const particles: GalleryParticle[] = Array.from({ length: 200 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 100,
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.2
        },
        size: Math.random() * 3 + 1,
        color: ['#00ffff', '#a855f7', '#ec4899', '#10b981', '#ffd700'][Math.floor(Math.random() * 5)],
        consciousness: Math.random() * 100,
        lifespan: 1000 + Math.random() * 2000,
        age: 0,
        connectedTo: [],
        quantumState: ['stable', 'superposition', 'entangled'][Math.floor(Math.random() * 3)] as any
      }));

      // Create quantum connections
      particles.forEach(particle => {
        const nearbyParticles = particles
          .filter(p => p.id !== particle.id)
          .filter(p => {
            const dist = Math.sqrt(
              Math.pow(p.x - particle.x, 2) + 
              Math.pow(p.y - particle.y, 2)
            );
            return dist < 20;
          })
          .slice(0, 3);
        
        particle.connectedTo = nearbyParticles.map(p => p.id);
      });

      setGalleryParticles(particles);
    };

    const initializeQuantumPortals = () => {
      const portals: QuantumPortal[] = Array.from({ length: 5 }, (_, i) => ({
        id: `portal-${i}`,
        x: (i + 1) * 20,
        y: 20 + (i % 2) * 60,
        radius: 50 + Math.random() * 100,
        destination: ['matrix', 'neural', 'dimensional', 'consciousness', 'creativity'][i],
        activeLevel: Math.random() * 100,
        particles: [],
        consciousness: Math.random() * 100
      }));

      setQuantumPortals(portals);
    };

    initializeQuantumParticles();
    initializeQuantumPortals();
  }, []);

  // ========== DATA FETCHING WITH QUANTUM ENHANCEMENT ==========
  useEffect(() => {
    setIsSearching(true);
    
    fetch("/api/overlays/all")
      .then(res => res.json())
      .then(data => {
        const enhancedOverlays = enhanceOverlaysWithQuantumProperties(data.overlays || []);
        setOverlays(enhancedOverlays);
        setIsSearching(false);
        
        // Consciousness evolution based on gallery size
        setGalleryConsciousness(Math.min(100, enhancedOverlays.length * 2));
      })
      .catch(() => setIsSearching(false));
  }, [enhanceOverlaysWithQuantumProperties]);

  // ========== ANIMATION LOOP ==========
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(t => t + 0.03);
      
      // Update particle system
      setGalleryParticles(prev => prev.map(particle => {
        const newAge = particle.age + 1;
        const newX = particle.x + particle.velocity.x;
        const newY = particle.y + particle.velocity.y;
        const newZ = particle.z + particle.velocity.z;
        
        // Boundary wrapping
        const wrappedX = newX < 0 ? 100 : newX > 100 ? 0 : newX;
        const wrappedY = newY < 0 ? 100 : newY > 100 ? 0 : newY;
        const wrappedZ = newZ < 0 ? 100 : newZ > 100 ? 0 : newZ;
        
        // Consciousness evolution
        const newConsciousness = Math.min(100, particle.consciousness + 0.01);
        
        return {
          ...particle,
          x: wrappedX,
          y: wrappedY,
          z: wrappedZ,
          age: newAge,
          consciousness: newConsciousness,
          quantumState: newAge % 300 === 0 ? 
            (['stable', 'superposition', 'entangled'][Math.floor(Math.random() * 3)] as any) : 
            particle.quantumState
        };
      }));

      // Update quantum state
      setQuantumState(prev => ({
        ...prev,
        dimensionalPhase: (prev.dimensionalPhase + 0.5) % 360,
        quantumCoherence: Math.max(10, Math.min(100, prev.quantumCoherence + (Math.random() - 0.5) * 2))
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // ========== MOUSE CONSCIOUSNESS TRACKING ==========
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setMousePosition({ x, y });
      
      // Mouse influence on particles
      setGalleryParticles(prev => prev.map(particle => {
        const distance = Math.sqrt(
          Math.pow(particle.x - x, 2) + 
          Math.pow(particle.y - y, 2)
        );
        
        if (distance < 15) {
          const force = (15 - distance) / 15;
          return {
            ...particle,
            velocity: {
              x: particle.velocity.x + (x - particle.x) * force * 0.001,
              y: particle.velocity.y + (y - particle.y) * force * 0.001,
              z: particle.velocity.z
            },
            consciousness: Math.min(100, particle.consciousness + force * 2)
          };
        }
        return particle;
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ========== QUANTUM CANVAS RENDERING ==========
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawFrame = () => {
      // Clear with quantum effect
      ctx.fillStyle = `rgba(5, 8, 15, ${0.1 + galleryConsciousness / 1000})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw quantum connections
      galleryParticles.forEach(particle => {
        particle.connectedTo.forEach(connectedId => {
          const connected = galleryParticles.find(p => p.id === connectedId);
          if (connected && particle.quantumState === 'entangled') {
            ctx.beginPath();
            ctx.moveTo(
              particle.x * canvas.width / 100, 
              particle.y * canvas.height / 100
            );
            ctx.lineTo(
              connected.x * canvas.width / 100, 
              connected.y * canvas.height / 100
            );
            
            const alpha = (particle.consciousness + connected.consciousness) / 200 * 0.3;
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Draw particles
      galleryParticles.forEach(particle => {
        const x = particle.x * canvas.width / 100;
        const y = particle.y * canvas.height / 100;
        const size = particle.size * (1 + particle.consciousness / 200);
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        
        if (particle.quantumState === 'superposition') {
          // Superposition effect
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          gradient.addColorStop(0, particle.color + 'AA');
          gradient.addColorStop(0.5, particle.color + '66');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = particle.color + Math.floor(particle.consciousness * 2.55).toString(16).padStart(2, '0');
        }
        
        ctx.fill();
        
        // Consciousness glow
        if (particle.consciousness > 70) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = particle.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw quantum portals
      quantumPortals.forEach(portal => {
        const x = portal.x * canvas.width / 100;
        const y = portal.y * canvas.height / 100;
        
        ctx.beginPath();
        ctx.arc(x, y, portal.radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, portal.radius);
        gradient.addColorStop(0, `rgba(168, 85, 247, ${portal.activeLevel / 300})`);
        gradient.addColorStop(0.7, `rgba(0, 255, 255, ${portal.activeLevel / 500})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      requestAnimationFrame(drawFrame);
    };
    
    drawFrame();
  }, [galleryParticles, quantumPortals, galleryConsciousness]);

  // ========== FILTERING LOGIC ==========
  const categories = useMemo(() => 
    Array.from(new Set(overlays.map(o => o.category))), 
    [overlays]
  );

  const filteredOverlays = useMemo(() => {
    let filtered = overlays;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(o => o.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(o => 
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.uploader?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Quantum filters
    filtered = filtered.filter(o => {
      if (o.consciousness && o.consciousness < quantumState.consciousnessThreshold) return false;
      if (o.realityLevel && o.realityLevel < quantumState.realityFilter) return false;
      if (quantumState.temporalView !== 'all' && o.temporalPhase !== quantumState.temporalView) return false;
      return true;
    });

    // Emotional filter
    if (quantumState.emotionalFilter !== 'all' && overlays[0]?.emotionalResonance) {
      filtered = filtered.sort((a, b) => {
        const aValue = a.emotionalResonance?.[quantumState.emotionalFilter as keyof EmotionalSignature] || 0;
        const bValue = b.emotionalResonance?.[quantumState.emotionalFilter as keyof EmotionalSignature] || 0;
        return bValue - aValue;
      });
    }

    return filtered;
  }, [overlays, selectedCategory, searchQuery, quantumState]);

  // ========== QUANTUM SEARCH ==========
  const handleQuantumSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.length > 3) {
      setDimensionalRift(true);
      setTimeout(() => setDimensionalRift(false), 1000);
    }
  }, []);

  // ========== VIEW MODE HANDLERS ==========
  const switchViewMode = useCallback((mode: QuantumGalleryState['viewMode']) => {
    setQuantumState(prev => ({ ...prev, viewMode: mode }));
    setCreativityField(true);
    setTimeout(() => setCreativityField(false), 2000);
  }, []);

  // ========== QUANTUM CARD COMPONENT ==========
  const QuantumOverlayCard: React.FC<{
    overlay: OverlayData;
    index: number;
  }> = ({ overlay, index }) => {
    const [cardConsciousness, setCardConsciousness] = useState(overlay.consciousness || 50);
    const [isHovered, setIsHovered] = useState(false);
    const [quantumGlow, setQuantumGlow] = useState(false);

    useEffect(() => {
      if (isHovered && overlay.consciousness) {
        const interval = setInterval(() => {
          setCardConsciousness(prev => Math.min(100, prev + 0.5));
        }, 100);
        return () => clearInterval(interval);
      }
    }, [isHovered, overlay.consciousness]);

    const cardVariants = {
      hidden: { 
        opacity: 0, 
        scale: 0.8, 
        rotateY: -90,
        z: -100
      },
      visible: { 
        opacity: 1, 
        scale: 1, 
        rotateY: 0,
        z: 0,
        transition: {
          delay: index * 0.1,
          duration: 0.8,
          type: "spring",
          damping: 20
        }
      },
      hover: {
        scale: 1.05,
        rotateY: 5,
        z: 50,
        transition: { duration: 0.3 }
      }
    };

    return (
      <motion.div
        className={`quantum-overlay-card ${quantumState.viewMode} temporal-${overlay.temporalPhase} consciousness-${Math.floor(cardConsciousness / 25)}`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        onMouseEnter={() => {
          setIsHovered(true);
          setQuantumGlow(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setQuantumGlow(false);
        }}
        onClick={() => setPreviewOverlay(overlay)}
        style={{
          '--consciousness-level': `${cardConsciousness / 100}`,
          '--reality-level': `${(overlay.realityLevel || 500) / 1000}`,
          '--creativity-index': `${(overlay.creativityIndex || 50) / 100}`,
          '--dimensional-stability': `${(overlay.dimensionalStability || 50) / 100}`,
          '--quantum-signature': `"${overlay.quantumSignature || 'QS-DEFAULT'}"`,
        } as React.CSSProperties}
      >
        {/* Quantum Signature Display */}
        <div className="quantum-signature">
          {overlay.quantumSignature}
        </div>

        {/* Consciousness Aura */}
        <div className="consciousness-aura">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`aura-ring ring-${i} ${quantumGlow ? 'glowing' : ''}`}
              style={{ '--ring-delay': `${i * 0.3}s` } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Temporal Phase Indicator */}
        <div className={`temporal-phase-indicator phase-${overlay.temporalPhase}`}>
          {overlay.temporalPhase === 'future' && '???'}
          {overlay.temporalPhase === 'past' && '???'}
          {overlay.temporalPhase === 'present' && ''}
        </div>

        {/* Main Card Content */}
        <div className="quantum-card-content">
          <div className="overlay-thumbnail">
            <img 
              src={overlay.imageUrl} 
              alt={overlay.name}
              className="quantum-image"
            />
            <div className="dimensional-overlay">
              <div className="quantum-grid">
                {[...Array(16)].map((_, i) => (
                  <div 
                    key={i} 
                    className="grid-cell" 
                    style={{ '--cell-delay': `${i * 0.05}s` } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="overlay-info">
            <h3 className="overlay-name">{overlay.name}</h3>
            <div className="overlay-metadata">
              <span className="category-tag">{overlay.category}</span>
              <span className="consciousness-level">C:{Math.floor(cardConsciousness)}</span>
              <span className="reality-level">R:{overlay.realityLevel}</span>
            </div>
            
            {overlay.uploader && (
              <div className="uploader-info">
                <span className="uploader-label">Creator:</span>
                <span className="uploader-name">{overlay.uploader}</span>
              </div>
            )}
          </div>
        </div>

        {/* Emotional Resonance Display */}
        {overlay.emotionalResonance && (
          <div className="emotional-resonance">
            {Object.entries(overlay.emotionalResonance).map(([emotion, value]) => (
              <div 
                key={emotion} 
                className="emotion-bar"
                style={{
                  '--emotion-value': `${value}%`,
                  '--emotion-color': 
                    emotion === 'energy' ? '#ff4757' :
                    emotion === 'inspiration' ? '#ffa726' :
                    emotion === 'tranquility' ? '#26c6da' :
                    emotion === 'power' ? '#ab47bc' : '#66bb6a'
                } as React.CSSProperties}
              >
                <div className="emotion-fill" />
              </div>
            ))}
          </div>
        )}

        {/* Quantum State Indicators */}
        <div className="quantum-state-indicators">
          <div className="dimensional-stability-meter">
            <div 
              className="stability-fill"
              style={{ width: `${overlay.dimensionalStability || 50}%` }}
            />
          </div>
          <div className="creativity-spark">
            {overlay.creativityIndex && overlay.creativityIndex > 70 && ''}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`quantum-overlay-gallery-page ${quantumState.viewMode} ${dimensionalRift ? 'dimensional-rift' : ''} ${creativityField ? 'creativity-field' : ''}`}
    >
      <canvas ref={canvasRef} className="quantum-gallery-canvas" />
      
      {/* Quantum Background Effects */}
      <div className="quantum-background-field">
        <div className="consciousness-waves">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="consciousness-wave"
              style={{ '--wave-delay': `${i * 2}s` } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Enhanced Header */}
      <motion.div 
        className="quantum-gallery-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, type: "spring" }}
      >
        <div className="header-controls">
          <motion.button
            className="quantum-back-btn"
            onClick={() => navigate("/overlay")}
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="btn-icon">?</span>
            <span className="btn-text">Reality Portal</span>
            <div className="btn-quantum-trail" />
          </motion.button>

          <div className="consciousness-status">
            <span className="status-label">Gallery Consciousness:</span>
            <span className="status-value">{Math.floor(galleryConsciousness)}/100</span>
            <div className="consciousness-meter">
              <div 
                className="consciousness-fill"
                style={{ width: `${galleryConsciousness}%` }}
              />
            </div>
          </div>
        </div>

        <motion.h1 
          className="quantum-gallery-title"
          animate={{
            background: [
              "linear-gradient(90deg, #00ffff, #a855f7, #ec4899, #00ffff)",
              "linear-gradient(90deg, #a855f7, #ec4899, #10b981, #a855f7)",
              "linear-gradient(90deg, #ec4899, #10b981, #00ffff, #ec4899)"
            ]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          QUANTUM OVERLAY NEXUS
        </motion.h1>

        <div className="gallery-stats">
          <div className="stat-item">
            <span className="stat-label">Total Overlays:</span>
            <span className="stat-value">{overlays.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Filtered:</span>
            <span className="stat-value">{filteredOverlays.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Quantum Coherence:</span>
            <span className="stat-value">{Math.floor(quantumState.quantumCoherence)}%</span>
          </div>
        </div>
      </motion.div>

      {/* Quantum Control Panel */}
      <motion.div 
        className="quantum-control-panel"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* View Mode Selector */}
        <div className="view-mode-selector">
          <div className="selector-label">VIEW MATRIX</div>
          <div className="mode-buttons">
            {(['matrix', 'neural', 'dimensional', 'consciousness'] as const).map(mode => (
              <motion.button
                key={mode}
                className={`mode-btn ${quantumState.viewMode === mode ? 'active' : ''}`}
                onClick={() => switchViewMode(mode)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="mode-icon">
                  {mode === 'matrix' && '?'}
                  {mode === 'neural' && ''}
                  {mode === 'dimensional' && ''}
                  {mode === 'consciousness' && ''}
                </span>
                <span className="mode-text">{mode.toUpperCase()}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quantum Search */}
        <div className="quantum-search-container">
          <div className="search-field">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Quantum Search..."
              value={searchQuery}
              onChange={(e) => handleQuantumSearch(e.target.value)}
              className="quantum-search-input"
            />
            <div className="search-quantum-effects">
              {isSearching && (
                <div className="search-particles">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="search-particle" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quantum Filters */}
        <div className="quantum-filters">
          <div className="filter-group">
            <label className="filter-label">Consciousness Threshold</label>
            <input
              type="range"
              min="0"
              max="100"
              value={quantumState.consciousnessThreshold}
              onChange={(e) => setQuantumState(prev => ({
                ...prev,
                consciousnessThreshold: parseInt(e.target.value)
              }))}
              className="quantum-slider"
            />
            <span className="filter-value">{quantumState.consciousnessThreshold}</span>
          </div>

          <div className="filter-group">
            <label className="filter-label">Reality Filter</label>
            <input
              type="range"
              min="0"
              max="1000"
              value={quantumState.realityFilter}
              onChange={(e) => setQuantumState(prev => ({
                ...prev,
                realityFilter: parseInt(e.target.value)
              }))}
              className="quantum-slider"
            />
            <span className="filter-value">{quantumState.realityFilter}</span>
          </div>

          <div className="filter-group">
            <label className="filter-label">Temporal View</label>
            <select
              value={quantumState.temporalView}
              onChange={(e) => setQuantumState(prev => ({
                ...prev,
                temporalView: e.target.value as any
              }))}
              className="quantum-select"
            >
              <option value="all">All Time</option>
              <option value="past">Past</option>
              <option value="present">Present</option>
              <option value="future">Future</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Emotional Resonance</label>
            <select
              value={quantumState.emotionalFilter}
              onChange={(e) => setQuantumState(prev => ({
                ...prev,
                emotionalFilter: e.target.value as any
              }))}
              className="quantum-select"
            >
              <option value="all">All Emotions</option>
              <option value="energy">Energy</option>
              <option value="inspiration">Inspiration</option>
              <option value="tranquility">Tranquility</option>
              <option value="power">Power</option>
              <option value="mystery">Mystery</option>
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-quantum-filter">
          <OverlayCategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
      </motion.div>

      {/* Quantum Gallery Grid */}
      <motion.div 
        className={`quantum-gallery-grid view-${quantumState.viewMode}`}
        layout
      >
        <AnimatePresence mode="popLayout">
          {filteredOverlays.map((overlay, index) => (
            <QuantumOverlayCard
              key={overlay._id}
              overlay={overlay}
              index={index}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* No Results Quantum Message */}
      {filteredOverlays.length === 0 && !isSearching && (
        <motion.div 
          className="quantum-no-results"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="no-results-icon"></div>
          <h3 className="no-results-title">QUANTUM VOID DETECTED</h3>
          <p className="no-results-message">
            No overlays match your quantum parameters. Try adjusting the reality filters or expanding the consciousness threshold.
          </p>
          <motion.button
            className="reset-filters-btn"
            onClick={() => {
              setQuantumState(prev => ({
                ...prev,
                consciousnessThreshold: 0,
                realityFilter: 0,
                temporalView: 'all',
                emotionalFilter: 'all'
              }));
              setSelectedCategory("");
              setSearchQuery("");
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            RESET QUANTUM PARAMETERS
          </motion.button>
        </motion.div>
      )}

      {/* Quantum Loading */}
      {isSearching && (
        <motion.div 
          className="quantum-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="loading-quantum-field">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="loading-particle"
                style={{ '--particle-delay': `${i * 0.1}s` } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="loading-text">SCANNING QUANTUM DIMENSIONS...</div>
        </motion.div>
      )}

      {/* Enhanced Preview Modal */}
      <OverlayPreviewModal 
        overlay={previewOverlay} 
        onClose={() => setPreviewOverlay(null)} 
      />

      {/* Dimensional Rift Effect */}
      <AnimatePresence>
        {dimensionalRift && (
          <motion.div
            className="dimensional-rift-effect"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 1 }}
          >
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="rift-particle"
                style={{ '--rift-angle': `${i * 18}deg` } as React.CSSProperties}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creativity Field Effect */}
      <AnimatePresence>
        {creativityField && (
          <motion.div
            className="creativity-field-effect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            {[...Array(30)].map((_, i) => (
              <div 
                key={i} 
                className="creativity-spark"
                style={{ 
                  '--spark-x': `${Math.random() * 100}%`,
                  '--spark-y': `${Math.random() * 100}%`,
                  '--spark-delay': `${Math.random() * 2}s`
                } as React.CSSProperties}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuantumOverlayGallery;
