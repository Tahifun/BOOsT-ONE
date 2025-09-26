import mongoose, { Schema, Document } from "mongoose";

export interface IOverlayCategory extends Document {
  name: string;
  icon?: string;
}

const OverlayCategorySchema = new Schema<IOverlayCategory>({
  name: { type: String, required: true, unique: true },
  icon: { type: String }
});

const OverlayCategory = mongoose.model<IOverlayCategory>("OverlayCategory", OverlayCategorySchema);

export default OverlayCategory;


