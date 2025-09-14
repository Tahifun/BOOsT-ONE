// backend/models/GameStat.ts
// Mongooseâ€‘Schema fÃ¼r Gameâ€‘Statistiken (Leaderboard & Userâ€‘Stats)

import { Schema, model, Document } from "mongoose";

export interface IGameStat extends Document {
  game: string; // Name oder ID des Games
  userId: string; // Twitchâ€‘/Userâ€‘ID
  username: string; // Anzeigename â€“ fÃ¼r schnellere Leaderboardâ€‘Anzeigen gecached
  wins: number;
  played: number;
  elo: number; // Eloâ€‘Ã¤hnliche Ratingâ€‘Zahl (optional)
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


