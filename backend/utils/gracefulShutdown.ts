import logger from './logger.js'
import { Server } from "http";
import mongoose from "mongoose";
import { createClient } from "redis";

export function setupGracefulShutdown(
  server: Server,
  redisClient?: ReturnType<typeof createClient>
) {
  let isShuttingDown = false;

  const closeServer = () =>
    new Promise<void>((resolve) => {
      server.close(() => {
        logger.debug("[shutdown] HTTP server closed");
        resolve();
      });
    });

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.debug(`\n[shutdown] ${signal} received ? starting graceful shutdown...`);

    // Hard timeout als Netz: 30s
    const hardTimeout = setTimeout(() => {
      console.error("[shutdown] Forced exit after 30s timeout");
      process.exit(1);
    }, 30_000);

    try {
      // 1) HTTP beenden (nimmt keine neuen Verbindungen mehr an)
      await closeServer();

      // 2) Mongo schlieï¿½en (nur wenn verbunden)
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
          logger.debug("[shutdown] MongoDB disconnected");
        }
      } catch (e) {
        console.error("[shutdown] MongoDB disconnect error", e);
      }

      // 3) Redis schlieï¿½en (mit Fallback bei Hï¿½ngern)
      if (redisClient) {
        try {
          if ((redisClient as any).isOpen || (redisClient as any).isReady) {
            await Promise.race([
              redisClient.quit(),
              new Promise((_, rej) => setTimeout(() => rej(new Error("redis quit timeout")), 2000))
            ]);
            logger.debug("[shutdown] Redis quit");
          }
        } catch (e) {
          console.error("[shutdown] Redis quit error", e);
          try {
            // harter Fallback
            (redisClient as any).disconnect?.();
          } catch {}
        }
      }

      clearTimeout(hardTimeout);
      logger.debug("[shutdown] Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("[shutdown] Error during shutdown:", error);
      clearTimeout(hardTimeout);
      process.exit(1);
    }
  };

  // Signale
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Uncaught Exceptions ? in Prod sauber beenden
  process.on("uncaughtException", (error) => {
    console.error("[uncaughtException]", error);
    if (process.env.NODE_ENV === "production") shutdown("UNCAUGHT_EXCEPTION");
  });

  // Unhandled Rejections ? in Prod sauber beenden
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[unhandledRejection] at:", promise, "reason:", reason);
    if (process.env.NODE_ENV === "production") shutdown("UNHANDLED_REJECTION");
  });
}

