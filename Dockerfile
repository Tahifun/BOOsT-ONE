# =====================================
# CLiP BOOsT Backend Docker Image
# =====================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files from both root and backend
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install ALL dependencies (for building)
RUN npm ci

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY . .

# Build backend TypeScript → JavaScript
RUN cd backend && npx tsc

# --- Stage 3: Runner (Production) ---
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Copy only backend package files
COPY --chown=nodejs:nodejs backend/package*.json ./

# Install ONLY production dependencies for backend
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built backend code
COPY --chown=nodejs:nodejs --from=builder /app/backend/dist ./dist

# Copy any runtime assets (if needed)
# COPY --chown=nodejs:nodejs backend/public ./public
# COPY --chown=nodejs:nodejs backend/templates ./templates

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs /app/quarantine && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment
ENV NODE_ENV=production \
    PORT=4001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

EXPOSE 4001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]