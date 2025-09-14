import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Brain, Zap, Eye, Code, Sparkles, Wand2, Target, Users, 
  MessageSquare, Gift, Music, Shield, Timer, Bot, Gamepad2,
  Layers, Workflow, Play, Pause, RotateCcw, Save, Download,
  ChevronRight, Plus, X, Move, Settings, Link, Mic, Camera,
  Cpu, Database, Globe, Rocket, Heart, Star, Zap as Lightning,
  Headphones, Video, Sliders, BarChart3, TrendingUp, Crown,
  Diamond, Flame, Waves, Orbit, Infinity
} from 'lucide-react';

// Import the CSS - make sure the path is correct
import '../../styles/NeuralCommandMatrix.css';

// Types
interface QuantumNode {
  id: number;
  type: 'neural_trigger' | 'plasma_condition' | 'cosmic_action' | 'ai_consciousness' | 'quantum_integration' | 'holographic_display';
  x: number;
  y: number;
  config: Record<string, any>;
  label: string;
  energy?: number;
  phase?: number;
  holographic?: boolean;
}

interface QuantumConnection {
  id: string;
  from: number;
  to: number;
  type: 'neural' | 'quantum' | 'plasma';
  strength: number;
}

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  type: 'user' | 'bot';
  timestamp: Date;
  mood?: string;
}

interface AISuggestion {
  type: 'quantum' | 'neural' | 'holographic' | 'cosmic';
  text: string;
  impact: 'reality-breaking' | 'mind-bending' | 'dimension-shifting' | 'multiverse';
  icon: React.ReactNode;
  action?: string;
}

// Main Component
const QuantumCommandBuilder: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'neural' | 'quantum' | 'holographic' | 'cosmic'>('neural');
  const [nodes, setNodes] = useState<QuantumNode[]>([]);
  const [connections, setConnections] = useState<QuantumConnection[]>([]);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Suggestions with proper structure
  const aiSuggestions: AISuggestion[] = [
    { 
      type: 'quantum', 
      text: 'Implement quantum entanglement for instant responses', 
      impact: 'reality-breaking', 
      icon: <Infinity className="w-4 h-4" />,
      action: 'quantum_integration'
    },
    { 
      type: 'neural', 
      text: 'Add consciousness simulation for emotional responses', 
      impact: 'mind-bending', 
      icon: <Brain className="w-4 h-4" />,
      action: 'ai_consciousness'
    },
    { 
      type: 'holographic', 
      text: 'Create 4D holographic command visualizations', 
      impact: 'dimension-shifting', 
      icon: <Diamond className="w-4 h-4" />,
      action: 'holographic_display'
    },
    { 
      type: 'cosmic', 
      text: 'Integrate with parallel universe streaming platforms', 
      impact: 'multiverse', 
      icon: <Globe className="w-4 h-4" />,
      action: 'cosmic_action'
    }
  ];

  // Add node function
  const addNode = (type: QuantumNode['type']) => {
    const newNode: QuantumNode = {
      id: Date.now(),
      type,
      x: Math.random() * 400 + 100,
      y: Math.random() * 250 + 100,
      config: {},
      label: `${type}_${nodes.length + 1}`,
      energy: Math.random() * 100,
      phase: Math.random() * Math.PI * 2,
      holographic: true
    };
    setNodes(prev => [...prev, newNode]);
    setEnergyLevel(prev => Math.min(100, prev + 10));
  };

  // Energy animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSimulating) {
        setEnergyLevel(prev => {
          const newLevel = prev + (Math.random() * 10 - 5);
          return Math.max(0, Math.min(100, newLevel));
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleSaveFlow = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Quantum flow saved!');
  };

  return (
    <div className="quantum-command-builder">
      {/* Header Section */}
      <div className="neural-header">
        <h1 className="matrix-title">NEURAL COMMAND MATRIX</h1>
        <p className="quantum-subtitle">Quantum-powered bot consciousness for the digital age</p>
        
        {/* Status Grid */}
        <div className="status-grid">
          <div className="status-indicator">
            <span className="status-label">
              <Cpu className="w-4 h-4" />
              Neural Network:
            </span>
            <span className="status-value active">ACTIVE</span>
          </div>
          <div className="status-indicator">
            <span className="status-label">
              <Orbit className="w-4 h-4" />
              Quantum Field:
            </span>
            <span className="status-value">STABLE</span>
          </div>
        </div>
      </div>

      {/* Energy Bar */}
      <div className="energy-container">
        <div className="energy-label">COSMIC ENERGY</div>
        <div className="energy-bar-wrapper">
          <div className="energy-bar" style={{ width: `${energyLevel}%` }}>
            <div className="energy-particles">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="energy-particle" style={{ animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`quantum-button ${isSimulating ? 'primary' : ''}`}
        >
          {isSimulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          ACTIVATE MATRIX
        </button>
        <button 
          onClick={handleSaveFlow}
          className="quantum-button"
          disabled={saving}
        >
          <Save className="w-5 h-5" />
          QUANTUM SAVE
        </button>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector">
        {(['neural', 'quantum', 'holographic', 'cosmic'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`mode-tab ${activeMode === mode ? 'active' : ''}`}
          >
            {mode === 'neural' && <Brain className="w-5 h-5" />}
            {mode === 'quantum' && <Infinity className="w-5 h-5" />}
            {mode === 'holographic' && <Diamond className="w-5 h-5" />}
            {mode === 'cosmic' && <Orbit className="w-5 h-5" />}
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Quantum Blocks Container */}
      <div className="quantum-blocks-container">
        <h2 className="controls-title">QUANTUM BLOCKS</h2>
        <div className="blocks-grid">
          {/* Neural Trigger Block */}
          <div className="quantum-block">
            <div className="block-header">
              <div className="block-icon">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="block-title">NEURAL TRIGGER</div>
              <button className="block-add-btn" onClick={() => addNode('neural_trigger')}>
                +
              </button>
            </div>
            <div className="block-content">
              <div className="functionality-tag">NEXT-GEN FUNCTIONALITY</div>
            </div>
          </div>

          {/* Plasma Condition Block */}
          <div className="quantum-block">
            <div className="block-header">
              <div className="block-icon">
                <Lightning className="w-4 h-4 text-white" />
              </div>
              <div className="block-title">PLASMA CONDITION</div>
              <button className="block-add-btn" onClick={() => addNode('plasma_condition')}>
                +
              </button>
            </div>
            <div className="block-content">
              <div className="functionality-tag">NEXT-GEN FUNCTIONALITY</div>
            </div>
          </div>

          {/* Cosmic Action Block */}
          <div className="quantum-block">
            <div className="block-header">
              <div className="block-icon">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div className="block-title">COSMIC ACTION</div>
              <button className="block-add-btn" onClick={() => addNode('cosmic_action')}>
                +
              </button>
            </div>
            <div className="block-content">
              <div className="functionality-tag">NEXT-GEN FUNCTIONALITY</div>
            </div>
          </div>

          {/* AI Consciousness Block */}
          <div className="quantum-block">
            <div className="block-header">
              <div className="block-icon">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div className="block-title">AI CONSCIOUSNESS</div>
              <button className="block-add-btn" onClick={() => addNode('ai_consciousness')}>
                +
              </button>
            </div>
            <div className="block-content">
              <div className="functionality-tag">NEXT-GEN FUNCTIONALITY</div>
            </div>
          </div>

          {/* Quantum Integration Block */}
          <div className="quantum-block">
            <div className="block-header">
              <div className="block-icon">
                <Infinity className="w-4 h-4 text-white" />
              </div>
              <div className="block-title">QUANTUM INTEGRATION</div>
              <button className="block-add-btn" onClick={() => addNode('quantum_integration')}>
                +
              </button>
            </div>
            <div className="block-content">
              <div className="functionality-tag">NEXT-GEN FUNCTIONALITY</div>
            </div>
          </div>

          {/* Holographic Display Block */}
          <div className="quantum-block">
            <div className="block-header">
              <div className="block-icon">
                <Diamond className="w-4 h-4 text-white" />
              </div>
              <div className="block-title">HOLOGRAPHIC DISPLAY</div>
              <button className="block-add-btn" onClick={() => addNode('holographic_display')}>
                +
              </button>
            </div>
            <div className="block-content">
              <div className="functionality-tag">NEXT-GEN FUNCTIONALITY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum Controls Section */}
      <div className="controls-section">
        <h3 className="controls-title">QUANTUM CONTROLS</h3>
        <ul className="control-list">
          <li className="control-item">Click nodes to drag</li>
          <li className="control-item">Shift+Click to connect</li>
          <li className="control-item">Click connections to delete</li>
          <li className="control-item">Hover for node options</li>
        </ul>
      </div>

      {/* Cosmic Intelligence Cards */}
      <div className="intelligence-cards-container">
        <h2 className="controls-title">COSMIC INTELLIGENCE</h2>
        {aiSuggestions.map((suggestion, index) => (
          <div key={index} className="intelligence-card">
            <div className="intelligence-icon">{suggestion.icon}</div>
            <div className="intelligence-title">{suggestion.type}</div>
            <div className="intelligence-description">
              {suggestion.impact}<br />
              {suggestion.text}
            </div>
            <button 
              className="implement-button"
              onClick={() => suggestion.action && addNode(suggestion.action as QuantumNode['type'])}
            >
              IMPLEMENT
            </button>
          </div>
        ))}
      </div>

      {/* Neural Connections Visualization */}
      <svg className="neural-connections" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {connections.map((conn, i) => {
          const fromNode = nodes.find(n => n.id === conn.from);
          const toNode = nodes.find(n => n.id === conn.to);
          if (!fromNode || !toNode) return null;
          
          return (
            <line
              key={i}
              className="neural-connection"
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
            />
          );
        })}
      </svg>

      {/* Floating Nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className="neural-node"
          style={{
            left: node.x,
            top: node.y
          }}
        />
      ))}

      {/* Reality Tear Effect */}
      <div className="reality-tear-effect" />
      
      {/* Quantum Particles */}
      <div className="quantum-particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="quantum-particle" 
            style={{
              animationDelay: `${i * 0.5}s`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default QuantumCommandBuilder;