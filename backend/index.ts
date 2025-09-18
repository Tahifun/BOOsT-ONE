// backend/index.ts
import 'dotenv/config';
import express, { type RequestHandler } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// DB + Utils
import './utils/db.js';
import { buildOpenApiSpec } from './openapi.js';
import { initSendgrid } from './utils/sendgrid.js';
import env from './utils/validateEnv.js';
import { ensureSubscriptionIndexes } from './services/subscriptionStateService.js';
import { initSentry } from './sentry.js';

// Early routers (we’ll mount AFTER session)
import mockAuthRoutes from './routes/auth.mock.routes.js';
import sessionRoutes from './routes/session.js';
import featureFlagsRoutes from './routes/featureFlags.js';
import legacyRouter from './routes/legacy.routes.js';

// Routers
import adminRouter from './routes/admin.routes.js';
import billingRouter from './routes/billing.routes.js';
import botRouter from './routes/botRoutes.js';
import devRouter from './routes/dev.routes.js';
import featureFlagsRouter from './routes/featureFlags.routes.js';
import mediaRouter from './routes/media.routes.js';
import overlayRouter from './routes/overlayRoutes.js';
import overlayTemplatesRouter from './routes/overlayTemplates.routes.js';
import quantumRouter from './routes/quantumRoutes.js';
import spotifyRouter from './routes/spotify.routes.js';
import spotifyOAuthRouter from './routes/spotifyOAuth.routes.js';
import statsRouter from './routes/statsRoutes.js';
import stripeWebhookRouter from './routes/stripe.webhook.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import subscriptionCheckoutRouter from './routes/subscriptionCheckout.routes.js';
import subscriptionStatusRouter from './routes/subscriptionStatus.routes.js';
import tiktokLiveRouter from './routes/tiktokLive.routes.js';
import tiktokOAuthRouter from './routes/tiktokOAuth.routes.js';

// Minimal logger
const logger = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// -----------------------------------------------------------------------------

const app = express();
initSentry();

// Port/Host so wählen, dass Deploy-Provider sie setzen kann:
const PORT = Number(process.env.PORT ?? env.PORT ?? 4001);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = env.NODE_ENV === 'production';

// Optional: öffentliche Basis-URL für Logs (in Prod setzen)
const PUBLIC_BASE_URL = process.env.BACKEND_URL ?? `http://localhost:${PORT}`;

function assertTikTokConfig() {
  const req = ['TIKTOK_CLIENT_ID', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_REDIRECT_URI'];
  const missing = req.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('TikTok ENV missing:', missing.join(', '));
  } else {
    console.debug('TikTok ENV OK (IDs sind gesetzt)');
  }
}
assertTikTokConfig();

/* -------------------------- Security & Core Middlewares -------------------------- */

// Trust proxy (ok in dev; notwendig hinter Proxy/CDN)
app.set('trust proxy', 1);

// Helmet (CSP in Dev aus, sonst nervig)
app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
  }),
);

// map session.user -> req.user (Komfort)
app.use((req, _res, next) => {
  const s: unknown = (req as any).session;
  if ((s as any)?.user) {
    (req as any).user = (s as any).user;
  }
  next();
});

// CORS VOR allen Routen, mit Credentials
const rawOrigins = process.env.ALLOWED_ORIGINS ?? (env as any).CLIENT_ORIGIN ?? '';
const allowedOrigins =
  String(rawOrigins)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) || [];

if (!allowedOrigins.length) {
  allowedOrigins.push('http://localhost:5173');
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Cookies (signing mit SECRET)
app.use(cookieParser(env.COOKIE_SECRET));

/* -------------------------- Stripe Webhook (RAW body) --------------------------- */
// Muss VOR express.json() kommen!
app.use(
  '/api/stripe/webhook',
  bodyParser.raw({ type: 'application/json' }) as RequestHandler,
  stripeWebhookRouter,
);

/* -------------------------- Body Parser & Sessions ------------------------------ */

// JSON-Parser
app.use(express.json({ limit: '1mb' }));

// Sessions: immer aktiv (Prod mit MongoStore)
app.use(
  session({
    name: 'clipboost.sid',
    secret: env.COOKIE_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
    store:
      isProduction && env.MONGODB_URI
        ? MongoStore.create({
            mongoUrl: env.MONGODB_URI,
            collectionName: 'sessions',
            ttl: 24 * 60 * 60,
          })
        : undefined,
  }),
);

/* -------------------------- Small conveniences --------------------------------- */

// Optionaler Alias: /api/subscription → /api/subscription/status
app.get('/api/subscription', (_req, res) => {
  res.redirect(308, '/api/subscription/status');
});

// Rate Limiting (global)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: isProduction ? 60 : 120,
  }),
);

// Spezifisches Limit für Auth-Endpoints
app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
  }),
);
app.use(
  '/api/auth/register',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
  }),
);

/* -------------------------- API Routes (nach Session!) -------------------------- */

// Erste einfache APIs
app.use('/api', featureFlagsRoutes);
app.use('/api', sessionRoutes);
app.use('/api', mockAuthRoutes);

// Domain-Router
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);
app.use('/api/bot', botRouter);
if (!isProduction) {
  app.use('/api/dev', devRouter);
}
app.use('/api/feature-flags', featureFlagsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/overlays', overlayRouter);
app.use('/api/overlay/templates', overlayTemplatesRouter);
app.use('/api/quantum', quantumRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/oauth/spotify', spotifyOAuthRouter);
app.use('/api/stats', statsRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/subscription/checkout', subscriptionCheckoutRouter);
app.use('/api/subscription/status', subscriptionStatusRouter);
app.use('/api/tiktok/live', tiktokLiveRouter);
app.use('/api/oauth/tiktok', tiktokOAuthRouter);
app.use('/api', legacyRouter);

/* -------------------------- OpenAPI / Swagger ---------------------------------- */

const openapi = buildOpenApiSpec();
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

/* -------------------------- Health --------------------------------------------- */

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/* -------------------------- 404 & Error Handler -------------------------------- */

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// eslint-friendly (kein ungenutztes _next)
app.use((err: unknown, _req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err);
  const message =
    !isProduction && err && typeof err === 'object' && 'message' in err
      ? (err as Error).message
      : 'Internal Server Error';
  res.status(500).json({ success: false, error: message });
});

/* -------------------------- Startup -------------------------------------------- */

(async () => {
  try {
    await Promise.resolve(ensureSubscriptionIndexes());
    logger.debug('✅ Database indexes ensured');
  } catch (err) {
    console.error('⚠️ Failed to ensure indexes:', err);
    if (isProduction) process.exit(1);
  }

  try {
    await Promise.resolve(initSendgrid());
    logger.debug('✅ SendGrid initialized');
  } catch (err) {
    console.error('⚠️ SendGrid initialization failed:', err);
  }

  app.listen(PORT, HOST, () => {
    logger.debug(`🚀 CLiP BOOsT API running in ${env.NODE_ENV} mode`);
    logger.debug(`📡 API listening on http://${HOST}:${PORT}`);
    if (PUBLIC_BASE_URL) {
      logger.debug(`🌐 Public base URL: ${PUBLIC_BASE_URL}`);
      logger.debug(`📚 Docs: ${PUBLIC_BASE_URL.replace(/\/+$/,'')}/docs`);
    } else {
      logger.debug(`📚 Docs: http://${HOST}:${PORT}/docs`);
    }
    logger.debug(`💳 Stripe Webhook: POST /api/stripe/webhook`);
  });
})();
