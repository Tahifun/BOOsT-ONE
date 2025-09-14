import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IOverlay extends Document {
  name: string;
  category: string;
  description?: string;
  fileUrl: string;
  createdBy?: Types.ObjectId | string;
  createdAt?: Date;
  likes?: number;
  downloads?: number;
  tags?: string[];
}

const OverlaySchema = new Schema<IOverlay>({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  fileUrl: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  tags: [String],
});

const Overlay: Model<IOverlay> =
  (mongoose.models.Overlay as Model<IOverlay>) ||
  mongoose.model<IOverlay>("Overlay", OverlaySchema);

export default Overlay;


