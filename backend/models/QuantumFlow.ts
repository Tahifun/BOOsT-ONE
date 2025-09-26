// backend/models/QuantumFlow.ts
import mongoose, { Schema, type Document, type Model } from "mongoose";

export type NodeType =
  | "neural_trigger"
  | "plasma_condition"
  | "cosmic_action"
  | "ai_consciousness"
  | "quantum_integration"
  | "holographic_display";

export interface IQuantumNode {
  id: number;
  type: NodeType;
  x: number;
  y: number;
  label: string;
  config: Record<string, any>;
}

export interface IQuantumConnection {
  id: string;
  from: number;
  to: number;
  type: "neural" | "quantum" | "plasma";
  strength: number; // 0..100
}

export interface IQuantumFlow extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  nodes: IQuantumNode[];
  connections: IQuantumConnection[];
  isActive: boolean;
  executionCount?: number;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuantumNodeSchema = new Schema<IQuantumNode>(
  {
    id: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "neural_trigger",
        "plasma_condition",
        "cosmic_action",
        "ai_consciousness",
        "quantum_integration",
        "holographic_display",
      ],
      required: true,
    },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    label: { type: String, default: "" },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const QuantumConnectionSchema = new Schema<IQuantumConnection>(
  {
    id: { type: String, required: true },
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    type: { type: String, enum: ["neural", "quantum", "plasma"], default: "neural" },
    strength: { type: Number, default: 100 },
  },
  { _id: false }
);

const QuantumFlowSchema = new Schema<IQuantumFlow>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    nodes: { type: [QuantumNodeSchema], default: [] },
    connections: { type: [QuantumConnectionSchema], default: [] },
    isActive: { type: Boolean, default: false, index: true },
    executionCount: { type: Number, default: 0 },
    lastExecuted: { type: Date },
  },
  { timestamps: true, collection: "quantum_flows" }
);

export const QuantumFlow: Model<IQuantumFlow> =
  (mongoose.models.QuantumFlow as Model<IQuantumFlow>) ||
  mongoose.model<IQuantumFlow>("QuantumFlow", QuantumFlowSchema);

export default QuantumFlow;


