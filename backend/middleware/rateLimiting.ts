// middleware/rateLimiting.ts
import rateLimit from "express-rate-limit";

export const RateLimits = {
  general: rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  upload: rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

export default RateLimits;
