import { sendBotCommand } from '@/services/BotApiService';

export interface QuantumNode {
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

export interface QuantumConnection {
  id: string;
  from: number;
  to: number;
  type: 'neural' | 'quantum' | 'plasma';
  strength: number;
}

export interface QuantumFlow {
  _id?: string;
  userId?: string;
  name: string;
  description?: string;
  nodes: QuantumNode[];
  connections: QuantumConnection[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AISuggestion {
  type: 'quantum' | 'neural' | 'holographic' | 'cosmic';
  text: string;
  impact: 'reality-breaking' | 'mind-bending' | 'dimension-shifting' | 'multiverse';
  icon?: string;
  action?: string;
  priority: number;
}

export interface QuantumExecutionContext {
  trigger: {
    command: string;
    user: string;
    channel: string;
    args: string[];
    timestamp: Date;
  };
  variables: Record<string, any>;
  flowId: string;
  executionId: string;
}

export interface QuantumExecutionResult {
  success: boolean;
  executedNodes: number[];
  outputs: Array<{
    nodeId: number;
    type: string;
    output: unknown;
    timestamp: Date;
  }>;
  variables: Record<string, any>;
  executionTime: number;
  error?: string;
}

export class QuantumBotService {
  private static readonly BASE_URL = '/api/quantum';

  /**
   * Save a quantum flow to the database
   */
  static async saveQuantumFlow(
    name: string,
    description: string = '',
    nodes: QuantumNode[], 
    connections: QuantumConnection[]
  ): Promise<{ success: boolean; data?: QuantumFlow; error?: string }> {
    try {
      const payload = {
        name,
        description,
        nodes: nodes.map(node => ({
          ...node,
          config: node.config || {}
        })),
        connections: connections.map(conn => ({
          ...conn,
          strength: conn.strength || 100
        })),
        isActive: false,
        executionCount: 0
      };

      const response = await fetch(`${this.BASE_URL}/flows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Adjust based on your auth
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save quantum flow');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to save quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Load a quantum flow by ID
   */
  static async loadQuantumFlow(flowId: string): Promise<{ success: boolean; data?: QuantumFlow; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/flows/${flowId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load quantum flow');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to load quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all quantum flows for the current user
   */
  static async getAllQuantumFlows(): Promise<{ success: boolean; data?: QuantumFlow[]; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/flows`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load quantum flows');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to load quantum flows:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Execute a quantum flow
   */
  static async executeQuantumFlow(
    flowId: string, 
    trigger: QuantumExecutionContext['trigger']
  ): Promise<{ success: boolean; data?: QuantumExecutionResult; error?: string }> {
    try {
      const payload = {
        flowId,
        trigger: {
          ...trigger,
          timestamp: trigger.timestamp || new Date()
        }
      };

      const response = await fetch(`${this.BASE_URL}/flows/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to execute quantum flow');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to execute quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a quantum flow
   */
  static async deleteQuantumFlow(flowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/flows/${flowId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete quantum flow');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Toggle quantum flow active status
   */
  static async toggleQuantumFlow(flowId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/flows/${flowId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ isActive })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle quantum flow');
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to toggle quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Generate AI suggestions based on current nodes
   */
  static async generateAISuggestions(nodes: QuantumNode[]): Promise<{ success: boolean; data?: AISuggestion[]; error?: string }> {
    try {
      const payload = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          config: node.config
        })),
        context: {
          nodeCount: nodes.length,
          types: [...new Set(nodes.map(n => n.type))],
          timestamp: new Date()
        }
      };

      const response = await fetch(`${this.BASE_URL}/ai/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate AI suggestions');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Validate quantum flow configuration
   */
  static async validateQuantumFlow(
    nodes: QuantumNode[], 
    connections: QuantumConnection[]
  ): Promise<{ 
    success: boolean; 
    data?: { 
      isValid: boolean; 
      errors: string[]; 
      warnings: string[]; 
      suggestions: string[] 
    }; 
    error?: string 
  }> {
    try {
      const payload = { nodes, connections };

      const response = await fetch(`${this.BASE_URL}/flows/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate quantum flow');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to validate quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get quantum flow statistics
   */
  static async getQuantumFlowStats(flowId: string): Promise<{ 
    success: boolean; 
    data?: {
      executionCount: number;
      lastExecuted: Date | null;
      averageExecutionTime: number;
      successRate: number;
      popularNodes: Array<{ nodeType: string; usage: number }>;
      performanceMetrics: {
        totalExecutions: number;
        totalErrors: number;
        totalOutputs: number;
      };
    }; 
    error?: string 
  }> {
    try {
      const response = await fetch(`${this.BASE_URL}/flows/${flowId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get quantum flow stats');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to get quantum flow stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Export quantum flow as JSON
   */
  static async exportQuantumFlow(flowId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const flowResult = await this.loadQuantumFlow(flowId);
      
      if (!flowResult.success || !flowResult.data) {
        throw new Error('Failed to load flow for export');
      }

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        flow: flowResult.data,
        metadata: {
          nodeCount: flowResult.data.nodes.length,
          connectionCount: flowResult.data.connections.length,
          nodeTypes: [...new Set(flowResult.data.nodes.map(n => n.type))]
        }
      };

      return { 
        success: true, 
        data: JSON.stringify(exportData, null, 2) 
      };
    } catch (error) {
      console.error('Failed to export quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Import quantum flow from JSON
   */
  static async importQuantumFlow(
    jsonData: string, 
    name?: string
  ): Promise<{ success: boolean; data?: QuantumFlow; error?: string }> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.flow || !importData.flow.nodes || !importData.flow.connections) {
        throw new Error('Invalid quantum flow format');
      }

      const flowData = importData.flow;
      const importName = name || `${flowData.name} (Imported)`;

      return await this.saveQuantumFlow(
        importName,
        flowData.description || 'Imported quantum flow',
        flowData.nodes,
        flowData.connections
      );
    } catch (error) {
      console.error('Failed to import quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON format' 
      };
    }
  }

  /**
   * Get real-time execution logs
   */
  static async getExecutionLogs(
    flowId: string, 
    limit: number = 50
  ): Promise<{ 
    success: boolean; 
    data?: Array<{
      id: string;
      timestamp: Date;
      trigger: unknown;
      result: QuantumExecutionResult;
      duration: number;
    }>; 
    error?: string 
  }> {
    try {
      const response = await fetch(`${this.BASE_URL}/flows/${flowId}/logs?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get execution logs');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to get execution logs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Clone a quantum flow
   */
  static async cloneQuantumFlow(
    flowId: string, 
    newName: string
  ): Promise<{ success: boolean; data?: QuantumFlow; error?: string }> {
    try {
      const originalFlow = await this.loadQuantumFlow(flowId);
      
      if (!originalFlow.success || !originalFlow.data) {
        throw new Error('Failed to load original flow');
      }

      // Create new IDs for all nodes to avoid conflicts
      const idMapping: Record<number, number> = {};
      const newNodes = originalFlow.data.nodes.map(node => {
        const newId = Date.now() + Math.random();
        idMapping[node.id] = newId;
        return {
          ...node,
          id: newId,
          label: `${node.label}_clone`
        };
      });

      // Update connection IDs
      const newConnections = originalFlow.data.connections.map(conn => ({
        ...conn,
        id: `${idMapping[conn.from]}-${idMapping[conn.to]}-${Date.now()}`,
        from: idMapping[conn.from],
        to: idMapping[conn.to]
      }));

      return await this.saveQuantumFlow(
        newName,
        `Clone of ${originalFlow.data.name}`,
        newNodes,
        newConnections
      );
    } catch (error) {
      console.error('Failed to clone quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Test quantum flow execution (dry run)
   */
  static async testQuantumFlow(
    nodes: QuantumNode[],
    connections: QuantumConnection[],
    testTrigger: QuantumExecutionContext['trigger']
  ): Promise<{ 
    success: boolean; 
    data?: {
      wouldExecute: boolean;
      executionPath: number[];
      estimatedDuration: number;
      potentialIssues: string[];
    }; 
    error?: string 
  }> {
    try {
      const payload = {
        nodes,
        connections,
        testTrigger,
        dryRun: true
      };

      const response = await fetch(`${this.BASE_URL}/flows/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test quantum flow');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Failed to test quantum flow:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Legacy compatibility with existing bot command system
  static async sendBotCommand<T>(command: string, payload?: unknown): Promise<{ success: boolean; message?: string; data?: T }> {
    try {
      return await sendBotCommand<T>(command, payload);
    } catch (error) {
      console.error('Bot command failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}