// backend/models/SpotifyToken.ts
import { Schema, model } from "mongoose";

const SpotifyTokenSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default model("SpotifyToken", SpotifyTokenSchema);


