// backend/utils/validateEnv.ts
import dotenv from "dotenv";
import path from "path";
import { envSchema } from "../config/envSchema.js";

// Load .env files in priority order
const envFiles = [
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.local',
  '.env'
];

// Load all env files (later files don't override earlier)
envFiles.forEach(file => {
  dotenv.config({ 
    path: path.resolve(process.cwd(), 'backend', file) 
  });
});

// Parse and validate
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("âŒ Environment validation failed:");
  console.error(parsed.error.format());
  
  // In Production: Fatal error
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
  
  // In Development: Warning but continue with defaults
  console.warn("âš ï¸ Continuing with default values in development mode");
}

const env = parsed.success ? parsed.data : envSchema.parse({});

// Additional Production checks
if (env.NODE_ENV === "production") {
  const criticalVars = [
    'JWT_SECRET',
    'COOKIE_SECRET', 
    'STRIPE_SECRET',
    'STRIPE_WEBHOOK_SECRET',
    'CLIENT_ORIGIN'
  ];
  
  const missing = criticalVars.filter(key => !env[key as keyof typeof env]);
  if (missing.length > 0) {
    console.error(`âŒ FATAL: Missing critical production variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Security checks
  if (env.JWT_SECRET.length < 32) {
    console.error("âŒ FATAL: JWT_SECRET must be at least 32 characters in production");
    process.exit(1);
  }
  
  if (env.COOKIE_SECRET.length < 32) {
    console.error("âŒ FATAL: COOKIE_SECRET must be at least 32 characters in production");
    process.exit(1);
  }
}

export default env;

