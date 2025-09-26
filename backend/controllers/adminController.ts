// controllers/adminController.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import redisLiveHub from "../services/redisLiveHub.js";
import stripe from "../utils/stripeClient.js";

export const getMetrics = async (_req: Request, res: Response) => {
  const mongoOk = mongoose.connection.readyState === 1;

  const redisStatus = typeof (redisLiveHub as any)?.getStatus === "function"
    ? (redisLiveHub as any).getStatus()
    : ((redisLiveHub as any)?.status ?? { connected: false });

  const redisOk = !!redisStatus?.connected;
  const stripeOk = !!(stripe as any)?._apiKey;

  return res.json({
    ok: mongoOk && redisOk,
    mongodb: mongoOk,
    redis: redisOk,
    stripe: stripeOk,
    timestamp: new Date().toISOString(),
  });
};
