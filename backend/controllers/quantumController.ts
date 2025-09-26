import { Response } from "express";
import mongoose from 'mongoose';
import { QuantumFlow, IQuantumFlow } from '../models/QuantumFlow.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { twitchBotService } from '../services/twitchBotService.js';

function validateStructure(nodes: IQuantumFlow['nodes'], connections: IQuantumFlow['connections']) {
  const errors: string[] = [];
  const ids = new Set(nodes.map(n => n.id));
  for (const c of connections) {
    if (!ids.has(c.from) || !ids.has(c.to)) errors.push(`Invalid connection ${c.id}: missing node(s)`);
  }
  return { ok: errors.length === 0, errors };
}

export const quantumController = {
  async createQuantumFlow(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ success: false, error: 'Authentication required' });
      const { name, description = '', nodes = [], connections = [] } = req.body || {};
      if (!name) return res.status(400).json({ success: false, error: 'name required' });

      const { ok, errors } = validateStructure(nodes, connections);
      if (!ok) return res.status(400).json({ success: false, error: 'Invalid structure', details: errors });

      const doc = await QuantumFlow.create({
        userId: new mongoose.Types.ObjectId(req.user.id),
        name, description, nodes, connections, isActive: false, executionCount: 0
      });
      return res.json({ success: true, data: doc });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  },

  async listQuantumFlows(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ success: false, error: 'Authentication required' });
      const docs = await QuantumFlow.find({ userId: req.user.id }).sort({ updatedAt: -1 });
      return res.json({ success: true, data: docs });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  },

  async getQuantumFlow(_req: AuthenticatedRequest, res: Response) {
    try {
      const doc = await QuantumFlow.findById(_req.params.flowId);
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, data: doc });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  },

  async updateQuantumFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, nodes, connections } = req.body || {};
      const update: Partial<IQuantumFlow> = {};
      if (name !== undefined) (update as any).name = name;
      if (description !== undefined) (update as any).description = description;
      if (nodes) (update as any).nodes = nodes;
      if (connections) (update as any).connections = connections;

      if (nodes || connections) {
        const { ok, errors } = validateStructure(nodes ?? [], connections ?? []);
        if (!ok) return res.status(400).json({ success: false, error: 'Invalid structure', details: errors });
      }

      const doc = await QuantumFlow.findByIdAndUpdate(req.params.flowId, update, { new: true });
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, data: doc });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  },

  async deleteQuantumFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const doc = await QuantumFlow.findByIdAndDelete(req.params.flowId);
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true, data: { deleted: true } });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  },

  async toggleQuantumFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const { enable } = req.body as { enable: boolean };
      const doc = await QuantumFlow.findById(req.params.flowId);
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' });
      doc.isActive = !!enable;
      await doc.save();

      if (doc.isActive) await twitchBotService.activateQuantumFlow(doc as any);
      else await twitchBotService.deactivateQuantumFlow(String(doc._id));

      return res.json({ success: true, data: { isActive: doc.isActive } });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  },

  async executeQuantumFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const { flowId, context = {} } = req.body || {};
      const doc = await QuantumFlow.findById(flowId);
      if (!doc) return res.status(404).json({ success: false, error: 'Not found' });

      const result = await twitchBotService.execute('quantum_flow_trigger_manual', { flowId: String(doc._id), context });
      doc.executionCount = (doc.executionCount ?? 0) + 1;
      doc.lastExecuted = new Date();
      await doc.save();

      return res.json({ success: true, data: { result } });
    } catch (e: unknown) { return res.status(500).json({ success: false, error: e.message }); }
  }
};


