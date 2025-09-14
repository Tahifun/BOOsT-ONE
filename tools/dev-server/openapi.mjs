// Minimaler OpenAPI-Generator via swagger-jsdoc
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import swaggerJSDoc from 'swagger-jsdoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basis-Metadaten
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'TikTok Livestream Companion API',
    version: '0.1.0',
    description: 'OpenAPI-Dokumentation für das Backend (Express, ESM).'
  },
  servers: [
    { url: 'http://localhost:4001', description: 'Local' },
    { url: 'http://localhost:4001/api', description: 'Local /api Prefix' }
  ]
};

// JSDoc-Kommentare einsammeln (du kannst später deine Route-Files ergänzen)
const apis = [
  path.join(__dirname, 'routes/*.mjs'),
  path.join(__dirname, 'server.mjs') // health/session Beispiele
];

export function buildOpenApiSpec() {
  return swaggerJSDoc({
    definition: swaggerDefinition,
    apis
  });
}
