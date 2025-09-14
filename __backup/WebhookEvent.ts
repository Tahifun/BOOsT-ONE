// backend/models/WebhookEvent.ts
import mongoose, { Schema, type Model } from "mongoose";

export interface IWebhookEvent {
  eventId: string;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: () => new Date() },
});

// Reuse existing model in watch/dev to avoid OverwriteModelError
const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);

export default WebhookEvent;


