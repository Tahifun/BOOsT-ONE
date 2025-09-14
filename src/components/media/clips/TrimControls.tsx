import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { 
  Scissors, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Maximize2, Minimize2, Lock, Unlock,
  Layers, ArrowLeftRight, ArrowRightLeft, Sparkles, Cpu,
  RotateCw, Activity, Grid3x3, Eye
} from 'lucide-react';

// Revolutionary Types for Quantum Trim Control
interface TrimControlsProps {
  selectedRange: [number, number];
  duration: number;
  onRangeChange: (range: [number, number]) => void;
  snapEnabled?: boolean;
  framerate?: number;
  timecode?: string;
  waveform?: Float32Array;
  markers?: TrimMarker[];
  rippleMode?: RippleMode;
  onRipple?: (affected: RippleEffect[]) => void;
  collaborators?: CollaboratorCursor[];
  quantumMode?: boolean; // acts as initial value
  aiAssist?: boolean;
}

interface TrimMarker {
  time: number;
  type: 'in' | 'out' | 'cut' | 'transition';
  locked?: boolean;
  label?: string;
}

interface RippleEffect {
  clipId: string;
  originalRange: [number, number];
  newRange: [number, number];
  offset: number;
}

interface CollaboratorCursor {
  id: string;
  position: number;
  color: string;
  name: string;
}

type RippleMode = 'none' | 'forward' | 'backward' | 'bidirectional' | 'magnetic' | 'quantum';

// Quantum Precision Engine for Frame-Perfect Control
class QuantumPrecisionEngine {
  private framerate: number;
  private tensorField: Float32Array;
  
  constructor(framerate: number = 30) {
    this.framerate = framerate;
    this.tensorField = new Float32Array(1024);
    this.initializeQuantumField();
  }
  
  private initializeQuantumField() {
    for (let i = 0; i < this.tensorField.length; i++) {
      this.tensorField[i] = Math.sin(i * 0.1) * Math.cos(i * 0.05);
    }
  }
  
  snapToFrame(time: number): number {
    const frameDuration = 1 / this.framerate;
    return Math.round(time / frameDuration) * frameDuration;
  }
  
  nudgeByFrames(time: number, frames: number): number {
    const frameDuration = 1 / this.framerate;
    return time + (frames * frameDuration);
  }
  
  calculateSubframe(time: number): number {
    const frameDuration = 1 / this.framerate;
    const frame = Math.floor(time / frameDuration);
    const subframe = (time % frameDuration) / frameDuration;
    return frame + subframe;
  }
  
  predictOptimalCut(waveform: Float32Array, position: number): number {
    // Neural network-inspired cut point prediction
    const windowSize = 128;
    const startIdx = Math.max(0, Math.floor(position * waveform.length) - windowSize);
    const endIdx = Math.min(waveform.length, startIdx + windowSize * 2);
    
    let minEnergy = Infinity;
    let optimalCut = position; // normalized [0..1] position
    
    for (let i = startIdx; i < endIdx; i++) {
      const energy = this.calculateLocalEnergy(waveform, i);
      if (energy < minEnergy) {
        minEnergy = energy;
        optimalCut = i / waveform.length; // back to normalized
      }
    }
    
    // Convert normalized position to seconds (caller should pass normalized by duration)
    return optimalCut;
  }
  
  private calculateLocalEnergy(waveform: Float32Array, index: number): number {
    const window = 5;
    let energy = 0;
    
    for (let i = Math.max(0, index - window); i < Math.min(waveform.length, index + window); i++) {
      energy += Math.abs(waveform[i]);
    }
    
    return energy / (window * 2);
  }
  
  applyQuantumSmoothing(value: number, target: number, factor: number = 0.1): number {
    // Quantum-inspired smoothing algorithm
    const qIndex = Math.abs(Math.floor(value * 100)) % this.tensorField.length;
    const quantum = this.tensorField[qIndex];
    const smoothed = value + (target - value) * factor;
    return smoothed + quantum * 0.001;
  }
}

// Ripple Effect Processor
class RippleProcessor {
  calculateRipple(
    changePoint: number,
    delta: number,
    mode: RippleMode,
    clips: Array<{id: string, range: [number, number]}>
  ): RippleEffect[] {
    const effects: RippleEffect[] = [];
    
    switch (mode) {
      case 'forward':
        clips.forEach(clip => {
          if (clip.range[0] >= changePoint) {
            effects.push({
              clipId: clip.id,
              originalRange: clip.range,
              newRange: [clip.range[0] + delta, clip.range[1] + delta],
              offset: delta
            });
          }
        });
        break;
      case 'backward':
        clips.forEach(clip => {
          if (clip.range[1] <= changePoint) {
            effects.push({
              clipId: clip.id,
              originalRange: clip.range,
              newRange: [clip.range[0] + delta, clip.range[1] + delta],
              offset: delta
            });
          }
        });
        break;
      case 'bidirectional': {
        const half = delta / 2;
        clips.forEach(clip => {
          if (clip.range[0] >= changePoint) {
            effects.push({
              clipId: clip.id,
              originalRange: clip.range,
              newRange: [clip.range[0] + half, clip.range[1] + half],
              offset: half
            });
          } else if (clip.range[1] <= changePoint) {
            effects.push({
              clipId: clip.id,
              originalRange: clip.range,
              newRange: [clip.range[0] - half, clip.range[1] - half],
              offset: -half
            });
          }
        });
        break;
      }
      case 'magnetic':
        // Magnetic ripple with force falloff
        clips.forEach(clip => {
          const distance = Math.min(
            Math.abs(clip.range[0] - changePoint),
            Math.abs(clip.range[1] - changePoint)
          );
          const force = Math.exp(-distance / 10) * delta;
          
          if (Math.abs(force) > 0.01) {
            effects.push({
              clipId: clip.id,
              originalRange: clip.range,
              newRange: [clip.range[0] + force, clip.range[1] + force],
              offset: force
            });
          }
        });
        break;
      case 'quantum':
        // Quantum entangled ripple effect
        clips.forEach(clip => {
          const phase = Math.sin((clip.range[0] - changePoint) * 0.1);
          const quantumOffset = delta * phase * Math.random();
          effects.push({
            clipId: clip.id,
            originalRange: clip.range,
            newRange: [
              clip.range[0] + quantumOffset,
              clip.range[1] + quantumOffset
            ],
            offset: quantumOffset
          });
        });
        break;
      case 'none':
      default:
        break;
    }
    
    return effects;
  }
}

// Advanced Timecode Formatter
class TimecodeFormatter {
  private framerate: number;
  private dropFrame: boolean;
  
  constructor(framerate: number = 30, dropFrame: boolean = false) {
    this.framerate = framerate;
    this.dropFrame = dropFrame;
  }
  
  format(seconds: number): string {
    const fps = this.framerate;
    const frames = Math.floor((seconds % 1) * fps);
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (this.dropFrame && Math.abs(fps - 29.97) < 0.01) {
      // Simplified drop-frame placeholder
      return this.formatDropFrame(hours, minutes, secs, frames);
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }
  
  private formatDropFrame(h: number, m: number, s: number, f: number): string {
    // Simple emulation; real DF is more complex
    return `${h.toString().padStart(2, '0')};${m.toString().padStart(2, '0')};${s.toString().padStart(2, '0')};${f.toString().padStart(2, '0')}`;
  }
  
  parse(timecode: string): number {
    const parts = timecode.split(/[:;]/);
    if (parts.length !== 4) return 0;
    const [h, m, s, f] = parts.map(n => Number.isFinite(Number(n)) ? Number(n) : 0);
    const totalSeconds = h * 3600 + m * 60 + s;
    const frameTime = f / this.framerate;
    return totalSeconds + frameTime;
  }
}

const TrimControls: React.FC<TrimControlsProps> = ({
  selectedRange,
  duration,
  onRangeChange,
  snapEnabled = true,
  framerate = 30,
  timecode,
  waveform,
  markers = [],
  rippleMode = 'none',
  onRipple,
  collaborators = [],
  quantumMode = false,
  aiAssist = false
}) => {
  // Revolutionary State Management
  const [inPoint, setInPoint] = useState(selectedRange[0]);
  const [outPoint, setOutPoint] = useState(selectedRange[1]);
  const [isDragging, setIsDragging] = useState<'in' | 'out' | 'range' | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [magneticStrength, setMagneticStrength] = useState(0.5);
  const [subframeMode, setSubframeMode] = useState(false);
  const [showWaveform, setShowWaveform] = useState(true);
  const [rippleActive, setRippleActive] = useState(rippleMode !== 'none');
  const [selectedRippleMode, setSelectedRippleMode] = useState<RippleMode>(rippleMode);
  const [showTimecodeInput, setShowTimecodeInput] = useState(false);
  const [customTimecode, setCustomTimecode] = useState('');
  const [trimHistory, setTrimHistory] = useState<[number, number][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [quantumEnabled, setQuantumEnabled] = useState<boolean>(!!quantumMode);

  // Advanced Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const precisionEngine = useRef(new QuantumPrecisionEngine(framerate));
  const rippleProcessor = useRef(new RippleProcessor());
  const timecodeFormatter = useRef(new TimecodeFormatter(framerate));
  const animationRef = useRef<number | null>(null);
  const dragStartRef = useRef({ x: 0, time: 0 });
  
  // Motion Values for Smooth Animations
  const inPointX = useMotionValue(0);
  const outPointX = useMotionValue(0);
  
  // Spring Physics
  const springConfig = { stiffness: 300, damping: 30 };
  const inPointSpring = useSpring(inPoint, springConfig);
  const outPointSpring = useSpring(outPoint, springConfig);
  
  // Transform motion values to visual positions
  const inPointPosition = useTransform(inPointSpring, [0, duration], ['0%', '100%']);
  const outPointPosition = useTransform(outPointSpring, [0, duration], ['0%', '100%']);
  
  // Initialize and update effects
  useEffect(() => {
    setInPoint(selectedRange[0]);
    setOutPoint(selectedRange[1]);
    updateHistory(selectedRange);
  }, [selectedRange]);
  
  useEffect(() => {
    if (quantumEnabled) {
      startQuantumAnimation();
    } else {
      stopQuantumAnimation();
    }
    return () => stopQuantumAnimation();
  }, [quantumEnabled]);
  
  useEffect(() => {
    if (waveform && showWaveform) {
      renderWaveform();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveform, showWaveform, inPoint, outPoint]);
  
  // Quantum Animation Loop
  const startQuantumAnimation = () => {
    const animate = () => {
      if (quantumEnabled) {
        // Apply quantum fluctuations to trim points
        const quantumNoise = Math.sin(Date.now() * 0.001) * 0.01;
        if (!isLocked && !isDragging) {
          const smoothedIn = precisionEngine.current.applyQuantumSmoothing(
            inPoint,
            inPoint + quantumNoise,
            0.05
          );
          const smoothedOut = precisionEngine.current.applyQuantumSmoothing(
            outPoint,
            outPoint - quantumNoise,
            0.05
          );
          
          // Update visual representation without changing actual values
          inPointX.set(smoothedIn);
          outPointX.set(smoothedOut);
        }
        
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  const stopQuantumAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // History Management
  const updateHistory = (range: [number, number]) => {
    const newHistory = [...trimHistory.slice(0, historyIndex + 1), range];
    setTrimHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevRange = trimHistory[prevIndex];
      setInPoint(prevRange[0]);
      setOutPoint(prevRange[1]);
      onRangeChange(prevRange);
    }
  };
  
  const redo = () => {
    if (historyIndex < trimHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextRange = trimHistory[nextIndex];
      setInPoint(nextRange[0]);
      setOutPoint(nextRange[1]);
      onRangeChange(nextRange);
    }
  };
  
  // Waveform Rendering
  const renderWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 204, 0.2)');
    gradient.addColorStop(inPoint / duration, 'rgba(0, 255, 204, 0.8)');
    gradient.addColorStop(outPoint / duration, 'rgba(0, 255, 204, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 255, 204, 0.2)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const samples = waveform.length;
    const step = samples / width;
    
    for (let i = 0; i < width; i++) {
      const sampleIndex = Math.floor(i * step);
      const value = waveform[sampleIndex];
      const y = (1 - value) * height / 2;
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    
    ctx.stroke();
    
    // Highlight selected range
    const inX = (inPoint / duration) * width;
    const outX = (outPoint / duration) * width;
    
    ctx.fillStyle = 'rgba(0, 255, 204, 0.1)';
    ctx.fillRect(inX, 0, outX - inX, height);
    
    // Draw trim handles
    ctx.fillStyle = 'rgba(0, 255, 204, 0.8)';
    ctx.fillRect(inX - 2, 0, 4, height);
    ctx.fillRect(outX - 2, 0, 4, height);
  };
  
  // Core Trim Functions
  const handleNudge = useCallback((direction: 'in' | 'out', frames: number) => {
    const nudgeAmount = precisionEngine.current.nudgeByFrames(0, frames);
    
    if (direction === 'in') {
      const newIn = Math.max(0, Math.min(outPoint - 0.001, inPoint + nudgeAmount));
      setInPoint(newIn);
      onRangeChange([newIn, outPoint]);
      
      if (rippleActive) {
        const rippleEffects = rippleProcessor.current.calculateRipple(
          newIn,
          nudgeAmount,
          selectedRippleMode,
          [] // Would pass actual clips here
        );
        onRipple?.(rippleEffects);
      }
    } else {
      const newOut = Math.max(inPoint + 0.001, Math.min(duration, outPoint + nudgeAmount));
      setOutPoint(newOut);
      onRangeChange([inPoint, newOut]);
      
      if (rippleActive) {
        const rippleEffects = rippleProcessor.current.calculateRipple(
          newOut,
          nudgeAmount,
          selectedRippleMode,
          []
        );
        onRipple?.(rippleEffects);
      }
    }
    
    updateHistory([
      direction === 'in' ? inPoint + nudgeAmount : inPoint,
      direction === 'out' ? outPoint + nudgeAmount : outPoint
    ]);
  }, [inPoint, outPoint, duration, rippleActive, selectedRippleMode, onRangeChange, onRipple]);
  
  const handleFrameStep = useCallback((direction: 'forward' | 'backward', point: 'in' | 'out') => {
    const frames = direction === 'forward' ? 1 : -1;
    handleNudge(point, frames);
  }, [handleNudge]);
  
  const handleSubframeStep = useCallback((direction: 'forward' | 'backward', point: 'in' | 'out') => {
    const frames = direction === 'forward' ? 0.1 : -0.1;
    handleNudge(point, frames);
  }, [handleNudge]);
  
  const handleAutoTrim = useCallback(() => {
    if (!waveform || !aiAssist) return;
    
    // AI-powered auto trim: predictors return normalized [0..1]
    const normIn = precisionEngine.current.predictOptimalCut(waveform, inPoint / duration);
    const normOut = precisionEngine.current.predictOptimalCut(waveform, outPoint / duration);
    const optimalIn = precisionEngine.current.snapToFrame(normIn * duration);
    const optimalOut = precisionEngine.current.snapToFrame(normOut * duration);
    
    setInPoint(optimalIn);
    setOutPoint(optimalOut);
    onRangeChange([optimalIn, optimalOut]);
    updateHistory([optimalIn, optimalOut]);
  }, [waveform, aiAssist, inPoint, outPoint, duration, onRangeChange]);
  
  const handleTimecodeInput = useCallback((value: string, point: 'in' | 'out') => {
    const time = timecodeFormatter.current.parse(value);
    if (point === 'in' && time < outPoint) {
      setInPoint(time);
      onRangeChange([time, outPoint]);
    } else if (point === 'out' && time > inPoint) {
      setOutPoint(time);
      onRangeChange([inPoint, time]);
    }
  }, [inPoint, outPoint, onRangeChange]);
  
  const handleRippleModeChange = (mode: RippleMode) => {
    setSelectedRippleMode(mode);
    setRippleActive(mode !== 'none');
  };
  
  // Drag Handlers
  const handleDragStart = useCallback((e: React.MouseEvent, type: 'in' | 'out' | 'range') => {
    if (isLocked) return;
    
    setIsDragging(type);
    dragStartRef.current = {
      x: e.clientX,
      time: type === 'in' ? inPoint : type === 'out' ? outPoint : inPoint
    };
    
    e.preventDefault();
  }, [isLocked, inPoint, outPoint]);
  
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaTime = (deltaX / window.innerWidth) * duration;
    let newTime = dragStartRef.current.time + deltaTime;
    
    if (snapEnabled) {
      newTime = precisionEngine.current.snapToFrame(newTime);
    }
    
    if (magneticStrength > 0) {
      // Apply magnetic snapping to markers
      markers.forEach(marker => {
        const distance = Math.abs(newTime - marker.time);
        if (distance < magneticStrength) {
          newTime = marker.time;
        }
      });
    }
    
    if (isDragging === 'in') {
      newTime = Math.max(0, Math.min(outPoint - 0.001, newTime));
      setInPoint(newTime);
      inPointSpring.set(newTime);
    } else if (isDragging === 'out') {
      newTime = Math.max(inPoint + 0.001, Math.min(duration, newTime));
      setOutPoint(newTime);
      outPointSpring.set(newTime);
    } else if (isDragging === 'range') {
      const width = outPoint - inPoint;
      const newIn = Math.max(0, Math.min(duration - width, newTime));
      const newOut = newIn + width;
      setInPoint(newIn);
      setOutPoint(newOut);
      inPointSpring.set(newIn);
      outPointSpring.set(newOut);
    }
  }, [isDragging, duration, snapEnabled, magneticStrength, markers, inPoint, outPoint, inPointSpring, outPointSpring]);
  
  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      onRangeChange([inPoint, outPoint]);
      updateHistory([inPoint, outPoint]);
      setIsDragging(null);
    }
  }, [isDragging, inPoint, outPoint, onRangeChange]);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);
  
  // Render Methods
  const renderTrimBar = () => (
    <div className="trim-bar" style={{
      position: 'relative',
      height: '60px',
      background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid rgba(0, 255, 204, 0.3)'
    }}>
      {/* Waveform Canvas */}
      {showWaveform && (
        <canvas
          ref={canvasRef}
          width={800}
          height={60}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.5
          }}
        />
      )}
      
      {/* Selected Range */}
      <motion.div
        className="selected-range"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: inPointPosition,
          width: `${((outPoint - inPoint) / duration) * 100}%`,
          background: 'linear-gradient(90deg, rgba(0, 255, 204, 0.2) 0%, rgba(0, 255, 204, 0.3) 100%)',
          borderLeft: '3px solid #00ffcc',
          borderRight: '3px solid #00ffcc',
          cursor: isDragging === 'range' ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => handleDragStart(e, 'range')}
      >
        {/* Quantum Field Effect */}
        {quantumEnabled && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at center, rgba(0, 255, 204, 0.1) 0%, transparent 70%)',
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>
      
      {/* In Point Handle */}
      <motion.div
        className="in-point-handle"
        style={{
          position: 'absolute',
          left: inPointPosition,
          top: 0,
          bottom: 0,
          width: '20px',
          background: 'linear-gradient(90deg, #00ffcc 0%, rgba(0, 255, 204, 0.5) 100%)',
          cursor: 'ew-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px 0 0 4px',
          boxShadow: '0 0 20px rgba(0, 255, 204, 0.5)',
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => handleDragStart(e, 'in')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight size={16} color="white" />
      </motion.div>
      
      {/* Out Point Handle */}
      <motion.div
        className="out-point-handle"
        style={{
          position: 'absolute',
          left: outPointPosition,
          top: 0,
          bottom: 0,
          width: '20px',
          background: 'linear-gradient(90deg, rgba(0, 255, 204, 0.5) 0%, #00ffcc 100%)',
          cursor: 'ew-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '0 4px 4px 0',
          boxShadow: '0 0 20px rgba(0, 255, 204, 0.5)',
          transform: 'translateX(-50%)'
        }}
        onMouseDown={(e) => handleDragStart(e, 'out')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft size={16} color="white" />
      </motion.div>
      
      {/* Collaborator Cursors */}
      {collaborators.map(collab => (
        <motion.div
          key={collab.id}
          style={{
            position: 'absolute',
            left: `${(collab.position / duration) * 100}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            background: collab.color,
            pointerEvents: 'none'
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '2px 6px',
            background: collab.color,
            borderRadius: '4px',
            fontSize: '10px',
            color: 'white',
            whiteSpace: 'nowrap'
          }}>
            {collab.name}
          </div>
        </motion.div>
      ))}
      
      {/* Markers */}
      {markers.map((marker, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(marker.time / duration) * 100}%`,
            top: 0,
            bottom: 0,
            width: '1px',
            background: marker.type === 'in' ? '#00ff88' : marker.type === 'out' ? '#ff0088' : '#ffaa00',
            opacity: 0.7,
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  );
  
  const renderTimecodeDisplay = () => (
    <div style={{
      display: 'flex',
      gap: '20px',
      marginTop: '15px',
      padding: '15px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 255, 204, 0.2)'
    }}>
      <div style={{ flex: 1 }}>
        <label style={{ 
          display: 'block', 
          fontSize: '11px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '5px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          IN POINT
        </label>
        {showTimecodeInput ? (
          <input
            type="text"
            value={customTimecode}
            onChange={(e) => setCustomTimecode(e.target.value)}
            onBlur={() => {
              handleTimecodeInput(customTimecode, 'in');
              setShowTimecodeInput(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTimecodeInput(customTimecode, 'in');
                setShowTimecodeInput(false);
              }
            }}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(0, 255, 204, 0.5)',
              borderRadius: '4px',
              color: '#00ffcc',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
            autoFocus
          />
        ) : (
          <div
            onClick={() => {
              setCustomTimecode(timecodeFormatter.current.format(inPoint));
              setShowTimecodeInput(true);
            }}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#00ffcc',
              fontFamily: 'monospace',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {timecodeFormatter.current.format(inPoint)}
          </div>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        fontSize: '20px',
        color: 'rgba(255, 255, 255, 0.3)'
      }}>
        <ArrowLeftRight />
      </div>
      
      <div style={{ flex: 1 }}>
        <label style={{ 
          display: 'block', 
          fontSize: '11px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '5px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          OUT POINT
        </label>
        <div
          style={{
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#00ffcc',
            fontFamily: 'monospace',
            fontSize: '14px',
            cursor: 'default'
          }}
        >
          {timecodeFormatter.current.format(outPoint)}
        </div>
      </div>
      
      <div style={{ flex: 1 }}>
        <label style={{ 
          display: 'block', 
          fontSize: '11px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '5px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          DURATION
        </label>
        <div
          style={{
            padding: '8px',
            background: 'linear-gradient(90deg, rgba(255, 255, 0, 0.1) 0%, rgba(255, 255, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 0, 0.3)',
            borderRadius: '4px',
            color: '#ffff00',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {timecodeFormatter.current.format(outPoint - inPoint)}
        </div>
      </div>
    </div>
  );
  
  const renderNudgeControls = () => (
    <div style={{
      display: 'flex',
      gap: '15px',
      marginTop: '15px'
    }}>
      <div style={{
        flex: 1,
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 255, 204, 0.2)'
      }}>
        <h4 style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '10px',
          textTransform: 'uppercase'
        }}>
          IN POINT NUDGE
        </h4>
        <div style={{ display: 'flex', gap: '5px' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleNudge('in', -10)}
            style={btnStyle}
          >
            <ChevronsLeft size={14} /> -10f
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleFrameStep('backward', 'in')}
            style={btnStyle}
          >
            <ChevronLeft size={14} /> -1f
          </motion.button>
          
          {subframeMode && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => handleSubframeStep('backward', 'in')}
              style={subBtnStyle}
            >
              -0.1f
            </motion.button>
          )}
          
          {subframeMode && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => handleSubframeStep('forward', 'in')}
              style={subBtnStyle}
            >
              +0.1f
            </motion.button>
          )}
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleFrameStep('forward', 'in')}
            style={btnStyle}
          >
            +1f <ChevronRight size={14} />
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleNudge('in', 10)}
            style={btnStyle}
          >
            +10f <ChevronsRight size={14} />
          </motion.button>
        </div>
      </div>
      
      <div style={{
        flex: 1,
        padding: '15px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 255, 204, 0.2)'
      }}>
        <h4 style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '10px',
          textTransform: 'uppercase'
        }}>
          OUT POINT NUDGE
        </h4>
        <div style={{ display: 'flex', gap: '5px' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleNudge('out', -10)}
            style={btnStyle}
          >
            <ChevronsLeft size={14} /> -10f
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleFrameStep('backward', 'out')}
            style={btnStyle}
          >
            <ChevronLeft size={14} /> -1f
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleFrameStep('forward', 'out')}
            style={btnStyle}
          >
            +1f <ChevronRight size={14} />
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => handleNudge('out', 10)}
            style={btnStyle}
          >
            +10f <ChevronsRight size={14} />
          </motion.button>
        </div>
      </div>
    </div>
  );
  
  const renderRippleControls = () => (
    <div style={{
      marginTop: '15px',
      padding: '15px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 0, 255, 0.2)'
    }}>
      <h4 style={{ 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '10px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Layers size={14} /> RIPPLE EDIT MODE
      </h4>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(['none', 'forward', 'backward', 'bidirectional', 'magnetic', 'quantum'] as RippleMode[]).map(mode => (
          <motion.button
            key={mode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleRippleModeChange(mode)}
            style={{
              padding: '8px 12px',
              background: selectedRippleMode === mode 
                ? 'linear-gradient(135deg, rgba(255, 0, 255, 0.3) 0%, rgba(255, 0, 255, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${selectedRippleMode === mode ? '#ff00ff' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '4px',
              color: selectedRippleMode === mode ? '#ff00ff' : 'white',
              cursor: 'pointer',
              fontSize: '12px',
              textTransform: 'capitalize',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: selectedRippleMode === mode ? '0 0 20px rgba(255, 0, 255, 0.3)' : 'none'
            }}
          >
            {mode === 'forward' && <ArrowRightLeft size={14} />}
            {mode === 'backward' && <ArrowLeftRight size={14} />}
            {mode === 'bidirectional' && <RotateCw size={14} style={{ transform: 'rotate(90deg)' }} />}
            {mode === 'magnetic' && <Activity size={14} />}
            {mode === 'quantum' && <Sparkles size={14} />}
            {mode}
          </motion.button>
        ))}
      </div>
      
      {selectedRippleMode === 'magnetic' && (
        <div style={{ marginTop: '15px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '11px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '5px'
          }}>
            Magnetic Strength: {magneticStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={magneticStrength}
            onChange={(e) => setMagneticStrength(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#ff00ff' }}
          />
        </div>
      )}
    </div>
  );
  
  const renderAdvancedControls = () => (
    <AnimatePresence>
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            marginTop: '15px',
            padding: '15px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 170, 255, 0.2)'
          }}
        >
          <h4 style={{ 
            fontSize: '12px', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '15px',
            textTransform: 'uppercase'
          }}>
            ADVANCED CONTROLS
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSubframeMode(!subframeMode)}
              style={{
                padding: '10px',
                background: subframeMode 
                  ? 'linear-gradient(135deg, rgba(255, 0, 255, 0.3) 0%, rgba(255, 0, 255, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${subframeMode ? '#ff00ff' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '4px',
                color: subframeMode ? '#ff00ff' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Grid3x3 size={14} /> Subframe
            </motion.button>
            
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setQuantumEnabled(!quantumEnabled)}
              style={{
                padding: '10px',
                background: quantumEnabled 
                  ? 'linear-gradient(135deg, rgba(0, 255, 204, 0.3) 0%, rgba(0, 255, 204, 0.1) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${quantumEnabled ? '#00ffcc' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '4px',
                color: quantumEnabled ? '#00ffcc' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Cpu size={14} /> Quantum
            </motion.button>
            
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleAutoTrim}
              disabled={!aiAssist || !waveform}
              style={{
                padding: '10px',
                background: 'linear-gradient(135deg, rgba(255, 170, 0, 0.3) 0%, rgba(255, 170, 0, 0.1) 100%)',
                border: '1px solid rgba(255, 170, 0, 0.5)',
                borderRadius: '4px',
                color: '#ffaa00',
                cursor: aiAssist && waveform ? 'pointer' : 'not-allowed',
                opacity: aiAssist && waveform ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> AI Trim
            </motion.button>
          </div>
          
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={undo}
              disabled={historyIndex <= 0}
              style={{
                flex: 1,
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: historyIndex > 0 ? 'white' : 'rgba(255, 255, 255, 0.3)',
                cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <RotateCw size={14} style={{ transform: 'scaleX(-1)' }} /> Undo
            </motion.button>
            
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={redo}
              disabled={historyIndex >= trimHistory.length - 1}
              style={{
                flex: 1,
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: historyIndex < trimHistory.length - 1 ? 'white' : 'rgba(255, 255, 255, 0.3)',
                cursor: historyIndex < trimHistory.length - 1 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <RotateCw size={14} /> Redo
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, rgba(10, 10, 15, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(0, 255, 204, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Quantum Background Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 255, 204, 0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        opacity: quantumEnabled ? 1 : 0,
        transition: 'opacity 1s ease'
      }} />
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #00ffcc, #00aaff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Scissors /> QUANTUM PRECISION TRIM CONTROLS
        </h3>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowWaveform(!showWaveform)}
            style={{
              padding: '8px',
              background: showWaveform ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showWaveform ? '#00ffcc' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '4px',
              color: showWaveform ? '#00ffcc' : 'white',
              cursor: 'pointer'
            }}
          >
            <Activity size={16} />
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsLocked(!isLocked)}
            style={{
              padding: '8px',
              background: isLocked ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isLocked ? '#ff0000' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '4px',
              color: isLocked ? '#ff0000' : 'white',
              cursor: 'pointer'
            }}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </motion.button>
          
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: '8px',
              background: showAdvanced ? 'rgba(0, 170, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${showAdvanced ? '#00aaff' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '4px',
              color: showAdvanced ? '#00aaff' : 'white',
              cursor: 'pointer'
            }}
          >
            {showAdvanced ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </motion.button>
        </div>
      </div>
      
      {renderTrimBar()}
      {renderTimecodeDisplay()}
      {renderNudgeControls()}
      {renderRippleControls()}
      {renderAdvancedControls()}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '4px',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const subBtnStyle: React.CSSProperties = {
  padding: '8px',
  background: 'rgba(255, 0, 255, 0.1)',
  border: '1px solid rgba(255, 0, 255, 0.3)',
  borderRadius: '4px',
  color: '#ff00ff',
  cursor: 'pointer',
  fontSize: '12px'
};

export default TrimControls;
