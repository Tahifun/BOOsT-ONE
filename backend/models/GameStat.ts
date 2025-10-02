// backend/models/GameStat.ts
// MongooseSchema fr GameStatistiken (Leaderboard & UserStats)

import { Schema, model, Document } from "mongoose";

export interface IGameStat extends Document {
  game: string; // Name oder ID des Games
  userId: string; // Twitch/UserID
  username: string; // Anzeigename  fr schnellere LeaderboardAnzeigen gecached
  wins: number;
  played: number;
  elo: number; // Elohnliche RatingZahl (optional)
  createdAt: Date;
  updatedAt: Date;
}

const GameStatSchema = new Schema<IGameStat>(
  {
    game: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    wins: { type: Number, default: 0 },
    played: { type: Number, default: 0 },
    elo: { type: Number, default: 1000 },
  },
  { timestamps: true },
);

// Ein userId sollte pro Game nur einmal vorkommen
GameStatSchema.index({ game: 1, userId: 1 }, { unique: true });

export default model<IGameStat>("GameStat", GameStatSchema);


