import logger from './logger.js'

// Redis-Cache mit robustem Fallback auf MemoryCache (wenn URL oder Modul fehlt).
// Minimales Interface, um Typescript-Mismatch zwischen unterschiedlichen redis-* Typen zu vermeiden.

export type Cache = {
  setnx(key: string, ttlSec: number): Promise<boolean>;
};

class MemoryCache implements Cache {
  private seen = new Map<string, number>();
  async setnx(key: string, ttlSec: number): Promise<boolean> {
    const now = Date.now();
    const expireAt = this.seen.get(key);
    if (expireAt && expireAt > now) return false;
    this.seen.set(key, now + ttlSec * 1000);
    return true;
  }
}

/** Minimales Redis-Interface, das wir benötigen. */
interface MinimalRedis {
  set(
    key: string,
    value: string,
    opts: { NX: boolean; EX: number },
  ): Promise<'OK' | null>;
  on?(event: 'error', listener: (err: unknown) => void): void;
  connect?(): Promise<void>;
}

class RedisCache implements Cache {
  constructor(private client: MinimalRedis) {}
  async setnx(key: string, ttlSec: number): Promise<boolean> {
    const result = await this.client.set(key, '1', { NX: true, EX: ttlSec });
    return result === 'OK';
  }
}

let cache: Cache = new MemoryCache();

const url = process.env.REDIS_URL || process.env.REDIS_URI;

// Lazy-Init: Bei Fehlern bleiben wir im MemoryCache.
(async () => {
  if (!url) {
    logger.debug('[redis] No REDIS_URL → using MemoryCache');
    return;
  }
  try {
    // dynamisch laden; ESM/CJS-agnostisch
    const mod = await import('redis');
    // `createClient` Rückgabetyp ist hier egal; wir mappen nur auf unser Minimal-Interface.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const clientAny: unknown = mod.createClient({ url });
    const client: MinimalRedis = clientAny as unknown as MinimalRedis;

    client.on?.('error', (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[redis] client error:', msg);
    });

    await client.connect?.();
    cache = new RedisCache(client);
    logger.debug('[redis] Using RedisCache at', url);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[redis] Redis not available, fallback to MemoryCache:', msg);
    cache = new MemoryCache();
  }
})();

export { cache };
