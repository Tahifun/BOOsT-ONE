// backend/models/ConsentLog.ts
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ConsentLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["PRO_MONTHL, "DAY_PASS"], required: true },
  consent: { type: Boolean, required: true },
  consentText: { type: String, required: true },
  consentVersion: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export type ConsentLog = InferSchemaType<typeof ConsentLogSchema>;
const ConsentLogModel: Model<ConsentLog> = mongoose.models.ConsentLog || mongoose.model<ConsentLog>("ConsentLog", ConsentLogSchema);
export default ConsentLogModel;


