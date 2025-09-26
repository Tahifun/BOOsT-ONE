// backend/models/Media.ts
// MongooseSchema für hochgeladene Mediendateien

import { Schema, model, Document } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploader?: string | null; // userId
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploader: { type: String, default: null },
  },
  { timestamps: true },
);

export default model<IMedia>("Media", MediaSchema);


