// backend/models/BotStat.ts
// MongooseSchema f�r BotMetriken (pro StreamSession oder global aggregiert)

import { Schema, model, Document } from "mongoose";

export interface IBotStat extends Document {
  botName: string; // Referenz / Anzeigename des Bots
  sessionId?: string; // optional: StreamSession
  filteredMessages: number;
  autoShoutouts: number;
  activeTimers: number;
  pointsGranted: number;
  createdAt: Date;
  updatedAt: Date;
}

const BotStatSchema = new Schema<IBotStat>(
  {
    botName: { type: String, required: true, index: true },
    sessionId: { type: String, default: null },
    filteredMessages: { type: Number, default: 0 },
    autoShoutouts: { type: Number, default: 0 },
    activeTimers: { type: Number, default: 0 },
    pointsGranted: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default model<IBotStat>("BotStat", BotStatSchema);


