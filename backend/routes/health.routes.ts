// routes/health.routes.ts
import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import redisLiveHub from "../services/redisLiveHub.js";
import { config } from "../config/config.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

router.get("/ready", async (_req: Request, res: Response) => {
  const checks = { mongodb: false, redis: false, stripe: false, sendgrid: false };
  try {
    checks.mongodb = mongoose.connection.readyState === 1;

    const redisStatus = typeof (redisLiveHub as any)?.getStatus === "function"
      ? (redisLiveHub as any).getStatus()
      : ((redisLiveHub as any)?.status ?? { connected: false });
    checks.redis = !!redisStatus?.connected;

    if (config.stripe.secretKey) checks.stripe = true;
    if (config.sendgrid.apiKey) checks.sendgrid = true;

    const allHealthy = Object.values(checks).every(Boolean);
    res.status(allHealthy ? 200 : 503).json({ status: allHealthy ? "ready" : "not ready", checks, timestamp: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ status: "error", checks, error: message, timestamp: new Date().toISOString() });
  }
});

router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const redisStatus = typeof (redisLiveHub as any)?.getStatus === "function"
      ? (redisLiveHub as any).getStatus()
      : ((redisLiveHub as any)?.status ?? { connected: false });

    const metrics = {
      process: { memory: process.memoryUsage(), cpu: process.cpuUsage(), uptime: process.uptime() },
      mongodb: {
        connected: mongoose.connection.readyState === 1,
        host: (mongoose.connection as any).host,
        name: mongoose.connection.name,
      },
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };

    res.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: "Failed to collect metrics", message });
  }
});

export default router;
