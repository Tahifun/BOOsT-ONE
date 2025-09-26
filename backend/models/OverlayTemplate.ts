import mongoose, { Schema, model, type Model, type InferSchemaType } from "mongoose";

const OverlayTemplateSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Wichtig: Arrays in Mongoose 8 typisiert als [Schema.Types.*]
    widgets: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, collection: "overlay_templates" }
);

export type IOverlayTemplate = InferSchemaType<typeof OverlayTemplateSchema>;

const OverlayTemplate: Model<IOverlayTemplate> =
  (mongoose.models.OverlayTemplate as Model<IOverlayTemplate>) ||
  model<IOverlayTemplate>("OverlayTemplate", OverlayTemplateSchema);

export default OverlayTemplate;


