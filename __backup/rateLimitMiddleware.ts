import { logger } from '@/lib/logger';
﻿// Express Rate Limit v7 â€“ kein onLimitReached im Options-Objekt.
// Optionaler Redis-Store via dynamischem Import; Fallback: Memory.

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import type { Request, Response } from 'express';

// -------------------- Redis optional --------------------
let redisClient: unknown = null;
let redisInitStarted = false;

async function initRedisClient() {
  if (redisInitStarted || redisClient) return;
  redisInitStarted = true;

  const url = process.env.REDIS_URL;
  if (!url) return;

  try {
    const mod = await import('redis'); // nur wenn vorhanden
    const createClient = (mod as any).createClient as (opts: { url: string }) => any;
    redisClient = createClient({ url });
    await redisClient.connect();
    logger.debug('[rateLimit] Redis connected');
  } catch (err: unknown) {
    console.warn('[rateLimit] Redis not available, using memory store:', err?.message || err);
    redisClient = null;
  }
}
void initRedisClient();

// --------------------------- Typen / Optionen ---------------------------
export interface RateLimitOptions {
  windowMs: number;
  limit: number;
  message?: string | Record<string, unknown>;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  /** Emulation von onLimitReached per custom handler */
  onLimitReached?: (req: Request, res: Response) => void;
  /** Eigener Handler Ã¼berschreibt Emulation */
  handler?: (request: unknown, response: unknown, next: unknown, options: unknown) => void;
  standardHeaders?: boolean | 'draft-6' | 'draft-7' | 'combined';
  legacyHeaders?: boolean;
}

// ----------------------------- Redis Store -----------------------------
class RedisStore {
  private client: unknown;
  private windowMs: number;
  private prefix: string;

  constructor(client: unknown, windowMs: number, prefix = 'rl:') {
    this.client = client;
    this.windowMs = windowMs;
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; timeToExpire: number }> {
    const redisKey = this.prefix + key;
    try {
      const pipeline = this.client.multi();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, Math.ceil(this.windowMs / 1000));
      const results = await pipeline.exec();
      const totalHits = results?.[0]?.[1] ?? 1;
      const timeToExpire = this.windowMs;
      return { totalHits, timeToExpire };
    } catch (error) {
      console.error('[rateLimit] Redis increment error:', error);
      return { totalHits: 0, timeToExpire: this.windowMs };
    }
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    try {
      await this.client.decr(redisKey);
    } catch (error) {
      console.error('[rateLimit] Redis decrement error:', error);
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    try {
      await this.client.del(redisKey);
    } catch (error) {
      console.error('[rateLimit] Redis resetKey error:', error);
    }
  }
}

// ----------------------------- Factory -----------------------------
export const rateLimitMiddleware = (options: RateLimitOptions): RateLimitRequestHandler => {
  const cfg: unknown = {
    windowMs: options.windowMs,
    limit: options.limit,
    message: options.message ?? {
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000),
      limit: options.limit,
      resetTime: new Date(Date.now() + options.windowMs).toISOString()
    },
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: options.keyGenerator || ((req: unknown) => (req.user?.id || req.ip || 'anonymous')),
    skip: options.skip || (() => false),
    store: redisClient ? new (RedisStore as any)(redisClient, options.windowMs) : undefined
  };

  if (options.handler) {
    cfg.handler = options.handler;
  } else if (typeof options.onLimitReached === 'function') {
    cfg.handler = (request: unknown, response: unknown, _next: unknown, rlOptions: unknown) => {
      // Emulation von "onLimitReached": beim ersten Block
      try {
        const current = request.rateLimit?.current ?? 0;
        const limit = request.rateLimit?.limit ?? 0;
        if (current === limit + 1) options.onLimitReached!(request, response);
      } catch { /* ignore */ }
      response.status(rlOptions.statusCode).send(rlOptions.message);
    };
  }

  return rateLimit(cfg);
};

// ----------------------- Vorgefertigte Limiter -----------------------
export const RateLimits = {
  general: rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: 'Too many requests from this IP, please try again later.'
  }),

  strict: rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: 'Rate limit exceeded for sensitive operations.'
  }),

  auth: rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true
  }),

  quantumExecution: rateLimitMiddleware({
    windowMs: 60 * 1000,
    limit: 10,
    message: 'Quantum flow execution rate limit exceeded. Please wait before triggering more flows.',
    keyGenerator: (req: unknown) => `quantum_exec:${req.user?.id || req.ip}`
  }),

  ai: rateLimitMiddleware({
    windowMs: 5 * 60 * 1000,
    limit: 20,
    message: 'AI feature rate limit exceeded. Please wait before making more AI requests.',
    keyGenerator: (req: unknown) => `ai:${req.user?.id || req.ip}`
  }),

  flowCreation: rateLimitMiddleware({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message: 'Flow creation rate limit exceeded. Please wait before creating more flows.',
    keyGenerator: (req: unknown) => `flow_create:${req.user?.id || req.ip}`
  }),

  upload: rateLimitMiddleware({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: 'Upload rate limit exceeded. Please wait before uploading more files.'
  }),

  search: rateLimitMiddleware({
    windowMs: 60 * 1000,
    limit: 30,
    message: 'Search rate limit exceeded. Please wait before searching again.'
  })
};

// ----------------------- Tier-basierte Limiter -----------------------
export const createTierBasedRateLimit = (base: {
  windowMs: number;
  freeMax: number;
  proMax: number;
  enterpriseMax: number;
  message?: string;
}) => {
  return rateLimitMiddleware({
    windowMs: base.windowMs,
    limit: base.freeMax, // Default (free) â€“ Upgrade-Handling kann spÃ¤ter dynamisch werden
    message: base.message,
    keyGenerator: (req: unknown) => {
      const tier = req.user?.tier || req.user?.subscriptionTier || 'free';
      return `${tier}:${req.user?.id || req.ip}`;
    }
  });
};

export const QuantumRateLimits = {
  execution: createTierBasedRateLimit({
    windowMs: 60 * 1000,
    freeMax: 5,
    proMax: 20,
    enterpriseMax: 100,
    message: 'Quantum execution rate limit exceeded for your subscription tier.'
  }),

  aiSuggestions: createTierBasedRateLimit({
    windowMs: 5 * 60 * 1000,
    freeMax: 5,
    proMax: 50,
    enterpriseMax: 200,
    message: 'AI suggestions rate limit exceeded for your subscription tier.'
  }),

  flowOperations: createTierBasedRateLimit({
    windowMs: 15 * 60 * 1000,
    freeMax: 20,
    proMax: 100,
    enterpriseMax: 500,
    message: 'Flow operations rate limit exceeded for your subscription tier.'
  })
};

// ----------------------- Health & Shutdown -----------------------
export async function rateLimitHealthCheck() {
  const health = {
    status: 'healthy' as 'healthy' | 'degraded',
    redis: false,
    timestamp: new Date().toISOString()
  };
  if (redisClient) {
    try { await redisClient.ping(); health.redis = true; }
    catch { health.status = 'degraded'; health.redis = false; }
  }
  return health;
}

export async function cleanupRateLimiting() {
  if (redisClient) {
    try { await redisClient.quit(); logger.debug('[rateLimit] Redis disconnected'); }
    catch (error) { console.error('[rateLimit] Redis disconnect error:', error); }
  }
}
process.on('SIGTERM', () => void cleanupRateLimiting());
process.on('SIGINT', () => void cleanupRateLimiting());


