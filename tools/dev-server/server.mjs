import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { buildOpenApiSpec } from './openapi.mjs';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.mjs';

const app = express();
const PORT = process.env.PORT || 4001;

// --- Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Health (204)
const noContent = (req, res) => res.status(204).end();
app.get('/health', noContent);
app.get('/api/health', noContent);

// --- Beispiel "Session" (JSON 200, damit man was sieht)
app.get('/session', (req, res) => res.json({ ok: true, user: null }));
app.get('/api/session', (req, res) => res.json({ ok: true, user: null }));

// --- API Router unter /api
const api = express.Router();
api.use(authRoutes);
app.use('/api', api);

// --- OpenAPI Spec + Swagger UI
const openapi = buildOpenApiSpec();

// 1) JSON-Spec an zwei Pfaden
app.get('/swagger.json', (req, res) => res.json(openapi));
app.get('/api/swagger.json', (req, res) => res.json(openapi));

// 2) UI an zwei Pfaden (Root + /api)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { explorer: true }));

// --- 404-Handler (sauberer Body statt "Cannot GET ...")
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    hint: 'Sieh /docs oder /api/docs für dokumentierte Routen.'
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`Docs: /docs and /api/docs`);
});
