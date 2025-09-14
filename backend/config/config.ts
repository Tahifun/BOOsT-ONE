// backend/config/config.ts (NEU - Zentrale Konfiguration)
import dotenv from 'dotenv';
import path from 'path';

// Load environment files in order of priority
const envFiles = [
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.local',
  '.env'
];

envFiles.forEach(file => {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend', file) });
});

// Validate required variables
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'STRIPE_SECRET',
  'SENDGRID_API_KEY'
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

// Export centralized config
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4001', 10),
  
  db: {
    uri: process.env.MONGODB_URI!,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000
    }
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    issuer: process.env.JWT_ISSUER || 'clipboost',
    audience: process.env.JWT_AUDIENCE || 'clipboost-users',
    expiresIn: '7d'
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET!,
    proPriceId: process.env.STRIPE_PRICE_PRO!,
    dayPassPriceId: process.env.STRIPE_PRICE_DAYPASS!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    successUrl: `${process.env.CLIENT_ORIGIN}/billing/success`,
    cancelUrl: `${process.env.CLIENT_ORIGIN}/subscribe`
  },
  
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY!,
    fromEmail: process.env.SENDGRID_FROM || 'noreply@clipboost.com',
    templates: {
      verification: process.env.SENDGRID_TEMPLATE_VERIFICATION,
      welcome: process.env.SENDGRID_TEMPLATE_WELCOME,
      subscription: process.env.SENDGRID_TEMPLATE_SUBSCRIPTION
    }
  },
  
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    local: {
      uploadDir: process.env.UPLOAD_DIR || './uploads',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10) // 100MB
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'eu-central-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  },
  
  clamav: {
    host: process.env.CLAMAV_HOST || 'localhost',
    port: parseInt(process.env.CLAMAV_PORT || '3310', 10)
  },
  
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: `${process.env.BACKEND_URL}/api/oauth/tiktok/callback`
  },
  
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: `${process.env.BACKEND_URL}/api/spotify/oauth/callback`
  }
};

export default config;

