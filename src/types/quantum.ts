// src/types/quantum.ts
export type NodeType =
  | 'neural_trigger'
  | 'plasma_condition'
  | 'cosmic_action'
  | 'ai_consciousness'
  | 'quantum_integration'
  | 'holographic_display';

export interface QuantumNode {
  id: number;
  type: NodeType;
  x: number; y: number;
  config: Record<string, any>;
  label: string;
  energy?: number; 
  phase?: number; 
  holographic?: boolean;
}

export interface QuantumConnection {
  id: string;
  from: number; to: number;
  type: 'neural' | 'quantum' | 'plasma';
  strength: number;
}
