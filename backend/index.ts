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

// Early routers
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

const app = express();
app.get('/_whoami', (_req, res) => res.json({ entry: 'index.ts', ok: true }));

initSentry();

const PORT = Number(process.env.PORT ?? env.PORT ?? 4001);
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = env.NODE_ENV === 'production';
const PUBLIC_BASE_URL = process.env.BACKEND_URL ?? `http://localhost:${PORT}`;

// Proxy
app.set('trust proxy', 1);

// Helmet
app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

// CORS
const list = (v?: string) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
const allowed = new Set([
  'https://clip-boost.online',
  'https://www.clip-boost.online',
  ...list(process.env.ALLOWED_ORIGINS),
]);
const vercelRegex = /^https:\/\/.*\.vercel\.app$/;
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowed.has(origin) || vercelRegex.test(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// Logging + cookies
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(cookieParser(env.COOKIE_SECRET));

// Stripe webhook (raw) vor json
app.use('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }) as RequestHandler, stripeWebhookRouter);

// JSON
app.use(express.json({ limit: '1mb' }));

// Sessions
app.use(session({
  name: 'clipboost.sid',
  secret: env.COOKIE_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
  store: isProduction && env.MONGODB_URI
    ? MongoStore.create({ mongoUrl: env.MONGODB_URI, collectionName: 'sessions', ttl: 24 * 60 * 60 })
    : undefined,
}));

// Convenience
app.get('/api/subscription', (_req, res) => res.redirect(308, '/api/subscription/status'));

// Rate limits
app.use(rateLimit({ windowMs: 60_000, max: isProduction ? 60 : 120 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true }));
app.use('/api/auth/register', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, skipSuccessfulRequests: true }));

// Early APIs
app.use('/api', featureFlagsRoutes);
app.use('/api', sessionRoutes);
app.use('/api', mockAuthRoutes);

// Domain routers
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);
app.use('/api/bot', botRouter);
if (!isProduction) app.use('/api/dev', devRouter);
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

// >>> WICHTIG: TikTok OAuth korrekt mounten <<<
app.use('/api/oauth/tiktok', tiktokOAuthRouter);

app.use('/api', legacyRouter);

// Docs
const openapi = buildOpenApiSpec();
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

// Health
app.get('/health', (_req, res) => res.json({ status: 'healthy', ts: new Date().toISOString(), env: env.NODE_ENV }));

// 404 + error
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not Found' }));
app.use((err: unknown, _req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err);
  const msg = !isProduction && err && typeof err === 'object' && 'message' in err
    ? (err as Error).message : 'Internal Server Error';
  res.status(500).json({ success: false, error: msg });
});

// Startup
(async () => {
  try { await Promise.resolve(ensureSubscriptionIndexes()); } catch (e) { console.error(e); if (isProduction) process.exit(1); }
  try { await Promise.resolve(initSendgrid()); } catch (e) { console.error(e); }
  app.listen(PORT, HOST, () => {
    console.debug(`API ${env.NODE_ENV} http://${HOST}:${PORT}`);
    console.debug(`Public: ${PUBLIC_BASE_URL}`);
  });
})();
